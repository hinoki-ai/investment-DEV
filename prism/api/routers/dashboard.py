"""
===============================================================================
DASHBOARD ROUTER - Statistics and overview endpoints
===============================================================================
"""
from decimal import Decimal
from typing import Dict, Optional
import asyncio

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
import httpx

from routers._imports import db_models, schemas, get_async_db
from middleware import cache_response, invalidate_dashboard_cache


router = APIRouter()


# =============================================================================
# MARKET DATA HELPERS
# =============================================================================

import yfinance as yf


def _yf_fetch_prices(symbols: list[str]) -> dict[str, Optional[dict]]:
    """
    Synchronous helper — fetch price info via yfinance for a list of symbols.
    Returns {symbol: {"regularMarketPrice": ..., "chartPreviousClose": ...} | None}.
    """
    results: dict[str, Optional[dict]] = {s: None for s in symbols}
    try:
        tickers = yf.Tickers(" ".join(symbols))
        for sym in symbols:
            try:
                info = tickers.tickers[sym].fast_info
                price = getattr(info, "last_price", None)
                prev = getattr(info, "previous_close", None)
                if price is not None:
                    results[sym] = {
                        "regularMarketPrice": float(price),
                        "chartPreviousClose": float(prev) if prev else None,
                    }
            except Exception as exc:
                print(f"[yfinance] Error for {sym}: {exc}")
    except Exception as exc:
        print(f"[yfinance] Batch error: {exc}")
    return results


async def _fetch_yahoo_data(symbols: list[str]) -> dict[str, Optional[dict]]:
    """
    Fetch Yahoo Finance data — uses yfinance (run in thread) as primary,
    falls back to raw httpx if yfinance fails.
    """
    # Primary: yfinance (handles cookies/auth internally)
    try:
        result = await asyncio.to_thread(_yf_fetch_prices, symbols)
        # Check if we got at least some data
        if any(v is not None for v in result.values()):
            return result
    except Exception as exc:
        print(f"[Yahoo] yfinance failed: {exc}")

    # Fallback: raw httpx with session cookies
    print("[Yahoo] Falling back to httpx...")
    _UA = (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/125.0.0.0 Safari/537.36"
    )
    results: dict[str, Optional[dict]] = {s: None for s in symbols}
    try:
        async with httpx.AsyncClient(
            timeout=12.0, follow_redirects=True, headers={"User-Agent": _UA}
        ) as client:
            try:
                await client.get("https://fc.yahoo.com")
            except httpx.HTTPError:
                pass

            async def _fetch_one(sym: str) -> tuple[str, Optional[dict]]:
                try:
                    from urllib.parse import quote
                    encoded = quote(sym, safe="")
                    url = f"https://query2.finance.yahoo.com/v8/finance/chart/{encoded}?interval=1d&range=2d"
                    resp = await client.get(url)
                    if resp.status_code == 200:
                        data = resp.json()
                        meta = data.get("chart", {}).get("result", [{}])[0].get("meta", {})
                        return sym, meta if meta else None
                except Exception as exc:
                    print(f"[Yahoo httpx] Error {sym}: {exc}")
                return sym, None

            fetched = await asyncio.gather(*[_fetch_one(s) for s in symbols])
            for sym, meta in fetched:
                results[sym] = meta
    except Exception as exc:
        print(f"[Yahoo httpx] Session error: {exc}")
    return results


def _price_from_meta(meta: Optional[dict]) -> Optional[float]:
    """Extract regularMarketPrice from a meta dict."""
    if meta:
        p = meta.get("regularMarketPrice")
        return float(p) if p else None
    return None


async def fetch_usd_clp_rate() -> Optional[float]:
    """Fetch USD/CLP rate from Mindicador."""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get("https://mindicador.cl/api/dolar")
            if response.status_code == 200:
                data = response.json()
                serie = data.get("serie", [])
                if serie:
                    return float(serie[0].get("valor", 0))
    except Exception:
        pass
    return None


