# backend/app/api/whatif.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from app.services.whatif_service import whatif_service
from loguru import logger

router = APIRouter()

class WhatIfRequest(BaseModel):
    scenario: str
    characters: List[str]
    previous_scenario: Optional[dict] = None
    choice_id: Optional[int] = None

class WhatIfResponse(BaseModel):
    scenario: dict
    story_id: str
    is_continuation: bool

@router.post("/generate", response_model=WhatIfResponse)
async def generate_whatif(request: WhatIfRequest):
    """Generate new What-If scenario or continue existing one"""
    try:
        if request.previous_scenario and request.choice_id is not None:
            # Continue existing story
            logger.info(f"Continuing story with choice {request.choice_id}")
            outcome = await whatif_service.generate_outcome(
                request.previous_scenario,
                request.choice_id
            )
            return WhatIfResponse(
                scenario=outcome,
                story_id=f"whatif_{hash(request.scenario) % 10000}",
                is_continuation=True
            )
        else:
            # Start new story
            logger.info(f"Generating new scenario: {request.scenario}")
            scenario = await whatif_service.generate_scenario(
                request.scenario,
                request.characters
            )
            return WhatIfResponse(
                scenario=scenario,
                story_id=f"whatif_{hash(request.scenario) % 10000}",
                is_continuation=False
            )
    except Exception as e:
        logger.error(f"WhatIf API error: {e}")
        raise HTTPException(500, str(e))

@router.get("/trending")
async def get_trending_scenarios():
    """Get trending community scenarios (placeholder for now)"""
    return {
        "trending": [
            {
                "id": 1,
                "title": "Naruto runs a Delhi Chai Shop",
                "votes": 1247,
                "author": "anime_fan_123"
            },
            {
                "id": 2,
                "title": "Goku vs Street Food Vendor",
                "votes": 892,
                "author": "foodie_saiyan"
            }
        ]
    }