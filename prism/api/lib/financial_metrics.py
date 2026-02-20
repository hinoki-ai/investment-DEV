"""
===============================================================================
FINANCIAL METRICS ENGINE - Advanced Investment Analysis
===============================================================================
Calculates ROI, IRR, NPV, Payback Period, and Risk-Adjusted Returns

Dependencies:
    pip install numpy numpy-financial scipy

References:
    - https://numpy.org/doc/stable/reference/routines.financial.html
    - Modern Portfolio Theory (Markowitz, 1952)
"""
from dataclasses import dataclass, field
from datetime import date, datetime
from decimal import Decimal, ROUND_HALF_UP
from typing import List, Dict, Tuple, Optional, Union
import math

import numpy as np
import numpy_financial as npf


# =============================================================================
# BENCHMARK RATES (Annual)
# =============================================================================

BENCHMARK_RATES = {
    "inflation_br": 0.045,      # 4.5% Brazil target inflation
    "cdi_br": 0.1075,           # 10.75% Brazil CDI rate (current)
    "selic_br": 0.115,          # 11.5% Brazil Selic rate
    "sp500_historical": 0.10,   # 10% historical S&P 500 average
    "treasury_10y_us": 0.042,   # 4.2% US 10-year Treasury
}


# =============================================================================
# DATA CLASSES
# =============================================================================

@dataclass
class CashFlow:
    """A single cash flow event."""
    date: date
    amount: float  # Positive = inflow, Negative = outflow
    description: str = ""
    
    def to_dict(self) -> Dict:
        return {
            "date": self.date.isoformat(),
            "amount": self.amount,
            "description": self.description,
        }


@dataclass
class InvestmentMetrics:
    """Complete financial metrics for an investment."""
    
    # Basic Info
    investment_id: str
    name: str
    category: str
    
    # Basic Returns
    total_invested: float
    current_value: float
    absolute_return: float
    simple_roi: float  # Percentage
    
    # Time-Weighted Returns
    annualized_roi: float
    cagr: float  # Compound Annual Growth Rate
    
    # Advanced Metrics
    irr: Optional[float]  # Internal Rate of Return (annual %)
    npv: Optional[float]  # Net Present Value
    payback_period_months: Optional[float]
    
    # Risk Metrics
    sharpe_ratio: Optional[float]
    volatility: Optional[float]  # Annualized standard deviation (%)
    max_drawdown: Optional[float]  # Maximum peak-to-trough decline (%)
    var_95: Optional[float]  # Value at Risk 95% (%)
    
    # Comparative Metrics
    vs_inflation: Optional[float]  # Real return vs inflation
    vs_cdi: Optional[float]  # vs Brazil CDI rate
    vs_sp500: Optional[float]  # vs S&P 500
    
    # Time Analysis
    years_held: float
    holding_period_days: int
    
    # Metadata
    calculation_date: date = field(default_factory=date.today)
    
    def to_dict(self) -> Dict:
        """Convert metrics to dictionary for JSON serialization."""
        return {
            "investment_id": str(self.investment_id),
            "name": self.name,
            "category": self.category,
            "basic": {
                "total_invested": round(self.total_invested, 2),
                "current_value": round(self.current_value, 2),
                "absolute_return": round(self.absolute_return, 2),
                "simple_roi": round(self.simple_roi, 2),
            },
            "time_weighted": {
                "annualized_roi": round(self.annualized_roi, 2) if self.annualized_roi else None,
                "cagr": round(self.cagr, 2) if self.cagr else None,
                "years_held": round(self.years_held, 2),
            },
            "advanced": {
                "irr": round(self.irr, 2) if self.irr else None,
                "npv": round(self.npv, 2) if self.npv else None,
                "payback_period_months": round(self.payback_period_months, 1) if self.payback_period_months else None,
            },
            "risk": {
                "sharpe_ratio": round(self.sharpe_ratio, 2) if self.sharpe_ratio else None,
                "volatility": round(self.volatility, 2) if self.volatility else None,
                "max_drawdown": round(self.max_drawdown, 2) if self.max_drawdown else None,
                "var_95": round(self.var_95, 2) if self.var_95 else None,
            },
            "comparative": {
                "vs_inflation": round(self.vs_inflation, 2) if self.vs_inflation else None,
                "vs_cdi": round(self.vs_cdi, 2) if self.vs_cdi else None,
                "vs_sp500": round(self.vs_sp500, 2) if self.vs_sp500 else None,
            },
        }


