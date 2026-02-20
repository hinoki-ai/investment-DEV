"""
===============================================================================
INTEGRATION TESTS - Upload Flow
===============================================================================
Tests the complete upload → analysis pipeline
"""
import pytest
from unittest.mock import patch, MagicMock


class TestUploadFlow:
    """Test the complete upload flow from request to processing."""
    
    @pytest.mark.asyncio
    async def test_request_upload_url(self, client, mock_storage_service):
        """Test requesting a pre-signed upload URL."""
        request_data = {
            "filename": "test-document.pdf",
            "content_type": "application/pdf",
            "file_size": 1024000,
            "investment_id": None,
        }
        
        response = client.post("/api/v1/uploads/request-url", json=request_data)
        
        assert response.status_code == 200
        data = response.json()
        assert "upload_url" in data
        assert "file_id" in data
        assert data["original_filename"] == "test-document.pdf"
    
    @pytest.mark.asyncio
    async def test_confirm_upload(self, client, db_session):
        """Test confirming a file upload."""
        # First create a file registry entry
        from models import FileRegistry, FileStatus
        import uuid
        
        file = FileRegistry(
            id=uuid.uuid4(),
            original_filename="confirm-test.pdf",
            storage_key="uploads/confirm-test.pdf",
            storage_bucket="test-bucket",
            file_size_bytes=1024000,
            mime_type="application/pdf",
            status=FileStatus.PENDING,
        )
        db_session.add(file)
        await db_session.commit()
        
        # Confirm the upload
        confirm_data = {
            "file_id": str(file.id),
            "storage_key": "uploads/confirm-test.pdf",
            "file_size": 1024000,
            "mime_type": "application/pdf",
            "trigger_analysis": True,
        }
        
        response = client.post("/api/v1/uploads/confirm", json=confirm_data)
        
        assert response.status_code in [200, 202]
        data = response.json()
        assert data["status"] in ["processing", "completed", "pending"]
    
    @pytest.mark.asyncio
    async def test_upload_with_investment(self, client, db_session):
        """Test upload linked to a specific investment."""
        from models import Investment, InvestmentCategory
        import uuid
        
        # Create an investment
        investment = Investment(
            id=uuid.uuid4(),
            name="Upload Test Investment",
            category=InvestmentCategory.LAND,
        )
        db_session.add(investment)
        await db_session.commit()
        
        # Request upload URL with investment_id
        request_data = {
            "filename": "investment-doc.pdf",
            "content_type": "application/pdf",
            "file_size": 512000,
            "investment_id": str(investment.id),
        }
        
        response = client.post("/api/v1/uploads/request-url", json=request_data)
        
        assert response.status_code == 200
        data = response.json()
        assert "upload_url" in data
        assert "file_id" in data


class TestFileManagement:
    """Test file management endpoints."""
    
    @pytest.mark.asyncio
    async def test_list_files(self, client):
        """Test listing files."""
        response = client.get("/api/v1/files")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    @pytest.mark.asyncio
    async def test_list_files_with_filters(self, client):
        """Test listing files with status filter."""
        response = client.get("/api/v1/files?status=completed&limit=10")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    @pytest.mark.asyncio
    async def test_get_file_download_url(self, client, db_session, mock_storage_service):
        """Test getting a download URL for a file."""
        from models import FileRegistry, FileStatus
        import uuid
        
        # Create a file
        file = FileRegistry(
            id=uuid.uuid4(),
            original_filename="download-test.pdf",
            storage_key="uploads/download-test.pdf",
            storage_bucket="test-bucket",
            status=FileStatus.COMPLETED,
        )
        db_session.add(file)
        await db_session.commit()
        
        # Get download URL
        response = client.get(f"/api/v1/files/{file.id}/download-url")
        
        assert response.status_code == 200
        data = response.json()
        assert "download_url" in data


class TestAnalysisPipeline:
    """Test analysis pipeline integration."""
    
    @pytest.mark.asyncio
    async def test_list_processing_jobs(self, client):
        """Test listing processing jobs."""
        response = client.get("/api/v1/analysis/jobs")
        
        assert response.status_code == 200
        data = response.json()
        assert "jobs" in data or isinstance(data, list)
    
    @pytest.mark.asyncio
    async def test_list_analysis_results(self, client):
        """Test listing analysis results."""
        response = client.get("/api/v1/analysis/results")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    @pytest.mark.asyncio
    async def test_get_queue_stats(self, client):
        """Test getting analysis queue statistics."""
        response = client.get("/api/v1/analysis/queue/stats")
        
        assert response.status_code == 200
        data = response.json()
        # Verify expected fields exist
        assert any(key in data for key in ["queued", "running", "completed", "failed", "pending"])
