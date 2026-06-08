import asyncio
from main import app
from httpx import AsyncClient

async def main():
    # We can just run the function directly
    from main import discover_communities
    
    # Mock Depends(verify_token)
    token_data = {"user_id": "test_user"}
    res = await discover_communities(token_data=token_data)
    print("API Response Length:", len(res))
    
    user_groups = [r for r in res if r.get('type') == 'user_group']
    print("User Groups in API:", user_groups)

asyncio.run(main())
