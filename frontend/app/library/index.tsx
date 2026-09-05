import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
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
  Pressable,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  Easing,
  SharedValue,
} from 'react-native-reanimated';
import { useRouter, Stack } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { FONTS } from '../../src/constants/theme';
import { useLibraryStore } from '../../src/store/libraryStore';
import { useLanguageStore } from '../../src/utils/i18n';
import { scheduleDailyScriptureNotifications } from '../../src/services/pushNotifications';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ── Flowing Forward Arrows Animation (Lightweight, UI-thread worklet) ───────
const CHEVRONS = [0, 1, 2];

const ChevronItem = React.memo(function ChevronItem({
  index,
  waveProgress,
}: {
  index: number;
  waveProgress: SharedValue<number>;
}) {
  const animStyle = useAnimatedStyle(() => {
    'worklet';
    const phase = (waveProgress.value - index * 0.18 + 1) % 1;
    const opacity = 0.2 + 0.8 * Math.sin(phase * Math.PI);
    const translateX = Math.sin(phase * Math.PI) * 2.5;

    return {
      opacity,
      transform: [{ translateX }],
    };
  });

  return (
    <Animated.Text style={[{ fontSize: 13, fontWeight: '800', color: '#FF6B00', marginHorizontal: -1 }, animStyle]}>
      ❯
    </Animated.Text>
  );
});

const FlowingForwardArrows = React.memo(function FlowingForwardArrows() {
  const waveProgress = useSharedValue(0);

  useEffect(() => {
    waveProgress.value = withRepeat(
      withTiming(1, { duration: 1200, easing: Easing.linear }),
      -1,
      false
    );
  }, [waveProgress]);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingRight: 10, paddingLeft: 4 }}>
      <Ionicons name="chevron-forward" size={16} color="#FF6B00" style={{ marginRight: -3 }} />
      {CHEVRONS.map((i) => (
        <ChevronItem key={i} index={i} waveProgress={waveProgress} />
      ))}
    </View>
  );
});

// ── Assets ────────────────────────────────────────────────────────────────
const geetaCover = { uri: 'https://brahmandfeed23.b-cdn.net/assets/featured_book_6.webp' };
const ramcharitmanasCover = { uri: 'https://brahmandfeed23.b-cdn.net/assets/featured_book_1.webp' };
const atharvavedCover = { uri: 'https://brahmandfeed23.b-cdn.net/assets/user_upload_0.webp' };
const mahabharataCover = { uri: 'https://brahmandfeed23.b-cdn.net/assets/featured_book_4.webp' };
const rigvedaCover = { uri: 'https://brahmandfeed23.b-cdn.net/assets/featured_book_2.webp' };
const ramayanCover = { uri: 'https://brahmandfeed23.b-cdn.net/assets/featured_book_5.webp' };
const yajurvedaCover = { uri: 'https://brahmandfeed23.b-cdn.net/assets/featured_book_3.webp' };
const heroImage = { uri: 'https://brahmandfeed23.b-cdn.net/assets/library_banner_new.webp' };
const diyaImage = { uri: 'https://brahmandfeed23.b-cdn.net/assets/library_diya_new.webp' };

// ── Constants ─────────────────────────────────────────────────────────────
const CARD_W = 192; // ~240px Figma scaled
const CARD_COVER_H = 300;
const H_PADDING = 22;
const ORANGE = '#FF6B00';
const DARK = '#1B1C1C';
const BROWN = '#5A4136';

// ── Book data ─────────────────────────────────────────────────────────────
const BOOKS = [
  { id: 'bhagvad-geeta', title: 'Bhagavad Gita', subtitle: 'THE SONG OF GOD', cover: geetaCover, route: '/library/bhagavad-gita-3d', progress: 0.0 },
  { id: 'mahabharata', title: 'Mahabharata', subtitle: 'THE GREAT EPIC', cover: mahabharataCover, route: '/library/mahabharata', progress: 0.25 },
  { id: 'ramayan', title: 'Ramayan', subtitle: 'VALMIKI RAMAYAN', cover: ramayanCover, route: '/library/ramayan', progress: 0.60 },
  { id: 'ramcharitmanas', title: 'Ramcharitmanas', subtitle: 'TULSIDAS', cover: ramcharitmanasCover, route: '/library/ramcharitmanas', progress: 0.20 },
  { id: 'upanishads', title: 'Upanishads', subtitle: 'VEDIC TEXTS', cover: { uri: 'https://brahmandfeed23.b-cdn.net/assets/featured_book_7.webp' }, route: '/library/upanishads', progress: 0.30 },
  { id: 'rigveda', title: 'Rigveda', subtitle: 'RIGVEDA SAMHITA', cover: rigvedaCover, route: '/library/rigveda', progress: 0.15 },
  { id: 'yajurveda', title: 'Yajurveda', subtitle: 'YAJURVEDA', cover: yajurvedaCover, route: '/library/yajurveda', progress: 0.50 },
  { id: 'atharvaved', title: 'Atharvaved', subtitle: 'THE ATHARVA VEDA', cover: atharvavedCover, route: '/library/atharvaved', progress: 0.45 },
];

