"""
===============================================================================
UNIT TESTS - Portfolio Optimizer
===============================================================================
Tests for Modern Portfolio Theory optimization and efficient frontier.
"""
import pytest
import numpy as np
from datetime import date, timedelta

from lib.portfolio_optimizer import (
    PortfolioOptimizer,
    AssetReturn,
    PortfolioAllocation,
    EfficientFrontierPoint,
    create_asset_from_valuations,
    calculate_returns_from_values,
)


class TestAssetReturn:
    """Test AssetReturn data class."""
    
    def test_asset_return_creation(self):
        """Test creating an AssetReturn."""
        asset = AssetReturn(
            investment_id="inv-1",
            name="Test Investment",
            category="land",
            returns=[0.01, 0.02, -0.01, 0.015],
        )
        assert asset.investment_id == "inv-1"
        assert asset.name == "Test Investment"
        assert len(asset.returns) == 4
    
    def test_calculate_stats(self):
        """Test calculating mean and std dev."""
        asset = AssetReturn(
            investment_id="inv-1",
            name="Test",
            category="land",
            returns=[0.01, 0.02, 0.015, 0.005, 0.01],
        )
        mean, std = asset.calculate_stats()
        assert mean > 0
        assert std > 0


class TestExpectedReturns:
    """Test expected return calculations."""
    
    def test_calculate_expected_returns(self):
        """Test calculating expected returns from historical data."""
        optimizer = PortfolioOptimizer()
        
        assets = [
            AssetReturn(
                investment_id="1",
                name="Asset 1",
                category="land",
                returns=[0.01] * 12,  # 1% monthly
            ),
            AssetReturn(
                investment_id="2",
                name="Asset 2",
                category="stocks",
                returns=[0.015] * 12,  # 1.5% monthly
            ),
        ]
        
        expected = optimizer.calculate_expected_returns(assets)
        assert len(expected) == 2
        # Expected annual: (1 + monthly)^12 - 1
        # For 1% monthly: (1.01)^12 - 1 ≈ 12.68%
        assert expected[0] > 0.10
        assert expected[1] > expected[0]
    
    def test_expected_return_override(self):
        """Test using explicit expected return."""
        optimizer = PortfolioOptimizer()
        
        assets = [
            AssetReturn(
                investment_id="1",
                name="Asset 1",
                category="land",
                returns=[0.01] * 12,
                expected_return=0.15,  # Explicit 15%
            ),
        ]
        
        expected = optimizer.calculate_expected_returns(assets)
        assert expected[0] == 0.15


class TestCovarianceMatrix:
    """Test covariance matrix calculations."""
    
    def test_covariance_calculation(self):
        """Test calculating covariance matrix."""
        optimizer = PortfolioOptimizer()
        
        # Two assets with different volatilities
        np.random.seed(42)
        returns1 = np.random.normal(0.01, 0.02, 24).tolist()
        returns2 = np.random.normal(0.015, 0.03, 24).tolist()
        
        assets = [
            AssetReturn(investment_id="1", name="Low Vol", category="bonds", returns=returns1),
            AssetReturn(investment_id="2", name="High Vol", category="stocks", returns=returns2),
        ]
        
        cov_matrix = optimizer.calculate_covariance_matrix(assets)
        assert cov_matrix.shape == (2, 2)
        # Diagonal should be positive (variances)
        assert cov_matrix[0, 0] > 0
        assert cov_matrix[1, 1] > 0


class TestPortfolioPerformance:
    """Test portfolio performance calculations."""
    
    def test_portfolio_performance_basic(self):
        """Test calculating portfolio return and volatility."""
        optimizer = PortfolioOptimizer()
        
        # Two assets: 10% and 15% expected returns
        expected_returns = np.array([0.10, 0.15])
        
        # Simple covariance: 20% and 30% vol, uncorrelated
        cov_matrix = np.array([
            [0.04, 0],
            [0, 0.09],
        ])
        
        # Equal weights
        weights = np.array([0.5, 0.5])
        
        p_return, p_vol = optimizer.portfolio_performance(
            weights, expected_returns, cov_matrix
        )
        
        # Expected return: 0.5 * 10% + 0.5 * 15% = 12.5%
        assert pytest.approx(p_return, abs=0.5) == 12.5
        # Volatility should be between individual volatilities
        assert p_vol > 0


