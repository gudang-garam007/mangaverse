# backend/app/services/llm_service.py
import os
import httpx
from loguru import logger
from app.config import settings
from dotenv import load_dotenv

# ✅ EXPLICITLY LOAD .ENV FILE (Jaisa tune sahi kaha)
load_dotenv()


class LLMService:
    def __init__(self):
        # Collect all valid Groq keys (Check settings first, fallback to os.getenv)
        self.groq_keys = [
            getattr(settings, "GROQ_API_KEY_1", "") or os.getenv("GROQ_API_KEY_1", ""),
            getattr(settings, "GROQ_API_KEY_2", "") or os.getenv("GROQ_API_KEY_2", ""),
            getattr(settings, "GROQ_KEY_1", "") or os.getenv("GROQ_KEY_1", ""),
            getattr(settings, "GROQ_KEY_2", "") or os.getenv("GROQ_KEY_2", "")
        ]
        self.groq_keys = [str(k).strip() for k in self.groq_keys if
                          k and str(k).strip() != "" and "your_groq" not in str(k).lower()]

        # Collect all valid Mistral keys
        self.mistral_keys = [
            getattr(settings, "MISTRAL_API_KEY_1", "") or os.getenv("MISTRAL_API_KEY_1", ""),
            getattr(settings, "MISTRAL_API_KEY_2", "") or os.getenv("MISTRAL_API_KEY_2", ""),
            getattr(settings, "MISTRAL_KEY_1", "") or os.getenv("MISTRAL_KEY_1", ""),
            getattr(settings, "MISTRAL_KEY_2", "") or os.getenv("MISTRAL_KEY_2", "")
        ]
        self.mistral_keys = [str(k).strip() for k in self.mistral_keys if
                             k and str(k).strip() != "" and "your_mistral" not in str(k).lower()]

        # Models as requested (with os.getenv fallback)
        self.groq_model = (
                    getattr(settings, "GROQ_MODEL", "") or os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")).strip()
        self.mistral_model = (
                    getattr(settings, "MISTRAL_MODEL", "") or os.getenv("MISTRAL_MODEL", "open-mistral-nemo")).strip()

        # Round-robin counters
        self._groq_idx = 0
        self._mistral_idx = 0

        # ✅ DEBUG LOG TO PROVE IT WORKS
        logger.info(
            f"🔑 DEBUG: Loaded {len(self.groq_keys)} Groq keys. (Samples: {[k[:15] + '...' if k else 'EMPTY' for k in self.groq_keys]})")
        logger.info(
            f"🔑 DEBUG: Loaded {len(self.mistral_keys)} Mistral keys. (Samples: {[k[:15] + '...' if k else 'EMPTY' for k in self.mistral_keys]})")

    def _get_next_groq_key(self):
        if not self.groq_keys:
            return None
        key = self.groq_keys[self._groq_idx]
        self._groq_idx = (self._groq_idx + 1) % len(self.groq_keys)
        return key

    def _get_next_mistral_key(self):
        if not self.mistral_keys:
            return None
        key = self.mistral_keys[self._mistral_idx]
        self._mistral_idx = (self._mistral_idx + 1) % len(self.mistral_keys)
        return key

    async def generate(
            self,
            prompt: str,
            system_prompt: str = "",
            max_tokens: int = 3000,
            use_cache: bool = False,
            temperature: float = 0.7
    ) -> str:
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        # ==========================================
        # 1. PRIMARY: Try all Groq Keys (Round-Robin + Fallback)
        # ==========================================
        groq_attempts = len(self.groq_keys)
        for attempt in range(groq_attempts):
            key = self._get_next_groq_key()
            if not key:
                break

            try:
                logger.info(f"🔄 Attempting Groq (Key {attempt + 1}/{groq_attempts}, Model: {self.groq_model})...")
                async with httpx.AsyncClient(timeout=60.0) as client:
                    res = await client.post(
                        "https://api.groq.com/openai/v1/chat/completions",
                        json={
                            "model": self.groq_model,
                            "messages": messages,
                            "max_tokens": max_tokens,
                            "temperature": temperature
                        },
                        headers={
                            "Authorization": f"Bearer {key}",
                            "Content-Type": "application/json"
                        }
                    )
                    if res.status_code == 200:
                        logger.info("✅ Groq response received successfully")
                        return res.json()["choices"][0]["message"]["content"]
                    elif res.status_code == 429:
                        logger.warning(f"⚠️ Groq Key {attempt + 1} rate limit hit. Trying next key...")
                        continue  # Automatically try the next key
                    else:
                        logger.error(f"❌ Groq Key {attempt + 1} failed ({res.status_code}): {res.text[:200]}")
            except Exception as e:
                logger.error(f"❌ Groq Key {attempt + 1} exception: {e}")

        # ==========================================
        # 2. FALLBACK: Try all Mistral Keys (Round-Robin + Fallback)
        # ==========================================
        mistral_attempts = len(self.mistral_keys)
        for attempt in range(mistral_attempts):
            key = self._get_next_mistral_key()
            if not key:
                break

            try:
                logger.info(
                    f"🔄 Fallback to Mistral (Key {attempt + 1}/{mistral_attempts}, Model: {self.mistral_model})...")
                async with httpx.AsyncClient(timeout=60.0) as client:
                    res = await client.post(
                        "https://api.mistral.ai/v1/chat/completions",
                        json={
                            "model": self.mistral_model,
                            "messages": messages,
                            "max_tokens": max_tokens,
                            "temperature": temperature
                        },
                        headers={
                            "Authorization": f"Bearer {key}",
                            "Content-Type": "application/json"
                        }
                    )
                    if res.status_code == 200:
                        logger.info("✅ Mistral response received successfully")
                        return res.json()["choices"][0]["message"]["content"]
                    elif res.status_code == 429:
                        logger.warning(f"⚠️ Mistral Key {attempt + 1} rate limit hit. Trying next key...")
                        continue  # Automatically try the next key
                    else:
                        logger.error(f"❌ Mistral Key {attempt + 1} failed ({res.status_code}): {res.text[:200]}")
            except Exception as e:
                logger.error(f"❌ Mistral Key {attempt + 1} exception: {e}")

        # ==========================================
        # 3. FINAL FALLBACK
        # ==========================================
        raise Exception(
            "AI Generation failed. All Groq and Mistral API keys are exhausted or invalid. Check backend logs.")


llm_service = LLMService()