"""
WebSocket endpoints for real-time features.
"""

from fastapi import (
    APIRouter,
    WebSocket,
    WebSocketDisconnect,
    Depends,
    HTTPException,
    status,
)
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import Dict, List, Any, Optional
from uuid import UUID
import json
import asyncio
from datetime import datetime
from app.db.session import get_db
from app.api.deps import get_current_user
from app.db.models.user import User
from app.db.models.course import Course
from app.db.models.content import CourseContent
from app.db.models.enrollment import Enrollment
from app.db.models.progress import CourseProgress
from app.core.security import decode_token
from app.core.config import settings

router = APIRouter(prefix="/ws", tags=["websocket"])


# WebSocket connection manager
class ConnectionManager:
    """Manages WebSocket connections for real-time features."""

    def __init__(self):
        # Store connections by user ID
        self.active_connections: Dict[UUID, List[WebSocket]] = {}
        # Store connections by course ID for course-specific updates
        self.course_connections: Dict[UUID, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: UUID):
        """Accept WebSocket connection and store it."""
        await websocket.accept()

        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)

    def disconnect(self, websocket: WebSocket, user_id: UUID):
        """Remove WebSocket connection."""
        if user_id in self.active_connections:
            if websocket in self.active_connections[user_id]:
                self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]

    async def send_personal_message(self, message: str, user_id: UUID):
        """Send message to specific user."""
        if user_id in self.active_connections:
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_text(message)
                except:
                    # Remove broken connections
                    self.active_connections[user_id].remove(connection)

    async def send_course_message(self, message: str, course_id: UUID):
        """Send message to all users enrolled in a course."""
        if course_id in self.course_connections:
            for connection in self.course_connections[course_id]:
                try:
                    await connection.send_text(message)
                except:
                    # Remove broken connections
                    self.course_connections[course_id].remove(connection)

    async def broadcast(self, message: str):
        """Broadcast message to all connected users."""
        for user_connections in self.active_connections.values():
            for connection in user_connections:
                try:
                    await connection.send_text(message)
                except:
                    pass

    def add_course_connection(self, websocket: WebSocket, course_id: UUID):
        """Add connection to course-specific updates."""
        if course_id not in self.course_connections:
            self.course_connections[course_id] = []
        self.course_connections[course_id].append(websocket)

    def remove_course_connection(self, websocket: WebSocket, course_id: UUID):
        """Remove connection from course-specific updates."""
        if course_id in self.course_connections:
            if websocket in self.course_connections[course_id]:
                self.course_connections[course_id].remove(websocket)
            if not self.course_connections[course_id]:
                del self.course_connections[course_id]


# Global connection manager
manager = ConnectionManager()


async def get_user_from_token(token: str, db: AsyncSession) -> Optional[User]:
    """Get user from JWT token."""
    try:
        payload = decode_token(token)
        if payload.get("type") != "access":
            return None

        user_id = payload.get("sub")
        if not user_id:
            return None

        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()

        if not user or not user.is_active:
            return None

        return user
    except:
        return None


