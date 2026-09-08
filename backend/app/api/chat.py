from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional
from app.db.neo4j import neo4j_db
from app.services.llm_service import llm_service
from loguru import logger

router = APIRouter(tags=["Character Chat"])


class MessageHistory(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    character_name: str
    message: str
    history: Optional[List[MessageHistory]] = Field(default=[])


@router.post("/message")
async def chat_with_character(request: ChatRequest):
    logger.info(f"📨 Chat request for: '{request.character_name}'")

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

    # 2. STRICT LOGIC: Use DB Prompt if available, ONLY fallback if genuinely missing
    if not results or len(results) == 0:
        logger.warning(f"⚠️ Character '{request.character_name}' NOT in DB. Using dynamic fallback.")
        char_name = request.character_name
        universe = "Anime/Manga"
        image_url = None

        # Dynamic fallback (only for characters we didn't seed)
        system_prompt = (
            f"You are {char_name}. Stay strictly in character. "
            "Use asterisks for actions (*smirks*). Keep under 130 words. Be engaging."
        )
    else:
        char = results[0]
        char_name = char["name"]
        universe = char["universe"] or "Manga"
        image_url = char.get("image")
        custom_prompt = char.get("custom_prompt")

        # ✅ THIS IS THE MAGIC: If we seeded it, we USE THE SEED PROMPT. Period.
        if custom_prompt:
            system_prompt = custom_prompt
            logger.info(f"✅ USING SEED PROMPT for {char_name} (Kadak Mode ON)")
        else:
            # Fallback for characters in DB but without custom prompt
            system_prompt = (
                f"You are {char_name} from {universe}. "
                f"Background: {char['bio'] or 'A legendary character'}. "
                "Stay in character. Use asterisks for actions (*action*). Keep replies under 130 words."
            )

    # 3. Prepare history by merging it into the prompt string
    conversation_context = ""
    for h in request.history[-6:]:
        speaker = "User" if h.role == "user" else char_name
        conversation_context += f"{speaker}: {h.content}\n"

    # Final prompt includes history + current message
    final_prompt = f"{conversation_context}User: {request.message}\n{char_name}:"

    # 4. Generate AI response (WITHOUT the 'history' keyword argument)
    try:
        logger.info(f"🤖 Generating response for {char_name}...")
        reply = await llm_service.generate(
            prompt=final_prompt,
            system_prompt=system_prompt,
            max_tokens=300,
            temperature=0.85
        )

        logger.info(f"✅ Response generated successfully for {char_name}")

        return {
            "character": char_name,
            "universe": universe,
            "image_url": image_url,
            "reply": reply,
            "status": "success"
        }

    except Exception as e:
        logger.error(f"❌ LLM generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"AI error: {str(e)}")