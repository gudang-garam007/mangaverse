# backend/app/services/vision_service.py
import httpx
import base64
from loguru import logger
from app.config import settings
from tenacity import retry, stop_after_attempt, wait_exponential


class VisionService:
    def __init__(self):
        self.groq_url = "https://api.groq.com/openai/v1/chat/completions"
        self.mistral_url = "https://api.mistral.ai/v1/chat/completions"

    def _encode_image(self, image_bytes: bytes) -> str:
        return base64.b64encode(image_bytes).decode('utf-8')

    @retry(stop=stop_after_attempt(2), wait=wait_exponential(multiplier=1, min=2, max=5))
    async def _analyze_with_groq(self, image_base64: str, prompt: str) -> str:
        headers = {"Authorization": f"Bearer {settings.GROQ_API_KEY}", "Content-Type": "application/json"}
        payload = {
            "model": "llama-3.2-11b-vision-preview",
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{image_base64}"}}
                    ]
                }
            ],
            "temperature": 0.5,
            "max_tokens": 1024
        }
        async with httpx.AsyncClient(timeout=60.0) as client:
            res = await client.post(self.groq_url, json=payload, headers=headers)
            res.raise_for_status()
            return res.json()["choices"][0]["message"]["content"]

    @retry(stop=stop_after_attempt(2), wait=wait_exponential(multiplier=1, min=2, max=5))
    async def _analyze_with_mistral(self, image_base64: str, prompt: str) -> str:
        headers = {"Authorization": f"Bearer {settings.MISTRAL_API_KEY}", "Content-Type": "application/json"}
        payload = {
            "model": "pixtral-12b-2409",  # Mistral's vision model
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{image_base64}"}}
                    ]
                }
            ],
            "max_tokens": 1024
        }
        async with httpx.AsyncClient(timeout=60.0) as client:
            res = await client.post(self.mistral_url, json=payload, headers=headers)
            res.raise_for_status()
            return res.json()["choices"][0]["message"]["content"]

    async def analyze_panel(self, image_bytes: bytes,
                            prompt: str = "Analyze this manga panel. Identify characters, emotions, action, and any visual symbolism.") -> str:
        image_b64 = self._encode_image(image_bytes)
        try:
            logger.info("👁️ Analyzing panel with Groq Vision...")
            return await self._analyze_with_groq(image_b64, prompt)
        except Exception as e:
            logger.warning(f"⚠️ Groq Vision failed: {e}. Falling back to Mistral Pixtral...")
            return await self._analyze_with_mistral(image_b64, prompt)


vision_service = VisionService()