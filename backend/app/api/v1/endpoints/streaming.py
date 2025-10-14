"""
Video streaming endpoints with range request support.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import Optional
from uuid import UUID
import httpx
import asyncio
from app.db.session import get_db
from app.api.deps import get_current_active_user
from app.db.models.user import User
from app.db.models.course import Course
from app.db.models.content import CourseContent
from app.db.models.enrollment import Enrollment
from app.services.storage import StorageService
from app.core.config import settings

router = APIRouter(prefix="/stream", tags=["streaming"])


@router.get("/video/{content_id}")
async def stream_video(
    content_id: UUID,
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Stream video content with range request support.

    Args:
        content_id: Content UUID
        request: FastAPI request object
        current_user: Current authenticated user
        db: Database session

    Returns:
        StreamingResponse: Video stream with range support

    Raises:
        HTTPException: If content not found or user not enrolled
    """
    # Get content and verify enrollment
    content_result = await db.execute(
        select(CourseContent, Course)
        .join(Course, CourseContent.course_id == Course.id)
        .where(CourseContent.id == content_id)
    )
    result = content_result.first()

    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Content not found"
        )

    content, course = result

    # Verify user is enrolled
    enrollment_result = await db.execute(
        select(Enrollment).where(
            and_(
                Enrollment.user_id == current_user.id, Enrollment.course_id == course.id
            )
        )
    )
    enrollment = enrollment_result.scalar_one_or_none()

    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You must be enrolled in this course to access content",
        )

    # Get video URL from content metadata
    if not content.metadata or "processed_urls" not in content.metadata:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Video not processed yet"
        )

    # Get the best quality available (prefer 720p, fallback to others)
    processed_urls = content.metadata["processed_urls"]
    video_url = (
        processed_urls.get("720p")
        or processed_urls.get("1080p")
        or processed_urls.get("480p")
        or processed_urls.get("360p")
        or list(processed_urls.values())[0]
    )

    # Get range header
    range_header = request.headers.get("range")

    if range_header:
        return await stream_with_range(
            video_url, range_header, content.metadata.get("video_metadata", {})
        )
    else:
        return await stream_full_video(
            video_url, content.metadata.get("video_metadata", {})
        )


async def stream_with_range(
    video_url: str, range_header: str, metadata: dict
) -> StreamingResponse:
    """Stream video with range request support."""
    try:
        # Parse range header
        range_match = range_header.replace("bytes=", "").split("-")
        start = int(range_match[0]) if range_match[0] else 0
        end = int(range_match[1]) if range_match[1] else None

        # Get file size from metadata or make HEAD request
        file_size = metadata.get("file_size")
        if not file_size:
            async with httpx.AsyncClient() as client:
                head_response = await client.head(video_url)
                file_size = int(head_response.headers.get("content-length", 0))

        # Adjust end if not specified
        if end is None:
            end = file_size - 1

        # Make range request
        headers = {"Range": f"bytes={start}-{end}"}

        async with httpx.AsyncClient() as client:
            response = await client.get(video_url, headers=headers)
            response.raise_for_status()

            # Create streaming response
            def generate():
                for chunk in response.iter_bytes(chunk_size=8192):
                    yield chunk

            return StreamingResponse(
                generate(),
                status_code=206,  # Partial Content
                headers={
                    "Content-Range": f"bytes {start}-{end}/{file_size}",
                    "Accept-Ranges": "bytes",
                    "Content-Length": str(end - start + 1),
                    "Content-Type": "video/mp4",
                    "Cache-Control": "public, max-age=31536000",  # 1 year cache
                },
            )

    except httpx.HTTPError as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to stream video: {str(e)}",
        )


async def stream_full_video(video_url: str, metadata: dict) -> StreamingResponse:
    """Stream full video without range requests."""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(video_url)
            response.raise_for_status()

            # Create streaming response
            def generate():
                for chunk in response.iter_bytes(chunk_size=8192):
                    yield chunk

            return StreamingResponse(
                generate(),
                headers={
                    "Content-Type": "video/mp4",
                    "Cache-Control": "public, max-age=31536000",
                },
            )

    except httpx.HTTPError as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to stream video: {str(e)}",
        )


