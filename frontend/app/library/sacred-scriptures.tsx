import React, { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { FONTS } from '../../src/constants/theme';

const mahabharataCover = require('../../assets/images/ancient_new_3.jpg');
const geetaCover = require('../../assets/images/user_upload_geeta_new.jpg');
const atharvavedCover = require('../../assets/images/ancient_new_1.jpg');
const rigvedaCover = require('../../assets/images/ancient_new_2.jpg');
const ramayanCover = require('../../assets/images/ancient_new_4.jpg');
const ramcharitmanasCover = require('../../assets/images/Ramcharitmanas.jpg');
const yajurvedaCover = require('../../assets/images/Yajurveda.jpg');

// ── Color tokens ──────────────────────────────────────────────────────────
const ORANGE = '#FF6B00';
const DARK = '#1B1C1C';
const BROWN = '#5A4136';
const CLAY = '#8E7164';
const PEACHISH = '#FFEEE7';
const A04100 = '#A04100';
const H_PADDING = 20;

// ── Ancient Collection list ───────────────────────────────────────────────
const ANCIENT_BOOKS = [
  {
    id: 'upanishads',
    title: 'The Upanishads',
    subtitle: '108 Principal Texts',
    snippet: 'Explorations of the true nature of reality (Brahman) and the...',
    cover: atharvavedCover,
    progress: 0.33,
    route: '/library/atharvaved',
  },
  {
    id: 'vedas',
    title: 'The Vedas',
    subtitle: 'Rig, Sama, Yajur, Atharva',
    snippet: 'The foundation of all Hindu wisdom, consisting of hymns...',
    cover: rigvedaCover,
    progress: 0.30,
    route: '/library/rigveda',
  },
  {
    id: 'puranas',
    title: 'The Puranas',
    subtitle: '18 Maha Puranas',
    snippet: 'Mythology, cosmology, and ancient Hindu genealogies...',
    cover: mahabharataCover,
    progress: 0.10,
    route: '/library/mahabharata',
  },
  {
    id: 'dharma',
    title: 'Dharma Shastras',
    subtitle: 'Laws of Dharma',
    snippet: 'Ancient codes of conduct, law, and righteousness...',
    cover: ramayanCover,
    progress: 0,
    route: '/library/ramayan',
  },
];

// ─────────────────────────────────────────────────────────────────────────
export default function SacredScripturesPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [saved, setSaved] = useState(false);

  const books = query.trim()
    ? ANCIENT_BOOKS.filter(b =>
        b.title.toLowerCase().includes(query.toLowerCase()) ||
        b.subtitle.toLowerCase().includes(query.toLowerCase())
      )
    : ANCIENT_BOOKS;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

      {/* Community tab background */}
      <LinearGradient
        colors={['#FF8D57', '#EA9B76', '#FFFFFF']}
        locations={[0, 0.0481, 0.2404]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={DARK} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sacred Scriptures</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 56 + insets.bottom }}
      >
        {/* ── Search Bar ── */}
        <View style={styles.searchWrapper}>
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={19} color={CLAY} style={{ marginRight: 10 }} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search by book name, author or topic."
              placeholderTextColor="#6B7280"
              style={styles.searchInput}
            />
            <TouchableOpacity>
              <MaterialCommunityIcons name="tune-vertical" size={20} color={CLAY} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Section Title ── */}
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Featured Collection</Text>
          <TouchableOpacity onPress={() => router.push('/library/featured' as any)}>
            <Text style={styles.viewAll}>View All ›</Text>
          </TouchableOpacity>
        </View>

        {/* ── Featured Card (Bhagavad Geeta) ── */}
        <View style={styles.featuredWrapper}>
          <View style={styles.featuredCard}>
            {/* Full-width cover image */}
            <View style={styles.featuredCoverBox}>
              <Image source={geetaCover} style={styles.featuredCover} resizeMode="stretch" />
              {/* Top overlay gradient */}
              <LinearGradient
                colors={['rgba(0,0,0,0.30)', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />
            </View>

            {/* Card content */}
            <View style={styles.featuredContent}>
              {/* Title row */}
              <View style={styles.featuredTitleRow}>
                <Text style={styles.featuredBookTitle}>Bhagavad Geeta</Text>
                <TouchableOpacity
                  style={styles.bookmarkBtn}
                  onPress={() => setSaved(v => !v)}
                >
                  <Ionicons
                    name={saved ? 'bookmark' : 'bookmark-outline'}
                    size={18}
                    color={ORANGE}
                  />
                </TouchableOpacity>
              </View>

              {/* Author */}
              <Text style={styles.featuredAuthor}>By Sage Vyasa</Text>

              {/* Meta row */}
              <View style={styles.featuredMeta}>
                <View style={styles.metaItem}>
                  <Ionicons name="book-outline" size={15} color={ORANGE} style={{ marginRight: 4 }} />
                  <Text style={styles.metaTextOrange}>18 Chapters</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="time-outline" size={15} color={CLAY} style={{ marginRight: 4 }} />
                  <Text style={styles.metaTextClay}>12h Reading</Text>
                </View>
              </View>

              {/* Description */}
              <Text style={styles.featuredDesc}>
                {'"The Song of God"—a timeless conversation on dharma, yoga, and the path to liberation.'}
              </Text>

              {/* CTA */}
              <TouchableOpacity
                style={styles.startBtn}
                onPress={() => router.push('/library/bhagvad-geeta' as any)}
              >
                <Text style={styles.startBtnTxt}>Start Reading</Text>
                <Ionicons name="arrow-forward" size={16} color={PEACHISH} style={{ marginLeft: 8 }} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ── Ancient Collection Section ── */}
        <View style={styles.listSectionHead}>
          <Text style={styles.listSectionTitle}>Ancient Collection</Text>
          <TouchableOpacity>
            <Text style={styles.viewAll}>View All ›</Text>
          </TouchableOpacity>
        </View>

        {/* List items */}
        <View style={styles.listWrapper}>
          {books.map(book => (
            <TouchableOpacity
              key={book.id}
              style={styles.listCard}
              onPress={() => router.push(book.route as any)}
              activeOpacity={0.88}
            >
              {/* Cover */}
              <Image source={book.cover} style={styles.listCover} resizeMode="stretch" />

              {/* Text block */}
              <View style={styles.listTextBlock}>
                <Text style={styles.listTitle}>{book.title}</Text>
                <Text style={styles.listSubtitle}>{book.subtitle}</Text>
                <Text style={styles.listSnippet} numberOfLines={2}>{book.snippet}</Text>

                {/* Progress bar (shown only when progress > 0) */}
                {book.progress > 0 && (
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${book.progress * 100}%` }]} />
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: H_PADDING,
    paddingTop: 10,
    paddingBottom: 14,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#5C2A01',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    letterSpacing: -0.5,
    lineHeight: 28,
  },

  /* Search */
  searchWrapper: {
    paddingHorizontal: H_PADDING,
    marginBottom: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 27,
    height: 54,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(226,191,176,0.30)',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: DARK,
    fontFamily: FONTS.medium,
  },

  /* Section header */
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: H_PADDING,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: DARK,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  viewAll: {
    fontSize: 14,
    fontWeight: '600',
    color: ORANGE,
    fontFamily: FONTS.medium,
  },

  /* Featured Card */
  featuredWrapper: {
    paddingHorizontal: H_PADDING,
    marginBottom: 28,
  },
  featuredCard: {
    backgroundColor: PEACHISH,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  featuredCoverBox: {
    width: '100%',
    height: 240,
    position: 'relative',
  },
  featuredCover: {
    width: '100%',
    height: '100%',
  },
  featuredContent: {
    padding: 20,
    paddingTop: 16,
  },
  featuredTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  featuredBookTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: A04100,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    flex: 1,
    lineHeight: 24,
  },
  bookmarkBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
    marginLeft: 8,
  },
  featuredAuthor: {
    fontSize: 16,
    fontWeight: '500',
    color: CLAY,
    fontFamily: FONTS.medium,
    lineHeight: 24,
    marginBottom: 8,
  },
  featuredMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  metaTextOrange: {
    fontSize: 16,
    fontWeight: '500',
    color: ORANGE,
    fontFamily: FONTS.medium,
    lineHeight: 24,
  },
  metaTextClay: {
    fontSize: 16,
    fontWeight: '500',
    color: CLAY,
    fontFamily: FONTS.medium,
    lineHeight: 24,
  },
  featuredDesc: {
    fontSize: 16,
    fontStyle: 'italic',
    color: BROWN,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    lineHeight: 24,
    marginBottom: 20,
  },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ORANGE,
    borderRadius: 12,
    height: 48,
    shadowColor: ORANGE,
    shadowOpacity: 0.30,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  startBtnTxt: {
    fontSize: 16,
    color: PEACHISH,
    fontFamily: FONTS.medium,
  },

  /* Ancient Collection section */
  listSectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: H_PADDING,
    marginBottom: 14,
  },
  listSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: DARK,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  listWrapper: {
    paddingHorizontal: H_PADDING,
    gap: 12,
  },
  listCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(226,191,176,0.20)',
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    alignItems: 'flex-start',
  },
  listCover: {
    width: 80,
    height: 120,
    borderRadius: 8,
    backgroundColor: '#F0E8E0',
    marginRight: 16,
  },
  listTextBlock: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  listTitle: {
    fontSize: 18,
    color: '#1B1C1C',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontStyle: 'normal',
    fontWeight: '700',
    lineHeight: 24,
    marginBottom: 2,
  },
  listSubtitle: {
    fontSize: 16,
    color: '#5A4136',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontStyle: 'normal',
    fontWeight: '600',
    lineHeight: 24,
    marginBottom: 4,
  },
  listSnippet: {
    alignSelf: 'stretch',
    fontSize: 14,
    color: '#8E7164',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontStyle: 'normal',
    fontWeight: '400',
    lineHeight: 20,
    marginBottom: 6,
  },
  progressTrack: {
    height: 4,
    backgroundColor: '#E9E8E7',
    borderRadius: 2,
    marginTop: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: ORANGE,
    borderRadius: 2,
  },
});
