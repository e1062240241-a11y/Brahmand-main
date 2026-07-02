"""Firestore Database Operations Layer using Sync Client"""
import logging
import copy
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
import asyncio
import time
from functools import partial

from utils.cache import cache_manager

logger = logging.getLogger(__name__)


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
    
    def __init__(self, client):
        self.client = client
        self._loop = None
        self._cache = cache_manager
    
    def _get_loop(self):
        if self._loop is None:
            self._loop = asyncio.get_event_loop()
        return self._loop
    
    async def _run_sync(self, func, *args, **kwargs):
        """Run sync function directly to avoid gRPC multithreading deadlocks"""
        return func(*args, **kwargs)
    
    # =================== GENERIC OPERATIONS ===================
    
    async def create_document(self, collection: str, data: Dict[str, Any], doc_id: str = None, overwrite: bool = True) -> str:
        """Create a document in a collection"""
        now_iso = datetime.utcnow().isoformat() + 'Z'
        if 'created_at' not in data:
            data['created_at'] = now_iso
        if 'updated_at' not in data:
            data['updated_at'] = now_iso
        
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
    
    async def get_document(self, collection: str, doc_id: str) -> Optional[Dict[str, Any]]:
        """Get a document by ID with caching"""
        cache_key = f"{collection}:{doc_id}"
        cached_doc = await self._cache.get(cache_key)
        if cached_doc:
            logger.info(f"Cache HIT for {cache_key}")
            return copy.deepcopy(cached_doc)
            
        def _get():
            doc = self.client.collection(collection).document(doc_id).get()
            if doc.exists:
                data = doc.to_dict()
                data['id'] = doc.id
                return data
            return None
        
        doc_data = await self._run_sync(_get)
        if doc_data:
            await self._cache.set(cache_key, doc_data)
        return copy.deepcopy(doc_data) if doc_data else None
    
    async def update_document(self, collection: str, doc_id: str, data: Dict[str, Any]) -> bool:
        """Update a document and invalidate cache"""
        data['updated_at'] = datetime.utcnow()
        
        def _update():
            self.client.collection(collection).document(doc_id).update(data)
            return True
        
        result = await self._run_sync(_update)
        if result:
            await self._cache.delete(f"{collection}:{doc_id}")
        return result
    
    async def delete_document(self, collection: str, doc_id: str) -> bool:
        """Delete a document and invalidate cache"""
        def _delete():
            self.client.collection(collection).document(doc_id).delete()
            return True
        
        result = await self._run_sync(_delete)
        if result:
            await self._cache.delete(f"{collection}:{doc_id}")
        return result

    async def delete_subcollection(self, parent_collection: str, parent_id: str, subcollection: str, batch_size: int = 500) -> int:
        """Delete all documents in a subcollection using batched writes"""
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
        filters: List[tuple] = None,
        order_by: str = None,
        order_direction: str = 'ASCENDING',
        limit: int = None
    ) -> List[Dict[str, Any]]:
        """Query documents with filters"""
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
                        logger.warning(f"Firestore stream error, attempt {attempt + 1}/{attempts}: {exc}")
                        if attempt + 1 == attempts:
                            break
                        time.sleep(0.5)
                logger.warning("Firestore stream failed, falling back to query.get().")
                try:
                    return list(query.get())
                except Exception as exc:
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
    
    async def count_documents(self, collection: str, filters: List[tuple] = None) -> int:
        """Count documents matching filters"""
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
        """Create a new user"""
        return await self.create_document('users', user_data)
    
    async def get_user_by_phone(self, phone: str) -> Optional[Dict[str, Any]]:
        """Get user by phone number"""
        return await self.find_one('users', [('phone', '==', phone)])
    
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
        def _update():
            from google.cloud import firestore
            self.client.collection(collection).document(doc_id).update({
                field: firestore.ArrayUnion(values)
            })
        
        await self._run_sync(_update)
        await self._cache.delete(f"{collection}:{doc_id}")
    
    async def set_document(self, collection: str, doc_id: str, data: Dict[str, Any]):
        """Set a document with specific ID"""
        now_iso = datetime.utcnow().isoformat() + 'Z'
        if 'created_at' not in data:
            data['created_at'] = now_iso
        if 'updated_at' not in data:
            data['updated_at'] = now_iso
        
        def _set():
            self.client.collection(collection).document(doc_id).set(data)
        
        await self._run_sync(_set)
    
    # =================== CHAT OPERATIONS ===================
    
    async def create_chat(self, chat_data: Dict[str, Any], chat_id: str = None) -> str:
        """Create a new chat"""
        if chat_id:
            def _create():
                self.client.collection('chats').document(chat_id).set(chat_data)
                return chat_id
            return await self._run_sync(_create)
        return await self.create_document('chats', chat_data)
    
    async def add_message_to_chat(self, chat_id: str, message_data: Dict[str, Any]) -> str:
        """Add a message to chat's messages subcollection"""
        from google.cloud import firestore
        
        message_data['created_at'] = datetime.utcnow().isoformat() + 'Z'
        message_data['timestamp'] = firestore.SERVER_TIMESTAMP
        
        def _add():
            _, doc_ref = self.client.collection('chats').document(chat_id).collection('messages').add(message_data)
            return doc_ref.id
        
        return await self._run_sync(_add)
    
    async def get_chat_messages(
        self, 
        chat_id: str, 
        limit: int = 50,
        before_timestamp: Any = None
    ) -> List[Dict[str, Any]]:
        """Get messages from a chat with pagination"""
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
        def _get():
            doc = self.client.collection('chats').document(chat_id).collection('messages').document(message_id).get()
            if doc.exists:
                data = doc.to_dict()
                data['id'] = doc.id
                return data
            return None
        
        return await self._run_sync(_get)
    
    async def update_chat_message(self, chat_id: str, message_id: str, update_data: Dict[str, Any]) -> None:
        """Update a specific message in a chat"""
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
                results.append(copy.deepcopy(doc))
                logger.debug(f"Batch Cache HIT for {cache_keys[i]}")
            else:
                missing_ids.append(doc_ids[i])
        
        if not missing_ids:
            return results
            
        # 2. Fetch missing from Firestore in batch
        def _get():
            refs = [self.client.collection(collection).document(uid) for uid in missing_ids]
            docs = self.client.get_all(refs)
            batch_result = []
            for doc in docs:
                if doc and doc.exists:
                    data = doc.to_dict()
                    data['id'] = doc.id
                    batch_result.append(data)
            return batch_result
        
        fresh_docs = await self._run_sync(_get)
        
        # 3. Cache fresh results and add to final results
        if fresh_docs:
            cache_mapping = {f"{collection}:{doc['id']}": doc for doc in fresh_docs}
            await self._cache.set_many(cache_mapping)
            for doc in fresh_docs:
                results.append(copy.deepcopy(doc))
            
        return results

    async def batch_update_chat_messages(self, chat_id: str, updates: list) -> None:
        """Update multiple messages in a chat using a batch"""
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
        def _update():
            from google.cloud import firestore
            doc_ref = self.client.collection(collection).document(doc_id)
            doc_ref.update({field: firestore.ArrayRemove(values)})
        
        await self._run_sync(_update)
        await self._cache.delete(f"{collection}:{doc_id}")
