"""
===============================================================================
ANALYTICS ROUTER - Financial Math Analysis Endpoints
===============================================================================
Provides comprehensive financial analysis, portfolio optimization, and 
investment comparison capabilities.
"""
from typing import List, Optional
from datetime import date
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_async_db
from models import Investment, ValuationHistory
from lib.financial_metrics import FinancialMetricsEngine, CashFlow
from lib.portfolio_optimizer import PortfolioOptimizer, AssetReturn, create_asset_from_valuations
from lib.investment_comparison import InvestmentComparator, quick_compare

router = APIRouter(prefix="/api/v1/analytics", tags=["Analytics"])


# =============================================================================
# INVESTMENT METRICS ENDPOINTS
# =============================================================================

@router.get("/investments/{investment_id}/metrics")
async def get_investment_metrics(
    investment_id: str,
    include_valuations: bool = Query(True, description="Include valuation history in risk analysis"),
    db: AsyncSession = Depends(get_async_db)
):
    """
    Get comprehensive financial metrics for a single investment.
    
    Returns:
    - Basic metrics: ROI, absolute return
    - Time-weighted: CAGR, annualized ROI
    - Advanced: IRR, NPV, payback period
    - Risk: Sharpe ratio, volatility, max drawdown, VaR
    - Comparative: vs inflation, vs CDI, vs S&P 500
    """
    # Fetch investment
    result = await db.execute(
        select(Investment).where(Investment.id == investment_id)
    )
    investment = result.scalar_one_or_none()
    
    if not investment:
        raise HTTPException(status_code=404, detail="Investment not found")
    
    # Fetch valuation history for risk analysis
    valuation_history = None
    if include_valuations:
        valuations_result = await db.execute(
            select(ValuationHistory)
            .where(ValuationHistory.investment_id == investment_id)
            .order_by(ValuationHistory.valuation_date)
        )
        valuations = valuations_result.scalars().all()
        if valuations:
            valuation_history = [
                (v.valuation_date, float(v.value)) for v in valuations
            ]
    
    # Calculate metrics
    engine = FinancialMetricsEngine()
    
    metrics = engine.analyze_investment(
        investment_id=str(investment.id),
        name=investment.name,
        category=investment.category.value if investment.category else "unknown",
        purchase_price=float(investment.purchase_price) if investment.purchase_price else 0.0,
        current_value=float(investment.current_value) if investment.current_value else 0.0,
        purchase_date=investment.purchase_date or date.today(),
        valuation_history=valuation_history,
        currency=investment.purchase_currency or "BRL",
    )
    
    return {
        "success": True,
        "data": metrics.to_dict()
    }


@router.post("/investments/batch-metrics")
async def get_batch_investment_metrics(
    investment_ids: List[str],
    db: AsyncSession = Depends(get_async_db)
):
    """
    Get financial metrics for multiple investments in one request.
    
    This is useful for the portfolio overview page.
    """
    results = []
    engine = FinancialMetricsEngine()
    
    for inv_id in investment_ids:
        result = await db.execute(
            select(Investment).where(Investment.id == inv_id)
        )
        investment = result.scalar_one_or_none()
        
        if investment:
            # Get valuations
            valuations_result = await db.execute(
                select(ValuationHistory)
                .where(ValuationHistory.investment_id == inv_id)
                .order_by(ValuationHistory.valuation_date)
            )
            valuations = valuations_result.scalars().all()
            valuation_history = [
                (v.valuation_date, float(v.value)) for v in valuations
            ] if valuations else None
            
            metrics = engine.analyze_investment(
                investment_id=str(investment.id),
                name=investment.name,
                category=investment.category.value if investment.category else "unknown",
                purchase_price=float(investment.purchase_price) if investment.purchase_price else 0.0,
                current_value=float(investment.current_value) if investment.current_value else 0.0,
                purchase_date=investment.purchase_date or date.today(),
                valuation_history=valuation_history,
            )
            results.append(metrics.to_dict())
    
    return {
        "success": True,
        "count": len(results),
        "data": results
    }


# =============================================================================
# PORTFOLIO ANALYSIS ENDPOINTS
# =============================================================================

