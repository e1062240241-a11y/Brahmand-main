import React, { useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  Platform,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { api } from '../services/api';
import { AnimatedGoldKathaTitle } from './AnimatedGoldKathaTitle';
import { useTranslation } from '../utils/i18n';

export interface KathaCardData {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  progressPercent?: number;
  route?: string;
}

const DEFAULT_KATHA_CARDS: KathaCardData[] = [
  {
    id: 'shamik_pathak_ji',
    title: 'Shamik Pathak Ji',
    subtitle: 'Spiritual Guru • Astrologer • Panditji',
    imageUrl: 'https://brahmandfeed23.b-cdn.net/assets/shamik_pathak_ji.webp',
    progressPercent: 0,
    route: '/library/katha',
  },
];

interface KathaSectionProps {
  cards?: KathaCardData[];
  onNavigate?: (action: () => void) => void;
}

export const KathaSection = React.memo(({
  cards = DEFAULT_KATHA_CARDS,
  onNavigate,
}: KathaSectionProps) => {
  const { t } = useTranslation();
  const router = useRouter();

  const isNavigatingRef = useRef(false);
  const safeNavigate = useCallback((action: () => void | Promise<void>) => {
    if (onNavigate) {
      onNavigate(action);
      return;
    }
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;
    try {
      action();
    } finally {
      setTimeout(() => {
        isNavigatingRef.current = false;
      }, 800);
    }
  }, [onNavigate]);

  const handleLiveCheck = useCallback(() => {
    safeNavigate(async () => {
      try {
        const res = await api.get('/katha/status');
        if (res.data && res.data.is_live) {
          router.push('/library/katha' as any);
          return;
        }
      } catch (_e) {}
      Alert.alert(
        '🔴 LIVE Katha Broadcast',
        'Shravan Live Katha starts daily at 8:00 AM IST & 8:00 PM IST.',
        [{ text: 'OK', style: 'default' }]
      );
    });
  }, [safeNavigate, router]);

  const handleCardPress = useCallback((route?: string) => {
    safeNavigate(() => {
      router.push((route || '/library/katha') as any);
    });
  }, [safeNavigate, router]);

  return (
    <View style={styles.container}>
      {/* Authentic Sacred Shravan Katha Section Header */}
      <View style={styles.authenticKathaHeaderContainer}>
        {/* Main Title Row with Authentic Brass/Gold Ornaments */}
        <View style={styles.authenticTitleRow}>
          {/* Left Brass Ornament Divider */}
          <View style={styles.brassOrnamentSide}>
            <LinearGradient
              colors={['transparent', 'rgba(212, 175, 55, 0.3)', '#C5A059']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.brassOrnamentLine}
            />
            <Text style={styles.brassOrnamentSymbol}>❖</Text>
          </View>

          {/* Devotional Banner Title Stack: Gold Gradient + Glow + Breathing + Clamp Sizing */}
          <AnimatedGoldKathaTitle title={t('language') === 'hi' ? 'श्रावण कथा' : 'Shravan Katha'} />

          {/* Right Brass Ornament Divider */}
          <View style={styles.brassOrnamentSide}>
            <Text style={styles.brassOrnamentSymbol}>❖</Text>
            <LinearGradient
              colors={['#C5A059', 'rgba(212, 175, 55, 0.3)', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.brassOrnamentLine}
            />
          </View>
        </View>

        {/* Subdued Authentic Status Bar (Live & 30 Days Info) */}
        <View style={styles.authenticMetaNavRow}>
          {/* Live Indicator Badge */}
          <Pressable
            style={({ pressed }) => [
              styles.authenticLiveBadge,
              pressed && Platform.OS === 'ios' && { opacity: 0.85 }
            ]}
            onPress={handleLiveCheck}
          >
            <View style={styles.authenticRedDot} />
            <Text style={styles.authenticLiveText}>LIVE</Text>
          </Pressable>

          <View style={styles.authenticMetaDivider} />

          {/* 30 Days Info Badge */}
          <View style={styles.authentic30DaysBtn}>
            <Ionicons name="calendar-outline" size={13} color="#8A5A2B" style={{ marginRight: 4 }} />
            <Text style={styles.authentic30DaysText}>
              {t('language') === 'hi' ? '30 दिवस' : '30 Days'}
            </Text>
          </View>
        </View>
      </View>

      {/* Katha Cards List / Container (Ready for future multiple cards) */}
      <View style={styles.cardsContainer}>
        {cards.map((card) => (
          <View key={card.id} style={styles.bookCardKatha}>
            <Pressable
              style={({ pressed }) => [
                styles.coverBoxKatha,
                pressed && Platform.OS === 'ios' && { opacity: 0.92, transform: [{ scale: 0.985 }] }
              ]}
              android_ripple={{
                color: 'rgba(168, 85, 247, 0.12)',
                borderless: false,
                foreground: true,
              }}
              onPress={() => handleCardPress(card.route)}
            >
              <Image
                source={{ uri: card.imageUrl }}
                style={styles.coverImgKatha}
                resizeMode="cover"
              />
              <View style={styles.progressTrackKatha}>
                <View style={[styles.progressFillKatha, { width: `${card.progressPercent ?? 0}%` }]} />
              </View>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.bookMetaKatha,
                pressed && { opacity: 0.7 }
              ]}
              onPress={() => handleCardPress(card.route)}
            >
              <Text style={styles.bookNameKatha}>{card.title}</Text>
              <Text style={styles.bookSubKatha}>{card.subtitle}</Text>
            </Pressable>
          </View>
        ))}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  authenticKathaHeaderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 4,
    paddingTop: 8,
    paddingBottom: 4,
    paddingHorizontal: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  authenticTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    zIndex: 1,
  },
  brassOrnamentSide: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brassOrnamentLine: {
    width: 32,
    height: 1.5,
  },
  brassOrnamentSymbol: {
    color: '#C5A059',
    fontSize: 10,
  },
  authenticMetaNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    gap: 12,
    zIndex: 1,
  },
  authenticLiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  authenticRedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EB5757',
  },
  authenticLiveText: {
    color: '#EB5757',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  authenticMetaDivider: {
    width: 1,
    height: 12,
    backgroundColor: 'rgba(197, 160, 89, 0.4)',
  },
  authentic30DaysBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authentic30DaysText: {
    color: '#8A5A2B',
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  cardsContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  bookCardKatha: {
    width: 192,
  },
  coverBoxKatha: {
    width: '100%',
    height: 250,
    position: 'relative',
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#1A0A00',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  coverImgKatha: {
    width: '100%',
    height: '100%',
  },
  progressTrackKatha: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: 'rgba(160,65,0,0.20)',
  },
  progressFillKatha: {
    height: '100%',
    backgroundColor: '#FF6B00',
    borderRadius: 2,
  },
  bookMetaKatha: {
    paddingHorizontal: 4,
    paddingTop: 10,
    paddingBottom: 10,
    alignItems: 'center',
  },
  bookNameKatha: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1B1C1C',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    marginBottom: 4,
    textAlign: 'center',
  },
  bookSubKatha: {
    fontSize: 12,
    color: '#5A4136',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    letterSpacing: 0.2,
    flexWrap: 'wrap',
    textAlign: 'center',
  },
});

export const ShravanKathaSection = KathaSection;
export default KathaSection;
