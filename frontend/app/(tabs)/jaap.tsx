import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const LIVE_JAAPS = [
  { id: '1', title: 'Hanuman\nChalisa', devotees: '9.6K', image: require('../../assets/images/hanuman_jaap_card_v2.png') },
  { id: '2', title: 'Hare Krishna\nJaap', devotees: '6.4K', image: require('../../assets/images/krishna_jaap_card_v2.png') },
  { id: '3', title: 'Om Namah\nShivaya', devotees: '5.2K', image: require('../../assets/images/shiva_jaap_card_v2.png') },
  { id: '4', title: 'Gayatri\nMantra', devotees: '4.8K', image: require('../../assets/images/gayatri_jaap_card_v4_exact_clean.png') },
];

const UPCOMING_SESSIONS = [
  { id: '1', category: 'YOGA CLASS', title: 'Morning Yoga Flow', desc: 'Start your day with energy and positivity.', date: 'Tomorrow', time: '6:00 AM', going: '2.4K going', image: require('../../assets/images/yoga_session_img.png') },
  { id: '2', category: 'GEETA PATH', title: 'Bhagavad Gita Chapter 2', desc: 'Dive deep into wisdom.', date: 'Tomorrow', time: '7:30 PM', going: '3.2K going', image: require('../../assets/images/geeta_session_v2_exact.png') },
  { id: '3', category: 'SANSKRIT CLASS', title: 'Sanskrit Language Basics', desc: 'Learn. Chant. Connect.', date: '21 May', time: '6:30 PM', going: '1.9K going', image: require('../../assets/images/sanskrit_session_v2_exact.png') },
  { id: '4', category: 'MEDITATION', title: 'Breathing & Meditation', desc: 'Find calm within.', date: '22 May', time: '6:00 AM', going: '2.1K going', image: require('../../assets/images/yoga_session_img.png') },
];

