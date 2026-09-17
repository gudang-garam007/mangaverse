from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
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


async def get_user_orm(current_user: dict, db: AsyncSession) -> User:
    user_id = current_user.get("id") or current_user.get("user_id")

    # ✅ Async query
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        user = User(
            id=user_id,
            email=current_user.get("email", "mock@mangaverse.com"),
            display_name=current_user.get("username", "Manga Fan"),
            berries=1000,
            daily_login_streak=0
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

    return user


@router.get("/user/balance")
async def get_user_balance(
        current_user: dict = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
):
    user = await get_user_orm(current_user, db)
    return {
        "berries": user.berries or 1000,
        "streak": user.daily_login_streak or 0
    }


@router.post("/place")
async def place_bet(
        req: PlaceBetRequest,
        current_user: dict = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
):
    if req.bet_type not in ["canon", "clown"]:
        raise HTTPException(400, detail="Invalid bet type")
    if req.amount < 10:
        raise HTTPException(400, detail="Minimum bet is 10 berries")
    if req.amount > 1000:
        raise HTTPException(400, detail="Maximum bet is 1000 berries")

    user = await get_user_orm(current_user, db)
    current_balance = user.berries or 1000

    if current_balance < req.amount:
        raise HTTPException(400, detail=f"Not enough berries! You have ₿{current_balance}")

    user.berries = current_balance - req.amount
    user.total_berry_spent = (user.total_berry_spent or 0) + req.amount
    await db.commit()
    await db.refresh(user)

    logger.info(f"✅ User {user.id} placed {req.bet_type} bet of ₿{req.amount}")

    return {
        "status": "success",
        "message": f"Bet placed: {req.bet_type.upper()} for {req.amount}",
        "new_balance": user.berries
    }


@router.get("/daily-reward")
async def claim_daily_reward(
        current_user: dict = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
):
    user = await get_user_orm(current_user, db)
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
    await db.commit()
    await db.refresh(user)

    logger.info(f"✅ User {user.id} claimed daily reward: ₿{total_reward} (streak: {streak})")

    return DailyRewardResponse(
        berries_added=total_reward,
        new_balance=user.berries,
        streak=streak,
        already_claimed=False
    )