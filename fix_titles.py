import os

titles_hindi = {
    'atharvaved': 'अथर्ववेद',
    'mahabharata': 'महाभारत',
    'ramayan': 'रामायण',
    'upanishads': 'उपनिषद्',
    'rigveda': 'ऋग्वेद',
    'yajurveda': 'यजुर्वेद',
    'ramcharitmanas': 'रामचरितमानस',
}

for filename, hindi_title in titles_hindi.items():
    filepath = f"frontend/app/library/{filename}.tsx"
    if not os.path.exists(filepath):
        continue
        
    with open(filepath, 'r') as f:
        content = f.read()
        
    # Replace the Hindi title
    content = content.replace('* श्रीमद्भगवद्गीता *', f'* {hindi_title} *')
    
    # Write back
    with open(filepath, 'w') as f:
        f.write(content)

print("Fixed Hindi titles")
