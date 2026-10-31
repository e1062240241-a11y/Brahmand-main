import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Pressable,
  ScrollView,
  ImageBackground,
  Image,
  Modal,
  AppState,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  interpolate,
  Extrapolate,
  cancelAnimation,
} from 'react-native-reanimated';
import VerseCard from '../../src/components/VerseCard';
import { useLibraryStore } from '../../src/store/libraryStore';
import { useStoryStore } from '../../src/store/useStoryStore';
import { GitaStoryView } from '../../src/components/GitaStoryView';
import { StoryAudioPlayer } from '../../src/components/StoryAudioPlayer';
import { loadBhagavadGitaChapter, loadBhagavadGitaStoryChapter, prefetchBhagavadGitaChapters, cleanupBhagavadGitaChapters } from '../../src/services/bhagavad-geeta-service';
import { useLanguageStore } from '../../src/utils/i18n';
import { gitaSpeechService, SpeechLanguage } from '../../src/services/gita-speech-service';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// We use the new 3D Bhagavad Gita image provided by the user
const geeta3DImage = { uri: 'https://brahmandfeed23.b-cdn.net/assets/bhagavad_gita_3d_new.webp' };
// Custom bookmark icons
const bookmarkIconImage = { uri: 'https://brahmandfeed23.b-cdn.net/assets/bookmark_icon.webp' };
const bookmarkIconFilledImage = { uri: 'https://brahmandfeed23.b-cdn.net/assets/bookmark_icon_filled.webp' };

const BOOK_ID = 'bhagvad-geeta';
const TOTAL_CHAPTERS = 18;

const getTranslations = (translations: any) => {
  if (!translations || typeof translations !== 'object') {
    return { hindi: '', english: '' };
  }
  
  // Hindi Translation keys
  const hindiKeys = [
    'swami tejomayananda', 'Swami Tejomayananda',
    'swami ramsukhdas', 'Swami Ramsukhdas',
    'sri harikrishnadas goenka', 'Sri Harikrishnadas Goenka',
    'hindi', 'Hindi'
  ];
  let hindi = '';
  for (const key of hindiKeys) {
    if (typeof translations[key] === 'string' && translations[key].trim().length > 0) {
      hindi = translations[key];
      break;
    }
  }

  // English Translation keys
  const englishKeys = [
    'swami adidevananda', 'Swami Adidevananda',
    'swami gambirananda', 'Swami Gambirananda',
    'swami sivananda', 'Swami Sivananda',
    'dr. s. sankaranarayan', 'Dr. S. Sankaranarayan',
    'shri purohit swami', 'Shri Purohit Swami',
    'english', 'English'
  ];
  let english = '';
  for (const key of englishKeys) {
    if (typeof translations[key] === 'string' && translations[key].trim().length > 0) {
      english = translations[key];
      break;
    }
  }

  return { hindi, english };
};

const getVerseTextForSpeech = (
  verse: any,
  mode: 'sanskrit' | 'hindi' | 'english' | 'both'
): { text: string; secondaryText?: string; langType: SpeechLanguage } => {
  const rawText = verse?.text || '';
  const speakerMatch = rawText.match(/^([^\n]+उवाच[^\n]*)\n+/);
  const speakerHeading = speakerMatch ? speakerMatch[1].trim() : '';
  const rawShloka = speakerMatch ? rawText.replace(speakerMatch[0], '').trim() : rawText;
  const cleanSanskrit = rawShloka.replace(/\s*।।\s*\d+(?:\.\d+)?\s*।।\s*$/, '').trim();

  const { hindi, english } = getTranslations(verse?.translations);

  if (mode === 'sanskrit') {
    return {
      text: (speakerHeading ? `${speakerHeading}। ` : '') + cleanSanskrit,
      langType: 'sanskrit',
    };
  } else if (mode === 'hindi') {
    return {
      text: hindi || cleanSanskrit,
      langType: 'hindi',
    };
  } else if (mode === 'english') {
    return {
      text: english || cleanSanskrit,
      langType: 'english',
    };
  } else {
    // Both: authentic Sanskrit chanting first, followed smoothly by Hindi/English explanation
    return {
      text: (speakerHeading ? `${speakerHeading}। ` : '') + cleanSanskrit,
      secondaryText: hindi ? `भावार्थ: ${hindi}` : (english ? `Meaning: ${english}` : undefined),
      langType: 'sanskrit',
    };
  }
};


const GITA_CHAPTERS_META = [
  { num: 1, nameHi: 'अर्जुनविषादयोग', nameEn: 'Arjuna Vishada Yoga', subtitle: 'The Yoga of Dejection' },
  { num: 2, nameHi: 'सांख्ययोग', nameEn: 'Sankhya Yoga', subtitle: 'The Yoga of Knowledge' },
  { num: 3, nameHi: 'कर्मयोग', nameEn: 'Karma Yoga', subtitle: 'The Yoga of Action' },
  { num: 4, nameHi: 'ज्ञानकर्मसंन्यासयोग', nameEn: 'Jnana Karma Sanyasa Yoga', subtitle: 'The Yoga of Wisdom' },
  { num: 5, nameHi: 'कर्मसंन्यासयोग', nameEn: 'Karma Sanyasa Yoga', subtitle: 'The Yoga of Renunciation' },
  { num: 6, nameHi: 'आत्मसंयमयोग', nameEn: 'Dhyana Yoga', subtitle: 'The Yoga of Meditation' },
  { num: 7, nameHi: 'ज्ञानविज्ञानयोग', nameEn: 'Jnana Vijnana Yoga', subtitle: 'The Yoga of Knowledge and Wisdom' },
  { num: 8, nameHi: 'अक्षरब्रह्मयोग', nameEn: 'Aksara Brahma Yoga', subtitle: 'The Yoga of the Imperishable Brahman' },
  { num: 9, nameHi: 'राजविद्याराजगुह्ययोग', nameEn: 'Raja Vidya Raja Guhya Yoga', subtitle: 'The Yoga of Royal Knowledge' },
  { num: 10, nameHi: 'विभूतियोग', nameEn: 'Vibhuti Yoga', subtitle: 'The Yoga of Divine Glories' },
  { num: 11, nameHi: 'विश्वरूपदर्शनयोग', nameEn: 'Visvarupa Darsana Yoga', subtitle: 'The Vision of Universal Form' },
  { num: 12, nameHi: 'भक्तियोग', nameEn: 'Bhakti Yoga', subtitle: 'The Yoga of Devotion' },
  { num: 13, nameHi: 'क्षेत्र-क्षेत्रज्ञविभागयोग', nameEn: 'Kshetra Kshetrajna Yoga', subtitle: 'The Field & its Knower' },
  { num: 14, nameHi: 'गुणत्रयविभागयोग', nameEn: 'Gunatraya Vibhaga Yoga', subtitle: 'The Three Gunas of Nature' },
  { num: 15, nameHi: 'पुरुषोत्तमयोग', nameEn: 'Purushottama Yoga', subtitle: 'The Supreme Divine Being' },
  { num: 16, nameHi: 'दैवासुरसम्पद्विभागयोग', nameEn: 'Daivasura Sampad Yoga', subtitle: 'Divine and Demonic Natures' },
  { num: 17, nameHi: 'श्रद्धात्रयविभागयोग', nameEn: 'Sraddhatraya Vibhaga Yoga', subtitle: 'The Threefold Divisions of Faith' },
  { num: 18, nameHi: 'मोक्षसंन्यासयोग', nameEn: 'Moksha Sanyasa Yoga', subtitle: 'The Yoga of Liberation' }
];

const GITA_CHAPTER_NAMES = GITA_CHAPTERS_META.map(m => m.nameHi);