const BOOK_COVERS: Record<string, any> = {
  'atharvaved': atharvavedCover,
  'mahabharata': mahabharataCover,
  'ramayan': ramayanCover,
  'upanishads': geetaCover,
  'rigveda': rigvedaCover,
  'yajurveda': yajurvedaCover,
  'ramcharitmanas': ramcharitmanasCover,
  'bhagvad-geeta': geetaCover,
  'gita': geetaCover,
};

// ─────────────────────────────────────────────────────────────────────────
function LibraryPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const language = useLanguageStore((state) => state.language);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [showCursorCircle, setShowCursorCircle] = useState(false);
  const [cursorX, setCursorX] = useState(0);
  const lastTapRef = useRef(0);
  const progresses = useLibraryStore(s => s.progresses);
  const observedProgress = useMemo(() => {
    const books = Object.values(progresses || {});
    return books.sort((a, b) => b.lastOpenedTime - a.lastOpenedTime);
  }, [progresses]);
  const recentBooks = useMemo(() => {
    let recent = (observedProgress || []).map((p: any) => {
      const bookId = p.bookId || p.id;
      return {
        id: bookId === 'gita' ? 'bhagvad-geeta' : bookId,
        chapterName: p.chapterName,
        chapterNum: p.chapterNum,
        lastReadPage: p.lastReadPage,
        totalPages: p.totalPages,
        progressPercent: p.progressPercent,
        lastOpenedTime: p.lastOpenedTime,
      };
    });

    recent = recent.sort((a, b) => b.lastOpenedTime - a.lastOpenedTime);
    const seenIds = new Set<string>();
    return recent.filter(b => {
      if (seenIds.has(b.id)) return false;
      seenIds.add(b.id);
      return true;
    });
  }, [observedProgress]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 200);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    scheduleDailyScriptureNotifications().catch(err => {
      console.warn('[Library] Failed to schedule daily scripture reading notifications:', err);
    });
  }, []);

  const toggle = (id: string) =>
    setSaved(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const handleSearchPress = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      setShowCursorCircle(true);
      setTimeout(() => setShowCursorCircle(false), 800);
    }
    lastTapRef.current = now;
  };

  const handleSelectionChange = (e: any) => {
    if (!showCursorCircle) return;
    const { start } = e.nativeEvent.selection;
    const textBeforeCursor = query.substring(0, start);
    const charWidth = 8.5;
    const xOffset = 28;
    setCursorX(Math.min(xOffset + textBeforeCursor.length * charWidth, Dimensions.get('window').width - 80));
  };

  const books = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    if (!q) return BOOKS;
    return BOOKS.filter(b => b.title.toLowerCase().includes(q));
  }, [debouncedQuery]);

  return (
    <View style={{ flex: 1, backgroundColor: '#FF8D57' }}>
      <Stack.Screen options={{ animation: 'slide_from_right', headerShown: false }} />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        <LinearGradient
          colors={['#FF8D57', '#EA9B76', '#FFEEE5']}
          locations={[0, 0.0913, 0.25]}
          style={styles.screen}
        >
          {/* ── Header ── */}
          <View style={[styles.header, { paddingTop: 6 }]}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => router.back()}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="chevron-back" size={28} color={DARK} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Brahmand Library</Text>
            <View style={{ width: 40 }} />
          </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 56 + insets.bottom }}
      >
        {/* ── Search Bar ── */}
        <View style={styles.searchWrapper}>
          <Pressable
            onPress={handleSearchPress}
            android_ripple={{ color: 'rgba(255, 107, 0, 0.15)', borderless: false }}
            style={({ pressed }) => [
              styles.searchBar,
              pressed && Platform.OS === 'ios' && { opacity: 0.92, transform: [{ scale: 0.98 }] }
            ]}
          >
            <Ionicons name="search-outline" size={19} color="#9E8878" style={{ marginRight: 10 }} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              onSelectionChange={handleSelectionChange}
              placeholder="Search by book name, author or topic."
              placeholderTextColor="#A09090"
              style={styles.searchInput}
            />
            <TouchableOpacity style={styles.filterBtn}>
              <MaterialCommunityIcons name="tune-vertical" size={20} color="#8A7060" />
            </TouchableOpacity>
          </Pressable>
          {showCursorCircle && (
            <View style={[styles.cursorCircleContainer, { left: cursorX }]}>
              <View style={styles.cursorCircle} />
            </View>
          )}
        </View>

        {/* ── Quote Section (Moved to Top) ── */}
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

        {/* ── Dynamic Continue Reading (All Books) ── */}
        {recentBooks.length > 0 && (
              <View style={[styles.sectionWrapper, { marginTop: 16 }]}>
                {/* 🧡 Engagement: Reframed transactional reading section title to devotional Swadhyaya (स्वाध्याय)
                    Lever: Reframing (Transactional -> Devotional)
                    Why: "पठन जारी रखें" directly connects with language preferences while keeping UI light. */}
                <View style={styles.sectionHead}>
                  <View style={styles.headLeft}>
                    <View style={styles.accentBar} />
                    <Text style={styles.sectionTitle}>
                      {language === 'hi' ? '📖 पठन जारी रखें' : '📖 Continue Reading'}
                    </Text>
                  </View>
                </View>
                
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: H_PADDING, gap: 16 }}>
                  {recentBooks.map((book, index) => {
                    const timeAgo = Math.round((Date.now() - book.lastOpenedTime) / 60000);
                    const timeString = timeAgo < 60 ? `${timeAgo}m ago` : timeAgo < 1440 ? `${Math.floor(timeAgo/60)}h ago` : `${Math.floor(timeAgo/1440)}d ago`;
                    const bookMeta = BOOKS.find(b => b.id === book.id);
                    const targetRoute = bookMeta ? bookMeta.route : `/library/${book.id}`;
                    return (
                      <TouchableOpacity
                        key={`${book.id}-${index}`}
                        style={[styles.gitaProgressCard, { marginHorizontal: 0, width: Math.min(SCREEN_WIDTH * 0.74, 285) }]}
                        onPress={() => router.push(targetRoute as any)}
                        activeOpacity={0.9}
                      >
                        <Image source={BOOK_COVERS[book.id] || BOOK_COVERS['upanishads']} style={styles.gitaProgressImg} resizeMode="cover" />
                        <View style={styles.gitaProgressContent}>
                          <Text style={styles.gitaProgressTitle}>{bookMeta?.title || book.id}</Text>
                          <Text style={styles.gitaProgressSub}>{book.chapterName} • Page {book.lastReadPage}</Text>
                          
                          <View style={styles.gitaProgressBarContainer}>
                            <View style={[styles.gitaProgressBarFill, { width: `${Math.max(book.progressPercent, 5)}%` }]} />
                          </View>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            {/* 🧡 Engagement: Reframed transactional "% Completed" to devotional "% स्वाध्याय पूर्ण"
                                Lever: Reframing + Cultivating Sanskara (Self-study habit)
                                Why: "स्वाध्याय" frame encourages sacred daily reading habit over task completion. */}
                            <Text style={styles.gitaProgressText}>
                              {language === 'hi'
                                ? `${Math.round(book.progressPercent)}% स्वाध्याय पूर्ण`
                                : `${Math.round(book.progressPercent)}% Studied`}
                            </Text>
                            <Text style={[styles.gitaProgressText, { opacity: 0.6 }]}>{timeString}</Text>
                          </View>
                        </View>
                        <FlowingForwardArrows />
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
        )}

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



        </ScrollView>
        </LinearGradient>
      </SafeAreaView>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFEEE5',
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
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
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
  cursorCircleContainer: {
    position: 'absolute',
    bottom: -12,
    transform: [{ translateX: -6 }],
    alignItems: 'center',
    justifyContent: 'center',
  },
  cursorCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 107, 0, 0.6)',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    marginHorizontal: H_PADDING,
    borderWidth: 1,
    borderColor: '#EFE7DE',
    overflow: 'hidden',
    shadowColor: '#5A4136',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
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
    marginBottom: 16,
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
  jathaBtnWrapper: {
    paddingHorizontal: H_PADDING,
    marginTop: 14,
  },
  jathaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ORANGE,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 20,
    shadowColor: ORANGE,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  jathaBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },
});

export default LibraryPage;
