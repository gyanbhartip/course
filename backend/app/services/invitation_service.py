"""
Invitation service for user invitation management.
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from fastapi import HTTPException, status
from app.db.models.invitation import Invitation
from app.db.models.user import User, UserRole
from app.schemas.invitation import (
    InvitationCreate,
    InvitationResponse,
    InvitationListResponse,
    InvitationRegister,
)
from app.core.security import hash_password
from typing import Optional
from uuid import UUID
from datetime import datetime
import secrets
import string


class InvitationService:
    """Invitation service for managing user invitations."""

    def __init__(self, db: AsyncSession):
        """Initialize invitation service with database session."""
        self.db = db

    def _generate_token(self) -> str:
        """Generate a secure invitation token."""
        return "".join(
            secrets.choice(string.ascii_letters + string.digits) for _ in range(32)
        )

    async def create_invitation(
        self, invitation_data: InvitationCreate, created_by: UUID
    ) -> InvitationResponse:
        """
        Create a new invitation.

        Args:
            invitation_data: Invitation creation data
            created_by: ID of admin creating the invitation

        Returns:
            InvitationResponse: Created invitation

        Raises:
            HTTPException: If email already has pending invitation or user exists
        """
        # Check if user already exists
        user_result = await self.db.execute(
            select(User).where(User.email == invitation_data.email)
        )
        existing_user = user_result.scalar_one_or_none()

        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User with this email already exists",
            )

        # Check if there's already a pending invitation
        invitation_result = await self.db.execute(
            select(Invitation).where(
                and_(
                    Invitation.email == invitation_data.email,
                    Invitation.used_at.is_(None),
                )
            )
        )
        existing_invitation = invitation_result.scalar_one_or_none()

        if existing_invitation and existing_invitation.is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invitation already exists for this email",
            )

        # Create new invitation
        token = self._generate_token()
        invitation = Invitation(
            email=invitation_data.email,
            role=invitation_data.role,
            token=token,
            created_by=created_by,
        )

        self.db.add(invitation)
        await self.db.commit()
        await self.db.refresh(invitation)

        return InvitationResponse.model_validate(invitation)

    async def get_all_invitations(
        self,
        page: int = 1,
        page_size: int = 20,
        search: Optional[str] = None,
    ) -> InvitationListResponse:
        """
        Get paginated list of invitations.

        Args:
            page: Page number (1-based)
            page_size: Number of invitations per page
            search: Search term for email

        Returns:
            InvitationListResponse: Paginated invitation list
        """
        # Build query
        query = select(Invitation)
        count_query = select(func.count(Invitation.id))

        # Apply search filter
        if search:
            search_filter = Invitation.email.ilike(f"%{search}%")
            query = query.where(search_filter)
            count_query = count_query.where(search_filter)

        # Get total count
        total_result = await self.db.execute(count_query)
        total = total_result.scalar()

        # Apply pagination
        offset = (page - 1) * page_size
        query = query.offset(offset).limit(page_size)

        # Execute query
        result = await self.db.execute(query)
        invitations = result.scalars().all()

        return InvitationListResponse(
            invitations=[
                InvitationResponse.model_validate(invitation)
                for invitation in invitations
            ],
            total=total,
            page=page,
            page_size=page_size,
        )

    async def get_invitation_by_token(self, token: str) -> InvitationResponse:
        """
        Get invitation by token.

        Args:
            token: Invitation token

        Returns:
            InvitationResponse: Invitation information

        Raises:
            HTTPException: If invitation not found or invalid
        """
        result = await self.db.execute(
            select(Invitation).where(Invitation.token == token)
        )
        invitation = result.scalar_one_or_none()

        if not invitation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Invitation not found"
            )

        if not invitation.is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invitation is expired or already used",
            )

        return InvitationResponse.model_validate(invitation)

    async def get_invitation_by_id(self, invitation_id: UUID) -> InvitationResponse:
        """
        Get invitation by ID.

        Args:
            invitation_id: Invitation ID

        Returns:
            InvitationResponse: Invitation information

        Raises:
            HTTPException: If invitation not found
        """
        result = await self.db.execute(
            select(Invitation).where(Invitation.id == invitation_id)
        )
        invitation = result.scalar_one_or_none()

        if not invitation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Invitation not found"
            )

        return InvitationResponse.model_validate(invitation)

    async def register_with_invitation(
        self, token: str, registration_data: InvitationRegister
    ) -> User:
        """
        Register a new user using an invitation.

        Args:
            token: Invitation token
            registration_data: User registration data

        Returns:
            User: Created user

        Raises:
            HTTPException: If invitation not found, invalid, or user already exists
        """
        # Get and validate invitation
        invitation_result = await self.db.execute(
            select(Invitation).where(Invitation.token == token)
        )
        invitation = invitation_result.scalar_one_or_none()

        if not invitation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Invitation not found"
            )

        if not invitation.is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invitation is expired or already used",
            )

        # Check if user already exists
        user_result = await self.db.execute(
            select(User).where(User.email == invitation.email)
        )
        existing_user = user_result.scalar_one_or_none()

        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User with this email already exists",
            )

        # Create new user
        hashed_password = hash_password(registration_data.password)
        user = User(
            email=invitation.email,
            name=registration_data.name,
            password_hash=hashed_password,
            role=invitation.role,
        )

        self.db.add(user)

        # Mark invitation as used
        invitation.used_at = datetime.utcnow()

        await self.db.commit()
        await self.db.refresh(user)

        return user

    async def revoke_invitation(self, invitation_id: UUID) -> None:
        """
        Revoke an invitation.

        Args:
            invitation_id: Invitation ID

        Raises:
            HTTPException: If invitation not found
        """
        result = await self.db.execute(
            select(Invitation).where(Invitation.id == invitation_id)
        )
        invitation = result.scalar_one_or_none()

        if not invitation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Invitation not found"
            )

        await self.db.delete(invitation)
        await self.db.commit()
