# v2.0 Critical Implementation Guide

> Step-by-step implementation for P0 (Critical) fixes

---

## 🔐 PHASE 1: JWT Authentication Implementation

### Step 1.1: Create Auth Models

**File: `prism/api/models.py` (Add to existing)**

```python
# Add these imports at top
from sqlalchemy import Boolean
import bcrypt

# Add after existing models

class User(Base):
    """User account for authentication."""
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = Column(DateTime(timezone=True), nullable=True)
    
    def verify_password(self, password: str) -> bool:
        """Verify password against hash."""
        return bcrypt.checkpw(
            password.encode('utf-8'),
            self.hashed_password.encode('utf-8')
        )
    
    def set_password(self, password: str) -> None:
        """Hash and set password."""
        self.hashed_password = bcrypt.hashpw(
            password.encode('utf-8'),
            bcrypt.gensalt(rounds=12)
        ).decode('utf-8')
```

### Step 1.2: Create Auth Schemas

**File: `prism/shared/schemas.py` (Add to existing)**

```python
# Add to existing schemas

class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None


class UserCreate(UserBase):
    password: str = Field(..., min_length=8, max_length=100)


class UserResponse(UserBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    is_active: bool
    created_at: datetime
    last_login: Optional[datetime] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds
    user: UserResponse


class PasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8, max_length=100)
```

### Step 1.3: Create JWT Utilities

**File: `prism/api/auth.py` (Create new)**

```python
"""
===============================================================================
AUTHENTICATION UTILITIES - JWT Token Management
===============================================================================
"""
import os
from datetime import datetime, timedelta
from typing import Optional
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from database import get_async_db
import models as db_models

# Configuration
SECRET_KEY = os.getenv("JWT_SECRET", "your-super-secret-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

# Security scheme
security = HTTPBearer(auto_error=False)


def create_access_token(user_id: str, expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT access token."""
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {
        "sub": str(user_id),
        "exp": expire,
        "iat": datetime.utcnow(),
        "type": "access"
    }
    
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def verify_token(token: str) -> Optional[str]:
    """Verify JWT token and return user_id."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            return None
        return user_id
    except JWTError:
        return None


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_async_db)
) -> db_models.User:
    """Get current authenticated user from JWT token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    if not credentials:
        raise credentials_exception
    
    user_id = verify_token(credentials.credentials)
    if user_id is None:
        raise credentials_exception
    
    result = await db.execute(
        select(db_models.User).where(db_models.User.id == user_id)
    )
    user = result.scalar_one_or_none()
    
    if user is None or not user.is_active:
        raise credentials_exception
    
    return user


async def get_current_active_user(
    current_user: db_models.User = Depends(get_current_user)
) -> db_models.User:
    """Verify user is active."""
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )
    return current_user


async def get_current_superuser(
    current_user: db_models.User = Depends(get_current_user)
) -> db_models.User:
    """Verify user is superuser."""
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions"
        )
    return current_user
```

### Step 1.4: Create Auth Router

**File: `prism/api/routers/auth.py` (Create new)**

```python
"""
===============================================================================
AUTH ROUTER - Authentication Endpoints
===============================================================================
"""
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from routers._imports import db_models, schemas, get_async_db
from auth import create_access_token, get_current_user


router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    data: schemas.UserCreate,
    db: AsyncSession = Depends(get_async_db)
):
    """Register a new user account."""
    # Check if email already exists
    result = await db.execute(
        select(db_models.User).where(db_models.User.email == data.email)
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create user
    user = db_models.User(
        email=data.email,
        full_name=data.full_name
    )
    user.set_password(data.password)
    
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    return schemas.UserResponse.model_validate(user)


@router.post("/login", response_model=schemas.TokenResponse)
async def login(
    data: schemas.UserLogin,
    db: AsyncSession = Depends(get_async_db)
):
    """Authenticate and get access token."""
    # Find user
    result = await db.execute(
        select(db_models.User).where(db_models.User.email == data.email)
    )
    user = result.scalar_one_or_none()
    
    # Verify credentials
    if not user or not user.verify_password(data.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated"
        )
    
    # Update last login
    user.last_login = datetime.utcnow()
    await db.commit()
    
    # Create token
    access_token = create_access_token(str(user.id))
    
    return schemas.TokenResponse(
        access_token=access_token,
        expires_in=60 * 60 * 24 * 7,  # 7 days
        user=schemas.UserResponse.model_validate(user)
    )


@router.get("/me", response_model=schemas.UserResponse)
async def get_me(current_user: db_models.User = Depends(get_current_user)):
    """Get current authenticated user."""
    return schemas.UserResponse.model_validate(current_user)


@router.post("/change-password")
async def change_password(
    data: schemas.PasswordChange,
    current_user: db_models.User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Change current user's password."""
    # Verify current password
    if not current_user.verify_password(data.current_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    # Set new password
    current_user.set_password(data.new_password)
    await db.commit()
    
    return {"message": "Password updated successfully"}
```

