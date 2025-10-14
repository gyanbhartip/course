"""
Course progress tracking endpoints for learning analytics.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from typing import List, Optional
from uuid import UUID
from app.db.session import get_db
from app.schemas.progress import (
    ProgressCreate,
    ProgressUpdate,
    ProgressResponse,
    CourseProgressSummary,
    ContentProgressResponse,
)
from app.api.deps import get_current_active_user
from app.db.models.user import User
from app.db.models.progress import CourseProgress
from app.db.models.course import Course
from app.db.models.content import CourseContent
from app.db.models.enrollment import Enrollment

router = APIRouter(prefix="/progress", tags=["progress"])


@router.post("", response_model=ProgressResponse, status_code=status.HTTP_201_CREATED)
async def create_progress(
    progress_data: ProgressCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Create or update progress for a course content.

    Args:
        progress_data: Progress creation data
        current_user: Current authenticated user
        db: Database session

    Returns:
        ProgressResponse: Created/updated progress

    Raises:
        HTTPException: If content not found or user not enrolled
    """
    # Verify user is enrolled in the course
    enrollment_result = await db.execute(
        select(Enrollment).where(
            and_(
                Enrollment.user_id == current_user.id,
                Enrollment.course_id == progress_data.course_id,
            )
        )
    )
    enrollment = enrollment_result.scalar_one_or_none()

    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You must be enrolled in this course to track progress",
        )

    # Check if progress already exists
    existing_progress = await db.execute(
        select(CourseProgress).where(
            and_(
                CourseProgress.user_id == current_user.id,
                CourseProgress.content_id == progress_data.content_id,
            )
        )
    )
    progress = existing_progress.scalar_one_or_none()

    if progress:
        # Update existing progress
        update_data = progress_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(progress, field, value)

        # Auto-complete if progress is 100%
        if progress.progress_percentage >= 100:
            progress.completed = True

        await db.commit()
        await db.refresh(progress)
    else:
        # Create new progress
        progress = CourseProgress(**progress_data.model_dump(), user_id=current_user.id)

        # Auto-complete if progress is 100%
        if progress.progress_percentage >= 100:
            progress.completed = True

        db.add(progress)
        await db.commit()
        await db.refresh(progress)

    return progress


@router.get("/course/{course_id}", response_model=CourseProgressSummary)
async def get_course_progress(
    course_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get progress summary for a specific course.

    Args:
        course_id: Course UUID
        current_user: Current authenticated user
        db: Database session

    Returns:
        CourseProgressSummary: Course progress summary

    Raises:
        HTTPException: If course not found or user not enrolled
    """
    # Verify user is enrolled in the course
    enrollment_result = await db.execute(
        select(Enrollment).where(
            and_(
                Enrollment.user_id == current_user.id, Enrollment.course_id == course_id
            )
        )
    )
    enrollment = enrollment_result.scalar_one_or_none()

    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You must be enrolled in this course to view progress",
        )

    # Get course information
    course_result = await db.execute(select(Course).where(Course.id == course_id))
    course = course_result.scalar_one_or_none()

    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Course not found"
        )

    # Get all content for the course
    content_result = await db.execute(
        select(CourseContent)
        .where(CourseContent.course_id == course_id)
        .order_by(CourseContent.order_index)
    )
    contents = content_result.scalars().all()

    # Get progress for all content
    progress_result = await db.execute(
        select(CourseProgress).where(
            and_(
                CourseProgress.user_id == current_user.id,
                CourseProgress.course_id == course_id,
            )
        )
    )
    progress_records = progress_result.scalars().all()

    # Create progress map
    progress_map = {p.content_id: p for p in progress_records}

    # Calculate summary statistics
    total_content = len(contents)
    completed_content = sum(
        1 for content in contents if progress_map.get(content.id, {}).completed
    )
    total_progress = 0

    content_progress = []
    for content in contents:
        progress = progress_map.get(content.id)
        if progress:
            content_progress.append(
                ContentProgressResponse(
                    content_id=content.id,
                    title=content.title,
                    type=content.type,
                    progress_percentage=progress.progress_percentage,
                    completed=progress.completed,
                    last_position=progress.last_position,
                    updated_at=progress.updated_at,
                )
            )
            total_progress += progress.progress_percentage
        else:
            content_progress.append(
                ContentProgressResponse(
                    content_id=content.id,
                    title=content.title,
                    type=content.type,
                    progress_percentage=0,
                    completed=False,
                    last_position=None,
                    updated_at=None,
                )
            )

    # Calculate overall course progress
    overall_progress = (total_progress / total_content) if total_content > 0 else 0

    return CourseProgressSummary(
        course_id=course_id,
        course_title=course.title,
        total_content=total_content,
        completed_content=completed_content,
        overall_progress=round(overall_progress, 2),
        content_progress=content_progress,
    )


@router.get("/content/{content_id}", response_model=ProgressResponse)
async def get_content_progress(
    content_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get progress for a specific content item.

    Args:
        content_id: Content UUID
        current_user: Current authenticated user
        db: Database session

    Returns:
        ProgressResponse: Content progress

    Raises:
        HTTPException: If content not found or user not enrolled
    """
    # Get content and verify enrollment
    content_result = await db.execute(
        select(CourseContent, Course)
        .join(Course, CourseContent.course_id == Course.id)
        .where(CourseContent.id == content_id)
    )
    result = content_result.first()

    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Content not found"
        )

    content, course = result

    # Verify user is enrolled
    enrollment_result = await db.execute(
        select(Enrollment).where(
            and_(
                Enrollment.user_id == current_user.id, Enrollment.course_id == course.id
            )
        )
    )
    enrollment = enrollment_result.scalar_one_or_none()

    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You must be enrolled in this course to view progress",
        )

    # Get progress
    progress_result = await db.execute(
        select(CourseProgress).where(
            and_(
                CourseProgress.user_id == current_user.id,
                CourseProgress.content_id == content_id,
            )
        )
    )
    progress = progress_result.scalar_one_or_none()

    if not progress:
        # Return default progress
        return ProgressResponse(
            id=None,
            user_id=current_user.id,
            course_id=course.id,
            content_id=content_id,
            completed=False,
            progress_percentage=0,
            last_position=None,
            updated_at=None,
        )

    return progress


