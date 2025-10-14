"""
Advanced Redis cache service with sophisticated invalidation and performance optimization.
"""

import redis.asyncio as redis
from typing import Any, Optional, Union, List, Dict, Set, Callable
from functools import wraps
import json
import pickle
import hashlib
import time
from datetime import datetime, timedelta
from app.core.config import settings
import logging
import asyncio

logger = logging.getLogger(__name__)

# Redis connection pool
redis_pool = redis.ConnectionPool.from_url(
    settings.REDIS_URL,
    max_connections=settings.REDIS_MAX_CONNECTIONS,
    decode_responses=True,
)

redis_client = redis.Redis(connection_pool=redis_pool)


class CacheService:
    """Advanced Redis cache service with sophisticated features."""

    def __init__(self):
        """Initialize cache service."""
        self.redis = redis_client
        self._cache_stats = {"hits": 0, "misses": 0, "sets": 0, "deletes": 0}

    async def get(self, key: str) -> Optional[Any]:
        """
        Get value from cache with statistics tracking.

        Args:
            key: Cache key

        Returns:
            Cached value or None
        """
        try:
            value = await self.redis.get(key)
            if value:
                self._cache_stats["hits"] += 1
                return json.loads(value)
            self._cache_stats["misses"] += 1
            return None
        except Exception as e:
            logger.error(f"Cache get error for key {key}: {str(e)}")
            self._cache_stats["misses"] += 1
            return None

    async def get_many(self, keys: List[str]) -> Dict[str, Any]:
        """
        Get multiple values from cache.

        Args:
            keys: List of cache keys

        Returns:
            Dictionary of key-value pairs
        """
        try:
            values = await self.redis.mget(keys)
            result = {}
            for key, value in zip(keys, values):
                if value:
                    result[key] = json.loads(value)
                    self._cache_stats["hits"] += 1
                else:
                    self._cache_stats["misses"] += 1
            return result
        except Exception as e:
            logger.error(f"Cache get_many error: {str(e)}")
            return {}

    async def set(
        self, key: str, value: Any, ttl: int = 3600, tags: Optional[List[str]] = None
    ) -> bool:
        """
        Set value in cache with TTL and tags for invalidation.

        Args:
            key: Cache key
            value: Value to cache
            ttl: Time to live in seconds
            tags: Tags for cache invalidation

        Returns:
            True if successful, False otherwise
        """
        try:
            serialized_value = json.dumps(value, default=str)
            await self.redis.setex(key, ttl, serialized_value)

            # Store tags for invalidation
            if tags:
                for tag in tags:
                    await self.redis.sadd(f"cache_tag:{tag}", key)
                    await self.redis.expire(f"cache_tag:{tag}", ttl)

            self._cache_stats["sets"] += 1
            return True
        except Exception as e:
            logger.error(f"Cache set error for key {key}: {str(e)}")
            return False

    async def set_many(
        self, mapping: Dict[str, Any], ttl: int = 3600, tags: Optional[List[str]] = None
    ) -> bool:
        """
        Set multiple values in cache.

        Args:
            mapping: Dictionary of key-value pairs
            ttl: Time to live in seconds
            tags: Tags for cache invalidation

        Returns:
            True if successful, False otherwise
        """
        try:
            pipe = self.redis.pipeline()

            for key, value in mapping.items():
                serialized_value = json.dumps(value, default=str)
                pipe.setex(key, ttl, serialized_value)

                # Store tags for invalidation
                if tags:
                    for tag in tags:
                        pipe.sadd(f"cache_tag:{tag}", key)
                        pipe.expire(f"cache_tag:{tag}", ttl)

            await pipe.execute()
            self._cache_stats["sets"] += len(mapping)
            return True
        except Exception as e:
            logger.error(f"Cache set_many error: {str(e)}")
            return False

    async def delete(self, key: str) -> bool:
        """
        Delete key from cache.

        Args:
            key: Cache key

        Returns:
            True if successful, False otherwise
        """
        try:
            await self.redis.delete(key)
            self._cache_stats["deletes"] += 1
            return True
        except Exception as e:
            logger.error(f"Cache delete error for key {key}: {str(e)}")
            return False

    async def delete_pattern(self, pattern: str) -> int:
        """
        Delete keys matching pattern.

        Args:
            pattern: Key pattern (supports wildcards)

        Returns:
            Number of keys deleted
        """
        try:
            keys = await self.redis.keys(pattern)
            if keys:
                deleted = await self.redis.delete(*keys)
                self._cache_stats["deletes"] += deleted
                return deleted
            return 0
        except Exception as e:
            logger.error(f"Cache delete pattern error for pattern {pattern}: {str(e)}")
            return 0

    async def invalidate_by_tags(self, tags: List[str]) -> int:
        """
        Invalidate cache entries by tags.

        Args:
            tags: List of tags to invalidate

        Returns:
            Number of keys invalidated
        """
        try:
            total_deleted = 0
            for tag in tags:
                keys = await self.redis.smembers(f"cache_tag:{tag}")
                if keys:
                    deleted = await self.redis.delete(*keys)
                    total_deleted += deleted
                    self._cache_stats["deletes"] += deleted

                # Clean up tag set
                await self.redis.delete(f"cache_tag:{tag}")

            return total_deleted
        except Exception as e:
            logger.error(f"Cache invalidate by tags error: {str(e)}")
            return 0

    async def increment(
        self, key: str, amount: int = 1, ttl: Optional[int] = None
    ) -> Optional[int]:
        """
        Increment numeric value in cache.

        Args:
            key: Cache key
            amount: Amount to increment
            ttl: Optional TTL for the key

        Returns:
            New value or None if error
        """
        try:
            pipe = self.redis.pipeline()
            pipe.incrby(key, amount)
            if ttl:
                pipe.expire(key, ttl)

            results = await pipe.execute()
            return results[0]
        except Exception as e:
            logger.error(f"Cache increment error for key {key}: {str(e)}")
            return None

    async def decrement(
        self, key: str, amount: int = 1, ttl: Optional[int] = None
    ) -> Optional[int]:
        """
        Decrement numeric value in cache.

        Args:
            key: Cache key
            amount: Amount to decrement
            ttl: Optional TTL for the key

        Returns:
            New value or None if error
        """
        try:
            pipe = self.redis.pipeline()
            pipe.decrby(key, amount)
            if ttl:
                pipe.expire(key, ttl)

            results = await pipe.execute()
            return results[0]
        except Exception as e:
            logger.error(f"Cache decrement error for key {key}: {str(e)}")
            return None

    async def exists(self, key: str) -> bool:
        """
        Check if key exists in cache.

        Args:
            key: Cache key

        Returns:
            True if key exists, False otherwise
        """
        try:
            return bool(await self.redis.exists(key))
        except Exception as e:
            logger.error(f"Cache exists error for key {key}: {str(e)}")
            return False

    async def expire(self, key: str, ttl: int) -> bool:
        """
        Set expiration time for key.

        Args:
            key: Cache key
            ttl: Time to live in seconds

        Returns:
            True if successful, False otherwise
        """
        try:
            return bool(await self.redis.expire(key, ttl))
        except Exception as e:
            logger.error(f"Cache expire error for key {key}: {str(e)}")
            return False

    async def get_ttl(self, key: str) -> int:
        """
        Get TTL for key.

        Args:
            key: Cache key

        Returns:
            TTL in seconds, -1 if no expiration, -2 if key doesn't exist
        """
        try:
            return await self.redis.ttl(key)
        except Exception as e:
            logger.error(f"Cache get_ttl error for key {key}: {str(e)}")
            return -2

    async def get_stats(self) -> Dict[str, Any]:
        """
        Get cache statistics.

        Returns:
            Dictionary with cache statistics
        """
        try:
            info = await self.redis.info()
            return {
                "stats": self._cache_stats.copy(),
                "redis_info": {
                    "used_memory": info.get("used_memory_human"),
                    "connected_clients": info.get("connected_clients"),
                    "total_commands_processed": info.get("total_commands_processed"),
                    "keyspace_hits": info.get("keyspace_hits"),
                    "keyspace_misses": info.get("keyspace_misses"),
                },
            }
        except Exception as e:
            logger.error(f"Cache get_stats error: {str(e)}")
            return {"stats": self._cache_stats.copy()}

    async def clear_stats(self):
        """Clear cache statistics."""
        self._cache_stats = {"hits": 0, "misses": 0, "sets": 0, "deletes": 0}


