import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS } from '../src/constants/theme';
import { getFestivalList } from '../src/services/api';

const PLAY_STORE_BASE = 'https://play.google.com/store/apps/details?id=com.brahmand.app';
const APP_STORE_BASE = 'https://apps.apple.com/in/app/brahmand-app/id6765467224';

export default function DownloadScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const isIOS = useMemo(() => {
    if (Platform.OS === 'ios') return true;
    if (Platform.OS === 'web' && typeof navigator !== 'undefined') {
      return /iPad|iPhone|iPod/.test(navigator.userAgent || '');
    }
    return false;
  }, []);

  const handleOpenStore = () => {
    if (isIOS) {
      const iosUrl = (params.app_store_url as string) || APP_STORE_BASE;
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.location.replace(iosUrl);
      } else {
        Linking.openURL(iosUrl).catch((err) => console.warn('Failed to open App Store:', err));
      }
      return;
    }

    // Android / Default: Construct Play Store URL with full UTM install referrer
    const festivalSlug = (params.festival as string) || (params.f as string) || '';
    const sourceParam = (params.source as string) || (params.s as string) || 'pdf_qr';
    const queryEntries = Object.entries(params)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
      .join('&');
    const referrerStr = queryEntries || `utm_source=${sourceParam}&utm_medium=pdf&utm_campaign=katha_${festivalSlug}&festival=${festivalSlug}`;

    const fullUrl = `${PLAY_STORE_BASE}&referrer=${encodeURIComponent(referrerStr)}`;

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.location.replace(fullUrl);
    } else {
      Linking.openURL(fullUrl).catch((err) => {
        console.warn('Failed to open store link:', err);
      });
    }
  };

  useEffect(() => {
    // 1. If user is inside the native app (Android or iOS):
    // They already have Brahmand installed! Route directly to the festival or home.
    if (Platform.OS !== 'web') {
      const festivalSlug = (params.festival as string) || (params.f as string) || '';
      if (festivalSlug) {
        getFestivalList()
          .then((res) => {
            const items = res.data || [];
            const idx = items.findIndex((f: any) => {
              const name = (f.festival_name || f.name || f.title || '')
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '_');
              return name.includes(festivalSlug) || festivalSlug.includes(name);
            });
            if (idx >= 0) {
              router.replace(`/festival-detail?index=${idx}`);
            } else {
              router.replace('/festivals');
            }
          })
          .catch(() => {
            router.replace('/festivals');
          });
      } else {
        router.replace('/(tabs)/home');
      }
      return;
    }

    // 2. If opened on Web browser (new user who scanned QR / clicked link):
    // Auto-redirect to the appropriate platform store (Android -> Play Store, iOS -> App Store)
    if (Platform.OS === 'web' && typeof navigator !== 'undefined') {
      const isMobile = /android|iphone|ipad|ipod/i.test(navigator.userAgent || '');
      if (isMobile) {
        handleOpenStore();
      }
    }
  }, [params]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Image
          source={require('../assets/images/icon.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        <Text style={styles.brandTitle}>BRAHMAND</Text>
        <Text style={styles.brandSubtitle}>Daily Sanatan Community</Text>

        <Text style={styles.tagline}>
          Har Din Prabhu Sang • Apne Phone Ko Banayein Mandir.
        </Text>

        <Text style={styles.description}>
          Aaj ka Shubh Muhurat aur Live Jaap join karne ke liye Brahmand App download karein.
        </Text>

        <View style={styles.featuresRow}>
          <View style={styles.featurePill}>
            <Text style={styles.featureText}>📿 Live Jaap</Text>
          </View>
          <View style={styles.featurePill}>
            <Text style={styles.featureText}>📅 Panchang</Text>
          </View>
          <View style={styles.featurePill}>
            <Text style={styles.featureText}>🛕 1000+ Darshans</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.ctaButtonWrapper}
          activeOpacity={0.88}
          onPress={handleOpenStore}
        >
          <LinearGradient
            colors={['#A8201A', '#7A1424']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.ctaButton}
          >
            <Text style={styles.ctaButtonText}>{isIOS ? 'DOWNLOAD ON APP STORE ➔' : 'DOWNLOAD ON GOOGLE PLAY ➔'}</Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.trustBadges}>
          <Text style={styles.trustText}>✓ 100% Free Seva</Text>
          <Text style={styles.trustText}>★ 1 Lakh+ Devotees</Text>
        </View>

        {router.canGoBack() && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={16} color={COLORS.textSecondary} />
            <Text style={styles.backText}>Return to App</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDFBF7',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: SPACING.xl,
    alignItems: 'center',
    width: '100%',
    maxWidth: 420,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
    shadowColor: '#8B2E1A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 4,
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 18,
    marginBottom: SPACING.md,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 2,
    color: '#8F1C14',
    marginBottom: 4,
  },
  brandSubtitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: '#334726',
    textTransform: 'uppercase',
    marginBottom: SPACING.md,
  },
  tagline: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A4A4A',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: SPACING.lg,
  },
  featuresRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: SPACING.lg,
  },
  featurePill: {
    backgroundColor: '#FDF6EC',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  featureText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#802E17',
  },
  ctaButtonWrapper: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: SPACING.md,
  },
  ctaButton: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  trustBadges: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 4,
  },
  trustText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: SPACING.lg,
    padding: SPACING.xs,
  },
  backText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
});
