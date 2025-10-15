"""
Elasticsearch service for search functionality.
"""

import logging
from typing import Any, Dict, List, Optional

from elasticsearch import AsyncElasticsearch
from elasticsearch.dsl import (
    Date,
    Document,
    Float,
    Integer,
    Keyword,
    Text,
    connections,
)
from elasticsearch.dsl.query import Bool, MultiMatch, Range, Term

from app.core.config import settings

logger = logging.getLogger(__name__)


class CourseDocument(Document):
    """Elasticsearch document for courses."""

    id = Keyword()
    title = Text(analyzer="standard", fields={"keyword": Keyword()})
    description = Text(analyzer="standard")
    instructor = Text(analyzer="standard", fields={"keyword": Keyword()})
    category = Keyword()
    difficulty = Keyword()
    status = Keyword()
    duration = Integer()
    created_at = Date()
    updated_at = Date()
    tags = Keyword(multi=True)
    rating = Float()
    enrollment_count = Integer()
    thumbnail_url = Keyword()

    class Index:
        name = f"{settings.ELASTICSEARCH_INDEX_PREFIX}_courses"
        settings = {
            "number_of_shards": 1,
            "number_of_replicas": 0,
            "analysis": {
                "analyzer": {
                    "custom_analyzer": {
                        "type": "custom",
                        "tokenizer": "standard",
                        "filter": ["lowercase", "stop", "snowball"],
                    }
                }
            },
        }


class ContentDocument(Document):
    """Elasticsearch document for course content."""

    id = Keyword()
    course_id = Keyword()
    course_title = Text(analyzer="standard", fields={"keyword": Keyword()})
    title = Text(analyzer="standard", fields={"keyword": Keyword()})
    description = Text(analyzer="standard")
    type = Keyword()
    order_index = Integer()
    duration = Integer()
    file_size = Integer()
    created_at = Date()
    updated_at = Date()
    tags = Keyword(multi=True)
    file_url = Keyword()
    thumbnail_url = Keyword()

    class Index:
        name = f"{settings.ELASTICSEARCH_INDEX_PREFIX}_content"
        settings = {
            "number_of_shards": 1,
            "number_of_replicas": 0,
            "analysis": {
                "analyzer": {
                    "custom_analyzer": {
                        "type": "custom",
                        "tokenizer": "standard",
                        "filter": ["lowercase", "stop", "snowball"],
                    }
                }
            },
        }


