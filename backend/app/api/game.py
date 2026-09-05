# backend/app/api/game.py
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from app.services.game_service import game_service
from app.db.neo4j import neo4j_db
from loguru import logger
from datetime import date

router = APIRouter()


class GuessRequest(BaseModel):
    guess: str


@router.get("/today")
async def get_todays_puzzle():
    """Get today's puzzle metadata with mode and hints"""
    try:
        target = await game_service.get_daily_character()
        if not target:
            raise HTTPException(404, "No characters in database. Run seed script first.")

        # Determine mode based on hash (rotate daily)
        modes: List[GameMode] = ["silhouette", "quote", "radar", "progressive"]
        mode_index = hash(date.today().isoformat()) % len(modes)
        mode = modes[mode_index]

        # Generate mode-specific data
        extra_data = {}

        if mode == "quote":
            # Generate AI quote from character description
            desc = target.get("description", "")[:200]
            extra_data["quote"] = f"Based on my path... {desc[:50]}..."  # Placeholder

        elif mode == "radar":
            # Generate random-ish stats based on character name hash
            char_hash = hash(target.get("name", ""))
            extra_data["radarStats"] = {
                "speed": abs(char_hash % 10),
                "power": abs((char_hash // 10) % 10),
                "hax": abs((char_hash // 100) % 10),
                "battle_iq": abs((char_hash // 1000) % 10),
                "stamina": abs((char_hash // 10000) % 10),
                "experience": abs((char_hash // 100000) % 10),
            }

        return {
            "date": date.today().isoformat(),
            "puzzle_number": game_service._get_puzzle_id(),
            "mode": mode,
            "max_attempts": 6,
            "attributes": ["universe", "gender", "name_length", "first_letter"],
            **extra_data,
            "status": "success"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting today's puzzle: {e}")
        raise HTTPException(500, str(e))


@router.post("/guess")
async def submit_guess(req: GuessRequest):
    """Submit a guess and get colored hints back"""
    try:
        target = await game_service.get_daily_character()
        if not target:
            raise HTTPException(404, "No puzzle available")

        guess_char = await game_service.get_character_by_name(req.guess.strip())
        if not guess_char:
            return {"error": "Character not found in database", "status": "not_found"}

        hints = game_service.compare_guess(guess_char, target)
        is_correct = guess_char.get("id") == target.get("id")

        return {
            "hints": hints,
            "is_correct": is_correct,
            "guess_name": guess_char["name"],
            "status": "success"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing guess: {e}")
        raise HTTPException(500, str(e))


@router.get("/autocomplete")
async def autocomplete(q: str = Query(..., min_length=1)):
    """Search characters for autocomplete dropdown"""
    try:
        query = """
        MATCH (c:Character)
        WHERE toLower(c.name) CONTAINS toLower($q)
        RETURN c.name as name
        ORDER BY size(c.name)
        LIMIT 10
        """
        results = await neo4j_db.execute_query(query, {"q": q.strip()})
        return {"suggestions": [r["name"] for r in results], "status": "success"}
    except Exception as e:
        logger.error(f"Autocomplete error: {e}")
        return {"suggestions": [], "status": "success"}


@router.get("/reveal")
async def reveal_answer():
    """Reveal today's answer (after giving up)"""
    try:
        target = await game_service.get_daily_character()
        if not target:
            raise HTTPException(404, "No puzzle available")

        return {
            "name": target["name"],
            "universe": target["universe"],
            "description": (target.get("description") or "")[:400],
            "status": "success"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Reveal error: {e}")
        raise HTTPException(500, str(e))


# Add this new endpoint to your existing game.py

@router.get("/random-quote")
async def get_random_quote():
    """Get a random quote for the game"""
    try:
        query = """
        MATCH (q:Quote)
        RETURN q.text as quote, q.character_name as character, q.anime as anime, q.id as id
        """
        results = await neo4j_db.execute_query(query)

        if not results:
            # Fallback if no quotes in database
            return {
                "quote": "I'll become stronger!",
                "character": "Unknown",
                "anime": "Unknown",
                "status": "success"
            }

        import random
        selected = random.choice(results)

        return {
            "quote": selected["quote"],
            "character": selected["character"],
            "anime": selected["anime"],
            "status": "success"
        }
    except Exception as e:
        logger.error(f"Error getting random quote: {e}")
        raise HTTPException(500, str(e))