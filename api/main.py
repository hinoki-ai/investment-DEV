"""
===============================================================================
FASTAPI APPLICATION - Coordination Layer API
===============================================================================
"""
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from database import async_engine, Base, redis_client
from routers import investments, files, analysis, dashboard, uploads


# =============================================================================
# LIFESPAN MANAGEMENT
# =============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Startup
    print("🚀 Starting NEXUS / Nest API...")
    
    # Test Redis connection
    try:
        redis_client.ping()
        print("✅ Redis connected")
    except Exception as e:
        print(f"⚠️ Redis connection failed: {e}")
    
    # Note: Database tables should be created via migrations (Alembic)
    # For development, you can uncomment below:
    # async with async_engine.begin() as conn:
    #     await conn.run_sync(Base.metadata.create_all)
    
    yield
    
    # Shutdown
    print("🛑 Shutting down API...")
    await async_engine.dispose()


# =============================================================================
# APP CONFIGURATION
# =============================================================================

app = FastAPI(
    title="NEXUS / Nest API",
    description="Three-layer architecture: Storage | Coordination | Intelligence",
    version="1.0.0",
    lifespan=lifespan
)

# CORS
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =============================================================================
# ERROR HANDLERS
# =============================================================================

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error",
            "type": type(exc).__name__,
            "message": str(exc)
        }
    )


# =============================================================================
# HEALTH CHECK
# =============================================================================

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    health_status = {
        "status": "healthy",
        "services": {}
    }
    
    # Check Redis
    try:
        redis_client.ping()
        health_status["services"]["redis"] = "connected"
    except Exception as e:
        health_status["services"]["redis"] = f"error: {str(e)}"
        health_status["status"] = "degraded"
    
    return health_status


@app.get("/")
async def root():
    """API root."""
    return {
        "name": "NEXUS / Nest API",
        "version": "1.0.0",
        "architecture": "Three-layer: Storage | Coordination | Intelligence",
        "docs": "/docs"
    }


# =============================================================================
# ROUTERS
# =============================================================================

app.include_router(investments.router, prefix="/api/v1/investments", tags=["Investments"])
app.include_router(files.router, prefix="/api/v1/files", tags=["Files"])
app.include_router(uploads.router, prefix="/api/v1/uploads", tags=["Uploads"])
app.include_router(analysis.router, prefix="/api/v1/analysis", tags=["Analysis"])
app.include_router(dashboard.router, prefix="/api/v1/dashboard", tags=["Dashboard"])


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
