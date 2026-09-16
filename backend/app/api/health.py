from fastapi import APIRouter
from app.db.neo4j import neo4j_db
from loguru import logger

router = APIRouter(tags=["Health"])

@router.get("/health")
async def health_check():
    """Health check that also pings Neo4j to keep it alive"""
    try:
        # Ye simple query Neo4j ko active rakhegi
        result = await neo4j_db.execute_query("RETURN 1 as test")
        return {
            "status": "healthy",
            "neo4j": "connected",
            "timestamp": __import__('datetime').datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {"status": "unhealthy", "error": str(e)}