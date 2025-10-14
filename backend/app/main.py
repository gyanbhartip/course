"""
FastAPI application main module.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.api import api_router
from app.core.monitoring import LoggingMiddleware, MetricsMiddleware
import sentry_sdk

# Initialize Sentry for error tracking (if DSN provided)
if settings.SENTRY_DSN:
    sentry_sdk.init(
        dsn=settings.SENTRY_DSN,
        traces_sample_rate=1.0,
    )

# Create FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    description="Backend API for Course Management System",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

# Add monitoring middleware
app.add_middleware(LoggingMiddleware)
app.add_middleware(MetricsMiddleware)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router, prefix=settings.API_V1_PREFIX)


@app.get("/health")
async def health_check():
    """
    Health check endpoint for load balancers and monitoring.

    Returns:
        dict: Health status information
    """
    return {"status": "healthy", "version": "1.0.0", "app_name": settings.APP_NAME}


@app.get("/")
async def root():
    """
    Root endpoint with API information.

    Returns:
        dict: API information
    """
    return {
        "message": f"Welcome to {settings.APP_NAME} API",
        "version": "1.0.0",
        "docs": "/api/docs",
        "health": "/health",
    }


@app.on_event("startup")
async def startup_event():
    """
    Initialize resources on application startup.
    """
    # Initialize database connection pool
    # Initialize Redis connection
    # Any other startup tasks
    pass


@app.on_event("shutdown")
async def shutdown_event():
    """
    Cleanup resources on application shutdown.
    """
    # Close database connections
    # Close Redis connections
    # Any other cleanup tasks
    pass
