"""
Following Feed Service - Personal Mailbox Fanout-on-Write Pipeline
Handles background post delivery, follow backfills, unfollow cleanups, inbox trimming, and instant single-query feeds.
"""

import logging
import asyncio
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from config.firestore_db import FirestoreDB

logger = logging.getLogger(__name__)


async def trim_inbox_if_needed(db: FirestoreDB, follower_uid: str):
    """Non-blocking background helper to trim a follower's inbox to 300 posts max."""
    try:
        inbox_items = await db.query_documents(
            'following_inboxes',
            filters=[('user_id', '==', follower_uid)],
            order_by='created_at',
            order_direction='DESCENDING',
            limit=350
        )
        if len(inbox_items) > 300:
            excess_items = inbox_items[300:]
            excess_ids = [item['id'] for item in excess_items if item.get('id')]
            if excess_ids:
                await db.batch_delete_documents('following_inboxes', excess_ids)
    except Exception as cap_err:
        logger.warning(f"Failed to trim inbox for user {follower_uid}: {cap_err}")


async def fanout_post_to_followers(db: FirestoreDB, author_id: str, post_id: str, created_at_iso: str):
    """
    Background worker: Fans out a newly uploaded post to all followers' following_inboxes.
    Enforces the 300-post inbox cap per follower asynchronously.
    """
    try:
        followers_set = set()

        # 1. Query user_follows collection
        try:
            follows = await db.query_documents('user_follows', filters=[('followee_uid', '==', author_id)])
            for f in follows:
                f_uid = f.get('follower_uid')
                if f_uid:
                    followers_set.add(f_uid)
        except Exception as e:
            logger.warning(f"Error querying user_follows in fanout for author {author_id}: {e}")

        # Fallback to user document followers array
        if not followers_set:
            try:
                user_doc = await db.get_document('users', author_id)
                if user_doc:
                    followers_arr = user_doc.get('followers', []) or []
                    for f_uid in followers_arr:
                        if f_uid:
                            followers_set.add(f_uid)
            except Exception as e:
                logger.warning(f"Error checking user followers array in fanout for author {author_id}: {e}")

        if not followers_set:
            logger.info(f"No followers found for user {author_id} to fanout post {post_id}")
            return

        # Parse created_at
        try:
            created_at_dt = datetime.fromisoformat(created_at_iso.replace('Z', '+00:00'))
        except Exception:
            created_at_dt = datetime.now(timezone.utc)

        # 2. Insert into following_inboxes for each follower
        async def _insert_inbox(follower_uid):
            doc_id = f"{follower_uid}_{post_id}"
            inbox_doc = {
                'user_id': follower_uid,
                'post_id': post_id,
                'author_id': author_id,
                'created_at': created_at_dt
            }
            await db.set_document('following_inboxes', doc_id, inbox_doc)

        follower_list = list(followers_set)
        chunk_size = 50
        for i in range(0, len(follower_list), chunk_size):
            chunk = follower_list[i:i + chunk_size]
            await asyncio.gather(*[_insert_inbox(f_uid) for f_uid in chunk], return_exceptions=True)

        # Non-blocking async trimming for followers
        for f_uid in follower_list:
            asyncio.create_task(trim_inbox_if_needed(db, f_uid))

        logger.info(f"Successfully fanned out post {post_id} of author {author_id} to {len(follower_list)} followers' inboxes")

    except Exception as e:
        logger.error(f"Error in fanout_post_to_followers for post {post_id}: {e}")


async def backfill_following_inbox(db: FirestoreDB, follower_id: str, creator_id: str, count: int = 10):
    """
    Backfill latest 'count' posts from creator_id into follower_id's following_inbox upon follow concurrently.
    """
    try:
        creator_posts = await db.query_documents(
            'posts',
            filters=[('user_id', '==', creator_id)],
            order_by='created_at',
            order_direction='DESCENDING',
            limit=count
        )
        if not creator_posts:
            return

        async def _insert_backfill(post):
            post_id = post.get('id')
            if not post_id:
                return
            doc_id = f"{follower_id}_{post_id}"
            created_at = post.get('created_at') or datetime.now(timezone.utc)
            inbox_doc = {
                'user_id': follower_id,
                'post_id': post_id,
                'author_id': creator_id,
                'created_at': created_at
            }
            await db.set_document('following_inboxes', doc_id, inbox_doc)

        await asyncio.gather(*[_insert_backfill(p) for p in creator_posts], return_exceptions=True)
        logger.info(f"Backfilled {len(creator_posts)} posts from creator {creator_id} to follower {follower_id} inbox")
    except Exception as e:
        logger.error(f"Error backfilling following_inbox for follower {follower_id} from creator {creator_id}: {e}")


