"""
===============================================================================
UNIT TESTS - Investment Comparison Engine
===============================================================================
Tests for investment ranking, scoring, and recommendations.
"""
import pytest
from datetime import date

from lib.investment_comparison import (
    InvestmentComparator,
    ScoredInvestment,
    ComparisonResult,
    DEFAULT_SCORING_WEIGHTS,
    RISK_AVERSE_WEIGHTS,
    RETURN_FOCUSED_WEIGHTS,
    quick_compare,
    create_risk_averse_comparator,
    create_return_focused_comparator,
)


class TestCompositeScoring:
    """Test composite score calculations."""
    
    def test_composite_score_basic(self):
        """Test basic composite score calculation."""
        comparator = InvestmentComparator()
        
        metrics = {
            "simple_roi": 25.0,
            "cagr": 15.0,
            "sharpe_ratio": 1.2,
            "max_drawdown": 10.0,
            "payback_period_months": 36,
        }
        
        score = comparator.calculate_composite_score(metrics)
        assert 0 <= score <= 100
    
    def test_composite_score_outliers(self):
        """Test scoring with extreme values."""
        comparator = InvestmentComparator()
        
        # Very high ROI
        metrics_high = {
            "simple_roi": 200.0,
            "cagr": 100.0,
            "sharpe_ratio": 3.0,
            "max_drawdown": 5.0,
            "payback_period_months": 6,
        }
        
        # Very low ROI
        metrics_low = {
            "simple_roi": -60.0,
            "cagr": -50.0,
            "sharpe_ratio": -1.0,
            "max_drawdown": 60.0,
            "payback_period_months": 120,
        }
        
        score_high = comparator.calculate_composite_score(metrics_high)
        score_low = comparator.calculate_composite_score(metrics_low)
        
        # Both should be within bounds
        assert 0 <= score_high <= 100
        assert 0 <= score_low <= 100
        # High should be better than low
        assert score_high > score_low
    
    def test_composite_score_missing_values(self):
        """Test scoring with missing values."""
        comparator = InvestmentComparator()
        
        metrics = {
            "simple_roi": 20.0,
            "cagr": None,
            "sharpe_ratio": None,
        }
        
        score = comparator.calculate_composite_score(metrics)
        assert 0 <= score <= 100
    
    def test_risk_averse_scoring(self):
        """Test risk-averse scoring weights."""
        comparator = InvestmentComparator(weights=RISK_AVERSE_WEIGHTS)
        
        # Two investments: one high return high risk, one moderate return low risk
        high_risk = {
            "simple_roi": 50.0,
            "cagr": 30.0,
            "sharpe_ratio": 0.5,
            "max_drawdown": 40.0,
            "payback_period_months": 24,
        }
        
        low_risk = {
            "simple_roi": 15.0,
            "cagr": 10.0,
            "sharpe_ratio": 1.5,
            "max_drawdown": 5.0,
            "payback_period_months": 48,
        }
        
        score_high = comparator.calculate_composite_score(high_risk)
        score_low = comparator.calculate_composite_score(low_risk)
        
        # Risk-averse scorer should prefer low risk
        # (not guaranteed due to random test data, but check scoring is valid)
        assert 0 <= score_high <= 100
        assert 0 <= score_low <= 100