export default function JaapLandingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeSection, setActiveSection] = useState<'jaap' | 'temple'>('jaap');

  // Temple State
  const [temples, setTemples] = useState<any[]>([]);
  const [loadingTemples, setLoadingTemples] = useState(false);
  const [templeSearch, setTempleSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | 'Jyotirlinga' | 'Sacred'>('All');

  const fetchTemplesData = async () => {
    try {
      setLoadingTemples(true);
      const { getTemples } = require('../../src/services/api');
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

  const { TEMPLE_IMAGES, DEFAULT_TEMPLE_IMAGE, getTempleImageByName } = require('../../src/constants/templeImages');

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={[styles.topTabsContainer, { paddingTop: insets.top + 10 }]}>
        <View style={styles.topTabsInner}>
          <TouchableOpacity 
            style={[styles.topTabButton, activeSection === 'jaap' && styles.topTabButtonActive]}
            onPress={() => setActiveSection('jaap')}
          >
            <Text style={[styles.topTabText, activeSection === 'jaap' && styles.topTabTextActive]}>Jaaps</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.topTabButton, activeSection === 'temple' && styles.topTabButtonActive]}
            onPress={() => setActiveSection('temple')}
          >
            <Text style={[styles.topTabText, activeSection === 'temple' && styles.topTabTextActive]}>Temple</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
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

            {/* PIXEL-PERFECT MOCKUP UI FOR HERO BANNER */}
            <View style={[styles.heroFixedContainer, { height: 500 }]}>
              <Image
                source={require('../../assets/images/jaap_hero_shiva_final.png')}
                style={{ position: 'absolute', width: '180%', height: '100%', left: -SCREEN_WIDTH * 0.6 }}
                resizeMode="cover"
              />
              <LinearGradient colors={['rgba(0,0,0,0.4)', 'transparent', 'rgba(0,0,0,0.6)']} style={StyleSheet.absoluteFill} />

              {/* TOP BADGES */}
              <View style={styles.mockupTopRow}>
                <View style={styles.mockupLiveBadge}>
                  <Ionicons name="radio" size={16} color="#FFF" />
                  <Text style={styles.mockupLiveText}>LIVE NOW</Text>
                </View>
                <View style={styles.mockupDevoteeBadge}>
                  <Ionicons name="people" size={16} color="#FFF" />
                  <Text style={styles.mockupDevoteeText}>12.8K Devotees</Text>
                </View>
              </View>

              {/* MAIN CONTENT AREA */}
              <View style={styles.mockupContentArea}>
                <Text style={styles.mockupMainTitle}>Maha{"\n"}Mrityunjaya{"\n"}Jaap</Text>
                <Text style={styles.mockupTagline}>We chant. We heal.{"\n"}We rise together.</Text>

                <View style={styles.mockupDevoteeRow}>
                  <View style={styles.avatarStack}>
                    <Image source={{ uri: 'https://i.pravatar.cc/100?u=1' }} style={styles.miniAvatar} />
                    <Image source={{ uri: 'https://i.pravatar.cc/100?u=2' }} style={[styles.miniAvatar, { marginLeft: -12 }]} />
                    <Image source={{ uri: 'https://i.pravatar.cc/100?u=3' }} style={[styles.miniAvatar, { marginLeft: -12 }]} />
                  </View>
                  <Text style={styles.mockupDevoteeCountSub}>12,842+ devotees chanting together</Text>
                </View>

                <TouchableOpacity style={styles.mockupJoinNowBtn} onPress={() => router.push('/live-mantra')}>
                  <Text style={styles.mockupJoinBtnText}>Join Jaap Now</Text>
                  <View style={styles.mockupOmCircle}>
                    <Text style={styles.mockupOmIcon}>ॐ</Text>
                  </View>
                </TouchableOpacity>
              </View>

              <View style={styles.mockupWaveformBox}>
                <MaterialCommunityIcons name="waveform" size={42} color="rgba(255,255,255,0.8)" />
                <MaterialCommunityIcons name="waveform" size={42} color="rgba(255,255,255,0.8)" style={{ marginLeft: -10 }} />
              </View>
            </View>

            <View style={styles.sectionHeaderParity}>
              <Text style={styles.sectionTitleText}>More Live Jaaps</Text>
              <TouchableOpacity style={styles.viewAllBtnRefined}><Text style={styles.viewAllSaffronRefined}>View All</Text></TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.miniCardsRowPadding}>
              {LIVE_JAAPS.map((jaap) => (
                <TouchableOpacity key={jaap.id} style={[styles.jaapCardContainer, { width: 240, backgroundColor: '#1A0A00' }]} onPress={() => router.push('/live-mantra')}>
                  <Image
                    key={`jaap_card_img_v2_${jaap.id}`}
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
                      <TouchableOpacity style={styles.exactJoinBtn} onPress={() => router.push('/live-mantra')}>
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
              <Text style={styles.sectionTitleText}>Upcoming Spiritual Sessions</Text>
              <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.viewAllSaffronRefined}>View All</Text>
                <Ionicons name="chevron-forward" size={18} color="#FF6600" />
              </TouchableOpacity>
            </View>

            <View style={styles.sessionsColPadding}>
              {UPCOMING_SESSIONS.map((session) => (
                <View key={session.id} style={styles.exactSessionItemCard}>
                  <Image source={session.image} style={styles.exactSessionImg} resizeMode="cover" />
                  <View style={styles.exactSessionMainInfo}>
                    <Text style={styles.exactSessionCat}>{session.category}</Text>
                    <Text style={styles.exactSessionTitle}>{session.title}</Text>
                    <Text style={styles.exactSessionDesc}>{session.desc}</Text>
                  </View>
                  <View style={styles.exactSessionDateTimeCol}>
                    <View style={styles.metaEntry}>
                      <Ionicons name="calendar-outline" size={16} color="#8B4513" />
                      <Text style={styles.metaEntryText}>{session.date}</Text>
                    </View>
                    <View style={styles.metaEntry}>
                      <Ionicons name="time-outline" size={16} color="#8B4513" />
                      <Text style={styles.metaEntryText}>{session.time}</Text>
                    </View>
                  </View>
                  <View style={styles.exactSessionGoingCol}>
                    <View style={styles.metaEntry}>
                      <FontAwesome5 name="users" size={14} color="#8B4513" />
                      <Text style={styles.metaEntryText}>{session.going}</Text>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.exactSetReminderBtn}>
                    <Ionicons name="notifications-outline" size={18} color="#FF6600" />
                    <Text style={styles.exactReminderText}>Set Reminder</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFBF5' },
  topTabsContainer: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 15, backgroundColor: '#FFF' },
  topTabsInner: { flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 28, padding: 4, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  topTabButton: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 22 },
  topTabButtonActive: { backgroundColor: '#FF6600' },
  topTabText: { fontSize: 16, fontWeight: '800', color: '#2D1B13' },
  topTabTextActive: { color: '#FFF' },
  heroTitleSectionExact: { paddingHorizontal: 25, marginTop: 32, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  heroTextCol: { flex: 1 },
  liveJaapTag: { color: '#FF6600', fontSize: 14, fontWeight: '900', letterSpacing: 0.8, marginBottom: 10 },
  heroMainTitleExact: { fontSize: 26, fontWeight: '800', color: '#2D1400', lineHeight: 34, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  viewAllPillRefined: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 24, borderWidth: 1.2, borderColor: '#FF6600' },
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
  mockupOmCircle: { backgroundColor: '#FFF', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  mockupOmIcon: { color: '#FF6600', fontSize: 18, fontWeight: '900' },
  mockupWaveformBox: { position: 'absolute', bottom: 20, right: 20, flexDirection: 'row' },
  sectionHeaderParity: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 25, marginTop: 40, marginBottom: 20 },
  viewAllBtnRefined: { paddingHorizontal: 10, paddingVertical: 5 },
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
  jaapCardBottomArea: { gap: 12 },
  jaapCardTitleExact: { color: '#FFF', fontSize: 26, fontWeight: '900', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 },
  exactJoinBtn: { backgroundColor: '#FFF', height: 48, borderRadius: 24, flexDirection: 'row', alignItems: 'center', elevation: 5 },
  exactJoinText: { color: '#FF6600', fontSize: 18, fontWeight: '800' },
  waveformIconBox: { marginRight: 15 },
  sessionsColPadding: { paddingHorizontal: 20 },
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

  // Lotus Petal Left
  lotusPetalEdgeLeft: { position: 'absolute', left: -28, top: 0, bottom: 0, width: 56, justifyContent: 'center', alignItems: 'center', zIndex: 20 },
  petalCurveLeft: { width: 56, height: 96, backgroundColor: '#E65C00', borderRadius: 48, transform: [{ scaleX: 0.65 }] },

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

  // Modal Live Room Styles
  modalContainer: { flex: 1, backgroundColor: '#1A0B08' },
  modalSafeArea: { flex: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10 },
  modalCloseBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  modalTitleBox: { flex: 1, alignItems: 'center' },
  modalRoomTitle: { color: '#FFF', fontSize: 18, fontWeight: '900', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  modalLiveIndicatorRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  modalPulseDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#FF3B30' },
  modalLiveStatusText: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginLeft: 6 },
  modalDevoteeBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 6 },
  modalDevoteeText: { color: '#FFF', fontSize: 13, fontWeight: '800' },
  modalCenterContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  modalGlowCircle: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,102,0,0.3)', shadowColor: '#FF6600', shadowRadius: 40, elevation: 20 },
  modalOmSymbol: { fontSize: 120, color: '#FFF', fontWeight: 'bold', textShadowColor: 'rgba(255,102,0,0.8)', textShadowRadius: 20 },
  modalLyricsContainer: { marginTop: 60, alignItems: 'center', paddingHorizontal: 30 },
  modalLyricsHindi: { fontSize: 32, color: '#FFF', fontWeight: '900', textAlign: 'center' },
  modalLyricsEnglish: { fontSize: 16, color: 'rgba(255,255,255,0.6)', marginTop: 10, textAlign: 'center', fontStyle: 'italic' },
  modalLyricsHighlightBar: { width: 40, height: 3, backgroundColor: '#FF6600', marginTop: 20, borderRadius: 2 },
  modalFooter: { paddingBottom: 40, paddingHorizontal: 30, alignItems: 'center' },
  modalAudioSyncBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 40, marginBottom: 25, gap: 10 },
  modalSyncText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  modalWaveformContainer: { flexDirection: 'row', alignItems: 'center', gap: 3, marginLeft: 10 },
  modalWaveBar: { width: 3, backgroundColor: '#FF6600', borderRadius: 1.5 },
  modalLeaveBtn: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 40, paddingVertical: 14, borderRadius: 30, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  modalLeaveBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
});
