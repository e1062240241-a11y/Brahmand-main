// accessibility: placeholder
import React, { useEffect, useState, useRef } from 'react';
import { View, ScrollView, Text, StyleSheet, Alert, TouchableOpacity, Share, ActivityIndicator, Linking } from 'react-native';
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
import { shareFestivalCard } from '../src/utils/shareFestivalCard';

// Safe dynamic helper so missing native binaries in older dev builds never break route registration or crash the app
const safeCaptureRef = async (ref: any, options: any): Promise<{ uri: string | null; error?: string }> => {
  console.log('[FestivalDetail Debug] safeCaptureRef called');
  try {
    let ViewShot;
    try {
      ViewShot = require('react-native-view-shot');
    } catch (e: any) {
      console.log('[FestivalDetail Debug] Failed to require react-native-view-shot:', e);
      return { uri: null, error: `require('react-native-view-shot') failed: ${e?.message || e}` };
    }

    const capture = ViewShot?.captureRef || ViewShot?.default?.captureRef || ViewShot;
    console.log('[FestivalDetail Debug] ViewShot capture function type:', typeof capture);

    if (typeof capture === 'function') {
      const uri = await capture(ref, options);
      console.log('[FestivalDetail Debug] captureRef returned URI:', uri);
      return { uri };
    } else {
      return { uri: null, error: `captureRef is not a function (got ${typeof capture})` };
    }
  } catch (e: any) {
    console.log('[FestivalDetail Debug] safeCaptureRef exception:', e);
    return { uri: null, error: `captureRef exception: ${e?.message || e}` };
  }
};

const safeShareFile = async (uri: string, options: any): Promise<{ shared: boolean; error?: string }> => {
  console.log('[FestivalDetail Debug] safeShareFile called with URI:', uri);
  try {
    let Sharing;
    try {
      Sharing = require('expo-sharing');
    } catch (e: any) {
      console.log('[FestivalDetail Debug] Failed to require expo-sharing:', e);
      return { shared: false, error: `require('expo-sharing') failed: ${e?.message || e}` };
    }

    if (Sharing && typeof Sharing.isAvailableAsync === 'function') {
      const isAvailable = await Sharing.isAvailableAsync();
      console.log('[FestivalDetail Debug] Sharing.isAvailableAsync():', isAvailable);
      if (isAvailable) {
        await Sharing.shareAsync(uri, options);
        console.log('[FestivalDetail Debug] Sharing.shareAsync completed successfully');
        return { shared: true };
      } else {
        return { shared: false, error: 'Sharing.isAvailableAsync() returned false' };
      }
    } else {
      return { shared: false, error: 'expo-sharing isAvailableAsync is not a function' };
    }
  } catch (e: any) {
    console.log('[FestivalDetail Debug] safeShareFile exception:', e);
    return { shared: false, error: `shareAsync exception: ${e?.message || e}` };
  }
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
      const festivalName = (festival.festival_name || festival.name || festival.title || 'Festival').toUpperCase();

      let imageUri: string | null = null;
      if (catalogRef.current) {
        await new Promise((res) => setTimeout(res, 250));
        const captureResult = await safeCaptureRef(catalogRef, {
          format: 'png',
          quality: 0.9,
          result: 'tmpfile',
        });
        imageUri = captureResult.uri;
      }

      await shareFestivalCard(imageUri, festivalName);
    } catch (err: any) {
      console.warn('[FestivalDetail Debug] handleShare error', err);
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
          left: -9999,
          top: 0,
          width: 480,
          zIndex: -9999,
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
        <TouchableOpacity
          style={styles.watermarkContainer}
          activeOpacity={0.8}
          onPress={() => Linking.openURL('https://brahmand.app/download')}
        >
          <View style={styles.watermarkLine} />
          <View style={styles.watermarkContent}>
            <View style={styles.watermarkLogoRow}>
              <View style={styles.watermarkIconBadge}>
                <Text style={styles.watermarkOm}>🕉</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.watermarkTitle}>Brahmand App</Text>
                <Text style={styles.watermarkSubtitle}>Your Gateway to Sanatan Heritage</Text>
              </View>
              <View style={styles.watermarkDownloadButton}>
                <Text style={styles.watermarkDownloadText}>Download ➔</Text>
              </View>
            </View>
            <Text style={styles.watermarkTagline}>ब्रह्माण्ड • Discover Divine Festivals • Tap to Download</Text>
          </View>
        </TouchableOpacity>
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
  watermarkDownloadButton: {
    backgroundColor: '#D4AF37',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  watermarkDownloadText: {
    color: '#78350F',
    fontSize: 11,
    fontWeight: '700',
  },
});

export default FestivalDetailPage;
