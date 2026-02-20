"""
===============================================================================
PROMETHEUS METRICS CONFIGURATION
===============================================================================
Implements best practices from web research:
- Counter, Histogram, Gauge metrics
- Label naming conventions
- Business and infrastructure metrics
"""
from prometheus_client import (
    Counter,
    Histogram,
    Gauge,
    Info,
    generate_latest,
    CONTENT_TYPE_LATEST,
)
from fastapi import Response

# =============================================================================
# APPLICATION INFO
# =============================================================================

APP_INFO = Info("app", "Application information")
APP_INFO.info({
    "name": "family-investment-dashboard",
    "version": "2.0.0",
})

# =============================================================================
# HTTP REQUEST METRICS
# =============================================================================

# Request counter with labels for method, endpoint, and status
HTTP_REQUESTS_TOTAL = Counter(
    "http_requests_total",
    "Total number of HTTP requests",
    ["method", "endpoint", "status_code"],
)

# Request duration histogram
HTTP_REQUEST_DURATION_SECONDS = Histogram(
    "http_request_duration_seconds",
    "HTTP request duration in seconds",
    ["method", "endpoint"],
    buckets=[0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0],
)

# Request size histogram
HTTP_REQUEST_SIZE_BYTES = Histogram(
    "http_request_size_bytes",
    "HTTP request size in bytes",
    buckets=[100, 1000, 10000, 100000, 1000000, 10000000],
)

# Response size histogram
HTTP_RESPONSE_SIZE_BYTES = Histogram(
    "http_response_size_bytes",
    "HTTP response size in bytes",
    buckets=[100, 1000, 10000, 100000, 1000000, 10000000],
)

# =============================================================================
# BUSINESS METRICS
# =============================================================================

# Investment metrics
ACTIVE_INVESTMENTS = Gauge(
    "active_investments_total",
    "Number of active investments",
    ["category"],
)

INVESTMENT_TOTAL_VALUE = Gauge(
    "investment_total_value",
    "Total value of investments",
    ["category", "currency"],
)

INVESTMENT_COUNT = Gauge(
    "investment_count",
    "Count of investments",
    ["category", "status"],
)

# File metrics
FILES_STORED_TOTAL = Gauge(
    "files_stored_total",
    "Total number of files in storage",
    ["status"],
)

FILE_STORAGE_BYTES = Gauge(
    "file_storage_bytes",
    "Total bytes stored",
    ["bucket"],
)

# Analysis metrics
PENDING_ANALYSES = Gauge(
    "pending_analyses_total",
    "Number of pending analyses",
)

ANALYSIS_JOBS_TOTAL = Counter(
    "analysis_jobs_total",
    "Total number of analysis jobs processed",
    ["job_type", "status"],
)

ANALYSIS_DURATION_SECONDS = Histogram(
    "analysis_duration_seconds",
    "Analysis job duration in seconds",
    ["job_type"],
    buckets=[1.0, 5.0, 10.0, 30.0, 60.0, 120.0, 300.0, 600.0],
)

# =============================================================================
# AI PROVIDER METRICS
# =============================================================================

AI_REQUESTS_TOTAL = Counter(
    "ai_requests_total",
    "Total number of AI API requests",
    ["provider", "model", "status"],
)

AI_REQUEST_DURATION_SECONDS = Histogram(
    "ai_request_duration_seconds",
    "AI API request duration in seconds",
    ["provider", "model"],
    buckets=[0.5, 1.0, 2.5, 5.0, 10.0, 30.0, 60.0],
)

AI_TOKENS_USED_TOTAL = Counter(
    "ai_tokens_used_total",
    "Total number of tokens used",
    ["provider", "model"],
)

AI_TOKENS_PER_REQUEST = Histogram(
    "ai_tokens_per_request",
    "Number of tokens per request",
    ["provider", "model"],
    buckets=[100, 250, 500, 1000, 2000, 4000, 8000, 16000],
)

# =============================================================================
# DATABASE METRICS
# =============================================================================

DB_CONNECTIONS_ACTIVE = Gauge(
    "db_connections_active",
    "Number of active database connections",
)

DB_CONNECTIONS_IDLE = Gauge(
    "db_connections_idle",
    "Number of idle database connections",
)

DB_QUERY_DURATION_SECONDS = Histogram(
    "db_query_duration_seconds",
    "Database query duration in seconds",
    ["operation", "table"],
    buckets=[0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0],
)

# =============================================================================
# CACHE METRICS
# =============================================================================

CACHE_HITS_TOTAL = Counter(
    "cache_hits_total",
    "Total number of cache hits",
    ["cache_name"],
)

CACHE_MISSES_TOTAL = Counter(
    "cache_misses_total",
    "Total number of cache misses",
    ["cache_name"],
)

CACHE_OPERATION_DURATION_SECONDS = Histogram(
    "cache_operation_duration_seconds",
    "Cache operation duration in seconds",
    ["operation", "cache_name"],
    buckets=[0.001, 0.005, 0.01, 0.025, 0.05],
)

# =============================================================================
# METRIC UPDATE HELPERS
# =============================================================================

def update_investment_metrics(category: str, count: int, total_value: float, currency: str = "BRL"):
    """Update investment-related metrics."""
    INVESTMENT_COUNT.labels(category=category, status="active").set(count)
    INVESTMENT_TOTAL_VALUE.labels(category=category, currency=currency).set(total_value)


def record_analysis_job(job_type: str, duration_seconds: float, success: bool = True):
    """Record analysis job completion."""
    status = "success" if success else "failure"
    ANALYSIS_JOBS_TOTAL.labels(job_type=job_type, status=status).inc()
    ANALYSIS_DURATION_SECONDS.labels(job_type=job_type).observe(duration_seconds)


def record_ai_request(provider: str, model: str, tokens: int, duration_seconds: float, success: bool = True):
    """Record AI provider request."""
    status = "success" if success else "failure"
    AI_REQUESTS_TOTAL.labels(provider=provider, model=model, status=status).inc()
    AI_TOKENS_USED_TOTAL.labels(provider=provider, model=model).inc(tokens)
    AI_TOKENS_PER_REQUEST.labels(provider=provider, model=model).observe(tokens)
    AI_REQUEST_DURATION_SECONDS.labels(provider=provider, model=model).observe(duration_seconds)


def record_db_query(operation: str, table: str, duration_seconds: float):
    """Record database query duration."""
    DB_QUERY_DURATION_SECONDS.labels(operation=operation, table=table).observe(duration_seconds)


def record_cache_hit(cache_name: str = "default"):
    """Record cache hit."""
    CACHE_HITS_TOTAL.labels(cache_name=cache_name).inc()


def record_cache_miss(cache_name: str = "default"):
    """Record cache miss."""
    CACHE_MISSES_TOTAL.labels(cache_name=cache_name).inc()


def get_metrics_response() -> Response:
    """Generate Prometheus metrics response."""
    return Response(
        content=generate_latest(),
        media_type=CONTENT_TYPE_LATEST,
    )
