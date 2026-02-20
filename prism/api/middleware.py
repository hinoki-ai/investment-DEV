"""
===============================================================================
FASTAPI MIDDLEWARE
===============================================================================
- Metrics collection middleware
- Request timing
- Error tracking
- Response caching
"""
import json
import time
from functools import wraps
from typing import Callable, Optional

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

from database import get_redis
from metrics import (
    HTTP_REQUESTS_TOTAL,
    HTTP_REQUEST_DURATION_SECONDS,
    HTTP_REQUEST_SIZE_BYTES,
    HTTP_RESPONSE_SIZE_BYTES,
)
from logging_config import get_logger, bind_request_context, clear_context
import uuid


class MetricsMiddleware(BaseHTTPMiddleware):
    """Middleware to collect Prometheus metrics for each request."""
    
    def __init__(self, app, skip_paths: list = None):
        super().__init__(app)
        self.skip_paths = skip_paths or ["/metrics", "/health", "/docs", "/openapi.json"]
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Skip metrics collection for certain paths
        if any(request.url.path.startswith(path) for path in self.skip_paths):
            return await call_next(request)
        
        start_time = time.time()
        
        # Get request size
        request_size = int(request.headers.get("content-length", 0))
        if request_size > 0:
            HTTP_REQUEST_SIZE_BYTES.observe(request_size)
        
        # Process request
        response = await call_next(request)
        
        # Calculate duration
        duration = time.time() - start_time
        
        # Get response size
        response_size = int(response.headers.get("content-length", 0))
        if response_size > 0:
            HTTP_RESPONSE_SIZE_BYTES.observe(response_size)
        
        # Record metrics
        status_code = str(response.status_code)
        method = request.method
        endpoint = request.url.path
        
        HTTP_REQUESTS_TOTAL.labels(
            method=method,
            endpoint=endpoint,
            status_code=status_code,
        ).inc()
        
        HTTP_REQUEST_DURATION_SECONDS.labels(
            method=method,
            endpoint=endpoint,
        ).observe(duration)
        
        return response


class LoggingMiddleware(BaseHTTPMiddleware):
    """Middleware to add structured logging context."""
    
    def __init__(self, app, skip_paths: list = None):
        super().__init__(app)
        self.skip_paths = skip_paths or ["/metrics", "/health"]
        self.logger = get_logger("http")
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Skip logging for certain paths
        if any(request.url.path.startswith(path) for path in self.skip_paths):
            return await call_next(request)
        
        # Generate request ID
        request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
        
        # Bind context
        bind_request_context(
            request_id=request_id,
            client_ip=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
        )
        
        start_time = time.time()
        
        self.logger.info(
            "request_started",
            method=request.method,
            path=request.url.path,
            query=str(request.query_params),
        )
        
        try:
            response = await call_next(request)
            
            duration = time.time() - start_time
            
            self.logger.info(
                "request_completed",
                method=request.method,
                path=request.url.path,
                status_code=response.status_code,
                duration_ms=round(duration * 1000, 2),
            )
            
            # Add request ID to response
            response.headers["X-Request-ID"] = request_id
            
            return response
            
        except Exception as e:
            duration = time.time() - start_time
            
            self.logger.exception(
                "request_failed",
                method=request.method,
                path=request.url.path,
                error=str(e),
                duration_ms=round(duration * 1000, 2),
            )
            raise
            
        finally:
            clear_context()


class CacheControlMiddleware(BaseHTTPMiddleware):
    """Middleware to add cache control headers."""
    
    def __init__(self, app, cache_config: dict = None):
        super().__init__(app)
        self.cache_config = cache_config or {
            "/api/v1/dashboard/": 60,  # 1 minute
            "/api/v1/investments/": 30,  # 30 seconds
            "/api/v1/files/": 0,  # No cache
        }
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)
        
        # Only add cache headers for GET requests
        if request.method != "GET":
            response.headers["Cache-Control"] = "no-store"
            return response
        
        # Check if path matches any cache config
        for path_prefix, max_age in self.cache_config.items():
            if request.url.path.startswith(path_prefix):
                if max_age > 0:
                    response.headers["Cache-Control"] = f"public, max-age={max_age}"
                else:
                    response.headers["Cache-Control"] = "no-store"
                break
        
        return response


# =============================================================================
# RESPONSE CACHING DECORATOR
# =============================================================================

def cache_response(expire_seconds: int = 60, key_prefix: str = "api_cache"):
    """
    Cache API responses in Redis.
    
    Args:
        expire_seconds: Cache TTL in seconds
        key_prefix: Prefix for cache keys
    
    Usage:
        @router.get("/stats")
        @cache_response(expire_seconds=60)
        async def get_stats():
            return expensive_calculation()
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            redis = get_redis()
            
            # Generate cache key from function name and arguments
            cache_key_parts = [key_prefix, func.__name__]
            
            # Add args to cache key (skip Request and AsyncSession objects)
            for arg in args:
                if hasattr(arg, '__class__'):
                    class_name = arg.__class__.__name__
                    if class_name not in ('Request', 'AsyncSession', 'Depends'):
                        cache_key_parts.append(str(hash(str(arg))))
            
            # Add kwargs to cache key (skip db and request)
            for key, value in sorted(kwargs.items()):
                if key not in ('db', 'request'):
                    cache_key_parts.append(f"{key}={hash(str(value))}")
            
            cache_key = ":".join(cache_key_parts)
            
            # Try to get from cache
            try:
                cached = redis.get(cache_key)
                if cached:
                    # Return cached response
                    return json.loads(cached)
            except Exception:
                # Redis unavailable, continue without caching
                pass
            
            # Call the actual function
            result = await func(*args, **kwargs)
            
            # Cache the result
            try:
                redis.setex(
                    cache_key,
                    expire_seconds,
                    json.dumps(result, default=str)
                )
            except Exception:
                # Redis unavailable, continue without caching
                pass
            
            return result
        
        return wrapper
    return decorator


def invalidate_cache_pattern(pattern: str):
    """
    Invalidate cache keys matching a pattern.
    
    Args:
        pattern: Redis key pattern to match (e.g., "api_cache:stats:*")
    """
    redis = get_redis()
    try:
        keys = redis.keys(pattern)
        if keys:
            redis.delete(*keys)
    except Exception:
        pass


def invalidate_dashboard_cache():
    """Invalidate all dashboard-related cache."""
    invalidate_cache_pattern("api_cache:*dashboard*")
    invalidate_cache_pattern("api_cache:*stats*")
    invalidate_cache_pattern("api_cache:*category*")


def invalidate_investment_cache(investment_id: Optional[str] = None):
    """Invalidate investment-related cache."""
    if investment_id:
        invalidate_cache_pattern(f"api_cache:*{investment_id}*")
    invalidate_cache_pattern("api_cache:*investment*")
    invalidate_cache_pattern("api_cache:*list_investments*")


def invalidate_file_cache(file_id: Optional[str] = None):
    """Invalidate file-related cache."""
    if file_id:
        invalidate_cache_pattern(f"api_cache:*{file_id}*")
    invalidate_cache_pattern("api_cache:*file*")
    invalidate_cache_pattern("api_cache:*list_files*")
