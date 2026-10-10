import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { NAVRATRI_DAY_NOTIFICATIONS } from '../data/navdurgaDaysData';

const STORAGE_KEY = '@festival_reminders';

interface ReminderState {
  enabled: boolean;
  festivalDate: string;
  notificationIds: string[];
}

let remindersCache: Record<string, ReminderState> | null = null;

export async function getFestivalReminderState(festivalId: string): Promise<ReminderState | null> {
  try {
    if (remindersCache !== null) {
      return remindersCache[festivalId] || null;
    }
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    remindersCache = data ? JSON.parse(data) : {};
    return remindersCache![festivalId] || null;
  } catch (e) {
    console.error('Error reading festival reminder state', e);
    return null;
  }
}

export async function getAllFestivalReminders(): Promise<Record<string, ReminderState>> {
  try {
    if (remindersCache !== null) {
      return remindersCache;
    }
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    remindersCache = data ? JSON.parse(data) : {};
    return remindersCache!;
  } catch (e) {
    console.error('Error reading all festival reminders', e);
    return {};
  }
}

async function saveFestivalReminderState(festivalId: string, state: ReminderState | null) {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    const reminders = data ? JSON.parse(data) : {};
    if (state) {
      reminders[festivalId] = state;
    } else {
      delete reminders[festivalId];
    }
    remindersCache = reminders;
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(reminders));
  } catch (e) {
    console.error('Error saving festival reminder state', e);
  }
}

async function scheduleLocalNotif(title: string, body: string, data: any, triggerDate: Date): Promise<string | null> {
  if (Platform.OS === 'web') return null;
  const now = Date.now();
  const triggerTime = triggerDate.getTime();
  const secondsFromNow = Math.max(1, Math.round((triggerTime - now) / 1000));

  try {
    // 1. Try date trigger (object format expected by newer expo-notifications)
    return await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: __DEV__ ? true : (Platform.OS === 'ios' ? 'bell_ios.caf' : 'bell'),
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: {
        type: 'date',
        date: triggerDate,
        channelId: 'default_v4',
      } as any,
    });
  } catch (err1) {
    // 2. Fallback to timeInterval (seconds) which works consistently across all Expo versions & iOS simulators
    try {
      return await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: __DEV__ ? true : (Platform.OS === 'ios' ? 'bell_ios.caf' : 'bell'),
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: {
          type: 'timeInterval',
          seconds: secondsFromNow,
          repeats: false,
          channelId: 'default_v4',
        } as any,
      });
    } catch (err2) {
      console.warn('[FestivalReminders] Failed to schedule notification:', err2 || err1);
      return null;
    }
  }
}

async function scheduleNotificationsForFestival(
  festival: { id?: string; name?: string; festival_name?: string; date: string }
): Promise<string[]> {
  const festivalId = festival.id || festival.name || festival.festival_name;
  if (!festivalId || !festival.date) return [];

  const festivalName = festival.name || festival.festival_name || 'Festival';
  const festDateStr = festival.date;
  const festivalDate = new Date(`${festDateStr}T00:00:00`);
  if (isNaN(festivalDate.getTime())) return [];

  const now = new Date();
  const notificationIds: string[] = [];
  const notificationData = { type: 'festival_reminder', festivalId };

  // Check if this festival is Navratri (Sharad Navratri, Chaitra Navratri, etc.)
  const isNavratri = festivalId.toLowerCase().includes('navratri') || festivalName.toLowerCase().includes('navratri');

  if (isNavratri) {
    // Schedule dedicated Day 1 to Day 9 notifications for Navratri
    for (const dayNotif of NAVRATRI_DAY_NOTIFICATIONS) {
      const dayIndex = dayNotif.day - 1; // 0-indexed offset from start date
      const navratriDayDate = new Date(festivalDate.getTime() + dayIndex * 24 * 60 * 60 * 1000);
      
      // Morning notification at 8:00 AM on each of the 9 days
      const morningTrigger = new Date(navratriDayDate.getTime());
      morningTrigger.setHours(8, 0, 0, 0);

      const navratriNotifData = {
        type: 'festival_reminder',
        festivalId,
        navratriDay: dayNotif.day,
        route: '/festivals',
      };

      if (morningTrigger > now) {
        const id = await scheduleLocalNotif(
          dayNotif.title,
          dayNotif.body,
          navratriNotifData,
          morningTrigger
        );
        if (id) notificationIds.push(id);
      } else {
        // If today is this specific Navratri day and 8 AM has passed but day is not over
        const isCurrentDay = now.toDateString() === navratriDayDate.toDateString();
        if (isCurrentDay && now.getHours() < 22) {
          const immediateTrigger = new Date(now.getTime() + 10 * 1000); // 10s from now
          const id = await scheduleLocalNotif(
            dayNotif.title,
            dayNotif.body,
            navratriNotifData,
            immediateTrigger
          );
          if (id) notificationIds.push(id);
        }
      }
    }
  } else {
    // 1. Day before - Morning (9:00 AM)
    const dayBefore9AM = new Date(festivalDate.getTime() - 24 * 60 * 60 * 1000);
    dayBefore9AM.setHours(9, 0, 0, 0);
    if (dayBefore9AM > now) {
      const id = await scheduleLocalNotif(
        `🪔 Tomorrow: ${festivalName}`,
        `Get ready! ${festivalName} begins tomorrow.`,
        notificationData,
        dayBefore9AM
      );
      if (id) notificationIds.push(id);
    }

    // 2. Day before - Evening (8:00 PM)
    const dayBefore8PM = new Date(festivalDate.getTime() - 24 * 60 * 60 * 1000);
    dayBefore8PM.setHours(20, 0, 0, 0);
    if (dayBefore8PM > now) {
      const id = await scheduleLocalNotif(
        `🪔 Tomorrow: ${festivalName}`,
        `Reminder: ${festivalName} is tomorrow!`,
        notificationData,
        dayBefore8PM
      );
      if (id) notificationIds.push(id);
    }

    // 3. Festival Day - Morning (8:00 AM)
    const festivalDay8AM = new Date(festivalDate.getTime());
    festivalDay8AM.setHours(8, 0, 0, 0);
    if (festivalDay8AM > now) {
      const id = await scheduleLocalNotif(
        `🪔 Today is ${festivalName}!`,
        `Wishing you a joyful and blessed ${festivalName}!`,
        notificationData,
        festivalDay8AM
      );
      if (id) notificationIds.push(id);
    }

    // 4. Fallback Trigger (Immediate alert if festival is tomorrow/today & pre-scheduled times passed)
    const isTomorrow = now.toDateString() === new Date(festivalDate.getTime() - 24 * 60 * 60 * 1000).toDateString();
    const isToday = now.toDateString() === festivalDate.toDateString();

    if ((isTomorrow || isToday) && notificationIds.length === 0) {
      const festivalEnd = new Date(festivalDate.getTime());
      festivalEnd.setHours(23, 59, 59, 999);

      if (now < festivalEnd) {
        const immediateTrigger = new Date(now.getTime() + 10 * 1000); // 10s from now
        const id = await scheduleLocalNotif(
          `🪔 ${isToday ? 'Today' : 'Tomorrow'} is ${festivalName}!`,
          `Don't miss out! ${festivalName} ${isToday ? 'is today' : 'begins tomorrow'}.`,
          notificationData,
          immediateTrigger
        );
        if (id) notificationIds.push(id);
      }
    }
  }

  return notificationIds;
}

