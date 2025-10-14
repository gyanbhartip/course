"""
Search endpoints for courses and content using Elasticsearch.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from uuid import UUID
from app.db.session import get_db
from app.schemas.search import (
    SearchRequest,
    SearchFilters,
    CourseSearchResponse,
    ContentSearchResponse,
    CombinedSearchResponse,
    SearchSuggestionsResponse,
    PopularSearchesResponse,
    SearchStatsResponse,
)
from app.services.search import search_service
from app.core.monitoring import db_monitoring
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/search", tags=["search"])


@router.get("/courses", response_model=CourseSearchResponse)
async def search_courses(
    q: str = Query(..., min_length=1, max_length=200, description="Search query"),
    category: Optional[str] = Query(None, description="Filter by category"),
    difficulty: Optional[str] = Query(None, description="Filter by difficulty"),
    status: Optional[str] = Query(None, description="Filter by status"),
    instructor: Optional[str] = Query(None, description="Filter by instructor"),
    min_duration: Optional[int] = Query(
        None, ge=0, description="Minimum duration in minutes"
    ),
    max_duration: Optional[int] = Query(
        None, ge=0, description="Maximum duration in minutes"
    ),
    min_rating: Optional[float] = Query(None, ge=0, le=5, description="Minimum rating"),
    tags: Optional[str] = Query(None, description="Comma-separated tags"),
    sort: Optional[str] = Query(
        "relevance",
        description="Sort option: relevance, title, created_at, rating, enrollment_count",
    ),
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(20, ge=1, le=100, description="Results per page"),
    db: AsyncSession = Depends(get_db),
):
    """
    Search courses with filters and pagination.

    Args:
        q: Search query
        category: Filter by category
        difficulty: Filter by difficulty
        status: Filter by status
        instructor: Filter by instructor
        min_duration: Minimum duration in minutes
        max_duration: Maximum duration in minutes
        min_rating: Minimum rating
        tags: Comma-separated tags
        sort: Sort option
        page: Page number
        size: Results per page
        db: Database session

    Returns:
        CourseSearchResponse: Search results
    """
    try:
        # Build filters
        filters = {}
        if category:
            filters["category"] = category
        if difficulty:
            filters["difficulty"] = difficulty
        if status:
            filters["status"] = status
        if instructor:
            filters["instructor"] = instructor
        if min_duration is not None:
            filters["min_duration"] = min_duration
        if max_duration is not None:
            filters["max_duration"] = max_duration
        if min_rating is not None:
            filters["min_rating"] = min_rating
        if tags:
            filters["tags"] = [tag.strip() for tag in tags.split(",")]

        # Perform search
        results = await search_service.search_courses(
            query=q,
            filters=filters if filters else None,
            sort=sort,
            page=page,
            size=size,
        )

        return CourseSearchResponse(**results)

    except Exception as e:
        logger.error(f"Course search failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Search failed"
        )


@router.get("/content", response_model=ContentSearchResponse)
async def search_content(
    q: str = Query(..., min_length=1, max_length=200, description="Search query"),
    course_id: Optional[UUID] = Query(None, description="Filter by course ID"),
    content_type: Optional[str] = Query(None, description="Filter by content type"),
    min_duration: Optional[int] = Query(
        None, ge=0, description="Minimum duration in minutes"
    ),
    max_duration: Optional[int] = Query(
        None, ge=0, description="Maximum duration in minutes"
    ),
    tags: Optional[str] = Query(None, description="Comma-separated tags"),
    sort: Optional[str] = Query(
        "relevance",
        description="Sort option: relevance, title, order_index, created_at",
    ),
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(20, ge=1, le=100, description="Results per page"),
    db: AsyncSession = Depends(get_db),
):
    """
    Search content with filters and pagination.

    Args:
        q: Search query
        course_id: Filter by course ID
        content_type: Filter by content type
        min_duration: Minimum duration in minutes
        max_duration: Maximum duration in minutes
        tags: Comma-separated tags
        sort: Sort option
        page: Page number
        size: Results per page
        db: Database session

    Returns:
        ContentSearchResponse: Search results
    """
    try:
        # Build filters
        filters = {}
        if min_duration is not None:
            filters["min_duration"] = min_duration
        if max_duration is not None:
            filters["max_duration"] = max_duration
        if tags:
            filters["tags"] = [tag.strip() for tag in tags.split(",")]

        # Perform search
        results = await search_service.search_content(
            query=q,
            course_id=str(course_id) if course_id else None,
            content_type=content_type,
            filters=filters if filters else None,
            sort=sort,
            page=page,
            size=size,
        )

        return ContentSearchResponse(**results)

    except Exception as e:
        logger.error(f"Content search failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Search failed"
        )


@router.get("/all", response_model=CombinedSearchResponse)
async def search_all(
    q: str = Query(..., min_length=1, max_length=200, description="Search query"),
    category: Optional[str] = Query(None, description="Filter by category"),
    difficulty: Optional[str] = Query(None, description="Filter by difficulty"),
    status: Optional[str] = Query(None, description="Filter by status"),
    instructor: Optional[str] = Query(None, description="Filter by instructor"),
    content_type: Optional[str] = Query(None, description="Filter by content type"),
    min_duration: Optional[int] = Query(
        None, ge=0, description="Minimum duration in minutes"
    ),
    max_duration: Optional[int] = Query(
        None, ge=0, description="Maximum duration in minutes"
    ),
    min_rating: Optional[float] = Query(None, ge=0, le=5, description="Minimum rating"),
    tags: Optional[str] = Query(None, description="Comma-separated tags"),
    sort: Optional[str] = Query(
        "relevance",
        description="Sort option: relevance, title, created_at, rating, enrollment_count",
    ),
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(20, ge=1, le=100, description="Results per page"),
    db: AsyncSession = Depends(get_db),
):
    """
    Search both courses and content with filters and pagination.

    Args:
        q: Search query
        category: Filter by category
        difficulty: Filter by difficulty
        status: Filter by status
        instructor: Filter by instructor
        content_type: Filter by content type
        min_duration: Minimum duration in minutes
        max_duration: Maximum duration in minutes
        min_rating: Minimum rating
        tags: Comma-separated tags
        sort: Sort option
        page: Page number
        size: Results per page
        db: Database session

    Returns:
        CombinedSearchResponse: Combined search results
    """
    try:
        # Build filters
        filters = {}
        if category:
            filters["category"] = category
        if difficulty:
            filters["difficulty"] = difficulty
        if status:
            filters["status"] = status
        if instructor:
            filters["instructor"] = instructor
        if min_duration is not None:
            filters["min_duration"] = min_duration
        if max_duration is not None:
            filters["max_duration"] = max_duration
        if min_rating is not None:
            filters["min_rating"] = min_rating
        if tags:
            filters["tags"] = [tag.strip() for tag in tags.split(",")]

        # Perform combined search
        results = await search_service.search_all(
            query=q,
            filters=filters if filters else None,
            sort=sort,
            page=page,
            size=size,
        )

        return CombinedSearchResponse(**results)

    except Exception as e:
        logger.error(f"Combined search failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Search failed"
        )


@router.get("/suggestions", response_model=SearchSuggestionsResponse)
async def get_search_suggestions(
    q: str = Query(..., min_length=2, max_length=50, description="Search query"),
    limit: int = Query(10, ge=1, le=20, description="Number of suggestions"),
    db: AsyncSession = Depends(get_db),
):
    """
    Get search suggestions based on query.

    Args:
        q: Search query
        limit: Number of suggestions
        db: Database session

    Returns:
        SearchSuggestionsResponse: Search suggestions
    """
    try:
        suggestions = await search_service.get_suggestions(q, limit)

        return SearchSuggestionsResponse(
            suggestions=[
                {"text": s, "type": "course", "count": None} for s in suggestions
            ],
            query=q,
        )

    except Exception as e:
        logger.error(f"Failed to get suggestions: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get suggestions",
        )


@router.get("/popular", response_model=PopularSearchesResponse)
async def get_popular_searches(
    limit: int = Query(10, ge=1, le=50, description="Number of popular searches"),
    db: AsyncSession = Depends(get_db),
):
    """
    Get popular search terms.

    Args:
        limit: Number of popular searches
        db: Database session

    Returns:
        PopularSearchesResponse: Popular search terms
    """
    try:
        popular_searches = await search_service.get_popular_searches(limit)

        return PopularSearchesResponse(searches=popular_searches)

    except Exception as e:
        logger.error(f"Failed to get popular searches: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get popular searches",
        )


@router.get("/stats", response_model=SearchStatsResponse)
async def get_search_stats(db: AsyncSession = Depends(get_db)):
    """
    Get search statistics and analytics.

    Args:
        db: Database session

    Returns:
        SearchStatsResponse: Search statistics
    """
    try:
        # Get Elasticsearch health
        health = await search_service.health_check()

        # Mock analytics data (in production, this would come from search analytics)
        analytics = {
            "total_searches": 0,
            "unique_queries": 0,
            "avg_results_per_search": 0.0,
            "top_categories": [],
            "top_instructors": [],
            "search_trends": [],
        }

        return SearchStatsResponse(analytics=analytics, index_stats=health)

    except Exception as e:
        logger.error(f"Failed to get search stats: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get search statistics",
        )


@router.get("/health")
async def search_health_check():
    """
    Check Elasticsearch health.

    Returns:
        Dict[str, Any]: Elasticsearch health status
    """
    try:
        health = await search_service.health_check()
        return health

    except Exception as e:
        logger.error(f"Search health check failed: {str(e)}")
        return {"status": "unhealthy", "error": str(e)}
