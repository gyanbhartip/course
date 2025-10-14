"""
Pydantic schemas for progress tracking operations.
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID
from app.db.models.content import ContentType


class ProgressBase(BaseModel):
    """Base progress schema."""

    course_id: UUID
    content_id: UUID
    progress_percentage: int = Field(
        ge=0, le=100, description="Progress percentage (0-100)"
    )
    last_position: Optional[int] = Field(
        None, ge=0, description="Last position in seconds"
    )


class ProgressCreate(ProgressBase):
    """Schema for progress creation."""

    completed: Optional[bool] = False


class ProgressUpdate(BaseModel):
    """Schema for progress updates."""

    progress_percentage: Optional[int] = Field(None, ge=0, le=100)
    last_position: Optional[int] = Field(None, ge=0)
    completed: Optional[bool] = None


class ProgressResponse(ProgressBase):
    """Schema for progress response."""

    id: Optional[UUID] = None
    user_id: UUID
    completed: bool
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ContentProgressResponse(BaseModel):
    """Schema for content progress in course summary."""

    content_id: UUID
    title: str
    type: ContentType
    progress_percentage: int
    completed: bool
    last_position: Optional[int] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class CourseProgressSummary(BaseModel):
    """Schema for course progress summary."""

    course_id: UUID
    course_title: str
    total_content: int
    completed_content: int
    overall_progress: float = Field(
        ge=0, le=100, description="Overall course progress percentage"
    )
    content_progress: List[ContentProgressResponse]

    class Config:
        from_attributes = True


class ProgressAnalytics(BaseModel):
    """Schema for progress analytics."""

    total_courses_enrolled: int
    total_content_completed: int
    total_learning_time: int = Field(description="Total learning time in minutes")
    average_progress: float = Field(ge=0, le=100)
    completion_rate: float = Field(ge=0, le=100)
    streak_days: int = Field(ge=0, description="Current learning streak in days")
    last_activity: Optional[datetime] = None

    class Config:
        from_attributes = True
