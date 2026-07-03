import asyncio
from main import get_db
import json

async def inspect():
    db = await get_db()
    posts = await db.query_documents('posts', limit=100)
    print(f"Total posts retrieved: {len(posts)}")
    for p in posts:
        print(f"Post ID: {p.get('id')} | User ID: {p.get('user_id')} | Username: {p.get('username')} | Caption: {p.get('caption')}")

if __name__ == "__main__":
    asyncio.run(inspect())
