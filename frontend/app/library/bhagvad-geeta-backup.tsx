import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  ImageBackground,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getBhagavadGitaChapter } from '../../src/services/api';

type VerseItem = {
  chapter: number;
  verse: number;
  text: string;
  translations: Record<string, string>;
  transliteration?: string;
};

type PageItem = {
  id: string;
  chapter: number;
  pageNumber: number;
  verseStart: number;
  verseEnd: number;
  verses: VerseItem[];
};

type SpreadItem = {
  id: string;
  left: PageItem | null;
  right: PageItem | null;
  rightIndex: number;
};

const CHAPTER_TITLES = [
  'Arjuna Vishada Yoga',
  'Sankhya Yoga',
  'Karma Yoga',
  'Jnana Karma Sanyasa Yoga',
  'Karma Sanyasa Yoga',
  'Dhyana Yoga',
  'Jnana Vijnana Yoga',
  'Akshara Brahma Yoga',
  'Raja Vidya Raja Guhya Yoga',
  'Vibhuti Yoga',
  'Vishvarupa Darshana Yoga',
  'Bhakti Yoga',
  'Kshetra Kshetrajna Vibhaga Yoga',
  'Gunatraya Vibhaga Yoga',
  'Purushottama Yoga',
  'Daivasura Sampad Vibhaga Yoga',
  'Shraddhatraya Vibhaga Yoga',
  'Moksha Sanyasa Yoga',
];

const { width: windowWidth, height: windowHeight } = Dimensions.get('window');

const BOOK_WIDTH = Math.min(windowWidth * 0.95, 980);
const PAGE_WIDTH = BOOK_WIDTH / 2;
const BOOK_HEIGHT = Math.min(windowHeight * 0.74, PAGE_WIDTH * 1.52);

const PAGE_HEADER_HEIGHT = 76;
const PAGE_FOOTER_HEIGHT = 48;
const PAGE_INNER_VERTICAL_PADDING = 18;
const PAGE_BODY_GAP = 14;
const PAGE_BODY_MAX_HEIGHT =
  BOOK_HEIGHT - PAGE_HEADER_HEIGHT - PAGE_FOOTER_HEIGHT - PAGE_INNER_VERTICAL_PADDING * 2;

const STORAGE_LAST_READ_KEY = (chapter: number) => `gita:last-read:chapter:${chapter}`;
const STORAGE_BOOKMARK_KEY = (chapter: number) => `gita:bookmark:chapter:${chapter}`;

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const getPreferredTranslation = (translations: Record<string, string>) => {
  if (!translations || typeof translations !== 'object') {
    return '';
  }
  const preferred =
    translations['swami ramsukhdas'] ||
    translations['Swami Ramsukhdas'] ||
    translations['swami tejomayananda'] ||
    translations['Swami Tejomayananda'] ||
    translations['swami sivananda'] ||
    translations['Swami Sivananda'];

  if (typeof preferred === 'string') {
    return preferred;
  }

  const firstKey = Object.keys(translations)[0];
  return firstKey ? translations[firstKey] : '';
};

const estimateVerseHeight = (verse: VerseItem) => {
  const translation = getPreferredTranslation(verse.translations);
  const transliteration = typeof verse.transliteration === 'string' ? verse.transliteration : '';
  const source = `${verse.text || ''}\n${transliteration}\n${translation}`;
  const lineCount = Math.max(3, source.split('\n').length + Math.ceil(source.length / 66));
  return 84 + lineCount * 19;
};

