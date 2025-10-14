"""
API v1 router aggregation.
"""

from fastapi import APIRouter
from app.api.v1.endpoints import auth, courses, enrollments, notes, upload

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(auth.router)
api_router.include_router(courses.router)
api_router.include_router(enrollments.router)
api_router.include_router(notes.router)
api_router.include_router(upload.router)
