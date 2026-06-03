with open('c:/Users/prarh/Desktop/Brahmand-main/backend/main.py', 'r', encoding='utf-8') as f:
    for i, line in enumerate(f, 1):
        line_lower = line.lower()
        if 'vision' in line_lower or 'ocr' in line_lower or 'aadhaar' in line_lower:
            print(f"{i}: {line.strip()}")
