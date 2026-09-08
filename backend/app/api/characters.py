import asyncio
import re
from urllib.parse import quote as encodeURIComponent
from fastapi import APIRouter, Query
from typing import List, Dict
from app.cache.character_cache import character_cache
from loguru import logger
from fastapi import APIRouter, Query, HTTPException

router = APIRouter(prefix="/api/characters", tags=["Characters"])


def clean_description(desc: str) -> str:
    """Clean HTML, markdown, and format description properly with smart truncation"""
    if not desc:
        return "No description available."

    clean = str(desc)

    # 1. Remove HTML tags
    clean = re.sub(r'<[^>]+>', '', clean)

    # 2. Remove markdown links [Name](url) -> Name
    clean = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', clean)

    # 3. Remove AniList character URLs
    clean = re.sub(r'https?://anilist\.co/character/\d+/[^\s)]+', '', clean, flags=re.IGNORECASE)

    # 4. Remove any remaining brackets
    clean = re.sub(r'\[.*?\]', '', clean)

    # 5. Clean newlines and multiple spaces
    clean = re.sub(r'\n+', ' ', clean)
    clean = re.sub(r'\s+', ' ', clean)
    clean = clean.strip()

    # 6. ✅ SMART TRUNCATION: Complete sentence, no mid-word cut
    if len(clean) > 450:
        truncated = clean[:450]
        last_period = truncated.rfind('.')

        if last_period > 350:  # Agar reasonable range mein period hai
            clean = truncated[:last_period + 1]  # Period ke saath cut karo
        else:
            # Warna last space par cut karo
            last_space = truncated.rfind(' ')
            if last_space > 350:
                clean = truncated[:last_space] + "..."
            else:
                clean = truncated + "..."

    return clean if clean else "No description available."


def extract_personality_traits(desc: str) -> Dict:
    """Extract personality traits, strengths, and weaknesses from cleaned description"""
    # Always clean first to avoid matching keywords inside HTML/URLs
    clean_desc = clean_description(desc)
    desc_lower = clean_desc.lower()

    if not desc_lower or desc_lower == "no description available.":
        return {"traits": [], "strengths": [], "weaknesses": []}

    # Personality traits mapping
    trait_keywords = {
        "Brave": ["brave", "courageous", "fearless", "heroic"],
        "Intelligent": ["intelligent", "genius", "smart", "clever", "strategic", "tactical"],
        "Kind": ["kind", "compassionate", "gentle", "caring", "protective"],
        "Determined": ["determined", "persistent", "resilient", "never give up", "strong-willed"],
        "Reckless": ["reckless", "impulsive", "rash", "careless", "hot-headed"],
        "Serious": ["serious", "stoic", "cold", "reserved", "calm"],
        "Cheerful": ["cheerful", "optimistic", "energetic", "happy", "goofy"],
        "Mysterious": ["mysterious", "enigmatic", "secretive", "hidden"]
    }

    # Strength & Weakness keywords
    strength_keywords = ["power", "ability", "skill", "master", "expert", "enhanced", "strong", "haki", "chakra", "ki", "magic", "stamina"]
    weakness_keywords = ["weakness", "weak", "cannot", "unable", "afraid", "fear", "limitation", "vulnerable", "drawback"]

    # Extract unique traits
    traits = [trait for trait, keywords in trait_keywords.items() if any(kw in desc_lower for kw in keywords)]

    # Extract unique strengths/weaknesses (capitalize first letter)
    strengths = list(set([kw.capitalize() for kw in strength_keywords if kw in desc_lower]))[:5]
    weaknesses = list(set([kw.capitalize() for kw in weakness_keywords if kw in desc_lower]))[:3]

    return {
        "traits": traits[:4],
        "strengths": strengths,
        "weaknesses": weaknesses
    }


