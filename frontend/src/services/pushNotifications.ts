import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

// Dynamic import for web compatibility
async function getNotificationsModule() {
  try {
    const Notifications = await import('expo-notifications');
    return Notifications;
  } catch (e) {
    console.warn('[Push] expo-notifications import failed:', e);
    return null;
  }
}

// Configure how notifications appear when app is in foreground
(async () => {
  const Notifications = await getNotificationsModule();
  if (Notifications) {
    if (Notifications.setNotificationHandler) {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
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
 * Register for push notifications and get the FCM/Expo token
 */
export async function registerForPushNotifications(): Promise<string | null> {
  let token: string | null = null;
  const Notifications = await getNotificationsModule();
  
  if (!Notifications) {
    console.warn('[Push] Notifications module unavailable; skipping registration.');
    return null;
  }

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
    if (Platform.OS === 'web') return null;

    if (Platform.OS === 'ios') {
      const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
      if (!projectId) {
        console.warn('[Push] iOS: No EAS projectId found — cannot get Expo push token.');
      } else {
        const pushToken = await Notifications.getExpoPushTokenAsync({ projectId });
        token = pushToken.data;
        console.log('[Push] iOS: Expo push token acquired:', token?.slice(0, 30) + '...');
      }
    } else {
      // Android: Try native FCM token first, fallback to Expo push token
      const deviceToken = await Notifications.getDevicePushTokenAsync();
      if (deviceToken?.data) {
        token = deviceToken.data;
        console.log('[Push] Android: FCM device token acquired.');
      } else {
        const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
        if (projectId) {
          const pushToken = await Notifications.getExpoPushTokenAsync({ projectId });
          token = pushToken.data;
          console.warn('[Push] Android: Fell back to Expo push token.');
        } else {
          console.warn('[Push] Android: No FCM token and no Expo projectId fallback.');
        }
      }
    }
  } catch (error: any) {
    if (Platform.OS === 'web' && error.message?.includes('vapidPublicKey')) {
      console.log('[Push] Web push notifications disabled: Missing VAPID key in app.json');
    } else {
      console.error('[Push] Error getting push token:', error);
    }
  }

  // ✅ Configure Android notification channels safely.
  // Removed aggressive deletion. setNotificationChannelAsync is idempotent for creation 
  // and safely updates non-locked properties without overriding user OS preferences 
  // for locked properties (e.g., if a user manually disabled sound/vibration).
  if (Platform.OS === 'android') {
    try {
      await Notifications.setNotificationChannelAsync('default_v4', {
        name: 'General Notifications',
        description: 'App alerts, updates and general notifications',
        importance: Notifications.AndroidImportance?.HIGH ?? 4,
        vibrationPattern: [0, 250, 250, 250],
        enableVibrate: true,
        lightColor: '#FF6B35',
        sound: 'bell',
      });

      await Notifications.setNotificationChannelAsync('messages_v4', {
        name: 'Messages',
        description: 'Private and community message notifications',
        importance: Notifications.AndroidImportance?.HIGH ?? 4,
        vibrationPattern: [0, 250, 250, 250],
        enableVibrate: true,
        lightColor: '#FF6B35',
        sound: 'bell',
      });

      await Notifications.setNotificationChannelAsync('community_v1', {
        name: 'Community Alerts',
        description: 'Lost & Found, Event RSVPs and community activity',
        importance: Notifications.AndroidImportance?.HIGH ?? 4,
        vibrationPattern: [0, 300, 200, 300],
        enableVibrate: true,
        lightColor: '#FF6B35',
        sound: 'bell',
      });

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

export async function initializePushNotifications(): Promise<string | null> {
  const token = await registerForPushNotifications();
  if (!token) return null;

  // Schedule recurring notifications (now safe to call on every init due to identifier deduplication)
  await scheduleDailyScriptureNotifications().catch((err) => {
    console.warn('[Push] Failed to schedule daily scripture notifications during init:', err);
  });

  const saved = await saveFCMToken(token);
  return saved ? token : null;
}

export async function addNotificationReceivedListener(callback: (notification: any) => void) {
  const Notifications = await getNotificationsModule();
  if (!Notifications) {
    console.warn('[Push] addNotificationReceivedListener: notifications unavailable');
    return { remove: () => {} };
  }
  return Notifications.addNotificationReceivedListener(callback);
}

export async function addNotificationResponseReceivedListener(callback: (response: any) => void) {
  const Notifications = await getNotificationsModule();
  if (!Notifications) {
    console.warn('[Push] addNotificationResponseReceivedListener: notifications unavailable');
    return { remove: () => {} };
  }
  return Notifications.addNotificationResponseReceivedListener(callback);
}

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

export async function scheduleEventReminderNotification(
  eventTitle: string,
  startTimeIso: string,
  communityId?: string
): Promise<string | null> {
  if (Platform.OS === 'web') return null;
  const Notifications = await getNotificationsModule();
  if (!Notifications) return null;

  const eventMs = new Date(startTimeIso).getTime();
  if (isNaN(eventMs)) {
    console.warn('[Push] scheduleEventReminderNotification: invalid startTimeIso', startTimeIso);
    return null;
  }

  const reminderMs = eventMs - 5 * 60 * 1000; // 5 minutes before
  const secondsUntilReminder = Math.floor((reminderMs - Date.now()) / 1000);

  if (secondsUntilReminder < 60) {
    console.log('[Push] Event reminder skipped — event is too close or in the past');
    return null;
  }

  try {
    const notifId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '🔔 Event starting soon!',
        body: `"${eventTitle}" starts in 5 minutes. Get ready!`,
        data: { type: 'event_reminder', communityId: communityId || '' },
        sound: __DEV__ ? true : (Platform.OS === 'ios' ? 'bell_ios.caf' : 'bell'),
      },
      trigger: {
        seconds: secondsUntilReminder,
        channelId: 'community_v1',
        type: 'timeInterval',
      } as any,
    });
    console.log(`[Push] Event reminder scheduled in ${secondsUntilReminder}s (notifId: ${notifId})`);
    return notifId;
  } catch (e) {
    console.warn('[Push] Failed to schedule event reminder:', e);
    return null;
  }
}

export async function scheduleLocalNotification(
  title: string,
  body: string,
  data?: Record<string, any>
) {
  if (Platform.OS === 'web') return null;
  const Notifications = await getNotificationsModule();
  if (!Notifications) return null;

  const notificationType = data?.type;
  const isSos = !!notificationType?.startsWith('sos') && notificationType !== 'sos_resolved';
  const isCommunity = ['community_interest', 'event_rsvp', 'community_request'].includes(notificationType);
  const isMsg = ['message', 'dm'].includes(notificationType);

  const iosSoundFile = isSos ? 'soundreality_mayday_166011_ios.caf' : 'bell_ios.caf';
  const androidSoundFile = isSos ? 'soundreality_mayday_166011' : 'bell';

  const channelId = isSos ? 'sos_alerts_v3' : isCommunity ? 'community_v1' : isMsg ? 'messages_v4' : 'default_v4';

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: data || {},
      sound: __DEV__ ? true : (Platform.OS === 'ios' ? iosSoundFile : androidSoundFile),
    },
    trigger: {
      seconds: 1,
      channelId,
      type: 'timeInterval',
    } as any,
  });
}

