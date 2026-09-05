# backend/app/api/chat.py
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.api.deps import get_current_user
from app.db.neo4j import neo4j_db
from app.services.llm_service import llm_service
from loguru import logger

router = APIRouter()


class ChatRequest(BaseModel):
    character_name: str
    message: str


@router.post("/message")
async def chat_with_character(request: ChatRequest, user: dict = Depends(get_current_user)):
    # 1. Fetch character data from Neo4j
    query = """
    MATCH (c:Character)
    WHERE toLower(c.name) CONTAINS toLower($name)
    OPTIONAL MATCH (c)-[:BELONGS_TO]->(u:Universe)
    RETURN c.name as name, c.description as bio, u.title as universe
    LIMIT 1
    """
    results = await neo4j_db.execute_query(query, {"name": request.character_name})
    if not results:
        raise HTTPException(status_code=404, detail="Character not found in database")

    char = results[0]

    # 2. Build system prompt
    system_prompt = (
        f"You are {char['name']} from the {char['universe'] or 'Manga'} universe. "
        f"Background: {char['bio'] or 'A powerful warrior'}. "
        "Respond strictly in character. Keep it engaging, concise (under 150 words), and true to your canonical lore."
    )

    # 3. Use centralized llm_service (Handles Groq -> Mistral fallback automatically)
    try:
        reply = await llm_service.generate(
            prompt=request.message,
            system_prompt=system_prompt,
            max_tokens=300,
            temperature=0.7
        )

        return {
            "character": char['name'],
            "universe": char['universe'],
            "reply": reply,
            "status": "success"
        }
    except Exception as e:
        logger.error(f"Chat generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"AI Chat unavailable: {str(e)}")