class SearchService:
    """Elasticsearch service for search operations."""

    def __init__(self):
        """Initialize Elasticsearch client."""
        self.client = None
        self._initialize_client()

    def _initialize_client(self):
        """Initialize Elasticsearch client."""
        try:
            # Configure connection
            connection_config = {
                "hosts": [settings.ELASTICSEARCH_URL],
                "timeout": 30,
                "max_retries": 3,
                "retry_on_timeout": True,
            }

            # Add authentication if provided
            if settings.ELASTICSEARCH_USERNAME and settings.ELASTICSEARCH_PASSWORD:
                connection_config["basic_auth"] = (
                    settings.ELASTICSEARCH_USERNAME,
                    settings.ELASTICSEARCH_PASSWORD,
                )

            # Set up connections
            connections.create_connection("default", **connection_config)

            # Create async client
            self.client = AsyncElasticsearch(**connection_config)

            logger.info("Elasticsearch client initialized successfully")

        except Exception as e:
            logger.error(f"Failed to initialize Elasticsearch client: {str(e)}")
            self.client = None

    async def create_indices(self):
        """Create Elasticsearch indices."""
        try:
            if not self.client:
                logger.error("Elasticsearch client not initialized")
                return False

            # Create course index
            CourseDocument.init()

            # Create content index
            ContentDocument.init()

            logger.info("Elasticsearch indices created successfully")
            return True

        except Exception as e:
            logger.error(f"Failed to create indices: {str(e)}")
            return False

    async def index_course(self, course_data: Dict[str, Any]) -> bool:
        """Index a course document."""
        try:
            if not self.client:
                return False

            course_doc = CourseDocument(
                id=str(course_data["id"]),
                title=course_data["title"],
                description=course_data.get("description", ""),
                instructor=course_data.get("instructor", ""),
                category=course_data.get("category", ""),
                difficulty=course_data.get("difficulty", ""),
                status=course_data.get("status", ""),
                duration=course_data.get("duration", 0),
                created_at=course_data.get("created_at"),
                updated_at=course_data.get("updated_at"),
                tags=course_data.get("tags", []),
                rating=course_data.get("rating", 0.0),
                enrollment_count=course_data.get("enrollment_count", 0),
                thumbnail_url=course_data.get("thumbnail_url", ""),
            )

            await course_doc.save()
            logger.info(f"Indexed course: {course_data['id']}")
            return True

        except Exception as e:
            logger.error(
                f"Failed to index course {course_data.get('id', 'unknown')}: {str(e)}"
            )
            return False

    async def index_content(self, content_data: Dict[str, Any]) -> bool:
        """Index a content document."""
        try:
            if not self.client:
                return False

            content_doc = ContentDocument(
                id=str(content_data["id"]),
                course_id=str(content_data["course_id"]),
                course_title=content_data.get("course_title", ""),
                title=content_data["title"],
                description=content_data.get("description", ""),
                type=content_data.get("type", ""),
                order_index=content_data.get("order_index", 0),
                duration=content_data.get("duration", 0),
                file_size=content_data.get("file_size", 0),
                created_at=content_data.get("created_at"),
                updated_at=content_data.get("updated_at"),
                tags=content_data.get("tags", []),
                file_url=content_data.get("file_url", ""),
                thumbnail_url=content_data.get("thumbnail_url", ""),
            )

            await content_doc.save()
            logger.info(f"Indexed content: {content_data['id']}")
            return True

        except Exception as e:
            logger.error(
                f"Failed to index content {content_data.get('id', 'unknown')}: {str(e)}"
            )
            return False

    async def delete_course(self, course_id: str) -> bool:
        """Delete a course from index."""
        try:
            if not self.client:
                return False

            course_doc = CourseDocument.get(id=course_id)
            await course_doc.delete()
            logger.info(f"Deleted course from index: {course_id}")
            return True

        except Exception as e:
            logger.error(f"Failed to delete course {course_id}: {str(e)}")
            return False

    async def delete_content(self, content_id: str) -> bool:
        """Delete content from index."""
        try:
            if not self.client:
                return False

            content_doc = ContentDocument.get(id=content_id)
            await content_doc.delete()
            logger.info(f"Deleted content from index: {content_id}")
            return True

        except Exception as e:
            logger.error(f"Failed to delete content {content_id}: {str(e)}")
            return False

    async def search_courses(
        self,
        query: str,
        filters: Optional[Dict[str, Any]] = None,
        sort: Optional[str] = None,
        page: int = 1,
        size: int = 20,
    ) -> Dict[str, Any]:
        """Search courses with filters and pagination."""
        try:
            if not self.client:
                return {"hits": [], "total": 0, "page": page, "size": size}

            # Build search query
            search = CourseDocument.search()

            # Add text search
            if query:
                search = search.query(
                    MultiMatch(
                        query=query,
                        fields=["title^3", "description^2", "instructor^2", "tags^1.5"],
                        type="best_fields",
                        fuzziness="AUTO",
                    )
                )
            else:
                search = search.query(MatchAll())

            # Add filters
            if filters:
                bool_query = Bool()

                if filters.get("category"):
                    bool_query.must.append(Term(category=filters["category"]))

                if filters.get("difficulty"):
                    bool_query.must.append(Term(difficulty=filters["difficulty"]))

                if filters.get("status"):
                    bool_query.must.append(Term(status=filters["status"]))

                if filters.get("instructor"):
                    bool_query.must.append(
                        Term(instructor__keyword=filters["instructor"])
                    )

                if filters.get("min_duration"):
                    bool_query.must.append(
                        Range(duration={"gte": filters["min_duration"]})
                    )

                if filters.get("max_duration"):
                    bool_query.must.append(
                        Range(duration={"lte": filters["max_duration"]})
                    )

                if filters.get("min_rating"):
                    bool_query.must.append(Range(rating={"gte": filters["min_rating"]}))

                if filters.get("tags"):
                    for tag in filters["tags"]:
                        bool_query.must.append(Term(tags=tag))

                search = search.query(bool_query)

            # Add sorting
            if sort:
                if sort == "relevance":
                    pass  # Default relevance scoring
                elif sort == "title":
                    search = search.sort("title.keyword")
                elif sort == "created_at":
                    search = search.sort("-created_at")
                elif sort == "rating":
                    search = search.sort("-rating")
                elif sort == "enrollment_count":
                    search = search.sort("-enrollment_count")
            else:
                search = search.sort("_score")

            # Add pagination
            from_index = (page - 1) * size
            search = search[from_index : from_index + size]

            # Execute search
            response = await search.execute()

            # Format results
            results = []
            for hit in response:
                results.append(
                    {
                        "id": hit.id,
                        "title": hit.title,
                        "description": hit.description,
                        "instructor": hit.instructor,
                        "category": hit.category,
                        "difficulty": hit.difficulty,
                        "status": hit.status,
                        "duration": hit.duration,
                        "rating": hit.rating,
                        "enrollment_count": hit.enrollment_count,
                        "thumbnail_url": hit.thumbnail_url,
                        "created_at": hit.created_at,
                        "updated_at": hit.updated_at,
                        "tags": hit.tags,
                        "score": hit.meta.score,
                    }
                )

            return {
                "hits": results,
                "total": response.hits.total.value,
                "page": page,
                "size": size,
                "max_score": response.hits.max_score,
            }

        except Exception as e:
            logger.error(f"Failed to search courses: {str(e)}")
            return {"hits": [], "total": 0, "page": page, "size": size}

    async def search_content(
        self,
        query: str,
        course_id: Optional[str] = None,
        content_type: Optional[str] = None,
        filters: Optional[Dict[str, Any]] = None,
        sort: Optional[str] = None,
        page: int = 1,
        size: int = 20,
    ) -> Dict[str, Any]:
        """Search content with filters and pagination."""
        try:
            if not self.client:
                return {"hits": [], "total": 0, "page": page, "size": size}

            # Build search query
            search = ContentDocument.search()

            # Add text search
            if query:
                search = search.query(
                    MultiMatch(
                        query=query,
                        fields=[
                            "title^3",
                            "description^2",
                            "course_title^2",
                            "tags^1.5",
                        ],
                        type="best_fields",
                        fuzziness="AUTO",
                    )
                )
            else:
                search = search.query(MatchAll())

            # Add filters
            if filters:
                bool_query = Bool()

                if course_id:
                    bool_query.must.append(Term(course_id=course_id))

                if content_type:
                    bool_query.must.append(Term(type=content_type))

                if filters.get("min_duration"):
                    bool_query.must.append(
                        Range(duration={"gte": filters["min_duration"]})
                    )

                if filters.get("max_duration"):
                    bool_query.must.append(
                        Range(duration={"lte": filters["max_duration"]})
                    )

                if filters.get("tags"):
                    for tag in filters["tags"]:
                        bool_query.must.append(Term(tags=tag))

                search = search.query(bool_query)

            # Add sorting
            if sort:
                if sort == "relevance":
                    pass  # Default relevance scoring
                elif sort == "title":
                    search = search.sort("title.keyword")
                elif sort == "order_index":
                    search = search.sort("order_index")
                elif sort == "created_at":
                    search = search.sort("-created_at")
            else:
                search = search.sort("_score")

            # Add pagination
            from_index = (page - 1) * size
            search = search[from_index : from_index + size]

            # Execute search
            response = await search.execute()

            # Format results
            results = []
            for hit in response:
                results.append(
                    {
                        "id": hit.id,
                        "course_id": hit.course_id,
                        "course_title": hit.course_title,
                        "title": hit.title,
                        "description": hit.description,
                        "type": hit.type,
                        "order_index": hit.order_index,
                        "duration": hit.duration,
                        "file_size": hit.file_size,
                        "file_url": hit.file_url,
                        "thumbnail_url": hit.thumbnail_url,
                        "created_at": hit.created_at,
                        "updated_at": hit.updated_at,
                        "tags": hit.tags,
                        "score": hit.meta.score,
                    }
                )

            return {
                "hits": results,
                "total": response.hits.total.value,
                "page": page,
                "size": size,
                "max_score": response.hits.max_score,
            }

        except Exception as e:
            logger.error(f"Failed to search content: {str(e)}")
            return {"hits": [], "total": 0, "page": page, "size": size}

    async def search_all(
        self,
        query: str,
        filters: Optional[Dict[str, Any]] = None,
        sort: Optional[str] = None,
        page: int = 1,
        size: int = 20,
    ) -> Dict[str, Any]:
        """Search both courses and content."""
        try:
            # Search courses and content in parallel
            course_results = await self.search_courses(query, filters, sort, page, size)
            content_results = await self.search_content(
                query, None, None, filters, sort, page, size
            )

            return {
                "courses": course_results,
                "content": content_results,
                "total_results": course_results["total"] + content_results["total"],
            }

        except Exception as e:
            logger.error(f"Failed to search all: {str(e)}")
            return {
                "courses": {"hits": [], "total": 0},
                "content": {"hits": [], "total": 0},
                "total_results": 0,
            }

    async def get_suggestions(self, query: str, limit: int = 10) -> List[str]:
        """Get search suggestions based on query."""
        try:
            if not self.client or len(query) < 2:
                return []

            # Search for suggestions in course titles and content titles
            search = CourseDocument.search()
            search = search.suggest(
                "course_suggestions",
                query,
                completion={"field": "title.suggest", "size": limit},
            )

            response = await search.execute()

            suggestions = []
            if (
                hasattr(response, "suggest")
                and "course_suggestions" in response.suggest
            ):
                for suggestion in response.suggest.course_suggestions[0].options:
                    suggestions.append(suggestion.text)

            return suggestions[:limit]

        except Exception as e:
            logger.error(f"Failed to get suggestions: {str(e)}")
            return []

    async def get_popular_searches(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get popular search terms."""
        try:
            if not self.client:
                return []

            # This would typically be implemented with search analytics
            # For now, return empty list
            return []

        except Exception as e:
            logger.error(f"Failed to get popular searches: {str(e)}")
            return []

    async def health_check(self) -> Dict[str, Any]:
        """Check Elasticsearch health."""
        try:
            if not self.client:
                return {"status": "unhealthy", "error": "Client not initialized"}

            health = await self.client.cluster.health()
            return {
                "status": "healthy"
                if health["status"] in ["green", "yellow"]
                else "unhealthy",
                "cluster_status": health["status"],
                "number_of_nodes": health["number_of_nodes"],
                "active_shards": health["active_shards"],
            }

        except Exception as e:
            logger.error(f"Elasticsearch health check failed: {str(e)}")
            return {"status": "unhealthy", "error": str(e)}


# Global search service instance
search_service = SearchService()
