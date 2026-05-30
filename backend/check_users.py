import asyncio
from main import get_db
import json

async def check_users():
    db = await get_db()
    users = await db.query_documents('users', limit=20)
    for u in users:
        print(f"User ID: {u.get('id')}")
        print(f"  Name: {u.get('name')}")
        print(f"  SL ID: {u.get('sl_id')}")
        print(f"  Location: {u.get('location')}")
        print(f"  Home Location: {u.get('home_location')}")
        print("-" * 40)

if __name__ == "__main__":
    asyncio.run(check_users())