@dataclass
class PortfolioMetrics:
    """Aggregated metrics for a portfolio of investments."""
    
    total_value: float
    total_invested: float
    total_absolute_return: float
    total_roi: float
    weighted_cagr: float
    
    # Risk metrics
    portfolio_volatility: Optional[float]
    portfolio_sharpe: Optional[float]
    correlation_matrix: Optional[Dict]
    
    # Category breakdown
    category_allocation: Dict[str, float]
    
    # Best/worst performers
    best_performer: Optional[Dict]
    worst_performer: Optional[Dict]
    
    def to_dict(self) -> Dict:
        return {
            "summary": {
                "total_value": round(self.total_value, 2),
                "total_invested": round(self.total_invested, 2),
                "total_absolute_return": round(self.total_absolute_return, 2),
                "total_roi": round(self.total_roi, 2),
                "weighted_cagr": round(self.weighted_cagr, 2) if self.weighted_cagr else None,
            },
            "risk": {
                "portfolio_volatility": round(self.portfolio_volatility, 2) if self.portfolio_volatility else None,
                "portfolio_sharpe": round(self.portfolio_sharpe, 2) if self.portfolio_sharpe else None,
            },
            "allocation": self.category_allocation,
            "best_performer": self.best_performer,
            "worst_performer": self.worst_performer,
        }


# =============================================================================
# FINANCIAL METRICS ENGINE
# =============================================================================

