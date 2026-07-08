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
    TYPE_TEMPLE = "temple"
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
        """Create and store notification"""
        db = await FirebaseNotificationService.get_db()
        
        # Check block status
        try:
            actor_id = None
            if data:
                actor_id = data.get('actor_id') or data.get('follower_id') or data.get('actor_user_id') or data.get('sender_id') or data.get('actor_uid')
            
            if actor_id:
                blocked_user_ids = await FirebaseNotificationService._get_blocked_user_ids(db, user_id)
                if actor_id in blocked_user_ids:
                    logger.info(f"Skipping notification creation for user {user_id} due to block relationship with actor {actor_id}")
                    return {"message": "Blocked"}
        except Exception as e:
            logger.warning(f"Error checking block status for notification creation: {e}")

        notification_data = {
            "user_id": user_id,
            "title": title,
            "body": body,
            "notification_type": notification_type,
            "data": data or {},
            "is_read": False,
            "created_at": datetime.utcnow().isoformat() + 'Z'
        }
        
        inserted_id = await db.create_document('notifications', notification_data, doc_id=notification_id, overwrite=overwrite)
        notification_data['id'] = inserted_id
        
        logger.info(f"Notification created for user {user_id}")
        
        # Emit Socket.IO event to user's private room
        try:
            from main import sio
            await sio.emit('new_notification', notification_data, room=f"user_{user_id}")
            logger.info(f"Emitted real-time notification to user_{user_id} via socket from FirebaseNotificationService")
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
            raise ValueError("User not found")

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
            
        # Separate FCM and Expo tokens
        expo_tokens = [t for t in fcm_tokens if t.startswith('ExponentPushToken') or t.startswith('ExpoPushToken')]
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
            try:
                messaging = get_firebase_messaging()
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
                        # apns-push-type required by Apple on iOS 13+ for display
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
                
                failed_tokens = []
                for token in fcm_native_tokens:
                    try:
                        message_kwargs = {
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
            
            # Collect all FCM and Expo tokens from users (at most 1 per user to prevent duplicate notifications)
            all_fcm_tokens = []
            all_expo_tokens = []
            users_with_tokens = 0
            for user_id in user_ids:
                user = await db.get_document('users', user_id)
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
                        
                        message_kwargs = {
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
        limit: int = 50,
        unread_only: bool = False
    ) -> List[Dict[str, Any]]:
        """Get user notifications"""
        db = await FirebaseNotificationService.get_db()
        
        filters = [('user_id', '==', user_id)]
        if unread_only:
            filters.append(('is_read', '==', False))
        
        # Fetch all matching without order_by to avoid Firestore index requirement
        docs = await db.query_documents('notifications', filters=filters)
        docs.sort(key=lambda x: str(x.get('created_at', '')), reverse=True)
        return docs[:limit]
    
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
        
        for notif in notifications:
            await db.update_document('notifications', notif['id'], {
                'is_read': True,
                'read_at': datetime.utcnow()
            })
        
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
    async def notify_temple_update(
        user_ids: List[str],
        temple_name: str,
        update_title: str,
        temple_id: str
    ):
        """Notify temple followers of update"""
        for user_id in user_ids:
            await FirebaseNotificationService.create_notification(
                user_id=user_id,
                title=f"Update from {temple_name}",
                body=update_title,
                notification_type=FirebaseNotificationService.TYPE_TEMPLE,
                data={"temple_id": temple_id}
            )
        
        await FirebaseNotificationService.send_multicast(
            user_ids=user_ids,
            title=f"Update from {temple_name}",
            body=update_title,
            data={"temple_id": temple_id, "type": "temple"}
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
