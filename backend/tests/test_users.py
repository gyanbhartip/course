"""
Tests for user management endpoints.
"""

import pytest
from httpx import AsyncClient
from app.db.models.user import User, UserRole


class TestUserManagementEndpoints:
    """Test user management endpoints."""

    async def test_get_all_users_admin(self, client: AsyncClient, admin_headers: dict):
        """Test getting all users as admin."""
        response = await client.get("/api/v1/users", headers=admin_headers)

        assert response.status_code == 200
        data = response.json()
        assert "users" in data
        assert "total" in data
        assert "page" in data
        assert "page_size" in data

    async def test_get_all_users_non_admin(
        self, client: AsyncClient, auth_headers: dict
    ):
        """Test getting all users as non-admin user."""
        response = await client.get("/api/v1/users", headers=auth_headers)

        assert response.status_code == 403

    async def test_get_user_by_id_admin(
        self, client: AsyncClient, admin_headers: dict, test_user: User
    ):
        """Test getting user by ID as admin."""
        response = await client.get(
            f"/api/v1/users/{test_user.id}", headers=admin_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == str(test_user.id)
        assert data["email"] == test_user.email

    async def test_get_user_by_id_non_admin(
        self, client: AsyncClient, auth_headers: dict, test_user: User
    ):
        """Test getting user by ID as non-admin user."""
        response = await client.get(
            f"/api/v1/users/{test_user.id}", headers=auth_headers
        )

        assert response.status_code == 403

    async def test_create_user_admin(self, client: AsyncClient, admin_headers: dict):
        """Test creating user as admin."""
        user_data = {
            "email": "newuser@example.com",
            "name": "New User",
            "password": "newpassword123",
            "role": "user",
        }

        response = await client.post(
            "/api/v1/users", json=user_data, headers=admin_headers
        )

        assert response.status_code == 201
        data = response.json()
        assert data["email"] == user_data["email"]
        assert data["name"] == user_data["name"]
        assert data["role"] == user_data["role"]

    async def test_create_user_non_admin(self, client: AsyncClient, auth_headers: dict):
        """Test creating user as non-admin user."""
        user_data = {
            "email": "newuser@example.com",
            "name": "New User",
            "password": "newpassword123",
            "role": "user",
        }

        response = await client.post(
            "/api/v1/users", json=user_data, headers=auth_headers
        )

        assert response.status_code == 403

    async def test_create_user_duplicate_email(
        self, client: AsyncClient, admin_headers: dict, test_user: User
    ):
        """Test creating user with duplicate email."""
        user_data = {
            "email": test_user.email,
            "name": "Another User",
            "password": "password123",
            "role": "user",
        }

        response = await client.post(
            "/api/v1/users", json=user_data, headers=admin_headers
        )

        assert response.status_code == 400
        assert "Email already registered" in response.json()["detail"]

    async def test_update_user_role_admin(
        self, client: AsyncClient, admin_headers: dict, test_user: User
    ):
        """Test updating user role as admin."""
        role_data = {"role": "admin"}

        response = await client.patch(
            f"/api/v1/users/{test_user.id}/role", json=role_data, headers=admin_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["role"] == "admin"

    async def test_update_user_role_non_admin(
        self, client: AsyncClient, auth_headers: dict, test_user: User
    ):
        """Test updating user role as non-admin user."""
        role_data = {"role": "admin"}

        response = await client.patch(
            f"/api/v1/users/{test_user.id}/role", json=role_data, headers=auth_headers
        )

        assert response.status_code == 403

    async def test_deactivate_user_admin(
        self, client: AsyncClient, admin_headers: dict, test_user: User
    ):
        """Test deactivating user as admin."""
        response = await client.patch(
            f"/api/v1/users/{test_user.id}/deactivate", headers=admin_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["is_active"] is False

    async def test_deactivate_user_non_admin(
        self, client: AsyncClient, auth_headers: dict, test_user: User
    ):
        """Test deactivating user as non-admin user."""
        response = await client.patch(
            f"/api/v1/users/{test_user.id}/deactivate", headers=auth_headers
        )

        assert response.status_code == 403

    async def test_activate_user_admin(
        self, client: AsyncClient, admin_headers: dict, test_user: User
    ):
        """Test activating user as admin."""
        # First deactivate the user
        await client.patch(
            f"/api/v1/users/{test_user.id}/deactivate", headers=admin_headers
        )

        # Then activate the user
        response = await client.patch(
            f"/api/v1/users/{test_user.id}/activate", headers=admin_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["is_active"] is True

    async def test_activate_user_non_admin(
        self, client: AsyncClient, auth_headers: dict, test_user: User
    ):
        """Test activating user as non-admin user."""
        response = await client.patch(
            f"/api/v1/users/{test_user.id}/activate", headers=auth_headers
        )

        assert response.status_code == 403

    async def test_get_nonexistent_user(self, client: AsyncClient, admin_headers: dict):
        """Test getting nonexistent user."""
        fake_id = "00000000-0000-0000-0000-000000000000"
        response = await client.get(f"/api/v1/users/{fake_id}", headers=admin_headers)

        assert response.status_code == 404
