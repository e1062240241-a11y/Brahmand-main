import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
  StatusBar,
  TextInput,
  ActivityIndicator,
  Modal,
  ImageBackground,
  Alert,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import { getTempleImageByName } from '../../src/constants/templeImages';
import { getTemples } from '../../src/services/api';
import { getCurrentGayatriEnd, isWithinGayatriMantraWindow, formatTime } from '../../src/features/live-mantra/schedule';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BANNER_H_MARGIN = 16;
const BANNER_WIDTH = SCREEN_WIDTH - BANNER_H_MARGIN * 2;
const BANNER_HEIGHT = Math.round(BANNER_WIDTH * 0.48);
const BANNER_RADIUS = 22;
const HERO_DOT_COUNT = 4;

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const LIVE_JAAPS = [
  { 
    id: '1', 
    title: 'Hanuman\nChalisa', 
    devotees: '9.6K', 
    image: require('../../assets/images/hanuman_jaap_card_v2.png'),
    slok: 'श्रीगुरु चरन सरोज रज निज मनु मुकुरु सुधारि...'
  },
  { 
    id: '2', 
    title: 'Hare Krishna\nJaap', 
    devotees: '6.4K', 
    image: require('../../assets/images/krishna_jaap_card_v2.png'),
    slok: 'हरे कृष्ण हरे कृष्ण कृष्ण कृष्ण हरे हरे...'
  },
  { 
    id: '3', 
    title: 'Om Namah\nShivaya', 
    devotees: '5.2K', 
    image: require('../../assets/images/shiva_jaap_card_v2.png'),
    slok: 'ॐ नमः शिवाय ॐ नमः शिवाय...'
  },
  { 
    id: '4', 
    title: 'Gayatri\nMantra', 
    devotees: '4.8K', 
    image: require('../../assets/images/gayatri_jaap_card_v4_exact_clean.png'),
    slok: 'ॐ भूर्भुवः स्वः तत्सवितुर्वरेण्यं...'
  },
  { 
    id: '5', 
    title: 'Ganesh\nMantra', 
    devotees: '8.2K', 
    image: require('../../assets/images/ganesh_jaap_card.png'),
    slok: 'ॐ गं गणपतये नमः ॐ गं गणपतये नमः...'
  },
  { 
    id: '6', 
    title: 'Laxmi\nMantra', 
    devotees: '6.1K', 
    image: require('../../assets/images/laxmi_jaap_card.png'),
    slok: 'ॐ श्रीं महालक्ष्म्यै नमः ॐ श्रीं...'
  },
  { 
    id: '7', 
    title: 'Krishna\nJaap', 
    devotees: '7.2K', 
    image: require('../../assets/images/krishna_jaap_card_v3.png'),
    slok: 'राधे राधे राधे राधे श्याम मिलाए दे...'
  },
];

const UPCOMING_SESSIONS = [
  { id: '1', category: 'YOGA CLASS', title: 'Morning Yoga Flow', desc: 'Start your day with energy and positivity.', date: 'Tomorrow', time: '6:00 AM', going: '2.4K going', image: require('../../assets/images/yoga_session_img.png') },
  { id: '2', category: 'GEETA PATH', title: 'Bhagavad Gita Chapter 2', desc: 'Dive deep into wisdom.', date: 'Tomorrow', time: '7:30 PM', going: '3.2K going', image: require('../../assets/images/geeta_session_v3.png') },
  { id: '3', category: 'SANSKRIT CLASS', title: 'Sanskrit Language Basics', desc: 'Learn. Chant. Connect.', date: '21 May', time: '6:30 PM', going: '1.9K going', image: require('../../assets/images/sanskrit_session_v2_exact.png') },
  { id: '4', category: 'MEDITATION', title: 'Breathing & Meditation', desc: 'Find calm within.', date: '22 May', time: '6:00 AM', going: '2.1K going', image: require('../../assets/images/yoga_session_img.png') },
];

