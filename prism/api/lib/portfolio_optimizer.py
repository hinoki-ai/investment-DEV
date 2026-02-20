"""
===============================================================================
PORTFOLIO OPTIMIZATION ENGINE - Modern Portfolio Theory
===============================================================================
Uses Markowitz Mean-Variance Optimization for efficient frontier

Dependencies:
    pip install numpy scipy

References:
    - Markowitz, H. (1952). Portfolio Selection
    - https://docs.scipy.org/doc/scipy/reference/optimize.html
"""
from dataclasses import dataclass, field
from typing import List, Dict, Tuple, Optional, Callable
from datetime import date
import warnings

import numpy as np
from scipy.optimize import minimize, LinearConstraint, Bounds


# =============================================================================
# DATA CLASSES
# =============================================================================

@dataclass
class AssetReturn:
    """Historical return data for an asset."""
    investment_id: str
    name: str
    category: str
    returns: List[float]  # Periodic returns (monthly recommended)
    expected_return: Optional[float] = None  # Annual expected return
    
    def calculate_stats(self) -> Tuple[float, float]:
        """Calculate mean and standard deviation of returns."""
        if not self.returns:
            return 0.0, 0.0
        return float(np.mean(self.returns)), float(np.std(self.returns, ddof=1))


@dataclass
class PortfolioAllocation:
    """Optimized portfolio allocation for a single asset."""
    investment_id: str
    name: str
    category: str
    current_weight: float
    optimal_weight: float
    expected_return: float
    risk_contribution: float
    recommendation: str  # "increase", "decrease", "hold"


@dataclass
class EfficientFrontierPoint:
    """A single point on the efficient frontier."""
    expected_return: float  # Annual return (%)
    volatility: float  # Annual volatility (%)
    sharpe_ratio: float
    allocations: List[PortfolioAllocation]
    
    def to_dict(self) -> Dict:
        return {
            "expected_return": round(self.expected_return, 2),
            "volatility": round(self.volatility, 2),
            "sharpe_ratio": round(self.sharpe_ratio, 2),
            "allocations": [
                {
                    "investment_id": a.investment_id,
                    "name": a.name,
                    "category": a.category,
                    "current_weight": round(a.current_weight, 4),
                    "optimal_weight": round(a.optimal_weight, 4),
                    "expected_return": round(a.expected_return, 2),
                    "recommendation": a.recommendation,
                }
                for a in self.allocations
            ],
        }


@dataclass
class OptimizationResult:
    """Complete portfolio optimization result."""
    
    # Current portfolio state
    current_return: float
    current_volatility: float
    current_sharpe: float
    
    # Optimal portfolios
    max_sharpe_portfolio: EfficientFrontierPoint
    min_volatility_portfolio: EfficientFrontierPoint
    
    # Efficient frontier
    efficient_frontier: List[EfficientFrontierPoint]
    
    # Risk analysis
    diversification_ratio: float
    correlation_matrix: Optional[List[List[float]]]
    
    # Recommendations
    rebalancing_actions: List[Dict]
    risk_analysis: Dict
    
    # Metadata
    calculation_date: date = field(default_factory=date.today)
    
    def to_dict(self) -> Dict:
        return {
            "current": {
                "expected_return": round(self.current_return, 2),
                "volatility": round(self.current_volatility, 2),
                "sharpe_ratio": round(self.current_sharpe, 2),
            },
            "optimal": {
                "max_sharpe": self.max_sharpe_portfolio.to_dict(),
                "min_volatility": self.min_volatility_portfolio.to_dict(),
            },
            "efficient_frontier": [p.to_dict() for p in self.efficient_frontier[:10]],
            "diversification": {
                "ratio": round(self.diversification_ratio, 2),
                "assessment": "well_diversified" if self.diversification_ratio > 1.5 else "concentrated",
            },
            "rebalancing": self.rebalancing_actions,
            "risk_analysis": self.risk_analysis,
        }


# =============================================================================
# PORTFOLIO OPTIMIZER
# =============================================================================

