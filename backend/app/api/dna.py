# backend/app/api/dna.py
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.api.deps import get_current_user
from app.db.neo4j import neo4j_db
from app.services.llm_service import llm_service
from loguru import logger

router = APIRouter()


class DNARequest(BaseModel):
    manga_title: str


@router.post("/analyze")
async def analyze_dna(req: DNARequest, user: dict = Depends(get_current_user)):
    # 1. Fetch manga data from Neo4j
    query = """
    MATCH (u:Universe) 
    WHERE toLower(u.title) CONTAINS toLower($title) 
    OPTIONAL MATCH (c:Character)-[:BELONGS_TO]->(u) 
    RETURN u.title as title, u.genres as genres, count(c) as character_count 
    LIMIT 1
    """
    results = await neo4j_db.execute_query(query, {"title": req.manga_title})
    if not results:
        raise HTTPException(status_code=404, detail="Manga not found in database")

    manga_data = results[0]

    # 2. Prepare prompts
    system_prompt = "You are a manga DNA analyst. Break down the manga into its core components: themes, narrative structure, power system, art style influences, target demographic, and unique selling points. Provide a detailed, structured analysis."
    user_prompt = f"Analyze the DNA of '{manga_data['title']}'. Known genres: {manga_data['genres']}. Character count: {manga_data['character_count']}."

    # 3. Use centralized LLM service (Automatically handles Groq -> Mistral fallback with correct models)
    try:
        analysis = await llm_service.generate(
            prompt=user_prompt,
            system_prompt=system_prompt,
            max_tokens=800
        )

        return {
            "manga": manga_data['title'],
            "dna_analysis": analysis,
            "status": "success"
        }
    except Exception as e:
        logger.error(f"DNA Analysis failed: {e}")
        raise HTTPException(status_code=500, detail=f"AI DNA analysis unavailable: {str(e)}")