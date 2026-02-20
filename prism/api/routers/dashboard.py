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

async def fetch_yahoo_price(symbol: str) -> Optional[float]:
    """Fetch price from Yahoo Finance API."""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol}?interval=1d&range=1d",
                headers={"User-Agent": "Mozilla/5.0"}
            )
            if response.status_code == 200:
                data = response.json()
                price = data.get("chart", {}).get("result", [{}])[0].get("meta", {}).get("regularMarketPrice")
                return float(price) if price else None
    except Exception:
        pass
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
    Get current market data for gold and silver prices.
    
    Fetches from Yahoo Finance via server-side proxy (avoids CORS issues).
    Returns prices in CLP per gram.
    """
    # Fetch USD rate and metal prices in parallel
    usd_rate, gold_usd_oz, silver_usd_oz = await asyncio.gather(
        fetch_usd_clp_rate(),
        fetch_yahoo_price("GC=F"),  # Gold
        fetch_yahoo_price("SI=F"),  # Silver
        return_exceptions=True
    )
    
    # Handle exceptions
    if isinstance(usd_rate, Exception):
        usd_rate = None
    if isinstance(gold_usd_oz, Exception):
        gold_usd_oz = None
    if isinstance(silver_usd_oz, Exception):
        silver_usd_oz = None
    
    # Convert to CLP per gram (1 troy ounce = 31.1034768 grams)
    grams_per_ounce = 31.1034768
    
    gold_clp_per_gram = None
    silver_clp_per_gram = None
    
    if usd_rate and gold_usd_oz:
        gold_clp_per_gram = (gold_usd_oz * usd_rate) / grams_per_ounce
    
    if usd_rate and silver_usd_oz:
        silver_clp_per_gram = (silver_usd_oz * usd_rate) / grams_per_ounce
    
    return {
        "gold_clp_per_gram": round(gold_clp_per_gram, 2) if gold_clp_per_gram else None,
        "silver_clp_per_gram": round(silver_clp_per_gram, 2) if silver_clp_per_gram else None,
        "usd_clp_rate": usd_rate,
        "gold_usd_per_oz": gold_usd_oz,
        "silver_usd_per_oz": silver_usd_per_oz,
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
