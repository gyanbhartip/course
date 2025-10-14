"""
Notification tasks using Celery for background processing.
"""

from celery import Task
from typing import Dict, Any, List
from uuid import UUID
from datetime import datetime
from app.tasks.celery_app import celery_app
from app.api.v1.endpoints.websocket import (
    send_notification_to_user,
    send_course_notification,
    send_progress_notification,
)
from app.services.email import EmailService


class NotificationTask(Task):
    """Base task class for notifications."""

    def on_success(self, retval, task_id, args, kwargs):
        """Called on task success."""
        pass

    def on_failure(self, exc, task_id, args, kwargs, einfo):
        """Called on task failure."""
        pass


@celery_app.task(bind=True, base=NotificationTask)
def send_welcome_notification(self, user_id: str, user_name: str):
    """
    Send welcome notification to new user.

    Args:
        user_id: User UUID string
        user_name: User name
    """
    try:
        notification = {
            "title": "Welcome to the Learning Management System!",
            "message": f"Hello {user_name}, welcome to our platform! Start exploring courses and begin your learning journey.",
            "type": "welcome",
            "priority": "high",
            "action_url": "/courses",
            "action_text": "Browse Courses",
        }

        # Send via WebSocket if user is connected
        asyncio.run(send_notification_to_user(UUID(user_id), notification))

        return {"status": "success", "notification_sent": True}

    except Exception as e:
        raise self.retry(exc=e, countdown=60, max_retries=3)


@celery_app.task(bind=True, base=NotificationTask)
def send_course_update_notification(
    self, course_id: str, course_title: str, enrolled_user_ids: List[str]
):
    """
    Send course update notification to enrolled users.

    Args:
        course_id: Course UUID string
        course_title: Course title
        enrolled_user_ids: List of enrolled user UUID strings
    """
    try:
        notification = {
            "title": "Course Updated",
            "message": f"The course '{course_title}' has been updated with new content.",
            "type": "course_update",
            "priority": "medium",
            "course_id": course_id,
            "action_url": f"/courses/{course_id}",
            "action_text": "View Course",
        }

        # Send to all enrolled users
        for user_id_str in enrolled_user_ids:
            asyncio.run(send_notification_to_user(UUID(user_id_str), notification))

        return {"status": "success", "notifications_sent": len(enrolled_user_ids)}

    except Exception as e:
        raise self.retry(exc=e, countdown=60, max_retries=3)


@celery_app.task(bind=True, base=NotificationTask)
def send_progress_achievement_notification(
    self, user_id: str, achievement_type: str, course_title: str
):
    """
    Send progress achievement notification.

    Args:
        user_id: User UUID string
        achievement_type: Type of achievement
        course_title: Course title
    """
    try:
        achievement_messages = {
            "first_progress": "Great start! You've made your first progress in a course.",
            "half_complete": "You're halfway there! Keep up the great work.",
            "course_complete": f"Congratulations! You've completed '{course_title}'!",
            "streak_7": "Amazing! You've maintained a 7-day learning streak!",
            "streak_30": "Incredible! You've maintained a 30-day learning streak!",
        }

        notification = {
            "title": "Achievement Unlocked!",
            "message": achievement_messages.get(
                achievement_type, "You've achieved a new milestone!"
            ),
            "type": "achievement",
            "priority": "high",
            "achievement_type": achievement_type,
            "action_url": "/dashboard",
            "action_text": "View Dashboard",
        }

        asyncio.run(send_notification_to_user(UUID(user_id), notification))

        return {"status": "success", "achievement_notification_sent": True}

    except Exception as e:
        raise self.retry(exc=e, countdown=60, max_retries=3)


@celery_app.task(bind=True, base=NotificationTask)
def send_reminder_notification(
    self, user_id: str, course_title: str, days_since_last_activity: int
):
    """
    Send learning reminder notification.

    Args:
        user_id: User UUID string
        course_title: Course title
        days_since_last_activity: Days since last activity
    """
    try:
        if days_since_last_activity == 1:
            message = f"Don't forget to continue learning '{course_title}'! You haven't studied in a day."
        elif days_since_last_activity <= 3:
            message = f"Ready to get back to learning? Continue your progress in '{course_title}'."
        else:
            message = f"Welcome back! It's been {days_since_last_activity} days since you last studied '{course_title}'."

        notification = {
            "title": "Learning Reminder",
            "message": message,
            "type": "reminder",
            "priority": "low",
            "course_title": course_title,
            "action_url": "/dashboard",
            "action_text": "Continue Learning",
        }

        asyncio.run(send_notification_to_user(UUID(user_id), notification))

        return {"status": "success", "reminder_sent": True}

    except Exception as e:
        raise self.retry(exc=e, countdown=60, max_retries=3)


@celery_app.task(bind=True, base=NotificationTask)
def send_course_announcement(
    self, course_id: str, title: str, message: str, enrolled_user_ids: List[str]
):
    """
    Send course announcement to enrolled users.

    Args:
        course_id: Course UUID string
        title: Announcement title
        message: Announcement message
        enrolled_user_ids: List of enrolled user UUID strings
    """
    try:
        notification = {
            "title": f"Course Announcement: {title}",
            "message": message,
            "type": "announcement",
            "priority": "medium",
            "course_id": course_id,
            "action_url": f"/courses/{course_id}",
            "action_text": "View Course",
        }

        # Send to all enrolled users
        for user_id_str in enrolled_user_ids:
            asyncio.run(send_notification_to_user(UUID(user_id_str), notification))

        return {"status": "success", "announcements_sent": len(enrolled_user_ids)}

    except Exception as e:
        raise self.retry(exc=e, countdown=60, max_retries=3)


