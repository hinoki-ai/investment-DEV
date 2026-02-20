"""
===============================================================================
LIBRARY MODULE - Financial Analysis and Portfolio Optimization
===============================================================================

This module provides financial calculation capabilities:

- financial_metrics: Calculate ROI, CAGR, IRR, NPV, risk metrics
- portfolio_optimizer: Modern Portfolio Theory optimization
- investment_comparison: Compare and rank investments

Example:
    from lib.financial_metrics import FinancialMetricsEngine, CashFlow
    from lib.portfolio_optimizer import PortfolioOptimizer, AssetReturn
    from lib.investment_comparison import InvestmentComparator
"""

from .financial_metrics import (
    FinancialMetricsEngine,
    InvestmentMetrics,
    PortfolioMetrics,
    CashFlow,
    BENCHMARK_RATES,
    format_percentage,
    format_currency,
    quick_roi,
    quick_cagr,
    quick_irr,
)

from .portfolio_optimizer import (
    PortfolioOptimizer,
    AssetReturn,
    PortfolioAllocation,
    EfficientFrontierPoint,
    OptimizationResult,
    create_asset_from_valuations,
    quick_optimize,
)

from .investment_comparison import (
    InvestmentComparator,
    ComparisonResult,
    ScoredInvestment,
    DEFAULT_SCORING_WEIGHTS,
    RISK_AVERSE_WEIGHTS,
    RETURN_FOCUSED_WEIGHTS,
    quick_compare,
    create_risk_averse_comparator,
    create_return_focused_comparator,
)

__all__ = [
    # Financial Metrics
    "FinancialMetricsEngine",
    "InvestmentMetrics",
    "PortfolioMetrics",
    "CashFlow",
    "BENCHMARK_RATES",
    "format_percentage",
    "format_currency",
    "quick_roi",
    "quick_cagr",
    "quick_irr",
    
    # Portfolio Optimization
    "PortfolioOptimizer",
    "AssetReturn",
    "PortfolioAllocation",
    "EfficientFrontierPoint",
    "OptimizationResult",
    "create_asset_from_valuations",
    "quick_optimize",
    
    # Investment Comparison
    "InvestmentComparator",
    "ComparisonResult",
    "ScoredInvestment",
    "DEFAULT_SCORING_WEIGHTS",
    "RISK_AVERSE_WEIGHTS",
    "RETURN_FOCUSED_WEIGHTS",
    "quick_compare",
    "create_risk_averse_comparator",
    "create_return_focused_comparator",
]
