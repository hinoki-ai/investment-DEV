"""
===============================================================================
INVESTMENT COMPARISON ENGINE - Compare Multiple Investments
===============================================================================
Provides ranking, scenario analysis, and recommendations for investments.
"""
from dataclasses import dataclass, field
from typing import List, Dict, Optional, Callable, Tuple
from datetime import date
from enum import Enum


# =============================================================================
# SCORING WEIGHTS
# =============================================================================

DEFAULT_SCORING_WEIGHTS = {
    "roi": 0.25,
    "cagr": 0.25,
    "sharpe": 0.20,
    "max_drawdown": 0.15,  # Lower is better (inverted in scoring)
    "payback_period": 0.15,  # Lower is better (inverted in scoring)
}

RISK_AVERSE_WEIGHTS = {
    "roi": 0.20,
    "cagr": 0.15,
    "sharpe": 0.30,
    "max_drawdown": 0.25,
    "payback_period": 0.10,
}

RETURN_FOCUSED_WEIGHTS = {
    "roi": 0.35,
    "cagr": 0.30,
    "sharpe": 0.15,
    "max_drawdown": 0.10,
    "payback_period": 0.10,
}


# =============================================================================
# DATA CLASSES
# =============================================================================

@dataclass
class ScoredInvestment:
    """Investment with calculated scores."""
    investment_id: str
    name: str
    category: str
    metrics: Dict  # Financial metrics
    
    # Scores
    composite_score: float
    risk_adjusted_score: Optional[float]
    
    # Rankings
    roi_rank: int = 0
    cagr_rank: int = 0
    sharpe_rank: int = 0
    composite_rank: int = 0
    
    def to_dict(self) -> Dict:
        return {
            "investment_id": str(self.investment_id),
            "name": self.name,
            "category": self.category,
            "metrics": {
                "simple_roi": round(self.metrics.get("simple_roi", 0), 2),
                "cagr": round(self.metrics.get("cagr", 0), 2),
                "irr": round(self.metrics.get("irr", 0), 2) if self.metrics.get("irr") else None,
                "sharpe_ratio": round(self.metrics.get("sharpe_ratio", 0), 2) if self.metrics.get("sharpe_ratio") else None,
                "max_drawdown": round(self.metrics.get("max_drawdown", 0), 2) if self.metrics.get("max_drawdown") else None,
            },
            "scores": {
                "composite": round(self.composite_score, 2),
                "risk_adjusted": round(self.risk_adjusted_score, 2) if self.risk_adjusted_score else None,
            },
            "rankings": {
                "composite": self.composite_rank,
                "roi": self.roi_rank,
                "cagr": self.cagr_rank,
                "sharpe": self.sharpe_rank,
            },
        }


@dataclass
class ComparisonResult:
    """Result of comparing multiple investments."""
    
    # Winner
    winner_id: str
    winner_name: str
    winner_score: float
    
    # Rankings
    rankings: List[ScoredInvestment]
    
    # Analysis
    total_portfolio_value: float
    total_invested: float
    total_return_pct: float
    avg_roi: float
    avg_cagr: float
    
    # Risk metrics
    portfolio_concentration: Dict[str, float]
    risk_distribution: Dict[str, int]
    
    # Side-by-side comparison
    metrics_comparison: Dict[str, Dict[str, float]]
    
    # Risk-adjusted rankings
    risk_adjusted_ranking: List[Dict]
    
    # Scenario analysis
    scenario_results: Optional[Dict]
    
    # Recommendations
    recommendations: List[str]
    warnings: List[str]
    opportunities: List[str]
    
    def to_dict(self) -> Dict:
        return {
            "winner": {
                "id": str(self.winner_id),
                "name": self.winner_name,
                "score": round(self.winner_score, 2),
            },
            "rankings": [r.to_dict() for r in self.rankings],
            "portfolio_summary": {
                "total_value": round(self.total_portfolio_value, 2),
                "total_invested": round(self.total_invested, 2),
                "total_return_pct": round(self.total_return_pct, 2),
                "avg_roi": round(self.avg_roi, 2),
                "avg_cagr": round(self.avg_cagr, 2),
            },
            "risk_analysis": {
                "concentration": self.portfolio_concentration,
                "distribution": self.risk_distribution,
            },
            "metrics_comparison": self.metrics_comparison,
            "risk_adjusted_ranking": self.risk_adjusted_ranking,
            "scenarios": self.scenario_results,
            "recommendations": self.recommendations,
            "warnings": self.warnings,
            "opportunities": self.opportunities,
        }


