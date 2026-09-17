from sqlalchemy import Column, String, Integer, Date, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
import uuid
from app.models.base import Base


class User(Base):
    __tablename__ = "users"

    # Existing fields
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    display_name = Column(String(100))
    avatar_url = Column(String)
    auth_provider = Column(String(50), default="email")
    subscription_tier = Column(String(20), default="free")
    daily_battles_used = Column(Integer, default=0)
    daily_analyses_used = Column(Integer, default=0)
    daily_conversions_used = Column(Integer, default=0)
    daily_chat_messages = Column(Integer, default=0)
    last_reset_date = Column(Date, server_default=func.current_date())
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # ✅ NEW: Bounty Board & Betting Fields
    berries = Column(Integer, default=1000, nullable=False)  # Starting balance
    daily_login_streak = Column(Integer, default=0)
    last_login_date = Column(Date)
    badges = Column(String, default="[]")  # JSON array as string: ["Prophet", "Theorist"]
    theories_posted = Column(Integer, default=0)
    bets_won = Column(Integer, default=0)
    bets_lost = Column(Integer, default=0)
    total_berry_earned = Column(Integer, default=0)
    total_berry_spent = Column(Integer, default=0)