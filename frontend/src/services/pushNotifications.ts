import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import api from './api';

const isExpoGo = Constants.appOwnership === 'expo' || Constants.appOwnership === 'guest';

async function getNotificationsModule() {
  try {
    const Notifications = await import('expo-notifications');
    return Notifications;
  } catch (e) {
    console.warn('[Push] expo-notifications import failed:', e);
    return null;
  }
}

// Configure how notifications appear when app is in foreground (if available)
(async () => {
  const Notifications = await getNotificationsModule();
  if (Notifications) {
    if (Notifications.setNotificationHandler) {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        }),
      });
    }

    if (Notifications.setNotificationCategoryAsync) {
      try {
        await Notifications.setNotificationCategoryAsync('SOS_ALERT', [
          {
            identifier: 'accept_sos',
            buttonTitle: 'Accept',
          },
          {
            identifier: 'deny_sos',
            buttonTitle: 'Deny',
            options: { isDestructive: true },
          },
        ]);
      } catch (e) {
        console.warn('[Push] Failed to create SOS notification category:', e);
      }
    }
  }
})();

/**
 * Register for push notifications and get the FCM token
 */
export async function registerForPushNotifications(): Promise<string | null> {
  let token: string | null = null;

  const Notifications = await getNotificationsModule();
  if (!Notifications) {
    console.warn('[Push] Notifications module unavailable; skipping registration.');
    return null;
  }

  // Check if running on a physical device
  if (!Device.isDevice) {
    console.log('[Push] Must use physical device for Push Notifications');
    return null;
  }

  // Check/request permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
        allowProvisional: false,
      },
    });
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('[Push] Permission not granted for push notifications');
    return null;
  }

  try {
    if (Platform.OS === 'web') {
      return null;
    }

    // Prefer native device push token for FCM-based backend delivery.
    const deviceToken = await Notifications.getDevicePushTokenAsync();
    if (deviceToken?.data) {
      token = deviceToken.data;
      console.log('[Push] Device Push Token retrieved successfully.');
    } else {
      // Fallback: Expo push token
      const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
      if (projectId) {
        const pushToken = await Notifications.getExpoPushTokenAsync({ projectId });
        token = pushToken.data;
        console.warn('[Push] Received Expo push token; FCM native token preferred for production.');
      } else {
        console.warn('[Push] Unable to get device push token and no Expo projectId fallback available.');
      }
    }
  } catch (error: any) {
    if (Platform.OS === 'web' && error.message?.includes('vapidPublicKey')) {
      console.log('[Push] Web push notifications disabled: Missing VAPID key in app.json');
    } else {
      console.error('[Push] Error getting push token:', error);
    }
  }

  // Configure Android notification channels
  // NOTE: Android caches channel settings. We delete+recreate ALL channels every
  // launch to ensure vibration patterns, sounds and priorities are always fresh.
  if (Platform.OS === 'android') {
    try {
      const channelsToClear = ['default_v4', 'messages_v4', 'community_v1'];
      for (const ch of channelsToClear) {
        try { await Notifications.deleteNotificationChannelAsync(ch); } catch (_) {}
      }

      // ── Default channel ─────────────────────────────────────────────────────
      await Notifications.setNotificationChannelAsync('default_v4', {
        name: 'General Notifications',
        description: 'App alerts, updates and general notifications',
        importance: Notifications.AndroidImportance?.HIGH ?? 4,
        vibrationPattern: [0, 250, 250, 250],
        enableVibrate: true,
        lightColor: '#FF6B35',
        sound: 'bell',
      });

      // ── Messages channel ──────────────────────────────────────────────────
      await Notifications.setNotificationChannelAsync('messages_v4', {
        name: 'Messages',
        description: 'Private and community message notifications',
        importance: Notifications.AndroidImportance?.HIGH ?? 4,
        vibrationPattern: [0, 250, 250, 250],
        enableVibrate: true,
        lightColor: '#FF6B35',
        sound: 'bell',
      });

      // ── Community channel ─────────────────────────────────────────────────
      await Notifications.setNotificationChannelAsync('community_v1', {
        name: 'Community Alerts',
        description: 'Lost & Found, Event RSVPs and community activity',
        importance: Notifications.AndroidImportance?.HIGH ?? 4,
        vibrationPattern: [0, 300, 200, 300],
        enableVibrate: true,
        lightColor: '#FF6B35',
        sound: 'bell',
      });

      // ── SOS channel – delete & recreate (highest priority) ────────────────
      try { await Notifications.deleteNotificationChannelAsync('sos_alerts_v3'); } catch (_) {}

      await Notifications.setNotificationChannelAsync('sos_alerts_v3', {
        name: 'Emergency SOS Alerts',
        description: 'CRITICAL — high-priority SOS emergency alerts from people nearby',
        importance: Notifications.AndroidImportance?.MAX ?? 5,
        vibrationPattern: [0, 1000, 300, 1000, 300, 1000, 300, 1000],
        lightColor: '#FF0000',
        bypassDnd: true,
        showBadge: true,
        enableVibrate: true,
        enableLights: true,
        lockscreenVisibility: 1, // VISIBILITY_PUBLIC
        sound: 'soundreality_mayday_166011',
      });

      console.log('[Push] Android channels configured successfully');
    } catch (e) {
      console.warn('[Push] Failed to configure Android channels', e);
    }
  }

  return token;
}


