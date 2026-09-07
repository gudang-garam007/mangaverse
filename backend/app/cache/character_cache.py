from cachetools import TTLCache
from loguru import logger
from typing import List, Dict
from app.db.neo4j import neo4j_db


class CharacterCache:
    def __init__(self):
        self.search_cache = TTLCache(maxsize=500, ttl=7200)
        self.universe_cache = TTLCache(maxsize=50, ttl=7200)

    async def get_or_fetch_characters(self, search_query: str, limit: int = 50, offset: int = 0) -> List[Dict]:
        cache_key = f"search_{search_query.lower()}_{limit}_{offset}"

        if cache_key in self.search_cache:
            return self.search_cache[cache_key]

        query = """
        MATCH (c:Character)-[:BELONGS_TO]->(u:Universe)
        WHERE toLower(c.name) CONTAINS toLower($q)
        RETURN c.id as id, c.name as name, c.description as description,
               c.gender as gender, c.age as age, u.title as universe, c.image_url as image_url
        ORDER BY c.name
        SKIP $offset LIMIT $limit
        """

        try:
            records = await neo4j_db.execute_query(query, {"q": search_query, "limit": limit, "offset": offset})
            results = [{
                'id': record['id'], 'name': record['name'], 'description': record['description'] or '',
                'gender': record['gender'] or 'Unknown', 'age': record['age'] or 'Unknown',
                'universe': record['universe'] or 'Unknown', 'image_url': record.get('image_url', '')
            } for record in records]

            self.search_cache[cache_key] = results
            return results
        except Exception as e:
            logger.error(f"❌ Neo4j fetch failed: {e}")
            return []

    async def get_or_fetch_by_universe(self, universe: str, limit: int = 50, offset: int = 0) -> List[Dict]:
        cache_key = f"universe_{universe.lower()}_{limit}_{offset}"

        if cache_key in self.universe_cache:
            return self.universe_cache[cache_key]

        query = """
        MATCH (c:Character)-[:BELONGS_TO]->(u:Universe)
        WHERE toLower(u.title) CONTAINS toLower($universe)
        RETURN c.id as id, c.name as name, c.description as description,
               c.gender as gender, c.age as age, u.title as universe, c.image_url as image_url
        ORDER BY c.name
        SKIP $offset LIMIT $limit
        """

        try:
            records = await neo4j_db.execute_query(query, {"universe": universe, "limit": limit, "offset": offset})
            results = [{
                'id': record['id'], 'name': record['name'], 'description': record['description'] or '',
                'gender': record['gender'] or 'Unknown', 'age': record['age'] or 'Unknown',
                'universe': record['universe'] or 'Unknown', 'image_url': record.get('image_url', '')
            } for record in records]

            self.universe_cache[cache_key] = results
            return results
        except Exception as e:
            logger.error(f"❌ Neo4j fetch failed: {e}")
            return []


character_cache = CharacterCache()