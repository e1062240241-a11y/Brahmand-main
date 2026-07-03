import asyncio
import sys
from pathlib import Path

# Add backend directory to path
sys.path.insert(0, str(Path(__file__).parent))

from main import get_db

async def diagnose():
    db = await get_db()
    uids = [
        "meGpOhOsKmsDeNTnDjr3",
        "zWqvuppy0ncfOCoeRHiD",
        "rAR1Nev9VOh836E0ATBz",
        "MlHzmd0YbRKzOpuCiyTe",
        "i9rbmMzfliZxRRZlFGY1",
        "3wmrCeCE4DToZutv3Ado",
        "vi7GVtpdVZDaZM4aeX0T",
        "231Xon7b168sZktGifX2",
        "tZquM28z1VhpOD9PRDbN",
        "FZut6Tc6yJQefVVQ5CNA",
        "RHJb1fnvq9C0a50YAjz4"
    ]
    
    with open("diagnose_output.txt", "w", encoding="utf-8") as f:
        f.write("=== TARGET USER (REAL SANTOSH) ===\n")
        target_user = await db.get_document("users", "rAR1Nev9VOh836E0ATBz")
        if target_user:
            f.write(f"Name: {target_user.get('name')}\n")
            f.write(f"Photo: {target_user.get('photo')}\n")
        else:
            f.write("Real Santosh Yadav user doc not found!\n")
        
        f.write("\n=== POSTS ===\n")
        all_posts = await db.query_documents("posts")
        f.write(f"Total posts in collection: {len(all_posts)}\n")
        for post in all_posts:
            uid = post.get("user_id")
            username = post.get("username")
            if uid in uids or (username and ("Santosh Yadav" in username or "Santosh Yadav 2" in username)):
                f.write(f"Post ID: {post.get('id')} | User ID: {uid} | Username: {username} | Category: {post.get('category')} | Caption: {post.get('caption')[:50] if post.get('caption') else ''}\n")
                
        f.write("\n=== COMMENTS ===\n")
        all_comments = await db.query_documents("post_comments")
        f.write(f"Total comments in collection: {len(all_comments)}\n")
        for comment in all_comments:
            uid = comment.get("user_id")
            username = comment.get("username")
            if uid in uids or (username and ("Santosh Yadav" in username or "Santosh Yadav 2" in username)):
                f.write(f"Comment ID: {comment.get('id')} | Post ID: {comment.get('post_id')} | User ID: {uid} | Username: {username} | Text: {comment.get('text')}\n")
                
        f.write("\n=== NOTIFICATIONS ===\n")
        all_notifications = await db.query_documents("notifications")
        f.write(f"Total notifications in collection: {len(all_notifications)}\n")
        for notif in all_notifications:
            uid = notif.get("user_id")
            sender_id = notif.get("sender_id")
            if uid in uids or sender_id in uids:
                f.write(f"Notif ID: {notif.get('id')} | User ID: {uid} | Sender ID: {sender_id} | Type: {notif.get('type')} | Title: {notif.get('title')}\n")


if __name__ == "__main__":
    asyncio.run(diagnose())
