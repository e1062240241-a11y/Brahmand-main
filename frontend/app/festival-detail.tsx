import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../src/constants/theme';
import { getFestivalList } from '../src/services/api';
import FestivalDetailCard from '../src/components/FestivalDetailCard';
import { CustomLoader } from '../src/components/CustomLoader';
import { toggleFestivalReminder, getFestivalReminderState } from '../src/utils/festivalReminders';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface FestivalRawItem {
  id?: string;
  name?: string;
  festival_name?: string;
  name_hi?: string;
  title?: string;
  date?: string;
  summary?: string;
  story?: string;
  deity?: string;
  image?: string | number;
  image_url?: string | number;
  photo?: string;
  imageUrl?: string;
  [key: string]: unknown;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const FestivalDetailPage: React.FC = () => {
  const params = useLocalSearchParams<{ index?: string; festivalIndex?: string }>();
  const router = useRouter();
  const festivalIndex = Number(params?.index ?? params?.festivalIndex ?? -1);

  const [festival, setFestival] = useState<FestivalRawItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [reminderEnabled, setReminderEnabled] = useState<boolean>(false);

  const isMountedRef = useRef<boolean>(true);

  // Load selected festival details on mount / param change
  useEffect(() => {
    isMountedRef.current = true;

    const loadFestival = async () => {
      if (Number.isNaN(festivalIndex) || festivalIndex < 0) {
        if (isMountedRef.current) {
          setError('Festival not found.');
          setLoading(false);
        }
        return;
      }

      try {
        const response = await getFestivalList();
        const items: FestivalRawItem[] = response?.data || response || [];
        const selected = items[festivalIndex];

        if (!selected) {
          if (isMountedRef.current) {
            setError('Festival not found.');
          }
        } else {
          const festivalId = selected.id || selected.name || selected.festival_name || '';
          const reminderState = await getFestivalReminderState(festivalId);

          if (isMountedRef.current) {
            setFestival(selected);
            setReminderEnabled(!!reminderState?.enabled);
          }
        }
      } catch (err) {
        console.warn('Failed to load festival details', err);
        if (isMountedRef.current) {
          setError('Unable to load festival details.');
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    };

    loadFestival();

    return () => {
      isMountedRef.current = false;
    };
  }, [festivalIndex]);

  // Handler for toggling notifications
  const handleToggleReminder = useCallback(async () => {
    if (!festival) return;

    try {
      const enabled = await toggleFestivalReminder(festival as { id?: string; name?: string; festival_name?: string; date: string });
      if (isMountedRef.current) {
        setReminderEnabled(enabled);
      }

      if (enabled) {
        Alert.alert(
          'Reminder Set',
          'You will be notified 1 day before the festival at 9:00 AM and 9:00 PM local time.'
        );
      } else {
        Alert.alert('Reminder Removed', 'Notifications for this festival have been cancelled.');
      }
    } catch (err) {
      console.warn('Failed to toggle reminder', err);
      const errorMsg = err instanceof Error ? err.message : '';
      if (errorMsg === 'Permission not granted') {
        Alert.alert('Permission Required', 'Please enable notifications in your device settings.');
      } else if (errorMsg === 'Reminder times have already passed for this festival.') {
        Alert.alert('Too Late', 'Reminder times for this festival have already passed.');
      } else {
        Alert.alert('Error', 'Could not schedule notification.');
      }
    }
  }, [festival]);

  const handleBackPress = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/festivals');
    }
  }, [router]);

  const handleGuidePress = useCallback(
    (section: string) => {
      router.push(
        `/festival-section-detail?index=${festivalIndex}&section=${encodeURIComponent(section)}`
      );
    },
    [router, festivalIndex]
  );

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
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBackPress}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={28} color="#000000" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.notificationButton}
          onPress={handleToggleReminder}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={reminderEnabled ? 'Disable festival reminder' : 'Set festival reminder'}
        >
          <Ionicons
            name={reminderEnabled ? 'notifications' : 'notifications-outline'}
            size={22}
            color={reminderEnabled ? COLORS.primary : '#000000'}
          />
        </TouchableOpacity>
      </View>

      {/* Main Festival Detail Card */}
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <FestivalDetailCard
          festival={{ ...festival, reminderEnabled, onToggleReminder: handleToggleReminder }}
          onBack={handleBackPress}
          onGuidePress={handleGuidePress}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

// ============================================================================
// STYLESHEET
// ============================================================================

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
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


