"""
Pytest Configuration and Fixtures for API Tests
"""
import asyncio
from typing import AsyncGenerator, Generator

import pytest
import pytest_asyncio
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

import sys

sys.path.insert(0, '/home/hinoki/HinokiDEV/Investments/api')
sys.path.insert(0, '/home/hinoki/HinokiDEV/Investments/shared')

from database import Base, get_async_db
from main import app

# Test database URL
TEST_DATABASE_URL = "postgresql+asyncpg://test:test@localhost:5432/test"

# Create async engine for tests
engine = create_async_engine(TEST_DATABASE_URL, echo=False, future=True)
TestingSessionLocal = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)


@pytest.fixture(scope="session")
def event_loop() -> Generator:
    """Create an instance of the default event loop for each test case."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="function")
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """Create a fresh database session for a test."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    async with TestingSessionLocal() as session:
        yield session
        await session.rollback()
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture(scope="function")
async def client(db_session: AsyncSession) -> AsyncGenerator[TestClient, None]:
    """Create a test client with overridden dependencies."""
    def override_get_async_db():
        yield db_session
    
    app.dependency_overrides[get_async_db] = override_get_async_db
    
    with TestClient(app) as test_client:
        yield test_client
    
    app.dependency_overrides.clear()


@pytest.fixture
async def sample_investment(db_session: AsyncSession):
    """Create a sample investment for testing."""
    from models import Investment
    
    investment = Investment(
        name="Test Investment",
        category="land",
        initial_value=100000,
        current_value=120000,
        currency="USD",
        status="active"
    )
    db_session.add(investment)
    await db_session.commit()
    await db_session.refresh(investment)
    return investment
