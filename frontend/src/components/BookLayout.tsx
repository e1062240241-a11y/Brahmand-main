import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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

export type BookVerse = {
  chapter: number;
  verse: number;
  text: string;
  type?: string;
  kaand?: string;
  translations?: Record<string, string>;
  transliteration?: string;
};

export type PageItem = {
  id: string;
  chapter: number;
  pageNumber: number;
  verseStart: number;
  verseEnd: number;
  verses: BookVerse[];
};

export type SpreadItem = {
  id: string;
  left: PageItem | null;
  right: PageItem | null;
  rightIndex: number;
};

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
  const fullBookWidth = pageWidth * 2 + spineWidth;

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

function BookPage({
  layout,
  page,
  totalPages,
  chapterTitle,
  isLeft,
  isLastRead,
  nightMode,
  onPrev,
  onNext,
  hideTabs,
  renderVerseBlock,
}: {
  layout: ReturnType<typeof useBookLayout>;
  page: PageItem | null;
  totalPages: number;
  chapterTitle: string;
  isLeft: boolean;
  isLastRead: boolean;
  nightMode: boolean;
  onPrev: () => void;
  onNext: () => void;
  hideTabs?: boolean;
  renderVerseBlock: (verse: BookVerse, nightMode: boolean, layout: ReturnType<typeof useBookLayout>) => React.ReactNode;
}) {
  const pageBg = nightMode ? '#3C2E1F' : '#EAD5B2';
  const pageEdge = nightMode ? '#5C472E' : '#D1B588';
  const headerFontSize = Math.max(7, layout.sanskritTextSize - 4);
  const pageChapterTitle = page ? chapterTitle : chapterTitle;

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
          {page ? page.verses.map((verse) => (
            <View key={`${verse.chapter}-${verse.verse}`} style={styles.verseBlock}>
              {renderVerseBlock(verse, nightMode, layout)}
            </View>
          )) : null}
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

const MemoBookPage = React.memo(BookPage);

function LoadingProgress({ progress, label, compact = false }: { progress: number; label: string; compact?: boolean }) {
  const percentage = Math.round(clamp(progress, 0, 100));
  return (
    <View style={compact ? styles.compactLoadContent : styles.loadingContent}>
      <View style={styles.instagramProgressTrack}>
        <View style={[styles.instagramProgressFill, { width: `${percentage}%` }]} />
      </View>
    </View>
  );
}

export type BookCoverProps = {
  title: string;
  subtitle?: string;
  imageSource?: any;
  textureUri?: string;
};

export type BookLayoutProps = {
  title: string;
  chapterTitle: string;
  chapterTitles: string[];
  pageCount: number;
  currentPageChapter: number;
  chapterPages: Record<number, PageItem[]>;
  chapterStartSpreads: Record<number, number>;
  spreads: SpreadItem[];
  spreadIndex: number;
  currentSpread: SpreadItem | null;
  prevSpread: SpreadItem | null;
  nextSpread: SpreadItem | null;
  lastReadSpread: number;
  bookmarkSpread: number | null;
  bookmarkActive: boolean;
  chapterLoading: Record<number, boolean>;
  loading: boolean;
  error: string | null;
  loadingChapterLabel: string;
  directChapterLoading: boolean;
  onBack: () => void;
  onToggleBookmark: () => void;
  onRetry: () => void;
  onChangeSpread: (index: number) => void;
  onLoadChapter: (chapter: number, openDirectly: false | 'start' | 'end') => Promise<void>;
  renderVerseBlock: (verse: BookVerse, nightMode: boolean, layout: ReturnType<typeof useBookLayout>) => React.ReactNode;
  measureVerses: BookVerse[];
  onMeasureVerse: (id: string, height: number) => void;
  cover?: BookCoverProps;
};

export default function BookLayout({
  title,
  chapterTitle,
  chapterTitles,
  pageCount,
  currentPageChapter,
  chapterPages,
  chapterStartSpreads,
  spreads,
  spreadIndex,
  currentSpread,
  prevSpread,
  nextSpread,
  lastReadSpread,
  bookmarkSpread,
  bookmarkActive,
  chapterLoading,
  loading,
  error,
  loadingChapterLabel,
  directChapterLoading,
  onBack,
  onToggleBookmark,
  onRetry,
  onChangeSpread,
  onLoadChapter,
  renderVerseBlock,
  measureVerses,
  onMeasureVerse,
  cover,
}: BookLayoutProps) {
  const layout = useBookLayout();
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
  const spreadsLengthRef = useRef(0);
  const turnDirRef = useRef<'forward' | 'backward' | null>(null);

  useEffect(() => { spreadsLengthRef.current = spreads.length; }, [spreads.length]);

  const activeLoading = loading || directChapterLoading;

  const currentChapterStartSpread = chapterStartSpreads[currentPageChapter] ?? 0;
  const currentChapterSpreadCount = Math.max(1, Math.ceil((chapterPages[currentPageChapter]?.length ?? 0) / 2));
  const currentChapterComplete = spreadIndex >= currentChapterStartSpread + currentChapterSpreadCount - 1;
  const progressRatio = spreads.length <= 1 ? 0 : spreadIndex / (spreads.length - 1);

  const spreadLabel = currentSpread?.left && currentSpread?.right
    ? `Pages ${currentSpread.left.pageNumber}-${currentSpread.right.pageNumber}`
    : currentSpread?.left
      ? `Page ${currentSpread.left.pageNumber}`
      : currentSpread?.right
        ? `Page ${currentSpread.right.pageNumber}`
        : 'Page 1';

  const goToPage = useCallback((index: number) => {
    const maxIndex = Math.max(0, spreadsLengthRef.current - 1);
    const target = clamp(index, 0, maxIndex);
    onChangeSpread(target);
  }, [onChangeSpread]);

  const onProgressTouch = useCallback((locationX: number) => {
    if (progressTrackWidth <= 0 || spreads.length <= 1) return;
    const ratio = clamp(locationX / progressTrackWidth, 0, 1);
    goToPage(Math.round(ratio * (spreads.length - 1)));
  }, [progressTrackWidth, spreads.length, goToPage]);

  const panResponder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, gs) => !isTurningRef.current && !isCoverAnimatingRef.current && Math.abs(gs.dx) > 15 && Math.abs(gs.dx) > Math.abs(gs.dy) * 0.6,
    onPanResponderGrant: () => {
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
        if (dir === 'forward' && spreadIndex >= spreadsLengthRef.current - 1) {
          const nextChapter = Math.min(currentPageChapter + 1, Number.MAX_SAFE_INTEGER);
          if (!chapterLoading[nextChapter]) void onLoadChapter(nextChapter, 'start');
          return;
        }
        if (dir === 'backward' && spreadIndex <= 0) {
          const previousChapter = Math.max(1, currentPageChapter - 1);
          if (!chapterLoading[previousChapter]) void onLoadChapter(previousChapter, 'end');
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
          const n = turnDirRef.current === 'forward' ? spreadIndex + 1 : spreadIndex - 1;
          onChangeSpread(n);
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
  }), [chapterLoading, currentPageChapter, layout.fullBookWidth, onChangeSpread, onLoadChapter, spreadIndex]);

  const onToggleBookmarkInternal = useCallback(async () => {
    await onToggleBookmark();
  }, [onToggleBookmark]);

  const selectChapter = useCallback(async (selectedChapter: number) => {
    setShowContents(false);
    if (selectedChapter === currentPageChapter) {
      const openSpread = chapterStartSpreads[selectedChapter];
      if (typeof openSpread === 'number') onChangeSpread(openSpread);
      return;
    }
    await onLoadChapter(selectedChapter, 'start');
    const openSpread = chapterStartSpreads[selectedChapter];
    if (typeof openSpread === 'number') onChangeSpread(openSpread);
  }, [chapterStartSpreads, currentPageChapter, onChangeSpread, onLoadChapter]);

  useEffect(() => {
    if (loading || pageCount === 0 || isCoverAnimatingRef.current) return;
    isCoverAnimatingRef.current = true;
    coverFlip.setValue(0);
    coverPulse.setValue(0);
    const pulseAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(coverPulse, { toValue: 1, duration: 2600, useNativeDriver: true }),
        Animated.timing(coverPulse, { toValue: 0, duration: 2600, useNativeDriver: true }),
      ]),
    );
    pulseAnim.start();
    Animated.sequence([
      Animated.delay(1100),
      Animated.timing(coverFlip, { toValue: 1, duration: 2400, useNativeDriver: true }),
    ]).start(() => {
      pulseAnim.stop();
      isCoverAnimatingRef.current = false;
    });
  }, [loading, pageCount, coverFlip, coverPulse]);

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

  const coverTextureUri = cover?.textureUri ?? 'https://www.transparenttextures.com/patterns/leather.png';
  const coverTitle = cover?.title ?? title;
  const coverSubtitle = cover?.subtitle ?? 'SHRIMAD';

  if (loading) return (<View style={styles.stateContainer}><LoadingProgress progress={loadingProgress} label={loadingChapterLabel} /></View>);
  if (error) return (
    <View style={styles.stateContainer}>
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={onRetry} activeOpacity={0.85}>
        <Text style={styles.retryButtonText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );

  const currentSpreadIsLastReadLeft = currentSpread?.left?.pageNumber === lastReadSpread + 1;
  const currentSpreadIsLastReadRight = currentSpread?.right?.pageNumber === lastReadSpread + 1;

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

  return (
    <SafeAreaView style={[styles.outerContainer, { backgroundColor: nightMode ? '#0A0603' : '#140D07' }]} edges={['top', 'bottom']}>
      <Modal visible={showContents} transparent animationType="fade" onRequestClose={() => setShowContents(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setShowContents(false)}>
          <View style={styles.contentsCard} onStartShouldSetResponder={() => true}>
            <View style={styles.contentsHandle} />
            <Text style={styles.contentsTitle}>Contents</Text>
            {chapterTitles.map((titleItem, index) => {
              const ch = index + 1;
              const sel = ch === currentPageChapter;
              const locked = ch !== currentPageChapter && !currentChapterComplete;
              return (
                <TouchableOpacity
                  key={`ch-${ch}`}
                  style={[styles.contentsRow, sel && styles.contentsRowSelected, locked && styles.contentsRowLocked]}
                  disabled={locked}
                  onPress={() => { void selectChapter(ch); }}
                  activeOpacity={0.82}
                >
                  <Text style={[styles.contentsText, sel && styles.contentsTextSelected, locked && styles.contentsTextLocked]} numberOfLines={1}>
                    {ch}. {titleItem}
                  </Text>
                  {locked ? <Ionicons name="lock-closed" size={14} color="#7D684A" /> : null}
                </TouchableOpacity>
              );
            })}
          </View>
        </Pressable>
      </Modal>

      <View style={styles.topHeaderRow}>
        <TouchableOpacity onPress={onBack} style={styles.rowBtn}><Ionicons name="chevron-back" size={24} color="#D1B981" /><Text style={styles.rowTitle}>{title}</Text></TouchableOpacity>
        <View style={styles.headerCenter}><Text style={styles.headerChapterSanskrit}>अध्याय {currentPageChapter}</Text><Text style={styles.headerChapterEnglish}>{chapterTitle}</Text></View>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={onToggleBookmarkInternal} style={styles.headerIconBtn}><Ionicons name={bookmarkActive ? 'bookmark' : 'bookmark-outline'} size={24} color={bookmarkActive ? '#F2D39A' : '#D1B981'} /></TouchableOpacity>
        </View>
      </View>

      <View style={styles.deskArea} {...panResponder.panHandlers}>
        <View style={[styles.bookShadowContainer, { width: layout.bookWidth, height: layout.bookHeight }]}> 
          <View style={[styles.hardcoverBacking, { width: layout.bookWidth, height: layout.bookHeight }]} />
          <View style={[styles.pageStackRight, { left: layout.pageWidth + layout.spineWidth, width: layout.pageWidth, height: layout.bookHeight - 4, backgroundColor: nightMode ? '#221910' : '#D1BC94', borderColor: nightMode ? '#3D2F1D' : '#9E855C' }]} />
          <View style={[styles.pageStackLeft, { left: -2, width: layout.pageWidth, height: layout.bookHeight - 4, backgroundColor: nightMode ? '#221910' : '#D1BC94', borderColor: nightMode ? '#3D2F1D' : '#9E855C' }]} />
          <View pointerEvents="none" style={[styles.readDepthSpineShade, { left: layout.pageWidth - (4 + progressRatio * 18), width: 4 + progressRatio * 18, height: layout.bookHeight }]}> 
            <LinearGradient colors={['rgba(255,239,198,0.08)', 'rgba(108,73,35,0.24)', 'rgba(18,9,3,0.38)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFillObject} />
          </View>
          <View pointerEvents="none" style={[styles.unreadDepthOuterShade, { left: layout.pageWidth + layout.spineWidth + layout.pageWidth - (4 + (1 - progressRatio) * 18), width: 4 + (1 - progressRatio) * 18, height: layout.bookHeight }]}> 
            <LinearGradient colors={['rgba(18,9,3,0.35)', 'rgba(108,73,35,0.18)', 'rgba(255,239,198,0.05)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFillObject} />
          </View>
          <View pointerEvents="none" style={[styles.bottomReadDepthShade, { width: layout.fullBookWidth * clamp(progressRatio, 0, 1) }]}> 
            <LinearGradient colors={['rgba(245,218,156,0.55)', 'rgba(122,80,36,0.3)', 'rgba(18,9,3,0)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFillObject} />
          </View>

          {currentSpread && (
            <View style={[StyleSheet.absoluteFill, { zIndex: 1 }]}> 
              <View style={{ position: 'absolute', left: 0, top: 0, width: layout.pageWidth, height: layout.bookHeight }}>
                <MemoBookPage layout={layout} page={turnDir === 'backward' && prevSpread ? prevSpread.left : currentSpread.left} totalPages={pageCount} chapterTitle={chapterTitle} isLeft isLastRead={currentSpreadIsLastReadLeft} nightMode={nightMode} onPrev={() => goToPage(spreadIndex - 1)} onNext={() => goToPage(spreadIndex + 1)} hideTabs={turnDir !== null} renderVerseBlock={renderVerseBlock} />
                {turnDir === 'forward' && (
                   <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: 'black', opacity: turnAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.25] }) }]} />
                )}
                {turnDir === 'backward' && (
                   <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: 'black', opacity: turnAnim.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0] }) }]} />
                )}
              </View>

              <View style={{ position: 'absolute', left: layout.pageWidth + layout.spineWidth, top: 0, width: layout.pageWidth, height: layout.bookHeight }}>
                <MemoBookPage layout={layout} page={turnDir === 'forward' && nextSpread ? nextSpread.right : currentSpread.right} totalPages={pageCount} chapterTitle={chapterTitle} isLeft={false} isLastRead={currentSpreadIsLastReadRight} nightMode={nightMode} onPrev={() => goToPage(spreadIndex - 1)} onNext={() => goToPage(spreadIndex + 1)} hideTabs={turnDir !== null} renderVerseBlock={renderVerseBlock} />
                {turnDir === 'forward' && (
                   <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: 'black', opacity: turnAnim.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0] }) }]} />
                )}
                {turnDir === 'backward' && (
                   <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: 'black', opacity: turnAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.25] }) }]} />
                )}
              </View>
            </View>
          )}

          {turnDir === 'forward' && currentSpread?.right && nextSpread?.left && (
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

          {turnDir === 'backward' && currentSpread?.left && prevSpread?.right && (
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

          {turnDir === 'forward' && currentSpread?.right && nextSpread?.left && (
            <Animated.View style={{ position: 'absolute', left: 0, top: 0, width: layout.fullBookWidth, height: layout.bookHeight, zIndex: 10, elevation: 10, transform: [{ perspective: 1500 }, { rotateY: forwardTurnAngle }] }}>
              <Animated.View style={{ position: 'absolute', left: layout.pageWidth + layout.spineWidth, top: 0, width: layout.pageWidth, height: layout.bookHeight, backfaceVisibility: 'hidden', opacity: frontFaceOpacity }}>
                <MemoBookPage layout={layout} page={currentSpread.right} totalPages={pageCount} chapterTitle={chapterTitle} isLeft={false} isLastRead={false} nightMode={nightMode} onPrev={() => {}} onNext={() => {}} hideTabs={true} renderVerseBlock={renderVerseBlock} />
                <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'black', opacity: turnAnim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0] }) }]} />
                <Animated.View pointerEvents="none" style={[styles.turningPageEdge, styles.turningPageEdgeRight, { opacity: turningEdgeOpacity, transform: [{ scaleX: turningEdgeScaleX }] }]}> 
                  <LinearGradient colors={['rgba(255,244,216,0)', 'rgba(255,244,216,0.9)', 'rgba(93,61,29,0.35)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFillObject} />
                </Animated.View>
              </Animated.View>

              <Animated.View style={{ position: 'absolute', left: layout.pageWidth + layout.spineWidth, top: 0, width: layout.pageWidth, height: layout.bookHeight, backfaceVisibility: 'hidden', opacity: backFaceOpacity, transform: [{ rotateY: '180deg' }] }}>
                <MemoBookPage layout={layout} page={nextSpread.left} totalPages={pageCount} chapterTitle={chapterTitle} isLeft={true} isLastRead={false} nightMode={nightMode} onPrev={() => {}} onNext={() => {}} hideTabs={true} renderVerseBlock={renderVerseBlock} />
                <LinearGradient colors={['rgba(0,0,0,0.15)', 'rgba(0,0,0,0)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFillObject} />
                <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'black', opacity: turnAnim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0] }) }]} />
                <Animated.View pointerEvents="none" style={[styles.turningPageEdge, styles.turningPageEdgeLeft, { opacity: turningEdgeOpacity, transform: [{ scaleX: turningEdgeScaleX }] }]}> 
                  <LinearGradient colors={['rgba(93,61,29,0.35)', 'rgba(255,244,216,0.9)', 'rgba(255,244,216,0)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFillObject} />
                </Animated.View>
              </Animated.View>
            </Animated.View>
          )}

          {turnDir === 'backward' && currentSpread?.left && prevSpread?.right && (
            <Animated.View style={{ position: 'absolute', left: 0, top: 0, width: layout.fullBookWidth, height: layout.bookHeight, zIndex: 10, elevation: 10, transform: [{ perspective: 1500 }, { rotateY: backwardTurnAngle }] }}>
              <Animated.View style={{ position: 'absolute', left: 0, top: 0, width: layout.pageWidth, height: layout.bookHeight, backfaceVisibility: 'hidden', opacity: frontFaceOpacity }}>
                <MemoBookPage layout={layout} page={currentSpread.left} totalPages={pageCount} chapterTitle={chapterTitle} isLeft={true} isLastRead={false} nightMode={nightMode} onPrev={() => {}} onNext={() => {}} hideTabs={true} renderVerseBlock={renderVerseBlock} />
                <LinearGradient colors={['rgba(0,0,0,0.15)', 'rgba(0,0,0,0)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFillObject} />
                <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'black', opacity: turnAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.4] }) }]} />
                <Animated.View pointerEvents="none" style={[styles.turningPageEdge, styles.turningPageEdgeLeft, { opacity: turningEdgeOpacity, transform: [{ scaleX: turningEdgeScaleX }] }]}> 
                  <LinearGradient colors={['rgba(93,61,29,0.35)', 'rgba(255,244,216,0.9)', 'rgba(255,244,216,0)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFillObject} />
                </Animated.View>
              </Animated.View>

              <Animated.View style={{ position: 'absolute', left: 0, top: 0, width: layout.pageWidth, height: layout.bookHeight, backfaceVisibility: 'hidden', opacity: backFaceOpacity, transform: [{ rotateY: '180deg' }] }}>
                <MemoBookPage layout={layout} page={prevSpread.right} totalPages={pageCount} chapterTitle={chapterTitle} isLeft={false} isLastRead={false} nightMode={nightMode} onPrev={() => {}} onNext={() => {}} hideTabs={true} renderVerseBlock={renderVerseBlock} />
                <LinearGradient colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.15)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFillObject} />
                <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'black', opacity: turnAnim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0] }) }]} />
                <Animated.View pointerEvents="none" style={[styles.turningPageEdge, styles.turningPageEdgeRight, { opacity: turningEdgeOpacity, transform: [{ scaleX: turningEdgeScaleX }] }]}> 
                  <LinearGradient colors={['rgba(255,244,216,0)', 'rgba(255,244,216,0.9)', 'rgba(93,61,29,0.35)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFillObject} />
                </Animated.View>
              </Animated.View>
            </Animated.View>
          )}

          <View style={[styles.centerSpine, { left: layout.pageWidth, width: layout.spineWidth, height: layout.bookHeight, zIndex: 15 }]}> 
            <LinearGradient colors={['rgba(15,8,3,0.95)', 'rgba(30,15,5,0.25)', 'rgba(15,8,3,0.95)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
          </View>

          <Animated.View pointerEvents="none" style={[styles.coverPivotWrapper, { left: 0, width: layout.fullBookWidth, height: layout.bookHeight, zIndex: 100, transform: [{ perspective: 1500 }, { rotateY: coverRotateY }] }]}> 
            <Animated.View style={[styles.frontCover, { position: 'absolute', left: layout.pageWidth + layout.spineWidth, top: 0, width: layout.pageWidth, height: layout.bookHeight, opacity: coverOpacity }]}> 
              <LinearGradient colors={['#3A1208', '#542012', '#260B05']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFillObject} />
              <ImageBackground source={cover?.imageSource ?? { uri: coverTextureUri }} style={StyleSheet.absoluteFillObject} imageStyle={{ opacity: cover?.imageSource ? 0.9 : 0.55 }} />
              <View style={styles.coverGoldBorder}>
                <LinearGradient colors={['#FFDCA8', '#C4974F', '#FFDCA8']} style={styles.coverGoldInnerBorder}>
                  <View style={styles.coverInnerDark}>
                    <Text style={styles.coverSubtitle}>{coverSubtitle}</Text>
                    <ImageBackground source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/0/05/Ashoka_Chakra.svg' }} style={styles.coverEmblem} tintColor="#E7D1A2" />
                    <Animated.Text style={[styles.coverTitle, { transform: [{ scale: titlePulse }] }]}>{coverTitle}</Animated.Text>
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
        <TouchableOpacity style={styles.rowBtn} onPress={() => setNightMode((prev) => !prev)}><Ionicons name={nightMode ? 'sunny-outline' : 'moon-outline'} size={24} color="#D1B981" /></TouchableOpacity>
      </View>

      {directChapterLoading ? (
        <View style={styles.directLoadOverlay} pointerEvents="none">
          <View style={styles.directLoadCard}>
            <LoadingProgress progress={loadingProgress} label={loadingChapterLabel} compact />
          </View>
        </View>
      ) : null}

      <View pointerEvents="none" style={[styles.measureLayer, { width: Math.max(120, layout.pageWidth - layout.pageBodyHorizontalPadding * 2 - 12) }]}> 
        {measureVerses.map((verse, idx) => {
          const id = `${verse.chapter}-${verse.verse}-${idx}`;
          return (<View key={id} style={[styles.measureVerseBlock, { marginBottom: layout.pageBodyGap }]} onLayout={(e) => onMeasureVerse(id, Math.ceil(e.nativeEvent.layout.height))}>
            {renderVerseBlock(verse, false, layout)}
          </View>);
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  outerContainer: { flex: 1, justifyContent: 'space-between' },
  stateContainer: { flex: 1, backgroundColor: '#140D07', justifyContent: 'center', alignItems: 'center' },
  loadingContent: { width: '72%', maxWidth: 320 },
  compactLoadContent: { width: 220 },
  instagramProgressTrack: { height: 4, borderRadius: 999, backgroundColor: '#ECECEC', overflow: 'hidden' },
  instagramProgressFill: { height: '100%', borderRadius: 999, backgroundColor: '#FEDA75' },
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
  directLoadCard: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 14, backgroundColor: '#F5E7D1', borderWidth: 1, borderColor: '#E9D5B7' },
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
