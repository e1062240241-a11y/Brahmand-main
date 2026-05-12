import asyncio
import os
from config.firebase_config import firebase_manager, get_firestore
from config.firestore_db import FirestoreDB
from dotenv import load_dotenv

async def check_docs():
    load_dotenv()
    await firebase_manager.initialize()
    client = await get_firestore()
    db = FirestoreDB(client)
    
    count = await db.count_documents('personality_verifications')
    print(f"Total personality_verifications: {count}")
    
    docs = await db.query_documents('personality_verifications')
    for d in docs:
        print(f"Doc: ID={d.get('id')}, Status={d.get('status')}, Name={d.get('full_name')}")

if __name__ == "__main__":
    asyncio.run(check_docs())
