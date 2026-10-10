"""Background task processing using asyncio"""
import asyncio
import logging
from typing import Callable, List

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


# Global task queue instance
task_queue = TaskQueue()
