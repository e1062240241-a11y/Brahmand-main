import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Platform,
  StatusBar,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { FONTS } from '../../src/constants/theme';

const { width: SCREEN_W } = Dimensions.get('window');

const geetaCover   = require('../../assets/images/user_upload_geeta_new.jpg');
const atharvavedCover = require('../../assets/images/user_upload_0.png');
const rigvedaCover = require('../../assets/images/Rigveda.jpg');
const ramayanCover = require('../../assets/images/Ramayan-hardcover-front-scaled.jpg');
const ramcharitmanasCover = require('../../assets/images/Ramcharitmanas.jpg');

const ORANGE = '#FF6B00';
const DARK   = '#1B1C1C';
const BROWN  = '#5A4136';
const CLAY   = '#8E7164';
const H_PAD  = 20;

const CHAPTERS = [
  { num: 1,  title: 'Arjuna Vishada Yoga',   verses: 47,  desc: 'The Despondency of Arjuna' },
  { num: 2,  title: 'Sankhya Yoga',           verses: 72,  desc: 'The Yoga of Knowledge' },
  { num: 3,  title: 'Karma Yoga',             verses: 43,  desc: 'The Yoga of Action' },
  { num: 4,  title: 'Jnana Karma Sanyasa Yoga', verses: 42, desc: 'The Yoga of Renunciation of Action' },
  { num: 5,  title: 'Karma Sanyasa Yoga',     verses: 29,  desc: 'The Yoga of Renunciation' },
  { num: 6,  title: 'Dhyana Yoga',            verses: 47,  desc: 'The Yoga of Meditation' },
  { num: 7,  title: 'Jnana Vijnana Yoga',     verses: 30,  desc: 'The Yoga of Knowledge' },
  { num: 8,  title: 'Akshara Brahma Yoga',    verses: 28,  desc: 'The Yoga of the Eternal' },
  { num: 9,  title: 'Raja Vidya Raja Guhya Yoga', verses: 34, desc: 'The Yoga of Royal Knowledge' },
  { num: 10, title: 'Vibhuti Yoga',           verses: 42,  desc: 'The Yoga of Divine Glories' },
  { num: 11, title: 'Vishvarupa Darshana',    verses: 55,  desc: 'The Vision of the Cosmic Form' },
  { num: 12, title: 'Bhakti Yoga',            verses: 20,  desc: 'The Yoga of Devotion' },
  { num: 13, title: 'Kshetra Kshetrajna',     verses: 35,  desc: 'The Yoga of the Field' },
  { num: 14, title: 'Gunatraya Vibhaga',      verses: 27,  desc: 'The Yoga of Three Qualities' },
  { num: 15, title: 'Purushottama Yoga',      verses: 20,  desc: 'The Yoga of the Supreme' },
  { num: 16, title: 'Daivasura Sampad',       verses: 24,  desc: 'Divine & Demonic Natures' },
  { num: 17, title: 'Shraddhatraya Vibhaga',  verses: 28,  desc: 'The Yoga of Three Faiths' },
  { num: 18, title: 'Moksha Sanyasa Yoga',    verses: 78,  desc: 'The Yoga of Liberation' },
];

const RELATED = [
  { title: 'Ramcharitmanas', sub: 'Goswami Tulsidas', cover: ramcharitmanasCover, route: '/library/ramcharitmanas' },
  { title: 'Rigveda',        sub: 'Ancient Vedic Seers', cover: rigvedaCover,    route: '/library/rigveda' },
  { title: 'Ramayan',        sub: 'Sage Valmiki',      cover: ramayanCover,     route: '/library/ramayan' },
];

