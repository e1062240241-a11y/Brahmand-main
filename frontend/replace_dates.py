import os
import re

# Files to modify
files = [
    "src/features/live-mantra/schedule.ts",
    "src/components/PostFeedCard.tsx",
    "app/community/[id].tsx",
    "app/dm/[conversationId].tsx",
    "app/all-live-jaaps.tsx",
    "app/ekant-jaap.tsx",
    "app/notifications.tsx",
    "app/passport/certificate/[id].tsx",
    "app/passport/timeline.tsx",
    "app/(tabs)/messages.tsx",
    "app/(tabs)/jaap.tsx",
    "app/(tabs)/index.tsx",
    "app/panchang.tsx",
    "app/horoscope.tsx",
    "app/chat/[type]/[id].tsx",
    "app/live-mantra.tsx",
    "app/my-krishna.tsx",
    "app/ai-jyotish.tsx"
]

base_dir = "/Users/Developer/Desktop/Brahmand-main/frontend"

# We need to add the import at the top if it doesn't exist
import_statement = "import { formatDateIST, formatTimeIST, formatDateTimeIST } from '../src/utils/dateUtils';\n"
# Wait, the path to dateUtils depends on the depth.
# Let's do it dynamically.

def get_import_path(filepath):
    depth = len(filepath.split('/')) - 1
    if depth == 0:
        prefix = "./"
    else:
        prefix = "../" * depth
    return f"import {{ formatDateIST, formatTimeIST, formatDateTimeIST }} from '{prefix}src/utils/dateUtils';\n"

for f in files:
    full_path = os.path.join(base_dir, f)
    if not os.path.exists(full_path):
        continue
        
    with open(full_path, 'r') as file:
        content = file.read()
        
    original_content = content
        
    # We'll use regex to find specific usages and replace them carefully.
    # It's better to manually replace the ones we found.
    # Example: date.toLocaleTimeString([], { ... })
    
    # 1. replace `.toLocaleDateString('en-GB', ...)`
    content = re.sub(r'([a-zA-Z0-9_().]+)\.toLocaleDateString\((.*?)\)', r'formatDateIST(\1)', content)
    
    # 2. replace `.toLocaleTimeString([], ...)`
    content = re.sub(r'([a-zA-Z0-9_().]+)\.toLocaleTimeString\((.*?)\)', r'formatTimeIST(\1)', content)
    
    # 3. replace `.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })`
    # We'll just replace `.toLocaleString(...)` on Date objects. But be careful not to match Number.toLocaleString()
    # If the prefix contains 'Date(' or 'Date.' or 'date', it's a date.
    
    # Let's just do an AST-like or simpler replacement.
    # Actually, we can just replace new Date(X).toLocaleDateString() -> formatDateIST(X)
    content = re.sub(r'new Date\((.*?)\)\.toLocaleDateString\([^)]*\)', r'formatDateIST(\1)', content)
    content = re.sub(r'new Date\((.*?)\)\.toLocaleTimeString\([^)]*\)', r'formatTimeIST(\1)', content)
    
    # For `date.toLocaleTimeString(...)` where `date` is a variable
    content = re.sub(r'\b([a-zA-Z0-9_]+Date[a-zA-Z0-9_]*|\bdate\b|\bstart[a-zA-Z0-9_]*|\bend[a-zA-Z0-9_]*|\bcurrentTime\b|\btimestamp\b)\.toLocaleTimeString\([^)]*\)', r'formatTimeIST(\1)', content)
    content = re.sub(r'\b([a-zA-Z0-9_]+Date[a-zA-Z0-9_]*|\bdate\b|\bstart[a-zA-Z0-9_]*|\bend[a-zA-Z0-9_]*|\bcurrentTime\b|\btimestamp\b)\.toLocaleDateString\([^)]*\)', r'formatDateIST(\1)', content)

    # Specific fixes
    content = content.replace("new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })", "formatTimeIST(new Date())")
    content = content.replace("new Date(Date.now() + timeLeft * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })", "formatTimeIST(new Date(Date.now() + timeLeft * 1000))")
    
    # Add imports if changed
    if content != original_content and "formatDateIST" in content or "formatTimeIST" in content:
        if "import { formatDateIST" not in content:
            # find first import
            import_idx = content.find("import ")
            import_str = get_import_path(f)
            if import_idx != -1:
                content = content[:import_idx] + import_str + content[import_idx:]
            else:
                content = import_str + content
                
    with open(full_path, 'w') as file:
        file.write(content)

print("Done")
