import React, { useState } from 'react';
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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={[styles.headerOuter, { paddingTop: insets.top + 10 }]}>
        <View style={styles.unifiedHeaderBarExact}>
          <TouchableOpacity style={styles.jaapTabExact} activeOpacity={1}>
            <LinearGradient colors={['#FF8D57', '#FF6600', '#E65C00']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0.5 }} style={styles.jaapGradientExact}>
              <View style={styles.jaapContentRow}>
                <Text style={styles.omSymbolExact}>ॐ</Text>
                <View style={styles.tabTextColumn}>
                  <Text style={styles.tabTitleExact}>Jaap</Text>
                  <Text style={styles.tabSubExact}>Live Collective Chanting</Text>
                </View>
              </View>
              <View style={styles.lotusPetalEdge}>
                <View style={styles.petalCurve} />
              </View>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={styles.templeTabExact} onPress={() => router.push('/temple')} activeOpacity={0.8}>
            <View style={styles.templeContentRow}>
              <View style={styles.templeIconBoxExact}>
                <MaterialCommunityIcons name="temple-hindu" size={38} color="#8B4513" />
              </View>
              <View style={styles.tabTextColumn}>
                <Text style={styles.templeTitleExact}>Temple</Text>
                <Text style={styles.templeSubExact}>Sacred Temples & Darshan</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

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

            <TouchableOpacity style={styles.mockupJoinNowBtn} onPress={() => router.push('/live-jaap-room')}>
              <Text style={styles.mockupJoinBtnText}>Join Jaap Now</Text>
              <View style={styles.mockupOmCircle}>
                <Text style={styles.mockupOmIcon}>ॐ</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* WAVEFORM ANIMATION MOCKUP */}
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
            <TouchableOpacity key={jaap.id} style={[styles.jaapCardContainer, { width: 240, backgroundColor: '#1A0A00' }]} onPress={() => router.push('/live-jaap-room')}>
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
                  <TouchableOpacity style={styles.exactJoinBtn} onPress={() => router.push('/live-jaap-room')}>
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
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFBF5' },
  headerOuter: { paddingHorizontal: 16, backgroundColor: '#FFFBF5', paddingBottom: 15, zIndex: 1000 },
  unifiedHeaderBarExact: { height: 96, backgroundColor: '#FFF8F0', borderRadius: 28, flexDirection: 'row', borderWidth: 1.5, borderColor: '#F5E0C3', overflow: 'hidden', elevation: 8, shadowColor: '#8B4513', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, shadowRadius: 10 },
  jaapTabExact: { width: '56%', height: '100%' },
  jaapGradientExact: { flex: 1, justifyContent: 'center', paddingHorizontal: 18, position: 'relative' },
  jaapContentRow: { flexDirection: 'row', alignItems: 'center', zIndex: 10 },
  omSymbolExact: { fontSize: 44, color: '#FFF', fontWeight: '900', marginRight: 10 },
  tabTextColumn: { justifyContent: 'center' },
  tabTitleExact: { color: '#FFF', fontSize: 28, fontWeight: '900', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  tabSubExact: { color: 'rgba(255, 255, 255, 0.9)', fontSize: 11, fontWeight: '700' },
  lotusPetalEdge: { position: 'absolute', right: -28, top: 0, bottom: 0, width: 56, justifyContent: 'center', alignItems: 'center', zIndex: 20 },
  petalCurve: { width: 56, height: 96, backgroundColor: '#E65C00', borderRadius: 48, transform: [{ scaleX: 0.65 }] },
  templeTabExact: { flex: 1, justifyContent: 'center', paddingLeft: 28 },
  templeContentRow: { flexDirection: 'row', alignItems: 'center' },
  templeIconBoxExact: { marginRight: 10 },
  templeTitleExact: { color: '#8B4513', fontSize: 28, fontWeight: '900', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  templeSubExact: { color: '#8B4513', opacity: 0.7, fontSize: 11, fontWeight: '700' },
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
});
