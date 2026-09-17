from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.db.postgres import get_db
from app.models.user import User
from app.api.deps import get_current_user
from loguru import logger
from datetime import date

router = APIRouter(prefix="/bet", tags=["Betting"])


class PlaceBetRequest(BaseModel):
    theory_id: str
    bet_type: str  # "canon" or "clown"
    amount: int


class DailyRewardResponse(BaseModel):
    berries_added: int
    new_balance: int
    streak: int
    already_claimed: bool


@router.get("/user/balance")
async def get_user_balance(
        user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """Get current user's berry balance"""
    return {
        "berries": user.berries or 1000,
        "streak": user.daily_login_streak or 0
    }


@router.post("/place")
async def place_bet(
        req: PlaceBetRequest,
        user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """Place a bet on a theory"""
    if req.bet_type not in ["canon", "clown"]:
        raise HTTPException(400, detail="Invalid bet type")

    if req.amount < 10:
        raise HTTPException(400, detail="Minimum bet is 10 berries")

    if req.amount > 1000:
        raise HTTPException(400, detail="Maximum bet is 1000 berries")

    current_balance = user.berries or 1000

    if current_balance < req.amount:
        raise HTTPException(400, detail=f"Not enough berries! You have ₿{current_balance}")

    # Deduct berries
    user.berries = current_balance - req.amount
    user.total_berry_spent = (user.total_berry_spent or 0) + req.amount
    db.commit()
    db.refresh(user)

    logger.info(f"✅ User {user.id} placed {req.bet_type} bet of ₿{req.amount} on theory {req.theory_id}")

    return {
        "status": "success",
        "message": f"Bet placed: {req.bet_type.upper()} for ₿{req.amount}",
        "new_balance": user.berries
    }


@router.get("/daily-reward")
async def claim_daily_reward(
        user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """Claim daily login reward"""
    today = date.today()

    # Check if already claimed today
    if user.last_login_date == today:
        return DailyRewardResponse(
            berries_added=0,
            new_balance=user.berries or 1000,
            streak=user.daily_login_streak or 0,
            already_claimed=True
        )

    # Calculate streak
    streak = user.daily_login_streak or 0

    if user.last_login_date:
        days_diff = (today - user.last_login_date).days
        if days_diff == 1:
            streak += 1
        else:
            streak = 1
    else:
        streak = 1

    # Calculate reward based on streak
    base_reward = 50
    streak_bonus = min(streak * 10, 100)  # Max 100 bonus
    total_reward = base_reward + streak_bonus

    # Update user
    user.berries = (user.berries or 1000) + total_reward
    user.total_berry_earned = (user.total_berry_earned or 0) + total_reward
    user.last_login_date = today
    user.daily_login_streak = streak
    db.commit()
    db.refresh(user)

    logger.info(f"✅ User {user.id} claimed daily reward: ₿{total_reward} (streak: {streak})")

    return DailyRewardResponse(
        berries_added=total_reward,
        new_balance=user.berries,
        streak=streak,
        already_claimed=False
    )