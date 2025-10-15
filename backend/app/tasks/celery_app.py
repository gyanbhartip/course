"""
Celery application configuration for background task processing.
"""

from celery import Celery
from app.core.config import settings

# Create Celery application
celery_app = Celery(
    "lms_tasks",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=[
        "app.tasks.video",
        "app.tasks.notifications",
        # NOTE: analytics module not present; remove to avoid import errors
    ],
)

# Celery configuration
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=30 * 60,  # 30 minutes
    task_soft_time_limit=25 * 60,  # 25 minutes
    worker_prefetch_multiplier=1,
    worker_max_tasks_per_child=1000,
    result_expires=3600,  # 1 hour
    task_routes={
        "app.tasks.video.*": {"queue": "video_processing"},
        "app.tasks.notifications.*": {"queue": "notifications"},
    },
    task_default_queue="default",
    task_queues={
        "default": {
            "exchange": "default",
            "routing_key": "default",
        },
        "video_processing": {
            "exchange": "video_processing",
            "routing_key": "video_processing",
        },
        "notifications": {
            "exchange": "notifications",
            "routing_key": "notifications",
        },
    },
)

# Optional configuration for development
if settings.DEBUG:
    celery_app.conf.update(
        task_always_eager=False,  # Set to True for testing
        task_eager_propagates=True,
    )
