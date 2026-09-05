# backend/scripts/seed_graph.py
import asyncio
import sys
import os

# Add backend to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.db.neo4j import neo4j_db
from loguru import logger

# 🎯 100% Reliable Static Dataset (No API Rate Limits!)
MANGA_UNIVERSES = [
    {
        "title": "One Piece",
        "mal_id": 13,
        "characters": [
            {"name": "Monkey D. Luffy", "age": "19", "gender": "Male",
             "desc": "Captain of the Straw Hat Pirates, user of the Gomu Gomu no Mi (Hito Hito no Mi, Model: Nika)."},
            {"name": "Roronoa Zoro", "age": "21", "gender": "Male",
             "desc": "Swordsman of the Straw Hat Pirates, aspiring to be the world's greatest swordsman."},
            {"name": "Nami", "age": "20", "gender": "Female",
             "desc": "Navigator of the Straw Hat Pirates, skilled in cartography and weather manipulation."},
            {"name": "Sanji", "age": "21", "gender": "Male",
             "desc": "Cook of the Straw Hat Pirates, uses Black Leg Style martial arts."},
            {"name": "Shanks", "age": "39", "gender": "Male",
             "desc": "Captain of the Red Hair Pirates, one of the Four Emperors."}
        ]
    },
    {
        "title": "Naruto",
        "mal_id": 11,
        "characters": [
            {"name": "Naruto Uzumaki", "age": "17", "gender": "Male",
             "desc": "Jinchuriki of the Nine-Tails, aspiring to become the Hokage."},
            {"name": "Sasuke Uchiha", "age": "17", "gender": "Male",
             "desc": "Last surviving member of the Uchiha clan, seeking revenge and later redemption."},
            {"name": "Kakashi Hatake", "age": "30", "gender": "Male",
             "desc": "Leader of Team 7, known as the Copy Ninja, former user of the Sharingan."},
            {"name": "Itachi Uchiha", "age": "21", "gender": "Male",
             "desc": "Former Anbu captain, massacred the Uchiha clan to prevent a coup, secretly a hero."},
            {"name": "Madara Uchiha", "age": "70+", "gender": "Male",
             "desc": "Legendary leader of the Uchiha clan, co-founder of Konohagakure."}
        ]
    },
    {
        "title": "Dragon Ball",
        "mal_id": 42,
        "characters": [
            {"name": "Son Goku", "age": "40+", "gender": "Male",
             "desc": "Saiyan raised on Earth, protector of the universe, user of Ultra Instinct."},
            {"name": "Vegeta", "age": "40+", "gender": "Male",
             "desc": "Prince of all Saiyans, rival to Goku, constantly striving to surpass him."},
            {"name": "Piccolo", "age": "40+", "gender": "Male",
             "desc": "Namekian warrior, former enemy turned mentor to Gohan."},
            {"name": "Frieza", "age": "Unknown", "gender": "Male",
             "desc": "Intergalactic tyrant, responsible for the destruction of Planet Vegeta."},
            {"name": "Beerus", "age": "Millions", "gender": "Male",
             "desc": "God of Destruction of Universe 7, loves Earth cuisine."}
        ]
    }
]


async def seed_neo4j():
    logger.info("🚀 Starting MangaVerse GraphRAG Seeding (Offline Mode)...")
    await neo4j_db.connect()

    # 1. Create Constraints
    await neo4j_db.execute_query("CREATE CONSTRAINT universe_id IF NOT EXISTS FOR (u:Universe) REQUIRE u.id IS UNIQUE")
    await neo4j_db.execute_query(
        "CREATE CONSTRAINT character_id IF NOT EXISTS FOR (c:Character) REQUIRE c.id IS UNIQUE")

    total_chars = 0

    for universe in MANGA_UNIVERSES:
        title = universe["title"]
        mal_id = universe["mal_id"]
        universe_id = f"universe_{mal_id}"

        # Create Universe Node
        await neo4j_db.execute_query(
            "MERGE (u:Universe {id: $id}) SET u.title = $title, u.mal_id = $mal_id",
            {"id": universe_id, "title": title, "mal_id": mal_id}
        )
        logger.info(f"🌍 Created Universe: {title}")

        # Create Character Nodes and Relationships
        for char in universe["characters"]:
            char_name = char["name"]
            char_id = f"char_{title.lower().replace(' ', '_')}_{char_name.lower().replace(' ', '_')}"

            await neo4j_db.execute_query(
                """
                MERGE (c:Character {id: $id}) 
                SET c.name = $name, c.description = $desc, c.gender = $gender, c.age = $age
                """,
                {
                    "id": char_id,
                    "name": char_name,
                    "desc": char["desc"],
                    "gender": char["gender"],
                    "age": char["age"]
                }
            )

            # Link Character to Universe
            await neo4j_db.execute_query(
                "MATCH (c:Character {id: $cid}), (u:Universe {id: $uid}) MERGE (c)-[:BELONGS_TO]->(u)",
                {"cid": char_id, "uid": universe_id}
            )
            total_chars += 1

        logger.info(f"  ✅ Linked {len(universe['characters'])} characters to {title}")

    logger.info(f"🎉 GraphRAG Seeding Complete! {total_chars} characters injected into the Multiverse.")
    await neo4j_db.close()


if __name__ == "__main__":
    asyncio.run(seed_neo4j())