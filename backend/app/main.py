from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from loguru import logger
import sys
import os
import asyncio

# Ensure the app directory is in the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.config import settings
from app.db.neo4j import neo4j_db
from app.db.qdrant import qdrant_db
from app.db.redis import redis_db
from app.middleware.rate_limiter import RateLimiterMiddleware
from app.middleware.logging import LoggingMiddleware


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 Starting MangaVerse Oracle...")

    # 1. Connect Neo4j
    try:
        await neo4j_db.connect()
        logger.info("✅ Neo4j connected")
    except Exception as e:
        logger.error(f"❌ Neo4j failed: {e}")

    # 2. Init Qdrant collections
    try:
        qdrant_db.init_collections()
        logger.info("✅ Qdrant collections ready")
    except Exception as e:
        logger.error(f"❌ Qdrant failed: {e}")

    # 3. Connect Redis (Gracefully handles missing URL or connection errors)
    try:
        await redis_db.connect()
        if redis_db.is_connected:
            logger.info("✅ Redis connected")
        else:
            logger.warning("⚠️ Redis is disabled (Fail-Open mode). Rate limiting and caching bypassed.")
    except Exception as e:
        logger.error(f"❌ Redis failed: {e}. Running in degraded mode.")

    logger.info("🎌 MangaVerse Oracle is LIVE!")
    yield

    # Shutdown
    logger.info("🛑 Shutting down...")
    try:
        await neo4j_db.close()
        await redis_db.close()
        logger.info("✅ Shutdown complete")
    except Exception:
        pass


app = FastAPI(
    title="MangaVerse Oracle API",
    description="The World's First Manga Intelligence & Style Transfer Platform",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "https://mangaverse-tau-umber.vercel.app",
        "https://manga-ta.vercel.app",
        "https://mangaverse-backend.onrender.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(RateLimiterMiddleware)
app.add_middleware(LoggingMiddleware)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


@app.api_route("/health", methods=["GET", "HEAD"])
async def health_check():
    health = {"status": "healthy", "services": {}}

    # Redis Status
    if redis_db.is_connected:
        health["services"]["redis"] = "✅"
    else:
        health["services"]["redis"] = "❌ (Fail-Open)"
        health["status"] = "degraded"

    # Qdrant Status
    try:
        # Run sync qdrant call in a thread to avoid blocking async event loop
        await asyncio.to_thread(qdrant_db.client.get_collections)
        health["services"]["qdrant"] = "✅"
    except Exception:
        health["services"]["qdrant"] = "❌"
        health["status"] = "degraded"

    # Neo4j Status
    try:
        if neo4j_db.driver:
            health["services"]["neo4j"] = "✅"
        else:
            health["services"]["neo4j"] = "❌"
            health["status"] = "degraded"
    except Exception:
        health["services"]["neo4j"] = "❌"

    return health


@app.get("/")
async def root():
    return {"message": "🎌 MangaVerse Oracle API v1.0.0", "docs": "/docs"}


# 🚀 BULLETPROOF ROUTER REGISTRATION
# Ye try-except blocks ensure karenge ki agar ek feature fail bhi ho, baaki sab kaam karenge.

# 1. Auth
try:
    from app.api import auth

    app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
except Exception as e:
    logger.warning(f"⚠️ Auth router skipped: {e}")

# 2. Battle Arena (CRITICAL)
try:
    from app.api import battle

    app.include_router(battle.router, prefix="/api/battle", tags=["Battle Arena"])
    logger.info("✅ Battle Arena routes registered")
except Exception as e:
    logger.warning(f"⚠️ Battle router skipped: {e}")

# 3. Panel Intelligence
try:
    from app.api import panel

    app.include_router(panel.router, prefix="/api/panel", tags=["Panel Intelligence"])
except Exception as e:
    logger.warning(f"⚠️ Panel router skipped: {e}")

# 4. Style Transfer (CRITICAL)
try:
    from app.api import convert

    app.include_router(convert.router, prefix="/api/convert", tags=["Style Transfer"])
    logger.info("✅ Style Transfer routes registered")
except Exception as e:
    logger.warning(f"⚠️ Convert router skipped: {e}")

# 5. Character Chat
try:
    from app.api import chat

    app.include_router(chat.router, prefix="/api/chat", tags=["Character Chat"])
except Exception as e:
    logger.warning(f"⚠️ Chat router skipped: {e}")

# 6. What-If
try:
    from app.api import whatif

    app.include_router(whatif.router, prefix="/api/whatif", tags=["What-If Scenarios"])
except Exception as e:
    logger.warning(f"⚠️ WhatIf router skipped: {e}")

# 7. Manga DNA
try:
    from app.api import dna

    app.include_router(dna.router, prefix="/api/dna", tags=["Manga DNA"])
except Exception as e:
    logger.warning(f"⚠️ DNA router skipped: {e}")

# 8. Fan Theory
try:
    from app.api import theory

    app.include_router(theory.router, prefix="/api/theory", tags=["Fan Theory"])
except Exception as e:
    logger.warning(f"⚠️ Theory router skipped: {e}")

# 9. Learning
try:
    from app.api import learn

    app.include_router(learn.router, prefix="/api/learn", tags=["Learning"])
except Exception as e:
    logger.warning(f"⚠️ Learn router skipped: {e}")

# 10. Universe
try:
    from app.api import universe

    app.include_router(universe.router, prefix="/api/universe", tags=["Universe"])
except Exception as e:
    logger.warning(f"⚠️ Universe router skipped: {e}")

# 11. Feed
try:
    from app.api import feed

    app.include_router(feed.router, prefix="/api/feed", tags=["Feed"])
except Exception as e:
    logger.warning(f"⚠️ Feed router skipped: {e}")

# 12. Payments
try:
    from app.api import payments

    app.include_router(payments.router, prefix="/api/payments", tags=["Payments"])
except Exception as e:
    logger.warning(f"⚠️ Payments router skipped: {e}")

# 13. News (FIXED: Wrapped in try-except)
try:
    from app.api import news

    app.include_router(news.router, prefix="/api/news", tags=["Manga News"])
    logger.info("✅ News routes registered")
except Exception as e:
    logger.warning(f"⚠️ News router skipped: {e}")

# 14. MangaLdle Game (FIXED: Wrapped in try-except)
try:
    from app.api import game

    app.include_router(game.router, prefix="/api/game", tags=["MangaLdle Game"])
    logger.info("✅ MangaLdle Game routes registered")
except Exception as e:
    logger.warning(f"⚠️ Game router skipped: {e}")

# 15. Weapons (FIXED: Wrapped in try-except)
try:
    from app.api import weapons

    app.include_router(weapons.router, prefix="/api/weapons", tags=["Weapons"])
    logger.info("✅ Weapons routes registered")
except Exception as e:
    logger.warning(f"⚠️ Weapons router skipped: {e}")

# 16. Characters (NEW: Neo4j Cache API)
try:
    from app.api import characters

    app.include_router(characters.router)
    logger.info("✅ Characters routes registered")
except Exception as e:
    logger.warning(f"⚠️ Characters router skipped: {e}")