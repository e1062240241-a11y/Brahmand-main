import asyncio
from main import get_db

async def check_all():
    db = await get_db()
    posts = await db.query_documents('posts')
    print(f"Total posts: {len(posts)}")
    null_media = [p for p in posts if not p.get('media_url') and not p.get('mediaUrl')]
    print(f"Posts with null/missing media_url: {len(null_media)}")
    for p in null_media[:5]:
        print(f"ID: {p.get('id')}, user_id: {p.get('user_id')}, category: {p.get('category')}")

if __name__ == '__main__':
    asyncio.run(check_all())
