import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';

import { FestivalOpeningOverlay } from '../src/components/festival/FestivalOpeningOverlay';
import { StaggeredFestivalContent } from '../src/components/festival/StaggeredFestivalContent';
import { FestivalData } from '../src/types/festival';
import { getFestivalTheme } from '../src/constants/festivalThemes';
import { getFestivalList } from '../src/services/api';
import { getFestivalImage } from '../src/constants/festivalImages';
import { toggleFestivalReminder, getFestivalReminderState } from '../src/utils/festivalReminders';
import { shareFestivalCard } from '../src/utils/shareFestivalCard';
import { COLORS, SPACING, FONTS } from '../src/constants/theme';
import { CustomLoader } from '../src/components/CustomLoader';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const FestivalScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  const [festivalData, setFestivalData] = useState<FestivalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isHandoffStarted, setIsHandoffStarted] = useState(false);
  const [isIntroComplete, setIsIntroComplete] = useState(false);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  // Load festival data based on params (index, id, or query name)
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const response = await getFestivalList();
        const items = response.data || [];
        const index = Number(params.index ?? params.festivalIndex ?? 0);
        const selected = items[index] || items[0] || {};

        const name = (params.name as string) || selected.festival_name || selected.name || 'Maha Shivratri';
        const theme = getFestivalTheme(name);
        const imageAsset = getFestivalImage(selected);

        const constructedData: FestivalData = {
          id: selected.id || name,
          name,
          nameHi: (params.nameHi as string) || theme.nameHi || selected.name_hi,
          date: (params.date as string) || selected.date || '2026-08-15',
          description: selected.summary || selected.story || 'Sacred Vedic Festival of Devotion and Celebration.',
          gradientColors: theme.gradientColors,
          emblem: imageAsset || theme.emblem,
          emblemType: imageAsset ? 'image' : 'symbol',
          deity: selected.deity || theme.deity,
          shubhMuhurat: '06:14 AM – 09:22 AM (Brahma Muhurta)',
          aartiSchedule: [
            { id: '1', name: 'Mangala Aarti & Abhishek', time: '05:30 AM', priest: 'Acharya Vidyadhar' },
            { id: '2', name: 'Maha Bhog & Darshan', time: '12:15 PM', priest: 'Head Pujari' },
            { id: '3', name: 'Sandhya Maha Aarti', time: '07:00 PM', priest: 'Devotee Sangha', isImportant: true },
            { id: '4', name: 'Shayan Aarti', time: '09:30 PM', priest: 'Temple Ashram' },
          ],
          kathaStatus: {
            isLive: true,
            title: `${name} Mahatmya & Katha Paath`,
            speaker: 'Pujya Swami Anand Giri Ji Maharaj',
            currentChapter: 'Adhyay 3: Divine Manifestation',
            listenersCount: 1420,
          },
          communityEvents: [
            {
              id: 'ev-1',
              title: 'Grand Community Bhandara & Maha Prasad',
              time: '01:00 PM',
              location: 'Temple Annakshetra Hall',
              attendeesCount: 520,
            },
            {
              id: 'ev-2',
              title: 'Devotional Bhajan & Kirtan Sandhya',
              time: '06:30 PM',
              location: 'Main Temple Courtyard',
              attendeesCount: 310,
            },
          ],
        };

        if (isMounted) {
          setFestivalData(constructedData);
          const reminderState = await getFestivalReminderState(constructedData.id);
          setReminderEnabled(!!reminderState?.enabled);
          setLoading(false);
        }
      } catch (e) {
        console.warn('Failed to load festival data', e);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [params]);

  const handleHandoffStart = useCallback(() => {
    setIsHandoffStarted(true);
  }, []);

  const handleAnimationComplete = useCallback(() => {
    setIsHandoffStarted(true);
    setIsIntroComplete(true);
  }, []);

  const handleShare = async () => {
    if (!festivalData || isSharing) return;
    try {
      setIsSharing(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      await shareFestivalCard(null, festivalData.name);
    } catch (e) {
      console.warn('Share error', e);
    } finally {
      setIsSharing(false);
    }
  };

  const handleToggleReminder = async () => {
    if (!festivalData) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      const enabled = await toggleFestivalReminder(festivalData);
      setReminderEnabled(enabled);
      if (enabled) {
        Alert.alert('Reminder Set', `You will receive timely reminders before ${festivalData.name}.`);
      } else {
        Alert.alert('Reminder Cancelled', `Notifications for ${festivalData.name} have been disabled.`);
      }
    } catch (e: any) {
      Alert.alert('Reminder Notification', 'Could not update reminder state.');
    }
  };

  if (loading || !festivalData) {
    return (
      <View style={styles.loadingContainer}>
        <CustomLoader size={70} message="Preparing Festival Celebration..." />
      </View>
    );
  }

  const primaryGradient = festivalData.gradientColors || ['#FF6600', '#E53935', '#8E24AA'];

  return (
    <View style={styles.rootContainer}>
      {/* 1. Google Gemini-style Opening Animation Overlay (UI thread driven) */}
      <FestivalOpeningOverlay
        festival={festivalData}
        onHandoffStart={handleHandoffStart}
        onAnimationComplete={handleAnimationComplete}
      />

      {/* 2. Main Page Content (Header + Stagger Cascading Cards) */}
      <SafeAreaView style={styles.pageSafeArea} edges={['top']}>
        {/* Themed Navigation Bar Header */}
        <LinearGradient
          colors={primaryGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.headerGradient}
        >
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace('/');
                }
              }}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="chevron-back" size={26} color="#FFFFFF" />
            </TouchableOpacity>

            {/* Header Emblem target slot */}
            <View style={styles.headerEmblemContainer}>
              {typeof festivalData.emblem === 'string' && !festivalData.emblem.startsWith('http') ? (
                <Text style={styles.headerGlyph}>{festivalData.emblem}</Text>
              ) : (
                <Image
                  source={festivalData.emblem}
                  style={styles.headerImage}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                />
              )}
            </View>

            <View style={styles.headerTitleGroup}>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {festivalData.name}
              </Text>
              <Text style={styles.headerSubTitle} numberOfLines={1}>
                {festivalData.deity || 'Vedic Celebration'}
              </Text>
            </View>

            {/* Actions: Share & Reminder */}
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.actionIconBtn}
                onPress={handleShare}
                disabled={isSharing}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Share festival details"
              >
                {isSharing ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons name="share-social-outline" size={20} color="#FFFFFF" />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionIconBtn}
                onPress={handleToggleReminder}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={reminderEnabled ? "Disable reminder" : "Set festival reminder"}
              >
                <Ionicons
                  name={reminderEnabled ? 'notifications' : 'notifications-outline'}
                  size={21}
                  color={reminderEnabled ? '#FFD700' : '#FFFFFF'}
                />
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>

        {/* Scrollable Stagger Cascading Sections */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Banner Intro */}
          <View style={styles.introCard}>
            <Text style={styles.introDescription}>{festivalData.description}</Text>
          </View>

          {/* Staggered Content Sections (Countdown → Aarti → Katha → Community Events) */}
          <StaggeredFestivalContent
            festival={festivalData}
            isHandoffStarted={isHandoffStarted}
            onEventPress={(eventId) => {
              Alert.alert('Community Event', 'You have expressed interest in attending this community event.');
            }}
            onAartiReminderPress={(aartiId) => {
              Alert.alert('Aarti Reminder', 'A notification reminder has been scheduled for this Aarti.');
            }}
            onJoinKathaPress={() => {
              router.push('/shravan-paath');
            }}
          />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#FFF8F0',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF8F0',
  },
  pageSafeArea: {
    flex: 1,
  },
  headerGradient: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: SPACING.xs,
    marginRight: 8,
  },
  headerEmblemContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginRight: 10,
  },
  headerImage: {
    width: '100%',
    height: '100%',
  },
  headerGlyph: {
    fontSize: 22,
  },
  headerTitleGroup: {
    flex: 1,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  headerSubTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 14,
    paddingBottom: 40,
  },
  introCard: {
    marginHorizontal: SPACING.md,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.25)',
  },
  introDescription: {
    fontSize: 14,
    lineHeight: 22,
    color: '#4A3E3D',
    fontWeight: '500',
  },
});

export default FestivalScreen;
