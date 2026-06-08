import asyncio
from config.firebase_config import get_firestore
from config.firestore_db import FirestoreDB
from services.firebase_community_service import FirebaseCommunityService

async def main():
    db = await get_firestore()
    communities = await FirebaseCommunityService.discover_communities("tZquM28z1VhpOD9PRDbN")
    for c in communities:
        if c.get("type") == "user_group":
            print("Found user group in discover_communities:", c)

asyncio.run(main())
