"""Temple Service using Firestore"""
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
from uuid import uuid4

from config.firebase_config import get_firestore
from config.firestore_db import FirestoreDB
from utils.helpers import serialize_doc, generate_temple_id
from utils.cache import cache_manager

logger = logging.getLogger(__name__)


class TempleService:
    """Handles temple-related operations using Firestore"""
    
    @staticmethod
    async def get_db() -> FirestoreDB:
        client = await get_firestore()
        return FirestoreDB(client)
        
    @staticmethod
    async def create_temple(
        admin_id: str,
        name: str,
        location: Dict[str, str],
        description: Optional[str] = None,
        deity: Optional[str] = None,
        aarti_timings: Optional[Dict[str, str]] = None,
        guidance: Optional[str] = None,
        youtube_url: Optional[str] = None,
        coords: Optional[Dict[str, float]] = None,
        timings: Optional[Dict[str, str]] = None,
        contact: Optional[str] = None,
        is_verified: Optional[bool] = False,
        temple_id: Optional[str] = None,
        images: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """Create a new temple"""
        db = await TempleService.get_db()
        
        # Use provided temple_id or generate one
        if not temple_id:
            temple_id = generate_temple_id()
            while await db.find_one("temples", [("temple_id", "==", temple_id)]):
                temple_id = generate_temple_id()
        
        temple = {
            "temple_id": temple_id,
            "name": name,
            "location": location,
            "description": description or "",
            "deity": deity or "",
            "aarti_timings": aarti_timings or {},
            "guidance": guidance or "",
            "youtube_url": youtube_url or "",
            "coords": coords or {},
            "timings": timings or {},
            "contact": contact or "",
            "is_verified": is_verified,
            "images": images or [],
            "admin_id": admin_id,
            "admins": [admin_id],
            "followers": [],
            "follower_count": 0,
            "posts": [],
        }
        
        doc_id = await db.create_document("temples", temple)
        temple["id"] = doc_id
        
        # Invalidate temples cache
        await cache_manager.invalidate_temples()
        
        logger.info(f"Temple created: {name} ({temple_id})")
        return serialize_doc(temple)
    
    @staticmethod
    async def get_temples(user_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get all temples with caching"""
        cached = await cache_manager.get_temples()
        if not cached:
            db = await TempleService.get_db()
            temples = await db.query_documents("temples", limit=100)
            temples.sort(key=lambda t: t.get("follower_count", 0), reverse=True)
            
            cached = []
            for t in temples:
                temple_data = serialize_doc(t)
                temple_data["followers"] = t.get("followers", [])
                temple_data["follower_count"] = t.get("follower_count", 0)
                cached.append(temple_data)
            
            await cache_manager.set_temples(cached)
        
        result = []
        for t in cached:
            temple_data = t.copy()
            temple_data["is_following"] = user_id in t.get("followers", []) if user_id else False
            result.append(temple_data)
        
        return result
    
    @staticmethod
    async def get_nearby_temples(
        lat: float = 19.0760,
        lng: float = 72.8777,
        user_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Get temples near user's location"""
        cached = await cache_manager.get_temples()
        if not cached:
            await TempleService.get_temples()
            cached = await cache_manager.get_temples() or []
        
        result = []
        for t in cached[:20]:
            temple_data = t.copy()
            temple_data["is_following"] = user_id in t.get("followers", []) if user_id else False
            temple_data["distance"] = "2.5 km"  # Placeholder
            result.append(temple_data)
        
        return result
    
    @staticmethod
    async def get_temple(temple_id: str, user_id: Optional[str] = None) -> Dict[str, Any]:
        """Get temple details"""
        cache_key = f"temple:detail:{temple_id}"
        cached = await cache_manager.get(cache_key)
        
        if not cached:
            db = await TempleService.get_db()
            temple = await db.find_one("temples", [("temple_id", "==", temple_id)])
            if not temple:
                temple = await db.get_document("temples", temple_id)
            if not temple:
                raise ValueError("Temple not found")
            
            cached = serialize_doc(temple)
            cached["followers"] = temple.get("followers", [])
            cached["follower_count"] = temple.get("follower_count", 0)
            await cache_manager.set(cache_key, cached, ttl=300) # Cache for 5 minutes

        temple_data = cached.copy()
        temple_data["is_following"] = user_id in cached.get("followers", []) if user_id else False
        temple_data["follower_count"] = cached.get("follower_count", 0)
        
        return temple_data
    
    @staticmethod
    async def follow_temple(user_id: str, temple_id: str) -> Dict[str, Any]:
        """Follow a temple"""
        db = await TempleService.get_db()
        
        temple = await db.find_one("temples", [("temple_id", "==", temple_id)])
        if not temple:
            temple = await db.get_document("temples", temple_id)
        if not temple:
            raise ValueError("Temple not found")
        
        # Add user to followers
        followers = temple.get("followers", [])
        if user_id not in followers:
            new_followers = list(followers) + [user_id]
            await db.update_document("temples", temple["id"], {
                "followers": new_followers,
                "follower_count": len(new_followers)
            })
        
        # Add temple to user's followed temples
        user = await db.get_document("users", user_id)
        if user:
            temple_passbook = user.get("temple_passbook", {})
            temples_followed = temple_passbook.get("temples_followed", [])
            if temple["id"] not in temples_followed:
                temples_followed = list(temples_followed) + [temple["id"]]
                temple_passbook["temples_followed"] = temples_followed
                await db.update_document("users", user_id, {
                    "temple_passbook": temple_passbook
                })
        
        # Invalidate caches
        await cache_manager.invalidate_temples()
        await cache_manager.invalidate_user(user_id)
        await cache_manager.delete(f"temple:detail:{temple_id}")
        if temple.get("temple_id"):
            await cache_manager.delete(f"temple:detail:{temple['temple_id']}")
        
        return {"message": f"Now following {temple['name']}"}
    
    @staticmethod
    async def unfollow_temple(user_id: str, temple_id: str) -> Dict[str, Any]:
        """Unfollow a temple"""
        db = await TempleService.get_db()
        
        temple = await db.find_one("temples", [("temple_id", "==", temple_id)])
        if not temple:
            temple = await db.get_document("temples", temple_id)
        if not temple:
            raise ValueError("Temple not found")
        
        followers = temple.get("followers", [])
        if user_id in followers:
            new_followers = [f for f in followers if f != user_id]
            await db.update_document("temples", temple["id"], {
                "followers": new_followers,
                "follower_count": len(new_followers)
            })
        
        user = await db.get_document("users", user_id)
        if user:
            temple_passbook = user.get("temple_passbook", {})
            temples_followed = temple_passbook.get("temples_followed", [])
            if temple["id"] in temples_followed:
                temples_followed = [t for t in temples_followed if t != temple["id"]]
                temple_passbook["temples_followed"] = temples_followed
                await db.update_document("users", user_id, {
                    "temple_passbook": temple_passbook
                })
        
        # Invalidate caches
        await cache_manager.invalidate_temples()
        await cache_manager.invalidate_user(user_id)
        await cache_manager.delete(f"temple:detail:{temple_id}")
        if temple.get("temple_id"):
            await cache_manager.delete(f"temple:detail:{temple['temple_id']}")
        
        return {"message": f"Unfollowed {temple['name']}"}
    
    @staticmethod
    async def create_post(
        user_id: str,
        temple_id: str,
        title: str,
        content: str,
        post_type: str = "announcement"
    ) -> Dict[str, Any]:
        """Create a temple post (admin only)"""
        db = await TempleService.get_db()
        
        temple = await db.find_one("temples", [("temple_id", "==", temple_id)])
        if not temple:
            temple = await db.get_document("temples", temple_id)
        if not temple:
            raise ValueError("Temple not found")
        
        if user_id not in temple.get("admins", []):
            raise ValueError("Only temple admins can post")
        
        user = await db.get_document("users", user_id)
        if not user:
            raise ValueError("User not found")
        
        new_post = {
            "id": str(uuid4()),
            "title": title,
            "content": content,
            "post_type": post_type,
            "author_id": user_id,
            "author_name": user["name"],
            "reactions": [],
            "created_at": datetime.utcnow().isoformat() + 'Z'
        }
        
        posts = temple.get("posts", [])
        posts = [new_post] + posts
        await db.update_document("temples", temple["id"], {"posts": posts})
        await cache_manager.delete(f"temple:detail:{temple_id}")
        if temple.get("temple_id"):
            await cache_manager.delete(f"temple:detail:{temple['temple_id']}")
        
        return new_post
    
    @staticmethod
    async def get_posts(temple_id: str) -> List[Dict[str, Any]]:
        """Get temple posts"""
        db = await TempleService.get_db()
        
        temple = await db.find_one("temples", [("temple_id", "==", temple_id)])
        if not temple:
            temple = await db.get_document("temples", temple_id)
        if not temple:
            raise ValueError("Temple not found")
        
        return temple.get("posts", [])[:20]
    
    @staticmethod
    async def react_to_post(
        user_id: str,
        temple_id: str,
        post_id: str,
        reaction: str = "namaste"
    ) -> Dict[str, Any]:
        """React to a temple post"""
        db = await TempleService.get_db()
        
        temple = await db.find_one("temples", [("temple_id", "==", temple_id)])
        if not temple:
            temple = await db.get_document("temples", temple_id)
        if not temple:
            raise ValueError("Temple not found")
        
        posts = temple.get("posts", [])
        updated = False
        for post in posts:
            if post.get("id") == post_id:
                reactions = post.get("reactions", [])
                existing_reaction = next((r for r in reactions if r.get("user_id") == user_id and r.get("reaction") == reaction), None)
                if not existing_reaction:
                    reactions.append({"user_id": user_id, "reaction": reaction})
                    post["reactions"] = reactions
                    updated = True
                break
                
        if updated:
            await db.update_document("temples", temple["id"], {"posts": posts})
            await cache_manager.delete(f"temple:detail:{temple_id}")
            if temple.get("temple_id"):
                await cache_manager.delete(f"temple:detail:{temple['temple_id']}")
        
        return {"message": "Reaction added"}
