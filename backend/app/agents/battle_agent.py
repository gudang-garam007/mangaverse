# backend/app/agents/battle_agent.py
from loguru import logger
from app.db.neo4j import neo4j_db
from app.services.llm_service import llm_service
import json
import re


def _parse_llm_json(raw_text: str) -> dict:
    """
    Bulletproof JSON extractor.
    NO GARBAGE 'UNKNOWN' FALLBACK.
    Attempts auto-fix for truncation. If it fails, raises error for clean handling.
    """
    try:
        # Step 1: Remove markdown code blocks (```json ... ```)
        text = re.sub(r'^```(?:json)?\s*|\s*```$', '', raw_text.strip(), flags=re.MULTILINE)

        # Step 2: Find the outermost JSON object
        start = text.find('{')
        end = text.rfind('}')
        if start == -1 or end == -1 or end <= start:
            raise ValueError("No JSON object found in LLM response")

        json_str = text[start:end + 1]

        # Step 3: Try parsing directly
        return json.loads(json_str)

    except json.JSONDecodeError as e:
        logger.warning(f"⚠️ JSON Parse Error: {e}. Attempting auto-fix for truncation...")

        # Auto-fix truncation: count open and close braces
        open_braces = json_str.count('{')
        close_braces = json_str.count('}')
        if open_braces > close_braces:
            json_str += '}' * (open_braces - close_braces)

        try:
            return json.loads(json_str)
        except json.JSONDecodeError:
            # If auto-fix fails, RAISE ERROR. DO NOT RETURN GARBAGE "UNKNOWN" DATA.
            logger.error(f"❌ JSON auto-fix failed. Raw text: {raw_text[:300]}")
            raise ValueError("AI returned malformed JSON that could not be auto-fixed.")

    except Exception as e:
        logger.error(f"❌ Unexpected error in JSON parsing: {e}")
        raise ValueError(f"Invalid JSON: {e}")


