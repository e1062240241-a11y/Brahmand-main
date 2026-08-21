"""Firebase Push Notification Service using FCM"""
import logging
from datetime import datetime
from typing import Optional, Dict, Any, List, Tuple

from config.firebase_config import get_firestore, get_firebase_messaging
from config.firestore_db import FirestoreDB

logger = logging.getLogger(__name__)


class FirebaseNotificationService:
    """Handles push notifications with Firebase Cloud Messaging"""
    
    # Notification types
    TYPE_MESSAGE = "message"
    TYPE_COMMUNITY = "community"
    TYPE_EVENT = "event"
    TYPE_VERIFICATION = "verification"
    TYPE_SYSTEM = "system"
    
    @staticmethod
    async def get_db() -> FirestoreDB:
        client = await get_firestore()
        return FirestoreDB(client)
    
    @staticmethod
    async def _get_blocked_user_ids(db, user_id: str) -> set:
        blocked_ids = set()
        try:
            # Users blocked by user_id
            blocks_by_me = await db.query_documents('user_blocks', filters=[('blockerUid', '==', user_id)])
            for b in blocks_by_me:
                b_uid = b.get('blockedUid')
                if b_uid:
                    blocked_ids.add(b_uid)
            
            # Users who blocked user_id
            blocks_of_me = await db.query_documents('user_blocks', filters=[('blockedUid', '==', user_id)])
            for b in blocks_of_me:
                b_uid = b.get('blockerUid')
                if b_uid:
                    blocked_ids.add(b_uid)
        except Exception as e:
            logger.error("Error retrieving blocked users list in notification service: %s", e)
        return blocked_ids

    @staticmethod
    async def create_notification(
        user_id: str,
        title: str,
        body: str,
        notification_type: str,
        data: Optional[Dict[str, Any]] = None,
        notification_id: Optional[str] = None,
        overwrite: bool = True
    ) -> Dict[str, Any]:
        """Create and store notification with roll-up aggregation support for high-frequency actions"""
        db = await FirebaseNotificationService.get_db()
        data = data or {}

        # Determine actor_id
        actor_id = data.get('actor_id') or data.get('follower_id') or data.get('actor_user_id') or data.get('sender_id') or data.get('actor_uid')
        
        # Check block status
        if actor_id:
            try:
                blocked_user_ids = await FirebaseNotificationService._get_blocked_user_ids(db, user_id)
                if actor_id in blocked_user_ids:
                    logger.info(f"Skipping notification creation for user {user_id} due to block relationship with actor {actor_id}")
                    return {"message": "Blocked"}
            except Exception as e:
                logger.warning(f"Error checking block status for notification creation: {e}")

        now_iso = datetime.utcnow().isoformat() + 'Z'
        now_dt = datetime.utcnow()
        action = (data.get('action') or notification_type or '').lower()
        target_id = data.get('post_id') or data.get('target_id') or data.get('comment_id')

        # High-frequency roll-up aggregation check (for post_like, comment, post_comment, etc.)
        is_high_frequency = any(kw in action or kw in notification_type.lower() for kw in ['like', 'comment'])

        if is_high_frequency and target_id and actor_id:
            date_str = now_dt.strftime("%Y_%m_%d")
            group_key = f"{notification_type}_{target_id}_{date_str}"

            try:
                # Look for existing UNREAD notification document with same group_key for this user
                existing_docs = await db.query_documents(
                    'notifications',
                    filters=[
                        ('user_id', '==', user_id),
                        ('group_key', '==', group_key),
                        ('is_read', '==', False)
                    ]
                )

                # Check if created within last 24 hours (86400s)
                valid_doc = None
                for doc in (existing_docs or []):
                    created_str = doc.get('created_at', '')
                    if created_str:
                        try:
                            clean_str = created_str[:-1] if created_str.endswith('Z') else created_str
                            doc_dt = datetime.fromisoformat(clean_str)
                            if (now_dt - doc_dt).total_seconds() <= 86400:
                                valid_doc = doc
                                break
                        except Exception:
                            pass

                if valid_doc and 'id' in valid_doc:
                    doc_id = valid_doc['id']
                    actor_ids = list(valid_doc.get('actor_ids') or [])
                    if actor_id not in actor_ids:
                        actor_ids.append(actor_id)
                    actor_count = len(actor_ids)

                    update_data = {
                        "latest_actor_id": actor_id,
                        "actor_ids": actor_ids,
                        "actor_count": actor_count,
                        "updated_at": now_iso,
                        "title": title,
                        "body": body,
                        "data": data
                    }

                    await db.update_document('notifications', doc_id, update_data)
                    updated_doc = {**valid_doc, **update_data}

                    try:
                        from main import sio
                        await sio.emit('new_notification', updated_doc, room=f"user_{user_id}")
                    except Exception as e:
                        logger.warning(f"Failed to emit socket notification for updated doc {doc_id}: {e}")

                    return updated_doc
            except Exception as agg_err:
                logger.warning(f"Error during notification aggregation check: {agg_err}")

        # One-off or fresh document creation
        date_str = now_dt.strftime("%Y_%m_%d")
        group_key = f"{notification_type}_{target_id}_{date_str}" if target_id else f"{notification_type}_{now_dt.strftime('%Y_%m_%d_%H_%M_%S')}"
        actor_ids = [actor_id] if actor_id else []

        notification_data = {
            "user_id": user_id,
            "title": title,
            "body": body,
            "notification_type": notification_type,
            "group_key": group_key,
            "latest_actor_id": actor_id,
            "actor_ids": actor_ids,
            "actor_count": len(actor_ids) if actor_ids else 1,
            "data": data,
            "is_read": False,
            "created_at": now_iso,
            "updated_at": now_iso
        }
        
        inserted_id = await db.create_document('notifications', notification_data, doc_id=notification_id, overwrite=overwrite)
        notification_data['id'] = inserted_id
        
        logger.debug(f"Notification created for user {user_id}")
        
        # Emit Socket.IO event to user's private room
        try:
            from main import sio
            await sio.emit('new_notification', notification_data, room=f"user_{user_id}")
            logger.debug(f"Emitted real-time notification to user_{user_id} via socket from FirebaseNotificationService")
        except Exception as e:
            logger.warning(f"Failed to emit socket notification for user {user_id} in create_notification: {e}")

        return notification_data
    
    @staticmethod
    async def _send_expo_push_notifications(
        tokens: List[str],
        title: str,
        body: str,
        data: Optional[Dict[str, str]] = None
    ) -> Tuple[int, List[str]]:
        """Send push notifications to Expo Go clients using the Expo Push API"""
        if not tokens:
            return 0, []
        import httpx
        url = "https://exp.host/--/api/v2/push/send"
        
        notification_type = data.get('type') if data else None
        # Match both 'sos_alert' and any 'sos_' subtype
        is_sos = bool(notification_type and (notification_type == 'sos_alert' or notification_type.startswith('sos_')))
        is_msg = bool(notification_type and notification_type in ('message', 'dm'))
        is_community = bool(notification_type and notification_type in ('community_interest', 'event_rsvp', 'community_request'))

        # iOS requires the .caf extension for custom sounds via the Expo Push API.
        # Without the extension iOS silently falls back to the default system sound.
        ios_sound = 'soundreality_mayday_166011_ios.caf' if is_sos else 'bell_ios.caf'

        # Derive a stable grouping key from the data payload.
        # iOS uses `thread-id` to collapse notifications into a single stack per thread.
        # Android uses `channelId` + the system groups all notifications from the same app
        # by default; a separate `tag` in FCM collapses per-tag (handled in native path).
        # WhatsApp-style rule: same chat_id → same stack; different chats → separate stacks.
        group_key = None
        if data:
            if data.get('chat_id'):
                group_key = f"chat_{data['chat_id']}"
            elif data.get('post_id') and notification_type in ('post_like', 'post_comment', 'post_comment_reply', 'mention'):
                group_key = f"post_{data['post_id']}"
            elif notification_type:
                group_key = notification_type  # e.g. "follow", "sos_alert"

        payloads = []
        for token in tokens:
            payload = {
                "to": token,
                "title": title,
                "body": body,
                "sound": ios_sound,
                "priority": "high",
                "channelId": "sos_alerts_v3" if is_sos else ("community_v1" if is_community else ("messages_v4" if is_msg else "default_v4")),
                "badge": 1 if is_sos else 0,
                "categoryIdentifier": "SOS_ALERT" if is_sos else None,
                "data": data or {}
            }
            # iOS thread-id: groups notifications into a collapsible thread in Notification Center.
            # Android subtitle: used as the notification group key for Android 7+ summary grouping.
            if group_key:
                payload["threadId"] = group_key  # Expo Push API field → maps to APNs thread-id
            payloads.append(payload)
            
        chunk_size = 100
        chunks = [payloads[i:i + chunk_size] for i in range(0, len(payloads), chunk_size)]
        
        success_count = 0
        failed_tokens = []
        async with httpx.AsyncClient() as client:
            for chunk in chunks:
                try:
                    response = await client.post(
                        url,
                        json=chunk,
                        headers={
                            "Content-Type": "application/json",
                            "Accept": "application/json",
                            "Accept-Encoding": "gzip, deflate"
                        },
                        timeout=10.0
                    )
                    if response.status_code == 200:
                        res_data = response.json()
                        for idx, item in enumerate(res_data.get('data', [])):
                            if item.get('status') == 'ok':
                                success_count += 1
                            else:
                                error_msg = item.get('message', '')
                                logger.warning(f"Expo push error for token: {error_msg}")
                                details = item.get('details', {}) or {}
                                error_code = details.get('error', '')
                                if error_code == 'DeviceNotRegistered' or 'not a registered push token' in error_msg:
                                    if idx < len(chunk):
                                        failed_tokens.append(chunk[idx]['to'])
                    else:
                        logger.error(f"Expo Push API error {response.status_code}: {response.text}")
                except Exception as e:
                    logger.error(f"Failed to send Expo push chunk: {e}")
        return success_count, failed_tokens

    @staticmethod
    async def send_push_notification(
        user_id: str,
        title: str,
        body: str,
        data: Optional[Dict[str, str]] = None
    ) -> Dict[str, Any]:
        """
        Send push notification to user via FCM / Expo.
        Sends to all registered tokens for the user.
        """
        db = await FirebaseNotificationService.get_db()
        user = await db.get_document('users', user_id)
        
        if not user:
            logger.debug(f"User {user_id} not found for push notification")
            return {"sent": 0, "message": "User not found"}

        # Check block status
        try:
            actor_id = None
            if data:
                actor_id = data.get('actor_id') or data.get('follower_id') or data.get('actor_user_id') or data.get('sender_id') or data.get('actor_uid')
            
            if actor_id:
                blocked_user_ids = await FirebaseNotificationService._get_blocked_user_ids(db, user_id)
                if actor_id in blocked_user_ids:
                    logger.info(f"Skipping push notification for user {user_id} due to block relationship with actor {actor_id}")
                    return {"message": "Blocked", "sent": 0}
        except Exception as e:
            logger.warning(f"Error checking block status for push notification: {e}")
        
        # Prioritize primary fcm_token to prevent duplicate notifications on a single device
        primary_token = user.get('fcm_token')
        if primary_token:
            fcm_tokens = [primary_token]
        else:
            fcm_tokens = user.get('fcm_tokens', [])
            if fcm_tokens:
                # Fallback to the most recently registered token to prevent duplicate sends
                fcm_tokens = [fcm_tokens[-1]]
                
        if not fcm_tokens:
            logger.info(f"No tokens for user {user_id}")
            return {"message": "No tokens registered", "sent": 0}
            
        # Separate FCM and Expo tokens.
        # IMPORTANT: Send via only ONE channel to prevent duplicate notifications.
        # If any Expo token is present, prefer Expo and skip FCM native entirely.
        # This is the root cause of "notification received twice" — both channels
        # firing when a user has tokens of both types (e.g. switched from Expo Go to prod build).
        expo_tokens = [t for t in fcm_tokens if t.startswith('ExponentPushToken') or t.startswith('ExpoPushToken')]
        if expo_tokens:
            # Expo takes priority — skip FCM native for this user
            fcm_native_tokens = []
        else:
            fcm_native_tokens = [t for t in fcm_tokens if not (t.startswith('ExponentPushToken') or t.startswith('ExpoPushToken'))]
        
        success_count = 0
        
        # 1. Send to Expo tokens if any
        if expo_tokens:
            expo_sent, failed_expo_tokens = await FirebaseNotificationService._send_expo_push_notifications(
                expo_tokens, title, body, data
            )
            success_count += expo_sent
            if failed_expo_tokens:
                try:
                    await db.array_remove_update('users', user_id, 'fcm_tokens', failed_expo_tokens)
                    logger.info(f"Evicted {len(failed_expo_tokens)} failed Expo tokens for user {user_id}")
                except Exception as evict_err:
                    logger.warning(f"Failed to evict Expo tokens: {evict_err}")
            
        # 2. Send to FCM native tokens if any
        if fcm_native_tokens:
            messaging = get_firebase_messaging()
            if not messaging:
                logger.warning(f"Firebase Messaging service unavailable. Skipping FCM native tokens for user {user_id}")
            else:
                try:
                    from firebase_admin import messaging as fcm
                    
                    notification = fcm.Notification(
                        title=title,
                        body=body
                    )
                    
                    # Configure custom sound for all except SOS
                    android_config = None
                    apns_config = None
                    notification_type = data.get('type') if data else None
                    
                    is_sos = bool(notification_type and (notification_type == 'sos_alert' or notification_type.startswith('sos_')))
                    is_msg = bool(notification_type and notification_type in ('message', 'dm'))
                    is_community = bool(notification_type and notification_type in ('community_interest', 'event_rsvp', 'community_request'))
                    
                    # Derive grouping key (same logic as Expo path above)
                    group_key = None
                    if data:
                        if data.get('chat_id'):
                            group_key = f"chat_{data['chat_id']}"
                        elif data.get('post_id') and notification_type in ('post_like', 'post_comment', 'post_comment_reply', 'mention'):
                            group_key = f"post_{data['post_id']}"
                        elif notification_type:
                            group_key = notification_type

                    if is_sos:
                        android_config = fcm.AndroidConfig(
                            priority='high',
                            notification=fcm.AndroidNotification(
                                channel_id='sos_alerts_v3',
                                sound='soundreality_mayday_166011',
                                priority='max',
                                vibrate_timings_millis=[0, 1000, 300, 1000, 300, 1000, 300, 1000],
                                tag=group_key
                            )
                        )
                        apns_config = fcm.APNSConfig(
                            headers={'apns-priority': '10', 'apns-push-type': 'alert'},
                            payload=fcm.APNSPayload(
                                aps=fcm.Aps(
                                    sound='soundreality_mayday_166011_ios.caf',
                                    badge=1,
                                    content_available=True,
                                    mutable_content=True,
                                    category='SOS_ALERT',
                                    thread_id=group_key
                                )
                            )
                        )
                    elif is_community:
                        android_config = fcm.AndroidConfig(
                            priority='high',
                            notification=fcm.AndroidNotification(
                                channel_id='community_v1',
                                sound='bell',
                                priority='high',
                                tag=group_key
                            )
                        )
                        apns_config = fcm.APNSConfig(
                            headers={'apns-priority': '10', 'apns-push-type': 'alert'},
                            payload=fcm.APNSPayload(
                                aps=fcm.Aps(
                                    sound='bell_ios.caf',
                                    content_available=True,
                                    mutable_content=True,
                                    thread_id=group_key
                                )
                            )
                        )
                    else:
                        channel_id = 'messages_v4' if is_msg else 'default_v4'
                        android_config = fcm.AndroidConfig(
                            priority='high',
                            notification=fcm.AndroidNotification(
                                channel_id=channel_id,
                                sound='bell',
                                priority='high',
                                tag=group_key
                            )
                        )
                        apns_config = fcm.APNSConfig(
                            headers={'apns-priority': '10', 'apns-push-type': 'alert'},
                            payload=fcm.APNSPayload(
                                aps=fcm.Aps(
                                    sound='bell_ios.caf',
                                    content_available=True,
                                    mutable_content=True,
                                    thread_id=group_key
                                )
                            )
                        )
                    
                    failed_tokens = []
                    for token in fcm_native_tokens:
                        try:
                            message_kwargs: dict[str, Any] = {
                                'notification': notification,
                                'data': data or {},
                                'token': token
                            }
                            if android_config:
                                message_kwargs['android'] = android_config
                            if apns_config:
                                message_kwargs['apns'] = apns_config
                                
                            message = fcm.Message(**message_kwargs)
                            messaging.send(message)
                            success_count += 1
                        except Exception as e:
                            logger.warning(f"Failed to send to token: {e}")
                            failed_tokens.append(token)
                    
                    # Remove failed native tokens
                    if failed_tokens:
                        await db.array_remove_update('users', user_id, 'fcm_tokens', failed_tokens)
                except Exception as e:
                    logger.error(f"FCM send error: {e}")
                
        return {
            "message": "Notifications sent",
            "sent": success_count
        }
    
    @staticmethod
    async def send_multicast(
        user_ids: List[str],
        title: str,
        body: str,
        data: Optional[Dict[str, str]] = None
    ) -> Dict[str, Any]:
        """Send push notification to multiple users via FCM or Expo"""
        try:
            db = await FirebaseNotificationService.get_db()
            
            if not user_ids:
                logger.warning("send_multicast: No user_ids provided")
                return {"message": "No user_ids", "sent": 0}
            
            # Filter out users who blocked the sender
            sender_id = None
            if data:
                sender_id = data.get('sender_id') or data.get('user_id') or data.get('actor_id') or data.get('inviter_id')
            
            if sender_id:
                try:
                    blocked_user_ids = await FirebaseNotificationService._get_blocked_user_ids(db, sender_id)
                    if blocked_user_ids:
                        original_count = len(user_ids)
                        user_ids = [uid for uid in user_ids if uid not in blocked_user_ids and uid != sender_id]
                        if len(user_ids) < original_count:
                            logger.info(f"send_multicast: Filtered {original_count - len(user_ids)} blocked/unwanted users for sender {sender_id}")
                except Exception as e:
                    logger.warning(f"Error checking block status in send_multicast: {e}")
            
            # ⚡ Bolt Optimization: Batch fetch instead of N+1 get_document calls
            # Collect all FCM and Expo tokens from users (at most 1 per user to prevent duplicate notifications)
            all_fcm_tokens = []
            all_expo_tokens = []
            users_with_tokens = 0

            user_docs = await db.get_documents_batch('users', user_ids)
            for user in user_docs:
                if user:
                    primary_token = user.get('fcm_token')
                    if primary_token:
                        token = primary_token
                    else:
                        tokens = user.get('fcm_tokens', [])
                        token = tokens[-1] if tokens else None
                    
                    if token:
                        users_with_tokens += 1
                        if token.startswith('ExponentPushToken') or token.startswith('ExpoPushToken'):
                            all_expo_tokens.append(token)
                        else:
                            all_fcm_tokens.append(token)
                                
            # Deduplicate
            all_fcm_tokens = list(set(all_fcm_tokens))
            all_expo_tokens = list(set(all_expo_tokens))
            
            total_success = 0
            total_failure = 0
            
            # 1. Send via Expo Push API if there are Expo tokens
            if all_expo_tokens:
                logger.info(f"SOS: Sending via Expo Push to {len(all_expo_tokens)} tokens")
                expo_sent, failed_expo_tokens = await FirebaseNotificationService._send_expo_push_notifications(
                    all_expo_tokens, title, body, data
                )
                total_success += expo_sent
                total_failure += len(all_expo_tokens) - expo_sent
                if failed_expo_tokens:
                    for uid in user_ids:
                        try:
                            await db.array_remove_update('users', uid, 'fcm_tokens', failed_expo_tokens)
                        except Exception:
                            pass
                
            # 2. Send via FCM if there are native FCM tokens
            if all_fcm_tokens:
                logger.info(f"SOS: Sending via FCM to {len(all_fcm_tokens)} tokens")
                messaging = get_firebase_messaging()
                if not messaging:
                    logger.warning("Firebase Messaging service unavailable. Skipping multicast FCM.")
                    total_failure += len(all_fcm_tokens)
                else:
                    try:
                        from firebase_admin import messaging as fcm
                        
                        # FCM allows max 500 tokens per multicast
                        chunks = [all_fcm_tokens[i:i+500] for i in range(0, len(all_fcm_tokens), 500)]
                        
                        for i, chunk in enumerate(chunks):
                            android_config = None
                            apns_config = None
                            
                            notification_type = data.get('type') if data else None
                            is_sos = bool(notification_type and (notification_type == 'sos_alert' or notification_type.startswith('sos_')))
                            is_msg = bool(notification_type and notification_type in ('message', 'dm'))
                            is_community = bool(notification_type and notification_type in ('community_interest', 'event_rsvp', 'community_request'))
                            
                            # High-priority for SOS
                            if is_sos:
                                android_config = fcm.AndroidConfig(
                                    priority='high',
                                    notification=fcm.AndroidNotification(
                                        channel_id='sos_alerts_v3',
                                        sound='soundreality_mayday_166011',
                                        priority='max',
                                        vibrate_timings_millis=[0, 1000, 300, 1000, 300, 1000, 300, 1000]
                                    )
                                )
                                apns_config = fcm.APNSConfig(
                                    headers={'apns-priority': '10', 'apns-push-type': 'alert'},
                                    payload=fcm.APNSPayload(
                                        aps=fcm.Aps(
                                            sound='soundreality_mayday_166011_ios.caf',
                                            badge=1,
                                            content_available=True,
                                            mutable_content=True,
                                            category='SOS_ALERT'
                                        )
                                    )
                                )
                            elif is_community:
                                android_config = fcm.AndroidConfig(
                                    priority='high',
                                    notification=fcm.AndroidNotification(
                                        channel_id='community_v1',
                                        sound='bell',
                                        priority='high'
                                    )
                                )
                                apns_config = fcm.APNSConfig(
                                    headers={'apns-priority': '10', 'apns-push-type': 'alert'},
                                    payload=fcm.APNSPayload(
                                        aps=fcm.Aps(
                                            sound='bell_ios.caf',
                                            content_available=True,
                                            mutable_content=True
                                        )
                                    )
                                )
                            else:
                                channel_id = 'messages_v4' if is_msg else 'default_v4'
                                android_config = fcm.AndroidConfig(
                                    priority='high',
                                    notification=fcm.AndroidNotification(
                                        channel_id=channel_id,
                                        sound='bell',
                                        priority='high'
                                    )
                                )
                                apns_config = fcm.APNSConfig(
                                    headers={'apns-priority': '10', 'apns-push-type': 'alert'},
                                    payload=fcm.APNSPayload(
                                        aps=fcm.Aps(
                                            sound='bell_ios.caf',
                                            content_available=True,
                                            mutable_content=True
                                        )
                                    )
                                )
                            
                            message_kwargs: dict[str, Any] = {
                                'notification': fcm.Notification(title=title, body=body),
                                'data': data or {},
                                'tokens': chunk
                            }
                            if android_config:
                                message_kwargs['android'] = android_config
                            if apns_config:
                                message_kwargs['apns'] = apns_config
                            
                            message = fcm.MulticastMessage(**message_kwargs)
                            response = fcm.send_each_for_multicast(message)
                            total_success += response.success_count
                            total_failure += response.failure_count
                            
                            if response.failure_count > 0:
                                logger.warning(f"SOS chunk {i}: {response.success_count} success, {response.failure_count} failed")
                                for idx, resp in enumerate(response.responses):
                                    if not resp.success:
                                        logger.warning(f"  Token index {idx} error: {resp.exception}")
                                    
                    except Exception as e:
                        logger.error(f"Multicast FCM error: {e}")
                        total_failure += len(all_fcm_tokens)
                    
            return {"message": "Sent", "sent": total_success, "failed": total_failure}
            
        except Exception as e:
            logger.error(f"Multicast error: {e}")
            return {"message": f"Error: {str(e)}", "sent": 0}
    
    @staticmethod
    async def get_user_notifications(
        user_id: str,
        limit: int = 30,
        cursor: Optional[str] = None,
        unread_only: bool = False
    ) -> Dict[str, Any]:
        """Get user notifications with server-side actor hydration, fallbacks, and cursor-based pagination"""
        db = await FirebaseNotificationService.get_db()
        
        filters: List[Tuple[str, str, Any]] = [('user_id', '==', user_id)]
        if unread_only:
            filters.append(('is_read', '==', False))
        
        # Query documents from Firestore
        docs = await db.query_documents('notifications', filters=filters)
        filtered = [d for d in (docs or []) if str(d.get('user_id', '')) == str(user_id)]

        # Sort by updated_at or created_at descending (latest first)
        filtered.sort(key=lambda x: str(x.get('updated_at') or x.get('created_at') or ''), reverse=True)

        # Apply cursor pagination if cursor provided
        if cursor:
            cutoff_idx = 0
            for idx, item in enumerate(filtered):
                item_ts = str(item.get('updated_at') or item.get('created_at') or '')
                if item_ts < cursor:
                    cutoff_idx = idx
                    break
            else:
                cutoff_idx = len(filtered)
            filtered = filtered[cutoff_idx:]

        page_items = filtered[:limit]
        next_cursor = None
        if len(filtered) > limit:
            last_item = page_items[-1]
            next_cursor = str(last_item.get('updated_at') or last_item.get('created_at') or '')

        if not page_items:
            return {
                "items": [],
                "notifications": [],  # Backward compatibility field
                "unread_count": 0,
                "next_cursor": None
            }

        # Collect unique actor IDs across page items (including backward-compatible fallbacks)
        actor_ids = set()
        for item in page_items:
            data = item.get('data') or {}
            item_actors = item.get('actor_ids') or []
            if not item_actors and item.get('latest_actor_id'):
                item_actors = [item['latest_actor_id']]
            if not item_actors:
                fallback_actor = (
                    data.get('actor_user_id') or
                    data.get('actor_id') or
                    data.get('sender_id') or
                    data.get('follower_id') or
                    data.get('actor_uid')
                )
                if fallback_actor:
                    item_actors = [fallback_actor]
            for aid in item_actors:
                if aid:
                    actor_ids.add(str(aid))

        # Batch fetch actors from 'users' collection
        users_map = {}
        if actor_ids:
            try:
                user_docs = await db.get_documents_batch('users', list(actor_ids))
                for u in (user_docs or []):
                    if u and 'id' in u:
                        users_map[str(u['id'])] = {
                            "id": str(u['id']),
                            "name": u.get("name") or u.get("username") or "User",
                            "photo": u.get("photo") or u.get("photo_url") or "",
                            "photo_url": u.get("photo") or u.get("photo_url") or "",
                            "is_verified": bool(u.get("is_verified", False))
                        }
            except Exception as hyd_err:
                logger.warning(f"Failed server-side actor hydration batch fetch: {hyd_err}")

        # Hydrate each notification document
        hydrated_items = []
        for item in page_items:
            data = item.get('data') or {}
            primary_actor_id = (
                item.get('latest_actor_id') or
                (item.get('actor_ids') and item.get('actor_ids')[0]) or
                data.get('actor_user_id') or
                data.get('actor_id') or
                data.get('sender_id') or
                data.get('follower_id') or
                data.get('actor_uid')
            )

            primary_actor = users_map.get(str(primary_actor_id), {
                "id": str(primary_actor_id) if primary_actor_id else "",
                "name": data.get('actor_name') or "Someone",
                "photo": "",
                "photo_url": "",
                "is_verified": False
            }) if primary_actor_id else None

            actor_count = item.get('actor_count', 1)
            msg_body = item.get('body', '')

            # Format display_text for aggregated roll-ups
            if primary_actor and actor_count > 1:
                display_text = f"{primary_actor['name']} and {actor_count - 1} others {msg_body or 'interacted with your content.'}"
            elif primary_actor:
                display_text = f"{primary_actor['name']} {msg_body or 'sent a notification.'}"
            else:
                display_text = msg_body or item.get('title', 'New Notification')

            hydrated_item = {
                **item,
                "actor": primary_actor,
                "display_text": display_text
            }
            hydrated_items.append(hydrated_item)

        unread_count = sum(1 for d in filtered if not d.get('is_read'))

        return {
            "items": hydrated_items,
            "notifications": hydrated_items,  # Backward compatibility field
            "unread_count": unread_count,
            "next_cursor": next_cursor
        }
    
    @staticmethod
    async def mark_as_read(user_id: str, notification_id: str) -> Dict[str, Any]:
        """Mark notification as read"""
        db = await FirebaseNotificationService.get_db()
        
        notification = await db.get_document('notifications', notification_id)
        if not notification or notification.get('user_id') != user_id:
            raise ValueError("Notification not found")
        
        await db.update_document('notifications', notification_id, {
            'is_read': True,
            'read_at': datetime.utcnow()
        })
        
        return {"message": "Marked as read"}
    
    @staticmethod
    async def mark_all_as_read(user_id: str) -> Dict[str, Any]:
        """Mark all notifications as read"""
        db = await FirebaseNotificationService.get_db()
        
        notifications = await db.query_documents(
            'notifications',
            filters=[('user_id', '==', user_id), ('is_read', '==', False)]
        )
        
        # ⚡ Bolt Optimization: Batch update to fix N+1 query issue
        if notifications:
            now = datetime.utcnow()
            updates = [(notif['id'], {'is_read': True, 'read_at': now}) for notif in notifications if 'id' in notif]
            await db.batch_update_documents('notifications', updates)
        
        return {"message": f"Marked {len(notifications)} as read"}
    
    @staticmethod
    async def get_unread_count(user_id: str) -> int:
        """Get unread count"""
        db = await FirebaseNotificationService.get_db()
        return await db.count_documents(
            'notifications',
            filters=[('user_id', '==', user_id), ('is_read', '==', False)]
        )
    
    # Convenience methods
    @staticmethod
    async def notify_new_message(
        user_id: str,
        sender_name: str,
        message_preview: str,
        chat_id: str,
        chat_type: str
    ):
        """Notify user of new message"""
        await FirebaseNotificationService.create_notification(
            user_id=user_id,
            title=f"New message from {sender_name}",
            body=message_preview[:100],
            notification_type=FirebaseNotificationService.TYPE_MESSAGE,
            data={"chat_id": chat_id, "chat_type": chat_type}
        )
        
        # Send push
        await FirebaseNotificationService.send_push_notification(
            user_id=user_id,
            title=f"New message from {sender_name}",
            body=message_preview[:100],
            data={"chat_id": chat_id, "type": "message"}
        )
    
    @staticmethod
    async def notify_jaap_reminder(
        user_id: str,
        title: str,
        body: str,
        mantra_type: str,
        session_name: str,
        notification_id: Optional[str] = None
    ):
        """Store notification and send push notification to user's device"""
        try:
            await FirebaseNotificationService.create_notification(
                user_id=user_id,
                title=title,
                body=body,
                notification_type="jaap_reminder",
                data={"mantra_type": mantra_type, "session_name": session_name},
                notification_id=notification_id,
                overwrite=False
            )
        except Exception as e:
            from google.api_core.exceptions import AlreadyExists
            if isinstance(e, AlreadyExists) or "AlreadyExists" in type(e).__name__ or "409" in str(e):
                logger.info(f"Skipping duplicate jaap reminder for user {user_id} (AlreadyExists in DB)")
                return
            raise e

        await FirebaseNotificationService.send_push_notification(
            user_id=user_id,
            title=title,
            body=body,
            data={"mantra_type": mantra_type, "session_name": session_name, "type": "jaap_reminder"}
        )

    @staticmethod
    async def notify_library_reminder(
        user_id: str,
        book_name: Optional[str] = None,
        target_route: Optional[str] = None,
        notification_id: Optional[str] = None,
        force: bool = False
    ) -> Dict[str, Any]:
        """Send push notification for library reading sessions (max 1 per 4 days per user)"""
        db = await FirebaseNotificationService.get_db()

        # If book_name is not specified, check if user has ALREADY opened/viewed books in library
        if not book_name or not str(book_name).strip():
            try:
                progress_records = await db.query_documents(
                    'library_progress',
                    filters=[('user_id', '==', user_id)]
                )
                if progress_records and len(progress_records) > 0:
                    # User has already opened/viewed library books!
                    # Check if there is an unfinished book
                    unfinished = [p for p in progress_records if float(p.get('progressPercent', 0)) < 100]
                    if unfinished:
                        unfinished.sort(key=lambda x: float(x.get('lastOpenedTime', 0)), reverse=True)
                        book_name = unfinished[0].get('chapterName') or unfinished[0].get('bookId') or "Bhagavad Gita"
                    else:
                        logger.info(f"Skipping unopened library reminder for user {user_id}: user has already viewed/opened books in library")
                        return {"status": "skipped", "reason": "User has already viewed books in library"}
            except Exception as err:
                logger.warning(f"Error checking library_progress for unopened reminder: {err}")

        # Enforce 1 notification per 4 days (345,600 seconds) per user
        FOUR_DAYS_SECONDS = 4 * 86400
        if not force:
            try:
                existing = await db.query_documents(
                    'notifications',
                    filters=[('user_id', '==', user_id), ('notification_type', '==', 'library_reminder')]
                )
                now_ts = datetime.utcnow()
                for doc in (existing or []):
                    created_str = doc.get('created_at', '')
                    if created_str:
                        try:
                            if created_str.endswith('Z'):
                                created_str = created_str[:-1]
                            created_dt = datetime.fromisoformat(created_str)
                            if (now_ts - created_dt).total_seconds() < FOUR_DAYS_SECONDS:
                                logger.info(f"Skipping library reminder for user {user_id}: max 1 notification per 4 days allowed")
                                return {"status": "skipped", "reason": "Already sent within last 4 days"}
                        except Exception:
                            pass
            except Exception as err:
                logger.warning(f"Error checking 4-day limit for library_reminder: {err}")

        # Set title, body and navigation route
        if book_name and str(book_name).strip():
            clean_book_name = str(book_name).strip()
            title = "🔖 Pick up your reading session"
            body = f'"{clean_book_name}" is waiting for you in your library. Resume reading now and gain deeper insights!'
            route = target_route or "/library"
        else:
            title = "✨ Unfold sacred wisdom today"
            body = "Give some time to begin reading  Bhagvad Geeta!"
            route = target_route or "/library"

        notif_data = {
            "type": "library_reminder",
            "book_name": book_name or "",
            "route": route
        }

        try:
            await FirebaseNotificationService.create_notification(
                user_id=user_id,
                title=title,
                body=body,
                notification_type="library_reminder",
                data=notif_data,
                notification_id=notification_id,
                overwrite=False
            )
        except Exception as e:
            from google.api_core.exceptions import AlreadyExists
            if isinstance(e, AlreadyExists) or "AlreadyExists" in type(e).__name__ or "409" in str(e):
                logger.info(f"Skipping duplicate library reminder for user {user_id} (AlreadyExists in DB)")
                return {"status": "skipped", "reason": "Already exists"}
            logger.warning(f"Failed to create library reminder notification doc: {e}")

        res = await FirebaseNotificationService.send_push_notification(
            user_id=user_id,
            title=title,
            body=body,
            data=notif_data
        )
        return {"status": "success", "result": res}

    @staticmethod
    async def notify_shiv_katha_reminder(
        user_id: str,
        notification_id: Optional[str] = None,
        force: bool = False
    ) -> Dict[str, Any]:
        """
        Send push notification for LIVE Shiv Katha (starts on 13 August).
        - Sent 2 times a day (Morning & Afternoon; max 1 per 12 hours).
        - SKIPS users who have already pre-registered in jaap_reminders (mantra_type == 'shravan_katha').
        """
        db = await FirebaseNotificationService.get_db()

        # 1. Check if user has ALREADY pre-registered for Shiv Katha
        if not force:
            try:
                registered = await db.query_documents(
                    'jaap_reminders',
                    filters=[
                        ('user_id', '==', user_id),
                        ('mantra_type', '==', 'shravan_katha'),
                        ('active', '==', True)
                    ]
                )
                if registered and len(registered) > 0:
                    logger.info(f"Skipping Shiv Katha reminder for user {user_id}: user already pre-registered")
                    return {"status": "skipped", "reason": "User already pre-registered for Shiv Katha"}
            except Exception as err:
                logger.warning(f"Error checking pre-registration for shiv_katha_reminder: {err}")

        # 2. Check 12h cooldown (morning & afternoon limit: 2 times per day)
        TWELVE_HOURS_SECONDS = 12 * 3600
        if not force:
            try:
                existing = await db.query_documents(
                    'notifications',
                    filters=[('user_id', '==', user_id), ('notification_type', '==', 'shiv_katha_reminder')]
                )
                now_ts = datetime.utcnow()
                for doc in (existing or []):
                    created_str = doc.get('created_at', '')
                    if created_str:
                        try:
                            if created_str.endswith('Z'):
                                created_str = created_str[:-1]
                            created_dt = datetime.fromisoformat(created_str)
                            if (now_ts - created_dt).total_seconds() < TWELVE_HOURS_SECONDS:
                                logger.info(f"Skipping Shiv Katha reminder for user {user_id}: max 2 per day allowed")
                                return {"status": "skipped", "reason": "Already sent within last 12 hours"}
                        except Exception:
                            pass
            except Exception as err:
                logger.warning(f"Error checking 12h limit for shiv_katha_reminder: {err}")

        title = "🕉️ LIVE Shiv Katha starts on 13 August"
        body = "Pre-register now to receive reminders and LIVE updates from Acharya Shamik Ji."
        notif_data = {
            "type": "shiv_katha_reminder",
            "route": "/shravan-paath"
        }

        try:
            await FirebaseNotificationService.create_notification(
                user_id=user_id,
                title=title,
                body=body,
                notification_type="shiv_katha_reminder",
                data=notif_data,
                notification_id=notification_id,
                overwrite=False
            )
        except Exception as e:
            from google.api_core.exceptions import AlreadyExists
            if isinstance(e, AlreadyExists) or "AlreadyExists" in type(e).__name__ or "409" in str(e):
                logger.info(f"Skipping duplicate shiv_katha_reminder for user {user_id}")
                return {"status": "skipped", "reason": "Already exists"}
            logger.warning(f"Failed to create shiv_katha_reminder notification doc: {e}")

        res = await FirebaseNotificationService.send_push_notification(
            user_id=user_id,
            title=title,
            body=body,
            data=notif_data
        )
        return {"status": "success", "result": res}

    @staticmethod
    async def notify_scripture_reading_reminder(
        user_id: str,
        time_of_day: str = "morning",
        notification_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Send push notification for Brahmand Library scripture reading:
        'take a moment to read a verse from your favourite scripture at the morning and night time'
        """
        if time_of_day == "morning":
            title = "🌅  Brahmand Library"
            body = "Take a moment to read a verse from your favourite scripture this morning."
        else:
            title = "🌙  Brahmand Library"
            body = "Take a moment to read a verse from your favourite scripture before rest tonight."

        notif_data = {
            "type": "scripture_reminder",
            "time_of_day": time_of_day,
            "route": "/library"
        }

        try:
            await FirebaseNotificationService.create_notification(
                user_id=user_id,
                title=title,
                body=body,
                notification_type="scripture_reminder",
                data=notif_data,
                notification_id=notification_id,
                overwrite=False
            )
        except Exception as e:
            from google.api_core.exceptions import AlreadyExists
            if isinstance(e, AlreadyExists) or "AlreadyExists" in type(e).__name__ or "409" in str(e):
                logger.info(f"Skipping duplicate scripture reminder for user {user_id}")
                return {"status": "skipped", "reason": "Already exists"}
            logger.warning(f"Failed to create scripture reminder notification doc: {e}")

        res = await FirebaseNotificationService.send_push_notification(
            user_id=user_id,
            title=title,
            body=body,
            data=notif_data
        )
        return {"status": "success", "result": res}

    @staticmethod
    async def notify_festival_reminder(
        user_id: str,
        festival_name: str,
        festival_date: str = "",
        festival_id: str = "",
        notification_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Send push notification for major festival celebrations.
        """
        title = f"🎉  {festival_name} Celebration"
        body = f"Today is {festival_name}! Take a moment to explore rituals, katha, and temple darshan in Brahmand."

        notif_data = {
            "type": "festival_reminder",
            "festival_id": festival_id,
            "route": "/festival"
        }

        try:
            await FirebaseNotificationService.create_notification(
                user_id=user_id,
                title=title,
                body=body,
                notification_type="festival_reminder",
                data=notif_data,
                notification_id=notification_id,
                overwrite=False
            )
        except Exception as e:
            from google.api_core.exceptions import AlreadyExists
            if isinstance(e, AlreadyExists) or "AlreadyExists" in type(e).__name__ or "409" in str(e):
                logger.info(f"Skipping duplicate festival reminder for user {user_id}")
                return {"status": "skipped", "reason": "Already exists"}
            logger.warning(f"Failed to create festival reminder notification doc: {e}")

        res = await FirebaseNotificationService.send_push_notification(
            user_id=user_id,
            title=title,
            body=body,
            data=notif_data
        )
        return {"status": "success", "result": res}





