from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional
from app.db.neo4j import neo4j_db
from app.services.llm_service import llm_service
from loguru import logger

router = APIRouter(prefix="/api/chat", tags=["Character Chat"])


class MessageHistory(BaseModel):
    role: str = Field(..., description="user or assistant")
    content: str


class ChatRequest(BaseModel):
    character_name: str
    message: str
    history: Optional[List[MessageHistory]] = Field(default=[],
                                                    description="Past chat turns for multi-turn roleplay memory")


@router.post("/message")
async def chat_with_character(request: ChatRequest):
    # 1. Fetch character data from Neo4j
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

    # 2. ✅ CRITICAL FIX: Agar character nahi mila toh bhi chat chalega
    if not results:
        logger.info(f"⚠️ Character '{request.character_name}' not in DB. Using dynamic fallback prompt.")
        char_name = request.character_name
        universe = "Anime/Manga"
        bio = "A beloved anime/manga character"
        base_prompt = None  # Will use dynamic fallback
    else:
        char = results[0]
        char_name = char["name"]
        universe = char["universe"] or "Manga"
        bio = char["bio"] or "An iconic anime/manga legend"
        base_prompt = char.get("custom_prompt")

    # 3. ✅ SMART FALLBACK: Agar DB mein prompt nahi hai, toh LLM se generate karwa lo
    if not base_prompt:
        base_prompt = (
            f"You are {char_name} from the {universe} universe. "
            f"Background: {bio}. "
            "Core Rules:\n"
            "- Stay STRICTLY in character. Never break immersion. Never reveal you are an AI.\n"
            "- Keep responses concise (under 130 words).\n"
            "- Always include physical actions, expressions, or visual quirks inside asterisks (e.g., *smirking, crossing arms*).\n"
            "- Embody their authentic speech patterns, signature catchphrases, and emotional triggers.\n"
            "- If the user mentions something from your universe, react naturally and canonically.\n"
            "- Be engaging, dramatic, and true to your personality - whether you're heroic, villainous, shy, or chaotic."
        )

    # 4. Inject real-time contextual awareness
    system_prompt = (
        f"{base_prompt}\n\n"
        f"Context: You are currently engaged in a live, immersive roleplay conversation. "
        "React dynamically to the user's tone—if they provoke you, show character-specific aggression or banter; "
        "if they match your vibe, lean into it. Make every response feel like an active manga panel."
    )

    # 5. Format Conversation History (last 6 turns for context)
    formatted_messages = []
    for h in request.history[-6:]:
        formatted_messages.append({"role": h.role, "content": h.content})

    formatted_messages.append({"role": "user", "content": request.message})

    # 6. Generate AI Reply
    try:
        reply = await llm_service.generate(
            prompt=request.message,
            system_prompt=system_prompt,
            history=formatted_messages[:-1],
            max_tokens=250,
            temperature=0.88
        )

        return {
            "character": char_name,
            "universe": universe,
            "reply": reply,
            "status": "success",
            "from_db": bool(results and results[0].get("custom_prompt"))  # Tells frontend if prompt was from DB
        }

    except Exception as e:
        logger.error(f"LLM generation failed for character {char_name}: {e}")
        raise HTTPException(status_code=500, detail=f"AI Character currently unavailable: {str(e)}")