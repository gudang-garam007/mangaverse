import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.character import Character

DATABASE_URL = "postgresql://neondb_owner:npg_o1EXzqUTLCd9@ep-late-unit-b3a5fcma-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

db = SessionLocal()

# Total characters count
total = db.query(Character).count()
print(f"📊 Total characters in database: {total}")

# Enriched vs Unenriched
enriched = db.query(Character).filter(Character.is_enriched == True).count()
unenriched = db.query(Character).filter(Character.is_enriched == False).count()

print(f"✅ Enriched: {enriched}")
print(f"❌ Unenriched: {unenriched}")

# Sample 5 characters
print("\n🔍 Sample characters:")
samples = db.query(Character).limit(5).all()
for char in samples:
    print(f"  - {char.name} | Universe: {char.universe} | Enriched: {char.is_enriched}")

db.close()