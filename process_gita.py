import json
import os

# Paths to the downloaded files
VERSE_FILE = "/tmp/gita.json"
TRANS_FILE = "/tmp/translations.json"
CHAP_FILE = "/tmp/chapters.json"
OUTPUT_FILE = "/Users/Developer/Desktop/Brahmand-main/frontend/assets/data/gita_data.json"

# Load the JSONs
with open(VERSE_FILE, 'r', encoding='utf-8') as f:
    verses_raw = json.load(f)

with open(TRANS_FILE, 'r', encoding='utf-8') as f:
    translations_raw = json.load(f)

with open(CHAP_FILE, 'r', encoding='utf-8') as f:
    chapters_raw = json.load(f)

# Extract Hindi translations mapped by verse_id
# If there are multiple, pick Swami Ramsukhdas or just the first one
hindi_translations = {}
for t in translations_raw:
    if t.get("lang") == "hindi":
        v_id = t.get("verse_id")
        desc = t.get("description", "").strip()
        author = t.get("authorName", "")
        
        # Prefer Swami Ramsukhdas, otherwise keep the first one
        if v_id not in hindi_translations:
            hindi_translations[v_id] = desc
        elif "Swami Ramsukhdas" in author:
            hindi_translations[v_id] = desc

# Build the structured dict
# Structure: { chapter_id (int): { title: str, name: str, verses: [ {id, sanskrit, hindi} ] } }
gita_structured = {}

for ch in chapters_raw:
    ch_num = ch["chapter_number"]
    gita_structured[ch_num] = {
        "title": f"अध्याय {ch_num}",
        "name": ch["name"],
        "verses": []
    }

for v in verses_raw:
    ch_num = v["chapter_number"]
    v_id = v["id"] # The global verse ID
    v_num = v["verse_number"]
    
    # Clean up the sanskrit text slightly (remove extra newlines and specific trailing characters)
    sanskrit_text = v["text"].strip()
    
    hindi_text = hindi_translations.get(v_id, "")
    # Clean up hindi text
    hindi_text = hindi_text.replace("\n", " ").strip()
    
    if ch_num in gita_structured:
        gita_structured[ch_num]["verses"].append({
            "id": v_num,
            "sanskrit": sanskrit_text,
            "hindi": hindi_text
        })

# Create directory if not exists
os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)

with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
    json.dump(gita_structured, f, ensure_ascii=False, indent=2)

print(f"Successfully wrote {OUTPUT_FILE}")
