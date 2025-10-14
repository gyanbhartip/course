"""
Tests for authentication endpoints.
"""

import pytest
from httpx import AsyncClient
from app.db.models.user import User


class TestAuthEndpoints:
    """Test authentication endpoints."""

    async def test_register_user(self, client: AsyncClient):
        """Test user registration."""
        user_data = {
            "email": "newuser@example.com",
            "name": "New User",
            "password": "newpassword123",
        }

        response = await client.post("/api/v1/auth/register", json=user_data)

        assert response.status_code == 201
        data = response.json()
        assert data["email"] == user_data["email"]
        assert data["name"] == user_data["name"]
        assert "id" in data
        assert "password_hash" not in data

    async def test_register_duplicate_email(self, client: AsyncClient, test_user: User):
        """Test registration with duplicate email."""
        user_data = {
            "email": test_user.email,
            "name": "Another User",
            "password": "password123",
        }

        response = await client.post("/api/v1/auth/register", json=user_data)

        assert response.status_code == 400
        assert "Email already registered" in response.json()["detail"]

    async def test_login_success(self, client: AsyncClient, test_user: User):
        """Test successful login."""
        login_data = {"email": test_user.email, "password": "testpassword"}

        response = await client.post("/api/v1/auth/login", json=login_data)

        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"

    async def test_login_invalid_credentials(self, client: AsyncClient):
        """Test login with invalid credentials."""
        login_data = {"email": "nonexistent@example.com", "password": "wrongpassword"}

        response = await client.post("/api/v1/auth/login", json=login_data)

        assert response.status_code == 401
        assert "Invalid email or password" in response.json()["detail"]

    async def test_get_current_user(
        self, client: AsyncClient, auth_headers: dict, test_user: User
    ):
        """Test getting current user information."""
        response = await client.get("/api/v1/auth/me", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == str(test_user.id)
        assert data["email"] == test_user.email
        assert data["name"] == test_user.name

    async def test_get_current_user_unauthorized(self, client: AsyncClient):
        """Test getting current user without authentication."""
        response = await client.get("/api/v1/auth/me")

        assert response.status_code == 401

    async def test_refresh_token(self, client: AsyncClient, test_user: User):
        """Test token refresh."""
        # First login to get tokens
        login_data = {"email": test_user.email, "password": "testpassword"}
        login_response = await client.post("/api/v1/auth/login", json=login_data)
        refresh_token = login_response.json()["refresh_token"]

        # Refresh token
        response = await client.post("/api/v1/auth/refresh", data=refresh_token)

        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"

    async def test_refresh_invalid_token(self, client: AsyncClient):
        """Test refresh with invalid token."""
        response = await client.post("/api/v1/auth/refresh", data="invalid_token")

        assert response.status_code == 401
