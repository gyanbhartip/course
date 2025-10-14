"""
Redis cache service for caching and rate limiting.
"""

import redis.asyncio as aioredis
from app.core.config import settings
import json
from typing import Optional, Any
from functools import wraps


class CacheService:
    """Redis cache service for application caching."""

    def __init__(self):
        """Initialize Redis connection."""
        self.redis = aioredis.from_url(
            settings.REDIS_URL, encoding="utf-8", decode_responses=True
        )

    async def get(self, key: str) -> Optional[Any]:
        """
        Get cached value.

        Args:
            key: Cache key

        Returns:
            Cached value or None
        """
        value = await self.redis.get(key)
        return json.loads(value) if value else None

    async def set(self, key: str, value: Any, ttl: int = 3600):
        """
        Set cache with TTL.

        Args:
            key: Cache key
            value: Value to cache
            ttl: Time to live in seconds (default 1 hour)
        """
        await self.redis.setex(key, ttl, json.dumps(value))

    async def delete(self, key: str):
        """
        Delete cache key.

        Args:
            key: Cache key to delete
        """
        await self.redis.delete(key)

    async def delete_pattern(self, pattern: str):
        """
        Delete all keys matching pattern.

        Args:
            pattern: Key pattern to match
        """
        keys = await self.redis.keys(pattern)
        if keys:
            await self.redis.delete(*keys)

    async def increment(self, key: str, ttl: int = 60) -> int:
        """
        Increment counter (for rate limiting).

        Args:
            key: Counter key
            ttl: Time to live in seconds

        Returns:
            int: Current counter value
        """
        pipe = self.redis.pipeline()
        pipe.incr(key)
        pipe.expire(key, ttl)
        results = await pipe.execute()
        return results[0]


# Cache decorator
def cached(ttl: int = 3600, key_prefix: str = ""):
    """
    Cache decorator for function results.

    Args:
        ttl: Time to live in seconds
        key_prefix: Key prefix for cache

    Returns:
        Decorated function
    """

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
