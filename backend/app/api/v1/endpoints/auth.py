"""
Authentication endpoints for user registration, login, and token management.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.schemas.user import UserCreate, UserLogin, UserResponse
from app.schemas.token import Token
from app.services.auth import AuthService
from app.api.deps import get_current_active_user
from app.db.models.user import User

router = APIRouter(prefix="/auth", tags=["authentication"])


@router.post(
    "/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED
)
async def register(user_data: UserCreate, db: AsyncSession = Depends(get_db)):
    """
    Register a new user account.

    Args:
        user_data: User registration data
        db: Database session

    Returns:
        UserResponse: Created user information
    """
    auth_service = AuthService(db)
    user = await auth_service.register(user_data)
    return user


@router.post("/login", response_model=Token)
async def login(credentials: UserLogin, db: AsyncSession = Depends(get_db)):
    """
    Login and get access token.

    Args:
        credentials: User login credentials
        db: Database session

    Returns:
        Token: Access and refresh tokens
    """
    auth_service = AuthService(db)
    return await auth_service.login(credentials.email, credentials.password)


@router.post("/refresh", response_model=Token)
async def refresh_token(refresh_token: str, db: AsyncSession = Depends(get_db)):
    """
    Refresh access token using refresh token.

    Args:
        refresh_token: Refresh token
        db: Database session

    Returns:
        Token: New access and refresh tokens
    """
    auth_service = AuthService(db)
    return await auth_service.refresh_access_token(refresh_token)


@router.get("/me", response_model=UserResponse)
async def get_current_user(current_user: User = Depends(get_current_active_user)):
    """
    Get current logged-in user details.

    Args:
        current_user: Current authenticated user

    Returns:
        UserResponse: Current user information
    """
    return current_user
