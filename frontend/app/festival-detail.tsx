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
import { CustomLoader } from '../src/components/CustomLoader';
import { toggleFestivalReminder, getFestivalReminderState } from '../src/utils/festivalReminders';

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
          const festivalId = selected.id || selected.name || selected.festival_name;
          const reminderState = await getFestivalReminderState(festivalId);
          setReminderEnabled(!!reminderState?.enabled);
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
      const enabled = await toggleFestivalReminder(festival);
      setReminderEnabled(enabled);

      if (enabled) {
        Alert.alert('Reminder Set', 'You will be notified 1 day before the festival at 9:00 AM and 9:00 PM local time.');
      } else {
        Alert.alert('Reminder Removed', 'Notifications for this festival have been cancelled.');
      }
    } catch (err: any) {
      console.warn('Failed to toggle reminder', err);
      if (err.message === 'Permission not granted') {
        Alert.alert('Permission Required', 'Please enable notifications in your device settings.');
      } else if (err.message === 'Reminder times have already passed for this festival.') {
        Alert.alert('Too Late', 'Reminder times for this festival have already passed.');
      } else {
        Alert.alert('Error', 'Could not schedule notification.');
      }
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <CustomLoader size={70} message="Loading Festival..." />
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