class PortfolioOptimizer:
    """Modern Portfolio Theory implementation for portfolio optimization."""
    
    def __init__(self, risk_free_rate: float = 0.1075):
        """
        Initialize optimizer.
        
        Args:
            risk_free_rate: Annual risk-free rate (default: 10.75% Brazil CDI)
        """
        self.risk_free_rate = risk_free_rate
    
    def calculate_expected_returns(self, asset_returns: List[AssetReturn]) -> np.ndarray:
        """
        Calculate expected annual returns for assets.
        
        If expected_return is provided, use it. Otherwise calculate from historical data.
        """
        expected = []
        for asset in asset_returns:
            if asset.expected_return is not None:
                expected.append(asset.expected_return)
            elif asset.returns:
                # Annualize monthly returns: (1 + mean)^12 - 1
                mean_monthly = np.mean(asset.returns)
                annual = ((1 + mean_monthly) ** 12) - 1
                expected.append(annual)
            else:
                expected.append(0.0)
        return np.array(expected)
    
    def calculate_covariance_matrix(self, asset_returns: List[AssetReturn]) -> np.ndarray:
        """Calculate annualized covariance matrix from asset returns."""
        # Get returns matrix (periods x assets)
        returns_matrix = np.array([asset.returns for asset in asset_returns])
        
        # Calculate covariance (monthly)
        cov_matrix = np.cov(returns_matrix)
        
        # Annualize: multiply by 12
        return cov_matrix * 12
    
    def calculate_correlation_matrix(self, asset_returns: List[AssetReturn]) -> np.ndarray:
        """Calculate correlation matrix from asset returns."""
        returns_matrix = np.array([asset.returns for asset in asset_returns])
        return np.corrcoef(returns_matrix)
    
    def portfolio_performance(
        self,
        weights: np.ndarray,
        expected_returns: np.ndarray,
        cov_matrix: np.ndarray
    ) -> Tuple[float, float]:
        """
        Calculate portfolio expected return and volatility.
        
        Returns:
            (expected_return, volatility) as annual percentages
        """
        portfolio_return = np.dot(weights, expected_returns)
        portfolio_var = np.dot(weights.T, np.dot(cov_matrix, weights))
        portfolio_vol = np.sqrt(portfolio_var)
        
        return portfolio_return * 100, portfolio_vol * 100
    
    def neg_sharpe_ratio(
        self,
        weights: np.ndarray,
        expected_returns: np.ndarray,
        cov_matrix: np.ndarray
    ) -> float:
        """Calculate negative Sharpe ratio for minimization."""
        p_return, p_vol = self.portfolio_performance(weights, expected_returns, cov_matrix)
        if p_vol == 0:
            return 0
        return -(p_return / 100 - self.risk_free_rate) / (p_vol / 100)
    
    def portfolio_variance(
        self,
        weights: np.ndarray,
        cov_matrix: np.ndarray
    ) -> float:
        """Calculate portfolio variance for minimization."""
        return np.dot(weights.T, np.dot(cov_matrix, weights))
    
    def optimize_maximum_sharpe(
        self,
        asset_returns: List[AssetReturn],
        current_weights: Optional[np.ndarray] = None,
        constraints: Optional[List[Dict]] = None
    ) -> EfficientFrontierPoint:
        """
        Find portfolio with maximum Sharpe ratio.
        
        Args:
            asset_returns: List of AssetReturn objects
            current_weights: Current portfolio weights (for comparison)
            constraints: Additional constraints (e.g., max weight per category)
        
        Returns:
            EfficientFrontierPoint with optimal allocations
        """
        n_assets = len(asset_returns)
        expected_returns = self.calculate_expected_returns(asset_returns)
        cov_matrix = self.calculate_covariance_matrix(asset_returns)
        
        # Initial guess: equal weights
        initial_weights = np.array([1/n_assets] * n_assets)
        
        # Constraints: weights sum to 1
        constraints_list = [{'type': 'eq', 'fun': lambda x: np.sum(x) - 1}]
        if constraints:
            constraints_list.extend(constraints)
        
        # Bounds: 0 <= weight <= 1 (no short selling)
        bounds = tuple((0, 1) for _ in range(n_assets))
        
        # Optimize
        result = minimize(
            self.neg_sharpe_ratio,
            initial_weights,
            args=(expected_returns, cov_matrix),
            method='SLSQP',
            bounds=bounds,
            constraints=constraints_list,
            options={'maxiter': 1000, 'ftol': 1e-9}
        )
        
        if not result.success:
            warnings.warn(f"Optimization failed: {result.message}")
        
        optimal_weights = result.x if result.success else initial_weights
        
        # Calculate performance
        p_return, p_vol = self.portfolio_performance(
            optimal_weights, expected_returns, cov_matrix
        )
        sharpe = (p_return / 100 - self.risk_free_rate) / (p_vol / 100) if p_vol > 0 else 0
        
        # Build allocations
        allocations = []
        for i, asset in enumerate(asset_returns):
            current_w = current_weights[i] if current_weights is not None else 0
            optimal_w = optimal_weights[i]
            
            if optimal_w > current_w + 0.05:
                rec = "increase"
            elif optimal_w < current_w - 0.05:
                rec = "decrease"
            else:
                rec = "hold"
            
            allocations.append(PortfolioAllocation(
                investment_id=asset.investment_id,
                name=asset.name,
                category=asset.category,
                current_weight=current_w,
                optimal_weight=optimal_w,
                expected_return=expected_returns[i] * 100,
                risk_contribution=optimal_w * np.dot(cov_matrix[i], optimal_weights),
                recommendation=rec,
            ))
        
        return EfficientFrontierPoint(
            expected_return=p_return,
            volatility=p_vol,
            sharpe_ratio=sharpe,
            allocations=allocations,
        )
    
    def optimize_minimum_volatility(
        self,
        asset_returns: List[AssetReturn],
        current_weights: Optional[np.ndarray] = None
    ) -> EfficientFrontierPoint:
        """Find portfolio with minimum volatility."""
        n_assets = len(asset_returns)
        expected_returns = self.calculate_expected_returns(asset_returns)
        cov_matrix = self.calculate_covariance_matrix(asset_returns)
        
        initial_weights = np.array([1/n_assets] * n_assets)
        constraints = {'type': 'eq', 'fun': lambda x: np.sum(x) - 1}
        bounds = tuple((0, 1) for _ in range(n_assets))
        
        result = minimize(
            self.portfolio_variance,
            initial_weights,
            args=(cov_matrix,),
            method='SLSQP',
            bounds=bounds,
            constraints=constraints,
            options={'maxiter': 1000}
        )
        
        optimal_weights = result.x if result.success else initial_weights
        
        p_return, p_vol = self.portfolio_performance(
            optimal_weights, expected_returns, cov_matrix
        )
        sharpe = (p_return / 100 - self.risk_free_rate) / (p_vol / 100) if p_vol > 0 else 0
        
        allocations = []
        for i, asset in enumerate(asset_returns):
            current_w = current_weights[i] if current_weights is not None else 0
            allocations.append(PortfolioAllocation(
                investment_id=asset.investment_id,
                name=asset.name,
                category=asset.category,
                current_weight=current_w,
                optimal_weight=optimal_weights[i],
                expected_return=expected_returns[i] * 100,
                risk_contribution=optimal_weights[i] * np.dot(cov_matrix[i], optimal_weights),
                recommendation="hold",
            ))
        
        return EfficientFrontierPoint(
            expected_return=p_return,
            volatility=p_vol,
            sharpe_ratio=sharpe,
            allocations=allocations,
        )
    
    def calculate_efficient_frontier(
        self,
        asset_returns: List[AssetReturn],
        num_portfolios: int = 50,
        current_weights: Optional[np.ndarray] = None
    ) -> List[EfficientFrontierPoint]:
        """
        Calculate the efficient frontier.
        
        The efficient frontier represents optimal portfolios that offer:
        - Highest expected return for a given level of risk
        - Lowest risk for a given level of expected return
        """
        n_assets = len(asset_returns)
        expected_returns = self.calculate_expected_returns(asset_returns)
        cov_matrix = self.calculate_covariance_matrix(asset_returns)
        
        # Target returns range (from min to max asset return)
        min_return = expected_returns.min()
        max_return = expected_returns.max()
        target_returns = np.linspace(min_return, max_return, num_portfolios)
        
        frontier = []
        
        for target in target_returns:
            # Minimize volatility at target return
            result = self._minimize_volatility_at_target(
                target, expected_returns, cov_matrix
            )
            
            if result.success:
                weights = result.x
                p_return, p_vol = self.portfolio_performance(
                    weights, expected_returns, cov_matrix
                )
                sharpe = (p_return / 100 - self.risk_free_rate) / (p_vol / 100) if p_vol > 0 else 0
                
                allocations = [
                    PortfolioAllocation(
                        investment_id=asset.investment_id,
                        name=asset.name,
                        category=asset.category,
                        current_weight=current_weights[i] if current_weights is not None else 0,
                        optimal_weight=weights[i],
                        expected_return=expected_returns[i] * 100,
                        risk_contribution=weights[i] * np.dot(cov_matrix[i], weights),
                        recommendation="hold",
                    )
                    for i, asset in enumerate(asset_returns)
                ]
                
                frontier.append(EfficientFrontierPoint(
                    expected_return=p_return,
                    volatility=p_vol,
                    sharpe_ratio=sharpe,
                    allocations=allocations,
                ))
        
        # Sort by return for consistency
        frontier.sort(key=lambda x: x.expected_return)
        
        return frontier
    
    def _minimize_volatility_at_target(
        self,
        target_return: float,
        expected_returns: np.ndarray,
        cov_matrix: np.ndarray
    ):
        """Minimize portfolio volatility subject to target return constraint."""
        n_assets = len(expected_returns)
        initial_weights = np.array([1/n_assets] * n_assets)
        
        # Constraints
        constraints = [
            {'type': 'eq', 'fun': lambda x: np.sum(x) - 1},  # Sum to 1
            {'type': 'eq', 'fun': lambda x: np.dot(x, expected_returns) - target_return}  # Target return
        ]
        
        bounds = tuple((0, 1) for _ in range(n_assets))
        
        return minimize(
            self.portfolio_variance,
            initial_weights,
            args=(cov_matrix,),
            method='SLSQP',
            bounds=bounds,
            constraints=constraints,
            options={'maxiter': 1000}
        )
    
    def calculate_diversification_ratio(
        self,
        weights: np.ndarray,
        asset_returns: List[AssetReturn]
    ) -> float:
        """
        Calculate portfolio diversification ratio.
        
        Ratio > 1 indicates diversification benefits.
        Higher is better (less correlated assets).
        """
        cov_matrix = self.calculate_covariance_matrix(asset_returns)
        
        portfolio_vol = np.sqrt(np.dot(weights.T, np.dot(cov_matrix, weights)))
        weighted_vols = np.sqrt(np.diag(cov_matrix)) * weights
        weighted_avg_vol = np.sum(weighted_vols)
        
        return float(weighted_avg_vol / portfolio_vol) if portfolio_vol > 0 else 1.0
    
    def optimize_portfolio(
        self,
        asset_returns: List[AssetReturn],
        current_values: Optional[Dict[str, float]] = None,
        total_portfolio_value: Optional[float] = None
    ) -> OptimizationResult:
        """
        Perform complete portfolio optimization.
        
        Args:
            asset_returns: Historical returns for each asset
            current_values: Current market value of each investment
            total_portfolio_value: Total portfolio value (for weight calculation)
        
        Returns:
            OptimizationResult with all optimization data
        """
        if not asset_returns:
            raise ValueError("At least one asset required for optimization")
        
        # Calculate current weights
        current_weights = None
        if current_values and total_portfolio_value:
            current_weights = np.array([
                current_values.get(asset.investment_id, 0) / total_portfolio_value
                for asset in asset_returns
            ])
        
        # Calculate expected returns and covariance
        expected_returns = self.calculate_expected_returns(asset_returns)
        cov_matrix = self.calculate_covariance_matrix(asset_returns)
        
        # Current portfolio performance (if weights provided)
        if current_weights is not None:
            current_return, current_vol = self.portfolio_performance(
                current_weights, expected_returns, cov_matrix
            )
            current_sharpe = ((current_return / 100 - self.risk_free_rate) / 
                            (current_vol / 100)) if current_vol > 0 else 0
        else:
            current_return = current_vol = current_sharpe = 0
        
        # Optimize for maximum Sharpe ratio
        max_sharpe = self.optimize_maximum_sharpe(
            asset_returns, current_weights
        )
        
        # Optimize for minimum volatility
        min_vol = self.optimize_minimum_volatility(
            asset_returns, current_weights
        )
        
        # Calculate efficient frontier
        frontier = self.calculate_efficient_frontier(
            asset_returns, num_portfolios=30, current_weights=current_weights
        )
        
        # Calculate diversification ratio
        if current_weights is not None:
            div_ratio = self.calculate_diversification_ratio(
                current_weights, asset_returns
            )
        else:
            div_ratio = 1.0
        
        # Calculate correlation matrix
        try:
            corr_matrix = self.calculate_correlation_matrix(asset_returns)
            corr_list = corr_matrix.tolist()
        except Exception:
            corr_list = None
        
        # Generate rebalancing recommendations
        rebalancing_actions = []
        if current_weights is not None:
            for allocation in max_sharpe.allocations:
                diff = allocation.optimal_weight - allocation.current_weight
                if abs(diff) > 0.05:  # 5% threshold
                    action = {
                        "investment_id": allocation.investment_id,
                        "name": allocation.name,
                        "action": "buy" if diff > 0 else "sell",
                        "current_weight": round(allocation.current_weight, 4),
                        "target_weight": round(allocation.optimal_weight, 4),
                        "difference": round(abs(diff), 4),
                    }
                    if total_portfolio_value:
                        action["estimated_amount"] = round(abs(diff) * total_portfolio_value, 2)
                    rebalancing_actions.append(action)
        
        # Risk analysis
        risk_analysis = {
            "current_volatility": round(current_vol, 2),
            "optimal_volatility": round(min_vol.volatility, 2),
            "volatility_reduction": round(current_vol - min_vol.volatility, 2) if current_vol > 0 else 0,
            "diversification_benefit": "high" if div_ratio > 1.5 else "medium" if div_ratio > 1.2 else "low",
        }
        
        return OptimizationResult(
            current_return=current_return,
            current_volatility=current_vol,
            current_sharpe=current_sharpe,
            max_sharpe_portfolio=max_sharpe,
            min_volatility_portfolio=min_vol,
            efficient_frontier=frontier,
            diversification_ratio=div_ratio,
            correlation_matrix=corr_list,
            rebalancing_actions=rebalancing_actions,
            risk_analysis=risk_analysis,
        )


# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================

def calculate_returns_from_values(values: List[float]) -> List[float]:
    """Calculate periodic returns from a series of values."""
    returns = []
    for i in range(1, len(values)):
        if values[i-1] != 0:
            ret = (values[i] - values[i-1]) / values[i-1]
            returns.append(ret)
    return returns


def create_asset_from_valuations(
    investment_id: str,
    name: str,
    category: str,
    valuations: List[Tuple[date, float]]
) -> AssetReturn:
    """
    Create AssetReturn from valuation history.
    
    Args:
        investment_id: Investment ID
        name: Investment name
        category: Investment category
        valuations: List of (date, value) tuples
    
    Returns:
        AssetReturn object
    """
    # Sort by date
    sorted_vals = sorted(valuations, key=lambda x: x[0])
    values = [v for _, v in sorted_vals]
    
    # Calculate returns
    returns = calculate_returns_from_values(values)
    
    return AssetReturn(
        investment_id=investment_id,
        name=name,
        category=category,
        returns=returns,
    )


def quick_optimize(
    returns_data: Dict[str, List[float]],
    risk_free_rate: float = 0.1075
) -> Dict:
    """
    Quick portfolio optimization from returns data.
    
    Args:
        returns_data: Dict mapping asset_id to list of returns
        risk_free_rate: Annual risk-free rate
    
    Returns:
        Dictionary with optimization results
    """
    assets = [
        AssetReturn(
            investment_id=asset_id,
            name=asset_id,
            category="unknown",
            returns=returns,
        )
        for asset_id, returns in returns_data.items()
    ]
    
    optimizer = PortfolioOptimizer(risk_free_rate)
    result = optimizer.optimize_portfolio(assets)
    
    return result.to_dict()