export default function BhagavadGita3DPage() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [isOpened, setIsOpened] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const chapterScrollRef = useRef<ScrollView>(null);

  const language = useLanguageStore((state) => state.language);
  const isHindi = language === 'hi';
  
  const { updateProgress, getBookProgress, setLastRead, toggleBookmark } = useLibraryStore();
  
  const progressGeeta = getBookProgress('bhagvad-geeta');
  const progressGita = getBookProgress('gita');
  const progress = ((progressGeeta.chapterNum ?? 0) > 1 || (progressGeeta.progressPercent ?? 0) > 0 || (progressGeeta.bookmarks?.length ?? 0) > 0) ? progressGeeta : progressGita;

  const { chapterNum: lastReadChapter, lastReadScrollY = 0, bookmarks = [], progressPercent } = progress;
  
  const [currentChapter, setCurrentChapter] = useState(lastReadChapter || 1);
  const [showBookmarksMenu, setShowBookmarksMenu] = useState(false);
  const [showChapterIndex, setShowChapterIndex] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [nightMode, setNightMode] = useState(false);
  const [fontSizeScale, setFontSizeScale] = useState(1.0);
  
  const [contentHeight, setContentHeight] = useState(0);
  const [layoutHeight, setLayoutHeight] = useState(0);
  const [progressTrackWidth, setProgressTrackWidth] = useState(0);

  const [loading, setLoading] = useState(false);
  const [verses, setVerses] = useState<any[]>([]);
  const [totalVerses, setTotalVerses] = useState(0);
  const [initialScrollRestored, setInitialScrollRestored] = useState(false);
  const [visibleLimit, setVisibleLimit] = useState(50);
  
  const isChapterBookmarked = bookmarks.some(b => b.chapter === currentChapter);

  // Cosmic Storyteller Mode ("मैं समय हूँ") State
  const { viewMode, setViewMode, isPlaying, setIsPlaying } = useStoryStore();
  const [storyChapterData, setStoryChapterData] = useState<any | null>(null);
  const [storyLoading, setStoryLoading] = useState(false);
  const [activeStoryScene, setActiveStoryScene] = useState<any | null>(null);
  const [activeCueMark, setActiveCueMark] = useState<string | null>(null);
  const [activeCueSceneId, setActiveCueSceneId] = useState<string | null>(null);

  useEffect(() => {
    let isCurrent = true;
    setStoryLoading(true);
    loadBhagavadGitaStoryChapter(currentChapter).then((data) => {
      if (isCurrent) {
        setStoryChapterData(data);
        setStoryLoading(false);
      }
    });
    return () => {
      isCurrent = false;
    };
  }, [currentChapter]);

  // Cosmic Storyteller auto-advancing callback
  const handleStorySceneComplete = useCallback(() => {
    if (!storyChapterData || !activeStoryScene) return;

    if (activeStoryScene.scene_id === 'opening') {
      // Opening prologue ended -> switch to Scene 1
      if (storyChapterData.scenes && storyChapterData.scenes.length > 0) {
        setActiveStoryScene(storyChapterData.scenes[0]);
        setIsPlaying(true);
        return;
      }
    }

    const currentIndex = storyChapterData.scenes?.findIndex(
      (s: any) => s.scene_id === activeStoryScene.scene_id
    ) ?? -1;

    if (currentIndex >= 0 && currentIndex < (storyChapterData.scenes?.length || 0) - 1) {
      // Advance to next dramatic scene
      const nextScene = storyChapterData.scenes[currentIndex + 1];
      setActiveStoryScene(nextScene);
      setIsPlaying(true);
    } else {
      // Completed entire chapter storyline
      setActiveStoryScene(null);
      setIsPlaying(false);
    }
  }, [storyChapterData, activeStoryScene, setIsPlaying]);

  // Audio Recitation State
  const [activeRecitingIndex, setActiveRecitingIndex] = useState<number | null>(null);
  const [isReciting, setIsReciting] = useState(false);
  const [isAudioPlayerVisible, setIsAudioPlayerVisible] = useState(false);
  const [reciteMode, setReciteMode] = useState<'sanskrit' | 'hindi' | 'english' | 'both'>('sanskrit');
  const [reciteSpeed, setReciteSpeed] = useState<number>(0.85); // 0.85 (Slow/Sacred), 1.0 (Normal), 1.15 (Fast)
  const [continuousPlay, setContinuousPlay] = useState<boolean>(true);

  const versePositionsRef = useRef<Record<number, number>>({});
  const activeRecitingIndexRef = useRef<number | null>(null);
  const isRecitingRef = useRef<boolean>(false);
  const continuousPlayRef = useRef<boolean>(true);
  const reciteModeRef = useRef<'sanskrit' | 'hindi' | 'english' | 'both'>('sanskrit');
  const reciteSpeedRef = useRef<number>(0.85);
  const versesRef = useRef<any[]>([]);

  useEffect(() => {
    activeRecitingIndexRef.current = activeRecitingIndex;
  }, [activeRecitingIndex]);

  useEffect(() => {
    isRecitingRef.current = isReciting;
  }, [isReciting]);

  useEffect(() => {
    continuousPlayRef.current = continuousPlay;
  }, [continuousPlay]);

  useEffect(() => {
    reciteModeRef.current = reciteMode;
  }, [reciteMode]);

  useEffect(() => {
    reciteSpeedRef.current = reciteSpeed;
  }, [reciteSpeed]);

  useEffect(() => {
    versesRef.current = verses;
  }, [verses]);

  const stopRecitation = useCallback(async () => {
    await gitaSpeechService.stop();
    setIsReciting(false);
    setActiveRecitingIndex(null);
  }, []);

  const startRecitingVerse = useCallback(async (
    targetIndex: number,
    mode = reciteModeRef.current,
    speed = reciteSpeedRef.current
  ) => {
    const verseList = versesRef.current;
    if (!verseList || targetIndex < 0 || targetIndex >= verseList.length) {
      setIsReciting(false);
      setActiveRecitingIndex(null);
      return;
    }

    const verse = verseList[targetIndex];
    const { text, secondaryText, langType } = getVerseTextForSpeech(verse, mode);

    setActiveRecitingIndex(targetIndex);
    setIsReciting(true);
    setIsAudioPlayerVisible(true);

    // Auto-scroll to center the reciting verse
    const posY = versePositionsRef.current[targetIndex];
    if (typeof posY === 'number' && scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: Math.max(0, posY - 100), animated: true });
    }

    const ch = Number(verse?.chapter) || currentChapter || 1;
    const v = Number(verse?.verse) || verse?.id || targetIndex + 1;

    await gitaSpeechService.speak({
      text,
      secondaryText,
      chapter: ch,
      verse: v,
      type: langType,
      rate: speed,
      voiceGender: 'female',
      onStart: () => {
        setIsReciting(true);
      },
      onDone: () => {
        if (!isRecitingRef.current) return;
        if (continuousPlayRef.current && targetIndex + 1 < versesRef.current.length) {
          // Pause 700ms between verses for natural meditative breathing
          setTimeout(() => {
            if (isRecitingRef.current) {
              startRecitingVerse(targetIndex + 1, mode, speed);
            }
          }, 700);
        } else {
          setIsReciting(false);
          setActiveRecitingIndex(null);
        }
      },
      onStopped: () => {
        setIsReciting(false);
        setActiveRecitingIndex(null);
      },
      onError: (err) => {
        console.warn('Recitation error:', err);
        setIsReciting(false);
        setActiveRecitingIndex(null);
      },
    });
  }, []);

  const togglePlayPauseAudio = useCallback(() => {
    if (isReciting) {
      gitaSpeechService.stop();
      setIsReciting(false);
    } else {
      const idx = activeRecitingIndex ?? 0;
      startRecitingVerse(idx);
    }
  }, [isReciting, activeRecitingIndex, startRecitingVerse]);

  const cycleReciteSpeed = useCallback(() => {
    setReciteSpeed((prev) => {
      const next = prev === 0.85 ? 1.0 : prev === 1.0 ? 1.15 : 0.85;
      if (isReciting && activeRecitingIndex !== null) {
        startRecitingVerse(activeRecitingIndex, reciteMode, next);
      }
      return next;
    });
  }, [isReciting, activeRecitingIndex, reciteMode, startRecitingVerse]);

  const cycleReciteMode = useCallback(() => {
    setReciteMode((prev) => {
      const modes: Array<'sanskrit' | 'hindi' | 'english' | 'both'> = ['sanskrit', 'hindi', 'english', 'both'];
      const nextIdx = (modes.indexOf(prev) + 1) % modes.length;
      const next = modes[nextIdx];
      if (isReciting && activeRecitingIndex !== null) {
        startRecitingVerse(activeRecitingIndex, next, reciteSpeed);
      }
      return next;
    });
  }, [isReciting, activeRecitingIndex, reciteSpeed, startRecitingVerse]);

  const handleToggleBookmark = () => {
    const title = GITA_CHAPTERS_META[currentChapter - 1]?.nameHi || `अध्याय ${currentChapter}`;
    toggleBookmark(BOOK_ID, currentChapter, 0, title);
  };

  // Holds the latest progress values to commit on scroll end or unmount
  const pendingProgressRef = useRef<any>(null);

  const handleScroll = (event: any) => {
    const scrollY = event.nativeEvent.contentOffset.y;
    const contentH = event.nativeEvent.contentSize.height;
    const layoutH = event.nativeEvent.layoutMeasurement.height;
    const scrollableHeight = contentH - layoutH;
    const progressVal = scrollableHeight > 0 ? (scrollY / scrollableHeight) * 100 : 0;
    const clampedProgress = Math.min(Math.max(progressVal, 0), 100);
    
    setScrollProgress(clampedProgress);

    pendingProgressRef.current = {
      scrollY,
      clampedProgress,
      contentH,
      layoutH
    };

    if (verses.length > 0 && scrollableHeight - scrollY < 1200) {
      setVisibleLimit(prev => Math.min(prev + 50, verses.length));
    }
  };

  const commitProgress = () => {
    if (!pendingProgressRef.current) return;
    const { scrollY, clampedProgress, contentH, layoutH } = pendingProgressRef.current;
    
    setLastRead(BOOK_ID, currentChapter, scrollY, clampedProgress);
    updateProgress({
      id: BOOK_ID,
      chapterName: GITA_CHAPTER_NAMES[currentChapter - 1] || `अध्याय ${currentChapter}`,
      chapterNum: currentChapter,
      lastReadPage: Math.max(1, Math.min(Math.ceil(contentH / (layoutH || 1)), Math.ceil((clampedProgress / 100) * Math.max(1, Math.ceil(contentH / (layoutH || 1)) - 1)) + 1)),
      totalPages: Math.max(1, Math.ceil(contentH / (layoutH || 1))),
      progressPercent: clampedProgress,
      lastOpenedTime: Date.now(),
    });
    pendingProgressRef.current = null;
  };

  const currentMeta = GITA_CHAPTERS_META[currentChapter - 1] || GITA_CHAPTERS_META[0];

  const handleChapterChange = (chNum: number) => {
    commitProgress();
    stopRecitation();
    setActiveStoryScene(null);
    setActiveCueMark(null);
    setCurrentChapter(chNum);
    setLastRead(BOOK_ID, chNum, 0, 0);
    setInitialScrollRestored(false);
    setVisibleLimit(50);
    scrollViewRef.current?.scrollTo({ y: 0, animated: false });

    // Scroll chapter selector tab into view smoothly
    if (chapterScrollRef.current) {
      const approxTabW = 120;
      chapterScrollRef.current.scrollTo({ x: Math.max(0, (chNum - 1) * approxTabW - 80), animated: true });
    }
  };

  // Cycle font sizes: Normal (1.0) -> Large (1.15) -> Compact (0.9)
  const cycleFontSize = () => {
    setFontSizeScale(prev => {
      if (prev === 1.0) return 1.15;
      if (prev === 1.15) return 0.9;
      return 1.0;
    });
  };

  // Fetch chapter data from Backend with prefetching and memory cleanup
  const fetchChapterData = useCallback(async (chNum: number) => {
    setLoading(true);
    try {
      const loadedVerses = await loadBhagavadGitaChapter(chNum);
      if (loadedVerses) {
        setVerses(loadedVerses);
        setTotalVerses(loadedVerses.length);
        const progressNow = useLibraryStore.getState().getBookProgress(BOOK_ID);
        const isResuming = progressNow.chapterNum === chNum;
        const pct = isResuming ? (progressNow.progressPercent || 0) : 0;
        const initialLimit = Math.max(50, Math.ceil((pct / 100) * loadedVerses.length) + 50);
        setVisibleLimit(initialLimit);

        // Memory & performance optimization: cleanup distant chapters & prefetch next
        cleanupBhagavadGitaChapters(chNum);
        if (chNum < TOTAL_CHAPTERS) {
          prefetchBhagavadGitaChapters(chNum + 1);
        }
      }
    } catch (error) {
      console.error('Failed to fetch chapter:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChapterData(currentChapter);
  }, [currentChapter, fetchChapterData]);

  // Restore scroll position after loaded
  useEffect(() => {
    if (!loading && verses.length > 0 && !initialScrollRestored) {
      if (lastReadScrollY > 0) {
        setTimeout(() => {
          scrollViewRef.current?.scrollTo({ y: lastReadScrollY, animated: true });
        }, 300);
      }
      setInitialScrollRestored(true);
    }
  }, [loading, verses, initialScrollRestored]);

  // Animation values

  // Flush pending DB writes and stop speech on unmount
  useEffect(() => {
    return () => {
      commitProgress();
      gitaSpeechService.stop();
    };
  }, []);

  const floatingY = useSharedValue(0);
  const openProgress = useSharedValue(0);
  const glowOpacity = useSharedValue(0);

  useEffect(() => {
    const startFloating = () => {
      floatingY.value = withRepeat(
        withSequence(
          withTiming(-12, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        true
      );
    };

    if (AppState.currentState === 'active') {
      startFloating();
    }

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        startFloating();
      } else {
        commitProgress();
        cancelAnimation(floatingY);
        gitaSpeechService.stop();
        setIsReciting(false);
      }
    });

    return () => {
      subscription.remove();
      cancelAnimation(floatingY);
    };
  }, []);

  useEffect(() => {
    StatusBar.setBarStyle(nightMode ? 'light-content' : 'dark-content');
  }, [nightMode]);

  const handleOpenBook = () => {
    if (isOpened) return;
    
    // Stop floating smoothly
    floatingY.value = withTiming(0, { duration: 300 });
    
    // Animate glow and book opening
    glowOpacity.value = withSequence(
      withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      withTiming(0, { duration: 800 })
    );

    openProgress.value = withTiming(1, {
      duration: 1500,
      easing: Easing.bezier(0.25, 1, 0.5, 1),
    });

    setTimeout(() => {
      setIsOpened(true);
    }, 1200);
  };

  const bookAnimatedStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(openProgress.value, [0, 1], [0, -110]);
    const translateX = interpolate(openProgress.value, [0, 1], [0, -SCREEN_WIDTH * 0.6]);
    const scale = interpolate(openProgress.value, [0, 0.5, 1], [1, 1.15, 1.4]);
    const opacity = interpolate(openProgress.value, [0, 0.7, 1], [1, 1, 0]);

    return {
      opacity,
      transform: [
        { perspective: 1200 },
        { translateY: floatingY.value },
        { translateX },
        { scale },
        { rotateY: `${rotateY}deg` },
      ],
    };
  });

  const glowAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: glowOpacity.value,
    };
  });

  const readingScreenStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      openProgress.value,
      [0.6, 1],
      [0, 1],
      Extrapolate.CLAMP
    );
    return {
      opacity,
      flex: 1,
    };
  });

  const convertToHindiNumerals = (num: number) => {
    const hindiNumerals = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
    return num.toString().split('').map(digit => hindiNumerals[parseInt(digit)]).join('');
  };

  return (
    <View style={styles.root}>
      
      {!isOpened ? (
        <LinearGradient
          colors={['#FF8D57', '#EA9B76', '#FFEEE5', '#FFEEE5']}
          locations={[0, 0.0913, 0.25, 1]}
          style={styles.contentContainer}
        >
          {/* Subtle Glow behind the book removed */}

          {/* Opening Header */}
          <View style={[styles.header, { position: 'absolute', top: insets.top + 10, left: 0, right: 0 }]}>
            <TouchableOpacity style={styles.backBtnCover} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={24} color="#5C250A" />
            </TouchableOpacity>
          </View>

          <Animated.View style={bookAnimatedStyle}>
            <Pressable onPress={handleOpenBook}>
              <Image 
                source={geeta3DImage} 
                style={styles.bookImage}
                resizeMode="contain"
              />
            </Pressable>
          </Animated.View>

          <View style={styles.instructionBadge}>
            <Ionicons name="sparkles" size={16} color="#B85D19" style={{ marginRight: 6 }} />
            <Text style={styles.instructionText}>
              {isHindi ? 'स्वाध्याय आरंभ करने हेतु स्पर्श करें ✨' : 'Tap to start journey'}
            </Text>
          </View>
        </LinearGradient>
      ) : (
        <View style={{ flex: 1, backgroundColor: nightMode ? '#140E0C' : '#F6EBDD' }}>
          {/* ── Top Header and Navigation ── */}
          <View
            style={[
              styles.navHeaderContainer,
              { paddingTop: insets.top + 4 },
              nightMode && styles.navHeaderContainerNight,
            ]}
          >
            {/* Top Row: Back, Centered Title, Subtitle, Actions */}
            <View style={styles.headerRow}>
              <TouchableOpacity
                style={[styles.compactBackBtn, nightMode && styles.compactBackBtnNight]}
                onPress={() => router.back()}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Ionicons name="chevron-back" size={22} color={nightMode ? '#E8D5C4' : '#743B27'} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.titleColumn}
                activeOpacity={0.8}
                onPress={() => setShowChapterIndex(true)}
              >
                <Text style={[styles.mainScriptureTitle, nightMode && styles.mainScriptureTitleNight]}>
                  श्रीमद्भगवद्गीता
                </Text>
                <Text style={[styles.subChapterSubtitle, nightMode && styles.subChapterSubtitleNight]}>
                  {`अध्याय ${currentChapter} · ${currentMeta.nameHi}`}
                </Text>
              </TouchableOpacity>

              <View style={styles.headerRightActions}>
                {/* Audio Recitation Speaker Icon */}
                <TouchableOpacity
                  style={[
                    styles.headerIconBtn,
                    nightMode && styles.headerIconBtnNight,
                    (isReciting || isAudioPlayerVisible) && (nightMode ? styles.headerIconBtnActiveNight : styles.headerIconBtnActive),
                  ]}
                  onPress={() => {
                    if (isReciting) {
                      stopRecitation();
                    } else if (isAudioPlayerVisible) {
                      setIsAudioPlayerVisible(false);
                    } else {
                      setIsAudioPlayerVisible(true);
                      startRecitingVerse(activeRecitingIndex ?? 0);
                    }
                  }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityLabel="श्लोक पाठ सुनें"
                >
                  <Ionicons
                    name={isReciting ? 'volume-high' : 'volume-medium-outline'}
                    size={20}
                    color={isReciting ? '#FF9933' : (nightMode ? '#E8D5C4' : '#743B27')}
                  />
                </TouchableOpacity>

                {/* Table of Contents Icon */}
                <TouchableOpacity
                  style={[styles.headerIconBtn, nightMode && styles.headerIconBtnNight]}
                  onPress={() => setShowChapterIndex(true)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="list-outline" size={20} color={nightMode ? '#E8D5C4' : '#743B27'} />
                </TouchableOpacity>

                {/* Bookmark Chapter Icon */}
                <TouchableOpacity
                  style={[styles.headerIconBtn, nightMode && styles.headerIconBtnNight]}
                  onPress={handleToggleBookmark}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons
                    name={isChapterBookmarked ? 'bookmark' : 'bookmark-outline'}
                    size={20}
                    color={isChapterBookmarked ? '#C6A16B' : (nightMode ? '#E8D5C4' : '#743B27')}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Horizontally Scrollable Chapter Selector */}
            <ScrollView
              ref={chapterScrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chapterSelectorRow}
            >
              {GITA_CHAPTERS_META.map((meta) => {
                const isActive = currentChapter === meta.num;
                return (
                  <TouchableOpacity
                    key={meta.num}
                    style={[
                      styles.chapterPill,
                      isActive && styles.chapterPillActive,
                      nightMode && styles.chapterPillNight,
                      isActive && nightMode && styles.chapterPillActiveNight,
                    ]}
                    onPress={() => handleChapterChange(meta.num)}
                    activeOpacity={0.85}
                  >
                    <Text
                      style={[
                        styles.chapterPillNumber,
                        isActive && styles.chapterPillNumberActive,
                        nightMode && styles.chapterPillNumberNight,
                        isActive && nightMode && styles.chapterPillNumberActiveNight,
                      ]}
                    >
                      {convertToHindiNumerals(meta.num)}
                    </Text>
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.chapterPillText,
                        isActive && styles.chapterPillTextActive,
                        nightMode && styles.chapterPillTextNight,
                        isActive && nightMode && styles.chapterPillTextActiveNight,
                      ]}
                    >
                      {meta.nameHi}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Mode Switcher: Classical Verses vs Cosmic Storyteller Mode */}
            <View style={[styles.modeSwitcherContainer, nightMode && styles.modeSwitcherContainerNight]}>
              <TouchableOpacity
                style={[
                  styles.modeTabBtn,
                  viewMode === 'classical' && styles.modeTabBtnActive,
                  nightMode && styles.modeTabBtnNight,
                  viewMode === 'classical' && nightMode && styles.modeTabBtnActiveNight,
                ]}
                onPress={() => setViewMode('classical')}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="book-outline"
                  size={14}
                  color={viewMode === 'classical' ? '#FFFFFF' : (nightMode ? '#E8D5C4' : '#743B27')}
                  style={{ marginRight: 4 }}
                />
                <Text
                  style={[
                    styles.modeTabText,
                    nightMode && styles.modeTabTextNight,
                    viewMode === 'classical' && styles.modeTabTextActive,
                  ]}
                >
                  शास्त्रीय श्लोक
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modeTabBtn,
                  viewMode === 'story' && styles.modeTabBtnStoryActive,
                  nightMode && styles.modeTabBtnNight,
                  viewMode === 'story' && styles.modeTabBtnStoryActive,
                ]}
                onPress={() => setViewMode('story')}
                activeOpacity={0.8}
              >
                <Text style={{ fontSize: 13, marginRight: 4 }}>⏳</Text>
                <Text
                  style={[
                    styles.modeTabText,
                    nightMode && styles.modeTabTextNight,
                    viewMode === 'story' && styles.modeTabTextStoryActive,
                  ]}
                >
                  कथा प्रवाह (मैं समय हूँ)
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Main Scrollable Reading Area ── */}
          <ScrollView
            ref={scrollViewRef}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: insets.bottom + 90 },
            ]}
            onScroll={handleScroll}
            onScrollEndDrag={commitProgress}
            onMomentumScrollEnd={commitProgress}
            scrollEventThrottle={16}
            onContentSizeChange={(_, h) => setContentHeight(h)}
            onLayout={(e) => setLayoutHeight(e.nativeEvent.layout.height)}
          >
            {viewMode === 'story' ? (
              storyLoading && !storyChapterData ? (
                <View style={styles.loadingContainer}>
                  <Text style={[styles.loadingText, { color: '#F59E0B' }]}>
                    काल-कथा प्रस्तुत हो रही है... ✨
                  </Text>
                </View>
              ) : storyChapterData ? (
                <GitaStoryView
                  chapterData={storyChapterData}
                  activeCueMark={activeCueMark}
                  activeCueSceneId={activeCueSceneId}
                  onPlayScene={(scene) => {
                    if (activeStoryScene?.scene_id === scene.scene_id && isPlaying) {
                      setActiveStoryScene(null);
                      setIsPlaying(false);
                    } else {
                      setActiveStoryScene(scene);
                    }
                  }}
                  onNavigateToStudy={() => {
                    setViewMode('classical');
                  }}
                />
              ) : (
                <View style={styles.loadingContainer}>
                  <Text style={[styles.loadingText, nightMode && styles.loadingTextNight]}>
                    इस अध्याय की कथा अभी उपलब्ध नहीं है।
                  </Text>
                </View>
              )
            ) : (
              <>
                {/* Chapter Intro Banner */}
                <View style={styles.chapterIntroBanner}>
                  <View style={styles.introOrnamentRow}>
                    <View style={[styles.introLine, nightMode && styles.introLineNight]} />
                    <Text style={[styles.introOmText, nightMode && styles.introOmTextNight]}>ॐ</Text>
                    <View style={[styles.introLine, nightMode && styles.introLineNight]} />
                  </View>
                  <Text style={[styles.introChapterNumber, nightMode && styles.introChapterNumberNight]}>
                    अथ {currentMeta.nameHi}
                  </Text>
                  <Text style={[styles.introSubtitle, nightMode && styles.introSubtitleNight]}>
                    {currentMeta.subtitle} • {convertToHindiNumerals(totalVerses || verses.length)} श्लोक
                  </Text>
                </View>

                {/* Verses List */}
                {loading ? (
                  <View style={styles.loadingContainer}>
                    <Text style={[styles.loadingText, nightMode && styles.loadingTextNight]}>
                      पवित्र श्लोक प्रस्तुत हो रहे हैं... ✨
                    </Text>
                  </View>
                ) : verses.length === 0 ? (
                  <View style={styles.loadingContainer}>
                    <Text style={[styles.loadingText, nightMode && styles.loadingTextNight]}>
                      इस अध्याय की सामग्री उपलब्ध नहीं है।
                    </Text>
                  </View>
                ) : (
                  verses.slice(0, visibleLimit).map((verse: any, index: number) => (
                    <VerseCard
                      key={`verse-${currentChapter}-${verse.verse || index}`}
                      verse={verse}
                      nightMode={nightMode}
                      index={index}
                      isLast={index === verses.length - 1}
                      bookId={BOOK_ID}
                      chapterNumber={currentChapter}
                      fontSizeScale={fontSizeScale}
                      isBookmarked={bookmarks.some(b => b.chapter === currentChapter && b.scrollY === verse.verse)}
                      onToggleBookmark={() => {
                        const title = `${currentMeta.nameHi} · श्लोक ${verse.verse}`;
                        toggleBookmark(BOOK_ID, currentChapter, Number(verse.verse) || 0, title);
                      }}
                      isPlayingAudio={activeRecitingIndex === index && isReciting}
                      onToggleAudio={(type) => {
                        if (activeRecitingIndex === index && isReciting) {
                          stopRecitation();
                        } else {
                          startRecitingVerse(index, type || reciteMode);
                        }
                      }}
                      onLayout={(event) => {
                        versePositionsRef.current[index] = event.nativeEvent.layout.y;
                      }}
                    />
                  ))
                )}
              </>
            )}

            {/* Chapter Footer Navigation */}
            <View style={styles.chapterFooterNav}>
              {currentChapter > 1 ? (
                <TouchableOpacity
                  style={[styles.footerNavButton, nightMode && styles.footerNavButtonNight]}
                  onPress={() => handleChapterChange(currentChapter - 1)}
                  activeOpacity={0.85}
                >
                  <Ionicons name="arrow-back" size={16} color={nightMode ? '#C6A16B' : '#743B27'} />
                  <Text style={[styles.footerNavText, nightMode && styles.footerNavTextNight]}>
                    पिछला अध्याय
                  </Text>
                </TouchableOpacity>
              ) : <View style={{ width: 120 }} />}

              {currentChapter < TOTAL_CHAPTERS ? (
                <TouchableOpacity
                  style={[styles.footerNavButton, nightMode && styles.footerNavButtonNight]}
                  onPress={() => handleChapterChange(currentChapter + 1)}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.footerNavText, nightMode && styles.footerNavTextNight]}>
                    अगला अध्याय
                  </Text>
                  <Ionicons name="arrow-forward" size={16} color={nightMode ? '#C6A16B' : '#743B27'} />
                </TouchableOpacity>
              ) : <View style={{ width: 120 }} />}
            </View>
          </ScrollView>

          {/* ── Floating Sacred Audio Recitation Bar ── */}
          {isAudioPlayerVisible && (
            <View
              style={[
                styles.floatingAudioBar,
                { bottom: insets.bottom + 65 },
                nightMode && styles.floatingAudioBarNight,
              ]}
            >
              {/* Left info badge */}
              <View style={styles.audioBarLeft}>
                <View style={[styles.audioPulseDot, isReciting && styles.audioPulseDotActive]}>
                  <Ionicons
                    name={isReciting ? 'volume-high' : 'volume-mute'}
                    size={14}
                    color="#FFFFFF"
                  />
                </View>
                <View style={styles.audioBarTextCol}>
                  <Text numberOfLines={1} style={[styles.audioBarTitle, nightMode && styles.audioBarTitleNight]}>
                    {activeRecitingIndex !== null
                      ? `श्लोक ${convertToHindiNumerals((verses[activeRecitingIndex]?.verse) || activeRecitingIndex + 1)} / ${convertToHindiNumerals(totalVerses || verses.length)}`
                      : 'पाठ तैयार है'}
                  </Text>
                  <Text numberOfLines={1} style={[styles.audioBarModeLabel, nightMode && styles.audioBarModeLabelNight]}>
                    {reciteMode === 'sanskrit'
                      ? 'संस्कृत श्लोक (शास्त्रीय पाठ)'
                      : reciteMode === 'hindi'
                      ? 'हिन्दी अनुवाद (मधुर स्वर)'
                      : reciteMode === 'english'
                      ? 'English (Divine Voice)'
                      : 'सम्पूर्ण पाठ (श्लोक व भावार्थ)'} · {reciteSpeed === 0.85 ? 'धीमी गति' : reciteSpeed === 1.0 ? 'सामान्य' : 'द्रुत गति'}
                  </Text>
                </View>
              </View>

              {/* Center playback controls */}
              <View style={styles.audioBarControls}>
                {/* Prev Verse */}
                <TouchableOpacity
                  style={styles.audioControlBtn}
                  disabled={!activeRecitingIndex || activeRecitingIndex <= 0}
                  onPress={() => activeRecitingIndex !== null && activeRecitingIndex > 0 && startRecitingVerse(activeRecitingIndex - 1)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons
                    name="play-skip-back"
                    size={16}
                    color={(!activeRecitingIndex || activeRecitingIndex <= 0) ? '#D0C2AF' : (nightMode ? '#E8D5C4' : '#743B27')}
                  />
                </TouchableOpacity>

                {/* Play / Pause Primary */}
                <TouchableOpacity
                  style={[styles.audioPlayPauseBtn, nightMode && styles.audioPlayPauseBtnNight]}
                  onPress={togglePlayPauseAudio}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={isReciting ? 'pause' : 'play'}
                    size={18}
                    color="#FFFFFF"
                  />
                </TouchableOpacity>

                {/* Next Verse */}
                <TouchableOpacity
                  style={styles.audioControlBtn}
                  disabled={activeRecitingIndex === null || activeRecitingIndex >= verses.length - 1}
                  onPress={() => activeRecitingIndex !== null && activeRecitingIndex < verses.length - 1 && startRecitingVerse(activeRecitingIndex + 1)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons
                    name="play-skip-forward"
                    size={16}
                    color={(activeRecitingIndex === null || activeRecitingIndex >= verses.length - 1) ? '#D0C2AF' : (nightMode ? '#E8D5C4' : '#743B27')}
                  />
                </TouchableOpacity>
              </View>

              {/* Right quick toggles: Mode + Speed + Close */}
              <View style={styles.audioBarRightActions}>
                {/* Recitation Mode Pill */}
                <TouchableOpacity
                  style={[styles.audioPillBtn, nightMode && styles.audioPillBtnNight]}
                  onPress={cycleReciteMode}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <Text style={[styles.audioPillText, nightMode && styles.audioPillTextNight]}>
                    {reciteMode === 'sanskrit' ? 'श्लोक' : reciteMode === 'hindi' ? 'अर्थ' : reciteMode === 'english' ? 'EN' : 'सर्व'}
                  </Text>
                </TouchableOpacity>

                {/* Speed Pill */}
                <TouchableOpacity
                  style={[styles.audioPillBtn, nightMode && styles.audioPillBtnNight]}
                  onPress={cycleReciteSpeed}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <Text style={[styles.audioPillText, nightMode && styles.audioPillTextNight]}>
                    {reciteSpeed === 0.85 ? '0.8x' : reciteSpeed === 1.0 ? '1.0x' : '1.2x'}
                  </Text>
                </TouchableOpacity>

                {/* Close floating bar */}
                <TouchableOpacity
                  style={styles.audioCloseBtn}
                  onPress={() => {
                    stopRecitation();
                    setIsAudioPlayerVisible(false);
                  }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close" size={17} color={nightMode ? '#B5A496' : '#8A7568'} />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ── Slim, Organized Bottom Reading Toolbar ── */}
          <View
            style={[
              styles.bottomToolbar,
              { paddingBottom: insets.bottom + 8 },
              nightMode && styles.bottomToolbarNight,
            ]}
          >
            {/* Subtle Progress Line */}
            <View
              style={styles.progressLineTrack}
              onLayout={(e) => setProgressTrackWidth(e.nativeEvent.layout.width)}
            >
              <View
                style={[
                  styles.progressLineFill,
                  { width: `${scrollProgress}%` },
                  nightMode && styles.progressLineFillNight,
                ]}
              />
            </View>

            {/* Toolbar Content Row */}
            <View style={styles.toolbarContent}>
              {/* Previous Chapter */}
              <TouchableOpacity
                style={[
                  styles.toolbarBtn,
                  currentChapter <= 1 && styles.toolbarBtnDisabled,
                  nightMode && styles.toolbarBtnNight,
                ]}
                disabled={currentChapter <= 1}
                onPress={() => handleChapterChange(currentChapter - 1)}
              >
                <Ionicons
                  name="chevron-back"
                  size={18}
                  color={currentChapter <= 1 ? '#C4B49A' : (nightMode ? '#E8D5C4' : '#743B27')}
                />
              </TouchableOpacity>

              {/* Reading Progress Indicator */}
              <TouchableOpacity
                style={styles.progressCenterBadge}
                onPress={() => setShowChapterIndex(true)}
              >
                <Text style={[styles.progressNumberText, nightMode && styles.progressNumberTextNight]}>
                  {`अध्याय ${convertToHindiNumerals(currentChapter)} / १८`}
                </Text>
                <Text style={[styles.progressPercentSub, nightMode && styles.progressPercentSubNight]}>
                  {`${Math.round(scrollProgress)}% पूर्ण`}
                </Text>
              </TouchableOpacity>

              {/* Next Chapter */}
              <TouchableOpacity
                style={[
                  styles.toolbarBtn,
                  currentChapter >= TOTAL_CHAPTERS && styles.toolbarBtnDisabled,
                  nightMode && styles.toolbarBtnNight,
                ]}
                disabled={currentChapter >= TOTAL_CHAPTERS}
                onPress={() => handleChapterChange(currentChapter + 1)}
              >
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={currentChapter >= TOTAL_CHAPTERS ? '#C4B49A' : (nightMode ? '#E8D5C4' : '#743B27')}
                />
              </TouchableOpacity>

              <View style={styles.toolbarDivider} />

              {/* Text Size Control */}
              <TouchableOpacity
                style={[styles.toolbarBtn, nightMode && styles.toolbarBtnNight]}
                onPress={cycleFontSize}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="text-outline" size={17} color={nightMode ? '#C6A16B' : '#743B27'} />
                <Text style={[styles.fontSizeLabel, nightMode && styles.fontSizeLabelNight]}>
                  {fontSizeScale === 1.15 ? 'L' : fontSizeScale === 0.9 ? 'S' : 'M'}
                </Text>
              </TouchableOpacity>

              {/* Day / Night Theme Toggle */}
              <TouchableOpacity
                style={[styles.toolbarBtn, nightMode && styles.toolbarBtnNight]}
                onPress={() => setNightMode(!nightMode)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons
                  name={nightMode ? 'sunny' : 'moon-outline'}
                  size={18}
                  color={nightMode ? '#FFDBB5' : '#743B27'}
                />
              </TouchableOpacity>

              {/* Audio Recitation Toggle */}
              <TouchableOpacity
                style={[
                  styles.toolbarBtn,
                  nightMode && styles.toolbarBtnNight,
                  (isReciting || isAudioPlayerVisible) && (nightMode ? styles.toolbarBtnActiveNight : styles.toolbarBtnActive),
                ]}
                onPress={() => {
                  if (isReciting) {
                    stopRecitation();
                  } else if (isAudioPlayerVisible) {
                    setIsAudioPlayerVisible(false);
                  } else {
                    setIsAudioPlayerVisible(true);
                    startRecitingVerse(activeRecitingIndex ?? 0);
                  }
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityLabel="श्लोक पाठ सुनें"
              >
                <Ionicons
                  name={isReciting ? 'volume-high' : 'volume-medium-outline'}
                  size={18}
                  color={isReciting ? '#FF9933' : (nightMode ? '#E8D5C4' : '#743B27')}
                />
              </TouchableOpacity>

              {/* Saved Bookmarks Modal Trigger */}
              <TouchableOpacity
                style={[styles.toolbarBtn, nightMode && styles.toolbarBtnNight]}
                onPress={() => setShowBookmarksMenu(true)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons
                  name="bookmarks-outline"
                  size={18}
                  color={nightMode ? '#E8D5C4' : '#743B27'}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Floating Story Audio Player in Story Mode */}
          {viewMode === 'story' && activeStoryScene && (
            <StoryAudioPlayer
              chapter={currentChapter}
              scene={activeStoryScene}
              onCueActive={(mark, cueSceneId) => {
                setActiveCueMark(mark);
                if (cueSceneId) {
                  setActiveCueSceneId(cueSceneId);
                }
              }}
              onSceneComplete={handleStorySceneComplete}
              onClose={() => {
                setActiveStoryScene(null);
                setIsPlaying(false);
              }}
              autoPlay={true}
            />
          )}
        </View>
      )}

      {/* ── Chapter Index / Table of Contents Modal ── */}
      <Modal visible={showChapterIndex} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, nightMode && styles.modalContentNight]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, nightMode && styles.modalTitleNight]}>
                  अध्याय सूची (अनुक्रमणिका)
                </Text>
                <Text style={[styles.modalSubtitle, nightMode && styles.modalSubtitleNight]}>
                  श्रीमद्भगवद्गीता के १८ अध्याय
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowChapterIndex(false)} style={styles.closeModalBtn}>
                <Ionicons name="close" size={22} color={nightMode ? '#E8D5C4' : '#743B27'} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {GITA_CHAPTERS_META.map((meta) => {
                const isCurrent = meta.num === currentChapter;
                return (
                  <TouchableOpacity
                    key={meta.num}
                    style={[
                      styles.chapterIndexItem,
                      isCurrent && styles.chapterIndexItemActive,
                      nightMode && styles.chapterIndexItemNight,
                      isCurrent && nightMode && styles.chapterIndexItemActiveNight,
                    ]}
                    onPress={() => {
                      setShowChapterIndex(false);
                      handleChapterChange(meta.num);
                    }}
                  >
                    <View style={[styles.chapterNumberCircle, isCurrent && styles.chapterNumberCircleActive]}>
                      <Text style={[styles.chapterNumberCircleText, isCurrent && styles.chapterNumberCircleTextActive]}>
                        {convertToHindiNumerals(meta.num)}
                      </Text>
                    </View>
                    <View style={styles.chapterIndexMeta}>
                      <Text style={[styles.chapterIndexNameHi, nightMode && styles.chapterIndexNameHiNight]}>
                        {meta.nameHi}
                      </Text>
                      <Text style={[styles.chapterIndexNameEn, nightMode && styles.chapterIndexNameEnNight]}>
                        {meta.nameEn} • {meta.subtitle}
                      </Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color={isCurrent ? '#C6A16B' : (nightMode ? '#665749' : '#C2B4A3')}
                    />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── Saved Bookmarks Modal ── */}
      <Modal visible={showBookmarksMenu} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, nightMode && styles.modalContentNight]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, nightMode && styles.modalTitleNight]}>
                  {isHindi ? 'सहेजे गए श्लोक एवं अध्याय' : 'Saved Bookmarks'}
                </Text>
                <Text style={[styles.modalSubtitle, nightMode && styles.modalSubtitleNight]}>
                  स्वाध्याय के लिए सुरक्षित किए गए संदर्भ
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowBookmarksMenu(false)} style={styles.closeModalBtn}>
                <Ionicons name="close" size={22} color={nightMode ? '#E8D5C4' : '#743B27'} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {bookmarks.length === 0 ? (
                <View style={styles.emptyBookmarksWrapper}>
                  <Ionicons name="bookmark-outline" size={44} color="#C6A16B" style={{ opacity: 0.6 }} />
                  <Text style={[styles.emptyBookmarks, nightMode && styles.emptyBookmarksNight]}>
                    {isHindi ? 'अभी तक कोई श्लोक सहेजा नहीं गया है।' : 'No bookmarks saved yet.'}
                  </Text>
                  <Text style={[styles.emptyBookmarksSub, nightMode && styles.emptyBookmarksSubNight]}>
                    किसी भी श्लोक के पास दिए गए चिह्न पर स्पर्श करके सहेजें।
                  </Text>
                </View>
              ) : (
                bookmarks.map((bm, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.bookmarkItem, nightMode && styles.bookmarkItemNight]}
                    onPress={() => {
                      setShowBookmarksMenu(false);
                      handleChapterChange(bm.chapter);
                    }}
                  >
                    <View style={styles.bookmarkItemLeft}>
                      <Ionicons name="bookmark" size={20} color="#C6A16B" />
                      <View style={{ marginLeft: 12 }}>
                        <Text style={[styles.bookmarkItemTitle, nightMode && styles.bookmarkItemTitleNight]}>
                          {bm.title || `अध्याय ${bm.chapter}`}
                        </Text>
                        <Text style={[styles.bookmarkItemSub, nightMode && styles.bookmarkItemSubNight]}>
                          {`अध्याय ${convertToHindiNumerals(bm.chapter)}`}
                        </Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#C6A16B" />
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F6EBDD', // Warm ivory
  },
  rootNight: {
    backgroundColor: '#140E0C',
  },

  /* 3D Cover Screen */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  backBtnCover: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  glowBackground: {
    position: 'absolute',
    width: SCREEN_WIDTH * 0.9,
    height: SCREEN_WIDTH * 0.9,
    borderRadius: SCREEN_WIDTH * 0.45,
    backgroundColor: 'rgba(198, 161, 107, 0.15)', // Muted gold divine glow
    alignSelf: 'center',
    top: SCREEN_HEIGHT * 0.18,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 60,
  },
  bookTouchArea: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookImage: {
    width: SCREEN_WIDTH * 0.82,
    height: SCREEN_HEIGHT * 0.58,
  },
  instructionBadge: {
    position: 'absolute',
    bottom: 50,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(38, 20, 10, 0.85)',
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(198, 161, 107, 0.4)',
  },
  instructionText: {
    color: '#EBD7B6',
    fontSize: 13.5,
    fontWeight: '600',
    letterSpacing: 0.3,
  },

  /* Navigation Header */
  navHeaderContainer: {
    backgroundColor: '#F6EBDD',
    borderBottomWidth: 1,
    borderBottomColor: '#E3D4BC', // Clean divider
    zIndex: 20,
  },
  navHeaderContainerNight: {
    backgroundColor: '#1A1210',
    borderBottomColor: 'rgba(227, 212, 188, 0.15)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  compactBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(116, 59, 39, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactBackBtnNight: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  titleColumn: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 8,
  },
  mainScriptureTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#743B27', // Temple brown
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    letterSpacing: 0.2,
  },
  mainScriptureTitleNight: {
    color: '#F4ECE0',
  },
  subChapterSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#796858',
    marginTop: 2,
  },
  subChapterSubtitleNight: {
    color: '#C6A16B',
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(116, 59, 39, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  headerIconBtnNight: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerIconBtnActive: {
    backgroundColor: 'rgba(232, 154, 60, 0.2)',
  },
  headerIconBtnActiveNight: {
    backgroundColor: 'rgba(255, 165, 52, 0.25)',
  },

  /* Horizontal Chapter Selector */
  chapterSelectorRow: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: 'center',
  },
  chapterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#FFFCF6',
    borderWidth: 1,
    borderColor: '#E3D4BC',
  },
  chapterPillActive: {
    backgroundColor: 'rgba(198, 161, 107, 0.22)',
    borderColor: '#743B27',
  },
  chapterPillNight: {
    backgroundColor: '#261D19',
    borderColor: 'rgba(227, 212, 188, 0.15)',
  },
  chapterPillActiveNight: {
    backgroundColor: 'rgba(198, 161, 107, 0.3)',
    borderColor: '#C6A16B',
  },
  chapterPillNumber: {
    fontSize: 11,
    fontWeight: '700',
    color: '#796858',
    marginRight: 5,
  },
  chapterPillNumberActive: {
    color: '#743B27',
  },
  chapterPillNumberNight: {
    color: '#A8927F',
  },
  chapterPillNumberActiveNight: {
    color: '#F4ECE0',
  },
  chapterPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#796858',
  },
  chapterPillTextActive: {
    color: '#743B27',
    fontWeight: '700',
  },
  chapterPillTextNight: {
    color: '#A8927F',
  },
  chapterPillTextActiveNight: {
    color: '#F4ECE0',
    fontWeight: '700',
  },

  /* Mode Switcher: Classical Verses vs Cosmic Storyteller Mode */
  modeSwitcherContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(116, 59, 39, 0.04)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(116, 59, 39, 0.08)',
  },
  modeSwitcherContainerNight: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  modeTabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(116, 59, 39, 0.25)',
    backgroundColor: 'transparent',
  },
  modeTabBtnNight: {
    borderColor: 'rgba(232, 213, 196, 0.2)',
  },
  modeTabBtnActive: {
    backgroundColor: '#743B27',
    borderColor: '#743B27',
  },
  modeTabBtnActiveNight: {
    backgroundColor: '#C6A16B',
    borderColor: '#C6A16B',
  },
  modeTabBtnStoryActive: {
    backgroundColor: '#78350F',
    borderColor: '#F59E0B',
  },
  modeTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#743B27',
  },
  modeTabTextNight: {
    color: '#E8D5C4',
  },
  modeTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  modeTabTextStoryActive: {
    color: '#FEF3C7',
    fontWeight: '700',
  },

  /* Scrollable Reading Content */
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 16,
  },
  chapterIntroBanner: {
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 10,
  },
  introOrnamentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  introLine: {
    width: 36,
    height: 1,
    backgroundColor: '#C6A16B',
    opacity: 0.6,
  },
  introLineNight: {
    backgroundColor: 'rgba(198, 161, 107, 0.3)',
  },
  introOmText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#743B27',
    marginHorizontal: 12,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  introOmTextNight: {
    color: '#C6A16B',
  },
  introChapterNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#743B27',
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  introChapterNumberNight: {
    color: '#F4ECE0',
  },
  introSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#796858',
  },
  introSubtitleNight: {
    color: '#A8927F',
  },

  /* Loading State */
  loadingContainer: {
    paddingVertical: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#743B27',
  },
  loadingTextNight: {
    color: '#C6A16B',
  },

  /* Chapter Footer Navigation */
  chapterFooterNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 20,
  },
  footerNavButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#FFFCF6',
    borderWidth: 1,
    borderColor: '#E3D4BC',
  },
  footerNavButtonNight: {
    backgroundColor: '#261D19',
    borderColor: 'rgba(227, 212, 188, 0.15)',
  },
  footerNavText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#743B27',
    marginHorizontal: 6,
  },
  footerNavTextNight: {
    color: '#C6A16B',
  },

  /* Slim Bottom Reading Toolbar */
  bottomToolbar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(246, 235, 221, 0.96)',
    borderTopWidth: 1,
    borderTopColor: '#E3D4BC',
    zIndex: 30,
  },
  bottomToolbarNight: {
    backgroundColor: 'rgba(20, 14, 12, 0.96)',
    borderTopColor: 'rgba(227, 212, 188, 0.12)',
  },
  progressLineTrack: {
    height: 3,
    backgroundColor: 'rgba(116, 59, 39, 0.1)',
    width: '100%',
  },
  progressLineFill: {
    height: '100%',
    backgroundColor: '#C6A16B', // Muted gold
  },
  progressLineFillNight: {
    backgroundColor: '#C6A16B',
  },
  toolbarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 8,
  },
  toolbarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(116, 59, 39, 0.06)',
  },
  toolbarBtnNight: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  toolbarBtnActive: {
    backgroundColor: 'rgba(232, 154, 60, 0.2)',
  },
  toolbarBtnActiveNight: {
    backgroundColor: 'rgba(255, 165, 52, 0.25)',
  },
  toolbarBtnDisabled: {
    opacity: 0.35,
  },
  progressCenterBadge: {
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  progressNumberText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#743B27',
  },
  progressNumberTextNight: {
    color: '#F4ECE0',
  },
  progressPercentSub: {
    fontSize: 10.5,
    fontWeight: '500',
    color: '#796858',
    marginTop: 1,
  },
  progressPercentSubNight: {
    color: '#C6A16B',
  },
  toolbarDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#E3D4BC',
    marginHorizontal: 4,
  },
  fontSizeLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#743B27',
    marginLeft: 2,
  },
  fontSizeLabelNight: {
    color: '#C6A16B',
  },

  /* Modals */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#F6EBDD',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '75%',
    padding: 20,
  },
  modalContentNight: {
    backgroundColor: '#1E1613',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E3D4BC',
    marginBottom: 14,
  },
  closeModalBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(116, 59, 39, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#743B27',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  modalTitleNight: {
    color: '#F4ECE0',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#796858',
    marginTop: 2,
  },
  modalSubtitleNight: {
    color: '#C6A16B',
  },
  modalScroll: {
    flex: 1,
  },

  /* Chapter Index Items */
  chapterIndexItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    backgroundColor: '#FFFCF6',
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E3D4BC',
  },
  chapterIndexItemActive: {
    backgroundColor: 'rgba(198, 161, 107, 0.18)',
    borderColor: '#743B27',
  },
  chapterIndexItemNight: {
    backgroundColor: '#261D19',
    borderColor: 'rgba(227, 212, 188, 0.12)',
  },
  chapterIndexItemActiveNight: {
    backgroundColor: 'rgba(198, 161, 107, 0.25)',
    borderColor: '#C6A16B',
  },
  chapterNumberCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(116, 59, 39, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  chapterNumberCircleActive: {
    backgroundColor: '#743B27',
  },
  chapterNumberCircleText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#743B27',
  },
  chapterNumberCircleTextActive: {
    color: '#FFFFFF',
  },
  chapterIndexMeta: {
    flex: 1,
  },
  chapterIndexNameHi: {
    fontSize: 15,
    fontWeight: '700',
    color: '#743B27',
    marginBottom: 2,
  },
  chapterIndexNameHiNight: {
    color: '#F4ECE0',
  },
  chapterIndexNameEn: {
    fontSize: 12,
    color: '#796858',
  },
  chapterIndexNameEnNight: {
    color: '#A8927F',
  },

  /* Bookmarks Items */
  emptyBookmarksWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyBookmarks: {
    fontSize: 16,
    fontWeight: '700',
    color: '#743B27',
    marginTop: 14,
  },
  emptyBookmarksNight: {
    color: '#F4ECE0',
  },
  emptyBookmarksSub: {
    fontSize: 13,
    color: '#796858',
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 24,
  },
  emptyBookmarksSubNight: {
    color: '#A8927F',
  },
  bookmarkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 14,
    backgroundColor: '#FFFCF6',
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E3D4BC',
  },
  bookmarkItemNight: {
    backgroundColor: '#261D19',
    borderColor: 'rgba(227, 212, 188, 0.12)',
  },
  bookmarkItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  bookmarkItemTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#743B27',
  },
  bookmarkItemTitleNight: {
    color: '#F4ECE0',
  },
  bookmarkItemSub: {
    fontSize: 12,
    color: '#796858',
    marginTop: 2,
  },
  bookmarkItemSubNight: {
    color: '#C6A16B',
  },

  /* Floating Audio Bar */
  floatingAudioBar: {
    position: 'absolute',
    left: 14,
    right: 14,
    backgroundColor: 'rgba(255, 252, 246, 0.96)',
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: '#E89A3C',
    shadowColor: '#743B27',
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
    zIndex: 99,
  },
  floatingAudioBarNight: {
    backgroundColor: 'rgba(32, 24, 20, 0.96)',
    borderColor: '#FFA534',
    shadowColor: '#000',
    shadowOpacity: 0.4,
  },
  audioBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 6,
  },
  audioPulseDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#8A7568',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  audioPulseDotActive: {
    backgroundColor: '#E89A3C',
  },
  audioBarTextCol: {
    flex: 1,
  },
  audioBarTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#743B27',
  },
  audioBarTitleNight: {
    color: '#FFDBB5',
  },
  audioBarModeLabel: {
    fontSize: 11,
    color: '#8A7568',
    marginTop: 1,
  },
  audioBarModeLabelNight: {
    color: '#A8927F',
  },
  audioBarControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginRight: 8,
  },
  audioControlBtn: {
    padding: 6,
  },
  audioPlayPauseBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#E89A3C',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#E89A3C',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  audioPlayPauseBtnNight: {
    backgroundColor: '#FFA534',
  },
  audioBarRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  audioPillBtn: {
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#F3E8D7',
    borderWidth: 0.5,
    borderColor: '#E2D2BD',
  },
  audioPillBtnNight: {
    backgroundColor: '#352720',
    borderColor: 'rgba(198, 161, 107, 0.3)',
  },
  audioPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#743B27',
  },
  audioPillTextNight: {
    color: '#FFD9B3',
  },
  audioCloseBtn: {
    padding: 5,
    marginLeft: 2,
  },
});
