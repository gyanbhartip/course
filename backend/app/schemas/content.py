"""
Pydantic schemas for course content operations.
"""

from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime
from uuid import UUID
from app.db.models.content import ContentType


class ContentBase(BaseModel):
    """Base content schema."""

    title: str
    description: Optional[str] = None
    type: ContentType
    order_index: int


class ContentCreate(ContentBase):
    """Schema for content creation."""

    file_url: str
    file_size: Optional[int] = None
    duration: Optional[int] = None
    metadata: Optional[Dict[str, Any]] = None


class ContentUpdate(BaseModel):
    """Schema for content updates."""

    title: Optional[str] = None
    description: Optional[str] = None
    file_url: Optional[str] = None
    file_size: Optional[int] = None
    duration: Optional[int] = None
    order_index: Optional[int] = None
    metadata: Optional[Dict[str, Any]] = None


class ContentResponse(ContentBase):
    """Schema for content response."""

    id: UUID
    course_id: UUID
    file_url: str
    file_size: Optional[int] = None
    duration: Optional[int] = None
    metadata: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
