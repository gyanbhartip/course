"""
Pydantic schemas for enrollment operations.
"""

from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID


class EnrollmentBase(BaseModel):
    """Base enrollment schema."""

    user_id: UUID
    course_id: UUID


class EnrollmentCreate(EnrollmentBase):
    """Schema for enrollment creation."""

    pass


class EnrollmentResponse(EnrollmentBase):
    """Schema for enrollment response."""

    id: UUID
    enrolled_at: datetime
    last_accessed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class EnrollmentWithCourse(EnrollmentResponse):
    """Schema for enrollment with course details."""

    course: dict  # Will be populated with course data
