import os
import json
from datetime import datetime
import firebase_admin
from firebase_admin import credentials, firestore

# Path to firebase.json
firebase_json_path = os.path.join(os.path.dirname(__file__), "..", "firebase.json")
if not os.path.exists(firebase_json_path):
    # Fallback to local dir check
    firebase_json_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "firebase.json"))

print(f"Using credentials from: {firebase_json_path}")

cred = credentials.Certificate(firebase_json_path)
firebase_admin.initialize_app(cred)

db = firestore.client()

# Fetch all root collections
collections = db.collections()

backup_data = {}

for coll in collections:
    coll_name = coll.id
    print(f"Exporting collection: {coll_name}...")
    backup_data[coll_name] = {}
    
    docs = coll.stream()
    for doc in docs:
        backup_data[coll_name][doc.id] = doc.to_dict()

# Generate backup filename
timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
backup_filename = f"firestore_backup_{timestamp}.json"
backup_filepath = os.path.join(os.path.dirname(__file__), backup_filename)

with open(backup_filepath, "w", encoding="utf-8") as f:
    json.dump(backup_data, f, default=str, indent=2)

print(f"\nBackup successfully created!")
print(f"File path: {backup_filepath}")
print(f"Total collections backed up: {len(backup_data)}")