export async function clearAllNotifications() {
  const Notifications = await getNotificationsModule();
  if (!Notifications) return;
  await Notifications.dismissAllNotificationsAsync();
}

export async function getBadgeCount(): Promise<number> {
  const Notifications = await getNotificationsModule();
  if (!Notifications) return 0;
  return await Notifications.getBadgeCountAsync();
}

export async function setBadgeCount(count: number) {
  const Notifications = await getNotificationsModule();
  if (!Notifications) return;
  await Notifications.setBadgeCountAsync(count);
}

export async function scheduleLibraryReadingNotification(
  unfinishedBookName?: string,
  triggerSeconds?: number,
  force: boolean = false
) {
  if (Platform.OS === 'web') return null;
  const Notifications = await getNotificationsModule();
  if (!Notifications) return null;

  const FOUR_DAYS_MS = 4 * 24 * 60 * 60 * 1000;
  if (!force) {
    try {
      const lastSentStr = await AsyncStorage.getItem('LAST_LIBRARY_REMINDER_TIMESTAMP');
      if (lastSentStr) {
        const lastSentTime = parseInt(lastSentStr, 10);
        if (Date.now() - lastSentTime < FOUR_DAYS_MS) {
          console.log('[Push] Library reading notification skipped: max 1 per 4 days allowed');
          return null;
        }
      }
    } catch (e) {
      console.warn('[Push] Error checking last library reminder timestamp:', e);
    }
  }

  const title = unfinishedBookName?.trim() 
    ? '🔖 Pick up your reading session' 
    : '✨ Unfold sacred wisdom today';
  const body = unfinishedBookName?.trim()
    ? `"${unfinishedBookName.trim()}" is waiting for you in your library. Resume reading now and gain deeper insights!`
    : 'Give some time to begin reading Bhagvad Geeta!';

  const delay = triggerSeconds && triggerSeconds > 0 ? triggerSeconds : 1;

  try {
    const notifId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: { type: 'library_reminder', bookName: unfinishedBookName || '', route: '/library' },
        sound: __DEV__ ? true : (Platform.OS === 'ios' ? 'bell_ios.caf' : 'bell'),
      },
      trigger: {
        seconds: delay,
        channelId: 'default_v4',
        type: 'timeInterval',
      } as any,
    });

    await AsyncStorage.setItem('LAST_LIBRARY_REMINDER_TIMESTAMP', Date.now().toString()).catch(() => {});
    console.log(`[Push] Library reading notification scheduled in ${delay}s (id: ${notifId})`);
    return notifId;
  } catch (e) {
    console.warn('[Push] Failed to schedule library reading notification:', e);
    return null;
  }
}

