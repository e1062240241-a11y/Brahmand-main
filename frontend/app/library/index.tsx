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
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { FONTS } from '../../src/constants/theme';
import { useGitaStore } from '../../src/store/gitaStore';
import { useLibraryStore } from '../../src/store/libraryStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ── Assets ────────────────────────────────────────────────────────────────
const geetaCover = require('../../assets/images/user_upload_2.png');
const ramcharitmanasCover = require('../../assets/images/Ramcharitmanas.jpg');
const atharvavedCover = require('../../assets/images/user_upload_0.png');
const mahabharataCover = require('../../assets/images/user_upload_1.png');
const rigvedaCover = require('../../assets/images/Rigveda.jpg');
const ramayanCover = require('../../assets/images/Ramayan-hardcover-front-scaled.jpg');
const yajurvedaCover = require('../../assets/images/Yajurveda.jpg');
const heroImage = require('../../assets/images/library_banner_new.jpg');
const diyaImage = require('../../assets/images/library_diya_new.jpg');

// ── Constants ─────────────────────────────────────────────────────────────
const CARD_W = 192; // ~240px Figma scaled
const CARD_COVER_H = 300;
const H_PADDING = 22;
const ORANGE = '#FF6B00';
const DARK = '#1B1C1C';
const BROWN = '#5A4136';

// ── Book data ─────────────────────────────────────────────────────────────
const BOOKS = [
  { id: 'atharvaved', title: 'Atharvaved', subtitle: 'THE ATHARVA VEDA', cover: atharvavedCover, route: '/library/atharvaved', progress: 0.45 },
  { id: 'mahabharata', title: 'Mahabharata', subtitle: 'THE GREAT EPIC', cover: mahabharataCover, route: '/library/mahabharata', progress: 0.25 },
  { id: 'ramayan', title: 'Ramayan', subtitle: 'VALMIKI RAMAYAN', cover: ramayanCover, route: '/library/ramayan', progress: 0.60 },
  { id: 'upanishads', title: 'Upanishads', subtitle: 'VEDIC TEXTS', cover: geetaCover, route: '/library/upanishads', progress: 0.30 },
  { id: 'rigveda', title: 'Rigveda', subtitle: 'RIGVEDA SAMHITA', cover: rigvedaCover, route: '/library/rigveda', progress: 0.15 },
  { id: 'yajurveda', title: 'Yajurveda', subtitle: 'YAJURVEDA', cover: yajurvedaCover, route: '/library/yajurveda', progress: 0.50 },
  { id: 'ramcharitmanas', title: 'Ramcharitmanas', subtitle: 'TULSIDAS', cover: ramcharitmanasCover, route: '/library/ramcharitmanas', progress: 0.20 },
];

const BOOK_COVERS: Record<string, any> = {
  'atharvaved': atharvavedCover,
  'mahabharata': mahabharataCover,
  'ramayan': ramayanCover,
  'upanishads': geetaCover,
  'rigveda': rigvedaCover,
  'yajurveda': yajurvedaCover,
  'ramcharitmanas': ramcharitmanasCover,
  'bhagvad-geeta': require('../../assets/images/bhagavad_gita_3d_new.png'),
};

