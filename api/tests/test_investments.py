"""
Investment API Endpoint Tests
"""
import pytest
from fastapi.testclient import TestClient


def test_list_investments(client: TestClient):
    """Test listing investments."""
    response = client.get("/api/v1/investments")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


def test_create_investment(client: TestClient):
    """Test creating a new investment."""
    payload = {
        "name": "Test Land Investment",
        "category": "land",
        "initial_value": 100000,
        "currency": "USD",
        "location": "Test Location",
        "description": "Test description"
    }
    response = client.post("/api/v1/investments", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == payload["name"]
    assert data["category"] == payload["category"]


def test_get_investment(client: TestClient):
    """Test getting a specific investment."""
    # First create an investment
    payload = {
        "name": "Test Investment",
        "category": "land",
        "initial_value": 50000,
        "currency": "USD"
    }
    create_response = client.post("/api/v1/investments", json=payload)
    investment_id = create_response.json()["id"]
    
    # Now get it
    response = client.get(f"/api/v1/investments/{investment_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == investment_id


def test_update_investment(client: TestClient):
    """Test updating an investment."""
    # Create first
    payload = {
        "name": "Original Name",
        "category": "land",
        "initial_value": 50000,
        "currency": "USD"
    }
    create_response = client.post("/api/v1/investments", json=payload)
    investment_id = create_response.json()["id"]
    
    # Update
    update_payload = {"name": "Updated Name"}
    response = client.put(f"/api/v1/investments/{investment_id}", json=update_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Updated Name"


def test_delete_investment(client: TestClient):
    """Test deleting an investment."""
    # Create first
    payload = {
        "name": "To Delete",
        "category": "land",
        "initial_value": 50000,
        "currency": "USD"
    }
    create_response = client.post("/api/v1/investments", json=payload)
    investment_id = create_response.json()["id"]
    
    # Delete
    response = client.delete(f"/api/v1/investments/{investment_id}")
    assert response.status_code == 204
    
    # Verify it's gone
    get_response = client.get(f"/api/v1/investments/{investment_id}")
    assert get_response.status_code == 404
