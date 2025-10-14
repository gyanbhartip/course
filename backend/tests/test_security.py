"""
Tests for security utilities.
"""

import pytest
from datetime import datetime, timedelta
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
)
from app.core.config import settings


class TestSecurity:
    """Test security utilities."""

    def test_hash_password(self):
        """Test password hashing."""
        password = "testpassword123"
        hashed = hash_password(password)

        assert hashed != password
        assert len(hashed) > 0
        assert hashed.startswith("$2b$")  # bcrypt format

    def test_verify_password_correct(self):
        """Test password verification with correct password."""
        password = "testpassword123"
        hashed = hash_password(password)

        assert verify_password(password, hashed) is True

    def test_verify_password_incorrect(self):
        """Test password verification with incorrect password."""
        password = "testpassword123"
        wrong_password = "wrongpassword"
        hashed = hash_password(password)

        assert verify_password(wrong_password, hashed) is False

    def test_create_access_token(self):
        """Test access token creation."""
        data = {"sub": "user123", "email": "test@example.com"}
        token = create_access_token(data)

        assert isinstance(token, str)
        assert len(token) > 0

        # Decode and verify
        payload = decode_token(token)
        assert payload["sub"] == "user123"
        assert payload["email"] == "test@example.com"
        assert payload["type"] == "access"
        assert "exp" in payload

    def test_create_refresh_token(self):
        """Test refresh token creation."""
        data = {"sub": "user123", "email": "test@example.com"}
        token = create_refresh_token(data)

        assert isinstance(token, str)
        assert len(token) > 0

        # Decode and verify
        payload = decode_token(token)
        assert payload["sub"] == "user123"
        assert payload["email"] == "test@example.com"
        assert payload["type"] == "refresh"
        assert "exp" in payload

    def test_token_expiration(self):
        """Test token expiration."""
        data = {"sub": "user123"}
        # Create token with very short expiration
        token = create_access_token(data, expires_delta=timedelta(seconds=1))

        # Token should be valid initially
        payload = decode_token(token)
        assert payload["sub"] == "user123"

        # Wait for expiration
        import time

        time.sleep(2)

        # Token should be invalid now
        with pytest.raises(Exception):
            decode_token(token)

    def test_decode_invalid_token(self):
        """Test decoding invalid token."""
        with pytest.raises(Exception):
            decode_token("invalid_token")

    def test_token_with_custom_expiration(self):
        """Test token with custom expiration time."""
        data = {"sub": "user123"}
        custom_expiry = timedelta(hours=2)
        token = create_access_token(data, expires_delta=custom_expiry)

        payload = decode_token(token)
        exp_time = datetime.fromtimestamp(payload["exp"])
        expected_exp_time = datetime.utcnow() + custom_expiry

        # Allow 1 minute tolerance for test execution time
        time_diff = abs((exp_time - expected_exp_time).total_seconds())
        assert time_diff < 60
