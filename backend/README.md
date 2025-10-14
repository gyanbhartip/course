# Course Management LMS Backend

A modern, scalable backend API for a Course Management Learning Management System (LMS) built with FastAPI, PostgreSQL, Redis, and MinIO.

## Features

### Phase 1 (Current)

-   ✅ **Authentication & Authorization**: JWT-based auth with role-based access control
-   ✅ **User Management**: Registration, login, profile management
-   ✅ **Course Management**: CRUD operations for courses with admin permissions
-   ✅ **File Upload**: MinIO integration for thumbnails and course content
-   ✅ **Enrollment System**: Course subscription and management
-   ✅ **Notes System**: User notes for courses with search functionality
-   ✅ **Caching**: Redis integration for performance optimization
-   ✅ **Database**: PostgreSQL with async SQLAlchemy and Alembic migrations

### Phase 2 (Completed)

-   ✅ **Video Processing**: Celery workers with FFmpeg transcoding
-   ✅ **Progress Tracking**: Course progress and analytics
-   ✅ **Video Streaming**: Range requests and CDN integration
-   ✅ **Dashboard & Analytics**: User progress and course statistics
-   ✅ **WebSocket Support**: Real-time notifications and live updates
-   ✅ **Email Notifications**: Course updates and progress reminders
-   ✅ **Advanced Caching**: Tag-based invalidation and performance optimization
-   ✅ **Monitoring & Logging**: Comprehensive observability with Prometheus
-   ✅ **Production Deployment**: Docker Compose, Nginx, CI/CD pipeline
-   ✅ **Search Functionality**: Elasticsearch-powered search for courses and content

## Technology Stack

-   **Framework**: FastAPI (Python 3.12)
-   **Database**: PostgreSQL with SQLAlchemy (async)
-   **Cache**: Redis
-   **Storage**: MinIO (S3-compatible)
-   **Search**: Elasticsearch
-   **Background Tasks**: Celery with Redis
-   **Authentication**: JWT tokens with bcrypt password hashing
-   **Documentation**: Auto-generated OpenAPI/Swagger docs
-   **Containerization**: Docker & Docker Compose

## Quick Start

### Prerequisites

-   Docker and Docker Compose
-   Python 3.12+ (for local development)

### Using Docker Compose (Recommended)

1. **Clone and navigate to the backend directory**:

    ```bash
    cd backend
    ```

2. **Copy environment file**:

    ```bash
    cp env.example .env
    ```

3. **Start all services**:

    ```bash
    docker-compose up -d
    ```

4. **Run database migrations**:

    ```bash
    docker-compose exec api alembic upgrade head
    ```

5. **Access the application**:
    - API: http://localhost:8000
    - API Documentation: http://localhost:8000/api/docs
    - MinIO Console: http://localhost:9001 (minioadmin/minioadmin)
    - Flower (Celery Monitor): http://localhost:5555
    - Elasticsearch: http://localhost:9200

### Local Development

1. **Install dependencies**:

    ```bash
    pip install -r requirements.txt
    ```

2. **Set up environment variables**:

    ```bash
    cp env.example .env
    # Edit .env with your local settings
    ```

3. **Start PostgreSQL, Redis, and MinIO**:

    ```bash
    docker-compose up -d db redis minio
    ```

4. **Run migrations**:

    ```bash
    alembic upgrade head
    ```

5. **Start the development server**:
    ```bash
    uvicorn app.main:app --reload
    ```

## API Documentation

Once the server is running, visit:

-   **Swagger UI**: http://localhost:8000/api/docs
-   **ReDoc**: http://localhost:8000/api/redoc

## Environment Variables

Copy `env.example` to `.env` and configure:

```bash
# Application
APP_NAME=Course LMS
DEBUG=true
SECRET_KEY=your-secret-key-change-in-production

# Database
DATABASE_URL=postgresql+asyncpg://postgres:password@localhost:5432/lms

# Redis
REDIS_URL=redis://localhost:6379/0

# MinIO/S3
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=lms-files
CDN_URL=http://localhost:9000

# CORS
CORS_ORIGINS=["http://localhost:5173", "http://localhost:3000"]
```

## API Endpoints

### Authentication

-   `POST /api/v1/auth/register` - Register new user
-   `POST /api/v1/auth/login` - Login user
-   `POST /api/v1/auth/refresh` - Refresh access token
-   `GET /api/v1/auth/me` - Get current user

### Courses

-   `GET /api/v1/courses` - List published courses (with pagination/filters)
-   `GET /api/v1/courses/{id}` - Get course details
-   `POST /api/v1/courses` - Create course (admin only)
-   `PUT /api/v1/courses/{id}` - Update course (admin only)
-   `DELETE /api/v1/courses/{id}` - Delete course (admin only)
-   `GET /api/v1/courses/my/courses` - Get my created courses

