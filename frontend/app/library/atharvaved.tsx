import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import BookLayout, { BookVerse, PageItem, SpreadItem, useBookLayout } from '../../src/components/BookLayout';
import { loadAtharvavedChapter } from '../../src/services/atharvaved-service';

const atharvavedCover = require('../../assets/images/Atharva veda .jpg');

type VerseItem = BookVerse;
type PendingOpenChapter = { chapter: number; edge: 'start' | 'end' };

const CHAPTER_TITLES = Array.from({ length: 20 }, (_, index) => `Kaanda ${index + 1}`);

const STORAGE_LAST_READ_KEY = (chapter: number) => `atharvaved:last-read:kaanda:${chapter}`;
const STORAGE_BOOKMARK_KEY = (chapter: number) => `atharvaved:bookmark:kaanda:${chapter}`;
const TOTAL_CHAPTERS = CHAPTER_TITLES.length;

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const estimateVerseHeight = (verse: VerseItem, layout: ReturnType<typeof useBookLayout>) => {
  const typeLabel = verse.type || '';
  const pageContentWidth = layout.pageWidth - layout.pageBodyHorizontalPadding * 2 - 12;
  const charW = layout.sanskritTextSize * 0.55;
  const linesText = Math.max(1, Math.ceil((verse.text?.length || 0) / Math.max(1, pageContentWidth / charW)));
  const linesType = typeLabel ? Math.max(1, Math.ceil(typeLabel.length / Math.max(1, pageContentWidth / charW))) : 0;
  const totalLines = 1 + linesText + linesType;
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

function renderVerseBlock(verse: VerseItem, nightMode: boolean, layout: ReturnType<typeof useBookLayout>) {
  const typeLabel = verse.type || '';
  return (
    <>
      <View style={styles.verseBlock}>
        <Text style={[styles.verseNumber, { color: nightMode ? '#D2B07A' : '#8A6A40', fontSize: Math.max(9, layout.sanskritTextSize - 3) }]}> {verse.chapter}.{verse.verse}</Text>
        <View style={[styles.dividerContainer, { marginVertical: 4 }]}> 
          <View style={[styles.dividerLine, { backgroundColor: nightMode ? '#8f7751' : '#A48B5D' }]} />
          <Ionicons name="diamond" size={4} color={nightMode ? '#8f7751' : '#A48B5D'} style={{ marginHorizontal: 4 }} />
          <View style={[styles.dividerLine, { backgroundColor: nightMode ? '#8f7751' : '#A48B5D' }]} />
        </View>
        <Text style={[styles.sanskritText, { color: nightMode ? '#F3DEC0' : '#2A1A0B', fontSize: layout.sanskritTextSize, lineHeight: layout.sanskritLineHeight }]}>{verse.text}</Text>
        {!!typeLabel && (
          <Text style={[styles.translationText, { color: nightMode ? '#E6D4B7' : '#3C2A15', fontSize: layout.translationSize, lineHeight: layout.translationLineHeight, marginTop: 6 }]}> 
            {typeLabel}
          </Text>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  verseBlock: { width: '100%' },
  verseNumber: { textAlign: 'center', fontWeight: 'bold', marginBottom: 0 },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#A48B5D', opacity: 0.5 },
  sanskritText: { textAlign: 'center', fontWeight: '700', fontFamily: 'serif' },
  translationText: { textAlign: 'center', fontWeight: '500', fontFamily: 'serif' },
});

export default function AtharvavedReaderScreen() {
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

  const initialChapterLoadStartedRef = useRef(false);
  const initializedReaderChapterRef = useRef<number | null>(null);

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
      const incoming = await loadAtharvavedChapter(safeChapterNumber);
      setChapters((prev) => ({ ...prev, [safeChapterNumber]: incoming }));
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : `Failed to load Kaanda ${safeChapterNumber}`);
    } finally {
      setChapterLoading((prev) => {
        const next = { ...prev };
        delete next[safeChapterNumber];
        return next;
      });
    }
  }, [chapters, chapterLoading]);

  useEffect(() => {
    if (initialChapterLoadStartedRef.current) return;
    initialChapterLoadStartedRef.current = true;
    let mounted = true;
    const run = async () => {
      setLoading(true);
      setError(null);
      setHeights({});
      setSpreadIndex(0);
      try {
        await loadChapter(1);
      } catch {
        // handled by loadChapter
      } finally {
        if (mounted) setLoading(false);
      }
    };
    run();
    return () => { mounted = false; };
  }, [loadChapter]);

  useEffect(() => {
    if (!loading) return;
    if (chapters[1]?.length) {
      setLoading(false);
      return;
    }
    const timeout = setTimeout(() => {
      if (!chapters[1]?.length) {
        setError('Kaanda 1 is taking too long to load. Please check the connection and try again.');
        setLoading(false);
      }
    }, 15000);
    return () => clearTimeout(timeout);
  }, [loading, chapters]);

  const retryInitialLoad = useCallback(() => {
    setError(null);
    setLoading(true);
    setChapterLoading((prev) => {
      const next = { ...prev };
      delete next[1];
      return next;
    });
    void loadChapter(1);
  }, [loadChapter]);

  const loadedChapters = useMemo(() => Object.keys(chapters).map(Number).sort((a, b) => a - b), [chapters]);

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
        return;
      }

      const initialSpread = bookmarkIndex !== null ? base + bookmarkIndex : base + lastReadIndex;
      initializedReaderChapterRef.current = chapterNum;
      setSpreadIndex(initialSpread);
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
      setSpreadIndex(openSpread);
      setPendingOpenChapter(null);
    }
  }, [pendingOpenChapter, chapterPages, chapterStartSpreads, spreads.length]);

  const bookmarkActive = bookmarkSpread === spreadIndex;
  const directChapterLoading = pendingOpenChapter !== null && !!chapterLoading[pendingOpenChapter.chapter];
  const loadingChapterLabel = pendingOpenChapter?.chapter ? `Loading Kaanda ${pendingOpenChapter.chapter}` : 'Loading Kaanda 1';

  const goToPage = useCallback((index: number) => {
    const maxIndex = Math.max(0, spreads.length - 1);
    const target = clamp(index, 0, maxIndex);
    setSpreadIndex(target);
  }, [spreads.length]);

  const onToggleBookmark = useCallback(async () => {
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
  }, [bookmarkSpread, chapterPages, chapterStartSpreads, currentPageChapter, spreadIndex]);

  return (
    <BookLayout
      title="Atharvaved"
      chapterTitle={CHAPTER_TITLES[currentPageChapter - 1] || 'Atharvaved'}
      chapterTitles={CHAPTER_TITLES}
      pageCount={pages.length}
      currentPageChapter={currentPageChapter}
      chapterPages={chapterPages}
      chapterStartSpreads={chapterStartSpreads}
      spreads={spreads}
      spreadIndex={spreadIndex}
      currentSpread={currentSpread}
      prevSpread={prevSpread}
      nextSpread={nextSpread}
      lastReadSpread={lastReadSpread}
      bookmarkSpread={bookmarkSpread}
      bookmarkActive={bookmarkActive}
      chapterLoading={chapterLoading}
      loading={loading}
      error={error}
      loadingChapterLabel={loadingChapterLabel}
      directChapterLoading={directChapterLoading}
      onBack={() => router.back()}
      onToggleBookmark={onToggleBookmark}
      onRetry={retryInitialLoad}
      onChangeSpread={goToPage}
      onLoadChapter={loadChapter}
      renderVerseBlock={renderVerseBlock}
      measureVerses={loadedChapters.flatMap((chapter) => chapters[chapter] ?? [])}
      onMeasureVerse={(id, height) => setHeights((prev) => (prev[id] === height ? prev : { ...prev, [id]: height }))}
      cover={{ title: 'ATHARVAVED', subtitle: 'आथर्ववेद', imageSource: atharvavedCover }}
    />
  );
}