@router.get("/video/{content_id}/thumbnail")
async def get_video_thumbnail(
    content_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get video thumbnail.

    Args:
        content_id: Content UUID
        current_user: Current authenticated user
        db: Database session

    Returns:
        StreamingResponse: Thumbnail image

    Raises:
        HTTPException: If content not found or user not enrolled
    """
    # Get content and verify enrollment
    content_result = await db.execute(
        select(CourseContent, Course)
        .join(Course, CourseContent.course_id == Course.id)
        .where(CourseContent.id == content_id)
    )
    result = content_result.first()

    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Content not found"
        )

    content, course = result

    # Verify user is enrolled
    enrollment_result = await db.execute(
        select(Enrollment).where(
            and_(
                Enrollment.user_id == current_user.id, Enrollment.course_id == course.id
            )
        )
    )
    enrollment = enrollment_result.scalar_one_or_none()

    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You must be enrolled in this course to access content",
        )

    # Get thumbnail URL
    thumbnail_url = None
    if content.metadata and "thumbnail_url" in content.metadata:
        thumbnail_url = content.metadata["thumbnail_url"]
    elif content.thumbnail_url:
        thumbnail_url = content.thumbnail_url

    if not thumbnail_url:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Thumbnail not available"
        )

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(thumbnail_url)
            response.raise_for_status()

            def generate():
                for chunk in response.iter_bytes(chunk_size=8192):
                    yield chunk

            return StreamingResponse(
                generate(),
                headers={
                    "Content-Type": "image/webp",
                    "Cache-Control": "public, max-age=31536000",
                },
            )

    except httpx.HTTPError as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to load thumbnail: {str(e)}",
        )


@router.get("/video/{content_id}/manifest")
async def get_video_manifest(
    content_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get video manifest with available qualities.

    Args:
        content_id: Content UUID
        current_user: Current authenticated user
        db: Database session

    Returns:
        dict: Video manifest with available qualities

    Raises:
        HTTPException: If content not found or user not enrolled
    """
    # Get content and verify enrollment
    content_result = await db.execute(
        select(CourseContent, Course)
        .join(Course, CourseContent.course_id == Course.id)
        .where(CourseContent.id == content_id)
    )
    result = content_result.first()

    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Content not found"
        )

    content, course = result

    # Verify user is enrolled
    enrollment_result = await db.execute(
        select(Enrollment).where(
            and_(
                Enrollment.user_id == current_user.id, Enrollment.course_id == course.id
            )
        )
    )
    enrollment = enrollment_result.scalar_one_or_none()

    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You must be enrolled in this course to access content",
        )

    # Get processed URLs
    if not content.metadata or "processed_urls" not in content.metadata:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Video not processed yet"
        )

    processed_urls = content.metadata["processed_urls"]
    video_metadata = content.metadata.get("video_metadata", {})

    # Create manifest
    manifest = {
        "content_id": str(content_id),
        "title": content.title,
        "duration": video_metadata.get("duration", 0),
        "qualities": [],
    }

    # Add available qualities
    quality_order = ["1080p", "720p", "480p", "360p"]
    for quality in quality_order:
        if quality in processed_urls:
            manifest["qualities"].append(
                {
                    "name": quality,
                    "url": f"/api/v1/stream/video/{content_id}?quality={quality}",
                    "height": int(quality.replace("p", "")),
                    "bitrate": get_quality_bitrate(quality),
                }
            )

    return manifest


def get_quality_bitrate(quality: str) -> str:
    """Get bitrate for quality level."""
    bitrates = {"1080p": "5000k", "720p": "2500k", "480p": "1000k", "360p": "500k"}
    return bitrates.get(quality, "1000k")


@router.get("/video/{content_id}/preview")
async def get_video_preview(
    content_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get video preview (first 10 seconds).

    Args:
        content_id: Content UUID
        current_user: Current authenticated user
        db: Database session

    Returns:
        StreamingResponse: Video preview stream

    Raises:
        HTTPException: If content not found or user not enrolled
    """
    # Get content and verify enrollment
    content_result = await db.execute(
        select(CourseContent, Course)
        .join(Course, CourseContent.course_id == Course.id)
        .where(CourseContent.id == content_id)
    )
    result = content_result.first()

    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Content not found"
        )

    content, course = result

    # Verify user is enrolled
    enrollment_result = await db.execute(
        select(Enrollment).where(
            and_(
                Enrollment.user_id == current_user.id, Enrollment.course_id == course.id
            )
        )
    )
    enrollment = enrollment_result.scalar_one_or_none()

    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You must be enrolled in this course to access content",
        )

    # Get preview URL from metadata
    preview_url = None
    if content.metadata and "preview_url" in content.metadata:
        preview_url = content.metadata["preview_url"]

    if not preview_url:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Preview not available"
        )

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(preview_url)
            response.raise_for_status()

            def generate():
                for chunk in response.iter_bytes(chunk_size=8192):
                    yield chunk

            return StreamingResponse(
                generate(),
                headers={
                    "Content-Type": "video/mp4",
                    "Cache-Control": "public, max-age=31536000",
                },
            )

    except httpx.HTTPError as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to stream preview: {str(e)}",
        )
