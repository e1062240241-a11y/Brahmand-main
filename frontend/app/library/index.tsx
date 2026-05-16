import React, { useEffect, useRef, useState } from 'react';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, BORDER_RADIUS, FONTS } from '../../src/constants/theme';

const geetaCover = require('../../assets/images/Bhagvad-geeta.jpg');
const ramcharitmanasCover = require('../../assets/images/Ramcharitmanas.jpg');
const atharvavedCover = require('../../assets/images/atharva_veda.jpg');
const mahabharataCover = require('../../assets/images/mahabharata.jpg');
const rigvedaCover = require('../../assets/images/Rigveda.jpg');
const ramayanCover = require('../../assets/images/Ramayan-hardcover-front-scaled.jpg');
const yajurvedaCover = require('../../assets/images/Yajurveda.jpg');

const books = [
  {
    id: 'geeta',
    title: 'Bhagvad Geeta',
    label: 'M. Krishna',
    details: '18 Chapters',
    cover: geetaCover,
    bgColor: '#FFF1DA',
    route: '/library/bhagvad-geeta',
  },
  {
    id: 'ramcharitmanas',
    title: 'Ramcharitmanas',
    label: 'Tulsidas',
    details: '7 Kands',
    cover: ramcharitmanasCover,
    bgColor: '#E9F5FF',
    route: '/library/ramcharitmanas',
  },
  {
    id: 'atharvaved',
    title: 'Atharvaved',
    label: 'Atharvaved',
    details: '20 Kaandas',
    cover: atharvavedCover,
    bgColor: '#F7E8FF',
    route: '/library/atharvaved',
  },
  {
    id: 'mahabharata',
    title: 'Mahabharata',
    label: 'Vyasa',
    details: '18 Books',
    cover: mahabharataCover,
    bgColor: '#FFF5E5',
    route: '/library/mahabharata',
  },
  {
    id: 'ramayan',
    title: 'Ramayan',
    label: 'Valmiki',
    details: '7 Kaands',
    cover: ramayanCover,
    bgColor: '#FFD8A8',
    route: '/library/ramayan',
  },
  {
    id: 'yajurveda',
    title: 'Yajurveda',
    devanagariTitle: 'यजुर्वेद',
    label: 'YAJURVEDA',
    details: '40 CHAPTERS',
    cover: yajurvedaCover,
    bgColor: '#5C2D1B',
    route: '/library/yajurveda',
  },
  {
    id: 'rigveda',
    title: 'Rigveda',
    label: 'Rigveda',
    details: '20 KAANDAS',
    cover: rigvedaCover,
    bgColor: '#E7FBEF',
    route: '/library/rigveda',
  },
];

const sectionDefinitions = [
  {
    id: 'mythological',
    title: 'Featured Collection',
    bookIds: ['mahabharata', 'ramayan', 'atharvaved'],
    isCarousel: true,
  },
  {
    id: 'vedas',
    title: 'Sacred Scriptures',
    bookIds: ['yajurveda', 'geeta'],
  },
];

