"""
Pydantic schemas for dashboard and analytics operations.
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from uuid import UUID
from app.db.models.content import ContentType


class DashboardStats(BaseModel):
    """Schema for user dashboard statistics."""

    enrolled_courses: int = Field(ge=0, description="Number of enrolled courses")
    completed_courses: int = Field(ge=0, description="Number of completed courses")
    total_learning_time: int = Field(ge=0, description="Total learning time in minutes")
    notes_count: int = Field(ge=0, description="Number of notes created")
    current_streak: "LearningStreak"
    recent_activity: List["RecentActivity"]

    class Config:
        from_attributes = True


class LearningStreak(BaseModel):
    """Schema for learning streak information."""

    current_streak: int = Field(ge=0, description="Current learning streak in days")
    longest_streak: int = Field(ge=0, description="Longest learning streak in days")
    last_activity: Optional[datetime] = Field(None, description="Last activity date")

    class Config:
        from_attributes = True


class RecentActivity(BaseModel):
    """Schema for recent activity item."""

    type: str = Field(description="Type of activity (progress, note, enrollment)")
    description: str = Field(description="Activity description")
    course_title: Optional[str] = Field(None, description="Related course title")
    timestamp: datetime = Field(description="Activity timestamp")

    class Config:
        from_attributes = True


class UserProgressAnalytics(BaseModel):
    """Schema for user progress analytics."""

    period_days: int = Field(description="Analysis period in days")
    progress_over_time: List[Dict[str, Any]] = Field(
        description="Progress over time data"
    )
    course_performance: List["CoursePerformance"]
    content_engagement: List["ContentEngagement"]

    class Config:
        from_attributes = True


class CoursePerformance(BaseModel):
    """Schema for course performance data."""

    course_id: UUID
    course_title: str
    avg_progress: float = Field(ge=0, le=100, description="Average progress percentage")
    progress_count: int = Field(ge=0, description="Number of progress updates")
    last_activity: Optional[datetime] = Field(
        None, description="Last activity timestamp"
    )

    class Config:
        from_attributes = True


class ContentEngagement(BaseModel):
    """Schema for content engagement data."""

    content_id: UUID
    title: str
    type: ContentType
    avg_progress: float = Field(ge=0, le=100, description="Average progress percentage")
    interaction_count: int = Field(ge=0, description="Number of interactions")

    class Config:
        from_attributes = True


class CourseAnalytics(BaseModel):
    """Schema for course-specific analytics."""

    course_id: UUID
    course_title: str
    enrolled_at: datetime
    total_progress_entries: int = Field(ge=0, description="Total progress entries")
    avg_progress: float = Field(ge=0, le=100, description="Average progress percentage")
    max_progress: int = Field(ge=0, le=100, description="Maximum progress percentage")
    content_accessed: int = Field(ge=0, description="Number of content items accessed")
    last_activity: Optional[datetime] = Field(
        None, description="Last activity timestamp"
    )
    notes_count: int = Field(ge=0, description="Number of notes for this course")
    content_breakdown: List[Dict[str, Any]] = Field(
        description="Content progress breakdown"
    )

    class Config:
        from_attributes = True


class AdminAnalytics(BaseModel):
    """Schema for admin analytics."""

    total_users: int = Field(ge=0, description="Total number of users")
    total_courses: int = Field(ge=0, description="Total number of courses")
    published_courses: int = Field(ge=0, description="Number of published courses")
    total_enrollments: int = Field(ge=0, description="Total number of enrollments")
    completion_rate: float = Field(ge=0, le=100, description="Overall completion rate")
    recent_activity: Dict[str, int] = Field(description="Recent activity statistics")

    class Config:
        from_attributes = True


class LearningPathRecommendation(BaseModel):
    """Schema for learning path recommendations."""

    course_id: UUID
    course_title: str
    reason: str = Field(description="Reason for recommendation")
    difficulty: str = Field(description="Course difficulty level")
    estimated_duration: int = Field(ge=0, description="Estimated duration in hours")
    prerequisites_met: bool = Field(description="Whether prerequisites are met")

    class Config:
        from_attributes = True


class StudySession(BaseModel):
    """Schema for study session data."""

    session_id: UUID
    course_id: UUID
    content_id: UUID
    start_time: datetime
    end_time: Optional[datetime] = None
    duration_minutes: Optional[int] = Field(
        None, ge=0, description="Session duration in minutes"
    )
    progress_made: int = Field(ge=0, le=100, description="Progress made during session")
    notes_created: int = Field(ge=0, description="Number of notes created")

    class Config:
        from_attributes = True


class Achievement(BaseModel):
    """Schema for user achievements."""

    achievement_id: UUID
    name: str = Field(description="Achievement name")
    description: str = Field(description="Achievement description")
    icon: str = Field(description="Achievement icon")
    earned_at: datetime = Field(description="When achievement was earned")
    category: str = Field(description="Achievement category")

    class Config:
        from_attributes = True
