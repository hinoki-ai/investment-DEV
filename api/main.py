"""
===============================================================================
FASTAPI APPLICATION - Coordination Layer API
===============================================================================
"""
import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles

from database import async_engine, Base, redis_client
from routers import investments, files, analysis, dashboard, uploads, chat


# =============================================================================
# STATIC FILES SETUP
# =============================================================================

STATIC_DIR = Path(__file__).parent / "static"
if not STATIC_DIR.exists():
    STATIC_DIR.mkdir(parents=True, exist_ok=True)


# =============================================================================
# LIFESPAN MANAGEMENT
# =============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Startup
    print("🚀 Starting NEXUS API...")
    
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
    title="◈ NEXUS API",
    description="""
    **Three-Layer Intelligence for Investment Management**
    
    NEXUS powers the PRISM dashboard with a sophisticated architecture:
    
    - **Layer 1: Storage** — Direct-to-storage file uploads (S3/R2 compatible)
    - **Layer 2: Coordination** — PostgreSQL + Redis for state management
    - **Layer 3: Intelligence** — Multi-provider AI analysis (Kimi, GPT-4o, Claude, Gemini)
    
    ### Key Features
    
    * 📁 **Direct Uploads** — Files never pass through the API, go straight to storage
    * 🤖 **AI Analysis** — Automatic document parsing and investment analysis
    * 📊 **Real-time Stats** — Dashboard metrics and portfolio tracking
    * 🔗 **Multi-device** — Upload from phone, analyze on desktop
    
    ### Authentication
    
    JWT-based authentication (coming soon). For now, internal network only.
    
    ### Rate Limits
    
    - Standard: 100 requests/minute
    - Uploads: 10/minute
    - Analysis: 5/minute
    """,
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/openapi",
    redoc_url="/redoc",
    contact={
        "name": "NEXUS & PRISM",
        "url": "http://localhost:5173",
    },
    license_info={
        "name": "MIT",
    },
)

# Mount static files
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

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


@app.get("/", response_class=HTMLResponse)
async def root():
    """API documentation landing page."""
    docs_path = STATIC_DIR / "prism_docs.html"
    if docs_path.exists():
        return docs_path.read_text()
    return HTMLResponse(
        content="""
        <!DOCTYPE html>
        <html>
        <head><title>NEXUS API</title></head>
        <body style="background:#0a0a0a;color:#f5f2ed;font-family:sans-serif;text-align:center;padding:50px;">
            <h1>◈ NEXUS API</h1>
            <p>Documentation loading...</p>
            <a href="/openapi" style="color:#e8d5c4;">View OpenAPI Spec →</a>
        </body>
        </html>
        """,
        status_code=200
    )


@app.get("/docs", response_class=HTMLResponse)
async def docs():
    """Redirect /docs to root for beautiful documentation."""
    return await root()


# =============================================================================
# ROUTERS
# =============================================================================

app.include_router(investments.router, prefix="/api/v1/investments", tags=["Investments"])
app.include_router(files.router, prefix="/api/v1/files", tags=["Files"])
app.include_router(uploads.router, prefix="/api/v1/uploads", tags=["Uploads"])
app.include_router(analysis.router, prefix="/api/v1/analysis", tags=["Analysis"])
app.include_router(dashboard.router, prefix="/api/v1/dashboard", tags=["Dashboard"])
app.include_router(chat.router, prefix="/api/v1", tags=["Chat"])


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
