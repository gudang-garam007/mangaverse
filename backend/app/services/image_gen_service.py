# backend/app/services/image_gen_service.py
import httpx
import base64
import urllib.parse
import re
from loguru import logger
from app.config import settings


class ImageGenService:

    def _clean_and_shorten_prompt(self, prompt: str) -> str:
        """Clean special chars and shorten prompt for Pollinations URL safety"""
        # Remove newlines and extra spaces
        clean = re.sub(r'\s+', ' ', prompt.replace('\n', ' ').replace('\r', ''))

        # Remove problematic characters that break URLs
        clean = clean.replace('(', '').replace(')', '').replace("'", "").replace('"', '')
        clean = clean.replace('&', 'and').replace('/', ' ')

        # Keep only the most important visual keywords (max 400 chars to prevent URL overflow)
        if len(clean) > 400:
            clean = clean[:400].rsplit(' ', 1)[0]  # Cut at last space

        return clean.strip()

    async def convert_photo_to_manga(self, image_bytes: bytes, style: str = "shonen") -> bytes:
        """Photo-to-Manga using Hyper-Detailed Vision Prompting (100% Free)"""
        try:
            logger.info("👁️ Step 1: Extracting hyper-detailed facial features...")
            description = await self._get_hyper_detailed_description(image_bytes)
            logger.info(f"📝 Extracted: {description[:100]}...")

            logger.info(f"🎨 Step 2: Generating manga via Pollinations ({style})...")
            manga_bytes = await self._generate_strict_manga(description, style)

            logger.info("✅ Manga avatar ready!")
            return manga_bytes
        except Exception as e:
            logger.error(f"❌ Error: {e}")
            raise Exception(f"Image generation failed: {str(e)}")

    async def _get_hyper_detailed_description(self, image_bytes: bytes) -> str:
        """Force Groq Vision to extract exact facial identity markers"""
        groq_key = getattr(settings, "GROQ_API_KEY", "")
        if not groq_key:
            return "young person, detailed face, anime style"

        image_b64 = base64.b64encode(image_bytes).decode('utf-8')

        # This prompt forces the AI to act like a police sketch artist
        payload = {
            "model": "llama-3.2-11b-vision-preview",
            "messages": [{
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": """Act as an expert anime character designer. Analyze this photo and describe the person's identity with extreme precision so an artist can recreate them exactly. 
                        You MUST include:
                        1. GENDER: (male/female)
                        2. FACE SHAPE: (e.g., round, square, sharp jawline)
                        3. HAIR: exact color, length, style, and parting (e.g., messy black hair, middle part)
                        4. EYES: shape and color (e.g., almond-shaped brown eyes)
                        5. FACIAL HAIR/FEATURES: (e.g., clean-shaven, light stubble, glasses, moles)
                        6. CLOTHING: (e.g., blue collared shirt)
                        7. EXPRESSION: (e.g., slight smile, serious)

                        Format strictly as a single, highly descriptive paragraph. Start with the gender."""
                    },
                    {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{image_b64}"}}
                ]
            }],
            "max_tokens": 250
        }

        headers = {"Authorization": f"Bearer {groq_key}", "Content-Type": "application/json"}

        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                res = await client.post("https://api.groq.com/openai/v1/chat/completions", json=payload,
                                        headers=headers)
                res.raise_for_status()
                return res.json()["choices"][0]["message"]["content"]
        except Exception as e:
            logger.warning(f"⚠️ Vision failed: {e}")
            return "young person, detailed face, expressive eyes, anime style"

    async def _generate_strict_manga(self, description: str, style: str) -> bytes:
        """Generate manga with strict adherence to the description"""
        style_prompts = {
            "shonen": "manga style, shonen jump, bold ink lines, dynamic shading, masterpiece, exact facial features",
            "shojo": "manga style, shojo, soft lines, sparkly eyes, pastel tones, beautiful, exact facial features",
            "seinen": "manga style, seinen, highly detailed, gritty, realistic proportions, dark ink, exact facial features",
            "chibi": "manga style, chibi, super deformed, big head, cute, kawaii, exact facial features",
            "retro": "manga style, 1980s retro, vintage screentone, akira style, exact facial features",
            "ghibli": "studio ghibli style, hayao miyazaki, vibrant colors, masterpiece, exact facial features",
            "cyberpunk": "cyberpunk manga, neon lights, dark shadows, futuristic, exact facial features",
            "dark_fantasy": "dark fantasy manga, horror, intricate details, heavy shadows, exact facial features"
        }

        base_prompt = style_prompts.get(style, style_prompts["shonen"])
        full_prompt = f"Portrait of a person with: {description}. {base_prompt}. Highly detailed face, matching reference photo exactly, masterpiece, best quality, 8k resolution"

        # ✅ CLEAN THE PROMPT BEFORE URL ENCODING
        clean_prompt = self._clean_and_shorten_prompt(full_prompt)
        encoded_prompt = urllib.parse.quote(clean_prompt)
        url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width=1024&height=1024&nologo=true&seed=42&model=flux"

        try:
            async with httpx.AsyncClient(timeout=90.0, follow_redirects=True) as client:
                res = await client.get(url)

                # ✅ FALLBACK MECHANISM IF 404 OR ERROR
                if res.status_code != 200:
                    logger.warning(f"⚠️ Primary Pollinations failed ({res.status_code}). Trying fallback...")
                    fallback_prompt = "manga portrait, highly detailed face, shonen style, black and white ink, masterpiece, dynamic shading"
                    encoded_fallback = urllib.parse.quote(fallback_prompt)
                    fallback_url = f"https://image.pollinations.ai/prompt/{encoded_fallback}?width=1024&height=1024&nologo=true&seed=42&model=flux"

                    res = await client.get(fallback_url)
                    res.raise_for_status()

                return res.content
        except Exception as e:
            logger.error(f"❌ Image generation failed: {e}")
            raise Exception(f"Image generation failed: {str(e)}")

    async def generate_text_to_manga(self, prompt: str, style: str = "shonen", width: int = 512,
                                     height: int = 512) -> bytes:
        """100% FREE: Text-to-Manga using Pollinations.ai with URL safety"""
        style_prompts = {
            "shonen": "manga style, shonen jump, bold ink lines, dynamic shading, masterpiece",
            "shojo": "manga style, shojo, soft lines, sparkly eyes, pastel tones, beautiful",
            "seinen": "manga style, seinen, highly detailed, gritty, realistic, masterpiece",
            "chibi": "manga style, chibi, super deformed, big head, cute, kawaii",
            "retro": "manga style, 1980s retro, vintage screentone, akira style",
            "ghibli": "studio ghibli style, hayao miyazaki, vibrant colors, masterpiece",
            "cyberpunk": "cyberpunk manga, neon lights, dark shadows, futuristic",
            "dark_fantasy": "dark fantasy manga, horror, intricate details, heavy shadows"
        }

        base_prompt = style_prompts.get(style, style_prompts["shonen"])
        full_prompt = f"{prompt}, {base_prompt}"

        # ✅ CLEAN THE PROMPT BEFORE URL ENCODING
        clean_prompt = self._clean_and_shorten_prompt(full_prompt)
        encoded_prompt = urllib.parse.quote(clean_prompt)
        url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width={width}&height={height}&nologo=true&seed=42&model=flux"

        try:
            async with httpx.AsyncClient(timeout=90.0, follow_redirects=True) as client:
                res = await client.get(url)

                # ✅ FALLBACK MECHANISM IF 404 OR ERROR
                if res.status_code != 200:
                    logger.warning(f"⚠️ Primary Pollinations failed ({res.status_code}). Trying fallback...")
                    fallback_prompt = f"manga battle scene, dynamic action, {style} style, black and white ink, masterpiece"
                    encoded_fallback = urllib.parse.quote(fallback_prompt)
                    fallback_url = f"https://image.pollinations.ai/prompt/{encoded_fallback}?width={width}&height={height}&nologo=true&seed=123&model=flux"

                    res = await client.get(fallback_url)
                    res.raise_for_status()

                return res.content
        except Exception as e:
            logger.error(f"❌ Image generation failed: {e}")
            raise Exception(f"Image generation failed: {str(e)}")


image_gen_service = ImageGenService()