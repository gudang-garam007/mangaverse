import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import asyncio
import aiohttp
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from rapidfuzz import fuzz
from app.models.character import Character
from app.models.base import Base
import time
from typing import List, Optional

# ✅ Direct database connection (no need for app.database import)
DATABASE_URL = "postgresql://neondb_owner:npg_o1EXzqUTLCd9@ep-late-unit-b3a5fcma-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# ... baaki code wahi rahega ...

class CharacterEnricher:
    def __init__(self):
        self.session = None
        self.rate_limit_delay = 2.5  # Safe delay to avoid API bans

    async def setup(self):
        self.session = aiohttp.ClientSession(headers={"User-Agent": "MangaVerse-Oracle/1.0"})

    async def close(self):
        if self.session:
            await self.session.close()

    def _extract_stats_from_text(self, text: str):
        """Simple keyword extraction for strengths/weaknesses"""
        if not text:
            return [], []

        text_lower = text.lower()
        strength_keywords = ["strong", "power", "master", "expert", "enhanced", "superhuman", "immense", "haki",
                             "chakra", "ki", "god"]
        weakness_keywords = ["weakness", "weak", "vulnerable", "limitation", "drawback", "cannot", "afraid", "fear",
                             "sea water", "reckless"]

        strengths = list(set([kw.capitalize() for kw in strength_keywords if kw in text_lower]))[:5]
        weaknesses = list(set([kw.capitalize() for kw in weakness_keywords if kw in text_lower]))[:3]

        return strengths, weaknesses

    async def fetch_and_update(self, db_session, character: Character):
        """Fetch data from Tenrai/Kitsu and update the existing DB row"""
        search_name = character.name

        try:
            # 1. Try Tenrai API
            url = f"https://tenrai.moe/api/v1/characters"
            async with self.session.get(url, params={"search": search_name, "limit": 3}, timeout=10) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    if data.get('data'):
                        best_match = data['data0']
                        attrs = best_match.get('attributes', {})

                        # Calculate confidence
                        confidence = fuzz.ratio(search_name.lower(), attrs.get('name', '').lower()) / 100.0

                        if confidence > 0.7:  # Only update if match is good
                            strengths, weaknesses = self._extract_stats_from_text(attrs.get('description', ''))

                            # ✅ Update Tera Existing Model
                            character.name_japanese = attrs.get('nativeName') or character.name_japanese
                            character.gender = attrs.get('gender') or character.gender
                            character.age = str(attrs.get('age')) if attrs.get('age') else character.age
                            character.image_url = attrs.get('image', {}).get('large') or character.image_url

                            # New Fields
                            character.strengths = strengths
                            character.weaknesses = weaknesses
                            character.power_level = min(500 + (100 if attrs.get('gender') == 'Male' else 0),
                                                        1000)  # Basic heuristic
                            character.speed = 85 if 'fast' in attrs.get('description', '').lower() else 50
                            character.hax = 90 if 'reality' in attrs.get('description', '').lower() else 50
                            character.battle_iq = 90 if 'genius' in attrs.get('description', '').lower() else 60
                            character.source_api = "tenrai"
                            character.is_enriched = True

                            db_session.commit()
                            print(f"✅ Updated: {character.name}")
                            return

            # 2. Fallback to Kitsu if Tenrai fails
            url = "https://kitsu.io/api/edge/characters"
            async with self.session.get(url, params={"filter[name]": search_name, "page[limit]": 3},
                                        timeout=10) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    if data.get('data'):
                        best_match = data['data'][0]
                        attrs = best_match.get('attributes', {})

                        confidence = fuzz.ratio(search_name.lower(),
                                                attrs.get('names', {}).get('en', '').lower()) / 100.0

                        if confidence > 0.7:
                            strengths, weaknesses = self._extract_stats_from_text(attrs.get('description', ''))

                            character.name_japanese = attrs.get('names', {}).get('native') or character.name_japanese
                            character.gender = attrs.get('gender') or character.gender
                            character.image_url = attrs.get('image', {}).get('original') if attrs.get(
                                'image') else character.image_url

                            character.strengths = strengths
                            character.weaknesses = weaknesses
                            character.source_api = "kitsu"
                            character.is_enriched = True

                            db_session.commit()
                            print(f"✅ Updated (Kitsu): {character.name}")
                            return

        except Exception as e:
            print(f"❌ Error processing {character.name}: {e}")

        # Rate limiting
        await asyncio.sleep(self.rate_limit_delay)

    async def run_enrichment(self, batch_size=50):
        """Main runner"""
        await self.setup()
        db = SessionLocal()

        # Sirf un characters ko fetch karo jo abhi tak enrich nahi hue
        unenriched_chars = db.query(Character).filter(Character.is_enriched == False).limit(batch_size).all()

        if not unenriched_chars:
            print("🎉 All characters are already enriched!")
            return

        print(f"🚀 Starting enrichment for {len(unenriched_chars)} characters...")

        for char in unenriched_chars:
            await self.fetch_and_update(db, char)

        await self.close()
        db.close()
        print("✅ Batch enrichment complete!")


# Run karne ke liye:
# Run karne ke liye:
if __name__ == "__main__":
    print("🚀 Script started! Connecting to database...")
    asyncio.run(CharacterEnricher().run_enrichment(batch_size=100))