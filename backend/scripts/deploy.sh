#!/bin/bash

# Production deployment script for LMS Backend
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="lms-backend"
DOCKER_COMPOSE_FILE="docker-compose.prod.yml"
BACKUP_DIR="/opt/backups"
LOG_FILE="/var/log/lms-deploy.log"

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a $LOG_FILE
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}" | tee -a $LOG_FILE
    exit 1
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}" | tee -a $LOG_FILE
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   error "This script should not be run as root"
fi

# Check if Docker is installed and running
if ! command -v docker &> /dev/null; then
    error "Docker is not installed"
fi

if ! docker info &> /dev/null; then
    error "Docker is not running"
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    error "Docker Compose is not installed"
fi

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Backup database
backup_database() {
    log "Creating database backup..."
    
    BACKUP_FILE="$BACKUP_DIR/lms_backup_$(date +%Y%m%d_%H%M%S).sql"
    
    docker-compose -f $DOCKER_COMPOSE_FILE exec -T db pg_dump -U postgres lms > $BACKUP_FILE
    
    if [ $? -eq 0 ]; then
        log "Database backup created: $BACKUP_FILE"
        # Keep only last 7 backups
        find $BACKUP_DIR -name "lms_backup_*.sql" -mtime +7 -delete
    else
        error "Database backup failed"
    fi
}

# Pull latest images
pull_images() {
    log "Pulling latest Docker images..."
    docker-compose -f $DOCKER_COMPOSE_FILE pull
}

# Run database migrations
run_migrations() {
    log "Running database migrations..."
    docker-compose -f $DOCKER_COMPOSE_FILE exec -T api alembic upgrade head
    
    if [ $? -eq 0 ]; then
        log "Database migrations completed successfully"
    else
        error "Database migrations failed"
    fi
}

# Deploy application
deploy_app() {
    log "Deploying application..."
    
    # Stop existing containers
    docker-compose -f $DOCKER_COMPOSE_FILE down
    
    # Start new containers
    docker-compose -f $DOCKER_COMPOSE_FILE up -d
    
    # Wait for services to be ready
    log "Waiting for services to be ready..."
    sleep 30
    
    # Check if services are healthy
    if docker-compose -f $DOCKER_COMPOSE_FILE ps | grep -q "unhealthy"; then
        error "Some services are unhealthy"
    fi
    
    log "Application deployed successfully"
}

# Health check
health_check() {
    log "Performing health check..."
    
    # Check API health
    if curl -f http://localhost/health > /dev/null 2>&1; then
        log "API health check passed"
    else
        error "API health check failed"
    fi
    
    # Check database connection
    if docker-compose -f $DOCKER_COMPOSE_FILE exec -T db pg_isready -U postgres > /dev/null 2>&1; then
        log "Database health check passed"
    else
        error "Database health check failed"
    fi
    
    # Check Redis connection
    if docker-compose -f $DOCKER_COMPOSE_FILE exec -T redis redis-cli ping > /dev/null 2>&1; then
        log "Redis health check passed"
    else
        error "Redis health check failed"
    fi
}

# Cleanup old images
cleanup() {
    log "Cleaning up old Docker images..."
    docker system prune -f
    docker volume prune -f
}

# Rollback function
rollback() {
    warning "Rolling back to previous version..."
    
    # Stop current containers
    docker-compose -f $DOCKER_COMPOSE_FILE down
    
    # Find the most recent backup
    LATEST_BACKUP=$(find $BACKUP_DIR -name "lms_backup_*.sql" -type f -printf '%T@ %p\n' | sort -n | tail -1 | cut -d' ' -f2-)
    
    if [ -z "$LATEST_BACKUP" ]; then
        error "No backup found for rollback"
    fi
    
    log "Restoring database from backup: $LATEST_BACKUP"
    
    # Restore database
    docker-compose -f $DOCKER_COMPOSE_FILE up -d db
    sleep 10
    
    docker-compose -f $DOCKER_COMPOSE_FILE exec -T db psql -U postgres -c "DROP DATABASE IF EXISTS lms;"
    docker-compose -f $DOCKER_COMPOSE_FILE exec -T db psql -U postgres -c "CREATE DATABASE lms;"
    docker-compose -f $DOCKER_COMPOSE_FILE exec -T db psql -U postgres lms < $LATEST_BACKUP
    
    # Start all services
    docker-compose -f $DOCKER_COMPOSE_FILE up -d
    
    log "Rollback completed"
}

# Main deployment function
main() {
    log "Starting deployment of $PROJECT_NAME"
    
    # Check if we're in the right directory
    if [ ! -f "$DOCKER_COMPOSE_FILE" ]; then
        error "Docker Compose file not found: $DOCKER_COMPOSE_FILE"
    fi
    
    # Check if .env file exists
    if [ ! -f ".env" ]; then
        error "Environment file not found: .env"
    fi
    
    # Parse command line arguments
    case "${1:-deploy}" in
        "deploy")
            backup_database
            pull_images
            run_migrations
            deploy_app
            health_check
            cleanup
            log "Deployment completed successfully"
            ;;
        "rollback")
            rollback
            ;;
        "backup")
            backup_database
            ;;
        "migrate")
            run_migrations
            ;;
        "health")
            health_check
            ;;
        *)
            echo "Usage: $0 {deploy|rollback|backup|migrate|health}"
            echo "  deploy  - Full deployment (default)"
            echo "  rollback - Rollback to previous version"
            echo "  backup  - Create database backup only"
            echo "  migrate - Run database migrations only"
            echo "  health  - Perform health check only"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
