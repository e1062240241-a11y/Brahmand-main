import asyncio
from config.firebase_config import get_firestore
from services.firebase_community_service import FirebaseCommunityService

async def main():
    await get_firestore()
    communities = await FirebaseCommunityService.discover_communities("tZquM28z1VhpOD9PRDbN")
    for c in communities:
        if c.get("type") == "user_group":
            print("User group returned:", c)

asyncio.run(main())
