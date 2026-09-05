# backend/scripts/seed_massive_graph.py
import asyncio
import sys
import os
import re
import httpx

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.db.neo4j import neo4j_db
from loguru import logger

# 🛡️ Realistic Browser Headers to bypass Cloudflare 403
BROWSER_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "en-US,en;q=0.9",
    "Origin": "https://anilist.co",
    "Referer": "https://anilist.co/",
}

def clean_html(text: str) -> str:
    if not text: return ""
    clean = re.compile('<.*?>')
    return re.sub(clean, '', text).strip()

async def fetch_anilist_manga(page: int = 1, per_page: int = 50) -> list:
    """Fetch top manga from AniList with pagination and browser headers"""
    query = """
    query ($page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
            media(type: MANGA, sort: POPULARITY_DESC) {
                id
                title { romaji, english }
                chapters
                genres
            }
        }
    }
    """
    async with httpx.AsyncClient(timeout=30.0, headers=BROWSER_HEADERS) as client:
        res = await client.post(
            "https://graphql.anilist.co",
            json={"query": query, "variables": {"page": page, "perPage": per_page}}
        )
        if res.status_code == 403:
            logger.warning("⚠️ 403 Forbidden. AniList is blocking us. Waiting 10s and retrying...")
            await asyncio.sleep(10)
            res = await client.post(
                "https://graphql.anilist.co",
                json={"query": query, "variables": {"page": page, "perPage": per_page}}
            )
        res.raise_for_status()
        return res.json()["data"]["Page"]["media"]

async def fetch_manga_characters(anilist_id: int) -> list:
    """Fetch characters for a specific manga"""
    query = """
    query ($id: Int) {
        Media(id: $id, type: MANGA) {
            characters(sort: [FAVOURITES_DESC], perPage: 25) {
                nodes {
                    id
                    name { full, native }
                    description(asHtml: false)
                    gender
                    age
                }
            }
        }
    }
    """
    async with httpx.AsyncClient(timeout=30.0, headers=BROWSER_HEADERS) as client:
        res = await client.post(
            "https://graphql.anilist.co",
            json={"query": query, "variables": {"id": anilist_id}}
        )
        if res.status_code == 403:
            await asyncio.sleep(10)
            res = await client.post(
                "https://graphql.anilist.co",
                json={"query": query, "variables": {"id": anilist_id}}
            )
        res.raise_for_status()
        return res.json()["data"]["Media"]["characters"]["nodes"]

async def seed_massive_graph(total_pages: int = 10):
    """
    Seeds multiple pages of top manga.
    10 pages * 50 mangas = 500 Mangas * ~15-20 chars = ~7,500 to 10,000 Characters.
    Optimized for AniList's 90 requests/minute limit (51 requests per page = perfectly safe).
    """
    logger.info("🚀 Starting MASSIVE GraphRAG Seeding (AniList GraphQL with Anti-Block Headers)...")
    await neo4j_db.connect()

    # Create Constraints for faster MERGE operations
    await neo4j_db.execute_query("CREATE CONSTRAINT universe_id IF NOT EXISTS FOR (u:Universe) REQUIRE u.id IS UNIQUE")
    await neo4j_db.execute_query("CREATE CONSTRAINT character_id IF NOT EXISTS FOR (c:Character) REQUIRE c.id IS UNIQUE")

    total_chars_seeded = 0

    for page in range(1, total_pages + 1):
        logger.info(f"📡 Fetching AniList Manga Page {page}/{total_pages} (50 mangas/page)...")
        try:
            mangas = await fetch_anilist_manga(page=page, per_page=50)
        except Exception as e:
            logger.error(f"❌ Failed to fetch page {page}: {e}")
            continue

        for manga in mangas:
            mal_id = manga["id"]
            title = manga["title"]["romaji"] or manga["title"]["english"] or "Unknown"
            universe_id = f"universe_al_{mal_id}"

            # 1. Create Universe
            await neo4j_db.execute_query(
                "MERGE (u:Universe {id: $id}) SET u.title = $title, u.anilist_id = $anilist_id, u.genres = $genres",
                {"id": universe_id, "title": title, "anilist_id": mal_id, "genres": manga.get("genres", [])}
            )

            # 2. Fetch Characters
            try:
                characters = await fetch_manga_characters(mal_id)
                char_count = 0

                for char in characters:
                    char_name = char["name"]["full"]
                    if not char_name:
                        continue
                    char_id = f"char_al_{char['id']}"

                    # 3. Create Character
                    await neo4j_db.execute_query(
                        """
                        MERGE (c:Character {id: $id}) 
                        SET c.name = $name, c.description = $desc, c.gender = $gender, c.age = $age
                        """,
                        {
                            "id": char_id,
                            "name": char_name,
                            "desc": clean_html(char.get("description", ""))[:1500],
                            "gender": char.get("gender", "Unknown"),
                            "age": str(char.get("age", "Unknown"))
                        }
                    )

                    # 4. Link to Universe
                    await neo4j_db.execute_query(
                        "MATCH (c:Character {id: $cid}), (u:Universe {id: $uid}) MERGE (c)-[:BELONGS_TO]->(u)",
                        {"cid": char_id, "uid": universe_id}
                    )
                    char_count += 1

                total_chars_seeded += char_count
                logger.info(f"  ✅ {title}: Linked {char_count} characters.")

                # 🛡️ RATE LIMIT PROTECTION: 0.8s sleep keeps us well under 90 req/min limit
                await asyncio.sleep(0.8)

            except Exception as e:
                logger.warning(f"  ⚠️ Failed to fetch characters for {title}: {e}")
                continue

        logger.info(f"✅ Page {page} complete. Sleeping for 3s before next page...")
        await asyncio.sleep(3.0)

    logger.info(f"🎉 MASSIVE Seeding Complete! {total_chars_seeded} characters injected into the Multiverse.")
    await neo4j_db.close()

if __name__ == "__main__":
    # 10 pages * 50 mangas = 500 Mangas.
    # 500 Mangas * ~15-20 chars = ~7,500 to 10,000 Characters.
    # This will take about 10-15 minutes to run safely.
    asyncio.run(seed_massive_graph(total_pages=10))