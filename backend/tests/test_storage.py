"""
Tests for storage service.
"""

import pytest
from unittest.mock import Mock, patch, AsyncMock
from fastapi import UploadFile
from app.services.storage import StorageService
from app.core.config import settings


class TestStorageService:
    """Test storage service."""

    @pytest.fixture
    def mock_s3_client(self):
        """Mock S3 client."""
        with patch("app.services.storage.boto3.client") as mock_client:
            mock_s3 = Mock()
            mock_client.return_value = mock_s3
            yield mock_s3

    @pytest.fixture
    def storage_service(self, mock_s3_client):
        """Create storage service with mocked S3 client."""
        return StorageService()

    @pytest.fixture
    def mock_upload_file(self):
        """Mock upload file."""
        file = Mock(spec=UploadFile)
        file.filename = "test.jpg"
        file.content_type = "image/jpeg"
        file.size = 1024
        file.file = Mock()
        return file

    def test_upload_file_success(
        self, storage_service, mock_s3_client, mock_upload_file
    ):
        """Test successful file upload."""
        # Mock successful upload
        mock_s3_client.upload_fileobj.return_value = None

        # Test upload
        result = storage_service.upload_file(mock_upload_file, "test_folder")

        # Verify S3 upload was called
        mock_s3_client.upload_fileobj.assert_called_once()
        call_args = mock_s3_client.upload_fileobj.call_args

        assert call_args[0][0] == mock_upload_file.file  # file object
        assert call_args[0][1] == settings.S3_BUCKET  # bucket
        assert call_args[0][2].startswith("test_folder/")  # key
        assert call_args[1]["ExtraArgs"]["ContentType"] == "image/jpeg"

        # Verify return URL
        assert result.startswith(settings.CDN_URL)
        assert "test_folder/" in result

    def test_upload_file_with_custom_filename(
        self, storage_service, mock_s3_client, mock_upload_file
    ):
        """Test file upload with custom filename."""
        mock_s3_client.upload_fileobj.return_value = None

        result = storage_service.upload_file(
            mock_upload_file, "test_folder", filename="custom_name.jpg"
        )

        call_args = mock_s3_client.upload_fileobj.call_args
        assert call_args[0][2] == "test_folder/custom_name.jpg"
        assert result.endswith("test_folder/custom_name.jpg")

    def test_upload_file_s3_error(
        self, storage_service, mock_s3_client, mock_upload_file
    ):
        """Test file upload with S3 error."""
        from botocore.exceptions import ClientError

        # Mock S3 error
        mock_s3_client.upload_fileobj.side_effect = ClientError(
            {"Error": {"Code": "NoSuchBucket", "Message": "Bucket not found"}},
            "PutObject",
        )

        with pytest.raises(Exception) as exc_info:
            storage_service.upload_file(mock_upload_file, "test_folder")

        assert "Upload failed" in str(exc_info.value)

    @patch("app.services.storage.Image")
    def test_upload_thumbnail_success(
        self, mock_image, storage_service, mock_s3_client, mock_upload_file
    ):
        """Test successful thumbnail upload."""
        # Mock PIL Image operations
        mock_img_instance = Mock()
        mock_image.open.return_value = mock_img_instance
        mock_img_instance.mode = "RGB"
        mock_img_instance.thumbnail.return_value = None
        mock_img_instance.save.return_value = None

        # Mock successful S3 upload
        mock_s3_client.upload_fileobj.return_value = None

        result = storage_service.upload_thumbnail(mock_upload_file)

        # Verify image processing
        mock_image.open.assert_called_once_with(mock_upload_file.file)
        mock_img_instance.thumbnail.assert_called_once_with((800, 600))
        mock_img_instance.save.assert_called_once()

        # Verify S3 upload
        mock_s3_client.upload_fileobj.assert_called_once()
        call_args = mock_s3_client.upload_fileobj.call_args
        assert call_args[0][2].startswith("thumbnails/")
        assert call_args[0][2].endswith(".webp")
        assert call_args[1]["ExtraArgs"]["ContentType"] == "image/webp"

        # Verify return URL
        assert result.startswith(settings.CDN_URL)
        assert "thumbnails/" in result
        assert result.endswith(".webp")

    def test_upload_content_success(
        self, storage_service, mock_s3_client, mock_upload_file
    ):
        """Test successful content upload."""
        mock_s3_client.upload_fileobj.return_value = None

        result = storage_service.upload_content(mock_upload_file, "course123", "video")

        call_args = mock_s3_client.upload_fileobj.call_args
        assert call_args[0][2].startswith("content/course123/video/")
        assert result.startswith(settings.CDN_URL)

    def test_upload_content_file_too_large(self, storage_service, mock_upload_file):
        """Test content upload with file too large."""
        # Set file size larger than max
        mock_upload_file.size = settings.MAX_UPLOAD_SIZE + 1

        with pytest.raises(Exception) as exc_info:
            storage_service.upload_content(mock_upload_file, "course123", "video")

        assert "File too large" in str(exc_info.value)

    def test_get_presigned_url_success(self, storage_service, mock_s3_client):
        """Test successful presigned URL generation."""
        expected_url = "https://example.com/presigned-url"
        mock_s3_client.generate_presigned_url.return_value = expected_url

        result = storage_service.get_presigned_url("test/key")

        mock_s3_client.generate_presigned_url.assert_called_once_with(
            "get_object",
            Params={"Bucket": settings.S3_BUCKET, "Key": "test/key"},
            ExpiresIn=3600,
        )
        assert result == expected_url

    def test_delete_file_success(self, storage_service, mock_s3_client):
        """Test successful file deletion."""
        mock_s3_client.delete_object.return_value = None

        storage_service.delete_file("test/key")

        mock_s3_client.delete_object.assert_called_once_with(
            Bucket=settings.S3_BUCKET, Key="test/key"
        )
