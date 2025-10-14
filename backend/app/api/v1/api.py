"""
API v1 router aggregation.
"""

from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth,
    courses,
    enrollments,
    notes,
    upload,
    progress,
    streaming,
    dashboard,
    websocket,
    monitoring,
    search,
)

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(auth.router)
api_router.include_router(courses.router)
api_router.include_router(enrollments.router)
api_router.include_router(notes.router)
api_router.include_router(upload.router)
api_router.include_router(progress.router)
api_router.include_router(streaming.router)
api_router.include_router(dashboard.router)
api_router.include_router(websocket.router)
api_router.include_router(monitoring.router)
api_router.include_router(search.router)