/**
 * Save the FCM/Expo token to the backend/Firestore
 */
export async function saveFCMToken(token: string): Promise<boolean> {
  try {
    await api.post('/user/fcm-token', { fcm_token: token });
    console.log('[Push] Notification token saved to backend successfully.');
    return true;
  } catch (error) {
    console.error('[Push] Error saving notification token:', error);
    return false;
  }
}

/**
 * Initialize push notifications - register and save token
 */
export async function initializePushNotifications(): Promise<string | null> {
  const token = await registerForPushNotifications();
  if (!token) {
    return null;
  }

  const saved = await saveFCMToken(token);
  return saved ? token : null;
}

/**
 * Add listener for notification received while app is foregrounded
 */
export async function addNotificationReceivedListener(
  callback: (notification: any) => void
) {
  const Notifications = await getNotificationsModule();
  if (!Notifications) {
    console.warn('[Push] addNotificationReceivedListener: notifications unavailable');
    return { remove: () => {} };
  }
  return Notifications.addNotificationReceivedListener(callback);
}

/**
 * Add listener for notification response (when user taps notification)
 */
export async function addNotificationResponseReceivedListener(
  callback: (response: any) => void
) {
  const Notifications = await getNotificationsModule();
  if (!Notifications) {
    console.warn('[Push] addNotificationResponseReceivedListener: notifications unavailable');
    return { remove: () => {} };
  }
  return Notifications.addNotificationResponseReceivedListener(callback);
}

/**
 * Get the last notification response (for handling deep links on app launch)
 */
export async function getLastNotificationResponse() {
  if (Platform.OS === 'web') return null;
  const Notifications = await getNotificationsModule();
  if (!Notifications) return null;
  try {
    return await Notifications.getLastNotificationResponseAsync();
  } catch (error) {
    return null;
  }
}

/**
 * Schedule a local notification with correct channel and custom sound.
 *
 * iOS: sound filename must include .mp3 extension (matches the file bundled
 *      in ios/Brahmand/ via Xcode copy-bundle-resources).
 * Android: sound filename WITHOUT extension (matches res/raw/ filename).
 */
export async function scheduleLocalNotification(
  title: string,
  body: string,
  data?: Record<string, any>
) {
  const Notifications = await getNotificationsModule();
  if (!Notifications) return null;

  const notificationType = data?.type;
  const isSos = !!notificationType?.startsWith('sos');
  const isCommunity =
    notificationType === 'community_interest' ||
    notificationType === 'event_rsvp' ||
    notificationType === 'community_request';
  const isMsg = notificationType === 'message' || notificationType === 'dm';

  // iOS requires filename WITH extension; prefer .caf (Apple's native audio format, most reliable for APNs).
  // Android WITHOUT extension (references res/raw/ filename).
  const iosSoundFile = isSos ? 'soundreality_mayday_166011.caf' : 'bell.caf';
  const androidSoundFile = isSos ? 'soundreality_mayday_166011' : 'bell';

  const channelId = isSos
    ? 'sos_alerts_v3'
    : isCommunity
    ? 'community_v1'
    : isMsg
    ? 'messages_v4'
    : 'default_v4';

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: data || {},
      // iOS picks up the sound from the app bundle using this filename.
      // Android ignores this — it uses the channel's sound setting instead.
      sound: Platform.OS === 'ios' ? iosSoundFile : androidSoundFile,
    },
    trigger: (Platform.OS === 'android'
      ? { channelId }
      : { seconds: 1 }) as any,
  });
}


/**
 * Clear all notifications
 */
export async function clearAllNotifications() {
  const Notifications = await getNotificationsModule();
  if (!Notifications) return;
  await Notifications.dismissAllNotificationsAsync();
}

/**
 * Get badge count
 */
export async function getBadgeCount(): Promise<number> {
  const Notifications = await getNotificationsModule();
  if (!Notifications) return 0;
  return await Notifications.getBadgeCountAsync();
}

/**
 * Set badge count
 */
export async function setBadgeCount(count: number) {
  const Notifications = await getNotificationsModule();
  if (!Notifications) return;
  await Notifications.setBadgeCountAsync(count);
}
