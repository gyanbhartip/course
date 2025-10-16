"""
Tests for invitation endpoints.
"""

import pytest
from httpx import AsyncClient
from app.db.models.user import User


class TestInvitationEndpoints:
    """Test invitation endpoints."""

    async def test_create_invitation_admin(
        self, client: AsyncClient, admin_headers: dict
    ):
        """Test creating invitation as admin."""
        invitation_data = {"email": "invited@example.com", "role": "user"}

        response = await client.post(
            "/api/v1/invitations", json=invitation_data, headers=admin_headers
        )

        assert response.status_code == 201
        data = response.json()
        assert data["email"] == invitation_data["email"]
        assert data["role"] == invitation_data["role"]
        assert "token" in data

    async def test_create_invitation_non_admin(
        self, client: AsyncClient, auth_headers: dict
    ):
        """Test creating invitation as non-admin user."""
        invitation_data = {"email": "invited@example.com", "role": "user"}

        response = await client.post(
            "/api/v1/invitations", json=invitation_data, headers=auth_headers
        )

        assert response.status_code == 403

    async def test_create_invitation_existing_user(
        self, client: AsyncClient, admin_headers: dict, test_user: User
    ):
        """Test creating invitation for existing user."""
        invitation_data = {"email": test_user.email, "role": "user"}

        response = await client.post(
            "/api/v1/invitations", json=invitation_data, headers=admin_headers
        )

        assert response.status_code == 400
        assert "User with this email already exists" in response.json()["detail"]

    async def test_get_all_invitations_admin(
        self, client: AsyncClient, admin_headers: dict
    ):
        """Test getting all invitations as admin."""
        response = await client.get("/api/v1/invitations", headers=admin_headers)

        assert response.status_code == 200
        data = response.json()
        assert "invitations" in data
        assert "total" in data
        assert "page" in data
        assert "page_size" in data

    async def test_get_all_invitations_non_admin(
        self, client: AsyncClient, auth_headers: dict
    ):
        """Test getting all invitations as non-admin user."""
        response = await client.get("/api/v1/invitations", headers=auth_headers)

        assert response.status_code == 403

    async def test_get_invitation_by_token(
        self, client: AsyncClient, admin_headers: dict
    ):
        """Test getting invitation by token."""
        # First create an invitation
        invitation_data = {"email": "token-test@example.com", "role": "user"}
        create_response = await client.post(
            "/api/v1/invitations", json=invitation_data, headers=admin_headers
        )
        token = create_response.json()["token"]

        # Then get the invitation by token
        response = await client.get(f"/api/v1/invitations/token/{token}")

        assert response.status_code == 200
        data = response.json()
        assert data["email"] == invitation_data["email"]
        assert data["token"] == token

    async def test_get_invitation_by_invalid_token(self, client: AsyncClient):
        """Test getting invitation by invalid token."""
        response = await client.get("/api/v1/invitations/token/invalid-token")

        assert response.status_code == 404

    async def test_register_with_invitation(
        self, client: AsyncClient, admin_headers: dict
    ):
        """Test registering with valid invitation."""
        # First create an invitation
        invitation_data = {"email": "register-test@example.com", "role": "user"}
        create_response = await client.post(
            "/api/v1/invitations", json=invitation_data, headers=admin_headers
        )
        token = create_response.json()["token"]

        # Then register with the invitation
        registration_data = {"name": "Test User", "password": "password123"}

        response = await client.post(
            f"/api/v1/invitations/register/{token}", json=registration_data
        )

        assert response.status_code == 201
        data = response.json()
        assert data["email"] == invitation_data["email"]
        assert data["name"] == registration_data["name"]
        assert data["role"] == invitation_data["role"]

    async def test_register_with_invalid_invitation(self, client: AsyncClient):
        """Test registering with invalid invitation token."""
        registration_data = {"name": "Test User", "password": "password123"}

        response = await client.post(
            "/api/v1/invitations/register/invalid-token", json=registration_data
        )

        assert response.status_code == 404

    async def test_revoke_invitation_admin(
        self, client: AsyncClient, admin_headers: dict
    ):
        """Test revoking invitation as admin."""
        # First create an invitation
        invitation_data = {"email": "revoke-test@example.com", "role": "user"}
        create_response = await client.post(
            "/api/v1/invitations", json=invitation_data, headers=admin_headers
        )
        invitation_id = create_response.json()["id"]

        # Then revoke the invitation
        response = await client.delete(
            f"/api/v1/invitations/{invitation_id}", headers=admin_headers
        )

        assert response.status_code == 204

    async def test_revoke_invitation_non_admin(
        self, client: AsyncClient, auth_headers: dict
    ):
        """Test revoking invitation as non-admin user."""
        response = await client.delete(
            "/api/v1/invitations/00000000-0000-0000-0000-000000000000",
            headers=auth_headers,
        )

        assert response.status_code == 403
