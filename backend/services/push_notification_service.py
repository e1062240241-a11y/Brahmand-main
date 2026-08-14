"""
Firebase Cloud Messaging (FCM) Push Notification Service

Sends push notifications to users when they receive new messages.
Uses Firebase Admin SDK to send notifications via FCM.
"""

import logging
from typing import Optional, List, Dict, Any
from firebase_admin import messaging

logger = logging.getLogger(__name__)

# Lazy import to avoid circular dependencies
_db_instance = None

async def _get_db():
    """Lazy get database instance"""
    global _db_instance
    if _db_instance is None:
        from config.firestore_db import FirestoreDB
        from config.firebase_config import get_firestore
        client = await get_firestore()
        if not client:
            raise Exception("Firestore client not available")
        _db_instance = FirestoreDB(client)
    return _db_instance


class PushNotificationService:
    """Service for sending push notifications via FCM"""
    
    @staticmethod
    async def _get_blocked_user_ids(user_id: str) -> set:
        blocked_ids = set()
        try:
            db = await _get_db()
            blocks_by_me = await db.query_documents('user_blocks', filters=[('blockerUid', '==', user_id)])
            for b in blocks_by_me:
                b_uid = b.get('blockedUid')
                if b_uid:
                    blocked_ids.add(b_uid)
            blocks_of_me = await db.query_documents('user_blocks', filters=[('blockedUid', '==', user_id)])
            for b in blocks_of_me:
                b_uid = b.get('blockerUid')
                if b_uid:
                    blocked_ids.add(b_uid)
        except Exception as e:
            logger.error("Error retrieving blocked users list: %s", e)
        return blocked_ids
    
    @staticmethod
    async def get_user_fcm_token(user_id: str) -> Optional[str]:
        """Get the FCM token for a user from Firestore"""
        db = await _get_db()
        user = await db.get_document('users', user_id)
        if user:
            token = user.get('fcm_token')
            if not token:
                tokens = user.get('fcm_tokens', [])
                if tokens:
                    token = tokens[0]
            return token
        return None

    @staticmethod
    async def get_users_fcm_tokens(user_ids: List[str]) -> List[str]:
        """Get FCM tokens for multiple users from Firestore in a single batch query"""
        db = await _get_db()
        users = await db.get_documents_batch('users', user_ids)

        tokens = []
        for user in users:
            if user:
                token = user.get('fcm_token')
                if not token:
                    user_tokens = user.get('fcm_tokens', [])
                    if user_tokens:
                        token = user_tokens[0]
                if token:
                    tokens.append(token)
        return tokens
    
    @staticmethod
    async def save_user_fcm_token(user_id: str, fcm_token: str) -> bool:
        """Save or update a user's FCM token in Firestore.

        On iOS the frontend previously sent raw APNs hex tokens (64 lowercase hex chars)
        which firebase-admin messaging.send() cannot use. This method detects and evicts
        those stale tokens whenever a valid new token arrives.
        """
        try:
            db = await _get_db()

            def _update_tokens():
                import re
                from google.cloud import firestore as fs

                doc_ref = db.client.collection('users').document(user_id)
                user_doc = doc_ref.get()
                existing_tokens = []
                if user_doc.exists:
                    existing_tokens = user_doc.to_dict().get('fcm_tokens', []) or []

                # A raw APNs device token looks like 64 lowercase hex characters.
                # Expo/FCM tokens contain letters, digits, brackets or colons — never
                # purely 64-char hex, so this regex is safe to use as a filter.
                raw_apns_pattern = re.compile(r'^[0-9a-f]{64}$')
                stale_tokens = [t for t in existing_tokens if raw_apns_pattern.match(t)]

                update_payload = {
                    'fcm_token': fcm_token,
                    'last_fcm_update': fs.SERVER_TIMESTAMP,
                }

                if stale_tokens:
                    logger.info(
                        f"Evicting {len(stale_tokens)} stale APNs hex token(s) for user {user_id}"
                    )
                    doc_ref.update({
                        **update_payload,
                        'fcm_tokens': fs.ArrayRemove(stale_tokens),
                    })
                    # Now add the valid new token
                    doc_ref.update({'fcm_tokens': fs.ArrayUnion([fcm_token])})
                else:
                    doc_ref.update({
                        **update_payload,
                        'fcm_tokens': fs.ArrayUnion([fcm_token]),
                    })

            await db._run_sync(_update_tokens)

            logger.info(f"FCM token saved and synced for user {user_id}")
            return True
        except Exception as e:
            logger.error(f"Error saving FCM token: {e}")
            return False

    @staticmethod
    def send_notification(
        token: str,
        title: str,
        body: str,
        data: Optional[Dict[str, str]] = None,
        image_url: Optional[str] = None,
        channel_id: str = 'messages_v4'
    ) -> Optional[str]:
        """
        Send a push notification to a single device
        
        Args:
            token: FCM device token
            title: Notification title
            body: Notification body
            data: Optional data payload
            image_url: Optional image URL for rich notification
            channel_id: Android notification channel ID
            
        Returns:
            Message ID if successful, None otherwise
        """
        try:
            # Build the notification
            notification = messaging.Notification(
                title=title,
                body=body,
                image=image_url
            )
            
            # Detect notification type for custom sound / channel selection
            notification_type = (data or {}).get('type', '')
            is_sos = bool(notification_type and (notification_type.startswith('sos') or notification_type == 'sos_alert'))
            
            # Map legacy channel IDs to versioned ones if needed
            channel_map = {
                'messages': 'messages_v4',
                'default': 'default_v4',
                'sos_alerts': 'sos_alerts_v3',
                'community': 'community_v1',
            }
            resolved_channel = channel_map.get(channel_id, channel_id)
            
            # iOS: .caf is Apple's native audio format — most reliable for APNs custom sounds.
            # Android: filename WITHOUT extension (matches res/raw/ file name).
            ios_sound = 'soundreality_mayday_166011_ios.caf' if is_sos else 'bell_ios.caf'
            android_sound = 'soundreality_mayday_166011' if is_sos else 'bell'
            
            # Android specific configuration
            android_config = messaging.AndroidConfig(
                priority='high',
                notification=messaging.AndroidNotification(
                    channel_id=resolved_channel,
                    icon='notification_icon',
                    color='#FF6B35',
                    sound=android_sound,
                    click_action='FLUTTER_NOTIFICATION_CLICK',
                    vibrate_timings_millis=[0, 1000, 300, 1000, 300, 1000, 300, 1000] if is_sos else [0, 250, 250, 250],
                )
            )
            
            # iOS APNs configuration — custom .caf sound bundled in app
            # apns-push-type: alert is required on iOS 13+ for notifications to display.
            apns_config = messaging.APNSConfig(
                headers={'apns-priority': '10', 'apns-push-type': 'alert'},
                payload=messaging.APNSPayload(
                    aps=messaging.Aps(
                        sound=ios_sound,
                        badge=1,
                        content_available=True,
                        mutable_content=True,
                        category='SOS_ALERT' if is_sos else None,
                    )
                )
            )
            
            # Build the message
            message = messaging.Message(
                notification=notification,
                data=data or {},
                token=token,
                android=android_config,
                apns=apns_config
            )
            
            # Send the message
            response = messaging.send(message)
            logger.info(f"Push notification sent successfully: {response}")
            return response
            
        except messaging.UnregisteredError:
            logger.warning(f"FCM token is unregistered/invalid: {token[:20]}...")
            return None
        except Exception as e:
            logger.error(f"Error sending push notification: {e}")
            return None
    
    @staticmethod
    def send_multicast(
        tokens: List[str],
        title: str,
        body: str,
        data: Optional[Dict[str, str]] = None
    ) -> Dict[str, Any]:
        """
        Send push notification to multiple devices
        
        Args:
            tokens: List of FCM device tokens
            title: Notification title
            body: Notification body
            data: Optional data payload
            
        Returns:
            Dict with success_count and failure_count
        """
        if not tokens:
            return {'success_count': 0, 'failure_count': 0}
            
        try:
            notification = messaging.Notification(
                title=title,
                body=body
            )
            
            # Detect notification type for custom sound / channel selection
            notification_type = (data or {}).get('type', '')
            is_sos = bool(notification_type and (notification_type.startswith('sos') or notification_type == 'sos_alert'))
            is_msg = bool(notification_type and notification_type in ('message', 'dm', 'chat', 'community', 'circle_message'))
            is_community = bool(notification_type and notification_type in ('community_interest', 'event_rsvp', 'community_request'))
            
            resolved_channel = 'sos_alerts_v3' if is_sos else ('community_v1' if is_community else ('messages_v4' if is_msg else 'default_v4'))
            
            # iOS: .caf is Apple's native audio format — most reliable for APNs custom sounds.
            # Android: filename WITHOUT extension (matches res/raw/ file name).
            ios_sound = 'soundreality_mayday_166011_ios.caf' if is_sos else 'bell_ios.caf'
            android_sound = 'soundreality_mayday_166011' if is_sos else 'bell'
            
            # Android specific configuration
            android_config = messaging.AndroidConfig(
                priority='high',
                notification=messaging.AndroidNotification(
                    channel_id=resolved_channel,
                    icon='notification_icon',
                    color='#FF6B35',
                    sound=android_sound,
                    click_action='FLUTTER_NOTIFICATION_CLICK',
                    vibrate_timings_millis=[0, 1000, 300, 1000, 300, 1000, 300, 1000] if is_sos else [0, 250, 250, 250],
                )
            )
            
            # iOS APNs configuration — custom .caf sound bundled in app
            # apns-push-type: alert is required on iOS 13+ for notifications to display.
            apns_config = messaging.APNSConfig(
                headers={'apns-priority': '10', 'apns-push-type': 'alert'},
                payload=messaging.APNSPayload(
                    aps=messaging.Aps(
                        sound=ios_sound,
                        badge=1 if is_sos else 0,
                        content_available=True,
                        mutable_content=True,
                        category='SOS_ALERT' if is_sos else None,
                    )
                )
            )
            
            message = messaging.MulticastMessage(
                notification=notification,
                data=data or {},
                tokens=tokens,
                android=android_config,
                apns=apns_config
            )
            
            response = messaging.send_multicast(message)
            
            logger.info(
                f"Multicast sent: {response.success_count} success, "
                f"{response.failure_count} failures"
            )
            
            return {
                'success_count': response.success_count,
                'failure_count': response.failure_count
            }
            
        except Exception as e:
            logger.error(f"Error sending multicast notification: {e}")
            return {'success_count': 0, 'failure_count': len(tokens)}
    
    @classmethod
    async def notify_new_dm(
        cls,
        recipient_id: str,
        sender_name: str,
        message_preview: str,
        chat_id: str
    ) -> bool:
        """
        Send notification for a new direct message
        
        Args:
            recipient_id: User ID of the message recipient
            sender_name: Name of the message sender
            message_preview: Preview of the message content
            chat_id: Chat ID for deep linking
            
        Returns:
            True if notification sent successfully
        """
        token = await cls.get_user_fcm_token(recipient_id)
        
        if not token:
            logger.info(f"No FCM token for user {recipient_id}")
            return False
        
        # Truncate message preview or hide if encrypted
        is_encrypted = message_preview and len(message_preview) > 30 and (
            not message_preview.startswith("http") and not (" " in message_preview)
        )
        preview = "You have a new message." if is_encrypted else (message_preview[:100] + '...' if len(message_preview) > 100 else message_preview)

        
        result = cls.send_notification(
            token=token,
            title=f"New message from {sender_name}",
            body=preview,
            data={
                'type': 'dm',
                'chat_id': chat_id,
                'sender_name': sender_name
            },
            channel_id='messages'
        )
        
        try:
            from services.firebase_notification_service import FirebaseNotificationService
            await FirebaseNotificationService.create_notification(
                user_id=recipient_id,
                title=f"New message from {sender_name}",
                body=preview,
                notification_type=FirebaseNotificationService.TYPE_MESSAGE,
                data={'chat_id': chat_id, 'type': 'dm', 'sender_name': sender_name}
            )
        except Exception as e:
            logger.warning(f"Failed to create DM notification in Firestore: {e}")
        
        return result is not None
    
    @classmethod
    async def notify_community_message(
        cls,
        community_id: str,
        community_name: str,
        sender_name: str,
        message_preview: str,
        exclude_user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Send notification to all community members for a new message
        
        Args:
            community_id Community ID
            community_name Name of the community
            sender_name Name of the message sender
            message_preview Preview of the message content
            exclude_user_id User ID to exclude (the sender)
        """
        from config.firestore_db import FirestoreDB
        from config.firebase_config import get_firestore
        client = await get_firestore()
        if not client:
            return {'success_count': 0, 'failure_count': 0}
        db = FirestoreDB(client)
        
        community = await db.get_document('communities', community_id)
        
        member_ids = community.get('members', [])
        
        # Exclude the sender
        if exclude_user_id:
            member_ids = [m for m in member_ids if m != exclude_user_id]
            
            # Filter out members who blocked the sender
            try:
                blocked_ids = await cls._get_blocked_user_ids(exclude_user_id)
                if blocked_ids:
                    member_ids = [m for m in member_ids if m not in blocked_ids]
            except Exception as e:
                logger.warning(f"Error checking block status for community notifications: {e}")
        
        if not member_ids:
            return {'success_count': 0, 'failure_count': 0}
        
        # ⚡ Bolt Optimization: Batch fetch FCM tokens to prevent N+1 queries
        tokens = await cls.get_users_fcm_tokens(member_ids)
        
        if not tokens:
            return {'success_count': 0, 'failure_count': 0}
        
        # Truncate message preview or hide if encrypted
        is_encrypted = message_preview and len(message_preview) > 30 and (
            not message_preview.startswith("http") and not (" " in message_preview)
        )
        preview = "You have a new message." if is_encrypted else (message_preview[:100] + '...' if len(message_preview) > 100 else message_preview)

        
        result = cls.send_multicast(
            tokens=tokens,
            title=f"{sender_name} in {community_name}",
            body=preview,
            data={
                'type': 'community',
                'community_id': community_id,
                'community_name': community_name
            }
        )
        
        try:
            from services.firebase_notification_service import FirebaseNotificationService
            for member_id in member_ids:
                await FirebaseNotificationService.create_notification(
                    user_id=member_id,
                    title=f"{sender_name} in {community_name}",
                    body=preview,
                    notification_type=FirebaseNotificationService.TYPE_COMMUNITY,
                    data={'community_id': community_id, 'type': 'community', 'community_name': community_name}
                )
        except Exception as e:
            logger.warning(f"Failed to create community message notifications in Firestore: {e}")
        
        return result

    @classmethod
    async def notify_circle_message(
        cls,
        circle_id: str,
        circle_name: str,
        sender_name: str,
        message_preview: str,
        exclude_user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Send notification to all circle members for a new message
        """
        db = await _get_db()
        circle = await db.get_document('circles', circle_id)
        
        if not circle:
            return {'success_count': 0, 'failure_count': 0}
            
        member_ids = circle.get('members', [])
        
        # In circles, members might be dicts or strings depending on schema, let's handle strings. 
        # Actually in circle_routes, they are strings or dicts with user_id?
        # Looking at other routes, member_ids is list of user IDs or dicts. Let's extract IDs safely.
        actual_member_ids = []
        for m in member_ids:
            if isinstance(m, str):
                actual_member_ids.append(m)
            elif isinstance(m, dict) and 'user_id' in m:
                actual_member_ids.append(m['user_id'])
                
        if exclude_user_id:
            actual_member_ids = [m for m in actual_member_ids if m != exclude_user_id]
            
            # Filter out members who blocked the sender
            try:
                blocked_ids = await cls._get_blocked_user_ids(exclude_user_id)
                if blocked_ids:
                    actual_member_ids = [m for m in actual_member_ids if m not in blocked_ids]
            except Exception as e:
                logger.warning(f"Error checking block status for circle notifications: {e}")
            
        if not actual_member_ids:
            return {'success_count': 0, 'failure_count': 0}
            
        # ⚡ Bolt Optimization: Batch fetch FCM tokens to prevent N+1 queries
        tokens = await cls.get_users_fcm_tokens(actual_member_ids)
                
        if not tokens:
            return {'success_count': 0, 'failure_count': 0}
            

        is_encrypted = message_preview and len(message_preview) > 30 and (
            not message_preview.startswith("http") and not (" " in message_preview)
        )
        preview = "You have a new message." if is_encrypted else (message_preview[:100] + '...' if len(message_preview) > 100 else message_preview)

        
        result = cls.send_multicast(
            tokens=tokens,
            title=f"{sender_name} in {circle_name}",
            body=preview,
            data={
                'type': 'circle_message',
                'circle_id': circle_id,
                'circle_name': circle_name
            }
        )
        
        try:
            from services.firebase_notification_service import FirebaseNotificationService
            for member_id in actual_member_ids:
                await FirebaseNotificationService.create_notification(
                    user_id=member_id,
                    title=f"{sender_name} in {circle_name}",
                    body=preview,
                    notification_type="circle_message",
                    data={'circle_id': circle_id, 'type': 'circle_message', 'circle_name': circle_name}
                )
        except Exception as e:
            logger.warning(f"Failed to create circle message notifications in Firestore: {e}")
        
        return result

    @classmethod
    async def notify_circle_invite(
        cls,
        circle_id: str,
        circle_name: str,
        inviter_name: str,
        member_ids: List[str]
    ) -> Dict[str, Any]:
        """
        Send notification to users when they are added to a circle
        
        Args:
            circle_id Circle ID
            circle_name Name of the circle
            inviter_name Name of the user who created/invited
            member_ids List of user IDs to notify
        """
        if not member_ids:
            return {'success_count': 0, 'failure_count': 0}
        
        # ⚡ Bolt Optimization: Batch fetch FCM tokens to prevent N+1 queries
        tokens = await cls.get_users_fcm_tokens(member_ids)
        
        if not tokens:
            return {'success_count': 0, 'failure_count': 0}
        
        result = cls.send_multicast(
            tokens=tokens,
            title=f"Added to Circle: {circle_name}",
            body=f"{inviter_name} added you to {circle_name}. Open the app to start chatting!",
            data={
                'type': 'circle_invite',
                'circle_id': circle_id,
                'circle_name': circle_name
            }
        )
        
        try:
            from services.firebase_notification_service import FirebaseNotificationService
            for member_id in member_ids:
                await FirebaseNotificationService.create_notification(
                    user_id=member_id,
                    title=f"Added to Circle: {circle_name}",
                    body=f"{inviter_name} added you to {circle_name}.",
                    notification_type="circle_invite",
                    data={'circle_id': circle_id, 'type': 'circle_invite', 'circle_name': circle_name}
                )
        except Exception as e:
            logger.warning(f"Failed to create circle invite notifications in Firestore: {e}")
        
        return result


# Singleton instance
push_service = PushNotificationService()
