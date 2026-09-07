import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from app.main import app
import asyncio
from loguru import logger


async def test_api():
    print("🔍 Testing API Endpoint...")

    client = TestClient(app)

    # Test 1: /api/characters/search
    print("\n🔄 Testing GET /api/characters/search?q=Luffy")
    response = client.get("/api/characters/search?q=Luffy")

    print(f"   Status Code: {response.status_code}")

    if response.status_code == 200:
        data = response.json()
        print(f"   Total characters: {data.get('total', 0)}")
        print(f"   Cached: {data.get('cached', False)}")

        characters = data.get('characters', [])
        if characters:
            print(f"\n📊 First character:")
            print(f"   Name: {characters[0]['name']}")
            print(f"   Universe: {characters[0]['universe']}")
            print(f"   Power Level: {characters[0]['power_level']}")
        else:
            print("❌ API RETURNED EMPTY CHARACTERS LIST!")
    else:
        print(f"❌ API FAILED WITH STATUS {response.status_code}")
        print(f"   Response: {response.text}")


if __name__ == "__main__":
    asyncio.run(test_api())