@router.get("/market-data")
@cache_response(expire_seconds=300)  # Cache market data for 5 minutes
async def get_market_data():
    """
    Get current market data: metals, indices, commodities.
    
    Fetches from Yahoo Finance via server-side proxy (avoids CORS issues).
    Uses a single session with cookies so Yahoo doesn't block us.
    """
    # 1) Fetch USD/CLP rate and all Yahoo symbols in parallel
    yahoo_symbols = ["GC=F", "SI=F", "^IXIC", "CL=F", "HG=F", "ALB"]
    
    usd_rate, yahoo_data = await asyncio.gather(
        fetch_usd_clp_rate(),
        _fetch_yahoo_data(yahoo_symbols),
        return_exceptions=True,
    )
    
    if isinstance(usd_rate, Exception):
        usd_rate = None
    if isinstance(yahoo_data, Exception):
        yahoo_data = {s: None for s in yahoo_symbols}
    
    # 2) Extract prices
    gold_usd_oz   = _price_from_meta(yahoo_data.get("GC=F"))
    silver_usd_oz = _price_from_meta(yahoo_data.get("SI=F"))
    oil_usd       = _price_from_meta(yahoo_data.get("CL=F"))
    nasdaq_meta   = yahoo_data.get("^IXIC")
    copper_usd_lb = _price_from_meta(yahoo_data.get("HG=F"))
    lithium_usd   = _price_from_meta(yahoo_data.get("ALB"))
    
    # 3) Convert metals to CLP per gram (1 troy ounce = 31.1034768 grams)
    grams_per_ounce = 31.1034768
    gold_clp_per_gram = None
    silver_clp_per_gram = None
    
    if usd_rate and gold_usd_oz:
        gold_clp_per_gram = (gold_usd_oz * usd_rate) / grams_per_ounce
    if usd_rate and silver_usd_oz:
        silver_clp_per_gram = (silver_usd_oz * usd_rate) / grams_per_ounce
    
    # 4) NASDAQ — need meta for change %
    nasdaq_price = None
    nasdaq_change_pct = None
    if isinstance(nasdaq_meta, dict):
        nasdaq_price = nasdaq_meta.get("regularMarketPrice")
        prev = nasdaq_meta.get("chartPreviousClose") or nasdaq_meta.get("previousClose")
        if nasdaq_price and prev:
            nasdaq_change_pct = round(((nasdaq_price - prev) / prev) * 100, 2)
    
    # 5) Copper kg conversion (1 lb = 0.453592 kg)
    copper_usd_kg = None
    if copper_usd_lb:
        copper_usd_kg = round(copper_usd_lb / 0.453592, 2)
    
    return {
        "usd_clp_rate": usd_rate,
        "gold_clp_per_gram": round(gold_clp_per_gram, 2) if gold_clp_per_gram else None,
        "silver_clp_per_gram": round(silver_clp_per_gram, 2) if silver_clp_per_gram else None,
        "gold_usd_per_oz": gold_usd_oz,
        "silver_usd_per_oz": silver_usd_oz,
        "nasdaq_price": nasdaq_price,
        "nasdaq_change_pct": nasdaq_change_pct,
        "oil_usd_bbl": oil_usd,
        "copper_usd_lb": copper_usd_lb,
        "copper_usd_kg": copper_usd_kg,
        "lithium_proxy_usd": lithium_usd,
    }


