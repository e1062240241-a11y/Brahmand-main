import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

async def verify_community_access(db, user: Dict[str, Any], community_id: str, is_read_only: bool = False) -> str:
    """
    Unified access guard for community streams/posts to optimize data fetching boundaries.
    Resolves fallback locations, checks membership and verifies state/national boundaries.
    Returns the resolved community_id.
    """
    user_id = user.get('id') or user.get('_id')
    if not user_id:
        raise ValueError("Invalid user session")

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
                from google.cloud import firestore
                community_ids = await FirebaseCommunityService.join_location_communities(user_id, user_loc)
                # Sync back to user document if missing
                user_comms = set(user.get('communities', []))
                missing_ids = [cid for cid in community_ids if cid not in user_comms]
                if missing_ids:
                    await db.client.collection('users').document(user_id).update({
                        'communities': firestore.ArrayUnion(missing_ids)
                    })
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
    community_doc = None
    if not is_member:
        # Check the community document directly to see if the user is in the members list
        community_doc = await db.get_document('communities', community_id)
        if community_doc:
            if user_id in community_doc.get('members', []):
                is_member = True
                # Sync back to user document
                try:
                    from google.cloud import firestore
                    await db.client.collection('users').document(user_id).update({
                        'communities': firestore.ArrayUnion([community_id])
                    })
                    user['communities'] = user.get('communities', []) + [community_id]
                    from utils.cache import cache_manager
                    await cache_manager.invalidate_user(user_id)
                except Exception as ex:
                    logger.warning(f"Failed to sync community membership to user doc: {ex}")
            else:
                comm_type = community_doc.get('type')
                user_loc = user.get('location') or user.get('home_location') or {}
                if comm_type in ['city', 'state', 'country'] and user_loc:
                    comm_loc = community_doc.get('location') or {}
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
                            from google.cloud import firestore
                            await db.client.collection('users').document(user_id).update({
                                'communities': firestore.ArrayUnion([community_id])
                            })
                            user['communities'] = user.get('communities', []) + [community_id]
                            is_member = True
                            from utils.cache import cache_manager
                            await cache_manager.invalidate_user(user_id)
                        except Exception as ex:
                            logger.warning(f"Failed to auto-join location community: {ex}")

    if not is_member:
        raise ValueError("Not a community member")

    # Check verification (state and country groups require verification; city groups do not)
    if not community_doc:
        community_doc = await db.get_document('communities', community_id)

    if not community_doc:
        raise ValueError("Community not found")

    is_city_group = (community_doc.get('type') == 'city')

    if not is_city_group and not user.get('is_verified', False):
        if is_read_only:
             raise ValueError("Only verified members can view state/national community groups")
        else:
             raise ValueError("Only verified members can post in state/national community groups")

    return community_id
