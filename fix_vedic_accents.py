import glob
import re

files = glob.glob("frontend/app/library/*.tsx")

for filepath in files:
    if "continue-reading" in filepath or "sacred-scriptures" in filepath or "featured" in filepath or "index" in filepath or "yajurveda" in filepath:
        continue
        
    with open(filepath, 'r') as f:
        content = f.read()

    # Find the function signature
    sig = r"function renderVerseBlock\(verse: VerseItem, nightMode: boolean, layout: ReturnType<typeof useBookLayout>\) \{"
    
    # We want to replace {verse.text} with {cleanSanskrit}
    # and insert the definition right inside the function.
    
    if "cleanSanskrit" not in content and re.search(sig, content):
        insertion = """
  const cleanSanskrit = (verse.text || '').replace(/[\\u1CD0-\\u1CFF\\u0951-\\u0952]/g, '');
"""
        content = re.sub(sig, lambda m: m.group(0) + insertion, content)
        content = content.replace("{verse.text}", "{cleanSanskrit}")
        
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Fixed {filepath}")

print("Done stripping accents.")
