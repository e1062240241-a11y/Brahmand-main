// accessibility: placeholder
import React, { useEffect, useState, useRef } from 'react';
import { View, ScrollView, Text, StyleSheet, Alert, TouchableOpacity, Share, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { COLORS, SPACING } from '../src/constants/theme';
import { getFestivalList } from '../src/services/api';
import FestivalDetailCard from '../src/components/FestivalDetailCard';
import { FestivalMasterCatalogCard } from '../src/components/FestivalMasterCatalogCard';
import { CustomLoader } from '../src/components/CustomLoader';
import { toggleFestivalReminder, getFestivalReminderState } from '../src/utils/festivalReminders';

// Safe dynamic helper so missing native binaries in older dev builds never break route registration or crash the app
const safeCaptureRef = async (ref: any, options: any): Promise<string | null> => {
  try {
    const ViewShot = require('react-native-view-shot');
    const capture = ViewShot?.captureRef || ViewShot?.default?.captureRef || ViewShot;
    if (typeof capture === 'function') {
      return await capture(ref, options);
    }
  } catch (e) {
    console.log('[FestivalDetail] Native ViewShot not available in current build:', e);
  }
  return null;
};

const safeShareFile = async (uri: string, options: any): Promise<boolean> => {
  try {
    const Sharing = require('expo-sharing');
    if (Sharing && typeof Sharing.isAvailableAsync === 'function') {
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri, options);
        return true;
      }
    }
  } catch (e) {
    console.log('[FestivalDetail] expo-sharing not available:', e);
  }
  return false;
};

const FestivalDetailPage = () => {
  const params = useLocalSearchParams();
  const router = useRouter();
  const festivalIndex = Number(params?.index ?? params?.festivalIndex ?? -1);
  const [festival, setFestival] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const catalogRef = useRef<View>(null);

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

  const handleShare = async () => {
    if (!festival || isSharing) return;

    try {
      setIsSharing(true);
      const festivalName = festival.festival_name || festival.name || festival.title || 'Festival';

      if (catalogRef.current) {
        const uri = await safeCaptureRef(catalogRef, {
          format: 'png',
          quality: 1.0,
          result: 'tmpfile',
        });

        if (uri) {
          const shared = await safeShareFile(uri, {
            mimeType: 'image/png',
            dialogTitle: `Share ${festivalName} Full Guide`,
            UTI: 'public.png',
          });
          if (shared) return;
        }
      }

      // Built-in Native Text Share Fallback (works 100% on any build with zero modules)
      const date = festival.date ? `📅 Date: ${festival.date}` : '';
      const deity = festival.deity || festival.deity_name ? `🌸 Deity: ${festival.deity || festival.deity_name}` : '';
      const summary = festival.summary || festival.story || festival.importance || '';
      const shareContent = [
        `🪔 *${festivalName}* 🪔`,
        date,
        deity,
        summary ? `\n📖 *About Festival:*\n${summary}` : '',
        '\n━━━━━━━━━━━━━━━━━━━━━',
        '🕉️ *Shared via Brahmand App*',
        '🌿 _Your Gateway to Sanatan Heritage & Festivals_',
        '━━━━━━━━━━━━━━━━━━━━━',
      ].filter(Boolean).join('\n');

      await Share.share({
        message: shareContent,
        title: festivalName,
      });
    } catch (err) {
      console.warn('Failed to share festival catalog image', err);
    } finally {
      setIsSharing(false);
    }
  };

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
      {/* Hidden Full Festival Catalog for HD Poster Capture */}
      <View
        style={{
          position: 'absolute',
          top: -99999,
          left: -99999,
          opacity: 0,
        }}
        pointerEvents="none"
      >
        <View ref={catalogRef} collapsable={false}>
          <FestivalMasterCatalogCard festival={festival} />
        </View>
      </View>

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
          style={styles.shareButton} 
          onPress={handleShare}
          activeOpacity={0.7}
          disabled={isSharing}
        >
          {isSharing ? (
            <ActivityIndicator size="small" color="#000000" />
          ) : (
            <Ionicons name="share-social-outline" size={20} color="#000000" />
          )}
          <Text style={styles.shareButtonText}>{isSharing ? 'Sharing...' : 'Share'}</Text>
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

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <FestivalDetailCard
          festival={{ ...festival, reminderEnabled, onToggleReminder: handleToggleReminder }}
          onBack={() => router.back()}
          onGuidePress={(section: any) =>
            router.push(
              `/festival-section-detail?index=${festivalIndex}&section=${encodeURIComponent(section)}`
            )
          }
        />

        {/* Brahmand App Watermark Branding Banner */}
        <View style={styles.watermarkContainer}>
          <View style={styles.watermarkLine} />
          <View style={styles.watermarkContent}>
            <View style={styles.watermarkLogoRow}>
              <View style={styles.watermarkIconBadge}>
                <Text style={styles.watermarkOm}>🕉</Text>
              </View>
              <View>
                <Text style={styles.watermarkTitle}>Brahmand App</Text>
                <Text style={styles.watermarkSubtitle}>Your Gateway to Sanatan Heritage</Text>
              </View>
            </View>
            <Text style={styles.watermarkTagline}>ब्रह्माण्ड • Discover Divine Festivals</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: SPACING.xl,
    backgroundColor: COLORS.background,
  },
  captureContainer: {
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
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  shareButtonText: {
    color: '#000000',
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  notificationButton: {
    padding: SPACING.xs,
  },
  watermarkContainer: {
    marginHorizontal: SPACING.md,
    marginTop: -8,
    marginBottom: SPACING.md,
    paddingTop: 8,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: '#FFFDF9',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  watermarkLine: {
    height: 1,
    backgroundColor: 'rgba(212, 175, 55, 0.25)',
    marginBottom: 12,
  },
  watermarkContent: {
    flexDirection: 'column',
    gap: 6,
  },
  watermarkLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  watermarkIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#D4AF37',
    justifyContent: 'center',
    alignItems: 'center',
  },
  watermarkOm: {
    fontSize: 18,
    color: '#B45309',
  },
  watermarkTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#78350F',
    letterSpacing: -0.3,
  },
  watermarkSubtitle: {
    fontSize: 11,
    color: '#92400E',
    fontWeight: '500',
  },
  watermarkTagline: {
    fontSize: 11,
    color: '#B45309',
    fontStyle: 'italic',
    marginTop: 4,
  },
});

export default FestivalDetailPage;
