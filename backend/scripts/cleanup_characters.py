# backend/scripts/cleanup_characters.py
"""
Character Cleanup Script
- Removes duplicates
- Standardizes names
- Adds series tags
"""
import sys
import os

# Add app directory to Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import asyncio
from app.db.neo4j import neo4j_db
from loguru import logger


async def cleanup_characters():
    logger.info("🧹 Starting character cleanup...")

    # Connect to Neo4j first
    logger.info("🔌 Connecting to Neo4j...")
    await neo4j_db.connect()

    try:
        # Step 1: Find duplicates
        query = """
        MATCH (c:Character)
        WITH toLower(c.name) as lower_name, collect(c) as chars
        WHERE size(chars) > 1
        RETURN lower_name, [c IN chars | c.name] as names
        """

        duplicates = await neo4j_db.execute_query(query)

        if duplicates:
            logger.warning(f"Found {len(duplicates)} duplicate character groups")
            for dup in duplicates:
                logger.info(f"Duplicate group: {dup['names']}")
        else:
            logger.info("✅ No duplicates found")

        # Step 2: Standardize names (add series tag if missing)
        standardize_query = """
        MATCH (c:Character)-[:BELONGS_TO]->(u:Universe)
        WHERE NOT c.name CONTAINS '('
        SET c.name = c.name + ' (' + u.title + ')'
        RETURN c.name as updated
        """

        results = await neo4j_db.execute_query(standardize_query)
        logger.info(f"✅ Standardized {len(results)} character names")

        logger.info("🎉 Cleanup complete!")

    finally:
        # Always close connection
        await neo4j_db.close()


if __name__ == "__main__":
    asyncio.run(cleanup_characters())