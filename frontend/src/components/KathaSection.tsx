import React, { useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  Platform,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Svg, Path } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { useTranslation } from '../utils/i18n';
import { SubtleJoinButton } from './SubtleJoinButton';
import { AnimatedDoubleArrow } from './AnimatedDoubleArrow';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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

  const handleCardPress = useCallback((route?: string) => {
    safeNavigate(() => {
      router.push((route || '/library/katha') as any);
    });
  }, [safeNavigate, router]);

  const kathaTitle = t('language') === 'hi' ? 'श्रावण कथा' : 'Shravan Katha';
  const joinLabel = t('language') === 'hi' ? 'शामिल हों' : 'Join';

  return (
    <View style={styles.container}>
      {/* Authentic Sacred Shravan Katha Section Header */}
      <View style={styles.authenticKathaHeaderContainer}>
        {/* Main Title Row with Authentic Brass/Gold Ornaments (Clean static text, no animation) */}
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

          {/* Clean Static Title without animation */}
          <Text style={styles.staticKathaTitle}>
            {kathaTitle}
          </Text>

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
      </View>

      {/* Katha Cards List / Container */}
      <View style={styles.cardsContainer}>
        {cards.map((card) => (
          <View key={card.id} style={styles.bookCardKatha}>
            <View style={styles.coverBoxKatha}>
              <Image
                source={{ uri: card.imageUrl }}
                style={styles.coverImgKatha}
                resizeMode="cover"
              />

              {/* Bottom Join Button Overlay like Live Jaap Cards */}
              <LinearGradient
                colors={['transparent', 'rgba(0, 0, 0, 0.75)']}
                style={styles.cardGradientOverlay}
              >
                <View style={styles.cardBottomActionArea}>
                  <SubtleJoinButton
                    style={styles.joinBtnStyle}
                    onPress={() => handleCardPress(card.route)}
                  >
                    <View style={styles.joinBtnInner}>
                      <Text style={styles.joinBtnText} numberOfLines={1}>Watch now</Text>
                      <AnimatedDoubleArrow color="#FF6600" size={12} />
                    </View>
                  </SubtleJoinButton>
                </View>
              </LinearGradient>

              <View style={styles.progressTrackKatha}>
                <View style={[styles.progressFillKatha, { width: `${card.progressPercent ?? 0}%` }]} />
              </View>
            </View>

            <View style={styles.bookMetaKatha}>
              <Text style={styles.bookNameKatha}>{card.title}</Text>
              <Text style={styles.bookSubKatha}>{card.subtitle}</Text>
            </View>
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
  staticKathaTitle: {
    fontSize: Math.min(Math.max(SCREEN_WIDTH * 0.058, 20), 24),
    fontWeight: '800',
    color: '#78350F',
    textAlign: 'center',
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  cardsContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  bookCardKatha: {
    width: 175,
  },
  coverBoxKatha: {
    width: '100%',
    height: 200,
    position: 'relative',
    borderRadius: 18,
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
  cardGradientOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 80,
    justifyContent: 'flex-end',
    paddingBottom: 10,
    paddingHorizontal: 10,
  },
  cardBottomActionArea: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinBtnStyle: {
    width: '92%',
  },
  joinBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  joinBtnText: {
    color: '#FF6600',
    fontSize: 12.5,
    fontWeight: '800',
  },
  progressTrackKatha: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(160,65,0,0.20)',
  },
  progressFillKatha: {
    height: '100%',
    backgroundColor: '#FF6B00',
    borderRadius: 2,
  },
  bookMetaKatha: {
    paddingHorizontal: 4,
    paddingTop: 8,
    paddingBottom: 6,
    alignItems: 'center',
  },
  bookNameKatha: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#1B1C1C',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    marginBottom: 2,
    textAlign: 'center',
  },
  bookSubKatha: {
    fontSize: 11.5,
    color: '#5A4136',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    letterSpacing: 0.2,
    flexWrap: 'wrap',
    textAlign: 'center',
  },
});

export const ShravanKathaSection = KathaSection;
export default KathaSection;
