"""Messaging Service with real-time support"""
import logging
from datetime import datetime
from typing import Optional, Dict, Any, List

from bson.objectid import ObjectId
from config.database import get_database
from utils.helpers import serialize_doc, moderate_content
from utils.cache import cache_manager

logger = logging.getLogger(__name__)


class MessagingService:
    """Handles all messaging operations"""
    
    # Socket.IO reference (set by main app)
    sio = None
    
    @classmethod
    def set_socket(cls, sio):
        """Set Socket.IO instance"""
        cls.sio = sio
    
    @staticmethod
    async def send_community_message(
        user_id: str,
        community_id: str,
        subgroup_type: str,
        content: str,
        message_type: str = "text"
    ) -> Dict[str, Any]:
        """Send message to community subgroup"""
        db = await get_database()
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        
        # Resolve fallback community IDs
        if community_id in ['mumbai-fallback', 'city_default', 'maharashtra-fallback', 'bharat-fallback']:
            target_type = 'city'
            if community_id == 'maharashtra-fallback':
                target_type = 'state'
            elif community_id == 'bharat-fallback':
                target_type = 'country'
                
            user_loc = user.get('location') or user.get('home_location')
            if user_loc:
                from services.firebase_community_service import FirebaseCommunityService as CommunityService
                community_service = CommunityService()
                try:
                    community_ids = await community_service.join_location_communities(user_id, user_loc)
                    # Sync back to user document if missing
                    user_comms = set(user.get('communities', []))
                    missing_ids = [cid for cid in community_ids if cid not in user_comms]
                    if missing_ids:
                        await db.users.update_one(
                            {"_id": ObjectId(user_id)},
                            {"$addToSet": {"communities": {"$each": missing_ids}}}
                        )
                        user['communities'] = user.get('communities', []) + missing_ids
                    
                    # Find matching community
                    matched = await db.communities.find_one({
                        "_id": {"$in": [ObjectId(cid) for cid in community_ids if ObjectId.is_valid(cid)]},
                        "type": target_type
                    })
                    if matched:
                        community_id = str(matched["_id"])
                except Exception as ex:
                    logger.warning(f"Failed to resolve fallback community ID {community_id} for user {user_id}: {ex}")

        # Check membership
        is_member = community_id in user.get("communities", [])
        if not is_member:
            # Check the community document directly to see if the user is in the members list
            if ObjectId.is_valid(community_id):
                community = await db.communities.find_one({"_id": ObjectId(community_id)})
                if community:
                    if user_id in community.get('members', []):
                        is_member = True
                        # Sync back to user document
                        try:
                            await db.users.update_one(
                                {"_id": ObjectId(user_id)},
                                {"$addToSet": {"communities": community_id}}
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
                                    # Add member to community
                                    await db.communities.update_one(
                                        {"_id": ObjectId(community_id)},
                                        {"$addToSet": {"members": user_id}, "$inc": {"member_count": 1}}
                                    )
                                    await db.users.update_one(
                                        {"_id": ObjectId(user_id)},
                                        {"$addToSet": {"communities": community_id}}
                                    )
                                    from utils.cache import cache_manager
                                    await cache_manager.invalidate_user(user_id)
                                    is_member = True
                                except Exception as ex:
                                    logger.warning(f"Failed to auto-join location community: {ex}")

        if not is_member:
            raise ValueError("Not a community member")
        
        # Check verification for posting (state and country groups require verification; city, interest, and user groups do not)
        community_doc = community if 'community' in locals() and community else (await db.communities.find_one({"_id": ObjectId(community_id)}) if ObjectId.is_valid(community_id) else None)
        is_restricted_group = (community_doc.get('type') in ['state', 'country', 'national']) if community_doc else False
        
        if is_restricted_group and not user.get("is_verified", False):
            raise ValueError("Only verified members can post in State & National community groups")
        
        # Content moderation
        is_ok, reason = moderate_content(content)
        if not is_ok:
            raise ValueError(reason)
        
        msg = {
            "community_id": community_id,
            "subgroup_type": subgroup_type,
            "sender_id": user_id,
            "sender_name": user["name"],
            "sender_photo": user.get("photo"),
            "sender_sl_id": user.get("sl_id"),
            "content": content,
            "message_type": message_type,
            "created_at": datetime.utcnow()
        }
        
        result = await db.messages.insert_one(msg)
        msg["_id"] = result.inserted_id
        
        # Emit to socket room
        if MessagingService.sio:
            room = f"community_{community_id}_{subgroup_type}"
            await MessagingService.sio.emit('new_message', serialize_doc(msg), room=room)
        
        logger.info(f"Message sent to community {community_id}/{subgroup_type}")
        return serialize_doc(msg)
    
    async def get_community_messages(
        community_id: str,
        subgroup_type: str,
        limit: int = 50,
        before_timestamp: Optional[str] = None,
        user_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Get messages from community subgroup"""
        db = await get_database()
        
        # Resolve fallback community IDs if user_id is provided
        if user_id and community_id in ['mumbai-fallback', 'city_default', 'maharashtra-fallback', 'bharat-fallback']:
            target_type = 'city'
            if community_id == 'maharashtra-fallback':
                target_type = 'state'
            elif community_id == 'bharat-fallback':
                target_type = 'country'
                
            user = await db.users.find_one({"_id": ObjectId(user_id)})
            if user:
                user_loc = user.get('location') or user.get('home_location')
                if user_loc:
                    from services.firebase_community_service import FirebaseCommunityService as CommunityService
                    community_service = CommunityService()
                    try:
                        community_ids = await community_service.join_location_communities(user_id, user_loc)
                        # Sync back to user document if missing
                        user_comms = set(user.get('communities', []))
                        missing_ids = [cid for cid in community_ids if cid not in user_comms]
                        if missing_ids:
                            await db.users.update_one(
                                {"_id": ObjectId(user_id)},
                                {"$addToSet": {"communities": {"$each": missing_ids}}}
                            )
                        
                        matched = await db.communities.find_one({
                            "_id": {"$in": [ObjectId(cid) for cid in community_ids if ObjectId.is_valid(cid)]},
                            "type": target_type
                        })
                        if matched:
                            community_id = str(matched["_id"])
                    except Exception as ex:
                        logger.warning(f"Failed to resolve fallback community ID {community_id} for user {user_id} in get: {ex}")

        query: Dict[str, Any] = {
            "community_id": community_id,
            "subgroup_type": subgroup_type
        }
        
        if before_timestamp:
            try:
                from dateutil import parser
                parsed_timestamp = parser.parse(before_timestamp)
                query["created_at"] = {"$lt": parsed_timestamp}
            except Exception:
                pass
                
        messages = await db.messages.find(query).sort("created_at", -1).limit(limit).to_list(limit)
        
        return [serialize_doc(msg) for msg in reversed(messages)]
    
    @staticmethod
    async def send_circle_message(
        user_id: str,
        circle_id: str,
        content: str,
        message_type: str = "text"
    ) -> Dict[str, Any]:
        """Send message to circle"""
        db = await get_database()
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        
        # Check membership
        circle = await db.circles.find_one({"_id": ObjectId(circle_id)})
        if not circle or user_id not in circle.get("members", []):
            raise ValueError("Not a circle member")
        
        # Content moderation
        is_ok, reason = moderate_content(content)
        if not is_ok:
            raise ValueError(reason)
        
        msg = {
            "circle_id": circle_id,
            "sender_id": user_id,
            "sender_name": user["name"],
            "sender_photo": user.get("photo"),
            "sender_sl_id": user.get("sl_id"),
            "content": content,
            "message_type": message_type,
            "created_at": datetime.utcnow()
        }
        
        result = await db.circle_messages.insert_one(msg)
        msg["_id"] = result.inserted_id
        
        # Emit to socket room
        if MessagingService.sio:
            room = f"circle_{circle_id}"
            await MessagingService.sio.emit('new_message', serialize_doc(msg), room=room)
            
        # Send Push Notifications
        try:
            from services.push_notification_service import push_service
            import asyncio
            
            preview = "Sent an image" if message_type == "image" else "Sent a video" if message_type == "video" else content
            
            asyncio.create_task(push_service.notify_circle_message(
                circle_id=circle_id,
                circle_name=circle.get("name", "Circle"),
                sender_name=user["name"],
                message_preview=preview,
                exclude_user_id=user_id
            ))
        except Exception as e:
            logger.error(f"Failed to trigger push notification for circle: {e}")
        
        return serialize_doc(msg)
    
    @staticmethod
    async def get_circle_messages(
        circle_id: str,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """Get messages from circle"""
        db = await get_database()
        messages = await db.circle_messages.find({
            "circle_id": circle_id
        }).sort("created_at", -1).limit(limit).to_list(limit)
        
        return [serialize_doc(msg) for msg in reversed(messages)]
    
    @staticmethod
    async def send_direct_message(
        sender_id: str,
        recipient_sl_id: str,
        content: str,
        message_type: str = "text"
    ) -> Dict[str, Any]:
        """Send direct message to user by SL ID"""
        db = await get_database()
        sender = await db.users.find_one({"_id": ObjectId(sender_id)})
        
        # Find recipient by SL ID
        recipient = await db.users.find_one({"sl_id": recipient_sl_id.upper()})
        if not recipient:
            raise ValueError("User not found")
        
        recipient_id = str(recipient["_id"])
        
        # Content moderation
        is_ok, reason = moderate_content(content)
        if not is_ok:
            raise ValueError(reason)
        
        # Create conversation ID (sorted to ensure same ID for both directions)
        participants = sorted([sender_id, recipient_id])
        conversation_id = f"{participants[0]}_{participants[1]}"
        
        msg = {
            "conversation_id": conversation_id,
            "sender_id": sender_id,
            "sender_name": sender["name"],
            "sender_photo": sender.get("photo"),
            "sender_sl_id": sender.get("sl_id"),
            "recipient_id": recipient_id,
            "content": content,
            "message_type": message_type,
            "read": False,
            "created_at": datetime.utcnow()
        }
        
        result = await db.direct_messages.insert_one(msg)
        msg["_id"] = result.inserted_id
        
        # Update conversations list
        await db.conversations.update_one(
            {"conversation_id": conversation_id},
            {"$set": {
                "conversation_id": conversation_id,
                "participants": [sender_id, recipient_id],
                "last_message": content,
                "last_message_at": datetime.utcnow(),
                "last_sender_id": sender_id
            }},
            upsert=True
        )
        
        # Emit to socket room
        if MessagingService.sio:
            room = f"dm_{conversation_id}"
            await MessagingService.sio.emit('new_dm', serialize_doc(msg), room=room)
        
        return serialize_doc(msg)
    
    @staticmethod
    async def get_conversations(user_id: str) -> List[Dict[str, Any]]:
        """Get all DM conversations for user"""
        db = await get_database()
        
        conversations = await db.conversations.find({
            "participants": user_id
        }).sort("last_message_at", -1).to_list(100)
        
        result = []
        for conv in conversations:
            # Get the other participant
            other_id = [p for p in conv["participants"] if p != user_id][0]
            other_user = await db.users.find_one({"_id": ObjectId(other_id)})
            
            if other_user:
                # Count unread messages
                unread_count = await db.direct_messages.count_documents({
                    "conversation_id": conv["conversation_id"],
                    "recipient_id": user_id,
                    "read": False
                })
                
                result.append({
                    "conversation_id": conv["conversation_id"],
                    "user": {
                        "id": other_id,
                        "sl_id": other_user.get("sl_id"),
                        "name": other_user.get("name"),
                        "photo": other_user.get("photo"),
                        "online_status": other_user.get("online_status"),
                        "last_seen_at": other_user.get("last_seen_at"),
                        "last_active": other_user.get("last_active"),
                        "is_verified": other_user.get("is_verified", False)
                    },
                    "last_message": conv.get("last_message", ""),
                    "last_message_at": conv.get("last_message_at"),
                    "unread_count": unread_count
                })
        
        return result
    
    @staticmethod
    async def get_direct_messages(
        user_id: str,
        conversation_id: str,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """Get messages from a DM conversation"""
        # Verify user is part of conversation
        if user_id not in conversation_id.split("_"):
            raise ValueError("Not authorized")
        
        db = await get_database()
        messages = await db.direct_messages.find({
            "conversation_id": conversation_id
        }).sort("created_at", -1).limit(limit).to_list(limit)
        
        # Mark messages as read
        await db.direct_messages.update_many(
            {
                "conversation_id": conversation_id,
                "recipient_id": user_id,
                "read": False
            },
            {"$set": {"read": True}}
        )
        
        return [serialize_doc(msg) for msg in reversed(messages)]