@router.get("/portfolio/summary")
async def get_portfolio_summary(
    category: Optional[str] = Query(None, description="Filter by category"),
    status: Optional[str] = Query("active", description="Filter by status"),
    db: AsyncSession = Depends(get_async_db)
):
    """
    Get complete portfolio summary with mathematical analysis.
    
    Returns:
    - Total portfolio value and returns
    - Weighted average metrics
    - Category breakdown
    - Best and worst performers
    - Risk assessment
    """
    # Build query
    query = select(Investment)
    if category:
        query = query.where(Investment.category == category)
    if status:
        query = query.where(Investment.status == status)
    
    result = await db.execute(query)
    investments = result.scalars().all()
    
    if not investments:
        return {
            "success": True,
            "data": {
                "summary": {
                    "total_value": 0.0,
                    "total_invested": 0.0,
                    "total_return_pct": 0.0,
                    "investment_count": 0,
                },
                "investments": [],
            }
        }
    
    # Calculate metrics for each investment
    engine = FinancialMetricsEngine()
    all_metrics = []
    
    for inv in investments:
        # Get valuations
        valuations_result = await db.execute(
            select(ValuationHistory)
            .where(ValuationHistory.investment_id == inv.id)
            .order_by(ValuationHistory.valuation_date)
        )
        valuations = valuations_result.scalars().all()
        valuation_history = [
            (v.valuation_date, float(v.value)) for v in valuations
        ] if valuations else None
        
        metrics = engine.analyze_investment(
            investment_id=str(inv.id),
            name=inv.name,
            category=inv.category.value if inv.category else "unknown",
            purchase_price=float(inv.purchase_price) if inv.purchase_price else 0.0,
            current_value=float(inv.current_value) if inv.current_value else 0.0,
            purchase_date=inv.purchase_date or date.today(),
            valuation_history=valuation_history,
        )
        all_metrics.append(metrics)
    
    # Calculate portfolio-level metrics
    portfolio_metrics = engine.calculate_portfolio_metrics(all_metrics)
    
    return {
        "success": True,
        "data": {
            **portfolio_metrics.to_dict(),
            "investment_count": len(investments),
            "investments": [m.to_dict() for m in all_metrics],
        }
    }


@router.get("/portfolio/optimization")
async def get_portfolio_optimization(
    db: AsyncSession = Depends(get_async_db)
):
    """
    Get portfolio optimization recommendations using Modern Portfolio Theory.
    
    Returns:
    - Efficient frontier data points
    - Maximum Sharpe ratio portfolio
    - Minimum volatility portfolio
    - Rebalancing recommendations
    - Diversification analysis
    """
    # Fetch all active investments with valuations
    result = await db.execute(
        select(Investment).where(Investment.status == "active")
    )
    investments = result.scalars().all()
    
    if len(investments) < 2:
        return {
            "success": False,
            "error": "At least 2 investments required for optimization",
            "data": None,
        }
    
    # Build asset returns from valuation history
    asset_returns = []
    current_values = {}
    total_value = 0.0
    
    for inv in investments:
        # Get valuation history
        valuations_result = await db.execute(
            select(ValuationHistory)
            .where(ValuationHistory.investment_id == inv.id)
            .order_by(ValuationHistory.valuation_date)
        )
        valuations = valuations_result.scalars().all()
        
        if len(valuations) >= 3:  # Need at least 3 data points
            asset_ret = create_asset_from_valuations(
                investment_id=str(inv.id),
                name=inv.name,
                category=inv.category.value if inv.category else "unknown",
                valuations=[(v.valuation_date, float(v.value)) for v in valuations]
            )
            asset_returns.append(asset_ret)
            
            current_val = float(inv.current_value) if inv.current_value else 0.0
            current_values[str(inv.id)] = current_val
            total_value += current_val
    
    if len(asset_returns) < 2:
        return {
            "success": False,
            "error": "Insufficient valuation history for optimization. Need at least 2 investments with 3+ valuations each.",
            "data": None,
        }
    
    # Run optimization
    optimizer = PortfolioOptimizer()
    try:
        optimization_result = optimizer.optimize_portfolio(
            asset_returns=asset_returns,
            current_values=current_values,
            total_portfolio_value=total_value if total_value > 0 else None
        )
        
        return {
            "success": True,
            "data": optimization_result.to_dict()
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"Optimization failed: {str(e)}",
            "data": None,
        }


# =============================================================================
# COMPARISON ENDPOINTS
# =============================================================================

