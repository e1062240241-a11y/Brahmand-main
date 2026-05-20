import React, { useState, useEffect, useRef } from 'react';
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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { getTempleImageById } from '../../src/constants/templeImages';
import { getTemples } from '../../src/services/api';
import { getCurrentGayatriEnd, isWithinGayatriMantraWindow, formatTime } from '../../src/features/live-mantra/schedule';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
  const [now, setNow] = useState(new Date());
  const [activeSection, setActiveSection] = useState<'jaap' | 'temple'>('jaap');

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
    const timer = setInterval(() => setNow(new Date()), 15_000);
    return () => clearInterval(timer);
  }, []);

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


  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.topTabsContainer}>
        <View style={styles.topTabsInner}>
          <TouchableOpacity
            style={[
              styles.tabPill,
              activeSection === 'jaap' && styles.tabPillActive,
            ]}
            onPress={() => setActiveSection('jaap')}
            activeOpacity={0.9}
          >
            <Text
              style={[
                styles.tabPillText,
                activeSection === 'jaap' && styles.tabPillTextActive,
              ]}
            >
              Jaap
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabPill,
              activeSection === 'temple' && styles.tabPillActive,
            ]}
            onPress={() => setActiveSection('temple')}
            activeOpacity={0.9}
          >
            <Text
              style={[
                styles.tabPillText,
                activeSection === 'temple' && styles.tabPillTextActive,
              ]}
            >
              Temple
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={{ 
          paddingBottom: 90 
        }}
      >
        {activeSection === 'jaap' ? (
          <>
            <View style={styles.heroTitleSectionExact}>
              <View style={styles.heroTextCol}>
                <Text style={styles.liveJaapTag}>LIVE JAAP</Text>
                <Text style={styles.heroMainTitleExact}>Join thousands of devotees in{"\n"}live collective chanting</Text>
              </View>
              <TouchableOpacity style={styles.viewAllPillRefined}>
                <Text style={styles.viewAllTextRefined}>View All</Text>
                <Ionicons name="chevron-forward" size={14} color="#FF6600" />
              </TouchableOpacity>
            </View>

            <View style={[styles.heroFixedContainer, { height: 500 }]}>
              <Image
                source={require('../../assets/images/jaap_hero_shiva_final.png')}
                style={{ position: 'absolute', width: '100%', height: '100%' }}
                resizeMode="stretch"
              />

              <View style={styles.mockupTopRow}>
                <View style={[styles.mockupLiveBadge, !liveActive && { backgroundColor: '#FF8800' }]}>
                  <Ionicons name={liveActive ? "radio" : "calendar"} size={16} color="#FFF" />
                  <Text style={styles.mockupLiveText}>{liveActive ? "LIVE NOW" : "SCHEDULED"}</Text>
                </View>
                <View style={styles.mockupDevoteeBadge}>
                  <Ionicons name="people" size={16} color="#FFF" />
                  <Text style={styles.mockupDevoteeText}>{liveActive ? "12.8K Devotees" : "Join Waitlist"}</Text>
                </View>
              </View>

              <View style={styles.mockupContentArea}>
                <Text style={styles.mockupMainTitle}>
                  {liveActive ? "Maha\nMrityunjaya\nJaap" : "Evening\nGayatri\nChanting"}
                </Text>
                <Text style={styles.mockupTagline}>
                  {liveActive 
                    ? "We chant. We heal.\nWe rise together." 
                    : "Connect with the divine light.\nStarting at 6:00 PM."}
                </Text>

                <View style={styles.mockupDevoteeRow}>
                  <View style={styles.avatarStack}>
                    <Image source={{ uri: 'https://i.pravatar.cc/100?u=1' }} style={styles.miniAvatar} />
                    <Image source={{ uri: 'https://i.pravatar.cc/100?u=2' }} style={[styles.miniAvatar, { marginLeft: -12 }]} />
                    <Image source={{ uri: 'https://i.pravatar.cc/100?u=3' }} style={[styles.miniAvatar, { marginLeft: -12 }]} />
                  </View>
                  <Text style={styles.mockupDevoteeCountSub}>
                    {liveActive ? "12,842+ devotees chanting together" : "4,200+ devotees already joined"}
                  </Text>
                </View>

                <TouchableOpacity 
                  style={styles.mockupJoinNowBtn} 
                  onPress={() => router.push({
                    pathname: '/live-jaap-welcome',
                    params: { 
                      mantraType: liveActive ? 'mrityunjaya' : 'gayatri',
                      title: liveActive ? 'Maha Mrityunjaya' : 'Gayatri Mantra'
                    }
                  })}
                >
                  <LinearGradient
                    colors={['#FF6B00', '#FF8800']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={styles.mockupJoinGradient}
                  >
                    <View style={[styles.buttonNotch, { left: -25 }]} />
                    <View style={[styles.buttonNotch, { right: -25 }]} />

                    <View style={styles.mockupJoinMainRow}>
                      <Text style={styles.mockupJoinOm}>ॐ</Text>
                      <Text style={styles.mockupJoinJaapText}>{liveActive ? "Join Jaap" : "Set Reminder"}</Text>
                    </View>
                    <Text style={styles.mockupJoinSubtext}>
                      {liveActive ? `Live until ${liveEnd ? formatTime(liveEnd) : ''}` : "Next Session: 6:00 PM Today"}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
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
          <View style={styles.templeViewContainer}>
            <View style={styles.heroRowLayoutExact}>
              <View style={styles.heroLeftContentExact}>
                <Text style={styles.heroDiscoverText}>Discover</Text>
                <Text style={styles.heroSacredText}>Sacred</Text>
                <Text style={styles.heroSacredText}>Temples</Text>
                
                <View style={styles.ornateDividerExact}>
                  <View style={styles.ornateLine} />
                  <View style={styles.ornateDiamondSmall}>
                    <View style={styles.diamondInnerSmall} />
                  </View>
                  <View style={styles.ornateLine} />
                </View>

                <Text style={styles.heroSubtitleExact}>
                  Explore divine places, seek blessings{"\n"}and connect with spirituality.
                </Text>
              </View>

              <View style={styles.heroRightImageContainerExact}>
                <Image 
                  source={require('../../assets/images/image temple/SomnathTemple.jpg')} 
                  style={styles.heroSideImageExact} 
                  resizeMode="cover"
                />
                <LinearGradient
                  colors={['#FFFBF5', 'rgba(255, 251, 245, 0)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.heroLeftMaskExact}
                />
              </View>
            </View>

            <View style={styles.templeSearchSection}>
              <View style={styles.templeSearchBarWrapper}>
                <Ionicons name="search-outline" size={20} color="#8B4513" style={{ marginRight: 10 }} />
                <TextInput 
                  placeholder="Search sacred temples..."
                  style={styles.templeSearchInputField}
                  value={templeSearch}
                  onChangeText={setTempleSearch}
                  placeholderTextColor="#A1887F"
                />
              </View>
            </View>

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

            <View style={styles.templeListPadding}>
              {loadingTemples ? (
                <ActivityIndicator size="large" color="#FF6600" />
              ) : filteredTemples.length > 0 ? (
                filteredTemples.map((item) => (
                  <TouchableOpacity 
                    key={item.id} 
                    style={styles.templeCardItem}
                    onPress={() => router.push(`/temple/${encodeURIComponent(String(item.id))}`)}
                  >
                    <Image source={getTempleImageById(item.id)} style={styles.templeCardImg} />
                    <View style={styles.templeCardInfo}>
                      <Text style={styles.templeCardName}>{item.name}</Text>
                      <View style={styles.templeCardLocRow}>
                        <Ionicons name="location-outline" size={12} color="#8B4513" />
                        <Text style={styles.templeCardLocText}>{getTempleLocation(item)}</Text>
                      </View>
                      <Text style={styles.templeCardDeity}>{item.deity}</Text>
                      <View style={styles.templeCardTag}>
                        <FontAwesome5 name="om" size={10} color="#FFF" />
                        <Text style={styles.templeCardTagText}>{item.category}</Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#F5E0C3" />
                  </TouchableOpacity>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFBF5' },
  topTabsContainer: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 12,
    backgroundColor: '#FFFBF5',
    zIndex: 1000,
  },
  topTabsInner: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    padding: 4,
    // iOS shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    // Android
    elevation: 3,
  },
  tabPill: {
    flex: 1,
    height: '100%',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  tabPillActive: {
    backgroundColor: '#FF7B00',
    // iOS shadow (right-biased as per spec: 6px 0 10px)
    shadowColor: 'rgba(0,0,0,0.25)',
    shadowOffset: { width: 6, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    // Android
    elevation: 6,
  },
  tabPillText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#8B4513',
  },
  tabPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '900',
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
  heroFixedContainer: { width: SCREEN_WIDTH - 32, height: 500, overflow: 'hidden', position: 'relative', marginHorizontal: 16, borderRadius: 42, elevation: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, marginTop: 25, backgroundColor: '#1A0A00' },
  mockupTopRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 20 },
  mockupLiveBadge: { backgroundColor: '#FF3B30', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  mockupLiveText: { color: '#FFF', fontSize: 12, fontWeight: '900', marginLeft: 6 },
  mockupDevoteeBadge: { backgroundColor: 'rgba(0,0,0,0.5)', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  mockupDevoteeText: { color: '#FFF', fontSize: 12, fontWeight: '700', marginLeft: 6 },
  mockupContentArea: { paddingHorizontal: 25, marginTop: 10 },
  mockupMainTitle: { color: '#FFF', fontSize: 44, fontWeight: '900', lineHeight: 52, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 10 },
  mockupTagline: { color: 'rgba(255,255,255,0.9)', fontSize: 16, fontWeight: '700', marginTop: 15, lineHeight: 22 },
  mockupDevoteeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 20 },
  avatarStack: { flexDirection: 'row', alignItems: 'center' },
  miniAvatar: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: '#FFF' },
  mockupDevoteeCountSub: { color: '#FFF', fontSize: 12, fontWeight: '700', marginLeft: 15 },
  mockupJoinNowBtn: { backgroundColor: '#FF6600', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 20, paddingRight: 4, height: 48, borderRadius: 24, marginTop: 25, width: 190, elevation: 10, shadowColor: '#FF6600', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.4, shadowRadius: 10 },
  mockupJoinBtnText: { color: '#FFF', fontSize: 16, fontWeight: '900' },
  mockupJoinGradient: { flex: 1, justifyContent: 'center', paddingHorizontal: 15, borderRadius: 24 },
  mockupJoinMainRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  mockupJoinOm: { color: '#FFF', fontSize: 24, fontWeight: 'bold' },
  mockupJoinJaapText: { color: '#FFF', fontSize: 18, fontWeight: '900' },
  mockupJoinSubtext: { color: 'rgba(255,255,255,0.8)', fontSize: 10, fontWeight: '700', marginTop: -2 },
  buttonNotch: { position: 'absolute', width: 50, height: 50, backgroundColor: '#1A0A00', borderRadius: 25, top: -1 },
  mockupOmCircle: { backgroundColor: 'rgba(255,255,255,0.2)', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  mockupOmIcon: { color: '#FFF', fontSize: 18, fontWeight: '900' },
  mockupWaveformBox: { position: 'absolute', bottom: 20, right: 20, flexDirection: 'row' },
  sectionHeaderParity: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 25, marginTop: 40, marginBottom: 20 },
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

  // Epic Temple Hero Styles
  heroRowLayoutExact: { flexDirection: 'row', width: '100%', marginBottom: 25, backgroundColor: '#FFFBF5', paddingBottom: 10 },
  heroLeftContentExact: { flex: 1.1, paddingLeft: 20, paddingTop: 10, justifyContent: 'center' },
  heroDiscoverText: { fontSize: 38, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', fontWeight: 'bold', color: '#2D1B13', letterSpacing: -0.5 },
  heroSacredText: { fontSize: 38, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', fontWeight: 'bold', color: '#FF6600', marginTop: -8, letterSpacing: -0.5 },
  ornateDividerExact: { flexDirection: 'row', alignItems: 'center', marginVertical: 12, width: '90%' },
  ornateLine: { flex: 1, height: 1.2, backgroundColor: '#FF6600', opacity: 0.3 },
  ornateDiamondSmall: { width: 10, height: 10, marginHorizontal: 5, justifyContent: 'center', alignItems: 'center' },
  diamondInnerSmall: { width: 5, height: 5, backgroundColor: '#FF6600', transform: [{ rotate: '45deg' }] },
  heroSubtitleExact: { fontSize: 13, color: '#4E342E', fontWeight: '600', lineHeight: 18, opacity: 0.8 },
  heroRightImageContainerExact: { width: '45%', height: 260, position: 'relative', overflow: 'hidden', borderBottomLeftRadius: 100 },
  heroSideImageExact: { width: '100%', height: '100%', transform: [{ scale: 1.4 }] },
  heroLeftMaskExact: { position: 'absolute', left: 0, top: 0, width: '40%', height: '100%', zIndex: 2 },
});
