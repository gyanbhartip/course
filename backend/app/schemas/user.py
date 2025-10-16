"""
Pydantic schemas for user-related operations.
"""

from pydantic import BaseModel, EmailStr, validator
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

    @validator("password")
    def validate_password(cls, v):
        """Validate password length and requirements."""
        if not v:
            raise ValueError("Password is required")

        # Check password length (bcrypt has a 72-byte limit)
        if len(v.encode("utf-8")) > 72:
            raise ValueError(
                "Password cannot be longer than 72 bytes. Please use a shorter password."
            )

        # Check minimum length
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")

        return v


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


class UserCreateByAdmin(UserBase):
    """Schema for admin creating users with role assignment."""

    password: str
    role: Optional[UserRole] = UserRole.USER

    @validator("password")
    def validate_password(cls, v):
        """Validate password length and requirements."""
        if not v:
            raise ValueError("Password is required")

        # Check password length (bcrypt has a 72-byte limit)
        if len(v.encode("utf-8")) > 72:
            raise ValueError(
                "Password cannot be longer than 72 bytes. Please use a shorter password."
            )

        # Check minimum length
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")

        return v


class UserRoleUpdate(BaseModel):
    """Schema for updating user role."""

    role: UserRole


class UserListResponse(BaseModel):
    """Schema for paginated user list."""

    users: list[UserResponse]
    total: int
    page: int
    page_size: int