@dataclass
class ScenarioResult:
    """Result of a what-if scenario."""
    name: str
    description: str
    impact_pct: float
    
    # Projected values
    projected_values: Dict[str, float]  # investment_id -> projected value
    projected_rois: Dict[str, float]
    portfolio_impact: float
    
    def to_dict(self) -> Dict:
        return {
            "name": self.name,
            "description": self.description,
            "impact_pct": self.impact_pct,
            "portfolio_impact": round(self.portfolio_impact, 2),
            "investment_impacts": {
                inv_id: {
                    "projected_value": round(self.projected_values.get(inv_id, 0), 2),
                    "projected_roi": round(self.projected_rois.get(inv_id, 0), 2),
                }
                for inv_id in self.projected_values.keys()
            },
        }


# =============================================================================
# INVESTMENT COMPARATOR
# =============================================================================

class InvestmentComparator:
    """Compare and rank multiple investments."""
    
    def __init__(self, weights: Optional[Dict[str, float]] = None):
        """
        Initialize comparator with scoring weights.
        
        Args:
            weights: Scoring weights dict. Uses DEFAULT_SCORING_WEIGHTS if None.
        """
        self.weights = weights or DEFAULT_SCORING_WEIGHTS
    
    def _normalize_score(self, value: float, min_val: float, max_val: float, invert: bool = False) -> float:
        """Normalize a value to 0-100 scale."""
        if max_val == min_val:
            return 50.0
        
        normalized = (value - min_val) / (max_val - min_val) * 100
        normalized = max(0, min(100, normalized))  # Clamp to 0-100
        
        if invert:
            normalized = 100 - normalized
        
        return normalized
    
    def calculate_composite_score(self, metrics: Dict) -> float:
        """
        Calculate weighted composite score for an investment.
        
        All metrics are normalized to 0-100 scale before weighting.
        """
        score = 0.0
        
        # ROI Score (-50% to +100% mapped to 0-100)
        roi = metrics.get("simple_roi", 0) or 0
        roi_score = self._normalize_score(roi, -50, 100)
        score += roi_score * self.weights["roi"]
        
        # CAGR Score (-50% to +100% mapped to 0-100)
        cagr = metrics.get("cagr", 0) or 0
        cagr_score = self._normalize_score(cagr, -50, 100)
        score += cagr_score * self.weights["cagr"]
        
        # Sharpe Ratio Score (-1 to 3 mapped to 0-100)
        sharpe = metrics.get("sharpe_ratio", 0) or 0
        sharpe_score = self._normalize_score(sharpe, -1, 3)
        score += sharpe_score * self.weights["sharpe"]
        
        # Max Drawdown Score (lower is better, 0-50% mapped to 100-0)
        drawdown = metrics.get("max_drawdown", 0) or 0
        drawdown_score = self._normalize_score(drawdown, 0, 50, invert=True)
        score += drawdown_score * self.weights["max_drawdown"]
        
        # Payback Period Score (shorter is better, 0-10 years mapped to 100-0)
        payback = metrics.get("payback_period_months", 999) or 999
        payback_years = payback / 12
        payback_score = self._normalize_score(payback_years, 0, 10, invert=True)
        score += payback_score * self.weights["payback_period"]
        
        return score
    
    def compare_investments(
        self,
        investments: List[Dict],
        metrics_list: List[Dict],
        run_scenarios: bool = True
    ) -> ComparisonResult:
        """
        Compare multiple investments and return comprehensive analysis.
        
        Args:
            investments: List of investment dicts with id, name, category, current_value, purchase_price
            metrics_list: List of calculated metrics for each investment (from FinancialMetricsEngine)
            run_scenarios: Whether to run scenario analysis
        
        Returns:
            ComparisonResult with rankings, analysis, and recommendations
        """
        if not investments or not metrics_list or len(investments) != len(metrics_list):
            raise ValueError("Investments and metrics must be provided and have same length")
        
        # Calculate scores for each investment
        scored_investments = []
        for inv, metrics in zip(investments, metrics_list):
            composite_score = self.calculate_composite_score(metrics)
            
            # Calculate risk-adjusted score (Calmar ratio based)
            calmar = None
            if metrics.get("cagr") and metrics.get("max_drawdown") and metrics["max_drawdown"] > 0:
                calmar = metrics["cagr"] / metrics["max_drawdown"]
            
            scored = ScoredInvestment(
                investment_id=inv["id"],
                name=inv["name"],
                category=inv.get("category", "unknown"),
                metrics=metrics,
                composite_score=composite_score,
                risk_adjusted_score=calmar,
            )
            scored_investments.append(scored)
        
        # Calculate rankings
        sorted_by_roi = sorted(scored_investments, key=lambda x: x.metrics.get("simple_roi", 0) or 0, reverse=True)
        sorted_by_cagr = sorted(scored_investments, key=lambda x: x.metrics.get("cagr", 0) or 0, reverse=True)
        sorted_by_sharpe = sorted(scored_investments, key=lambda x: x.metrics.get("sharpe_ratio", 0) or 0, reverse=True)
        sorted_by_composite = sorted(scored_investments, key=lambda x: x.composite_score, reverse=True)
        
        # Assign rankings
        for i, s in enumerate(sorted_by_roi):
            s.roi_rank = i + 1
        for i, s in enumerate(sorted_by_cagr):
            s.cagr_rank = i + 1
        for i, s in enumerate(sorted_by_sharpe):
            s.sharpe_rank = i + 1
        for i, s in enumerate(sorted_by_composite):
            s.composite_rank = i + 1
        
        # Calculate portfolio metrics
        total_value = sum(inv.get("current_value", 0) for inv in investments)
        total_invested = sum(inv.get("purchase_price", 0) for inv in investments)
        total_return_pct = ((total_value - total_invested) / total_invested * 100) if total_invested > 0 else 0
        avg_roi = sum(s.metrics.get("simple_roi", 0) or 0 for s in scored_investments) / len(scored_investments)
        avg_cagr = sum(s.metrics.get("cagr", 0) or 0 for s in scored_investments) / len(scored_investments)
        
        # Category concentration
        category_values: Dict[str, float] = {}
        for inv in investments:
            cat = inv.get("category", "unknown")
            category_values[cat] = category_values.get(cat, 0) + inv.get("current_value", 0)
        
        portfolio_concentration = {
            cat: round(val / total_value * 100, 2) if total_value > 0 else 0
            for cat, val in category_values.items()
        }
        
        # Risk distribution
        risk_distribution = {"low": 0, "medium": 0, "high": 0}
        for s in scored_investments:
            vol = s.metrics.get("volatility")
            if vol is None:
                risk_distribution["medium"] += 1
            elif vol < 15:
                risk_distribution["low"] += 1
            elif vol < 30:
                risk_distribution["medium"] += 1
            else:
                risk_distribution["high"] += 1
        
        # Build metrics comparison table
        metrics_comparison = {}
        for metric in ["simple_roi", "cagr", "irr", "sharpe_ratio", "max_drawdown", "volatility"]:
            metrics_comparison[metric] = {
                s.investment_id: round(s.metrics.get(metric, 0) or 0, 2)
                for s in scored_investments
            }
        
        # Risk-adjusted ranking (by Calmar ratio)
        risk_adjusted = sorted(
            [s for s in scored_investments if s.risk_adjusted_score is not None],
            key=lambda x: x.risk_adjusted_score or 0,
            reverse=True
        )
        risk_adjusted_ranking = [
            {
                "rank": i + 1,
                "investment_id": s.investment_id,
                "name": s.name,
                "calmar_ratio": round(s.risk_adjusted_score, 2),
                "cagr": round(s.metrics.get("cagr", 0) or 0, 2),
                "max_drawdown": round(s.metrics.get("max_drawdown", 0) or 0, 2),
            }
            for i, s in enumerate(risk_adjusted)
        ]
        
        # Scenario analysis
        scenario_results = None
        if run_scenarios and len(investments) > 0:
            scenario_results = self.run_scenarios(investments, metrics_list)
        
        # Generate recommendations
        recommendations, warnings, opportunities = self._generate_analysis(
            scored_investments, investments, total_value, portfolio_concentration
        )
        
        winner = sorted_by_composite[0]
        
        return ComparisonResult(
            winner_id=winner.investment_id,
            winner_name=winner.name,
            winner_score=winner.composite_score,
            rankings=sorted_by_composite,
            total_portfolio_value=total_value,
            total_invested=total_invested,
            total_return_pct=total_return_pct,
            avg_roi=avg_roi,
            avg_cagr=avg_cagr,
            portfolio_concentration=portfolio_concentration,
            risk_distribution=risk_distribution,
            metrics_comparison=metrics_comparison,
            risk_adjusted_ranking=risk_adjusted_ranking,
            scenario_results=scenario_results,
            recommendations=recommendations,
            warnings=warnings,
            opportunities=opportunities,
        )
    
    def _generate_analysis(
        self,
        scored: List[ScoredInvestment],
        investments: List[Dict],
        total_value: float,
        concentration: Dict[str, float]
    ) -> Tuple[List[str], List[str], List[str]]:
        """Generate recommendations, warnings, and opportunities."""
        recommendations = []
        warnings = []
        opportunities = []
        
        if not scored:
            return recommendations, warnings, opportunities
        
        # Top performer
        winner = scored[0]
        recommendations.append(
            f"🏆 {winner.name} is your best performer "
            f"with a composite score of {winner.composite_score:.1f} "
            f"({winner.metrics.get('simple_roi', 0):.1f}% ROI)"
        )
        
        # Worst performer
        if len(scored) > 1:
            loser = scored[-1]
            roi = loser.metrics.get('simple_roi', 0) or 0
            if roi < 0:
                warnings.append(
                    f"⚠️ {loser.name} is underperforming with {roi:.1f}% ROI. "
                    f"Consider reviewing this investment."
                )
            elif roi < 5:
                recommendations.append(
                    f"📊 {loser.name} has modest returns ({roi:.1f}% ROI). "
                    f"Monitor for improvement or consider reallocation."
                )
        
        # Diversification check
        if len(concentration) < 3:
            warnings.append(
                f"📊 Your portfolio is concentrated in {len(concentration)} categories. "
                f"Consider diversifying across land, stocks, bonds, etc."
            )
        else:
            # Check if any category > 50%
            for cat, pct in concentration.items():
                if pct > 50:
                    warnings.append(
                        f"⚠️ {pct:.1f}% of your portfolio is in {cat}. "
                        f"Consider reducing concentration risk."
                    )
        
        # High risk check
        high_risk = [s for s in scored if (s.metrics.get("volatility") or 0) > 30]
        if high_risk:
            warnings.append(
                f"⚡ {len(high_risk)} investment(s) show high volatility (>30%). "
                f"Review risk management strategies."
            )
        
        # Best Sharpe ratio
        sharpe_sorted = sorted(
            [s for s in scored if s.metrics.get("sharpe_ratio")],
            key=lambda x: x.metrics.get("sharpe_ratio", 0) or 0,
            reverse=True
        )
        if sharpe_sorted:
            best_sharpe = sharpe_sorted[0]
            opportunities.append(
                f"💎 {best_sharpe.name} has the best risk-adjusted return "
                f"(Sharpe: {best_sharpe.metrics.get('sharpe_ratio', 0):.2f})"
            )
        
        # Opportunity: Consider adding more to best performers
        for s in scored[:2]:
            if s.composite_score > 70:
                opportunities.append(
                    f"💰 Consider increasing allocation to {s.name} "
                    f"- strong performance with composite score {s.composite_score:.1f}"
                )
        
        return recommendations, warnings, opportunities
    
    def run_scenarios(
        self,
        investments: List[Dict],
        metrics_list: List[Dict],
        scenarios: Optional[List[Dict]] = None
    ) -> Dict:
        """
        Run what-if scenario analysis.
        
        Default scenarios:
        - Market crash (-20%)
        - Market correction (-10%)
        - Market boom (+30%)
        - Inflation spike (+5% real impact)
        """
        if scenarios is None:
            scenarios = [
                {"name": "market_crash", "description": "Market Crash (-20%)", "impact_pct": -20},
                {"name": "market_correction", "description": "Market Correction (-10%)", "impact_pct": -10},
                {"name": "market_boom", "description": "Market Boom (+30%)", "impact_pct": 30},
                {"name": "inflation_spike", "description": "Inflation Spike", "impact_pct": -5},
            ]
        
        results = {}
        total_value = sum(inv.get("current_value", 0) for inv in investments)
        
        for scenario in scenarios:
            name = scenario["name"]
            description = scenario["description"]
            impact = scenario["impact_pct"] / 100
            
            projected_values = {}
            projected_rois = {}
            total_projected = 0
            
            for inv, metrics in zip(investments, metrics_list):
                inv_id = inv["id"]
                current_value = inv.get("current_value", 0)
                purchase_price = inv.get("purchase_price", 0)
                
                # Calculate projected value
                new_value = current_value * (1 + impact)
                
                # Calculate new ROI
                if purchase_price > 0:
                    new_roi = ((new_value - purchase_price) / purchase_price) * 100
                else:
                    new_roi = 0
                
                projected_values[inv_id] = new_value
                projected_rois[inv_id] = new_roi
                total_projected += new_value
            
            # Calculate portfolio impact
            portfolio_impact = ((total_projected - total_value) / total_value * 100) if total_value > 0 else 0
            
            results[name] = ScenarioResult(
                name=name,
                description=description,
                impact_pct=scenario["impact_pct"],
                projected_values=projected_values,
                projected_rois=projected_rois,
                portfolio_impact=portfolio_impact,
            ).to_dict()
        
        return results
    
    def calculate_liquidity_score(
        self,
        investment: Dict,
        metrics: Dict
    ) -> float:
        """
        Calculate a liquidity score (0-100) for an investment.
        
        Higher score = more liquid (easier to sell quickly)
        """
        # Base score by category
        category_scores = {
            "stocks": 90,
            "crypto": 80,
            "bonds": 70,
            "gold": 60,
            "real_estate": 30,
            "land": 20,
            "other": 40,
        }
        
        base_score = category_scores.get(investment.get("category", "").lower(), 40)
        
        # Adjust by holding period
        years_held = metrics.get("years_held", 0) or 0
        if years_held > 5:
            base_score += 5  # Longer held = more stable
        
        # Adjust by ROI (positive ROI = easier to sell)
        roi = metrics.get("simple_roi", 0) or 0
        if roi > 20:
            base_score += 5
        elif roi < -10:
            base_score -= 10
        
        return max(0, min(100, base_score))


# =============================================================================
# FACTORY FUNCTIONS
# =============================================================================

def create_risk_averse_comparator() -> InvestmentComparator:
    """Create comparator optimized for risk-averse investors."""
    return InvestmentComparator(weights=RISK_AVERSE_WEIGHTS)


def create_return_focused_comparator() -> InvestmentComparator:
    """Create comparator optimized for return-focused investors."""
    return InvestmentComparator(weights=RETURN_FOCUSED_WEIGHTS)


def quick_compare(
    investments: List[Dict],
    metrics_list: List[Dict],
    risk_profile: str = "balanced"
) -> Dict:
    """
    Quick comparison function.
    
    Args:
        investments: List of investment data
        metrics_list: List of metrics from FinancialMetricsEngine
        risk_profile: "conservative", "balanced", or "aggressive"
    
    Returns:
        Comparison result as dictionary
    """
    if risk_profile == "conservative":
        comparator = create_risk_averse_comparator()
    elif risk_profile == "aggressive":
        comparator = create_return_focused_comparator()
    else:
        comparator = InvestmentComparator()
    
    result = comparator.compare_investments(investments, metrics_list)
    return result.to_dict()
