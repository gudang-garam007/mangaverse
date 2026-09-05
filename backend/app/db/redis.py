import redis.asyncio as aioredis
from app.config import settings
from loguru import logger
import json
import hashlib

class RedisDatabase:
    def __init__(self):
        self.client = aioredis.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True,
            max_connections=50,
        )

    async def ping(self):
        return await self.client.ping()

    async def close(self):
        await self.client.close()

    # --- Semantic Cache ---
    def _get_cache_key(self, query: str) -> str:
        query_hash = hashlib.sha256(query.encode()).hexdigest()
        return f"semantic_cache:{query_hash}"

    async def get_cached_response(self, query: str):
        key = self._get_cache_key(query)
        cached = await self.client.get(key)
        if cached:
            return json.loads(cached)
        return None

    async def set_cached_response(self, query: str, response: dict, ttl: int = 3600):
        key = self._get_cache_key(query)
        await self.client.setex(key, ttl, json.dumps(response))

    # --- Rate Limiting ---
    async def check_rate_limit(self, user_id: str, endpoint: str, limit: int, window: int = 60) -> bool:
        key = f"rate_limit:{user_id}:{endpoint}"
        current = await self.client.incr(key)
        if current == 1:
            await self.client.expire(key, window)
        return current <= limit

    # --- Daily Usage Tracking ---
    async def get_daily_usage(self, user_id: str, feature: str) -> int:
        key = f"daily_usage:{user_id}:{feature}"
        val = await self.client.get(key)
        return int(val) if val else 0

    async def increment_daily_usage(self, user_id: str, feature: str):
        key = f"daily_usage:{user_id}:{feature}"
        await self.client.incr(key)
        await self.client.expire(key, 86400)  # 24 hours

    # --- Chat Memory ---
    async def get_chat_memory(self, conversation_id: str, limit: int = 20):
        key = f"chat_memory:{conversation_id}"
        messages = await self.client.lrange(key, -limit, -1)
        return [json.loads(m) for m in messages]

    async def add_chat_message(self, conversation_id: str, message: dict):
        key = f"chat_memory:{conversation_id}"
        await self.client.rpush(key, json.dumps(message))
        await self.client.expire(key, 604800)  # 7 days

redis_db = RedisDatabase()