"""
Email service for sending notifications and updates.
"""

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from typing import List, Optional, Dict, Any
from jinja2 import Template
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


class EmailService:
    """Email service for sending notifications."""

    def __init__(self):
        """Initialize email service with SMTP configuration."""
        self.smtp_server = settings.SMTP_SERVER
        self.smtp_port = settings.SMTP_PORT
        self.smtp_username = settings.SMTP_USERNAME
        self.smtp_password = settings.SMTP_PASSWORD
        self.from_email = settings.FROM_EMAIL
        self.from_name = settings.FROM_NAME

    async def send_email(
        self,
        to_emails: List[str],
        subject: str,
        html_content: str,
        text_content: Optional[str] = None,
        attachments: Optional[List[Dict[str, Any]]] = None,
    ) -> bool:
        """
        Send email to recipients.

        Args:
            to_emails: List of recipient email addresses
            subject: Email subject
            html_content: HTML email content
            text_content: Plain text email content (optional)
            attachments: List of attachments (optional)

        Returns:
            bool: True if email sent successfully, False otherwise
        """
        try:
            # Create message
            msg = MIMEMultipart("alternative")
            msg["From"] = f"{self.from_name} <{self.from_email}>"
            msg["To"] = ", ".join(to_emails)
            msg["Subject"] = subject

            # Add text content if provided
            if text_content:
                text_part = MIMEText(text_content, "plain")
                msg.attach(text_part)

            # Add HTML content
            html_part = MIMEText(html_content, "html")
            msg.attach(html_part)

            # Add attachments if provided
            if attachments:
                for attachment in attachments:
                    self._add_attachment(msg, attachment)

            # Send email
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                if self.smtp_username and self.smtp_password:
                    server.starttls()
                    server.login(self.smtp_username, self.smtp_password)

                server.send_message(msg)

            logger.info(f"Email sent successfully to {len(to_emails)} recipients")
            return True

        except Exception as e:
            logger.error(f"Failed to send email: {str(e)}")
            return False

    def _add_attachment(self, msg: MIMEMultipart, attachment: Dict[str, Any]):
        """Add attachment to email message."""
        try:
            filename = attachment.get("filename")
            content = attachment.get("content")
            content_type = attachment.get("content_type", "application/octet-stream")

            if not filename or not content:
                return

            part = MIMEBase("application", "octet-stream")
            part.set_payload(content)
            encoders.encode_base64(part)
            part.add_header("Content-Disposition", f"attachment; filename= {filename}")
            msg.attach(part)

        except Exception as e:
            logger.error(f"Failed to add attachment: {str(e)}")

    async def send_welcome_email(self, user_email: str, user_name: str) -> bool:
        """Send welcome email to new user."""
        subject = "Welcome to the Learning Management System!"

        html_content = self._get_welcome_email_template().render(
            user_name=user_name,
            app_name=settings.APP_NAME,
            login_url=f"{settings.FRONTEND_URL}/login",
        )

        text_content = f"""
        Welcome to {settings.APP_NAME}, {user_name}!
        
        Thank you for joining our learning platform. You can now:
        - Browse and enroll in courses
        - Track your learning progress
        - Take notes and create study materials
        - Connect with other learners
        
        Get started by logging in: {settings.FRONTEND_URL}/login
        
        Best regards,
        The {settings.APP_NAME} Team
        """

        return await self.send_email([user_email], subject, html_content, text_content)

    async def send_course_enrollment_email(
        self, user_email: str, user_name: str, course_title: str, course_url: str
    ) -> bool:
        """Send course enrollment confirmation email."""
        subject = f"Successfully enrolled in '{course_title}'"

        html_content = self._get_enrollment_email_template().render(
            user_name=user_name,
            course_title=course_title,
            course_url=course_url,
            app_name=settings.APP_NAME,
        )

        text_content = f"""
        Hello {user_name},
        
        You have successfully enrolled in the course "{course_title}".
        
        You can now access the course content and start learning.
        Course URL: {course_url}
        
        Happy learning!
        The {settings.APP_NAME} Team
        """

        return await self.send_email([user_email], subject, html_content, text_content)

    async def send_course_update_email(
        self,
        user_emails: List[str],
        course_title: str,
        update_message: str,
        course_url: str,
    ) -> bool:
        """Send course update notification email."""
        subject = f"Course Update: {course_title}"

        html_content = self._get_course_update_email_template().render(
            course_title=course_title,
            update_message=update_message,
            course_url=course_url,
            app_name=settings.APP_NAME,
        )

        text_content = f"""
        Course Update: {course_title}
        
        {update_message}
        
        View the updated course: {course_url}
        
        Best regards,
        The {settings.APP_NAME} Team
        """

        return await self.send_email(user_emails, subject, html_content, text_content)

    async def send_progress_reminder_email(
        self,
        user_email: str,
        user_name: str,
        course_title: str,
        days_since_last_activity: int,
        course_url: str,
    ) -> bool:
        """Send learning progress reminder email."""
        subject = f"Continue learning '{course_title}'"

        if days_since_last_activity == 1:
            message = "You haven't studied in a day. Don't break your learning streak!"
        elif days_since_last_activity <= 3:
            message = "Ready to get back to learning? Continue your progress now."
        else:
            message = f"Welcome back! It's been {days_since_last_activity} days since you last studied."

        html_content = self._get_reminder_email_template().render(
            user_name=user_name,
            course_title=course_title,
            message=message,
            course_url=course_url,
            app_name=settings.APP_NAME,
        )

        text_content = f"""
        Hello {user_name},
        
        {message}
        
        Course: {course_title}
        Continue learning: {course_url}
        
        Keep up the great work!
        The {settings.APP_NAME} Team
        """

        return await self.send_email([user_email], subject, html_content, text_content)

    async def send_achievement_email(
        self,
        user_email: str,
        user_name: str,
        achievement_title: str,
        achievement_description: str,
        course_title: Optional[str] = None,
    ) -> bool:
        """Send achievement notification email."""
        subject = f"Achievement Unlocked: {achievement_title}"

        html_content = self._get_achievement_email_template().render(
            user_name=user_name,
            achievement_title=achievement_title,
            achievement_description=achievement_description,
            course_title=course_title,
            app_name=settings.APP_NAME,
        )

        text_content = f"""
        Congratulations {user_name}!
        
        You've unlocked a new achievement: {achievement_title}
        
        {achievement_description}
        
        {f"Course: {course_title}" if course_title else ""}
        
        Keep up the excellent work!
        The {settings.APP_NAME} Team
        """

        return await self.send_email([user_email], subject, html_content, text_content)

    async def send_password_reset_email(
        self, user_email: str, user_name: str, reset_token: str
    ) -> bool:
        """Send password reset email."""
        subject = "Password Reset Request"
        reset_url = f"{settings.FRONTEND_URL}/reset-password?token={reset_token}"

        html_content = self._get_password_reset_email_template().render(
            user_name=user_name, reset_url=reset_url, app_name=settings.APP_NAME
        )

        text_content = f"""
        Hello {user_name},
        
        You requested a password reset for your {settings.APP_NAME} account.
        
        Click the link below to reset your password:
        {reset_url}
        
        This link will expire in 1 hour.
        
        If you didn't request this reset, please ignore this email.
        
        Best regards,
        The {settings.APP_NAME} Team
        """

        return await self.send_email([user_email], subject, html_content, text_content)

    def _get_welcome_email_template(self) -> Template:
        """Get welcome email HTML template."""
        template_str = """
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Welcome to {{ app_name }}</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background-color: #f9f9f9; }
                .button { display: inline-block; padding: 12px 24px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px; }
                .footer { padding: 20px; text-align: center; color: #666; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Welcome to {{ app_name }}!</h1>
                </div>
                <div class="content">
                    <h2>Hello {{ user_name }},</h2>
                    <p>Thank you for joining our learning platform. You can now:</p>
                    <ul>
                        <li>Browse and enroll in courses</li>
                        <li>Track your learning progress</li>
                        <li>Take notes and create study materials</li>
                        <li>Connect with other learners</li>
                    </ul>
                    <p style="text-align: center;">
                        <a href="{{ login_url }}" class="button">Get Started</a>
                    </p>
                </div>
                <div class="footer">
                    <p>Best regards,<br>The {{ app_name }} Team</p>
                </div>
            </div>
        </body>
        </html>
        """
        return Template(template_str)

    def _get_enrollment_email_template(self) -> Template:
        """Get enrollment email HTML template."""
        template_str = """
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Course Enrollment Confirmation</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #2196F3; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background-color: #f9f9f9; }
                .button { display: inline-block; padding: 12px 24px; background-color: #2196F3; color: white; text-decoration: none; border-radius: 4px; }
                .footer { padding: 20px; text-align: center; color: #666; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Enrollment Confirmed!</h1>
                </div>
                <div class="content">
                    <h2>Hello {{ user_name }},</h2>
                    <p>You have successfully enrolled in the course:</p>
                    <h3>{{ course_title }}</h3>
                    <p>You can now access the course content and start learning.</p>
                    <p style="text-align: center;">
                        <a href="{{ course_url }}" class="button">Start Learning</a>
                    </p>
                </div>
                <div class="footer">
                    <p>Happy learning!<br>The {{ app_name }} Team</p>
                </div>
            </div>
        </body>
        </html>
        """
        return Template(template_str)

    def _get_course_update_email_template(self) -> Template:
        """Get course update email HTML template."""
        template_str = """
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Course Update</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #FF9800; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background-color: #f9f9f9; }
                .button { display: inline-block; padding: 12px 24px; background-color: #FF9800; color: white; text-decoration: none; border-radius: 4px; }
                .footer { padding: 20px; text-align: center; color: #666; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Course Update</h1>
                </div>
                <div class="content">
                    <h2>{{ course_title }}</h2>
                    <p>{{ update_message }}</p>
                    <p style="text-align: center;">
                        <a href="{{ course_url }}" class="button">View Course</a>
                    </p>
                </div>
                <div class="footer">
                    <p>Best regards,<br>The {{ app_name }} Team</p>
                </div>
            </div>
        </body>
        </html>
        """
        return Template(template_str)

    def _get_reminder_email_template(self) -> Template:
        """Get reminder email HTML template."""
        template_str = """
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Learning Reminder</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #9C27B0; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background-color: #f9f9f9; }
                .button { display: inline-block; padding: 12px 24px; background-color: #9C27B0; color: white; text-decoration: none; border-radius: 4px; }
                .footer { padding: 20px; text-align: center; color: #666; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Learning Reminder</h1>
                </div>
                <div class="content">
                    <h2>Hello {{ user_name }},</h2>
                    <p>{{ message }}</p>
                    <h3>{{ course_title }}</h3>
                    <p style="text-align: center;">
                        <a href="{{ course_url }}" class="button">Continue Learning</a>
                    </p>
                </div>
                <div class="footer">
                    <p>Keep up the great work!<br>The {{ app_name }} Team</p>
                </div>
            </div>
        </body>
        </html>
        """
        return Template(template_str)

    def _get_achievement_email_template(self) -> Template:
        """Get achievement email HTML template."""
        template_str = """
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Achievement Unlocked</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #FFD700; color: #333; padding: 20px; text-align: center; }
                .content { padding: 20px; background-color: #f9f9f9; }
                .achievement { text-align: center; margin: 20px 0; }
                .footer { padding: 20px; text-align: center; color: #666; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🏆 Achievement Unlocked!</h1>
                </div>
                <div class="content">
                    <h2>Congratulations {{ user_name }}!</h2>
                    <div class="achievement">
                        <h3>{{ achievement_title }}</h3>
                        <p>{{ achievement_description }}</p>
                        {% if course_title %}
                        <p><strong>Course:</strong> {{ course_title }}</p>
                        {% endif %}
                    </div>
                </div>
                <div class="footer">
                    <p>Keep up the excellent work!<br>The {{ app_name }} Team</p>
                </div>
            </div>
        </body>
        </html>
        """
        return Template(template_str)

    def _get_password_reset_email_template(self) -> Template:
        """Get password reset email HTML template."""
        template_str = """
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Password Reset</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #F44336; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background-color: #f9f9f9; }
                .button { display: inline-block; padding: 12px 24px; background-color: #F44336; color: white; text-decoration: none; border-radius: 4px; }
                .footer { padding: 20px; text-align: center; color: #666; }
                .warning { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 10px; border-radius: 4px; margin: 10px 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Password Reset Request</h1>
                </div>
                <div class="content">
                    <h2>Hello {{ user_name }},</h2>
                    <p>You requested a password reset for your {{ app_name }} account.</p>
                    <p style="text-align: center;">
                        <a href="{{ reset_url }}" class="button">Reset Password</a>
                    </p>
                    <div class="warning">
                        <strong>Important:</strong> This link will expire in 1 hour. If you didn't request this reset, please ignore this email.
                    </div>
                </div>
                <div class="footer">
                    <p>Best regards,<br>The {{ app_name }} Team</p>
                </div>
            </div>
        </body>
        </html>
        """
        return Template(template_str)
