from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional
from app.db.neo4j import neo4j_db
from app.services.llm_service import llm_service
from loguru import logger
import asyncio

router = APIRouter(prefix="/api/chat", tags=["Character Chat"])


class MessageHistory(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    character_name: str
    message: str
    history: Optional[List[MessageHistory]] = Field(default=[])


@router.post("/message")
async def chat_with_character(request: ChatRequest):
    logger.info(f"📩 Chat request for: {request.character_name}")

    # 1. Fetch character from Neo4j
    query = """
    MATCH (c:Character)
    WHERE toLower(c.name) CONTAINS toLower($name)
    OPTIONAL MATCH (c)-[:BELONGS_TO]->(u:Universe)
    RETURN c.name as name, c.description as bio, c.system_prompt as custom_prompt, 
           c.image_url as image, u.title as universe
    LIMIT 1
    """

    try:
        results = await neo4j_db.execute_query(query, {"name": request.character_name})
    except Exception as e:
        logger.error(f"❌ Database error: {e}")
        raise HTTPException(status_code=500, detail="Database connection failed")

    # 2. Character not found - Use smart fallback
    if not results:
        logger.warning(f"⚠️ Character '{request.character_name}' not in DB. Using fallback.")
        char_name = request.character_name
        universe = "Anime/Manga"
        image_url = None
        system_prompt = (
            f"You are {char_name}, a popular anime/manga character. "
            "Stay in character. Use asterisks for actions (*smiles*). "
            "Keep responses under 130 words. Be engaging and dramatic."
        )
    else:
        char = results[0]
        char_name = char["name"]
        universe = char["universe"] or "Manga"
        image_url = char.get("image")
        custom_prompt = char.get("custom_prompt")

        if custom_prompt:
            system_prompt = custom_prompt
        else:
            system_prompt = (
                f"You are {char_name} from {universe}. "
                f"Background: {char['bio'] or 'A legendary character'}. "
                "Stay in character. Use asterisks for actions. Keep replies under 130 words."
            )

    # 3. Prepare conversation history
    formatted_messages = []
    for h in request.history[-6:]:
        formatted_messages.append({"role": h.role, "content": h.content})
    formatted_messages.append({"role": "user", "content": request.message})

    # 4. Generate response
    try:
        reply = await llm_service.generate(
            prompt=request.message,
            system_prompt=system_prompt,
            history=formatted_messages[:-1],
            max_tokens=250,
            temperature=0.85
        )

        return {
            "character": char_name,
            "universe": universe,
            "image_url": image_url,
            "reply": reply,
            "status": "success"
        }

    except Exception as e:
        logger.error(f"❌ LLM error: {e}")
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")