"""
Application configuration settings using Pydantic Settings.
"""

from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Application
    APP_NAME: str = "Course LMS"
    DEBUG: bool = False
    API_V1_PREFIX: str = "/api/v1"

    # Security
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Database
    DATABASE_URL: str
    DB_POOL_SIZE: int = 20
    DB_MAX_OVERFLOW: int = 40

    # Redis
    REDIS_URL: str
    REDIS_MAX_CONNECTIONS: int = 50

    # S3/R2 Storage
    S3_ENDPOINT: str
    S3_ACCESS_KEY: str
    S3_SECRET_KEY: str
    S3_BUCKET: str
    S3_REGION: str = "auto"
    CDN_URL: str

    # Celery
    CELERY_BROKER_URL: str
    CELERY_RESULT_BACKEND: str

    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:5173"]

    # Monitoring
    SENTRY_DSN: str = ""

    # File Upload
    MAX_UPLOAD_SIZE: int = 2 * 1024 * 1024 * 1024  # 2GB
    ALLOWED_VIDEO_FORMATS: List[str] = ["video/mp4", "video/webm"]
    ALLOWED_IMAGE_FORMATS: List[str] = ["image/jpeg", "image/png", "image/webp"]

    class Config:
        env_file = ".env"
        case_sensitive = True


# Global settings instance
settings = Settings()
