"""
Notes endpoints for user course notes management.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from typing import List, Optional
from uuid import UUID
from app.db.session import get_db
from app.schemas.note import NoteCreate, NoteUpdate, NoteResponse, NoteWithCourse
from app.api.deps import get_current_active_user
from app.db.models.user import User
from app.db.models.note import Note
from app.db.models.course import Course

router = APIRouter(prefix="/notes", tags=["notes"])


@router.post("", response_model=NoteResponse, status_code=status.HTTP_201_CREATED)
async def create_note(
    note_data: NoteCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new note for a course.

    Args:
        note_data: Note creation data
        current_user: Current authenticated user
        db: Database session

    Returns:
        NoteResponse: Created note

    Raises:
        HTTPException: If course not found
    """
    # Verify course exists
    course_result = await db.execute(
        select(Course).where(Course.id == note_data.course_id)
    )
    course = course_result.scalar_one_or_none()

    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Course not found"
        )

    # Create note
    note = Note(**note_data.model_dump(), user_id=current_user.id)

    db.add(note)
    await db.commit()
    await db.refresh(note)

    return note


@router.get("", response_model=List[NoteResponse])
async def get_my_notes(
    course_id: Optional[UUID] = Query(None, description="Filter by course ID"),
    search: Optional[str] = Query(None, description="Search in title and content"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get current user's notes with optional filtering.

    Args:
        course_id: Filter by course ID
        search: Search term for title and content
        current_user: Current authenticated user
        db: Database session

    Returns:
        List[NoteResponse]: List of user's notes
    """
    # Build query
    query = select(Note).where(Note.user_id == current_user.id)

    # Apply filters
    if course_id:
        query = query.where(Note.course_id == course_id)

    if search:
        search_term = f"%{search}%"
        query = query.where(
            or_(Note.title.ilike(search_term), Note.content.ilike(search_term))
        )

    # Execute query
    query = query.order_by(Note.updated_at.desc())
    result = await db.execute(query)
    notes = result.scalars().all()

    return notes


@router.get("/{note_id}", response_model=NoteResponse)
async def get_note(
    note_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get a specific note by ID.

    Args:
        note_id: Note UUID
        current_user: Current authenticated user
        db: Database session

    Returns:
        NoteResponse: Note details

    Raises:
        HTTPException: If note not found or not owned by user
    """
    result = await db.execute(
        select(Note).where(and_(Note.id == note_id, Note.user_id == current_user.id))
    )
    note = result.scalar_one_or_none()

    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Note not found"
        )

    return note


@router.put("/{note_id}", response_model=NoteResponse)
async def update_note(
    note_id: UUID,
    note_data: NoteUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Update a note.

    Args:
        note_id: Note UUID
        note_data: Note update data
        current_user: Current authenticated user
        db: Database session

    Returns:
        NoteResponse: Updated note

    Raises:
        HTTPException: If note not found or not owned by user
    """
    # Get existing note
    result = await db.execute(
        select(Note).where(and_(Note.id == note_id, Note.user_id == current_user.id))
    )
    note = result.scalar_one_or_none()

    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Note not found"
        )

    # Update fields
    update_data = note_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(note, field, value)

    await db.commit()
    await db.refresh(note)

    return note


@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_note(
    note_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Delete a note.

    Args:
        note_id: Note UUID
        current_user: Current authenticated user
        db: Database session

    Raises:
        HTTPException: If note not found or not owned by user
    """
    # Get existing note
    result = await db.execute(
        select(Note).where(and_(Note.id == note_id, Note.user_id == current_user.id))
    )
    note = result.scalar_one_or_none()

    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Note not found"
        )

    # Delete note
    await db.delete(note)
    await db.commit()


@router.get("/course/{course_id}", response_model=List[NoteResponse])
async def get_course_notes(
    course_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get all notes for a specific course.

    Args:
        course_id: Course UUID
        current_user: Current authenticated user
        db: Database session

    Returns:
        List[NoteResponse]: List of notes for the course
    """
    result = await db.execute(
        select(Note)
        .where(and_(Note.user_id == current_user.id, Note.course_id == course_id))
        .order_by(Note.created_at.desc())
    )
    notes = result.scalars().all()

    return notes
