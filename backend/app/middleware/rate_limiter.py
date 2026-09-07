from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from app.db.redis import redis_db
from app.config import settings
from loguru import logger


class RateLimiterMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Skip rate limiting for health checks, docs, and common non-API paths
        if request.url.path in ["/health", "/", "/docs", "/redoc", "/openapi.json", "/favicon.ico"]:
            return await call_next(request)

        # Get client identifier
        client_id = request.client.host if request.client else "unknown"

        # Check for auth header to use user ID instead
        auth_header = request.headers.get("Authorization")
        if auth_header:
            client_id = auth_header  # Simplified - in production, decode JWT

        try:
            # Get limit from settings, default to 60 if somehow missing
            limit = getattr(settings, "RATE_LIMIT_PER_MINUTE", 60)

            # Check rate limit
            allowed = await redis_db.check_rate_limit(
                user_id=client_id,
                endpoint=request.url.path,
                limit=limit,
                window=60,
            )

            if not allowed:
                logger.warning(f"🚫 Rate limit exceeded for {client_id} on {request.url.path}")
                raise HTTPException(
                    status_code=429,
                    detail="Rate limit exceeded. Please try again later.",
                )

        except Exception as e:
            # ✅ CRITICAL FAIL-OPEN SAFETY NET:
            # Agar Redis mein KOI BHI error aata hai, toh request BLOCK mat kar, ALLOW kar de.
            # Isse app kabhi bhi Redis ki wajah se crash nahi karegi.
            logger.error(f"❌ Rate limiter middleware error: {e}. Allowing request (Fail-Open).")

        # Proceed with the request no matter what
        return await call_next(request)