export default function JaapLandingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const [now, setNow] = useState(new Date());
  const [activeSection, setActiveSection] = useState<'jaap' | 'temple'>('jaap');
  const [heroBannerIndex, setHeroBannerIndex] = useState(0);

  // Auto-scroll ref for More Live Jaaps
  const jaapScrollRef = useRef<ScrollView>(null);
  const jaapScrollOffset = useRef(0);
  const jaapScrollDir = useRef(1); // 1 = forward, -1 = backward
  const CARD_WIDTH = 250; // approx card + gap

  // Temple State
  const [temples, setTemples] = useState<any[]>([]);
  const [loadingTemples, setLoadingTemples] = useState(false);
  const [templeSearch, setTempleSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | 'Jyotirlinga' | 'Sacred'>('All');

  useEffect(() => {
    if (!isFocused) return;
    const timer = setInterval(() => setNow(new Date()), 15_000);
    return () => clearInterval(timer);
  }, [isFocused]);

  // Auto-scroll effect for More Live Jaaps
  useEffect(() => {
    const maxOffset = CARD_WIDTH * (LIVE_JAAPS.length - 2);
    const autoScroll = setInterval(() => {
      jaapScrollOffset.current += jaapScrollDir.current * CARD_WIDTH;
      if (jaapScrollOffset.current >= maxOffset) {
        jaapScrollDir.current = -1;
      } else if (jaapScrollOffset.current <= 0) {
        jaapScrollDir.current = 1;
      }
      jaapScrollRef.current?.scrollTo({ x: jaapScrollOffset.current, animated: true });
    }, 2800);
    return () => clearInterval(autoScroll);
  }, []);

  const liveActive = isWithinGayatriMantraWindow(now);
  const liveEnd = getCurrentGayatriEnd(now);

  const fetchTemplesData = async () => {
    try {
      setLoadingTemples(true);
      const response = await getTemples();
      if (response.data) {
        setTemples(response.data);
      }
    } catch (error) {
      console.error('Error fetching temples in Jaap:', error);
    } finally {
      setLoadingTemples(false);
    }
  };

  useEffect(() => {
    if (activeSection === 'temple' && temples.length === 0) {
      fetchTemplesData();
    }
  }, [activeSection]);

  const getTempleLocation = (item: any) => {
    if (typeof item.location === 'string') return item.location;
    if (typeof item.location === 'object' && item.location !== null) {
      const { area, city, state } = item.location;
      return [area, city, state].filter(Boolean).join(', ');
    }
    return item.location || 'Unknown Location';
  };

  const filteredTemples = (temples || []).filter(t => {
    const loc = getTempleLocation(t);
    const matchesSearch = (t.name?.toLowerCase().includes(templeSearch.toLowerCase()) || 
                          loc.toLowerCase().includes(templeSearch.toLowerCase()));
    
    let matchesCategory = true;
    if (selectedCategory === 'Jyotirlinga') {
      matchesCategory = t.category === 'Jyotirlinga';
    } else if (selectedCategory === 'Sacred') {
      matchesCategory = t.category !== 'Jyotirlinga';
    }

    return matchesSearch && matchesCategory;
  });

  const switchSection = useCallback((section: 'jaap' | 'temple') => {
    LayoutAnimation.configureNext(
      LayoutAnimation.create(240, LayoutAnimation.Types.easeInEaseOut, LayoutAnimation.Properties.opacity)
    );
    setActiveSection(section);
  }, []);

  const renderTopTab = (section: 'jaap' | 'temple', label: string) => {
    const isActive = activeSection === section;
    return (
      <TouchableOpacity
        key={section}
        style={[styles.topTabButton, isActive && styles.topTabButtonActive]}
        onPress={() => switchSection(section)}
        activeOpacity={1}
      >
        <Text style={[styles.topTabText, isActive && styles.topTabTextActive]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const heroTitle = liveActive ? 'Mahamrityunjaya Mantra' : 'Evening Gayatri Chanting';
  const heroTagline = liveActive
    ? 'We chant. We heal. We rise together.'
    : 'Connect with the divine light. Starting at 6:00 PM.';
  const heroTimeLabel = liveActive
    ? `Live until ${liveEnd ? formatTime(liveEnd) : '5:00 PM'}`
    : 'Next Session: 6:00 PM Today';

  return (
    <LinearGradient
      colors={['#FF8D57', '#EA9B76', '#FFFFFF']}
      locations={[0, 0.0481, 0.2404]}
      style={{ flex: 1 }}
    >
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" />

      <View style={[styles.stickyTopTabsWrap, { paddingTop: insets.top + 10 }]}>
        <View style={styles.topTabsContainer}>
          <View style={styles.topTabsInner}>
            {renderTopTab('jaap', 'Jaap')}
            {renderTopTab('temple', 'Temple')}
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.mainScroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 90 + insets.bottom }}
        bounces
      >
        {activeSection === 'jaap' ? (
          <>
            <View style={[styles.heroFixedContainer, { height: BANNER_HEIGHT }]}>
              <ImageBackground
                source={require('../../assets/images/jaap_hero_shiva_final.png')}
                style={styles.heroBannerFill}
                imageStyle={styles.heroBannerImageStyle}
                resizeMode="cover"
              >
                <LinearGradient
                  colors={['rgba(0,0,0,0.08)', 'rgba(0,0,0,0.35)', 'rgba(0,0,0,0.82)']}
                  locations={[0, 0.38, 1]}
                  style={StyleSheet.absoluteFillObject}
                />

                <View style={styles.bannerContent}>
                  <View style={styles.bannerTopRow}>
                    <View style={styles.bannerTopSpacer} />
                    <View style={[styles.mockupLiveBadge, !liveActive && styles.mockupScheduledBadge]}>
                      <View style={styles.liveDot} />
                      <Text style={styles.mockupLiveText}>{liveActive ? 'LIVE' : 'SOON'}</Text>
                    </View>
                  </View>

                  <View style={styles.bannerTextBlock}>
                    <Text style={styles.mockupMainTitle} numberOfLines={2}>
                      {heroTitle}
                    </Text>
                    <Text style={styles.mockupTagline} numberOfLines={2}>
                      {heroTagline}
                    </Text>
                    <View style={styles.bannerTimeRow}>
                      <Ionicons name="time-outline" size={14} color="rgba(255,255,255,0.92)" />
                      <Text style={styles.bannerTimeText}>{heroTimeLabel}</Text>
                    </View>
                  </View>

                  <View style={styles.bannerFooter}>
                    <TouchableOpacity
                      style={styles.mockupJoinNowBtn}
                      activeOpacity={0.9}
                      onPress={() =>
                        router.push({
                          pathname: '/live-jaap-welcome',
                          params: {
                            mantraType: liveActive ? 'mrityunjaya' : 'gayatri',
                            title: liveActive ? 'Maha Mrityunjaya' : 'Gayatri Mantra',
                          },
                        })
                      }
                    >
                      <LinearGradient
                        colors={['#FF6B00', '#FF8800']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.mockupJoinGradient}
                      >
                        <MaterialCommunityIcons name="broadcast" size={17} color="#FFF" />
                        <Text style={styles.mockupJoinJaapText}>
                          {liveActive ? 'Join Live Jaap' : 'Set Reminder'}
                        </Text>
                        <Ionicons name="chevron-forward" size={15} color="#FFF" />
                      </LinearGradient>
                    </TouchableOpacity>

                    <View style={styles.bannerDotsRow} pointerEvents="none">
                      {Array.from({ length: HERO_DOT_COUNT }).map((_, index) => (
                        <View
                          key={`hero-dot-${index}`}
                          style={[
                            styles.bannerDot,
                            index === heroBannerIndex && styles.bannerDotActive,
                          ]}
                        />
                      ))}
                    </View>
                  </View>
                </View>
              </ImageBackground>
            </View>

            <View style={styles.sectionHeaderParity}>
              <Text style={styles.sectionTitleText}>More Live Jaaps</Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => router.push('/all-live-jaaps' as any)}
                style={{ flexDirection: 'row', alignItems: 'center' }}
              >
                <Text style={styles.viewAllSaffronRefined}>View All</Text>
                <Ionicons name="chevron-forward" size={18} color="#FF6600" />
              </TouchableOpacity>
            </View>

            <ScrollView
              ref={jaapScrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.miniCardsRowPadding}
              scrollEventThrottle={16}
              onScroll={(e) => {
                jaapScrollOffset.current = e.nativeEvent.contentOffset.x;
              }}
            >
              {LIVE_JAAPS.map((jaap) => (
                <TouchableOpacity
                  key={jaap.id}
                  style={[styles.jaapCardContainer, { width: 240, backgroundColor: '#1A0A00' }]}
                  onPress={() => router.push({
                    pathname: '/live-jaap-welcome',
                    params: {
                      mantraType: jaap.id === '1' ? 'hanuman' : jaap.id === '2' ? 'krishna' : jaap.id === '3' ? 'shiva' : jaap.id === '4' ? 'gayatri' : jaap.id === '5' ? 'ganesh' : jaap.id === '6' ? 'laxmi' : 'krishna',
                      title: jaap.title.replace('\n', ' ')
                    }
                  })}
                >
                  <Image
                    source={jaap.image}
                    style={{ width: '100%', height: '100%', position: 'absolute' }}
                    resizeMode="cover"
                  />
                  <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.jaapCardOverlayExact}>
                    <View style={styles.jaapCardTopRow}>
                      <View style={styles.exactLiveBadge}>
                        <Ionicons name="radio" size={12} color="#FFF" style={{ marginRight: 4 }} />
                        <Text style={styles.exactLiveText}>LIVE</Text>
                      </View>
                      <View style={styles.exactCountBadge}>
                        <Text style={styles.exactCountText}>{jaap.devotees}</Text>
                      </View>
                    </View>
                    <View style={styles.jaapCardBottomArea}>
                      <Text style={styles.jaapCardTitleExact}>{jaap.title}</Text>
                      <Text style={styles.jaapCardSlokExact} numberOfLines={2}>{jaap.slok}</Text>
                      <TouchableOpacity
                        style={styles.exactJoinBtn}
                        onPress={() => router.push({
                          pathname: '/live-jaap-welcome',
                          params: {
                            mantraType: jaap.id === '1' ? 'hanuman' : jaap.id === '2' ? 'krishna' : jaap.id === '3' ? 'shiva' : jaap.id === '4' ? 'gayatri' : jaap.id === '5' ? 'ganesh' : jaap.id === '6' ? 'laxmi' : 'krishna',
                            title: jaap.title.replace('\n', ' ')
                          }
                        })}
                      >
                        <View style={{ flex: 1, alignItems: 'center', paddingLeft: 30 }}>
                          <Text style={styles.exactJoinText}>Join</Text>
                        </View>
                        <View style={styles.waveformIconBox}>
                          <MaterialCommunityIcons name="waveform" size={24} color="#FF6600" />
                        </View>
                      </TouchableOpacity>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.sectionHeaderParity}>
              <Text style={[styles.sectionTitleText, { flexShrink: 1, marginRight: 12 }]}>Upcoming Spiritual Sessions</Text>
              <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 0 }}>
                <Text style={styles.viewAllSaffronRefined}>View All</Text>
                <Ionicons name="chevron-forward" size={18} color="#FF6600" />
              </TouchableOpacity>
            </View>

            <View style={styles.sessionsColPadding}>
              {UPCOMING_SESSIONS.map((session) => (
                <View key={session.id} style={styles.sessionCard}>
                  {/* Image + Text row */}
                  <View style={styles.sessionTopRow}>
                    <Image source={session.image} style={styles.sessionImg} resizeMode="cover" />
                    <View style={styles.sessionTextCol}>
                      <Text style={styles.sessionCat}>{session.category}</Text>
                      <Text style={styles.sessionTitle}>{session.title}</Text>
                      <Text style={styles.sessionDesc}>{session.desc}</Text>
                    </View>
                  </View>
                  {/* Reminder button */}
                  <TouchableOpacity
                    style={styles.reminderBtn}
                    activeOpacity={0.8}
                    onPress={() =>
                      Alert.alert(
                        '🔔 Reminder Set!',
                        `You will be reminded for "${session.title}" on ${session.date} at ${session.time}.`,
                        [{ text: 'OK', style: 'default' }]
                      )
                    }
                  >
                    <Ionicons name="notifications-outline" size={16} color="#FF6600" />
                    <Text style={styles.reminderBtnText}>Reminder</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </>
        ) : (
          <View style={[styles.templeViewContainer, { paddingTop: 0 }]}>
            {/* Hero Banner (Same structure as Jaap tab banner) */}
            <View style={[styles.heroFixedContainer, { height: BANNER_HEIGHT, marginTop: 12 }]}>
              <ImageBackground
                source={require('../../assets/images/image temple/SomnathTemple.jpg')}
                style={styles.heroBannerFill}
                imageStyle={styles.heroBannerImageStyle}
                resizeMode="cover"
              >
                <LinearGradient
                  colors={['rgba(0,0,0,0.08)', 'rgba(0,0,0,0.35)', 'rgba(0,0,0,0.82)']}
                  locations={[0, 0.38, 1]}
                  style={StyleSheet.absoluteFillObject}
                />
                <View style={styles.bannerContent}>
                  <View style={styles.bannerTopRow}>
                    <View style={styles.bannerTopSpacer} />
                    <View style={styles.mockupLiveBadge}>
                      <View style={styles.liveDot} />
                      <Text style={styles.mockupLiveText}>LIVE</Text>
                    </View>
                  </View>
                  <View style={[styles.bannerTextBlock, { marginBottom: 15 }]}>
                    <Text style={styles.mockupMainTitle} numberOfLines={2}>Somnath Mandir</Text>
                    <Text style={styles.mockupTagline} numberOfLines={1}>1,248 devotees are chanting</Text>
                    <View style={styles.bannerTimeRow}>
                      <Ionicons name="time-outline" size={14} color="rgba(255,255,255,0.92)" />
                      <Text style={styles.bannerTimeText}>Live until 5:00 PM</Text>
                    </View>
                  </View>
                  <View style={[styles.bannerFooter, { paddingBottom: 0 }]}>
                    <TouchableOpacity style={styles.mockupJoinNowBtn} activeOpacity={0.9}>
                      <LinearGradient colors={['#FF6B00', '#FF8800']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.mockupJoinGradient}>
                        <MaterialCommunityIcons name="waveform" size={17} color="#FFF" />
                        <Text style={styles.mockupJoinJaapText}>Join Live Aarti</Text>
                        <Ionicons name="chevron-forward" size={15} color="#FFF" />
                      </LinearGradient>
                    </TouchableOpacity>
                    <View style={[styles.bannerDotsRow, { bottom: 6 }]} pointerEvents="none">
                       <View style={[styles.bannerDot, styles.bannerDotActive]} />
                       <View style={styles.bannerDot} />
                       <View style={styles.bannerDot} />
                       <View style={styles.bannerDot} />
                    </View>
                  </View>
                </View>
              </ImageBackground>
            </View>

            {/* Search Bar matching image */}
            <View style={styles.newTempleSearchSection}>
              <View style={styles.newTempleSearchBarWrapper}>
                <Ionicons name="search-outline" size={20} color="#999" style={{ marginRight: 10 }} />
                <TextInput 
                  placeholder="Search Mandir"
                  style={styles.newTempleSearchInput}
                  value={templeSearch}
                  onChangeText={setTempleSearch}
                  placeholderTextColor="#999"
                />
              </View>
              <TouchableOpacity style={styles.filterIconBtn}>
                <MaterialCommunityIcons name="text-search" size={28} color="#FF6600" />
              </TouchableOpacity>
            </View>

            {/* Temple Category Pills (Restored) */}
            <View style={styles.templeCatPillsRow}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingLeft: 20 }}>
                {(['All', 'Jyotirlinga', 'Sacred'] as const).map((cat) => (
                  <TouchableOpacity 
                    key={cat} 
                    style={[styles.templeCatPill, selectedCategory === cat && styles.templeCatPillActive]}
                    onPress={() => setSelectedCategory(cat)}
                  >
                    <Text style={[styles.templeCatPillText, selectedCategory === cat && styles.templeCatPillTextActive]}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Temple List */}
            <View style={styles.newTempleListPadding}>
              {loadingTemples ? (
                <ActivityIndicator size="large" color="#FF6600" />
              ) : filteredTemples.length > 0 ? (
                filteredTemples.map((item, idx) => (
                  <View key={item.id} style={styles.newTempleCard}>
                    {/* Hardcoded Badge for 2nd item matching design */}
                    {idx === 1 && (
                      <View style={styles.blueBadge}>
                        <Text style={styles.blueBadgeText}># भगवद गीता अध्याय 2</Text>
                      </View>
                    )}
                    <Image source={getTempleImageByName(item.name)} style={styles.newTempleCardImg} resizeMode="cover" />
                    <View style={styles.newTempleCardInfo}>
                      <View>
                        <Text style={styles.newTempleCardDeity}>{item.deity || 'LORD SHIVA'}</Text>
                        <Text style={styles.newTempleCardName}>{item.name}</Text>
                        <Text style={styles.newTempleCardLoc}>{getTempleLocation(item)}</Text>
                      </View>
                      <TouchableOpacity style={styles.newTempleOpenBtn} onPress={() => router.push(`/temple/${encodeURIComponent(String(item.id))}`)}>
                        <Text style={styles.newTempleOpenBtnText}>Open in Maps</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.noTemplesFound}>
                  <MaterialCommunityIcons name="temple-hindu-outline" size={60} color="#F5E0C3" />
                  <Text style={styles.noTemplesText}>No sacred temples found.</Text>
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  stickyTopTabsWrap: {
    zIndex: 100,
    elevation: 10,
    backgroundColor: 'transparent',
    paddingBottom: 10,
  },
  mainScroll: {
    flex: 1,
  },
  topTabsContainer: {
    paddingHorizontal: 20,
  },
  topTabsInner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(243, 244, 246, 0.50)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(229, 231, 235, 0.50)',
    padding: 4,
  },
  topTabButton: {
    flex: 1,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTabButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 2, height: 0 },
    elevation: 5,
  },
  topTabText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#8E8E93',
  },
  topTabTextActive: {
    color: '#FF6600',
  },
  // legacy (kept for other references)
  jaapTabExact: { flex: 1, height: '100%' },
  jaapGradientExact: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  jaapMandalaHeader: { display: 'none' },
  jaapContentRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  omSymbolExact: { fontSize: 24, color: '#FFF', fontWeight: '800' },
  tabTextColumn: { justifyContent: 'center' },
  tabTitleExact: { color: '#FFF', fontSize: 18, fontWeight: '900' },
  tabSubExact: { display: 'none' },
  lotusPetalEdge: { display: 'none' },
  petalCurve: { display: 'none' },
  templeTabExact: { flex: 1, height: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  templeContentRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  templeIconBoxExact: { width: 24, height: 24, justifyContent: 'center', alignItems: 'center' },
  templeTitleExact: { color: '#FF6600', fontSize: 18, fontWeight: '900' },
  templeSubExact: { display: 'none' },
  heroTitleSectionExact: { paddingHorizontal: 25, marginTop: 32, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  heroTextCol: { flex: 1 },
  liveJaapTag: { color: '#FF6600', fontSize: 14, fontWeight: '900', letterSpacing: 0.8, marginBottom: 10 },
  heroMainTitleExact: { fontSize: 26, fontWeight: '800', color: '#2D1400', lineHeight: 34, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  viewAllPillRefined: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,102,0,0.1)', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 24, borderWidth: 1.2, borderColor: '#FF6600' },
  viewAllTextRefined: { color: '#FF6600', fontSize: 14, fontWeight: '900', marginRight: 2 },
  heroFixedContainer: {
    width: BANNER_WIDTH,
    overflow: 'hidden',
    marginHorizontal: BANNER_H_MARGIN,
    borderRadius: BANNER_RADIUS,
    marginTop: 12,
    backgroundColor: '#1A0A00',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
  },
  heroBannerFill: {
    width: '100%',
    height: '100%',
  },
  heroBannerImageStyle: {
    borderRadius: BANNER_RADIUS,
  },
  bannerContent: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 16,
    justifyContent: 'space-between',
    zIndex: 2,
  },
  bannerTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
  },
  bannerTopSpacer: {
    flex: 1,
  },
  bannerTextBlock: {
    flexShrink: 1,
    paddingRight: 8,
    marginBottom: 35, // Pushes the text block even further upwards
  },
  mockupLiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF3B30',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    zIndex: 3,
  },
  mockupScheduledBadge: {
    backgroundColor: '#FF8800',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFF',
    marginRight: 5,
  },
  mockupLiveText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  mockupMainTitle: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 28,
    letterSpacing: -0.2,
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  mockupTagline: {
    color: 'rgba(255,255,255,0.94)',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 6,
    lineHeight: 18,
  },
  bannerTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 5,
  },
  bannerTimeText: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 12,
    fontWeight: '700',
  },
  bannerFooter: {
    minHeight: 56,
    justifyContent: 'flex-end',
    paddingBottom: 0, // reduced to 0 to push button to bottom edge
  },
  mockupJoinNowBtn: {
    alignSelf: 'flex-start',
    borderRadius: 26,
    overflow: 'hidden',
    zIndex: 4,
    maxWidth: '78%',
    elevation: 8,
    shadowColor: '#FF6600',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  mockupJoinGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 26,
    gap: 8,
  },
  mockupJoinJaapText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '900',
    flexShrink: 1,
  },
  bannerDotsRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 6, // Moved dots lower
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    zIndex: 2,
  },
  bannerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  bannerDotActive: {
    width: 18,
    backgroundColor: '#FF6600',
  },
  mockupOmCircle: { backgroundColor: 'rgba(255,255,255,0.2)', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  mockupOmIcon: { color: '#FFF', fontSize: 18, fontWeight: '900' },
  mockupWaveformBox: { position: 'absolute', bottom: 20, right: 20, flexDirection: 'row' },
  sectionHeaderParity: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 25, marginTop: 24, marginBottom: 16 },
  viewAllBtnRefined: { paddingHorizontal: 10, paddingVertical: 5 },
  viewAllPillBtn: {
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#FF6600',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
  },
  viewAllPillGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  viewAllPillText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  sectionTitleText: { fontSize: 22, fontWeight: '900', color: '#2D1400' },
  viewAllSaffronRefined: { color: '#FF6600', fontSize: 16, fontWeight: '800' },
  miniCardsRowPadding: { paddingLeft: 25 },
  jaapCardContainer: { width: 220, height: 320, marginRight: 22, borderRadius: 32, overflow: 'hidden', elevation: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.25, shadowRadius: 15 },
  jaapCardOverlayExact: { flex: 1, padding: 15, justifyContent: 'space-between' },
  jaapCardTopRow: { flexDirection: 'row', justifyContent: 'space-between' },
  exactLiveBadge: { backgroundColor: '#E31E24', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, flexDirection: 'row', alignItems: 'center' },
  exactLiveText: { color: '#FFF', fontSize: 11, fontWeight: '900' },
  exactCountBadge: { backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12 },
  exactCountText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  jaapCardBottomArea: { width: '100%' },
  jaapCardTitleExact: { color: '#FFF', fontSize: 26, fontWeight: '900', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4, marginBottom: 8 },
  jaapCardSlokExact: { color: 'rgba(255,255,255,0.9)', fontSize: 12, fontWeight: '600', fontStyle: 'italic', backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', marginBottom: 12 },
  exactJoinBtn: { backgroundColor: '#FFF', height: 48, borderRadius: 24, flexDirection: 'row', alignItems: 'center', elevation: 5 },
  exactJoinText: { color: '#FF6600', fontSize: 18, fontWeight: '800' },
  waveformIconBox: { marginRight: 15 },
  sessionsColPadding: { paddingHorizontal: 20 },
  // New session card matching provided design
  sessionCard: {
    backgroundColor: '#F5E6D3',
    borderRadius: 20,
    padding: 12,
    marginBottom: 14,
  },
  sessionTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 12,
  },
  sessionImg: {
    width: 80,
    height: 80,
    borderRadius: 12,
    flexShrink: 0,
  },
  sessionTextCol: {
    flex: 1,
    justifyContent: 'center',
  },
  sessionCat: {
    color: '#FF6600',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
    textAlign: 'left',
    marginBottom: 2,
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2D1400',
    lineHeight: 20,
    marginBottom: 2,
  },
  sessionDesc: {
    fontSize: 12,
    color: '#8B4513',
    fontWeight: '500',
    opacity: 0.75,
    lineHeight: 16,
  },
  reminderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: '#FF6600',
    borderRadius: 30,
    paddingVertical: 10,
    backgroundColor: 'transparent',
  },
  reminderBtnText: {
    color: '#FF6600',
    fontSize: 15,
    fontWeight: '700',
  },
  // legacy styles kept for other uses
  exactSessionItemCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFBF5', borderRadius: 24, padding: 15, marginBottom: 15, elevation: 5, shadowColor: '#8B4513', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.1, shadowRadius: 8, borderWidth: 1, borderColor: '#F5E0C3' },
  exactSessionImg: { width: 100, height: 100, borderRadius: 18, marginRight: 15 },
  exactSessionMainInfo: { flex: 2, gap: 4 },
  exactSessionCat: { color: '#FF6600', fontSize: 12, fontWeight: '900' },
  exactSessionTitle: { fontSize: 18, fontWeight: '800', color: '#2D1400' },
  exactSessionDesc: { fontSize: 12, color: '#8B4513', opacity: 0.7 },
  exactSessionDateTimeCol: { flex: 1.2, gap: 8 },
  exactSessionGoingCol: { flex: 1.2 },
  metaEntry: { flexDirection: 'row', alignItems: 'center' },
  metaEntryText: { fontSize: 13, color: '#8B4513', fontWeight: '700', marginLeft: 8 },
  exactSetReminderBtn: { flex: 1.5, backgroundColor: '#FFF', height: 50, borderRadius: 15, borderWidth: 1, borderColor: '#FFB380', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  exactReminderText: { color: '#FF6600', fontSize: 12, fontWeight: '800' },

  // Temple View Styles
  templeViewContainer: { flex: 1, paddingTop: 20 },
  templeSearchSection: { paddingHorizontal: 20, marginBottom: 15 },
  templeSearchBarWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF8F0', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 12, borderWidth: 1, borderColor: '#F5E0C3' },
  templeSearchInputField: { flex: 1, fontSize: 14, color: '#2D1400', fontWeight: '600' },
  templeCatPillsRow: { marginBottom: 20 },
  templeCatPill: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20, backgroundColor: '#FFF', marginRight: 10, borderWidth: 1, borderColor: '#F5E0C3' },
  templeCatPillActive: { backgroundColor: '#FF6600', borderColor: '#FF6600' },
  templeCatPillText: { fontSize: 13, fontWeight: '700', color: '#8B4513' },
  templeCatPillTextActive: { color: '#FFF' },
  templeListPadding: { paddingHorizontal: 20 },
  templeCardItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 24, padding: 12, marginBottom: 15, elevation: 4, shadowColor: '#8B4513', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, borderWidth: 1, borderColor: '#F5E0C3' },
  templeCardImg: { width: 80, height: 80, borderRadius: 18 },
  templeCardInfo: { flex: 1, marginLeft: 15, gap: 4 },
  templeCardName: { fontSize: 17, fontWeight: '800', color: '#2D1400' },
  templeCardLocRow: { flexDirection: 'row', alignItems: 'center' },
  templeCardLocText: { fontSize: 12, color: '#8B4513', fontWeight: '700', marginLeft: 4, opacity: 0.8 },
  templeCardDeity: { fontSize: 11, color: '#8B4513', fontWeight: '600', opacity: 0.6 },
  templeCardTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FF6600', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, gap: 4 },
  templeCardTagText: { fontSize: 9, fontWeight: '900', color: '#FFF', textTransform: 'uppercase' },
  noTemplesFound: { alignItems: 'center', marginTop: 60, gap: 15 },
  noTemplesText: { fontSize: 16, color: '#8B4513', fontWeight: '700', opacity: 0.5 },

  newTempleSearchSection: { paddingHorizontal: 16, marginTop: 20, marginBottom: 15, flexDirection: 'row', alignItems: 'center', gap: 10 },
  newTempleSearchBarWrapper: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 25, paddingHorizontal: 16, height: 46, borderWidth: 1, borderColor: '#CCC' },
  newTempleSearchInput: { flex: 1, fontSize: 14, color: '#333', fontFamily: 'Inter_500Medium' },
  filterIconBtn: { padding: 4 },
  newTempleListPadding: { paddingHorizontal: 16, paddingBottom: 20 },
  newTempleCard: { backgroundColor: '#FDF5EC', borderRadius: 16, padding: 12, marginBottom: 16, flexDirection: 'row', position: 'relative' },
  newTempleCardImg: { width: 100, height: 120, borderRadius: 12 },
  newTempleCardInfo: { flex: 1, marginLeft: 16, justifyContent: 'space-between', paddingVertical: 2 },
  newTempleCardDeity: { color: '#FF6600', fontSize: 10, fontFamily: 'Inter_700Bold', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 2 },
  newTempleCardName: { color: '#000', fontSize: 16, fontFamily: 'Inter_700Bold', marginBottom: 4 },
  newTempleCardLoc: { color: '#555', fontSize: 11, fontFamily: 'Inter_500Medium', marginBottom: 12 },
  newTempleOpenBtn: { borderWidth: 1.5, borderColor: '#FF6600', borderRadius: 20, paddingVertical: 8, alignItems: 'center' },
  newTempleOpenBtnText: { color: '#FF6600', fontSize: 13, fontFamily: 'Inter_700Bold' },
  blueBadge: { position: 'absolute', top: -8, left: 12, backgroundColor: '#0084FF', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, zIndex: 10 },
  blueBadgeText: { color: '#FFF', fontSize: 9, fontFamily: 'Inter_700Bold' },
});
