import asyncio
from config.firebase_config import get_firestore

async def count_domains():
    db = await get_firestore()
    posts = db.collection('posts').stream()
    
    appspot_count = 0
    firebase_app_count = 0
    other_count = 0
    total = 0
    
    for doc in posts:
        total += 1
        data = doc.to_dict()
        url = str(data.get('media_url', ''))
        if 'sanatan-lok.appspot.com' in url:
            appspot_count += 1
        elif 'sanatan-lok.firebasestorage.app' in url:
            firebase_app_count += 1
        else:
            other_count += 1
            
    print(f"Total Posts: {total}")
    print(f"Appspot URLs: {appspot_count}")
    print(f"Firebase Storage App URLs: {firebase_app_count}")
    print(f"Other/Missing: {other_count}")

if __name__ == "__main__":
    asyncio.run(count_domains())
