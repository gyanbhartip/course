"""
Search indexing tasks using Celery.
"""

from celery import Task
from typing import Dict, Any, List
from uuid import UUID
from app.tasks.celery_app import celery_app
from app.services.search import search_service
import logging

logger = logging.getLogger(__name__)


class SearchTask(Task):
    """Base task class for search operations."""

    def on_success(self, retval, task_id, args, kwargs):
        """Called on task success."""
        pass

    def on_failure(self, exc, task_id, args, kwargs, einfo):
        """Called on task failure."""
        logger.error(f"Search task {task_id} failed: {str(exc)}")


@celery_app.task(bind=True, base=SearchTask)
def index_course_task(self, course_data: Dict[str, Any]):
    """
    Index a course in Elasticsearch.

    Args:
        course_data: Course data to index

    Returns:
        Dict[str, Any]: Task result
    """
    try:
        success = asyncio.run(search_service.index_course(course_data))

        return {
            "status": "success",
            "indexed": success,
            "course_id": course_data.get("id"),
        }

    except Exception as e:
        logger.error(
            f"Failed to index course {course_data.get('id', 'unknown')}: {str(e)}"
        )
        raise self.retry(exc=e, countdown=60, max_retries=3)


@celery_app.task(bind=True, base=SearchTask)
def index_content_task(self, content_data: Dict[str, Any]):
    """
    Index content in Elasticsearch.

    Args:
        content_data: Content data to index

    Returns:
        Dict[str, Any]: Task result
    """
    try:
        success = asyncio.run(search_service.index_content(content_data))

        return {
            "status": "success",
            "indexed": success,
            "content_id": content_data.get("id"),
        }

    except Exception as e:
        logger.error(
            f"Failed to index content {content_data.get('id', 'unknown')}: {str(e)}"
        )
        raise self.retry(exc=e, countdown=60, max_retries=3)


@celery_app.task(bind=True, base=SearchTask)
def delete_course_task(self, course_id: str):
    """
    Delete a course from Elasticsearch index.

    Args:
        course_id: Course ID to delete

    Returns:
        Dict[str, Any]: Task result
    """
    try:
        success = asyncio.run(search_service.delete_course(course_id))

        return {"status": "success", "deleted": success, "course_id": course_id}

    except Exception as e:
        logger.error(f"Failed to delete course {course_id}: {str(e)}")
        raise self.retry(exc=e, countdown=60, max_retries=3)


@celery_app.task(bind=True, base=SearchTask)
def delete_content_task(self, content_id: str):
    """
    Delete content from Elasticsearch index.

    Args:
        content_id: Content ID to delete

    Returns:
        Dict[str, Any]: Task result
    """
    try:
        success = asyncio.run(search_service.delete_content(content_id))

        return {"status": "success", "deleted": success, "content_id": content_id}

    except Exception as e:
        logger.error(f"Failed to delete content {content_id}: {str(e)}")
        raise self.retry(exc=e, countdown=60, max_retries=3)


@celery_app.task(bind=True, base=SearchTask)
def bulk_index_courses_task(self, courses_data: List[Dict[str, Any]]):
    """
    Bulk index multiple courses in Elasticsearch.

    Args:
        courses_data: List of course data to index

    Returns:
        Dict[str, Any]: Task result
    """
    try:
        indexed_count = 0
        failed_count = 0

        for course_data in courses_data:
            try:
                success = asyncio.run(search_service.index_course(course_data))
                if success:
                    indexed_count += 1
                else:
                    failed_count += 1
            except Exception as e:
                logger.error(
                    f"Failed to index course {course_data.get('id', 'unknown')}: {str(e)}"
                )
                failed_count += 1

        return {
            "status": "success",
            "indexed_count": indexed_count,
            "failed_count": failed_count,
            "total_count": len(courses_data),
        }

    except Exception as e:
        logger.error(f"Bulk course indexing failed: {str(e)}")
        raise self.retry(exc=e, countdown=120, max_retries=2)


@celery_app.task(bind=True, base=SearchTask)
def bulk_index_content_task(self, content_data: List[Dict[str, Any]]):
    """
    Bulk index multiple content items in Elasticsearch.

    Args:
        content_data: List of content data to index

    Returns:
        Dict[str, Any]: Task result
    """
    try:
        indexed_count = 0
        failed_count = 0

        for content_item in content_data:
            try:
                success = asyncio.run(search_service.index_content(content_item))
                if success:
                    indexed_count += 1
                else:
                    failed_count += 1
            except Exception as e:
                logger.error(
                    f"Failed to index content {content_item.get('id', 'unknown')}: {str(e)}"
                )
                failed_count += 1

        return {
            "status": "success",
            "indexed_count": indexed_count,
            "failed_count": failed_count,
            "total_count": len(content_data),
        }

    except Exception as e:
        logger.error(f"Bulk content indexing failed: {str(e)}")
        raise self.retry(exc=e, countdown=120, max_retries=2)


