"""
Tests for enrollment endpoints.
"""

import pytest
from httpx import AsyncClient
from app.db.models.course import Course, CourseStatus, DifficultyLevel
from app.db.models.enrollment import Enrollment
from app.db.models.user import User


class TestEnrollmentEndpoints:
    """Test enrollment endpoints."""

    async def test_enroll_in_course(
        self, client: AsyncClient, auth_headers: dict, db_session, test_user: User
    ):
        """Test enrolling in a course."""
        # Create a course
        course = Course(
            title="Test Course",
            description="A test course",
            instructor="Test Instructor",
            difficulty=DifficultyLevel.BEGINNER,
            status=CourseStatus.PUBLISHED,
        )
        db_session.add(course)
        await db_session.commit()
        await db_session.refresh(course)

        # Enroll in the course
        response = await client.post(
            f"/api/v1/enrollments/{course.id}", headers=auth_headers
        )

        assert response.status_code == 201
        data = response.json()
        assert data["user_id"] == str(test_user.id)
        assert data["course_id"] == str(course.id)
        assert "enrolled_at" in data

    async def test_enroll_in_nonexistent_course(
        self, client: AsyncClient, auth_headers: dict
    ):
        """Test enrolling in a non-existent course."""
        response = await client.post(
            "/api/v1/enrollments/00000000-0000-0000-0000-000000000000",
            headers=auth_headers,
        )

        assert response.status_code == 404
        assert "Course not found" in response.json()["detail"]

    async def test_enroll_twice(
        self, client: AsyncClient, auth_headers: dict, db_session
    ):
        """Test enrolling in the same course twice."""
        # Create a course
        course = Course(
            title="Test Course",
            description="A test course",
            instructor="Test Instructor",
            difficulty=DifficultyLevel.BEGINNER,
            status=CourseStatus.PUBLISHED,
        )
        db_session.add(course)
        await db_session.commit()
        await db_session.refresh(course)

        # Enroll first time
        response1 = await client.post(
            f"/api/v1/enrollments/{course.id}", headers=auth_headers
        )
        assert response1.status_code == 201

        # Try to enroll again
        response2 = await client.post(
            f"/api/v1/enrollments/{course.id}", headers=auth_headers
        )
        assert response2.status_code == 400
        assert "Already enrolled" in response2.json()["detail"]

    async def test_unenroll_from_course(
        self, client: AsyncClient, auth_headers: dict, db_session, test_user: User
    ):
        """Test unenrolling from a course."""
        # Create a course
        course = Course(
            title="Test Course",
            description="A test course",
            instructor="Test Instructor",
            difficulty=DifficultyLevel.BEGINNER,
            status=CourseStatus.PUBLISHED,
        )
        db_session.add(course)
        await db_session.commit()
        await db_session.refresh(course)

        # Create enrollment
        enrollment = Enrollment(user_id=test_user.id, course_id=course.id)
        db_session.add(enrollment)
        await db_session.commit()

        # Unenroll
        response = await client.delete(
            f"/api/v1/enrollments/{course.id}", headers=auth_headers
        )

        assert response.status_code == 204

    async def test_unenroll_not_enrolled(
        self, client: AsyncClient, auth_headers: dict, db_session
    ):
        """Test unenrolling from a course when not enrolled."""
        # Create a course
        course = Course(
            title="Test Course",
            description="A test course",
            instructor="Test Instructor",
            difficulty=DifficultyLevel.BEGINNER,
            status=CourseStatus.PUBLISHED,
        )
        db_session.add(course)
        await db_session.commit()
        await db_session.refresh(course)

        # Try to unenroll
        response = await client.delete(
            f"/api/v1/enrollments/{course.id}", headers=auth_headers
        )

        assert response.status_code == 404
        assert "Enrollment not found" in response.json()["detail"]

    async def test_get_my_enrollments(
        self, client: AsyncClient, auth_headers: dict, db_session, test_user: User
    ):
        """Test getting user's enrollments."""
        # Create courses
        course1 = Course(
            title="Course 1",
            description="First course",
            instructor="Instructor 1",
            difficulty=DifficultyLevel.BEGINNER,
            status=CourseStatus.PUBLISHED,
        )
        course2 = Course(
            title="Course 2",
            description="Second course",
            instructor="Instructor 2",
            difficulty=DifficultyLevel.INTERMEDIATE,
            status=CourseStatus.PUBLISHED,
        )
        db_session.add_all([course1, course2])
        await db_session.commit()
        await db_session.refresh(course1)
        await db_session.refresh(course2)

        # Create enrollments
        enrollment1 = Enrollment(user_id=test_user.id, course_id=course1.id)
        enrollment2 = Enrollment(user_id=test_user.id, course_id=course2.id)
        db_session.add_all([enrollment1, enrollment2])
        await db_session.commit()

        # Get enrollments
        response = await client.get("/api/v1/enrollments/my", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        assert data[0]["course"]["title"] in ["Course 1", "Course 2"]
        assert data[1]["course"]["title"] in ["Course 1", "Course 2"]

    async def test_check_enrollment_status(
        self, client: AsyncClient, auth_headers: dict, db_session, test_user: User
    ):
        """Test checking enrollment status."""
        # Create a course
        course = Course(
            title="Test Course",
            description="A test course",
            instructor="Test Instructor",
            difficulty=DifficultyLevel.BEGINNER,
            status=CourseStatus.PUBLISHED,
        )
        db_session.add(course)
        await db_session.commit()
        await db_session.refresh(course)

        # Check enrollment status (not enrolled)
        response = await client.get(
            f"/api/v1/enrollments/{course.id}/check", headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["enrolled"] is False
        assert data["enrolled_at"] is None

        # Enroll in the course
        enrollment = Enrollment(user_id=test_user.id, course_id=course.id)
        db_session.add(enrollment)
        await db_session.commit()

        # Check enrollment status (enrolled)
        response = await client.get(
            f"/api/v1/enrollments/{course.id}/check", headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["enrolled"] is True
        assert data["enrolled_at"] is not None