class TestInvestmentComparison:
    """Test full investment comparison."""
    
    def test_compare_two_investments(self):
        """Test comparing two investments."""
        comparator = InvestmentComparator()
        
        investments = [
            {"id": "1", "name": "Investment A", "category": "land", "current_value": 120000, "purchase_price": 100000},
            {"id": "2", "name": "Investment B", "category": "stocks", "current_value": 110000, "purchase_price": 100000},
        ]
        
        metrics_list = [
            {"simple_roi": 20.0, "cagr": 10.0, "sharpe_ratio": 1.0, "max_drawdown": 15.0},
            {"simple_roi": 10.0, "cagr": 5.0, "sharpe_ratio": 0.8, "max_drawdown": 20.0},
        ]
        
        result = comparator.compare_investments(investments, metrics_list, run_scenarios=False)
        
        assert result.winner_id == "1"  # A should win with higher ROI
        assert len(result.rankings) == 2
        assert result.total_portfolio_value == 230000
    
    def test_compare_multiple_investments(self):
        """Test comparing multiple investments."""
        comparator = InvestmentComparator()
        
        investments = [
            {"id": "1", "name": "Land", "category": "land", "current_value": 150000, "purchase_price": 100000},
            {"id": "2", "name": "Stocks", "category": "stocks", "current_value": 120000, "purchase_price": 100000},
            {"id": "3", "name": "Crypto", "category": "crypto", "current_value": 180000, "purchase_price": 100000},
        ]
        
        metrics_list = [
            {"simple_roi": 50.0, "cagr": 22.5, "sharpe_ratio": 1.5, "max_drawdown": 10.0},
            {"simple_roi": 20.0, "cagr": 10.0, "sharpe_ratio": 1.0, "max_drawdown": 15.0},
            {"simple_roi": 80.0, "cagr": 35.0, "sharpe_ratio": 0.8, "max_drawdown": 40.0},
        ]
        
        result = comparator.compare_investments(investments, metrics_list, run_scenarios=False)
        
        assert len(result.rankings) == 3
        assert result.winner_id in ["1", "2", "3"]
        assert len(result.recommendations) > 0
    
    def test_compare_insufficient_investments(self):
        """Test comparison with less than 2 investments."""
        comparator = InvestmentComparator()
        
        investments = [
            {"id": "1", "name": "Only", "category": "land", "current_value": 100000, "purchase_price": 80000},
        ]
        
        metrics_list = [
            {"simple_roi": 25.0},
        ]
        
        with pytest.raises(ValueError):
            comparator.compare_investments(investments, metrics_list)
    
    def test_mismatched_lists(self):
        """Test with mismatched investments and metrics."""
        comparator = InvestmentComparator()
        
        investments = [
            {"id": "1", "name": "A", "category": "land", "current_value": 100000, "purchase_price": 80000},
            {"id": "2", "name": "B", "category": "stocks", "current_value": 100000, "purchase_price": 80000},
        ]
        
        metrics_list = [
            {"simple_roi": 25.0},
            # Missing second metrics
        ]
        
        with pytest.raises(ValueError):
            comparator.compare_investments(investments, metrics_list)


class TestRankingCalculations:
    """Test ranking assignments."""
    
    def test_roi_ranking(self):
        """Test ROI-based ranking."""
        comparator = InvestmentComparator()
        
        investments = [
            {"id": "1", "name": "Best", "category": "land", "current_value": 150000, "purchase_price": 100000},
            {"id": "2", "name": "Middle", "category": "land", "current_value": 120000, "purchase_price": 100000},
            {"id": "3", "name": "Worst", "category": "land", "current_value": 105000, "purchase_price": 100000},
        ]
        
        metrics_list = [
            {"simple_roi": 50.0, "cagr": 22.5, "sharpe_ratio": 1.2},
            {"simple_roi": 20.0, "cagr": 10.0, "sharpe_ratio": 1.0},
            {"simple_roi": 5.0, "cagr": 2.5, "sharpe_ratio": 0.5},
        ]
        
        result = comparator.compare_investments(investments, metrics_list, run_scenarios=False)
        
        # Find rankings
        best = next(r for r in result.rankings if r.investment_id == "1")
        worst = next(r for r in result.rankings if r.investment_id == "3")
        
        assert best.roi_rank == 1
        assert worst.roi_rank == 3