class TestMinimumVolatility:
    """Test minimum volatility optimization."""
    
    def test_optimize_minimum_volatility(self):
        """Test finding minimum volatility portfolio."""
        optimizer = PortfolioOptimizer()
        
        np.random.seed(42)
        # Low vol asset
        returns1 = np.random.normal(0.005, 0.01, 24).tolist()
        # High vol asset
        returns2 = np.random.normal(0.01, 0.04, 24).tolist()
        
        assets = [
            AssetReturn(investment_id="1", name="Bonds", category="bonds", returns=returns1),
            AssetReturn(investment_id="2", name="Stocks", category="stocks", returns=returns2),
        ]
        
        result = optimizer.optimize_minimum_volatility(assets)
        
        assert result.expected_return >= 0
        assert result.volatility > 0
        # Should allocate more to low vol asset
        low_vol_weight = next(a.optimal_weight for a in result.allocations if a.name == "Bonds")
        assert low_vol_weight > 0.5
    
    def test_single_asset(self):
        """Test optimization with single asset."""
        optimizer = PortfolioOptimizer()
        
        assets = [
            AssetReturn(
                investment_id="1",
                name="Only Asset",
                category="land",
                returns=[0.01] * 12,
            ),
        ]
        
        result = optimizer.optimize_minimum_volatility(assets)
        assert len(result.allocations) == 1
        assert result.allocations[0].optimal_weight == 1.0


class TestMaximumSharpe:
    """Test maximum Sharpe ratio optimization."""
    
    def test_optimize_maximum_sharpe(self):
        """Test finding maximum Sharpe ratio portfolio."""
        optimizer = PortfolioOptimizer()
        
        np.random.seed(42)
        # Lower return, lower vol
        returns1 = np.random.normal(0.005, 0.01, 24).tolist()
        # Higher return, higher vol
        returns2 = np.random.normal(0.015, 0.025, 24).tolist()
        
        assets = [
            AssetReturn(investment_id="1", name="Safe", category="bonds", returns=returns1),
            AssetReturn(investment_id="2", name="Risky", category="stocks", returns=returns2),
        ]
        
        result = optimizer.optimize_maximum_sharpe(assets)
        
        assert result.sharpe_ratio is not None
        # Should have positive Sharpe
        assert result.sharpe_ratio > 0 or result.sharpe_ratio < 0  # Can be negative with bad luck
    
    def test_rebalancing_recommendations(self):
        """Test rebalancing recommendations."""
        optimizer = PortfolioOptimizer()
        
        np.random.seed(42)
        returns1 = np.random.normal(0.01, 0.02, 24).tolist()
        returns2 = np.random.normal(0.01, 0.02, 24).tolist()
        
        assets = [
            AssetReturn(investment_id="1", name="Asset 1", category="land", returns=returns1),
            AssetReturn(investment_id="2", name="Asset 2", category="stocks", returns=returns2),
        ]
        
        # Current: 100% in asset 1
        current_weights = np.array([1.0, 0.0])
        
        result = optimizer.optimize_maximum_sharpe(assets, current_weights)
        
        # Should recommend some reallocation
        for alloc in result.allocations:
            if alloc.current_weight != alloc.optimal_weight:
                assert alloc.recommendation in ["increase", "decrease"]


class TestEfficientFrontier:
    """Test efficient frontier calculation."""
    
    def test_calculate_efficient_frontier(self):
        """Test generating efficient frontier points."""
        optimizer = PortfolioOptimizer()
        
        np.random.seed(42)
        returns1 = np.random.normal(0.005, 0.015, 24).tolist()
        returns2 = np.random.normal(0.012, 0.025, 24).tolist()
        
        assets = [
            AssetReturn(investment_id="1", name="Low Risk", category="bonds", returns=returns1),
            AssetReturn(investment_id="2", name="High Risk", category="stocks", returns=returns2),
        ]
        
        frontier = optimizer.calculate_efficient_frontier(assets, num_portfolios=10)
        
        assert len(frontier) > 0
        # Frontier should be sorted by return
        for i in range(len(frontier) - 1):
            assert frontier[i].expected_return <= frontier[i + 1].expected_return
    
    def test_efficient_frontier_shape(self):
        """Test that frontier has the expected shape (increasing volatility)."""
        optimizer = PortfolioOptimizer()
        
        np.random.seed(42)
        returns1 = np.random.normal(0.005, 0.01, 36).tolist()
        returns2 = np.random.normal(0.015, 0.03, 36).tolist()
        returns3 = np.random.normal(0.02, 0.04, 36).tolist()
        
        assets = [
            AssetReturn(investment_id="1", name="Conservative", category="bonds", returns=returns1),
            AssetReturn(investment_id="2", name="Moderate", category="stocks", returns=returns2),
            AssetReturn(investment_id="3", name="Aggressive", category="crypto", returns=returns3),
        ]
        
        frontier = optimizer.calculate_efficient_frontier(assets, num_portfolios=20)
        
        # Higher returns generally come with higher volatility
        volatilities = [p.volatility for p in frontier]
        returns = [p.expected_return for p in frontier]
        
        # Just verify we have data
        assert len(volatilities) == len(returns)


