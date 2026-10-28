import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONTS } from '../src/constants/theme';
import { getFestivalList } from '../src/services/api';
import FestivalDetailCard from '../src/components/FestivalDetailCard';
import { CustomLoader } from '../src/components/CustomLoader';
import { toggleFestivalReminder, getFestivalReminderState } from '../src/utils/festivalReminders';
import { shareFestivalStoryPdf } from '../src/utils/generateFestivalStoryPdf';
import * as Haptics from 'expo-haptics';

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
  const params = useLocalSearchParams<{ index?: string; festivalIndex?: string; id?: string; name?: string }>();
  const router = useRouter();
  const rawIndex = params?.index ?? params?.festivalIndex;
  const festivalIndex = rawIndex !== undefined && rawIndex !== '' ? Number(rawIndex) : -1;
  const targetId = params?.id ? decodeURIComponent(params.id).trim() : '';
  const targetName = params?.name ? decodeURIComponent(params.name).trim() : '';

  const [festival, setFestival] = useState<FestivalRawItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [reminderEnabled, setReminderEnabled] = useState<boolean>(false);
  const [isSharingPdf, setIsSharingPdf] = useState<boolean>(false);

  const isMountedRef = useRef<boolean>(true);

  // Load selected festival details on mount / param change / refresh
  const loadFestival = useCallback(async (forceRefresh = false) => {
    try {
      if (!forceRefresh) {
        setLoading(true);
      }
      setError(null);
      const response = await getFestivalList(forceRefresh);
      const items: FestivalRawItem[] = response?.data || response || [];

      let selected: FestivalRawItem | undefined;

      // 1. Primary lookup: Exact ID match
      if (targetId) {
        selected = items.find((f) => f.id && String(f.id).trim().toLowerCase() === targetId.toLowerCase());
      }

      // 2. Secondary lookup: Cleaned Name match
      if (!selected && targetName) {
        const cleanTarget = targetName.toLowerCase().replace(/[^a-z0-9]/g, '').replace(/w/g, 'v');
        selected = items.find((f) => {
          const fName = (f.festival_name || f.name || f.title || '').toLowerCase().replace(/[^a-z0-9]/g, '').replace(/w/g, 'v');
          return fName && (fName === cleanTarget || fName.includes(cleanTarget) || cleanTarget.includes(fName));
        });

        if (!selected && (cleanTarget.includes('karva') || cleanTarget.includes('karwa'))) {
          selected = items.find((f) => {
            const fName = (f.festival_name || f.name || f.title || '').toLowerCase();
            return fName.includes('karva') || fName.includes('karwa');
          });
        }
      }

      // 3. Fallback: If no match yet and index is valid, match against date-sorted upcoming list (matching festivals.tsx order)
      if (!selected && !Number.isNaN(festivalIndex) && festivalIndex >= 0) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const upcoming = items.filter((f) => {
          if (!f.date) return true;
          return new Date(f.date) >= today;
        });

        const sorted = upcoming.sort(
          (a, b) => new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime()
        );

        const sortedList = sorted.length > 0 ? sorted : items;
        selected = sortedList[festivalIndex] || items[festivalIndex];
      }

      // 4. Safe recovery fallback: If still not matched, pick first available festival instead of failing with not found
      if (!selected && items.length > 0) {
        selected = items[0];
      }

      if (!selected) {
        if (isMountedRef.current) {
          setError('Festival not found.');
        }
      } else {
        const festivalId = selected.id || selected.name || selected.festival_name || '';
        const reminderState = await getFestivalReminderState(festivalId);

        if (isMountedRef.current) {
          setFestival(selected);
          setError(null);
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
        setRefreshing(false);
      }
    }
  }, [festivalIndex, targetId, targetName]);

  useEffect(() => {
    isMountedRef.current = true;
    loadFestival();

    return () => {
      isMountedRef.current = false;
    };
  }, [loadFestival]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadFestival(true);
  }, [loadFestival]);

  // Handler for toggling notifications
  const handleToggleReminder = useCallback(async () => {
    if (!festival) return;

    try {
      const enabled = await toggleFestivalReminder(festival as { id?: string; name?: string; festival_name?: string; date: string });
      if (isMountedRef.current) {
        setReminderEnabled(enabled);
      }

      if (enabled) {
        const isDussehra =
          targetId.toLowerCase().includes('dussehra') ||
          targetName.toLowerCase().includes('dussehra') ||
          targetName.toLowerCase().includes('vijaya') ||
          (festival?.festival_name || '').toLowerCase().includes('dussehra');

        if (isDussehra) {
          Alert.alert(
            '🌿 विजयादशमी व शमी पत्र रिमाइंडर सेट!',
            'आपको विजयादशमी की पूर्व संध्या और पावन पर्व पर "सोनं घ्या, सोन्यासारखे राहा!" सुवर्ण शमी पत्र साझा करने की सूचना मिलेगी।'
          );
        } else {
          Alert.alert(
            'Reminder Set',
            'You will be notified 1 day before the festival at 9:00 AM and 9:00 PM local time.'
          );
        }
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
      const festId = festival?.id ? String(festival.id) : targetId;
      const festName = festival?.festival_name || festival?.name || festival?.title || targetName;
      router.push(
        `/festival-section-detail?index=${festivalIndex}&id=${encodeURIComponent(festId)}&name=${encodeURIComponent(festName)}&section=${encodeURIComponent(section)}`
      );
    },
    [router, festivalIndex, festival, targetId, targetName]
  );

  const handleSharePdf = useCallback(async () => {
    if (!festival || isSharingPdf) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      setIsSharingPdf(true);
      await shareFestivalStoryPdf(festival);
    } catch (e) {
      console.warn('Failed to share festival PDF:', e);
    } finally {
      setIsSharingPdf(false);
    }
  }, [festival, isSharingPdf]);

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
        <Text style={styles.errorText}>{error || 'Festival not found.'}</Text>
        <View style={styles.errorActions}>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => loadFestival(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.retryButton, styles.backBtnSecondary]}
            onPress={handleBackPress}
            activeOpacity={0.8}
          >
            <Text style={[styles.retryButtonText, { color: '#1A1A1A' }]}>Back to Festivals</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const festivalTitle = festival.festival_name || festival.name || festival.title || 'Festival Details';

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

        <Text style={styles.headerTitle} numberOfLines={1}>
          {festivalTitle}
        </Text>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerActionBtn}
            onPress={handleSharePdf}
            disabled={isSharingPdf}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Share complete festival booklet"
          >
            {isSharingPdf ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <Ionicons name="share-social-outline" size={22} color="#000000" />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerActionBtn}
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
      </View>

      {/* Main Festival Detail Card */}
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      >
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
  errorActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  retryButton: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    backgroundColor: COLORS.primary || '#FF6F00',
    borderRadius: 8,
  },
  backBtnSecondary: {
    backgroundColor: '#E5E7EB',
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
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
  headerTitle: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    flex: 1,
    marginHorizontal: 8,
  },
  backButton: {
    padding: SPACING.xs,
    width: 40,
    alignItems: 'flex-start',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerActionBtn: {
    padding: SPACING.xs,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 32,
    minHeight: 32,
  },
  notificationButton: {
    padding: SPACING.xs,
    width: 40,
    alignItems: 'flex-end',
  },
});

export default FestivalDetailPage;