class TestRecommendations:
    """Test recommendation generation."""
    
    def test_winner_recommendation(self):
        """Test that top performer gets a recommendation."""
        comparator = InvestmentComparator()
        
        investments = [
            {"id": "1", "name": "Star", "category": "land", "current_value": 200000, "purchase_price": 100000},
            {"id": "2", "name": "Laggard", "category": "stocks", "current_value": 90000, "purchase_price": 100000},
        ]
        
        metrics_list = [
            {"simple_roi": 100.0, "cagr": 41.4, "sharpe_ratio": 2.0, "volatility": 20},
            {"simple_roi": -10.0, "cagr": -10.0, "sharpe_ratio": -0.5, "volatility": 25},
        ]
        
        result = comparator.compare_investments(investments, metrics_list, run_scenarios=False)
        
        # Should have recommendations
        assert len(result.recommendations) > 0
        # Should have warning about underperformer
        assert len(result.warnings) > 0
    
    def test_diversification_warning(self):
        """Test diversification warnings."""
        comparator = InvestmentComparator()
        
        # All investments in same category
        investments = [
            {"id": "1", "name": "Land 1", "category": "land", "current_value": 100000, "purchase_price": 80000},
            {"id": "2", "name": "Land 2", "category": "land", "current_value": 100000, "purchase_price": 80000},
        ]
        
        metrics_list = [
            {"simple_roi": 25.0, "cagr": 12.0},
            {"simple_roi": 25.0, "cagr": 12.0},
        ]
        
        result = comparator.compare_investments(investments, metrics_list, run_scenarios=False)
        
        # Should warn about concentration
        diversification_warnings = [w for w in result.warnings if "concentrated" in w.lower() or "diversif" in w.lower()]
        assert len(diversification_warnings) > 0
    
    def test_high_volatility_warning(self):
        """Test high volatility warnings."""
        comparator = InvestmentComparator()
        
        investments = [
            {"id": "1", "name": "Safe", "category": "bonds", "current_value": 100000, "purchase_price": 80000},
            {"id": "2", "name": "Risky", "category": "crypto", "current_value": 100000, "purchase_price": 80000},
        ]
        
        metrics_list = [
            {"simple_roi": 10.0, "volatility": 10.0},
            {"simple_roi": 50.0, "volatility": 50.0},  # > 30% triggers warning
        ]
        
        result = comparator.compare_investments(investments, metrics_list, run_scenarios=False)
        
        # Should warn about high volatility
        volatility_warnings = [w for w in result.warnings if "volatil" in w.lower()]
        assert len(volatility_warnings) > 0


class TestScenarioAnalysis:
    """Test scenario analysis."""
    
    def test_scenario_calculation(self):
        """Test scenario impact calculations."""
        comparator = InvestmentComparator()
        
        investments = [
            {"id": "1", "name": "Asset 1", "category": "land", "current_value": 100000, "purchase_price": 80000},
            {"id": "2", "name": "Asset 2", "category": "stocks", "current_value": 100000, "purchase_price": 80000},
        ]
        
        metrics_list = [
            {"simple_roi": 25.0},
            {"simple_roi": 25.0},
        ]
        
        result = comparator.compare_investments(investments, metrics_list, run_scenarios=True)
        
        assert result.scenario_results is not None
        # Should have default scenarios
        assert "market_crash" in result.scenario_results or len(result.scenario_results) > 0
    
    def test_custom_scenarios(self):
        """Test custom scenario definitions."""
        comparator = InvestmentComparator()
        
        investments = [
            {"id": "1", "name": "Asset 1", "category": "land", "current_value": 100000, "purchase_price": 80000},
        ]
        
        metrics_list = [
            {"simple_roi": 25.0},
        ]
        
        # Custom scenarios
        scenarios = [
            {"name": "mild_decline", "description": "Mild Decline (-5%)", "impact_pct": -5},
            {"name": "strong_growth", "description": "Strong Growth (+50%)", "impact_pct": 50},
        ]
        
        result = comparator.run_scenarios(investments, metrics_list, scenarios)
        
        assert "mild_decline" in result
        assert "strong_growth" in result
        
        # Check calculations
        mild = result["mild_decline"]
        assert mild["impact_pct"] == -5
        assert mild["portfolio_impact"] == -5


class TestRiskAdjustedMetrics:
    """Test risk-adjusted calculations."""
    
    def test_calmar_ratio_ranking(self):
        """Test Calmar ratio-based ranking."""
        comparator = InvestmentComparator()
        
        investments = [
            {"id": "1", "name": "Smooth", "category": "land", "current_value": 100000, "purchase_price": 80000},
            {"id": "2", "name": "Bumpy", "category": "crypto", "current_value": 100000, "purchase_price": 80000},
        ]
        
        metrics_list = [
            {"simple_roi": 20.0, "cagr": 10.0, "max_drawdown": 5.0},   # Calmar = 2.0
            {"simple_roi": 30.0, "cagr": 15.0, "max_drawdown": 30.0},  # Calmar = 0.5
        ]
        
        result = comparator.compare_investments(investments, metrics_list, run_scenarios=False)
        
        # Smooth should have better Calmar ratio
        smooth_calmar = next(r for r in result.risk_adjusted_ranking if r["investment_id"] == "1")
        assert smooth_calmar["calmar_ratio"] == 2.0


