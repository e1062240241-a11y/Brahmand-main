import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const isExpoGo = Constants.appOwnership === 'expo' || Constants.appOwnership === 'guest';

const STORAGE_KEY = '@festival_reminders';

interface ReminderState {
  enabled: boolean;
  festivalDate: string;
  notificationIds: string[];
}

export async function getFestivalReminderState(festivalId: string): Promise<ReminderState | null> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (!data) return null;
    const reminders = JSON.parse(data);
    return reminders[festivalId] || null;
  } catch (e) {
    console.error('Error reading festival reminder state', e);
    return null;
  }
}

export async function getAllFestivalReminders(): Promise<Record<string, ReminderState>> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (!data) return {};
    return JSON.parse(data);
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
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(reminders));
  } catch (e) {
    console.error('Error saving festival reminder state', e);
  }
}

async function scheduleLocalNotif(title: string, body: string, data: any, triggerDate: Date): Promise<string | null> {
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
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
        channelId: 'default_v4',
      } as any,
    });
  } catch (e) {
    console.warn('Failed to schedule local notification', e);
    return null;
  }
}

export async function toggleFestivalReminder(
  festival: { id?: string; name?: string; festival_name?: string; date: string }
): Promise<boolean> {
  const festivalId = festival.id || festival.name || festival.festival_name;
  if (!festivalId) return false;

  const festivalName = festival.name || festival.festival_name || 'Festival';

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
      await Notifications.cancelScheduledNotificationAsync(notifId);
    }
    await saveFestivalReminderState(festivalId, null);
    return false;
  }

  const festDateStr = festival.date;
  const festivalDate = new Date(`${festDateStr}T00:00:00`);
  if (isNaN(festivalDate.getTime())) {
    throw new Error('Invalid festival date');
  }

  const oneDayBefore = new Date(festivalDate.getTime() - 24 * 60 * 60 * 1000);
  
  const reminder9AM = new Date(oneDayBefore);
  reminder9AM.setHours(9, 0, 0, 0);

  const reminder9PM = new Date(oneDayBefore);
  reminder9PM.setHours(21, 0, 0, 0);

  const now = new Date();
  const notificationIds: string[] = [];
  const title = `🪔 Tomorrow: ${festivalName}`;
  const body = `Get ready! ${festivalName} begins tomorrow.`;
  const notificationData = { type: 'festival_reminder', festivalId };

  if (reminder9AM > now) {
    const id = await scheduleLocalNotif(title, body, notificationData, reminder9AM);
    if (id) notificationIds.push(id);
  }

  if (reminder9PM > now) {
    const id = await scheduleLocalNotif(title, body, notificationData, reminder9PM);
    if (id) notificationIds.push(id);
  }

  if (notificationIds.length === 0) {
    throw new Error('Reminder times have already passed for this festival.');
  }

  await saveFestivalReminderState(festivalId, {
    enabled: true,
    festivalDate: festDateStr,
    notificationIds
  });

  return true;
}

export async function syncFestivalReminders(festivals: any[]) {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (!data) return;
    const reminders = JSON.parse(data);
    let changed = false;

    for (const festival of festivals) {
      const festivalId = festival.id || festival.name || festival.festival_name;
      if (!festivalId || !reminders[festivalId]) continue;

      const state = reminders[festivalId];
      if (state.festivalDate !== festival.date) {
        for (const notifId of state.notificationIds) {
          await Notifications.cancelScheduledNotificationAsync(notifId);
        }
        
        const festDateStr = festival.date;
        const festivalDate = new Date(`${festDateStr}T00:00:00`);
        if (isNaN(festivalDate.getTime())) {
          delete reminders[festivalId];
          changed = true;
          continue;
        }

        const oneDayBefore = new Date(festivalDate.getTime() - 24 * 60 * 60 * 1000);
        const reminder9AM = new Date(oneDayBefore);
        reminder9AM.setHours(9, 0, 0, 0);
        const reminder9PM = new Date(oneDayBefore);
        reminder9PM.setHours(21, 0, 0, 0);

        const now = new Date();
        const notificationIds: string[] = [];
        const festivalName = festival.name || festival.festival_name || 'Festival';
        const title = `🪔 Tomorrow: ${festivalName}`;
        const body = `Get ready! ${festivalName} begins tomorrow.`;
        const notificationData = { type: 'festival_reminder', festivalId };

        if (reminder9AM > now) {
          const id = await scheduleLocalNotif(title, body, notificationData, reminder9AM);
          if (id) notificationIds.push(id);
        }
        if (reminder9PM > now) {
          const id = await scheduleLocalNotif(title, body, notificationData, reminder9PM);
          if (id) notificationIds.push(id);
        }

        if (notificationIds.length === 0) {
          delete reminders[festivalId];
        } else {
          reminders[festivalId] = {
            enabled: true,
            festivalDate: festDateStr,
            notificationIds
          };
        }
        changed = true;
      } else {
         const festivalDate = new Date(`${state.festivalDate}T00:00:00`);
         if (festivalDate.getTime() < Date.now() - 48 * 60 * 60 * 1000) { 
            delete reminders[festivalId];
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
    // Cancel all
    for (const key in allReminders) {
      for (const notifId of allReminders[key].notificationIds) {
        await Notifications.cancelScheduledNotificationAsync(notifId);
      }
    }
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({}));
    return;
  }

  // Enable all upcoming
  let changed = false;
  const now = new Date();

  for (const festival of festivals) {
    const festivalId = festival.id || festival.name || festival.festival_name;
    if (!festivalId) continue;

    const festDateStr = festival.date;
    const festivalDate = new Date(`${festDateStr}T00:00:00`);
    if (isNaN(festivalDate.getTime())) continue;

    const oneDayBefore = new Date(festivalDate.getTime() - 24 * 60 * 60 * 1000);
    const reminder9AM = new Date(oneDayBefore);
    reminder9AM.setHours(9, 0, 0, 0);
    const reminder9PM = new Date(oneDayBefore);
    reminder9PM.setHours(21, 0, 0, 0);

    // Skip if already passed
    if (reminder9PM <= now) continue;

    // Skip if already enabled with correct date
    if (allReminders[festivalId] && allReminders[festivalId].festivalDate === festDateStr) {
      continue;
    }

    // Cancel old ones if date changed
    if (allReminders[festivalId]) {
      for (const notifId of allReminders[festivalId].notificationIds) {
        await Notifications.cancelScheduledNotificationAsync(notifId);
      }
    }

    const notificationIds: string[] = [];
    const festivalName = festival.name || festival.festival_name || 'Festival';
    const title = `🪔 Tomorrow: ${festivalName}`;
    const body = `Get ready! ${festivalName} begins tomorrow.`;
    const notificationData = { type: 'festival_reminder', festivalId };

    if (reminder9AM > now) {
      const id = await scheduleLocalNotif(title, body, notificationData, reminder9AM);
      if (id) notificationIds.push(id);
    }
    if (reminder9PM > now) {
      const id = await scheduleLocalNotif(title, body, notificationData, reminder9PM);
      if (id) notificationIds.push(id);
    }

    if (notificationIds.length > 0) {
      allReminders[festivalId] = {
        enabled: true,
        festivalDate: festDateStr,
        notificationIds
      };
      changed = true;
    }
  }

  if (changed) {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(allReminders));
  }
}

