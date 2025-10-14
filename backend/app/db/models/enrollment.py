"""
Enrollment model for course subscriptions.
"""

from sqlalchemy import Column, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base import Base
import uuid
from datetime import datetime


class Enrollment(Base):
    """Enrollment model for tracking user course subscriptions."""

    __tablename__ = "enrollments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    course_id = Column(
        UUID(as_uuid=True), ForeignKey("courses.id", ondelete="CASCADE"), index=True
    )
    enrolled_at = Column(DateTime, default=datetime.utcnow)
    last_accessed_at = Column(DateTime)

    # Relationships
    user = relationship("User")
    course = relationship("Course", back_populates="enrollments")

    # Constraints
    __table_args__ = (
        UniqueConstraint("user_id", "course_id", name="unique_user_course"),
    )
