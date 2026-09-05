# backend/app/services/game_service.py
import hashlib
from datetime import date
from app.db.neo4j import neo4j_db
from loguru import logger


class GameService:
    """
    MangaLdle - Daily Manga Character Guessing Game
    Uses deterministic SHA-256 hash of today's date to pick the mystery character.
    Every user worldwide gets the same puzzle each day.
    """

    def _get_daily_seed(self) -> int:
        """Deterministic hash based on today's date"""
        today = date.today().isoformat()  # "2026-09-04"
        hash_hex = hashlib.sha256(today.encode()).hexdigest()
        return int(hash_hex, 16)

    def _get_puzzle_id(self) -> str:
        """Short puzzle ID for sharing"""
        return hashlib.sha256(date.today().isoformat().encode()).hexdigest()[:8]

    async def get_daily_character(self) -> dict | None:
        """Get today's mystery character using deterministic hash"""
        try:
            # Count total characters
            count_query = "MATCH (c:Character) RETURN count(c) as total"
            result = await neo4j_db.execute_query(count_query)
            total = result[0]["total"] if result else 0

            if total == 0:
                return None

            # Pick character using hash-based offset
            seed = self._get_daily_seed()
            offset = seed % total

            query = """
            MATCH (c:Character)-[:BELONGS_TO]->(u:Universe)
            WITH c, u
            ORDER BY c.name
            SKIP $offset
            LIMIT 1
            RETURN c.name as name, c.description as description, 
                   c.gender as gender, u.title as universe, c.id as id
            """
            result = await neo4j_db.execute_query(query, {"offset": offset})
            return result[0] if result else None
        except Exception as e:
            logger.error(f"Error getting daily character: {e}")
            return None

    async def get_character_by_name(self, name: str) -> dict | None:
        """Get character details for a user's guess"""
        try:
            query = """
            MATCH (c:Character)-[:BELONGS_TO]->(u:Universe)
            WHERE toLower(c.name) = toLower($name)
            RETURN c.name as name, c.gender as gender, 
                   u.title as universe, c.id as id
            LIMIT 1
            """
            result = await neo4j_db.execute_query(query, {"name": name})
            return result[0] if result else None
        except Exception as e:
            logger.error(f"Error getting character by name: {e}")
            return None

    def compare_guess(self, guess: dict, target: dict) -> dict:
        """Compare guess with target and return colored hints"""
        hints = {}

        # 1. Universe (exact match)
        if (guess.get("universe") or "").lower() == (target.get("universe") or "").lower():
            hints["universe"] = {"value": guess["universe"], "status": "correct"}
        else:
            hints["universe"] = {"value": guess["universe"], "status": "incorrect"}

        # 2. Gender (exact match)
        # 2. Gender (exact match) - Default to "Unknown" if missing
        guess_gender = (guess.get("gender") or "Unknown").lower()
        target_gender = (target.get("gender") or "Unknown").lower()

        if guess_gender == target_gender:
            hints["gender"] = {"value": guess.get("gender") or "Unknown", "status": "correct"}
        else:
            hints["gender"] = {"value": guess.get("gender") or "Unknown", "status": "incorrect"}

        #if (guess.get("gender") or "").lower() == (target.get("gender") or "").lower():
         #   hints["gender"] = {"value": guess["gender"], "status": "correct"}
        #else:
         #   hints["gender"] = {"value": guess["gender"], "status": "incorrect"}

        # 3. Name Length (with directional hint)
        guess_len = len(guess.get("name", ""))
        target_len = len(target.get("name", ""))
        if guess_len == target_len:
            hints["name_length"] = {"value": guess_len, "status": "correct"}
        elif abs(guess_len - target_len) <= 2:
            hints["name_length"] = {"value": guess_len, "status": "close"}
        else:
            hints["name_length"] = {
                "value": guess_len,
                "status": "incorrect",
                # If guess is shorter, target is longer (⬆️). If guess is longer, target is shorter (⬇️).
                "direction": "higher" if guess_len < target_len else "lower"
            }

        # 4. First Letter (exact match)
        guess_first = (guess.get("name") or "")[0:1].lower()
        target_first = (target.get("name") or "")[0:1].lower()
        if guess_first and guess_first == target_first:
            hints["first_letter"] = {"value": guess_first.upper(), "status": "correct"}
        else:
            hints["first_letter"] = {"value": guess_first.upper() if guess_first else "?", "status": "incorrect"}

        return hints


game_service = GameService()