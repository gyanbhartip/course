"""
Course model for course management.
"""

from sqlalchemy import (
    Column,
    String,
    Text,
    Integer,
    DateTime,
    Enum,
    ForeignKey,
    BigInteger,
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.db.base import Base
import uuid
from datetime import datetime
import enum


class DifficultyLevel(str, enum.Enum):
    """Course difficulty level enumeration."""

    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"


class CourseStatus(str, enum.Enum):
    """Course status enumeration."""

    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"


class Course(Base):
    """Course model for storing course information."""

    __tablename__ = "courses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(500), nullable=False)
    description = Column(Text)
    instructor = Column(String(255), nullable=False)
    thumbnail_url = Column(String(500))
    duration = Column(Integer)  # Total minutes
    difficulty = Column(Enum(DifficultyLevel), nullable=False)
    category = Column(String(100), index=True)
    status = Column(Enum(CourseStatus), default=CourseStatus.DRAFT, index=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    contents = relationship(
        "CourseContent", back_populates="course", cascade="all, delete-orphan"
    )
    enrollments = relationship("Enrollment", back_populates="course")