### Step 1.5: Update Main.py to Include Auth

**File: `prism/api/main.py` (Modifications)**

```python
# Add to imports
from routers import auth

# Add to router includes (before other routers)
app.include_router(auth.router, prefix="/api/v1", tags=["Authentication"])

# Protect existing routers - update the include statements:
from auth import get_current_user, get_current_active_user

# Add dependency to protected routes
app.include_router(
    investments.router, 
    prefix="/api/v1/investments", 
    tags=["Investments"],
    dependencies=[Depends(get_current_active_user)]  # Add this
)
# ... repeat for other routers
```

### Step 1.6: Update Frontend API Client

**File: `prism/web/src/lib/api.ts` (Add auth utilities)**

```typescript
// Add to api.ts

// Token management
export const auth = {
  getToken: () => localStorage.getItem('access_token'),
  setToken: (token: string) => localStorage.setItem('access_token', token),
  clearToken: () => localStorage.removeItem('access_token'),
  
  getUser: () => {
    const userJson = localStorage.getItem('user')
    return userJson ? JSON.parse(userJson) : null
  },
  setUser: (user: any) => localStorage.setItem('user', JSON.stringify(user)),
  clearUser: () => localStorage.removeItem('user'),
  
  isAuthenticated: () => !!auth.getToken(),
  
  logout: () => {
    auth.clearToken()
    auth.clearUser()
    window.location.href = '/login'
  }
}

// Update API instance to include auth header
api.interceptors.request.use((config) => {
  const token = auth.getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle 401 responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      auth.logout()
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authApi = {
  login: (email: string, password: string) => 
    api.post('/auth/login', { email, password }).then(r => {
      auth.setToken(r.data.access_token)
      auth.setUser(r.data.user)
      return r.data
    }),
  
  register: (data: { email: string; password: string; full_name?: string }) =>
    api.post('/auth/register', data).then(r => r.data),
  
  getMe: () => api.get('/auth/me').then(r => r.data),
  
  changePassword: (data: { current_password: string; new_password: string }) =>
    api.post('/auth/change-password', data).then(r => r.data),
}
```

---

## 🛡️ PHASE 2: Security Hardening

### Step 2.1: Fix Error Handler

**File: `prism/api/main.py` (Replace exception handler)**

```python
import logging
import traceback

logger = logging.getLogger(__name__)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler - logs details, returns generic message."""
    # Log full exception with traceback
    logger.error(
        f"Unhandled exception: {type(exc).__name__}: {str(exc)}\n"
        f"Path: {request.url.path}\n"
        f"Traceback: {traceback.format_exc()}"
    )
    
    # Return generic message to client
    return JSONResponse(
        status_code=500,
        content={
            "detail": "An internal server error occurred",
            "error_id": str(uuid.uuid4())[:8]  # For support lookup
        }
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Handle HTTP exceptions."""
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail}
    )
```

### Step 2.2: Add Rate Limiting

**File: `prism/api/middleware.py` (Create new)**

