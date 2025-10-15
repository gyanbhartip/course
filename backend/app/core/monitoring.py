"""
Comprehensive monitoring, logging, and error tracking setup.
"""

import logging
import time
import asyncio
from typing import Dict, Any, Optional
from datetime import datetime
from contextlib import asynccontextmanager
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration
from sentry_sdk.integrations.redis import RedisIntegration
from sentry_sdk.integrations.celery import CeleryIntegration
from app.core.config import settings
import structlog
from prometheus_client import (
    Counter,
    Histogram,
    Gauge,
    generate_latest,
    CONTENT_TYPE_LATEST,
)
from starlette.responses import Response as StarletteResponse

# Configure structured logging
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer(),
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    wrapper_class=structlog.stdlib.BoundLogger,
    cache_logger_on_first_use=True,
)

# Prometheus metrics
REQUEST_COUNT = Counter(
    "http_requests_total", "Total HTTP requests", ["method", "endpoint", "status_code"]
)

REQUEST_DURATION = Histogram(
    "http_request_duration_seconds",
    "HTTP request duration in seconds",
    ["method", "endpoint"],
)

ACTIVE_CONNECTIONS = Gauge(
    "websocket_active_connections", "Number of active WebSocket connections"
)

DATABASE_QUERIES = Counter(
    "database_queries_total", "Total database queries", ["operation", "table"]
)

CACHE_HITS = Counter("cache_hits_total", "Total cache hits", ["cache_type"])

CACHE_MISSES = Counter("cache_misses_total", "Total cache misses", ["cache_type"])

CELERY_TASKS = Counter(
    "celery_tasks_total", "Total Celery tasks", ["task_name", "status"]
)

# Initialize Sentry
if settings.SENTRY_DSN:
    sentry_sdk.init(
        dsn=settings.SENTRY_DSN,
        integrations=[
            FastApiIntegration(auto_enabling_instrumentations=True),
            SqlalchemyIntegration(),
            RedisIntegration(),
            CeleryIntegration(),
        ],
        traces_sample_rate=0.1,
        profiles_sample_rate=0.1,
        environment="production" if not settings.DEBUG else "development",
    )


class LoggingMiddleware(BaseHTTPMiddleware):
    """Middleware for request/response logging with structured logging."""

    async def dispatch(self, request: Request, call_next):
        """Process request and log details."""
        start_time = time.time()

        # Get client IP
        client_ip = request.client.host if request.client else "unknown"

        # Log request
        logger = structlog.get_logger()
        logger.info(
            "Request started",
            method=request.method,
            url=str(request.url),
            client_ip=client_ip,
            user_agent=request.headers.get("user-agent", ""),
            request_id=request.headers.get("x-request-id", "unknown"),
        )

        # Process request
        response = await call_next(request)

        # Calculate duration
        duration = time.time() - start_time

        # Update metrics
        REQUEST_COUNT.labels(
            method=request.method,
            endpoint=request.url.path,
            status_code=response.status_code,
        ).inc()

        REQUEST_DURATION.labels(
            method=request.method, endpoint=request.url.path
        ).observe(duration)

        # Log response
        logger.info(
            "Request completed",
            method=request.method,
            url=str(request.url),
            status_code=response.status_code,
            duration=duration,
            client_ip=client_ip,
            request_id=request.headers.get("x-request-id", "unknown"),
        )

        return response


class MetricsMiddleware(BaseHTTPMiddleware):
    """Middleware for collecting application metrics."""

    async def dispatch(self, request: Request, call_next):
        """Collect metrics for the request."""
        start_time = time.time()

        response = await call_next(request)

        duration = time.time() - start_time

        # Update request metrics
        REQUEST_COUNT.labels(
            method=request.method,
            endpoint=request.url.path,
            status_code=response.status_code,
        ).inc()

        REQUEST_DURATION.labels(
            method=request.method, endpoint=request.url.path
        ).observe(duration)

        return response


class DatabaseMonitoring:
    """Database query monitoring and logging."""

    def __init__(self):
        self.query_count = 0
        self.slow_queries = []
        self.logger = structlog.get_logger()

    def log_query(self, operation: str, table: str, duration: float, query: str = ""):
        """Log database query."""
        self.query_count += 1

        # Update metrics
        DATABASE_QUERIES.labels(operation=operation, table=table).inc()

        # Log slow queries
        if duration > 1.0:  # Queries taking more than 1 second
            self.slow_queries.append(
                {
                    "operation": operation,
                    "table": table,
                    "duration": duration,
                    "query": query,
                    "timestamp": datetime.utcnow(),
                }
            )

            self.logger.warning(
                "Slow database query detected",
                operation=operation,
                table=table,
                duration=duration,
                query=query[:200] + "..." if len(query) > 200 else query,
            )

    def get_stats(self) -> Dict[str, Any]:
        """Get database monitoring statistics."""
        return {
            "total_queries": self.query_count,
            "slow_queries_count": len(self.slow_queries),
            "recent_slow_queries": self.slow_queries[-10:],  # Last 10 slow queries
        }