const LibraryPage = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const scrollAnim = useRef(new Animated.Value(0)).current;
  const flowingText = 'Know about your culture.';
  const letters = [...flowingText];
  const repeatedLetters = new Array(12).fill(letters).flat();

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(scrollAnim, {
        toValue: 1,
        duration: 22000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    animation.start();
    return () => animation.stop();
  }, [scrollAnim]);

  const translateY = scrollAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -920],
  });

  const toggleSave = (id: string) => {
    setSavedIds((prev) => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const isSaved = (id: string) => savedIds.includes(id);

  const filteredBooks = books.filter((book) =>
    book.title.toLowerCase().includes(query.trim().toLowerCase()),
  );

  const sectionBooks = sectionDefinitions.map((section) => ({
    ...section,
    books: filteredBooks.filter((book) => section.bookIds.includes(book.id)),
  }));

  const [activeTab, setActiveTab] = useState('All Books');

  const tabs = [
    { name: 'All Books', icon: 'book-open-page-variant-outline', activeIcon: 'book-open-page-variant' },
    { name: 'My Favourites', icon: 'heart-outline', activeIcon: 'heart' },
    { name: 'My Reading', icon: 'bookmark-outline', activeIcon: 'bookmark' },
    { name: 'Recently Read', icon: 'time-outline', activeIcon: 'time' },
    { name: 'Categories', icon: 'grid-outline', activeIcon: 'grid' },
  ];

  const renderHighlightedTitle = (title: string, queryText: string) => {
    const normalizedQuery = queryText.trim().toLowerCase();
    if (!normalizedQuery) {
      return <Text style={styles.bookCardTitle}>{title}</Text>;
    }

    const normalizedTitle = title.toLowerCase();
    const parts = [] as Array<{ text: string; highlight: boolean }>;
    let lastIndex = 0;
    let matchIndex = normalizedTitle.indexOf(normalizedQuery, lastIndex);

    while (matchIndex !== -1) {
      if (matchIndex > lastIndex) {
        parts.push({ text: title.slice(lastIndex, matchIndex), highlight: false });
      }
      parts.push({
        text: title.slice(matchIndex, matchIndex + normalizedQuery.length),
        highlight: true,
      });
      lastIndex = matchIndex + normalizedQuery.length;
      matchIndex = normalizedTitle.indexOf(normalizedQuery, lastIndex);
    }

    if (lastIndex < title.length) {
      parts.push({ text: title.slice(lastIndex), highlight: false });
    }

    return (
      <Text style={styles.bookCardTitle}>
        {parts.map((part, index) => (
          <Text
            key={`${part.text}-${index}`}
            style={part.highlight ? styles.highlightText : undefined}
          >
            {part.text}
          </Text>
        ))}
      </Text>
    );
  };

  return (
    <View style={styles.safeArea}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: '#FFFBF7' }}>
        {/* Header Section */}
        <View style={styles.customHeader}>
          <TouchableOpacity style={styles.menuIconButton}>
            <Ionicons name="menu-outline" size={24} color="#2D1B13" />
          </TouchableOpacity>
          <View style={styles.headerCenterContent}>
            <View style={styles.topOrnamentRow}>
              <View style={styles.ornamentLine} />
              <MaterialCommunityIcons name="star-four-points" size={14} color="#D4AF37" style={{ marginHorizontal: 10, opacity: 0.8 }} />
              <View style={styles.ornamentLine} />
            </View>
            <Text style={styles.headerTitleText}>Brahmand Library</Text>
            <View style={styles.headerSubtitleRow}>
              <View style={styles.subtitleArrowLeft} />
              <Text style={styles.headerSubtitleText}>Ancient Wisdom. Eternal Knowledge.</Text>
              <View style={styles.subtitleArrowRight} />
            </View>
          </View>
          <View style={{ width: 44 }} /> {/* Spacer */}
        </View>

        {/* Search Bar Section */}
        <View style={styles.searchContainer}>
          <View style={styles.customSearchBar}>
            <Ionicons name="search-outline" size={20} color="#C4B5A5" style={{ marginLeft: 18 }} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search by book name, author or topic"
              placeholderTextColor="#C4B5A5"
              style={styles.customSearchInput}
            />
            <TouchableOpacity style={styles.filterButton}>
              <MaterialCommunityIcons name="tune-vertical" size={22} color="#2D1B13" />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 80 + insets.bottom }}
      >
        {/* Featured Card (Hero) */}
        <View style={styles.heroCardContainer}>
          <Image 
            source={require('../../assets/images/final_sacred_hero_complete.png')} 
            style={styles.heroCardImage}
            resizeMode="cover"
          />
          <LinearGradient 
            colors={['rgba(15, 10, 5, 0.95)', 'rgba(15, 10, 5, 0.6)', 'transparent']} 
            start={{ x: 0, y: 0 }} 
            end={{ x: 0.8, y: 0 }} 
            style={styles.heroCardOverlay}
          />
          <View style={styles.heroCardTextContent}>
            <Text style={styles.greetingText}>Namaste, Virral 🙏</Text>
            <Text style={styles.heroDescription}>
              Explore timeless scriptures{"\n"}that guide your mind, nourish{"\n"}your soul and enrich your life.
            </Text>
            <TouchableOpacity style={styles.continueReadingBtn}>
              <Text style={styles.continueReadingText}>Continue Reading</Text>
              <Ionicons name="arrow-forward" size={14} color="#FFF" style={{ marginLeft: 6 }} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Icon Navigation Tabs */}
        <View style={styles.tabsContainer}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.name;
            return (
              <TouchableOpacity 
                key={tab.name} 
                style={styles.tabItem} 
                onPress={() => setActiveTab(tab.name)}
              >
                <View style={[styles.tabIconCircle, isActive && styles.tabIconCircleActive]}>
                  {tab.name === 'All Books' ? (
                    <MaterialCommunityIcons 
                      name={isActive ? (tab.activeIcon as any) : (tab.icon as any)} 
                      size={20} 
                      color={isActive ? '#FF6600' : '#8A6E5A'} 
                    />
                  ) : (
                    <Ionicons 
                      name={isActive ? (tab.activeIcon as any) : (tab.icon as any)} 
                      size={20} 
                      color={isActive ? '#FF6600' : '#8A6E5A'} 
                    />
                  )}
                </View>
                <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{tab.name}</Text>
                {isActive && <View style={styles.activeTabUnderline} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Book Sections */}
        <View style={styles.mainContentArea}>
          {sectionDefinitions.map((sectionDef) => {
            const sectionBooks = books.filter(b => sectionDef.bookIds.includes(b.id));
            if (sectionBooks.length === 0) return null;

            return (
              <View key={sectionDef.id} style={styles.bookSection}>
                <View style={styles.bookSectionHeader}>
                  <View style={styles.sectionTitleRow}>
                    <View style={styles.sectionTitleBar} />
                    <Text style={styles.bookSectionTitle}>{sectionDef.title}</Text>
                  </View>
                  <TouchableOpacity><Text style={styles.bookSeeAll}>View All {'>'}</Text></TouchableOpacity>
                </View>
                
                {sectionDef.isCarousel ? (
                  <View>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.carouselContainer}
                      snapToInterval={200 + 16}
                      decelerationRate="fast"
                    >
                      {sectionBooks.map((book) => (
                        <TouchableOpacity
                          key={book.id}
                          style={styles.carouselCard}
                          onPress={() => router.push(book.route as any)}
                        >
                          <Image source={book.cover} style={styles.carouselCover} resizeMode="cover" />
                          <TouchableOpacity 
                            style={styles.carouselHeartWrapper}
                            onPress={() => toggleSave(book.id)}
                          >
                            <Ionicons 
                              name={isSaved(book.id) ? "heart" : "heart-outline"} 
                              size={16} 
                              color="#FF6600" 
                            />
                          </TouchableOpacity>
                          <View style={styles.carouselContent}>
                            <Text style={styles.carouselTitle}>{book.title}</Text>
                            <Text style={styles.carouselAuthor}>{book.label}</Text>
                            <View style={styles.carouselFooter}>
                              <Ionicons name="book-outline" size={12} color="#D4AF37" />
                              <Text style={styles.carouselDetails}>{book.details}</Text>
                            </View>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                    <View style={styles.paginationDots}>
                      <View style={[styles.dot, styles.activeDot]} />
                      <View style={styles.dot} />
                      <View style={styles.dot} />
                      <View style={styles.dot} />
                    </View>
                  </View>
                ) : (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.horizontalScrollContainer}
                  >
                    {sectionBooks.map((book) => (
                      <TouchableOpacity
                        key={book.id}
                        style={[styles.horizontalBookCard, { backgroundColor: book.bgColor || '#FFF' }]}
                        onPress={() => router.push(book.route as any)}
                      >
                        <Image source={book.cover} style={styles.horizontalCover} resizeMode="cover" />
                        <View style={styles.horizontalContent}>
                          {book.devanagariTitle ? (
                            <Text style={styles.horizontalTitleDevanagari}>{book.devanagariTitle}</Text>
                          ) : null}
                          <Text style={[styles.horizontalTitle, book.bgColor ? { color: '#FFF' } : {}]}>{book.title}</Text>
                          <Text style={[styles.horizontalAuthor, book.bgColor ? { color: 'rgba(255,255,255,0.7)' } : {}]}>{book.label}</Text>
                          <View style={styles.horizontalFooter}>
                            <Ionicons name="book-outline" size={12} color="#D4AF37" />
                            <Text style={styles.horizontalDetails}>{book.details}</Text>
                          </View>
                        </View>
                        <TouchableOpacity 
                          style={styles.bookmarkBadge} 
                          onPress={() => toggleSave(book.id)}
                        >
                          <Ionicons 
                            name={isSaved(book.id) ? "bookmark" : "bookmark-outline"} 
                            size={16} 
                            color="#D4AF37" 
                          />
                        </TouchableOpacity>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>
            );
          })}

          {/* Final Quote Banner Section */}
          <View style={styles.quoteBanner}>
            <View style={styles.quoteContentRow}>
              <View style={styles.quoteTextCol}>
                <Text style={styles.quoteText}>
                  "A library is not just a collection of books,{"\n"}but a journey towards a better you."
                </Text>
              </View>
              <View style={styles.diyaWrapper}>
                <Image 
                  source={require('../../assets/images/traditional_diya_footer.png')} 
                  style={styles.diyaImage} 
                  resizeMode="cover"
                />
              </View>
            </View>
          </View>
        </View>

          {filteredBooks.length === 0 && (
            <View style={styles.emptyStateContainer}>
              <MaterialCommunityIcons name="book-search-outline" size={64} color="#DDD" />
              <Text style={styles.emptyText}>No books found</Text>
            </View>
          )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFBF7' },
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
    backgroundColor: '#FFFBF7',
  },
  menuIconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  headerCenterContent: {
    alignItems: 'center',
    flex: 1,
  },
  topOrnamentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  ornamentLine: {
    width: 30,
    height: 1,
    backgroundColor: '#D4AF37',
    opacity: 0.3,
  },
  headerTitleText: {
    fontSize: 26,
    color: '#2D1B13',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  headerSubtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  headerSubtitleText: {
    fontSize: 11,
    color: '#8A6E5A',
    marginHorizontal: 10,
    fontFamily: FONTS.medium,
    opacity: 0.7,
    letterSpacing: 0.3,
  },
  subtitleArrowLeft: {
    width: 12,
    height: 1,
    backgroundColor: '#D4AF37',
    opacity: 0.4,
  },
  subtitleArrowRight: {
    width: 12,
    height: 1,
    backgroundColor: '#D4AF37',
    opacity: 0.4,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingBottom: 15,
    backgroundColor: '#FFFBF7',
  },
  customSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 22,
    height: 54,
    elevation: 4,
    shadowColor: '#2D1B13',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    borderWidth: 1,
    borderColor: '#F5EEE6',
  },
  customSearchInput: {
    flex: 1,
    fontSize: 14,
    color: '#2D1B13',
    paddingHorizontal: 12,
    fontFamily: FONTS.medium,
  },
  filterButton: {
    paddingRight: 18,
    paddingLeft: 10,
  },
  heroCardContainer: {
    marginHorizontal: 20,
    height: 220,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: '#120A05',
    elevation: 12,
    shadowColor: '#2D1B13',
    shadowOpacity: 0.25,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 10 },
    marginTop: 5,
  },
  heroCardImage: {
    width: '65%',
    height: '100%',
    position: 'absolute',
    right: -10,
  },
  heroCardOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  heroCardTextContent: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 25,
    paddingRight: '35%',
  },
  greetingText: {
    fontSize: 24,
    color: '#E6B325',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontWeight: '800',
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  heroDescription: {
    fontSize: 13,
    color: '#FFF',
    lineHeight: 20,
    fontFamily: FONTS.medium,
    opacity: 0.9,
    marginBottom: 20,
    letterSpacing: 0.3,
  },
  continueReadingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 0.8,
    borderColor: 'rgba(255,255,255,0.5)',
    borderRadius: 25,
    paddingHorizontal: 18,
    paddingVertical: 9,
    alignSelf: 'flex-start',
  },
  continueReadingText: {
    color: '#FFF',
    fontSize: 11,
    fontFamily: FONTS.bold,
    letterSpacing: 0.5,
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 25,
    marginBottom: 10,
  },
  tabItem: {
    alignItems: 'center',
    width: '18%',
  },
  tabIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  tabIconCircleActive: {
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: '#D4AF37',
    elevation: 3,
    shadowColor: '#D4AF37',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
  },
  tabLabel: {
    fontSize: 9.5,
    color: '#8A6E5A',
    fontFamily: FONTS.bold,
    textAlign: 'center',
    opacity: 0.8,
  },
  tabLabelActive: {
    color: '#FF6600',
    opacity: 1,
  },
  activeTabUnderline: {
    width: 12,
    height: 2,
    backgroundColor: '#FF6600',
    marginTop: 4,
    borderRadius: 1,
  },
  mainContentArea: {
    paddingHorizontal: 0,
    marginTop: 10,
  },
  bookSection: {
    marginBottom: 35,
  },
  bookSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 18,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitleBar: {
    width: 3,
    height: 18,
    backgroundColor: '#D4AF37',
    marginRight: 10,
    borderRadius: 2,
  },
  bookSectionTitle: {
    fontSize: 20,
    color: '#2D1B13',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontWeight: 'bold',
  },
  bookSeeAll: {
    fontSize: 12,
    color: '#8A6E5A',
    fontFamily: FONTS.bold,
  },
  carouselContainer: {
    paddingLeft: 20,
    paddingRight: 10,
  },
  carouselCard: {
    width: 200,
    height: 320,
    backgroundColor: '#120A05',
    borderRadius: 22,
    marginRight: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  carouselCover: {
    width: '100%',
    height: '70%',
  },
  carouselHeartWrapper: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: '#FFF',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  carouselContent: {
    padding: 15,
    flex: 1,
    justifyContent: 'center',
  },
  carouselTitle: {
    fontSize: 18,
    color: '#D4AF37',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  carouselAuthor: {
    fontSize: 11,
    color: '#FFF',
    fontFamily: FONTS.medium,
    textAlign: 'center',
    opacity: 0.8,
    marginTop: 2,
  },
  carouselFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: 10,
  },
  carouselDetails: {
    fontSize: 10,
    color: '#D4AF37',
    fontFamily: FONTS.bold,
    marginLeft: 6,
    textTransform: 'uppercase',
  },
  paginationDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 15,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D1C4B9',
    marginHorizontal: 4,
  },
  activeDot: {
    width: 20,
    backgroundColor: '#FF6600',
  },
  horizontalScrollContainer: {
    paddingLeft: 20,
    paddingRight: 10,
  },
  horizontalBookCard: {
    width: 320,
    height: 160,
    backgroundColor: '#FFF',
    borderRadius: 22,
    marginRight: 20,
    flexDirection: 'row',
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#2D1B13',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
  horizontalCover: {
    width: '35%',
    height: '100%',
  },
  horizontalContent: {
    flex: 1,
    padding: 15,
    justifyContent: 'center',
  },
  horizontalTitle: {
    fontSize: 18,
    color: '#2D1B13',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontWeight: 'bold',
  },
  horizontalTitleDevanagari: {
    fontSize: 32,
    color: '#FFF',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  horizontalAuthor: {
    fontSize: 12,
    color: '#8A6E5A',
    fontFamily: FONTS.medium,
    marginTop: 2,
  },
  horizontalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  horizontalDetails: {
    fontSize: 10,
    color: '#D4AF37',
    fontFamily: FONTS.bold,
    marginLeft: 6,
    textTransform: 'uppercase',
  },
  bookmarkBadge: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: 'rgba(255,255,255,0.95)',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  quoteBanner: {
    marginTop: 80,
    backgroundColor: '#FFFEFB', // Ultra-light cream
    borderTopLeftRadius: 120,
    borderTopRightRadius: 120,
    paddingVertical: 80,
    paddingHorizontal: 40,
    width: '100%',
    elevation: 30,
    shadowColor: '#2D1B13',
    shadowOpacity: 0.1,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: -20 },
    borderWidth: 1,
    borderColor: '#F5EEE6',
  },
  quoteContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quoteTextCol: {
    flex: 1,
    paddingRight: 20,
  },
  quoteText: {
    fontSize: 20,
    color: '#4A3728',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontStyle: 'italic',
    lineHeight: 32,
    textAlign: 'center',
    fontWeight: '500',
    opacity: 0.9,
  },
  diyaWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    borderWidth: 4,
    borderColor: '#FFF',
    elevation: 10,
  },
  diyaImage: {
    width: '100%',
    height: '100%',
  },
  emptyStateContainer: {
    paddingVertical: 100,
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
    color: '#AAA',
    fontFamily: FONTS.medium,
  },
});

export default LibraryPage;
