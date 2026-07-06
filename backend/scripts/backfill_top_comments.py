import asyncio
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.config.firestore_db import FirestoreDB
from backend.main import get_firestore

async def backfill_top_comments():
    print("Starting backfill of top_comments for legacy posts...")
    client = await get_firestore()
    db = FirestoreDB(client)

    # Query all posts that don't have top_comments yet
    # In Firestore, we can't easily query for "missing field", so we scan
    # Limit to a batch for safety in a real script, here we'll just scan 1000
    try:
        posts = await db.query_documents('posts', limit=1000)
        updated_count = 0

        for post in posts:
            if 'top_comments' not in post:
                try:
                    top_comments_raw = await db.query_documents(
                        'post_comments',
                        filters=[('post_id', '==', post.get('id'))],
                        limit=5,
                    )

                    # Sort them
                    def _comment_sort_key(item: dict):
                        val = item.get('created_at')
                        import datetime
                        if isinstance(val, datetime.datetime): return val
                        if isinstance(val, str):
                            try: return datetime.datetime.fromisoformat(val.replace('Z', '+00:00'))
                            except Exception: return datetime.datetime.min
                        return datetime.datetime.min

                    top_comments_raw.sort(key=_comment_sort_key, reverse=True)
                    top_comments = top_comments_raw[:5]

                    await db.update_document('posts', post.get('id'), {'top_comments': top_comments})
                    updated_count += 1
                except Exception as e:
                    print(f"Error updating post {post.get('id')}: {e}")

        print(f"Successfully backfilled top_comments for {updated_count} posts.")
    except Exception as e:
        print(f"Fatal error during backfill: {e}")

if __name__ == "__main__":
    asyncio.run(backfill_top_comments())
