"""
Dashboard and analytics endpoints for user progress and course statistics.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, desc, text
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from uuid import UUID
from app.db.session import get_db
from app.schemas.dashboard import (
    DashboardStats,
    CourseAnalytics,
    UserProgressAnalytics,
    LearningStreak,
    RecentActivity,
    CoursePerformance,
    ContentEngagement,
)
from app.api.deps import get_current_active_user, require_admin
from app.db.models.user import User
from app.db.models.course import Course, CourseStatus
from app.db.models.content import CourseContent
from app.db.models.enrollment import Enrollment
from app.db.models.progress import CourseProgress
from app.db.models.note import Note

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get user dashboard statistics.

    Args:
        current_user: Current authenticated user
        db: Database session

    Returns:
        DashboardStats: User dashboard statistics
    """
    # Get enrolled courses count
    enrolled_courses_result = await db.execute(
        select(func.count(Enrollment.id)).where(Enrollment.user_id == current_user.id)
    )
    enrolled_courses = enrolled_courses_result.scalar() or 0

    # Get completed courses count
    completed_courses_result = await db.execute(
        select(func.count(func.distinct(CourseProgress.course_id))).where(
            and_(
                CourseProgress.user_id == current_user.id,
                CourseProgress.completed == True,
            )
        )
    )
    completed_courses = completed_courses_result.scalar() or 0

    # Get total learning time (estimated from progress)
    learning_time_result = await db.execute(
        select(func.sum(CourseProgress.progress_percentage)).where(
            CourseProgress.user_id == current_user.id
        )
    )
    total_progress = learning_time_result.scalar() or 0

    # Get notes count
    notes_count_result = await db.execute(
        select(func.count(Note.id)).where(Note.user_id == current_user.id)
    )
    notes_count = notes_count_result.scalar() or 0

    # Get current streak
    streak = await get_learning_streak(current_user.id, db)

    # Get recent activity
    recent_activity = await get_recent_activity(current_user.id, db)

    return DashboardStats(
        enrolled_courses=enrolled_courses,
        completed_courses=completed_courses,
        total_learning_time=total_progress,  # Simplified calculation
        notes_count=notes_count,
        current_streak=streak,
        recent_activity=recent_activity,
    )


