# backend/app/api/news.py
from fastapi import APIRouter, HTTPException
from app.services.news_service import manga_news_service
from loguru import logger

router = APIRouter()

@router.get("/latest")
async def get_latest_news():
    """Get latest manga news from all sources"""
    try:
        news = await manga_news_service.get_all_news()
        return {"news": news, "count": len(news), "status": "success"}
    except Exception as e:
        logger.error(f"Failed to fetch news: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch manga news")

@router.get("/cached")
async def get_cached_news():
    """Get cached news (for faster loading)"""
    # This can be implemented with Redis caching later
    return await get_latest_news()