from sqlalchemy import Column, String, Integer, Text, DateTime, ForeignKey, func, Boolean
from sqlalchemy.dialects.postgresql import UUID, ARRAY
import uuid
from app.models.base import Base


class Character(Base):
    __tablename__ = "characters"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    anilist_id = Column(Integer, unique=True)

    # Basic Info
    name = Column(String(200), nullable=False, index=True)  # Index added for faster search
    name_japanese = Column(String(200))
    manga_id = Column(UUID(as_uuid=True), ForeignKey("manga.id", ondelete="SET NULL"))
    universe = Column(String(100), index=True)
    role = Column(String(50))

    # Demographics
    gender = Column(String(20))
    age = Column(String(50))

    # Lore & Personality
    personality = Column(Text)
    backstory = Column(Text)
    catchphrases = Column(ARRAY(String))
    image_url = Column(Text)

    # ✅ NEW: Battle & Stats Parameters (Top-Notch Feature ke liye)
    strengths = Column(ARRAY(String), nullable=True)  # e.g., ["Haki", "Rubber Body"]
    weaknesses = Column(ARRAY(String), nullable=True)  # e.g., ["Sea Water", "Impulsive"]
    abilities = Column(ARRAY(String), nullable=True)  # e.g., ["Gear 5", "Conqueror's Haki"]

    power_level = Column(Integer, default=0)  # 0-1000 scale
    speed = Column(Integer, default=0)  # 0-100 scale
    hax = Column(Integer, default=0)  # 0-100 scale (reality bending, etc.)
    battle_iq = Column(Integer, default=0)  # 0-100 scale

    # ✅ NEW: Enrichment Metadata
    source_api = Column(String(50), nullable=True)  # "tenrai", "kitsu", "manual"
    is_enriched = Column(Boolean, default=False)  # Taaki pata chale kisne data fetch kiya hai

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())