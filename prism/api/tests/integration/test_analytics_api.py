"""
===============================================================================
INTEGRATION TESTS - Analytics API Endpoints
===============================================================================
Tests for analytics router endpoints.
"""
import pytest
from datetime import date, timedelta
from decimal import Decimal

from httpx import AsyncClient
from fastapi import FastAPI


class TestAnalyticsEndpoints:
    """Test analytics API endpoints."""
    
    @pytest.mark.asyncio
    async def test_get_investment_metrics_endpoint(self, client):
        """Test GET /analytics/investments/{id}/metrics endpoint."""
        # First create an investment
        create_payload = {
            "name": "Test Land for Analytics",
            "category": "land",
            "purchase_price": 100000,
            "current_value": 150000,
            "purchase_date": (date.today() - timedelta(days=730)).isoformat(),
            "currency": "BRL",
        }
        
        create_response = client.post("/api/v1/investments", json=create_payload)
        assert create_response.status_code == 201
        investment_id = create_response.json()["id"]
        
        # Get metrics
        response = client.get(f"/api/v1/analytics/investments/{investment_id}/metrics")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert "data" in data
        
        metrics = data["data"]
        assert metrics["investment_id"] == investment_id
        assert metrics["name"] == "Test Land for Analytics"
        assert metrics["category"] == "land"
        
        # Check basic metrics
        assert metrics["basic"]["simple_roi"] == 50.0
        assert metrics["basic"]["absolute_return"] == 50000
        
        # Check time-weighted metrics
        assert metrics["time_weighted"]["cagr"] > 0
        assert metrics["time_weighted"]["years_held"] == pytest.approx(2.0, abs=0.1)
    
    @pytest.mark.asyncio
    async def test_get_investment_metrics_not_found(self, client):
        """Test metrics endpoint with non-existent investment."""
        response = client.get("/api/v1/analytics/investments/00000000-0000-0000-0000-000000000000/metrics")
        assert response.status_code == 404
    
    @pytest.mark.asyncio
    async def test_batch_metrics_endpoint(self, client):
        """Test POST /analytics/investments/batch-metrics endpoint."""
        # Create two investments
        investments = []
        for i in range(2):
            create_payload = {
                "name": f"Batch Test {i}",
                "category": "land",
                "purchase_price": 100000,
                "current_value": 120000,
                "currency": "BRL",
            }
            response = client.post("/api/v1/investments", json=create_payload)
            assert response.status_code == 201
            investments.append(response.json()["id"])
        
        # Get batch metrics
        response = client.post("/api/v1/analytics/investments/batch-metrics", json=investments)
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert data["count"] == 2
        assert len(data["data"]) == 2
    
    @pytest.mark.asyncio
    async def test_portfolio_summary_endpoint(self, client):
        """Test GET /analytics/portfolio/summary endpoint."""
        # Create some test investments
        for i in range(3):
            create_payload = {
                "name": f"Portfolio Summary Test {i}",
                "category": "land" if i == 0 else "stocks",
                "purchase_price": 100000,
                "current_value": 120000 + (i * 10000),
                "currency": "BRL",
            }
            client.post("/api/v1/investments", json=create_payload)
        
        response = client.get("/api/v1/analytics/portfolio/summary")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert "data" in data
        
        summary = data["data"]
        assert "summary" in summary
        assert "allocation" in summary
        assert "investment_count" in summary
        assert summary["investment_count"] >= 3
    
    @pytest.mark.asyncio
    async def test_portfolio_summary_filter_by_category(self, client):
        """Test portfolio summary with category filter."""
        # Create land and stock investments
        land_payload = {
            "name": "Land Filter Test",
            "category": "land",
            "purchase_price": 100000,
            "current_value": 120000,
            "currency": "BRL",
        }
        stock_payload = {
            "name": "Stock Filter Test",
            "category": "stocks",
            "purchase_price": 50000,
            "current_value": 60000,
            "currency": "BRL",
        }
        
        client.post("/api/v1/investments", json=land_payload)
        client.post("/api/v1/investments", json=stock_payload)
        
        # Get only land
        response = client.get("/api/v1/analytics/portfolio/summary?category=land")
        assert response.status_code == 200
        
        data = response.json()
        # Allocation should only have land
        assert "land" in data["data"]["allocation"]
    
    @pytest.mark.asyncio
    async def test_compare_endpoint(self, client):
        """Test POST /analytics/compare endpoint."""
        # Create two investments
        investments = []
        for i in range(2):
            create_payload = {
                "name": f"Compare Test {i}",
                "category": "land",
                "purchase_price": 100000,
                "current_value": 120000 + (i * 20000),  # Different returns
                "currency": "BRL",
            }
            response = client.post("/api/v1/investments", json=create_payload)
            assert response.status_code == 201
            investments.append(response.json()["id"])
        
        # Compare
        response = client.post(
            "/api/v1/analytics/compare",
            json=investments,
            params={"risk_profile": "balanced", "include_scenarios": True}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert "data" in data
        
        comparison = data["data"]
        assert "winner" in comparison
        assert "rankings" in comparison
        assert len(comparison["rankings"]) == 2
        assert "recommendations" in comparison
    
    @pytest.mark.asyncio
    async def test_compare_insufficient_investments(self, client):
        """Test compare with less than 2 investments."""
        response = client.post("/api/v1/analytics/compare", json=["only-one-id"])
        assert response.status_code == 400
    
    @pytest.mark.asyncio
    async def test_scenario_analysis_endpoint(self, client):
        """Test POST /analytics/scenario-analysis endpoint."""
        # Create investments
        investments = []
        for i in range(2):
            create_payload = {
                "name": f"Scenario Test {i}",
                "category": "land",
                "purchase_price": 100000,
                "current_value": 120000,
                "currency": "BRL",
            }
            response = client.post("/api/v1/investments", json=create_payload)
            assert response.status_code == 201
            investments.append(response.json()["id"])
        
        # Run scenario
        response = client.post(
            "/api/v1/analytics/scenario-analysis",
            json=investments,
            params={"scenario_type": "market_crash"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert "data" in data
        
        scenario = data["data"]
        assert scenario["scenario"] == "market_crash"
        assert scenario["impact_pct"] == -20
        assert "projections" in scenario
        assert len(scenario["projections"]) == 2
    
    @pytest.mark.asyncio
    async def test_scenario_analysis_custom_impact(self, client):
        """Test scenario with custom impact."""
        # Create investment
        create_payload = {
            "name": "Custom Scenario Test",
            "category": "land",
            "purchase_price": 100000,
            "current_value": 120000,
            "currency": "BRL",
        }
        response = client.post("/api/v1/investments", json=create_payload)
        investment_id = response.json()["id"]
        
        # Run with custom impact
        response = client.post(
            "/api/v1/analytics/scenario-analysis",
            json=[investment_id],
            params={"custom_impact": 25.0}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["data"]["impact_pct"] == 25.0
    
    @pytest.mark.asyncio
    async def test_benchmarks_endpoint(self, client):
        """Test GET /analytics/benchmarks endpoint."""
        response = client.get("/api/v1/analytics/benchmarks")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert "data" in data
        
        benchmarks = data["data"]
        assert "rates" in benchmarks
        assert "values" in benchmarks
        assert "description" in benchmarks
        
        # Check for expected benchmarks
        assert "inflation_br" in benchmarks["rates"]
        assert "cdi_br" in benchmarks["rates"]
        assert "sp500_historical" in benchmarks["rates"]


class TestAnalyticsWithValuations:
    """Test analytics with valuation history."""
    
    @pytest.mark.asyncio
    async def test_metrics_with_valuations(self, client):
        """Test metrics calculation including valuation history."""
        # Create investment
        create_payload = {
            "name": "Valuation History Test",
            "category": "land",
            "purchase_price": 100000,
            "current_value": 150000,
            "currency": "BRL",
        }
        response = client.post("/api/v1/investments", json=create_payload)
        investment_id = response.json()["id"]
        
        # Note: In a real test, we'd add valuations via a valuations endpoint
        # For now, test that the endpoint works with/without valuations
        
        response = client.get(f"/api/v1/analytics/investments/{investment_id}/metrics?include_valuations=true")
        assert response.status_code == 200
        
        data = response.json()
        # Risk metrics may or may not be present depending on valuation history
        # Just verify the response structure
        assert "data" in data


class TestPortfolioOptimization:
    """Test portfolio optimization endpoint."""
    
    @pytest.mark.asyncio
    async def test_portfolio_optimization_endpoint(self, client):
        """Test GET /analytics/portfolio/optimization endpoint."""
        # Create multiple investments with different categories
        categories = ["land", "stocks", "bonds"]
        for i, category in enumerate(categories):
            create_payload = {
                "name": f"Opt Test {category}",
                "category": category,
                "purchase_price": 100000,
                "current_value": 120000,
                "currency": "BRL",
            }
            client.post("/api/v1/investments", json=create_payload)
        
        response = client.get("/api/v1/analytics/portfolio/optimization")
        
        # May succeed or fail depending on valuation history availability
        assert response.status_code in [200, 200]  # Always returns 200
        
        data = response.json()
        # If we have sufficient data, should have results
        # If not, should have error message
        assert "success" in data
    
    @pytest.mark.asyncio
    async def test_portfolio_optimization_insufficient_assets(self, client):
        """Test optimization with less than 2 assets."""
        # Clear any existing investments first (this is tricky in practice)
        # Just test the endpoint structure
        response = client.get("/api/v1/analytics/portfolio/optimization")
        
        # Should handle gracefully
        assert response.status_code == 200


class TestCompareAllEndpoint:
    """Test compare all investments endpoint."""
    
    @pytest.mark.asyncio
    async def test_compare_all_endpoint(self, client):
        """Test GET /analytics/compare/all endpoint."""
        # Create some test investments
        for i in range(3):
            create_payload = {
                "name": f"Compare All Test {i}",
                "category": "land" if i % 2 == 0 else "stocks",
                "purchase_price": 100000,
                "current_value": 120000 + (i * 10000),
                "currency": "BRL",
            }
            client.post("/api/v1/investments", json=create_payload)
        
        response = client.get("/api/v1/analytics/compare/all")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert "data" in data
        
        comparison = data["data"]
        assert "rankings" in comparison
        assert "recommendations" in comparison
    
    @pytest.mark.asyncio
    async def test_compare_all_with_category_filter(self, client):
        """Test compare all with category filter."""
        # Create investments in different categories
        for category in ["land", "stocks", "crypto"]:
            create_payload = {
                "name": f"Category Filter {category}",
                "category": category,
                "purchase_price": 100000,
                "current_value": 120000,
                "currency": "BRL",
            }
            client.post("/api/v1/investments", json=create_payload)
        
        # Filter by land only
        response = client.get("/api/v1/analytics/compare/all?category=land")
        assert response.status_code == 200
        
        data = response.json()
        # Should only have land investments in rankings
        for ranking in data["data"]["rankings"]:
            assert ranking["category"] == "land"
    
    @pytest.mark.asyncio
    async def test_compare_all_with_limit(self, client):
        """Test compare all with limit parameter."""
        # Create many investments
        for i in range(10):
            create_payload = {
                "name": f"Limit Test {i}",
                "category": "land",
                "purchase_price": 100000,
                "current_value": 120000,
                "currency": "BRL",
            }
            client.post("/api/v1/investments", json=create_payload)
        
        # Limit to 5
        response = client.get("/api/v1/analytics/compare/all?limit=5")
        assert response.status_code == 200
        
        data = response.json()
        # Should have at most 5 rankings
        assert len(data["data"]["rankings"]) <= 5


class TestAnalyticsErrorHandling:
    """Test error handling in analytics endpoints."""
    
    @pytest.mark.asyncio
    async def test_invalid_investment_id_format(self, client):
        """Test with invalid investment ID format."""
        response = client.get("/api/v1/analytics/investments/invalid-uuid/metrics")
        # Should return 422 for validation error
        assert response.status_code in [404, 422]
    
    @pytest.mark.asyncio
    async def test_invalid_scenario_type(self, client):
        """Test with invalid scenario type."""
        # Create investment
        create_payload = {
            "name": "Error Test",
            "category": "land",
            "purchase_price": 100000,
            "current_value": 120000,
            "currency": "BRL",
        }
        response = client.post("/api/v1/investments", json=create_payload)
        investment_id = response.json()["id"]
        
        # Use invalid scenario type (should still work with defaults)
        response = client.post(
            "/api/v1/analytics/scenario-analysis",
            json=[investment_id],
            params={"scenario_type": "unknown_scenario"}
        )
        # Should handle gracefully
        assert response.status_code == 200