@celery_app.task(bind=True, base=NotificationTask)
def send_bulk_notification(
    self,
    user_ids: List[str],
    title: str,
    message: str,
    notification_type: str = "general",
):
    """
    Send bulk notification to multiple users.

    Args:
        user_ids: List of user UUID strings
        title: Notification title
        message: Notification message
        notification_type: Type of notification
    """
    try:
        notification = {
            "title": title,
            "message": message,
            "type": notification_type,
            "priority": "medium",
            "action_url": "/dashboard",
            "action_text": "View Dashboard",
        }

        # Send to all specified users
        for user_id_str in user_ids:
            asyncio.run(send_notification_to_user(UUID(user_id_str), notification))

        return {"status": "success", "notifications_sent": len(user_ids)}

    except Exception as e:
        raise self.retry(exc=e, countdown=60, max_retries=3)


@celery_app.task(bind=True, base=NotificationTask)
def send_system_maintenance_notification(
    self, user_ids: List[str], maintenance_start: str, maintenance_end: str
):
    """
    Send system maintenance notification.

    Args:
        user_ids: List of user UUID strings
        maintenance_start: Maintenance start time
        maintenance_end: Maintenance end time
    """
    try:
        notification = {
            "title": "Scheduled System Maintenance",
            "message": f"The system will be under maintenance from {maintenance_start} to {maintenance_end}. Please save your work.",
            "type": "maintenance",
            "priority": "high",
            "maintenance_start": maintenance_start,
            "maintenance_end": maintenance_end,
            "action_url": "/",
            "action_text": "Learn More",
        }

        # Send to all specified users
        for user_id_str in user_ids:
            asyncio.run(send_notification_to_user(UUID(user_id_str), notification))

        return {"status": "success", "maintenance_notifications_sent": len(user_ids)}

    except Exception as e:
        raise self.retry(exc=e, countdown=60, max_retries=3)


# Periodic tasks for reminders
@celery_app.task(bind=True, base=NotificationTask)
def send_daily_learning_reminders(self):
    """Send daily learning reminders to inactive users."""
    try:
        # This would typically query the database for users who haven't been active
        # For now, we'll just return success
        return {"status": "success", "reminders_sent": 0}

    except Exception as e:
        raise self.retry(exc=e, countdown=300, max_retries=3)


@celery_app.task(bind=True, base=NotificationTask)
def send_weekly_progress_summary(self):
    """Send weekly progress summary to all users."""
    try:
        # This would typically query the database for all active users
        # and send them their weekly progress summary
        return {"status": "success", "summaries_sent": 0}

    except Exception as e:
        raise self.retry(exc=e, countdown=300, max_retries=3)


# Email notification tasks
@celery_app.task(bind=True, base=NotificationTask)
def send_welcome_email_task(self, user_email: str, user_name: str):
    """Send welcome email to new user."""
    try:
        email_service = EmailService()
        success = asyncio.run(email_service.send_welcome_email(user_email, user_name))

        return {"status": "success", "email_sent": success}

    except Exception as e:
        raise self.retry(exc=e, countdown=60, max_retries=3)


@celery_app.task(bind=True, base=NotificationTask)
def send_enrollment_email_task(
    self, user_email: str, user_name: str, course_title: str, course_url: str
):
    """Send course enrollment email."""
    try:
        email_service = EmailService()
        success = asyncio.run(
            email_service.send_course_enrollment_email(
                user_email, user_name, course_title, course_url
            )
        )

        return {"status": "success", "email_sent": success}

    except Exception as e:
        raise self.retry(exc=e, countdown=60, max_retries=3)


@celery_app.task(bind=True, base=NotificationTask)
def send_course_update_email_task(
    self,
    user_emails: List[str],
    course_title: str,
    update_message: str,
    course_url: str,
):
    """Send course update email to enrolled users."""
    try:
        email_service = EmailService()
        success = asyncio.run(
            email_service.send_course_update_email(
                user_emails, course_title, update_message, course_url
            )
        )

        return {"status": "success", "emails_sent": success}

    except Exception as e:
        raise self.retry(exc=e, countdown=60, max_retries=3)


@celery_app.task(bind=True, base=NotificationTask)
def send_reminder_email_task(
    self,
    user_email: str,
    user_name: str,
    course_title: str,
    days_since_last_activity: int,
    course_url: str,
):
    """Send learning reminder email."""
    try:
        email_service = EmailService()
        success = asyncio.run(
            email_service.send_progress_reminder_email(
                user_email,
                user_name,
                course_title,
                days_since_last_activity,
                course_url,
            )
        )

        return {"status": "success", "email_sent": success}

    except Exception as e:
        raise self.retry(exc=e, countdown=60, max_retries=3)


@celery_app.task(bind=True, base=NotificationTask)
def send_achievement_email_task(
    self,
    user_email: str,
    user_name: str,
    achievement_title: str,
    achievement_description: str,
    course_title: str = None,
):
    """Send achievement email."""
    try:
        email_service = EmailService()
        success = asyncio.run(
            email_service.send_achievement_email(
                user_email,
                user_name,
                achievement_title,
                achievement_description,
                course_title,
            )
        )

        return {"status": "success", "email_sent": success}

    except Exception as e:
        raise self.retry(exc=e, countdown=60, max_retries=3)


@celery_app.task(bind=True, base=NotificationTask)
def send_password_reset_email_task(
    self, user_email: str, user_name: str, reset_token: str
):
    """Send password reset email."""
    try:
        email_service = EmailService()
        success = asyncio.run(
            email_service.send_password_reset_email(user_email, user_name, reset_token)
        )

        return {"status": "success", "email_sent": success}

    except Exception as e:
        raise self.retry(exc=e, countdown=60, max_retries=3)
