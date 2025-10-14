"""
Note model for user course notes.
"""

from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from app.db.base import Base
import uuid
from datetime import datetime


class Note(Base):
    """Note model for storing user course notes."""

    __tablename__ = "notes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    course_id = Column(
        UUID(as_uuid=True), ForeignKey("courses.id", ondelete="CASCADE"), index=True
    )
    content_id = Column(
        UUID(as_uuid=True), ForeignKey("course_contents.id", ondelete="SET NULL")
    )
    title = Column(String(500), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
