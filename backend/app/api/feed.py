# backend/app/api/feed.py
from fastapi import APIRouter
from app.db.neo4j import neo4j_db

router = APIRouter()


@router.get("/trending")
async def trending_feed():
    # Real data from Neo4j - universes with most characters
    query = """
    MATCH (u:Universe)
    OPTIONAL MATCH (c:Character)-[:BELONGS_TO]->(u)
    WITH u, count(c) as char_count
    WHERE char_count > 0
    RETURN u.title as title, u.anilist_id as id, char_count as popularity
    ORDER BY char_count DESC
    LIMIT 20
    """
    universes = await neo4j_db.execute_query(query)

    # Top characters
    char_query = """
    MATCH (c:Character)-[:BELONGS_TO]->(u:Universe)
    RETURN c.name as name, u.title as universe, c.image as image
    LIMIT 15
    """
    characters = await neo4j_db.execute_query(char_query)

    return {
        "trending_universes": universes,
        "top_characters": characters,
        "total_universes": len(universes),
        "total_characters": len(characters),
        "status": "success"
    }


@router.get("/universe/{universe_id}")
async def get_universe_details(universe_id: int):
    query = """
    MATCH (u:Universe {anilist_id: $id})
    OPTIONAL MATCH (c:Character)-[:BELONGS_TO]->(u)
    RETURN u.title as title, u.genres as genres, 
           collect({name: c.name, image: c.image, description: c.description})[0..10] as characters
    """
    results = await neo4j_db.execute_query(query, {"id": universe_id})
    if not results:
        return {"error": "Universe not found"}
    return results[0]