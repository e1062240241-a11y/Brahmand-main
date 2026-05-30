import asyncio
from main import get_db

async def find_user():
    db = await get_db()
    users = await db.query_documents('users')
    found = False
    for u in users:
        name = u.get('name', '')
        if 'dharam' in name.lower() or 'sangam' in name.lower():
            print("MATCH FOUND:")
            print(f"User ID: {u.get('id') or u.get('_id')}")
            print(f"  Name: {name}")
            print(f"  Phone: {u.get('phone')}")
            print(f"  Status: {u.get('status')}")
            print(f"  Is Blocked: {u.get('is_blocked')}")
            print(f"  Blocked Until: {u.get('blocked_until')}")
            print("-" * 40)
            found = True
    if not found:
        print("No users matching 'dharam sangam' found.")

if __name__ == "__main__":
    asyncio.run(find_user())
