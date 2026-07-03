import asyncio
from main import get_db

async def get_users_info():
    db = await get_db()
    uids = [
        "meGpOhOsKmsDeNTnDjr3",
        "zWqvuppy0ncfOCoeRHiD",
        "rAR1Nev9VOh836E0ATBz",
        "MlHzmd0YbRKzOpuCiyTe",
        "i9rbmMzfliZxRRZlFGY1",
        "3wmrCeCE4DToZutv3Ado",
        "vi7GVtpdVZDaZM4aeX0T"
    ]
    print("=== DETAILED USER DOCS ===")
    for uid in uids:
        u = await db.get_document('users', uid)
        if u:
            print(f"User ID: {uid}")
            print(f"  Name: {u.get('name')}")
            print(f"  SL ID: {u.get('sl_id')}")
            print(f"  Phone: {u.get('phone')}")
            print(f"  Photo: {u.get('photo')[:50] if u.get('photo') else None}")
            print(f"  Status: {u.get('status')}")
            print("-" * 40)
        else:
            print(f"User ID: {uid} NOT FOUND in users collection!")
            print("-" * 40)

if __name__ == "__main__":
    asyncio.run(get_users_info())
