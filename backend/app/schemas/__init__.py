"""
Pydantic schemas package.
"""

from app.schemas.user import UserCreate, UserUpdate, UserResponse, UserLogin, UserInDB
from app.schemas.token import Token, TokenData
from app.schemas.course import (
    CourseCreate,
    CourseUpdate,
    CourseResponse,
    CourseListResponse,
)
from app.schemas.content import ContentCreate, ContentUpdate, ContentResponse
from app.schemas.enrollment import (
    EnrollmentCreate,
    EnrollmentResponse,
    EnrollmentWithCourse,
)
from app.schemas.note import NoteCreate, NoteUpdate, NoteResponse, NoteWithCourse

__all__ = [
    # User schemas
    "UserCreate",
    "UserUpdate",
    "UserResponse",
    "UserLogin",
    "UserInDB",
    # Token schemas
    "Token",
    "TokenData",
    # Course schemas
    "CourseCreate",
    "CourseUpdate",
    "CourseResponse",
    "CourseListResponse",
    # Content schemas
    "ContentCreate",
    "ContentUpdate",
    "ContentResponse",
    # Enrollment schemas
    "EnrollmentCreate",
    "EnrollmentResponse",
    "EnrollmentWithCourse",
    # Note schemas
    "NoteCreate",
    "NoteUpdate",
    "NoteResponse",
    "NoteWithCourse",
]
