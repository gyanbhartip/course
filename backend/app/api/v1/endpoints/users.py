"""
User management endpoints for admin operations.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from typing import Optional

from app.db.session import get_db
from app.db.models.user import User, UserRole
from app.schemas.user import (
    UserCreateByAdmin,
    UserRoleUpdate,
    UserResponse,
    UserListResponse,
)
from app.services.user_service import UserService
from app.api.deps import require_admin

router = APIRouter(prefix="/users", tags=["user-management"])


@router.get("", response_model=UserListResponse)
async def get_all_users(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Users per page"),
    search: Optional[str] = Query(None, description="Search in name or email"),
    role: Optional[UserRole] = Query(None, description="Filter by role"),
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """
    Get paginated list of users (admin only).

    Args:
        page: Page number (1-based)
        page_size: Number of users per page
        search: Search term for name or email
        role: Filter by user role
        current_user: Current admin user
        db: Database session

    Returns:
        UserListResponse: Paginated user list
    """
    user_service = UserService(db)
    return await user_service.get_all_users(
        page=page, page_size=page_size, search=search, role_filter=role
    )


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: UUID,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """
    Get user by ID (admin only).

    Args:
        user_id: User ID
        current_user: Current admin user
        db: Database session

    Returns:
        UserResponse: User information
    """
    user_service = UserService(db)
    return await user_service.get_user_by_id(user_id)


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_data: UserCreateByAdmin,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new user (admin only).

    Args:
        user_data: User creation data
        current_user: Current admin user
        db: Database session

    Returns:
        UserResponse: Created user
    """
    user_service = UserService(db)
    return await user_service.create_user_by_admin(user_data, current_user.id)


@router.patch("/{user_id}/role", response_model=UserResponse)
async def update_user_role(
    user_id: UUID,
    role_data: UserRoleUpdate,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """
    Update user role (admin only).

    Args:
        user_id: User ID
        role_data: New role data
        current_user: Current admin user
        db: Database session

    Returns:
        UserResponse: Updated user
    """
    user_service = UserService(db)
    return await user_service.update_user_role(user_id, role_data)


@router.patch("/{user_id}/deactivate", response_model=UserResponse)
async def deactivate_user(
    user_id: UUID,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """
    Deactivate user (admin only).

    Args:
        user_id: User ID
        current_user: Current admin user
        db: Database session

    Returns:
        UserResponse: Deactivated user
    """
    user_service = UserService(db)
    return await user_service.deactivate_user(user_id)


@router.patch("/{user_id}/activate", response_model=UserResponse)
async def activate_user(
    user_id: UUID,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """
    Activate user (admin only).

    Args:
        user_id: User ID
        current_user: Current admin user
        db: Database session

    Returns:
        UserResponse: Activated user
    """
    user_service = UserService(db)
    return await user_service.reactivate_user(user_id)
