import asyncio
import os
from config.firebase_config import firebase_manager, get_firestore
from config.firestore_db import FirestoreDB
from dotenv import load_dotenv

async def check_doc():
    load_dotenv()
    await firebase_manager.initialize()
    client = await get_firestore()
    db = FirestoreDB(client)
    
    doc_id = 'krlhDwBaGePAmPOFiOcS'
    d = await db.get_document('personality_verifications', doc_id)
    if d:
        print(f"Doc found: {d}")
    else:
        print("Doc NOT found")

if __name__ == "__main__":
    asyncio.run(check_doc())
