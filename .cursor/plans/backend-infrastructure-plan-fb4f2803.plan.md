<!-- fb4f2803-e31a-4548-81f2-ad4301a46d67 728814e0-0ff3-4c3d-99c9-c7ae73b6c07a -->

# Backend and Infrastructure Plan for Course Management LMS

## Technology Stack - FastAPI (Python)

### Backend Framework: FastAPI

**Rationale:**

-   Existing FastAPI/Django knowledge → immediate productivity
-   Excellent performance (20k+ req/s) comparable to Node.js frameworks
-   Type safety with Pydantic (runtime validation)
-   Best-in-class automatic OpenAPI/Swagger documentation
-   Superior ecosystem for media processing (FFmpeg, Pillow, PyPDF2) - critical for LMS
-   Native async/await support for high concurrency
-   Easy AI/ML integration for future features

### Complete Python Tech Stack

```python
# Core Web Framework
fastapi==0.115.5          # Modern async web framework
uvicorn[standard]==0.32.1 # ASGI server with uvloop for performance
gunicorn==23.0.0          # Production process manager

# Database & ORM
sqlalchemy==2.0.36        # Async ORM
asyncpg==0.29.0           # Fast async PostgreSQL driver
alembic==1.14.0           # Database migrations
psycopg2-binary==2.9.10   # PostgreSQL adapter

# Caching & Background Jobs
redis==5.2.1              # Redis client
celery==5.4.0             # Distributed task queue
flower==2.0.1             # Celery monitoring

# Authentication & Security
python-jose[cryptography]==3.3.0  # JWT tokens
passlib[bcrypt]==1.7.4    # Password hashing
python-multipart==0.0.12  # File upload support

# Storage & Media Processing
boto3==1.35.80            # S3-compatible client (works with R2, MinIO)
ffmpeg-python==0.2.0      # Video processing
Pillow==11.0.0            # Image processing
PyPDF2==3.0.1             # PDF manipulation
python-pptx==1.0.2        # PowerPoint processing

# Validation & Serialization
pydantic==2.10.4          # Data validation
pydantic-settings==2.6.1  # Settings management
email-validator==2.2.0    # Email validation

# Utilities
python-dotenv==1.0.1      # Environment variables
httpx==0.28.1             # Async HTTP client
aiofiles==24.1.0          # Async file operations

# Monitoring & Logging
sentry-sdk[fastapi]==2.19.2  # Error tracking
python-json-logger==3.2.1     # Structured logging

# Development
pytest==8.3.4             # Testing framework
pytest-asyncio==0.24.0    # Async test support
black==24.10.0            # Code formatter
ruff==0.8.5               # Fast linter
```

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                CloudFlare CDN + R2 Storage                   │
│         (Static Assets, Videos + DDoS Protection)            │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────┴────────────────────────────────────┐
│              Load Balancer (nginx/Traefik)                   │
│          (AWS ALB, VPS nginx, or DigitalOcean)              │
└────────────────────────┬────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
    ┌───▼───────┐   ┌───▼───────┐   ┌───▼───────┐
    │ FastAPI-1 │   │ FastAPI-2 │...│ FastAPI-N │
    │ (Uvicorn) │   │ (Uvicorn) │   │ (Uvicorn) │
    └───┬───────┘   └───┬───────┘   └───┬───────┘
        │                │                │
        └────────────────┼────────────────┘
                         │
        ┌────────────────┼────────────────────┐
        │                │                    │
    ┌───▼────┐     ┌────▼──────┐    ┌────▼──────┐
    │Postgres│     │   Redis   │    │Cloudflare │
    │Primary │     │   Cache   │    │    R2     │
    │        │     │+ Celery   │    │  Storage  │
    └────┬───┘     │  Broker   │    └───────────┘
         │         └───────────┘
    ┌────▼────┐    ┌───────────┐
    │Postgres │    │  Celery   │
    │ Replica │    │  Workers  │
    └─────────┘    │ (Video)   │
                   └───────────┘
