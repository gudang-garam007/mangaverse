from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional
from app.api.deps import get_current_user
from app.db.neo4j import neo4j_db
from app.services.llm_service import llm_service
from loguru import logger

router = APIRouter(prefix="/chat", tags=["Character Chat"])


class MessageHistory(BaseModel):
    role: str = Field(..., description="user or assistant")
    content: str


class ChatRequest(BaseModel):
    character_name: str
    message: str
    history: Optional[List[MessageHistory]] = Field(default=[],
                                                    description="Past chat turns for multi-turn roleplay memory")


@router.post("/message")
async def chat_with_character(request: ChatRequest, user: dict = Depends(get_current_user)):
    # 1. Fetch character data + custom system prompt directly from Neo4j
    query = """
    MATCH (c:Character)
    WHERE toLower(c.name) CONTAINS toLower($name)
    OPTIONAL MATCH (c)-[:BELONGS_TO]->(u:Universe)
    RETURN c.name as name, 
           c.description as bio, 
           c.system_prompt as custom_prompt, 
           u.title as universe
    LIMIT 1
    """
    try:
        results = await neo4j_db.execute_query(query, {"name": request.character_name})
    except Exception as db_err:
        logger.error(f"Neo4j query execution failed: {db_err}")
        raise HTTPException(status_code=500, detail="Database error while fetching character.")

    if not results:
        raise HTTPException(status_code=404, detail=f"Character '{request.character_name}' not found in database")

    char = results[0]
    char_name = char["name"]
    universe = char["universe"] or "Manga"
    bio = char["bio"] or "An iconic anime/manga legend"

    # 2. Dynamic System Prompt Assembly
    base_prompt = char.get("custom_prompt")
    if not base_prompt:
        base_prompt = (
            f"You are {char_name} from the {universe} universe. "
            f"Background: {bio}. "
            "Core Rule: Stay strictly in character. Never break immersion. Keep responses concise (under 130 words). "
            "Always include physical actions, expressions, or visual quirks inside asterisks (e.g., *smirking, crossing arms*). "
            "Embody their authentic speech patterns, signature catchphrases, and emotional triggers."
        )

    # Inject real-time contextual awareness
    system_prompt = (
        f"{base_prompt}\n"
        f"Context Rule: You are currently engaged in a live, immersive roleplay conversation with user '{user.get('email', 'Traveler')}'. "
        "React dynamically to their tone—if they provoke you, show aggression or character-specific banter; if they match your vibe, lean into it."
    )

    # 3. Format Conversation History
    formatted_messages = []
    for h in request.history[-6:]:  # Keep last 6 turns
        formatted_messages.append({"role": h.role, "content": h.content})

    formatted_messages.append({"role": "user", "content": request.message})

    # 4. Generate AI Reply
    try:
        reply = await llm_service.generate(
            prompt=request.message,
            system_prompt=system_prompt,
            history=formatted_messages[:-1],
            max_tokens=300,
            temperature=0.88
        )

        return {
            "character": char_name,
            "universe": universe,
            "reply": reply,
            "status": "success"
        }

    except Exception as e:
        logger.error(f"LLM generation failed for character {char_name}: {e}")
        raise HTTPException(status_code=500, detail=f"AI Character currently unavailable: {str(e)}")