export async function scheduleShivKathaNotification(
  triggerSeconds?: number,
  force: boolean = false
) {
  if (Platform.OS === 'web') return null;
  const Notifications = await getNotificationsModule();
  if (!Notifications) return null;

  const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;
  if (!force) {
    try {
      const lastSentStr = await AsyncStorage.getItem('LAST_SHIV_KATHA_REMINDER_TIMESTAMP');
      if (lastSentStr) {
        const lastSentTime = parseInt(lastSentStr, 10);
        if (Date.now() - lastSentTime < TWELVE_HOURS_MS) {
          console.log('[Push] Shiv Katha notification skipped: max 2 per day allowed');
          return null;
        }
      }
    } catch (e) {
      console.warn('[Push] Error checking last Shiv Katha reminder timestamp:', e);
    }
  }

  const delay = triggerSeconds && triggerSeconds > 0 ? triggerSeconds : 1;

  try {
    const notifId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '🕉️ LIVE Shiv Katha starts on 13 August',
        body: 'Pre-register now to receive reminders and LIVE updates from Acharya Shamik Ji.',
        data: { type: 'shiv_katha_reminder', route: '/shravan-paath' },
        sound: __DEV__ ? true : (Platform.OS === 'ios' ? 'bell_ios.caf' : 'bell'),
      },
      trigger: {
        seconds: delay,
        channelId: 'default_v4',
        type: 'timeInterval',
      } as any,
    });

    await AsyncStorage.setItem('LAST_SHIV_KATHA_REMINDER_TIMESTAMP', Date.now().toString()).catch(() => {});
    console.log(`[Push] Shiv Katha notification scheduled in ${delay}s (id: ${notifId})`);
    return notifId;
  } catch (e) {
    console.warn('[Push] Failed to schedule Shiv Katha notification:', e);
    return null;
  }
}

/**
 * ✅ FIXED: Uses explicit identifiers and cancels existing notifications before scheduling
 * to prevent duplicate stacking on app restarts.
 */
