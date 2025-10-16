"""
Bootstrap script to create the first admin user.
This script should be run after database initialization to create the initial admin.
"""

import asyncio
import sys
from pathlib import Path

# Add the app directory to the Python path
sys.path.append(str(Path(__file__).parent.parent))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy import select
from app.db.models.user import User, UserRole
from app.core.security import hash_password
from app.core.config import settings


async def create_first_admin(
    email: str = "admin@example.com",
    name: str = "Admin User",
    password: str = "adminpassword",
) -> bool:
    """
    Create an admin user.

    Args:
        email: Admin email address
        name: Admin display name
        password: Admin password (will be hashed)

    Returns:
        bool: True if admin was created, False if admin already exists
    """
    engine = create_async_engine(settings.DATABASE_URL)

    try:
        async with AsyncSession(engine) as session:
            # Check if user with this email already exists
            result = await session.execute(select(User).where(User.email == email))
            existing_user = result.scalar_one_or_none()

            if existing_user:
                print(
                    f"❌ User with email {email} already exists with role: {existing_user.role}"
                )
                return False

            # Create first admin
            admin = User(
                email=email,
                name=name,
                password_hash=hash_password(password),
                role=UserRole.ADMIN,
                is_active=True,
            )

            session.add(admin)
            await session.commit()
            await session.refresh(admin)

            print(f"✅ First admin created successfully!")
            print(f"   Email: {admin.email}")
            print(f"   Name: {admin.name}")
            print(f"   Role: {admin.role}")
            print(f"   ID: {admin.id}")
            print(f"   Created: {admin.created_at}")
            print(f"\n🔐 You can now login with:")
            print(f"   Email: {email}")
            print(f"   Password: {password}")
            print(f"\n⚠️  Please change the default password after first login!")

            return True

    except Exception as e:
        print(f"❌ Error creating admin: {e}")
        return False
    finally:
        await engine.dispose()


async def main():
    """Main function to handle command line arguments."""
    import argparse

    parser = argparse.ArgumentParser(description="Create the first admin user")
    parser.add_argument(
        "--email", default="admin@example.com", help="Admin email address"
    )
    parser.add_argument("--name", default="Admin User", help="Admin display name")
    parser.add_argument("--password", default="adminpassword", help="Admin password")

    args = parser.parse_args()

    print("🚀 Creating first admin user...")
    print(f"   Email: {args.email}")
    print(f"   Name: {args.name}")
    print()

    success = await create_first_admin(args.email, args.name, args.password)

    if success:
        print("\n🎉 Admin creation completed successfully!")
        sys.exit(0)
    else:
        print("\n💥 Admin creation failed!")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