export async function toggleFestivalReminder(
  festival: { id?: string; name?: string; festival_name?: string; date: string }
): Promise<boolean> {
  const festivalId = festival.id || festival.name || festival.festival_name;
  if (!festivalId) return false;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== 'granted') {
    throw new Error('Permission not granted');
  }

  const currentState = await getFestivalReminderState(festivalId);

  if (currentState && currentState.enabled) {
    for (const notifId of currentState.notificationIds) {
      try {
        await Notifications.cancelScheduledNotificationAsync(notifId);
      } catch (_) {}
    }
    await saveFestivalReminderState(festivalId, null);
    return false;
  }

  const notificationIds = await scheduleNotificationsForFestival(festival);

  if (notificationIds.length === 0) {
    throw new Error('Reminder times have already passed for this festival.');
  }

  await saveFestivalReminderState(festivalId, {
    enabled: true,
    festivalDate: festival.date,
    notificationIds
  });

  return true;
}

export async function syncFestivalReminders(festivals: any[]) {
  if (Platform.OS === 'web') return;
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') return;

    const data = await AsyncStorage.getItem(STORAGE_KEY);
    const reminders = data ? JSON.parse(data) : {};
    let changed = false;
    const now = new Date();

    for (const festival of festivals) {
      const festivalId = festival.id || festival.name || festival.festival_name;
      if (!festivalId || !festival.date) continue;

      const festDateStr = festival.date;
      const festivalDate = new Date(`${festDateStr}T00:00:00`);
      if (isNaN(festivalDate.getTime())) continue;

      // Skip past festivals (for Navratri, festival spans 9 days)
      const isNav = (festivalId || '').toLowerCase().includes('navratri') || (festival.name || festival.festival_name || '').toLowerCase().includes('navratri');
      const festivalEnd = new Date(festivalDate.getTime() + (isNav ? 9 * 24 * 60 * 60 * 1000 : 0));
      festivalEnd.setHours(23, 59, 59, 999);
      if (now > festivalEnd) {
        if (reminders[festivalId]) {
          delete reminders[festivalId];
          changed = true;
        }
        continue;
      }

      const existing = reminders[festivalId];
      if (!existing || existing.festivalDate !== festDateStr) {
        if (existing?.notificationIds) {
          for (const notifId of existing.notificationIds) {
            try { await Notifications.cancelScheduledNotificationAsync(notifId); } catch (_) {}
          }
        }
        const notificationIds = await scheduleNotificationsForFestival(festival);
        if (notificationIds.length > 0) {
          reminders[festivalId] = {
            enabled: true,
            festivalDate: festDateStr,
            notificationIds
          };
          changed = true;
        }
      }
    }

    if (changed) {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(reminders));
    }
  } catch (e) {
    console.error('Error syncing festival reminders', e);
  }
}

export async function toggleAllFestivals(
  festivals: any[],
  enableAll: boolean
): Promise<void> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    throw new Error('Permission not granted');
  }

  const allReminders = await getAllFestivalReminders();

  if (!enableAll) {
    for (const key in allReminders) {
      for (const notifId of allReminders[key].notificationIds) {
        try { await Notifications.cancelScheduledNotificationAsync(notifId); } catch (_) {}
      }
    }
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({}));
    return;
  }

  let changed = false;

  for (const festival of festivals) {
    const festivalId = festival.id || festival.name || festival.festival_name;
    if (!festivalId) continue;

    const notificationIds = await scheduleNotificationsForFestival(festival);
    if (notificationIds.length > 0) {
      allReminders[festivalId] = {
        enabled: true,
        festivalDate: festival.date,
        notificationIds
      };
      changed = true;
    }
  }

  if (changed) {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(allReminders));
  }
}

