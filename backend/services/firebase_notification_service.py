"""Firebase Push Notification Service using FCM"""
import logging
from datetime import datetime
from typing import Optional, Dict, Any, List

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
    async def create_notification(
        user_id: str,
        title: str,
        body: str,
        notification_type: str,
        data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Create and store notification"""
        db = await FirebaseNotificationService.get_db()
        
        notification_data = {
            "user_id": user_id,
            "title": title,
            "body": body,
            "notification_type": notification_type,
            "data": data or {},
            "is_read": False
        }
        
        notification_id = await db.create_document('notifications', notification_data)
        notification_data['id'] = notification_id
        
        logger.info(f"Notification created for user {user_id}")
        return notification_data
    
    @staticmethod
    async def _send_expo_push_notifications(
        tokens: List[str],
        title: str,
        body: str,
        data: Optional[Dict[str, str]] = None
    ) -> int:
        """Send push notifications to Expo Go clients using the Expo Push API"""
        if not tokens:
            return 0
        import httpx
        url = "https://exp.host/--/api/v2/push/send"
        
        notification_type = data.get('type') if data else None
        is_sos = bool(notification_type and notification_type.startswith('sos'))
        is_msg = bool(notification_type and notification_type == 'message')
        
        payloads = []
        for token in tokens:
            payload = {
                "to": token,
                "title": title,
                "body": body,
                "sound": "soundreality_mayday_166011" if is_sos else "bell",
                "priority": "high" if is_sos else "default",
                "channelId": "sos_alerts_v3" if is_sos else ("messages_v3" if is_msg else "default"),
                "badge": 1 if is_sos else 0,
                "categoryIdentifier": "SOS_ALERT" if is_sos else None,
                "data": data or {}
            }
            payloads.append(payload)
            
        chunk_size = 100
        chunks = [payloads[i:i + chunk_size] for i in range(0, len(payloads), chunk_size)]
        
        success_count = 0
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
                        for item in res_data.get('data', []):
                            if item.get('status') == 'ok':
                                success_count += 1
                            else:
                                logger.warning(f"Expo push error for token: {item.get('message')}")
                    else:
                        logger.error(f"Expo Push API error {response.status_code}: {response.text}")
                except Exception as e:
                    logger.error(f"Failed to send Expo push chunk: {e}")
        return success_count

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
        
        fcm_tokens = user.get('fcm_tokens', [])
        if not fcm_tokens:
            logger.info(f"No tokens for user {user_id}")
            return {"message": "No tokens registered", "sent": 0}
            
        # Separate FCM and Expo tokens
        expo_tokens = [t for t in fcm_tokens if t.startswith('ExponentPushToken') or t.startswith('ExpoPushToken')]
        fcm_native_tokens = [t for t in fcm_tokens if not (t.startswith('ExponentPushToken') or t.startswith('ExpoPushToken'))]
        
        success_count = 0
        
        # 1. Send to Expo tokens if any
        if expo_tokens:
            expo_sent = await FirebaseNotificationService._send_expo_push_notifications(
                expo_tokens, title, body, data
            )
            success_count += expo_sent
            
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
                
                is_sos = bool(notification_type and notification_type.startswith('sos'))
                is_msg = bool(notification_type and notification_type == 'message')
                
                if is_sos:
                    android_config = fcm.AndroidConfig(
                        priority='high',
                        notification=fcm.AndroidNotification(
                            channel_id='sos_alerts_v3',
                            sound='soundreality_mayday_166011',
                            priority='max',
                            vibrate_timings_millis=[0, 1000, 500, 1000, 500, 1000]
                        )
                    )
                    apns_config = fcm.APNSConfig(
                        headers={'apns-priority': '10'},
                        payload=fcm.APNSPayload(
                            aps=fcm.Aps(
                                sound='soundreality_mayday_166011.mp3',
                                badge=1,
                                content_available=True,
                                mutable_content=True,
                                category='SOS_ALERT'
                            )
                        )
                    )
                else:
                    channel_id = 'messages_v3' if is_msg else 'default'
                    android_config = fcm.AndroidConfig(
                        priority='normal',
                        notification=fcm.AndroidNotification(
                            channel_id=channel_id,
                            sound='bell',
                            priority='default'
                        )
                    )
                    apns_config = fcm.APNSConfig(
                        payload=fcm.APNSPayload(
                            aps=fcm.Aps(
                                sound='bell.mp3',
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
            
            # Collect all FCM and Expo tokens from users
            all_fcm_tokens = []
            all_expo_tokens = []
            users_with_tokens = 0
            for user_id in user_ids:
                user = await db.get_document('users', user_id)
                if user:
                    tokens = list(user.get('fcm_tokens', []) or [])
                    fcm_token = user.get('fcm_token')
                    if fcm_token and fcm_token not in tokens:
                        tokens.append(fcm_token)
                    
                    if tokens:
                        users_with_tokens += 1
                        for token in tokens:
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
                expo_sent = await FirebaseNotificationService._send_expo_push_notifications(
                    all_expo_tokens, title, body, data
                )
                total_success += expo_sent
                total_failure += len(all_expo_tokens) - expo_sent
                
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
                        is_sos = bool(notification_type and notification_type.startswith('sos'))
                        is_msg = bool(notification_type and notification_type == 'message')
                        
                        # High-priority for SOS
                        if is_sos:
                            android_config = fcm.AndroidConfig(
                                priority='high',
                                notification=fcm.AndroidNotification(
                                    channel_id='sos_alerts',
                                    sound='soundreality_mayday_166011',
                                    priority='max',
                                    vibrate_timings_millis=[0, 1000, 500, 1000, 500, 1000]
                                )
                            )
                            apns_config = fcm.APNSConfig(
                                headers={'apns-priority': '10'},
                                payload=fcm.APNSPayload(
                                    aps=fcm.Aps(
                                        sound='soundreality_mayday_166011.mp3',
                                        badge=1,
                                        content_available=True,
                                        mutable_content=True,
                                        category='SOS_ALERT'
                                    )
                                )
                            )
                        else:
                            channel_id = 'messages' if is_msg else 'default'
                            android_config = fcm.AndroidConfig(
                                priority='normal',
                                notification=fcm.AndroidNotification(
                                    channel_id=channel_id,
                                    sound='bell',
                                    priority='default'
                                )
                            )
                            apns_config = fcm.APNSConfig(
                                payload=fcm.APNSPayload(
                                    aps=fcm.Aps(
                                        sound='bell.mp3',
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
        
        return await db.query_documents(
            'notifications',
            filters=filters,
            order_by='created_at',
            order_direction='DESCENDING',
            limit=limit
        )
    
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
