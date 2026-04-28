import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  useWindowDimensions,
  Animated,
  ImageBackground,
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { loadBhagavadGitaChapter, getPreferredTranslation } from '../../src/services/bhagavad-geeta-service';

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

type PendingOpenChapter = {
  chapter: number;
  edge: 'start' | 'end';
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

const STORAGE_LAST_READ_KEY = (chapter: number) => `gita:last-read:chapter:${chapter}`;
const STORAGE_BOOKMARK_KEY = (chapter: number) => `gita:bookmark:chapter:${chapter}`;
const TOTAL_CHAPTERS = CHAPTER_TITLES.length;

export function useBookLayout() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const safeTop = Math.max(insets.top, 16);
  const safeBottom = Math.max(insets.bottom, 16);
  const reservedControls = 80; 
  
  const availableWidth = Math.max(280, width * 0.96);
  const availableHeight = Math.max(240, height - safeTop - safeBottom - reservedControls);

  const bookAspect = 1.35; 
  const spineWidth = 6; 

  const maxBookWidth = availableWidth;
  const maxBookHeight = availableHeight;

  let bookWidth = Math.min(maxBookWidth, maxBookHeight * bookAspect);
  let bookHeight = bookWidth / bookAspect;

  if (bookHeight > maxBookHeight) {
    bookHeight = maxBookHeight;
    bookWidth = bookHeight * bookAspect;
  }

  const pageWidth = Math.max(120, (bookWidth - spineWidth) / 2);
  const fullBookWidth = pageWidth * 2 + spineWidth; // Precision wrapper width
  
  const pageHeaderHeight = Math.max(22, bookHeight * 0.04);
  const pageFooterHeight = Math.max(14, bookHeight * 0.025);
  const pageInnerVerticalPadding = 4;
  const pageBodyGap = 4; 
  const pageBodyHorizontalPadding = 6;

  const pageBodyMaxHeight = Math.max(
    150,
    bookHeight - pageHeaderHeight - pageFooterHeight - pageInnerVerticalPadding * 2 - 4
  );

  const textScale = Math.min(pageWidth / 180, bookHeight / 320, 1.1);
  const sanskritTextSize = clamp(Math.round(13 * textScale), 11, 16);
  const sanskritLineHeight = Math.round(sanskritTextSize * 1.4);
  const transliterationSize = clamp(Math.round(11 * textScale), 9, 14);
  const transliterationLineHeight = Math.round(transliterationSize * 1.35);
  const translationSize = clamp(Math.round(11 * textScale), 9, 14);
  const translationLineHeight = Math.round(translationSize * 1.4);
  const verseBase = 24 * textScale;

  return {
    bookWidth,
    fullBookWidth,
    bookHeight,
    pageWidth,
    spineWidth,
    pageHeaderHeight,
    pageFooterHeight,
    pageInnerVerticalPadding,
    pageBodyGap,
    pageBodyHorizontalPadding,
    pageBodyMaxHeight,
    sanskritTextSize,
    sanskritLineHeight,
    transliterationSize,
    transliterationLineHeight,
    translationSize,
    translationLineHeight,
    verseBase,
    lineHeight: sanskritLineHeight,
  };
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const estimateVerseHeight = (verse: VerseItem, layout: ReturnType<typeof useBookLayout>) => {
  const translation = getPreferredTranslation(verse.translations);
  const transliteration = typeof verse.transliteration === 'string' ? verse.transliteration : '';
  const pageContentWidth = layout.pageWidth - layout.pageBodyHorizontalPadding * 2 - 12;
  const charW = layout.sanskritTextSize * 0.55;
  const linesText = Math.max(1, Math.ceil((verse.text?.length || 0) / Math.max(1, pageContentWidth / charW)));
  const linesTrans = transliteration ? Math.max(1, Math.ceil(transliteration.length / Math.max(1, pageContentWidth / charW))) : 0;
  const linesTranslation = translation ? Math.max(1, Math.ceil(translation.length / Math.max(1, pageContentWidth / charW))) : 0;
  const totalLines = 1 + linesText + linesTrans + linesTranslation;
  return (layout.verseBase + totalLines * layout.sanskritLineHeight) * 1.25; 
};

const buildPages = (verses: VerseItem[], heights: Record<string, number>, layout: ReturnType<typeof useBookLayout>) => {
  const pages: PageItem[] = [];
  let currentPageVerses: VerseItem[] = [];
  let currentHeight = 0;
  let pageNumber = 1;

  const pushPage = () => {
    if (currentPageVerses.length === 0) return;
    pages.push({
      id: `page-${pageNumber}`,
      chapter: currentPageVerses[0].chapter,
      pageNumber,
      verseStart: currentPageVerses[0].verse,
      verseEnd: currentPageVerses[currentPageVerses.length - 1].verse,
      verses: currentPageVerses,
    });
    pageNumber += 1;
    currentPageVerses = [];
    currentHeight = 0;
  };

  verses.forEach((verse, idx) => {
    const id = `${verse.chapter}-${verse.verse}-${idx}`;
    const verseHeight = heights[id] ?? estimateVerseHeight(verse, layout);
    const nextHeight = currentPageVerses.length > 0 ? currentHeight + layout.pageBodyGap + verseHeight : verseHeight;
    if (nextHeight > layout.pageBodyMaxHeight && currentPageVerses.length > 0) pushPage();
    void id;
    currentPageVerses.push(verse);
    currentHeight = currentPageVerses.length > 1 ? currentHeight + layout.pageBodyGap + verseHeight : verseHeight;
  });
  pushPage();
  return pages;
};

function VerseBlock({ verse, nightMode, layout }: { verse: VerseItem; nightMode: boolean; layout: ReturnType<typeof useBookLayout> }) {
  const translation = getPreferredTranslation(verse.translations);
  const transliteration = typeof verse.transliteration === 'string' ? verse.transliteration : '';
  return (
    <View style={styles.verseBlock}>
      <Text style={[styles.verseNumber, { color: nightMode ? '#D2B07A' : '#8A6A40', fontSize: Math.max(9, layout.sanskritTextSize - 3) }]}>
        {verse.chapter}.{verse.verse}
      </Text>
      <View style={[styles.dividerContainer, { marginVertical: 4 }]}>
        <View style={[styles.dividerLine, { backgroundColor: nightMode ? '#8f7751' : '#A48B5D' }]} />
        <Ionicons name="diamond" size={4} color={nightMode ? '#8f7751' : '#A48B5D'} style={{ marginHorizontal: 4 }} />
        <View style={[styles.dividerLine, { backgroundColor: nightMode ? '#8f7751' : '#A48B5D' }]} />
      </View>
      <Text style={[styles.sanskritText, { color: nightMode ? '#F3DEC0' : '#2A1A0B', fontSize: layout.sanskritTextSize, lineHeight: layout.sanskritLineHeight }]}>
        {verse.text}
      </Text>
      {transliteration ? (
        <Text style={[styles.transliterationText, { color: nightMode ? '#D8C7A8' : '#5B4729', fontSize: layout.transliterationSize, lineHeight: layout.transliterationLineHeight, marginTop: 4 }]}>
          {transliteration}
        </Text>
      ) : null}
      {!!translation && (
        <Text style={[styles.translationText, { color: nightMode ? '#E6D4B7' : '#3C2A15', fontSize: layout.translationSize, lineHeight: layout.translationLineHeight, marginTop: 6 }]}>
          {translation}
        </Text>
      )}
    </View>
  );
}

function MeasureVerseBlock({ layout, verse, id, onMeasure }: { verse: VerseItem; id: string; layout: ReturnType<typeof useBookLayout>; onMeasure: (id: string, h: number) => void }) {
  const translation = getPreferredTranslation(verse.translations);
  const transliteration = typeof verse.transliteration === 'string' ? verse.transliteration : '';
  return (
    <View style={[styles.measureVerseBlock, { marginBottom: layout.pageBodyGap }]} onLayout={(e) => onMeasure(id, Math.ceil(e.nativeEvent.layout.height))}>
      <Text style={[styles.verseNumber, { fontSize: Math.max(9, layout.sanskritTextSize - 3) }]}>{verse.chapter}.{verse.verse}</Text>
      <View style={[styles.dividerContainer, { marginVertical: 4 }]}><View style={styles.dividerLine} /><Ionicons name="diamond" size={4} color="#A48B5D" style={{ marginHorizontal: 4 }} /><View style={styles.dividerLine} /></View>
      <Text style={[styles.sanskritText, { fontSize: layout.sanskritTextSize, lineHeight: layout.sanskritLineHeight }]}>{verse.text}</Text>
      {transliteration ? <Text style={[styles.transliterationText, { fontSize: layout.transliterationSize, lineHeight: layout.transliterationLineHeight, marginTop: 4 }]}>{transliteration}</Text> : null}
      {!!translation && <Text style={[styles.translationText, { fontSize: layout.translationSize, lineHeight: layout.translationLineHeight, marginTop: 6 }]}>{translation}</Text>}
    </View>
  );
}

function BookPage({ layout, page, totalPages, chapterTitle, isLeft, isLastRead, nightMode, onPrev, onNext, hideTabs }: {
  page: PageItem | null; totalPages: number; chapterTitle: string; isLeft: boolean; isLastRead: boolean; nightMode: boolean; layout: ReturnType<typeof useBookLayout>; onPrev: () => void; onNext: () => void; hideTabs?: boolean;
}) {
  const pageBg = nightMode ? '#3C2E1F' : '#EAD5B2';
  const pageEdge = nightMode ? '#5C472E' : '#D1B588';
  const headerFontSize = Math.max(7, layout.sanskritTextSize - 4);
  const pageChapterTitle = page ? CHAPTER_TITLES[page.chapter - 1] || chapterTitle : chapterTitle;
  
  return (
    <View style={[styles.pageCard, isLeft ? styles.pageLeftEdges : styles.pageRightEdges, { width: layout.pageWidth, backgroundColor: pageBg, borderColor: pageEdge }]}>
      <ImageBackground source={{ uri: 'https://www.transparenttextures.com/patterns/rice-paper-2.png' }} style={StyleSheet.absoluteFillObject} imageStyle={{ opacity: nightMode ? 0.05 : 0.12 }} />
      <View style={[styles.pageInnerFrame, { borderColor: nightMode ? 'rgba(125, 102, 68, 0.4)' : 'rgba(185, 150, 97, 0.4)', paddingVertical: layout.pageInnerVerticalPadding, paddingHorizontal: layout.pageBodyHorizontalPadding }]}>
        <View style={[styles.pageHeader, { height: layout.pageHeaderHeight, marginBottom: 2 }]}>
          <Text style={[styles.pageHeaderTitle, { color: nightMode ? '#EBD7B6' : '#5A3E20', fontSize: headerFontSize }]} numberOfLines={1}>
            {page ? `Ch ${page.chapter} – ${pageChapterTitle}` : `Ch 1 – ${chapterTitle}`}
          </Text>
          <Text style={[styles.pageHeaderSub, { color: nightMode ? '#D1B07A' : '#7E5E34', fontSize: Math.max(6, headerFontSize - 1) }]}>
            {page ? `Verse ${page.verseStart}${page.verseStart !== page.verseEnd ? `–${page.verseEnd}` : ''}` : '—'}
          </Text>
        </View>
        <View style={[styles.pageBody, { height: layout.pageBodyMaxHeight, gap: layout.pageBodyGap }]}>
          {page ? page.verses.map((verse) => <VerseBlock key={`${verse.chapter}-${verse.verse}`} verse={verse} nightMode={nightMode} layout={layout} />) : null}
        </View>
        <View style={[styles.pageFooter, { height: layout.pageFooterHeight, marginTop: 2, paddingTop: 2 }]}>
          <Text style={[styles.pageFooterText, { color: nightMode ? '#D8BE98' : '#6D4F2B', fontSize: Math.max(6, headerFontSize - 1) }]}>
            {page ? `${page.pageNumber} / ${totalPages}` : `0 / ${totalPages}`}
          </Text>
          <View style={[styles.pageProgressTrack, { backgroundColor: nightMode ? '#5C472E' : '#DBC297' }]}>
            <View style={[styles.pageProgressFill, { width: `${page ? (page.pageNumber / Math.max(1, totalPages)) * 100 : 0}%`, backgroundColor: nightMode ? '#E0C592' : '#8F6A3B' }]} />
          </View>
          {isLastRead && !isLeft ? <Text style={[styles.lastReadBadge, { color: nightMode ? '#F0D8AA' : '#744A12', fontSize: Math.max(6, headerFontSize - 2) }]}>Last Read</Text> : <View style={styles.lastReadSpacer} />}
        </View>
      </View>
      
      {/* Subtle realistic lighting gradient near the spine */}
      {isLeft ? (
        <LinearGradient colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.08)', 'rgba(0,0,0,0.25)']} start={{ x: 0.8, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
      ) : (
        <LinearGradient colors={['rgba(0,0,0,0.25)', 'rgba(0,0,0,0.08)', 'rgba(0,0,0,0)']} start={{ x: 0, y: 0 }} end={{ x: 0.2, y: 0 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
      )}

      {!hideTabs && (isLeft ? (
        <TouchableOpacity style={[styles.sideTab, styles.sideTabLeft]} onPress={onPrev} activeOpacity={0.85}><View style={styles.tabTextWrapperLeft}><Text style={styles.tabText}>← Prev</Text></View></TouchableOpacity>
      ) : (
        <TouchableOpacity style={[styles.sideTab, styles.sideTabRight]} onPress={onNext} activeOpacity={0.85}><View style={styles.tabTextWrapperRight}><Text style={styles.tabText}>Next →</Text></View></TouchableOpacity>
      ))}
    </View>
  );
}

function LoadingProgress({ progress, label, compact = false }: { progress: number; label: string; compact?: boolean }) {
  const percentage = Math.round(clamp(progress, 0, 100));
  return (
    <View style={compact ? styles.compactLoadContent : styles.loadingContent}>
      <View style={styles.instagramProgressTrack}>
        <LinearGradient
          colors={['#FEDA75', '#FA7E1E', '#D62976', '#962FBF', '#4F5BD5']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.instagramProgressFill, { width: `${percentage}%` }]}
        />
      </View>
      <View style={styles.loadingMetaRow}>
        <Text style={styles.loadingLabel}>{label}</Text>
        <Text style={styles.loadingPercent}>{percentage}%</Text>
      </View>
    </View>
  );
}

export default function BhagvadGeetaReaderScreen() {
  const layout = useBookLayout();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chapterNum, setChapterNum] = useState(1);
  const [chapters, setChapters] = useState<Record<number, VerseItem[]>>({});
  const [chapterLoading, setChapterLoading] = useState<Record<number, boolean>>({});
  const [pendingOpenChapter, setPendingOpenChapter] = useState<PendingOpenChapter | null>(null);
  const [heights, setHeights] = useState<Record<string, number>>({});
  const [spreadIndex, setSpreadIndex] = useState(0);
  const [lastReadSpread, setLastReadSpread] = useState(0);
  const [bookmarkSpread, setBookmarkSpread] = useState<number | null>(null);
  const [showContents, setShowContents] = useState(false);
  const [nightMode, setNightMode] = useState(false);
  const [progressTrackWidth, setProgressTrackWidth] = useState(0);
  const [turnDir, setTurnDir] = useState<'forward' | 'backward' | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(8);

  const coverFlip = useRef(new Animated.Value(0)).current;
  const coverPulse = useRef(new Animated.Value(0)).current;
  const turnAnim = useRef(new Animated.Value(0)).current;

  const isTurningRef = useRef(false);
  const isCoverAnimatingRef = useRef(false);
  const turnProgressRef = useRef(0);
  const spreadIndexRef = useRef(0);
  const spreadsLengthRef = useRef(0);
  const turnDirRef = useRef<'forward' | 'backward' | null>(null); 
  const initialChapterLoadStartedRef = useRef(false);
  const coverAnimationStartedRef = useRef(false);
  const initializedReaderChapterRef = useRef<number | null>(null);

  useEffect(() => { spreadIndexRef.current = spreadIndex; }, [spreadIndex]);

  const loadChapter = useCallback(async (chapterNumber: number, openDirectly: false | 'start' | 'end' = false) => {
    const safeChapterNumber = clamp(chapterNumber, 1, TOTAL_CHAPTERS);
    if (chapterLoading[safeChapterNumber]) return;
    const loadedChapter = chapters[safeChapterNumber];
    if (loadedChapter && loadedChapter.length > 0) {
      if (openDirectly) setPendingOpenChapter({ chapter: safeChapterNumber, edge: openDirectly });
      return;
    }
    setChapterLoading((prev) => ({ ...prev, [safeChapterNumber]: true }));
    if (openDirectly) setPendingOpenChapter({ chapter: safeChapterNumber, edge: openDirectly });
    try {
      const incoming = await loadBhagavadGitaChapter(safeChapterNumber);
      setChapters((prev) => ({ ...prev, [safeChapterNumber]: incoming }));
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : `Failed to load Chapter ${safeChapterNumber}`);
    } finally {
      setChapterLoading((prev) => {
        const next = { ...prev };
        delete next[safeChapterNumber];
        return next;
      });
    }
  }, [chapters, chapterLoading]);

  const loadChapterOnly = useCallback(async (targetChapter: number, edge: 'start' | 'end' = 'start') => {
    await loadChapter(targetChapter, edge);
  }, [loadChapter]);

  useEffect(() => {
    if (initialChapterLoadStartedRef.current) return;
    initialChapterLoadStartedRef.current = true;
    let mounted = true;
    const run = async () => {
      setLoading(true);
      setError(null);
      setHeights({});
      setSpreadIndex(0);
      turnAnim.setValue(0);
      isTurningRef.current = false;
      setTurnDir(null);
      turnProgressRef.current = 0;
      try {
        await loadChapter(1);
      } catch {
        /* error handled in loadChapter */
      } finally {
        if (mounted) setLoading(false);
      }
    };
    run();
    return () => { mounted = false; };
  }, [loadChapter, turnAnim]);

  useEffect(() => {
    if (!loading) return;
    if (chapters[1]?.length) {
      setLoading(false);
      return;
    }

    const timeout = setTimeout(() => {
      if (!chapters[1]?.length) {
        setError('Chapter 1 is taking too long to load. Please check the connection and try again.');
        setLoading(false);
      }
    }, 15000);

    return () => clearTimeout(timeout);
  }, [loading, chapters]);

  const retryInitialLoad = useCallback(() => {
    setError(null);
    setLoading(true);
    setLoadingProgress(8);
    setChapterLoading((prev) => {
      const next = { ...prev };
      delete next[1];
      return next;
    });
    void loadChapter(1);
  }, [loadChapter]);

  useEffect(() => {
    if (loading || !chapters[1]?.length || coverAnimationStartedRef.current) return;
    coverAnimationStartedRef.current = true;
    coverFlip.setValue(0);
    coverPulse.setValue(0);
    isCoverAnimatingRef.current = true;
    const pulseAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(coverPulse, { toValue: 1, duration: 2600, useNativeDriver: true }),
        Animated.timing(coverPulse, { toValue: 0, duration: 2600, useNativeDriver: true }),
      ])
    );
    pulseAnim.start();
    Animated.sequence([
      Animated.delay(1100),
      Animated.timing(coverFlip, { toValue: 1, duration: 2400, useNativeDriver: true }),
    ]).start(() => {
      pulseAnim.stop();
      isCoverAnimatingRef.current = false;
    });
  }, [loading, chapters, coverFlip, coverPulse]);

  const loadedChapters = useMemo(() => Object.keys(chapters).map(Number).sort((a, b) => a - b), [chapters]);
  const verses = useMemo(() => loadedChapters.flatMap((chapter) => chapters[chapter] ?? []), [chapters, loadedChapters]);
  const chapterPages = useMemo(() => {
    const map: Record<number, PageItem[]> = {};
    loadedChapters.forEach((chapter) => {
      const chapterVerses = chapters[chapter] ?? [];
      map[chapter] = chapterVerses.length > 0 ? buildPages(chapterVerses, heights, layout) : [];
    });
    return map;
  }, [chapters, loadedChapters, heights, layout]);
  const pages = useMemo(() => {
    let globalPageNumber = 1;
    return loadedChapters.flatMap((chapter) => (chapterPages[chapter] ?? []).map((page) => ({
      ...page,
      pageNumber: globalPageNumber++,
    })));
  }, [loadedChapters, chapterPages]);
  const chapterStartSpreads = useMemo(() => {
    const map: Record<number, number> = {};
    let offset = 0;
    for (const chapter of loadedChapters) {
      map[chapter] = offset;
      offset += Math.ceil((chapterPages[chapter]?.length ?? 0) / 2);
    }
    return map;
  }, [chapterPages, loadedChapters]);
  const spreads = useMemo<SpreadItem[]>(() => {
    const total = Math.max(1, Math.ceil(pages.length / 2));
    return Array.from({ length: total }).map((_, spreadNumber) => {
      const leftIndex = spreadNumber * 2;
      const rightIndex = leftIndex + 1;
      return {
        id: `spread-${spreadNumber}`,
        left: pages[leftIndex] ?? null,
        right: pages[rightIndex] ?? null,
        rightIndex,
      };
    });
  }, [pages]);

  useEffect(() => { spreadsLengthRef.current = spreads.length; }, [spreads.length]);
  const currentSpread = spreads[spreadIndex] || null;
  const nextSpread = spreadIndex < spreads.length - 1 ? spreads[spreadIndex + 1] : null;
  const prevSpread = spreadIndex > 0 ? spreads[spreadIndex - 1] : null;
  const currentPageChapter = currentSpread?.left?.chapter ?? currentSpread?.right?.chapter ?? chapterNum;

  useEffect(() => {
    let mounted = true;
    const loadReaderState = async () => {
      if (!chapterPages[chapterNum]) return;
      if (pendingOpenChapter?.chapter !== chapterNum && initializedReaderChapterRef.current === chapterNum) return;
      const [bookmarkRaw, lastReadRaw] = await Promise.all([
        AsyncStorage.getItem(STORAGE_BOOKMARK_KEY(chapterNum)),
        AsyncStorage.getItem(STORAGE_LAST_READ_KEY(chapterNum)),
      ]);
      if (!mounted) return;

      const chapterPageCount = Math.max(0, Math.ceil((chapterPages[chapterNum]?.length ?? 0) / 2));
      const maxRelative = Math.max(0, chapterPageCount - 1);
      const bookmarkIndex = Number.isFinite(Number(bookmarkRaw)) ? clamp(Number(bookmarkRaw), 0, maxRelative) : null;
      const lastReadIndex = Number.isFinite(Number(lastReadRaw)) ? clamp(Number(lastReadRaw), 0, maxRelative) : 0;
      const base = chapterStartSpreads[chapterNum] ?? 0;
      if (pendingOpenChapter?.chapter === chapterNum) {
        const targetSpread = pendingOpenChapter.edge === 'end' ? base + maxRelative : base;
        setPendingOpenChapter(null);
        initializedReaderChapterRef.current = chapterNum;
        setSpreadIndex(targetSpread);
        spreadIndexRef.current = targetSpread;
        return;
      }

      const initialSpread = bookmarkIndex !== null ? base + bookmarkIndex : base + lastReadIndex;

      initializedReaderChapterRef.current = chapterNum;
      setSpreadIndex(initialSpread);
      spreadIndexRef.current = initialSpread;
      setLastReadSpread(base + lastReadIndex);
      setBookmarkSpread(bookmarkIndex !== null ? base + bookmarkIndex : null);
    };
    if (pages.length > 0) loadReaderState();
    return () => { mounted = false; };
  }, [chapterNum, pages.length, chapterPages, chapterStartSpreads, pendingOpenChapter]);

  useEffect(() => {
    if (pages.length === 0) return;
    const activeChapter = currentPageChapter;
    const base = chapterStartSpreads[activeChapter] ?? 0;
    const chapterSpreadCount = Math.max(0, Math.ceil((chapterPages[activeChapter]?.length ?? 0) / 2));
    const relativeIndex = clamp(spreadIndex - base, 0, Math.max(0, chapterSpreadCount - 1));
    AsyncStorage.setItem(STORAGE_LAST_READ_KEY(activeChapter), String(relativeIndex));
    setLastReadSpread(spreadIndex);
  }, [spreadIndex, currentPageChapter, chapterPages, chapterStartSpreads, pages.length]);

  const chapterTitle = CHAPTER_TITLES[currentPageChapter - 1] || 'Bhagavad Gita';
  
  // Opacity failsafes ensure perfect rendering regardless of Android backface culling issues
  const frontFaceOpacity = turnAnim.interpolate({ inputRange: [0, 0.5, 0.501, 1], outputRange: [1, 1, 0, 0] });
  const backFaceOpacity = turnAnim.interpolate({ inputRange: [0, 0.499, 0.5, 1], outputRange: [0, 0, 1, 1] });

  const coverRotateY = coverFlip.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-180deg'] });
  const coverOpacity = coverFlip.interpolate({ inputRange: [0, 0.49, 0.5, 1], outputRange: [1, 1, 0, 0] });
  const titlePulse = coverPulse.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1.02] });
  
  const forwardTurnAngle = turnAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-180deg'] });
  const backwardTurnAngle = turnAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const turnMidShadowOpacity = turnAnim.interpolate({ inputRange: [0, 0.18, 0.5, 0.82, 1], outputRange: [0, 0.12, 0.38, 0.16, 0] });
  const turningEdgeOpacity = turnAnim.interpolate({ inputRange: [0, 0.2, 0.5, 0.8, 1], outputRange: [0.1, 0.28, 0.62, 0.28, 0.1] });
  const turningEdgeScaleX = turnAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.8, 2.4, 0.8] });
  const forwardDepthTranslateX = turnAnim.interpolate({ inputRange: [0, 1], outputRange: [layout.pageWidth * 0.18, -layout.pageWidth * 0.18] });
  const backwardDepthTranslateX = turnAnim.interpolate({ inputRange: [0, 1], outputRange: [-layout.pageWidth * 0.18, layout.pageWidth * 0.18] });

  const goToPage = useCallback((index: number) => {
    if (isTurningRef.current || isCoverAnimatingRef.current) return;
    const maxIndex = Math.max(0, spreadsLengthRef.current - 1);
    const target = clamp(index, 0, maxIndex);
    setSpreadIndex(target); spreadIndexRef.current = target;
  }, []);

  const onProgressTouch = useCallback((locationX: number) => {
    if (progressTrackWidth <= 0 || spreads.length <= 1) return;
    const ratio = clamp(locationX / progressTrackWidth, 0, 1);
    goToPage(Math.round(ratio * (spreads.length - 1)));
  }, [progressTrackWidth, spreads.length, goToPage]);

  const panResponder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, gs) => !isTurningRef.current && !isCoverAnimatingRef.current && Math.abs(gs.dx) > 15 && Math.abs(gs.dx) > Math.abs(gs.dy) * 0.6,
    onPanResponderGrant: (_, gs) => {
      if (isTurningRef.current || isCoverAnimatingRef.current) return;
      turnProgressRef.current = 0; 
      turnAnim.setValue(0); 
      turnDirRef.current = null; 
      setTurnDir(null);          
    },
    onPanResponderMove: (_, gs) => { 
      if (isCoverAnimatingRef.current) return; 
      
      if (!turnDirRef.current) {
        if (Math.abs(gs.dx) <= 2) return;
        const dir = gs.dx < 0 ? 'forward' : 'backward';
        if (dir === 'forward' && spreadIndexRef.current >= spreadsLengthRef.current - 1) {
          const nextChapter = Math.min(TOTAL_CHAPTERS, currentPageChapter + 1);
          if (nextChapter > currentPageChapter && !chapterLoading[nextChapter]) void loadChapter(nextChapter, 'start');
          return;
        }
        if (dir === 'backward' && spreadIndexRef.current <= 0) {
          const previousChapter = Math.max(1, currentPageChapter - 1);
          if (previousChapter < currentPageChapter && !chapterLoading[previousChapter]) void loadChapter(previousChapter, 'end');
          return;
        }
        
        isTurningRef.current = true;
        turnDirRef.current = dir;
        setTurnDir(dir);
      }
      
      let p = 0;
      if (turnDirRef.current === 'forward') {
        p = clamp(-gs.dx / (layout.fullBookWidth * 0.45), 0, 1); 
      } else {
        p = clamp(gs.dx / (layout.fullBookWidth * 0.45), 0, 1); 
      }

      turnProgressRef.current = p; 
      turnAnim.setValue(p); 
    },
    onPanResponderRelease: (_, gs) => {
      if (!isTurningRef.current || !turnDirRef.current) { 
        isTurningRef.current = false;
        turnProgressRef.current = 0;
        turnDirRef.current = null;
        setTurnDir(null); 
        turnAnim.setValue(0);
        return; 
      }
      
      const p = turnProgressRef.current; 
      let sc = false;
      
      if (turnDirRef.current === 'forward') {
        sc = p > 0.3 || gs.vx < -0.3; 
      } else {
        sc = p > 0.3 || gs.vx > 0.3;
      }
      
      Animated.timing(turnAnim, { toValue: sc ? 1 : 0, duration: sc ? 650 : 280, useNativeDriver: true }).start(({ finished }) => {
        if (finished && sc) { 
          const n = turnDirRef.current === 'forward' ? spreadIndexRef.current + 1 : spreadIndexRef.current - 1; 
          setSpreadIndex(n); 
          spreadIndexRef.current = n; 
        }
        isTurningRef.current = false; 
        turnProgressRef.current = 0; 
        turnDirRef.current = null;
        setTurnDir(null); 
        turnAnim.setValue(0);
      });
    },
    onPanResponderTerminate: () => { 
      if (!isTurningRef.current) return; 
      Animated.timing(turnAnim, { toValue: 0, duration: 280, useNativeDriver: true }).start(() => { 
        isTurningRef.current = false; 
        turnProgressRef.current = 0; 
        turnDirRef.current = null;
        setTurnDir(null); 
        turnAnim.setValue(0); 
      }); 
    },
  }), [chapterLoading, currentPageChapter, layout.fullBookWidth, loadChapter, turnAnim]); 

  const onToggleBookmark = async () => {
    const activeChapter = currentPageChapter;
    const base = chapterStartSpreads[activeChapter] ?? 0;
    const activeSpreadCount = Math.max(0, Math.ceil((chapterPages[activeChapter]?.length ?? 0) / 2));
    const relativeIndex = clamp(spreadIndex - base, 0, Math.max(0, activeSpreadCount - 1));

    if (bookmarkSpread === spreadIndex) {
      setBookmarkSpread(null);
      await AsyncStorage.removeItem(STORAGE_BOOKMARK_KEY(activeChapter));
    } else {
      setBookmarkSpread(spreadIndex);
      await AsyncStorage.setItem(STORAGE_BOOKMARK_KEY(activeChapter), String(relativeIndex));
    }
  };

  const selectChapter = async (selectedChapter: number) => {
    setChapterNum(selectedChapter);
    setPendingOpenChapter({ chapter: selectedChapter, edge: 'start' });
    if (selectedChapter === 1) {
      goToPage(chapterStartSpreads[1] ?? 0);
      return;
    }
    await loadChapterOnly(selectedChapter, 'start');
    const openSpread = chapterStartSpreads[selectedChapter];
    if (typeof openSpread === 'number' && openSpread < spreads.length) {
      goToPage(openSpread);
      setPendingOpenChapter(null);
    }
  };

  useEffect(() => {
    if (loading || loadedChapters.length === 0) return;
    if (spreadIndex < spreads.length - 2) return;
    const edgeChapter = currentSpread?.right?.chapter ?? currentSpread?.left?.chapter ?? currentPageChapter;
    const nextChapter = edgeChapter + 1;
    if (nextChapter > TOTAL_CHAPTERS || chapters[nextChapter]?.length) return;
    if (chapterLoading[nextChapter]) return;
    void loadChapter(nextChapter, false);
  }, [loading, loadedChapters.length, chapterLoading, chapters, currentPageChapter, currentSpread, spreadIndex, spreads.length, loadChapter]);

  useEffect(() => {
    if (pendingOpenChapter === null || chapterStartSpreads[pendingOpenChapter.chapter] === undefined) return;
    const chapterSpreadCount = Math.max(0, Math.ceil((chapterPages[pendingOpenChapter.chapter]?.length ?? 0) / 2));
    const openSpread = chapterStartSpreads[pendingOpenChapter.chapter] + (pendingOpenChapter.edge === 'end' ? Math.max(0, chapterSpreadCount - 1) : 0);
    if (openSpread < spreads.length) {
      goToPage(openSpread);
      setPendingOpenChapter(null);
    }
  }, [pendingOpenChapter, chapterPages, chapterStartSpreads, spreads.length, goToPage]);

  const bookmarkActive = bookmarkSpread === spreadIndex;
  const progressRatio = spreads.length <= 1 ? 0 : spreadIndex / (spreads.length - 1);
  const currentChapterStartSpread = chapterStartSpreads[currentPageChapter] ?? 0;
  const currentChapterSpreadCount = Math.max(1, Math.ceil((chapterPages[currentPageChapter]?.length ?? 0) / 2));
  const currentChapterEndSpread = currentChapterStartSpread + currentChapterSpreadCount - 1;
  const currentChapterComplete = spreadIndex >= currentChapterEndSpread;
  const readDepthWidth = 4 + progressRatio * 18;
  const unreadDepthWidth = 4 + (1 - progressRatio) * 18;
  const bottomReadWidth = layout.fullBookWidth * clamp(progressRatio, 0, 1);
  const directChapterLoading = pendingOpenChapter !== null && !!chapterLoading[pendingOpenChapter.chapter];
  const activeLoading = loading || directChapterLoading;
  const loadingChapterLabel = pendingOpenChapter?.chapter ? `Loading Chapter ${pendingOpenChapter.chapter}` : 'Loading Chapter 1';
  const spreadLabel = currentSpread?.left && currentSpread?.right
    ? `Pages ${currentSpread.left.pageNumber}-${currentSpread.right.pageNumber}`
    : currentSpread?.left
      ? `Page ${currentSpread.left.pageNumber}`
      : currentSpread?.right
        ? `Page ${currentSpread.right.pageNumber}`
        : 'Page 1';

  useEffect(() => {
    if (!activeLoading) {
      setLoadingProgress(100);
      return;
    }

    setLoadingProgress(8);
    const timer = setInterval(() => {
      setLoadingProgress((current) => {
        if (current >= 94) return current;
        const step = current < 38 ? 9 : current < 72 ? 5 : 2;
        return Math.min(94, current + step);
      });
    }, 180);

    return () => clearInterval(timer);
  }, [activeLoading, loadingChapterLabel]);

  if (loading) return (<View style={styles.stateContainer}><LoadingProgress progress={loadingProgress} label={loadingChapterLabel} /></View>);
  if (error) return (
    <View style={styles.stateContainer}>
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={retryInitialLoad} activeOpacity={0.85}>
        <Text style={styles.retryButtonText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={[styles.outerContainer, { backgroundColor: nightMode ? '#0A0603' : '#140D07' }]} edges={['top', 'bottom']}>
      <Modal visible={showContents} transparent animationType="fade" onRequestClose={() => setShowContents(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setShowContents(false)}>
          <View style={styles.contentsCard} onStartShouldSetResponder={() => true}>
            <View style={styles.contentsHandle} />
            <Text style={styles.contentsTitle}>Contents</Text>
            {CHAPTER_TITLES.map((title, index) => {
              const ch = index + 1;
              const sel = ch === currentPageChapter;
              const locked = ch !== currentPageChapter && !currentChapterComplete;
              return (
                <TouchableOpacity
                  key={`ch-${ch}`}
                  style={[styles.contentsRow, sel && styles.contentsRowSelected, locked && styles.contentsRowLocked]}
                  disabled={locked}
                  onPress={() => { setShowContents(false); void selectChapter(ch); }}
                  activeOpacity={0.82}
                >
                  <Text style={[styles.contentsText, sel && styles.contentsTextSelected, locked && styles.contentsTextLocked]} numberOfLines={1}>
                    {ch}. {title}
                  </Text>
                  {locked ? <Ionicons name="lock-closed" size={14} color="#7D684A" /> : null}
                </TouchableOpacity>
              );
            })}
          </View>
        </Pressable>
      </Modal>

      <View style={styles.topHeaderRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.rowBtn}><Ionicons name="chevron-back" size={24} color="#D1B981" /><Text style={styles.rowTitle}>Bhagavad Gita</Text></TouchableOpacity>
        <View style={styles.headerCenter}><Text style={styles.headerChapterSanskrit}>अध्याय {currentPageChapter}</Text><Text style={styles.headerChapterEnglish}>{chapterTitle}</Text></View>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={onToggleBookmark} style={styles.headerIconBtn}><Ionicons name={bookmarkActive ? 'bookmark' : 'bookmark-outline'} size={24} color={bookmarkActive ? '#F2D39A' : '#D1B981'} /></TouchableOpacity>
        </View>
      </View>

      <View style={styles.deskArea} {...panResponder.panHandlers}>
        <View style={[styles.bookShadowContainer, { width: layout.bookWidth, height: layout.bookHeight }]}>
          {/* Base Book Components */}
          <View style={[styles.hardcoverBacking, { width: layout.bookWidth, height: layout.bookHeight }]} />
          
          <View style={[styles.pageStackRight, { left: layout.pageWidth + layout.spineWidth, width: layout.pageWidth, height: layout.bookHeight - 4, backgroundColor: nightMode ? '#221910' : '#D1BC94', borderColor: nightMode ? '#3D2F1D' : '#9E855C' }]} />
          <View style={[styles.pageStackLeft, { left: -2, width: layout.pageWidth, height: layout.bookHeight - 4, backgroundColor: nightMode ? '#221910' : '#D1BC94', borderColor: nightMode ? '#3D2F1D' : '#9E855C' }]} />
          <View pointerEvents="none" style={[styles.readDepthSpineShade, { left: layout.pageWidth - readDepthWidth, width: readDepthWidth, height: layout.bookHeight }]}>
            <LinearGradient colors={['rgba(255,239,198,0.08)', 'rgba(108,73,35,0.24)', 'rgba(18,9,3,0.38)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFillObject} />
          </View>
          <View pointerEvents="none" style={[styles.unreadDepthOuterShade, { left: layout.pageWidth + layout.spineWidth + layout.pageWidth - unreadDepthWidth, width: unreadDepthWidth, height: layout.bookHeight }]}>
            <LinearGradient colors={['rgba(18,9,3,0.35)', 'rgba(108,73,35,0.18)', 'rgba(255,239,198,0.05)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFillObject} />
          </View>
          <View pointerEvents="none" style={[styles.bottomReadDepthShade, { width: bottomReadWidth }]}>
            <LinearGradient colors={['rgba(245,218,156,0.55)', 'rgba(122,80,36,0.3)', 'rgba(18,9,3,0)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFillObject} />
          </View>

          {/* BASE LAYER - STATIC */}
          {currentSpread && (
            <View style={[StyleSheet.absoluteFill, { zIndex: 1 }]}>
              {/* Left Base Page */}
              <View style={{ position: 'absolute', left: 0, top: 0, width: layout.pageWidth, height: layout.bookHeight }}>
                <BookPage layout={layout} page={turnDir === 'backward' && prevSpread ? prevSpread.left : currentSpread.left} totalPages={pages.length} chapterTitle={chapterTitle} isLeft isLastRead={currentSpread.left?.pageNumber === lastReadSpread + 1} nightMode={nightMode} onPrev={() => goToPage(spreadIndex - 1)} onNext={() => goToPage(spreadIndex + 1)} hideTabs={turnDir !== null} />
                
                {turnDir === 'forward' && (
                   <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: 'black', opacity: turnAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.25] }) }]} />
                )}
                {turnDir === 'backward' && (
                   <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: 'black', opacity: turnAnim.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0] }) }]} />
                )}
              </View>

              {/* Right Base Page */}
              <View style={{ position: 'absolute', left: layout.pageWidth + layout.spineWidth, top: 0, width: layout.pageWidth, height: layout.bookHeight }}>
                <BookPage layout={layout} page={turnDir === 'forward' && nextSpread ? nextSpread.right : currentSpread.right} totalPages={pages.length} chapterTitle={chapterTitle} isLeft={false} isLastRead={currentSpread.right?.pageNumber === lastReadSpread + 1} nightMode={nightMode} onPrev={() => goToPage(spreadIndex - 1)} onNext={() => goToPage(spreadIndex + 1)} hideTabs={turnDir !== null} />
                
                {turnDir === 'forward' && (
                   <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: 'black', opacity: turnAnim.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0] }) }]} />
                )}
                {turnDir === 'backward' && (
                   <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: 'black', opacity: turnAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.25] }) }]} />
                )}
              </View>
            </View>
          )}

          {turnDir === 'forward' && (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.dynamicBookShadow,
                {
                  left: 0,
                  width: layout.fullBookWidth,
                  height: layout.bookHeight,
                  opacity: turnMidShadowOpacity,
                  transform: [{ translateX: forwardDepthTranslateX }],
                },
              ]}
            >
              <LinearGradient
                colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.42)', 'rgba(0,0,0,0.16)', 'rgba(0,0,0,0)']}
                locations={[0, 0.42, 0.56, 1]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFillObject}
              />
            </Animated.View>
          )}

          {turnDir === 'backward' && (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.dynamicBookShadow,
                {
                  left: 0,
                  width: layout.fullBookWidth,
                  height: layout.bookHeight,
                  opacity: turnMidShadowOpacity,
                  transform: [{ translateX: backwardDepthTranslateX }],
                },
              ]}
            >
              <LinearGradient
                colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.16)', 'rgba(0,0,0,0.42)', 'rgba(0,0,0,0)']}
                locations={[0, 0.44, 0.58, 1]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFillObject}
              />
            </Animated.View>
          )}

          {/* ANIMATED LAYER: SWIPE LEFT (Forward Turn - Right Page Flips Left) */}
          {/* DOUBLE WIDTH WRAPPER TO NATURALLY ALIGN PIVOT TO THE SPINE */}
          {turnDir === 'forward' && currentSpread?.right && nextSpread?.left && (
            <Animated.View style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: layout.fullBookWidth, // Wraps entire open book width!
              height: layout.bookHeight,
              zIndex: 10,
              elevation: 10,
              transform: [
                { perspective: 1500 },
                { rotateY: forwardTurnAngle }, // Swings safely from natural center
              ],
            }}>
              {/* Front Face: Current Right Page */}
              <Animated.View style={{
                position: 'absolute',
                left: layout.pageWidth + layout.spineWidth, // Located on right half of wrapper
                top: 0,
                width: layout.pageWidth,
                height: layout.bookHeight,
                backfaceVisibility: 'hidden',
                opacity: frontFaceOpacity,
              }}>
                <BookPage layout={layout} page={currentSpread.right} totalPages={pages.length} chapterTitle={chapterTitle} isLeft={false} isLastRead={false} nightMode={nightMode} onPrev={() => {}} onNext={() => {}} hideTabs />
                <LinearGradient colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.15)']} start={{x: 0, y:0}} end={{x:1, y:0}} style={StyleSheet.absoluteFillObject} />
                <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'black', opacity: turnAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.4] }) }]} />
                <Animated.View pointerEvents="none" style={[styles.turningPageEdge, styles.turningPageEdgeRight, { opacity: turningEdgeOpacity, transform: [{ scaleX: turningEdgeScaleX }] }]}>
                  <LinearGradient colors={['rgba(255,244,216,0)', 'rgba(255,244,216,0.9)', 'rgba(93,61,29,0.35)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFillObject} />
                </Animated.View>
              </Animated.View>

              {/* Back Face: Next Left Page */}
              <Animated.View style={{
                position: 'absolute',
                left: layout.pageWidth + layout.spineWidth, // Same position, but flipped
                top: 0,
                width: layout.pageWidth,
                height: layout.bookHeight,
                backfaceVisibility: 'hidden',
                opacity: backFaceOpacity,
                transform: [{ rotateY: '180deg' }]
              }}>
                <BookPage layout={layout} page={nextSpread.left} totalPages={pages.length} chapterTitle={chapterTitle} isLeft={true} isLastRead={false} nightMode={nightMode} onPrev={() => {}} onNext={() => {}} hideTabs />
                <LinearGradient colors={['rgba(0,0,0,0.15)', 'rgba(0,0,0,0)']} start={{x: 0, y:0}} end={{x:1, y:0}} style={StyleSheet.absoluteFillObject} />
                <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'black', opacity: turnAnim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0] }) }]} />
                <Animated.View pointerEvents="none" style={[styles.turningPageEdge, styles.turningPageEdgeLeft, { opacity: turningEdgeOpacity, transform: [{ scaleX: turningEdgeScaleX }] }]}>
                  <LinearGradient colors={['rgba(93,61,29,0.35)', 'rgba(255,244,216,0.9)', 'rgba(255,244,216,0)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFillObject} />
                </Animated.View>
              </Animated.View>
            </Animated.View>
          )}

          {/* ANIMATED LAYER: SWIPE RIGHT (Backward Turn - Left Page Flips Right) */}
          {/* DOUBLE WIDTH WRAPPER TO NATURALLY ALIGN PIVOT TO THE SPINE */}
          {turnDir === 'backward' && currentSpread?.left && prevSpread?.right && (
            <Animated.View style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: layout.fullBookWidth, // Wraps entire open book width!
              height: layout.bookHeight,
              zIndex: 10,
              elevation: 10,
              transform: [
                { perspective: 1500 },
                { rotateY: backwardTurnAngle }, // Swings safely from natural center
              ],
            }}>
              {/* Front Face: Current Left Page */}
              <Animated.View style={{
                position: 'absolute',
                left: 0, // Located on left half of wrapper
                top: 0,
                width: layout.pageWidth,
                height: layout.bookHeight,
                backfaceVisibility: 'hidden',
                opacity: frontFaceOpacity,
              }}>
                <BookPage layout={layout} page={currentSpread.left} totalPages={pages.length} chapterTitle={chapterTitle} isLeft={true} isLastRead={false} nightMode={nightMode} onPrev={() => {}} onNext={() => {}} hideTabs />
                <LinearGradient colors={['rgba(0,0,0,0.15)', 'rgba(0,0,0,0)']} start={{x: 0, y:0}} end={{x:1, y:0}} style={StyleSheet.absoluteFillObject} />
                <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'black', opacity: turnAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.4] }) }]} />
                <Animated.View pointerEvents="none" style={[styles.turningPageEdge, styles.turningPageEdgeLeft, { opacity: turningEdgeOpacity, transform: [{ scaleX: turningEdgeScaleX }] }]}>
                  <LinearGradient colors={['rgba(93,61,29,0.35)', 'rgba(255,244,216,0.9)', 'rgba(255,244,216,0)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFillObject} />
                </Animated.View>
              </Animated.View>

              {/* Back Face: Prev Right Page */}
              <Animated.View style={{
                position: 'absolute',
                left: 0, // Same position, but flipped
                top: 0,
                width: layout.pageWidth,
                height: layout.bookHeight,
                backfaceVisibility: 'hidden',
                opacity: backFaceOpacity,
                transform: [{ rotateY: '180deg' }]
              }}>
                <BookPage layout={layout} page={prevSpread.right} totalPages={pages.length} chapterTitle={chapterTitle} isLeft={false} isLastRead={false} nightMode={nightMode} onPrev={() => {}} onNext={() => {}} hideTabs />
                <LinearGradient colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.15)']} start={{x: 0, y:0}} end={{x:1, y:0}} style={StyleSheet.absoluteFillObject} />
                <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'black', opacity: turnAnim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0] }) }]} />
                <Animated.View pointerEvents="none" style={[styles.turningPageEdge, styles.turningPageEdgeRight, { opacity: turningEdgeOpacity, transform: [{ scaleX: turningEdgeScaleX }] }]}>
                  <LinearGradient colors={['rgba(255,244,216,0)', 'rgba(255,244,216,0.9)', 'rgba(93,61,29,0.35)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFillObject} />
                </Animated.View>
              </Animated.View>
            </Animated.View>
          )}

          {/* Deep Spine Crease - Renders on top of base pages to hide the seam */}
          <View style={[styles.centerSpine, { left: layout.pageWidth, width: layout.spineWidth, height: layout.bookHeight, zIndex: 15 }]}>
            <LinearGradient colors={['rgba(15,8,3,0.95)', 'rgba(30,15,5,0.25)', 'rgba(15,8,3,0.95)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
          </View>

          {/* Cover Animation Opening (From Right Side) */}
          <Animated.View pointerEvents="none" style={[styles.coverPivotWrapper, { 
            left: 0, 
            width: layout.fullBookWidth, 
            height: layout.bookHeight, 
            zIndex: 100, 
            transform: [
              { perspective: 1500 }, 
              { rotateY: coverRotateY }
            ] 
          }]}>
            <Animated.View style={[styles.frontCover, { 
              position: 'absolute',
              left: layout.pageWidth + layout.spineWidth,
              top: 0,
              width: layout.pageWidth, 
              height: layout.bookHeight, 
              opacity: coverOpacity 
            }]}>
              <LinearGradient colors={['#3A1208', '#542012', '#260B05']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFillObject} />
              <ImageBackground source={{ uri: 'https://www.transparenttextures.com/patterns/leather.png' }} style={StyleSheet.absoluteFillObject} imageStyle={{ opacity: 0.55 }} />
              <View style={styles.coverGoldBorder}>
                <LinearGradient colors={['#FFDCA8', '#C4974F', '#FFDCA8']} style={styles.coverGoldInnerBorder}>
                  <View style={styles.coverInnerDark}>
                    <Text style={styles.coverSubtitle}>SHRIMAD</Text>
                    <ImageBackground source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/0/05/Ashoka_Chakra.svg' }} style={styles.coverEmblem} tintColor="#E7D1A2" />
                    <Animated.Text style={[styles.coverTitle, { transform: [{ scale: titlePulse }] }]}>BHAGAVAD{`\n`}GITA</Animated.Text>
                  </View>
                </LinearGradient>
              </View>
            </Animated.View>
          </Animated.View>
        </View>
      </View>

      <View style={styles.bottomFooterRow}>
        <TouchableOpacity style={styles.rowBtn} onPress={() => setShowContents(true)}><Ionicons name="list" size={22} color="#D1B981" /><Text style={styles.footerTextRight}>Contents</Text></TouchableOpacity>
        <View style={styles.footerCenter}>
          <Text style={styles.progressTextTop}>{spreadLabel}</Text>
          <View style={styles.progressSliderTrack} onLayout={(e) => setProgressTrackWidth(e.nativeEvent.layout.width)} onStartShouldSetResponder={() => true} onMoveShouldSetResponder={() => true} onResponderGrant={(e) => onProgressTouch(e.nativeEvent.locationX)} onResponderMove={(e) => onProgressTouch(e.nativeEvent.locationX)}>
            <View style={[styles.progressSliderFill, { width: `${progressRatio * 100}%` }]} pointerEvents="none" />
            <View style={[styles.progressThumb, { left: `${progressRatio * 100}%`, transform: [{ translateX: -7 }] }]} pointerEvents="none" />
          </View>
        </View>
        <TouchableOpacity style={styles.rowBtn} onPress={() => setNightMode(p => !p)}><Ionicons name={nightMode ? 'sunny-outline' : 'moon-outline'} size={24} color="#D1B981" /></TouchableOpacity>
      </View>

      {directChapterLoading ? (
        <View style={styles.directLoadOverlay} pointerEvents="none">
          <View style={styles.directLoadCard}>
            <LoadingProgress progress={loadingProgress} label={loadingChapterLabel} compact />
          </View>
        </View>
      ) : null}

      <View pointerEvents="none" style={[styles.measureLayer, { width: Math.max(120, layout.pageWidth - layout.pageBodyHorizontalPadding * 2 - 12) }]}>
        {verses.map((verse, idx) => { const id = `${verse.chapter}-${verse.verse}-${idx}`; return (<MeasureVerseBlock key={id} verse={verse} id={id} layout={layout} onMeasure={(k, h) => setHeights(prev => prev[k] === h ? prev : { ...prev, [k]: h })} />); })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  outerContainer: { flex: 1, justifyContent: 'space-between' },
  stateContainer: { flex: 1, backgroundColor: '#140D07', justifyContent: 'center', alignItems: 'center' },
  loadingContent: { width: '72%', maxWidth: 320 },
  compactLoadContent: { width: 220 },
  instagramProgressTrack: { height: 4, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.14)', overflow: 'hidden' },
  instagramProgressFill: { height: '100%', borderRadius: 999 },
  loadingMetaRow: { marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  loadingLabel: { color: '#E7D1A2', fontSize: 12, fontWeight: '700', letterSpacing: 0.6 },
  loadingPercent: { color: '#F2D39A', fontSize: 12, fontWeight: '800' },
  errorText: { color: '#ff9b9b', fontSize: 16, paddingHorizontal: 24, textAlign: 'center' },
  retryButton: { marginTop: 18, paddingHorizontal: 22, paddingVertical: 10, borderRadius: 999, backgroundColor: '#D1B981' },
  retryButtonText: { color: '#241309', fontSize: 14, fontWeight: '800' },
  topHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: 'rgba(15, 8, 4, 0.75)' },
  rowBtn: { flexDirection: 'row', alignItems: 'center' },
  rowTitle: { color: '#D1B981', fontSize: 15, fontWeight: '600', marginLeft: 4 },
  headerCenter: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8, flex: 1 },
  headerChapterSanskrit: { color: '#D1B981', fontSize: 14, fontWeight: '700', fontFamily: 'serif' },
  headerChapterEnglish: { color: '#B89B6E', fontSize: 12, marginTop: 2 },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  headerIconBtn: { marginLeft: 16, padding: 4 },
  deskArea: { flex: 1, alignItems: 'center', justifyContent: 'center', overflow: 'visible' },
  bookShadowContainer: { position: 'relative', shadowColor: '#000', shadowOffset: { width: 0, height: 25 }, shadowOpacity: 0.55, shadowRadius: 30, elevation: 25, alignItems: 'center', justifyContent: 'center' },
  hardcoverBacking: { position: 'absolute', left: 0, top: -2, backgroundColor: '#3A1208', borderRadius: 4, borderWidth: 1, borderColor: '#1F0803', zIndex: 0, bottom: -2 },
  
  pageStackRight: { position: 'absolute', top: 4, borderTopRightRadius: 6, borderBottomRightRadius: 6, borderRightWidth: 3, borderBottomWidth: 4, borderTopWidth: 1, zIndex: 0 },
  pageStackLeft: { position: 'absolute', top: 4, borderTopLeftRadius: 6, borderBottomLeftRadius: 6, borderLeftWidth: 3, borderBottomWidth: 4, borderTopWidth: 1, zIndex: 0 },
  
  readDepthSpineShade: { position: 'absolute', top: 1, zIndex: 2, borderTopRightRadius: 4, borderBottomRightRadius: 4, overflow: 'hidden' },
  unreadDepthOuterShade: { position: 'absolute', top: 1, zIndex: 2, borderTopRightRadius: 7, borderBottomRightRadius: 7, overflow: 'hidden' },
  bottomReadDepthShade: { position: 'absolute', left: 0, bottom: -8, height: 10, zIndex: 3, borderBottomLeftRadius: 8, borderBottomRightRadius: 8, overflow: 'hidden' },
  dynamicBookShadow: { position: 'absolute', top: 0, zIndex: 7 },
  turningPageEdge: { position: 'absolute', top: 0, width: 12, height: '100%', zIndex: 8, overflow: 'hidden' },
  turningPageEdgeLeft: { left: -2 },
  turningPageEdgeRight: { right: -2 },
  centerSpine: { position: 'absolute', top: 0, overflow: 'hidden', backgroundColor: 'transparent' },
  pageCard: { height: '100%', position: 'relative', overflow: 'hidden' },
  pageLeftEdges: { borderTopWidth: 1, borderBottomWidth: 1, borderTopLeftRadius: 4, borderBottomLeftRadius: 4 },
  pageRightEdges: { borderTopWidth: 1, borderBottomWidth: 1, borderTopRightRadius: 4, borderBottomRightRadius: 4 },
  pageInnerFrame: { flex: 1, borderTopWidth: 1, borderBottomWidth: 1 },
  pageHeader: { alignItems: 'center', justifyContent: 'center', borderBottomWidth: 1, borderBottomColor: 'rgba(118, 89, 49, 0.25)', paddingHorizontal: 4 },
  pageHeaderTitle: { fontWeight: '700', fontFamily: 'serif' },
  pageHeaderSub: { marginTop: 1, fontWeight: '600' },
  pageBody: { justifyContent: 'flex-start', overflow: 'hidden' },
  verseBlock: { width: '100%' },
  verseNumber: { textAlign: 'center', fontWeight: 'bold', marginBottom: 0 },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#A48B5D', opacity: 0.5 },
  sanskritText: { textAlign: 'center', fontWeight: '700', fontFamily: 'serif' },
  transliterationText: { textAlign: 'center', fontStyle: 'italic', fontWeight: '500' },
  translationText: { textAlign: 'center', fontWeight: '500', fontFamily: 'serif' },
  pageFooter: { justifyContent: 'center', borderTopWidth: 1, borderTopColor: 'rgba(118, 89, 49, 0.25)' },
  pageFooterText: { textAlign: 'center', marginBottom: 3, fontWeight: '600' },
  pageProgressTrack: { width: '100%', height: 4, borderRadius: 2, overflow: 'hidden' },
  pageProgressFill: { height: '100%' },
  lastReadBadge: { marginTop: 1, textAlign: 'center', fontWeight: 'bold', letterSpacing: 0.5 },
  lastReadSpacer: { height: 8 },
  sideTab: { position: 'absolute', top: '40%', width: 22, height: 90, backgroundColor: '#D1B57F', justifyContent: 'center', alignItems: 'center', zIndex: 90, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 3, elevation: 4 },
  sideTabLeft: { left: -22, borderTopLeftRadius: 8, borderBottomLeftRadius: 8, borderLeftWidth: 1, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#8C744A' },
  sideTabRight: { right: -22, borderTopRightRadius: 8, borderBottomRightRadius: 8, borderRightWidth: 1, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#8C744A' },
  tabTextWrapperLeft: { transform: [{ rotate: '-90deg' }], width: 90, alignItems: 'center' },
  tabTextWrapperRight: { transform: [{ rotate: '90deg' }], width: 90, alignItems: 'center' },
  tabText: { fontSize: 9, color: '#4B3519', letterSpacing: 1.2, fontWeight: 'bold' },
  coverPivotWrapper: { position: 'absolute', top: 0, overflow: 'visible' },
  frontCover: { borderTopRightRadius: 6, borderBottomRightRadius: 6, overflow: 'hidden', elevation: 12, shadowColor: '#000', shadowOffset: { width: -10, height: 10 }, shadowOpacity: 0.5, shadowRadius: 15 },
  coverGoldBorder: { flex: 1, margin: 10, borderRadius: 4, padding: 2 },
  coverGoldInnerBorder: { flex: 1, borderRadius: 2, padding: 2 },
  coverInnerDark: { flex: 1, backgroundColor: 'rgba(20, 5, 0, 0.65)', alignItems: 'center', justifyContent: 'center', paddingVertical: 20 },
  coverSubtitle: { color: '#EAD3A6', fontSize: 18, fontWeight: '900', letterSpacing: 6, fontFamily: 'serif' },
  coverEmblem: { width: 64, height: 64, opacity: 0.85, marginVertical: 36 },
  coverTitle: { color: '#F4E1BA', fontSize: 24, fontWeight: '900', letterSpacing: 3, textShadowColor: 'rgba(0,0,0,0.9)', textShadowOffset: { width: 1, height: 2 }, textShadowRadius: 6, textAlign: 'center', lineHeight: 34, fontFamily: 'serif' },
  bottomFooterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: 'rgba(15, 8, 4, 0.75)' },
  footerTextRight: { color: '#D1B981', fontSize: 13, fontWeight: '600', marginLeft: 8 },
  footerCenter: { alignItems: 'center', flex: 1, paddingHorizontal: 24 },
  progressTextTop: { color: '#B89B6E', fontSize: 10, marginBottom: 6, fontWeight: '600' },
  progressSliderTrack: { width: '100%', height: 4, borderRadius: 3, backgroundColor: '#3D2A17', position: 'relative', justifyContent: 'center' },
  progressSliderFill: { position: 'absolute', left: 0, top: 0, height: 4, borderRadius: 3, backgroundColor: '#D1B981' },
  progressThumb: { position: 'absolute', top: -5, width: 14, height: 14, borderRadius: 7, backgroundColor: '#E7D1A2', borderWidth: 1, borderColor: '#8E6E3D', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.4, shadowRadius: 2, elevation: 3 },
  directLoadOverlay: { position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', zIndex: 20, elevation: 20, backgroundColor: 'rgba(0, 0, 0, 0.18)' },
  directLoadCard: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 14, backgroundColor: 'rgba(20, 14, 10, 0.92)', borderWidth: 1, borderColor: '#8B6E42' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end', alignItems: 'center', paddingHorizontal: 12, paddingBottom: 14 },
  contentsCard: { width: '100%', maxWidth: 420, maxHeight: '68%', backgroundColor: '#21120A', borderWidth: 1, borderColor: '#8B6841', borderTopLeftRadius: 20, borderTopRightRadius: 20, borderBottomLeftRadius: 14, borderBottomRightRadius: 14, paddingTop: 8, paddingBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 15, elevation: 20 },
  contentsHandle: { alignSelf: 'center', width: 42, height: 4, borderRadius: 999, backgroundColor: '#8B6841', opacity: 0.75, marginBottom: 10 },
  contentsTitle: { color: '#E6CAA0', fontSize: 16, fontWeight: '800', textAlign: 'center', marginBottom: 8, fontFamily: 'serif' },
  contentsRow: { minHeight: 44, paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(139, 104, 65, 0.15)', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  contentsRowSelected: { backgroundColor: '#4A2A14' },
  contentsRowLocked: { opacity: 0.52 },
  contentsText: { color: '#D8BE98', fontSize: 15, fontWeight: '500', fontFamily: 'serif' },
  contentsTextSelected: { color: '#FFDFAC', fontWeight: 'bold' },
  contentsTextLocked: { color: '#8D7A5B' },
  measureLayer: { position: 'absolute', left: -9999, top: -9999, opacity: 0 },
  measureVerseBlock: { width: '100%', marginBottom: 12 },
});
