"""
File upload endpoints for course content and thumbnails.
"""

from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from app.db.session import get_db
from app.services.storage import StorageService
from app.api.deps import require_admin
from app.db.models.user import User
from app.core.config import settings

router = APIRouter(prefix="/upload", tags=["upload"])


@router.post("/thumbnail")
async def upload_thumbnail(
    file: UploadFile = File(...),
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """
    Upload course thumbnail image.

    Args:
        file: Image file
        current_user: Current admin user
        db: Database session

    Returns:
        dict: Upload result with URL

    Raises:
        HTTPException: If file validation fails
    """
    # Validate image type
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    # Validate file format
    if file.content_type not in settings.ALLOWED_IMAGE_FORMATS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported image format. Allowed: {settings.ALLOWED_IMAGE_FORMATS}",
        )

    # Upload to MinIO
    storage_service = StorageService()
    url = await storage_service.upload_thumbnail(file)

    return {"url": url, "message": "Thumbnail uploaded successfully"}


@router.post("/content")
async def upload_content(
    file: UploadFile = File(...),
    course_id: UUID = Form(...),
    content_type: str = Form(...),
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """
    Upload course content (video or presentation).

    Args:
        file: Content file
        course_id: Course UUID
        content_type: Type of content (video/presentation)
        current_user: Current admin user
        db: Database session

    Returns:
        dict: Upload result with URL and status

    Raises:
        HTTPException: If file validation fails
    """
    # Validate content type
    if content_type not in ["video", "presentation"]:
        raise HTTPException(
            status_code=400, detail="Content type must be 'video' or 'presentation'"
        )

    # Validate file format based on content type
    if content_type == "video":
        if file.content_type not in settings.ALLOWED_VIDEO_FORMATS:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported video format. Allowed: {settings.ALLOWED_VIDEO_FORMATS}",
            )
    elif content_type == "presentation":
        allowed_presentation_formats = [
            "application/vnd.ms-powerpoint",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            "application/pdf",
        ]
        if file.content_type not in allowed_presentation_formats:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported presentation format. Allowed: {allowed_presentation_formats}",
            )

    # Validate file size
    if file.size and file.size > settings.MAX_UPLOAD_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum size: {settings.MAX_UPLOAD_SIZE} bytes",
        )

    # Upload to MinIO
    storage_service = StorageService()
    url = await storage_service.upload_content(file, str(course_id), content_type)

    # Queue video processing if it's a video
    status_message = "complete"
    if content_type == "video":
        from app.tasks.video import process_video_task

        # Start video processing task
        task = process_video_task.delay(url, str(course_id))
        status_message = "processing"

        return {
            "url": url,
            "status": status_message,
            "task_id": task.id,
            "message": f"{content_type.title()} uploaded successfully and processing started",
        }

    return {
        "url": url,
        "status": status_message,
        "message": f"{content_type.title()} uploaded successfully",
    }