@router.post("/compare")
async def compare_investments(
    investment_ids: List[str],
    risk_profile: str = Query("balanced", description="Risk profile: conservative, balanced, aggressive"),
    include_scenarios: bool = Query(True, description="Include scenario analysis"),
    db: AsyncSession = Depends(get_async_db)
):
    """
    Compare multiple investments side-by-side with rankings and recommendations.
    
    Returns:
    - Composite scores and rankings
    - Side-by-side metric comparison
    - Risk-adjusted rankings (Calmar ratio)
    - Scenario analysis (market crash, boom, etc.)
    - Investment recommendations and warnings
    """
    if len(investment_ids) < 2:
        raise HTTPException(status_code=400, detail="At least 2 investment IDs required")
    
    # Fetch investments
    investments = []
    for inv_id in investment_ids:
        result = await db.execute(
            select(Investment).where(Investment.id == inv_id)
        )
        inv = result.scalar_one_or_none()
        if inv:
            investments.append(inv)
    
    if len(investments) < 2:
        raise HTTPException(status_code=400, detail="At least 2 valid investments required")
    
    # Calculate metrics for each
    engine = FinancialMetricsEngine()
    all_metrics = []
    investment_data = []
    
    for inv in investments:
        # Get valuations
        valuations_result = await db.execute(
            select(ValuationHistory)
            .where(ValuationHistory.investment_id == inv.id)
            .order_by(ValuationHistory.valuation_date)
        )
        valuations = valuations_result.scalars().all()
        valuation_history = [
            (v.valuation_date, float(v.value)) for v in valuations
        ] if valuations else None
        
        metrics = engine.analyze_investment(
            investment_id=str(inv.id),
            name=inv.name,
            category=inv.category.value if inv.category else "unknown",
            purchase_price=float(inv.purchase_price) if inv.purchase_price else 0.0,
            current_value=float(inv.current_value) if inv.current_value else 0.0,
            purchase_date=inv.purchase_date or date.today(),
            valuation_history=valuation_history,
        )
        all_metrics.append(metrics.to_dict())
        investment_data.append({
            "id": str(inv.id),
            "name": inv.name,
            "category": inv.category.value if inv.category else "unknown",
            "current_value": float(inv.current_value) if inv.current_value else 0.0,
            "purchase_price": float(inv.purchase_price) if inv.purchase_price else 0.0,
        })
    
    # Compare using comparator
    comparator = InvestmentComparator()
    comparison_result = comparator.compare_investments(
        investments=investment_data,
        metrics_list=all_metrics,
        run_scenarios=include_scenarios
    )
    
    return {
        "success": True,
        "data": comparison_result.to_dict()
    }


@router.get("/compare/all")
async def compare_all_investments(
    category: Optional[str] = Query(None, description="Filter by category"),
    limit: int = Query(10, ge=2, le=50, description="Maximum number of investments to compare"),
    db: AsyncSession = Depends(get_async_db)
):
    """
    Compare all investments (or filtered by category) and return rankings.
    
    Useful for the investments list page to see top performers.
    """
    query = select(Investment).where(Investment.status == "active")
    if category:
        query = query.where(Investment.category == category)
    query = query.limit(limit)
    
    result = await db.execute(query)
    investments = result.scalars().all()
    
    if len(investments) < 2:
        return {
            "success": False,
            "error": "At least 2 investments required for comparison",
            "data": None,
        }
    
    # Calculate metrics and compare
    engine = FinancialMetricsEngine()
    all_metrics = []
    investment_data = []
    
    for inv in investments:
        valuations_result = await db.execute(
            select(ValuationHistory)
            .where(ValuationHistory.investment_id == inv.id)
            .order_by(ValuationHistory.valuation_date)
        )
        valuations = valuations_result.scalars().all()
        valuation_history = [
            (v.valuation_date, float(v.value)) for v in valuations
        ] if valuations else None
        
        metrics = engine.analyze_investment(
            investment_id=str(inv.id),
            name=inv.name,
            category=inv.category.value if inv.category else "unknown",
            purchase_price=float(inv.purchase_price) if inv.purchase_price else 0.0,
            current_value=float(inv.current_value) if inv.current_value else 0.0,
            purchase_date=inv.purchase_date or date.today(),
            valuation_history=valuation_history,
        )
        all_metrics.append(metrics.to_dict())
        investment_data.append({
            "id": str(inv.id),
            "name": inv.name,
            "category": inv.category.value if inv.category else "unknown",
            "current_value": float(inv.current_value) if inv.current_value else 0.0,
            "purchase_price": float(inv.purchase_price) if inv.purchase_price else 0.0,
        })
    
    comparator = InvestmentComparator()
    comparison_result = comparator.compare_investments(
        investments=investment_data,
        metrics_list=all_metrics,
        run_scenarios=True
    )
    
    return {
        "success": True,
        "data": comparison_result.to_dict()
    }