const buildPages = (verses: VerseItem[], heights: Record<string, number>) => {
  const pages: PageItem[] = [];
  let currentPageVerses: VerseItem[] = [];
  let currentHeight = 0;
  let pageNumber = 1;

  const pushPage = () => {
    if (currentPageVerses.length === 0) {
      return;
    }
    const verseStart = currentPageVerses[0].verse;
    const verseEnd = currentPageVerses[currentPageVerses.length - 1].verse;
    pages.push({
      id: `page-${pageNumber}`,
      chapter: currentPageVerses[0].chapter,
      pageNumber,
      verseStart,
      verseEnd,
      verses: currentPageVerses,
    });
    pageNumber += 1;
    currentPageVerses = [];
    currentHeight = 0;
  };

  verses.forEach((verse, idx) => {
    const id = `${verse.chapter}-${verse.verse}-${idx}`;
    const verseHeight = heights[id] ?? estimateVerseHeight(verse);
    const nextHeight = currentPageVerses.length > 0 ? currentHeight + PAGE_BODY_GAP + verseHeight : verseHeight;

    if (nextHeight > PAGE_BODY_MAX_HEIGHT && currentPageVerses.length > 0) {
      pushPage();
    }

    const finalId = `${verse.chapter}-${verse.verse}-${idx}`;
    void finalId;
    currentPageVerses.push(verse);
    currentHeight =
      currentPageVerses.length > 1 ? currentHeight + PAGE_BODY_GAP + verseHeight : verseHeight;
  });

  pushPage();
  return pages;
};

function VerseBlock({ verse, nightMode }: { verse: VerseItem; nightMode: boolean }) {
  const translation = getPreferredTranslation(verse.translations);
  const transliteration = typeof verse.transliteration === 'string' ? verse.transliteration : '';

  return (
    <View style={styles.verseBlock}>
      <Text style={[styles.verseNumber, { color: nightMode ? '#D2B07A' : '#8A6A40' }]}>
        {verse.chapter}.{verse.verse}
      </Text>

      <View style={styles.dividerContainer}>
        <View style={[styles.dividerLine, { backgroundColor: nightMode ? '#8f7751' : '#A48B5D' }]} />
        <Ionicons
          name="diamond"
          size={8}
          color={nightMode ? '#8f7751' : '#A48B5D'}
          style={{ marginHorizontal: 8 }}
        />
        <View style={[styles.dividerLine, { backgroundColor: nightMode ? '#8f7751' : '#A48B5D' }]} />
      </View>

      <Text style={[styles.sanskritText, { color: nightMode ? '#F3DEC0' : '#2A1A0B' }]}>{verse.text}</Text>

      {transliteration ? (
        <Text style={[styles.transliterationText, { color: nightMode ? '#D8C7A8' : '#5B4729' }]}>
          {transliteration}
        </Text>
      ) : null}

      {!!translation && (
        <Text style={[styles.translationText, { color: nightMode ? '#E6D4B7' : '#3C2A15' }]}>
          {translation}
        </Text>
      )}
    </View>
  );
}

function MeasureVerseBlock({
  verse,
  id,
  onMeasure,
}: {
  verse: VerseItem;
  id: string;
  onMeasure: (id: string, h: number) => void;
}) {
  const translation = getPreferredTranslation(verse.translations);
  const transliteration = typeof verse.transliteration === 'string' ? verse.transliteration : '';

  return (
    <View
      style={styles.measureVerseBlock}
      onLayout={(event) => onMeasure(id, Math.ceil(event.nativeEvent.layout.height))}
    >
      <Text style={styles.verseNumber}>{verse.chapter}.{verse.verse}</Text>
      <View style={styles.dividerContainer}>
        <View style={styles.dividerLine} />
        <Ionicons name="diamond" size={8} color="#A48B5D" style={{ marginHorizontal: 8 }} />
        <View style={styles.dividerLine} />
      </View>
      <Text style={styles.sanskritText}>{verse.text}</Text>
      {transliteration ? <Text style={styles.transliterationText}>{transliteration}</Text> : null}
      {!!translation && <Text style={styles.translationText}>{translation}</Text>}
    </View>
  );
}

