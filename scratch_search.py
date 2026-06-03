with open('c:/Users/prarh/Desktop/Brahmand-main/backend/main.py', 'r', encoding='utf-8') as f:
    for i, line in enumerate(f, 1):
        if 'api_router' in line or 'temple' in line.lower() or 'include_router' in line:
            if i < 2000 or i > 10000: # limit output to start/end sections
                print(f"{i}: {line.strip()}")
