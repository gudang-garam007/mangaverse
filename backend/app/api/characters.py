from fastapi import APIRouter, Query
from typing import List, Dict
from app.cache.character_cache import character_cache
from loguru import logger

router = APIRouter(prefix="/api/characters", tags=["Characters"])


def extract_stats_from_description(desc: str):
    """Extract stats from description"""
    if not desc:
        return {
            "strengths": [],
            "weaknesses": [],
            "power_level": 500,
            "speed": 50,
            "hax": 50,
            "battle_iq": 60
        }

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

    return {
        "strengths": strengths,
        "weaknesses": weaknesses,
        "power_level": power_level,
        "speed": speed,
        "hax": hax,
        "battle_iq": battle_iq
    }


@router.get("/search")
async def search_characters(
        q: str = Query(..., min_length=1),
        limit: int = Query(50, le=200)
):
    """Search characters from CACHE (instant response)"""

    # Get from cache (milliseconds)
    characters = character_cache.get_characters(q, limit)

    # Enrich with stats
    enriched = []
    for char in characters:
        stats = extract_stats_from_description(char.get('description', ''))

        enriched.append({
            "id": char['id'],
            "name": char['name'],
            "image_url": f"https://image.pollinations.ai/prompt/{char['name']}%20anime%20manga%20character%20portrait?width=400&height=600&nologo=true&seed={char['id']}",
            "universe": char['universe'],
            "gender": char['gender'],
            "age": char['age'],
            "description": char['description'][:300] + "..." if char['description'] else "",
            **stats
        })

    return {
        "characters": enriched,
        "total": len(enriched),
        "cached": True  # Tell frontend this came from cache
    }


@router.get("/universe/{universe_name}")
async def get_characters_by_universe(
        universe_name: str,
        limit: int = Query(50, le=200)
):
    """Get characters by universe from CACHE"""

    characters = character_cache.get_characters_by_universe(universe_name, limit)

    enriched = []
    for char in characters:
        stats = extract_stats_from_description(char.get('description', ''))

        enriched.append({
            "id": char['id'],
            "name": char['name'],
            "image_url": f"https://image.pollinations.ai/prompt/{char['name']}%20anime%20manga%20character?width=400&height=600&nologo=true&seed={char['id']}",
            "universe": char['universe'],
            "gender": char['gender'],
            "age": char['age'],
            **stats
        })

    return {
        "characters": enriched,
        "universe": universe_name,
        "total": len(enriched),
        "cached": True
    }


@router.get("/stats")
async def get_cache_stats():
    """Get cache statistics"""
    return {
        "characters_cached": character_cache.get_character_count(),
        "weapons_cached": character_cache.get_weapon_count(),
        "is_loading": character_cache.is_loading
    }