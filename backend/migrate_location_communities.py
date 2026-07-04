import asyncio
import logging
import sys
import os

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from main import get_db
from utils.helpers import normalize_location, generate_community_code
from utils.helpers import SUBGROUPS

async def create_or_get_community(db, name: str, comm_type: str, location: dict):
    TYPE_LABELS = {
        'city': 'City Community',
        'state': 'State Community',
        'country': 'National Community'
    }
    TYPE_ORDER = {
        'city': 1,
        'state': 2,
        'country': 3
    }
    existing = await db.get_community_by_name(name)
    if existing:
        return existing['id']
    
    comm_id = await db.create_community({
        "name": name,
        "type": comm_type,
        "label": TYPE_LABELS.get(comm_type, ''),
        "location": location,
        "code": generate_community_code(name.split()[0]),
        "members": [],
        "is_default": True,
        "sort_order": TYPE_ORDER.get(comm_type, 99),
        "subgroups": SUBGROUPS
    })
    logger.info(f"Created default community: {name} ({comm_type})")
    return comm_id

async def migrate_users():
    db = await get_db()
    
    # Query all users
    # In Firestore, we stream all users
    users_ref = db.client.collection('users')
    docs = users_ref.stream()
    
    users_processed = 0
    users_updated = 0
    
    for doc in docs:
        user_id = doc.id
        user_data = doc.to_dict()
        user_data['id'] = user_id
        
        users_processed += 1
        
        home_loc = user_data.get('home_location')
        loc = user_data.get('location')
        
        # Check if user has home location or location
        if not home_loc and not loc:
            continue
            
        # Normalize
        normalized_home = normalize_location(home_loc) if home_loc else None
        normalized_loc = normalize_location(loc) if loc else None
        
        # Check if there is any difference
        needs_update = False
        if normalized_home and home_loc != normalized_home:
            needs_update = True
        if normalized_loc and loc != normalized_loc:
            needs_update = True
            
        # Let's also check if they are mapped to the city group
        current_communities = user_data.get('communities', []) or []
        default_communities = user_data.get('default_communities', []) or []
        
        # Calculate what communities they should belong to based on normalized home location
        target_community_ids = []
        loc_to_use = normalized_home or normalized_loc
        
        if loc_to_use:
            # City Group
            city_name = f"{loc_to_use['city'].title()} Group"
            city_id = await create_or_get_community(db, city_name, 'city', {
                "country": loc_to_use['country'], "state": loc_to_use['state'], "city": loc_to_use['city']
            })
            target_community_ids.append(city_id)
            
            # State Group
            state_name = f"{loc_to_use['state'].title()} Group"
            state_id = await create_or_get_community(db, state_name, 'state', {
                "country": loc_to_use['country'], "state": loc_to_use['state']
            })
            target_community_ids.append(state_id)
            
            # Country Group
            country = loc_to_use['country'].replace('India', 'Bharat')
            country_name = f"{country.title()} Group"
            country_id = await create_or_get_community(db, country_name, 'country', {
                "country": country
            })
            target_community_ids.append(country_id)
            
        # Check if target communities are missing from user's communities
        missing_comms = [cid for cid in target_community_ids if cid not in current_communities]
        if missing_comms:
            needs_update = True
            
        # Check if there are old/incorrect location communities that need to be removed
        # (e.g. any city community that is not the normalized city group, like "Madh Group" or "Madh Island Group")
        comms_to_remove = []
        for cid in current_communities:
            comm = await db.get_document('communities', cid)
            if comm and comm.get('type') == 'city':
                comm_city = comm.get('location', {}).get('city', '')
                if loc_to_use and comm_city.lower() != loc_to_use['city'].lower():
                    # This is an old/incorrect city community!
                    comms_to_remove.append(cid)
                    
        if comms_to_remove:
            needs_update = True
            
        if needs_update:
            logger.info(f"Updating user {user_id} ({user_data.get('name', 'Unknown')})")
            
            # Prepare update data
            update_data = {}
            if normalized_home:
                update_data['home_location'] = normalized_home
            if normalized_loc:
                update_data['location'] = normalized_loc
                
            # Filter community lists
            updated_comms = [cid for cid in current_communities if cid not in comms_to_remove]
            for cid in target_community_ids:
                if cid not in updated_comms:
                    updated_comms.append(cid)
                    
            updated_defaults = [cid for cid in default_communities if cid not in comms_to_remove]
            for cid in target_community_ids:
                if cid not in updated_defaults:
                    updated_defaults.append(cid)
                    
            update_data['communities'] = updated_comms
            update_data['default_communities'] = updated_defaults
            
            # Perform update
            await db.update_document('users', user_id, update_data)
            
            # Add user to target communities
            for cid in target_community_ids:
                await db.add_member_to_community(cid, user_id)
                
            # Remove user from old communities
            for cid in comms_to_remove:
                try:
                    comm_ref = db.client.collection('communities').document(cid)
                    def _remove_member():
                        doc = comm_ref.get()
                        if doc.exists:
                            data = doc.to_dict()
                            members = data.get('members', [])
                            if user_id in members:
                                members.remove(user_id)
                                comm_ref.update({
                                    'members': members,
                                    'member_count': len(members)
                                })
                    await db._run_sync(_remove_member)
                    await db._cache.delete(f"communities:{cid}")
                except Exception as e:
                    logger.error(f"Failed to remove user {user_id} from old community {cid}: {e}")
                    
            users_updated += 1
            
    logger.info(f"Migration completed. Processed: {users_processed}, Updated: {users_updated}")

if __name__ == "__main__":
    asyncio.run(migrate_users())
