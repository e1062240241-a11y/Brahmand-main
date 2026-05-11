import React, { useState, useCallback, useEffect, useRef } from 'react';
import { 
 SafeAreaView,
 View, 
 Text, 
 StyleSheet, 
 ScrollView, 
 TouchableOpacity, 
 RefreshControl,
 Image,
 ImageBackground,
 TextInput,
 Animated,
 Modal,
 Platform,
 Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getTemples } from '../../src/services/api';
import { COLORS, SPACING, BORDER_RADIUS, FONTS } from '../../src/constants/theme';
import { TEMPLE_IMAGES, DEFAULT_TEMPLE_IMAGE } from '../../src/constants/templeImages';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const DEFAULT_TEMPLE_LOCATIONS: Record<string, string> = {
  'ISKCON Mira Road': 'Mira Road, Thane',
  'Shirdi Sai Baba Temple': 'Shirdi, Maharashtra',
  'Shirdi Sai Baba Temple – Maharashtra': 'Shirdi, Maharashtra',
  'ISKCON Mira Road – Thane': 'Mira Road, Thane',
};

const AARTI_TAB_SESSIONS: Array<{ title: string; time: string }> = [];

const getSpecialTempleKey = (name: string) => {
 const normalizedName = String(name || '').toLowerCase();
 if (
 normalizedName.includes('mira road') ||
 normalizedName.includes('iskcon mira') ||
 normalizedName.includes('radhagiridhari') ||
 normalizedName.includes('iskcon borivali') ||
 normalizedName.includes('iskon borivali') ||
 normalizedName.includes('borivali') ||
 normalizedName.includes('brovali')
 ) {
 return 'ISKCON Mira Road';
 }
 if (
 normalizedName.includes('shirdi') ||
 normalizedName.includes('sai baba') ||
 normalizedName.includes('saibaba') ||
 normalizedName.includes('samadhi') ||
 normalizedName.includes('sai baba samadhi') ||
 normalizedName.includes('sai baba mandir')
 ) {
 return 'Shirdi Sai Baba – Maharashtra';
 }
 if (
 normalizedName.includes('somnath') ||
 normalizedName.includes('prabhas patan') ||
 normalizedName.includes('jyotirling-somnath')
 ) {
 return 'Somnath Mandir – Gujrat';
 }
 return '';
};

const getTempleDisplayName = (item: any) => {
  const name = item?.name || 'Temple';
  if (typeof name === 'string' && name.includes('–')) {
    return name.split('–')[0].trim();
  }
  const specialKey = getSpecialTempleKey(name);
  return specialKey ? specialKey.split('–')[0].trim() : name;
};

const getTempleDeityLabel = (item: any) => {
 const specialKey = getSpecialTempleKey(item?.name);
 if (specialKey === 'ISKCON Mira Road') return 'Lord RadhaKrishn';
 if (specialKey === 'Shirdi Sai Baba – Maharashtra') return 'Sai Baba';
 return item?.deity || 'Temple';
};

const AARTI_TIMINGS: Record<string, string> = {
  'ISKCON Mira Road': '4:30 AM',
  'Shirdi Sai Baba – Maharashtra': '5:00 AM',
  'Shirdi Sai Baba Temple – Maharashtra': '5:00 AM',
  'ISKCON Mira Road – Thane': '4:30 AM',
  'Somnath Temple – Gujarat': '7:00 AM',
  'Kedarnath Temple – Uttarakhand': '6:00 AM',
  'Mahakaleshwar Temple – Ujjain': '4:00 AM',
  'Kashi Vishwanath Temple – Varanasi': '3:00 AM',
};

const getTempleAartiText = (item: any) => {
  const aartiTimings = item?.aarti_timings;
  if (aartiTimings && typeof aartiTimings === 'object') {
    const entries = Object.entries(aartiTimings).filter(([, v]) => v);
    if (entries.length > 0) return entries[0][1] as string;
  }
  const specialKey = getSpecialTempleKey(item?.name);
  if (!specialKey) return null;
  const timing = AARTI_TIMINGS[specialKey];
  if (!timing) return null;
  return timing;
};

