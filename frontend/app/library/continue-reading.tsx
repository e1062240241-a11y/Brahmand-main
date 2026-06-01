import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Image, TouchableOpacity,
  ScrollView, Platform, StatusBar, Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { FONTS } from '../../src/constants/theme';

const { width: SW } = Dimensions.get('window');

const geetaCover          = require('../../assets/images/user_upload_geeta_new.jpg');
const upanishadCover      = require('../../assets/images/ancient_new_1.jpg');
const yogaSutrasCover     = require('../../assets/images/ancient_new_2.jpg');

const ORANGE = '#FF6B00';
const DARK   = '#1A1A1A';
const BROWN  = '#5A4136';
const CLAY   = '#8E7164';

const CHAPTERS = [
  { num: 1,  title: 'Arjuna Vishada Yoga',       verses: 47, desc: 'The Despondency of Arjuna' },
  { num: 2,  title: 'Sankhya Yoga',               verses: 72, desc: 'The Yoga of Knowledge' },
  { num: 3,  title: 'Karma Yoga',                 verses: 43, desc: 'The Yoga of Action' },
  { num: 4,  title: 'Jnana Karma Sanyasa Yoga',   verses: 42, desc: 'Renunciation through Knowledge' },
  { num: 5,  title: 'Karma Sanyasa Yoga',         verses: 29, desc: 'The Yoga of Renunciation' },
  { num: 6,  title: 'Dhyana Yoga',                verses: 47, desc: 'The Yoga of Meditation' },
  { num: 7,  title: 'Jnana Vijnana Yoga',         verses: 30, desc: 'Wisdom & Realisation' },
  { num: 8,  title: 'Akshara Brahma Yoga',        verses: 28, desc: 'The Eternal Absolute' },
  { num: 9,  title: 'Raja Vidya Raja Guhya Yoga', verses: 34, desc: 'The Royal Knowledge' },
  { num: 10, title: 'Vibhuti Yoga',               verses: 42, desc: 'The Yoga of Divine Glories' },
  { num: 11, title: 'Vishvarupa Darshana Yoga',   verses: 55, desc: 'The Vision of Cosmic Form' },
  { num: 12, title: 'Bhakti Yoga',                verses: 20, desc: 'The Yoga of Devotion' },
  { num: 13, title: 'Kshetra Kshetrajna Yoga',    verses: 35, desc: 'The Field & the Knower' },
  { num: 14, title: 'Gunatraya Vibhaga Yoga',     verses: 27, desc: 'The Three Modes of Nature' },
  { num: 15, title: 'Purushottama Yoga',          verses: 20, desc: 'The Supreme Person' },
  { num: 16, title: 'Daivasura Sampad Vibhaga',   verses: 24, desc: 'Divine & Demonic Natures' },
  { num: 17, title: 'Shraddhatraya Vibhaga Yoga', verses: 28, desc: 'The Three Divisions of Faith' },
  { num: 18, title: 'Moksha Sanyasa Yoga',        verses: 78, desc: 'The Yoga of Liberation' },
];

const RELATED = [
  { title: 'Upanishads', sub: 'Core Philosophies', cover: upanishadCover, route: '/library/upanishads' },
  { title: 'Patanjali Yoga Sutras', sub: 'Meditative Practice', cover: yogaSutrasCover, route: '/library/yoga-sutras' },
];

const AVATAR_COLORS = ['#E76F51', '#F4A261', '#2A9D8F', '#264653', '#E9C46A'];

