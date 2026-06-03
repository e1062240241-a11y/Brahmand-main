with open('c:/Users/prarh/Desktop/Brahmand-main/backend/main.py', 'r', encoding='utf-8') as f:
    content = f.read()
    print("temple in main.py:", "/temples" in content or "temple_routes" in content or "temple_router" in content)
    print("community_routes in main.py:", "community_routes" in content or "community_router" in content)
