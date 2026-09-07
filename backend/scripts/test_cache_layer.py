import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.neo4j import neo4j_db
from app.cache.character_cache import character_cache
import asyncio
from loguru import logger


async def test_cache():
    print("🔍 Testing Cache Layer...")

    # Connect to Neo4j
    uri = os.getenv("NEO4J_URI", "neo4j+s://32c5ac7c.databases.neo4j.io")
    user = os.getenv("NEO4J_USER", "32c5ac7c")
    password = os.getenv("NEO4J_PASSWORD", "DhFCyr78OktTSwKlfZvaO6yUP_3GHGX-0BgP-QTUsKU")

    await neo4j_db.connect()
    print("✅ Neo4j connected via app.db.neo4j")

    # Test cache function
    print("\n🔄 Testing cache.get_or_fetch_characters('Luffy')...")
    try:
        results = await character_cache.get_or_fetch_characters("Luffy", limit=5)
        print(f"✅ Cache returned {len(results)} characters")

        if results:
            print(f"\n📊 First character:")
            print(f"   Name: {results[0]['name']}")
            print(f"   Universe: {results[0]['universe']}")
            print(f"   Description: {results[0]['description'][:100]}...")
        else:
            print("❌ CACHE RETURNED EMPTY LIST!")
            print("   This means Neo4j query is failing silently or returning no results.")

    except Exception as e:
        print(f"❌ CACHE FUNCTION FAILED: {e}")
        print(f"   Error type: {type(e).__name__}")
        import traceback
        traceback.print_exc()

    await neo4j_db.close()


if __name__ == "__main__":
    asyncio.run(test_cache())