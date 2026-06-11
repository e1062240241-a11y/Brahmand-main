import firebase_admin
from firebase_admin import credentials, firestore

print("Initializing Firebase connection...")
cred = credentials.Certificate('./firebase.json')
firebase_admin.initialize_app(cred)
db = firestore.client()

print("Fetching all users...")
users_ref = db.collection('users')
docs = list(users_ref.stream())
print(f"Found {len(docs)} users.")

count = 0
for doc in docs:
    user_id = doc.id
    print(f"Resetting passport data for user {user_id}...")
    
    users_ref.document(user_id).update({
        "passport_journeys": [],
        "passport_badges": [],
        "passport_certificates": [],
        "total_jaap": 0,
        "books_completed": 0
    })
    count += 1

print(f"Successfully reset passport records for {count} users.")