const JYOTIRLING_TEMPLES = [
  { id: 'jyotirling-somnath-temple-gujarat', name: 'Somnath Temple – Gujarat', location: 'Gujarat', deity: 'Lord Shiva', is_verified: true },
  { id: 'jyotirling-kedarnath-temple-uttarakhand', name: 'Kedarnath Temple – Uttarakhand', location: 'Uttarakhand', deity: 'Lord Shiva', is_verified: true },
  { id: 'jyotirling-mahakaleshwar-temple-ujjain', name: 'Mahakaleshwar Temple – Ujjain', location: 'Ujjain', deity: 'Lord Shiva', is_verified: true },
  { id: 'jyotirling-kashi-vishwanath-temple-varanasi', name: 'Kashi Vishwanath Temple – Varanasi', location: 'Varanasi', deity: 'Lord Shiva', is_verified: true },
  { id: 'jyotirling-bhimashankar-temple-maharashtra', name: 'Bhimashankar Temple – Maharashtra', location: 'Pune', deity: 'Lord Shiva', is_verified: true },
  { id: 'jyotirling-ramanathaswamy-temple-rameswaram', name: 'Ramanathaswamy Temple – Rameswaram', location: 'Tamil Nadu', deity: 'Lord Shiva', is_verified: true },
  { id: 'jyotirling-grishneshwar-temple-ellora', name: 'Grishneshwar Temple – Ellora', location: 'Maharashtra', deity: 'Lord Shiva', is_verified: true },
  { id: 'jyotirling-omkareshwar-temple-madhya-pradesh', name: 'Omkareshwar Temple – Madhya Pradesh', location: 'Madhya Pradesh', deity: 'Lord Shiva', is_verified: true },
  { id: 'jyotirling-trimbakeshwar-temple-nashik', name: 'Trimbakeshwar Temple – Nashik', location: 'Nashik', deity: 'Lord Shiva', is_verified: true },
  { id: 'jyotirling-nageshwar-temple-dwarka', name: 'Nageshwar Temple – Dwarka', location: 'Gujarat', deity: 'Lord Shiva', is_verified: true },
  { id: 'jyotirling-mallikarjuna-temple-srisailam', name: 'Mallikarjuna Temple – Srisailam', location: 'Andhra Pradesh', deity: 'Lord Shiva', is_verified: true },
  { id: 'jyotirling-baidyanath-temple-deoghar', name: 'Baidyanath Temple – Deoghar', location: 'Jharkhand', deity: 'Lord Shiva', is_verified: true },
];

const OTHER_TEMPLES = [
  { id: 'other-tirupati-balaji-temple-andhra-pradesh', name: 'Tirupati Balaji Temple – Andhra Pradesh', location: 'Andhra Pradesh', deity: 'Lord Venkateswara', is_verified: true },
  { id: 'other-vaishno-devi-temple-jammu-kashmir', name: 'Vaishno Devi Temple – Jammu & Kashmir', location: 'Jammu & Kashmir', deity: 'Mata Vaishno Devi', is_verified: true },
  { id: 'other-siddhivinayak-temple-mumbai', name: 'Siddhivinayak Temple – Mumbai', location: 'Mumbai', deity: 'Lord Ganesha', is_verified: true },
  { id: 'other-shirdi-sai-baba-temple-maharashtra', name: 'Shirdi Sai Baba Temple – Maharashtra', location: 'Shirdi', deity: 'Sai Baba', is_verified: true },
  { id: 'other-jagannath-temple-puri', name: 'Jagannath Temple – Puri', location: 'Puri', deity: 'Lord Jagannath', is_verified: true },
  { id: 'other-golden-temple-amritsar', name: 'Golden Temple – Amritsar', location: 'Amritsar', deity: 'Sri Harmandir Sahib', is_verified: true },
  { id: 'other-meenakshi-temple-madurai', name: 'Meenakshi Temple – Madurai', location: 'Tamil Nadu', deity: 'Meenakshi Amman', is_verified: true },
  { id: 'other-iskcon-mira-road-thane', name: 'ISKCON Mira Road – Thane', location: 'Mira Road', deity: 'Radha Giridhari', is_verified: true },
  { id: 'other-iskcon-temple-bangalore-karnataka', name: 'ISKCON Temple Bangalore – Karnataka', location: 'Bengaluru', deity: 'Lord Krishna', is_verified: true },
];

