"""
===============================================================================
HEALTH CHECK ROUTER - Comprehensive Health Checks
===============================================================================
"""
import os
import time
from datetime import datetime
from typing import Dict, Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_async_db, async_engine, redis_client
from storage import StorageService
from logging_config import get_logger

router = APIRouter(tags=["Health"])
logger = get_logger("health")

# Startup time for uptime calculation
STARTUP_TIME = time.time()


@router.get("/health", response_model=Dict[str, Any])
async def health_check(db: AsyncSession = Depends(get_async_db)):
    """
    Comprehensive health check endpoint.
    
    Returns:
        - status: overall health status (healthy, degraded, unhealthy)
        - timestamp: current UTC timestamp
        - version: application version
        - uptime_seconds: seconds since application startup
        - services: detailed status of each dependency
    """
    checks = {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": os.getenv("APP_VERSION", "2.0.0"),
        "environment": os.getenv("ENVIRONMENT", "development"),
        "uptime_seconds": round(time.time() - STARTUP_TIME),
        "services": {}
    }
    
    # Check database
    try:
        start = time.time()
        await db.execute(text("SELECT 1"))
        db_latency = round((time.time() - start) * 1000, 2)
        
        checks["services"]["database"] = {
            "status": "healthy",
            "latency_ms": db_latency,
        }
        logger.debug("database_health_check_passed", latency_ms=db_latency)
    except Exception as e:
        checks["services"]["database"] = {
            "status": "unhealthy",
            "error": str(e),
        }
        checks["status"] = "degraded"
        logger.error("database_health_check_failed", error=str(e))
    
    # Check Redis
    try:
        start = time.time()
        redis_client.ping()
        redis_latency = round((time.time() - start) * 1000, 2)
        
        checks["services"]["redis"] = {
            "status": "healthy",
            "latency_ms": redis_latency,
        }
        logger.debug("redis_health_check_passed", latency_ms=redis_latency)
    except Exception as e:
        checks["services"]["redis"] = {
            "status": "unhealthy",
            "error": str(e),
        }
        checks["status"] = "degraded"
        logger.error("redis_health_check_failed", error=str(e))
    
    # Check storage (S3/R2)
    try:
        start = time.time()
        storage = StorageService()
        # Try to list buckets or get bucket info
        storage.check_connection()
        storage_latency = round((time.time() - start) * 1000, 2)
        
        checks["services"]["storage"] = {
            "status": "healthy",
            "latency_ms": storage_latency,
        }
        logger.debug("storage_health_check_passed", latency_ms=storage_latency)
    except Exception as e:
        checks["services"]["storage"] = {
            "status": "unhealthy",
            "error": str(e),
        }
        checks["status"] = "degraded"
        logger.error("storage_health_check_failed", error=str(e))
    
    # Determine overall status
    service_statuses = [s["status"] for s in checks["services"].values()]
    
    if all(s == "healthy" for s in service_statuses):
        checks["status"] = "healthy"
    elif any(s == "unhealthy" for s in service_statuses):
        # If critical services (database) are unhealthy, mark as unhealthy
        if checks["services"].get("database", {}).get("status") == "unhealthy":
            checks["status"] = "unhealthy"
        else:
            checks["status"] = "degraded"
    else:
        checks["status"] = "degraded"
    
    # Log health check result
    logger.info(
        "health_check_completed",
        status=checks["status"],
        services_checked=len(checks["services"]),
    )
    
    return checks


@router.get("/health/ready", response_model=Dict[str, str])
async def readiness_check(db: AsyncSession = Depends(get_async_db)):
    """
    Kubernetes-style readiness probe.
    
    Returns 200 when the application is ready to accept traffic.
    Returns 503 if the application is not ready.
    """
    try:
        # Check database connectivity
        await db.execute(text("SELECT 1"))
        return {"status": "ready"}
    except Exception as e:
        logger.error("readiness_check_failed", error=str(e))
        raise HTTPException(
            status_code=503,
            detail={"status": "not_ready", "error": str(e)}
        )


@router.get("/health/live", response_model=Dict[str, str])
async def liveness_check():
    """
    Kubernetes-style liveness probe.
    
    Returns 200 if the application is running.
    Returns 500 if the application should be restarted.
    """
    # Basic check - if we can respond, we're alive
    return {"status": "alive"}


@router.get("/health/db")
async def database_health(db: AsyncSession = Depends(get_async_db)):
    """Detailed database health check."""
    try:
        start = time.time()
        
        # Basic connectivity
        await db.execute(text("SELECT 1"))
        
        # Check connection pool stats if available
        pool_info = {}
        if hasattr(async_engine, "pool"):
            pool = async_engine.pool
            pool_info = {
                "size": pool.size() if hasattr(pool, "size") else -1,
                "checked_in": pool.checkedin() if hasattr(pool, "checkedin") else -1,
                "checked_out": pool.checkedout() if hasattr(pool, "checkedout") else -1,
            }
        
        latency_ms = round((time.time() - start) * 1000, 2)
        
        return {
            "status": "healthy",
            "latency_ms": latency_ms,
            "pool": pool_info,
        }
    except Exception as e:
        logger.error("database_health_check_failed", error=str(e))
        raise HTTPException(
            status_code=503,
            detail={"status": "unhealthy", "error": str(e)}
        )


@router.get("/health/redis")
async def redis_health():
    """Detailed Redis health check."""
    try:
        start = time.time()
        
        # Basic ping
        redis_client.ping()
        
        # Get Redis info
        info = redis_client.info()
        
        latency_ms = round((time.time() - start) * 1000, 2)
        
        return {
            "status": "healthy",
            "latency_ms": latency_ms,
            "version": info.get("redis_version", "unknown"),
            "connected_clients": info.get("connected_clients", 0),
            "used_memory_human": info.get("used_memory_human", "unknown"),
        }
    except Exception as e:
        logger.error("redis_health_check_failed", error=str(e))
        raise HTTPException(
            status_code=503,
            detail={"status": "unhealthy", "error": str(e)}
        )


@router.get("/health/storage")
async def storage_health():
    """Detailed storage health check."""
    try:
        start = time.time()
        
        storage = StorageService()
        storage.check_connection()
        
        latency_ms = round((time.time() - start) * 1000, 2)
        
        return {
            "status": "healthy",
            "latency_ms": latency_ms,
            "bucket": os.getenv("STORAGE_BUCKET", "unknown"),
        }
    except Exception as e:
        logger.error("storage_health_check_failed", error=str(e))
        raise HTTPException(
            status_code=503,
            detail={"status": "unhealthy", "error": str(e)}
        )


@router.get("/metrics")
async def metrics():
    """Prometheus metrics endpoint."""
    from metrics import get_metrics_response
    return get_metrics_response()
