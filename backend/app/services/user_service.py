"""
User management service for admin operations.
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from fastapi import HTTPException, status
from app.db.models.user import User, UserRole
from app.schemas.user import (
    UserCreateByAdmin,
    UserRoleUpdate,
    UserResponse,
    UserListResponse,
)
from app.core.security import hash_password
from typing import Optional
from uuid import UUID


class UserService:
    """User management service for admin operations."""

    def __init__(self, db: AsyncSession):
        """Initialize user service with database session."""
        self.db = db

    async def get_all_users(
        self,
        page: int = 1,
        page_size: int = 20,
        search: Optional[str] = None,
        role_filter: Optional[UserRole] = None,
    ) -> UserListResponse:
        """
        Get paginated list of users with optional filtering.

        Args:
            page: Page number (1-based)
            page_size: Number of users per page
            search: Search term for name or email
            role_filter: Filter by user role

        Returns:
            UserListResponse: Paginated user list
        """
        # Build query
        query = select(User)
        count_query = select(func.count(User.id))

        # Apply filters
        if search:
            search_filter = or_(
                User.name.ilike(f"%{search}%"),
                User.email.ilike(f"%{search}%"),
            )
            query = query.where(search_filter)
            count_query = count_query.where(search_filter)

        if role_filter:
            query = query.where(User.role == role_filter)
            count_query = count_query.where(User.role == role_filter)

        # Get total count
        total_result = await self.db.execute(count_query)
        total = total_result.scalar()

        # Apply pagination
        offset = (page - 1) * page_size
        query = query.offset(offset).limit(page_size)

        # Execute query
        result = await self.db.execute(query)
        users = result.scalars().all()

        return UserListResponse(
            users=[UserResponse.model_validate(user) for user in users],
            total=total,
            page=page,
            page_size=page_size,
        )

    async def get_user_by_id(self, user_id: UUID) -> UserResponse:
        """
        Get user by ID.

        Args:
            user_id: User ID

        Returns:
            UserResponse: User information

        Raises:
            HTTPException: If user not found
        """
        result = await self.db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
            )

        return UserResponse.model_validate(user)

    async def create_user_by_admin(
        self, user_data: UserCreateByAdmin, created_by: UUID
    ) -> UserResponse:
        """
        Create a new user (admin only).

        Args:
            user_data: User creation data
            created_by: ID of admin creating the user

        Returns:
            UserResponse: Created user

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
            email=user_data.email,
            name=user_data.name,
            password_hash=hashed_password,
            role=user_data.role,
        )

        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)

        return UserResponse.model_validate(user)

    async def update_user_role(
        self, user_id: UUID, role_data: UserRoleUpdate
    ) -> UserResponse:
        """
        Update user role.

        Args:
            user_id: User ID
            role_data: New role data

        Returns:
            UserResponse: Updated user

        Raises:
            HTTPException: If user not found
        """
        result = await self.db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
            )

        user.role = role_data.role
        await self.db.commit()
        await self.db.refresh(user)

        return UserResponse.model_validate(user)

    async def deactivate_user(self, user_id: UUID) -> UserResponse:
        """
        Deactivate user (soft delete).

        Args:
            user_id: User ID

        Returns:
            UserResponse: Deactivated user

        Raises:
            HTTPException: If user not found
        """
        result = await self.db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
            )

        user.is_active = False
        await self.db.commit()
        await self.db.refresh(user)

        return UserResponse.model_validate(user)

    async def reactivate_user(self, user_id: UUID) -> UserResponse:
        """
        Reactivate user.

        Args:
            user_id: User ID

        Returns:
            UserResponse: Reactivated user

        Raises:
            HTTPException: If user not found
        """
        result = await self.db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
            )

        user.is_active = True
        await self.db.commit()
        await self.db.refresh(user)

        return UserResponse.model_validate(user)
