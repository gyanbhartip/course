"""
Database initialization script for development and testing.
"""

import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from app.db.base import Base
from app.core.config import settings


async def init_db():
    """Initialize database tables."""
    engine = create_async_engine(settings.DATABASE_URL)

    async with engine.begin() as conn:
        # Create all tables
        await conn.run_sync(Base.metadata.create_all)

    await engine.dispose()
    print("Database initialized successfully!")


if __name__ == "__main__":
    asyncio.run(init_db())
