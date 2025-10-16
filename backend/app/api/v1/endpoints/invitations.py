"""
Invitation endpoints for user invitation management.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from typing import Optional

from app.db.session import get_db
from app.db.models.user import User
from app.schemas.invitation import (
    InvitationCreate,
    InvitationResponse,
    InvitationListResponse,
    InvitationRegister,
)
from app.schemas.user import UserResponse
from app.services.invitation_service import InvitationService
from app.api.deps import require_admin

router = APIRouter(prefix="/invitations", tags=["invitations"])


@router.get("", response_model=InvitationListResponse)
async def get_all_invitations(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Invitations per page"),
    search: Optional[str] = Query(None, description="Search in email"),
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """
    Get paginated list of invitations (admin only).

    Args:
        page: Page number (1-based)
        page_size: Number of invitations per page
        search: Search term for email
        current_user: Current admin user
        db: Database session

    Returns:
        InvitationListResponse: Paginated invitation list
    """
    invitation_service = InvitationService(db)
    return await invitation_service.get_all_invitations(
        page=page, page_size=page_size, search=search
    )


@router.post("", response_model=InvitationResponse, status_code=status.HTTP_201_CREATED)
async def create_invitation(
    invitation_data: InvitationCreate,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new invitation (admin only).

    Args:
        invitation_data: Invitation creation data
        current_user: Current admin user
        db: Database session

    Returns:
        InvitationResponse: Created invitation
    """
    invitation_service = InvitationService(db)
    return await invitation_service.create_invitation(invitation_data, current_user.id)


@router.get("/{invitation_id}", response_model=InvitationResponse)
async def get_invitation(
    invitation_id: UUID,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """
    Get invitation by ID (admin only).

    Args:
        invitation_id: Invitation ID
        current_user: Current admin user
        db: Database session

    Returns:
        InvitationResponse: Invitation information
    """
    invitation_service = InvitationService(db)
    return await invitation_service.get_invitation_by_id(invitation_id)


@router.delete("/{invitation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def revoke_invitation(
    invitation_id: UUID,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """
    Revoke an invitation (admin only).

    Args:
        invitation_id: Invitation ID
        current_user: Current admin user
        db: Database session
    """
    invitation_service = InvitationService(db)
    await invitation_service.revoke_invitation(invitation_id)


@router.get("/token/{token}", response_model=InvitationResponse)
async def get_invitation_by_token(
    token: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Get invitation by token (public endpoint for registration).

    Args:
        token: Invitation token
        db: Database session

    Returns:
        InvitationResponse: Invitation information
    """
    invitation_service = InvitationService(db)
    return await invitation_service.get_invitation_by_token(token)


@router.post(
    "/register/{token}",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
async def register_with_invitation(
    token: str,
    registration_data: InvitationRegister,
    db: AsyncSession = Depends(get_db),
):
    """
    Register a new user using an invitation (public endpoint).

    Args:
        token: Invitation token
        registration_data: User registration data
        db: Database session

    Returns:
        UserResponse: Created user
    """
    invitation_service = InvitationService(db)
    user = await invitation_service.register_with_invitation(token, registration_data)
    return UserResponse.model_validate(user)