function BookPage({
  page,
  totalPages,
  chapterTitle,
  isLeft,
  isLastRead,
  nightMode,
  onPrev,
  onNext,
}: {
  page: PageItem | null;
  totalPages: number;
  chapterTitle: string;
  isLeft: boolean;
  isLastRead: boolean;
  nightMode: boolean;
  onPrev: () => void;
  onNext: () => void;
}) {
  const pageBg = nightMode ? '#4A3A27' : '#E0C38D';
  const pageEdge = nightMode ? '#6B573A' : '#C4A972';

  return (
    <View
      style={[
        styles.pageCard,
        isLeft ? styles.pageLeftEdges : styles.pageRightEdges,
        { backgroundColor: pageBg, borderColor: pageEdge },
      ]}
    >
      <ImageBackground
        source={{ uri: 'https://www.transparenttextures.com/patterns/rice-paper-2.png' }}
        style={StyleSheet.absoluteFillObject}
        imageStyle={{ opacity: nightMode ? 0.08 : 0.15 }}
      />

      <View
        style={[
          styles.pageInnerFrame,
          {
            borderColor: nightMode ? '#7D6644' : '#B99661',
            shadowOpacity: nightMode ? 0.22 : 0.14,
          },
        ]}
      >
        <View style={styles.pageHeader}>
          <Text style={[styles.pageHeaderTitle, { color: nightMode ? '#EBD7B6' : '#5A3E20' }]} numberOfLines={1}>
            {page ? `Chapter ${page.chapter} – ${chapterTitle}` : `Chapter 1 – ${chapterTitle}`}
          </Text>
          <Text style={[styles.pageHeaderSub, { color: nightMode ? '#D1B07A' : '#7E5E34' }]}>
            {page ? `Verse ${page.verseStart}${page.verseStart !== page.verseEnd ? `–${page.verseEnd}` : ''}` : '—'}
          </Text>
        </View>

        <View style={styles.pageBody}>
          {page ? page.verses.map((verse) => <VerseBlock key={`${verse.chapter}-${verse.verse}`} verse={verse} nightMode={nightMode} />) : null}
        </View>

        <View style={styles.pageFooter}>
          <Text style={[styles.pageFooterText, { color: nightMode ? '#D8BE98' : '#6D4F2B' }]}>
            {page ? `Page ${page.pageNumber} of ${totalPages}` : `Page 0 of ${totalPages}`}
          </Text>
          <View style={[styles.pageProgressTrack, { backgroundColor: nightMode ? '#6B573A' : '#CFAF79' }]}>
            <View
              style={[
                styles.pageProgressFill,
                {
                  width: `${page ? (page.pageNumber / Math.max(1, totalPages)) * 100 : 0}%`,
                  backgroundColor: nightMode ? '#F0D8AA' : '#7E5E34',
                },
              ]}
            />
          </View>
          {isLastRead && !isLeft ? (
            <Text style={[styles.lastReadBadge, { color: nightMode ? '#F0D8AA' : '#744A12' }]}>Last Read</Text>
          ) : (
            <View style={styles.lastReadSpacer} />
          )}
        </View>
      </View>

      {isLeft ? (
        <TouchableOpacity style={[styles.sideTab, styles.sideTabLeft]} onPress={onPrev} activeOpacity={0.9}>
          <View style={styles.tabTextWrapperLeft}>
            <Text style={styles.tabText}>← Previous Page</Text>
          </View>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={[styles.sideTab, styles.sideTabRight]} onPress={onNext} activeOpacity={0.9}>
          <View style={styles.tabTextWrapperRight}>
            <Text style={styles.tabText}>Next Page →</Text>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function BhagvadGeetaReaderScreen() {
  const router = useRouter();
  const listRef = useRef<FlatList<SpreadItem>>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [chapterNum, setChapterNum] = useState(1);
  const [verses, setVerses] = useState<VerseItem[]>([]);

  const [heights, setHeights] = useState<Record<string, number>>({});

  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [lastReadPageIndex, setLastReadPageIndex] = useState(0);
  const [bookmarkPageIndex, setBookmarkPageIndex] = useState<number | null>(null);

  const [showContents, setShowContents] = useState(false);
  const [nightMode, setNightMode] = useState(false);

  const [progressTrackWidth, setProgressTrackWidth] = useState(0);

  const coverFlip = useRef(new Animated.Value(0)).current;
  const coverPulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let mounted = true;

    const loadChapter = async () => {
      setLoading(true);
      setError(null);
      setHeights({});
      try {
        const response = await getBhagavadGitaChapter(chapterNum);
        const payload = response.data;
        const incoming = Array.isArray(payload?.verses) ? payload.verses : [];
        if (mounted) {
          setVerses(incoming);
        }
      } catch (err: any) {
        const detail = err?.response?.data?.detail;
        if (mounted) {
          setError(typeof detail === 'string' ? detail : `Failed to load Chapter ${chapterNum}`);
          setVerses([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadChapter();

    return () => {
      mounted = false;
    };
  }, [chapterNum]);

  useEffect(() => {
    if (loading || verses.length === 0) {
      return;
    }

    coverFlip.setValue(0);
    coverPulse.setValue(0);

    Animated.loop(
      Animated.sequence([
        Animated.timing(coverPulse, { toValue: 1, duration: 2600, useNativeDriver: true }),
        Animated.timing(coverPulse, { toValue: 0, duration: 2600, useNativeDriver: true }),
      ])
    ).start();

    Animated.sequence([
      Animated.delay(1100),
      Animated.timing(coverFlip, {
        toValue: 1,
        duration: 2400,
        useNativeDriver: true,
      }),
    ]).start();
  }, [loading, verses, coverFlip, coverPulse]);

  const pages = useMemo(() => {
    if (verses.length === 0) {
      return [] as PageItem[];
    }
    return buildPages(verses, heights);
  }, [verses, heights]);

  const spreads = useMemo<SpreadItem[]>(() => {
    const total = Math.max(1, pages.length);
    return Array.from({ length: total }).map((_, rightIndex) => ({
      id: `spread-${rightIndex}`,
      left: rightIndex > 0 ? pages[rightIndex - 1] : null,
      right: pages[rightIndex] ?? null,
      rightIndex,
    }));
  }, [pages]);

  useEffect(() => {
    let mounted = true;

    const loadReaderState = async () => {
      const [lastReadRaw, bookmarkRaw] = await Promise.all([
        AsyncStorage.getItem(STORAGE_LAST_READ_KEY(chapterNum)),
        AsyncStorage.getItem(STORAGE_BOOKMARK_KEY(chapterNum)),
      ]);

      if (!mounted) {
        return;
      }

      const maxPage = Math.max(0, pages.length - 1);
      const parsedLast = Number(lastReadRaw);
      const parsedBookmark = Number(bookmarkRaw);

      const safeLastRead = Number.isFinite(parsedLast) ? clamp(parsedLast, 0, maxPage) : 0;
      const safeBookmark = Number.isFinite(parsedBookmark) ? clamp(parsedBookmark, 0, maxPage) : null;

      setCurrentPageIndex(safeLastRead);
      setLastReadPageIndex(safeLastRead);
      setBookmarkPageIndex(safeBookmark);

      requestAnimationFrame(() => {
        if (safeLastRead >= 0 && safeLastRead < spreads.length) {
          listRef.current?.scrollToIndex({ index: safeLastRead, animated: false });
        }
      });
    };

    if (pages.length > 0) {
      loadReaderState();
    }

    return () => {
      mounted = false;
    };
  }, [chapterNum, pages.length, spreads.length]);

  useEffect(() => {
    if (pages.length === 0) {
      return;
    }
    AsyncStorage.setItem(STORAGE_LAST_READ_KEY(chapterNum), String(currentPageIndex));
    setLastReadPageIndex(currentPageIndex);
  }, [currentPageIndex, chapterNum, pages.length]);

  const chapterTitle = CHAPTER_TITLES[chapterNum - 1] || 'Bhagavad Gita';

  const coverRotateY = coverFlip.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-180deg'],
  });

  const coverOpacity = coverFlip.interpolate({
    inputRange: [0, 0.49, 0.5, 1],
    outputRange: [1, 1, 0, 0],
  });

  const entryShift = coverFlip.interpolate({
    inputRange: [0, 1],
    outputRange: [PAGE_WIDTH / 2, 0],
  });

  const entryScale = coverFlip.interpolate({
    inputRange: [0, 1],
    outputRange: [0.93, 1],
  });

  const titlePulse = coverPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.98, 1.02],
  });

  const goToPage = (index: number, animated = true) => {
    const maxIndex = Math.max(0, spreads.length - 1);
    const target = clamp(index, 0, maxIndex);
    listRef.current?.scrollToIndex({ index: target, animated });
    setCurrentPageIndex(target);
  };

  const onProgressTouch = (locationX: number) => {
    if (progressTrackWidth <= 0 || pages.length <= 1) {
      return;
    }
    const ratio = clamp(locationX / progressTrackWidth, 0, 1);
    const target = Math.round(ratio * (pages.length - 1));
    goToPage(target);
  };

  const onToggleBookmark = async () => {
    const isCurrentBookmarked = bookmarkPageIndex === currentPageIndex;
    if (isCurrentBookmarked) {
      setBookmarkPageIndex(null);
      await AsyncStorage.removeItem(STORAGE_BOOKMARK_KEY(chapterNum));
      return;
    }
    setBookmarkPageIndex(currentPageIndex);
    await AsyncStorage.setItem(STORAGE_BOOKMARK_KEY(chapterNum), String(currentPageIndex));
  };

  const bookmarkActive = bookmarkPageIndex === currentPageIndex;
  const progressRatio = pages.length <= 1 ? 0 : currentPageIndex / (pages.length - 1);

  if (loading) {
    return (
      <View style={styles.stateContainer}>
        <ActivityIndicator size="large" color="#E7D1A2" />
        <Text style={styles.stateText}>Opening sacred pages...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.stateContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.outerContainer, { backgroundColor: nightMode ? '#0E0905' : '#120904' }]}
      edges={['top', 'left', 'right', 'bottom']}
    >
      <Modal visible={showContents} transparent animationType="fade" onRequestClose={() => setShowContents(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setShowContents(false)}>
          <View style={styles.contentsCard}>
            <Text style={styles.contentsTitle}>Contents</Text>
            {CHAPTER_TITLES.map((title, index) => {
              const chapter = index + 1;
              const selected = chapter === chapterNum;
              return (
                <TouchableOpacity
                  key={`chapter-${chapter}`}
                  style={[styles.contentsRow, selected && styles.contentsRowSelected]}
                  onPress={() => {
                    setShowContents(false);
                    setChapterNum(chapter);
                  }}
                >
                  <Text style={[styles.contentsText, selected && styles.contentsTextSelected]}>
                    {chapter}. {title}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Pressable>
      </Modal>

      <View style={styles.topHeaderRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.rowBtn}>
          <Ionicons name="chevron-back" size={24} color="#D1B981" />
          <Text style={styles.rowTitle}>Bhagavad Gita</Text>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerChapterSanskrit}>अध्याय {chapterNum} / Chapter {chapterNum}</Text>
          <Text style={styles.headerChapterEnglish}>{chapterTitle}</Text>
        </View>

        <View style={styles.headerActions}>
          <Ionicons name="search" size={22} color="#D1B981" style={styles.headerIcon} />
          <TouchableOpacity onPress={onToggleBookmark} style={styles.headerIconBtn}>
            <Ionicons
              name={bookmarkActive ? 'bookmark' : 'bookmark-outline'}
              size={22}
              color={bookmarkActive ? '#F2D39A' : '#D1B981'}
            />
          </TouchableOpacity>
          <Text style={styles.headerAa}>Aa</Text>
          <Ionicons name="ellipsis-vertical" size={22} color="#D1B981" style={styles.headerIcon} />
        </View>
      </View>

      <Animated.View style={[styles.deskArea, { transform: [{ scale: entryScale }, { translateX: entryShift }] }]}> 
        <View style={styles.bookShadowContainer}>
          <View style={styles.innerPageLayout}>
            <View style={styles.hardcoverBacking} />

            <FlatList
              ref={listRef}
              data={spreads}
              keyExtractor={(item) => item.id}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(event) => {
                const offsetX = event.nativeEvent.contentOffset.x;
                const index = Math.round(offsetX / BOOK_WIDTH);
                setCurrentPageIndex(clamp(index, 0, Math.max(0, spreads.length - 1)));
              }}
              getItemLayout={(_, index) => ({ length: BOOK_WIDTH, offset: BOOK_WIDTH * index, index })}
              initialNumToRender={2}
              maxToRenderPerBatch={3}
              windowSize={5}
              removeClippedSubviews
              renderItem={({ item }) => (
                <View style={styles.spreadContainer}>
                  <BookPage
                    page={item.left}
                    totalPages={pages.length}
                    chapterTitle={chapterTitle}
                    isLeft
                    isLastRead={item.left?.pageNumber === lastReadPageIndex + 1}
                    nightMode={nightMode}
                    onPrev={() => goToPage(currentPageIndex - 1)}
                    onNext={() => goToPage(currentPageIndex + 1)}
                  />

                  <View style={styles.centerSpine}>
                    <LinearGradient
                      colors={['rgba(30,15,5,0.65)', 'rgba(30,15,5,0.12)', 'rgba(30,15,5,0.65)']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={StyleSheet.absoluteFillObject}
                    />
                  </View>

                  <BookPage
                    page={item.right}
                    totalPages={pages.length}
                    chapterTitle={chapterTitle}
                    isLeft={false}
                    isLastRead={item.right?.pageNumber === lastReadPageIndex + 1}
                    nightMode={nightMode}
                    onPrev={() => goToPage(currentPageIndex - 1)}
                    onNext={() => goToPage(currentPageIndex + 1)}
                  />
                </View>
              )}
            />
          </View>

          <Animated.View
            pointerEvents="none"
            style={[styles.coverPivotWrapper, { transform: [{ perspective: 1500 }, { rotateY: coverRotateY }] }]}
          >
            <Animated.View style={[styles.frontCover, { opacity: coverOpacity }]}> 
              <LinearGradient
                colors={['#4B1C10', '#6A2A1A', '#2D0F08']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />

              <ImageBackground
                source={{ uri: 'https://www.transparenttextures.com/patterns/leather.png' }}
                style={StyleSheet.absoluteFillObject}
                imageStyle={{ opacity: 0.4 }}
              />

              <View style={styles.coverGoldBorder}>
                <View style={styles.coverGoldInnerBorder}>
                  <Text style={styles.coverSubtitle}>SHRIMAD</Text>
                  <ImageBackground
                    source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/0/05/Ashoka_Chakra.svg' }}
                    style={styles.coverEmblem}
                    tintColor="#E7D1A2"
                  />
                  <Animated.Text style={[styles.coverTitle, { transform: [{ scale: titlePulse }] }]}> 
                    BHAGAVAD{`\n`}GITA
                  </Animated.Text>
                </View>
              </View>
            </Animated.View>
          </Animated.View>
        </View>
      </Animated.View>

      <View style={styles.bottomFooterRow}>
        <TouchableOpacity style={styles.rowBtn} onPress={() => setShowContents(true)}>
          <Ionicons name="list" size={22} color="#D1B981" />
          <Text style={styles.footerTextRight}>Contents</Text>
        </TouchableOpacity>

        <View style={styles.footerCenter}>
          <Text style={styles.progressTextTop}>You are on page {Math.min(currentPageIndex + 1, Math.max(1, pages.length))}</Text>

          <View
            style={styles.progressSliderTrack}
            onLayout={(event) => setProgressTrackWidth(event.nativeEvent.layout.width)}
            onStartShouldSetResponder={() => true}
            onMoveShouldSetResponder={() => true}
            onResponderGrant={(event) => onProgressTouch(event.nativeEvent.locationX)}
            onResponderMove={(event) => onProgressTouch(event.nativeEvent.locationX)}
          >
            <View style={[styles.progressSliderFill, { width: `${progressRatio * 100}%` }]} />
            <View
              style={[
                styles.progressThumb,
                {
                  left: `${progressRatio * 100}%`,
                  transform: [{ translateX: -7 }],
                },
              ]}
            />
          </View>

          <Text style={styles.progressTextBottom}>
            {Math.min(currentPageIndex + 1, Math.max(1, pages.length))} / {Math.max(1, pages.length)}
          </Text>
        </View>

        <TouchableOpacity style={styles.rowBtn} onPress={() => setNightMode((prev) => !prev)}>
          <Ionicons name={nightMode ? 'sunny-outline' : 'moon-outline'} size={22} color="#D1B981" />
          <Text style={styles.footerTextRight}>{nightMode ? 'Day Mode' : 'Night Mode'}</Text>
        </TouchableOpacity>
      </View>

      <View pointerEvents="none" style={styles.measureLayer}>
        {verses.map((verse, idx) => {
          const id = `${verse.chapter}-${verse.verse}-${idx}`;
          return <MeasureVerseBlock key={id} verse={verse} id={id} onMeasure={(k, h) => setHeights((prev) => (prev[k] === h ? prev : { ...prev, [k]: h }))} />;
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  stateContainer: {
    flex: 1,
    backgroundColor: '#120904',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stateText: {
    marginTop: 20,
    color: '#E7D1A2',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  errorText: {
    color: '#ff9b9b',
    fontSize: 16,
    paddingHorizontal: 24,
    textAlign: 'center',
  },
  topHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: 'rgba(20, 10, 5, 0.45)',
  },
  rowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowTitle: {
    color: '#D1B981',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  headerCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  headerChapterSanskrit: {
    color: '#D1B981',
    fontSize: 15,
    fontWeight: '700',
  },
  headerChapterEnglish: {
    color: '#B89B6E',
    fontSize: 13,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    marginLeft: 16,
  },
  headerIconBtn: {
    marginLeft: 16,
  },
  headerAa: {
    color: '#D1B981',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 16,
  },
  deskArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  bookShadowContainer: {
    width: BOOK_WIDTH,
    height: BOOK_HEIGHT,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.88,
    shadowRadius: 24,
    elevation: 35,
  },
  innerPageLayout: {
    position: 'absolute',
    width: BOOK_WIDTH,
    height: BOOK_HEIGHT,
    left: -PAGE_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  hardcoverBacking: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: '#4B1C10',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2D0F08',
  },
  spreadContainer: {
    width: BOOK_WIDTH,
    height: BOOK_HEIGHT,
    flexDirection: 'row',
    padding: 6,
    justifyContent: 'center',
  },
  centerSpine: {
    width: 32,
    height: '100%',
    position: 'absolute',
    left: PAGE_WIDTH - 16,
    zIndex: 20,
  },
  pageCard: {
    width: PAGE_WIDTH - 6,
    height: '100%',
    position: 'relative',
  },
  pageLeftEdges: {
    borderLeftWidth: 4,
    borderTopWidth: 2,
    borderBottomWidth: 4,
    borderTopLeftRadius: 5,
    borderBottomLeftRadius: 5,
  },
  pageRightEdges: {
    borderRightWidth: 4,
    borderTopWidth: 2,
    borderBottomWidth: 4,
    borderTopRightRadius: 5,
    borderBottomRightRadius: 5,
  },
  pageInnerFrame: {
    margin: 8,
    borderWidth: 1,
    borderRadius: 2,
    flex: 1,
    paddingVertical: PAGE_INNER_VERTICAL_PADDING,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 8,
  },
  pageHeader: {
    height: PAGE_HEADER_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(118, 89, 49, 0.38)',
    marginBottom: 10,
  },
  pageHeaderTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  pageHeaderSub: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: '600',
  },
  pageBody: {
    height: PAGE_BODY_MAX_HEIGHT,
    justifyContent: 'flex-start',
    gap: PAGE_BODY_GAP,
  },
  verseBlock: {
    width: '100%',
  },
  verseNumber: {
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
    paddingHorizontal: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#A48B5D',
  },
  sanskritText: {
    textAlign: 'center',
    fontSize: windowWidth < 400 ? 14 : 17,
    lineHeight: windowWidth < 400 ? 24 : 28,
    fontWeight: '700',
  },
  transliterationText: {
    marginTop: 8,
    textAlign: 'center',
    fontSize: windowWidth < 400 ? 12 : 13,
    lineHeight: windowWidth < 400 ? 19 : 21,
    fontStyle: 'italic',
    fontWeight: '500',
  },
  translationText: {
    marginTop: 10,
    textAlign: 'center',
    fontSize: windowWidth < 400 ? 12 : 14,
    lineHeight: windowWidth < 400 ? 19 : 22,
    fontWeight: '500',
  },
  pageFooter: {
    height: PAGE_FOOTER_HEIGHT,
    justifyContent: 'center',
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(118, 89, 49, 0.38)',
    paddingTop: 8,
  },
  pageFooterText: {
    textAlign: 'center',
    fontSize: 11,
    marginBottom: 6,
    fontWeight: '600',
  },
  pageProgressTrack: {
    width: '100%',
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
  },
  pageProgressFill: {
    height: '100%',
  },
  lastReadBadge: {
    fontSize: 10,
    marginTop: 6,
    textAlign: 'center',
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  lastReadSpacer: {
    height: 18,
  },
  sideTab: {
    position: 'absolute',
    top: '40%',
    width: 25,
    height: 102,
    backgroundColor: '#D1B57F',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 90,
  },
  sideTabLeft: {
    left: -25,
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    borderLeftWidth: 1,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#A48B5D',
  },
  sideTabRight: {
    right: -25,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    borderRightWidth: 1,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#A48B5D',
  },
  tabTextWrapperLeft: {
    transform: [{ rotate: '-90deg' }],
    width: 100,
    alignItems: 'center',
  },
  tabTextWrapperRight: {
    transform: [{ rotate: '90deg' }],
    width: 100,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 10,
    color: '#4B3519',
    letterSpacing: 1.4,
    fontWeight: '700',
  },
  coverPivotWrapper: {
    position: 'absolute',
    width: PAGE_WIDTH * 2,
    height: BOOK_HEIGHT,
    left: -PAGE_WIDTH,
    alignItems: 'flex-end',
    overflow: 'visible',
    zIndex: 100,
  },
  frontCover: {
    width: PAGE_WIDTH,
    height: BOOK_HEIGHT,
    borderTopRightRadius: 7,
    borderBottomRightRadius: 7,
    borderTopLeftRadius: 2,
    borderBottomLeftRadius: 2,
    overflow: 'hidden',
    elevation: 7,
  },
  coverGoldBorder: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#D1B981',
    margin: 12,
    borderRadius: 4,
    padding: 3,
  },
  coverGoldInnerBorder: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1B981',
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  coverSubtitle: {
    color: '#D1B981',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 5,
  },
  coverEmblem: {
    width: 72,
    height: 72,
    opacity: 0.9,
    marginVertical: 40,
  },
  coverTitle: {
    color: '#E7D1A2',
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 3,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 8,
    textAlign: 'center',
    lineHeight: 36,
  },
  bottomFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: 'rgba(20, 10, 5, 0.45)',
  },
  footerTextRight: {
    color: '#D1B981',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  footerCenter: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 24,
  },
  progressTextTop: {
    color: '#D1B981',
    fontSize: 10,
    marginBottom: 6,
  },
  progressSliderTrack: {
    width: '100%',
    height: 4,
    borderRadius: 3,
    backgroundColor: '#3D2A17',
    position: 'relative',
    justifyContent: 'center',
  },
  progressSliderFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: 4,
    borderRadius: 3,
    backgroundColor: '#D1B981',
  },
  progressThumb: {
    position: 'absolute',
    top: -5,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#E7D1A2',
    borderWidth: 1,
    borderColor: '#8E6E3D',
  },
  progressTextBottom: {
    color: '#D1B981',
    fontSize: 10,
    marginTop: 6,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  contentsCard: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '75%',
    backgroundColor: '#2F190F',
    borderWidth: 1,
    borderColor: '#8B6841',
    borderRadius: 12,
    paddingVertical: 10,
  },
  contentsTitle: {
    color: '#E6CAA0',
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  contentsRow: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  contentsRowSelected: {
    backgroundColor: '#5E3A21',
  },
  contentsText: {
    color: '#E9D2AE',
    fontSize: 14,
    fontWeight: '500',
  },
  contentsTextSelected: {
    color: '#FFE1B1',
    fontWeight: '700',
  },
  measureLayer: {
    position: 'absolute',
    left: -9999,
    top: -9999,
    width: PAGE_WIDTH - 6 - 16 * 2 - 8 * 2,
    opacity: 0,
  },
  measureVerseBlock: {
    width: '100%',
    marginBottom: PAGE_BODY_GAP,
  },
});
