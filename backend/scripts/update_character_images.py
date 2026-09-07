import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import asyncio
import aiohttp
import re
import neo4j

# ====================== CONFIG ======================
TENRAI_BASE = "https://api.tenrai.org/v1"
DELAY = 2.0                  # seconds between requests
BATCH_LIMIT = 10000            # pehle 300 se test karo

NEO4J_URI = os.getenv("NEO4J_URI", "neo4j+s://32c5ac7c.databases.neo4j.io")
NEO4J_USER = os.getenv("NEO4J_USER", "32c5ac7c")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "DhFCyr78OktTSwKlfZvaO6yUP_3GHGX-0BgP-QTUsKU")
# ====================================================


def clean_description(text: str) -> str:
    if not text:
        return "No description available."

    clean = str(text)
    clean = re.sub(r'<[^>]+>', '', clean)                                  # HTML tags
    clean = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', clean)                 # [Name](url) → Name
    clean = re.sub(r'https?://anilist\.co/character/\d+/[^\s)]+', '', clean, flags=re.IGNORECASE)
    clean = re.sub(r'\[Spoiler\].*?\[/Spoiler\]', '', clean, flags=re.IGNORECASE | re.DOTALL)
    clean = re.sub(r'\[.*?\]', '', clean)
    clean = re.sub(r'\n+', ' ', clean)
    clean = re.sub(r'\s+', ' ', clean).strip()

    if len(clean) > 400:
        clean = clean[:397].rsplit(' ', 1)[0] + "..."

    return clean if clean else "No description available."


async def search_character(session: aiohttp.ClientSession, name: str):
    try:
        url = f"{TENRAI_BASE}/characters"
        params = {"q": name, "limit": 5}

        async with session.get(url, params=params, timeout=aiohttp.ClientTimeout(total=12)) as resp:
            if resp.status != 200:
                print(f"HTTP {resp.status}", end=" ")
                return None

            data = await resp.json()
            results = data.get("data", [])

            if not results:
                return None

            # Best match
            name_lower = name.lower().strip()
            exact = next(
                (c for c in results if name_lower in c.get("name", "").lower()),
                results[0]
            )

            images = exact.get("images", {})
            image_url = (
                images.get("jpg", {}).get("image_url")
                or images.get("webp", {}).get("image_url")
            )

            if not image_url:
                return None

            return {
                "image_url": image_url,
                "about": exact.get("about"),
            }

    except Exception as e:
        print(f"Error: {e}", end=" ")
        return None


async def main():
    print("🚀 Starting character image update in Neo4j...\n")

    driver = neo4j.AsyncGraphDatabase.driver(
        NEO4J_URI,
        auth=(NEO4J_USER, NEO4J_PASSWORD)
    )

    try:
        await driver.verify_connectivity()
        print("✅ Connected to Neo4j successfully.\n")

        query = """
        MATCH (c:Character)
        WHERE c.image_url IS NULL 
           OR c.image_url = '' 
           OR toLower(c.image_url) CONTAINS 'dicebear' 
           OR toLower(c.image_url) CONTAINS 'placeholder'
           OR toLower(c.image_url) CONTAINS 'null'
        RETURN c.id AS id, c.name AS name, c.description AS description
        LIMIT $limit
        """

        async with driver.session() as session:
            result = await session.run(query, limit=BATCH_LIMIT)
            records = [record.data() async for record in result]

        print(f"Found {len(records)} characters to update.\n")

        if not records:
            print("No characters need updating.")
            return

        updated = 0
        failed = 0

        async with aiohttp.ClientSession() as http_session:
            for i, record in enumerate(records, 1):
                char_id = record["id"]
                char_name = record["name"]
                current_desc = record.get("description") or ""

                print(f"[{i}/{len(records)}] 🔍 {char_name}...", end=" ", flush=True)

                data = await search_character(http_session, char_name)

                if data and data.get("image_url"):
                    new_desc = clean_description(data["about"]) if data.get("about") else current_desc

                    update_query = """
                    MATCH (c:Character {id: $id})
                    SET c.image_url = $image_url,
                        c.description = $description
                    """
                    async with driver.session() as sess:
                        await sess.run(
                            update_query,
                            id=char_id,
                            image_url=data["image_url"],
                            description=new_desc
                        )

                    updated += 1
                    print("✅ Updated")
                else:
                    failed += 1
                    print("❌ No image found")

                await asyncio.sleep(DELAY)

        print("\n" + "=" * 50)
        print(f"✅ Successfully updated : {updated}")
        print(f"❌ Failed / Not found   : {failed}")
        print("=" * 50)

    finally:
        await driver.close()


if __name__ == "__main__":
    asyncio.run(main())