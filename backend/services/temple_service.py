"""Temple Service using Firestore"""
import logging
from datetime import datetime
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
        return serialize_doc(temple) or {}
    
    @staticmethod
    async def _resolve_following_set(user_id: str, paginated_items: List[Dict[str, Any]]) -> set:
        """Helper to resolve follow status for a list of temples via temple_follows collection with legacy fallback"""
        if not user_id or not paginated_items:
            return set()

        db = await TempleService.get_db()
        follow_ids = []
        id_to_temple_keys = {}
        for t in paginated_items:
            t_id = t.get("temple_id") or t.get("id")
            doc_id = t.get("id")
            if t_id:
                fid1 = f"{t_id}_{user_id}"
                follow_ids.append(fid1)
                id_to_temple_keys[fid1] = t_id
            if doc_id and doc_id != t_id:
                fid2 = f"{doc_id}_{user_id}"
                follow_ids.append(fid2)
                id_to_temple_keys[fid2] = t_id

        following_set = set()

        if follow_ids:
            try:
                follow_docs = await db.get_documents_batch("temple_follows", list(set(follow_ids)))
                for fdoc in follow_docs:
                    if fdoc and fdoc.get("active", True) is not False:
                        if fdoc.get("temple_id"):
                            following_set.add(fdoc.get("temple_id"))
                        target_t_id = id_to_temple_keys.get(fdoc.get("id"))
                        if target_t_id:
                            following_set.add(target_t_id)
            except Exception as e:
                logger.warning("Error fetching temple_follows batch: %s", e)

        return following_set

    @staticmethod
    async def get_temples(
        user_id: Optional[str] = None,
        limit: int = 300,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """Get temples with caching and pagination"""
        cached = await cache_manager.get_temples()
        if not cached:
            db = await TempleService.get_db()
            temples = await db.query_documents("temples")
            temples.sort(key=lambda t: t.get("follower_count", 0) or 0, reverse=True)
            
            cached = []
            for t in temples:
                temple_data = serialize_doc(t) or {}
                # Architectural fix: do not store full 'followers' arrays in cache objects
                temple_data.pop("followers", None)
                raw_followers = t.get("followers")
                fallback_len = len(raw_followers) if isinstance(raw_followers, list) else 0
                temple_data["follower_count"] = t.get("follower_count", fallback_len)
                cached.append(temple_data)
            
            await cache_manager.set_temples(cached)
        
        safe_limit = max(1, min(limit, 500))
        paginated_items = cached[offset:offset + safe_limit]

        following_set = await TempleService._resolve_following_set(user_id, paginated_items) if user_id else set()

        result = []
        for t in paginated_items:
            temple_data = t.copy()
            temple_data.pop("followers", None)
            t_id = temple_data.get("temple_id") or temple_data.get("id")
            doc_id = temple_data.get("id")

            is_following = False
            if user_id:
                if (t_id in following_set) or (doc_id in following_set):
                    is_following = True

            temple_data["is_following"] = is_following
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
        
        paginated_items = cached[:20]
        following_set = await TempleService._resolve_following_set(user_id, paginated_items) if user_id else set()

        result = []
        for t in paginated_items:
            temple_data = t.copy()
            temple_data.pop("followers", None)
            t_id = temple_data.get("temple_id") or temple_data.get("id")
            doc_id = temple_data.get("id")

            is_following = False
            if user_id:
                if (t_id in following_set) or (doc_id in following_set):
                    is_following = True

            temple_data["is_following"] = is_following
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
            
            cached = serialize_doc(temple) or {}
            # Architectural fix: Strip full 'followers' array from detail cache
            cached.pop("followers", None)
            raw_followers = temple.get("followers")
            fallback_len = len(raw_followers) if isinstance(raw_followers, list) else 0
            cached["follower_count"] = temple.get("follower_count", fallback_len)
            await cache_manager.set(cache_key, cached, ttl=300) # Cache for 5 minutes

        temple_data = cached.copy() if cached else {}
        temple_data.pop("followers", None)

        is_following = False
        if user_id:
            db = await TempleService.get_db()
            canonical_id = temple_data.get("temple_id") or temple_id
            doc_id = temple_data.get("id") or temple_id

            f_doc1 = await db.get_document("temple_follows", f"{canonical_id}_{user_id}")
            f_doc2 = await db.get_document("temple_follows", f"{doc_id}_{user_id}") if doc_id != canonical_id else None

            if (f_doc1 and f_doc1.get("active", True) is not False) or (f_doc2 and f_doc2.get("active", True) is not False):
                is_following = True
            else:
                # Fallback check against raw document followers array for legacy docs
                raw_temple = await db.get_document_fields("temples", doc_id, ["followers"])
                if raw_temple and user_id in (raw_temple.get("followers") or []):
                    is_following = True

        temple_data["is_following"] = is_following
        temple_data["follower_count"] = temple_data.get("follower_count", 0)
        
        return temple_data

    @staticmethod
    async def follow_temple(temple_id: str, user_id: str) -> Dict[str, Any]:
        """Follow a temple atomically using dedicated temple_follows collection"""
        db = await TempleService.get_db()
        temple = await db.find_one("temples", [("temple_id", "==", temple_id)])
        doc_id = temple["id"] if temple else temple_id
        canonical_id = temple.get("temple_id") if temple and temple.get("temple_id") else temple_id
        if not temple:
            temple = await db.get_document("temples", doc_id)
        if not temple:
            raise ValueError("Temple not found")

        follow_key = f"{canonical_id}_{user_id}"
        existing_follow = await db.get_document("temple_follows", follow_key)
        followers = temple.get("followers", [])
        is_already_following = bool(existing_follow) or (user_id in followers)

        if not is_already_following:
            now_iso = datetime.utcnow().isoformat() + 'Z'
            await db.create_document("temple_follows", {
                "temple_id": canonical_id,
                "user_id": user_id,
                "created_at": now_iso,
                "active": True
            }, doc_id=follow_key)
            if doc_id != canonical_id:
                doc_follow_key = f"{doc_id}_{user_id}"
                await db.create_document("temple_follows", {
                    "temple_id": doc_id,
                    "user_id": user_id,
                    "created_at": now_iso,
                    "active": True
                }, doc_id=doc_follow_key)

            # Architectural fix: Cap legacy followers array on temple document to max 100 UIDs
            # to prevent document bloat and 1MB size limit crashes in Firestore.
            if len(followers) < 100:
                await db.array_union_update("temples", doc_id, "followers", [user_id])
            await db.increment_field("temples", doc_id, "follower_count", 1)

            await cache_manager.invalidate_temples()
            await cache_manager.delete(f"temple:detail:{temple_id}")
            if canonical_id != temple_id:
                await cache_manager.delete(f"temple:detail:{canonical_id}")
        return {"message": "Now following temple"}

    @staticmethod
    async def unfollow_temple(temple_id: str, user_id: str) -> Dict[str, Any]:
        """Unfollow a temple atomically using dedicated temple_follows collection"""
        db = await TempleService.get_db()
        temple = await db.find_one("temples", [("temple_id", "==", temple_id)])
        doc_id = temple["id"] if temple else temple_id
        canonical_id = temple.get("temple_id") if temple and temple.get("temple_id") else temple_id
        if not temple:
            temple = await db.get_document("temples", doc_id)
        if not temple:
            raise ValueError("Temple not found")

        follow_key = f"{canonical_id}_{user_id}"
        existing_follow = await db.get_document("temple_follows", follow_key)
        followers = temple.get("followers", [])
        is_currently_following = bool(existing_follow) or (user_id in followers)

        if is_currently_following:
            if existing_follow:
                await db.delete_document("temple_follows", follow_key)
                if doc_id != canonical_id:
                    await db.delete_document("temple_follows", f"{doc_id}_{user_id}")

            if user_id in followers:
                await db.array_remove_update("temples", doc_id, "followers", [user_id])

            await db.increment_field("temples", doc_id, "follower_count", -1)

            await cache_manager.invalidate_temples()
            await cache_manager.delete(f"temple:detail:{temple_id}")
            if canonical_id != temple_id:
                await cache_manager.delete(f"temple:detail:{canonical_id}")
        return {"message": "Unfollowed temple"}
    

    
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
        
        post_id = str(uuid4())
        new_post = {
            "id": post_id,
            "temple_id": temple_id,
            "title": title,
            "content": content,
            "post_type": post_type,
            "author_id": user_id,
            "author_name": user.get("name") or "Admin",
            "reactions": [],
            "created_at": datetime.utcnow().isoformat() + 'Z'
        }
        
        # Architectural fix: Store post as standalone document in temple_posts collection
        # to prevent unbounded array growth and 1MB limit crash on temple parent doc.
        await db.create_document("temple_posts", new_post, doc_id=post_id)

        await cache_manager.delete(f"temple:detail:{temple_id}")
        if temple.get("temple_id"):
            await cache_manager.delete(f"temple:detail:{temple['temple_id']}")
        
        return new_post
    
    @staticmethod
    async def get_posts(temple_id: str) -> List[Dict[str, Any]]:
        """Get temple posts from dedicated collection with fallback to legacy embedded posts"""
        db = await TempleService.get_db()
        
        temple = await db.find_one("temples", [("temple_id", "==", temple_id)])
        if not temple:
            temple = await db.get_document("temples", temple_id)
        if not temple:
            raise ValueError("Temple not found")

        # Query standalone temple_posts collection
        try:
            posts = await db.query_documents(
                "temple_posts",
                filters=[("temple_id", "==", temple_id)],
                order_by="created_at",
                order_direction="DESCENDING",
                limit=20
            )
        except Exception as e:
            if "requires an index" in str(e) or "400" in str(e):
                logger.warning("Composite index missing for temple_posts temple_id + created_at: %s", e)
                try:
                    posts = await db.query_documents(
                        "temple_posts",
                        filters=[("temple_id", "==", temple_id)],
                        limit=20
                    )
                    posts.sort(key=lambda x: str(x.get("created_at") or ""), reverse=True)
                except Exception as inner_e:
                    logger.error("Failed un-ordered fallback query for temple_posts: %s", inner_e)
                    posts = []
            else:
                posts = []

        if posts:
            return posts

        # Fallback to legacy embedded posts array on temple document if standalone collection is empty
        legacy_posts = temple.get("posts", [])
        return legacy_posts[:20]
    
    @staticmethod
    async def react_to_post(
        user_id: str,
        temple_id: str,
        post_id: str,
        reaction: str = "namaste"
    ) -> Dict[str, Any]:
        """React to a temple post with atomic update on temple_posts document"""
        db = await TempleService.get_db()
        
        # 1. Try updating standalone post in temple_posts collection
        post = await db.get_document("temple_posts", post_id)
        if post:
            reactions = post.get("reactions", [])
            existing_reaction = next((r for r in reactions if r.get("user_id") == user_id and r.get("reaction") == reaction), None)
            if not existing_reaction:
                new_reaction = {"user_id": user_id, "reaction": reaction}
                await db.array_union_update("temple_posts", post_id, "reactions", [new_reaction])
                await cache_manager.delete(f"temple:detail:{temple_id}")
            return {"message": "Reaction added"}

        # 2. Fallback for legacy embedded posts on temple document
        temple = await db.find_one("temples", [("temple_id", "==", temple_id)])
        if not temple:
            temple = await db.get_document("temples", temple_id)
        if not temple:
            raise ValueError("Temple not found")
        
        posts = temple.get("posts", [])
        updated = False
        for p in posts:
            if p.get("id") == post_id:
                reactions = p.get("reactions", [])
                existing_reaction = next((r for r in reactions if r.get("user_id") == user_id and r.get("reaction") == reaction), None)
                if not existing_reaction:
                    reactions.append({"user_id": user_id, "reaction": reaction})
                    p["reactions"] = reactions
                    updated = True
                break
                
        if updated:
            await db.update_document("temples", temple["id"], {"posts": posts})
            await cache_manager.delete(f"temple:detail:{temple_id}")
            if temple.get("temple_id"):
                await cache_manager.delete(f"temple:detail:{temple['temple_id']}")
        
        return {"message": "Reaction added"}
