from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams
from app.config import settings
from loguru import logger

class QdrantDatabase:
    def __init__(self):
        self.client = QdrantClient(url=settings.QDRANT_URL)
        self.collections_initialized = False

    def init_collections(self):
        """Create collections if they don't exist"""
        existing = [c.name for c in self.client.get_collections().collections]

        collections_config = {
            "manga_chapters": {"size": 1024, "distance": Distance.COSINE},
            "character_dialogues": {"size": 1024, "distance": Distance.COSINE},
            "manga_summaries": {"size": 1024, "distance": Distance.COSINE},
        }

        for name, config in collections_config.items():
            if name not in existing:
                self.client.create_collection(
                    collection_name=name,
                    vectors_config=VectorParams(
                        size=config["size"],
                        distance=config["distance"],
                    ),
                )
                logger.info(f"Created Qdrant collection: {name}")
            else:
                logger.info(f"Qdrant collection already exists: {name}")

        self.collections_initialized = True

qdrant_db = QdrantDatabase()