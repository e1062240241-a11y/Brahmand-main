import React, { useEffect, useState, useRef } from 'react';
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
  ActivityIndicator,
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
} from 'react-native-reanimated';
import { useScriptureStore } from '../../src/store/scriptureStore';
import { useLibraryStore } from '../../src/store/libraryStore';
import { getRamayanChapter } from '../../src/services/api';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// We use the new 3D Ramayan image provided by the user
const geeta3DImage = require('../../assets/images/tab bar/books/Ramayana.png');
// Custom bookmark icons
const bookmarkIconImage = require('../../assets/images/bookmark_icon.png');
const bookmarkIconFilledImage = require('../../assets/images/bookmark_icon_filled.png');

const BOOK_ID = 'ramayan';
const TOTAL_CHAPTERS = 7;

const KANDA_NAMES = [
  'बालकाण्ड',
  'अयोध्याकाण्ड',
  'अरण्यकाण्ड',
  'किष्किन्धाकाण्ड',
  'सुन्दरकाण्ड',
  'युद्धकाण्ड',
  'उत्तरकाण्ड'
];

export default function RamayanPage() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [isOpened, setIsOpened] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  
  const { updateProgress } = useLibraryStore();
  const { getBookProgress, setLastRead, toggleBookmark } = useScriptureStore();
  
  const progress = getBookProgress(BOOK_ID);
  const { lastReadChapter, lastReadScrollY, bookmarks } = progress;
  
  const [currentChapter, setCurrentChapter] = useState(lastReadChapter || 1);
  const [showBookmarksMenu, setShowBookmarksMenu] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [nightMode, setNightMode] = useState(false);
  
  const [contentHeight, setContentHeight] = useState(0);
  const [layoutHeight, setLayoutHeight] = useState(0);
  const [progressTrackWidth, setProgressTrackWidth] = useState(0);

  const [loading, setLoading] = useState(false);
  const [verses, setVerses] = useState<any[]>([]);
  const [totalVerses, setTotalVerses] = useState(0);
  const [initialScrollRestored, setInitialScrollRestored] = useState(false);
  
  const isBookmarked = bookmarks.some(b => b.chapter === currentChapter);

  const handleToggleBookmark = () => {
    const title = KANDA_NAMES[currentChapter - 1] || `काण्ड ${currentChapter}`;
    toggleBookmark(BOOK_ID, currentChapter, 0, title);
  };

  const handleScroll = (event: any) => {
    const scrollY = event.nativeEvent.contentOffset.y;
    const contentH = event.nativeEvent.contentSize.height;
    const layoutH = event.nativeEvent.layoutMeasurement.height;
    const scrollableHeight = contentH - layoutH;
    const progressVal = scrollableHeight > 0 ? (scrollY / scrollableHeight) * 100 : 0;
    const clampedProgress = Math.min(Math.max(progressVal, 0), 100);
    
    setScrollProgress(clampedProgress);
    setLastRead(BOOK_ID, currentChapter, scrollY, clampedProgress);
    
    // Update Library Store
    updateProgress({
      id: BOOK_ID,
      chapterName: KANDA_NAMES[currentChapter - 1] || `काण्ड ${currentChapter}`,
      chapterNum: currentChapter,
      lastReadPage: Math.max(1, Math.min(Math.ceil(contentH / (layoutH || 1)), Math.ceil((clampedProgress / 100) * Math.max(1, Math.ceil(contentH / (layoutH || 1)) - 1)) + 1)),
      totalPages: Math.max(1, Math.ceil(contentH / (layoutH || 1))),
      progressPercent: clampedProgress,
      lastOpenedTime: Date.now(),
    });
  };

  const handleChapterChange = (chNum: number) => {
    setCurrentChapter(chNum);
    setLastRead(BOOK_ID, chNum, 0, 0);
    setInitialScrollRestored(false);
    scrollViewRef.current?.scrollTo({ y: 0, animated: false });
  };

  // Fetch chapter data from Backend
  const fetchChapterData = async (chNum: number) => {
    setLoading(true);
    try {
      const response = await getRamayanChapter(chNum);
      if (response && response.data) {
        setVerses(response.data.verses || []);
        setTotalVerses(response.data.total_verses || 0);
      }
    } catch (error) {
      console.error('Failed to fetch chapter:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpened) {
      fetchChapterData(currentChapter);
    }
  }, [currentChapter, isOpened]);

  // Restore scroll position after loaded
  useEffect(() => {
    if (isOpened && !loading && verses.length > 0 && !initialScrollRestored) {
      if (lastReadScrollY > 0) {
        setTimeout(() => {
          scrollViewRef.current?.scrollTo({ y: lastReadScrollY, animated: true });
        }, 300);
      }
      setInitialScrollRestored(true);
    }
  }, [isOpened, loading, verses, initialScrollRestored]);

  // Animation values
  const floatingY = useSharedValue(0);
  const openProgress = useSharedValue(0);
  const glowOpacity = useSharedValue(0);

  useEffect(() => {
    // Start subtle floating animation while idle
    floatingY.value = withRepeat(
      withSequence(
        withTiming(-12, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
  }, []);

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
      <StatusBar translucent backgroundColor="transparent" barStyle={nightMode ? "light-content" : "dark-content"} />
      
      {!isOpened ? (
        <View style={styles.contentContainer}>
          {/* Subtle Glow behind the book */}
          <Animated.View style={[StyleSheet.absoluteFillObject, { justifyContent: 'center', alignItems: 'center' }, glowAnimatedStyle]}>
            <LinearGradient
              colors={['rgba(255, 107, 0, 0.25)', 'transparent']}
              style={{ width: SCREEN_WIDTH * 0.9, height: SCREEN_WIDTH * 0.9, borderRadius: SCREEN_WIDTH * 0.45 }}
            />
          </Animated.View>

          {/* Opening Header */}
          <View style={[styles.header, { position: 'absolute', top: insets.top + 10, left: 0, right: 0 }]}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
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
            <Text style={styles.instructionText}>यात्रा शुरू करने के लिए छुएं</Text>
          </View>
        </View>
      ) : (
        <Animated.View style={[StyleSheet.absoluteFillObject, readingScreenStyle]}>
          <ImageBackground source={require('../../assets/images/clean_parchment_bg.png')} style={styles.root}>
            {/* Sticky Top Header Container */}
            <View style={[styles.stickyTopHeader, { 
              paddingTop: insets.top + 10,
              backgroundColor: nightMode ? 'rgba(30, 20, 15, 0.95)' : 'rgba(234, 209, 163, 0.9)',
              borderBottomColor: nightMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(140, 58, 0, 0.1)'
            }]}>
              {/* Back Button */}
              <TouchableOpacity 
                style={[styles.iconBtnWrapper, nightMode && styles.iconBtnWrapperNight]} 
                onPress={() => router.back()}
              >
                <Ionicons name="chevron-back" size={24} color={nightMode ? "#FFD5B8" : "#5C250A"} />
              </TouchableOpacity>

              {/* Title Header sticky in center */}
              <View style={styles.stickyChapterTitle}>
                <Text style={[styles.headerText, nightMode && styles.textNightLight]}>* रामायण *</Text>
                <Text style={[styles.headerText, nightMode && styles.textNightLight]}>* {KANDA_NAMES[currentChapter - 1]} *</Text>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {/* View All Bookmarks Button */}
                <TouchableOpacity 
                  style={[styles.iconBtnWrapper, { marginRight: 8 }, nightMode && styles.iconBtnWrapperNight]} 
                  onPress={() => setShowBookmarksMenu(true)}
                >
                  <Ionicons name="list" size={24} color={nightMode ? "#FFD5B8" : "#5C250A"} />
                </TouchableOpacity>

                {/* Bookmark Button */}
                <TouchableOpacity 
                  style={[styles.iconBtnWrapper, nightMode && styles.iconBtnWrapperNight]} 
                  onPress={handleToggleBookmark}
                >
                  <Image 
                    source={isBookmarked ? bookmarkIconFilledImage : bookmarkIconImage} 
                    style={{
                      width: 26, 
                      height: 26, 
                      tintColor: isBookmarked ? (nightMode ? '#FFD5B8' : '#8C3A00') : (nightMode ? '#887766' : '#A09B93'),
                      opacity: isBookmarked ? 1 : 0.7
                    }} 
                  />
                </TouchableOpacity>
              </View>
            </View>

          <ScrollView
            ref={scrollViewRef}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            onContentSizeChange={(_, h) => setContentHeight(h)}
            onLayout={(e) => setLayoutHeight(e.nativeEvent.layout.height)}
          >
            <View style={styles.pageContent}>
              {/* Chapter Navigator */}
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chapterNavContainer}
              >
                {Array.from({ length: TOTAL_CHAPTERS }, (_, i) => i + 1).map((chNum) => (
                  <TouchableOpacity
                    key={chNum}
                    style={[
                      styles.chapterTab,
                      nightMode && styles.chapterTabNight,
                      currentChapter === chNum && (nightMode ? styles.chapterTabActiveNight : styles.chapterTabActive)
                    ]}
                    onPress={() => handleChapterChange(chNum)}
                  >
                    <Text style={[
                      styles.chapterTabText,
                      nightMode && styles.textNightMuted,
                      currentChapter === chNum && (nightMode ? styles.textNight : styles.chapterTabTextActive)
                    ]}>
                      {KANDA_NAMES[chNum - 1]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Subtitle */}
              <View style={styles.chapterSubHeader}>
                <Text style={[styles.subHeaderText, nightMode && styles.textNight]}>
                  {verses.length > 0 ? `कुल सर्ग: ${convertToHindiNumerals(totalVerses || verses.length)}` : ''}
                </Text>
              </View>

              {/* Verses */}
              {loading ? (
                <View style={{ flex: 1, paddingVertical: 120, justifyContent: 'center', alignItems: 'center' }}>
                  <ActivityIndicator size="large" color={nightMode ? "#FFD5B8" : "#8C3A00"} />
                  <Text style={[{ marginTop: 16, fontSize: 16, fontWeight: '600' }, nightMode ? styles.textNightLight : { color: '#8C3A00' }]}>
                    पाठ्य सामग्री लोड हो रही है...
                  </Text>
                </View>
              ) : verses.length === 0 ? (
                <View style={{ flex: 1, paddingVertical: 120, justifyContent: 'center', alignItems: 'center' }}>
                  <Text style={[{ fontSize: 16, fontWeight: '600' }, nightMode ? styles.textNightLight : { color: '#8C3A00' }]}>
                    सामग्री लोड करने में विफल। कृपया पुनः प्रयास करें।
                  </Text>
                </View>
              ) : (
                verses.map((verse: any, index: number) => (
                  <View key={verse.verse || index} style={styles.verseContainer}>
                    {/* Sanskrit Text */}
                    <View style={styles.sanskritWrapper}>
                      <Text style={[styles.sanskritText, nightMode && styles.textNight]}>{verse.text}</Text>
                      <Text style={[styles.sanskritVerseNumber, nightMode && styles.textNight]}>{convertToHindiNumerals(verse.verse)}</Text>
                    </View>

                    {/* Hindi Translation */}
                    {(verse.translations?.hindi || verse.translations?.english) ? (
                      <Text style={[styles.hindiText, nightMode && styles.textNightMuted]}>
                        <Text style={[styles.hindiVerseNumber, nightMode && styles.textNight]}>{convertToHindiNumerals(verse.verse)}. </Text>
                        {verse.translations.hindi || verse.translations.english}
                      </Text>
                    ) : null}

                    {/* Divider */}
                    {index < verses.length - 1 && (
                      <View style={styles.dividerContainer}>
                        <View style={[styles.dividerLine, nightMode && { backgroundColor: '#6e4733' }]} />
                        <View style={[styles.dividerDot, nightMode && { backgroundColor: '#6e4733' }]} />
                        <View style={[styles.dividerLine, nightMode && { backgroundColor: '#6e4733' }]} />
                      </View>
                    )}
                  </View>
                ))
              )}
              
              {/* Bottom Chapter Navigation */}
              <View style={styles.bottomNavContainer}>
                {currentChapter > 1 ? (
                  <TouchableOpacity style={[styles.bottomNavBtn, nightMode && styles.bottomNavBtnNight]} onPress={() => handleChapterChange(currentChapter - 1)}>
                    <Ionicons name="arrow-back" size={16} color={nightMode ? "#EBD7B6" : "#691F0A"} />
                    <Text style={[styles.bottomNavText, nightMode && styles.textNight]}>पिछला काण्ड</Text>
                  </TouchableOpacity>
                ) : <View style={{ width: 100 }} />}
                
                {currentChapter < TOTAL_CHAPTERS ? (
                  <TouchableOpacity style={[styles.bottomNavBtn, nightMode && styles.bottomNavBtnNight]} onPress={() => handleChapterChange(currentChapter + 1)}>
                    <Text style={[styles.bottomNavText, nightMode && styles.textNight]}>अगला काण्ड</Text>
                    <Ionicons name="arrow-forward" size={16} color={nightMode ? "#EBD7B6" : "#691F0A"} />
                  </TouchableOpacity>
                ) : <View style={{ width: 100 }} />}
              </View>
              
              <View style={styles.bottomPadding} />
            </View>
          </ScrollView>

          {/* Fixed Bottom Bar */}
          <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12, backgroundColor: nightMode ? 'rgba(30, 20, 15, 0.95)' : 'rgba(234, 209, 163, 0.95)', borderTopColor: nightMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(140, 58, 0, 0.1)' }]}>
            <View style={styles.bottomBarContent}>
              <TouchableOpacity onPress={() => setNightMode(!nightMode)} style={[styles.iconBtnWrapper, nightMode && styles.iconBtnWrapperNight, { width: 36, height: 36 }]}>
                <Ionicons name={nightMode ? "sunny" : "moon"} size={18} color={nightMode ? "#FFD5B8" : "#5C250A"} />
              </TouchableOpacity>
              
              <View style={styles.sliderWrapper}>
                <Text style={[styles.pageIndicatorText, nightMode && styles.textNight]}>
                  पृष्ठ {convertToHindiNumerals(Math.max(1, Math.min(Math.ceil(contentHeight / (layoutHeight || 1)), Math.ceil((scrollProgress / 100) * Math.max(1, Math.ceil(contentHeight / (layoutHeight || 1)) - 1)) + 1)))}
                </Text>
                <TouchableOpacity 
                  activeOpacity={1}
                  style={styles.bottomProgressBarContainer}
                  onLayout={(e) => setProgressTrackWidth(e.nativeEvent.layout.width)}
                  onPress={(e) => {
                    if (progressTrackWidth > 0 && contentHeight > 0 && layoutHeight > 0) {
                      const ratio = e.nativeEvent.locationX / progressTrackWidth;
                      const scrollableHeight = contentHeight - layoutHeight;
                      if (scrollableHeight > 0) {
                        const targetY = ratio * scrollableHeight;
                        scrollViewRef.current?.scrollTo({ y: targetY, animated: true });
                      }
                    }
                  }}
                >
                  <View style={[styles.bottomProgressBarTrack, { backgroundColor: nightMode ? 'rgba(255, 213, 184, 0.2)' : 'rgba(140, 58, 0, 0.1)' }]} pointerEvents="none" />
                  <View style={[styles.bottomProgressBarFill, { width: `${scrollProgress}%`, backgroundColor: nightMode ? '#FFD5B8' : '#8C3A00' }]} pointerEvents="none" />
                  <View style={[styles.progressThumb, { left: `${scrollProgress}%`, backgroundColor: nightMode ? '#FFD5B8' : '#8C3A00' }]} pointerEvents="none" />
                </TouchableOpacity>
              </View>
              
              <View style={{ width: 36 }} />
            </View>
          </View>
          </ImageBackground>
        </Animated.View>
      )}

      {/* Bookmarks Modal */}
      <Modal visible={showBookmarksMenu} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Saved Bookmarks</Text>
              <TouchableOpacity onPress={() => setShowBookmarksMenu(false)}>
                <Ionicons name="close" size={24} color="#5C250A" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalScroll}>
              {bookmarks.length === 0 ? (
                <Text style={styles.emptyBookmarks}>No bookmarks saved yet.</Text>
              ) : (
                bookmarks.map((bm, idx) => (
                  <TouchableOpacity 
                    key={idx} 
                    style={styles.bookmarkItem}
                    onPress={() => {
                      setShowBookmarksMenu(false);
                      handleChapterChange(bm.chapter);
                      setTimeout(() => {
                        scrollViewRef.current?.scrollTo({ y: bm.scrollY, animated: true });
                      }, 400);
                    }}
                  >
                    <View>
                      <Text style={styles.bookmarkItemTitle}>{bm.title}</Text>
                      <Text style={styles.bookmarkItemSub}>Chapter {bm.chapter}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#8C3A00" />
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
    backgroundColor: '#FFF3EB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingBottom: 14,
    zIndex: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  stickyTopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    zIndex: 20,
    backgroundColor: 'rgba(234, 209, 163, 0.9)', // Match parchment background slightly translucent
  },
  iconBtnWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBtnWrapperNight: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  stickyChapterTitle: {
    alignItems: 'center',
    flex: 1,
  },
  headerText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111111',
    lineHeight: 24,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 80,
  },
  bookImage: {
    width: SCREEN_WIDTH * 0.85,
    height: SCREEN_HEIGHT * 0.65,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: { width: 10, height: 20 },
  },
  instructionBadge: {
    position: 'absolute',
    bottom: 100,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 243, 235, 0.85)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFD5B8',
    shadowColor: '#B85D19',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  instructionText: {
    color: '#B85D19',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  /* Manuscript Reading UI Styles */
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 60,
  },
  pageContent: {
    flex: 1,
  },
  chapterNavContainer: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginBottom: 24,
    alignItems: 'center',
  },
  chapterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(140, 58, 0, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(140, 58, 0, 0.2)',
  },
  chapterTabActive: {
    backgroundColor: 'rgba(140, 58, 0, 0.15)',
    borderColor: '#8C3A00',
  },
  chapterTabNight: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  chapterTabActiveNight: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderColor: '#EBD7B6',
  },
  chapterTabText: {
    color: '#8C5A3C',
    fontWeight: '600',
    fontSize: 14,
  },
  chapterTabTextActive: {
    color: '#5C250A',
    fontWeight: '700',
  },
  textNight: {
    color: '#EBD7B6',
  },
  textNightLight: {
    color: '#FFD5B8',
  },
  textNightMuted: {
    color: '#C4B49A',
  },
  chapterSubHeader: {
    alignItems: 'center',
    marginBottom: 40,
  },
  subHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#691F0A',
    marginTop: 8,
  },
  verseContainer: {
    marginBottom: 24,
  },
  sanskritWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  sanskritText: {
    fontSize: 17,
    lineHeight: 28,
    color: '#691F0A',
    textAlign: 'center',
    fontWeight: '600',
  },
  sanskritVerseNumber: {
    fontSize: 16,
    color: '#691F0A',
    fontWeight: '600',
    marginLeft: 12,
    position: 'absolute',
    right: 0,
    bottom: 0,
  },
  hindiText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#3B3B3B',
    textAlign: 'justify',
  },
  hindiVerseNumber: {
    fontSize: 15,
    color: '#691F0A',
    fontWeight: '600',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    width: 40,
    height: 1,
    backgroundColor: '#8C5A3C',
  },
  dividerDot: {
    width: 6,
    height: 6,
    backgroundColor: '#8C5A3C',
    marginHorizontal: 12,
  },
  bottomPadding: {
    height: 60,
  },
  bottomNavContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    paddingHorizontal: 16,
  },
  bottomNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(140, 58, 0, 0.08)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(140, 58, 0, 0.2)',
  },
  bottomNavBtnNight: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  bottomNavText: {
    color: '#691F0A',
    fontWeight: '700',
    fontSize: 14,
    marginHorizontal: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF3EB',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '60%',
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -5 },
    elevation: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(140, 58, 0, 0.1)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#5C250A',
  },
  modalScroll: {
    flex: 1,
  },
  emptyBookmarks: {
    textAlign: 'center',
    color: '#A09B93',
    marginTop: 40,
    fontSize: 16,
  },
  bookmarkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: '#FFFCF9',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#8C3A00',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(140, 58, 0, 0.05)',
  },
  bookmarkItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3A281E',
    marginBottom: 4,
  },
  bookmarkItemSub: {
    fontSize: 14,
    color: '#8C5A3C',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    zIndex: 20,
    paddingTop: 12,
  },
  bottomBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  bottomProgressBarContainer: {
    height: 30,
    justifyContent: 'center',
    position: 'relative',
  },
  bottomProgressBarTrack: {
    height: 4,
    borderRadius: 2,
    width: '100%',
    position: 'absolute',
    top: 13,
  },
  bottomProgressBarFill: {
    height: 4,
    borderRadius: 2,
    position: 'absolute',
    left: 0,
    top: 13,
  },
  progressThumb: {
    position: 'absolute',
    top: 7,
    width: 16,
    height: 16,
    borderRadius: 8,
    marginLeft: -8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  sliderWrapper: {
    flex: 1,
    marginHorizontal: 16,
    justifyContent: 'center',
  },
  pageIndicatorText: {
    position: 'absolute',
    top: -16,
    width: '100%',
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '600',
    color: '#691F0A',
    opacity: 0.8,
  },
});