@router.get("/analytics/progress", response_model=UserProgressAnalytics)
async def get_progress_analytics(
    days: int = Query(30, ge=1, le=365, description="Number of days to analyze"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get user progress analytics for the specified period.

    Args:
        days: Number of days to analyze
        current_user: Current authenticated user
        db: Database session

    Returns:
        UserProgressAnalytics: Progress analytics data
    """
    start_date = datetime.utcnow() - timedelta(days=days)

    # Get progress over time
    progress_over_time_result = await db.execute(
        select(
            func.date(CourseProgress.updated_at).label("date"),
            func.count(CourseProgress.id).label("progress_count"),
            func.avg(CourseProgress.progress_percentage).label("avg_progress"),
        )
        .where(
            and_(
                CourseProgress.user_id == current_user.id,
                CourseProgress.updated_at >= start_date,
            )
        )
        .group_by(func.date(CourseProgress.updated_at))
        .order_by(func.date(CourseProgress.updated_at))
    )
    progress_over_time = progress_over_time_result.all()

    # Get course performance
    course_performance_result = await db.execute(
        select(
            Course.id,
            Course.title,
            func.avg(CourseProgress.progress_percentage).label("avg_progress"),
            func.count(CourseProgress.id).label("progress_count"),
            func.max(CourseProgress.updated_at).label("last_activity"),
        )
        .join(Course, CourseProgress.course_id == Course.id)
        .where(CourseProgress.user_id == current_user.id)
        .group_by(Course.id, Course.title)
        .order_by(desc("avg_progress"))
    )
    course_performance = course_performance_result.all()

    # Get content engagement
    content_engagement_result = await db.execute(
        select(
            CourseContent.id,
            CourseContent.title,
            CourseContent.type,
            func.avg(CourseProgress.progress_percentage).label("avg_progress"),
            func.count(CourseProgress.id).label("interaction_count"),
        )
        .join(CourseContent, CourseProgress.content_id == CourseContent.id)
        .where(CourseProgress.user_id == current_user.id)
        .group_by(CourseContent.id, CourseContent.title, CourseContent.type)
        .order_by(desc("avg_progress"))
        .limit(10)
    )
    content_engagement = content_engagement_result.all()

    return UserProgressAnalytics(
        period_days=days,
        progress_over_time=[
            {
                "date": row.date.isoformat(),
                "progress_count": row.progress_count,
                "avg_progress": float(row.avg_progress or 0),
            }
            for row in progress_over_time
        ],
        course_performance=[
            CoursePerformance(
                course_id=row.id,
                course_title=row.title,
                avg_progress=float(row.avg_progress or 0),
                progress_count=row.progress_count,
                last_activity=row.last_activity,
            )
            for row in course_performance
        ],
        content_engagement=[
            ContentEngagement(
                content_id=row.id,
                title=row.title,
                type=row.type,
                avg_progress=float(row.avg_progress or 0),
                interaction_count=row.interaction_count,
            )
            for row in content_engagement
        ],
    )


@router.get("/analytics/course/{course_id}", response_model=CourseAnalytics)
async def get_course_analytics(
    course_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get analytics for a specific course.

    Args:
        course_id: Course UUID
        current_user: Current authenticated user
        db: Database session

    Returns:
        CourseAnalytics: Course analytics data

    Raises:
        HTTPException: If course not found or user not enrolled
    """
    # Verify user is enrolled
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
            detail="You must be enrolled in this course to view analytics",
        )

    # Get course information
    course_result = await db.execute(select(Course).where(Course.id == course_id))
    course = course_result.scalar_one_or_none()

    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Course not found"
        )

    # Get course progress summary
    progress_summary_result = await db.execute(
        select(
            func.count(CourseProgress.id).label("total_progress_entries"),
            func.avg(CourseProgress.progress_percentage).label("avg_progress"),
            func.max(CourseProgress.progress_percentage).label("max_progress"),
            func.count(func.distinct(CourseProgress.content_id)).label(
                "content_accessed"
            ),
            func.max(CourseProgress.updated_at).label("last_activity"),
        ).where(
            and_(
                CourseProgress.user_id == current_user.id,
                CourseProgress.course_id == course_id,
            )
        )
    )
    progress_summary = progress_summary_result.first()

    # Get content breakdown
    content_breakdown_result = await db.execute(
        select(
            CourseContent.id,
            CourseContent.title,
            CourseContent.type,
            CourseContent.order_index,
            func.coalesce(CourseProgress.progress_percentage, 0).label("progress"),
            func.coalesce(CourseProgress.completed, False).label("completed"),
            CourseProgress.last_position,
        )
        .outerjoin(
            CourseProgress,
            and_(
                CourseProgress.content_id == CourseContent.id,
                CourseProgress.user_id == current_user.id,
            ),
        )
        .where(CourseContent.course_id == course_id)
        .order_by(CourseContent.order_index)
    )
    content_breakdown = content_breakdown_result.all()

    # Get notes for this course
    notes_result = await db.execute(
        select(func.count(Note.id)).where(
            and_(Note.user_id == current_user.id, Note.course_id == course_id)
        )
    )
    notes_count = notes_result.scalar() or 0

    return CourseAnalytics(
        course_id=course_id,
        course_title=course.title,
        enrolled_at=enrollment.enrolled_at,
        total_progress_entries=progress_summary.total_progress_entries or 0,
        avg_progress=float(progress_summary.avg_progress or 0),
        max_progress=progress_summary.max_progress or 0,
        content_accessed=progress_summary.content_accessed or 0,
        last_activity=progress_summary.last_activity,
        notes_count=notes_count,
        content_breakdown=[
            {
                "content_id": row.id,
                "title": row.title,
                "type": row.type,
                "order_index": row.order_index,
                "progress": row.progress,
                "completed": row.completed,
                "last_position": row.last_position,
            }
            for row in content_breakdown
        ],
    )


