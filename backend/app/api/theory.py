import uuid
import random
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


class VoteRequest(BaseModel):
    theory_id: str
    vote_type: str  # "agree" or "clown"


@router.post("/generate")
async def generate_theory(req: TheoryRequest, user: dict = Depends(get_current_user)):
    # 1. Fetch context
    query = "MATCH (c:Character)-[:BELONGS_TO]->(u:Universe) WHERE toLower(u.title) CONTAINS toLower($title) RETURN c.name as name, c.description as bio LIMIT 5"
    chars = await neo4j_db.execute_query(query, {"title": req.manga_title})
    char_context = "\n".join(
        [f"- {c['name']}: {c['bio'][:200]}" for c in chars]) if chars else "No character data available"

    system_prompt = "You are a creative manga theorist. Generate an engaging, lore-accurate fan theory based on the provided context. Make it thought-provoking and grounded in canon."
    user_prompt = f"Generate a fan theory for '{req.manga_title}' about: {req.topic}\n\nKnown characters:\n{char_context}"

    try:
        theory = await llm_service.generate(
            prompt=user_prompt,
            system_prompt=system_prompt,
            max_tokens=1500,
            use_cache=True,
            temperature=0.7
        )

        # 2. Generate Bawaal Stats
        theory_id = str(uuid.uuid4())
        canon_accuracy = random.randint(65, 98)  # Realistic range
        bounty = random.choice([500000, 1000000, 5000000, 15000000, 50000000, 100000000])

        # 3. Save to Neo4j for voting
        save_query = """
        CREATE (t:Theory {
            id: $id, manga: $manga, topic: $topic, theory: $theory,
            canon_accuracy: $canon_accuracy, bounty: $bounty,
            votes_agree: 0, votes_clown: 0
        })
        RETURN t.id as id
        """
        await neo4j_db.execute_query(save_query, {
            "id": theory_id, "manga": req.manga_title, "topic": req.topic,
            "theory": theory, "canon_accuracy": canon_accuracy, "bounty": bounty
        })

        return {
            "theory_id": theory_id,
            "theory": theory,
            "canon_accuracy": canon_accuracy,
            "bounty": bounty,
            "votes_agree": 0,
            "votes_clown": 0,
            "status": "success"
        }
    except Exception as e:
        logger.error(f"Theory generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"AI theory generation failed: {str(e)}")


@router.post("/vote")
async def vote_theory(req: VoteRequest, user: dict = Depends(get_current_user)):
    if req.vote_type not in ["agree", "clown"]:
        raise HTTPException(400, detail="Invalid vote type")

    col = "votes_agree" if req.vote_type == "agree" else "votes_clown"
    query = f"""
    MATCH (t:Theory {{id: $theory_id}})
    SET t.{col} = coalesce(t.{col}, 0) + 1
    RETURN t.votes_agree as agree, t.votes_clown as clown
    """
    res = await neo4j_db.execute_query(query, {"theory_id": req.theory_id})
    if not res:
        raise HTTPException(404, detail="Theory not found")

    return {"status": "success", "agree": res[0]["agree"], "clown": res[0]["clown"]}