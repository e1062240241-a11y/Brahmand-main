import sys
sys.path.insert(0, 'backend')
from config.firestore_db import FirestoreDB
print(hasattr(FirestoreDB, 'get_document_fields'))