class FinancialMetricsEngine:
    """Engine for calculating investment financial metrics."""
    
    # Default benchmark rate
    RISK_FREE_RATE = BENCHMARK_RATES["cdi_br"]  # Use Brazil CDI as default
    
    @staticmethod
    def calculate_simple_roi(initial: float, current: float) -> float:
        """
        Calculate simple ROI percentage.
        
        Formula: ((Current - Initial) / Initial) * 100
        """
        if initial == 0 or initial is None:
            return 0.0
        return ((current - initial) / initial) * 100
    
    @staticmethod
    def calculate_cagr(initial: float, current: float, years: float) -> float:
        """
        Calculate Compound Annual Growth Rate.
        
        Formula: ((Current / Initial) ^ (1 / Years) - 1) * 100
        """
        if initial <= 0 or years <= 0:
            return 0.0
        try:
            cagr = ((current / initial) ** (1 / years) - 1) * 100
            return cagr
        except (ValueError, OverflowError):
            return 0.0
    
    @staticmethod
    def calculate_irr(cash_flows: List[float]) -> Optional[float]:
        """
        Calculate Internal Rate of Return.
        
        IRR is the discount rate that makes NPV of all cash flows equal to zero.
        Returns annual IRR as percentage.
        """
        try:
            if len(cash_flows) < 2:
                return None
            
            # Check if all cash flows are zero
            if all(cf == 0 for cf in cash_flows):
                return None
            
            # Check if there's at least one positive and one negative
            has_positive = any(cf > 0 for cf in cash_flows)
            has_negative = any(cf < 0 for cf in cash_flows)
            
            if not (has_positive and has_negative):
                return None
            
            irr = npf.irr(cash_flows)
            
            if irr is None or np.isnan(irr) or np.isinf(irr):
                return None
            
            # Return as percentage
            return float(irr) * 100
            
        except (ValueError, TypeError):
            return None
    
    @staticmethod
    def calculate_npv(cash_flows: List[float], discount_rate: float = 0.1075) -> float:
        """
        Calculate Net Present Value.
        
        Args:
            cash_flows: List of cash flows (first is typically negative - initial investment)
            discount_rate: Annual discount rate (default: 10.75% CDI)
        
        Returns:
            NPV value
        """
        try:
            if not cash_flows:
                return 0.0
            npv = npf.npv(discount_rate, cash_flows)
            return float(npv)
        except (ValueError, TypeError):
            return 0.0
    
    @staticmethod
    def calculate_payback_period(cash_flows: List[float]) -> Optional[float]:
        """
        Calculate payback period in periods (months).
        
        Returns the number of periods to recover initial investment.
        """
        if not cash_flows or len(cash_flows) < 2:
            return None
        
        initial_investment = abs(cash_flows[0]) if cash_flows[0] < 0 else 0
        if initial_investment == 0:
            return 0.0
        
        cumulative = 0.0
        for i, cf in enumerate(cash_flows[1:], 1):
            cumulative += cf
            if cumulative >= initial_investment:
                # Interpolate for partial period
                previous_cumulative = cumulative - cf
                fraction = (initial_investment - previous_cumulative) / cf if cf > 0 else 0
                return float(i - 1 + fraction)
        
        return None  # Investment not recovered
    
    @staticmethod
    def calculate_volatility(returns: List[float], annualize: bool = True) -> Optional[float]:
        """
        Calculate volatility (standard deviation) of returns.
        
        Args:
            returns: List of periodic returns (as decimals, e.g., 0.05 for 5%)
            annualize: Whether to annualize the result (assuming monthly data)
        
        Returns:
            Volatility as percentage
        """
        if len(returns) < 2:
            return None
        
        try:
            std_dev = np.std(returns, ddof=1)  # Sample standard deviation
            
            if annualize:
                # Assuming monthly returns, annualize by sqrt(12)
                std_dev = std_dev * np.sqrt(12)
            
            return float(std_dev) * 100  # Return as percentage
        except (ValueError, TypeError):
            return None
    
    @staticmethod
    def calculate_sharpe_ratio(
        returns: List[float],
        risk_free_rate: float = 0.1075,
        annualize: bool = True
    ) -> Optional[float]:
        """
        Calculate Sharpe Ratio.
        
        Formula: (Mean Return - Risk Free Rate) / Standard Deviation
        
        Args:
            returns: List of periodic returns (as decimals)
            risk_free_rate: Annual risk-free rate (default: 10.75% CDI)
            annualize: Whether returns are monthly and need annualization
        """
        if len(returns) < 2:
            return None
        
        try:
            avg_return = np.mean(returns)
            volatility = np.std(returns, ddof=1)
            
            if volatility == 0:
                return None
            
            if annualize:
                # Annualize monthly return
                avg_return_annual = ((1 + avg_return) ** 12) - 1
                volatility_annual = volatility * np.sqrt(12)
                sharpe = (avg_return_annual - risk_free_rate) / volatility_annual
            else:
                sharpe = (avg_return - risk_free_rate) / volatility
            
            return float(sharpe)
        except (ValueError, TypeError, ZeroDivisionError):
            return None
    
    @staticmethod
    def calculate_max_drawdown(values: List[float]) -> Optional[float]:
        """
        Calculate maximum drawdown percentage.
        
        Maximum drawdown is the maximum observed loss from a peak to a trough.
        """
        if len(values) < 2:
            return None
        
        try:
            peak = values[0]
            max_drawdown = 0.0
            
            for value in values:
                if value > peak:
                    peak = value
                drawdown = (peak - value) / peak if peak > 0 else 0
                max_drawdown = max(max_drawdown, drawdown)
            
            return max_drawdown * 100  # Return as percentage
        except (ValueError, TypeError):
            return None
    
    @staticmethod
    def calculate_var_95(returns: List[float]) -> Optional[float]:
        """
        Calculate Value at Risk at 95% confidence level.
        
        VaR represents the maximum loss not exceeded with 95% confidence.
        """
        if len(returns) < 5:
            return None
        
        try:
            var = np.percentile(returns, 5)  # 5th percentile
            return abs(float(var)) * 100  # Return as positive percentage
        except (ValueError, TypeError):
            return None
    
    def analyze_investment(
        self,
        investment_id: str,
        name: str,
        category: str,
        purchase_price: float,
        current_value: float,
        purchase_date: date,
        cash_flows: Optional[List[CashFlow]] = None,
        valuation_history: Optional[List[Tuple[date, float]]] = None,
        currency: str = "BRL"
    ) -> InvestmentMetrics:
        """
        Perform complete investment analysis.
        
        Args:
            investment_id: Unique identifier for the investment
            name: Investment name
            category: Investment category (land, stocks, etc.)
            purchase_price: Initial purchase price
            current_value: Current market value
            purchase_date: Date of purchase
            cash_flows: Optional list of additional cash flows (rent, dividends, etc.)
            valuation_history: Optional list of (date, value) tuples for risk analysis
            currency: Currency code (default: BRL)
        
        Returns:
            InvestmentMetrics object with all calculated metrics
        """
        # Calculate holding period
        today = date.today()
        holding_period_days = (today - purchase_date).days
        years_held = holding_period_days / 365.25
        
        # Basic calculations
        absolute_return = current_value - purchase_price
        simple_roi = self.calculate_simple_roi(purchase_price, current_value)
        
        # CAGR / Annualized ROI
        cagr = self.calculate_cagr(purchase_price, current_value, max(years_held, 0.01))
        annualized_roi = cagr
        
        # Build cash flow list for IRR/NPV calculation
        # Start with initial outflow (negative)
        cf_list = [-abs(purchase_price)]
        
        if cash_flows:
            # Sort by date and add to list
            sorted_flows = sorted(cash_flows, key=lambda x: x.date)
            for flow in sorted_flows:
                cf_list.append(flow.amount)
        
        # Add current value as final inflow (if positive)
        if current_value > 0:
            cf_list.append(current_value)
        
        # Advanced metrics
        irr = self.calculate_irr(cf_list)
        npv = self.calculate_npv(cf_list, self.RISK_FREE_RATE)
        payback = self.calculate_payback_period(cf_list)
        
        # Risk metrics (if we have valuation history)
        sharpe = None
        volatility = None
        max_dd = None
        var_95 = None
        
        if valuation_history and len(valuation_history) > 1:
            # Sort by date
            sorted_history = sorted(valuation_history, key=lambda x: x[0])
            values = [v for _, v in sorted_history]
            
            # Calculate periodic returns
            returns = []
            for i in range(1, len(values)):
                if values[i-1] > 0:
                    periodic_return = (values[i] - values[i-1]) / values[i-1]
                    returns.append(periodic_return)
            
            if returns:
                volatility = self.calculate_volatility(returns)
                sharpe = self.calculate_sharpe_ratio(returns, self.RISK_FREE_RATE)
                var_95 = self.calculate_var_95(returns)
            
            max_dd = self.calculate_max_drawdown(values)
        
        # Comparative metrics
        if years_held > 0:
            nominal_return_annual = (current_value / purchase_price) ** (1 / years_held) - 1
            real_return = (1 + nominal_return_annual) / (1 + BENCHMARK_RATES["inflation_br"]) - 1
            vs_inflation = real_return * 100
        else:
            vs_inflation = simple_roi - (BENCHMARK_RATES["inflation_br"] * 100)
        
        return InvestmentMetrics(
            investment_id=investment_id,
            name=name,
            category=category,
            total_invested=purchase_price,
            current_value=current_value,
            absolute_return=absolute_return,
            simple_roi=simple_roi,
            annualized_roi=annualized_roi,
            cagr=cagr,
            irr=irr,
            npv=npv,
            payback_period_months=payback,
            sharpe_ratio=sharpe,
            volatility=volatility,
            max_drawdown=max_dd,
            var_95=var_95,
            vs_inflation=vs_inflation,
            vs_cdi=(cagr - BENCHMARK_RATES["cdi_br"] * 100) if cagr else None,
            vs_sp500=(cagr - BENCHMARK_RATES["sp500_historical"] * 100) if cagr else None,
            years_held=years_held,
            holding_period_days=holding_period_days,
        )
    
    def calculate_portfolio_metrics(
        self,
        investments_metrics: List[InvestmentMetrics]
    ) -> PortfolioMetrics:
        """
        Calculate aggregated portfolio metrics from individual investment metrics.
        
        Args:
            investments_metrics: List of InvestmentMetrics for each investment
        
        Returns:
            PortfolioMetrics with aggregated statistics
        """
        if not investments_metrics:
            return PortfolioMetrics(
                total_value=0.0,
                total_invested=0.0,
                total_absolute_return=0.0,
                total_roi=0.0,
                weighted_cagr=0.0,
                portfolio_volatility=None,
                portfolio_sharpe=None,
                correlation_matrix=None,
                category_allocation={},
                best_performer=None,
                worst_performer=None,
            )
        
        # Basic aggregates
        total_value = sum(m.current_value for m in investments_metrics)
        total_invested = sum(m.total_invested for m in investments_metrics)
        total_absolute_return = total_value - total_invested
        total_roi = (total_absolute_return / total_invested * 100) if total_invested > 0 else 0.0
        
        # Weighted CAGR (by current value)
        if total_value > 0:
            weighted_cagr = sum(
                (m.cagr or 0) * (m.current_value / total_value)
                for m in investments_metrics
            )
        else:
            weighted_cagr = 0.0
        
        # Category allocation
        category_values: Dict[str, float] = {}
        for m in investments_metrics:
            category_values[m.category] = category_values.get(m.category, 0) + m.current_value
        
        category_allocation = {
            cat: round(val / total_value * 100, 2) if total_value > 0 else 0
            for cat, val in category_values.items()
        }
        
        # Best and worst performers by simple ROI
        sorted_by_roi = sorted(investments_metrics, key=lambda x: x.simple_roi, reverse=True)
        
        best_performer = {
            "id": str(sorted_by_roi[0].investment_id),
            "name": sorted_by_roi[0].name,
            "roi": round(sorted_by_roi[0].simple_roi, 2),
        } if sorted_by_roi else None
        
        worst_performer = {
            "id": str(sorted_by_roi[-1].investment_id),
            "name": sorted_by_roi[-1].name,
            "roi": round(sorted_by_roi[-1].simple_roi, 2),
        } if len(sorted_by_roi) > 1 else None
        
        return PortfolioMetrics(
            total_value=total_value,
            total_invested=total_invested,
            total_absolute_return=total_absolute_return,
            total_roi=total_roi,
            weighted_cagr=weighted_cagr,
            portfolio_volatility=None,  # Would need correlation matrix
            portfolio_sharpe=None,
            correlation_matrix=None,
            category_allocation=category_allocation,
            best_performer=best_performer,
            worst_performer=worst_performer,
        )


# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================

def format_percentage(value: Optional[float], decimals: int = 2) -> str:
    """Format a value as percentage string."""
    if value is None:
        return "N/A"
    return f"{value:.{decimals}f}%"


def format_currency(value: float, currency: str = "BRL") -> str:
    """Format a value as currency string."""
    symbols = {"BRL": "R$", "USD": "$", "EUR": "€"}
    symbol = symbols.get(currency, currency)
    return f"{symbol} {value:,.2f}"


def calculate_holding_period(start_date: date, end_date: Optional[date] = None) -> Dict:
    """Calculate detailed holding period information."""
    end = end_date or date.today()
    delta = end - start_date
    
    years = delta.days / 365.25
    months = delta.days / 30.44
    
    return {
        "days": delta.days,
        "months": round(months, 1),
        "years": round(years, 2),
        "years_months": f"{int(years)}y {int((years % 1) * 12)}m",
    }


# =============================================================================
# QUICK CALCULATION HELPERS
# =============================================================================

def quick_roi(initial: float, current: float) -> float:
    """Quick ROI calculation."""
    engine = FinancialMetricsEngine()
    return engine.calculate_simple_roi(initial, current)


def quick_cagr(initial: float, current: float, years: float) -> float:
    """Quick CAGR calculation."""
    engine = FinancialMetricsEngine()
    return engine.calculate_cagr(initial, current, years)


def quick_irr(cash_flows: List[float]) -> Optional[float]:
    """Quick IRR calculation."""
    engine = FinancialMetricsEngine()
    return engine.calculate_irr(cash_flows)