const getTempleLocation = (item: any) => {
  const location = item?.location;
  const specialKey = getSpecialTempleKey(item?.name);
  if (!location || (typeof location === 'object' && Object.keys(location).length === 0)) {
  if (specialKey) {
  return DEFAULT_TEMPLE_LOCATIONS[specialKey];
  }
  return DEFAULT_TEMPLE_LOCATIONS[item?.name] || 'Location';
  }
  if (typeof location === 'string') return location;
  const fallback = [location.area, location.city, location.state, location.country]
  .filter(Boolean)
  .join(', ');
  if (fallback) return fallback;
  if (specialKey) {
  return DEFAULT_TEMPLE_LOCATIONS[specialKey];
  }
  return Object.values(location || {})
  .filter((value) => typeof value === 'string' && value.trim())
  .join(', ') || DEFAULT_TEMPLE_LOCATIONS[item?.name] || 'Location';
};

const getTempleDisplayNames = () => {
  return [...JYOTIRLING_TEMPLES, ...OTHER_TEMPLES].map((t) => t.name.split('–')[0].trim());
};

const getUniqueLocations = () => {
  const allTemples = [...JYOTIRLING_TEMPLES, ...OTHER_TEMPLES];
  const locations = new Set(allTemples.map((t) => t.location));
  return Array.from(locations).sort();
};

const renderHighlightedText = (text: string, query: string, style: any, highlightStyle: any) => {
 if (!query) return <Text style={style}>{text}</Text>;
 const normalizedText = String(text || '');
 const normalizedQuery = query.trim();
 if (!normalizedQuery) return <Text style={style}>{normalizedText}</Text>;
 const escapedQuery = normalizedQuery.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
 const regex = new RegExp(`(${escapedQuery})`, 'i');
 const parts = normalizedText.split(regex);
 const lowerQuery = normalizedQuery.toLowerCase();
 return (
 <Text style={style}>
 {parts.map((part, index) => {
 const isMatch = part.toLowerCase() === lowerQuery;
 return isMatch ? (
 <Text key={`${part}-${index}`} style={[style, highlightStyle]}>
 {part}
 </Text>
 ) : (
 <Text key={`${part}-${index}`} style={style}>
 {part}
 </Text>
 );
 })}
 </Text>
 );
};

