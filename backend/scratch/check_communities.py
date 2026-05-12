import asyncio
import os
from config.firebase_config import firebase_manager, get_firestore
from config.firestore_db import FirestoreDB
from dotenv import load_dotenv

async def check_communities():
    load_dotenv()
    await firebase_manager.initialize()
    client = await get_firestore()
    db = FirestoreDB(client)
    
    docs = await db.query_documents('communities')
    for d in docs:
        print(f"Community: ID={d.get('id')}, Name={d.get('name')}, Type={d.get('type')}")

if __name__ == "__main__":
    asyncio.run(check_communities())
