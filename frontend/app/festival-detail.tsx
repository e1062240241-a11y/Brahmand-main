// accessibility: placeholder
import React, { useEffect, useState } from 'react';
import { View, ScrollView, ActivityIndicator, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { COLORS, SPACING } from '../src/constants/theme';
import { getFestivalList } from '../src/services/api';
import FestivalDetailCard from '../src/components/FestivalDetailCard';

const FestivalDetailPage = () => {
  const params = useLocalSearchParams();
  const router = useRouter();
  const festivalIndex = Number(params?.index ?? params?.festivalIndex ?? -1);
  const [festival, setFestival] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reminderEnabled, setReminderEnabled] = useState(false);

  useEffect(() => {
    const loadFestival = async () => {
      if (Number.isNaN(festivalIndex) || festivalIndex < 0) {
        setError('Festival not found.');
        setLoading(false);
        return;
      }

      try {
        const response = await getFestivalList();
        const items = response.data || [];
        const selected = items[festivalIndex];
        if (!selected) {
          setError('Festival not found.');
        } else {
          setFestival(selected);
        }
      } catch (err) {
        console.warn('Failed to load festival details', err);
        setError('Unable to load festival details.');
      } finally {
        setLoading(false);
      }
    };

    loadFestival();
  }, [festivalIndex]);

  const handleToggleReminder = async () => {
    if (!festival) return;

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        Alert.alert('Permission required', 'Please enable notifications in settings to set reminders.');
        return;
      }

      const enabled = !reminderEnabled;
      setReminderEnabled(enabled);

      if (enabled) {
        // Calculate reminder time: 1 day (24 hours) before the festival at 9:00 AM local time
        const festDateStr = festival.date; // format: "YYYY-MM-DD"
        const festivalDate = new Date(`${festDateStr}T09:00:00`);
        const triggerDate = new Date(festivalDate.getTime() - 24 * 60 * 60 * 1000);
        
        const now = new Date();
        let triggerInput: any;
        let alertMessage = `You will be notified 1 day before the festival at 9:00 AM!`;

        if (triggerDate.getTime() <= now.getTime()) {
          // Fallback: If the festival is in less than 24 hours (or today), trigger reminder in 5 seconds
          triggerInput = {
            seconds: 5,
            channelId: 'default',
          };
          alertMessage = `Since the festival is tomorrow or today, you will receive a test notification in 5 seconds!`;
        } else {
          triggerInput = {
            date: triggerDate,
            channelId: 'default',
          };
        }

        await Notifications.scheduleNotificationAsync({
          content: {
            title: `🪔 Festival Tomorrow: ${festival.name || festival.festival_name}`,
            body: `Get ready! ${festival.name || festival.festival_name} begins in 24 hours.`,
            sound: 'bell.mp3',
            priority: Notifications.AndroidNotificationPriority.HIGH,
          },
          trigger: triggerInput,
        });
        
        Alert.alert('Reminder Set', alertMessage);
      } else {
        await Notifications.cancelAllScheduledNotificationsAsync();
        Alert.alert('Reminder Removed', 'Notification for this festival has been cancelled.');
      }
    } catch (err) {
      console.warn('Failed to set reminder', err);
      Alert.alert('Error', 'Could not schedule notification.');
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (error || !festival) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error || 'Something went wrong.'}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/festivals');
            }
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={28} color="#000000" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.notificationButton} 
          onPress={handleToggleReminder}
        >
          <Ionicons 
            name={reminderEnabled ? "notifications" : "notifications-outline"} 
            size={22} 
            color={reminderEnabled ? COLORS.primary : "#000000"} 
          />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.container}>
        <FestivalDetailCard
          festival={{ ...festival, reminderEnabled, onToggleReminder: handleToggleReminder }}
          onBack={() => router.back()}
          onGuidePress={(section: any) =>
            router.push(
              `/festival-section-detail?index=${festivalIndex}&section=${encodeURIComponent(section)}`
            )
          }
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: SPACING.xl,
    backgroundColor: COLORS.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: SPACING.md,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 14,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    padding: SPACING.xs,
  },
  notificationButton: {
    padding: SPACING.xs,
  },
});

export default FestivalDetailPage;
