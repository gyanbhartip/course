"""
Video processing tasks using Celery and FFmpeg.
"""

import os
import uuid
import tempfile
import asyncio
from typing import Dict, Any
from celery import Task
from celery.exceptions import Retry
import ffmpeg
import httpx
from app.tasks.celery_app import celery_app
from app.services.storage import StorageService
from app.core.config import settings
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import AsyncSessionLocal
from app.db.models.content import CourseContent
from sqlalchemy import select, update


class CallbackTask(Task):
    """Base task class with database session management."""

    def on_success(self, retval, task_id, args, kwargs):
        """Called on task success."""
        pass

    def on_failure(self, exc, task_id, args, kwargs, einfo):
        """Called on task failure."""
        pass


@celery_app.task(bind=True, base=CallbackTask, max_retries=3)
def process_video_task(self, video_url: str, course_id: str, content_id: str = None):
    """
    Process uploaded video - generate multiple qualities and thumbnails.

    Args:
        video_url: URL of the uploaded video
        course_id: Course UUID
        content_id: Content UUID (optional)
    """
    try:
        # Create temporary directory for processing
        with tempfile.TemporaryDirectory() as temp_dir:
            # Download original video
            input_path = os.path.join(temp_dir, f"{uuid.uuid4()}.mp4")
            download_video(video_url, input_path)

            # Get video metadata
            metadata = get_video_metadata(input_path)

            # Generate multiple qualities
            qualities = [
                {"name": "1080p", "height": 1080, "bitrate": "5000k"},
                {"name": "720p", "height": 720, "bitrate": "2500k"},
                {"name": "480p", "height": 480, "bitrate": "1000k"},
                {"name": "360p", "height": 360, "bitrate": "500k"},
            ]

            output_urls = {}
            storage_service = StorageService()

            for quality in qualities:
                output_path = os.path.join(
                    temp_dir, f"{uuid.uuid4()}_{quality['name']}.mp4"
                )

                # Transcode with FFmpeg
                transcode_video(input_path, output_path, quality)

                # Upload transcoded video
                with open(output_path, "rb") as f:
                    url = asyncio.run(
                        upload_transcoded_video(
                            storage_service, f, course_id, quality["name"]
                        )
                    )
                    output_urls[quality["name"]] = url

                # Clean up local file
                os.remove(output_path)

            # Generate thumbnail
            thumbnail_path = os.path.join(temp_dir, f"{uuid.uuid4()}_thumb.jpg")
            generate_thumbnail(input_path, thumbnail_path)

            # Upload thumbnail
            with open(thumbnail_path, "rb") as f:
                thumbnail_url = asyncio.run(
                    upload_thumbnail(storage_service, f, course_id)
                )

            # Update database with processed URLs
            asyncio.run(
                update_content_metadata(
                    content_id, output_urls, thumbnail_url, metadata
                )
            )

            return {
                "status": "success",
                "urls": output_urls,
                "thumbnail_url": thumbnail_url,
                "metadata": metadata,
            }

    except Exception as e:
        # Retry on failure
        raise self.retry(exc=e, countdown=60, max_retries=3)


def download_video(url: str, output_path: str) -> None:
    """Download video from URL to local path."""
    try:
        with httpx.stream("GET", url, timeout=300) as response:
            response.raise_for_status()
            with open(output_path, "wb") as f:
                for chunk in response.iter_bytes(chunk_size=8192):
                    f.write(chunk)
    except Exception as e:
        raise Exception(f"Failed to download video: {str(e)}")


def get_video_metadata(video_path: str) -> Dict[str, Any]:
    """Extract video metadata using FFmpeg."""
    try:
        probe = ffmpeg.probe(video_path)
        video_stream = next(
            (stream for stream in probe["streams"] if stream["codec_type"] == "video"),
            None,
        )

        if not video_stream:
            raise Exception("No video stream found")

        return {
            "duration": float(video_stream.get("duration", 0)),
            "width": int(video_stream.get("width", 0)),
            "height": int(video_stream.get("height", 0)),
            "fps": eval(video_stream.get("r_frame_rate", "0/1")),
            "codec": video_stream.get("codec_name", "unknown"),
            "bitrate": int(video_stream.get("bit_rate", 0)),
        }
    except Exception as e:
        raise Exception(f"Failed to extract video metadata: {str(e)}")


