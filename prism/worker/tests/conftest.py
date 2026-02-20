"""
===============================================================================
PYTEST CONFIGURATION - Worker Tests
===============================================================================
"""
import os
import sys
from typing import Generator
from unittest.mock import MagicMock, patch

import pytest

# Add paths
sys.path.insert(0, '/home/hinoki/HinokiDEV/Investments/prism/worker')
sys.path.insert(0, '/home/hinoki/HinokiDEV/Investments/prism/api')
sys.path.insert(0, '/home/hinoki/HinokiDEV/Investments/prism/shared')


# =============================================================================
# MOCK FIXTURES
# =============================================================================

@pytest.fixture(scope="function")
def mock_db_session():
    """Mock database session for worker tests."""
    session = MagicMock()
    session.commit.return_value = None
    session.refresh.return_value = None
    session.add.return_value = None
    session.query.return_value.filter.return_value.first.return_value = None
    session.query.return_value.filter.return_value.update.return_value = None
    return session


@pytest.fixture(scope="function")
def mock_storage_service():
    """Mock storage service."""
    with patch("worker.storage.StorageService") as mock:
        instance = MagicMock()
        
        instance.download_file.return_value = "/tmp/test-file.pdf"
        instance.upload_file.return_value = {"key": "results/test.json"}
        instance.get_file_metadata.return_value = {
            "size": 1024000,
            "content_type": "application/pdf",
        }
        instance.delete_file.return_value = True
        
        mock.return_value = instance
        yield instance


@pytest.fixture(scope="function")
def mock_openai_client():
    """Mock OpenAI client."""
    with patch("openai.OpenAI") as mock:
        instance = MagicMock()
        
        # Mock chat completion response
        chat_response = MagicMock()
        chat_response.choices = [
            MagicMock(
                message=MagicMock(
                    content='{"summary": "Test summary", "entities": []}'
                )
            )
        ]
        chat_response.usage = MagicMock(total_tokens=500)
        chat_response.model = "gpt-4o"
        
        instance.chat.completions.create.return_value = chat_response
        
        mock.return_value = instance
        yield instance


@pytest.fixture(scope="function")
def mock_anthropic_client():
    """Mock Anthropic client."""
    with patch("anthropic.Anthropic") as mock:
        instance = MagicMock()
        
        response = MagicMock()
        response.content = [MagicMock(text='{"summary": "Test summary"}')]
        response.usage = MagicMock(input_tokens=300, output_tokens=200)
        response.model = "claude-3-sonnet"
        
        instance.messages.create.return_value = response
        
        mock.return_value = instance
        yield instance


# =============================================================================
# TEST DATA FIXTURES
# =============================================================================

@pytest.fixture(scope="function")
def sample_job_data():
    """Return sample processing job data."""
    return {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "job_type": "document_analysis",
        "status": "queued",
        "file_id": "123e4567-e89b-12d3-a456-426614174001",
        "investment_id": "123e4567-e89b-12d3-a456-426614174002",
        "priority": 5,
        "parameters": {"model": "gpt-4o", "language": "pt"},
        "retry_count": 0,
        "max_retries": 3,
    }


@pytest.fixture(scope="function")
def sample_file_data():
    """Return sample file data."""
    return {
        "id": "123e4567-e89b-12d3-a456-426614174001",
        "original_filename": "test-document.pdf",
        "storage_key": "uploads/test-document.pdf",
        "storage_bucket": "test-bucket",
        "file_size_bytes": 1024000,
        "mime_type": "application/pdf",
        "status": "completed",
    }


@pytest.fixture(scope="function")
def sample_analysis_result():
    """Return sample analysis result."""
    return {
        "analysis_type": "document_analysis",
        "raw_text": "Test document content for analysis",
        "structured_data": {
            "entities": [
                {"type": "PERSON", "text": "John Doe"},
                {"type": "ORG", "text": "Test Company"},
            ],
            "dates": [
                {"type": "purchase_date", "value": "2024-01-01"},
            ],
            "amounts": [
                {"type": "price", "value": 100000, "currency": "BRL"},
            ],
        },
        "summary": "Test document summary",
        "confidence_score": 0.85,
        "tokens_used": 500,
        "processing_time_ms": 1200,
        "model_version": "gpt-4o-2024-08-06",
    }


# =============================================================================
# TEMP FILE FIXTURES
# =============================================================================

@pytest.fixture(scope="function")
def temp_pdf_file(tmp_path):
    """Create a temporary PDF file for testing."""
    pdf_path = tmp_path / "test.pdf"
    # Write minimal PDF content
    pdf_content = b"%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n>>\nendobj\nxref\ntrailer\n<<\n/Root 1 0 R\n>>\n%%EOF"
    pdf_path.write_bytes(pdf_content)
    return str(pdf_path)


@pytest.fixture(scope="function")
def temp_image_file(tmp_path):
    """Create a temporary image file for testing."""
    img_path = tmp_path / "test.jpg"
    # Write minimal JPEG content
    img_content = b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x00\x00\x01\x00\x01\x00\x00\xff\xd9"
    img_path.write_bytes(img_content)
    return str(img_path)
