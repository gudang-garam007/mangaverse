from cachetools import TTLCache
from loguru import logger
from typing import List, Dict
from app.db.neo4j import neo4j_db


class CharacterCache:
    def __init__(self):
        # Cache sirf 500 recent searches rakhega (Memory bachane ke liye)
        # TTL = 2 hours (7200 seconds)
        self.search_cache = TTLCache(maxsize=500, ttl=7200)
        self.universe_cache = TTLCache(maxsize=50, ttl=7200)

    async def get_or_fetch_characters(self, search_query: str, limit: int = 50) -> List[Dict]:
        """Lazy load: Pehle cache check karo, nahi mila toh Neo4j se lao aur cache kar lo"""
        cache_key = f"search_{search_query.lower()}_{limit}"

        # 1. Check Cache
        if cache_key in self.search_cache:
            logger.info(f"⚡ Cache HIT for search: {search_query}")
            return self.search_cache[cache_key]

        # 2. Cache MISS: Neo4j se fetch karo
        logger.info(f"🔄 Cache MISS. Fetching from Neo4j for: {search_query}")
        query = """
        MATCH (c:Character)-[:BELONGS_TO]->(u:Universe)
        WHERE toLower(c.name) CONTAINS toLower($q)
        RETURN c.id as id, c.name as name, c.description as description,
               c.gender as gender, c.age as age, u.title as universe
        LIMIT $limit
        """

        try:
            records = await neo4j_db.execute_query(query, {"q": search_query, "limit": limit})

            results = []
            for record in records:
                results.append({
                    'id': record['id'],
                    'name': record['name'],
                    'description': record['description'] or '',
                    'gender': record['gender'] or 'Unknown',
                    'age': record['age'] or 'Unknown',
                    'universe': record['universe'] or 'Unknown'
                })

            # 3. Neo4j se aaya hua data cache mein save kar lo
            self.search_cache[cache_key] = results
            return results

        except Exception as e:
            logger.error(f"❌ Neo4j fetch failed: {e}")
            return []

    async def get_or_fetch_by_universe(self, universe: str, limit: int = 50) -> List[Dict]:
        """Lazy load for universe"""
        cache_key = f"universe_{universe.lower()}_{limit}"

        if cache_key in self.universe_cache:
            logger.info(f"⚡ Cache HIT for universe: {universe}")
            return self.universe_cache[cache_key]

        logger.info(f"🔄 Cache MISS. Fetching from Neo4j for universe: {universe}")
        query = """
        MATCH (c:Character)-[:BELONGS_TO]->(u:Universe)
        WHERE toLower(u.title) CONTAINS toLower($universe)
        RETURN c.id as id, c.name as name, c.description as description,
               c.gender as gender, c.age as age, u.title as universe
        LIMIT $limit
        """

        try:
            records = await neo4j_db.execute_query(query, {"universe": universe, "limit": limit})

            results = []
            for record in records:
                results.append({
                    'id': record['id'],
                    'name': record['name'],
                    'description': record['description'] or '',
                    'gender': record['gender'] or 'Unknown',
                    'age': record['age'] or 'Unknown',
                    'universe': record['universe'] or 'Unknown'
                })

            self.universe_cache[cache_key] = results
            return results

        except Exception as e:
            logger.error(f"❌ Neo4j fetch failed: {e}")
            return []


# Global instance
character_cache = CharacterCache()