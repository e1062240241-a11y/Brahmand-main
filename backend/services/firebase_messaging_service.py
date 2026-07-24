"""Firebase Messaging Service with Real-time Support"""
import logging
from datetime import datetime
from typing import Optional, Dict, Any, List

from config.firebase_config import get_firestore
from config.firestore_db import FirestoreDB
from utils.helpers import moderate_content
from google.cloud import firestore

logger = logging.getLogger(__name__)


class FirebaseMessagingService:
    """
    Handles messaging with Firestore.
    
    Structure:
    - chats/{chat_id}/messages/{message_id}
    - Chat types: community, circle, dm (direct message)
    """
    
    # Socket.IO reference for real-time
    sio = None
    
    @classmethod
    def set_socket(cls, sio):
        cls.sio = sio
    
    @staticmethod
    async def get_db() -> FirestoreDB:
        client = await get_firestore()
        return FirestoreDB(client)
    
    @staticmethod
    def _get_chat_id(chat_type: str, id1: str, id2: str = None) -> str:
        """Generate consistent chat ID"""
        if chat_type == 'dm':
            # Sort IDs for consistent DM chat ID
            ids = sorted([id1, id2])
            return f"dm_{ids[0]}_{ids[1]}"
        elif chat_type == 'community':
            return f"community_{id1}_{id2}"  # community_id + subgroup_type
        elif chat_type == 'circle':
            return f"circle_{id1}"
        return f"{chat_type}_{id1}"
    
    @staticmethod
    async def send_community_message(
        user_id: str,
        community_id: str,
        subgroup_type: str,
        content: str,
        message_type: str = "text",
        media_url: Optional[str] = None,
        category: Optional[str] = None,
        contact: Optional[str] = None,
        seva_details: Optional[str] = None,
        location: Optional[str] = None,
        start_time: Optional[str] = None
    ) -> Dict[str, Any]:
        """Send message to community subgroup"""
        db = await FirebaseMessagingService.get_db()
        
        # Get user
        user = await db.get_document('users', user_id)
        if not user:
            raise ValueError("User not found")
        
        # Resolve fallback community IDs
        if community_id in ['mumbai-fallback', 'city_default', 'maharashtra-fallback', 'bharat-fallback']:
            target_type = 'city'
            if community_id == 'maharashtra-fallback':
                target_type = 'state'
            elif community_id == 'bharat-fallback':
                target_type = 'country'
                
            user_loc = user.get('location') or user.get('home_location')
            if user_loc:
                from services.firebase_community_service import FirebaseCommunityService
                try:
                    community_ids = await FirebaseCommunityService.join_location_communities(user_id, user_loc)
                    # Sync back to user document if missing
                    user_comms = set(user.get('communities', []))
                    missing_ids = [cid for cid in community_ids if cid not in user_comms]
                    if missing_ids:
                        await db._run_sync(
                            db.client.collection('users').document(user_id).update,
                            {'communities': firestore.ArrayUnion(missing_ids)}
                        )
                        user['communities'] = user.get('communities', []) + missing_ids
                    
                    fetched = await db.get_documents_batch('communities', community_ids)
                    for comm in fetched:
                        if comm and comm.get('type') == target_type:
                            community_id = comm.get('id')
                            break
                except Exception as ex:
                    logger.warning(f"Failed to resolve fallback community ID {community_id} for user {user_id}: {ex}")

        # Check membership
        is_member = community_id in user.get('communities', [])
        if not is_member:
            # Check the community document directly to see if the user is in the members list
            community = await db.get_document('communities', community_id)
            if community:
                if user_id in community.get('members', []):
                    is_member = True
                    # Sync back to user document so future checks are fast
                    try:
                        await db._run_sync(
                            db.client.collection('users').document(user_id).update,
                            {'communities': firestore.ArrayUnion([community_id])}
                        )
                        from utils.cache import cache_manager
                        await cache_manager.invalidate_user(user_id)
                    except Exception as ex:
                        logger.warning(f"Failed to sync community membership to user doc: {ex}")
                else:
                    comm_type = community.get('type')
                    user_loc = user.get('location') or user.get('home_location') or {}
                    if comm_type in ['city', 'state', 'country'] and user_loc:
                        comm_loc = community.get('location') or {}
                        match = False
                        u_city = str(user_loc.get('city') or '').strip().lower()
                        u_state = str(user_loc.get('state') or '').strip().lower()
                        u_country = str(user_loc.get('country') or '').strip().lower()
                        
                        c_city = str(comm_loc.get('city') or '').strip().lower()
                        c_state = str(comm_loc.get('state') or '').strip().lower()
                        c_country = str(comm_loc.get('country') or '').strip().lower()
                        
                        if comm_type == 'city' and u_city and c_city == u_city:
                            match = True
                        elif comm_type == 'state' and u_state and c_state == u_state:
                            match = True
                        elif comm_type == 'country' and u_country and c_country == u_country:
                            match = True
                            
                        if match:
                            try:
                                await db.add_member_to_community(community_id, user_id)
                                await db._run_sync(
                                    db.client.collection('users').document(user_id).update,
                                    {'communities': firestore.ArrayUnion([community_id])}
                                )
                                from utils.cache import cache_manager
                                await cache_manager.invalidate_user(user_id)
                                is_member = True
                            except Exception as ex:
                                logger.warning(f"Failed to auto-join location community: {ex}")

        if not is_member:
            raise ValueError("Not a community member")
        
        # Check verification (state and country groups require verification; city groups do not)
        community_doc = community if 'community' in locals() and community else await db.get_document('communities', community_id)
        is_city_group = (community_doc.get('type') == 'city') if community_doc else False
        
        if not is_city_group and not user.get('is_verified', False):
            raise ValueError("Only verified members can post in community groups")
        
        # Moderate content
        is_ok, reason = moderate_content(content)
        if not is_ok:
            raise ValueError(reason)
        
        chat_id = FirebaseMessagingService._get_chat_id('community', community_id, subgroup_type)
        
        # Ensure chat document exists
        chat_ref = db.client.collection('chats').document(chat_id)
        chat_doc = await db._run_sync(chat_ref.get)
        if not chat_doc.exists:
            await db._run_sync(
                chat_ref.set,
                {
                    'type': 'community',
                    'community_id': community_id,
                    'subgroup_type': subgroup_type,
                    'created_at': datetime.utcnow()
                }
            )
        
        # Create message in subcollection
        message_data = {
            'sender_id': user_id,
            'sender_name': user['name'],
            'sender_photo': user.get('photo'),
            'sender_sl_id': user.get('sl_id'),
            'is_verified': user.get('is_verified', False),
            'verification_level': user.get('verification_level', 'state'),
            'content': content,
            'message_type': message_type,
            'created_at': datetime.utcnow(),
            'timestamp': firestore.SERVER_TIMESTAMP
        }
        if media_url:
            message_data['media_url'] = media_url
        if category:
            message_data['category'] = category
        if contact:
            message_data['contact'] = contact
        if seva_details:
            message_data['seva_details'] = seva_details
        if location:
            message_data['location'] = location
        if start_time:
            message_data['start_time'] = start_time
        
        message_id = await db.add_message_to_chat(chat_id, message_data)
        message_data['id'] = message_id
        message_data['chat_id'] = chat_id
        
        # Update chat's last message
        await db._run_sync(
            chat_ref.update,
            {
                'last_message': content,
                'last_message_at': datetime.utcnow(),
                'last_sender_id': user_id
            }
        )
        
        # Emit via Socket.IO
        if FirebaseMessagingService.sio:
            await FirebaseMessagingService.sio.emit(
                'new_message',
                message_data,
                room=chat_id
            )
        
        logger.info(f"Message sent to {chat_id}")
        return message_data
    
    @staticmethod
    async def get_community_messages(
        community_id: str,
        subgroup_type: str,
        limit: int = 50,
        before_timestamp: Optional[str] = None,
        user_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Get messages from community chat"""
        db = await FirebaseMessagingService.get_db()
        
        # Resolve fallback community IDs if user_id is provided
        if user_id and community_id in ['mumbai-fallback', 'city_default', 'maharashtra-fallback', 'bharat-fallback']:
            target_type = 'city'
            if community_id == 'maharashtra-fallback':
                target_type = 'state'
            elif community_id == 'bharat-fallback':
                target_type = 'country'
                
            user = await db.get_document('users', user_id)
            if user:
                user_loc = user.get('location') or user.get('home_location')
                if user_loc:
                    from services.firebase_community_service import FirebaseCommunityService
                    try:
                        community_ids = await FirebaseCommunityService.join_location_communities(user_id, user_loc)
                        # Sync back to user document if missing
                        user_comms = set(user.get('communities', []))
                        missing_ids = [cid for cid in community_ids if cid not in user_comms]
                        if missing_ids:
                            await db._run_sync(
                                db.client.collection('users').document(user_id).update,
                                {'communities': firestore.ArrayUnion(missing_ids)}
                            )
                        
                        fetched = await db.get_documents_batch('communities', community_ids)
                        for comm in fetched:
                            if comm and comm.get('type') == target_type:
                                community_id = comm.get('id')
                                break
                    except Exception as ex:
                        logger.warning(f"Failed to resolve fallback community ID {community_id} for user {user_id} in get: {ex}")

        chat_id = FirebaseMessagingService._get_chat_id('community', community_id, subgroup_type)
        
        parsed_timestamp = None
        if before_timestamp:
            try:
                ts_str = before_timestamp.replace('Z', '+00:00')
                parsed_timestamp = datetime.fromisoformat(ts_str)
            except Exception:
                try:
                    from dateutil import parser
                    parsed_timestamp = parser.parse(before_timestamp)
                except Exception as e:
                    logger.warning(f"Failed to parse before_timestamp: {before_timestamp}. Error: {e}")
                    
        messages = await db.get_chat_messages(chat_id, limit, parsed_timestamp)
        
        # Dynamically decorate with current sender verification status
        if messages:
            sender_ids = list(set([msg['sender_id'] for msg in messages if 'sender_id' in msg]))
            if sender_ids:
                users_list = await db.get_documents_batch('users', sender_ids)
                users_map = {u['id']: u for u in users_list if 'id' in u}
                for msg in messages:
                    sender_id = msg.get('sender_id')
                    if sender_id and sender_id in users_map:
                        user_doc = users_map[sender_id]
                        msg['is_verified'] = user_doc.get('is_verified', False)
                        msg['verification_level'] = user_doc.get('verification_level', 'state')
                        
        return messages
    
    @staticmethod
    async def send_circle_message(
        user_id: str,
        circle_id: str,
        content: str,
        message_type: str = "text"
    ) -> Dict[str, Any]:
        """Send message to circle"""
        db = await FirebaseMessagingService.get_db()
        
        user = await db.get_document('users', user_id)
        circle = await db.get_document('circles', circle_id)
        
        if not circle or user_id not in circle.get('members', []):
            raise ValueError("Not a circle member")
        
        is_ok, reason = moderate_content(content)
        if not is_ok:
            raise ValueError(reason)
        
        chat_id = FirebaseMessagingService._get_chat_id('circle', circle_id)
        
        # Ensure chat exists
        chat_ref = db.client.collection('chats').document(chat_id)
        chat_doc = await db._run_sync(chat_ref.get)
        if not chat_doc.exists:
            await db._run_sync(
                chat_ref.set,
                {
                    'type': 'circle',
                    'circle_id': circle_id,
                    'created_at': datetime.utcnow()
                }
            )
        
        message_data = {
            'sender_id': user_id,
            'sender_name': user['name'],
            'sender_photo': user.get('photo'),
            'sender_sl_id': user.get('sl_id'),
            'content': content,
            'message_type': message_type,
            'created_at': datetime.utcnow(),
            'timestamp': firestore.SERVER_TIMESTAMP
        }
        
        message_id = await db.add_message_to_chat(chat_id, message_data)
        message_data['id'] = message_id
        message_data['chat_id'] = chat_id
        
        await db._run_sync(
            chat_ref.update,
            {
                'last_message': content,
                'last_message_at': datetime.utcnow()
            }
        )
        
        if FirebaseMessagingService.sio:
            await FirebaseMessagingService.sio.emit('new_message', message_data, room=chat_id)
        
        return message_data
    
    @staticmethod
    async def get_circle_messages(circle_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Get circle messages"""
        db = await FirebaseMessagingService.get_db()
        chat_id = FirebaseMessagingService._get_chat_id('circle', circle_id)
        messages = await db.get_chat_messages(chat_id, limit)
        
        # Dynamically decorate with current sender verification status
        if messages:
            sender_ids = list(set([msg['sender_id'] for msg in messages if 'sender_id' in msg]))
            if sender_ids:
                users_list = await db.get_documents_batch('users', sender_ids)
                users_map = {u['id']: u for u in users_list if 'id' in u}
                for msg in messages:
                    sender_id = msg.get('sender_id')
                    if sender_id and sender_id in users_map:
                        user_doc = users_map[sender_id]
                        msg['is_verified'] = user_doc.get('is_verified', False)
                        msg['verification_level'] = user_doc.get('verification_level', 'state')
                        
        return messages
    
    @staticmethod
    async def send_direct_message(
        sender_id: str,
        recipient_sl_id: str,
        content: str,
        message_type: str = "text"
    ) -> Dict[str, Any]:
        """Send direct message"""
        db = await FirebaseMessagingService.get_db()
        
        sender = await db.get_document('users', sender_id)
        recipient = await db.get_user_by_sl_id(recipient_sl_id)
        
        if not recipient:
            raise ValueError("User not found")
        
        is_ok, reason = moderate_content(content)
        if not is_ok:
            raise ValueError(reason)
        
        recipient_id = recipient['id']
        chat_id = FirebaseMessagingService._get_chat_id('dm', sender_id, recipient_id)
        
        # Ensure chat exists
        chat_ref = db.client.collection('chats').document(chat_id)
        chat_doc = await db._run_sync(chat_ref.get)
        if not chat_doc.exists:
            await db._run_sync(
                chat_ref.set,
                {
                    'type': 'dm',
                    'participants': sorted([sender_id, recipient_id]),
                    'created_at': datetime.utcnow()
                }
            )
        
        message_data = {
            'sender_id': sender_id,
            'sender_name': sender['name'],
            'sender_photo': sender.get('photo'),
            'sender_sl_id': sender.get('sl_id'),
            'recipient_id': recipient_id,
            'content': content,
            'message_type': message_type,
            'read': False,
            'created_at': datetime.utcnow(),
            'timestamp': firestore.SERVER_TIMESTAMP
        }
        
        message_id = await db.add_message_to_chat(chat_id, message_data)
        message_data['id'] = message_id
        message_data['chat_id'] = chat_id
        
        await db._run_sync(
            chat_ref.update,
            {
                'last_message': content,
                'last_message_at': datetime.utcnow(),
                'last_sender_id': sender_id
            }
        )
        
        if FirebaseMessagingService.sio:
            await FirebaseMessagingService.sio.emit('new_dm', message_data, room=chat_id)
        
        return message_data
    
    @staticmethod
    async def get_conversations(user_id: str) -> List[Dict[str, Any]]:
        """Get all DM conversations"""
        db = await FirebaseMessagingService.get_db()
        
        try:
            # Query chats where user is participant
            chats = await db.query_documents(
                'chats',
                filters=[('type', '==', 'dm'), ('participants', 'array_contains', user_id)],
                order_by='last_message_at',
                order_direction='DESCENDING',
                limit=50
            )
        except Exception as e:
            logger.info(f"Using unindexed fallback for DM conversations query: {e}")
            try:
                chats = await db.query_documents(
                    'chats',
                    filters=[('participants', 'array_contains', user_id)]
                )
            except Exception:
                chats = await db.query_documents('chats')

            chats = [c for c in chats if c.get('type') == 'dm']

            # Sort in Python
            def _sort_key(c):
                val = c.get('last_message_at')
                if isinstance(val, datetime):
                    return val
                if isinstance(val, str):
                    try:
                        return datetime.fromisoformat(val.replace('Z', '+00:00'))
                    except Exception:
                        pass
                return datetime.min
            chats.sort(key=_sort_key, reverse=True)
            chats = chats[:50]
        
        result = []
        for chat in chats:
            other_id = [p for p in chat['participants'] if p != user_id][0]
            other_user = await db.get_document('users', other_id)
            
            if other_user:
                result.append({
                    "conversation_id": chat['id'],
                    "chat_id": chat['id'],
                    "user": {
                        "id": other_id,
                        "sl_id": other_user.get('sl_id'),
                        "name": other_user['name'],
                        "photo": other_user.get('photo'),
                        "is_verified": other_user.get('is_verified', False),
                        "verification_level": other_user.get('verification_level', 'state')
                    },
                    "last_message": chat.get('last_message', ''),
                    "last_message_at": chat.get('last_message_at')
                })
        
        return result
    
    @staticmethod
    async def get_direct_messages(
        user_id: str,
        conversation_id: str,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """Get DM messages"""
        db = await FirebaseMessagingService.get_db()
        
        # Verify user is participant
        chat = await db.get_document('chats', conversation_id)
        if not chat or user_id not in chat.get('participants', []):
            raise ValueError("Not authorized")
        
        messages = await db.get_chat_messages(conversation_id, limit)
        
        # Dynamically decorate with current sender verification status
        if messages:
            sender_ids = list(set([msg['sender_id'] for msg in messages if 'sender_id' in msg]))
            if sender_ids:
                users_list = await db.get_documents_batch('users', sender_ids)
                users_map = {u['id']: u for u in users_list if 'id' in u}
                for msg in messages:
                    sender_id = msg.get('sender_id')
                    if sender_id and sender_id in users_map:
                        user_doc = users_map[sender_id]
                        msg['is_verified'] = user_doc.get('is_verified', False)
                        msg['verification_level'] = user_doc.get('verification_level', 'state')
                        
        return messages
