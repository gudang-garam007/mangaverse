# backend/app/api/panel.py
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from app.api.deps import get_current_user
from app.config import settings
import httpx, base64
from loguru import logger

router = APIRouter()


@router.post("/analyze")
async def analyze_panel(file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Must be an image")

    image_bytes = await file.read()
    if len(image_bytes) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image too large (max 10MB)")

    image_b64 = base64.b64encode(image_bytes).decode('utf-8')
    prompt_text = "Analyze this manga panel in detail: 1) Characters present and expressions, 2) Action/movement, 3) Speech bubbles/dialogue, 4) Art style (screentones, speedlines), 5) Emotional tone. Format as structured JSON."

    groq_key = getattr(settings, "GROQ_API_KEY", "").strip()
    mistral_key = getattr(settings, "MISTRAL_API_KEY", "").strip()

    # 1. Try Groq Vision
    if groq_key and groq_key != "your_groq_api_key_here":
        try:
            async with httpx.AsyncClient(timeout=45.0) as client:
                res = await client.post("https://api.groq.com/openai/v1/chat/completions",
                                        json={"model": "llama-3.2-90b-vision-preview", "messages": [{"role": "user",
                                                                                                     "content": [{
                                                                                                                     "type": "text",
                                                                                                                     "text": prompt_text},
                                                                                                                 {
                                                                                                                     "type": "image_url",
                                                                                                                     "image_url": {
                                                                                                                         "url": f"data:image/jpeg;base64,{image_b64}"}}]}],
                                              "max_tokens": 800},
                                        headers={"Authorization": f"Bearer {groq_key}",
                                                 "Content-Type": "application/json"})
                if res.status_code == 200:
                    return {"analysis": res.json()["choices"][0]["message"]["content"], "status": "success",
                            "provider": "groq"}
                logger.warning(f"Groq vision failed: {res.status_code}")
        except Exception as e:
            logger.warning(f"Groq vision exception: {e}")

    # 2. Fallback to Mistral Vision (Pixtral)
    if mistral_key and mistral_key != "your_mistral_api_key_here":
        try:
            async with httpx.AsyncClient(timeout=45.0) as client:
                res = await client.post("https://api.mistral.ai/v1/chat/completions",
                                        json={"model": "pixtral-12b-2409", "messages": [{"role": "user", "content": [
                                            {"type": "text", "text": prompt_text}, {"type": "image_url",
                                                                                    "image_url": f"data:image/jpeg;base64,{image_b64}"}]}],
                                              "max_tokens": 800},
                                        headers={"Authorization": f"Bearer {mistral_key}",
                                                 "Content-Type": "application/json"})
                if res.status_code == 200:
                    return {"analysis": res.json()["choices"][0]["message"]["content"], "status": "success",
                            "provider": "mistral"}
                raise Exception(f"Mistral Vision Error: {res.text[:150]}")
        except Exception as e:
            logger.error(f"Mistral vision fallback failed: {e}")

    raise HTTPException(status_code=500, detail="AI Vision unavailable. Both providers failed.")