"""
Enrollment endpoints for course subscription management.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import List
from uuid import UUID
from app.db.session import get_db
from app.schemas.enrollment import EnrollmentResponse, EnrollmentWithCourse
from app.api.deps import get_current_active_user
from app.db.models.user import User
from app.db.models.enrollment import Enrollment
from app.db.models.course import Course

router = APIRouter(prefix="/enrollments", tags=["enrollments"])


@router.post(
    "/{course_id}",
    response_model=EnrollmentResponse,
    status_code=status.HTTP_201_CREATED,
)
async def enroll_in_course(
    course_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Enroll current user in a course.

    Args:
        course_id: Course UUID
        current_user: Current authenticated user
        db: Database session

    Returns:
        EnrollmentResponse: Enrollment information

    Raises:
        HTTPException: If course not found or already enrolled
    """
    # Check if course exists
    course_result = await db.execute(select(Course).where(Course.id == course_id))
    course = course_result.scalar_one_or_none()

    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Course not found"
        )

    # Check if already enrolled
    existing_enrollment = await db.execute(
        select(Enrollment).where(
            and_(
                Enrollment.user_id == current_user.id, Enrollment.course_id == course_id
            )
        )
    )

    if existing_enrollment.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already enrolled in this course",
        )

    # Create enrollment
    enrollment = Enrollment(user_id=current_user.id, course_id=course_id)

    db.add(enrollment)
    await db.commit()
    await db.refresh(enrollment)

    return enrollment


@router.delete("/{course_id}", status_code=status.HTTP_204_NO_CONTENT)
async def unenroll_from_course(
    course_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Unenroll current user from a course.

    Args:
        course_id: Course UUID
        current_user: Current authenticated user
        db: Database session

    Raises:
        HTTPException: If enrollment not found
    """
    # Find enrollment
    result = await db.execute(
        select(Enrollment).where(
            and_(
                Enrollment.user_id == current_user.id, Enrollment.course_id == course_id
            )
        )
    )
    enrollment = result.scalar_one_or_none()

    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Enrollment not found"
        )

    # Delete enrollment
    await db.delete(enrollment)
    await db.commit()


@router.get("/my", response_model=List[EnrollmentWithCourse])
async def get_my_enrollments(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get current user's course enrollments.

    Args:
        current_user: Current authenticated user
        db: Database session

    Returns:
        List[EnrollmentWithCourse]: List of user's enrollments with course details
    """
    # Get enrollments with course data
    result = await db.execute(
        select(Enrollment, Course)
        .join(Course, Enrollment.course_id == Course.id)
        .where(Enrollment.user_id == current_user.id)
        .order_by(Enrollment.enrolled_at.desc())
    )

    enrollments_with_courses = []
    for enrollment, course in result:
        enrollment_dict = {
            "id": enrollment.id,
            "user_id": enrollment.user_id,
            "course_id": enrollment.course_id,
            "enrolled_at": enrollment.enrolled_at,
            "last_accessed_at": enrollment.last_accessed_at,
            "course": {
                "id": course.id,
                "title": course.title,
                "description": course.description,
                "instructor": course.instructor,
                "thumbnail_url": course.thumbnail_url,
                "difficulty": course.difficulty,
                "category": course.category,
                "status": course.status,
                "created_at": course.created_at,
                "updated_at": course.updated_at,
            },
        }
        enrollments_with_courses.append(enrollment_dict)

    return enrollments_with_courses


@router.get("/{course_id}/check", response_model=dict)
async def check_enrollment(
    course_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Check if current user is enrolled in a course.

    Args:
        course_id: Course UUID
        current_user: Current authenticated user
        db: Database session

    Returns:
        dict: Enrollment status
    """
    result = await db.execute(
        select(Enrollment).where(
            and_(
                Enrollment.user_id == current_user.id, Enrollment.course_id == course_id
            )
        )
    )
    enrollment = result.scalar_one_or_none()

    return {
        "enrolled": enrollment is not None,
        "enrolled_at": enrollment.enrolled_at if enrollment else None,
    }
