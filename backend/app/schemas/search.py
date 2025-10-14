"""
Pydantic schemas for search operations.
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from uuid import UUID


class SearchFilters(BaseModel):
    """Schema for search filters."""

    category: Optional[str] = Field(None, description="Course category filter")
    difficulty: Optional[str] = Field(None, description="Course difficulty filter")
    status: Optional[str] = Field(None, description="Course status filter")
    instructor: Optional[str] = Field(None, description="Instructor filter")
    min_duration: Optional[int] = Field(
        None, ge=0, description="Minimum duration in minutes"
    )
    max_duration: Optional[int] = Field(
        None, ge=0, description="Maximum duration in minutes"
    )
    min_rating: Optional[float] = Field(None, ge=0, le=5, description="Minimum rating")
    tags: Optional[List[str]] = Field(None, description="Tags filter")
    content_type: Optional[str] = Field(None, description="Content type filter")
    course_id: Optional[UUID] = Field(
        None, description="Course ID filter for content search"
    )

    class Config:
        from_attributes = True


class SearchRequest(BaseModel):
    """Schema for search request."""

    query: str = Field(..., min_length=1, max_length=200, description="Search query")
    filters: Optional[SearchFilters] = Field(None, description="Search filters")
    sort: Optional[str] = Field(
        None,
        description="Sort option: relevance, title, created_at, rating, enrollment_count",
    )
    page: int = Field(1, ge=1, description="Page number")
    size: int = Field(20, ge=1, le=100, description="Results per page")

    class Config:
        from_attributes = True


class CourseSearchResult(BaseModel):
    """Schema for course search result."""

    id: UUID
    title: str
    description: str
    instructor: str
    category: str
    difficulty: str
    status: str
    duration: int
    rating: float
    enrollment_count: int
    thumbnail_url: Optional[str]
    created_at: datetime
    updated_at: datetime
    tags: List[str]
    score: Optional[float] = Field(None, description="Search relevance score")

    class Config:
        from_attributes = True


class ContentSearchResult(BaseModel):
    """Schema for content search result."""

    id: UUID
    course_id: UUID
    course_title: str
    title: str
    description: str
    type: str
    order_index: int
    duration: int
    file_size: int
    file_url: Optional[str]
    thumbnail_url: Optional[str]
    created_at: datetime
    updated_at: datetime
    tags: List[str]
    score: Optional[float] = Field(None, description="Search relevance score")

    class Config:
        from_attributes = True


class SearchResponse(BaseModel):
    """Schema for search response."""

    hits: List[Any] = Field(description="Search results")
    total: int = Field(description="Total number of results")
    page: int = Field(description="Current page number")
    size: int = Field(description="Results per page")
    max_score: Optional[float] = Field(None, description="Maximum relevance score")

    class Config:
        from_attributes = True


class CourseSearchResponse(SearchResponse):
    """Schema for course search response."""

    hits: List[CourseSearchResult] = Field(description="Course search results")


class ContentSearchResponse(SearchResponse):
    """Schema for content search response."""

    hits: List[ContentSearchResult] = Field(description="Content search results")


class CombinedSearchResponse(BaseModel):
    """Schema for combined search response."""

    courses: CourseSearchResponse = Field(description="Course search results")
    content: ContentSearchResponse = Field(description="Content search results")
    total_results: int = Field(description="Total results across all types")

    class Config:
        from_attributes = True


class SearchSuggestion(BaseModel):
    """Schema for search suggestion."""

    text: str = Field(description="Suggestion text")
    type: str = Field(description="Suggestion type (course, content, tag)")
    count: Optional[int] = Field(None, description="Number of occurrences")

    class Config:
        from_attributes = True


class SearchSuggestionsResponse(BaseModel):
    """Schema for search suggestions response."""

    suggestions: List[SearchSuggestion] = Field(description="Search suggestions")
    query: str = Field(description="Original query")

    class Config:
        from_attributes = True


class PopularSearch(BaseModel):
    """Schema for popular search term."""

    term: str = Field(description="Search term")
    count: int = Field(description="Number of searches")
    last_searched: datetime = Field(description="Last time searched")

    class Config:
        from_attributes = True


class PopularSearchesResponse(BaseModel):
    """Schema for popular searches response."""

    searches: List[PopularSearch] = Field(description="Popular search terms")

    class Config:
        from_attributes = True


class SearchAnalytics(BaseModel):
    """Schema for search analytics."""

    total_searches: int = Field(description="Total number of searches")
    unique_queries: int = Field(description="Number of unique queries")
    avg_results_per_search: float = Field(description="Average results per search")
    top_categories: List[Dict[str, Any]] = Field(description="Top searched categories")
    top_instructors: List[Dict[str, Any]] = Field(
        description="Top searched instructors"
    )
    search_trends: List[Dict[str, Any]] = Field(description="Search trends over time")

    class Config:
        from_attributes = True


class SearchStatsResponse(BaseModel):
    """Schema for search statistics response."""

    analytics: SearchAnalytics = Field(description="Search analytics")
    index_stats: Dict[str, Any] = Field(description="Elasticsearch index statistics")

    class Config:
        from_attributes = True