def transcode_video(input_path: str, output_path: str, quality: Dict[str, Any]) -> None:
    """Transcode video to specific quality."""
    try:
        (
            ffmpeg.input(input_path)
            .output(
                output_path,
                vf=f"scale=-2:{quality['height']}",
                video_bitrate=quality["bitrate"],
                acodec="aac",
                audio_bitrate="128k",
                preset="medium",
                crf=23,
            )
            .overwrite_output()
            .run(quiet=True)
        )
    except ffmpeg.Error as e:
        raise Exception(f"FFmpeg transcoding failed: {e.stderr.decode()}")


def generate_thumbnail(video_path: str, thumbnail_path: str) -> None:
    """Generate thumbnail from video."""
    try:
        (
            ffmpeg.input(video_path, ss=1)  # Seek to 1 second
            .output(thumbnail_path, vframes=1, format="image2")
            .overwrite_output()
            .run(quiet=True)
        )
    except ffmpeg.Error as e:
        raise Exception(f"Thumbnail generation failed: {e.stderr.decode()}")


async def upload_transcoded_video(
    storage_service: StorageService, file_obj, course_id: str, quality: str
) -> str:
    """Upload transcoded video to storage."""

    # Create a mock UploadFile-like object
    class MockUploadFile:
        def __init__(self, file_obj, filename):
            self.file = file_obj
            self.filename = filename
            self.content_type = "video/mp4"
            self.size = None

    mock_file = MockUploadFile(file_obj, f"{quality}.mp4")
    return await storage_service.upload_file(
        mock_file, f"content/{course_id}/video/{quality}"
    )


async def upload_thumbnail(
    storage_service: StorageService, file_obj, course_id: str
) -> str:
    """Upload thumbnail to storage."""

    class MockUploadFile:
        def __init__(self, file_obj, filename):
            self.file = file_obj
            self.filename = filename
            self.content_type = "image/jpeg"
            self.size = None

    mock_file = MockUploadFile(file_obj, "thumbnail.jpg")
    return await storage_service.upload_file(
        mock_file, f"content/{course_id}/thumbnails"
    )


async def update_content_metadata(
    content_id: str,
    output_urls: Dict[str, str],
    thumbnail_url: str,
    metadata: Dict[str, Any],
) -> None:
    """Update content metadata in database."""
    async with AsyncSessionLocal() as db:
        try:
            # Update content with processed URLs and metadata
            update_query = (
                update(CourseContent)
                .where(CourseContent.id == content_id)
                .values(
                    content_metadata={
                        "processed_urls": output_urls,
                        "thumbnail_url": thumbnail_url,
                        "video_metadata": metadata,
                        "processing_status": "completed",
                    }
                )
            )

            await db.execute(update_query)
            await db.commit()

        except Exception as e:
            await db.rollback()
            raise Exception(f"Failed to update content metadata: {str(e)}")


@celery_app.task(bind=True, base=CallbackTask)
def cleanup_temp_files(self, file_paths: list):
    """Clean up temporary files after processing."""
    for file_path in file_paths:
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
        except Exception as e:
            # Log error but don't fail the task
            print(f"Failed to cleanup {file_path}: {str(e)}")


@celery_app.task(bind=True, base=CallbackTask)
def generate_video_preview(self, video_url: str, course_id: str, duration: int = 10):
    """Generate a short preview video for course thumbnails."""
    try:
        with tempfile.TemporaryDirectory() as temp_dir:
            # Download original video
            input_path = os.path.join(temp_dir, f"{uuid.uuid4()}.mp4")
            download_video(video_url, input_path)

            # Generate preview (first 10 seconds)
            preview_path = os.path.join(temp_dir, f"{uuid.uuid4()}_preview.mp4")

            (
                ffmpeg.input(input_path, t=duration)
                .output(
                    preview_path,
                    vf="scale=640:360",
                    video_bitrate="1000k",
                    acodec="aac",
                    audio_bitrate="64k",
                )
                .overwrite_output()
                .run(quiet=True)
            )

            # Upload preview
            storage_service = StorageService()
            with open(preview_path, "rb") as f:
                preview_url = asyncio.run(
                    upload_transcoded_video(storage_service, f, course_id, "preview")
                )

            return {"status": "success", "preview_url": preview_url}

    except Exception as e:
        raise self.retry(exc=e, countdown=60, max_retries=2)
