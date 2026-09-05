# backend/app/api/battle.py
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.api.deps import get_current_user, check_feature_limit
from app.agents.battle_agent import battle_agent
from app.db.neo4j import neo4j_db
from loguru import logger

router = APIRouter()


class BattleRequest(BaseModel):
    character_1: str
    character_2: str


@router.post("/analyze")
async def analyze_battle(request: BattleRequest, user: dict = Depends(get_current_user)):
    await check_feature_limit(user, "battles", free_limit=5)

    try:
        result = await battle_agent.analyze_battle(
            char1_name=request.character_1,
            char2_name=request.character_2
        )
        if not result.get("success"):
            raise HTTPException(status_code=404, detail=result.get("error", "Battle analysis failed"))
        return result
    except Exception as e:
        logger.error(f"Battle analysis crashed: {e}")
        raise HTTPException(status_code=500, detail=f"Battle analysis failed: {str(e)}")


@router.get("/characters")
async def get_all_characters():
    """Fetch all characters from database for dropdown"""
    try:
        query = """
        MATCH (c:Character)
        OPTIONAL MATCH (c)-[:BELONGS_TO]->(u:Universe)
        RETURN c.name AS name, u.title AS universe
        ORDER BY c.name ASC
        """
        results = await neo4j_db.execute_query(query)

        # Format as list of strings for dropdown
        characters = [f"{r['name']} ({r['universe'] or 'Unknown'})" for r in results]

        return {
            "characters": characters,
            "count": len(characters),
            "status": "success"
        }
    except Exception as e:
        logger.error(f"Failed to fetch characters: {e}")
        return {"characters": [], "count": 0, "status": "error"}


@router.get("/trending")
async def trending_battles():
    return {
        "trending": [
            {"char1": "Monkey D. Luffy", "char2": "Naruto Uzumaki", "views": 15420},
            {"char1": "Son Goku", "char2": "Saitama", "views": 12300}
        ]
    }