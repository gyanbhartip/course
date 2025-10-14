"""
Tests for notes endpoints.
"""

import pytest
from httpx import AsyncClient
from app.db.models.course import Course, CourseStatus, DifficultyLevel
from app.db.models.note import Note
from app.db.models.user import User


class TestNotesEndpoints:
    """Test notes endpoints."""

    async def test_create_note(
        self, client: AsyncClient, auth_headers: dict, db_session, test_user: User
    ):
        """Test creating a note."""
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

        # Create a note
        note_data = {
            "title": "My Note",
            "content": "This is my note content",
            "course_id": str(course.id),
        }

        response = await client.post(
            "/api/v1/notes", json=note_data, headers=auth_headers
        )

        assert response.status_code == 201
        data = response.json()
        assert data["title"] == note_data["title"]
        assert data["content"] == note_data["content"]
        assert data["course_id"] == str(course.id)
        assert data["user_id"] == str(test_user.id)
        assert "id" in data

    async def test_create_note_nonexistent_course(
        self, client: AsyncClient, auth_headers: dict
    ):
        """Test creating a note for non-existent course."""
        note_data = {
            "title": "My Note",
            "content": "This is my note content",
            "course_id": "00000000-0000-0000-0000-000000000000",
        }

        response = await client.post(
            "/api/v1/notes", json=note_data, headers=auth_headers
        )

        assert response.status_code == 404
        assert "Course not found" in response.json()["detail"]

    async def test_get_my_notes(
        self, client: AsyncClient, auth_headers: dict, db_session, test_user: User
    ):
        """Test getting user's notes."""
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

        # Create notes
        note1 = Note(
            title="Note 1",
            content="Content 1",
            user_id=test_user.id,
            course_id=course.id,
        )
        note2 = Note(
            title="Note 2",
            content="Content 2",
            user_id=test_user.id,
            course_id=course.id,
        )
        db_session.add_all([note1, note2])
        await db_session.commit()

        # Get notes
        response = await client.get("/api/v1/notes", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        assert data[0]["title"] in ["Note 1", "Note 2"]
        assert data[1]["title"] in ["Note 1", "Note 2"]

    async def test_get_notes_with_search(
        self, client: AsyncClient, auth_headers: dict, db_session, test_user: User
    ):
        """Test getting notes with search functionality."""
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

        # Create notes
        note1 = Note(
            title="Python Programming",
            content="Notes about Python",
            user_id=test_user.id,
            course_id=course.id,
        )
        note2 = Note(
            title="JavaScript Basics",
            content="Notes about JavaScript",
            user_id=test_user.id,
            course_id=course.id,
        )
        db_session.add_all([note1, note2])
        await db_session.commit()

        # Search for Python notes
        response = await client.get("/api/v1/notes?search=Python", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["title"] == "Python Programming"

    async def test_get_specific_note(
        self, client: AsyncClient, auth_headers: dict, db_session, test_user: User
    ):
        """Test getting a specific note."""
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

        # Create a note
        note = Note(
            title="My Note",
            content="My note content",
            user_id=test_user.id,
            course_id=course.id,
        )
        db_session.add(note)
        await db_session.commit()
        await db_session.refresh(note)

        # Get the note
        response = await client.get(f"/api/v1/notes/{note.id}", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == str(note.id)
        assert data["title"] == note.title
        assert data["content"] == note.content

    async def test_get_nonexistent_note(self, client: AsyncClient, auth_headers: dict):
        """Test getting a non-existent note."""
        response = await client.get(
            "/api/v1/notes/00000000-0000-0000-0000-000000000000", headers=auth_headers
        )

        assert response.status_code == 404
        assert "Note not found" in response.json()["detail"]

    async def test_update_note(
        self, client: AsyncClient, auth_headers: dict, db_session, test_user: User
    ):
        """Test updating a note."""
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

        # Create a note
        note = Note(
            title="Original Title",
            content="Original content",
            user_id=test_user.id,
            course_id=course.id,
        )
        db_session.add(note)
        await db_session.commit()
        await db_session.refresh(note)

        # Update the note
        update_data = {"title": "Updated Title", "content": "Updated content"}

        response = await client.put(
            f"/api/v1/notes/{note.id}", json=update_data, headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["title"] == update_data["title"]
        assert data["content"] == update_data["content"]

    async def test_delete_note(
        self, client: AsyncClient, auth_headers: dict, db_session, test_user: User
    ):
        """Test deleting a note."""
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

        # Create a note
        note = Note(
            title="Note to Delete",
            content="This note will be deleted",
            user_id=test_user.id,
            course_id=course.id,
        )
        db_session.add(note)
        await db_session.commit()
        await db_session.refresh(note)

        # Delete the note
        response = await client.delete(f"/api/v1/notes/{note.id}", headers=auth_headers)

        assert response.status_code == 204

        # Verify note is deleted
        get_response = await client.get(
            f"/api/v1/notes/{note.id}", headers=auth_headers
        )
        assert get_response.status_code == 404

    async def test_get_course_notes(
        self, client: AsyncClient, auth_headers: dict, db_session, test_user: User
    ):
        """Test getting notes for a specific course."""
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

        # Create notes for both courses
        note1 = Note(
            title="Note for Course 1",
            content="Content 1",
            user_id=test_user.id,
            course_id=course1.id,
        )
        note2 = Note(
            title="Note for Course 2",
            content="Content 2",
            user_id=test_user.id,
            course_id=course2.id,
        )
        db_session.add_all([note1, note2])
        await db_session.commit()

        # Get notes for course 1
        response = await client.get(
            f"/api/v1/notes/course/{course1.id}", headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["title"] == "Note for Course 1"
        assert data[0]["course_id"] == str(course1.id)
