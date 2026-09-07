import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from neo4j import AsyncGraphDatabase
import asyncio
from loguru import logger


async def test_neo4j():
    uri = os.getenv("NEO4J_URI", "neo4j+s://32c5ac7c.databases.neo4j.io")
    user = os.getenv("NEO4J_USER", "32c5ac7c")
    password = os.getenv("NEO4J_PASSWORD", "DhFCyr78OktTSwKlfZvaO6yUP_3GHGX-0BgP-QTUsKU")

    print(f"🔍 Testing Neo4j Connection...")
    print(f"   URI: {uri}")
    print(f"   User: {user}")

    try:
        driver = AsyncGraphDatabase.driver(
            uri,
            auth=(user, password),
            connection_timeout=10.0
        )

        print("✅ Driver created successfully")

        # Test 1: Verify connectivity
        await driver.verify_connectivity()
        print("✅ Connectivity verified!")

        # Test 2: Count all characters
        async with driver.session() as session:
            result = await session.run("MATCH (c:Character) RETURN count(c) as count")
            record = await result.single()
            count = record["count"]
            print(f"✅ Total characters in Neo4j: {count}")

            if count == 0:
                print("❌ NEO4J DATABASE IS EMPTY! Seed script didn't run or failed.")
                return

            # Test 3: Fetch sample characters
            result = await session.run("""
                MATCH (c:Character)-[:BELONGS_TO]->(u:Universe)
                RETURN c.name as name, u.title as universe
                LIMIT 5
            """)
            records = [record.data() for record in await result.fetch(n=5)]
            print(f"\n📊 Sample characters from Neo4j:")
            for r in records:
                print(f"   - {r['name']} ({r['universe']})")

        await driver.close()
        print("\n🎉 Neo4j is WORKING and has data!")

    except Exception as e:
        print(f"\n❌ NEO4J CONNECTION FAILED: {e}")
        print(f"   Error type: {type(e).__name__}")


if __name__ == "__main__":
    asyncio.run(test_neo4j())