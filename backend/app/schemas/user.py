"""
Pydantic schemas for user-related operations.
"""

from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from uuid import UUID
from app.db.models.user import UserRole


class UserBase(BaseModel):
    """Base user schema."""

    email: EmailStr
    name: str


class UserCreate(UserBase):
    """Schema for user creation."""

    password: str


class UserUpdate(BaseModel):
    """Schema for user updates."""

    name: Optional[str] = None
    profile_picture_url: Optional[str] = None


class UserResponse(UserBase):
    """Schema for user response."""

    id: UUID
    role: UserRole
    profile_picture_url: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class UserLogin(BaseModel):
    """Schema for user login."""

    email: EmailStr
    password: str


class UserInDB(UserResponse):
    """Schema for user in database (includes password hash)."""

    password_hash: str
