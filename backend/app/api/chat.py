from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional
from app.db.neo4j import neo4j_db
from app.services.llm_service import llm_service
from loguru import logger

router = APIRouter(prefix="/chat", tags=["Character Chat"])


class MessageHistory(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    character_name: str
    message: str
    history: Optional[List[MessageHistory]] = Field(default=[])


@router.post("/message")
async def chat_with_character(request: ChatRequest):
    logger.info(f"📨 Chat request for: {request.character_name}")

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
        logger.info(f"✅ Database query successful, found {len(results) if results else 0} results")
    except Exception as e:
        logger.error(f"❌ Database error: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

    # 2. Character NOT found - Use SMART FALLBACK (never show error to user)
    if not results or len(results) == 0:
        logger.warning(f"⚠️ Character '{request.character_name}' not in DB. Using AI fallback.")
        char_name = request.character_name
        universe = "Anime/Manga"
        image_url = None

        # Smart fallback prompt - LLM already knows these characters
        system_prompt = (
            f"You are {char_name}, a popular anime/manga character. "
            "Stay strictly in character at all times. "
            "Use asterisks for physical actions and expressions (*smiles*, *crosses arms*). "
            "Keep responses engaging, dramatic, and under 130 words. "
            "Speak naturally with character-appropriate tone and catchphrases."
        )
    else:
        char = results[0]
        char_name = char["name"]
        universe = char["universe"] or "Manga"
        image_url = char.get("image")
        custom_prompt = char.get("custom_prompt")

        if custom_prompt:
            system_prompt = custom_prompt
            logger.info(f"✅ Using custom prompt from DB for {char_name}")
        else:
            # Fallback if no custom prompt in DB
            system_prompt = (
                f"You are {char_name} from {universe}. "
                f"Background: {char['bio'] or 'A legendary anime/manga character'}. "
                "Stay in character. Use asterisks for actions (*action*). "
                "Keep replies under 130 words. Be engaging and authentic."
            )

    # 3. Prepare conversation history (last 6 messages)
    formatted_messages = []
    for h in request.history[-6:]:
        formatted_messages.append({"role": h.role, "content": h.content})
    formatted_messages.append({"role": "user", "content": request.message})

    # 4. Generate AI response
    try:
        logger.info(f" Generating response for {char_name}...")
        reply = await llm_service.generate(
            prompt=request.message,
            system_prompt=system_prompt,
            history=formatted_messages[:-1],
            max_tokens=250,
            temperature=0.85
        )

        logger.info(f"✅ Response generated successfully")

        return {
            "character": char_name,
            "universe": universe,
            "image_url": image_url,
            "reply": reply,
            "status": "success",
            "from_db": bool(results and len(results) > 0)
        }

    except Exception as e:
        logger.error(f"❌ LLM generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"AI error: {str(e)}")