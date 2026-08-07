"""Firebase Community Service"""
import logging
import base64
import os
import re
from uuid import uuid4
from urllib.parse import quote
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List

from config.firebase_config import get_firestore
from config.firestore_db import FirestoreDB
from utils.helpers import generate_community_code, SUBGROUPS, normalize_location, CITY_TO_STATE_MAP
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
                "city": data.get('city')
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
        """Get existing community (by name or type+location identity) or create new one idempotently.

        Idempotency: concurrent calls for the same location community always resolve to the
        same document. Lookups happen by (type, location_code) in addition to the existing
        name lookup, and creation uses a deterministic document id with overwrite=False so
        the request that loses the race re-fetches the existing document instead of creating
        a duplicate. Existing communities are only "touched" via last_active; created_at and
        the membership list are never modified.
        """
        db = await FirebaseCommunityService.get_db()

        # Clean double spaces, trailing spaces and trim
        cleaned_name = " ".join(str(name).split())

        location = {k: str(v).strip() if v else "" for k, v in (location or {}).items()}
        loc_code = FirebaseCommunityService._location_code(community_type, location)

        # 1) Lookup by exact name first (covers pre-existing communities with auto-generated ids)
        community = await db.get_community_by_name(cleaned_name)
        if community:
            await FirebaseCommunityService._touch_last_active(community['id'])
            return community

        # 2) Idempotent lookup by type + location identity.
        #    Requires a composite index on (type, location_code); if the index is not deployed
        #    yet, gracefully fall back to the name lookup above.
        try:
            existing = await db.find_one(
                'communities',
                [('type', '==', community_type), ('location_code', '==', loc_code)]
            )
        except Exception as exc:
            if 'requires an index' in str(exc).lower():
                logger.warning(
                    f"Missing index for (type, location_code) lookup; falling back for '{cleaned_name}'"
                )
            else:
                logger.warning(f"Location lookup failed for '{cleaned_name}': {exc}")
            existing = None

        if existing:
            await FirebaseCommunityService._touch_last_active(existing['id'])
            return existing

        # Create new community
        community_data = {
            "name": cleaned_name,
            "type": community_type,
            "location": location,
            "location_code": loc_code,
            "code": generate_community_code(cleaned_name.split()[0]) if cleaned_name else "GRP",
            "members": [],
            "member_count": 0,
            "subgroups": SUBGROUPS.copy(),
            "last_active": datetime.utcnow()
        }

        # Deterministic id derived from type + location so concurrent requests collide
        # (overwrite=False fails on the second request) instead of duplicating the group.
        # loc_code already starts with the type prefix, so it is unique across types.
        doc_id = re.sub(r'[^a-z0-9]+', '_', loc_code).strip('_') if loc_code else None
        try:
            community_id = await db.create_document('communities', community_data, doc_id=doc_id, overwrite=False)
        except Exception:
            # A concurrent request created this community first -> re-fetch and return it
            community = await db.get_community_by_name(cleaned_name)
            if community:
                await FirebaseCommunityService._touch_last_active(community['id'])
                return community
            try:
                existing = await db.find_one(
                    'communities',
                    [('type', '==', community_type), ('location_code', '==', loc_code)]
                )
            except Exception:
                existing = None
            if existing:
                await FirebaseCommunityService._touch_last_active(existing['id'])
                return existing
            raise

        community_data['id'] = community_id

        logger.info(f"Created community: {cleaned_name}")
        return community_data

    @staticmethod
    def _location_code(community_type: str, location: Dict[str, str]) -> str:
        """Build a stable, normalized identity key for a location-based community."""
        country = (location.get('country') or '').strip().lower() or 'bharat'
        state = (location.get('state') or '').strip().lower()
        city = (location.get('city') or '').strip().lower()
        return f"{str(community_type).strip().lower()}|{city}|{state}|{country}"

    @staticmethod
    async def _touch_last_active(community_id: str) -> None:
        """Update only last_active. Never touches created_at and never resets membership."""
        if not community_id:
            return
        db = await FirebaseCommunityService.get_db()
        try:
            await db.update_document('communities', community_id, {'last_active': datetime.utcnow()})
        except Exception as e:
            logger.warning(f"Failed to touch last_active for community {community_id}: {e}")
    
    @staticmethod
    async def join_location_communities(
        user_id: str,
        location: Optional[Dict[str, Any]]
    ) -> List[str]:
        """Join all communities for a location (city, state, country)"""
        if not location:
            logger.warning(f"Cannot join location communities: location is empty/None for user {user_id}")
            return []
            
        location = normalize_location(location) or location
        db = await FirebaseCommunityService.get_db()
        community_ids = []

        # Auto-resolve state and country if missing from manual city input
        city_name = location.get('city')
        state_name = location.get('state')
        country_name = location.get('country') or 'Bharat'

        if city_name and str(city_name).strip():
            city_clean_key = str(city_name).strip().lower()
            if not state_name or not str(state_name).strip() or str(state_name).strip().lower() == 'unknown':
                if city_clean_key in CITY_TO_STATE_MAP:
                    resolved_state, resolved_country = CITY_TO_STATE_MAP[city_clean_key]
                    state_name = resolved_state
                    country_name = resolved_country
                    location['state'] = state_name
                    location['country'] = country_name
        
        # City Community (Always joined)
        if city_name and str(city_name).strip():
            city_name_cleaned = " ".join(str(city_name).split())
            try:
                city_community = await FirebaseCommunityService.get_or_create_community(
                    f"{city_name_cleaned.title()} Group",
                    "city",
                    {
                        "country": str(country_name or location.get('country', '')).strip() or 'Bharat',
                        "state": str(state_name or location.get('state', '')).strip(),
                        "city": city_name_cleaned
                    }
                )
                if city_community and 'id' in city_community:
                    community_ids.append(city_community['id'])
            except Exception as e:
                logger.error(f"Error creating city community for city '{city_name}': {e}", exc_info=True)
        
        # State Community (Always joined)
        if state_name and str(state_name).strip():
            state_name_cleaned = " ".join(str(state_name).split())
            try:
                state_community = await FirebaseCommunityService.get_or_create_community(
                    f"{state_name_cleaned.title()} Group",
                    "state",
                    {
                        "country": str(country_name or location.get('country', '')).strip() or 'Bharat',
                        "state": state_name_cleaned
                    }
                )
                if state_community and 'id' in state_community:
                    community_ids.append(state_community['id'])
            except Exception as e:
                logger.error(f"Error creating state community for state '{state_name}': {e}", exc_info=True)
                
        # Country Community (Always joined)
        country_name_final = str(country_name or location.get('country', 'Bharat')).strip() or 'Bharat'
        try:
            country_community = await FirebaseCommunityService.get_or_create_community(
                f"{country_name_final.title()} Group",
                "country",
                {
                    "country": country_name_final
                }
            )
            if country_community and 'id' in country_community:
                community_ids.append(country_community['id'])
        except Exception as e:
            logger.error(f"Error creating country community for country '{country_name_final}': {e}", exc_info=True)
        
        # Add user to each community safely
        joined_ids = []
        for cid in community_ids:
            try:
                await db.add_member_to_community(cid, user_id)
                joined_ids.append(cid)
            except Exception as e:
                logger.error(f"Failed to add user {user_id} to community {cid}: {e}", exc_info=True)
                
        return joined_ids
    
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
        
        if community_ids:
            try:
                fetched_communities = await db.get_documents_batch('communities', list(community_ids))
                for community in fetched_communities:
                    if community and community.get('type') not in ['home_area', 'area']:
                        communities.append({
                            "id": community.get('id'),
                            "name": community.get('name', 'Unknown'),
                            "type": community.get('type', 'other'),
                            "code": community.get('code', ''),
                            "photo": community.get('photo'),
                            "member_count": len(community.get('members', [])),
                            "subgroups": community.get('subgroups', [])
                        })
            except Exception as e:
                logger.error(f"Error batch fetching communities for user {user_id}: {e}")
        
        await cache_manager.set_communities(user_id, communities)
        return communities
    
    @staticmethod
    async def get_community(community_id: str) -> Dict[str, Any]:
        """Get community details"""
        db = await FirebaseCommunityService.get_db()
        community = await db.get_document('communities', community_id)
        if not community:
            raise ValueError("Community not found")
        
        owner_id = community.get('owner_id')
        admin_ids = community.get('admin_ids', [])
        member_ids = community.get('members', [])
        
        # Fetch all members' details
        all_member_ids = list(set((member_ids if member_ids else []) + (admin_ids if admin_ids else []) + ([owner_id] if owner_id else [])))
        user_docs = await db.get_documents_batch('users', all_member_ids)
        user_map = {u['id']: u for u in user_docs if u}
        
        all_members_details = []
        for mid in all_member_ids:
            user_doc = user_map.get(mid)
            name = user_doc.get('name', 'Unknown User') if user_doc else 'Unknown User'
            photo = user_doc.get('photo') if user_doc else None
            
            # Determine role
            if mid == owner_id:
                role = 'Owner'
            elif mid in admin_ids:
                role = 'Admin'
            else:
                role = 'Member'
                
            all_members_details.append({
                'id': mid,
                'name': name,
                'photo': photo,
                'role': role
            })
            
        # Sort so Owner is first, then Admins, then Members
        role_priority = {'Owner': 0, 'Admin': 1, 'Member': 2}
        all_members_details.sort(key=lambda x: role_priority.get(x['role'], 3))

        owner_name = "Community Owner"
        if owner_id and owner_id in user_map:
            owner_name = user_map[owner_id].get('name', 'Community Owner')
            
        admin_names = [m['name'] for m in all_members_details if m['role'] == 'Admin']
        member_names = [m['name'] for m in all_members_details if m['role'] == 'Member']
        
        return {
            "id": community['id'],
            "name": community['name'],
            "type": community['type'],
            "location": community.get('location', {}),
            "code": community.get('code', ''),
            "member_count": len(all_member_ids),
            "members": all_member_ids,
            "subgroups": community.get('subgroups', []),
            "owner_id": owner_id,
            "owner_name": owner_name,
            "admin_ids": admin_ids,
            "admin_names": admin_names,
            "member_names": member_names,
            "photo": community.get('photo'),
            "cover_photo": community.get('cover_photo'),
            "description": community.get('description', ''),
            "members_details": all_members_details
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
        members = community.get('members', [])
        new_members = list(members) + [user_id] if user_id not in members else members
        await db._run_sync(
            db.client.collection('communities').document(community['id']).update,
            {
                'members': new_members,
                'member_count': len(new_members)
            }
        )
        
        # Add community to user
        await db._run_sync(
            db.client.collection('users').document(user_id).update,
            {'communities': firestore.ArrayUnion([community['id']])}
        )
        
        await cache_manager.invalidate_user_communities(user_id)
        
        return {"message": "Joined community successfully", "community": community['name']}
    
    @staticmethod
    async def agree_to_rules(user_id: str, community_id: str, subgroup_type: str) -> Dict[str, Any]:
        """Agree to rules"""
        db = await FirebaseCommunityService.get_db()
        
        from google.cloud import firestore
        await db._run_sync(
            db.client.collection('users').document(user_id).update,
            {'agreed_rules': firestore.ArrayUnion([f"{community_id}_{subgroup_type}"])}
        )
        
        await cache_manager.invalidate_user(user_id)
        return {"message": "Rules agreed"}
    
    @staticmethod
    async def discover_communities(user_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """Discover popular communities"""
        db = await FirebaseCommunityService.get_db()
        try:
            # Query communities (up to 200) to sort them in Python
            communities = await db.query_documents('communities', limit=200)
        except Exception as e:
            logger.warning(f"Could not fetch communities: {e}")
            communities = []

        # Sort by actual members count
        communities.sort(key=lambda c: len(c.get('members', [])), reverse=True)

        # Fetch user's joined communities to mark is_member
        joined_set: set = set()
        if user_id:
            try:
                user = await db.get_document('users', user_id)
                if user:
                    joined_set = set(user.get('communities', []))
            except Exception as e:
                logger.warning(f"Could not fetch user communities for is_member flag: {e}")

        return [{
            "id": c['id'],
            "name": c['name'],
            "type": c['type'],
            "code": c.get('code', ''),
            "photo": c.get('photo'),
            "member_count": len(c.get('members', [])),
            "is_member": c['id'] in joined_set
        } for c in communities]
    
    @staticmethod
    async def get_my_creation_requests(user_id: str) -> List[Dict[str, Any]]:
        """Get community creation requests created by the user"""
        db = await FirebaseCommunityService.get_db()
        try:
            requests = await db.query_documents('community_creation_requests', [('owner_id', '==', user_id)])
            return requests
        except Exception as e:
            logger.error(f"Error fetching community creation requests for user {user_id}: {e}")
            return []
    
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
