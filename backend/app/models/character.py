from sqlalchemy import Column, String, Integer, Text, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID, ARRAY
import uuid
from app.models.base import Base

class Character(Base):
    __tablename__ = "characters"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    anilist_id = Column(Integer, unique=True)
    name = Column(String(200), nullable=False)
    name_japanese = Column(String(200))
    manga_id = Column(UUID(as_uuid=True), ForeignKey("manga.id", ondelete="SET NULL"))
    universe = Column(String(100), index=True)
    role = Column(String(50))
    personality = Column(Text)
    backstory = Column(Text)
    catchphrases = Column(ARRAY(String))
    image_url = Column(Text)
    gender = Column(String(20))
    age = Column(String(50))
    created_at = Column(DateTime, server_default=func.now())