```python
"""
===============================================================================
RATE LIMITING MIDDLEWARE
===============================================================================
"""
import time
from typing import Dict, Tuple
from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware

from database import redis_client


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Rate limiting middleware using Redis."""
    
    # Rate limit rules: (requests, window_seconds)
    DEFAULT_LIMIT = (100, 60)  # 100 requests per minute
    LOGIN_LIMIT = (5, 300)     # 5 login attempts per 5 minutes
    UPLOAD_LIMIT = (10, 60)    # 10 uploads per minute
    ANALYSIS_LIMIT = (5, 60)   # 5 analysis requests per minute
    
    async def dispatch(self, request: Request, call_next):
        # Skip for health checks and docs
        if request.url.path in ['/health', '/', '/docs', '/openapi']:
            return await call_next(request)
        
        # Determine rate limit based on endpoint
        limit, window = self._get_limit(request)
        
        # Get client identifier
        client_id = self._get_client_id(request)
        key = f"rate_limit:{client_id}:{request.url.path}"
        
        # Check rate limit in Redis
        current = redis_client.get(key)
        if current and int(current) >= limit:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded. Please try again later."
            )
        
        # Increment counter
        pipe = redis_client.pipeline()
        pipe.incr(key)
        pipe.expire(key, window)
        pipe.execute()
        
        return await call_next(request)
    
    def _get_limit(self, request: Request) -> Tuple[int, int]:
        """Get rate limit for request path."""
        path = request.url.path
        
        if 'login' in path:
            return self.LOGIN_LIMIT
        elif 'upload' in path:
            return self.UPLOAD_LIMIT
        elif 'analysis' in path or 'chat' in path:
            return self.ANALYSIS_LIMIT
        
        return self.DEFAULT_LIMIT
    
    def _get_client_id(self, request: Request) -> str:
        """Get client identifier from request."""
        # Try to get from auth header first
        auth = request.headers.get('authorization', '')
        if auth.startswith('Bearer '):
            # Use token prefix as identifier
            return f"auth:{auth[7:15]}"
        
        # Fall back to IP address
        forwarded = request.headers.get('x-forwarded-for')
        if forwarded:
            return f"ip:{forwarded.split(',')[0].strip()}"
        
        if request.client:
            return f"ip:{request.client.host}"
        
        return "unknown"
```

**File: `prism/api/main.py` (Add middleware)**

```python
from middleware import RateLimitMiddleware

# Add after CORS middleware
app.add_middleware(RateLimitMiddleware)
```

### Step 2.3: Fix CORS Configuration

**File: `prism/api/main.py` (Update CORS)**

```python
import os

# Production-specific CORS
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

if ENVIRONMENT == "production":
    CORS_ORIGINS = [
        "https://inv.aramac.dev",
        "https://app.yourdomain.com"
    ]
    ALLOW_CREDENTIALS = True
    ALLOW_METHODS = ["GET", "POST", "PUT", "DELETE"]
    ALLOW_HEADERS = ["Authorization", "Content-Type"]
else:
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
    ALLOW_CREDENTIALS = True
    ALLOW_METHODS = ["*"]
    ALLOW_HEADERS = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=ALLOW_CREDENTIALS,
    allow_methods=ALLOW_METHODS,
    allow_headers=ALLOW_HEADERS,
)
```

---

## 🗄️ PHASE 3: Database Migrations

### Step 3.1: Initialize Alembic

```bash
cd /home/hinoki/HinokiDEV/Investments/prism/api

# Install alembic
pip install alembic

# Initialize
alembic init ../database/migrations
```

### Step 3.2: Configure Alembic

**File: `prism/database/migrations/alembic.ini`**

```ini
[alembic]
script_location = .
prepend_sys_path = ../../api
version_path_separator = os
sqlalchemy.url = postgresql://investor:family_future_2024@localhost:5432/investments

[post_write_hooks]
[loggers]
keys = root,sqlalchemy,alembic

[handlers]
keys = console

[formatters]
keys = generic

[logger_root]
level = WARN
handlers = console
qualname =

[logger_sqlalchemy]
level = WARN
handlers =
qualname = sqlalchemy.engine

[logger_alembic]
level = INFO
handlers =
qualname = alembic

[handler_console]
class = StreamHandler
args = (sys.stderr,)
level = NOTSET
formatter = generic

[formatter_generic]
format = %(levelname)-5.5s [%(name)s] %(message)s
datefmt = %H:%M:%S
```

### Step 3.3: Update Alembic env.py

**File: `prism/database/migrations/env.py`**

```python
from logging.config import fileConfig
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../api'))

from sqlalchemy import engine_from_config, pool
from alembic import context

# Import your models
from database import Base
import models  # This imports all your models

# Alembic Config
config = context.config

# Interpret the config file for Python logging
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Set target metadata
target_metadata = Base.metadata

def get_url():
    """Get database URL from environment."""
    return os.getenv(
        "DATABASE_URL",
        "postgresql://investor:family_future_2024@localhost:5432/investments"
    )

def run_migrations_offline():
    """Run migrations in 'offline' mode."""
    url = get_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online():
    """Run migrations in 'online' mode."""
    configuration = config.get_section(config.config_ini_section)
    configuration["sqlalchemy.url"] = get_url()
    
    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
```

