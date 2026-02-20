"""
===============================================================================
PYTEST CONFIGURATION - Test fixtures and configuration
===============================================================================
"""
import asyncio
import os
import sys
from typing import AsyncGenerator, Generator
from unittest.mock import MagicMock, patch

import pytest
import pytest_asyncio
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

# Add paths
sys.path.insert(0, '/home/hinoki/HinokiDEV/Investments/prism/api')
sys.path.insert(0, '/home/hinoki/HinokiDEV/Investments/prism/shared')

from database import Base, get_async_db, async_engine, ASYNC_DATABASE_URL
from main import app

# Test database URL - use the same database but with a test schema
TEST_DATABASE_URL = ASYNC_DATABASE_URL.replace(
    "@localhost", "@localhost"
).replace(
    "/investments", "/test_investments"
)

# Create test engine
test_engine = create_async_engine(
    TEST_DATABASE_URL,
    echo=False,
    future=True,
    pool_pre_ping=True,
)

TestingSessionLocal = sessionmaker(
    test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


# =============================================================================
# EVENT LOOP FIXTURE
# =============================================================================

@pytest.fixture(scope="session")
def event_loop() -> Generator:
    """Create an instance of the default event loop for each test case."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


# =============================================================================
# DATABASE FIXTURES
# =============================================================================

@pytest_asyncio.fixture(scope="session", autouse=True)
async def setup_test_database():
    """Set up test database once per session."""
    # Create all tables
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    
    yield
    
    # Clean up after all tests
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    
    await test_engine.dispose()


@pytest_asyncio.fixture(scope="function")
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """Create a fresh database session for a test with transaction rollback."""
    async with TestingSessionLocal() as session:
        # Start nested transaction
        async with session.begin_nested():
            yield session
            # Rollback the nested transaction
            await session.rollback()
        
        # Close the session
        await session.close()


# =============================================================================
# FASTAPI CLIENT FIXTURES
# =============================================================================

@pytest_asyncio.fixture(scope="function")
async def client(db_session: AsyncSession) -> AsyncGenerator[TestClient, None]:
    """Create a test client with overridden database dependency."""
    async def override_get_async_db():
        yield db_session
    
    app.dependency_overrides[get_async_db] = override_get_async_db
    
    with TestClient(app) as test_client:
        yield test_client
    
    app.dependency_overrides.clear()


@pytest_asyncio.fixture(scope="function")
async def async_client(db_session: AsyncSession):
    """Create an async test client using httpx."""
    from httpx import AsyncClient
    
    async def override_get_async_db():
        yield db_session
    
    app.dependency_overrides[get_async_db] = override_get_async_db
    
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac
    
    app.dependency_overrides.clear()


# =============================================================================
# MOCK SERVICE FIXTURES
# =============================================================================

@pytest.fixture(scope="function")
def mock_storage_service():
    """Mock storage service for file operations."""
    with patch("storage.StorageService") as mock:
        instance = MagicMock()
        
        # Mock common methods
        instance.upload_file.return_value = {
            "key": "test/file.pdf",
            "bucket": "test-bucket",
            "url": "https://test-bucket.s3.amazonaws.com/test/file.pdf",
        }
        instance.get_presigned_upload_url.return_value = {
            "url": "https://test-bucket.s3.amazonaws.com/test/file.pdf?X-Amz-Algorithm=AWS4-HMAC-SHA256",
            "fields": {},
        }
        instance.get_presigned_download_url.return_value = "https://test-bucket.s3.amazonaws.com/test/file.pdf?download=true"
        instance.delete_file.return_value = True
        instance.get_file_metadata.return_value = {
            "size": 1024,
            "content_type": "application/pdf",
            "last_modified": "2024-01-01T00:00:00Z",
        }
        
        mock.return_value = instance
        yield instance


@pytest.fixture(scope="function")
def mock_ai_client():
    """Mock AI client for analysis operations."""
    with patch("worker.ai_client.AIClient") as mock:
        instance = MagicMock()
        
        # Mock analyze_document method
        instance.analyze_document.return_value = {
            "raw_text": "Test analysis result",
            "structured_data": {
                "entities": [{"type": "PERSON", "text": "Test User"}],
                "dates": [{"type": "purchase_date", "value": "2024-01-01"}],
                "amounts": [{"type": "price", "value": 100000, "currency": "BRL"}],
            },
            "summary": "Test document summary",
            "confidence_score": 0.85,
            "tokens_used": 500,
            "processing_time_ms": 1200,
        }
        
        instance.get_available_providers.return_value = ["openai", "anthropic", "kimi"]
        instance.health_check.return_value = {"status": "healthy", "provider": "openai"}
        
        mock.return_value = instance
        yield instance


@pytest.fixture(scope="function")
def mock_redis():
    """Mock Redis client."""
    with patch("database.redis_client") as mock:
        mock.get.return_value = None
        mock.set.return_value = True
        mock.setex.return_value = True
        mock.delete.return_value = 1
        mock.keys.return_value = []
        mock.ping.return_value = True
        yield mock


# =============================================================================
# TEST DATA FIXTURES
# =============================================================================

@pytest.fixture(scope="function")
def sample_investment_data():
    """Return sample investment data for testing."""
    return {
        "name": "Test Investment",
        "category": "land",
        "description": "A test investment property",
        "address": "123 Test Street",
        "city": "São Paulo",
        "state": "SP",
        "country": "Brazil",
        "purchase_price": 100000.00,
        "purchase_currency": "BRL",
        "purchase_date": "2024-01-01",
        "current_value": 120000.00,
        "land_area_m2": 1000.00,
        "land_area_hectares": 0.10,
        "zoning_type": "residential",
        "ownership_percentage": 100.0,
        "co_owners": [],
        "status": "active",
        "tags": ["test", "automated"],
        "custom_metadata": {"test": True},
    }


@pytest.fixture(scope="function")
def sample_file_registry_data():
    """Return sample file registry data for testing."""
    return {
        "original_filename": "test-document.pdf",
        "storage_key": "test/abc123-document.pdf",
        "storage_bucket": "test-bucket",
        "file_size_bytes": 1024000,
        "mime_type": "application/pdf",
        "file_hash": "a" * 64,
        "uploaded_by": "test_user",
        "source_device": "test",
        "tags": ["test"],
        "custom_metadata": {},
    }


@pytest.fixture(scope="function")
def sample_processing_job_data():
    """Return sample processing job data for testing."""
    return {
        "job_type": "document_analysis",
        "priority": 5,
        "parameters": {"model": "gpt-4o", "language": "pt"},
        "max_retries": 3,
    }


@pytest.fixture(scope="function")
def sample_analysis_result_data():
    """Return sample analysis result data for testing."""
    return {
        "analysis_type": "document_analysis",
        "model_version": "gpt-4o-2024-08-06",
        "raw_text": "Test analysis content",
        "structured_data": {
            "entities": [{"type": "PERSON", "text": "John Doe"}],
            "dates": [{"type": "purchase_date", "value": "2024-01-01"}],
        },
        "summary": "Test summary",
        "confidence_score": 0.85,
        "tokens_used": 500,
        "processing_time_ms": 1200,
        "quality_flags": ["high_confidence"],
    }


# =============================================================================
# AUTH FIXTURES (for future use)
# =============================================================================

@pytest.fixture(scope="function")
def auth_headers():
    """Return authentication headers for testing (placeholder)."""
    # TODO: Implement JWT token generation when auth is added
    return {
        "Authorization": "Bearer test_token",
        "X-User-ID": "test_user",
    }


# =============================================================================
# CLEANUP FIXTURES
# =============================================================================

@pytest.fixture(autouse=True)
def cleanup_fixtures():
    """Clean up after each test."""
    yield
    # Cleanup code runs after each test
    # This helps ensure test isolation
