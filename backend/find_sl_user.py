import asyncio
from main import get_db

async def find_sl_user():
    db = await get_db()
    users = await db.query_documents('users')
    found = False
    target = 'SL-526592'
    for u in users:
        sl_id = u.get('sl_id', '')
        if sl_id and target.lower() in str(sl_id).lower():
            print("MATCH FOUND:")
            print(f"User ID: {u.get('id') or u.get('_id')}")
            print(f"  Name: {u.get('name')}")
            print(f"  SL ID: {sl_id}")
            print(f"  Phone: {u.get('phone')}")
            print(f"  Status: {u.get('status')}")
            print(f"  Is Blocked: {u.get('is_blocked')}")
            print(f"  Blocked Until: {u.get('blocked_until')}")
            print("-" * 40)
            found = True
    if not found:
        print(f"No users matching SL ID '{target}' found.")

if __name__ == "__main__":
    asyncio.run(find_sl_user())
