"""
Pydantic schemas for note operations.
"""

from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID


class NoteBase(BaseModel):
    """Base note schema."""

    title: str
    content: str


class NoteCreate(NoteBase):
    """Schema for note creation."""

    course_id: UUID
    content_id: Optional[UUID] = None


class NoteUpdate(BaseModel):
    """Schema for note updates."""

    title: Optional[str] = None
    content: Optional[str] = None


class NoteResponse(NoteBase):
    """Schema for note response."""

    id: UUID
    user_id: UUID
    course_id: UUID
    content_id: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class NoteWithCourse(NoteResponse):
    """Schema for note with course details."""

    course: dict  # Will be populated with course data