### Step 3.4: Create Initial Migration

```bash
cd /home/hinoki/HinokiDEV/Investments/prism/api

# Create initial migration
alembic -c ../database/migrations/alembic.ini revision --autogenerate -m "Initial schema"

# Run migration
alembic -c ../database/migrations/alembic.ini upgrade head
```

### Step 3.5: Add Migration Commands to Makefile

**File: `Makefile` (Add)**

```makefile
# Database Migrations
migrate:
	cd prism/api && alembic -c ../database/migrations/alembic.ini upgrade head

migrate-down:
	cd prism/api && alembic -c ../database/migrations/alembic.ini downgrade -1

migrate-create:
	@read -p "Migration message: " msg; \
	cd prism/api && alembic -c ../database/migrations/alembic.ini revision --autogenerate -m "$$msg"

migrate-history:
	cd prism/api && alembic -c ../database/migrations/alembic.ini history
```

---

## 🧪 PHASE 4: Testing Setup

### Step 4.1: Expand Test Configuration

**File: `prism/api/tests/conftest.py` (Expand existing)**

```python
"""
Pytest configuration and fixtures
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import sys
sys.path.insert(0, '/home/hinoki/HinokiDEV/Investments/prism/api')

from main import app
from database import Base, get_db
from auth import get_password_hash
import models as db_models

# Test database
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    """Override database dependency for testing."""
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(scope="function")
def db():
    """Create fresh database for each test."""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db):
    """Create test client."""
    yield TestClient(app)


@pytest.fixture
def test_user(db):
    """Create a test user."""
    user = db_models.User(
        email="test@example.com",
        full_name="Test User"
    )
    user.set_password("testpassword123")
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def auth_client(client, test_user):
    """Create authenticated test client."""
    # Login
    response = client.post("/api/v1/auth/login", json={
        "email": "test@example.com",
        "password": "testpassword123"
    })
    token = response.json()["access_token"]
    
    # Set auth header
    client.headers["Authorization"] = f"Bearer {token}"
    return client
```

### Step 4.2: Add Auth Tests

**File: `prism/api/tests/test_auth.py` (Create new)**

```python
"""
Authentication endpoint tests
"""
import pytest


def test_register_user(client):
    """Test user registration."""
    response = client.post("/api/v1/auth/register", json={
        "email": "newuser@example.com",
        "password": "securepassword123",
        "full_name": "New User"
    })
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "newuser@example.com"
    assert data["full_name"] == "New User"
    assert "id" in data


def test_register_duplicate_email(client, test_user):
    """Test registration with duplicate email fails."""
    response = client.post("/api/v1/auth/register", json={
        "email": "test@example.com",
        "password": "password123"
    })
    assert response.status_code == 400


def test_login_success(client, test_user):
    """Test successful login."""
    response = client.post("/api/v1/auth/login", json={
        "email": "test@example.com",
        "password": "testpassword123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_login_invalid_password(client, test_user):
    """Test login with wrong password fails."""
    response = client.post("/api/v1/auth/login", json={
        "email": "test@example.com",
        "password": "wrongpassword"
    })
    assert response.status_code == 401


def test_get_current_user(auth_client):
    """Test getting current user."""
    response = auth_client.get("/api/v1/auth/me")
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test@example.com"


def test_protected_endpoint_without_auth(client):
    """Test accessing protected endpoint without auth fails."""
    response = client.get("/api/v1/investments")
    assert response.status_code == 401
```

---

## 📊 Summary

After implementing these phases:

1. ✅ JWT authentication protecting all endpoints
2. ✅ Proper error handling (no info leak)
3. ✅ Rate limiting on all endpoints
4. ✅ Database migrations with Alembic
5. ✅ Comprehensive test suite
6. ✅ Security hardened API

**Estimated Implementation Time**: 2-3 days

**Next Steps After Phase 4**:
- Frontend auth integration
- Production deployment checklist
- Monitoring setup (Phase 5)
