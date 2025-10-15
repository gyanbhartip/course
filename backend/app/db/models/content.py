"""
Course content model for storing course materials.
"""

import enum
import uuid
from datetime import datetime

from sqlalchemy import (
    BigInteger,
    Column,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship

from app.db.base import Base


class ContentType(str, enum.Enum):
    """Content type enumeration."""

    VIDEO = "video"
    PRESENTATION = "presentation"


class CourseContent(Base):
    """Course content model for storing course materials."""

    __tablename__ = "course_contents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    course_id = Column(UUID(as_uuid=True), ForeignKey("courses.id", ondelete="CASCADE"))
    type = Column(Enum(ContentType), nullable=False)
    title = Column(String(500), nullable=False)
    description = Column(Text)
    file_url = Column(String(1000), nullable=False)
    file_size = Column(BigInteger)  # bytes
    duration = Column(Integer)  # minutes for video
    order_index = Column(Integer, nullable=False)
    content_metadata = Column("content_metadata", JSONB)  # Flexible JSON field
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    course = relationship("Course", back_populates="contents")
