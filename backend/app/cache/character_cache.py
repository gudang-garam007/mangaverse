from cachetools import TTLCache
from loguru import logger
from typing import List, Dict, Optional
from app.db.neo4j import neo4j_db
import asyncio


class CharacterCache:
    def __init__(self):
        # Cache with 1 hour TTL (Time To Live)
        self.characters = TTLCache(maxsize=10000, ttl=3600)
        self.weapons = TTLCache(maxsize=200, ttl=3600)
        self.is_loading = False

    async def preload_all_data(self):
        """Pre-load all data into cache on server startup"""
        if self.is_loading:
            return

        self.is_loading = True
        logger.info("🚀 Starting data preload into cache...")

        try:
            # 1. Preload all characters
            query = """
            MATCH (c:Character)-[:BELONGS_TO]->(u:Universe)
            RETURN c.id as id, c.name as name, c.description as description,
                   c.gender as gender, c.age as age, u.title as universe
            LIMIT 10000
            """

            records = await neo4j_db.execute_query(query)

            for record in records:
                char_id = record['id']
                self.characters[char_id] = {
                    'id': char_id,
                    'name': record['name'],
                    'description': record['description'] or '',
                    'gender': record['gender'] or 'Unknown',
                    'age': record['age'] or 'Unknown',
                    'universe': record['universe'] or 'Unknown'
                }

            logger.info(f"✅ Cached {len(self.characters)} characters")

            # 2. Preload all weapons (if you have weapons in Neo4j)
            weapons_query = """
            MATCH (w:Weapon)
            RETURN w.id as id, w.name as name, w.owner as owner, w.anime as anime,
                   w.type as type, w.power as power, w.speed as speed, w.hax as hax,
                   w.ability as ability, w.weakness as weakness, w.lore as lore
            LIMIT 200
            """

            weapons_records = await neo4j_db.execute_query(weapons_query)

            for record in weapons_records:
                weapon_id = record['id']
                self.weapons[weapon_id] = record

            logger.info(f"✅ Cached {len(self.weapons)} weapons")

        except Exception as e:
            logger.error(f"❌ Cache preload failed: {e}")
        finally:
            self.is_loading = False

    def get_characters(self, search_query: str = "", limit: int = 50) -> List[Dict]:
        """Get characters from cache with search"""
        results = []
        search_lower = search_query.lower()

        for char_id, char_data in self.characters.items():
            if search_lower in char_data['name'].lower():
                results.append(char_data)
                if len(results) >= limit:
                    break

        return results

    def get_characters_by_universe(self, universe: str, limit: int = 50) -> List[Dict]:
        """Get characters by universe from cache"""
        results = []
        universe_lower = universe.lower()

        for char_id, char_data in self.characters.items():
            if universe_lower in char_data['universe'].lower():
                results.append(char_data)
                if len(results) >= limit:
                    break

        return results

    def get_all_weapons(self) -> List[Dict]:
        """Get all weapons from cache"""
        return list(self.weapons.values())

    def get_character_count(self) -> int:
        return len(self.characters)

    def get_weapon_count(self) -> int:
        return len(self.weapons)


# Global cache instance
character_cache = CharacterCache()