async def clean_following_inbox(db: FirestoreDB, follower_id: str, creator_id: str):
    """
    Remove all posts by creator_id from follower_id's following_inbox upon unfollow.
    """
    try:
        inbox_items = await db.query_documents(
            'following_inboxes',
            filters=[('user_id', '==', follower_id), ('author_id', '==', creator_id)]
        )
        if inbox_items:
            item_ids = [item['id'] for item in inbox_items if item.get('id')]
            if item_ids:
                await db.batch_delete_documents('following_inboxes', item_ids)
                logger.info(f"Cleaned {len(item_ids)} posts from creator {creator_id} from follower {follower_id} inbox")
    except Exception as e:
        logger.error(f"Error cleaning following_inbox for follower {follower_id} from creator {creator_id}: {e}")


async def get_following_feed_posts(
    db: FirestoreDB,
    current_user_id: str,
    following_ids: set,
    safe_limit: int,
    after: str = ''
) -> list[dict]:
    """
    Read Path: Performs a single O(1) query on following_inboxes collection with cursor pagination.
    Falls back to instant backfill if inbox is empty for a user following creators.
    """
    if not following_ids:
        return []

    inbox_filters = [('user_id', '==', current_user_id)]

    # Cursor-based pagination for inbox query
    if after:
        after_inbox_doc = await db.get_document('following_inboxes', f"{current_user_id}_{after}")
        after_created_at = after_inbox_doc.get('created_at') if after_inbox_doc else None
        if not after_created_at:
            after_post = await db.get_document('posts', after)
            after_created_at = after_post.get('created_at') if after_post else None
        if after_created_at:
            inbox_filters.append(('created_at', '<', after_created_at))

    # 1. Single query on following_inboxes collection
    inbox_docs = await db.query_documents(
        'following_inboxes',
        filters=inbox_filters,
        order_by='created_at',
        order_direction='DESCENDING',
        limit=safe_limit + 5
    )

    # 2. Fallback: If inbox is empty and no cursor passed, for a user who follows people, perform automatic backfill
    if not inbox_docs and not after and following_ids:
        logger.info(f"Empty following_inbox for user {current_user_id} following {len(following_ids)} users. Executing fallback backfill...")
        fids = list(following_ids)[:30]

        async def _backfill_creator(fid):
            c_posts = await db.query_documents(
                'posts',
                filters=[('user_id', '==', fid)],
                order_by='created_at',
                order_direction='DESCENDING',
                limit=10
            )
            for post in c_posts:
                pid = post.get('id')
                if pid:
                    doc_id = f"{current_user_id}_{pid}"
                    inbox_doc = {
                        'user_id': current_user_id,
                        'post_id': pid,
                        'author_id': fid,
                        'created_at': post.get('created_at') or datetime.now(timezone.utc)
                    }
                    await db.set_document('following_inboxes', doc_id, inbox_doc)

        await asyncio.gather(*[_backfill_creator(fid) for fid in fids], return_exceptions=True)

        # Re-query inbox after backfill
        inbox_docs = await db.query_documents(
            'following_inboxes',
            filters=inbox_filters,
            order_by='created_at',
            order_direction='DESCENDING',
            limit=safe_limit + 5
        )

    post_ids = [doc.get('post_id') for doc in inbox_docs if doc.get('post_id')]
    if not post_ids:
        return []

    # 3. Single batch fetch to get post details
    fetched_posts = await db.get_documents_batch('posts', post_ids)
    posts_map = {p['id']: p for p in fetched_posts if p and 'id' in p}

    # Preserve inbox chronological order
    return [posts_map[pid] for pid in post_ids if pid in posts_map]
