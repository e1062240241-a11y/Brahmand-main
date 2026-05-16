"""Firebase Community Service"""
import logging
import base64
import os
from uuid import uuid4
from urllib.parse import quote
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List

from config.firebase_config import get_firestore
from config.firestore_db import FirestoreDB
from utils.helpers import generate_community_code, SUBGROUPS
from utils.cache import cache_manager

logger = logging.getLogger(__name__)


class FirebaseCommunityService:
    """Handles community operations with Firestore"""
    
    @staticmethod
    async def _upload_to_storage(path: str, base64_data: str, content_type: str = 'image/jpeg') -> str:
        from firebase_admin import storage as firebase_storage

        bucket_name = (
            os.getenv('FIREBASE_STORAGE_BUCKET')
            or os.getenv('EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET')
            or 'sanatan-lok.firebasestorage.app'
        )
        bucket = firebase_storage.bucket(bucket_name) if bucket_name else firebase_storage.bucket()

        blob = bucket.blob(path)
        download_token = uuid4().hex
        blob.metadata = {'firebaseStorageDownloadTokens': download_token}

        # Strip prefix if present
        if ',' in base64_data:
            base64_payload = base64_data.split(',')[1]
        else:
            base64_payload = base64_data

        blob.upload_from_string(base64.b64decode(base64_payload), content_type=content_type)

        return (
            f"https://firebasestorage.googleapis.com/v0/b/{bucket.name}/o/"
            f"{quote(path, safe='')}?alt=media&token={download_token}"
        )

    @staticmethod
    async def get_db() -> FirestoreDB:
        client = await get_firestore()
        return FirestoreDB(client)
    
    @staticmethod
    async def create_user_community(user_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new user-created community group"""
        db = await FirebaseCommunityService.get_db()

        # Generate unique code
        base_code = generate_community_code(data['name'].split()[0])
        code = base_code
        attempts = 0
        while attempts < 10:
            existing = await db.find_one('communities', [('code', '==', code)])
            if not existing:
                break
            code = f"{base_code}{attempts + 1}"
            attempts += 1

        photo_url = data.get('photo')
        if photo_url and photo_url.startswith('data:'):
            try:
                photo_path = f"communities/photos/{uuid4().hex}.jpg"
                photo_url = await FirebaseCommunityService._upload_to_storage(photo_path, photo_url)
            except Exception as e:
                logger.error(f"Failed to upload community photo: {e}")
                photo_url = None

        cover_url = data.get('cover_photo')
        if cover_url and cover_url.startswith('data:'):
            try:
                cover_path = f"communities/covers/{uuid4().hex}.jpg"
                cover_url = await FirebaseCommunityService._upload_to_storage(cover_path, cover_url)
            except Exception as e:
                logger.error(f"Failed to upload community cover: {e}")
                cover_url = None

        community_data = {
            "name": data['name'],
            "type": "user_group",
            "description": data.get('description'),
            "short_name": data.get('short_name'),
            "location": {
                "city": data.get('city'),
                "area": data.get('area')
            },
            "category": data.get('category'),
            "photo": photo_url,
            "cover_photo": cover_url,
            "owner_id": user_id,
            "admin_ids": list(set([user_id] + data.get('admin_ids', []))),
            "members": list(set([user_id] + data.get('admin_ids', []) + data.get('member_ids', []))),
            "code": code,
            "subgroups": SUBGROUPS.copy(),
            "created_at": datetime.utcnow()
        }

        community_data['member_count'] = len(community_data['members'])

        community_id = await db.create_community(community_data)
        community_data['id'] = community_id

        # Add community to all members
        from google.cloud import firestore
        batch = db.client.batch()
        for member_id in community_data['members']:
            try:
                user_ref = db.client.collection('users').document(member_id)
                batch.update(user_ref, {
                    'communities': firestore.ArrayUnion([community_id])
                })
            except Exception as e:
                logger.error(f"Failed to prepare batch update for community to member {member_id}: {e}")

        try:
            await db._run_sync(batch.commit)
        except Exception as e:
            logger.error(f"Failed to commit batch update for community members: {e}")

        # Invalidate cache for all initial members
        for member_id in community_data['members']:
            await cache_manager.invalidate_user_communities(member_id)

        return community_data

    @staticmethod
    async def get_or_create_community(
        name: str,
        community_type: str,
        location: Dict[str, str]
    ) -> Dict[str, Any]:
        """Get existing community or create new one"""
        db = await FirebaseCommunityService.get_db()
        
        community = await db.get_community_by_name(name)
        if community:
            return community
        
        # Create new community
        community_data = {
            "name": name,
            "type": community_type,
            "location": location,
            "code": generate_community_code(name.split()[0]),
            "members": [],
            "member_count": 0,
            "subgroups": SUBGROUPS.copy()
        }
        
        community_id = await db.create_community(community_data)
        community_data['id'] = community_id
        
        logger.info(f"Created community: {name}")
        return community_data
    
    @staticmethod
    async def join_location_communities(
        user_id: str,
        location: Dict[str, Any]
    ) -> List[str]:
        """Join all communities for a location (city, state, country)"""
        db = await FirebaseCommunityService.get_db()
        community_ids = []
        
        # City Community
        city_community = await FirebaseCommunityService.get_or_create_community(
            f"{location['city'].title()} Group",
            "city",
            {"country": location['country'], "state": location['state'], "city": location['city']}
        )
        community_ids.append(city_community['id'])
        
        # State Community
        state_community = await FirebaseCommunityService.get_or_create_community(
            f"{location['state'].title()} Group",
            "state",
            {"country": location['country'], "state": location['state']}
        )
        community_ids.append(state_community['id'])
        
        # Country Community
        country_community = await FirebaseCommunityService.get_or_create_community(
            f"{location['country'].title()} Group",
            "country",
            {"country": location['country']}
        )
        community_ids.append(country_community['id'])
        
        # Add user to each community
        for cid in community_ids:
            await db.add_member_to_community(cid, user_id)
        
        return community_ids
    
    @staticmethod
    async def get_user_communities(user_id: str) -> List[Dict[str, Any]]:
        """Get all communities user belongs to"""
        # Try cache
        cached = await cache_manager.get_communities(user_id)
        if cached:
            return cached
        
        db = await FirebaseCommunityService.get_db()
        user = await db.get_document('users', user_id)
        if not user:
            raise ValueError("User not found")
        
        community_ids = user.get("communities", [])
        communities = []
        
        for cid in community_ids:
            try:
                community = await db.get_document('communities', cid)
                if community and community.get('type') not in ['home_area', 'area']:
                    communities.append({
                        "id": community['id'],
                        "name": community['name'],
                        "type": community['type'],
                        "code": community.get('code', ''),
                        "photo": community.get('photo'),
                        "member_count": len(community.get('members', [])),
                        "subgroups": community.get('subgroups', [])
                    })
            except Exception as e:
                logger.error(f"Error fetching community {cid}: {e}")
        
        await cache_manager.set_communities(user_id, communities)
        return communities
    
    @staticmethod
    async def get_community(community_id: str) -> Dict[str, Any]:
        """Get community details"""
        db = await FirebaseCommunityService.get_db()
        community = await db.get_document('communities', community_id)
        if not community:
            raise ValueError("Community not found")
        
        return {
            "id": community['id'],
            "name": community['name'],
            "type": community['type'],
            "location": community.get('location', {}),
            "code": community.get('code', ''),
            "member_count": len(community.get('members', [])),
            "subgroups": community.get('subgroups', [])
        }
    
    @staticmethod
    async def join_by_code(user_id: str, code: str) -> Dict[str, Any]:
        """Join community by code"""
        db = await FirebaseCommunityService.get_db()
        community = await db.find_one('communities', [('code', '==', code.upper())])
        if not community:
            raise ValueError("Invalid community code")
        
        from google.cloud import firestore
        
        # Add user to community
        await db.client.collection('communities').document(community['id']).update({
            'members': firestore.ArrayUnion([user_id])
        })
        
        # Add community to user
        await db.client.collection('users').document(user_id).update({
            'communities': firestore.ArrayUnion([community['id']])
        })
        
        await cache_manager.invalidate_user_communities(user_id)
        
        return {"message": "Joined community successfully", "community": community['name']}
    
    @staticmethod
    async def request_to_join(user_id: str, community_id: str) -> Dict[str, Any]:
        """Submit a request to join a community"""
        db = await FirebaseCommunityService.get_db()

        # Check if already a member
        community = await db.get_document('communities', community_id)
        if not community:
            raise ValueError("Community not found")

        if user_id in community.get('members', []):
            return {"status": "already_member", "message": "You are already a member"}

        # Check for existing pending request
        existing = await db.find_one('community_join_requests', [
            ('community_id', '==', community_id),
            ('user_id', '==', user_id),
            ('status', '==', 'pending')
        ])
        if existing:
            return {"status": "pending", "message": "Your request is already pending review"}

        user = await db.get_document('users', user_id)

        request_data = {
            "community_id": community_id,
            "community_name": community['name'],
            "user_id": user_id,
            "user_name": user.get('name', 'Unknown User'),
            "user_photo": user.get('photo'),
            "status": "pending",
            "created_at": datetime.utcnow()
        }

        await db.client.collection('community_join_requests').add(request_data)
        
        # Send push notification to admins
        from services.firebase_notification_service import FirebaseNotificationService
        admins = community.get('admin_ids', [])
        if community.get('owner_id') and community.get('owner_id') not in admins:
            admins.append(community.get('owner_id'))
        
        for admin_id in admins:
            try:
                await FirebaseNotificationService.send_push_notification(
                    user_id=admin_id,
                    title="New Join Request",
                    body=f"{user.get('name', 'Someone')} requested to join {community['name']}",
                    data={"type": "community_join_request", "community_id": community_id}
                )
            except Exception as e:
                logger.error(f"Failed to send push notification to admin {admin_id}: {e}")

        return {"status": "requested", "message": "Request submitted to community admins"}

    @staticmethod
    async def get_join_requests(user_id: str, community_id: str) -> List[Dict[str, Any]]:
        """Get pending join requests for a community (only for owner/admins)"""
        db = await FirebaseCommunityService.get_db()
        community = await db.get_document('communities', community_id)

        if user_id != community.get('owner_id') and user_id not in community.get('admin_ids', []):
            raise ValueError("Unauthorized: Only admins can view requests")

        requests = await db.query_documents(
            'community_join_requests',
            filters=[('community_id', '==', community_id), ('status', '==', 'pending')],
            order_by='created_at',
            order_direction='DESCENDING'
        )
        return requests

    @staticmethod
    async def handle_join_request(admin_id: str, request_id: str, action: str) -> Dict[str, Any]:
        """Approve or reject a join request"""
        db = await FirebaseCommunityService.get_db()
        req_doc = await db.get_document('community_join_requests', request_id)
        if not req_doc:
            raise ValueError("Request not found")

        community_id = req_doc['community_id']
        community = await db.get_document('communities', community_id)

        if admin_id != community.get('owner_id') and admin_id not in community.get('admin_ids', []):
            raise ValueError("Unauthorized")

        user_id = req_doc['user_id']
        from services.firebase_notification_service import FirebaseNotificationService

        if action == 'approve':
            from google.cloud import firestore

            # Add to community
            await db.client.collection('communities').document(community_id).update({
                'members': firestore.ArrayUnion([user_id])
            })
            # Add community to user
            await db.client.collection('users').document(user_id).update({
                'communities': firestore.ArrayUnion([community_id])
            })

            await db.client.collection('community_join_requests').document(request_id).update({
                'status': 'approved',
                'handled_at': datetime.utcnow(),
                'handled_by': admin_id
            })
            await cache_manager.invalidate_user_communities(user_id)
            
            try:
                await FirebaseNotificationService.send_push_notification(
                    user_id=user_id,
                    title="Request Approved",
                    body=f"Your request to join {community['name']} has been approved!",
                    data={"type": "community_join_approved", "community_id": community_id}
                )
            except Exception as e:
                logger.error(f"Failed to send approval notification to user {user_id}: {e}")
                
            return {"status": "approved", "message": "User added to community"}
        else:
            await db.client.collection('community_join_requests').document(request_id).update({
                'status': 'rejected',
                'handled_at': datetime.utcnow(),
                'handled_by': admin_id
            })
            return {"status": "rejected", "message": "Request declined"}
    async def agree_to_rules(user_id: str, community_id: str, subgroup_type: str) -> Dict[str, Any]:
        """Agree to rules"""
        db = await FirebaseCommunityService.get_db()
        
        from google.cloud import firestore
        await db.client.collection('users').document(user_id).update({
            'agreed_rules': firestore.ArrayUnion([f"{community_id}_{subgroup_type}"])
        })
        
        await cache_manager.invalidate_user(user_id)
        return {"message": "Rules agreed"}
    
    @staticmethod
    async def discover_communities() -> List[Dict[str, Any]]:
        """Discover popular communities"""
        db = await FirebaseCommunityService.get_db()
        communities = await db.query_documents(
            'communities',
            order_by='member_count',
            order_direction='DESCENDING',
            limit=100
        )
        
        return [{
            "id": c['id'],
            "name": c['name'],
            "type": c['type'],
            "code": c.get('code', ''),
            "member_count": len(c.get('members', []))
        } for c in communities]
    
    @staticmethod
    async def get_community_stats(community_id: str) -> Dict[str, Any]:
        """Get community stats"""
        cached = await cache_manager.get_community_stats(community_id)
        if cached:
            return cached
        
        db = await FirebaseCommunityService.get_db()
        community = await db.get_document('communities', community_id)
        
        # Count recent messages
        yesterday = datetime.utcnow() - timedelta(hours=24)
        
        stats = {
            "community_id": community_id,
            "name": community['name'] if community else "Unknown",
            "new_messages": 0,  # Would count from chats collection
            "member_count": len(community.get('members', [])) if community else 0
        }
        
        await cache_manager.set_community_stats(community_id, stats)
        return stats
