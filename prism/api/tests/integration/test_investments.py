"""
===============================================================================
INTEGRATION TESTS - Investments API
===============================================================================
"""
import pytest
from decimal import Decimal


class TestInvestmentsAPI:
    """Test investment CRUD operations."""
    
    @pytest.mark.asyncio
    async def test_list_investments(self, client):
        """Test listing all investments."""
        response = client.get("/api/v1/investments")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    @pytest.mark.asyncio
    async def test_list_investments_with_filters(self, client):
        """Test listing investments with category filter."""
        response = client.get("/api/v1/investments?category=land")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    @pytest.mark.asyncio
    async def test_create_investment(self, client, sample_investment_data):
        """Test creating a new investment."""
        response = client.post("/api/v1/investments", json=sample_investment_data)
        
        assert response.status_code in [200, 201]
        data = response.json()
        assert data["name"] == sample_investment_data["name"]
        assert data["category"] == sample_investment_data["category"]
        assert "id" in data
    
    @pytest.mark.asyncio
    async def test_create_investment_validation(self, client):
        """Test investment creation validation."""
        # Missing required fields
        invalid_data = {
            "description": "Missing required fields"
        }
        
        response = client.post("/api/v1/investments", json=invalid_data)
        
        assert response.status_code == 422
    
    @pytest.mark.asyncio
    async def test_get_investment(self, client, db_session):
        """Test getting a specific investment."""
        from models import Investment, InvestmentCategory
        import uuid
        
        # Create an investment
        investment = Investment(
            id=uuid.uuid4(),
            name="Get Test Investment",
            category=InvestmentCategory.LAND,
            purchase_price=Decimal("100000.00"),
        )
        db_session.add(investment)
        await db_session.commit()
        
        # Get the investment
        response = client.get(f"/api/v1/investments/{investment.id}")
        
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Get Test Investment"
        assert data["category"] == "land"
    
    @pytest.mark.asyncio
    async def test_get_investment_not_found(self, client):
        """Test getting a non-existent investment."""
        import uuid
        
        response = client.get(f"/api/v1/investments/{uuid.uuid4()}")
        
        assert response.status_code == 404
    
    @pytest.mark.asyncio
    async def test_update_investment(self, client, db_session):
        """Test updating an investment."""
        from models import Investment, InvestmentCategory
        import uuid
        
        # Create an investment
        investment = Investment(
            id=uuid.uuid4(),
            name="Update Test Investment",
            category=InvestmentCategory.LAND,
        )
        db_session.add(investment)
        await db_session.commit()
        
        # Update the investment
        update_data = {
            "name": "Updated Investment Name",
            "current_value": 150000.00,
        }
        
        response = client.put(f"/api/v1/investments/{investment.id}", json=update_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Investment Name"
    
    @pytest.mark.asyncio
    async def test_delete_investment(self, client, db_session):
        """Test deleting an investment."""
        from models import Investment, InvestmentCategory
        import uuid
        
        # Create an investment
        investment = Investment(
            id=uuid.uuid4(),
            name="Delete Test Investment",
            category=InvestmentCategory.LAND,
        )
        db_session.add(investment)
        await db_session.commit()
        
        # Delete the investment
        response = client.delete(f"/api/v1/investments/{investment.id}")
        
        assert response.status_code in [200, 204]
        
        # Verify it's deleted
        get_response = client.get(f"/api/v1/investments/{investment.id}")
        assert get_response.status_code == 404


class TestInvestmentFiltering:
    """Test investment filtering and search."""
    
    @pytest.mark.asyncio
    async def test_filter_by_category(self, client, db_session):
        """Test filtering investments by category."""
        from models import Investment, InvestmentCategory
        import uuid
        
        # Create investments in different categories
        for i, category in enumerate([InvestmentCategory.LAND, InvestmentCategory.STOCKS]):
            investment = Investment(
                id=uuid.uuid4(),
                name=f"Filter Test {category.value}",
                category=category,
            )
            db_session.add(investment)
        
        await db_session.commit()
        
        # Filter by land category
        response = client.get("/api/v1/investments?category=land")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        for item in data:
            assert item["category"] == "land"
    
    @pytest.mark.asyncio
    async def test_filter_by_status(self, client, db_session):
        """Test filtering investments by status."""
        from models import Investment, InvestmentCategory, InvestmentStatus
        import uuid
        
        # Create investments with different statuses
        for i, status in enumerate([InvestmentStatus.ACTIVE, InvestmentStatus.SOLD]):
            investment = Investment(
                id=uuid.uuid4(),
                name=f"Status Test {status.value}",
                category=InvestmentCategory.LAND,
                status=status,
            )
            db_session.add(investment)
        
        await db_session.commit()
        
        # Filter by active status
        response = client.get("/api/v1/investments?status=active")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)


class TestDashboardAPI:
    """Test dashboard endpoints."""
    
    @pytest.mark.asyncio
    async def test_get_dashboard_stats(self, client):
        """Test getting dashboard statistics."""
        response = client.get("/api/v1/dashboard/stats")
        
        assert response.status_code == 200
        data = response.json()
        # Verify expected fields exist
        assert any(key in data for key in [
            "total_investments", "total_value", "total_return",
            "active_investments", "categories"
        ])
    
    @pytest.mark.asyncio
    async def test_get_category_breakdown(self, client):
        """Test getting category breakdown."""
        response = client.get("/api/v1/dashboard/category-breakdown")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list) or isinstance(data, dict)