@router.get("/search")
async def search_characters(
        q: str = Query("a", min_length=1),
        limit: int = Query(50, le=200),
        offset: int = Query(0, ge=0)
):
    try:
        characters = await asyncio.wait_for(
            character_cache.get_or_fetch_characters(q, limit, offset),
            timeout=5.0
        )
        if not characters:
            characters = []
    except asyncio.TimeoutError:
        logger.error("❌ Neo4j Timeout on /search!")
        characters = []
    except Exception as e:
        logger.error(f"❌ Neo4j Error on /search: {e}")
        characters = []

    enriched = []
    for char in characters:
        desc = char.get('description', '')

        # Clean and extract
        clean_desc = clean_description(desc)
        personality = extract_personality_traits(desc)

        # ✅ CRITICAL FIX: Use Database Image if it exists and is valid
        db_image = char.get('image_url', '')
        if db_image and not any(bad in db_image.lower() for bad in ['pollinations', 'dicebear', 'placeholder', 'null', 'none']):
            image_url = db_image  # Use the real Tenrai/MyAnimeList image!
        else:
            # Fallback to Pollinations ONLY if DB image is missing or invalid
            name_clean = char['name'].replace("'", "").replace('"', '').strip()
            encoded_name = encodeURIComponent(name_clean)
            image_url = (
                f"https://image.pollinations.ai/prompt/"
                f"anime%20manga%20character%20{encoded_name}%20portrait%20high%20quality%20detailed%20art?"
                f"width=400&height=600&nologo=true&seed={abs(hash(char['id'])) % 10000}"
            )

        enriched.append({
            "id": str(char['id']),
            "name": char['name'],
            "image_url": image_url,
            "universe": char['universe'] or 'Unknown',
            "gender": char['gender'] or 'Unknown',
            "age": char['age'] or 'Unknown',
            "description": clean_desc,
            "personality_traits": personality['traits'],
            "strengths": personality['strengths'],
            "weaknesses": personality['weaknesses']
        })

    return {"characters": enriched, "total": len(enriched), "cached": True}


@router.get("/universe/{universe_name}")
async def get_characters_by_universe(
        universe_name: str,
        limit: int = Query(50, le=200),
        offset: int = Query(0, ge=0)
):
    try:
        characters = await asyncio.wait_for(
            character_cache.get_or_fetch_by_universe(universe_name, limit, offset),
            timeout=5.0
        )
        if not characters:
            characters = []
    except Exception as e:
        logger.error(f"❌ Universe Fetch Error: {e}")
        characters = []

    enriched = []
    for char in characters:
        desc = char.get('description', '')

        # Clean and extract
        clean_desc = clean_description(desc)
        personality = extract_personality_traits(desc)

        # ✅ CRITICAL FIX: Use Database Image if it exists and is valid
        db_image = char.get('image_url', '')
        if db_image and not any(bad in db_image.lower() for bad in ['pollinations', 'dicebear', 'placeholder', 'null', 'none']):
            image_url = db_image  # Use the real Tenrai/MyAnimeList image!
        else:
            # Fallback to Pollinations ONLY if DB image is missing or invalid
            name_clean = char['name'].replace("'", "").replace('"', '').strip()
            encoded_name = encodeURIComponent(name_clean)
            image_url = (
                f"https://image.pollinations.ai/prompt/"
                f"anime%20manga%20character%20{encoded_name}%20portrait%20high%20quality?"
                f"width=400&height=600&nologo=true&seed={abs(hash(char['id'])) % 10000}"
            )

        enriched.append({
            "id": str(char['id']),
            "name": char['name'],
            "image_url": image_url,
            "universe": char['universe'] or 'Unknown',
            "gender": char['gender'] or 'Unknown',
            "age": char['age'] or 'Unknown',
            "description": clean_desc,
            "personality_traits": personality['traits'],
            "strengths": personality['strengths'],
            "weaknesses": personality['weaknesses']
        })

    return {"characters": enriched, "universe": universe_name, "total": len(enriched), "cached": True}


@router.get("/list")
async def get_character_list(limit: int = Query(120, le=500)):
    """Fetch characters with images directly from Neo4j DB for Chat sidebar"""
    query = """
    MATCH (c:Character)
    OPTIONAL MATCH (c)-[:BELONGS_TO]->(u:Universe)
    RETURN c.name as name, c.image_url as image_url, u.title as universe
    ORDER BY c.name
    LIMIT $limit
    """

    try:
        records = await neo4j_db.execute_query(query, {"limit": limit})

        characters = []
        for i, record in enumerate(records):
            img = record.get("image_url", "")

            # Agar DB mein image nahi hai ya invalid hai, toh Pollinations use karo
            if not img or any(
                    bad in img.lower() for bad in ['pollinations', 'dicebear', 'placeholder', 'null', 'none', '']):
                name_clean = record['name'].replace("'", "").replace('"', '').strip()
                img = f"https://image.pollinations.ai/prompt/anime%20{encodeURIComponent(name_clean)}%20portrait?width=100&height=100&nologo=true&seed={i}"

            characters.append({
                "id": str(i),
                "name": record["name"] or "Unknown",
                "universe": record["universe"] or "Manga",
                "image_url": img
            })

        return {"characters": characters, "total": len(characters)}
    except Exception as e:
        logger.error(f"❌ Failed to fetch character list: {e}")
        raise HTTPException(status_code=500, detail="Database error")