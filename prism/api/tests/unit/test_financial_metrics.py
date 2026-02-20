"""
===============================================================================
UNIT TESTS - Financial Metrics Engine
===============================================================================
Tests for ROI, CAGR, IRR, NPV, and risk calculations.
"""
import pytest
from datetime import date, timedelta
from decimal import Decimal
import math

from lib.financial_metrics import (
    FinancialMetricsEngine,
    CashFlow,
    InvestmentMetrics,
    BENCHMARK_RATES,
    format_percentage,
    format_currency,
    quick_roi,
    quick_cagr,
)


class TestROICalculations:
    """Test simple ROI calculations."""
    
    def test_roi_basic_profit(self):
        """Test basic positive ROI."""
        engine = FinancialMetricsEngine()
        roi = engine.calculate_simple_roi(100000, 120000)
        assert roi == 20.0  # 20% profit
    
    def test_roi_basic_loss(self):
        """Test negative ROI."""
        engine = FinancialMetricsEngine()
        roi = engine.calculate_simple_roi(100000, 80000)
        assert roi == -20.0  # 20% loss
    
    def test_roi_no_change(self):
        """Test zero ROI."""
        engine = FinancialMetricsEngine()
        roi = engine.calculate_simple_roi(100000, 100000)
        assert roi == 0.0
    
    def test_roi_zero_initial(self):
        """Test ROI with zero initial investment."""
        engine = FinancialMetricsEngine()
        roi = engine.calculate_simple_roi(0, 100000)
        assert roi == 0.0  # Edge case
    
    def test_roi_large_numbers(self):
        """Test ROI with large numbers."""
        engine = FinancialMetricsEngine()
        roi = engine.calculate_simple_roi(1000000, 1500000)
        assert roi == 50.0


class TestCAGRCalculations:
    """Test Compound Annual Growth Rate calculations."""
    
    def test_cagr_doubling_in_5_years(self):
        """Test CAGR when investment doubles in 5 years."""
        engine = FinancialMetricsEngine()
        # Doubles in 5 years: CAGR = 2^(1/5) - 1 ≈ 14.87%
        cagr = engine.calculate_cagr(100000, 200000, 5)
        assert pytest.approx(cagr, abs=0.1) == 14.87
    
    def test_cagr_tripling_in_10_years(self):
        """Test CAGR when investment triples in 10 years."""
        engine = FinancialMetricsEngine()
        # Triples in 10 years: CAGR = 3^(1/10) - 1 ≈ 11.61%
        cagr = engine.calculate_cagr(100000, 300000, 10)
        assert pytest.approx(cagr, abs=0.1) == 11.61
    
    def test_cagr_zero_years(self):
        """Test CAGR with zero years."""
        engine = FinancialMetricsEngine()
        cagr = engine.calculate_cagr(100000, 120000, 0)
        assert cagr == 0.0
    
    def test_cagr_zero_initial(self):
        """Test CAGR with zero initial investment."""
        engine = FinancialMetricsEngine()
        cagr = engine.calculate_cagr(0, 100000, 5)
        assert cagr == 0.0
    
    def test_cagr_loss(self):
        """Test CAGR with loss."""
        engine = FinancialMetricsEngine()
        cagr = engine.calculate_cagr(100000, 50000, 5)
        assert cagr < 0  # Negative CAGR


class TestIRRCalculations:
    """Test Internal Rate of Return calculations."""
    
    def test_irr_simple_case(self):
        """Test IRR with simple cash flows."""
        engine = FinancialMetricsEngine()
        # Invest 1000, get 400, 500, 600 back over 3 years
        # Expected IRR ≈ 20%
        cash_flows = [-1000, 400, 500, 600]
        irr = engine.calculate_irr(cash_flows)
        assert irr is not None
        assert pytest.approx(irr, abs=1.0) == 20.0
    
    def test_irr_property_investment(self):
        """Test IRR for typical property investment."""
        engine = FinancialMetricsEngine()
        # Buy for 500000, sell for 700000 after 5 years
        cash_flows = [-500000, 0, 0, 0, 0, 700000]
        irr = engine.calculate_irr(cash_flows)
        assert irr is not None
        # Expected ≈ 7%
        assert pytest.approx(irr, abs=0.5) == 7.0
    
    def test_irr_insufficient_cashflows(self):
        """Test IRR with insufficient cash flows."""
        engine = FinancialMetricsEngine()
        irr = engine.calculate_irr([-1000])
        assert irr is None
    
    def test_irr_all_zero(self):
        """Test IRR with all zero cash flows."""
        engine = FinancialMetricsEngine()
        irr = engine.calculate_irr([0, 0, 0])
        assert irr is None
    
    def test_irr_no_sign_change(self):
        """Test IRR with no sign change in cash flows."""
        engine = FinancialMetricsEngine()
        # All positive - no investment
        irr = engine.calculate_irr([100, 200, 300])
        assert irr is None


