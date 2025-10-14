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
from app.schemas.progress import (
    ProgressCreate,
    ProgressUpdate,
    ProgressResponse,
    CourseProgressSummary,
    ContentProgressResponse,
    ProgressAnalytics,
)
from app.schemas.dashboard import (
    DashboardStats,
    CourseAnalytics,
    UserProgressAnalytics,
    LearningStreak,
    RecentActivity,
    CoursePerformance,
    ContentEngagement,
    AdminAnalytics,
    LearningPathRecommendation,
    StudySession,
    Achievement,
)
from app.schemas.search import (
    SearchRequest,
    SearchFilters,
    CourseSearchResult,
    ContentSearchResult,
    SearchResponse,
    CourseSearchResponse,
    ContentSearchResponse,
    CombinedSearchResponse,
    SearchSuggestion,
    SearchSuggestionsResponse,
    PopularSearch,
    PopularSearchesResponse,
    SearchAnalytics,
    SearchStatsResponse,
)

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
    # Progress schemas
    "ProgressCreate",
    "ProgressUpdate",
    "ProgressResponse",
    "CourseProgressSummary",
    "ContentProgressResponse",
    "ProgressAnalytics",
    # Dashboard schemas
    "DashboardStats",
    "CourseAnalytics",
    "UserProgressAnalytics",
    "LearningStreak",
    "RecentActivity",
    "CoursePerformance",
    "ContentEngagement",
    "AdminAnalytics",
    "LearningPathRecommendation",
    "StudySession",
    "Achievement",
    # Search schemas
    "SearchRequest",
    "SearchFilters",
    "CourseSearchResult",
    "ContentSearchResult",
    "SearchResponse",
    "CourseSearchResponse",
    "ContentSearchResponse",
    "CombinedSearchResponse",
    "SearchSuggestion",
    "SearchSuggestionsResponse",
    "PopularSearch",
    "PopularSearchesResponse",
    "SearchAnalytics",
    "SearchStatsResponse",
]
