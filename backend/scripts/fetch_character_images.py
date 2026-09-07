import asyncio
import aiohttp
from sqlalchemy import create_engine, text
from app.db.neo4j import neo4j_db
import os
import time


async def fetch_image_from_tenrai(session, character_name):
    """Fetch character image from Tenrai API"""
    try:
        url = "https://tenrai.moe/api/v1/characters"
        params = {"search": character_name, "limit": 1}

        async with session.get(url, params=params, timeout=10) as resp:
            if resp.status == 200:
                data = await resp.json()
                if data.get('data'):
                    char_data = data['data'][0]
                    image_url = char_data.get('attributes', {}).get('image', {}).get('large')
                    return image_url
    except Exception as e:
        print(f"Error fetching {character_name}: {e}")

    return None


async def update_all_character_images():
    """Fetch and update images for all characters"""
    print("🚀 Starting image fetch for all characters...")

    await neo4j_db.connect(
        os.getenv("NEO4J_URI"),
        os.getenv("NEO4J_USER"),
        os.getenv("NEO4J_PASSWORD")
    )

    # Get all characters
    result = await neo4j_db.execute_query("""
        MATCH (c:Character)
        RETURN c.id as id, c.name as name
    """)

    characters = result

    print(f"Found {len(characters)} characters")

    async with aiohttp.ClientSession() as session:
        for i, char in enumerate(characters, 1):
            print(f"[{i}/{len(characters)}] Fetching image for: {char['name']}")

            image_url = await fetch_image_from_tenrai(session, char['name'])

            if image_url:
                # Update in Neo4j
                await neo4j_db.execute_query("""
                    MATCH (c:Character {id: $id})
                    SET c.image_url = $image_url
                """, {"id": char['id'], "image_url": image_url})
                print(f"  ✅ Updated: {image_url}")
            else:
                print(f"  ️ No image found")

            # Rate limiting
            await asyncio.sleep(2.5)

    await neo4j_db.close()
    print("✅ Image fetch complete!")


if __name__ == "__main__":
    asyncio.run(update_all_character_images())