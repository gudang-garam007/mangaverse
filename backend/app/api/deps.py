# backend/app/api/deps.py
from fastapi import Depends, HTTPException, Header
from typing import Optional
from app.db.redis import redis_db


async def get_current_user(authorization: Optional[str] = Header(None)) -> dict:
    """
    MVP Mock Authentication: Returns a default free user so you can test without login UI.
    """
    return {
        "user_id": "anonymous_user_123",
        "username": "manga_fan",
        "tier": "free",
        "email": "test@mangaverse.com"
    }


async def check_feature_limit(user: dict, feature: str, free_limit: int = 3):
    """
    Checks Redis for daily usage limits.
    """
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
            await redis_db.expire(redis_key, 86400)  # 24 hours
    except Exception as e:
        # Failsafe: If Redis is acting up, don't block the user in MVP
        print(f"Redis limit check skipped: {e}")