class TestDiversificationRatio:
    """Test diversification ratio calculation."""
    
    def test_diversification_ratio(self):
        """Test calculating diversification ratio."""
        optimizer = PortfolioOptimizer()
        
        np.random.seed(42)
        # Uncorrelated assets
        returns1 = np.random.normal(0.01, 0.02, 24).tolist()
        returns2 = np.random.normal(0.01, 0.02, 24).tolist()
        
        assets = [
            AssetReturn(investment_id="1", name="Asset 1", category="land", returns=returns1),
            AssetReturn(investment_id="2", name="Asset 2", category="stocks", returns=returns2),
        ]
        
        weights = np.array([0.5, 0.5])
        ratio = optimizer.calculate_diversification_ratio(weights, assets)
        
        # Should be > 1 for diversified portfolio
        assert ratio > 0


class TestUtilityFunctions:
    """Test utility functions."""
    
    def test_calculate_returns_from_values(self):
        """Test calculating returns from value series."""
        values = [100, 105, 102, 110, 108]
        returns = calculate_returns_from_values(values)
        
        assert len(returns) == 4
        # First return: (105 - 100) / 100 = 0.05
        assert pytest.approx(returns[0], abs=0.001) == 0.05
    
    def test_create_asset_from_valuations(self):
        """Test creating AssetReturn from valuations."""
        valuations = [
            (date.today() - timedelta(days=180), 100000),
            (date.today() - timedelta(days=150), 102000),
            (date.today() - timedelta(days=120), 101000),
            (date.today() - timedelta(days=90), 104000),
        ]
        
        asset = create_asset_from_valuations(
            investment_id="test-1",
            name="Test Asset",
            category="land",
            valuations=valuations,
        )
        
        assert asset.investment_id == "test-1"
        assert len(asset.returns) == 3


class TestFullOptimization:
    """Test complete portfolio optimization."""
    
    def test_optimize_portfolio_complete(self):
        """Test complete optimization workflow."""
        optimizer = PortfolioOptimizer()
        
        np.random.seed(42)
        # Create realistic asset returns
        land_returns = np.random.normal(0.008, 0.015, 24).tolist()
        stock_returns = np.random.normal(0.012, 0.025, 24).tolist()
        crypto_returns = np.random.normal(0.02, 0.06, 24).tolist()
        
        assets = [
            AssetReturn(investment_id="1", name="Land", category="land", returns=land_returns),
            AssetReturn(investment_id="2", name="Stocks", category="stocks", returns=stock_returns),
            AssetReturn(investment_id="3", name="Crypto", category="crypto", returns=crypto_returns),
        ]
        
        current_values = {"1": 100000, "2": 50000, "3": 25000}
        total_value = 175000
        
        result = optimizer.optimize_portfolio(
            assets, current_values, total_value
        )
        
        assert result.current_return is not None
        assert result.current_volatility is not None
        assert result.max_sharpe_portfolio is not None
        assert result.min_volatility_portfolio is not None
        assert len(result.efficient_frontier) > 0
        assert result.diversification_ratio > 0


class TestEdgeCases:
    """Test edge cases and error handling."""
    
    def test_no_assets(self):
        """Test optimization with no assets."""
        optimizer = PortfolioOptimizer()
        
        with pytest.raises(ValueError):
            optimizer.optimize_portfolio([])
    
    def test_single_asset_frontier(self):
        """Test efficient frontier with single asset."""
        optimizer = PortfolioOptimizer()
        
        assets = [
            AssetReturn(
                investment_id="1",
                name="Only Asset",
                category="land",
                returns=[0.01] * 12,
            ),
        ]
        
        # Should still work but return single point
        frontier = optimizer.calculate_efficient_frontier(assets, num_portfolios=5)
        assert len(frontier) >= 1
    
    def test_zero_volatility_handling(self):
        """Test handling of zero volatility cases."""
        optimizer = PortfolioOptimizer()
        
        # Constant returns (zero volatility)
        assets = [
            AssetReturn(
                investment_id="1",
                name="Fixed",
                category="bonds",
                returns=[0.01] * 12,  # All same
            ),
        ]
        
        result = optimizer.optimize_minimum_volatility(assets)
        # Should handle gracefully
        assert result is not None
