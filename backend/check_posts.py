import asyncio
from main import get_db
import json

async def check_posts():
    db = await get_db()
    posts = await db.query_documents('posts', limit=5, order_by='created_at', order_direction='DESCENDING')
    print(json.dumps(posts, indent=2, default=str))

if __name__ == "__main__":
    asyncio.run(check_posts())
