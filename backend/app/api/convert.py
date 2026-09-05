# backend/app/api/convert.py
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from app.api.deps import get_current_user, check_feature_limit
from app.services.image_gen_service import image_gen_service
import base64

router = APIRouter()


@router.post("/manga")
async def convert_to_manga(
        file: UploadFile = File(...),
        style: str = Form(default="shonen"),
        user: dict = Depends(get_current_user)
):
    # Check daily limit
    await check_feature_limit(user, "conversions", free_limit=3)

    # SAFE file type validation (Fixes the 'NoneType' error)
    content_type = file.content_type or ""
    if not content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    # Read and validate size
    image_bytes = await file.read()
    if len(image_bytes) > 10 * 1024 * 1024:  # 10MB limit
        raise HTTPException(status_code=400, detail="Image size must be less than 10MB")

    try:
        manga_image_bytes = await image_gen_service.convert_photo_to_manga(
            image_bytes=image_bytes,
            style=style
        )

        b64_image = base64.b64encode(manga_image_bytes).decode("utf-8")

        return {
            "success": True,
            "style": style,
            "image_base64": f"data:image/jpeg;base64,{b64_image}",
            "message": "Photo successfully converted to Manga style!"
        }
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image generation failed: {str(e)}")


@router.post("/text-to-manga")
async def text_to_manga(
        prompt: str = Form(...),
        style: str = Form(default="shonen"),
        user: dict = Depends(get_current_user)
):
    await check_feature_limit(user, "text_conversions", free_limit=10)

    try:
        image_bytes = await image_gen_service.generate_text_to_manga(
            prompt=prompt,
            style=style
        )
        b64_image = base64.b64encode(image_bytes).decode("utf-8")

        return {
            "success": True,
            "style": style,
            "image_base64": f"data:image/jpeg;base64,{b64_image}"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")


@router.get("/styles")
async def list_styles():
    return {
        "styles": [
            {"id": "shonen", "name": "Shonen", "desc": "Bold lines, dynamic action"},
            {"id": "shojo", "name": "Shojo", "desc": "Soft, sparkly, pastel"},
            {"id": "seinen", "name": "Seinen", "desc": "Dark, detailed, mature"},
            {"id": "chibi", "name": "Chibi", "desc": "Cute, super deformed"},
            {"id": "retro", "name": "Retro 90s", "desc": "Vintage cel shading"},
            {"id": "ghibli", "name": "Studio Ghibli", "desc": "Lush backgrounds, vibrant"},
            {"id": "cyberpunk", "name": "Cyberpunk", "desc": "Neon lights, dark futuristic"},
            {"id": "dark_fantasy", "name": "Dark Fantasy", "desc": "Heavy shadows, intricate"}
        ]
    }