export default function TempleScreen() {
 const router = useRouter();
 const [selectedTempleSection, setSelectedTempleSection] = useState<'Jyotirling' | 'Others'>('Jyotirling');
 const [temples, setTemples] = useState<any[]>([]);
 const [featuredJyotirling, setFeaturedJyotirling] = useState(JYOTIRLING_TEMPLES);
 const [featuredOthers, setFeaturedOthers] = useState(OTHER_TEMPLES);
 const [loading, setLoading] = useState(true);
 const [refreshing, setRefreshing] = useState(false);
 const [isSearchOpen, setIsSearchOpen] = useState(false);
 const [searchQuery, setSearchQuery] = useState('');
 const [placeholderIndex, setPlaceholderIndex] = useState(0);
 const [showFilterModal, setShowFilterModal] = useState(false);
 const [selectedLocations, setSelectedLocations] = useState<Set<string>>(new Set());
 const searchBarAnim = useRef(new Animated.Value(0)).current;
 const placeholderOpacity = useRef(new Animated.Value(0)).current;
 const placeholderTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
 const placeholderOptions = getTempleDisplayNames().slice(0, 6);
 const uniqueLocations = getUniqueLocations();

 const openSearch = () => {
 setIsSearchOpen(true);
 Animated.timing(searchBarAnim, {
 toValue: 1,
 duration: 260,
 useNativeDriver: false,
 }).start(() => {
 Animated.timing(placeholderOpacity, {
 toValue: 1,
 duration: 220,
 useNativeDriver: true,
 }).start();
 });
 };

 const closeSearch = () => {
 Animated.timing(searchBarAnim, {
 toValue: 0,
 duration: 220,
 useNativeDriver: false,
 }).start(() => {
 setIsSearchOpen(false);
 setSearchQuery('');
 setPlaceholderIndex(0);
 placeholderOpacity.setValue(0);
 if (placeholderTimerRef.current) {
 clearTimeout(placeholderTimerRef.current);
 placeholderTimerRef.current = null;
 }
 });
 };

  const openServicesSection = () => {
    router.push('/vendor');
  };

 useEffect(() => {
 if (!isSearchOpen || searchQuery.trim()) {
 if (placeholderTimerRef.current) {
 clearTimeout(placeholderTimerRef.current);
 placeholderTimerRef.current = null;
 }
 if (!isSearchOpen) {
 placeholderOpacity.setValue(0);
 }
 return;
 }

 const startPlaceholderCycle = () => {
 Animated.timing(placeholderOpacity, {
 toValue: 0,
 duration: 240,
 useNativeDriver: true,
 }).start(() => {
 setPlaceholderIndex((prev) => (prev + 1) % placeholderOptions.length);
 Animated.timing(placeholderOpacity, {
 toValue: 1,
 duration: 240,
 useNativeDriver: true,
 }).start(() => {
 placeholderTimerRef.current = setTimeout(startPlaceholderCycle, 1800);
 });
 });
 };

 placeholderTimerRef.current = setTimeout(startPlaceholderCycle, 1800);
 return () => {
 if (placeholderTimerRef.current) {
 clearTimeout(placeholderTimerRef.current);
 placeholderTimerRef.current = null;
 }
 };
 }, [isSearchOpen, searchQuery]);

 const fetchData = useCallback(async () => {
  try {
    const res = await getTemples();
    const apiTemples = Array.isArray(res.data) ? res.data : [];
    setTemples(apiTemples);

    const mapApiToFeatured = (featuredList: any[]) => {
      return featuredList.map(item => {
        const namePrefix = item.name.split('–')[0].trim().toLowerCase();
        const match = apiTemples.find(at => 
          (at.name || '').toLowerCase().includes(namePrefix)
        );
        if (match) {
          return {
            ...item,
            ...match,
            id: match.id || match.temple_id || item.id,
            name: item.name,
          };
        }
        return item;
      });
    };

    setFeaturedJyotirling(mapApiToFeatured(JYOTIRLING_TEMPLES));
    setFeaturedOthers(mapApiToFeatured(OTHER_TEMPLES));
  } catch (error) {
    console.error('Error fetching temples:', error);
    setTemples([]);
  } finally {
    setLoading(false);
    setRefreshing(false);
  }
 }, []);

 useEffect(() => {
  fetchData();
 }, [fetchData]);

 const openTempleDetails = (item: any) => {
 const templeId = item?.id || item?.name;
 if (!templeId) return;
 router.push(`/temple/${encodeURIComponent(String(templeId))}`);
 };

  const visibleTempleList = selectedTempleSection === 'Jyotirling' 
    ? featuredJyotirling 
    : [...featuredOthers, ...(Array.isArray(temples) ? temples.filter(t => 
        !featuredJyotirling.some(j => (j.id === t.id || j.temple_id === t.temple_id)) &&
        !featuredOthers.some(o => (o.id === t.id || o.temple_id === t.temple_id))
      ) : [])];

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const searchableTempleList = normalizedQuery 
    ? [...featuredJyotirling, ...featuredOthers, ...(Array.isArray(temples) ? temples : [])] 
    : visibleTempleList;

  const filteredTempleList = searchableTempleList.filter((item) => {
    const templeName = getTempleDisplayName(item).toLowerCase();
    const templeLocation = getTempleLocation(item).toLowerCase();
    const matchesSearch = (
      templeName.includes(normalizedQuery) ||
      templeLocation.includes(normalizedQuery)
    );
    const matchesLocation = selectedLocations.size === 0 || selectedLocations.has(item.location);
    return matchesSearch && matchesLocation;
  });

 const toggleLocationFilter = (location: string) => {
 const newLocations = new Set(selectedLocations);
 if (newLocations.has(location)) {
 newLocations.delete(location);
 } else {
 newLocations.add(location);
 }
 setSelectedLocations(newLocations);
 };

 const renderTempleCard = (item: any) => {
 const imageSource = TEMPLE_IMAGES[item?.id] || DEFAULT_TEMPLE_IMAGE;
 const displayName = getTempleDisplayName(item);
 const location = getTempleLocation(item);
 const isLive = displayName.toLowerCase().includes('somnath');
 const aartiTime = getTempleAartiText(item);

 return (
  <TouchableOpacity 
  key={String(item?.id || item?.name)}
  style={styles.templeCard}
  onPress={() => openTempleDetails(item)}
  >
  <Image source={imageSource} style={styles.templeCardImage} resizeMode="cover" />
  <View style={styles.templeInfo}>
   {renderHighlightedText(displayName, searchQuery, styles.templeName, styles.highlightText)}
   <Text style={styles.templeLocation}>{location}</Text>
    {aartiTime && (
      <View style={styles.aartiTimeRow}>
        <Ionicons name="time-outline" size={12} color={COLORS.primary} />
        <Text style={styles.aartiTimeText}>Next Aarti: {aartiTime}</Text>
      </View>
    )}
  </View>
  {isLive && (
   <View style={styles.cardLiveBadge}>
   <View style={styles.liveDot} />
   <Text style={styles.cardLiveBadgeText}>LIVE</Text>
   </View>
  )}
  <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} style={{ marginLeft: 8 }} />
  </TouchableOpacity>
 );
 };

  const scrollY = useRef(new Animated.Value(0)).current;

  const headerBg = scrollY.interpolate({
    inputRange: [0, 60],
    outputRange: ['rgba(255, 248, 240, 0)', 'rgba(255, 248, 240, 1)'],
    extrapolate: 'clamp',
  });

  const headerBorder = scrollY.interpolate({
    inputRange: [0, 60],
    outputRange: ['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0.05)'],
    extrapolate: 'clamp',
  });

  return (
  <SafeAreaView style={styles.container} edges={['top']}>
  <Animated.View style={[styles.headerBar, { 
    backgroundColor: headerBg, 
    borderBottomColor: headerBorder, 
    borderBottomWidth: 1,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingTop: Platform.OS === 'ios' ? 0 : 40,
  }]}>
  <TouchableOpacity style={styles.backButton} onPress={() => router.back()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
   <Ionicons name="arrow-back" size={22} color={COLORS.text} />
  </TouchableOpacity>
  <View style={styles.headerActions}>
    {isSearchOpen ? (
      <Animated.View
        style={[
          styles.searchInputContainer,
          {
            width: searchBarAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 240],
            }),
            opacity: searchBarAnim,
          },
        ]}
      >
        <Ionicons name="search" size={16} color={COLORS.textSecondary} />
        <TextInput
          style={[
            styles.searchInput,
            Platform.OS === 'web' ? ({ outlineWidth: 0, outlineStyle: 'none' } as any) : null,
          ]}
          placeholder=""
          placeholderTextColor={COLORS.textLight}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
          underlineColorAndroid="transparent"
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color={COLORS.textLight} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={closeSearch}>
            <Ionicons name="close" size={18} color={COLORS.textLight} />
          </TouchableOpacity>
        )}
      </Animated.View>
    ) : (
      <TouchableOpacity style={styles.headerIcon} onPress={openSearch}>
        <Ionicons name="search-outline" size={24} color={COLORS.text} />
      </TouchableOpacity>
    )}
    <TouchableOpacity style={styles.headerIcon} onPress={() => setShowFilterModal(true)}>
      <Ionicons name="filter" size={22} color={COLORS.text} />
    </TouchableOpacity>
    <TouchableOpacity style={styles.vendorButton} onPress={openVendorSection}>
      <Ionicons name="storefront" size={18} color={COLORS.text} />
      <Text style={styles.vendorButtonText}>Vendor</Text>
    </TouchableOpacity>
  </View>
  </Animated.View>

  <Animated.ScrollView
  style={styles.contentScroll}
  contentContainerStyle={[styles.listContent, { paddingTop: 60 }]}
  showsVerticalScrollIndicator={false}
  onScroll={Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: false }
  )}
  scrollEventThrottle={16}
  refreshControl={
   <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} />
  }
  >
  <TouchableOpacity
   style={styles.heroBanner}
   activeOpacity={0.9}
   onPress={() => router.push('/mantra-jaap' as any)}
  >
   <ImageBackground
   source={TEMPLE_IMAGES['jyotirling-somnath-temple-gujarat'] || DEFAULT_TEMPLE_IMAGE}
   style={styles.heroBannerImage}
   imageStyle={styles.heroBannerImageStyle}
   >
   <LinearGradient
    colors={['rgba(0,0,0,0.15)', 'rgba(0,0,0,0.65)']}
    style={styles.heroBannerOverlay}
   >
    <View style={styles.heroBannerTop}>
    <View style={styles.heroBannerContent}>
     <View style={styles.heroBadge}>
      <Ionicons name="sparkles" size={14} color="#FFD700" />
      <Text style={styles.heroBadgeText}>Most Popular Now</Text>
     </View>
     <Text style={styles.heroBannerTitle}>Live Mantra Jaap</Text>
     <Text style={styles.heroBannerLocation}>Join Thousands in Spiritual Chanting</Text>
    </View>
    <TouchableOpacity
    style={styles.watchNowButton}
    onPress={() => router.push('/mantra-jaap' as any)}
    >
    <Text style={styles.watchNowText}>Watch Now</Text>
    </TouchableOpacity>
    </View>
   </LinearGradient>
   </ImageBackground>
  </TouchableOpacity>

  <TouchableOpacity style={styles.servicesRow} onPress={openServicesSection} activeOpacity={0.7}>
   <View style={styles.servicesIconWrap}>
    <Ionicons name="information" size={24} color="#FFFFFF" />
   </View>
   <Text style={styles.servicesText}>Services</Text>
    <Ionicons name="chevron-forward" size={22} color={COLORS.textSecondary} />
  </TouchableOpacity>

  <View style={styles.sectionPillRow}>
   <TouchableOpacity
   style={[styles.sectionPill, selectedTempleSection === 'Jyotirling' && styles.sectionPillActive]}
   onPress={() => setSelectedTempleSection('Jyotirling')}
   >
   <Text style={[styles.sectionPillText, selectedTempleSection === 'Jyotirling' && styles.sectionPillTextActive]}>
    Jyotirling
   </Text>
   </TouchableOpacity>
   <TouchableOpacity
   style={[styles.sectionPill, selectedTempleSection === 'Others' && styles.sectionPillActive]}
   onPress={() => setSelectedTempleSection('Others')}
   >
   <Text style={[styles.sectionPillText, selectedTempleSection === 'Others' && styles.sectionPillTextActive]}>
    Others
   </Text>
   </TouchableOpacity>
  </View>

  <View style={styles.othersSection}>
   {filteredTempleList.map((item) => renderTempleCard(item))}
   {filteredTempleList.length === 0 ? (
   <View style={styles.emptyState}>
    <Ionicons name="search" size={24} color={COLORS.textLight} />
    <Text style={styles.emptyText}>No temples found</Text>
   </View>
   ) : null}
  </View>
  </Animated.ScrollView>

  <Modal
  visible={showFilterModal}
  transparent
  animationType="fade"
  onRequestClose={() => setShowFilterModal(false)}
  >
  <TouchableOpacity
   style={styles.filterModalOverlay}
   activeOpacity={1}
   onPress={() => setShowFilterModal(false)}
  >
   <View style={styles.filterModalContent}>
   <View style={styles.filterModalHeader}>
    <Text style={styles.filterModalTitle}>Filter by Location</Text>
    <TouchableOpacity onPress={() => setShowFilterModal(false)}>
    <Ionicons name="close" size={24} color={COLORS.text} />
    </TouchableOpacity>
   </View>
   <ScrollView style={styles.filterOptionsList}>
    {uniqueLocations.map((location) => (
    <TouchableOpacity
     key={location}
     style={styles.filterOption}
     onPress={() => toggleLocationFilter(location)}
    >
     <View
     style={[
      styles.filterCheckbox,
      selectedLocations.has(location) && styles.filterCheckboxActive,
     ]}
     >
     {selectedLocations.has(location) && (
      <Ionicons name="checkmark" size={16} color={COLORS.primary} />
     )}
     </View>
     <Text
     style={[
      styles.filterOptionText,
      selectedLocations.has(location) && styles.filterOptionTextActive,
     ]}
     >
     {location}
     </Text>
    </TouchableOpacity>
    ))}
   </ScrollView>
   {selectedLocations.size > 0 && (
    <TouchableOpacity
    style={styles.filterClearButton}
    onPress={() => setSelectedLocations(new Set())}
    >
    <Text style={styles.filterClearButtonText}>Clear All Filters</Text>
    </TouchableOpacity>
   )}
   </View>
  </TouchableOpacity>
  </Modal>
  </SafeAreaView>
  );
}