export async function scheduleDailyScriptureNotifications(): Promise<{ morningNotifId: string | null; nightNotifId: string | null }> {
  if (Platform.OS === 'web') return { morningNotifId: null, nightNotifId: null };
  const Notifications = await getNotificationsModule();
  if (!Notifications) return { morningNotifId: null, nightNotifId: null };

  const channelId = 'default_v4';
  const soundFile = __DEV__ ? true : (Platform.OS === 'ios' ? 'bell_ios.caf' : 'bell');

  let morningNotifId: string | null = null;
  let nightNotifId: string | null = null;

  try {
    // Cancel existing to prevent duplicates on app restart
    await Notifications.cancelScheduledNotificationAsync('daily_scripture_morning');
    
    morningNotifId = await Notifications.scheduleNotificationAsync({
      identifier: 'daily_scripture_morning', // ✅ Explicit identifier
      content: {
        title: '🌅 Brahmand Library',
        body: 'Take a moment to read a verse from your favourite scripture this morning.',
        data: { type: 'scripture_reminder', timeOfDay: 'morning', route: '/library' },
        sound: soundFile,
      },
      trigger: {
        type: 'daily',
        hour: 8,
        minute: 0,
        repeats: true,
        channelId,
      } as any,
    });
    console.log(`[Push] Morning scripture notification scheduled (id: ${morningNotifId})`);
  } catch (e) {
    console.warn('[Push] Failed to schedule morning scripture notification:', e);
  }

  try {
    // Cancel existing to prevent duplicates on app restart
    await Notifications.cancelScheduledNotificationAsync('daily_scripture_evening');

    nightNotifId = await Notifications.scheduleNotificationAsync({
      identifier: 'daily_scripture_evening', // ✅ Explicit identifier
      content: {
        title: '🌙 Brahmand Library',
        body: 'Take a moment to read a verse from your favourite scripture this evening.',
        data: { type: 'scripture_reminder', timeOfDay: 'evening', route: '/library' },
        sound: soundFile,
      },
      trigger: {
        type: 'daily',
        hour: 20,
        minute: 0,
        repeats: true,
        channelId,
      } as any,
    });
    console.log(`[Push] Evening scripture notification scheduled (id: ${nightNotifId})`);
  } catch (e) {
    console.warn('[Push] Failed to schedule evening scripture notification:', e);
  }

  return { morningNotifId, nightNotifId };
}

/**
 * ✅ FIXED: Uses absolute 'date' trigger instead of manual seconds calculation 
 * to prevent timezone drift and background execution quirks.
 * NOTE: Hardcoded campaign dates should ideally be fetched from your backend API 
 * to avoid technical debt as campaigns evolve.
 */
export async function scheduleShravanKatha15MinReminder() {
  if (Platform.OS === 'web') return null;
  const Notifications = await getNotificationsModule();
  if (!Notifications) return null;

  // Helper to get current time in IST
  const getISTDate = () => {
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    return new Date(utc + (3600000 * 5.5));
  };
  
  const ist = getISTDate();
  const currentMins = ist.getHours() * 60 + ist.getMinutes();

  // Target pre-stream times in minutes from midnight (15 mins before 8:00 AM & 8:00 PM IST)
  const targets = [7 * 60 + 45, 19 * 60 + 45]; // 7:45 AM, 7:45 PM

  // Fallback logic ensures it always finds the *next* valid slot, even if the hardcoded start date is in the past
  let nextTargetMins = targets.find(t => t > currentMins);
  let targetDate: Date;

  if (nextTargetMins !== undefined) {
    targetDate = new Date(ist);
    targetDate.setHours(Math.floor(nextTargetMins / 60), nextTargetMins % 60, 0, 0);
  } else {
    // Wrap around to tomorrow morning
    targetDate = new Date(ist);
    targetDate.setDate(targetDate.getDate() + 1);
    targetDate.setHours(7, 45, 0, 0);
  }

  try {
    const notifId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '🕉️ Shravan Live Katha',
        body: 'Shravan Live Katha is about to start. Please Join',
        data: { type: 'shravan_katha_live', route: '/(tabs)/home' },
        sound: __DEV__ ? true : (Platform.OS === 'ios' ? 'bell_ios.caf' : 'bell'),
      },
      trigger: {
        type: 'date', // ✅ Absolute date trigger
        date: targetDate,
        channelId: 'default_v4',
      } as any,
    });

    console.log(`[Push] Shravan Katha 15-min live reminder scheduled for ${targetDate.toISOString()} (id: ${notifId})`);
    return notifId;
  } catch (e) {
    console.warn('[Push] Failed to schedule Shravan Katha 15-min reminder:', e);
    return null;
  }
}