// ─────────────────────────────────────────────────────────────────────────
export default function LibraryPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [saved, setSaved] = useState<Set<string>>(new Set());

  const toggle = (id: string) =>
    setSaved(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const books = query.trim()
    ? BOOKS.filter(b => b.title.toLowerCase().includes(query.toLowerCase()))
    : BOOKS;

  return (
    <View style={styles.root}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

      {/* Community tab background */}
      <LinearGradient
        colors={['#FF8D57', '#EA9B76', '#FFEEE5']}
        locations={[0, 0.09, 0.25]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={DARK} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Brahmand Library</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 56 + insets.bottom }}
      >
        {/* ── Search Bar ── */}
        <View style={styles.searchWrapper}>
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={19} color="#9E8878" style={{ marginRight: 10 }} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search by book name, author or topic."
              placeholderTextColor="#A09090"
              style={styles.searchInput}
            />
            <TouchableOpacity style={styles.filterBtn}>
              <MaterialCommunityIcons name="tune-vertical" size={20} color="#8A7060" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Hero Card ── */}
        <View style={styles.heroWrapper}>
          <View style={styles.heroCard}>
            {/* Background image (right-aligned) */}
            <Image source={heroImage} style={styles.heroImg} resizeMode="cover" />
            {/* Gradient overlay for readable text on left */}
            <LinearGradient
              colors={['rgba(16,12,8,0.7)', 'rgba(16,12,8,0.35)', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFillObject}
            />
            {/* Text content */}
            <View style={styles.heroContent}>
              <Text style={styles.heroGreeting}>Namaste, 🙏</Text>
              <Text style={styles.heroBody}>
                Explore timeless scriptures that guide{'\n'}your mind, nourish your soul and{'\n'}enrich your life.
              </Text>
              <TouchableOpacity
                style={styles.continueBtn}
                onPress={() => router.push('/library/sacred-scriptures' as any)}
              >
                <Text style={styles.continueTxt}>Continue Reading</Text>
                <Ionicons name="arrow-forward" size={15} color="#FFF" style={{ marginLeft: 8 }} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ── Dynamic Continue Reading (All Books) ── */}
        {(() => {
          const progresses = useLibraryStore(state => state.progresses);
          const gitaState = useGitaStore();
          
          let recentBooks = Object.values(progresses);
          
          // Fallback migration for Bhagavad Gita if not in libraryStore yet
          if (!progresses['bhagvad-geeta'] && (gitaState.progressPercent > 0 || gitaState.lastReadChapter > 1)) {
            recentBooks.push({
              id: 'bhagvad-geeta',
              chapterName: `Chapter ${gitaState.lastReadChapter}`,
              chapterNum: gitaState.lastReadChapter,
              lastReadPage: 1, // Approximation
              totalPages: 100,
              progressPercent: gitaState.progressPercent,
              lastOpenedTime: Date.now() - 10000, // Slightly older so current ones take precedence
            });
          }

          recentBooks = recentBooks.sort((a, b) => b.lastOpenedTime - a.lastOpenedTime);

          if (recentBooks.length > 0) {
            return (
              <View style={[styles.sectionWrapper, { marginTop: 16 }]}>
                <View style={styles.sectionHead}>
                  <View style={styles.headLeft}>
                    <View style={styles.accentBar} />
                    <Text style={styles.sectionTitle}>Continue Reading</Text>
                  </View>
                </View>
                
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: H_PADDING, gap: 16 }}>
                  {recentBooks.map((book) => {
                    const timeAgo = Math.round((Date.now() - book.lastOpenedTime) / 60000);
                    const timeString = timeAgo < 60 ? `${timeAgo}m ago` : timeAgo < 1440 ? `${Math.floor(timeAgo/60)}h ago` : `${Math.floor(timeAgo/1440)}d ago`;
                    return (
                      <TouchableOpacity
                        key={book.id}
                        style={[styles.gitaProgressCard, { marginHorizontal: 0, width: SCREEN_WIDTH * 0.85 }]}
                        onPress={() => router.push(`/library/${book.id}` as any)}
                        activeOpacity={0.9}
                      >
                        <Image source={BOOK_COVERS[book.id] || BOOK_COVERS['upanishads']} style={styles.gitaProgressImg} resizeMode="cover" />
                        <View style={styles.gitaProgressContent}>
                          <Text style={styles.gitaProgressTitle}>{BOOKS.find(b => b.id === book.id)?.title || book.id}</Text>
                          <Text style={styles.gitaProgressSub}>{book.chapterName} • Page {book.lastReadPage}</Text>
                          
                          <View style={styles.gitaProgressBarContainer}>
                            <View style={[styles.gitaProgressBarFill, { width: `${Math.max(book.progressPercent, 5)}%` }]} />
                          </View>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text style={styles.gitaProgressText}>{Math.round(book.progressPercent)}% Completed</Text>
                            <Text style={[styles.gitaProgressText, { opacity: 0.6 }]}>{timeString}</Text>
                          </View>
                        </View>
                        <Ionicons name="play-circle" size={36} color="#FF6B00" style={{ marginRight: 16 }} />
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            );
          }
          return null;
        })()}

        {/* ── Featured Collection ── */}
        <View style={styles.sectionWrapper}>
          {/* Section header */}
          <View style={styles.sectionHead}>
            <View style={styles.headLeft}>
              <View style={styles.accentBar} />
              <Text style={styles.sectionTitle}>Featured Collection</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/library/featured' as any)}>
              <Text style={styles.viewAll}>View All ›</Text>
            </TouchableOpacity>
          </View>

          {/* Horizontal book scroll */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.booksRow}
            snapToInterval={CARD_W + 16}
            decelerationRate="fast"
          >
            {books.map(book => (
              <TouchableOpacity
                key={book.id}
                style={styles.bookCard}
                onPress={() => router.push(book.route as any)}
                activeOpacity={0.92}
              >
                {/* Cover image */}
                <View style={styles.coverBox}>
                  <Image source={book.cover} style={styles.coverImg} resizeMode="cover" />

                  {/* Progress bar at bottom of cover */}
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${book.progress * 100}%` }]} />
                  </View>

                  {/* Heart / favourite */}
                  <TouchableOpacity
                    style={styles.heartBtn}
                    onPress={() => toggle(book.id)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons
                      name={saved.has(book.id) ? 'heart' : 'heart-outline'}
                      size={15}
                      color={saved.has(book.id) ? ORANGE : '#FFF'}
                    />
                  </TouchableOpacity>
                </View>

                {/* Book info */}
                <View style={styles.bookMeta}>
                  <Text style={styles.bookName} numberOfLines={1}>{book.title}</Text>
                  <Text style={styles.bookSub} numberOfLines={1}>{book.subtitle}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ── Quote Section ── */}
        <View style={styles.quoteWrapper}>
          <View style={styles.quoteCard}>
            {/* Opening quotation mark icon (orange) */}
            <View style={[styles.quoteIcon, { width: 25.5, height: 18, justifyContent: 'center', alignItems: 'center', overflow: 'visible' }]}>
              <MaterialCommunityIcons
                name="format-quote-close"
                size={34}
                color={ORANGE}
                style={{ marginTop: -12 }} // Adjust icon to perfectly fit the 18px height visually
              />
            </View>
            <Text style={styles.quoteText}>
              {'"A library is not just a collection of\nbooks, but a journey towards a better you."'}
            </Text>

            {/* Diya circular avatar */}
            <View style={styles.diyaContainer}>
              <View style={styles.diyaRing}>
                <Image source={diyaImage} style={styles.diyaImg} resizeMode="cover" />
              </View>
              {/* Orange Sparkle badge */}
              <View style={styles.diyaBadge}>
                <Ionicons name="sparkles" size={14} color="#FFF" />
              </View>
            </View>
          </View>
        </View>

        {/* ── 3D Book Button ── */}
        <View style={styles.book3dWrapper}>
          <TouchableOpacity
            style={styles.book3dBtn}
            onPress={() => router.push('/library/bhagavad-gita-3d' as any)}
          >
            <Text style={styles.book3dBtnTxt}>View 3D Bhagavad Gita</Text>
            <Ionicons name="book" size={18} color="#FFF" style={{ marginLeft: 8 }} />
          </TouchableOpacity>
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
    color: DARK,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    letterSpacing: -0.4,
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
    borderRadius: 24,
    height: 56,
    paddingHorizontal: 18,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: DARK,
    fontFamily: FONTS.medium,
    lineHeight: 22,
  },
  filterBtn: {
    paddingLeft: 10,
  },

  /* Hero card */
  heroWrapper: {
    paddingHorizontal: H_PADDING,
    marginBottom: 28,
  },
  heroCard: {
    height: 200,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#100C08',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 25,
    shadowOffset: { width: 0, height: 20 },
    elevation: 12,
  },
  heroImg: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    width: '100%',
    height: '100%',
  },
  heroContent: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 22,
  },
  heroGreeting: {
    fontSize: 16,
    color: '#FFDBCC',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontWeight: '600',
    marginBottom: 8,
    lineHeight: 24,
  },
  heroBody: {
    fontSize: 13,
    color: '#FFFFFF',
    lineHeight: 20,
    fontFamily: FONTS.medium,
    opacity: 0.88,
    marginBottom: 18,
  },
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ORANGE,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 30,
    alignSelf: 'center',
    shadowColor: ORANGE,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  continueTxt: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: FONTS.bold,
    letterSpacing: 0.1,
  },

  gitaProgressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF3EB',
    borderRadius: 16,
    padding: 12,
    marginHorizontal: H_PADDING,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 0, 0.1)',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  gitaProgressImg: {
    width: 60,
    height: 80,
    borderRadius: 8,
  },
  gitaProgressContent: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  gitaProgressTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: DARK,
    marginBottom: 4,
  },
  gitaProgressSub: {
    fontSize: 13,
    color: BROWN,
    marginBottom: 10,
  },
  gitaProgressBarContainer: {
    height: 6,
    backgroundColor: '#EED9C4',
    borderRadius: 3,
    overflow: 'hidden',
    width: '80%',
    marginBottom: 6,
  },
  gitaProgressBarFill: {
    height: '100%',
    backgroundColor: ORANGE,
    borderRadius: 3,
  },
  gitaProgressText: {
    fontSize: 11,
    color: BROWN,
    fontWeight: '500',
  },

  /* Section */
  sectionWrapper: {
    marginBottom: 28,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: H_PADDING,
    marginBottom: 18,
  },
  headLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accentBar: {
    width: 4,
    height: 22,
    borderRadius: 2,
    backgroundColor: ORANGE,
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: DARK,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    letterSpacing: 0.1,
  },
  viewAll: {
    fontSize: 15,
    color: '#A04100',
    fontFamily: FONTS.medium,
  },

  /* Books row */
  booksRow: {
    paddingLeft: H_PADDING,
    paddingRight: 10,
    paddingBottom: 6,
  },
  bookCard: {
    width: CARD_W,
    marginRight: 16,
  },
  coverBox: {
    width: '100%',
    height: CARD_COVER_H,
    position: 'relative',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  coverImg: {
    width: '100%',
    height: '100%',
  },
  progressTrack: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: 'rgba(160,65,0,0.20)',
  },
  progressFill: {
    height: '100%',
    backgroundColor: ORANGE,
    borderRadius: 2,
  },
  heartBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookMeta: {
    paddingHorizontal: 4,
    paddingTop: 14,
    paddingBottom: 14,
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  bookName: {
    fontSize: 15,
    fontWeight: '500',
    color: DARK,
    fontFamily: FONTS.medium,
    marginBottom: 4,
    lineHeight: 22,
    textAlign: 'center',
  },
  bookSub: {
    fontSize: 12,
    color: BROWN,
    fontFamily: FONTS.medium,
    letterSpacing: 0.2,
    lineHeight: 18,
    textAlign: 'center',
  },

  /* Quote */
  quoteWrapper: {
    paddingHorizontal: H_PADDING,
    marginBottom: 50,
  },
  quoteCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingTop: 24,
    paddingBottom: 28,
    paddingHorizontal: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },
  quoteIcon: {
    marginBottom: 8,
  },
  quoteText: {
    fontSize: 15,
    color: '#4A4A4A',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontStyle: 'italic',
    fontWeight: '400',
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 20,
  },
  diyaContainer: {
    position: 'relative',
    width: 76,
    height: 76,
    marginTop: 4,
  },
  diyaRing: {
    width: 76,
    height: 76,
    borderRadius: 38,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.10,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    backgroundColor: '#FFF',
  },
  diyaImg: {
    width: '100%',
    height: '100%',
  },
  diyaBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: ORANGE,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  book3dWrapper: {
    paddingHorizontal: H_PADDING,
    marginBottom: 20,
    alignItems: 'center',
  },
  book3dBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BROWN,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  book3dBtnTxt: {
    color: '#FFF',
    fontSize: 15,
    fontFamily: FONTS.bold,
    fontWeight: '600',
  },
});
