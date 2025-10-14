# Search Functionality Documentation

This document describes the search functionality implementation using Elasticsearch for the Course Management LMS backend.

## Overview

The search functionality provides comprehensive search capabilities for courses and content, including:

-   Full-text search across course titles, descriptions, and content
-   Filtering by category, difficulty, instructor, and other attributes
-   Search suggestions and autocomplete
-   Popular searches tracking
-   Search analytics and insights
-   Real-time indexing of new content

## Architecture

### Components

1. **ElasticsearchService** (`app/services/search.py`)

    - Handles all Elasticsearch operations
    - Manages index creation and configuration
    - Provides search and indexing methods

2. **Search API Endpoints** (`app/api/v1/endpoints/search.py`)

    - RESTful API for search operations
    - Handles search requests and responses
    - Provides search analytics

3. **Search Schemas** (`app/schemas/search.py`)

    - Pydantic models for search requests and responses
    - Data validation and serialization

4. **Search Tasks** (`app/tasks/search.py`)
    - Celery tasks for background indexing
    - Bulk operations and reindexing
    - Error handling and retries

## Setup

### 1. Environment Variables

Add the following to your `.env` file:

```env
# Elasticsearch Configuration
ELASTICSEARCH_URL=http://localhost:9200
ELASTICSEARCH_INDEX_PREFIX=lms
ELASTICSEARCH_USERNAME=
ELASTICSEARCH_PASSWORD=
ELASTICSEARCH_USE_SSL=false
ELASTICSEARCH_VERIFY_CERTS=false
```

### 2. Docker Compose

The `docker-compose.yml` includes an Elasticsearch service:

```yaml
elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    environment:
        - discovery.type=single-node
        - xpack.security.enabled=false
        - 'ES_JAVA_OPTS=-Xms512m -Xmx512m'
    ports:
        - '9200:9200'
    volumes:
        - elasticsearch_data:/usr/share/elasticsearch/data
```

### 3. Initialize Indices

Run the following command to create the search indices:

```bash
# Using the API
curl -X POST "http://localhost:8000/api/v1/search/indices/create"

# Or using Celery task
python -c "
from app.tasks.search import create_search_indices_task
create_search_indices_task.delay()
"
```

## API Endpoints

### Search

#### Combined Search

```http
GET /api/v1/search?q=python&type=all&page=1&size=10
```

#### Course Search

```http
GET /api/v1/search/courses?q=python&category=programming&difficulty=beginner
```

#### Content Search

```http
GET /api/v1/search/content?q=tutorial&course_id=123&type=video
```

#### Search Suggestions

```http
GET /api/v1/search/suggestions?q=pyt
```

#### Popular Searches

```http
GET /api/v1/search/popular?limit=10
```

#### Search Analytics

```http
GET /api/v1/search/analytics?period=7d
```

### Index Management

#### Create Indices

```http
POST /api/v1/search/indices/create
```

#### Delete Indices

```http
DELETE /api/v1/search/indices
```

#### Reindex All

```http
POST /api/v1/search/indices/reindex
```

## Search Features

### 1. Full-Text Search

The search supports:

-   **Fuzzy matching**: Finds results even with typos
-   **Phrase search**: Exact phrase matching with quotes
-   **Wildcard search**: Using `*` and `?` characters
-   **Boolean operators**: AND, OR, NOT operations

### 2. Filtering

Available filters:

-   **Category**: Filter by course category
-   **Difficulty**: beginner, intermediate, advanced
-   **Instructor**: Filter by instructor name
-   **Duration**: Range filtering for course duration
-   **Rating**: Minimum rating threshold
-   **Status**: active, draft, archived
-   **Content Type**: video, document, quiz, etc.

### 3. Sorting

Sort options:

-   **Relevance**: Default search relevance
-   **Title**: Alphabetical by title
-   **Created Date**: Newest first
-   **Updated Date**: Recently updated
-   **Rating**: Highest rated first
-   **Duration**: Shortest/longest first
-   **Enrollment Count**: Most popular first

### 4. Search Suggestions

The autocomplete feature provides:

-   **Course suggestions**: Based on course titles and descriptions
-   **Content suggestions**: Based on content titles
-   **Category suggestions**: Based on available categories
-   **Instructor suggestions**: Based on instructor names

### 5. Popular Searches

Tracks and displays:

-   **Most searched terms**: Based on search frequency
-   **Trending searches**: Recent popular searches
-   **Category popularity**: Most searched categories
-   **Instructor popularity**: Most searched instructors