@celery_app.task(bind=True, base=SearchTask)
def reindex_all_courses_task(self):
    """
    Reindex all courses from database to Elasticsearch.

    Returns:
        Dict[str, Any]: Task result
    """
    try:
        from app.db.session import AsyncSessionLocal
        from app.db.models.course import Course
        from sqlalchemy import select

        async def reindex_courses():
            async with AsyncSessionLocal() as db:
                # Get all courses
                result = await db.execute(select(Course))
                courses = result.scalars().all()

                indexed_count = 0
                failed_count = 0

                for course in courses:
                    try:
                        course_data = {
                            "id": str(course.id),
                            "title": course.title,
                            "description": course.description or "",
                            "instructor": course.instructor or "",
                            "category": course.category or "",
                            "difficulty": course.difficulty.value
                            if course.difficulty
                            else "",
                            "status": course.status.value if course.status else "",
                            "duration": course.duration or 0,
                            "created_at": course.created_at,
                            "updated_at": course.updated_at,
                            "tags": [],  # Add tags if available
                            "rating": 0.0,  # Add rating if available
                            "enrollment_count": 0,  # Add enrollment count if available
                            "thumbnail_url": course.thumbnail_url or "",
                        }

                        success = await search_service.index_course(course_data)
                        if success:
                            indexed_count += 1
                        else:
                            failed_count += 1

                    except Exception as e:
                        logger.error(f"Failed to reindex course {course.id}: {str(e)}")
                        failed_count += 1

                return {
                    "indexed_count": indexed_count,
                    "failed_count": failed_count,
                    "total_count": len(courses),
                }

        result = asyncio.run(reindex_courses())

        return {"status": "success", **result}

    except Exception as e:
        logger.error(f"Reindex all courses failed: {str(e)}")
        raise self.retry(exc=e, countdown=300, max_retries=2)


@celery_app.task(bind=True, base=SearchTask)
def reindex_all_content_task(self):
    """
    Reindex all content from database to Elasticsearch.

    Returns:
        Dict[str, Any]: Task result
    """
    try:
        from app.db.session import AsyncSessionLocal
        from app.db.models.content import CourseContent
        from app.db.models.course import Course
        from sqlalchemy import select

        async def reindex_content():
            async with AsyncSessionLocal() as db:
                # Get all content with course information
                result = await db.execute(
                    select(CourseContent, Course).join(
                        Course, CourseContent.course_id == Course.id
                    )
                )
                content_items = result.all()

                indexed_count = 0
                failed_count = 0

                for content, course in content_items:
                    try:
                        content_data = {
                            "id": str(content.id),
                            "course_id": str(content.course_id),
                            "course_title": course.title,
                            "title": content.title,
                            "description": content.description or "",
                            "type": content.type.value if content.type else "",
                            "order_index": content.order_index or 0,
                            "duration": content.duration or 0,
                            "file_size": content.file_size or 0,
                            "created_at": content.created_at,
                            "updated_at": content.updated_at,
                            "tags": [],  # Add tags if available
                            "file_url": content.file_url or "",
                            "thumbnail_url": content.thumbnail_url or "",
                        }

                        success = await search_service.index_content(content_data)
                        if success:
                            indexed_count += 1
                        else:
                            failed_count += 1

                    except Exception as e:
                        logger.error(
                            f"Failed to reindex content {content.id}: {str(e)}"
                        )
                        failed_count += 1

                return {
                    "indexed_count": indexed_count,
                    "failed_count": failed_count,
                    "total_count": len(content_items),
                }

        result = asyncio.run(reindex_content())

        return {"status": "success", **result}

    except Exception as e:
        logger.error(f"Reindex all content failed: {str(e)}")
        raise self.retry(exc=e, countdown=300, max_retries=2)


@celery_app.task(bind=True, base=SearchTask)
def create_search_indices_task(self):
    """
    Create Elasticsearch indices for search.

    Returns:
        Dict[str, Any]: Task result
    """
    try:
        success = asyncio.run(search_service.create_indices())

        return {"status": "success", "indices_created": success}

    except Exception as e:
        logger.error(f"Failed to create search indices: {str(e)}")
        raise self.retry(exc=e, countdown=60, max_retries=3)
