from neo4j import AsyncGraphDatabase
from app.config import settings
from loguru import logger
from typing import Optional, Dict, Any, List


class Neo4jDatabase:
    def __init__(self):
        self._driver: Optional[AsyncGraphDatabase.driver] = None

    async def connect(self):
        print("--- NEO4J DEBUG ---")
        print(f"URI: {settings.NEO4J_URI}")
        print(f"USER: {settings.NEO4J_USER}")
        print(f"PASS (repr): {repr(settings.NEO4J_PASSWORD)}")
        print(f"PASS length: {len(settings.NEO4J_PASSWORD)}")
        print("-------------------")

        try:
            self._driver = AsyncGraphDatabase.driver(
                settings.NEO4J_URI,
                auth=(settings.NEO4J_USER, settings.NEO4J_PASSWORD),
                # ✅ SAFETY & TIMEOUT SETTINGS ADDED
                connection_timeout=10.0,  # Max 10 seconds to establish connection
                max_connection_lifetime=1000,  # Recycle connections every 1000 seconds
                max_connection_pool_size=50,  # Prevent connection exhaustion
                keep_alive=True
            )

            # Verify connectivity before proceeding
            await self._driver.verify_connectivity()
            logger.info("✅ Neo4j connected successfully")

        except Exception as e:
            logger.error(f"❌ Neo4j connection failed: {e}")
            raise  # Re-raise so the app knows it failed to start

    async def close(self):
        if self._driver:
            await self._driver.close()
            self._driver = None
            logger.info("🛑 Neo4j connection closed")

    async def execute_query(self, query: str, parameters: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        if not self._driver:
            raise RuntimeError("Neo4j driver is not initialized. Call connect() first.")

        try:
            async with self._driver.session() as session:
                result = await session.run(query, parameters or {})
                records = await result.data()
                return records
        except Exception as e:
            logger.error(f"❌ Neo4j Query Execution Failed: {e}")
            logger.error(f"Query: {query}")
            raise

    async def create_character_node(self, char_id: str, name: str, universe: str, **props):
        query = """
        MERGE (c:Character {id: $id})
        SET c.name = $name, c.universe = $universe
        """
        params = {"id": char_id, "name": name, "universe": universe}

        # Safely append dynamic properties
        for key, value in props.items():
            if value is not None:
                query += f", c.{key} = ${key}"
                params[key] = value

        await self.execute_query(query, params)

    async def create_relationship(self, from_id: str, to_id: str, rel_type: str,
                                  props: Optional[Dict[str, Any]] = None):
        prop_str = ""
        params = {"from_id": from_id, "to_id": to_id}

        if props:
            prop_items = [f"{k}: ${k}" for k in props.keys()]
            prop_str = f" {{{', '.join(prop_items)}}}"
            params.update(props)

        query = f"""
        MATCH (a {{id: $from_id}}), (b {{id: $to_id}})
        MERGE (a)-[r:{rel_type}{prop_str}]->(b)
        """
        await self.execute_query(query, params)

    async def get_character_with_relations(self, char_id: str):
        query = """
        MATCH (c:Character {id: $id})
        OPTIONAL MATCH (c)-[r]->(related)
        RETURN c, collect({rel: type(r), node: related}) as relations
        """
        results = await self.execute_query(query, {"id": char_id})
        return results[0] if results else None

    async def get_battle_data(self, char1_id: str, char2_id: str):
        query = """
        MATCH (c1:Character {id: $id1})
        MATCH (c2:Character {id: $id2})
        OPTIONAL MATCH (c1)-[:HAS_POWER]->(p1:Power)
        OPTIONAL MATCH (c2)-[:HAS_POWER]->(p2:Power)
        OPTIONAL MATCH (c1)-[:FROM_UNIVERSE]->(u1:Universe)
        OPTIONAL MATCH (c2)-[:FROM_UNIVERSE]->(u2:Universe)
        RETURN 
            c1, c2,
            collect(DISTINCT p1) as powers1,
            collect(DISTINCT p2) as powers2,
            u1, u2
        """
        results = await self.execute_query(query, {"id1": char1_id, "id2": char2_id})
        return results[0] if results else None


neo4j_db = Neo4jDatabase()