"""Firestore Database Operations Layer using Sync Client"""
import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
import asyncio
import time
from functools import partial

from utils.cache import cache_manager

logger = logging.getLogger(__name__)


def fast_copy(d: Any) -> Any:
    """Perform a fast semi-deep copy of dictionary/list structures (10x-50x faster than copy.deepcopy)"""
    if isinstance(d, dict):
        return {k: fast_copy(v) for k, v in d.items()}
    elif isinstance(d, list):
        return [fast_copy(v) for v in d]
    return d


class FirestoreDB:
    """
    Firestore database operations wrapper using sync client.
    Uses run_in_executor for async operations.
    
    Collections:
    - users
    - communities  
    - chats (with subcollection: messages)
    - groups / circles
    - temples
    - events
    - vendors
    - otps
    - notifications
    """
    
    _checked_connection = False
    use_mock = False
    _mock_collections = {}
    
    def __init__(self, client):
        self.client = client
        self._loop = None
        self._cache = cache_manager
        
        if not FirestoreDB._checked_connection:
            FirestoreDB._checked_connection = True
            try:
                # 1. Probe credentials refresh first to check if skew/invalid grant happens immediately
                if hasattr(client, '_credentials') and client._credentials:
                    from google.auth.transport.requests import Request as AuthRequest
                    try:
                        # Perform credentials refresh synchronously
                        client._credentials.refresh(AuthRequest())
                    except Exception as auth_err:
                        logger.warning(f"Google auth credentials refresh failed: {auth_err}")
                        raise Exception(f"Credentials skew/invalid: {auth_err}")
                
                # 2. Try a quick limit get
                list(client.collection('posts').limit(1).get(timeout=1.0))
                FirestoreDB.use_mock = False
                logger.info("✅ Firestore connection verified successfully.")
            except Exception as e:
                logger.warning(f"⚠️ Firestore connection probe failed: {e}. Falling back to high-performance InMemory DB mode.")
                FirestoreDB.use_mock = True
                FirestoreDB._seed_mock_data()

    @classmethod
    def _seed_mock_data(cls):
        # 12 Jyotirlinga Temples
        jyotirlingas = [
            {
                "temple_id": "jyotirling-somnath-temple-gujarat",
                "name": "Somnath Temple",
                "location": {"city": "Veraval", "state": "Gujarat"},
                "deity": "Lord Shiva",
                "category": "Jyotirlinga",
                "description": "The first among the twelve Jyotirlinga shrines of Shiva.",
                "image_url": "https://firebasestorage.googleapis.com/v0/b/sanatan-lok.firebasestorage.app/o/temples%2Fsomnath.jpg?alt=media"
            },
            {
                "temple_id": "jyotirling-mallikarjuna-temple-andhra-pradesh",
                "name": "Mallikarjuna Temple",
                "location": {"city": "Srisailam", "state": "Andhra Pradesh"},
                "deity": "Lord Shiva",
                "category": "Jyotirlinga",
                "description": "Located on Shri Sailam Mountain by the Krishna River.",
                "image_url": "https://firebasestorage.googleapis.com/v0/b/sanatan-lok.firebasestorage.app/o/temples%2Fmallikarjuna.jpg?alt=media"
            },
            {
                "temple_id": "jyotirling-mahakaleshwar-temple-ujjain",
                "name": "Mahakaleshwar Temple",
                "location": {"city": "Ujjain", "state": "Madhya Pradesh"},
                "deity": "Lord Shiva",
                "category": "Jyotirlinga",
                "description": "The lingam at Mahakaleshwar is believed to be Swayambhu (born of itself).",
                "image_url": "https://firebasestorage.googleapis.com/v0/b/sanatan-lok.firebasestorage.app/o/temples%2Fmahakaleshwar.jpg?alt=media"
            },
            {
                "temple_id": "jyotirling-omkareshwar-temple-madhya-pradesh",
                "name": "Omkareshwar Temple",
                "location": {"city": "Khandwa", "state": "Madhya Pradesh"},
                "deity": "Lord Shiva",
                "category": "Jyotirlinga",
                "description": "Situated on an island called Mandhata or Shivapuri in the Narmada river.",
                "image_url": "https://firebasestorage.googleapis.com/v0/b/sanatan-lok.firebasestorage.app/o/temples%2Fomkareshwar.jpg?alt=media"
            },
            {
                "temple_id": "jyotirling-kedarnath-temple-uttarakhand",
                "name": "Kedarnath Temple",
                "location": {"city": "Kedarnath", "state": "Uttarakhand"},
                "deity": "Lord Shiva",
                "category": "Jyotirlinga",
                "description": "One of the Chardhams and the highest among the 12 Jyotirlingas.",
                "image_url": "https://firebasestorage.googleapis.com/v0/b/sanatan-lok.firebasestorage.app/o/temples%2Fkedarnath.jpg?alt=media"
            },
            {
                "temple_id": "jyotirling-bhimashankar-temple-maharashtra",
                "name": "Bhimashankar Temple",
                "location": {"city": "Pune", "state": "Maharashtra"},
                "deity": "Lord Shiva",
                "category": "Jyotirlinga",
                "description": "The temple is associated with the legend of Shiva killing the demon Tripurasura.",
                "image_url": "https://firebasestorage.googleapis.com/v0/b/sanatan-lok.firebasestorage.app/o/temples%2Fbhimashankar.jpg?alt=media"
            },
            {
                "temple_id": "jyotirling-kashi-vishwanath-temple-varanasi",
                "name": "Kashi Vishwanath Temple",
                "location": {"city": "Varanasi", "state": "Uttar Pradesh"},
                "deity": "Lord Shiva",
                "category": "Jyotirlinga",
                "description": "One of the most famous Hindu temples, located in the oldest living city in the world.",
                "image_url": "https://firebasestorage.googleapis.com/v0/b/sanatan-lok.firebasestorage.app/o/temples%2Fkashi.jpg?alt=media"
            },
            {
                "temple_id": "jyotirling-trimbakeshwar-temple-maharashtra",
                "name": "Trimbakeshwar Temple",
                "location": {"city": "Nashik", "state": "Maharashtra"},
                "deity": "Lord Shiva",
                "category": "Jyotirlinga",
                "description": "The unique feature of this Jyotirlinga is its three faces representing Brahma, Vishnu, and Shiva.",
                "image_url": "https://firebasestorage.googleapis.com/v0/b/sanatan-lok.firebasestorage.app/o/temples%2Ftrimbakeshwar.jpg?alt=media"
            },
            {
                "temple_id": "jyotirling-baidyanath-temple-jharkhand",
                "name": "Baidyanath Temple",
                "location": {"city": "Deoghar", "state": "Jharkhand"},
                "deity": "Lord Shiva",
                "category": "Jyotirlinga",
                "description": "It is believed that Ravana worshipped Shiva here to get his boons.",
                "image_url": "https://firebasestorage.googleapis.com/v0/b/sanatan-lok.firebasestorage.app/o/temples%2Fbaidyanath.jpg?alt=media"
            },
            {
                "temple_id": "jyotirling-nageshwar-temple-gujarat",
                "name": "Nageshwar Temple",
                "location": {"city": "Dwarka", "state": "Gujarat"},
                "deity": "Lord Shiva",
                "category": "Jyotirlinga",
                "description": "Believed to be the first Jyotirlinga on earth.",
                "image_url": "https://firebasestorage.googleapis.com/v0/b/sanatan-lok.firebasestorage.app/o/temples%2Fnageshwar.jpg?alt=media"
            },
            {
                "temple_id": "jyotirling-ramanathaswamy-temple-rameswaram",
                "name": "Ramanathaswamy Temple",
                "location": {"city": "Rameswaram", "state": "Tamil Nadu"},
                "deity": "Lord Shiva",
                "category": "Jyotirlinga",
                "description": "The southern-most Jyotirlinga, built by Lord Rama himself.",
                "image_url": "https://firebasestorage.googleapis.com/v0/b/sanatan-lok.firebasestorage.app/o/temples%2Framanathaswamy.jpg?alt=media"
            },
            {
                "temple_id": "jyotirling-grishneshwar-temple-maharashtra",
                "name": "Grishneshwar Temple",
                "location": {"city": "Aurangabad", "state": "Maharashtra"},
                "deity": "Lord Shiva",
                "category": "Jyotirlinga",
                "description": "The last or 12th Jyotirlinga on earth.",
                "image_url": "https://firebasestorage.googleapis.com/v0/b/sanatan-lok.firebasestorage.app/o/temples%2Fgrishneshwar.jpg?alt=media"
            }
        ]
        
        # Populate temples in mock db
        for t in jyotirlingas:
            doc_id = t["temple_id"]
            # Fill out other default temple schema fields
            temple_full = {
                "id": doc_id,
                "temple_id": doc_id,
                "name": t["name"],
                "location": t["location"],
                "deity": t["deity"],
                "category": t["category"],
                "description": t["description"],
                "image_url": t["image_url"],
                "aarti_timings": {},
                "guidance": "",
                "youtube_url": "",
                "coords": {},
                "timings": {},
                "contact": "",
                "is_verified": True,
                "images": [t["image_url"]],
                "admin_id": "admin",
                "admins": ["admin"],
                "followers": [],
                "follower_count": 0,
                "posts": []
            }
            cls._mock_collections.setdefault("temples", {})[doc_id] = temple_full
        logger.info(f"Seeded {len(jyotirlingas)} temples to mock database.")
        
        # Seed default country-level community to satisfy location community resolution
        default_comm = {
            "id": "default_country",
            "name": "India",
            "type": "country",
            "member_count": 0,
            "members": []
        }
        cls._mock_collections.setdefault("communities", {})["default_country"] = default_comm
        logger.info("Seeded default country community to mock database.")

    def _mock_query(self, collection, filters, order_by, order_direction, limit):
        coll_data = self._mock_collections.setdefault(collection, {})
        results = [fast_copy(v) for v in coll_data.values()]
        
        if filters:
            for field, op, value in filters:
                filtered = []
                for doc in results:
                    val = doc.get(field)
                    
                    if '.' in field:
                        parts = field.split('.')
                        val = doc
                        for p in parts:
                            if isinstance(val, dict):
                                val = val.get(p)
                            else:
                                val = None
                                break
                                
                    if op == '==':
                        if val == value: filtered.append(doc)
                    elif op == '<':
                        if val is not None and val < value: filtered.append(doc)
                    elif op == '>':
                        if val is not None and val > value: filtered.append(doc)
                    elif op == '<=':
                        if val is not None and val <= value: filtered.append(doc)
                    elif op == '>=':
                        if val is not None and val >= value: filtered.append(doc)
                    elif op == 'array_contains':
                        if isinstance(val, list) and value in val: filtered.append(doc)
                    elif op == 'in':
                        if isinstance(value, list) and val in value: filtered.append(doc)
                    elif op == 'array_contains_any':
                        if isinstance(val, list) and isinstance(value, list) and any(x in val for x in value):
                            filtered.append(doc)
                results = filtered
                
        if order_by:
            rev = (order_direction == 'DESCENDING')
            def get_sort_val(x):
                val = x.get(order_by)
                if val is None:
                    return (0, "") if not rev else (99999999, "zzzzzz")
                if isinstance(val, (int, float)):
                    return (val, "")
                return (0, str(val))
            results.sort(key=get_sort_val, reverse=rev)
            
        if limit:
            results = results[:limit]
            
        return results

    def _get_loop(self):
        if self._loop is None:
            self._loop = asyncio.get_event_loop()
        return self._loop
    
    async def _run_sync(self, func, *args, **kwargs):
        """Run sync function in a separate thread to avoid blocking the asyncio event loop"""
        loop = self._loop or asyncio.get_running_loop()
        if not self._loop:
            self._loop = loop
        return await loop.run_in_executor(None, partial(func, *args, **kwargs))
    
    # =================== GENERIC OPERATIONS ===================
    
    async def create_document(self, collection: str, data: Dict[str, Any], doc_id: Optional[str] = None, overwrite: bool = True) -> str:
        """Create a document in a collection"""
        now_iso = datetime.now(timezone.utc).isoformat()
        if 'created_at' not in data:
            data['created_at'] = now_iso
        if 'updated_at' not in data:
            data['updated_at'] = now_iso
        
        if self.use_mock:
            import uuid
            if not doc_id:
                doc_id = str(uuid.uuid4())
            coll = self._mock_collections.setdefault(collection, {})
            if doc_id in coll and not overwrite:
                raise Exception(f"Document {doc_id} already exists in {collection}")
            data_copy = fast_copy(data)
            data_copy['id'] = doc_id
            coll[doc_id] = data_copy
            return doc_id

        def _create():
            coll = self.client.collection(collection)
            if doc_id:
                if overwrite:
                    coll.document(doc_id).set(data)
                else:
                    coll.document(doc_id).create(data)
                return doc_id
            else:
                _, doc_ref = coll.add(data)
                return doc_ref.id
        
        return await self._run_sync(_create)
    

    async def batch_create_documents(self, collection: str, docs: List[Dict[str, Any]]) -> List[str]:
        """Create multiple documents in a collection using a batch."""
        if not docs:
            return []

        now_iso = datetime.utcnow().isoformat() + 'Z'
        generated_ids = []

        if self.use_mock:
            import uuid
            coll = self._mock_collections.setdefault(collection, {})
            cache_mapping = {}
            for data in docs:
                doc_id = str(uuid.uuid4())
                generated_ids.append(doc_id)
                data_copy = fast_copy(data)
                if 'created_at' not in data_copy:
                    data_copy['created_at'] = now_iso
                if 'updated_at' not in data_copy:
                    data_copy['updated_at'] = now_iso
                data_copy['id'] = doc_id
                coll[doc_id] = data_copy
                cache_mapping[f"{collection}:{doc_id}"] = fast_copy(data_copy)

            if cache_mapping:
                await self._cache.set_many(cache_mapping)
            return generated_ids

        created_docs = []
        def _batch():
            batch = self.client.batch()
            coll_ref = self.client.collection(collection)
            for data in docs:
                doc_ref = coll_ref.document()  # Auto-generate ID
                generated_ids.append(doc_ref.id)

                data_copy = dict(data)
                if 'created_at' not in data_copy:
                    data_copy['created_at'] = now_iso
                if 'updated_at' not in data_copy:
                    data_copy['updated_at'] = now_iso

                batch.set(doc_ref, data_copy)
                created_docs.append(data_copy)
            batch.commit()
            return generated_ids

        result_ids = await self._run_sync(_batch)

        # Cache the newly created documents
        if result_ids and created_docs:
            cache_mapping = {}
            for doc_id, doc_data in zip(result_ids, created_docs):
                doc_copy = fast_copy(doc_data)
                doc_copy['id'] = doc_id
                cache_mapping[f"{collection}:{doc_id}"] = doc_copy
            await self._cache.set_many(cache_mapping)

        return result_ids

    async def get_document(self, collection: str, doc_id: str) -> Optional[Dict[str, Any]]:
        """Get a document by ID with caching"""
        cache_key = f"{collection}:{doc_id}"
        cached_doc = await self._cache.get(cache_key)
        if cached_doc:
            logger.debug(f"Cache HIT for {cache_key}")
            return fast_copy(cached_doc)

        if self.use_mock:
            doc_data = self._mock_collections.setdefault(collection, {}).get(doc_id)
            if doc_data:
                doc_data = fast_copy(doc_data)
                await self._cache.set(cache_key, fast_copy(doc_data))
            return doc_data

        def _get():
            attempts = 2
            for attempt in range(attempts):
                try:
                    doc = self.client.collection(collection).document(doc_id).get()
                    if doc.exists:
                        data = doc.to_dict()
                        data['id'] = doc.id
                        return data
                    return None
                except Exception as exc:
                    logger.warning(f"Firestore get_document error for {collection}/{doc_id}, attempt {attempt + 1}/{attempts}: {exc}")
                    if attempt + 1 == attempts:
                        logger.error(f"Firestore get_document failed after retries for {collection}/{doc_id}: {exc}")
                        return None
                    time.sleep(0.5)
            return None

        doc_data = await self._run_sync(_get)
        if doc_data:
            await self._cache.set(cache_key, fast_copy(doc_data))
        return doc_data

    async def get_document_fields(
        self, collection: str, doc_id: str, field_paths: list
    ) -> Optional[Dict[str, Any]]:
        """Fetch only a subset of a document's fields via Firestore field masking.

        Avoids transferring large array fields (e.g. a popular user's 100k
        followers array) from Firestore to the backend when only scalar fields
        are needed. Not cached — these are targeted O(1) reads, and caching
        partial docs would conflict with the full-doc cache.
        """
        if not field_paths:
            return None

        if self.use_mock:
            doc = self._mock_collections.setdefault(collection, {}).get(doc_id)
            if doc is None:
                return None
            return {k: doc.get(k) for k in field_paths if k in doc} or None

        def _get():
            attempts = 2
            for attempt in range(attempts):
                try:
                    doc = self.client.collection(collection).document(doc_id).get(
                        field_paths=field_paths
                    )
                    if doc.exists:
                        return dict(doc.to_dict() or {})
                    return None
                except Exception as exc:
                    logger.warning(
                        f"Firestore get_document_fields error for {collection}/{doc_id}, "
                        f"attempt {attempt + 1}/{attempts}: {exc}"
                    )
                    if attempt + 1 == attempts:
                        return None
                    time.sleep(0.5)
            return None

        return await self._run_sync(_get)

    
    async def update_document(self, collection: str, doc_id: str, data: Dict[str, Any]) -> bool:
        """Update a document and invalidate cache"""
        data['updated_at'] = datetime.now(timezone.utc)
        
        if self.use_mock:
            coll = self._mock_collections.setdefault(collection, {})
            if doc_id in coll:
                data_copy = fast_copy(data)
                if isinstance(data_copy.get('updated_at'), datetime):
                    data_copy['updated_at'] = data_copy['updated_at'].isoformat()
                coll[doc_id].update(data_copy)
                await self._cache.delete(f"{collection}:{doc_id}")
                return True
            return False

        def _update():
            self.client.collection(collection).document(doc_id).update(data)
            return True
        
        result = await self._run_sync(_update)
        if result:
            await self._cache.delete(f"{collection}:{doc_id}")
        return result

    async def increment_field(self, collection: str, doc_id: str, field: str, amount: int = 1) -> None:
        """Atomically increment a numeric counter field (race-free).

        Uses Firestore's server-side Increment transform so concurrent writers
        never lose updates (unlike get-then-set). Mock path is single-process
        so a read+add is safe there. Skips the updated_at bump that
        update_document would impose on every increment.
        """
        if self.use_mock:
            coll = self._mock_collections.setdefault(collection, {})
            if doc_id in coll:
                cur = coll[doc_id].get(field, 0) or 0
                coll[doc_id][field] = cur + amount
                await self._cache.delete(f"{collection}:{doc_id}")
            return

        from google.cloud import firestore
        def _increment():
            self.client.collection(collection).document(doc_id).update(
                {field: firestore.Increment(amount)}
            )
        await self._run_sync(_increment)
        await self._cache.delete(f"{collection}:{doc_id}")

    async def batch_update_documents(self, collection: str, updates: List[tuple]) -> None:
        """Update multiple documents in a collection using a batch. updates is a list of (doc_id, data_dict) tuples"""
        if not updates:
            return
            
        now = datetime.now(timezone.utc)
        if self.use_mock:
            coll = self._mock_collections.setdefault(collection, {})
            for doc_id, data in updates:
                if doc_id in coll:
                    data_copy = fast_copy(data)
                    data_copy['updated_at'] = now.isoformat() + 'Z'
                    coll[doc_id].update(data_copy)
                    await self._cache.delete(f"{collection}:{doc_id}")
            return

        def _batch():
            batch = self.client.batch()
            coll_ref = self.client.collection(collection)
            for doc_id, data in updates:
                data_copy = dict(data)
                data_copy['updated_at'] = now
                doc_ref = coll_ref.document(doc_id)
                batch.update(doc_ref, data_copy)
            batch.commit()

        await self._run_sync(_batch)
        for doc_id, _ in updates:
            await self._cache.delete(f"{collection}:{doc_id}")
    

    async def batch_delete_documents(self, collection: str, doc_ids: List[str], batch_size: int = 500) -> int:
        """Delete multiple documents in a collection using batched writes."""
        if not doc_ids:
            return 0

        if self.use_mock:
            coll = self._mock_collections.setdefault(collection, {})
            deleted_count = 0
            for doc_id in doc_ids:
                if doc_id in coll:
                    del coll[doc_id]
                    deleted_count += 1
                await self._cache.delete(f"{collection}:{doc_id}")
            return deleted_count

        def _batch():
            deleted_count = 0
            coll_ref = self.client.collection(collection)

            # Process in chunks of batch_size (Firestore limit is 500)
            for i in range(0, len(doc_ids), batch_size):
                chunk = doc_ids[i:i + batch_size]
                batch = self.client.batch()

                for doc_id in chunk:
                    batch.delete(coll_ref.document(doc_id))
                    deleted_count += 1

                batch.commit()

            return deleted_count

        result = await self._run_sync(_batch)

        # Invalidate cache for all deleted documents
        for doc_id in doc_ids:
            await self._cache.delete(f"{collection}:{doc_id}")

        return result

    async def delete_document(self, collection: str, doc_id: str) -> bool:
        """Delete a document and invalidate cache"""
        if self.use_mock:
            self._mock_collections.setdefault(collection, {}).pop(doc_id, None)
            await self._cache.delete(f"{collection}:{doc_id}")
            return True

        def _delete():
            self.client.collection(collection).document(doc_id).delete()
            return True
        
        result = await self._run_sync(_delete)
        if result:
            await self._cache.delete(f"{collection}:{doc_id}")
        return result

    async def delete_subcollection(self, parent_collection: str, parent_id: str, subcollection: str, batch_size: int = 500) -> int:
        """Delete all documents in a subcollection using batched writes"""
        if self.use_mock:
            sub_key = f"{parent_collection}:{parent_id}:{subcollection}"
            count = len(self._mock_collections.setdefault(sub_key, {}))
            self._mock_collections[sub_key] = {}
            return count

        def _delete_all():
            coll_ref = self.client.collection(parent_collection).document(parent_id).collection(subcollection)
            deleted_count = 0

            while True:
                docs = list(coll_ref.limit(batch_size).stream())
                if not docs:
                    break

                batch = self.client.batch()
                for doc in docs:
                    batch.delete(doc.reference)
                    deleted_count += 1

                batch.commit()

                # If we retrieved less than batch_size, we're done
                if len(docs) < batch_size:
                    break

            return deleted_count

        return await self._run_sync(_delete_all)
    
    async def query_documents(
        self, 
        collection: str, 
        filters: Optional[List[tuple]] = None,
        order_by: Optional[str] = None,
        order_direction: str = 'ASCENDING',
        limit: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """Query documents with filters"""
        if self.use_mock:
            return self._mock_query(collection, filters, order_by, order_direction, limit)

        def _query():
            from google.cloud.firestore_v1.base_query import FieldFilter
            from google.cloud import firestore
            
            query = self.client.collection(collection)
            
            if filters:
                for field, op, value in filters:
                    query = query.where(filter=FieldFilter(field, op, value))
            
            if order_by:
                direction = firestore.Query.DESCENDING if order_direction == 'DESCENDING' else firestore.Query.ASCENDING
                query = query.order_by(order_by, direction=direction)
            
            if limit:
                query = query.limit(limit)
            
            def _stream_with_retry():
                attempts = 2
                for attempt in range(attempts):
                    try:
                        return list(query.stream())
                    except Exception as exc:
                        if 'requires an index' in str(exc).lower():
                            raise exc
                        logger.warning(f"Firestore stream error, attempt {attempt + 1}/{attempts}: {exc}")
                        if attempt + 1 == attempts:
                            break
                        time.sleep(0.5)
                logger.warning("Firestore stream failed, falling back to query.get().")
                try:
                    return list(query.get())
                except Exception as exc:
                    if 'requires an index' not in str(exc).lower():
                        logger.error(f"Firestore get() fallback failed: {exc}")
                    raise
            
            docs = _stream_with_retry()
            
            result = []
            for doc in docs:
                data = doc.to_dict()
                data['id'] = doc.id
                result.append(data)
            
            return result
        
        return await self._run_sync(_query)
    
    async def find_one(self, collection: str, filters: List[tuple]) -> Optional[Dict[str, Any]]:
        """Find a single document matching filters"""
        results = await self.query_documents(collection, filters, limit=1)
        return results[0] if results else None
    
    async def count_documents(self, collection: str, filters: Optional[List[tuple]] = None) -> int:
        """Count documents matching filters"""
        if self.use_mock:
            return len(self._mock_query(collection, filters, None, None, None))

        def _count():
            from google.cloud.firestore_v1.base_query import FieldFilter
            
            query = self.client.collection(collection)
            
            if filters:
                for field, op, value in filters:
                    query = query.where(filter=FieldFilter(field, op, value))
            
            def _count_with_retry():
                attempts = 2
                for attempt in range(attempts):
                    try:
                        return query.count().get()[0][0].value
                    except Exception as exc:
                        logger.warning(f"Firestore count error, attempt {attempt + 1}/{attempts}: {exc}")
                        if attempt + 1 == attempts:
                            break
                        time.sleep(0.5)
                logger.warning("Firestore count stream failed, falling back to query.get().")
                try:
                    return len(list(query.get()))
                except Exception as exc:
                    logger.error(f"Firestore count get() fallback failed: {exc}")
                    raise
            
            return _count_with_retry()
        
        return await self._run_sync(_count)
    
    # =================== USER OPERATIONS ===================
    
    async def create_user(self, user_data: Dict[str, Any]) -> str:
        """Create a new user with strict phone uniqueness enforcement"""
        phone = user_data.get('phone')
        if phone:
            existing = await self.get_user_by_phone(phone)
            if existing:
                logger.warning(f"Integrity Guard: User with phone {phone} already exists (ID: {existing['id']}). Returning existing ID to prevent duplicate user creation.")
                return existing['id']
        return await self.create_document('users', user_data)
    
    async def get_user_by_phone(self, phone: str) -> Optional[Dict[str, Any]]:
        """Get user by phone number with strict 1:1 phone-to-user binding"""
        if not phone:
            return None
        
        try:
            from services.firebase_auth_service import FirebaseAuthService
            norm_phone = FirebaseAuthService.normalize_phone(phone)
        except Exception:
            norm_phone = phone.strip()

        digits = ''.join(ch for ch in phone if ch.isdigit())
        last10 = digits[-10:] if len(digits) >= 10 else digits

        candidates = list(dict.fromkeys([
            norm_phone,
            phone,
            f"+91{last10}",
            last10,
            f"91{last10}",
            f"+91 {last10}",
        ]))
        matched_users: List[Dict[str, Any]] = []
        seen_ids = set()
        for cand in candidates:
            docs = await self.query_documents('users', [('phone', '==', cand)])
            docs_pn = await self.query_documents('users', [('phone_number', '==', cand)])
            for d in docs + docs_pn:
                if d['id'] not in seen_ids:
                    seen_ids.add(d['id'])
                    matched_users.append(d)

        if not matched_users:
            return None

        # Filter matched users to ensure last 10 digits strictly match the requested phone
        strictly_matched = []
        for u in matched_users:
            u_phone = str(u.get('phone') or u.get('phone_number') or '')
            u_digits = ''.join(ch for ch in u_phone if ch.isdigit())
            u_last10 = u_digits[-10:] if len(u_digits) >= 10 else u_digits
            if u_last10 == last10:
                strictly_matched.append(u)

        if not strictly_matched:
            return None

        if len(strictly_matched) == 1:
            return strictly_matched[0]

        # If duplicate records exist, prioritize exact normalized_phone match & populated profiles
        exact_norm = [u for u in strictly_matched if (u.get('phone') == norm_phone or u.get('phone_number') == norm_phone)]
        if exact_norm:
            exact_norm.sort(key=lambda u: (0 if u.get('name') else 1, str(u.get('created_at') or '9999')))
            target_user = exact_norm[0]
        else:
            strictly_matched.sort(key=lambda u: (0 if u.get('name') else 1, str(u.get('created_at') or '9999')))
            target_user = strictly_matched[0]

        # Auto-cleanup unpopulated shell duplicate documents to preserve 1:1 database integrity
        for u in strictly_matched:
            if u['id'] != target_user['id'] and not (u.get('name') or u.get('bio')):
                try:
                    logger.info(f"Integrity Sweep: Auto-removing duplicate unpopulated shell user doc: {u['id']}")
                    await self.delete_document('users', u['id'])
                except Exception as err:
                    logger.warning(f"Integrity Sweep: Could not delete duplicate user doc {u['id']}: {err}")

        return target_user
    
    async def get_user_by_sl_id(self, sl_id: str) -> Optional[Dict[str, Any]]:
        """Get user by Sanatan Lok ID"""
        return await self.find_one('users', [('sl_id', '==', sl_id.upper())])
    
    async def update_user(self, user_id: str, data: Dict[str, Any]) -> bool:
        """Update user data"""
        return await self.update_document('users', user_id, data)
    
    # =================== COMMUNITY OPERATIONS ===================
    
    async def get_community_by_name(self, name: str) -> Optional[Dict[str, Any]]:
        """Get community by name"""
        return await self.find_one('communities', [('name', '==', name)])
    
    async def create_community(self, data: Dict[str, Any]) -> str:
        """Create a new community"""
        return await self.create_document('communities', data)
    
    async def add_member_to_community(self, community_id: str, user_id: str):
        """Add a member to community and invalidate cache"""
        if self.use_mock:
            coll = self._mock_collections.setdefault('communities', {})
            doc = coll.setdefault(community_id, {'id': community_id, 'members': [], 'member_count': 0})
            members = doc.get('members', [])
            if user_id not in members:
                doc['members'] = list(members) + [user_id]
                doc['member_count'] = len(doc['members'])
            await self._cache.delete(f"communities:{community_id}")
            return

        def _add():
            doc_ref = self.client.collection('communities').document(community_id)
            doc = doc_ref.get()
            if doc.exists:
                data = doc.to_dict()
                members = data.get('members', [])
                if user_id not in members:
                    new_members = list(members) + [user_id]
                    doc_ref.update({
                        'members': new_members,
                        'member_count': len(new_members)
                    })
            else:
                doc_ref.set({
                    'members': [user_id],
                    'member_count': 1
                })
        
        await self._run_sync(_add)
        await self._cache.delete(f"communities:{community_id}")
    
    async def array_union_update(self, collection: str, doc_id: str, field: str, values: list):
        """Update a document field with ArrayUnion and invalidate cache"""
        if self.use_mock:
            coll = self._mock_collections.setdefault(collection, {})
            if doc_id in coll:
                doc = coll[doc_id]
                current = doc.setdefault(field, [])
                if not isinstance(current, list):
                    current = []
                for val in values:
                    if val not in current:
                        current.append(val)
                doc[field] = current
                doc['updated_at'] = datetime.now(timezone.utc).isoformat()
            await self._cache.delete(f"{collection}:{doc_id}")
            return

        def _update():
            from google.cloud import firestore
            self.client.collection(collection).document(doc_id).update({
                field: firestore.ArrayUnion(values)
            })
        
        await self._run_sync(_update)
        await self._cache.delete(f"{collection}:{doc_id}")
    
    async def set_document(self, collection: str, doc_id: str, data: Dict[str, Any]):
        """Set a document with specific ID"""
        now_iso = datetime.now(timezone.utc).isoformat()
        if 'created_at' not in data:
            data['created_at'] = now_iso
        if 'updated_at' not in data:
            data['updated_at'] = now_iso
        
        if self.use_mock:
            coll = self._mock_collections.setdefault(collection, {})
            data_copy = fast_copy(data)
            data_copy['id'] = doc_id
            coll[doc_id] = data_copy
            return

        def _set():
            self.client.collection(collection).document(doc_id).set(data)
        
        await self._run_sync(_set)
    
    # =================== CHAT OPERATIONS ===================
    
    async def create_chat(self, chat_data: Dict[str, Any], chat_id: Optional[str] = None) -> str:
        """Create a new chat"""
        if self.use_mock:
            import uuid
            if not chat_id:
                chat_id = str(uuid.uuid4())
            coll = self._mock_collections.setdefault('chats', {})
            data_copy = fast_copy(chat_data)
            data_copy['id'] = chat_id
            coll[chat_id] = data_copy
            return chat_id

        if chat_id:
            def _create():
                self.client.collection('chats').document(chat_id).set(chat_data)
                return chat_id
            return await self._run_sync(_create)
        return await self.create_document('chats', chat_data)
    
    async def add_message_to_chat(self, chat_id: str, message_data: Dict[str, Any]) -> str:
        """Add a message to chat's messages subcollection"""
        now_iso = datetime.now(timezone.utc).isoformat()
        if self.use_mock:
            import uuid
            msg_id = str(uuid.uuid4())
            data_copy = fast_copy(message_data)
            data_copy['id'] = msg_id
            data_copy['created_at'] = now_iso
            data_copy['timestamp'] = now_iso
            
            sub_key = f"chats:{chat_id}:messages"
            self._mock_collections.setdefault(sub_key, {})[msg_id] = data_copy
            # Reverse index for O(1) message -> chat lookup
            self._mock_collections.setdefault('chat_message_index', {})[msg_id] = {'chat_id': chat_id}
            return msg_id

        from google.cloud import firestore
        message_data['created_at'] = now_iso
        message_data['timestamp'] = firestore.SERVER_TIMESTAMP
        
        def _add():
            _, doc_ref = self.client.collection('chats').document(chat_id).collection('messages').add(message_data)
            # Best-effort reverse index; never blocks message creation
            try:
                self.client.collection('chat_message_index').document(doc_ref.id).set({'chat_id': chat_id})
            except Exception as e:
                logger.warning(f"Failed to index chat message {doc_ref.id}: {e}")
            return doc_ref.id
        
        return await self._run_sync(_add)
    
    async def get_chat_messages(
        self, 
        chat_id: str, 
        limit: int = 50,
        before_timestamp: Any = None
    ) -> List[Dict[str, Any]]:
        """Get messages from a chat with pagination"""
        if self.use_mock:
            sub_key = f"chats:{chat_id}:messages"
            messages = list(self._mock_collections.setdefault(sub_key, {}).values())
            messages.sort(key=lambda m: m.get('created_at', ''), reverse=True)
            
            if before_timestamp:
                before_str = str(before_timestamp)
                messages = [m for m in messages if m.get('created_at', '') < before_str]
                
            messages = messages[:limit]
            return list(reversed(messages))

        def _get():
            from google.cloud import firestore
            from google.cloud.firestore_v1.base_query import FieldFilter
            
            query = self.client.collection('chats').document(chat_id).collection('messages')
            query = query.order_by('created_at', direction=firestore.Query.DESCENDING)
            
            if before_timestamp:
                before_str = before_timestamp
                if isinstance(before_timestamp, datetime):
                    # Convert to UTC naive representation to match created_at format
                    if before_timestamp.tzinfo is not None:
                        # timezone is imported from datetime
                        dt_utc = before_timestamp.astimezone(timezone.utc).replace(tzinfo=None)
                    else:
                        dt_utc = before_timestamp
                    before_str = dt_utc.isoformat()
                    if not before_str.endswith('Z'):
                        before_str += 'Z'
                else:
                    before_str = str(before_timestamp)
                
                query = query.where(filter=FieldFilter('created_at', '<', before_str))
            
            query = query.limit(limit)
            
            messages = []
            for doc in query.stream():
                data = doc.to_dict()
                data['id'] = doc.id
                messages.append(data)
            
            return list(reversed(messages))  # Chronological order
        
        return await self._run_sync(_get)
    
    async def get_chat_message(self, chat_id: str, message_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific message from a chat"""
        if self.use_mock:
            sub_key = f"chats:{chat_id}:messages"
            doc_data = self._mock_collections.setdefault(sub_key, {}).get(message_id)
            return fast_copy(doc_data) if doc_data else None

        def _get():
            doc = self.client.collection('chats').document(chat_id).collection('messages').document(message_id).get()
            if doc.exists:
                data = doc.to_dict()
                data['id'] = doc.id
                return data
            return None
        
        return await self._run_sync(_get)
    
    async def get_chat_id_for_message(self, message_id: str) -> Optional[str]:
        """Resolve which chat contains a message.

        Uses the chat_message_index reverse lookup for O(1) resolution.
        Falls back to scanning all chats (previous behavior) when the index
        entry is missing (e.g. legacy messages created before the index).
        """
        if not message_id:
            return None

        # 1) Fast path: reverse index lookup
        try:
            idx = await self.get_document('chat_message_index', message_id)
            if idx and idx.get('chat_id'):
                return idx['chat_id']
        except Exception as e:
            logger.warning(f"chat_message_index lookup failed for {message_id}: {e}")

        # 2) Fallback: scan all chats (preserves legacy behavior)
        try:
            chats = await self.query_documents('chats')
            for c in chats:
                msg = await self.get_chat_message(c['id'], message_id)
                if msg:
                    return c['id']
        except Exception as e:
            logger.warning(f"chat scan fallback failed for {message_id}: {e}")
        return None

    async def update_chat_message(self, chat_id: str, message_id: str, update_data: Dict[str, Any]) -> None:
        """Update a specific message in a chat"""
        if self.use_mock:
            sub_key = f"chats:{chat_id}:messages"
            coll = self._mock_collections.setdefault(sub_key, {})
            if message_id in coll:
                coll[message_id].update(fast_copy(update_data))
            return

        def _update():
            self.client.collection('chats').document(chat_id).collection('messages').document(message_id).update(update_data)
        
        await self._run_sync(_update)
    
    async def get_documents_batch(self, collection: str, doc_ids: List[str]) -> List[Dict[str, Any]]:
        """Get multiple documents by ID with caching and batch fetching"""
        if not doc_ids:
            return []
            
        # 1. Try to get from cache first
        cache_keys = [f"{collection}:{uid}" for uid in doc_ids]
        cached_results = await self._cache.get_many(cache_keys)
        
        results = []
        missing_ids = []
        
        for i, doc in enumerate(cached_results):
            if doc:
                results.append(fast_copy(doc))
                logger.debug(f"Batch Cache HIT for {cache_keys[i]}")
            else:
                missing_ids.append(doc_ids[i])
        
        if not missing_ids:
            return results
            
        if self.use_mock:
            coll = self._mock_collections.setdefault(collection, {})
            fresh_docs = []
            for uid in missing_ids:
                if uid in coll:
                    fresh_docs.append(fast_copy(coll[uid]))
        else:
            # 2. Fetch missing from Firestore in batch
            # ⚡ Bolt Optimization: Chunk missing_ids inside a single thread to avoid exceeding threadpool
            # limits while respecting Firestore batch limits.
            async def _fetch_chunk(chunk):
                def _get_chunk():
                    refs = [self.client.collection(collection).document(uid) for uid in chunk]
                    docs = self.client.get_all(refs)
                    res = []
                    for doc in docs:
                        if doc and doc.exists:
                            data = doc.to_dict()
                            data['id'] = doc.id
                            res.append(data)
                    return res
                return await self._run_sync(_get_chunk)
            
            import asyncio
            chunk_size = 100
            tasks = []
            for i in range(0, len(missing_ids), chunk_size):
                chunk = missing_ids[i:i + chunk_size]
                tasks.append(_fetch_chunk(chunk))

            chunk_results = await asyncio.gather(*tasks, return_exceptions=True)
            fresh_docs = []
            for res in chunk_results:
                if isinstance(res, list):
                    fresh_docs.extend(res)
        
        # 3. Cache fresh results and add to final results
        if fresh_docs:
            cache_mapping = {f"{collection}:{doc['id']}": fast_copy(doc) for doc in fresh_docs}
            await self._cache.set_many(cache_mapping)
            for doc in fresh_docs:
                results.append(doc)
            
        return results

    async def batch_update_chat_messages(self, chat_id: str, updates: list) -> None:
        """Update multiple messages in a chat using a batch"""
        if self.use_mock:
            sub_key = f"chats:{chat_id}:messages"
            coll = self._mock_collections.setdefault(sub_key, {})
            for update in updates:
                msg_id = update['message_id']
                data = update['data']
                if msg_id in coll:
                    coll[msg_id].update(fast_copy(data))
            return

        def _batch_update():
            batch = self.client.batch()
            messages_ref = self.client.collection('chats').document(chat_id).collection('messages')

            for update in updates:
                msg_id = update['message_id']
                data = update['data']
                doc_ref = messages_ref.document(msg_id)
                batch.update(doc_ref, data)

            batch.commit()

        if updates:
            await self._run_sync(_batch_update)

    async def array_remove_update(self, collection: str, doc_id: str, field: str, values: list) -> None:
        """Remove values from an array field and invalidate cache"""
        if self.use_mock:
            coll = self._mock_collections.setdefault(collection, {})
            if doc_id in coll:
                doc = coll[doc_id]
                current = doc.setdefault(field, [])
                if not isinstance(current, list):
                    current = []
                current = [x for x in current if x not in values]
                doc[field] = current
                doc['updated_at'] = datetime.now(timezone.utc).isoformat()
            await self._cache.delete(f"{collection}:{doc_id}")
            return

        def _update():
            from google.cloud import firestore
            doc_ref = self.client.collection(collection).document(doc_id)
            doc_ref.update({field: firestore.ArrayRemove(values)})
        
        await self._run_sync(_update)
        await self._cache.delete(f"{collection}:{doc_id}")

    async def get_user_chats(self, user_id: str) -> List[Dict[str, Any]]:
        """Get all DM and circle chats for a user"""
        # 1. Fetch DM chats where user is a participant
        dm_chats = await self.query_documents(
            'chats',
            filters=[('type', '==', 'dm'), ('participants', 'array_contains', user_id)]
        )
        
        # 2. Fetch Circle chats where user is a member
        circle_chats = []
        user_doc = await self.get_document('users', user_id)
        if user_doc:
            circle_ids = user_doc.get('circles', [])
            if circle_ids:
                chat_ids = [f"circle_{cid}" for cid in circle_ids]
                chat_docs = await self.get_documents_batch('chats', chat_ids)
                chat_map = {doc['id']: doc for doc in chat_docs if doc}
                
                for cid in circle_ids:
                    chat_id = f"circle_{cid}"
                    if chat_id in chat_map:
                        circle_chats.append(chat_map[chat_id])
                    else:
                        # Fallback if chat doc doesn't exist yet but has messages
                        circle_chats.append({'id': chat_id, 'type': 'circle', 'circle_id': cid})
                    
        return dm_chats + circle_chats
