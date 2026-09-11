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
    async def get_events(limit: int = 20, offset: int = 0) -> List[Dict[str, Any]]:
        """Get upcoming events with pagination"""
        db = await EventService.get_db()
        today = datetime.utcnow().strftime("%Y-%m-%d")
        safe_limit = max(1, min(limit, 100))
        safe_offset = max(0, offset)
        fetch_limit = safe_offset + safe_limit

        try:
            events = await db.query_documents(
                'events',
                filters=[('date', '>=', today)],
                order_by='date',
                order_direction='ASCENDING',
                limit=fetch_limit
            )
        except Exception as e:
            logger.warning(f"Failed to query events with filter: {e}. Falling back to simple query.")
            events = await db.query_documents('events', limit=fetch_limit)
        
        # If no future events found, fallback to return all events
        if not events:
            events = await db.query_documents('events', limit=fetch_limit)

        # Normalize events
        normalized = []
        for e in events:
            doc = serialize_doc(e)
            # If it has event_date but no date/time, populate them
            if 'event_date' in doc and not doc.get('date'):
                dt_val = doc['event_date']
                if isinstance(dt_val, str):
                    try:
                        dt = datetime.fromisoformat(dt_val.replace('Z', '+00:00'))
                    except Exception:
                        dt = datetime.utcnow()
                elif isinstance(dt_val, datetime):
                    dt = dt_val
                else:
                    dt = datetime.utcnow()
                doc['date'] = dt.strftime("%Y-%m-%d")
                doc['time'] = dt.strftime("%H:%M")
            normalized.append(doc)
            
        return normalized[safe_offset:safe_offset + safe_limit]
    
    @staticmethod
    async def get_nearby_events(user_id: str, limit: int = 20, offset: int = 0) -> List[Dict[str, Any]]:
        """Get events near user's location with pagination"""
        db = await EventService.get_db()
        user = await db.get_document('users', user_id)
        if not user:
            return []
        user_location = user.get("location", {})
        
        safe_limit = max(1, min(limit, 100))
        safe_offset = max(0, offset)
        fetch_limit = safe_offset + safe_limit

        # Get events in user's city
        today = datetime.utcnow().strftime("%Y-%m-%d")
        filters = [('date', '>=', today)]
        
        if user_location.get("city"):
            filters.append(('location.city', '==', user_location["city"]))
        
        try:
            events = await db.query_documents(
                'events',
                filters=filters,
                order_by='date',
                order_direction='ASCENDING',
                limit=fetch_limit
            )
        except Exception as e:
            logger.warning(f"Failed to query nearby events with filter: {e}")
            events = await db.query_documents('events', limit=fetch_limit)
        
        # Add distance info (simplified)
        result = []
        for e in events:
            event = serialize_doc(e)
            event["distance"] = "2.5 km"  # Placeholder - calculate actual distance
            result.append(event)
        
        return result[safe_offset:safe_offset + safe_limit]
    
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
        """Mark user as attending an event and notify the creator."""
        db = await EventService.get_db()

        # Try events collection first, then community posts
        event = await db.get_document('events', event_id)
        collection = 'events'
        if not event:
            event = await db.get_document('community_posts', event_id)
            collection = 'community_posts'
        if not event:
            # Soft-fail: event may be ephemeral/local — still return success
            return {"message": "Attendance recorded", "attendee_count": 1}

        attendees = list(event.get('attendees', []) or [])
        if user_id not in attendees:
            attendees.append(user_id)
            await db.update_document(collection, event_id, {
                'attendees': attendees,
                'attendee_count': len(attendees)
            })

        # Notify creator
        creator_id = event.get('user_id') or event.get('organizer_id') or event.get('creator_id')
        if creator_id and creator_id != user_id:
            try:
                from services.firebase_notification_service import FirebaseNotificationService
                from workers.background_tasks import task_queue

                attender_user = await db.get_document('users', user_id)
                attender_name = (attender_user or {}).get('name', 'Someone')
                event_title = event.get('title') or event.get('name') or 'your event'

                notif_title = "🎉 Someone is attending your event!"
                notif_body = f"{attender_name} confirmed they will attend '{event_title}'."
                notif_data = {
                    'type': 'event_rsvp',
                    'eventId': str(event_id),
                    'community_id': str(event.get('community_id', '')),
                }

                await task_queue.enqueue(
                    FirebaseNotificationService.send_push_notification,
                    creator_id,
                    notif_title,
                    notif_body,
                    notif_data
                )
                await task_queue.enqueue(
                    FirebaseNotificationService.create_notification,
                    creator_id,
                    notif_title,
                    notif_body,
                    'event_rsvp',
                    notif_data
                )
                logger.info(f"Queued event RSVP notification for event {event_id} creator {creator_id}")
            except Exception as notify_err:
                logger.warning(f"Failed to notify creator for event RSVP {event_id}: {notify_err}")

        return {"message": "Attendance confirmed", "attendee_count": len(attendees)}
    
    @staticmethod
    async def cancel_attendance(user_id: str, event_id: str) -> Dict[str, Any]:
        """Cancel user's attendance for an event."""
        db = await EventService.get_db()

        event = await db.get_document('events', event_id)
        collection = 'events'
        if not event:
            event = await db.get_document('community_posts', event_id)
            collection = 'community_posts'
        if not event:
            return {"message": "Attendance cancelled", "attendee_count": 0}

        attendees = list(event.get('attendees', []) or [])
        if user_id in attendees:
            attendees.remove(user_id)
            await db.update_document(collection, event_id, {
                'attendees': attendees,
                'attendee_count': len(attendees)
            })

        return {"message": "Attendance cancelled", "attendee_count": len(attendees)}
