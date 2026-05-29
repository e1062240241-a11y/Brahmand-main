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
import { useGitaStore } from '../../src/store/gitaStore';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// We use the new 3D Bhagavad Gita image provided by the user
const geeta3DImage = require('../../assets/images/bhagavad_gita_3d_new.png');
// Custom bookmark icons
const bookmarkIconImage = require('../../assets/images/bookmark_icon.png');
const bookmarkIconFilledImage = require('../../assets/images/bookmark_icon_filled.png');

// Load full original scripture data with all 18 chapters and 700 verses
import gitaDataJson from '../../assets/data/gita_data.json';
const GITA_DATA: Record<number, any> = gitaDataJson;

export default function BhagavadGita3DPage() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [isOpened, setIsOpened] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  
  const { lastReadChapter, lastReadScrollY, bookmarks, setLastRead, toggleBookmark } = useGitaStore();
  const [currentChapter, setCurrentChapter] = useState(lastReadChapter || 1);
  const [showBookmarksMenu, setShowBookmarksMenu] = useState(false);
  
  const isBookmarked = bookmarks.some(b => b.chapter === currentChapter);

  const handleToggleBookmark = () => {
    const title = GITA_DATA[currentChapter]?.title || `अध्याय ${currentChapter}`;
    toggleBookmark(currentChapter, 0, title);
  };

  const handleScroll = (event: any) => {
    const scrollY = event.nativeEvent.contentOffset.y;
    const contentHeight = event.nativeEvent.contentSize.height;
    const layoutHeight = event.nativeEvent.layoutMeasurement.height;
    const progress = (scrollY / (contentHeight - layoutHeight)) * 100;
    
    // Save progress instantly (zustand persist handles debouncing implicitly if set up, but frequent saves to AsyncStorage might be heavy. We'll throttle it visually)
    setLastRead(currentChapter, scrollY, Math.min(Math.max(progress, 0), 100));
  };

  const handleChapterChange = (chNum: number) => {
    setCurrentChapter(chNum);
    setLastRead(chNum, 0, 0);
    scrollViewRef.current?.scrollTo({ y: 0, animated: false });
  };

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
      // Automatically restore position smoothly after opening
      if (lastReadScrollY > 0) {
        setTimeout(() => {
          scrollViewRef.current?.scrollTo({ y: lastReadScrollY, animated: true });
        }, 100);
      }
    }, 1200);
  };

  const bookAnimatedStyle = useAnimatedStyle(() => {
    // Rotate cover from right to left like a book opening
    const rotateY = interpolate(openProgress.value, [0, 1], [0, -110]);
    // Move to the left so the spine stays somewhat grounded
    const translateX = interpolate(openProgress.value, [0, 1], [0, -SCREEN_WIDTH * 0.6]);
    // Bring it closer before fading
    const scale = interpolate(openProgress.value, [0, 0.5, 1], [1, 1.15, 1.4]);
    // Fade out the cover as it fully opens and transitions to pages
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
      <StatusBar translucent backgroundColor="transparent" barStyle={isOpened ? "dark-content" : "dark-content"} />

      {/* Ambient background matching book cover */}
      <LinearGradient
        colors={['#FF9B6A', '#FFD5B8', '#FFF3EB']}
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Glowing transition effect */}
      <Animated.View style={[StyleSheet.absoluteFillObject, glowAnimatedStyle, { zIndex: 5 }]} pointerEvents="none">
        <LinearGradient
          colors={['rgba(255, 230, 150, 0.8)', 'rgba(255, 200, 100, 0.4)', 'transparent']}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>

      {!isOpened ? (
        /* Closed Book State */
        <View style={StyleSheet.absoluteFillObject}>
          {/* Header with back button */}
          <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={24} color="#1B1C1C" />
            </TouchableOpacity>
          </View>
          <Pressable style={styles.contentContainer} onPress={handleOpenBook}>
            <Animated.Image
              source={geeta3DImage}
              style={[styles.bookImage, bookAnimatedStyle]}
              resizeMode="contain"
            />
            <Animated.View style={[styles.instructionBadge, { opacity: interpolate(openProgress.value, [0, 0.1], [1, 0]) }]}>
              <Ionicons name="hand-left-outline" size={16} color="#B85D19" style={{ marginRight: 6 }} />
              <Text style={styles.instructionText}>Tap to open</Text>
            </Animated.View>
          </Pressable>
        </View>
      ) : (
        /* Inside Pages - Sacred Manuscript UI */
        <Animated.View style={[StyleSheet.absoluteFillObject, readingScreenStyle]}>
          <ImageBackground
            source={require('../../assets/images/clean_parchment_bg.png')}
            style={StyleSheet.absoluteFillObject}
            resizeMode="cover"
          >
            {/* Subtle parchment texture overlay just to balance lighting if needed */}
            <LinearGradient
              colors={['rgba(140,58,0,0.05)', 'rgba(255,255,255,0.1)', 'rgba(140,58,0,0.1)']}
              style={StyleSheet.absoluteFillObject}
              pointerEvents="none"
            />
            
            {/* Sticky Top Header Container */}
            <View style={[styles.stickyTopHeader, { paddingTop: insets.top + 10 }]}>
              {/* Back Button */}
              <TouchableOpacity 
                style={styles.iconBtnWrapper} 
                onPress={() => router.back()}
              >
                <Ionicons name="chevron-back" size={24} color="#5C250A" />
              </TouchableOpacity>

              {/* Title Header sticky in center */}
              <View style={styles.stickyChapterTitle}>
                <Text style={styles.headerText}>* श्रीमद्भगवद्गीता *</Text>
                <Text style={styles.headerText}>* {GITA_DATA[currentChapter]?.title} *</Text>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {/* View All Bookmarks Button */}
                <TouchableOpacity 
                  style={[styles.iconBtnWrapper, { marginRight: 8 }]} 
                  onPress={() => setShowBookmarksMenu(true)}
                >
                  <Ionicons name="list" size={24} color="#5C250A" />
                </TouchableOpacity>

                {/* Bookmark Button */}
                <TouchableOpacity 
                  style={styles.iconBtnWrapper} 
                  onPress={handleToggleBookmark}
                >
                  <Image 
                    source={isBookmarked ? bookmarkIconFilledImage : bookmarkIconImage} 
                    style={{
                      width: 26, 
                      height: 26, 
                      tintColor: isBookmarked ? '#8C3A00' : '#A09B93',
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
            scrollEventThrottle={100}
          >
            <View style={styles.pageContent}>
              {/* Chapter Navigator */}
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chapterNavContainer}
              >
                {Array.from({ length: 18 }, (_, i) => i + 1).map((chNum) => (
                  <TouchableOpacity
                    key={chNum}
                    style={[
                      styles.chapterTab,
                      currentChapter === chNum && styles.chapterTabActive
                    ]}
                    onPress={() => handleChapterChange(chNum)}
                  >
                    <Text style={[
                      styles.chapterTabText,
                      currentChapter === chNum && styles.chapterTabTextActive
                    ]}>
                      अध्याय {convertToHindiNumerals(chNum)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Subtitle */}
              <View style={styles.chapterSubHeader}>
                <Text style={styles.subHeaderText}>{GITA_DATA[currentChapter]?.name}</Text>
              </View>

              {/* Verses */}
              {GITA_DATA[currentChapter]?.verses.map((verse: any, index: number) => (
                <View key={verse.id} style={styles.verseContainer}>
                  {/* Sanskrit Text */}
                  <View style={styles.sanskritWrapper}>
                    <Text style={styles.sanskritText}>{verse.sanskrit}</Text>
                    <Text style={styles.sanskritVerseNumber}>{convertToHindiNumerals(verse.id)}</Text>
                  </View>

                  {/* Hindi Translation */}
                  <Text style={styles.hindiText}>
                    <Text style={styles.hindiVerseNumber}>{convertToHindiNumerals(verse.id)}. </Text>
                    {verse.hindi}
                  </Text>

                  {/* Divider */}
                  {index < GITA_DATA[currentChapter].verses.length - 1 && (
                    <View style={styles.dividerContainer}>
                      <View style={styles.dividerLine} />
                      <View style={styles.dividerDot} />
                      <View style={styles.dividerLine} />
                    </View>
                  )}
                </View>
              ))}
              
              {/* Bottom Chapter Navigation */}
              <View style={styles.bottomNavContainer}>
                {currentChapter > 1 ? (
                  <TouchableOpacity style={styles.bottomNavBtn} onPress={() => handleChapterChange(currentChapter - 1)}>
                    <Ionicons name="arrow-back" size={16} color="#691F0A" />
                    <Text style={styles.bottomNavText}>पिछला अध्याय</Text>
                  </TouchableOpacity>
                ) : <View style={{ width: 100 }} />}
                
                {currentChapter < 18 ? (
                  <TouchableOpacity style={styles.bottomNavBtn} onPress={() => handleChapterChange(currentChapter + 1)}>
                    <Text style={styles.bottomNavText}>अगला अध्याय</Text>
                    <Ionicons name="arrow-forward" size={16} color="#691F0A" />
                  </TouchableOpacity>
                ) : <View style={{ width: 100 }} />}
              </View>
              
              <View style={styles.bottomPadding} />
            </View>
          </ScrollView>

          {/* Page Number */}
          <Text style={styles.pageNumber}>६२</Text>
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
                      // After chapter loads, scroll to bookmark position
                      setTimeout(() => {
                        scrollViewRef.current?.scrollTo({ y: bm.scrollY, animated: true });
                      }, 200);
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
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(140, 58, 0, 0.1)',
  },
  iconBtnWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
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
  chapterTabText: {
    color: '#8C5A3C',
    fontWeight: '600',
    fontSize: 14,
  },
  chapterTabTextActive: {
    color: '#5C250A',
    fontWeight: '700',
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
  bottomNavText: {
    color: '#691F0A',
    fontWeight: '700',
    fontSize: 14,
    marginHorizontal: 8,
  },
  pageNumber: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    fontSize: 18,
    fontWeight: '700',
    color: '#111111',
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
});
