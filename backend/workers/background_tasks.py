"""Background task processing using asyncio"""
import asyncio
import logging
from typing import Callable, Any, Dict, List
from datetime import datetime

logger = logging.getLogger(__name__)


class TaskQueue:
    """
    Simple async task queue for background processing.
    In production, replace with Celery + Redis or similar.
    """
    
    def __init__(self, max_workers: int = 10):
        self.max_workers = max_workers
        self.queue = None
        self.workers: List[asyncio.Task] = []
        self.running = False

    def _get_queue(self) -> asyncio.Queue:
        if self.queue is None:
            self.queue = asyncio.Queue()
        return self.queue
    
    async def start(self):
        """Start the task queue workers"""
        if self.running:
            return
        
        self.running = True
        for i in range(self.max_workers):
            worker = asyncio.create_task(self._worker(i))
            self.workers.append(worker)
        
        logger.info(f"Task queue started with {self.max_workers} workers")
    
    async def stop(self):
        """Stop the task queue workers"""
        self.running = False
        for worker in self.workers:
            worker.cancel()
        self.workers.clear()
        logger.info("Task queue stopped")
    
    async def _worker(self, worker_id: int):
        """Worker that processes tasks from the queue"""
        logger.info(f"Worker {worker_id} started")
        q = self._get_queue()
        
        while self.running:
            try:
                task = await q.get()
                func, args, kwargs = task
                try:
                    await func(*args, **kwargs)
                except Exception as e:
                    logger.error(f"Worker {worker_id} task error: {e}")
                finally:
                    q.task_done()
                    
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Worker {worker_id} error: {e}")
        
        logger.info(f"Worker {worker_id} stopped")
    
    async def enqueue(self, func: Callable, *args, **kwargs):
        """Add a task to the queue"""
        await self._get_queue().put((func, args, kwargs))
        logger.debug(f"Task enqueued: {func.__name__}")
    
    def enqueue_sync(self, func: Callable, *args, **kwargs):
        """Synchronous version of enqueue for use in sync contexts"""
        self._get_queue().put_nowait((func, args, kwargs))
    
    @property
    def pending_count(self) -> int:
        """Get number of pending tasks"""
        return len(self.queue)


# Global task queue instance
task_queue = TaskQueue()


# Pre-defined background tasks
async def process_notification(
    user_id: str,
    title: str,
    body: str,
    notification_type: str,
    data: Dict[str, Any] = None
):
    """Background task to create and potentially send push notification"""
    from services.firebase_notification_service import FirebaseNotificationService as NotificationService
    
    await NotificationService.create_notification(
        user_id=user_id,
        title=title,
        body=body,
        notification_type=notification_type,
        data=data
    )
    logger.info(f"Notification processed for user {user_id}")





async def cleanup_expired_otps():
    """Background task to clean up expired OTPs"""
    from config.firebase_config import get_firestore
    from config.firestore_db import FirestoreDB
    
    client = await get_firestore()
    db = FirestoreDB(client)
    
    now = datetime.utcnow()
    otps = await db.query_documents('otps')
    
    deleted_count = 0
    for otp in otps:
        expires_at_val = otp.get("expires_at")
        if not expires_at_val:
            continue
            
        try:
            if isinstance(expires_at_val, str):
                if expires_at_val.endswith('Z'):
                    expires_at_val = expires_at_val[:-1]
                expires_at = datetime.fromisoformat(expires_at_val)
            elif isinstance(expires_at_val, datetime):
                expires_at = expires_at_val.replace(tzinfo=None)
            else:
                continue
                
            if expires_at < now:
                await db.delete_document('otps', otp['id'])
                deleted_count += 1
        except Exception as e:
            logger.warning(f"Error cleaning up expired OTP document {otp.get('id')}: {e}")
            
    logger.info(f"Cleaned up {deleted_count} expired OTPs")


async def update_community_stats():
    """Background task to update community statistics"""
    from config.firebase_config import get_firestore
    from config.firestore_db import FirestoreDB
    
    client = await get_firestore()
    db = FirestoreDB(client)
    communities = await db.query_documents('communities')
    
    for community in communities:
        cid = community.get('id')
        if not cid:
            continue
        member_count = len(community.get("members", []))
        await db.update_document('communities', cid, {"member_count": member_count})
    
    logger.info(f"Updated stats for {len(communities)} communities")
