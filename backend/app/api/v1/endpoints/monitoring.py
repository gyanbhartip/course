"""
Monitoring and health check endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from typing import Dict, Any
from app.core.monitoring import (
    get_metrics,
    get_health_status,
    get_monitoring_stats,
    health_checker,
)
from app.api.deps import require_admin
from app.db.models.user import User

router = APIRouter(prefix="/monitoring", tags=["monitoring"])


@router.get("/health")
async def health_check():
    """
    Application health check endpoint.

    Returns:
        Dict[str, Any]: Health status of all services
    """
    return await health_checker.run_all_checks()


@router.get("/metrics")
async def metrics():
    """
    Prometheus metrics endpoint.

    Returns:
        str: Prometheus metrics in text format
    """
    metrics_data = get_metrics()
    return Response(
        content=metrics_data, media_type="text/plain; version=0.0.4; charset=utf-8"
    )


@router.get("/stats", response_model=Dict[str, Any])
async def monitoring_stats(current_user: User = Depends(require_admin)):
    """
    Get comprehensive monitoring statistics.

    Args:
        current_user: Current admin user

    Returns:
        Dict[str, Any]: Monitoring statistics
    """
    return get_monitoring_stats()


@router.get("/health/database")
async def database_health():
    """
    Database health check.

    Returns:
        Dict[str, Any]: Database health status
    """
    return await health_checker.check_database()


@router.get("/health/redis")
async def redis_health():
    """
    Redis health check.

    Returns:
        Dict[str, Any]: Redis health status
    """
    return await health_checker.check_redis()


@router.get("/health/storage")
async def storage_health():
    """
    Storage health check.

    Returns:
        Dict[str, Any]: Storage health status
    """
    return await health_checker.check_storage()