@router.get("/stats", response_model=dict)
@cache_response(expire_seconds=60)
async def get_dashboard_stats(
    db: AsyncSession = Depends(get_async_db)
):
    """Get dashboard statistics."""
    
    # Total investments
    result = await db.execute(select(func.count(db_models.Investment.id)))
    total_investments = result.scalar()
    
    # Total value
    result = await db.execute(
        select(func.coalesce(func.sum(db_models.Investment.current_value), Decimal(0)))
    )
    total_value = result.scalar()
    
    # Total invested (purchase price)
    result = await db.execute(
        select(func.coalesce(func.sum(db_models.Investment.purchase_price), Decimal(0)))
    )
    total_invested = result.scalar()
    
    # Calculate total return
    total_return = total_value - total_invested if total_invested else Decimal(0)
    total_return_pct = ((total_value - total_invested) / total_invested * 100) if total_invested > 0 else Decimal(0)
    
    # Total files
    result = await db.execute(select(func.count(db_models.FileRegistry.id)))
    total_files = result.scalar()
    
    # Pending analyses
    result = await db.execute(
        select(func.count(db_models.ProcessingJob.id))
        .where(db_models.ProcessingJob.status.in_([db_models.JobStatus.QUEUED, db_models.JobStatus.RUNNING]))
    )
    pending_analyses = result.scalar()
    
    # Completed analyses
    result = await db.execute(
        select(func.count(db_models.ProcessingJob.id))
        .where(db_models.ProcessingJob.status == db_models.JobStatus.COMPLETED)
    )
    completed_analyses = result.scalar()
    
    # Investments by category
    result = await db.execute(
        select(db_models.Investment.category, func.count(db_models.Investment.id))
        .group_by(db_models.Investment.category)
    )
    investments_by_category = {
        cat.value: count for cat, count in result.all()
    }
    
    # Recent uploads
    result = await db.execute(
        select(db_models.FileRegistry)
        .order_by(desc(db_models.FileRegistry.created_at))
        .limit(5)
    )
    recent_uploads = result.scalars().all()
    
    # Recent analyses
    result = await db.execute(
        select(db_models.AnalysisResult)
        .order_by(desc(db_models.AnalysisResult.created_at))
        .limit(5)
    )
    recent_analyses = result.scalars().all()
    
    return {
        "total_investments": total_investments,
        "total_value": float(total_value) if total_value else 0,
        "total_invested": float(total_invested) if total_invested else 0,
        "total_return": float(total_return) if total_return else 0,
        "total_return_pct": float(total_return_pct) if total_return_pct else 0,
        "total_files": total_files,
        "pending_analyses": pending_analyses,
        "completed_analyses": completed_analyses,
        "investments_by_category": investments_by_category,
        "recent_uploads": [
            {
                "id": str(f.id),
                "original_filename": f.original_filename,
                "status": f.status.value,
                "uploaded_at": f.uploaded_at.isoformat() if f.uploaded_at else None
            }
            for f in recent_uploads
        ],
        "recent_analyses": [
            {
                "id": str(a.id),
                "analysis_type": a.analysis_type,
                "confidence_score": float(a.confidence_score) if a.confidence_score else None,
                "created_at": a.created_at.isoformat()
            }
            for a in recent_analyses
        ]
    }


@router.get("/category-breakdown")
@cache_response(expire_seconds=60)
async def get_category_breakdown(
    db: AsyncSession = Depends(get_async_db)
):
    """Get investment breakdown by category with values."""
    result = await db.execute(
        select(
            db_models.Investment.category,
            func.count(db_models.Investment.id),
            func.coalesce(func.sum(db_models.Investment.current_value), Decimal(0))
        )
        .group_by(db_models.Investment.category)
    )
    
    breakdown = []
    total_value = Decimal(0)
    
    rows = result.all()
    for category, count, value in rows:
        total_value += value
    
    for category, count, value in rows:
        percentage = (value / total_value * 100) if total_value > 0 else 0
        breakdown.append({
            "category": category.value,
            "count": count,
            "total_value": float(value),
            "percentage": round(float(percentage), 2)
        })
    
    return {
        "breakdown": breakdown,
        "total_value": float(total_value)
    }


@router.get("/recent-activity")
@cache_response(expire_seconds=30)
async def get_recent_activity(
    limit: int = 10,
    db: AsyncSession = Depends(get_async_db)
):
    """Get recent activity across the system."""
    
    # Recent files
    result = await db.execute(
        select(db_models.FileRegistry)
        .order_by(desc(db_models.FileRegistry.created_at))
        .limit(limit)
    )
    recent_files = result.scalars().all()
    
    # Recent jobs
    result = await db.execute(
        select(db_models.ProcessingJob)
        .order_by(desc(db_models.ProcessingJob.created_at))
        .limit(limit)
    )
    recent_jobs = result.scalars().all()
    
    # Recent investments
    result = await db.execute(
        select(db_models.Investment)
        .order_by(desc(db_models.Investment.created_at))
        .limit(limit)
    )
    recent_investments = result.scalars().all()
    
    activities = []
    
    for f in recent_files:
        activities.append({
            "type": "file_upload",
            "timestamp": f.created_at.isoformat(),
            "description": f"File uploaded: {f.original_filename}",
            "entity_id": str(f.id)
        })
    
    for j in recent_jobs:
        activities.append({
            "type": "analysis_job",
            "timestamp": j.created_at.isoformat(),
            "description": f"Analysis job {j.status.value}: {j.job_type.value}",
            "entity_id": str(j.id)
        })
    
    for i in recent_investments:
        activities.append({
            "type": "investment",
            "timestamp": i.created_at.isoformat(),
            "description": f"Investment created: {i.name}",
            "entity_id": str(i.id)
        })
    
    # Sort by timestamp descending
    activities.sort(key=lambda x: x["timestamp"], reverse=True)
    
    return {"activities": activities[:limit]}
