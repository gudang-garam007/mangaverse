import asyncio
from urllib.parse import quote as encodeURIComponent
from fastapi import APIRouter, Query
from typing import List, Dict
from app.cache.character_cache import character_cache
from loguru import logger

router = APIRouter(prefix="/api/characters", tags=["Characters"])

# 🚨 EMERGENCY FALLBACK DATA
FALLBACK_CHARACTERS = [
    {"id": "fb_1", "name": "Monkey D. Luffy", "universe": "One Piece", "gender": "Male", "age": "19",
     "description": "Captain with rubber powers and immense willpower.", "strengths": ["Haki", "Rubber Body"],
     "weaknesses": ["Sea Water"], "power_level": 950, "speed": 90, "hax": 85, "battle_iq": 70},
    {"id": "fb_2", "name": "Naruto Uzumaki", "universe": "Naruto", "gender": "Male", "age": "17",
     "description": "Seventh Hokage with massive chakra reserves.", "strengths": ["Rasengan", "Sage Mode"],
     "weaknesses": ["Reckless"], "power_level": 900, "speed": 95, "hax": 80, "battle_iq": 75},
    {"id": "fb_3", "name": "Son Goku", "universe": "Dragon Ball", "gender": "Male", "age": "Unknown",
     "description": "Saiyan warrior and protector of Earth.", "strengths": ["Ki", "Super Saiyan"],
     "weaknesses": ["Naive"], "power_level": 1000, "speed": 100, "hax": 90, "battle_iq": 80},
    {"id": "fb_4", "name": "Satoru Gojo", "universe": "Jujutsu Kaisen", "gender": "Male", "age": "28",
     "description": "The strongest Jujutsu Sorcerer alive.", "strengths": ["Limitless", "Six Eyes"],
     "weaknesses": ["Sealing"], "power_level": 980, "speed": 95, "hax": 100, "battle_iq": 90},
    {"id": "fb_5", "name": "Ichigo Kurosaki", "universe": "Bleach", "gender": "Male", "age": "15",
     "description": "Substitute Soul Reaper with immense spiritual pressure.", "strengths": ["Zangetsu", "Bankai"],
     "weaknesses": ["Emotional"], "power_level": 920, "speed": 92, "hax": 85, "battle_iq": 78},
]


def extract_stats_from_description(desc: str):
    if not desc:
        return {"strengths": [], "weaknesses": [], "power_level": 500, "speed": 50, "hax": 50, "battle_iq": 60}

    desc_lower = desc.lower()
    strength_kws = ["strong", "power", "master", "expert", "enhanced", "superhuman", "immense", "haki", "chakra", "ki",
                    "god", "legendary"]
    weakness_kws = ["weakness", "weak", "vulnerable", "limitation", "drawback", "cannot", "afraid", "fear", "sea water",
                    "reckless", "impulsive"]

    strengths = list(set([kw.capitalize() for kw in strength_kws if kw in desc_lower]))[:5]
    weaknesses = list(set([kw.capitalize() for kw in weakness_kws if kw in desc_lower]))[:3]

    power_level = 500
    if any(w in desc_lower for w in ['god', 'strongest', 'legendary']):
        power_level += 300
    elif any(w in desc_lower for w in ['elite', 'captain', 'commander']):
        power_level += 150
    power_level = min(power_level, 1000)

    speed = 85 if any(w in desc_lower for w in ['fast', 'speed', 'quick', 'instant']) else (
        35 if 'slow' in desc_lower else 50)
    hax = 90 if any(w in desc_lower for w in ['reality', 'time', 'space', 'dimension', 'mind control']) else 50
    battle_iq = 90 if any(w in desc_lower for w in ['strategist', 'tactical', 'genius', 'brilliant']) else (
        30 if 'reckless' in desc_lower else 60)

    return {"strengths": strengths, "weaknesses": weaknesses, "power_level": power_level, "speed": speed, "hax": hax,
            "battle_iq": battle_iq}


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

        # Fallback agar Neo4j empty return kare
        if not characters:
            logger.warning("⚠️ Neo4j returned empty. Serving fallback data.")
            characters = [{"id": c["id"], "name": c["name"], "description": c["description"], "gender": c["gender"],
                           "age": c["age"], "universe": c["universe"]} for c in FALLBACK_CHARACTERS]

    except asyncio.TimeoutError:
        logger.error("❌ Neo4j Timeout! Serving fallback data immediately.")
        characters = [
            {"id": c["id"], "name": c["name"], "description": c["description"], "gender": c["gender"], "age": c["age"],
             "universe": c["universe"]} for c in FALLBACK_CHARACTERS]
    except Exception as e:
        logger.error(f"❌ Neo4j Error: {e}. Serving fallback data.")
        characters = [
            {"id": c["id"], "name": c["name"], "description": c["description"], "gender": c["gender"], "age": c["age"],
             "universe": c["universe"]} for c in FALLBACK_CHARACTERS]

    enriched = []
    for char in characters:
        stats = extract_stats_from_description(char.get('description', ''))

        # ✅ SAFE IMAGE URL: Special characters ko properly encode karo
        name_clean = char['name'].replace("'", "").replace('"', '').strip()
        encoded_name = encodeURIComponent(name_clean)
        image_url = f"https://image.pollinations.ai/prompt/anime%20manga%20character%20{encoded_name}%20portrait%20shonen%20style%20high%20quality?width=400&height=600&nologo=true&seed={abs(hash(char['id'])) % 10000}"

        enriched.append({
            "id": char['id'],
            "name": char['name'],
            "image_url": image_url,
            "universe": char['universe'],
            "gender": char['gender'],
            "age": char['age'],
            "description": char['description'][:300] + "..." if char['description'] else "",
            **stats
        })

    return {"characters": enriched, "total": len(enriched), "cached": True}


@router.get("/universe/{universe_name}")
async def get_characters_by_universe(
        universe_name: str,
        limit: int = Query(50, le=200),
        offset: int = Query(0, ge=0)  # ✅ Offset add kiya
):
    try:
        characters = await asyncio.wait_for(
            character_cache.get_or_fetch_by_universe(universe_name, limit, offset),
            timeout=5.0
        )
        if not characters:
            characters = [{"id": c["id"], "name": c["name"], "description": c["description"], "gender": c["gender"],
                           "age": c["age"], "universe": c["universe"]} for c in FALLBACK_CHARACTERS]
    except Exception as e:
        logger.error(f"❌ Universe Fetch Error: {e}. Serving fallback.")
        characters = [
            {"id": c["id"], "name": c["name"], "description": c["description"], "gender": c["gender"], "age": c["age"],
             "universe": c["universe"]} for c in FALLBACK_CHARACTERS]

    enriched = []
    for char in characters:
        stats = extract_stats_from_description(char.get('description', ''))

        name_clean = char['name'].replace("'", "").replace('"', '').strip()
        encoded_name = encodeURIComponent(name_clean)
        image_url = f"https://image.pollinations.ai/prompt/anime%20manga%20character%20{encoded_name}%20portrait%20shonen%20style%20high%20quality?width=400&height=600&nologo=true&seed={abs(hash(char['id'])) % 10000}"

        enriched.append({
            "id": char['id'],
            "name": char['name'],
            "image_url": image_url,
            "universe": char['universe'],
            "gender": char['gender'],
            "age": char['age'],
            **stats
        })

    return {"characters": enriched, "universe": universe_name, "total": len(enriched), "cached": True}