@router.websocket("/notifications")
async def websocket_notifications(websocket: WebSocket, token: str = None):
    """
    WebSocket endpoint for real-time notifications.

    Args:
        websocket: WebSocket connection
        token: JWT token for authentication
    """
    if not token:
        await websocket.close(code=4001, reason="Authentication required")
        return

    # Get database session
    db_gen = get_db()
    db = await db_gen.__anext__()

    try:
        user = await get_user_from_token(token, db)
        if not user:
            await websocket.close(code=4001, reason="Invalid token")
            return

        # Connect user
        await manager.connect(websocket, user.id)

        try:
            # Send welcome message
            welcome_message = {
                "type": "connection",
                "message": "Connected to notifications",
                "user_id": str(user.id),
                "timestamp": datetime.utcnow().isoformat(),
            }
            await websocket.send_text(json.dumps(welcome_message))

            # Keep connection alive and handle incoming messages
            while True:
                try:
                    # Wait for messages from client
                    data = await websocket.receive_text()
                    message = json.loads(data)

                    # Handle different message types
                    if message.get("type") == "ping":
                        pong_message = {
                            "type": "pong",
                            "timestamp": datetime.utcnow().isoformat(),
                        }
                        await websocket.send_text(json.dumps(pong_message))

                    elif message.get("type") == "subscribe_course":
                        course_id = message.get("course_id")
                        if course_id:
                            # Verify user is enrolled in course
                            enrollment_result = await db.execute(
                                select(Enrollment).where(
                                    and_(
                                        Enrollment.user_id == user.id,
                                        Enrollment.course_id == course_id,
                                    )
                                )
                            )
                            enrollment = enrollment_result.scalar_one_or_none()

                            if enrollment:
                                manager.add_course_connection(
                                    websocket, UUID(course_id)
                                )
                                response = {
                                    "type": "subscription_confirmed",
                                    "course_id": course_id,
                                    "message": "Subscribed to course updates",
                                }
                                await websocket.send_text(json.dumps(response))

                    elif message.get("type") == "unsubscribe_course":
                        course_id = message.get("course_id")
                        if course_id:
                            manager.remove_course_connection(websocket, UUID(course_id))
                            response = {
                                "type": "unsubscription_confirmed",
                                "course_id": course_id,
                                "message": "Unsubscribed from course updates",
                            }
                            await websocket.send_text(json.dumps(response))

                except WebSocketDisconnect:
                    break
                except json.JSONDecodeError:
                    error_message = {"type": "error", "message": "Invalid JSON format"}
                    await websocket.send_text(json.dumps(error_message))
                except Exception as e:
                    error_message = {
                        "type": "error",
                        "message": f"Error processing message: {str(e)}",
                    }
                    await websocket.send_text(json.dumps(error_message))

        except WebSocketDisconnect:
            pass
        finally:
            manager.disconnect(websocket, user.id)

    finally:
        # Clean up database session
        try:
            await db_gen.__anext__()
        except StopAsyncIteration:
            pass


