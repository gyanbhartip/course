"""
Pydantic schemas for invitation-related operations.
"""

from pydantic import BaseModel, EmailStr, validator
from typing import Optional
from datetime import datetime
from uuid import UUID
from app.db.models.user import UserRole


class InvitationBase(BaseModel):
    """Base invitation schema."""

    email: EmailStr
    role: UserRole


class InvitationCreate(InvitationBase):
    """Schema for creating invitations."""

    pass


class InvitationResponse(InvitationBase):
    """Schema for invitation response."""

    id: UUID
    token: str
    expires_at: datetime
    created_by: UUID
    used_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class InvitationListResponse(BaseModel):
    """Schema for paginated invitation list."""

    invitations: list[InvitationResponse]
    total: int
    page: int
    page_size: int


class InvitationRegister(BaseModel):
    """Schema for registering with invitation."""

    name: str
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
