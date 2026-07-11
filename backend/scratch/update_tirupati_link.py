import firebase_admin
from firebase_admin import credentials, firestore

print("Initializing Firebase connection...")
cred = credentials.Certificate('./firebase.json')
try:
    firebase_admin.initialize_app(cred)
except ValueError:
    # already initialized
    pass

db = firestore.client()

temple_id = 'other-tirupati-balaji-temple-andhra-pradesh'
new_url = 'https://www.youtube.com/live/dwsS3bxweBw?si=QsVpIa_kHuh0FPB6'

print(f"Querying temples collection where temple_id == '{temple_id}'...")
temples_ref = db.collection('temples')
query = temples_ref.where('temple_id', '==', temple_id)
docs = list(query.stream())

print(f"Found {len(docs)} documents matching temple_id == '{temple_id}' in query.")

for doc in docs:
    print(f"Updating document ID {doc.id}...")
    temples_ref.document(doc.id).update({
        "youtube_url": new_url
    })
    print(f"Successfully updated document {doc.id}")

# Delete the duplicate document with ID 'other-tirupati-balaji-temple-andhra-pradesh' if it exists and is not the correct one, or if it is a duplicate
dup_doc_ref = temples_ref.document(temple_id)
dup_doc = dup_doc_ref.get()
if dup_doc.exists:
    # Check if there are other documents matching the query (which would mean this is a duplicate)
    if len(docs) > 0 and any(d.id != temple_id for d in docs):
        print(f"Deleting duplicate document {temple_id}...")
        dup_doc_ref.delete()
        print(f"Deleted duplicate document {temple_id}.")
    elif len(docs) == 0:
        # If there were no query results but the document with ID temple_id exists (which we created in the last run)
        # update it so at least it has the correct url.
        print(f"No other query documents found, updating the document with ID {temple_id} itself...")
        dup_doc_ref.update({
            "youtube_url": new_url
        })
        print(f"Successfully updated document {temple_id}")
