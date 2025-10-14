"""
Course endpoints for CRUD operations and course management.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from uuid import UUID
from app.db.session import get_db
from app.schemas.course import (
    CourseCreate,
    CourseUpdate,
    CourseResponse,
    CourseListResponse,
)
from app.services.course import CourseService
from app.api.deps import get_current_active_user, require_admin
from app.db.models.user import User

router = APIRouter(prefix="/courses", tags=["courses"])


@router.get("", response_model=CourseListResponse)
async def list_courses(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(
        20, ge=1, le=100, description="Maximum number of records to return"
    ),
    difficulty: Optional[str] = Query(None, description="Filter by difficulty level"),
    category: Optional[str] = Query(None, description="Filter by category"),
    db: AsyncSession = Depends(get_db),
):
    """
    List all published courses with pagination and filters.

    Args:
        skip: Number of records to skip
        limit: Maximum number of records to return
        difficulty: Filter by difficulty level
        category: Filter by category
        db: Database session

    Returns:
        CourseListResponse: Paginated list of published courses
    """
    course_service = CourseService(db)
    return await course_service.get_published_courses(
        skip=skip, limit=limit, difficulty=difficulty, category=category
    )


@router.get("/{course_id}", response_model=CourseResponse)
async def get_course(course_id: UUID, db: AsyncSession = Depends(get_db)):
    """
    Get course details by ID.

    Args:
        course_id: Course UUID
        db: Database session

    Returns:
        CourseResponse: Course details

    Raises:
        HTTPException: If course not found
    """
    course_service = CourseService(db)
    course = await course_service.get_course_by_id(course_id)

    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Course not found"
        )

    return course


@router.post("", response_model=CourseResponse, status_code=status.HTTP_201_CREATED)
async def create_course(
    course_data: CourseCreate,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """
    Admin: Create a new course.

    Args:
        course_data: Course creation data
        current_user: Current admin user
        db: Database session

    Returns:
        CourseResponse: Created course
    """
    course_service = CourseService(db)
    return await course_service.create_course(course_data, current_user.id)


@router.put("/{course_id}", response_model=CourseResponse)
async def update_course(
    course_id: UUID,
    course_data: CourseUpdate,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """
    Admin: Update course details.

    Args:
        course_id: Course UUID
        course_data: Course update data
        current_user: Current admin user
        db: Database session

    Returns:
        CourseResponse: Updated course

    Raises:
        HTTPException: If course not found
    """
    course_service = CourseService(db)
    return await course_service.update_course(course_id, course_data)


@router.delete("/{course_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_course(
    course_id: UUID,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """
    Admin: Delete a course.

    Args:
        course_id: Course UUID
        current_user: Current admin user
        db: Database session

    Raises:
        HTTPException: If course not found
    """
    course_service = CourseService(db)
    await course_service.delete_course(course_id)


@router.get("/my/courses", response_model=List[CourseResponse])
async def get_my_courses(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get courses created by current user.

    Args:
        current_user: Current authenticated user
        db: Database session

    Returns:
        List[CourseResponse]: List of user's courses
    """
    course_service = CourseService(db)
    courses = await course_service.get_user_courses(current_user.id)
    return courses