# =============================================================================
# SCENARIO ANALYSIS ENDPOINTS
# =============================================================================

@router.post("/scenario-analysis")
async def run_scenario_analysis(
    investment_ids: List[str],
    scenario_type: str = Query("market_crash", description="Scenario: market_crash, correction, boom, inflation"),
    custom_impact: Optional[float] = Query(None, description="Custom impact percentage (overrides scenario_type)"),
    db: AsyncSession = Depends(get_async_db)
):
    """
    Run what-if scenario analysis on selected investments.
    
    Scenarios:
    - market_crash: -20% impact
    - correction: -10% impact
    - boom: +30% impact
    - inflation: -5% real impact
    
    Returns projected values and portfolio impact.
    """
    # Define scenario impacts
    scenario_impacts = {
        "market_crash": -20,
        "correction": -10,
        "boom": 30,
        "inflation": -5,
    }
    
    impact_pct = custom_impact if custom_impact is not None else scenario_impacts.get(scenario_type, -10)
    
    # Fetch investments
    investments = []
    for inv_id in investment_ids:
        result = await db.execute(
            select(Investment).where(Investment.id == inv_id)
        )
        inv = result.scalar_one_or_none()
        if inv:
            investments.append(inv)
    
    # Calculate current totals
    total_current = sum(
        float(inv.current_value) if inv.current_value else 0.0
        for inv in investments
    )
    
    # Calculate projections
    projections = []
    total_projected = 0.0
    
    for inv in investments:
        current = float(inv.current_value) if inv.current_value else 0.0
        purchase = float(inv.purchase_price) if inv.purchase_price else 0.0
        
        projected_value = current * (1 + impact_pct / 100)
        total_projected += projected_value
        
        current_roi = ((current - purchase) / purchase * 100) if purchase > 0 else 0.0
        projected_roi = ((projected_value - purchase) / purchase * 100) if purchase > 0 else 0.0
        
        projections.append({
            "investment_id": str(inv.id),
            "name": inv.name,
            "category": inv.category.value if inv.category else "unknown",
            "current_value": round(current, 2),
            "projected_value": round(projected_value, 2),
            "value_change": round(projected_value - current, 2),
            "current_roi": round(current_roi, 2),
            "projected_roi": round(projected_roi, 2),
        })
    
    portfolio_impact = ((total_projected - total_current) / total_current * 100) if total_current > 0 else 0.0
    
    return {
        "success": True,
        "data": {
            "scenario": scenario_type,
            "impact_pct": impact_pct,
            "portfolio_impact": round(portfolio_impact, 2),
            "total_current": round(total_current, 2),
            "total_projected": round(total_projected, 2),
            "projections": projections,
        }
    }


# =============================================================================
# BENCHMARK DATA ENDPOINT
# =============================================================================

@router.get("/benchmarks")
async def get_benchmark_rates():
    """
    Get current benchmark rates used for comparative analysis.
    
    Returns:
    - Inflation rate (Brazil target)
    - CDI rate (Brazil interbank rate)
    - Selic rate (Brazil policy rate)
    - S&P 500 historical average
    - US Treasury 10-year
    """
    from lib.financial_metrics import BENCHMARK_RATES
    
    return {
        "success": True,
        "data": {
            "rates": {
                name: f"{rate * 100:.2f}%"
                for name, rate in BENCHMARK_RATES.items()
            },
            "values": {
                name: rate * 100
                for name, rate in BENCHMARK_RATES.items()
            },
            "description": {
                "inflation_br": "Brazil target inflation rate",
                "cdi_br": "Brazil CDI interbank rate",
                "selic_br": "Brazil Selic policy rate",
                "sp500_historical": "S&P 500 historical average return",
                "treasury_10y_us": "US 10-year Treasury yield",
            }
        }
    }
