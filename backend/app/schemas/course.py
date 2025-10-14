"""
Pydantic schemas for course-related operations.
"""

from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from uuid import UUID
from app.db.models.course import DifficultyLevel, CourseStatus


class CourseBase(BaseModel):
    """Base course schema."""

    title: str
    description: Optional[str] = None
    instructor: str
    difficulty: DifficultyLevel
    category: Optional[str] = None


class CourseCreate(CourseBase):
    """Schema for course creation."""

    thumbnail_url: Optional[str] = None
    duration: Optional[int] = None


class CourseUpdate(BaseModel):
    """Schema for course updates."""

    title: Optional[str] = None
    description: Optional[str] = None
    instructor: Optional[str] = None
    thumbnail_url: Optional[str] = None
    duration: Optional[int] = None
    difficulty: Optional[DifficultyLevel] = None
    category: Optional[str] = None
    status: Optional[CourseStatus] = None


class CourseResponse(CourseBase):
    """Schema for course response."""

    id: UUID
    thumbnail_url: Optional[str] = None
    duration: Optional[int] = None
    status: CourseStatus
    created_by: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CourseListResponse(BaseModel):
    """Schema for course list response with pagination."""

    courses: List[CourseResponse]
    total: int
    page: int
    size: int
    pages: int
