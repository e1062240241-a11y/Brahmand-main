"""Caching utilities with Redis or in-memory fallback"""
import json
import logging
from typing import Optional, Any, List, Dict
from functools import wraps
from datetime import datetime

from config.settings import settings

from cachetools import TTLCache

logger = logging.getLogger(__name__)


class CacheManager:
    """Centralized cache management"""
    
    # Cache key prefixes
    USER_PREFIX = "users"
    COMMUNITY_PREFIX = "community"
    TEMPLE_PREFIX = "temple"
    PANCHANG_PREFIX = "panchang"
    WISDOM_PREFIX = "wisdom"
    STATS_PREFIX = "stats"
    
    def __init__(self):
        self._redis = None
        self._local_cache = TTLCache(maxsize=1000, ttl=300)
    
    async def _get_redis(self):
        """Lazy load Redis connection"""
        if self._redis is None:
            from config.database import get_redis
            self._redis = await get_redis()
        return self._redis
    
    async def get(self, key: str) -> Optional[Any]:
        """Get value from cache"""
        if key in self._local_cache:
            return self._local_cache[key]
        try:
            redis = await self._get_redis()
            value = await redis.get(key)
            if value:
                val = json.loads(value)
                self._local_cache[key] = val
                return val
        except Exception as e:
            logger.debug(f"Cache get error for {key}: {e}")
        return None

    async def get_many(self, keys: List[str]) -> List[Optional[Any]]:
        """Get multiple values from cache"""
        results = [self._local_cache.get(k) for k in keys]
        missing_indices = [i for i, v in enumerate(results) if v is None]
        
        if not missing_indices:
            return results
            
        try:
            redis = await self._get_redis()
            missing_keys = [keys[i] for i in missing_indices]
            
            if hasattr(redis, 'get_many'):
                values = await redis.get_many(missing_keys)
                for idx, v_str in zip(missing_indices, values):
                    if v_str:
                        val = json.loads(v_str)
                        self._local_cache[keys[idx]] = val
                        results[idx] = val
            else:
                for idx in missing_indices:
                    val = await self.get(keys[idx])
                    if val is not None:
                        results[idx] = val
        except Exception as e:
            logger.debug(f"Cache get_many error: {e}")
            
        return results
    
    async def set(
        self, 
        key: str, 
        value: Any, 
        ttl: int | None = None
    ):
        """Set value in cache with optional TTL"""
        if ttl is None:
            ttl = settings.CACHE_TTL
        
        self._local_cache[key] = value

        try:
            redis = await self._get_redis()
            serialized = json.dumps(value, default=str)
            await redis.set(key, serialized, ex=ttl)
        except Exception as e:
            logger.debug(f"Cache set error for {key}: {e}")

    async def set_many(self, mapping: Dict[str, Any], ttl: int | None = None):
        """Set multiple values in cache"""
        if ttl is None:
            ttl = settings.CACHE_TTL
            
        for k, v in mapping.items():
            self._local_cache[k] = v
            
        try:
            redis = await self._get_redis()
            serialized_mapping = {k: json.dumps(v, default=str) for k, v in mapping.items()}
            if hasattr(redis, 'set_many'):
                await redis.set_many(serialized_mapping, ex=ttl)
            else:
                for k, v in serialized_mapping.items():
                    await redis.set(k, v, ex=ttl)
        except Exception as e:
            logger.debug(f"Cache set_many error: {e}")
            
    async def delete(self, key: str):
        """Delete value from cache"""
        if key in self._local_cache:
            del self._local_cache[key]
        try:
            redis = await self._get_redis()
            await redis.delete(key)
        except Exception as e:
            logger.debug(f"Cache delete error for {key}: {e}")
    
    async def delete_pattern(self, pattern: str):
        """Delete all keys matching pattern"""
        try:
            redis = await self._get_redis()
            if hasattr(redis, 'keys'):
                keys = await redis.keys(pattern)
                if keys:
                    await redis.delete(*keys)
        except Exception as e:
            logger.debug(f"Cache delete pattern error for {pattern}: {e}")
    
    # User caching
    async def get_user(self, user_id: str) -> Optional[dict]:
        return await self.get(f"{self.USER_PREFIX}:{user_id}")
    
    async def set_user(self, user_id: str, user_data: dict):
        await self.set(f"{self.USER_PREFIX}:{user_id}", user_data, ttl=300)
    
    async def invalidate_user(self, user_id: str):
        await self.delete(f"{self.USER_PREFIX}:{user_id}")
    
    # Community caching
    async def get_communities(self, user_id: str) -> Optional[List[dict]]:
        return await self.get(f"{self.COMMUNITY_PREFIX}:user:{user_id}")
    
    async def set_communities(self, user_id: str, communities: List[dict]):
        await self.set(f"{self.COMMUNITY_PREFIX}:user:{user_id}", communities, ttl=180)
    
    async def invalidate_user_communities(self, user_id: str):
        await self.delete(f"{self.COMMUNITY_PREFIX}:user:{user_id}")
    
    async def invalidate_community(self, community_id: str):
        """Invalidate single community cache and stats"""
        await self.delete(f"{self.COMMUNITY_PREFIX}:{community_id}")
        await self.delete(f"{self.STATS_PREFIX}:community:{community_id}")
        await self.delete_pattern(f"{self.COMMUNITY_PREFIX}:{community_id}*")
    
    # Temple caching
    async def get_temples(self) -> Optional[List[dict]]:
        return await self.get(f"{self.TEMPLE_PREFIX}:all")
    
    async def set_temples(self, temples: List[dict]):
        await self.set(f"{self.TEMPLE_PREFIX}:all", temples, ttl=600)
    
    async def invalidate_temples(self):
        await self.delete(f"{self.TEMPLE_PREFIX}:all")
    
    # Panchang caching (cache for whole day)
    async def get_panchang(self) -> Optional[dict]:
        today = datetime.utcnow().strftime("%Y-%m-%d")
        return await self.get(f"{self.PANCHANG_PREFIX}:{today}")
    
    async def set_panchang(self, panchang: dict):
        today = datetime.utcnow().strftime("%Y-%m-%d")
        # Cache until midnight (max 24 hours)
        await self.set(f"{self.PANCHANG_PREFIX}:{today}", panchang, ttl=86400)
    
    # Wisdom caching
    async def get_wisdom(self) -> Optional[dict]:
        today = datetime.utcnow().strftime("%Y-%m-%d")
        return await self.get(f"{self.WISDOM_PREFIX}:{today}")
    
    async def set_wisdom(self, wisdom: dict):
        today = datetime.utcnow().strftime("%Y-%m-%d")
        await self.set(f"{self.WISDOM_PREFIX}:{today}", wisdom, ttl=86400)
    
    # Stats caching
    async def get_community_stats(self, community_id: str) -> Optional[dict]:
        return await self.get(f"{self.STATS_PREFIX}:community:{community_id}")
    
    async def set_community_stats(self, community_id: str, stats: dict):
        await self.set(f"{self.STATS_PREFIX}:community:{community_id}", stats, ttl=60)

    async def invalidate_community_requests(self):
        """Invalidate all cached community requests"""
        try:
            keys_to_del = [k for k in list(self._local_cache.keys()) if k.startswith("user_requests:")]
            for k in keys_to_del:
                self._local_cache.pop(k, None)
        except Exception as e:
            logger.debug(f"Error clearing local cache for requests: {e}")
        await self.delete_pattern("user_requests:*")


# Global cache manager instance
cache_manager = CacheManager()


def cached(key_func, ttl: int | None = None):
    """Decorator for caching async function results"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            cache_key = key_func(*args, **kwargs)
            
            # Try to get from cache
            cached_value = await cache_manager.get(cache_key)
            if cached_value is not None:
                return cached_value
            
            # Execute function and cache result
            result = await func(*args, **kwargs)
            await cache_manager.set(cache_key, result, ttl)
            return result
        return wrapper
    return decorator
