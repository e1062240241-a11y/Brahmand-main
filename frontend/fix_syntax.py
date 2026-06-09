import os
import re

base_dir = "/Users/Developer/Desktop/Brahmand-main/frontend"

fixes = [
    {
        "file": "app/(tabs)/messages.tsx",
        "replacements": [
            ("new formatTimeIST(Date(c.lastMessageAt))", "formatTimeIST(c.lastMessageAt)")
        ]
    },
    {
        "file": "app/horoscope.tsx",
        "replacements": [
            ("new formatDateIST(Date())", "formatDateIST(new Date())")
        ]
    },
    {
        "file": "app/ekant-jaap.tsx",
        "replacements": [
            ("{new formatTimeIST(Date())} → {new Date(Date.now() + timeLeft * formatTimeIST(1000))}", "{formatTimeIST(new Date())} → {formatTimeIST(new Date(Date.now() + timeLeft * 1000))}")
        ]
    },
    {
        "file": "app/passport/timeline.tsx",
        "replacements": [
            ("new formatDateIST(Date(journey.date))", "formatDateIST(journey.date)"),
            ("new formatDateIST(Date(cert.date))", "formatDateIST(cert.date)")
        ]
    },
    {
        "file": "app/panchang.tsx",
        "replacements": [
            ("new formatDateIST(Date(dob))", "formatDateIST(dob)")
        ]
    },
    {
        "file": "app/ai-jyotish.tsx",
        "replacements": [
            ("new formatDateIST(Date(date))", "formatDateIST(date)"),
            ("new formatTimeIST(Date())", "formatTimeIST(new Date())"),
            ("new formatDateIST(Date())", "formatDateIST(new Date())")
        ]
    }
]

for fix in fixes:
    full_path = os.path.join(base_dir, fix['file'])
    if not os.path.exists(full_path):
        continue
    with open(full_path, 'r') as f:
        content = f.read()
    
    for old, new in fix['replacements']:
        content = content.replace(old, new)
        
    with open(full_path, 'w') as f:
        f.write(content)

print("Done syntax fix")
