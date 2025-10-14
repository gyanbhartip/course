"""
Tests for course endpoints.
"""

import pytest
from httpx import AsyncClient
from app.db.models.course import Course, CourseStatus, DifficultyLevel
from app.db.models.user import User


class TestCourseEndpoints:
    """Test course endpoints."""

    async def test_list_courses_empty(self, client: AsyncClient):
        """Test listing courses when none exist."""
        response = await client.get("/api/v1/courses")

        assert response.status_code == 200
        data = response.json()
        assert data["courses"] == []
        assert data["total"] == 0
        assert data["page"] == 1
        assert data["size"] == 20
        assert data["pages"] == 0

    async def test_create_course_admin(self, client: AsyncClient, admin_headers: dict):
        """Test course creation by admin."""
        course_data = {
            "title": "Test Course",
            "description": "A test course",
            "instructor": "Test Instructor",
            "difficulty": "beginner",
            "category": "programming",
        }

        response = await client.post(
            "/api/v1/courses", json=course_data, headers=admin_headers
        )

        assert response.status_code == 201
        data = response.json()
        assert data["title"] == course_data["title"]
        assert data["description"] == course_data["description"]
        assert data["instructor"] == course_data["instructor"]
        assert data["difficulty"] == course_data["difficulty"]
        assert data["category"] == course_data["category"]
        assert data["status"] == "draft"
        assert "id" in data

    async def test_create_course_unauthorized(self, client: AsyncClient):
        """Test course creation without authentication."""
        course_data = {
            "title": "Test Course",
            "description": "A test course",
            "instructor": "Test Instructor",
            "difficulty": "beginner",
        }

        response = await client.post("/api/v1/courses", json=course_data)

        assert response.status_code == 401

    async def test_create_course_non_admin(
        self, client: AsyncClient, auth_headers: dict
    ):
        """Test course creation by non-admin user."""
        course_data = {
            "title": "Test Course",
            "description": "A test course",
            "instructor": "Test Instructor",
            "difficulty": "beginner",
        }

        response = await client.post(
            "/api/v1/courses", json=course_data, headers=auth_headers
        )

        assert response.status_code == 403
        assert "Admin access required" in response.json()["detail"]

    async def test_get_course_not_found(self, client: AsyncClient):
        """Test getting non-existent course."""
        response = await client.get(
            "/api/v1/courses/00000000-0000-0000-0000-000000000000"
        )

        assert response.status_code == 404
        assert "Course not found" in response.json()["detail"]

    async def test_update_course(
        self, client: AsyncClient, admin_headers: dict, db_session
    ):
        """Test course update."""
        # Create a course first
        course = Course(
            title="Original Title",
            description="Original Description",
            instructor="Original Instructor",
            difficulty=DifficultyLevel.BEGINNER,
            status=CourseStatus.DRAFT,
        )
        db_session.add(course)
        await db_session.commit()
        await db_session.refresh(course)

        # Update the course
        update_data = {"title": "Updated Title", "description": "Updated Description"}

        response = await client.put(
            f"/api/v1/courses/{course.id}", json=update_data, headers=admin_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["title"] == update_data["title"]
        assert data["description"] == update_data["description"]
        assert data["instructor"] == "Original Instructor"  # Should remain unchanged

    async def test_delete_course(
        self, client: AsyncClient, admin_headers: dict, db_session
    ):
        """Test course deletion."""
        # Create a course first
        course = Course(
            title="Course to Delete",
            description="This course will be deleted",
            instructor="Test Instructor",
            difficulty=DifficultyLevel.BEGINNER,
            status=CourseStatus.DRAFT,
        )
        db_session.add(course)
        await db_session.commit()
        await db_session.refresh(course)

        # Delete the course
        response = await client.delete(
            f"/api/v1/courses/{course.id}", headers=admin_headers
        )

        assert response.status_code == 204

        # Verify course is deleted
        get_response = await client.get(f"/api/v1/courses/{course.id}")
        assert get_response.status_code == 404

    async def test_list_courses_with_filters(self, client: AsyncClient, db_session):
        """Test listing courses with filters."""
        # Create test courses
        course1 = Course(
            title="Beginner Course",
            description="A beginner course",
            instructor="Instructor 1",
            difficulty=DifficultyLevel.BEGINNER,
            category="programming",
            status=CourseStatus.PUBLISHED,
        )
        course2 = Course(
            title="Advanced Course",
            description="An advanced course",
            instructor="Instructor 2",
            difficulty=DifficultyLevel.ADVANCED,
            category="programming",
            status=CourseStatus.PUBLISHED,
        )
        course3 = Course(
            title="Design Course",
            description="A design course",
            instructor="Instructor 3",
            difficulty=DifficultyLevel.INTERMEDIATE,
            category="design",
            status=CourseStatus.PUBLISHED,
        )

        db_session.add_all([course1, course2, course3])
        await db_session.commit()

        # Test filter by difficulty
        response = await client.get("/api/v1/courses?difficulty=beginner")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert data["courses"][0]["title"] == "Beginner Course"

        # Test filter by category
        response = await client.get("/api/v1/courses?category=programming")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 2

        # Test pagination
        response = await client.get("/api/v1/courses?limit=2")
        assert response.status_code == 200
        data = response.json()
        assert len(data["courses"]) == 2
        assert data["total"] == 3
        assert data["pages"] == 2