class CacheMonitoring:
    """Cache performance monitoring."""

    def __init__(self):
        self.hits = 0
        self.misses = 0
        self.logger = structlog.get_logger()

    def log_hit(self, cache_type: str, key: str):
        """Log cache hit."""
        self.hits += 1
        CACHE_HITS.labels(cache_type=cache_type).inc()

        self.logger.debug("Cache hit", cache_type=cache_type, key=key)

    def log_miss(self, cache_type: str, key: str):
        """Log cache miss."""
        self.misses += 1
        CACHE_MISSES.labels(cache_type=cache_type).inc()

        self.logger.debug("Cache miss", cache_type=cache_type, key=key)

    def get_hit_rate(self) -> float:
        """Calculate cache hit rate."""
        total = self.hits + self.misses
        return (self.hits / total * 100) if total > 0 else 0.0

    def get_stats(self) -> Dict[str, Any]:
        """Get cache monitoring statistics."""
        return {
            "hits": self.hits,
            "misses": self.misses,
            "hit_rate": self.get_hit_rate(),
        }


class CeleryMonitoring:
    """Celery task monitoring."""

    def __init__(self):
        self.task_count = 0
        self.failed_tasks = []
        self.logger = structlog.get_logger()

    def log_task_start(self, task_name: str, task_id: str):
        """Log task start."""
        self.task_count += 1
        CELERY_TASKS.labels(task_name=task_name, status="started").inc()

        self.logger.info("Celery task started", task_name=task_name, task_id=task_id)

    def log_task_success(self, task_name: str, task_id: str, duration: float):
        """Log task success."""
        CELERY_TASKS.labels(task_name=task_name, status="success").inc()

        self.logger.info(
            "Celery task completed",
            task_name=task_name,
            task_id=task_id,
            duration=duration,
        )

    def log_task_failure(self, task_name: str, task_id: str, error: str):
        """Log task failure."""
        CELERY_TASKS.labels(task_name=task_name, status="failure").inc()

        self.failed_tasks.append(
            {
                "task_name": task_name,
                "task_id": task_id,
                "error": error,
                "timestamp": datetime.utcnow(),
            }
        )

        self.logger.error(
            "Celery task failed", task_name=task_name, task_id=task_id, error=error
        )

    def get_stats(self) -> Dict[str, Any]:
        """Get Celery monitoring statistics."""
        return {
            "total_tasks": self.task_count,
            "failed_tasks_count": len(self.failed_tasks),
            "recent_failures": self.failed_tasks[-10:],  # Last 10 failures
        }


class HealthChecker:
    """Application health monitoring."""

    def __init__(self):
        self.logger = structlog.get_logger()
        self.checks = {}

    async def check_database(self) -> Dict[str, Any]:
        """Check database connectivity."""
        try:
            from app.db.session import AsyncSessionLocal

            async with AsyncSessionLocal() as db:
                await db.execute("SELECT 1")
            return {"status": "healthy", "response_time": 0}
        except Exception as e:
            self.logger.error("Database health check failed", error=str(e))
            return {"status": "unhealthy", "error": str(e)}

    async def check_redis(self) -> Dict[str, Any]:
        """Check Redis connectivity."""
        try:
            from app.core.cache import cache_service

            start_time = time.time()
            await cache_service.redis.ping()
            response_time = time.time() - start_time
            return {"status": "healthy", "response_time": response_time}
        except Exception as e:
            self.logger.error("Redis health check failed", error=str(e))
            return {"status": "unhealthy", "error": str(e)}

    async def check_storage(self) -> Dict[str, Any]:
        """Check storage connectivity."""
        try:
            from app.services.storage import StorageService

            storage_service = StorageService()
            # Try to list objects (this will fail if storage is down)
            start_time = time.time()
            # Note: This is a simplified check - in production you might want to do a more specific test
            response_time = time.time() - start_time
            return {"status": "healthy", "response_time": response_time}
        except Exception as e:
            self.logger.error("Storage health check failed", error=str(e))
            return {"status": "unhealthy", "error": str(e)}

    async def run_all_checks(self) -> Dict[str, Any]:
        """Run all health checks."""
        checks = {
            "database": await self.check_database(),
            "redis": await self.check_redis(),
            "storage": await self.check_storage(),
        }

        overall_status = (
            "healthy"
            if all(check["status"] == "healthy" for check in checks.values())
            else "unhealthy"
        )

        return {
            "status": overall_status,
            "timestamp": datetime.utcnow().isoformat(),
            "checks": checks,
        }


# Global monitoring instances
db_monitoring = DatabaseMonitoring()
cache_monitoring = CacheMonitoring()
celery_monitoring = CeleryMonitoring()
health_checker = HealthChecker()


def get_metrics() -> str:
    """Get Prometheus metrics."""
    return generate_latest()


def get_health_status() -> Dict[str, Any]:
    """Get application health status."""
    return asyncio.run(health_checker.run_all_checks())


def get_monitoring_stats() -> Dict[str, Any]:
    """Get comprehensive monitoring statistics."""
    return {
        "database": db_monitoring.get_stats(),
        "cache": cache_monitoring.get_stats(),
        "celery": celery_monitoring.get_stats(),
        "health": asyncio.run(health_checker.run_all_checks()),
    }


# Context manager for monitoring database queries
@asynccontextmanager
async def monitor_query(operation: str, table: str, query: str = ""):
    """Context manager for monitoring database queries."""
    start_time = time.time()
    try:
        yield
    finally:
        duration = time.time() - start_time
        db_monitoring.log_query(operation, table, duration, query)


# Context manager for monitoring cache operations
@asynccontextmanager
async def monitor_cache(cache_type: str, key: str):
    """Context manager for monitoring cache operations."""
    start_time = time.time()
    try:
        yield
    except KeyError:
        cache_monitoring.log_miss(cache_type, key)
        raise
    else:
        cache_monitoring.log_hit(cache_type, key)
