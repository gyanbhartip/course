"""
Pydantic schemas for authentication tokens.
"""

from pydantic import BaseModel
from typing import Optional


class Token(BaseModel):
    """Schema for authentication token response."""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Schema for token data."""

    user_id: Optional[str] = None
    email: Optional[str] = None