class TestNPVCalculations:
    """Test Net Present Value calculations."""
    
    def test_npv_positive(self):
        """Test positive NPV."""
        engine = FinancialMetricsEngine()
        # Invest 1000, get 400/year for 3 years at 10% discount
        cash_flows = [-1000, 400, 400, 400]
        npv = engine.calculate_npv(cash_flows, 0.10)
        assert npv > 0
    
    def test_npv_negative(self):
        """Test negative NPV."""
        engine = FinancialMetricsEngine()
        # Bad investment
        cash_flows = [-1000, 100, 100, 100]
        npv = engine.calculate_npv(cash_flows, 0.10)
        assert npv < 0
    
    def test_npv_zero_rate(self):
        """Test NPV with zero discount rate."""
        engine = FinancialMetricsEngine()
        cash_flows = [-1000, 400, 400, 400]
        npv = engine.calculate_npv(cash_flows, 0.0)
        assert npv == 200  # Simple sum


class TestPaybackPeriod:
    """Test payback period calculations."""
    
    def test_payback_simple(self):
        """Test simple payback period."""
        engine = FinancialMetricsEngine()
        # Invest 1000, get 500/year
        cash_flows = [-1000, 500, 500]
        payback = engine.calculate_payback_period(cash_flows)
        assert payback == 2.0
    
    def test_payback_with_partial(self):
        """Test payback with partial period."""
        engine = FinancialMetricsEngine()
        # Invest 1000, get 400, 400, 400
        cash_flows = [-1000, 400, 400, 400]
        payback = engine.calculate_payback_period(cash_flows)
        # 400 + 400 = 800 after 2 periods, need 200 more from 400 in period 3
        # So 2 + 200/400 = 2.5 periods
        assert pytest.approx(payback, abs=0.1) == 2.5
    
    def test_payback_never(self):
        """Test when payback never happens."""
        engine = FinancialMetricsEngine()
        cash_flows = [-1000, 100, 100, 100]
        payback = engine.calculate_payback_period(cash_flows)
        assert payback is None


class TestRiskMetrics:
    """Test risk metric calculations."""
    
    def test_volatility_basic(self):
        """Test basic volatility calculation."""
        engine = FinancialMetricsEngine()
        # Monthly returns (as decimals)
        returns = [0.01, 0.02, -0.01, 0.015, 0.005, -0.005]
        vol = engine.calculate_volatility(returns, annualize=False)
        assert vol is not None
        assert vol > 0
    
    def test_volatility_annualized(self):
        """Test annualized volatility."""
        engine = FinancialMetricsEngine()
        returns = [0.01, 0.02, -0.01, 0.015, 0.005, -0.005]
        vol_monthly = engine.calculate_volatility(returns, annualize=False)
        vol_annual = engine.calculate_volatility(returns, annualize=True)
        # Annual should be roughly monthly * sqrt(12)
        assert vol_annual > vol_monthly
    
    def test_volatility_insufficient_data(self):
        """Test volatility with insufficient data."""
        engine = FinancialMetricsEngine()
        vol = engine.calculate_volatility([0.01])
        assert vol is None
    
    def test_sharpe_ratio_basic(self):
        """Test basic Sharpe ratio calculation."""
        engine = FinancialMetricsEngine()
        # Monthly returns averaging ~1% per month
        returns = [0.01, 0.02, 0.005, 0.015, 0.01, 0.008]
        sharpe = engine.calculate_sharpe_ratio(returns, risk_free_rate=0.02)
        assert sharpe is not None
    
    def test_max_drawdown_basic(self):
        """Test max drawdown calculation."""
        engine = FinancialMetricsEngine()
        # Values that peak then drop
        values = [100, 120, 110, 130, 100, 90, 110]
        mdd = engine.calculate_max_drawdown(values)
        assert mdd is not None
        # Peak was 130, trough was 90
        # Drawdown = (130 - 90) / 130 = 30.77%
        assert pytest.approx(mdd, abs=0.5) == 30.77
    
    def test_var_95(self):
        """Test Value at Risk calculation."""
        engine = FinancialMetricsEngine()
        returns = [0.05, 0.03, -0.02, 0.04, -0.05, 0.02, -0.01, 0.03]
        var = engine.calculate_var_95(returns)
        assert var is not None
        assert var > 0


