import json
import csv
import sys
import os

# Import the raw list generator
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from generate_all_temples import expanded_temple_list

# We need exactly 188 or 187+ high quality temples. Let's make sure categories are strictly valid:
VALID_CATEGORIES = {
    "Jyotirlinga",
    "Char Dham",
    "Shakti Peetha",
    "Ashtavinayak",
    "Panch Bhoota Sthalam",
    "Vishnu Temple",
    "Shiva Temple",
    "Devi Temple",
    "Hanuman Temple",
    "Sacred"
}

# Clean and dedup list while strictly enforcing models & category requirements
final_temples = []
seen_ids = set()

for t in expanded_temple_list:
    tid = t["temple_id"]
    if tid in seen_ids:
        continue
    seen_ids.add(tid)
    
    # Ensure category is valid
    if t["category"] not in VALID_CATEGORIES:
        t["category"] = "Sacred"
        
    final_temples.append(t)

print(f"Total Unique Temples Count: {len(final_temples)}")

# Batch writing JSON files (25 temples per file)
batch_size = 25
total_batches = (len(final_temples) + batch_size - 1) // batch_size

output_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "batches")
os.makedirs(output_dir, exist_ok=True)

for i in range(total_batches):
    batch = final_temples[i * batch_size : (i + 1) * batch_size]
    batch_num = i + 1
    filename = f"temples_batch_{batch_num:02d}.json"
    filepath = os.path.join(output_dir, filename)
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(batch, f, indent=2, ensure_ascii=False)
    print(f"Saved {filepath} with {len(batch)} items.")

# Complete import JSON file
full_json_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "temples_import.json")
with open(full_json_path, "w", encoding="utf-8") as f:
    json.dump(final_temples, f, indent=2, ensure_ascii=False)
print(f"Saved complete JSON import file to {full_json_path}")

# Complete CSV file
csv_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "temples_import.csv")
csv_headers = [
    "temple_id", "name", "category", "city", "area", "state", "country", 
    "deity", "description", "aarti_timings", "timings", "guidance", 
    "latitude", "longitude", "contact", "youtube_url", "images", "is_verified"
]

with open(csv_path, "w", encoding="utf-8", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=csv_headers)
    writer.writeheader()
    for t in final_temples:
        writer.writerow({
            "temple_id": t["temple_id"],
            "name": t["name"],
            "category": t["category"],
            "city": t["location"].get("city", ""),
            "area": t["location"].get("area", ""),
            "state": t["location"].get("state", ""),
            "country": t["location"].get("country", ""),
            "deity": t.get("deity", ""),
            "description": t.get("description", ""),
            "aarti_timings": json.dumps(t.get("aarti_timings", {})),
            "timings": json.dumps(t.get("timings", {})),
            "guidance": t.get("guidance", ""),
            "latitude": t.get("coords", {}).get("latitude", ""),
            "longitude": t.get("coords", {}).get("longitude", ""),
            "contact": t.get("contact", ""),
            "youtube_url": t.get("youtube_url", ""),
            "images": json.dumps(t.get("images", [])),
            "is_verified": t.get("is_verified", False)
        })
print(f"Saved complete CSV import file to {csv_path}")

# Generate temple_seed_data.py content
seed_data_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "temple_seed_data.py")
with open(seed_data_path, "w", encoding="utf-8") as f:
    f.write("TEMPLE_SEED_DATA = ")
    f.write(json.dumps(final_temples, indent=4, ensure_ascii=False).replace("true", "True").replace("false", "False").replace("null", "None"))
    f.write("\n")
print(f"Updated backend/data/temple_seed_data.py successfully!")
