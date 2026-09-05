# backend/app/api/theory.py
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.api.deps import get_current_user
from app.db.neo4j import neo4j_db
from app.services.llm_service import llm_service
from loguru import logger

router = APIRouter()


class TheoryRequest(BaseModel):
    manga_title: str
    topic: str


@router.post("/generate")
async def generate_theory(req: TheoryRequest, user: dict = Depends(get_current_user)):
    # 1. Fetch character context from Neo4j
    query = "MATCH (c:Character)-[:BELONGS_TO]->(u:Universe) WHERE toLower(u.title) CONTAINS toLower($title) RETURN c.name as name, c.description as bio LIMIT 5"
    chars = await neo4j_db.execute_query(query, {"title": req.manga_title})
    char_context = "\n".join(
        [f"- {c['name']}: {c['bio'][:200]}" for c in chars]) if chars else "No character data available"

    # 2. Prepare prompts
    system_prompt = "You are a creative manga theorist. Generate an engaging, lore-accurate fan theory based on the provided context. Make it thought-provoking and grounded in canon."
    user_prompt = f"Generate a fan theory for '{req.manga_title}' about: {req.topic}\n\nKnown characters:\n{char_context}"

    # 3. Use CENTRALIZED LLM SERVICE (Automatic Groq -> Mistral fallback)
    try:
        theory = await llm_service.generate(
            prompt=user_prompt,
            system_prompt=system_prompt,
            max_tokens=600,
            use_cache=True,
            temperature=0.7
        )

        return {
            "manga": req.manga_title,
            "topic": req.topic,
            "theory": theory,
            "status": "success"
        }
    except Exception as e:
        logger.error(f"Theory generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"AI theory generation failed: {str(e)}")