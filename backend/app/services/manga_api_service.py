# backend/app/services/manga_api_service.py
import httpx
import asyncio
from loguru import logger
from app.config import settings


class MangaAPIService:
    def __init__(self):
        self.jikan_url = settings.JIKAN_BASE_URL
        self.anilist_url = settings.ANILIST_BASE_URL

    async def get_top_manga_jikan(self, limit: int = 20) -> list:
        """Fetches top manga from Jikan (MyAnimeList)"""
        url = f"{self.jikan_url}/top/manga"
        params = {"limit": limit, "filter": "bypopularity"}

        async with httpx.AsyncClient(timeout=30.0) as client:
            res = await client.get(url, params=params)
            res.raise_for_status()
            return res.json().get("data", [])

    async def get_characters_anilist(self, anilist_id: int) -> list:
        """Fetches characters for a specific manga from AniList"""
        query = """
        query ($id: Int) {
            Media(id: $id, type: MANGA) {
                characters(sort: [FAVOURITES_DESC], perPage: 10) {
                    nodes {
                        id
                        name { full, native }
                        image { large }
                        description(asHtml: false)
                        gender
                        age
                    }
                }
            }
        }
        """
        async with httpx.AsyncClient(timeout=30.0) as client:
            res = await client.post(
                self.anilist_url,
                json={"query": query, "variables": {"id": anilist_id}}
            )
            res.raise_for_status()
            data = res.json()
            if "data" in data and data["data"]["Media"]:
                return data["data"]["Media"]["characters"]["nodes"]
            return []


manga_api_service = MangaAPIService()