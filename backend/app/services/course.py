"""
Course service for course management operations.
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status
from typing import List, Optional
from uuid import UUID
from app.db.models.course import Course, CourseStatus
from app.schemas.course import CourseCreate, CourseUpdate, CourseListResponse
from app.core.cache import cached


class CourseService:
    """Course service for course operations."""

    def __init__(self, db: AsyncSession):
        """Initialize course service with database session."""
        self.db = db

    @cached(ttl=600, key_prefix="courses")
    async def get_published_courses(
        self,
        skip: int = 0,
        limit: int = 20,
        difficulty: Optional[str] = None,
        category: Optional[str] = None,
    ) -> CourseListResponse:
        """
        Get published courses with pagination and filters.

        Args:
            skip: Number of records to skip
            limit: Maximum number of records to return
            difficulty: Filter by difficulty level
            category: Filter by category

        Returns:
            CourseListResponse: Paginated list of published courses
        """
        # Build query
        query = select(Course).where(Course.status == CourseStatus.PUBLISHED)

        # Apply filters
        if difficulty:
            query = query.where(Course.difficulty == difficulty)
        if category:
            query = query.where(Course.category == category)

        # Get total count
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await self.db.execute(count_query)
        total = total_result.scalar()

        # Get paginated results
        query = query.offset(skip).limit(limit).order_by(Course.created_at.desc())
        result = await self.db.execute(query)
        courses = result.scalars().all()

        # Calculate pagination info
        pages = (total + limit - 1) // limit
        page = (skip // limit) + 1

        return CourseListResponse(
            courses=courses, total=total, page=page, size=limit, pages=pages
        )

    async def get_course_by_id(self, course_id: UUID) -> Optional[Course]:
        """
        Get course by ID with contents.

        Args:
            course_id: Course UUID

        Returns:
            Course: Course with contents or None
        """
        query = (
            select(Course)
            .options(selectinload(Course.contents))
            .where(Course.id == course_id)
        )

        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def create_course(
        self, course_data: CourseCreate, created_by: UUID
    ) -> Course:
        """
        Create a new course.

        Args:
            course_data: Course creation data
            created_by: User ID who created the course

        Returns:
            Course: Created course
        """
        course = Course(**course_data.model_dump(), created_by=created_by)

        self.db.add(course)
        await self.db.commit()
        await self.db.refresh(course)

        return course

    async def update_course(self, course_id: UUID, course_data: CourseUpdate) -> Course:
        """
        Update course information.

        Args:
            course_id: Course UUID
            course_data: Course update data

        Returns:
            Course: Updated course

        Raises:
            HTTPException: If course not found
        """
        # Get existing course
        result = await self.db.execute(select(Course).where(Course.id == course_id))
        course = result.scalar_one_or_none()

        if not course:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Course not found"
            )

        # Update fields
        update_data = course_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(course, field, value)

        await self.db.commit()
        await self.db.refresh(course)

        return course

    async def delete_course(self, course_id: UUID) -> None:
        """
        Delete a course.

        Args:
            course_id: Course UUID

        Raises:
            HTTPException: If course not found
        """
        # Get existing course
        result = await self.db.execute(select(Course).where(Course.id == course_id))
        course = result.scalar_one_or_none()

        if not course:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Course not found"
            )

        await self.db.delete(course)
        await self.db.commit()

    async def get_user_courses(self, user_id: UUID) -> List[Course]:
        """
        Get courses created by a user.

        Args:
            user_id: User UUID

        Returns:
            List[Course]: List of user's courses
        """
        query = (
            select(Course)
            .where(Course.created_by == user_id)
            .order_by(Course.created_at.desc())
        )
        result = await self.db.execute(query)
        return result.scalars().all()
