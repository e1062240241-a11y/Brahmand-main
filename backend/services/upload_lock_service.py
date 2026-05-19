import asyncio

# Mutex to protect the dictionary of locks
_lock_dict_mutex = asyncio.Lock()
# Dictionary of user_id -> asyncio.Lock
_user_locks = {}

async def get_user_upload_lock(user_id: str) -> asyncio.Lock:
    """Returns an asyncio.Lock for a specific user to serialize upload requests."""
    async with _lock_dict_mutex:
        if user_id not in _user_locks:
            _user_locks[user_id] = asyncio.Lock()
        return _user_locks[user_id]
