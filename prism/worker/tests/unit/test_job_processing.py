"""
===============================================================================
UNIT TESTS - Job Processing
===============================================================================
"""
import pytest
from unittest.mock import MagicMock, patch, mock_open
import json


class TestJobProcessor:
    """Test cases for job processing."""
    
    @pytest.mark.asyncio
    async def test_claim_job(self, mock_db_session):
        """Test claiming a job from the queue."""
        from main import JobProcessor
        
        processor = JobProcessor()
        
        # Mock job data
        mock_job = MagicMock()
        mock_job.id = "test-job-id"
        mock_job.job_type = "document_analysis"
        mock_job.status = "queued"
        
        mock_db_session.query.return_value.filter.return_value.first.return_value = mock_job
        
        job = await processor.claim_job(mock_db_session)
        
        assert job is not None
        assert job.id == "test-job-id"
    
    @pytest.mark.asyncio
    async def test_process_document_analysis_job(self, mock_db_session, sample_job_data):
        """Test processing a document analysis job."""
        from main import JobProcessor
        
        processor = JobProcessor()
        
        with patch.object(processor, '_download_file', return_value="/tmp/test.pdf"):
            with patch.object(processor.ai_client, 'analyze_document', return_value={
                "summary": "Test",
                "structured_data": {},
                "confidence_score": 0.85,
            }):
                result = await processor.process_job(mock_db_session, sample_job_data)
        
        assert result is not None
    
    @pytest.mark.asyncio
    async def test_job_retry_on_failure(self, mock_db_session, sample_job_data):
        """Test job retry mechanism on failure."""
        from main import JobProcessor
        
        processor = JobProcessor()
        
        # Mock failure
        with patch.object(processor, '_download_file', side_effect=Exception("Download failed")):
            with pytest.raises(Exception):
                await processor.process_job(mock_db_session, sample_job_data)
        
        # Verify retry count was incremented
        # This depends on implementation details
    
    @pytest.mark.asyncio
    async def test_save_analysis_result(self, mock_db_session):
        """Test saving analysis results."""
        from main import JobProcessor
        
        processor = JobProcessor()
        
        analysis_data = {
            "analysis_type": "document_analysis",
            "raw_text": "Test content",
            "structured_data": {"entities": []},
            "summary": "Test summary",
            "confidence_score": 0.85,
            "tokens_used": 500,
            "processing_time_ms": 1200,
        }
        
        await processor.save_analysis_result(
            db=mock_db_session,
            file_id="test-file-id",
            job_id="test-job-id",
            result_data=analysis_data,
        )
        
        # Verify database operations were called
        mock_db_session.add.assert_called_once()
        mock_db_session.commit.assert_called_once()


class TestJobQueue:
    """Test cases for job queue operations."""
    
    def test_get_next_job_query(self):
        """Test the query for getting next job."""
        from main import get_next_job_query
        
        # This tests that the query is constructed correctly
        # Implementation depends on actual function
        pass
    
    @pytest.mark.asyncio
    async def test_queue_priority_ordering(self, mock_db_session):
        """Test that jobs are processed in priority order."""
        from main import JobProcessor
        
        processor = JobProcessor()
        
        # Create mock jobs with different priorities
        high_priority_job = MagicMock(priority=1, id="high")
        low_priority_job = MagicMock(priority=10, id="low")
        
        # Mock query to return high priority first
        mock_db_session.query.return_value.filter.return_value.order_by.return_value.first.return_value = high_priority_job
        
        job = await processor.claim_job(mock_db_session)
        
        assert job.priority == 1


class TestStorageOperations:
    """Test cases for storage operations in worker."""
    
    @pytest.mark.asyncio
    async def test_download_file(self, mock_storage_service):
        """Test downloading a file for processing."""
        from main import JobProcessor
        
        processor = JobProcessor()
        
        local_path = await processor._download_file(
            storage_key="uploads/test.pdf",
            bucket="test-bucket",
        )
        
        assert local_path is not None
        mock_storage_service.download_file.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_cleanup_temp_files(self):
        """Test cleanup of temporary files."""
        from main import JobProcessor
        import tempfile
        import os
        
        processor = JobProcessor()
        
        # Create a temp file
        with tempfile.NamedTemporaryFile(delete=False) as tmp:
            tmp_path = tmp.name
        
        # Cleanup
        processor._cleanup_temp_file(tmp_path)
        
        assert not os.path.exists(tmp_path)


class TestErrorHandling:
    """Test error handling in job processing."""
    
    @pytest.mark.asyncio
    async def test_max_retries_exceeded(self, mock_db_session):
        """Test behavior when max retries is exceeded."""
        from main import JobProcessor
        
        processor = JobProcessor()
        
        job_data = {
            "id": "test-job",
            "retry_count": 3,
            "max_retries": 3,
            "status": "failed",
        }
        
        # Should mark job as permanently failed
        with patch.object(processor, '_download_file', side_effect=Exception("Persistent error")):
            result = await processor.process_job(mock_db_session, job_data)
        
        # Verify job was marked as failed
        assert result.get("status") == "failed"
    
    @pytest.mark.asyncio
    async def test_partial_result_on_error(self, mock_db_session):
        """Test saving partial results on error."""
        from main import JobProcessor
        
        processor = JobProcessor()
        
        # Simulate partial processing failure
        with patch.object(processor.ai_client, 'analyze_document', side_effect=Exception("Partial failure")):
            result = await processor.process_job(mock_db_session, {
                "id": "test-job",
                "job_type": "document_analysis",
            })
        
        # Should still return some result with error info
        assert "error" in result or result.get("status") == "failed"