# Cache key generators
class CacheKeys:
    """Cache key generators for consistent key naming."""

    @staticmethod
    def user(user_id: str) -> str:
        return f"user:{user_id}"

    @staticmethod
    def course(course_id: str) -> str:
        return f"course:{course_id}"

    @staticmethod
    def courses_list(skip: int, limit: int, filters: Dict[str, Any]) -> str:
        filter_hash = hashlib.md5(str(filters).encode()).hexdigest()[:8]
        return f"courses:list:{skip}:{limit}:{filter_hash}"

    @staticmethod
    def course_content(course_id: str) -> str:
        return f"course:{course_id}:content"

    @staticmethod
    def user_progress(user_id: str, course_id: str) -> str:
        return f"progress:{user_id}:{course_id}"

    @staticmethod
    def user_enrollments(user_id: str) -> str:
        return f"enrollments:{user_id}"

    @staticmethod
    def user_notes(user_id: str, course_id: Optional[str] = None) -> str:
        if course_id:
            return f"notes:{user_id}:{course_id}"
        return f"notes:{user_id}"


# Advanced caching decorators
def cached(
    ttl: int = 3600,
    key_prefix: str = "",
    tags: Optional[List[str]] = None,
    cache_condition: Optional[Callable] = None,
):
    """
    Advanced decorator for caching function results.

    Args:
        ttl: Time to live in seconds
        key_prefix: Prefix for cache key
        tags: Tags for cache invalidation
        cache_condition: Function to determine if result should be cached

    Returns:
        Decorated function
    """

    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Generate cache key
            key_data = f"{func.__name__}:{hash(str(args) + str(kwargs))}"
            cache_key = f"{key_prefix}:{key_data}" if key_prefix else key_data

            # Try to get from cache
            cache_service = CacheService()
            cached_result = await cache_service.get(cache_key)

            if cached_result is not None:
                return cached_result

            # Execute function
            result = await func(*args, **kwargs)

            # Check cache condition
            if cache_condition and not cache_condition(result):
                return result

            # Cache result
            await cache_service.set(cache_key, result, ttl, tags)

            return result

        return wrapper

    return decorator


