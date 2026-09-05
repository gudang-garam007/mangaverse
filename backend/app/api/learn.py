# backend/app/api/learn.py
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.api.deps import get_current_user
from app.services.llm_service import llm_service
from loguru import logger

router = APIRouter()

class LearnRequest(BaseModel):
    topic: str

@router.post("/lesson")
async def generate_lesson(req: LearnRequest, user: dict = Depends(get_current_user)):
    system_prompt = "You are a manga sensei. Teach the user about manga concepts in a structured, engaging way. Include: 1) Brief intro, 2) Key concepts with examples, 3) Notable characters/moments, 4) Fun facts. Format as clean markdown."
    user_prompt = f"Teach me about: {req.topic}"

    try:
        # ✅ Use centralized, bulletproof LLM service (Handles Groq -> Mistral fallback automatically)
        lesson_content = await llm_service.generate(
            prompt=user_prompt,
            system_prompt=system_prompt,
            max_tokens=800
        )
        return {"topic": req.topic, "lesson": lesson_content, "status": "success"}
    except Exception as e:
        logger.error(f"Learn module LLM failed: {e}")
        raise HTTPException(status_code=500, detail=f"AI learning module unavailable: {str(e)}")

@router.get("/topics")
async def list_topics():
    return {
        "topics": [
            {"id": "haki", "title": "Haki in One Piece", "difficulty": "intermediate"},
            {"id": "chakra", "title": "Chakra System in Naruto", "difficulty": "beginner"},
            {"id": "nen", "title": "Nen in Hunter x Hunter", "difficulty": "advanced"}
        ]
    }