class TestFullInvestmentAnalysis:
    """Test complete investment analysis."""
    
    def test_analyze_land_investment(self):
        """Test analysis of a typical land investment."""
        engine = FinancialMetricsEngine()
        
        metrics = engine.analyze_investment(
            investment_id="test-123",
            name="Test Land Plot",
            category="land",
            purchase_price=100000,
            current_value=150000,
            purchase_date=date.today() - timedelta(days=730),  # 2 years ago
        )
        
        assert metrics.investment_id == "test-123"
        assert metrics.name == "Test Land Plot"
        assert metrics.simple_roi == 50.0  # 50% gain
        assert metrics.absolute_return == 50000
        assert metrics.years_held == pytest.approx(2.0, abs=0.1)
        assert metrics.cagr == pytest.approx(22.5, abs=1.0)  # ~22.5% CAGR
    
    def test_analyze_with_valuations(self):
        """Test analysis with valuation history."""
        engine = FinancialMetricsEngine()
        
        # Monthly valuations for 1 year
        valuations = [
            (date.today() - timedelta(days=365), 100000),
            (date.today() - timedelta(days=335), 102000),
            (date.today() - timedelta(days=305), 101000),
            (date.today() - timedelta(days=275), 104000),
            (date.today() - timedelta(days=245), 106000),
            (date.today() - timedelta(days=215), 105000),
        ]
        
        metrics = engine.analyze_investment(
            investment_id="test-456",
            name="Test Stock",
            category="stocks",
            purchase_price=100000,
            current_value=105000,
            purchase_date=date.today() - timedelta(days=365),
            valuation_history=valuations,
        )
        
        assert metrics.volatility is not None
        assert metrics.max_drawdown is not None


class TestPortfolioMetrics:
    """Test portfolio-level calculations."""
    
    def test_portfolio_aggregation(self):
        """Test aggregating multiple investments."""
        engine = FinancialMetricsEngine()
        
        # Create mock metrics
        metrics_list = [
            InvestmentMetrics(
                investment_id="1",
                name="Inv 1",
                category="land",
                total_invested=100000,
                current_value=120000,
                absolute_return=20000,
                simple_roi=20.0,
                annualized_roi=10.0,
                cagr=10.0,
                irr=None,
                npv=None,
                payback_period_months=None,
                sharpe_ratio=None,
                volatility=None,
                max_drawdown=None,
                var_95=None,
                vs_inflation=5.0,
                vs_cdi=-1.0,
                vs_sp500=0.0,
                years_held=2.0,
                holding_period_days=730,
            ),
            InvestmentMetrics(
                investment_id="2",
                name="Inv 2",
                category="stocks",
                total_invested=50000,
                current_value=60000,
                absolute_return=10000,
                simple_roi=20.0,
                annualized_roi=20.0,
                cagr=20.0,
                irr=None,
                npv=None,
                payback_period_months=None,
                sharpe_ratio=None,
                volatility=None,
                max_drawdown=None,
                var_95=None,
                vs_inflation=15.0,
                vs_cdi=9.0,
                vs_sp500=10.0,
                years_held=1.0,
                holding_period_days=365,
            ),
        ]
        
        portfolio = engine.calculate_portfolio_metrics(metrics_list)
        
        assert portfolio.total_value == 180000
        assert portfolio.total_invested == 150000
        assert portfolio.total_absolute_return == 30000
        assert portfolio.total_roi == 20.0


class TestUtilityFunctions:
    """Test utility formatting functions."""
    
    def test_format_percentage(self):
        """Test percentage formatting."""
        assert format_percentage(25.5) == "25.50%"
        assert format_percentage(25.555, decimals=1) == "25.6%"
        assert format_percentage(None) == "N/A"
    
    def test_format_currency_brl(self):
        """Test BRL currency formatting."""
        result = format_currency(1234567.89, "BRL")
        assert "R$" in result
        assert "1,234,567.89" in result
    
    def test_quick_roi(self):
        """Test quick ROI helper."""
        roi = quick_roi(100000, 125000)
        assert roi == 25.0
    
    def test_quick_cagr(self):
        """Test quick CAGR helper."""
        cagr = quick_cagr(100000, 200000, 5)
        assert pytest.approx(cagr, abs=0.1) == 14.87


class TestBenchmarkRates:
    """Test benchmark rates are properly defined."""
    
    def test_brazil_rates_exist(self):
        """Test Brazil-specific rates exist."""
        assert "inflation_br" in BENCHMARK_RATES
        assert "cdi_br" in BENCHMARK_RATES
        assert "selic_br" in BENCHMARK_RATES
        
        # Verify reasonable values
        assert 0 < BENCHMARK_RATES["inflation_br"] < 0.5
        assert 0 < BENCHMARK_RATES["cdi_br"] < 0.5
    
    def test_us_rates_exist(self):
        """Test US rates exist."""
        assert "sp500_historical" in BENCHMARK_RATES
        assert "treasury_10y_us" in BENCHMARK_RATES
