# backend/scripts/seed_quotes.py
import asyncio
import sys
import os
import httpx
from loguru import logger

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app.db.neo4j import neo4j_db

# Curated list of anime/manga quotes from various sources
QUOTES_DATABASE = [
    # One Piece
    {"quote": "I'm gonna be King of the Pirates!", "character": "Monkey D. Luffy", "anime": "One Piece"},
    {"quote": "If you don't take risks, you can't create a future.", "character": "Monkey D. Luffy",
     "anime": "One Piece"},
    {"quote": "I want to live!", "character": "Nico Robin", "anime": "One Piece"},

    # Naruto
    {"quote": "I'm not gonna run away, I never go back on my word!", "character": "Naruto Uzumaki", "anime": "Naruto"},
    {"quote": "Those who break the rules are scum, but those who abandon their friends are worse than scum.",
     "character": "Kakashi Hatake", "anime": "Naruto"},
    {"quote": "Hard work is worthless for those that don't believe in themselves.", "character": "Naruto Uzumaki",
     "anime": "Naruto"},

    # Dragon Ball
    {"quote": "I would rather be a brainless beast than a heartless monster.", "character": "Goku",
     "anime": "Dragon Ball Z"},
    {"quote": "Power comes in response to a need, not a desire.", "character": "Goku", "anime": "Dragon Ball Z"},

    # Attack on Titan
    {"quote": "If you win, you live. If you lose, you die. If you don't fight, you can't win!",
     "character": "Eren Yeager", "anime": "Attack on Titan"},
    {
        "quote": "I want to see and understand the world outside. I don't want to die inside these walls without knowing what's out there!",
        "character": "Eren Yeager", "anime": "Attack on Titan"},

    # Death Note
    {"quote": "I am Justice!", "character": "Light Yagami", "anime": "Death Note"},
    {"quote": "I'll take a potato chip... and eat it!", "character": "Light Yagami", "anime": "Death Note"},

    # Fullmetal Alchemist
    {
        "quote": "A lesson without pain is meaningless. For you cannot gain anything without sacrificing something else in return.",
        "character": "Edward Elric", "anime": "Fullmetal Alchemist"},
    {"quote": "Humankind cannot gain anything without first giving something in return.", "character": "Alphonse Elric",
     "anime": "Fullmetal Alchemist"},

    # My Hero Academia
    {"quote": "If you feel yourself hitting up against your limit, remember for what cause you clench your fists!",
     "character": "All Might", "anime": "My Hero Academia"},
    {"quote": "Whether you win or lose, looking back and learning from your experience is a part of life.",
     "character": "All Might", "anime": "My Hero Academia"},

    # Demon Slayer
    {
        "quote": "Feel the rage. The powerful, pure rage of not being able to forgive will become your unswerving core to support your resolve.",
        "character": "Giyu Tomioka", "anime": "Demon Slayer"},

    # Jujutsu Kaisen
    {"quote": "I don't want to regret the way I lived.", "character": "Yuji Itadori", "anime": "Jujutsu Kaisen"},
    {"quote": "When you die, you'll be alone.", "character": "Sukuna", "anime": "Jujutsu Kaisen"},

    # Bleach
    {"quote": "If I don't wield the sword, I can't protect you. If I keep wielding the sword, I can't embrace you.",
     "character": "Ichigo Kurosaki", "anime": "Bleach"},

    # Hunter x Hunter
    {
        "quote": "You should enjoy the little detours to the fullest. Because that's where you'll find the things more important than what you want.",
        "character": "Ging Freecss", "anime": "Hunter x Hunter"},

    # One Punch Man
    {"quote": "I'm just a guy who's a hero for fun.", "character": "Saitama", "anime": "One Punch Man"},

    # Tokyo Ghoul
    {"quote": "It's not the world that's messed up; it's those of us in it.", "character": "Ken Kaneki",
     "anime": "Tokyo Ghoul"},

    # Code Geass
    {"quote": "The only ones who should kill are those who are prepared to be killed.",
     "character": "Lelouch Lamperouge", "anime": "Code Geass"},

    # Steins;Gate
    {"quote": "No one knows what the future holds. That's why its potential is infinite.",
     "character": "Rintarou Okabe", "anime": "Steins;Gate"},

    # Cowboy Bebop
    {"quote": "Whatever happens, happens.", "character": "Spike Spiegel", "anime": "Cowboy Bebop"},

    # Fairy Tail
    {"quote": "The minute you think of giving up, think of the reason why you held on so long.",
     "character": "Natsu Dragneel", "anime": "Fairy Tail"},

    # Black Clover
    {"quote": "I want to be the Wizard King!", "character": "Asta", "anime": "Black Clover"},

    # Haikyuu
    {"quote": "The future belongs to those who believe in the beauty of their dreams.", "character": "Shoyo Hinata",
     "anime": "Haikyuu!!"},

    # Sword Art Online
    {"quote": "I'd rather trust and regret, than doubt and regret.", "character": "Kirito",
     "anime": "Sword Art Online"},
]


async def seed_quotes():
    """Seed quotes into Neo4j and link to existing characters"""
    logger.info(" Starting Quotes Database Seeding...")
    await neo4j_db.connect()

    # Create Quote constraint
    await neo4j_db.execute_query("""
        CREATE CONSTRAINT quote_id IF NOT EXISTS 
        FOR (q:Quote) REQUIRE q.id IS UNIQUE
    """)

    total_quotes = 0
    total_linked = 0

    for quote_data in QUOTES_DATABASE:
        quote_id = f"quote_{total_quotes}"

        # Create Quote node
        await neo4j_db.execute_query("""
            MERGE (q:Quote {id: $id})
            SET q.text = $text, 
                q.anime = $anime,
                q.character_name = $character
        """, {
            "id": quote_id,
            "text": quote_data["quote"],
            "anime": quote_data["anime"],
            "character": quote_data["character"]
        })

        # Try to link to existing Character in database
        await neo4j_db.execute_query("""
            MATCH (q:Quote {id: $quote_id}), (c:Character)
            WHERE toLower(c.name) CONTAINS toLower($character)
            MERGE (q)-[:SPOKEN_BY]->(c)
        """, {
            "quote_id": quote_id,
            "character": quote_data["character"]
        })

        total_quotes += 1
        total_linked += 1

    logger.info(f"✅ Seeded {total_quotes} quotes into Neo4j")
    logger.info(f"🔗 Linked {total_linked} quotes to characters")

    await neo4j_db.close()


if __name__ == "__main__":
    asyncio.run(seed_quotes())