### Enrollments

-   `POST /api/v1/enrollments/{course_id}` - Enroll in course
-   `DELETE /api/v1/enrollments/{course_id}` - Unenroll from course
-   `GET /api/v1/enrollments/my` - Get my enrollments
-   `GET /api/v1/enrollments/{course_id}/check` - Check enrollment status

### Notes

-   `POST /api/v1/notes` - Create note
-   `GET /api/v1/notes` - Get my notes (with search/filter)
-   `GET /api/v1/notes/{id}` - Get specific note
-   `PUT /api/v1/notes/{id}` - Update note
-   `DELETE /api/v1/notes/{id}` - Delete note
-   `GET /api/v1/notes/course/{course_id}` - Get course notes

### File Upload

-   `POST /api/v1/upload/thumbnail` - Upload course thumbnail (admin only)
-   `POST /api/v1/upload/content` - Upload course content (admin only)

### Search

-   `GET /api/v1/search` - Combined search (courses and content)
-   `GET /api/v1/search/courses` - Search courses only
-   `GET /api/v1/search/content` - Search content only
-   `GET /api/v1/search/suggestions` - Get search suggestions
-   `GET /api/v1/search/popular` - Get popular searches
-   `GET /api/v1/search/analytics` - Get search analytics

### Progress Tracking

-   `GET /api/v1/progress/course/{course_id}` - Get course progress
-   `POST /api/v1/progress/content/{content_id}` - Update content progress
-   `GET /api/v1/progress/analytics` - Get progress analytics

### Dashboard & Analytics

-   `GET /api/v1/dashboard/stats` - Get dashboard statistics
-   `GET /api/v1/dashboard/progress` - Get progress analytics
-   `GET /api/v1/dashboard/courses` - Get course performance
-   `GET /api/v1/dashboard/engagement` - Get content engagement

### WebSocket

-   `WS /api/v1/ws` - WebSocket connection for real-time updates

### Monitoring

-   `GET /api/v1/health` - Health check
-   `GET /api/v1/metrics` - Prometheus metrics

## Database Schema

### Core Models

-   **User**: Authentication and profile information
-   **Course**: Course metadata and content organization
-   **CourseContent**: Individual course materials (videos, presentations)
-   **Enrollment**: User course subscriptions
-   **Note**: User-generated course notes
-   **CourseProgress**: Learning progress tracking (Phase 2)

## Development

### Running Tests

```bash
pytest
```

### Code Formatting

```bash
black .
ruff check --fix .
```

### Database Migrations

```bash
# Create new migration
alembic revision --autogenerate -m "Description"

# Apply migrations
alembic upgrade head

# Rollback migration
alembic downgrade -1
```

### Adding New Features

1. Create database models in `app/db/models/`
2. Create Pydantic schemas in `app/schemas/`
3. Implement business logic in `app/services/`
4. Create API endpoints in `app/api/v1/endpoints/`
5. Add tests in `tests/`
6. Update documentation

## Production Deployment

### Docker Production Build

```bash
# Build production image
docker build -t course-lms-backend .

# Run with production settings
docker run -p 8000:8000 --env-file .env course-lms-backend
```

### Environment Setup

-   Use managed PostgreSQL (AWS RDS, DigitalOcean, etc.)
-   Use managed Redis (AWS ElastiCache, DigitalOcean, etc.)
-   Use S3-compatible storage (AWS S3, Cloudflare R2, etc.)
-   Set `DEBUG=false` in production
-   Use strong `SECRET_KEY`
-   Configure proper CORS origins

## Monitoring & Logging

-   **Health Check**: `GET /health`
-   **Error Tracking**: Sentry integration (configure `SENTRY_DSN`)
-   **Structured Logging**: JSON format for production
-   **Metrics**: Ready for Prometheus/Grafana integration

## Security Features

-   ✅ JWT authentication with short-lived access tokens
-   ✅ Password hashing with bcrypt
-   ✅ Role-based access control (User/Admin)
-   ✅ CORS configuration
-   ✅ Input validation with Pydantic
-   ✅ SQL injection prevention (SQLAlchemy ORM)
-   ✅ File upload validation
-   ✅ Rate limiting ready (Redis-based)

## Additional Documentation

-   [Phase 2+ Features](README-PHASE2.md) - Detailed documentation for advanced features
-   [Search Functionality](README-SEARCH.md) - Comprehensive search implementation guide
-   [Production Deployment](README-PRODUCTION.md) - Production deployment guide

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Run linting and tests
6. Submit a pull request

## License

This project is licensed under the MIT License.