```

## Database Design - PostgreSQL

### Why PostgreSQL:

1. ACID compliance for transactional data
2. Complex relational queries (enrollments, progress tracking)
3. JSONB support for flexible metadata
4. Excellent performance with proper indexing
5. Mature ecosystem and tooling

### SQLAlchemy Models

```python
# app/db/models/user.py
from sqlalchemy import Column, String, DateTime, Enum
from sqlalchemy.dialects.postgresql import UUID
from app.db.base import Base
import uuid
from datetime import datetime
import enum

class UserRole(str, enum.Enum):
    USER = "user"
    ADMIN = "admin"

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.USER)
    profile_picture_url = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# app/db/models/course.py
from sqlalchemy import Column, String, Text, Integer, DateTime, Enum, ForeignKey
from sqlalchemy.orm import relationship

class DifficultyLevel(str, enum.Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"

class CourseStatus(str, enum.Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"

class Course(Base):
    __tablename__ = "courses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(500), nullable=False)
    description = Column(Text)
    instructor = Column(String(255), nullable=False)
    thumbnail_url = Column(String(500))
    duration = Column(Integer)  # Total minutes
    difficulty = Column(Enum(DifficultyLevel), nullable=False)
    category = Column(String(100), index=True)
    status = Column(Enum(CourseStatus), default=CourseStatus.DRAFT, index=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    contents = relationship("CourseContent", back_populates="course", cascade="all, delete-orphan")
    enrollments = relationship("Enrollment", back_populates="course")

# app/db/models/content.py
class ContentType(str, enum.Enum):
    VIDEO = "video"
    PRESENTATION = "presentation"

class CourseContent(Base):
    __tablename__ = "course_contents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    course_id = Column(UUID(as_uuid=True), ForeignKey("courses.id", ondelete="CASCADE"))
    type = Column(Enum(ContentType), nullable=False)
    title = Column(String(500), nullable=False)
    description = Column(Text)
    file_url = Column(String(1000), nullable=False)
    file_size = Column(BigInteger)  # bytes
    duration = Column(Integer)  # minutes for video
    order_index = Column(Integer, nullable=False)
    metadata = Column(JSONB)  # Flexible JSON field
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    course = relationship("Course", back_populates="contents")

# app/db/models/enrollment.py
class Enrollment(Base):
    __tablename__ = "enrollments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    course_id = Column(UUID(as_uuid=True), ForeignKey("courses.id", ondelete="CASCADE"), index=True)
    enrolled_at = Column(DateTime, default=datetime.utcnow)
    last_accessed_at = Column(DateTime)

    __table_args__ = (UniqueConstraint('user_id', 'course_id', name='unique_user_course'),)

# app/db/models/progress.py
class CourseProgress(Base):
    __tablename__ = "course_progress"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    course_id = Column(UUID(as_uuid=True), ForeignKey("courses.id", ondelete="CASCADE"))
    content_id = Column(UUID(as_uuid=True), ForeignKey("course_contents.id", ondelete="CASCADE"))
    completed = Column(Boolean, default=False)
    progress_percentage = Column(Integer, default=0)
    last_position = Column(Integer)  # seconds for video resume
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint('user_id', 'content_id', name='unique_user_content_progress'),
        Index('idx_user_course_progress', 'user_id', 'course_id'),
    )

# app/db/models/note.py
class Note(Base):
    __tablename__ = "notes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    course_id = Column(UUID(as_uuid=True), ForeignKey("courses.id", ondelete="CASCADE"), index=True)
    content_id = Column(UUID(as_uuid=True), ForeignKey("course_contents.id", ondelete="SET NULL"))
    title = Column(String(500), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
```

## API Architecture with FastAPI

### API Endpoints

```python
# app/api/v1/endpoints/auth.py
from fastapi import APIRouter, Depends, HTTPException, status
from app.schemas.user import UserCreate, UserLogin, Token, UserResponse
from app.services.auth import AuthService

router = APIRouter(prefix="/auth", tags=["authentication"])

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, auth_service: AuthService = Depends()):
    """Register a new user account"""
    return await auth_service.register(user_data)

@router.post("/login", response_model=Token)
async def login(credentials: UserLogin, auth_service: AuthService = Depends()):
    """Login and get access token"""
    return await auth_service.login(credentials.email, credentials.password)

@router.post("/refresh", response_model=Token)
async def refresh_token(refresh_token: str, auth_service: AuthService = Depends()):
    """Refresh access token using refresh token"""
    return await auth_service.refresh_access_token(refresh_token)

@router.get("/me", response_model=UserResponse)
async def get_current_user(current_user = Depends(get_current_active_user)):
    """Get current logged-in user details"""
    return current_user

# app/api/v1/endpoints/courses.py
from typing import List
from fastapi import APIRouter, Depends, Query
from app.schemas.course import CourseCreate, CourseUpdate, CourseResponse
from app.services.course import CourseService

router = APIRouter(prefix="/courses", tags=["courses"])

@router.get("", response_model=List[CourseResponse])
async def list_courses(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    difficulty: Optional[str] = None,
    category: Optional[str] = None,
    course_service: CourseService = Depends()
):
    """List all published courses with pagination and filters"""
    return await course_service.get_courses(
        skip=skip,
        limit=limit,
        difficulty=difficulty,
        category=category
    )

@router.get("/{course_id}", response_model=CourseResponse)
async def get_course(
    course_id: UUID,
    course_service: CourseService = Depends()
):
    """Get course details by ID"""
    course = await course_service.get_course_by_id(course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return course

@router.post("", response_model=CourseResponse, status_code=status.HTTP_201_CREATED)
async def create_course(
    course_data: CourseCreate,
    current_user = Depends(require_admin),
    course_service: CourseService = Depends()
):
    """Admin: Create a new course"""
    return await course_service.create_course(course_data, current_user.id)

@router.put("/{course_id}", response_model=CourseResponse)
async def update_course(
    course_id: UUID,
    course_data: CourseUpdate,
    current_user = Depends(require_admin),
    course_service: CourseService = Depends()
):
    """Admin: Update course details"""
    return await course_service.update_course(course_id, course_data)

@router.delete("/{course_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_course(
    course_id: UUID,
    current_user = Depends(require_admin),
    course_service: CourseService = Depends()
):
    """Admin: Delete a course"""
    await course_service.delete_course(course_id)

# app/api/v1/endpoints/upload.py
from fastapi import APIRouter, UploadFile, File, Form
from app.services.storage import StorageService
from app.tasks.video import process_video_task

router = APIRouter(prefix="/upload", tags=["upload"])

@router.post("/thumbnail")
async def upload_thumbnail(
    file: UploadFile = File(...),
    current_user = Depends(require_admin),
    storage_service: StorageService = Depends()
):
    """Upload course thumbnail image"""
    # Validate image type
    if not file.content_type.startswith("image/"):
        raise HTTPException(400, "File must be an image")

    # Upload to S3/R2
    url = await storage_service.upload_thumbnail(file)
    return {"url": url}

@router.post("/content")
async def upload_content(
    file: UploadFile = File(...),
    course_id: UUID = Form(...),
    content_type: str = Form(...),
    current_user = Depends(require_admin),
    storage_service: StorageService = Depends()
):
    """Upload course content (video or presentation)"""
    # Validate file size (2GB max for videos)
    max_size = 2 * 1024 * 1024 * 1024  # 2GB

    # Upload to S3/R2
    url = await storage_service.upload_content(file, course_id, content_type)

    # Queue video processing if it's a video
    if content_type == "video":
        process_video_task.delay(url, str(course_id))

    return {"url": url, "status": "processing" if content_type == "video" else "complete"}
```

## Caching Strategy with Redis

```python
# app/core/cache.py
from redis import asyncio as aioredis
from app.core.config import settings
import json
from typing import Optional, Any
from functools import wraps

class CacheService:
    def __init__(self):
        self.redis = aioredis.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True
        )

    async def get(self, key: str) -> Optional[Any]:
        """Get cached value"""
        value = await self.redis.get(key)
        return json.loads(value) if value else None

    async def set(self, key: str, value: Any, ttl: int = 3600):
        """Set cache with TTL (default 1 hour)"""
        await self.redis.setex(key, ttl, json.dumps(value))

    async def delete(self, key: str):
        """Delete cache key"""
        await self.redis.delete(key)

    async def delete_pattern(self, pattern: str):
        """Delete all keys matching pattern"""
        keys = await self.redis.keys(pattern)
        if keys:
            await self.redis.delete(*keys)

    async def increment(self, key: str, ttl: int = 60) -> int:
        """Increment counter (for rate limiting)"""
        pipe = self.redis.pipeline()
        pipe.incr(key)
        pipe.expire(key, ttl)
        results = await pipe.execute()
        return results[0]

# Cache decorator
def cached(ttl: int = 3600, key_prefix: str = ""):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            cache = CacheService()
            cache_key = f"{key_prefix}:{func.__name__}:{str(args)}:{str(kwargs)}"

            # Try to get from cache
            cached_value = await cache.get(cache_key)
            if cached_value:
                return cached_value

            # Execute function and cache result
            result = await func(*args, **kwargs)
            await cache.set(cache_key, result, ttl)
            return result
        return wrapper
    return decorator

# Usage in service
class CourseService:
    @cached(ttl=600, key_prefix="courses")
    async def get_published_courses(self):
        """Get all published courses (cached for 10 minutes)"""
        return await self.db.query(Course).filter(Course.status == "published").all()

# Rate limiting middleware
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        cache = CacheService()
        user_id = request.state.user.id if hasattr(request.state, "user") else request.client.host
        key = f"rate:{user_id}:{request.url.path}"

        count = await cache.increment(key, ttl=60)
        if count > 100:  # 100 requests per minute
            raise HTTPException(status_code=429, detail="Rate limit exceeded")

        response = await call_next(request)
        response.headers["X-Rate-Limit-Remaining"] = str(100 - count)
        return response
```

## Authentication & Security

```python
# app/core/security.py
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash"""
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: timedelta = None) -> str:
    """Create JWT access token (15 minutes)"""
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm="HS256")

def create_refresh_token(data: dict) -> str:
    """Create JWT refresh token (7 days)"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=7)
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm="HS256")

def decode_token(token: str) -> dict:
    """Decode and verify JWT token"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

# app/api/deps.py - Dependency injection
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> User:
    """Get current authenticated user"""
    token = credentials.credentials
    payload = decode_token(token)

    if payload.get("type") != "access":
        raise HTTPException(status_code=401, detail="Invalid token type")

    user_id = payload.get("sub")
    user = await db.get(User, user_id)

    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")

    return user

async def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Require admin role"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user
```

## File Storage with S3/R2

```python
# app/services/storage.py
import boto3
from botocore.exceptions import ClientError
from app.core.config import settings
import uuid
from pathlib import Path

class StorageService:
    def __init__(self):
        self.s3_client = boto3.client(
            's3',
            endpoint_url=settings.S3_ENDPOINT,  # For R2/MinIO
            aws_access_key_id=settings.S3_ACCESS_KEY,
            aws_secret_access_key=settings.S3_SECRET_KEY,
            region_name=settings.S3_REGION
        )
        self.bucket = settings.S3_BUCKET

    async def upload_file(
        self,
        file: UploadFile,
        folder: str,
        filename: str = None
    ) -> str:
        """Upload file to S3/R2 and return URL"""
        # Generate unique filename
        ext = Path(file.filename).suffix
        filename = filename or f"{uuid.uuid4()}{ext}"
        key = f"{folder}/{filename}"

        try:
            # Upload file
            self.s3_client.upload_fileobj(
                file.file,
                self.bucket,
                key,
                ExtraArgs={'ContentType': file.content_type}
            )

            # Return CDN URL
            return f"{settings.CDN_URL}/{key}"

        except ClientError as e:
            raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

    async def upload_thumbnail(self, file: UploadFile) -> str:
        """Upload and optimize course thumbnail"""
        from PIL import Image
        import io

        # Read image
        image = Image.open(file.file)

        # Resize and optimize
        image.thumbnail((800, 600))

        # Convert to WebP for better compression
        buffer = io.BytesIO()
        image.save(buffer, format="WEBP", quality=85)
        buffer.seek(0)

        # Upload
        filename = f"{uuid.uuid4()}.webp"
        key = f"thumbnails/{filename}"

        self.s3_client.upload_fileobj(
            buffer,
            self.bucket,
            key,
            ExtraArgs={'ContentType': 'image/webp'}
        )

        return f"{settings.CDN_URL}/{key}"

    async def get_presigned_url(self, key: str, expiration: int = 3600) -> str:
        """Generate presigned URL for private content"""
        try:
            url = self.s3_client.generate_presigned_url(
                'get_object',
                Params={'Bucket': self.bucket, 'Key': key},
                ExpiresIn=expiration
            )
            return url
        except ClientError as e:
            raise HTTPException(status_code=500, detail=str(e))
```

## Video Processing with Celery

```python
# app/tasks/video.py
from celery import Celery
import ffmpeg
from app.core.config import settings
from app.services.storage import StorageService

celery_app = Celery(
    "lms_tasks",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL
)

@celery_app.task(bind=True, max_retries=3)
def process_video_task(self, video_url: str, course_id: str):
    """Process uploaded video - generate multiple qualities"""
    try:
        storage = StorageService()

        # Download original video
        input_path = f"/tmp/{uuid.uuid4()}.mp4"
        # ... download logic ...

        # Generate multiple qualities
        qualities = [
            {"name": "1080p", "height": 1080, "bitrate": "5000k"},
            {"name": "720p", "height": 720, "bitrate": "2500k"},
            {"name": "480p", "height": 480, "bitrate": "1000k"},
        ]

        output_urls = {}

        for quality in qualities:
            output_path = f"/tmp/{uuid.uuid4()}_{quality['name']}.mp4"

            # Transcode with FFmpeg
            (
                ffmpeg
                .input(input_path)
                .output(
                    output_path,
                    vf=f"scale=-2:{quality['height']}",
                    video_bitrate=quality['bitrate'],
                    acodec='aac',
                    audio_bitrate='128k'
                )
                .run(overwrite_output=True)
            )

            # Upload transcoded video
            with open(output_path, 'rb') as f:
                url = storage.upload_file(
                    f,
                    folder=f"videos/{course_id}",
                    filename=f"{quality['name']}.mp4"
                )
                output_urls[quality['name']] = url

        # Generate thumbnail
        thumbnail_path = f"/tmp/{uuid.uuid4()}_thumb.jpg"
        (
            ffmpeg
            .input(input_path, ss=1)
            .output(thumbnail_path, vframes=1)
            .run(overwrite_output=True)
        )

        # Update database with processed URLs
        # ... database update logic ...

        return {"status": "success", "urls": output_urls}

    except Exception as e:
        # Retry on failure
        raise self.retry(exc=e, countdown=60)
```

## Docker Configuration

```dockerfile
# Dockerfile
FROM python:3.12-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Install system dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create non-root user
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8000/health')"

# Run with Gunicorn + Uvicorn workers
CMD ["gunicorn", "app.main:app", \
     "--workers", "4", \
     "--worker-class", "uvicorn.workers.UvicornWorker", \
     "--bind", "0.0.0.0:8000", \
     "--access-logfile", "-", \
     "--error-logfile", "-"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
    api:
        build: .
        ports:
            - '8000:8000'
        environment:
            - DATABASE_URL=postgresql+asyncpg://postgres:password@db:5432/lms
            - REDIS_URL=redis://redis:6379/0
            - S3_ENDPOINT=${S3_ENDPOINT}
            - S3_ACCESS_KEY=${S3_ACCESS_KEY}
            - S3_SECRET_KEY=${S3_SECRET_KEY}
            - SECRET_KEY=${SECRET_KEY}
        depends_on:
            - db
            - redis
        volumes:
            - ./app:/app/app
        command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

    db:
        image: postgres:16-alpine
        environment:
            - POSTGRES_DB=lms
            - POSTGRES_USER=postgres
            - POSTGRES_PASSWORD=password
        volumes:
            - postgres_data:/var/lib/postgresql/data
        ports:
            - '5432:5432'
        healthcheck:
            test: ['CMD-SHELL', 'pg_isready -U postgres']
            interval: 10s
            timeout: 5s
            retries: 5

    redis:
        image: redis:7-alpine
        ports:
            - '6379:6379'
        volumes:
            - redis_data:/data
        command: redis-server --appendonly yes

    celery_worker:
        build: .
        command: celery -A app.tasks.celery_app worker --loglevel=info
        environment:
            - DATABASE_URL=postgresql+asyncpg://postgres:password@db:5432/lms
            - REDIS_URL=redis://redis:6379/0
        depends_on:
            - db
            - redis
        volumes:
            - ./app:/app/app

    celery_beat:
        build: .
        command: celery -A app.tasks.celery_app beat --loglevel=info
        environment:
            - REDIS_URL=redis://redis:6379/0
        depends_on:
            - redis

    flower:
        build: .
        command: celery -A app.tasks.celery_app flower --port=5555
        ports:
            - '5555:5555'
        environment:
            - REDIS_URL=redis://redis:6379/0
        depends_on:
            - redis

volumes:
    postgres_data:
    redis_data:
```

## Project Structure

```
backend/
├── app/
│   ├── api/
│   │   ├── v1/
│   │   │   ├── endpoints/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── auth.py
│   │   │   │   ├── courses.py
│   │   │   │   ├── enrollments.py
│   │   │   │   ├── notes.py
│   │   │   │   ├── progress.py
│   │   │   │   ├── upload.py
│   │   │   │   └── dashboard.py
│   │   │   ├── __init__.py
│   │   │   └── api.py
│   │   ├── deps.py
│   │   └── __init__.py
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py           # Pydantic Settings
│   │   ├── security.py         # JWT, password hashing
│   │   └── cache.py            # Redis utilities
│   ├── db/
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── user.py
│   │   │   ├── course.py
│   │   │   ├── content.py
│   │   │   ├── enrollment.py
│   │   │   ├── progress.py
│   │   │   └── note.py
│   │   ├── __init__.py
│   │   ├── base.py             # SQLAlchemy base
│   │   └── session.py          # Database session management
│   ├── schemas/                # Pydantic schemas
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── course.py
│   │   ├── content.py
│   │   ├── enrollment.py
│   │   ├── note.py
│   │   └── token.py
│   ├── services/
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── course.py
│   │   ├── storage.py          # S3/R2 operations
│   │   ├── video.py            # Video processing
│   │   └── cache.py            # Cache operations
│   ├── tasks/
│   │   ├── __init__.py
│   │   ├── celery_app.py
│   │   └── video.py            # Celery tasks
│   ├── middleware/
│   │   ├── __init__.py
│   │   ├── cors.py
│   │   ├── rate_limit.py
│   │   └── logging.py
│   ├── __init__.py
│   └── main.py                 # FastAPI app initialization
├── alembic/                    # Database migrations
│   ├── versions/
│   ├── env.py
│   └── alembic.ini
├── tests/
│   ├── api/
│   ├── services/
│   ├── conftest.py
│   └── __init__.py
├── scripts/
│   ├── init_db.py
│   └── seed_data.py
├── .env.example
├── .gitignore
├── Dockerfile
├── docker-compose.yml
├── requirements.txt
├── pyproject.toml
└── README.md
```

## Main Application Setup

```python
# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.api import api_router
from app.middleware.logging import LoggingMiddleware
from app.middleware.rate_limit import RateLimitMiddleware
import sentry_sdk

# Initialize Sentry for error tracking
sentry_sdk.init(
    dsn=settings.SENTRY_DSN,
    traces_sample_rate=1.0,
)

app = FastAPI(
    title="Course Management LMS API",
    description="Backend API for Course Management System",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom middleware
app.add_middleware(LoggingMiddleware)
app.add_middleware(RateLimitMiddleware)

# Include API routes
app.include_router(api_router, prefix="/api/v1")

@app.get("/health")
async def health_check():
    """Health check endpoint for load balancers"""
    return {"status": "healthy", "version": "1.0.0"}

@app.on_event("startup")
async def startup_event():
    """Initialize resources on startup"""
    # Initialize database connection pool
    # Initialize Redis connection
    pass

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup resources on shutdown"""
    # Close database connections
    # Close Redis connections
    pass
```

## Configuration Management

```python
# app/core/config.py
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
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

settings = Settings()
```

## Deployment Strategies

### Option 1: AWS (Highly Available)

-   **Compute:** ECS Fargate (serverless containers)
-   **Database:** RDS PostgreSQL Multi-AZ
-   **Cache:** ElastiCache Redis (cluster mode)
-   **Storage:** S3 + CloudFront
-   **Load Balancer:** Application Load Balancer
-   **Cost:** ~$200-400/month for medium scale

### Option 2: DigitalOcean (Managed Platform)

-   **Compute:** App Platform (auto-scaling)
-   **Database:** Managed PostgreSQL
-   **Cache:** Managed Redis
-   **Storage:** Spaces + CDN
-   **Cost:** ~$50-150/month

### Option 3: VPS (Cost-Effective)

-   **VPS:** Hetzner/Linode (4-8 vCPU, 16-32GB RAM)
-   **Orchestration:** Docker Compose or Docker Swarm
-   **Database:** Self-managed PostgreSQL with pg_auto_failover
-   **Storage:** Cloudflare R2 (zero egress fees)
-   **CDN:** Cloudflare (free tier)
-   **Cost:** ~$30-60/month

### Recommended Hybrid Approach

-   **API:** VPS (Hetzner - $40/month for powerful server)
-   **Database:** DigitalOcean Managed PostgreSQL ($15/month)
-   **Cache:** Redis on same VPS
-   **Storage:** Cloudflare R2 ($0.015/GB storage, zero egress)
-   **CDN:** Cloudflare (free)
-   **Total:** ~$60-80/month with excellent performance

## Performance Optimization

1.  **Database Query Optimization**

                        - Eager loading relationships with `selectinload()`
                        - Query result caching with Redis
                        - Database connection pooling
                        - Read replicas for heavy read operations

2.  **API Response Caching**

                        - Redis caching for course lists, user enrollments
                        - Cache invalidation on updates
                        - ETags for conditional requests

3.  **Video Delivery**

                        - HLS/DASH adaptive streaming
                        - Multiple quality levels (480p, 720p, 1080p)
                        - CDN edge caching
                        - Presigned URLs for security

4.  **Background Processing**

                        - Celery for video transcoding
                        - Async file uploads
                        - Email notifications (queued)

## Monitoring & Logging

```python
# Structured logging
import logging
from pythonjsonlogger import jsonlogger

logger = logging.getLogger()
logHandler = logging.StreamHandler()
formatter = jsonlogger.JsonFormatter()
logHandler.setFormatter(formatter)
logger.addHandler(logHandler)
logger.setLevel(logging.INFO)

# Usage
logger.info("User logged in", extra={
    "user_id": user.id,
    "email": user.email,
    "ip_address": request.client.host
})
```

**Monitoring Stack:**

-   **Errors:** Sentry
-   **Metrics:** Prometheus + Grafana (or DataDog)
-   **Logs:** CloudWatch / Loki
-   **APM:** New Relic or Elastic APM
-   **Uptime:** UptimeRobot (free tier)

## Security Checklist

-   ✅ Password hashing with bcrypt (12 rounds)
-   ✅ JWT with short expiration (15 min access, 7 day refresh)
-   ✅ Rate limiting (100 req/min per user)
-   ✅ CORS whitelist
-   ✅ Input validation with Pydantic
-   ✅ SQL injection prevention (SQLAlchemy ORM)
-   ✅ File upload validation (size, type, virus scan)
-   ✅ HTTPS only (enforced by load balancer)
-   ✅ Security headers (via middleware)
-   ✅ Dependency scanning (dependabot)

## Testing Strategy

```python
# tests/conftest.py
import pytest
from httpx import AsyncClient
from app.main import app

@pytest.fixture
async def client():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac

# tests/api/test_auth.py
@pytest.mark.asyncio
async def test_register_user(client):
    response = await client.post("/api/v1/auth/register", json={
        "email": "test@example.com",
        "password": "password123",
        "name": "Test User"
    })
    assert response.status_code == 201
    assert "id" in response.json()
```

## Implementation Timeline

**Phase 1: Core MVP (4-5 weeks)**

1. Database setup with Alembic migrations
2. Authentication system (JWT)
3. Basic CRUD for courses, content, notes
4. File upload to S3/R2
5. Docker setup

**Phase 2: Enhanced Features (3-4 weeks)**

6. Video processing pipeline with Celery
7. Redis caching layer
8. Progress tracking
9. Enrollment system
10. Dashboard endpoints

**Phase 3: Production Ready (2-3 weeks)**

11. Comprehensive error handling
12. Logging and monitoring
13. Load testing and optimization
14. CI/CD pipeline
15. Deployment documentation

**Phase 4: Advanced Features (Future)**

16. Real-time features (WebSockets)
17. Search functionality (Elasticsearch)
18. Analytics and reporting
19. Payment integration

### To-dos

-   [ ] Initialize backend project with FastAPI, SQLAlchemy, Alembic, and project structure
-   [ ] Design and implement PostgreSQL schema using SQLAlchemy ORM with Alembic migrations
-   [ ] Implement JWT-based authentication with registration, login, and refresh token flow
-   [ ] Set up Redis client with aioredis and implement caching layer for courses, sessions, and rate limiting
-   [ ] Configure S3-compatible storage client (Cloudflare R2 or AWS S3) using boto3 for file uploads
-   [ ] Build courses CRUD API with admin permissions and public course listing
-   [ ] Implement file upload endpoints with validation, S3/R2 upload, and content management
-   [ ] Create enrollment system allowing users to subscribe/unsubscribe from courses
-   [ ] Build notes CRUD API with course/content association and search
-   [ ] Implement course progress tracking with completion status and resume functionality
-   [ ] Set up Celery workers for background video processing with FFmpeg transcoding
-   [ ] Set up video streaming endpoint with range requests and CDN integration
-   [ ] Create Dockerfile and docker-compose.yml for local development and deployment
-   [ ] Add structured logging (python-json-logger), error tracking (Sentry), and health check endpoints
-   [ ] Write unit and integration tests using pytest and pytest-asyncio
-   [ ] Create deployment documentation for AWS, VPS, and DigitalOcean options
