"""
Invitation model for user invitation system.
"""

from sqlalchemy import Column, String, DateTime, Enum, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from app.db.base import Base
import uuid
from datetime import datetime, timedelta
from app.db.models.user import UserRole


class Invitation(Base):
    """Invitation model for user invitations."""

    __tablename__ = "invitations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), nullable=False, index=True)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.USER)
    token = Column(String(255), unique=True, nullable=False, index=True)
    expires_at = Column(
        DateTime, nullable=False, default=lambda: datetime.utcnow() + timedelta(days=7)
    )
    created_by = Column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    used_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    @property
    def is_expired(self) -> bool:
        """Check if invitation is expired."""
        return datetime.utcnow() > self.expires_at

    @property
    def is_used(self) -> bool:
        """Check if invitation has been used."""
        return self.used_at is not None

    @property
    def is_valid(self) -> bool:
        """Check if invitation is valid (not expired and not used)."""
        return not self.is_expired and not self.is_used
