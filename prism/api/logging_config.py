"""
===============================================================================
STRUCTURED LOGGING CONFIGURATION
===============================================================================
Implements best practices from web research:
- JSON output in production, pretty console in development
- Context binding for request tracing
- Proper log levels and filtering
"""
import os
import sys
import logging
from typing import Any, Dict

import structlog
from structlog.contextvars import merge_contextvars
from structlog.dev import ConsoleRenderer, set_exc_info
from structlog.processors import (
    CallsiteParameter,
    CallsiteParameterAdder,
    EventRenamer,
    JSONRenderer,
    StackInfoRenderer,
    TimeStamper,
    add_log_level,
    format_exc_info,
)


def configure_logging():
    """Configure structured logging for the application."""
    
    # Determine if running in production
    is_production = os.getenv("ENVIRONMENT", "development").lower() == "production"
    log_level = os.getenv("LOG_LEVEL", "INFO").upper()
    
    # Shared processors (run for both dev and production)
    shared_processors = [
        # Merge context variables (for request tracing)
        merge_contextvars,
        # Add log level
        add_log_level,
        # Add stack info
        StackInfoRenderer(),
        # Set exc_info for exceptions
        set_exc_info,
        # Add timestamp
        TimeStamper(fmt="iso" if is_production else "%Y-%m-%d %H:%M:%S", utc=is_production),
        # Add module and line number for debugging
        CallsiteParameterAdder([CallsiteParameter.MODULE, CallsiteParameter.LINENO]),
    ]
    
    if is_production:
        # Production: JSON output for log aggregation
        processors = shared_processors + [
            # Format exception info as a structured field
            format_exc_info,
            # Rename "event" to "msg" for compatibility with some log aggregators
            EventRenamer("msg"),
            # JSON renderer
            JSONRenderer(),
        ]
        logger_factory = structlog.stdlib.LoggerFactory()
        wrapper_class = structlog.stdlib.BoundLogger
    else:
        # Development: Pretty console output
        processors = shared_processors + [
            # Pretty console renderer with colors
            ConsoleRenderer(colors=True),
        ]
        logger_factory = structlog.PrintLoggerFactory()
        wrapper_class = structlog.make_filtering_bound_logger(getattr(logging, log_level))
    
    # Configure structlog
    structlog.configure(
        processors=processors,
        context_class=dict,
        logger_factory=logger_factory,
        wrapper_class=wrapper_class,
        cache_logger_on_first_use=True,
    )
    
    # Configure standard library logging to use structlog
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=getattr(logging, log_level),
    )



def get_logger(name: str = None) -> structlog.stdlib.BoundLogger:
    """Get a structured logger instance."""
    return structlog.get_logger(name)


def bind_request_context(
    request_id: str = None,
    user_id: str = None,
    client_ip: str = None,
    **kwargs
) -> Dict[str, Any]:
    """Bind context variables for request tracing."""
    context = {}
    
    if request_id:
        context["request_id"] = request_id
    if user_id:
        context["user_id"] = user_id
    if client_ip:
        context["client_ip"] = client_ip
    
    context.update(kwargs)
    
    # Bind to structlog context
    structlog.contextvars.bind_contextvars(**context)
    
    return context


def clear_context():
    """Clear all bound context variables."""
    structlog.contextvars.clear_contextvars()


def unbind_context(*keys):
    """Unbind specific context variables."""
    structlog.contextvars.unbind_contextvars(*keys)


# =============================================================================
# FASTAPI INTEGRATION
# =============================================================================

from fastapi import Request
import uuid


async def logging_middleware(request: Request, call_next):
    """Middleware to add request context to logs."""
    # Generate request ID if not present
    request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
    
    # Bind context
    bind_request_context(
        request_id=request_id,
        client_ip=request.client.host if request.client else None,
        method=request.method,
        path=request.url.path,
    )
    
    # Get logger
    logger = get_logger()
    
    # Log request start
    logger.info("request_started")
    
    try:
        response = await call_next(request)
        
        # Log request completion
        logger.info(
            "request_completed",
            status_code=response.status_code,
        )
        
        # Add request ID to response headers
        response.headers["X-Request-ID"] = request_id
        
        return response
        
    except Exception as e:
        logger.exception("request_failed", error=str(e))
        raise
        
    finally:
        # Clear context for next request
        clear_context()


# =============================================================================
# LOGGING HELPERS
# =============================================================================

def log_investment_event(
    logger: structlog.stdlib.BoundLogger,
    event: str,
    investment_id: str,
    **kwargs
):
    """Log investment-related events with consistent structure."""
    logger.info(
        event,
        investment_id=investment_id,
        entity_type="investment",
        **kwargs
    )


def log_file_event(
    logger: structlog.stdlib.BoundLogger,
    event: str,
    file_id: str,
    **kwargs
):
    """Log file-related events with consistent structure."""
    logger.info(
        event,
        file_id=file_id,
        entity_type="file",
        **kwargs
    )


def log_analysis_event(
    logger: structlog.stdlib.BoundLogger,
    event: str,
    job_id: str,
    file_id: str = None,
    **kwargs
):
    """Log analysis-related events with consistent structure."""
    logger.info(
        event,
        job_id=job_id,
        file_id=file_id,
        entity_type="analysis",
        **kwargs
    )


def log_ai_request(
    logger: structlog.stdlib.BoundLogger,
    provider: str,
    model: str,
    tokens_used: int,
    duration_ms: float,
    success: bool = True,
    error: str = None,
):
    """Log AI provider requests with metrics."""
    log_data = {
        "provider": provider,
        "model": model,
        "tokens_used": tokens_used,
        "duration_ms": duration_ms,
        "success": success,
    }
    
    if error:
        log_data["error"] = error
        logger.warning("ai_request_failed", **log_data)
    else:
        logger.info("ai_request_completed", **log_data)