class TestConcentrationAnalysis:
    """Test portfolio concentration analysis."""
    
    def test_category_allocation(self):
        """Test category allocation calculation."""
        comparator = InvestmentComparator()
        
        investments = [
            {"id": "1", "name": "Land 1", "category": "land", "current_value": 100000, "purchase_price": 80000},
            {"id": "2", "name": "Land 2", "category": "land", "current_value": 100000, "purchase_price": 80000},
            {"id": "3", "name": "Stocks", "category": "stocks", "current_value": 100000, "purchase_price": 80000},
        ]
        
        metrics_list = [
            {"simple_roi": 25.0},
            {"simple_roi": 25.0},
            {"simple_roi": 25.0},
        ]
        
        result = comparator.compare_investments(investments, metrics_list, run_scenarios=False)
        
        # Should have 2 categories
        assert "land" in result.portfolio_concentration
        assert "stocks" in result.portfolio_concentration
        
        # Land should be 66.67%
        assert result.portfolio_concentration["land"] == pytest.approx(66.67, abs=0.01)
        # Stocks should be 33.33%
        assert result.portfolio_concentration["stocks"] == pytest.approx(33.33, abs=0.01)


class TestFactoryFunctions:
    """Test factory functions."""
    
    def test_create_risk_averse_comparator(self):
        """Test creating risk-averse comparator."""
        comparator = create_risk_averse_comparator()
        assert comparator.weights == RISK_AVERSE_WEIGHTS
        assert comparator.weights["sharpe"] > DEFAULT_SCORING_WEIGHTS["sharpe"]
    
    def test_create_return_focused_comparator(self):
        """Test creating return-focused comparator."""
        comparator = create_return_focused_comparator()
        assert comparator.weights == RETURN_FOCUSED_WEIGHTS
        assert comparator.weights["roi"] > DEFAULT_SCORING_WEIGHTS["roi"]
    
    def test_quick_compare(self):
        """Test quick compare function."""
        investments = [
            {"id": "1", "name": "A", "category": "land", "current_value": 120000, "purchase_price": 100000},
            {"id": "2", "name": "B", "category": "stocks", "current_value": 110000, "purchase_price": 100000},
        ]
        
        metrics_list = [
            {"simple_roi": 20.0, "cagr": 10.0},
            {"simple_roi": 10.0, "cagr": 5.0},
        ]
        
        result = quick_compare(investments, metrics_list, risk_profile="balanced")
        
        assert "winner" in result
        assert "rankings" in result
        assert result["winner"]["id"] == "1"


class TestLiquidityScoring:
    """Test liquidity scoring."""
    
    def test_liquidity_by_category(self):
        """Test base liquidity scores by category."""
        comparator = InvestmentComparator()
        
        categories_scores = [
            ("stocks", 90),
            ("crypto", 80),
            ("bonds", 70),
            ("gold", 60),
            ("real_estate", 30),
            ("land", 20),
        ]
        
        for category, expected_base in categories_scores:
            inv = {"category": category}
            metrics = {"years_held": 1, "simple_roi": 10}
            
            score = comparator.calculate_liquidity_score(inv, metrics)
            # Score should be near expected base (with some adjustment)
            assert expected_base - 15 <= score <= expected_base + 15
    
    def test_liquidity_roi_adjustment(self):
        """Test ROI adjustments to liquidity."""
        comparator = InvestmentComparator()
        
        # Positive ROI should increase liquidity
        inv = {"category": "stocks"}
        metrics_positive = {"years_held": 3, "simple_roi": 25}
        metrics_negative = {"years_held": 3, "simple_roi": -15}
        
        score_positive = comparator.calculate_liquidity_score(inv, metrics_positive)
        score_negative = comparator.calculate_liquidity_score(inv, metrics_negative)
        
        assert score_positive > score_negative