export default function ContinueReadingPage() {
  const router   = useRouter();
  const insets   = useSafeAreaInsets();
  const [showAll,    setShowAll]    = useState(false);
  const [expanded,   setExpanded]   = useState<number | null>(null);
  const [bookmarked, setBookmarked] = useState(false);

  const visible = showAll ? CHAPTERS : CHAPTERS.slice(0, 3);

  return (
    <View style={s.root}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

      {/* ── Orange Gradient Header ── */}
      <LinearGradient
        colors={['#F08A5D', '#F6A56F', '#FBBF8A']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={[s.header, { paddingTop: insets.top + 10 }]}
      >
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#3D1A00" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Bhagavad Geeta</Text>
        <View style={s.headerRight}>
          <TouchableOpacity onPress={() => setBookmarked(v => !v)} style={s.headerIcon}>
            <Ionicons name={bookmarked ? 'bookmark' : 'bookmark-outline'} size={22} color="#3D1A00" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 48 + insets.bottom }}>

        {/* ── Hero Image — continuous from header ── */}
        <View style={s.heroWrap}>
          {/* Orange bleed behind image top */}
          <LinearGradient
            colors={['#FBBF8A', '#F9A870', '#F08A5D']}
            style={s.heroBgStrip}
          />
          <Image source={geetaCover} style={s.heroImg} resizeMode="cover" />
          {/* Fade bottom of image into white */}
          <LinearGradient
            colors={['transparent', 'rgba(255,255,255,0.6)', '#FFFFFF']}
            locations={[0.5, 0.82, 1]}
            start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
            style={s.heroFade}
          />
        </View>

        {/* ── White Card — curves up from hero ── */}
        <View style={s.card}>
          <Text style={s.bookTitle}>Bhagvad Geeta</Text>
          <View style={s.subtitleRow}>
            <Text style={s.bookSub}>The Song of God</Text>
            <View style={s.dot} />
            <Text style={s.bookSub}>M. Krishna</Text>
          </View>

          {/* Start Reading */}
          <View style={s.startBtnWrap}>
            <TouchableOpacity
              style={s.startBtn}
              onPress={() => router.push('/library/bhagavad-gita-3d' as any)}
              activeOpacity={0.86}
            >
              <LinearGradient
                colors={['#FF8C35', '#FF5500']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={s.startGrad}
              >
                <Text style={s.startTxt}>Start Reading</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFF" style={{ marginLeft: 10 }} />
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Stats */}
          <View style={s.statsRow}>
            <View style={s.statItem}>
              <Text style={s.statLbl}>CHAPTERS</Text>
              <Text style={s.statVal}>18</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.statItem}>
              <Text style={s.statLbl}>VERSES</Text>
              <Text style={s.statVal}>700</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.statItem}>
              <Text style={s.statLbl}>LANGUAGE</Text>
              <Text style={[s.statVal, { color: ORANGE }]}>Sanskrit</Text>
            </View>
          </View>
        </View>

        {/* ── Eternal Essence ── */}
        <View style={s.essenceCard}>
          <Text style={s.essenceTitle}>The Eternal Essence</Text>
          <Text style={s.essenceQuote}>
            {`"The Bhagavad Gita is a 700-verse\nHindu scripture that is part of the\nepic Mahabharata. Set on the\nbattlefield of Kurukshetra, it is a\ndialogue between Prince Arjuna and\nLord Krishna, who serves as his\ncharioteer."`}
          </Text>
          <Text style={s.essenceBody}>
            {`It presents a synthesis of Hindu ideas\nabout dharma, theistic bhakti, and\nthe yogic ideals of moksha. The text\ncovers jnana, bhakti, karma, and raja\nyoga, offering a universal guide to\nthe science of self-realization.`}
          </Text>
        </View>

        {/* ── Contents & Chapters ── */}
        <View style={s.sectionHead}>
          <Text style={s.sectionTitle}>Contents &amp; Chapters</Text>
        </View>

        <View style={s.chapterWrap}>
          {visible.map((ch) => {
            const open = expanded === ch.num;
            return (
              <TouchableOpacity
                key={ch.num}
                style={[s.chRow, open && s.chRowOpen]}
                onPress={() => setExpanded(open ? null : ch.num)}
                activeOpacity={0.82}
              >
                <Text style={s.chNumTxt}>
                  {String(ch.num).padStart(2, '0')}
                </Text>
                <View style={s.chBody}>
                  <Text style={s.chTitle}>{ch.title}</Text>
                  <Text style={s.chMeta}>{ch.verses} Verses  ·  {ch.desc}</Text>
                  {open && (
                    <Text style={s.chExpanded}>
                      Dive into the sacred verses — Sanskrit shloka, transliteration, and English translation.
                    </Text>
                  )}
                </View>
                <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={22} color="#1A1A1A" />
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity style={s.viewAllRow} onPress={() => setShowAll(v => !v)}>
          <Text style={s.viewAllTxt}>{showAll ? 'Show Less' : 'View All 18 Chapters'}</Text>
          <View style={s.viewAllIcon}>
            <Svg width="7.4" height="12" viewBox="0 0 8 12" fill="none">
              <Path d={showAll ? "M7 10L1 2L7 2" : "M1 1L7 6L1 11"} stroke="#A04100" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </View>
        </TouchableOpacity>

        {/* ── Currently Reading ── */}
        <View style={s.readersCard}>
          <Text style={s.readersLabel}>CURRENTLY READING</Text>
          <View style={s.avatarStack}>
            {AVATAR_COLORS.map((c, i) => (
              <View key={i} style={[s.avatar, { backgroundColor: c, marginLeft: i === 0 ? 0 : -10, zIndex: 10 - i }]}>
                <Ionicons name="person" size={14} color="rgba(255,255,255,0.9)" />
              </View>
            ))}
            <View style={s.avatarBadge}>
              <Text style={s.avatarBadgeTxt}>+4k</Text>
            </View>
          </View>
          <Text style={s.readersBody}>
            {`Join 4,281 other seekers currently\nimmersed in this wisdom.`}
          </Text>
        </View>

        {/* ── Featured Verse ── */}
        <View style={s.verseOuter}>
          <LinearGradient
            colors={['#3D2B1F', '#1A0F08']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={s.verseContent}>
            <MaterialCommunityIcons name="format-quote-open" size={32} color={ORANGE} style={{ marginBottom: 10 }} />
            <Text style={s.verseTxt}>
              "You have a right to perform your prescribed duties, but you are not entitled to the fruits of your actions."
            </Text>
            <Text style={s.verseRef}>— VERSE 2.47</Text>
          </View>
        </View>

        {/* ── Related Wisdom ── */}
        <View style={s.sectionHead}>
          <Text style={s.sectionTitle}>Related Wisdom</Text>
        </View>

        <View style={s.relatedList}>
          {RELATED.map((item) => (
            <TouchableOpacity key={item.title} style={s.relListItem} onPress={() => router.push(item.route as any)} activeOpacity={0.86}>
              <View style={s.relListImgWrap}>
                <Image source={item.cover} style={s.relListImg} resizeMode="cover" />
              </View>
              <View style={s.relListInfo}>
                <Text style={s.relListTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={s.relListSub}   numberOfLines={1}>{item.sub}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },

  /* HEADER */
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 14,
    shadowColor: '#C05000', shadowOpacity: 0.20,
    shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 6,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.35)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: {
    flex: 1, textAlign: 'center',
    fontSize: 18, fontWeight: '700',
    color: '#3D1A00',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    letterSpacing: 0.2,
  },
  headerRight: { width: 40, alignItems: 'flex-end' },
  headerIcon:  { padding: 4 },

  /* HERO */
  heroWrap: { width: '100%', height: 300, position: 'relative' },
  heroBgStrip: {
    position: 'absolute', top: 0, left: 0, right: 0,
    height: 60,
  },
  heroImg: { width: '100%', height: '100%' },
  heroFade: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 160,
  },

  /* WHITE CARD */
  card: {
    marginHorizontal: 20, marginTop: -32,
    backgroundColor: '#FFFFFF',
    borderRadius: 28, padding: 24,
    shadowColor: '#000', shadowOpacity: 0.08,
    shadowRadius: 20, shadowOffset: { width: 0, height: -4 }, elevation: 10,
    marginBottom: 24,
  },
  bookTitle: {
    fontSize: 40,
    fontWeight: '700',
    color: '#1B1C1C',
    fontFamily: FONTS.bold,
    letterSpacing: -0.8,
    lineHeight: 48,
    marginBottom: 6,
  },
  subtitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  bookSub: {
    fontSize: 16,
    fontWeight: '400',
    color: '#5A4136',
    fontFamily: FONTS.regular,
    lineHeight: 24,
  },
  dot: {
    width: 5, height: 5, borderRadius: 3,
    backgroundColor: CLAY, marginHorizontal: 8,
  },

  startBtnWrap: {
    width: '100%',
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  startBtn: {
    width: 199,
    height: 56,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.00)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.10,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  startGrad: {
    width: '100%',
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  startTxt: { fontSize: 16, fontWeight: '700', color: '#FFF', fontFamily: FONTS.bold, letterSpacing: 0.3 },

  statsRow: {
    flexDirection: 'row', alignItems: 'center',
    borderTopWidth: 1, borderTopColor: '#F0E8E0',
    paddingTop: 18,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statLbl: {
    fontSize: 16,
    fontWeight: '400',
    color: '#5A4136',
    fontFamily: FONTS.regular,
    lineHeight: 24,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginBottom: 4,
  },
  statVal:  { fontSize: 17, fontWeight: '700', color: DARK, fontFamily: FONTS.bold },
  statDivider: { width: 1, height: 36, backgroundColor: '#EDE0D8' },

  /* ETERNAL ESSENCE */
  essenceCard: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    marginHorizontal: 20, marginBottom: 26,
    borderRadius: 24, padding: 32,
    gap: 24,
    borderWidth: 1, borderColor: 'rgba(226, 191, 176, 0.40)',
    backgroundColor: '#FFEEE7',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  essenceBar: { width: 4, borderRadius: 2, backgroundColor: '#FF6B00', marginRight: 14, alignSelf: 'stretch' },
  essenceTitle: {
    fontSize: 16, fontWeight: '400', color: '#1B1C1C',
    fontFamily: FONTS.regular, lineHeight: 24,
    alignSelf: 'stretch',
  },
  essenceQuote: {
    fontSize: 16, fontStyle: 'italic', fontWeight: '400',
    color: '#5A4136', fontFamily: FONTS.regular,
    lineHeight: 26, alignSelf: 'stretch',
  },
  essenceBody: {
    fontSize: 16, fontStyle: 'italic', fontWeight: '400',
    color: '#5A4136', fontFamily: FONTS.regular,
    lineHeight: 26, alignSelf: 'stretch',
  },

  sectionHead:  { paddingHorizontal: 20, marginBottom: 14 },
  sectionTitle: { fontSize: 16, fontWeight: '400', color: DARK, fontFamily: FONTS.regular },

  /* CHAPTERS */
  chapterWrap: { paddingHorizontal: 20, marginBottom: 6, gap: 16 },
  chRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF',
    borderRadius: 16, padding: 24,
    justifyContent: 'space-between', alignSelf: 'stretch',
    borderWidth: 1, borderColor: 'rgba(226, 191, 176, 0.50)',
  },
  chRowOpen:    { borderColor: ORANGE, backgroundColor: '#FFFAF7' },
  chNumTxt:     { fontSize: 16, fontWeight: '700', color: ORANGE, fontFamily: FONTS.bold, marginRight: 16, minWidth: 28 },
  chBody:       { flex: 1 },
  chTitle:      { fontSize: 16, fontWeight: '600', color: DARK, fontFamily: FONTS.semiBold, lineHeight: 22, marginBottom: 4 },
  chMeta:       { fontSize: 14, color: CLAY, fontFamily: FONTS.regular, lineHeight: 20 },
  chExpanded:   { fontSize: 13, color: '#888', fontFamily: FONTS.medium, lineHeight: 20, marginTop: 8 },

  viewAllRow:  { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 28, marginTop: 14 },
  viewAllTxt:  { fontSize: 16, fontWeight: '400', color: '#A04100', fontFamily: FONTS.regular, textAlign: 'center', lineHeight: 24 },
  viewAllIcon: { marginLeft: 8, marginTop: 2, width: 7.4, height: 12, justifyContent: 'center', alignItems: 'center' },

  /* CURRENTLY READING */
  readersCard: {
    marginHorizontal: 20, marginBottom: 24,
    backgroundColor: '#E9E8E7',
    borderRadius: 24, padding: 24,
    flexDirection: 'column', alignItems: 'flex-start',
    gap: 24, alignSelf: 'stretch'
  },
  readersLabel: {
    fontSize: 16, fontWeight: '400', color: '#1B1C1C',
    fontFamily: FONTS.regular, lineHeight: 24,
    alignSelf: 'stretch',
  },
  avatarStack: { flexDirection: 'row', alignItems: 'center' },
  avatar:      { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 2.5, borderColor: '#E9E8E7' },
  avatarBadge: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: ORANGE, justifyContent: 'center', alignItems: 'center',
    marginLeft: -10, zIndex: 5,
  },
  avatarBadgeTxt: { fontSize: 11, fontWeight: '700', color: '#FFF', fontFamily: FONTS.bold },
  readersBody: {
    fontSize: 16, fontWeight: '400', color: '#5A4136',
    fontFamily: FONTS.regular, lineHeight: 20,
    alignSelf: 'stretch',
  },

  /* VERSE */
  verseOuter: {
    marginHorizontal: 20, marginBottom: 30,
    borderRadius: 20, overflow: 'hidden',
    minHeight: 200,
  },
  verseContent: { padding: 24, flex: 1 },
  verseTxt:    { fontSize: 15, fontStyle: 'italic', color: '#FFFFFF', fontFamily: FONTS.regular, lineHeight: 24, marginBottom: 20 },
  verseRef:    { fontSize: 13, fontWeight: '700', color: ORANGE, fontFamily: FONTS.bold, letterSpacing: 1.5 },

  /* RELATED WISDOM */
  relatedList: { paddingHorizontal: 20, gap: 24, paddingBottom: 24, marginTop: 8 },
  relListItem: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  relListImgWrap: { width: 64, height: 88, borderRadius: 8, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  relListImg: { width: '100%', height: '100%' },
  relListInfo: { flex: 1, justifyContent: 'center' },
  relListTitle: { fontSize: 16, fontWeight: '400', color: DARK, fontFamily: FONTS.regular, marginBottom: 4 },
  relListSub: { fontSize: 15, color: '#5A4136', fontFamily: FONTS.regular },
});
