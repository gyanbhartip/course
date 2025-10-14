"""
Authentication service for user management and JWT operations.
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status
from app.db.models.user import User
from app.schemas.user import UserCreate, UserLogin
from app.schemas.token import Token
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
)
from datetime import timedelta


class AuthService:
    """Authentication service for user operations."""

    def __init__(self, db: AsyncSession):
        """Initialize auth service with database session."""
        self.db = db

    async def register(self, user_data: UserCreate) -> User:
        """
        Register a new user.

        Args:
            user_data: User creation data

        Returns:
            User: Created user

        Raises:
            HTTPException: If email already exists
        """
        # Check if user already exists
        result = await self.db.execute(
            select(User).where(User.email == user_data.email)
        )
        existing_user = result.scalar_one_or_none()

        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered",
            )

        # Create new user
        hashed_password = hash_password(user_data.password)
        user = User(
            email=user_data.email, name=user_data.name, password_hash=hashed_password
        )

        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)

        return user

    async def login(self, email: str, password: str) -> Token:
        """
        Authenticate user and return tokens.

        Args:
            email: User email
            password: User password

        Returns:
            Token: Access and refresh tokens

        Raises:
            HTTPException: If credentials are invalid
        """
        # Get user by email
        result = await self.db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()

        if not user or not verify_password(password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user"
            )

        # Create tokens
        token_data = {"sub": str(user.id), "email": user.email}
        access_token = create_access_token(token_data)
        refresh_token = create_refresh_token(token_data)

        return Token(access_token=access_token, refresh_token=refresh_token)

    async def refresh_access_token(self, refresh_token: str) -> Token:
        """
        Refresh access token using refresh token.

        Args:
            refresh_token: Refresh token

        Returns:
            Token: New access and refresh tokens

        Raises:
            HTTPException: If refresh token is invalid
        """
        try:
            payload = decode_token(refresh_token)

            if payload.get("type") != "refresh":
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token type",
                )

            user_id = payload.get("sub")
            if not user_id:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token payload",
                )

            # Get user from database
            result = await self.db.execute(select(User).where(User.id == user_id))
            user = result.scalar_one_or_none()

            if not user or not user.is_active:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="User not found or inactive",
                )

            # Create new tokens
            token_data = {"sub": str(user.id), "email": user.email}
            access_token = create_access_token(token_data)
            new_refresh_token = create_refresh_token(token_data)

            return Token(access_token=access_token, refresh_token=new_refresh_token)

        except HTTPException:
            raise
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token"
            )
