import asyncio
from config.firebase_config import get_firestore

async def debug_match():
    db = await get_firestore()
    post = db.collection('posts').document('1RcfpCkm2P9962nA96wc').get()
    if not post.exists:
        print("Post not found")
        return
        
    data = post.to_dict()
    url = data.get('media_url', '')
    print(f"URL from DB: {url}")
    
    OLD_DOMAIN = "sanatan-lok.appspot.com"
    print(f"Looking for: {OLD_DOMAIN}")
    
    if OLD_DOMAIN in url:
        print("MATCH FOUND IN DEBUG SCRIPT!")
    else:
        print("NO MATCH IN DEBUG SCRIPT!")
        # Let's see where it differs
        if "sanatan-lok" in url:
            start = url.find("sanatan-lok")
            print(f"Domain found in DB: {url[start:start+40]}")

if __name__ == "__main__":
    asyncio.run(debug_match())
