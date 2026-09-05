# backend/app/api/universe.py
from fastapi import APIRouter
from app.db.neo4j import neo4j_db

router = APIRouter()

@router.get("/list")
async def list_universes():
    query = """
    MATCH (u:Universe)
    OPTIONAL MATCH (c:Character)-[:BELONGS_TO]->(u)
    WITH u, count(c) as char_count
    RETURN u.title as title, u.anilist_id as id, char_count
    ORDER BY char_count DESC
    LIMIT 50
    """
    results = await neo4j_db.execute_query(query)
    return {
        "universes": results,
        "total": len(results),
        "status": "success"
    }