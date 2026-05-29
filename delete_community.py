import asyncio
from backend.database import get_db

async def main():
    db = await get_db()
    # Search for the community by name
    communities = await db.query_documents('communities')
    deleted = 0
    for c in communities:
        if c.get('name') and 'mumbai' in c.get('name').lower() and 'ganpti' in c.get('name').lower():
            print(f"Deleting community: {c['name']} (ID: {c['id']})")
            await db.delete_document('communities', c['id'])
            deleted += 1
            
    if deleted == 0:
        # maybe 'ganpati' instead of 'ganpti'
        for c in communities:
            if c.get('name') and 'mumbai' in c.get('name').lower() and 'ganpati' in c.get('name').lower():
                print(f"Deleting community: {c['name']} (ID: {c['id']})")
                await db.delete_document('communities', c['id'])
                deleted += 1
                
    print(f"Total deleted: {deleted}")

if __name__ == "__main__":
    asyncio.run(main())
