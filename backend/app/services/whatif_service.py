# backend/app/services/whatif_service.py
import json
from loguru import logger
from typing import List, Dict, Any
from app.services.llm_service import llm_service  # ✅ USE EXISTING WORKING LLM SERVICE


class WhatIfService:
    def __init__(self):
        self.system_prompt = """You are a creative anime/manga storyteller. Generate interactive "What If" scenarios in STRICT JSON format.

RULES:
1. Keep it funny, dramatic, or wholesome based on the user's prompt.
2. Each scene should have exactly 2 choices.
3. Choices should lead to different, interesting outcomes.
4. Include character emotions and visual descriptions.
5. Keep text concise and engaging.

OUTPUT FORMAT (STRICT JSON ONLY, NO MARKDOWN):
{
  "scenario_title": "Short catchy title",
  "scene_description": "What's happening visually",
  "story_text": "Main narrative (2-3 sentences)",
  "character_emotions": {"Character1": "emotion", "Character2": "emotion"},
  "visual_style": "manga/anime style description for image generation",
  "choices": [
    {
      "id": 1,
      "text": "Choice description",
      "outcome_preview": "What happens next (teaser)"
    },
    {
      "id": 2,
      "text": "Choice description",
      "outcome_preview": "What happens next (teaser)"
    }
  ],
  "meme_text": "Funny one-liner for social media share",
  "tags": ["funny", "cursed", "wholesome"]
}"""

    async def generate_scenario(self, user_prompt: str, characters: List[str]) -> Dict[str, Any]:
        prompt = f"""
Create a What-If scenario with these characters: {', '.join(characters)}

User's scenario: {user_prompt}

Generate the FIRST scene of an interactive story. Make it engaging and give 2 meaningful choices.
Respond ONLY with valid JSON.
"""
        try:
            response_text = await llm_service.generate(
                prompt=prompt,
                system_prompt=self.system_prompt,
                max_tokens=1000,
                temperature=0.8
            )
            return self._parse_json_response(response_text)
        except Exception as e:
            logger.error(f"WhatIf generation error: {e}")
            return self._get_fallback_scenario(characters, user_prompt)

    async def generate_outcome(self, scenario: Dict[str, Any], choice_id: int) -> Dict[str, Any]:
        chosen_text = next((c["text"] for c in scenario.get("choices", []) if c["id"] == choice_id), "Unknown choice")

        prompt = f"""
Continue the story based on this choice.

Previous Scene: {scenario.get('story_text', '')}
Characters & Emotions: {scenario.get('character_emotions', {})}
User chose: "{chosen_text}"

Generate the NEXT scene with:
1. What happens as a result of this choice
2. New twist or development
3. Exactly 2 new choices for what to do next

Respond ONLY with valid JSON in the same format as before.
"""
        try:
            response_text = await llm_service.generate(
                prompt=prompt,
                system_prompt=self.system_prompt,
                max_tokens=1000,
                temperature=0.9
            )
            return self._parse_json_response(response_text)
        except Exception as e:
            logger.error(f"Outcome generation error: {e}")
            return self._get_fallback_outcome()

    def _parse_json_response(self, text: str) -> Dict[str, Any]:
        try:
            clean_text = text.strip()
            if clean_text.startswith("```json"):
                clean_text = clean_text[7:]
            if clean_text.startswith("```"):
                clean_text = clean_text[3:]
            if clean_text.endswith("```"):
                clean_text = clean_text[:-3]
            return json.loads(clean_text.strip())
        except json.JSONDecodeError as e:
            logger.error(f"JSON parse error: {e}. Raw text: {text[:200]}")
            raise Exception("Failed to parse JSON")

    def _get_fallback_scenario(self, characters: List[str], prompt: str) -> Dict[str, Any]:
        char_name = characters[0] if characters else "Hero"
        return {
            "scenario_title": f"{char_name}'s Unexpected Adventure",
            "scene_description": f"{char_name} looks around in confusion",
            "story_text": f"{', '.join(characters)} face an unusual challenge: {prompt}",
            "character_emotions": {char: "determined" for char in characters},
            "visual_style": "dynamic action pose, high quality anime style, vibrant colors",
            "choices": [
                {"id": 1, "text": "Take the bold approach", "outcome_preview": "Things get intense..."},
                {"id": 2, "text": "Think strategically", "outcome_preview": "A clever plan forms..."}
            ],
            "meme_text": f"What if {', '.join(characters)} had to deal with this? 😂",
            "tags": ["adventure", "funny"]
        }

    def _get_fallback_outcome(self) -> Dict[str, Any]:
        return {
            "scenario_title": "The Story Continues",
            "scene_description": "Unexpected developments occur",
            "story_text": "The situation takes an interesting and dramatic turn...",
            "character_emotions": {"Hero": "surprised"},
            "visual_style": "dramatic reveal, high quality anime style, intense lighting",
            "choices": [
                {"id": 1, "text": "Continue forward", "outcome_preview": "More awaits..."},
                {"id": 2, "text": "Reconsider options", "outcome_preview": "Second thoughts..."}
            ],
            "meme_text": "The plot thickens! 🤔",
            "tags": ["continuation"]
        }


whatif_service = WhatIfService()