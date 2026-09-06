# backend/app/config.py
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List
import json
from pathlib import Path

# ✅ YE 2 LINES ADD KAR: Ye hamesha backend folder ka exact path nikalega
BASE_DIR = Path(__file__).resolve().parent.parent
ENV_FILE_PATH = BASE_DIR / ".env"

class Settings(BaseSettings):
    # ✅ FIX: Ignore extra environment variables to prevent crashes
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True, extra="ignore")

    # Environment
    ENVIRONMENT: str = "development"
    DEBUG: bool = False

    # App
    APP_NAME: str = "MangaVerse Oracle"
    APP_VERSION: str = "1.0.0"

    # CORS
    CORS_ORIGINS: str = '["http://localhost:3000","http://localhost:8000"]'

    @property
    def cors_origins_list(self) -> List[str]:
        return json.loads(self.CORS_ORIGINS)

    # PostgreSQL
    POSTGRES_USER: str = "mangaverse"
    POSTGRES_PASSWORD: str = "mangaverse_secret_2026"
    POSTGRES_DB: str = "mangaverse_db"
    POSTGRES_URL: str = "postgresql+asyncpg://mangaverse:mangaverse_secret_2026@postgres:5432/mangaverse_db"


    # Neo4j
    # Neo4j
    NEO4J_URI: str = "neo4j+s://32c5ac7c.databases.neo4j.io"
    NEO4J_USER: str = "32c5ac7c"
    NEO4J_PASSWORD: str = "DhFCyr78OktTSwKlfZvaO6yUP_3GHGX-0BgP-QTUsKU"
    NEO4J_DATABASE: str = "32c5ac7c"

    # Qdrant
    QDRANT_URL: str = "http://qdrant:6333"

    # Redis
    REDIS_URL: str = "redis://redis:6379/0"

    # AI APIs
    GROQ_API_KEY: str = ""
    MISTRAL_API_KEY: str = ""
    FAL_API_KEY: str = ""
    HF_API_KEY: str = ""
    # Image Generation
    POLLINATIONS_BASE_URL: str = "https://image.pollinations.ai/prompt"

    # Manga APIs
    JIKAN_BASE_URL: str = "https://api.jikan.moe/v4"
    ANILIST_BASE_URL: str = "https://graphql.anilist.co"

    # Auth
    JWT_SECRET_KEY: str = "CHANGE_THIS_TO_RANDOM_STRING_1234567890"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 10080

    # Celery
    CELERY_BROKER_URL: str = "redis://redis:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://redis:6379/2"

    # Rate Limit
    RATE_LIMIT_PER_MINUTE: int = 60

    # Sentry
    SENTRY_DSN: str = ""

settings = Settings()