"""Event Service"""
import logging
from datetime import datetime
from typing import Optional, Dict, Any, List

from config.firebase_config import get_firestore
from config.firestore_db import FirestoreDB
from utils.helpers import serialize_doc

logger = logging.getLogger(__name__)


class EventService:
    """Handles event-related operations"""
    
    @staticmethod
    async def get_db() -> FirestoreDB:
        client = await get_firestore()
        return FirestoreDB(client)
    
    @staticmethod
    async def create_event(
        organizer_id: str,
        name: str,
        description: str,
        event_type: str,
        location: Dict[str, Any],
        date: str,
        time: str,
        organizer_name: Optional[str] = None
    ) -> Dict[str, Any]:
        """Create a new event"""
        db = await EventService.get_db()
        user = await db.get_document('users', organizer_id)
        if not user:
            raise ValueError("User not found")
        
        # Check if user is verified
        if not user.get("is_verified", False):
            raise ValueError("Only verified members can create events")
        
        event = {
            "name": name,
            "description": description,
            "event_type": event_type,
            "location": location,
            "date": date,
            "time": time,
            "organizer_id": organizer_id,
            "organizer_name": organizer_name or user.get("name", "Unknown"),
            "attendees": [organizer_id],
            "attendee_count": 1,
            "status": "upcoming",
            "created_at": datetime.utcnow().isoformat() + 'Z',
            "updated_at": datetime.utcnow().isoformat() + 'Z'
        }
        
        doc_id = await db.create_document('events', event)
        event["id"] = doc_id
        
        logger.info(f"Event created: {name}")
        return serialize_doc(event)
    
    @staticmethod
    async def get_events() -> List[Dict[str, Any]]:
        """Get upcoming events"""
        db = await EventService.get_db()
        today = datetime.utcnow().strftime("%Y-%m-%d")
        events = await db.query_documents(
            'events',
            filters=[('date', '>=', today)],
            order_by='date',
            order_direction='ASCENDING',
            limit=20
        )
        return [serialize_doc(e) for e in events]
    
    @staticmethod
    async def get_nearby_events(user_id: str) -> List[Dict[str, Any]]:
        """Get events near user's location"""
        db = await EventService.get_db()
        user = await db.get_document('users', user_id)
        if not user:
            return []
        user_location = user.get("location", {})
        
        # Get events in user's city
        today = datetime.utcnow().strftime("%Y-%m-%d")
        filters = [('date', '>=', today)]
        
        if user_location.get("city"):
            filters.append(('location.city', '==', user_location["city"]))
        
        events = await db.query_documents(
            'events',
            filters=filters,
            order_by='date',
            order_direction='ASCENDING',
            limit=20
        )
        
        # Add distance info (simplified)
        result = []
        for e in events:
            event = serialize_doc(e)
            event["distance"] = "2.5 km"  # Placeholder - calculate actual distance
            result.append(event)
        
        return result
    
    @staticmethod
    async def get_event(event_id: str) -> Dict[str, Any]:
        """Get event details"""
        db = await EventService.get_db()
        event = await db.get_document('events', event_id)
        if not event:
            raise ValueError("Event not found")
        return serialize_doc(event)
    
    @staticmethod
    async def attend_event(user_id: str, event_id: str) -> Dict[str, Any]:
        """Mark attendance for an event"""
        db = await EventService.get_db()
        
        from google.cloud import firestore
        def _attend():
            doc_ref = db.client.collection('events').document(event_id)
            doc_ref.update({
                'attendees': firestore.ArrayUnion([user_id]),
                'attendee_count': firestore.Increment(1)
            })
            
        await db._run_sync(_attend)
        await db._cache.delete(f"events:{event_id}")
        
        return {"message": "You're attending this event"}
    
    @staticmethod
    async def cancel_attendance(user_id: str, event_id: str) -> Dict[str, Any]:
        """Cancel attendance for an event"""
        db = await EventService.get_db()
        
        from google.cloud import firestore
        def _cancel():
            doc_ref = db.client.collection('events').document(event_id)
            doc_ref.update({
                'attendees': firestore.ArrayRemove([user_id]),
                'attendee_count': firestore.Increment(-1)
            })
            
        await db._run_sync(_cancel)
        await db._cache.delete(f"events:{event_id}")
        
        return {"message": "Attendance cancelled"}
