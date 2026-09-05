from sqlalchemy import Column, String, Integer, Text, DECIMAL, DateTime, func
from sqlalchemy.dialects.postgresql import UUID, ARRAY
import uuid
from app.models.base import Base

class Manga(Base):
    __tablename__ = "manga"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    mal_id = Column(Integer, unique=True)
    anilist_id = Column(Integer, unique=True)
    title = Column(String(500), nullable=False)
    title_english = Column(String(500))
    title_japanese = Column(String(500))
    author = Column(String(200))
    status = Column(String(50))
    genres = Column(ARRAY(String))
    themes = Column(ARRAY(String))
    synopsis = Column(Text)
    cover_image_url = Column(Text)
    total_chapters = Column(Integer)
    rating = Column(DECIMAL(3, 2))
    popularity = Column(Integer)
    created_at = Column(DateTime, server_default=func.now())