import os
import sys
import firebase_admin
from firebase_admin import credentials, firestore

def main():
    cred_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "./firebase.json")
    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred)
    db = firestore.client()
    
    comm_id = 'QiXgkHO5zKbhJxBfbvXt'
    colls = [c.id for c in db.collections() if c.id not in ('communities', 'users')]
    
    print(f"Scanning collections for ID {comm_id}: {colls}")
    
    for coll_name in colls:
        try:
            docs = db.collection(coll_name).stream()
            for doc in docs:
                data = doc.to_dict()
                data_str = str(data).lower()
                if comm_id.lower() in doc.id.lower() or comm_id.lower() in data_str:
                    print(f"FOUND MATCH in {coll_name}: ID={doc.id}, Data={data}")
        except Exception as e:
            print(f"Error scanning {coll_name}: {e}")
            
    print("Scan complete.")
    os._exit(0)

if __name__ == "__main__":
    main()
