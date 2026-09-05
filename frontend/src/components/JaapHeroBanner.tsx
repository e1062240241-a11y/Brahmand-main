import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ImageBackground,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from '../utils/i18n';
import { safeNavigate } from '../utils/safeNavigation';
import { AnimatedDoubleArrow } from './AnimatedDoubleArrow';
import {
  getCurrentGayatriEnd,
  isWithinGayatriMantraWindow,
  formatTime,
} from '../features/live-mantra/schedule';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BANNER_H_MARGIN = 16;
const BANNER_WIDTH = SCREEN_WIDTH - BANNER_H_MARGIN * 2;
const BANNER_HEIGHT = Math.round(BANNER_WIDTH * 0.48);
const BANNER_RADIUS = 22;

export interface JaapHeroBannerProps {
  now?: Date;
  onPress?: () => void;
}

export const JaapHeroBanner = React.memo(({ now: externalNow, onPress }: JaapHeroBannerProps) => {
  const { t } = useTranslation();
  const router = useRouter();
  const isNavigatingRef = useRef(false);

  // Internal timer fallback if external `now` is not provided
  const [internalNow, setInternalNow] = useState<Date>(() => new Date());
  useEffect(() => {
    if (externalNow) return;
    const timer = setInterval(() => setInternalNow(new Date()), 15_000);
    return () => clearInterval(timer);
  }, [externalNow]);

  const currentNow = externalNow ?? internalNow;
  const liveActive = isWithinGayatriMantraWindow(currentNow);
  const liveEnd = getCurrentGayatriEnd(currentNow);

  const heroTitle = t('language') === 'hi'
    ? (liveActive ? 'महामृत्युंजय मंत्र' : 'सायंकालीन गायत्री जाप')
    : (liveActive ? 'Mahamrityunjaya Mantra' : 'Evening Gayatri Chanting');

  // 🧡 Engagement: Reframed inactive session tagline from generic notification ("दिव्य प्रकाश से जुड़ें। शाम 6:00 बजे से शुरू।")
  // to a devotional call to action ("सामूहिक साधना का संकल्प लें। शाम 6:00 बजे से आरंभ।").
  // Lever: Reframing + Sanskara/Sankalpa (Cultural Devotion over Utility)
  // Why: "संकल्प" (Sacred Vow) and "सामूहिक साधना" (Collective Spiritual Practice) evoke deep Sanatan cultural responsibility and habit formation.
  // UI: Text-only change, no visual components or layout structure altered.
  const heroTagline = t('language') === 'hi'
    ? (liveActive
      ? 'हम जाप करते हैं। हम ठीक होते हैं।\nहम एक साथ उठते हैं।'
      : 'सामूहिक साधना का संकल्प लें। शाम 6:00 बजे से आरंभ।')
    : (liveActive
      ? 'We chant. We heal.\nWe rise together.'
      : 'Take a sacred vow of collective devotion. Starting at 6:00 PM.');

  const heroTimeLabel = t('language') === 'hi'
    ? (liveActive
      ? `शाम ${liveEnd ? formatTime(liveEnd) : '5:00'} बजे तक लाइव`
      : 'अगला सत्र: आज शाम 6:00 बजे')
    : (liveActive
      ? `Live until ${liveEnd ? formatTime(liveEnd) : '5:00 PM'}`
      : 'Next Session: 6:00 PM Today');

  const handleJoinPress = useCallback(() => {
    if (onPress) {
      onPress();
      return;
    }
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;
    setTimeout(() => {
      isNavigatingRef.current = false;
    }, 800);

    safeNavigate(() => {
      router.push({
        pathname: '/live-jaap-welcome',
        params: {
          mantraType: liveActive ? 'mrityunjaya' : 'gayatri',
          title: liveActive ? 'Maha Mrityunjaya' : 'Gayatri Mantra',
        },
      });
    });
  }, [onPress, router, liveActive]);

  return (
    <View style={styles.wrapper}>
      <View style={styles.heroFixedContainer}>
        <ImageBackground
          source={{ uri: 'https://brahmandfeed23.b-cdn.net/assets/jaap_hero_shiva_final.webp' }}
          style={styles.heroBannerFill}
          imageStyle={styles.heroBannerImageStyle}
          resizeMode="cover"
        >
          <LinearGradient
            colors={['rgba(0,0,0,0.08)', 'rgba(0,0,0,0.35)', 'rgba(0,0,0,0.82)']}
            locations={[0, 0.38, 1]}
            style={StyleSheet.absoluteFill}
          />

          <View style={styles.bannerContent}>
            <View style={styles.topSection}>
              <View style={styles.titleColumn}>
                <View style={styles.liveBadgeRow}>
                  <View style={styles.liveDot} />
                  <Text style={styles.titleText}>
                    {heroTitle}
                  </Text>
                </View>

                <Text style={styles.taglineText}>
                  {heroTagline}
                </Text>

                <View style={styles.timeRow}>
                  <Ionicons name="time-outline" size={13} color="#FFF" />
                  <Text style={styles.timeText}>
                    {heroTimeLabel}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.bannerFooter}>
              <Pressable
                style={({ pressed }) => [
                  styles.mockupJoinNowBtn,
                  pressed && Platform.OS === 'ios' && { opacity: 0.8 }
                ]}
                android_ripple={{ color: 'rgba(255, 107, 0, 0.2)', borderless: false }}
                onPress={handleJoinPress}
              >
                <LinearGradient
                  colors={['#FF6B00', '#FF8800']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.mockupJoinGradient}
                >
                  <MaterialCommunityIcons name="broadcast" size={17} color="#FFF" />
                  <Text style={styles.mockupJoinJaapText}>
                    {liveActive
                      ? (t('language') === 'hi' ? 'लाइव जाप में शामिल हों' : 'Join Live Jaap')
                      : (t('language') === 'hi' ? 'रिमाइंडर सेट करें' : 'Set Reminder')}
                  </Text>
                  {liveActive ? (
                    <AnimatedDoubleArrow color="#FFF" size={14} />
                  ) : (
                    <Ionicons name="chevron-forward" size={15} color="#FFF" />
                  )}
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        </ImageBackground>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: 'transparent',
    paddingTop: 12,
    zIndex: 10,
  },
  heroFixedContainer: {
    height: BANNER_HEIGHT,
    marginTop: 0,
    marginHorizontal: BANNER_H_MARGIN,
    borderRadius: BANNER_RADIUS,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 6,
  },
  heroBannerFill: {
    width: '100%',
    height: '100%',
    justifyContent: 'space-between',
  },
  heroBannerImageStyle: {
    borderRadius: BANNER_RADIUS,
  },
  bannerContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    justifyContent: 'space-between',
  },
  topSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleColumn: {
    paddingTop: 0,
    paddingLeft: 0,
  },
  liveBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFD700',
    marginRight: 8,
  },
  titleText: {
    color: '#FFF',
    fontFamily: 'System',
    fontSize: 15,
    fontStyle: 'normal',
    fontWeight: '700',
    letterSpacing: 1,
    textShadowColor: 'rgba(0,0,0,0.9)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  taglineText: {
    color: '#FFF',
    fontWeight: '600',
    opacity: 0.9,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
    marginLeft: 14,
    marginTop: 0,
    marginBottom: 2,
    fontSize: 13,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 14,
  },
  timeText: {
    marginTop: 0,
    marginLeft: 4,
    color: '#FFF',
    fontWeight: '600',
    fontSize: 12,
  },
  bannerFooter: {
    minHeight: 56,
    justifyContent: 'flex-end',
    paddingBottom: 0,
  },
  mockupJoinNowBtn: {
    alignSelf: 'flex-start',
    borderRadius: 24,
    zIndex: 4,
    maxWidth: '74%',
    elevation: 8,
    shadowColor: '#FF6600',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 7,
    backgroundColor: '#FF6B00',
    overflow: 'hidden',
  },
  mockupJoinGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9.5,
    paddingHorizontal: 14,
    borderRadius: 24,
    gap: 6,
  },
  mockupJoinJaapText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '900',
    flexShrink: 1,
  },
});

export default JaapHeroBanner;