## Indexing

### Automatic Indexing

Content is automatically indexed when:

-   A new course is created
-   A course is updated
-   New content is added to a course
-   Content is updated or deleted

### Manual Indexing

You can manually trigger indexing:

```python
from app.tasks.search import index_course_task, index_content_task

# Index a single course
index_course_task.delay(course_data)

# Index a single content item
index_content_task.delay(content_data)

# Bulk index courses
from app.tasks.search import bulk_index_courses_task
bulk_index_courses_task.delay(courses_data)

# Reindex all content
from app.tasks.search import reindex_all_courses_task
reindex_all_courses_task.delay()
```

### Index Structure

#### Courses Index

```json
{
    "mappings": {
        "properties": {
            "id": { "type": "keyword" },
            "title": { "type": "text", "analyzer": "standard" },
            "description": { "type": "text", "analyzer": "standard" },
            "instructor": { "type": "text", "analyzer": "standard" },
            "category": { "type": "keyword" },
            "difficulty": { "type": "keyword" },
            "status": { "type": "keyword" },
            "duration": { "type": "integer" },
            "rating": { "type": "float" },
            "enrollment_count": { "type": "integer" },
            "tags": { "type": "keyword" },
            "created_at": { "type": "date" },
            "updated_at": { "type": "date" },
            "thumbnail_url": { "type": "keyword" }
        }
    }
}
```

#### Content Index

```json
{
    "mappings": {
        "properties": {
            "id": { "type": "keyword" },
            "course_id": { "type": "keyword" },
            "course_title": { "type": "text", "analyzer": "standard" },
            "title": { "type": "text", "analyzer": "standard" },
            "description": { "type": "text", "analyzer": "standard" },
            "type": { "type": "keyword" },
            "order_index": { "type": "integer" },
            "duration": { "type": "integer" },
            "file_size": { "type": "long" },
            "tags": { "type": "keyword" },
            "created_at": { "type": "date" },
            "updated_at": { "type": "date" },
            "file_url": { "type": "keyword" },
            "thumbnail_url": { "type": "keyword" }
        }
    }
}
```

## Performance Optimization

### 1. Indexing Performance

-   **Bulk operations**: Use bulk indexing for multiple documents
-   **Async operations**: All indexing operations are asynchronous
-   **Background processing**: Indexing happens in background tasks
-   **Error handling**: Automatic retries with exponential backoff

### 2. Search Performance

-   **Caching**: Search results are cached for frequently searched terms
-   **Pagination**: Efficient pagination with cursor-based approach
-   **Query optimization**: Optimized Elasticsearch queries
-   **Index optimization**: Proper index mapping and settings

### 3. Monitoring

-   **Search metrics**: Track search performance and usage
-   **Index health**: Monitor index status and performance
-   **Error tracking**: Log and track indexing errors
-   **Analytics**: Search analytics and insights

## Troubleshooting

### Common Issues

1. **Elasticsearch Connection Error**

    - Check if Elasticsearch is running
    - Verify connection URL and credentials
    - Check network connectivity

2. **Index Creation Failed**

    - Check Elasticsearch permissions
    - Verify index name and settings
    - Check for conflicting indices

3. **Search Returns No Results**

    - Verify content is indexed
    - Check search query syntax
    - Verify index mappings

4. **Slow Search Performance**
    - Check Elasticsearch cluster health
    - Optimize search queries
    - Consider index optimization

### Debugging

Enable debug logging:

```python
import logging
logging.getLogger("app.services.search").setLevel(logging.DEBUG)
```

Check Elasticsearch cluster health:

```bash
curl -X GET "localhost:9200/_cluster/health?pretty"
```

Check index status:

```bash
curl -X GET "localhost:9200/_cat/indices?v"
```

## Security Considerations

1. **Access Control**: Search endpoints require authentication
2. **Data Privacy**: Sensitive data is not indexed
3. **Input Validation**: All search inputs are validated
4. **Rate Limiting**: Search requests are rate limited
5. **Audit Logging**: Search activities are logged

## Future Enhancements

1. **Machine Learning**: Implement ML-based search ranking
2. **Personalization**: User-specific search results
3. **Semantic Search**: Vector-based semantic search
4. **Multi-language**: Support for multiple languages
5. **Advanced Analytics**: More detailed search analytics
6. **Search History**: User search history tracking
7. **Saved Searches**: Allow users to save search queries
8. **Search Alerts**: Notify users of new content matching saved searches