class BattleAgent:
    # SCORING SCALE DEFINITIONS
    SCORING_SCALE = {
        "0-2": "Street / Normal human level",
        "3-4": "City / Enhanced human level",
        "5-6": "Country / High-tier level",
        "7-8": "Planetary / Continent+ level",
        "9": "Star / Multi-planetary level",
        "10": "Universal+ / Reality warping level"
    }

    CATEGORY_DEFINITIONS = {
        "speed": "Combat speed + reaction time (NOT travel speed)",
        "attack_power": "Highest destructive feat (AP)",
        "durability": "Highest damage tanked without regeneration",
        "hax": "Reality warping, erasure, mind control, time/space manipulation, soul attacks",
        "battle_iq": "Mid-fight adaptation, tactical genius, strategy",
        "stamina": "How long peak form can be maintained",
        "experience": "Actual high-level fights fought and won"
    }

    async def _get_character_data(self, character_name: str):
        query = """
        MATCH (c:Character)
        WHERE toLower(c.name) = toLower($name) OR toLower(c.name) CONTAINS toLower($name)
        OPTIONAL MATCH (c)-[:BELONGS_TO]->(u:Universe)
        WITH c, u, CASE WHEN toLower(c.name) = toLower($name) THEN 1 ELSE 0 END as exact_match
        ORDER BY exact_match DESC, size(c.name) ASC
        RETURN c.name AS name, c.description AS description, c.age AS age, c.gender AS gender, u.title AS universe
        LIMIT 1
        """
        results = await neo4j_db.execute_query(query, {"name": character_name})
        return results[0] if results else None

    def _detect_extreme_mismatch(self, scores: dict) -> bool:
        """Detect if power gap is extreme (>= 4 points in AP + Durability)"""
        try:
            ap_diff = abs(
                scores.get("attack_power", {}).get("char1", 0) - scores.get("attack_power", {}).get("char2", 0))
            dur_diff = abs(scores.get("durability", {}).get("char1", 0) - scores.get("durability", {}).get("char2", 0))
            avg_diff = (ap_diff + dur_diff) / 2
            return avg_diff >= 4
        except Exception:
            return False

    async def analyze_battle(self, char1_name: str, char2_name: str) -> dict:
        logger.info(f"⚔️ Initiating Battle Analysis: {char1_name} vs {char2_name}")

        data1 = await self._get_character_data(char1_name)
        data2 = await self._get_character_data(char2_name)

        if not data1 or not data2:
            missing = [n for n, d in [(char1_name, data1), (char2_name, data2)] if not d]
            return {"error": f"Character(s) not found: {', '.join(missing)}", "success": False}

        # 🛡️ SANITIZE DATA: Remove quotes and newlines to prevent breaking the prompt's JSON structure
        desc1 = data1.get('description', 'No description available').replace('"', "'").replace('\n', ' ').replace('\r',
                                                                                                                  '')[
                :150]
        desc2 = data2.get('description', 'No description available').replace('"', "'").replace('\n', ' ').replace('\r',
                                                                                                                  '')[
                :150]
        name1 = data1.get('name', 'Unknown')
        name2 = data2.get('name', 'Unknown')
        universe1 = data1.get('universe', 'Unknown')
        universe2 = data2.get('universe', 'Unknown')

        # ENHANCED PROMPT WITH STRICT JSON TEMPLATE
        system_prompt = f"""You are the MangaVerse Oracle, an elite anime/manga battle analyst.

SCORING SCALE (0-10):
{json.dumps(self.SCORING_SCALE, indent=2)}

CATEGORY DEFINITIONS:
{json.dumps(self.CATEGORY_DEFINITIONS, indent=2)}

YOU MUST OUTPUT A SINGLE VALID JSON OBJECT. DO NOT include markdown formatting like ```json. 
Use this EXACT structure (replace placeholders with integers/strings):
{{
    "character_1_stats": {{"name": "{name1}", "universe": "{universe1}", "key_abilities": "{desc1}"}},
    "character_2_stats": {{"name": "{name2}", "universe": "{universe2}", "key_abilities": "{desc2}"}},
    "category_scores": {{
        "speed": {{"char1": 5, "char2": 5}},
        "attack_power": {{"char1": 5, "char2": 5}},
        "durability": {{"char1": 5, "char2": 5}},
        "hax": {{"char1": 5, "char2": 5}},
        "battle_iq": {{"char1": 5, "char2": 5}},
        "stamina": {{"char1": 5, "char2": 5}},
        "experience": {{"char1": 5, "char2": 5}}
    }},
    "battle_dynamics": "Detailed paragraph covering 3 scenarios: 1) In-Character (morals on), 2) Bloodlusted (kill intent), 3) Equal Stats (pure skill). Be FEAT-BASED and HONEST.",
    "verdict": "Clear winner with reasoning based on feats and scores.",
    "win_probability": {{"character_1": 50, "character_2": 50}}
}}

CRITICAL RULES:
1. Scores MUST be integers between 0 and 10 based on canonical feats.
2. Win probabilities MUST be integers between 0 and 100, summing to 100.
3. Output ONLY valid JSON. No conversational text outside the JSON."""

        user_prompt = f"""Analyze battle:
Character 1: {name1} from {universe1}
Lore: {desc1}

Character 2: {name2} from {universe2}
Lore: {desc2}"""

        try:
            raw_response = await llm_service.generate(
                prompt=user_prompt,
                system_prompt=system_prompt,
                use_cache=True,
                max_tokens=3000  # ✅ INCREASED TO 3000 TO PREVENT TRUNCATION
            )

            # This function will now RAISE an error if it can't parse, instead of returning garbage.
            analysis = _parse_llm_json(raw_response)

            # 🛡️ SAFETY NET: Ensure all expected keys exist using ACTUAL DATA, NOT "Unknown" or "5"
            analysis.setdefault("character_1_stats", {"name": name1, "universe": universe1, "key_abilities": desc1})
            analysis.setdefault("character_2_stats", {"name": name2, "universe": universe2, "key_abilities": desc2})
            analysis.setdefault("battle_dynamics", "Analysis generated but details were incomplete.")
            analysis.setdefault("verdict", "Analysis complete based on available data.")
            analysis.setdefault("win_probability", {"character_1": 50, "character_2": 50})
            analysis.setdefault("category_scores", {
                "speed": {"char1": 0, "char2": 0}, "attack_power": {"char1": 0, "char2": 0},
                "durability": {"char1": 0, "char2": 0}, "hax": {"char1": 0, "char2": 0},
                "battle_iq": {"char1": 0, "char2": 0}, "stamina": {"char1": 0, "char2": 0},
                "experience": {"char1": 0, "char2": 0}
            })

            # EXTREME MISMATCH DETECTION
            is_extreme_mismatch = self._detect_extreme_mismatch(analysis.get("category_scores", {}))
            analysis["extreme_mismatch"] = is_extreme_mismatch

            if is_extreme_mismatch:
                analysis[
                    "mismatch_warning"] = "⚠️ EXTREME POWER GAP DETECTED - This is a one-sided fight based on canonical feats."
                logger.warning("⚠️ Extreme mismatch detected in battle")

            analysis["success"] = True
            logger.info("✅ Battle Analysis Generated Successfully!")
            return analysis

        except ValueError as e:
            # ✅ CLEAN ERROR HANDLING: No garbage data. Just a clear message to retry.
            logger.error(f"❌ Battle Analysis Failed (Parsing): {e}")
            return {"error": "AI formatting error. The analysis was incomplete. Please try again.", "success": False}
        except Exception as e:
            logger.error(f"❌ Battle Analysis Failed: {e}")
            return {"error": str(e), "success": False}


battle_agent = BattleAgent()