def cache_invalidate(tags: List[str]):
    """
    Decorator to invalidate cache by tags after function execution.

    Args:
        tags: Tags to invalidate

    Returns:
        Decorated function
    """

    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            result = await func(*args, **kwargs)

            # Invalidate cache
            cache_service = CacheService()
            await cache_service.invalidate_by_tags(tags)

            return result

        return wrapper

    return decorator


# Cache warming utilities
class CacheWarmer:
    """Utility class for warming up cache with frequently accessed data."""

    def __init__(self, cache_service: CacheService):
        self.cache = cache_service

    async def warm_courses_cache(self, courses_data: List[Dict[str, Any]]):
        """Warm up courses cache."""
        try:
            mapping = {}
            for course in courses_data:
                key = CacheKeys.course(course["id"])
                mapping[key] = course

            await self.cache.set_many(mapping, ttl=3600, tags=["courses"])
            logger.info(f"Warmed cache with {len(courses_data)} courses")
        except Exception as e:
            logger.error(f"Error warming courses cache: {str(e)}")

    async def warm_user_cache(self, user_data: Dict[str, Any]):
        """Warm up user cache."""
        try:
            key = CacheKeys.user(user_data["id"])
            await self.cache.set(
                key, user_data, ttl=1800, tags=["users", f"user:{user_data['id']}"]
            )
            logger.info(f"Warmed cache for user {user_data['id']}")
        except Exception as e:
            logger.error(f"Error warming user cache: {str(e)}")


# Global cache service instance
cache_service = CacheService()