@router.websocket("/progress/{course_id}")
async def websocket_progress(websocket: WebSocket, course_id: UUID, token: str = None):
    """
    WebSocket endpoint for real-time progress updates.

    Args:
        websocket: WebSocket connection
        course_id: Course UUID
        token: JWT token for authentication
    """
    if not token:
        await websocket.close(code=4001, reason="Authentication required")
        return

    # Get database session
    db_gen = get_db()
    db = await db_gen.__anext__()

    try:
        user = await get_user_from_token(token, db)
        if not user:
            await websocket.close(code=4001, reason="Invalid token")
            return

        # Verify user is enrolled in course
        enrollment_result = await db.execute(
            select(Enrollment).where(
                and_(Enrollment.user_id == user.id, Enrollment.course_id == course_id)
            )
        )
        enrollment = enrollment_result.scalar_one_or_none()

        if not enrollment:
            await websocket.close(code=4003, reason="Not enrolled in course")
            return

        # Connect user
        await manager.connect(websocket, user.id)
        manager.add_course_connection(websocket, course_id)

        try:
            # Send initial course progress
            progress_result = await db.execute(
                select(CourseProgress).where(
                    and_(
                        CourseProgress.user_id == user.id,
                        CourseProgress.course_id == course_id,
                    )
                )
            )
            progress_records = progress_result.scalars().all()

            initial_progress = {
                "type": "initial_progress",
                "course_id": str(course_id),
                "progress": [
                    {
                        "content_id": str(p.content_id),
                        "progress_percentage": p.progress_percentage,
                        "completed": p.completed,
                        "last_position": p.last_position,
                        "updated_at": p.updated_at.isoformat()
                        if p.updated_at
                        else None,
                    }
                    for p in progress_records
                ],
                "timestamp": datetime.utcnow().isoformat(),
            }
            await websocket.send_text(json.dumps(initial_progress))

            # Keep connection alive
            while True:
                try:
                    data = await websocket.receive_text()
                    message = json.loads(data)

                    if message.get("type") == "progress_update":
                        # Handle real-time progress updates
                        content_id = message.get("content_id")
                        progress_percentage = message.get("progress_percentage")
                        last_position = message.get("last_position")

                        if content_id and progress_percentage is not None:
                            # Update progress in database
                            progress_result = await db.execute(
                                select(CourseProgress).where(
                                    and_(
                                        CourseProgress.user_id == user.id,
                                        CourseProgress.content_id == content_id,
                                    )
                                )
                            )
                            progress = progress_result.scalar_one_or_none()

                            if progress:
                                progress.progress_percentage = progress_percentage
                                progress.last_position = last_position
                                if progress_percentage >= 100:
                                    progress.completed = True
                            else:
                                progress = CourseProgress(
                                    user_id=user.id,
                                    course_id=course_id,
                                    content_id=content_id,
                                    progress_percentage=progress_percentage,
                                    last_position=last_position,
                                    completed=progress_percentage >= 100,
                                )
                                db.add(progress)

                            await db.commit()

                            # Broadcast progress update to other users in the course
                            progress_update = {
                                "type": "progress_updated",
                                "user_id": str(user.id),
                                "course_id": str(course_id),
                                "content_id": content_id,
                                "progress_percentage": progress_percentage,
                                "completed": progress_percentage >= 100,
                                "timestamp": datetime.utcnow().isoformat(),
                            }
                            await manager.send_course_message(
                                json.dumps(progress_update), course_id
                            )

                    elif message.get("type") == "ping":
                        pong_message = {
                            "type": "pong",
                            "timestamp": datetime.utcnow().isoformat(),
                        }
                        await websocket.send_text(json.dumps(pong_message))

                except WebSocketDisconnect:
                    break
                except json.JSONDecodeError:
                    error_message = {"type": "error", "message": "Invalid JSON format"}
                    await websocket.send_text(json.dumps(error_message))
                except Exception as e:
                    error_message = {
                        "type": "error",
                        "message": f"Error processing message: {str(e)}",
                    }
                    await websocket.send_text(json.dumps(error_message))

        except WebSocketDisconnect:
            pass
        finally:
            manager.disconnect(websocket, user.id)
            manager.remove_course_connection(websocket, course_id)

    finally:
        # Clean up database session
        try:
            await db_gen.__anext__()
        except StopAsyncIteration:
            pass


# Utility functions for sending notifications
async def send_notification_to_user(user_id: UUID, notification: Dict[str, Any]):
    """Send notification to specific user."""
    message = {
        "type": "notification",
        "data": notification,
        "timestamp": datetime.utcnow().isoformat(),
    }
    await manager.send_personal_message(json.dumps(message), user_id)


async def send_course_notification(course_id: UUID, notification: Dict[str, Any]):
    """Send notification to all users enrolled in a course."""
    message = {
        "type": "course_notification",
        "data": notification,
        "timestamp": datetime.utcnow().isoformat(),
    }
    await manager.send_course_message(json.dumps(message), course_id)


async def send_progress_notification(
    user_id: UUID, course_id: UUID, progress_data: Dict[str, Any]
):
    """Send progress notification to user."""
    message = {
        "type": "progress_notification",
        "course_id": str(course_id),
        "data": progress_data,
        "timestamp": datetime.utcnow().isoformat(),
    }
    await manager.send_personal_message(json.dumps(message), user_id)


# WebSocket health check endpoint
@router.get("/health")
async def websocket_health():
    """WebSocket health check endpoint."""
    return {
        "status": "healthy",
        "active_connections": len(manager.active_connections),
        "total_users_connected": sum(
            len(connections) for connections in manager.active_connections.values()
        ),
        "course_connections": len(manager.course_connections),
    }
