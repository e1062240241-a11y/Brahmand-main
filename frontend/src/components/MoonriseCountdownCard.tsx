import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Animated,
  Share,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../store/authStore';

import {
  CityMoonriseData,
  MAJOR_CITIES_MOONRISE,
  POPULAR_CITY_IDS,
  detectUserMoonCity,
  getKarwaMoonriseCountdown,
  getInitialUserMoonCity,
  createCustomCityData,
} from '../utils/karwaMoonrise';

export { CityMoonriseData, MAJOR_CITIES_MOONRISE, POPULAR_CITY_IDS };

export const MoonriseCountdownCard = React.memo(function MoonriseCountdownCard({
  onSelectCity,
}: {
  onSelectCity?: (city: CityMoonriseData) => void;
}) {
  const user = useAuthStore((state) => state.user);
  const [selectedCity, setSelectedCity] = useState<CityMoonriseData>(() => getInitialUserMoonCity(user));
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showFullCityList, setShowFullCityList] = useState<boolean>(false);
  const [now, setNow] = useState<Date>(new Date());

  // Pulsing glow animation for the moon icon
  const moonGlowAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(moonGlowAnim, {
          toValue: 1.15,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(moonGlowAnim, {
          toValue: 1.0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [moonGlowAnim]);

  // Initial user location detection & storage check
  useEffect(() => {
    let isMounted = true;
    detectUserMoonCity(user).then((city) => {
      if (isMounted && city) {
        setSelectedCity(city);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [user]);

  // Real-time ticking interval (every 1 second)
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleCityChange = (city: CityMoonriseData) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (_e) { }
    setSelectedCity(city);
    AsyncStorage.setItem('@karwa_user_manual_city', JSON.stringify(city)).catch(() => {});
    AsyncStorage.setItem('@karwa_selected_city', city.id).catch(() => {});
    onSelectCity?.(city);
  };

  // Compute remaining time until moonrise for selected city using accurate Karwa Chauth target
  const { isRisen, days, hours, minutes, seconds, expectedDateLabel } = useMemo(() => {
    return getKarwaMoonriseCountdown(selectedCity, now);
  }, [now, selectedCity]);

  // Filtered cities list for search
  const filteredCities = useMemo(() => {
    if (!searchQuery.trim()) return MAJOR_CITIES_MOONRISE;
    const q = searchQuery.toLowerCase().trim();
    return MAJOR_CITIES_MOONRISE.filter(
      (c) =>
        c.city.toLowerCase().includes(q) ||
        c.hindiCity.includes(q) ||
        c.state.toLowerCase().includes(q) ||
        c.hindiState.includes(q)
    );
  }, [searchQuery]);

  const padZero = (n: number) => String(n).padStart(2, '0');

  return (
    <View style={styles.cardWrapper}>
      <LinearGradient
        colors={['#0A0E27', '#121B3B', '#1E1435']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardGradient}
      >
        {/* Top Header Pill */}
        <View style={styles.topHeaderRow}>
          <View style={styles.liveBadge}>
            <View style={styles.livePulseDot} />
            <Text style={styles.liveBadgeText}>LIVE MOONRISE COUNTDOWN</Text>
          </View>
          <Animated.Text
            style={[styles.moonEmoji, { transform: [{ scale: moonGlowAnim }] }]}
          >
            🌕
          </Animated.Text>
        </View>

        {/* Title & Personalized User Greeting */}
        <View style={styles.titleSection}>
          <View style={styles.userGreetingPill}>
            <Text style={styles.userGreetingPillText}>
              🌸 {user?.name ? `${user.name.split(' ')[0]} जी के लिए विशेष` : 'आपके लिए विशेष'}
            </Text>
          </View>
          <Text style={styles.mainHeading}>
            {selectedCity.hindiCity} चंद्र दर्शन व शुभ मुहूर्त
          </Text>
          <Text style={styles.subHeading}>
            📍 आपके निवास ({selectedCity.hindiCity}) के अनुसार करवा चौथ का सटीक समय
          </Text>
        </View>

        {/* City Selection Bar */}
        <View style={styles.citySelectorBar}>
          <View style={styles.cityInfoLeft}>
            <Ionicons name="location-sharp" size={17} color="#FFD700" />
            <Text style={styles.selectedCityText} numberOfLines={1}>
              {selectedCity.hindiCity} ({selectedCity.state})
            </Text>
          </View>

          <TouchableOpacity
            style={styles.changeCityBtn}
            activeOpacity={0.8}
            onPress={() => setShowFullCityList((prev) => !prev)}
          >
            <Text style={styles.changeCityBtnText}>
              {showFullCityList ? 'बंद करें ✕' : 'शहर बदलें ▾'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Expandable City Search & Selection (Only when user taps 'शहर बदलें') */}
        {showFullCityList && (
          <View style={styles.fullCityListSection}>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={16} color="#94A3B8" />
              <TextInput
                style={styles.searchInput}
                placeholder="शहर खोजें (उदा. जयपुर, मुंबई, इंदौर, लखनऊ)..."
                placeholderTextColor="#64748B"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={16} color="#94A3B8" />
                </TouchableOpacity>
              ) : null}
            </View>

            <View style={styles.cityTable}>
              {searchQuery.trim().length > 0 && (
                <TouchableOpacity
                  style={[
                    styles.cityTableRow,
                    {
                      backgroundColor: 'rgba(245, 158, 11, 0.15)',
                      borderColor: '#F59E0B',
                      borderWidth: 1,
                      borderRadius: 10,
                      marginBottom: 6,
                    },
                  ]}
                  activeOpacity={0.75}
                  onPress={() => {
                    const custom = createCustomCityData(searchQuery.trim());
                    handleCityChange(custom);
                    setShowFullCityList(false);
                    setSearchQuery('');
                  }}
                >
                  <View style={styles.cityRowLeft}>
                    <Text style={[styles.cityNameText, { color: '#FDE047', fontWeight: '800' }]}>
                      {`📍 "${searchQuery.trim()}" चुनें`}
                    </Text>
                    <Text style={styles.stateNameText}>कस्टम शहर • स्वचालित चंद्रोदय गणना</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#F59E0B" />
                </TouchableOpacity>
              )}

              {filteredCities.slice(0, 15).map((c) => {
                const isSelected = c.id === selectedCity.id;
                return (
                  <TouchableOpacity
                    key={c.id}
                    style={[
                      styles.cityTableRow,
                      isSelected && styles.cityTableRowSelected,
                    ]}
                    activeOpacity={0.75}
                    onPress={() => {
                      handleCityChange(c);
                      setShowFullCityList(false);
                      setSearchQuery('');
                    }}
                  >
                    <View style={styles.cityRowLeft}>
                      <Text
                        style={[
                          styles.cityNameText,
                          isSelected && styles.cityNameTextSelected,
                        ]}
                      >
                        {c.hindiCity} ({c.city})
                      </Text>
                      <Text style={styles.stateNameText}>{c.hindiState}</Text>
                    </View>

                    <View style={styles.cityRowRight}>
                      <Text
                        style={[
                          styles.moonriseBadgeText,
                          isSelected && styles.moonriseBadgeTextSelected,
                        ]}
                      >
                        🌙 {c.moonriseTime}
                      </Text>
                      {isSelected ? (
                        <Ionicons
                          name="checkmark-circle"
                          size={18}
                          color="#F59E0B"
                          style={{ marginLeft: 6 }}
                        />
                      ) : null}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Digital Countdown Display Box */}
        <View style={styles.countdownContainer}>
          {isRisen ? (
            <LinearGradient
              colors={['rgba(245, 158, 11, 0.25)', 'rgba(217, 119, 6, 0.35)']}
              style={styles.risenBanner}
            >
              <Text style={styles.risenEmoji}>🌕✨</Text>
              <Text style={styles.risenTitle}>चंद्रोदय हो चुका है!</Text>
              <Text style={styles.risenSubtitle}>
                {selectedCity.hindiCity} में चंद्रमा निकल चुका है ({selectedCity.moonriseTime})। छलनी से चंद्र दर्शन कर अर्घ्य दें और व्रत पूर्ण करें।
              </Text>
            </LinearGradient>
          ) : (
            <View style={styles.clockBox}>
              <View style={styles.clockDigitsRow}>
                {/* Days Box (when > 0) */}
                {days > 0 && (
                  <>
                    <View style={styles.digitUnit}>
                      <LinearGradient
                        colors={['#1F293D', '#0F172A']}
                        style={[styles.digitCard, { minWidth: 54, paddingHorizontal: 6 }]}
                      >
                        <Text style={[styles.digitNumber, { fontSize: 23 }]}>{padZero(days)}</Text>
                      </LinearGradient>
                      <Text style={styles.digitLabel}>दिन (DAYS)</Text>
                    </View>

                    <Text style={styles.digitColon}>:</Text>
                  </>
                )}

                {/* Hours Box */}
                <View style={styles.digitUnit}>
                  <LinearGradient
                    colors={['#1F293D', '#0F172A']}
                    style={[styles.digitCard, days > 0 && { minWidth: 54, paddingHorizontal: 6 }]}
                  >
                    <Text style={[styles.digitNumber, days > 0 && { fontSize: 23 }]}>{padZero(hours)}</Text>
                  </LinearGradient>
                  <Text style={styles.digitLabel}>घंटे (HOURS)</Text>
                </View>

                <Text style={styles.digitColon}>:</Text>

                {/* Minutes Box */}
                <View style={styles.digitUnit}>
                  <LinearGradient
                    colors={['#1F293D', '#0F172A']}
                    style={[styles.digitCard, days > 0 && { minWidth: 54, paddingHorizontal: 6 }]}
                  >
                    <Text style={[styles.digitNumber, days > 0 && { fontSize: 23 }]}>{padZero(minutes)}</Text>
                  </LinearGradient>
                  <Text style={styles.digitLabel}>मिनट (MINS)</Text>
                </View>

                <Text style={styles.digitColon}>:</Text>

                {/* Seconds Box */}
                <View style={styles.digitUnit}>
                  <LinearGradient
                    colors={['#1F293D', '#0F172A']}
                    style={[styles.digitCard, days > 0 && { minWidth: 54, paddingHorizontal: 6 }]}
                  >
                    <Text style={[styles.digitNumber, styles.digitSeconds, days > 0 && { fontSize: 23 }]}>
                      {padZero(seconds)}
                    </Text>
                  </LinearGradient>
                  <Text style={styles.digitLabel}>सेकंड (SECS)</Text>
                </View>
              </View>

              {/* Estimated Arrival Banner */}
              <View style={styles.timeExpectedRow}>
                <Ionicons name="time-outline" size={14} color="#FDE047" />
                <Text style={styles.timeExpectedText}>
                  {expectedDateLabel} को {selectedCity.hindiCity} में संभावित चंद्रोदय: <Text style={styles.timeExpectedHighlight}>{selectedCity.moonriseTime}</Text>
                </Text>
              </View>

              {/* Personalized 1-Tap WhatsApp Share Button */}
              <TouchableOpacity
                style={styles.personalShareBtn}
                activeOpacity={0.85}
                onPress={async () => {
                  try {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    const sender = user?.name ? user.name.trim() : 'आपके परिवार';
                    const msg = `🌙 *करवा चौथ की पावन मंगलकामनाएं!* ✨\n\n📍 हमारे शहर *${selectedCity.hindiCity}* में संभावित चंद्रोदय: *${selectedCity.moonriseTime}* (29 अक्टूबर)\n\n🌅 *सरगी मुहूर्त:* 04:45 AM - 05:35 AM\n🪔 *संध्या पूजा:* 05:43 PM - 07:01 PM\n🌕 *चंद्र दर्शन व अर्घ्य:* ${selectedCity.moonriseTime}\n\n— *${sender}* की ओर से अखंड सौभाग्य की प्रार्थना 🙏\nhttps://brahmand.app/festival-detail?name=Karva%20Chauth`;
                    await Share.share({
                      title: 'करवा चौथ चंद्रोदय समय',
                      message: msg,
                    });
                  } catch (_e) {}
                }}
              >
                <LinearGradient
                  colors={['#25D366', '#128C7E']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.personalShareGradient}
                >
                  <Ionicons name="logo-whatsapp" size={17} color="#FFFFFF" />
                  <Text style={styles.personalShareText}>
                    {selectedCity.hindiCity.split('/')[0].trim()} का चंद्रोदय समय परिवार को भेजें
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Sacred Festival Timings Information Grid */}
        <View style={styles.infoGridContainer}>
          <Text style={styles.infoSectionHeader}>✨ {selectedCity.hindiCity.split('/')[0].trim()} पावन मुहूर्त विवरण</Text>

          <View style={styles.infoCardsGrid}>
            {/* Card 1: Sargi */}
            <View style={styles.infoCard}>
              <View style={styles.infoCardTop}>
                <Text style={styles.infoCardIcon}>🌅</Text>
                <Text style={styles.infoCardTitle}>सरगी मुहूर्त</Text>
              </View>
              <Text style={styles.infoCardTime}>04:45 AM - 05:35 AM</Text>
              <Text style={styles.infoCardDesc}>ब्रह्म मुहूर्त में सास द्वारा दी गई सरगी ग्रहण करें</Text>
            </View>

            {/* Card 2: Puja Muhurat */}
            <View style={styles.infoCard}>
              <View style={styles.infoCardTop}>
                <Text style={styles.infoCardIcon}>🪔</Text>
                <Text style={styles.infoCardTitle}>संध्या पूजा मुहूर्त</Text>
              </View>
              <Text style={styles.infoCardTime}>05:43 PM - 07:01 PM</Text>
              <Text style={styles.infoCardDesc}>माता पार्वती व शिव परिवार की पूजा का श्रेष्ठ समय</Text>
            </View>

            {/* Card 3: Moonrise for Selected City */}
            <View style={[styles.infoCard, styles.infoCardHighlight]}>
              <View style={styles.infoCardTop}>
                <Text style={styles.infoCardIcon}>🌕</Text>
                <Text style={[styles.infoCardTitle, { color: '#FEF08A' }]}>
                  {selectedCity.hindiCity.split('/')[0].trim()} चंद्रोदय
                </Text>
              </View>
              <Text style={[styles.infoCardTime, { color: '#FDE047' }]}>
                {selectedCity.moonriseTime}
              </Text>
              <Text style={styles.infoCardDesc}>छलनी से चंद्र दर्शन कर अर्घ्य दें और व्रत खोलें</Text>
            </View>

            {/* Card 4: Bhadra Clearance */}
            <View style={styles.infoCard}>
              <View style={styles.infoCardTop}>
                <Text style={styles.infoCardIcon}>🛡️</Text>
                <Text style={styles.infoCardTitle}>भद्रा काल (शुभ)</Text>
              </View>
              <Text style={styles.infoCardTime}>06:24 AM - 09:24 AM</Text>
              <Text style={styles.infoCardDesc}>शाम की पूजा व चंद्र अर्घ्य पूर्णतः भद्रा-मुक्त है</Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
});

const styles = StyleSheet.create({
  cardWrapper: {
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
    borderWidth: 1.2,
    borderColor: 'rgba(254, 240, 138, 0.3)',
  },
  cardGradient: {
    padding: 16,
    borderRadius: 20,
  },
  userGreetingPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(245, 158, 11, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(254, 240, 138, 0.45)',
    paddingHorizontal: 10,
    paddingVertical: 3.5,
    borderRadius: 12,
    marginBottom: 8,
  },
  userGreetingPillText: {
    color: '#FEF08A',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  personalShareBtn: {
    marginTop: 12,
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
  },
  personalShareGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 8,
  },
  personalShareText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  infoCardHighlight: {
    borderColor: 'rgba(254, 240, 138, 0.6)',
    backgroundColor: 'rgba(217, 119, 6, 0.22)',
  },
  topHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.5)',
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 12,
    gap: 6,
  },
  livePulseDot: {
    width: 6.5,
    height: 6.5,
    borderRadius: 3.5,
    backgroundColor: '#F59E0B',
  },
  liveBadgeText: {
    color: '#FDE047',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  moonEmoji: {
    fontSize: 22,
  },
  titleSection: {
    marginBottom: 12,
  },
  mainHeading: {
    color: '#FFFDF5',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.3,
    marginBottom: 3,
  },
  subHeading: {
    color: '#CBD5E1',
    fontSize: 12,
    lineHeight: 16,
  },
  citySelectorBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(254, 240, 138, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    marginBottom: 10,
  },
  cityInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  selectedCityText: {
    color: '#FEF08A',
    fontSize: 13.5,
    fontWeight: '700',
    flexShrink: 1,
  },
  changeCityBtn: {
    backgroundColor: 'rgba(245, 158, 11, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: 10,
    borderWidth: 0.8,
    borderColor: '#F59E0B',
  },
  changeCityBtnText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  quickChipsScroll: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  quickChip: {
    backgroundColor: 'rgba(51, 65, 85, 0.65)',
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: 12,
    borderWidth: 0.8,
    borderColor: 'rgba(148, 163, 184, 0.25)',
  },
  quickChipSelected: {
    backgroundColor: '#D97706',
    borderColor: '#FDE047',
  },
  quickChipText: {
    color: '#E2E8F0',
    fontSize: 11,
    fontWeight: '600',
  },
  quickChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  countdownContainer: {
    marginBottom: 16,
  },
  clockBox: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: 'rgba(245, 158, 11, 0.45)',
    padding: 14,
    alignItems: 'center',
  },
  clockDigitsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  digitUnit: {
    alignItems: 'center',
  },
  digitCard: {
    width: 66,
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(254, 240, 138, 0.25)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  digitNumber: {
    color: '#FEF08A',
    fontSize: 27,
    fontWeight: '800',
    letterSpacing: 1,
    fontVariant: ['tabular-nums'],
  },
  digitSeconds: {
    color: '#F97316',
  },
  digitColon: {
    color: '#FDE047',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 16,
  },
  digitLabel: {
    color: '#94A3B8',
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.4,
    marginTop: 4,
  },
  timeExpectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 0.8,
    borderTopColor: 'rgba(148, 163, 184, 0.15)',
  },
  timeExpectedText: {
    color: '#E2E8F0',
    fontSize: 11.5,
    fontWeight: '600',
  },
  timeExpectedHighlight: {
    color: '#FDE047',
    fontWeight: '800',
  },
  risenBanner: {
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1.2,
    borderColor: '#F59E0B',
  },
  risenEmoji: {
    fontSize: 32,
    marginBottom: 4,
  },
  risenTitle: {
    color: '#FEF08A',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  risenSubtitle: {
    color: '#FFFDF5',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 17,
  },
  infoGridContainer: {
    marginBottom: 10,
  },
  infoSectionHeader: {
    color: '#FEF08A',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
    marginBottom: 10,
  },
  infoCardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  infoCard: {
    width: '48.5%',
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    borderRadius: 13,
    padding: 10,
    borderWidth: 0.8,
    borderColor: 'rgba(254, 240, 138, 0.18)',
  },
  infoCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 3,
  },
  infoCardIcon: {
    fontSize: 14,
  },
  infoCardTitle: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '700',
  },
  infoCardTime: {
    color: '#FEF08A',
    fontSize: 12.5,
    fontWeight: '800',
    marginBottom: 2,
  },
  infoCardDesc: {
    color: '#94A3B8',
    fontSize: 9.5,
    lineHeight: 12.5,
  },
  viewAllCitiesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.5)',
    marginTop: 4,
  },
  viewAllCitiesBtnText: {
    color: '#FEF08A',
    fontSize: 12,
    fontWeight: '700',
  },
  fullCityListSection: {
    marginTop: 10,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(148, 163, 184, 0.2)',
    marginBottom: 12,
  },
  cityListHeaderTitle: {
    color: '#FEF08A',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 0.8,
    borderColor: 'rgba(148, 163, 184, 0.25)',
    marginBottom: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 12.5,
    padding: 0,
  },
  cityTable: {
    maxHeight: 280,
    borderRadius: 12,
    overflow: 'hidden',
  },
  cityTableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 9,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderBottomWidth: 0.8,
    borderBottomColor: 'rgba(148, 163, 184, 0.12)',
  },
  cityTableRowSelected: {
    backgroundColor: 'rgba(217, 119, 6, 0.35)',
  },
  cityRowLeft: {
    flex: 1,
  },
  cityNameText: {
    color: '#F1F5F9',
    fontSize: 12.5,
    fontWeight: '700',
  },
  cityNameTextSelected: {
    color: '#FEF08A',
    fontWeight: '800',
  },
  stateNameText: {
    color: '#94A3B8',
    fontSize: 10,
    marginTop: 1,
  },
  cityRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  moonriseBadgeText: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '700',
  },
  moonriseBadgeTextSelected: {
    color: '#FDE047',
    fontWeight: '800',
  },
});