export default function ContinueReadingPage() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const [showAll, setShowAll] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [bookmarked, setBookmarked] = useState(false);

  const visibleChapters = showAll ? CHAPTERS : CHAPTERS.slice(0, 3);

  return (
    <View style={s.root}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 + insets.bottom }}>

        {/* ── Hero Image ── */}
        <View style={s.heroWrapper}>
          <Image source={geetaCover} style={s.heroImg} resizeMode="cover" />
          {/* gradient overlay top */}
          <LinearGradient
            colors={['rgba(0,0,0,0.52)', 'transparent']}
            start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
            style={s.heroTopGrad}
          />
          {/* gradient overlay bottom */}
          <LinearGradient
            colors={['transparent', 'rgba(255,255,255,1)']}
            start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
            style={s.heroBottomGrad}
          />

          {/* Header row */}
          <View style={[s.headerRow, { paddingTop: insets.top + 8 }]}>
            <TouchableOpacity style={s.iconBtn} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={22} color="#FFF" />
            </TouchableOpacity>
            <Text style={s.headerTitle}>Bhagvad Geeta</Text>
            <View style={s.headerRight}>
              <TouchableOpacity style={s.iconBtn} onPress={() => setBookmarked(v => !v)}>
                <Ionicons name={bookmarked ? 'bookmark' : 'bookmark-outline'} size={20} color="#FFF" />
              </TouchableOpacity>
              <TouchableOpacity style={[s.iconBtn, { marginLeft: 8 }]}>
                <Ionicons name="share-outline" size={20} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ── Book info ── */}
        <View style={s.infoSection}>
          <Text style={s.bookTitle}>Bhagvad Geeta</Text>
          <Text style={s.bookSubtitle}>The Song of God</Text>

          {/* Start Reading button */}
          <TouchableOpacity
            style={s.startBtn}
            onPress={() => router.push('/library/bhagvad-geeta' as any)}
            activeOpacity={0.88}
          >
            <Text style={s.startBtnTxt}>Start Reading</Text>
            <Ionicons name="arrow-forward" size={16} color="#FFF" style={{ marginLeft: 8 }} />
          </TouchableOpacity>

          {/* Stats row */}
          <View style={s.statsRow}>
            <View style={s.statItem}>
              <Text style={s.statNum}>18</Text>
              <Text style={s.statLbl}>CHAPTERS</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.statItem}>
              <Text style={s.statNum}>700</Text>
              <Text style={s.statLbl}>VERSES</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.statItem}>
              <Text style={s.statNum}>संस्कृत</Text>
              <Text style={s.statLbl}>SANSKRIT</Text>
            </View>
          </View>
        </View>

        {/* ── The Eternal Essence ── */}
        <View style={s.card}>
          <View style={s.cardTitleRow}>
            <View style={s.accentDot} />
            <Text style={s.cardTitle}>The Eternal Essence</Text>
          </View>
          <Text style={s.essenceText}>
            {'"The Bhagavad Gita is a 700 verse divine wisdom that is part of the epic Mahabharata. Set on my apocalyptic battlefield of Kurukshetra, it presents a dialogue between Arjuna and Lord Krishna, who serves as his charioteer."'}
          </Text>
          <Text style={s.essenceBody}>
            It presents a synthesis of Hindu ideas about dharma, morals, bhakti, and yoga, offering a universal path of self-realisation. Jnana, karma, bhakti, and raja yoga are all explained in clear terms, offering a universal path of self-realisation.
          </Text>
        </View>

        {/* ── Contents & Chapters ── */}
        <View style={s.sectionHead}>
          <Text style={s.sectionTitle}>Contents &amp; Chapters</Text>
        </View>

        <View style={s.chapterList}>
          {visibleChapters.map((ch) => {
            const isOpen = expanded === ch.num;
            return (
              <TouchableOpacity
                key={ch.num}
                style={s.chapterRow}
                onPress={() => setExpanded(isOpen ? null : ch.num)}
                activeOpacity={0.85}
              >
                <View style={s.chapterNumBox}>
                  <Text style={s.chapterNumTxt}>{String(ch.num).padStart(2, '0')}</Text>
                </View>
                <View style={s.chapterInfo}>
                  <Text style={s.chapterTitle}>{ch.title}</Text>
                  <Text style={s.chapterMeta}>{ch.verses} Verses · {ch.desc}</Text>
                  {isOpen && (
                    <Text style={s.chapterExpanded}>
                      Explore the profound teachings of this chapter through Sanskrit verses, transliteration, and English translation.
                    </Text>
                  )}
                </View>
                <TouchableOpacity
                  style={s.chapterPlayBtn}
                  onPress={() => router.push('/library/bhagvad-geeta' as any)}
                >
                  <Ionicons name="play-circle" size={30} color={ORANGE} />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* View All / Less toggle */}
        <TouchableOpacity style={s.viewAllBtn} onPress={() => setShowAll(v => !v)}>
          <Text style={s.viewAllTxt}>
            {showAll ? 'Show Less ‹' : `View All 18 Chapters ›`}
          </Text>
        </TouchableOpacity>

        {/* ── Currently Reading ── */}
        <View style={s.sectionHead}>
          <Text style={s.sectionTitle}>Currently Reading</Text>
        </View>
        <View style={s.currentlyReadingCard}>
          {/* Avatar stack */}
          <View style={s.avatarStack}>
            {['#F4A261', '#E76F51', '#2A9D8F', '#264653'].map((color, i) => (
              <View
                key={i}
                style={[s.avatar, { backgroundColor: color, marginLeft: i > 0 ? -10 : 0, zIndex: 4 - i }]}
              >
                <Ionicons name="person" size={14} color="#FFF" />
              </View>
            ))}
          </View>
          <Text style={s.readersText}>
            <Text style={s.readersCount}>Jan 5,200+</Text> active readers currently{'\n'}reading this scripture
          </Text>
          <TouchableOpacity
            style={s.joinBtn}
            onPress={() => router.push('/library/bhagvad-geeta' as any)}
          >
            <Text style={s.joinBtnTxt}>Join</Text>
          </TouchableOpacity>
        </View>

        {/* ── Featured Verse ── */}
        <View style={s.verseCard}>
          <LinearGradient
            colors={['#FFF5EE', '#FFF0E6']}
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          />
          <View style={s.verseTop}>
            <MaterialCommunityIcons name="format-quote-open" size={28} color={ORANGE} />
          </View>
          <Text style={s.verseText}>
            You have a right to perform your prescribed duties, but you are not entitled to the fruits of your actions.
          </Text>
          <Text style={s.verseRef}>— BG 2.47</Text>
        </View>

        {/* ── Related Watch ── */}
        <View style={s.sectionHead}>
          <Text style={s.sectionTitle}>Related Watch</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.relatedRow}
        >
          {RELATED.map((item) => (
            <TouchableOpacity
              key={item.title}
              style={s.relatedCard}
              onPress={() => router.push(item.route as any)}
              activeOpacity={0.88}
            >
              <Image source={item.cover} style={s.relatedCover} resizeMode="cover" />
              <View style={s.relatedOverlay}>
                <Ionicons name="play-circle-outline" size={28} color="#FFF" />
              </View>
              <View style={s.relatedInfo}>
                <Text style={s.relatedTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={s.relatedSub} numberOfLines={1}>{item.sub}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  /* Hero */
  heroWrapper: {
    width: '100%',
    height: 280,
    position: 'relative',
  },
  heroImg: {
    width: '100%',
    height: '100%',
  },
  heroTopGrad: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 120,
  },
  heroBottomGrad: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: 100,
  },
  headerRow: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: H_PAD,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    letterSpacing: 0.2,
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    flexDirection: 'row',
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.30)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* Book info */
  infoSection: {
    paddingHorizontal: H_PAD,
    paddingTop: 4,
    paddingBottom: 20,
    alignItems: 'center',
  },
  bookTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: DARK,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    letterSpacing: -0.5,
    lineHeight: 34,
    textAlign: 'center',
    marginBottom: 4,
  },
  bookSubtitle: {
    fontSize: 14,
    color: CLAY,
    fontFamily: FONTS.medium,
    lineHeight: 20,
    marginBottom: 18,
    textAlign: 'center',
  },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ORANGE,
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 32,
    marginBottom: 20,
    shadowColor: ORANGE,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  startBtnTxt: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
    fontFamily: FONTS.bold,
    letterSpacing: 0.2,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8F4',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 10,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255,107,0,0.10)',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNum: {
    fontSize: 16,
    fontWeight: '700',
    color: DARK,
    fontFamily: FONTS.bold,
    lineHeight: 22,
    marginBottom: 2,
  },
  statLbl: {
    fontSize: 9,
    fontWeight: '600',
    color: CLAY,
    fontFamily: FONTS.semiBold,
    letterSpacing: 0.8,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(90,65,54,0.15)',
  },

  /* Eternal Essence card */
  card: {
    marginHorizontal: H_PAD,
    marginBottom: 24,
    backgroundColor: '#FFFAF6',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,107,0,0.10)',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  accentDot: {
    width: 4,
    height: 20,
    borderRadius: 2,
    backgroundColor: ORANGE,
    marginRight: 10,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: DARK,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  essenceText: {
    fontSize: 13,
    fontStyle: 'italic',
    color: BROWN,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    lineHeight: 21,
    marginBottom: 10,
  },
  essenceBody: {
    fontSize: 13,
    color: '#6B6B6B',
    fontFamily: FONTS.medium,
    lineHeight: 21,
  },

  /* Section head */
  sectionHead: {
    paddingHorizontal: H_PAD,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: DARK,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    letterSpacing: 0.1,
  },

  /* Chapter list */
  chapterList: {
    paddingHorizontal: H_PAD,
    gap: 2,
    marginBottom: 4,
  },
  chapterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(226,191,176,0.18)',
  },
  chapterNumBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FFF0E6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  chapterNumTxt: {
    fontSize: 12,
    fontWeight: '700',
    color: ORANGE,
    fontFamily: FONTS.bold,
  },
  chapterInfo: {
    flex: 1,
  },
  chapterTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: DARK,
    fontFamily: FONTS.semiBold,
    lineHeight: 20,
    marginBottom: 2,
  },
  chapterMeta: {
    fontSize: 12,
    color: CLAY,
    fontFamily: FONTS.medium,
    lineHeight: 17,
  },
  chapterExpanded: {
    fontSize: 12,
    color: '#8E8E8E',
    fontFamily: FONTS.medium,
    lineHeight: 18,
    marginTop: 6,
  },
  chapterPlayBtn: {
    paddingLeft: 8,
  },
  viewAllBtn: {
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 24,
    marginBottom: 28,
    backgroundColor: '#FFF0E6',
    borderRadius: 20,
  },
  viewAllTxt: {
    fontSize: 13,
    fontWeight: '600',
    color: ORANGE,
    fontFamily: FONTS.semiBold,
  },

  /* Currently Reading */
  currentlyReadingCard: {
    marginHorizontal: H_PAD,
    marginBottom: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(226,191,176,0.18)',
  },
  avatarStack: {
    flexDirection: 'row',
    marginRight: 12,
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  readersText: {
    flex: 1,
    fontSize: 12,
    color: '#6B6B6B',
    fontFamily: FONTS.medium,
    lineHeight: 18,
  },
  readersCount: {
    fontWeight: '700',
    color: DARK,
    fontFamily: FONTS.bold,
  },
  joinBtn: {
    backgroundColor: ORANGE,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 8,
    marginLeft: 10,
    shadowColor: ORANGE,
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  joinBtnTxt: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFF',
    fontFamily: FONTS.bold,
  },

  /* Featured Verse */
  verseCard: {
    marginHorizontal: H_PAD,
    marginBottom: 28,
    borderRadius: 16,
    padding: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,107,0,0.12)',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  verseTop: {
    marginBottom: 8,
  },
  verseText: {
    fontSize: 14,
    fontStyle: 'italic',
    color: BROWN,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    lineHeight: 22,
    marginBottom: 10,
  },
  verseRef: {
    fontSize: 12,
    fontWeight: '600',
    color: ORANGE,
    fontFamily: FONTS.semiBold,
  },

  /* Related Watch */
  relatedRow: {
    paddingLeft: H_PAD,
    paddingRight: 10,
    gap: 14,
    flexDirection: 'row',
    paddingBottom: 4,
  },
  relatedCard: {
    width: 140,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    backgroundColor: '#F0E8E0',
  },
  relatedCover: {
    width: '100%',
    height: 100,
  },
  relatedOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 100,
    backgroundColor: 'rgba(0,0,0,0.28)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  relatedInfo: {
    backgroundColor: '#FFFFFF',
    padding: 10,
  },
  relatedTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: DARK,
    fontFamily: FONTS.bold,
    lineHeight: 18,
    marginBottom: 2,
  },
  relatedSub: {
    fontSize: 11,
    color: CLAY,
    fontFamily: FONTS.medium,
    lineHeight: 16,
  },
});
