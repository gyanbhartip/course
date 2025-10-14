"""
Storage service for file operations with MinIO/S3.
"""

import boto3
from botocore.exceptions import ClientError
from fastapi import HTTPException, UploadFile
from app.core.config import settings
import uuid
from pathlib import Path
from typing import Optional
import io
from PIL import Image


class StorageService:
    """Storage service for file operations with MinIO/S3."""

    def __init__(self):
        """Initialize S3/MinIO client."""
        self.s3_client = boto3.client(
            "s3",
            endpoint_url=settings.S3_ENDPOINT,
            aws_access_key_id=settings.S3_ACCESS_KEY,
            aws_secret_access_key=settings.S3_SECRET_KEY,
            region_name=settings.S3_REGION,
        )
        self.bucket = settings.S3_BUCKET

    async def upload_file(
        self, file: UploadFile, folder: str, filename: Optional[str] = None
    ) -> str:
        """
        Upload file to S3/MinIO and return URL.

        Args:
            file: Uploaded file
            folder: Folder path in bucket
            filename: Custom filename (optional)

        Returns:
            str: Public URL of uploaded file

        Raises:
            HTTPException: If upload fails
        """
        # Generate unique filename
        ext = Path(file.filename).suffix if file.filename else ""
        filename = filename or f"{uuid.uuid4()}{ext}"
        key = f"{folder}/{filename}"

        try:
            # Upload file
            self.s3_client.upload_fileobj(
                file.file,
                self.bucket,
                key,
                ExtraArgs={
                    "ContentType": file.content_type or "application/octet-stream"
                },
            )

            # Return CDN URL
            return f"{settings.CDN_URL}/{key}"

        except ClientError as e:
            raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

    async def upload_thumbnail(self, file: UploadFile) -> str:
        """
        Upload and optimize course thumbnail.

        Args:
            file: Image file

        Returns:
            str: URL of optimized thumbnail

        Raises:
            HTTPException: If upload fails
        """
        try:
            # Read and process image
            image = Image.open(file.file)

            # Convert to RGB if necessary
            if image.mode in ("RGBA", "P"):
                image = image.convert("RGB")

            # Resize and optimize
            image.thumbnail((800, 600), Image.Resampling.LANCZOS)

            # Convert to WebP for better compression
            buffer = io.BytesIO()
            image.save(buffer, format="WEBP", quality=85, optimize=True)
            buffer.seek(0)

            # Upload optimized image
            filename = f"{uuid.uuid4()}.webp"
            key = f"thumbnails/{filename}"

            self.s3_client.upload_fileobj(
                buffer, self.bucket, key, ExtraArgs={"ContentType": "image/webp"}
            )

            return f"{settings.CDN_URL}/{key}"

        except Exception as e:
            raise HTTPException(
                status_code=500, detail=f"Thumbnail upload failed: {str(e)}"
            )

    async def upload_content(
        self, file: UploadFile, course_id: str, content_type: str
    ) -> str:
        """
        Upload course content (video or presentation).

        Args:
            file: Content file
            course_id: Course UUID
            content_type: Type of content (video/presentation)

        Returns:
            str: URL of uploaded content

        Raises:
            HTTPException: If upload fails
        """
        # Validate file size
        if file.size and file.size > settings.MAX_UPLOAD_SIZE:
            raise HTTPException(
                status_code=413,
                detail=f"File too large. Maximum size: {settings.MAX_UPLOAD_SIZE} bytes",
            )

        # Generate filename
        ext = Path(file.filename).suffix if file.filename else ""
        filename = f"{uuid.uuid4()}{ext}"
        key = f"content/{course_id}/{content_type}/{filename}"

        try:
            # Upload file
            self.s3_client.upload_fileobj(
                file.file,
                self.bucket,
                key,
                ExtraArgs={
                    "ContentType": file.content_type or "application/octet-stream"
                },
            )

            return f"{settings.CDN_URL}/{key}"

        except ClientError as e:
            raise HTTPException(
                status_code=500, detail=f"Content upload failed: {str(e)}"
            )

    async def get_presigned_url(self, key: str, expiration: int = 3600) -> str:
        """
        Generate presigned URL for private content.

        Args:
            key: S3 object key
            expiration: URL expiration time in seconds

        Returns:
            str: Presigned URL

        Raises:
            HTTPException: If URL generation fails
        """
        try:
            url = self.s3_client.generate_presigned_url(
                "get_object",
                Params={"Bucket": self.bucket, "Key": key},
                ExpiresIn=expiration,
            )
            return url
        except ClientError as e:
            raise HTTPException(
                status_code=500, detail=f"Failed to generate presigned URL: {str(e)}"
            )

    async def delete_file(self, key: str) -> None:
        """
        Delete file from storage.

        Args:
            key: S3 object key

        Raises:
            HTTPException: If deletion fails
        """
        try:
            self.s3_client.delete_object(Bucket=self.bucket, Key=key)
        except ClientError as e:
            raise HTTPException(
                status_code=500, detail=f"Failed to delete file: {str(e)}"
            )
