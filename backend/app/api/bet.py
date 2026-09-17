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
    bet_type: str
    amount: int


class DailyRewardResponse(BaseModel):
    berries_added: int
    new_balance: int
    streak: int
    already_claimed: bool


# Helper function to get ORM User object from dict
def get_user_orm(current_user: dict, db: Session) -> User:
    user_id = current_user.get("id") or current_user.get("sub")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found in database")
    return user


@router.get("/user/balance")
async def get_user_balance(
        current_user: dict = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    user = get_user_orm(current_user, db)
    return {
        "berries": user.berries or 1000,
        "streak": user.daily_login_streak or 0
    }


@router.post("/place")
async def place_bet(
        req: PlaceBetRequest,
        current_user: dict = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    if req.bet_type not in ["canon", "clown"]:
        raise HTTPException(400, detail="Invalid bet type")
    if req.amount < 10:
        raise HTTPException(400, detail="Minimum bet is 10 berries")
    if req.amount > 1000:
        raise HTTPException(400, detail="Maximum bet is 1000 berries")

    user = get_user_orm(current_user, db)
    current_balance = user.berries or 1000

    if current_balance < req.amount:
        raise HTTPException(400, detail=f"Not enough berries! You have ₿{current_balance}")

    user.berries = current_balance - req.amount
    user.total_berry_spent = (user.total_berry_spent or 0) + req.amount
    db.commit()
    db.refresh(user)

    logger.info(f"✅ User {user.id} placed {req.bet_type} bet of ₿{req.amount}")

    return {
        "status": "success",
        "message": f"Bet placed: {req.bet_type.upper()} for ₿{req.amount}",
        "new_balance": user.berries
    }


@router.get("/daily-reward")
async def claim_daily_reward(
        current_user: dict = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    user = get_user_orm(current_user, db)
    today = date.today()

    if user.last_login_date == today:
        return DailyRewardResponse(
            berries_added=0,
            new_balance=user.berries or 1000,
            streak=user.daily_login_streak or 0,
            already_claimed=True
        )

    streak = user.daily_login_streak or 0
    if user.last_login_date:
        days_diff = (today - user.last_login_date).days
        if days_diff == 1:
            streak += 1
        else:
            streak = 1
    else:
        streak = 1

    base_reward = 50
    streak_bonus = min(streak * 10, 100)
    total_reward = base_reward + streak_bonus

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