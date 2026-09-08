import json
import hashlib
import re
import random
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional
from app.db.neo4j import neo4j_db
from app.services.llm_service import llm_service
from loguru import logger

router = APIRouter()


@router.get("/all")
async def get_all_weapons():
    """Get all weapons from database"""
    try:
        query = """
        MATCH (w:Weapon)
        RETURN w.name as name, w.owner as owner, w.anime as anime,
               w.type as type, w.power as power, w.speed as speed,
               w.hax as hax, w.ability as ability, w.weakness as weakness,
               w.lore as lore
        ORDER BY w.power DESC
        """
        results = await neo4j_db.execute_query(query)
        return {"weapons": results, "total": len(results), "status": "success"}
    except Exception as e:
        logger.error(f"Weapons fetch error: {e}")
        raise HTTPException(500, str(e))


@router.get("/search")
async def search_weapons(q: str = Query(..., min_length=1)):
    """Search weapons by name, owner, or anime"""
    try:
        query = """
        MATCH (w:Weapon)
        WHERE toLower(w.name) CONTAINS toLower($q)
           OR toLower(w.owner) CONTAINS toLower($q)
           OR toLower(w.anime) CONTAINS toLower($q)
        RETURN w.name as name, w.owner as owner, w.anime as anime,
               w.type as type, w.power as power, w.speed as speed,
               w.hax as hax, w.ability as ability, w.weakness as weakness,
               w.lore as lore
        ORDER BY w.power DESC
        LIMIT 20
        """
        results = await neo4j_db.execute_query(query, {"q": q.strip()})
        return {"weapons": results, "status": "success"}
    except Exception as e:
        logger.error(f"Weapon search error: {e}")
        return {"weapons": [], "status": "success"}


@router.get("/battle")
async def weapon_battle(weapon1: str, weapon2: str):
    """Simulate a battle between two weapons with AI Verdict"""
    try:
        query = """
        MATCH (w:Weapon)
        WHERE toLower(w.name) CONTAINS toLower($name)
        RETURN w.name as name, w.power as power, w.speed as speed,
               w.hax as hax, w.ability as ability, w.owner as owner
        LIMIT 1
        """
        w1_res = await neo4j_db.execute_query(query, {"name": weapon1})
        w2_res = await neo4j_db.execute_query(query, {"name": weapon2})

        if not w1_res or not w2_res:
            return {"error": "One or both weapons not found", "status": "error"}

        w1, w2 = w1_res[0], w2_res[0]

        # Calculate battle score
        score1 = (w1.get("power", 0) * 0.4 + w1.get("speed", 0) * 0.3 + w1.get("hax", 0) * 0.3)
        score2 = (w2.get("power", 0) * 0.4 + w2.get("speed", 0) * 0.3 + w2.get("hax", 0) * 0.3)

        # Add randomness (±15%) for dynamic outcomes
        score1 *= random.uniform(0.85, 1.15)
        score2 *= random.uniform(0.85, 1.15)

        winner = w1 if score1 > score2 else w2
        loser = w2 if score1 > score2 else w1
        win_chance = max(score1, score2) / (score1 + score2) * 100

        # ✅ NEW: Generate Epic AI Battle Verdict
        verdict_prompt = f"""Write a short, epic, 2-sentence manga battle verdict.
Winner: {winner['name']} (Owner: {winner['owner']}, Ability: {winner['ability']})
Loser: {loser['name']} (Owner: {loser['owner']}, Ability: {loser['ability']})
Make it dramatic, mentioning how the winner's ability overpowered the loser. Keep it under 40 words."""

        try:
            ai_verdict = await llm_service.generate(verdict_prompt, max_tokens=100, temperature=0.8)
        except Exception as e:
            logger.warning(f"AI verdict failed, using fallback: {e}")
            ai_verdict = f"{winner['name']} completely overwhelmed {loser['name']} with sheer tactical superiority!"

        return {
            "weapon1": w1,
            "weapon2": w2,
            "winner": winner["name"],
            "loser": loser["name"],
            "win_chance": round(win_chance, 1),
            "score1": round(score1, 1),
            "score2": round(score2, 1),
            "verdict": ai_verdict.strip(),  # ✅ Frontend can use this!
            "status": "success"
        }
    except Exception as e:
        logger.error(f"Battle error: {e}")
        raise HTTPException(500, str(e))


class WeaponQuizRequest(BaseModel):
    answers: dict


@router.post("/quiz")
async def weapon_quiz(req: WeaponQuizRequest):
    """Generate a personalized weapon based on quiz answers"""
    try:
        answers = req.answers
        style = answers.get("style", "balanced")
        element = answers.get("element", "fire")
        personality = answers.get("personality", "calm")
        range_pref = answers.get("range", "melee")

        prompt = f"""Create a unique manga weapon for a warrior with these traits:
- Fighting Style: {style}
- Element: {element}
- Personality: {personality}
- Range: {range_pref}

Return STRICT JSON only (no markdown, no extra text):
{{
  "name": "Creative weapon name",
  "type": "Weapon type",
  "power": 1-1000,
  "speed": 1-100,
  "hax": 1-100,
  "ability": "One special ability description",
  "weakness": "One weakness",
  "lore": "2 sentence epic backstory",
  "visual": "Visual description for image generation (e.g., glowing red katana with fire effects)"
}}"""

        response = await llm_service.generate(prompt, max_tokens=500, temperature=0.9)

        # ✅ ENHANCED: Bulletproof JSON extraction (handles ```json ... ``` markdown)
        clean = response.strip()
        clean = re.sub(r'^```(?:json)?\s*', '', clean, flags=re.IGNORECASE)
        clean = re.sub(r'\s*```$', '', clean)

        try:
            data = json.loads(clean)
        except json.JSONDecodeError:
            logger.error(f"LLM returned invalid JSON: {clean}")
            raise ValueError("Invalid JSON from LLM")

        # ✅ Generate Image URL with better prompt
        visual = data.get("visual", "epic manga weapon glowing")
        weapon_name = data.get("name", "manga weapon")

        # Clean prompt for Pollinations (remove special chars)
        image_prompt = f"{visual} {weapon_name} anime manga style detailed high quality"
        image_prompt = "".join(c for c in image_prompt if c.isalnum() or c in " .,-_")

        # Generate deterministic URL
        seed = hashlib.md5(f"{weapon_name}{element}{style}".encode()).hexdigest()[:8]

        data[
            "image_url"] = f"https://image.pollinations.ai/prompt/{image_prompt}?width=512&height=512&nologo=true&seed={seed}&model=flux"

        return {"weapon": data, "status": "success"}

    except Exception as e:
        logger.error(f"Quiz error: {e}")
        # Fallback with working image
        return {
            "weapon": {
                "name": "Shadow Flame Blade",
                "type": "Elemental Sword",
                "power": 850,
                "speed": 80,
                "hax": 75,
                "ability": "Burns through dimensions",
                "weakness": "Weak to ice-based attacks",
                "lore": "Forged in the eternal flames of the underworld.",
                "image_url": "https://image.pollinations.ai/prompt/epic%20flaming%20sword%20anime%20manga%20style%20detailed?width=512&height=512&nologo=true&seed=abc123&model=flux"
            },
            "status": "success"
        }