@router.get("/admin/analytics", response_model=Dict[str, Any])
async def get_admin_analytics(
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """
    Get admin analytics for the entire platform.

    Args:
        current_user: Current admin user
        db: Database session

    Returns:
        Dict[str, Any]: Admin analytics data
    """
    # Get total users
    total_users_result = await db.execute(select(func.count(User.id)))
    total_users = total_users_result.scalar() or 0

    # Get total courses
    total_courses_result = await db.execute(select(func.count(Course.id)))
    total_courses = total_courses_result.scalar() or 0

    # Get published courses
    published_courses_result = await db.execute(
        select(func.count(Course.id)).where(Course.status == CourseStatus.PUBLISHED)
    )
    published_courses = published_courses_result.scalar() or 0

    # Get total enrollments
    total_enrollments_result = await db.execute(select(func.count(Enrollment.id)))
    total_enrollments = total_enrollments_result.scalar() or 0

    # Get completion rate
    completed_progress_result = await db.execute(
        select(func.count(CourseProgress.id)).where(CourseProgress.completed == True)
    )
    completed_progress = completed_progress_result.scalar() or 0

    total_progress_result = await db.execute(select(func.count(CourseProgress.id)))
    total_progress = total_progress_result.scalar() or 0

    completion_rate = (
        (completed_progress / total_progress * 100) if total_progress > 0 else 0
    )

    # Get recent activity (last 7 days)
    week_ago = datetime.utcnow() - timedelta(days=7)
    recent_enrollments_result = await db.execute(
        select(func.count(Enrollment.id)).where(Enrollment.enrolled_at >= week_ago)
    )
    recent_enrollments = recent_enrollments_result.scalar() or 0

    recent_progress_result = await db.execute(
        select(func.count(CourseProgress.id)).where(
            CourseProgress.updated_at >= week_ago
        )
    )
    recent_progress = recent_progress_result.scalar() or 0

    return {
        "total_users": total_users,
        "total_courses": total_courses,
        "published_courses": published_courses,
        "total_enrollments": total_enrollments,
        "completion_rate": round(completion_rate, 2),
        "recent_activity": {
            "enrollments_last_7_days": recent_enrollments,
            "progress_updates_last_7_days": recent_progress,
        },
    }


async def get_learning_streak(user_id: UUID, db: AsyncSession) -> LearningStreak:
    """Calculate user's learning streak."""
    # Get all progress updates for the user
    progress_result = await db.execute(
        select(func.date(CourseProgress.updated_at).label("date"))
        .where(CourseProgress.user_id == user_id)
        .group_by(func.date(CourseProgress.updated_at))
        .order_by(desc(func.date(CourseProgress.updated_at)))
    )
    activity_dates = [row.date for row in progress_result.all()]

    if not activity_dates:
        return LearningStreak(current_streak=0, longest_streak=0, last_activity=None)

    # Calculate current streak
    current_streak = 0
    current_date = datetime.utcnow().date()

    for i, activity_date in enumerate(activity_dates):
        if i == 0:
            # Check if last activity was today or yesterday
            if activity_date == current_date:
                current_streak = 1
            elif activity_date == current_date - timedelta(days=1):
                current_streak = 1
            else:
                break
        else:
            # Check if consecutive days
            if activity_date == activity_dates[i - 1] - timedelta(days=1):
                current_streak += 1
            else:
                break

    # Calculate longest streak
    longest_streak = 0
    temp_streak = 1

    for i in range(1, len(activity_dates)):
        if activity_dates[i] == activity_dates[i - 1] - timedelta(days=1):
            temp_streak += 1
        else:
            longest_streak = max(longest_streak, temp_streak)
            temp_streak = 1

    longest_streak = max(longest_streak, temp_streak)

    return LearningStreak(
        current_streak=current_streak,
        longest_streak=longest_streak,
        last_activity=activity_dates[0] if activity_dates else None,
    )


async def get_recent_activity(user_id: UUID, db: AsyncSession) -> List[RecentActivity]:
    """Get user's recent activity."""
    # Get recent progress updates
    recent_progress_result = await db.execute(
        select(
            CourseProgress.updated_at,
            CourseProgress.progress_percentage,
            Course.title.label("course_title"),
            CourseContent.title.label("content_title"),
        )
        .join(Course, CourseProgress.course_id == Course.id)
        .join(CourseContent, CourseProgress.content_id == CourseContent.id)
        .where(CourseProgress.user_id == user_id)
        .order_by(desc(CourseProgress.updated_at))
        .limit(5)
    )

    activities = []
    for row in recent_progress_result.all():
        activities.append(
            RecentActivity(
                type="progress",
                description=f"Updated progress to {row.progress_percentage}% in {row.content_title}",
                course_title=row.course_title,
                timestamp=row.updated_at,
            )
        )

    return activities
