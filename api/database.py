"""
===============================================================================
DATABASE LAYER (Layer 2) - SQLAlchemy Configuration
===============================================================================
"""
import os
from typing import AsyncGenerator, Generator

from sqlalchemy import create_engine, event
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Database URL
DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "postgresql://investor:family_future_2024@localhost:5432/investments"
)

# Convert to async URL if needed
if DATABASE_URL.startswith("postgresql://"):
    ASYNC_DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)
else:
    ASYNC_DATABASE_URL = DATABASE_URL

# Sync engine (for Alembic migrations, admin tasks)
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
    echo=os.getenv("SQL_ECHO", "false").lower() == "true"
)

# Async engine (for FastAPI)
async_engine = create_async_engine(
    ASYNC_DATABASE_URL,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
    echo=os.getenv("SQL_ECHO", "false").lower() == "true"
)

# Session makers
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
AsyncSessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=async_engine,
    class_=AsyncSession
)

# Base model
Base = declarative_base()


# =============================================================================
# SYNC SESSION (for background tasks, migrations)
# =============================================================================

def get_db() -> Generator:
    """Get a synchronous database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_db_session():
    """Get a database session as a context manager."""
    return SessionLocal()


# =============================================================================
# ASYNC SESSION (for FastAPI routes)
# =============================================================================

async def get_async_db() -> AsyncGenerator[AsyncSession, None]:
    """Get an async database session for FastAPI dependency injection."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


# =============================================================================
# REDIS CONNECTION
# =============================================================================

import redis

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

# Sync Redis client
redis_client = redis.from_url(REDIS_URL, decode_responses=True)

# Async Redis client
import redis.asyncio as aioredis
async_redis = aioredis.from_url(REDIS_URL, decode_responses=True)


def get_redis():
    """Get Redis client for task queue and caching."""
    return redis_client


def get_async_redis():
    """Get async Redis client."""
    return async_redis