@router.put("/{progress_id}", response_model=ProgressResponse)
async def update_progress(
    progress_id: UUID,
    progress_data: ProgressUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Update existing progress.

    Args:
        progress_id: Progress UUID
        progress_data: Progress update data
        current_user: Current authenticated user
        db: Database session

    Returns:
        ProgressResponse: Updated progress

    Raises:
        HTTPException: If progress not found or not owned by user
    """
    # Get existing progress
    progress_result = await db.execute(
        select(CourseProgress).where(
            and_(
                CourseProgress.id == progress_id,
                CourseProgress.user_id == current_user.id,
            )
        )
    )
    progress = progress_result.scalar_one_or_none()

    if not progress:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Progress not found"
        )

    # Update fields
    update_data = progress_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(progress, field, value)

    # Auto-complete if progress is 100%
    if progress.progress_percentage >= 100:
        progress.completed = True

    await db.commit()
    await db.refresh(progress)

    return progress


@router.get("/my/summary", response_model=List[CourseProgressSummary])
async def get_my_progress_summary(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get progress summary for all enrolled courses.

    Args:
        current_user: Current authenticated user
        db: Database session

    Returns:
        List[CourseProgressSummary]: List of course progress summaries
    """
    # Get all enrolled courses
    enrollments_result = await db.execute(
        select(Enrollment, Course)
        .join(Course, Enrollment.course_id == Course.id)
        .where(Enrollment.user_id == current_user.id)
        .order_by(Enrollment.enrolled_at.desc())
    )
    enrollments = enrollments_result.all()

    course_summaries = []

    for enrollment, course in enrollments:
        # Get course progress summary
        summary = await get_course_progress(course.id, current_user, db)
        course_summaries.append(summary)

    return course_summaries


@router.delete("/{progress_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_progress(
    progress_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Delete progress record.

    Args:
        progress_id: Progress UUID
        current_user: Current authenticated user
        db: Database session

    Raises:
        HTTPException: If progress not found or not owned by user
    """
    # Get existing progress
    progress_result = await db.execute(
        select(CourseProgress).where(
            and_(
                CourseProgress.id == progress_id,
                CourseProgress.user_id == current_user.id,
            )
        )
    )
    progress = progress_result.scalar_one_or_none()

    if not progress:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Progress not found"
        )

    # Delete progress
    await db.delete(progress)
    await db.commit()
