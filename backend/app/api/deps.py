import uuid
from fastapi import Depends, HTTPException, Header
from typing import Optional
from app.db.redis import redis_db

# Fixed UUID for mock user so their berries don't reset on every request
MOCK_USER_ID = "12345678-1234-1234-1234-123456789012"

async def get_current_user(authorization: Optional[str] = Header(None)) -> dict:
    """
    MVP Mock Authentication: Returns a default free user so you can test without login UI.
    """
    return {
        "id": MOCK_USER_ID,          # ✅ Added 'id' for DB compatibility
        "user_id": MOCK_USER_ID,
        "username": "manga_fan",
        "tier": "free",
        "email": "test@mangaverse.com"
    }

async def check_feature_limit(user: dict, feature: str, free_limit: int = 3):
    user_id = user.get("user_id", "anonymous")
    redis_key = f"daily_usage:{user_id}:{feature}"

    try:
        current_count = await redis_db.get(redis_key)
        count = int(current_count) if current_count else 0

        if user.get("tier") == "free" and count >= free_limit:
            raise HTTPException(
                status_code=429,
                detail=f"Daily limit reached ({free_limit}). Upgrade to Premium for unlimited access."
                )

        await redis_db.incr(redis_key)
        if count == 0:
            await redis_db.expire(redis_key, 86400)
    except Exception as e:
        print(f"Redis limit check skipped: {e}")