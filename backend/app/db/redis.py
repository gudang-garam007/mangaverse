import redis.asyncio as aioredis
from app.config import settings
from loguru import logger
import json
import hashlib


class RedisDatabase:
    def __init__(self):
        self.client = None
        self.is_connected = False

    async def connect(self):
        """Safely connect to Redis. Fails gracefully if URL is missing or unreachable."""
        try:
            redis_url = getattr(settings, 'REDIS_URL', None)

            if not redis_url:
                logger.warning("⚠️ REDIS_URL not found in settings. Redis features disabled (Fail-Open).")
                self.is_connected = False
                return

            # Fix Upstash URL format if user accidentally pasted https:// instead of rediss://
            if redis_url.startswith("https://"):
                redis_url = redis_url.replace("https://", "rediss://")

            self.client = aioredis.from_url(
                redis_url,
                encoding="utf-8",
                decode_responses=True,
                max_connections=50,
                socket_connect_timeout=5,  # Prevent infinite hanging
                socket_timeout=5,
            )

            # Test connection
            await self.client.ping()
            self.is_connected = True
            logger.info("✅ Redis connected successfully")

        except Exception as e:
            logger.error(f"❌ Redis connection failed: {e}. Running in degraded mode (Redis disabled).")
            self.is_connected = False
            self.client = None

    async def ping(self):
        return self.is_connected

    async def close(self):
        if self.client:
            await self.client.close()
            self.client = None
            self.is_connected = False

    # --- Semantic Cache ---
    def _get_cache_key(self, query: str) -> str:
        query_hash = hashlib.sha256(query.encode()).hexdigest()
        return f"semantic_cache:{query_hash}"

    async def get_cached_response(self, query: str):
        if not self.is_connected or not self.client:
            return None  # Fail-open: bypass cache

        try:
            key = self._get_cache_key(query)
            cached = await self.client.get(key)
            if cached:
                return json.loads(cached)
            return None
        except Exception as e:
            logger.error(f"❌ Redis get_cached_response failed: {e}")
            return None

    async def set_cached_response(self, query: str, response: dict, ttl: int = 3600):
        if not self.is_connected or not self.client:
            return  # Fail-open: silently skip caching

        try:
            key = self._get_cache_key(query)
            await self.client.setex(key, ttl, json.dumps(response))
        except Exception as e:
            logger.error(f"❌ Redis set_cached_response failed: {e}")

    # --- Rate Limiting ---
    async def check_rate_limit(self, user_id: str, endpoint: str, limit: int, window: int = 60) -> bool:
        # ✅ CRITICAL: Agar Redis down hai, toh request BLOCK mat kar, ALLOW kar de (Fail-Open)
        if not self.is_connected or not self.client:
            return True

        try:
            key = f"rate_limit:{user_id}:{endpoint}"
            current = await self.client.incr(key)
            if current == 1:
                await self.client.expire(key, window)
            return current <= limit
        except Exception as e:
            logger.error(f"❌ Redis check_rate_limit failed: {e}. Allowing request.")
            return True  # Fail-open: allow request on Redis error

    # --- Daily Usage Tracking ---
    async def get_daily_usage(self, user_id: str, feature: str) -> int:
        if not self.is_connected or not self.client:
            return 0

        try:
            key = f"daily_usage:{user_id}:{feature}"
            val = await self.client.get(key)
            return int(val) if val else 0
        except Exception as e:
            logger.error(f"❌ Redis get_daily_usage failed: {e}")
            return 0

    async def increment_daily_usage(self, user_id: str, feature: str):
        if not self.is_connected or not self.client:
            return  # Fail-open: silently skip

        try:
            key = f"daily_usage:{user_id}:{feature}"
            await self.client.incr(key)
            await self.client.expire(key, 86400)  # 24 hours
        except Exception as e:
            logger.error(f"❌ Redis increment_daily_usage failed: {e}")

    # --- Chat Memory ---
    async def get_chat_memory(self, conversation_id: str, limit: int = 20):
        if not self.is_connected or not self.client:
            return []

        try:
            key = f"chat_memory:{conversation_id}"
            messages = await self.client.lrange(key, -limit, -1)
            return [json.loads(m) for m in messages]
        except Exception as e:
            logger.error(f"❌ Redis get_chat_memory failed: {e}")
            return []

    async def add_chat_message(self, conversation_id: str, message: dict):
        if not self.is_connected or not self.client:
            return  # Fail-open: silently skip

        try:
            key = f"chat_memory:{conversation_id}"
            await self.client.rpush(key, json.dumps(message))
            await self.client.expire(key, 604800)  # 7 days
        except Exception as e:
            logger.error(f"❌ Redis add_chat_message failed: {e}")


redis_db = RedisDatabase()