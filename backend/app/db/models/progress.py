"""
Course progress model for tracking user learning progress.
"""

from sqlalchemy import (
    Column,
    Integer,
    DateTime,
    ForeignKey,
    Boolean,
    UniqueConstraint,
    Index,
)
from sqlalchemy.dialects.postgresql import UUID
from app.db.base import Base
import uuid
from datetime import datetime


class CourseProgress(Base):
    """Course progress model for tracking user learning progress."""

    __tablename__ = "course_progress"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    course_id = Column(UUID(as_uuid=True), ForeignKey("courses.id", ondelete="CASCADE"))
    content_id = Column(
        UUID(as_uuid=True), ForeignKey("course_contents.id", ondelete="CASCADE")
    )
    completed = Column(Boolean, default=False)
    progress_percentage = Column(Integer, default=0)
    last_position = Column(Integer)  # seconds for video resume
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Constraints and indexes
    __table_args__ = (
        UniqueConstraint("user_id", "content_id", name="unique_user_content_progress"),
        Index("idx_user_course_progress", "user_id", "course_id"),
        Index("idx_course_progress_content_id", "content_id"),
        Index("idx_course_progress_completed", "completed"),
        Index("idx_course_progress_user_completed", "user_id", "completed"),
    )