const styles = StyleSheet.create({
 container: {
 flex: 1,
 },
 safeArea: {
 flex: 1,
 },
 headerBar: {
 flexDirection: 'row',
 alignItems: 'center',
 justifyContent: 'space-between',
 paddingHorizontal: SPACING.md,
 paddingVertical: SPACING.sm,
 },
 backButton: {
 width: 40,
 height: 40,
 justifyContent: 'center',
 alignItems: 'center',
 },
 headerTitle: {
 fontSize: 20,
 fontWeight: '700',
 color: COLORS.text,
 textAlign: 'center',
 },
 searchBarContainer: {
 paddingHorizontal: SPACING.md,
 marginBottom: SPACING.sm,
 },
  headerActions: {
  flexDirection: 'row',
  alignItems: 'center',
  flex: 1,
  justifyContent: 'flex-end',
  paddingRight: SPACING.md,
  },
 headerIcon: {
 padding: SPACING.xs,
 marginLeft: SPACING.sm,
 },
 searchInputContainer: {
 flexDirection: 'row',
 alignItems: 'center',
 backgroundColor: COLORS.background,
 borderRadius: BORDER_RADIUS.full,
 paddingHorizontal: SPACING.md,
 paddingVertical: 10,
 borderWidth: 1,
 borderColor: COLORS.border,
 },
 searchInput: {
 flex: 1,
 fontSize: 15,
 color: COLORS.text,
 marginLeft: SPACING.sm,
 paddingVertical: 0,
 },
 contentScroll: {
 flex: 1,
 },
 listContent: {
 paddingBottom: SPACING.xl * 2,
 },
 heroBanner: {
 marginHorizontal: SPACING.md,
 marginBottom: SPACING.md,
 borderRadius: 16,
 overflow: 'hidden',
 },
 heroBannerImage: {
 width: '100%',
 height: 200,
 justifyContent: 'flex-end',
 },
 heroBannerImageStyle: {
 borderRadius: 16,
 },
 heroBannerOverlay: {
 flex: 1,
 justifyContent: 'flex-end',
 padding: SPACING.md,
 borderRadius: 16,
 },
  heroBannerTop: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    width: '100%',
  },
  heroBannerContent: {
    flex: 1,
    marginRight: SPACING.md,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
    gap: 4,
  },
   heroBadgeText: {
    color: '#FFD700',
    fontSize: 10,
    fontFamily: FONTS.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heroBannerTitle: {
    fontSize: 22,
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
    marginBottom: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  heroBannerLocation: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    fontFamily: FONTS.medium,
  },
  watchNowButton: {
    backgroundColor: '#FF9500',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
 watchNowText: {
 color: '#FFFFFF',
 fontSize: 14,
 fontWeight: '700',
 },
 liveBadge: {
 flexDirection: 'row',
 alignItems: 'center',
 gap: 5,
 backgroundColor: '#FF3B30', // Red background
 paddingHorizontal: 8,
 paddingVertical: 4,
 borderRadius: 6,
 },
 liveDot: {
 width: 6,
 height: 6,
 borderRadius: 3,
 backgroundColor: '#FFFFFF', // White dot on red background
 },
 liveBadgeText: {
 fontSize: 11,
 fontWeight: '800',
 color: '#FFFFFF', // White text
 },
 cardLiveBadge: {
 flexDirection: 'row',
 alignItems: 'center',
 gap: 4,
 backgroundColor: '#FF3B30', // Red background
 paddingHorizontal: 6,
 paddingVertical: 3,
 borderRadius: 6,
 },
 cardLiveBadgeText: {
 fontSize: 10,
 fontWeight: '800',
 color: '#FFFFFF', // White text
 },
 servicesRow: {
 flexDirection: 'row',
 alignItems: 'center',
 backgroundColor: '#F5F0FF',
 marginHorizontal: SPACING.md,
 marginBottom: SPACING.md,
 paddingHorizontal: SPACING.md,
 paddingVertical: 14,
 borderRadius: 14,
 // Card-like appearance
 shadowColor: '#000',
 shadowOffset: { width: 0, height: 2 },
 shadowOpacity: 0.05,
 shadowRadius: 4,
 elevation: 2,
 },
 servicesIconWrap: {
 width: 36,
 height: 36,
 borderRadius: 18,
 backgroundColor: '#FF9500',
 justifyContent: 'center',
 alignItems: 'center',
 marginRight: SPACING.md,
 },
 servicesText: {
 flex: 1,
 fontSize: 16,
 fontWeight: '700',
 color: COLORS.text,
 },
 sectionPillRow: {
 flexDirection: 'row',
 marginHorizontal: SPACING.md,
 marginBottom: SPACING.sm,
 gap: SPACING.sm,
 },
 sectionPill: {
 flex: 1,
 borderWidth: 1,
 borderColor: COLORS.border,
 borderRadius: BORDER_RADIUS.full,
 paddingVertical: SPACING.sm,
 alignItems: 'center',
 backgroundColor: COLORS.surface,
 },
 sectionPillActive: {
 backgroundColor: `${COLORS.primary}15`,
 borderColor: COLORS.primary,
 },
 sectionPillText: {
 fontSize: 14,
 fontWeight: '600',
 color: COLORS.textSecondary,
 },
 sectionPillTextActive: {
 color: COLORS.primary,
 },
 othersSection: {
 marginHorizontal: SPACING.md,
 marginBottom: SPACING.md,
 },
 templeCard: {
 flexDirection: 'row',
 alignItems: 'center',
 backgroundColor: COLORS.surface,
 padding: SPACING.md,
 borderRadius: 16,
 marginBottom: 12,
 },
 templeCardImage: {
 width: 72,
 height: 72,
 borderRadius: 12,
 marginRight: SPACING.md,
 backgroundColor: '#E8E0D8',
 },
 templeInfo: {
 flex: 1,
 },
 templeName: {
 fontSize: 16,
 fontWeight: '600',
 color: COLORS.text,
 marginBottom: 4,
 },
  templeLocation: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  aartiTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  aartiTimeText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
    marginLeft: 4,
  },
 highlightText: {
 backgroundColor: '#FFF8B3',
 color: COLORS.text,
 },
 emptyState: {
 alignItems: 'center',
 paddingVertical: SPACING.xl * 2,
 },
 emptyText: {
 fontSize: 16,
 color: COLORS.textSecondary,
 marginTop: SPACING.md,
 },
 filterModalOverlay: {
 flex: 1,
 backgroundColor: 'rgba(0, 0, 0, 0.5)',
 justifyContent: 'flex-end',
 },
 filterModalContent: {
 backgroundColor: COLORS.background,
 borderTopLeftRadius: BORDER_RADIUS.lg,
 borderTopRightRadius: BORDER_RADIUS.lg,
 paddingTop: SPACING.lg,
 maxHeight: '80%',
 },
 filterModalHeader: {
 flexDirection: 'row',
 alignItems: 'center',
 justifyContent: 'space-between',
 paddingHorizontal: SPACING.lg,
 paddingBottom: SPACING.md,
 borderBottomWidth: 1,
 borderBottomColor: COLORS.divider,
 },
 filterModalTitle: {
 fontSize: 18,
 fontWeight: '700',
 color: COLORS.text,
 },
 filterOptionsList: {
 paddingHorizontal: SPACING.md,
 },
 filterOption: {
 flexDirection: 'row',
 alignItems: 'center',
 paddingVertical: SPACING.md,
 paddingHorizontal: SPACING.md,
 borderRadius: BORDER_RADIUS.md,
 marginBottom: SPACING.sm,
 backgroundColor: COLORS.surface,
 },
 filterCheckbox: {
 width: 24,
 height: 24,
 borderRadius: 6,
 borderWidth: 2,
 borderColor: COLORS.border,
 marginRight: SPACING.md,
 justifyContent: 'center',
 alignItems: 'center',
 },
 filterCheckboxActive: {
 backgroundColor: `${COLORS.primary}15`,
 borderColor: COLORS.primary,
 },
 filterOptionText: {
 fontSize: 16,
 color: COLORS.textSecondary,
 fontWeight: '500',
 },
 filterOptionTextActive: {
 color: COLORS.primary,
 fontWeight: '600',
 },
 filterClearButton: {
 margin: SPACING.lg,
 paddingVertical: SPACING.md,
 paddingHorizontal: SPACING.lg,
 backgroundColor: `${COLORS.error}15`,
 borderRadius: BORDER_RADIUS.md,
 alignItems: 'center',
 },
 filterClearButtonText: {
 fontSize: 14,
 fontWeight: '600',
 color: COLORS.error,
 },
});
