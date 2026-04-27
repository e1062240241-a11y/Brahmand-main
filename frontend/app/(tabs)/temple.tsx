import React, { useState, useCallback, useEffect, useRef } from 'react';
import { 
 View, 
 Text, 
 StyleSheet, 
 ScrollView, 
 TouchableOpacity, 
 RefreshControl,
 Image,
 TextInput,
 Animated,
 Modal,
 Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getTemples } from '../../src/services/api';
import { COLORS, SPACING, BORDER_RADIUS } from '../../src/constants/theme';
import { TEMPLE_IMAGES, DEFAULT_TEMPLE_IMAGE } from '../../src/constants/templeImages';

const DEFAULT_TEMPLE_LOCATIONS: Record<string, string> = {
 'ISKCON Mira Road': 'Mira Road, Thane',
 'Shirdi Sai Baba Temple': 'Shirdi, Maharashtra',
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
 return 'Shirdi Sai Baba Temple';
 }
 if (
 normalizedName.includes('somnath') ||
 normalizedName.includes('prabhas patan') ||
 normalizedName.includes('jyotirling-somnath')
 ) {
 return 'Somnath Temple – Gujarat';
 }
 return '';
};

const getTempleDisplayName = (item: any) => {
 if (typeof item?.name === 'string' && item.name.includes('–')) {
 return item.name;
 }
 const specialKey = getSpecialTempleKey(item?.name);
 return specialKey || item?.name || 'Temple';
};

const getTempleDeityLabel = (item: any) => {
 const specialKey = getSpecialTempleKey(item?.name);
 if (specialKey === 'ISKCON Mira Road') return 'Lord RadhaKrishn';
 if (specialKey === 'Shirdi Sai Baba Temple') return 'Sai Baba';
 return item?.deity || 'Temple';
};

const AARTI_TIMINGS: Record<string, string> = {
 'ISKCON Mira Road': '4:30 AM',
 'Shirdi Sai Baba Temple': '5:00 AM',
 'Somnath Temple – Gujarat': '7:00 AM',
};

const getTempleAartiText = (item: any) => {
 const specialKey = getSpecialTempleKey(item?.name);
 if (!specialKey) return null;
 const timing = AARTI_TIMINGS[specialKey];
 if (!timing) return null;
 return timing;
};

const JYOTIRLING_TEMPLE_NAMES = [
 'Somnath Temple – Gujarat',
 'Kedarnath Temple – Uttarakhand',
 'Mahakaleshwar Temple – Ujjain',
 'Kashi Vishwanath Temple – Varanasi',
 'Bhimashankar Temple – Maharashtra',
 'Ramanathaswamy Temple – Rameswaram',
 'Grishneshwar Temple – Ellora',
 'Omkareshwar Temple – Madhya Pradesh',
 'Trimbakeshwar Temple – Nashik',
 'Nageshwar Temple – Dwarka',
 'Mallikarjuna Temple – Srisailam',
 'Baidyanath Temple – Deoghar',
];

const JYOTIRLING_TEMPLES = JYOTIRLING_TEMPLE_NAMES.map((name) => ({
 id: `jyotirling-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`,
 name,
 deity: 'Lord Shiva',
 location: name.split('–')[1]?.trim() || 'India',
 is_verified: true,
}));

const OTHER_TEMPLE_NAMES = [
 'Tirupati Balaji Temple – Andhra Pradesh',
 'Vaishno Devi Temple – Jammu & Kashmir',
 'Siddhivinayak Temple – Mumbai',
 'Shirdi Sai Baba Temple – Maharashtra',
 'Jagannath Temple – Puri',
 'Golden Temple – Amritsar',
 'Meenakshi Temple – Madurai',
 'ISKCON Temple Bangalore – Karnataka',
];

const OTHER_TEMPLES = OTHER_TEMPLE_NAMES.map((name) => ({
 id: `other-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`,
 name,
 deity: 'Temple',
 location: name.split('–')[1]?.trim() || 'India',
 is_verified: true,
}));

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
 return [...JYOTIRLING_TEMPLE_NAMES, ...OTHER_TEMPLE_NAMES].map((name) => name.split('–')[0].trim());
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
 setTemples(res.data || []);
 } catch (error) {
 console.error('Error fetching temples:', error);
 } finally {
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

 const visibleTempleList = selectedTempleSection === 'Jyotirling' ? JYOTIRLING_TEMPLES : OTHER_TEMPLES;
 const normalizedQuery = searchQuery.trim().toLowerCase();
 const searchableTempleList = normalizedQuery ? [...JYOTIRLING_TEMPLES, ...OTHER_TEMPLES] : visibleTempleList;
 const filteredTempleList = searchableTempleList.filter((item) => {
 const templeName = getTempleDisplayName(item).toLowerCase();
 const templeLocation = getTempleLocation(item).toLowerCase();
 const templeDeity = getTempleDeityLabel(item).toLowerCase();
 const matchesSearch = (
 templeName.includes(normalizedQuery) ||
 templeLocation.includes(normalizedQuery) ||
 templeDeity.includes(normalizedQuery)
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
 return (
 <TouchableOpacity 
 key={String(item?.id || item?.name)}
 style={styles.templeCard}
 onPress={() => openTempleDetails(item)}
 >
 <View style={styles.templeIcon}>
 <Image source={imageSource} style={styles.templeIconImage} resizeMode="cover" />
 </View>
 <View style={styles.templeInfo}>
 {renderHighlightedText(getTempleDisplayName(item), searchQuery, styles.templeName, styles.highlightText)}
 <View style={styles.locationRow}>
 <Ionicons name="location" size={14} color={COLORS.textSecondary} />
 {renderHighlightedText(getTempleLocation(item), searchQuery, styles.templeLocation, styles.highlightText)}
 </View>
 {renderHighlightedText(getTempleDeityLabel(item), searchQuery, styles.templeDeity, styles.highlightText)}
 {getTempleAartiText(item) ? (
 <Text style={styles.templeSchedule}>{getTempleAartiText(item)}</Text>
 ) : null}
 </View>
 {item.is_verified && (
 <View style={styles.verifiedBadge}>
 <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
 </View>
 )}
 <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
 </TouchableOpacity>
 );
 };

 return (
 <View style={styles.container}>
 <View style={styles.headerBar}>
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
   autoFocus={isSearchOpen}
   returnKeyType="search"
    underlineColorAndroid="transparent"
  />
  {!searchQuery ? (
   <Animated.Text
    pointerEvents="none"
    style={[
     styles.searchPlaceholder,
     {
      opacity: placeholderOpacity,
      transform: [
       {
        translateX: placeholderOpacity.interpolate({
         inputRange: [0, 1],
         outputRange: [10, 0],
        }),
       },
      ],
     },
    ]}
   >
    {placeholderOptions[placeholderIndex]}
   </Animated.Text>
  ) : null}
  <TouchableOpacity style={styles.searchCloseButton} onPress={closeSearch}>
   <Ionicons name="close" size={16} color={COLORS.textSecondary} />
  </TouchableOpacity>
 </Animated.View>
 ) : (
 <TouchableOpacity style={styles.headerIcon} onPress={openSearch}>
  <Ionicons name="search" size={22} color={COLORS.text} />
 </TouchableOpacity>
 )}
 <TouchableOpacity style={styles.headerIcon} onPress={() => setShowFilterModal(true)}>
 <Ionicons name="filter" size={22} color={COLORS.text} />
 </TouchableOpacity>
 </View>
 </View>
 <ScrollView
 style={styles.contentScroll}
 contentContainerStyle={styles.listContent}
 refreshControl={
 <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} />
 }
 >
 {/* Live Mantra Jaap Banner */}
 <TouchableOpacity 
 style={styles.liveMantraButton}
 onPress={() => router.push('/mantra-jaap' as any)}
 >
 <View style={styles.liveMantraContent}>
 <View style={styles.liveMantraIconWrap}>
 <Ionicons name="radio" size={28} color={COLORS.primary} />
 </View>
 <View style={styles.liveMantraTextContainer}>
 <View style={styles.liveMantraHeaderRow}>
 <Text style={styles.liveMantraTitle}>Live Mantra Jaap</Text>
 <View style={styles.liveBadge}>
 <View style={styles.liveDot} />
 <Text style={styles.liveBadgeText}>Live</Text>
 </View>
 </View>
 <Text style={styles.liveMantraSubtitle}>Join the active chanting room from Temple tab</Text>
 <Text style={styles.liveMantraMeta}>1.2k devotees chanting right now</Text>
 </View>
 <Ionicons name="chevron-forward" size={22} color={COLORS.primary} />
 </View>
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
 <Text style={styles.sectionTitle}>{normalizedQuery ? 'Search Results' : selectedTempleSection}</Text>
 {filteredTempleList.map((item) => renderTempleCard(item))}
 {filteredTempleList.length === 0 ? (
 <View style={styles.emptyState}>
 <Ionicons name="search" size={24} color={COLORS.textLight} />
 <Text style={styles.emptyText}>No temples found</Text>
 </View>
 ) : null}
 </View>
 </ScrollView>

 {/* Filter Modal */}
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
 </View>
 );
}

const styles = StyleSheet.create({
 container: {
 flex: 1,
 backgroundColor: COLORS.background,
 },
 tabsContainer: {
 flexDirection: 'row',
 alignItems: 'center',
 backgroundColor: COLORS.surface,
 borderBottomWidth: 1,
 borderBottomColor: COLORS.divider,
 paddingVertical: SPACING.sm,
 },
 headerBar: {
 flexDirection: 'row',
 alignItems: 'center',
 justifyContent: 'flex-end',
 backgroundColor: COLORS.surface,
 borderBottomWidth: 1,
 borderBottomColor: COLORS.divider,
 paddingVertical: SPACING.sm,
 paddingHorizontal: SPACING.md,
 },
 tab: {
 paddingHorizontal: SPACING.md,
 paddingVertical: SPACING.sm,
 marginLeft: SPACING.sm,
 borderRadius: 20,
 },
 tabActive: {
 backgroundColor: `${COLORS.primary}15`,
 },
 tabText: {
 fontSize: 14,
 color: COLORS.textSecondary,
 fontWeight: '500',
 },
 tabTextActive: {
 color: COLORS.primary,
 fontWeight: '600',
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
 borderWidth: 1,
 borderColor: COLORS.border,
 paddingHorizontal: SPACING.sm,
 marginRight: SPACING.sm,
 minHeight: 36,
 overflow: 'hidden',
 },
 searchInput: {
 flex: 1,
 fontSize: 14,
 color: COLORS.text,
 paddingVertical: SPACING.xs,
 marginLeft: SPACING.xs,
 minHeight: 36,
 },
 searchPlaceholder: {
 position: 'absolute',
 left: 34,
 color: COLORS.textLight,
 fontSize: 14,
 },
 searchCloseButton: {
 padding: 4,
 },
 listContent: {
 paddingBottom: SPACING.lg,
 },
 contentScroll: {
 flex: 1,
 },
 othersSection: {
 marginHorizontal: SPACING.md,
 marginBottom: SPACING.md,
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
 templeCard: {
 flexDirection: 'row',
 alignItems: 'center',
 backgroundColor: COLORS.surface,
 padding: SPACING.md,
 borderRadius: 16,
 marginBottom: 12,
 },
 templeIcon: {
 width: 56,
 height: 56,
 borderRadius: 12,
 backgroundColor: `${COLORS.primary}15`,
 justifyContent: 'center',
 alignItems: 'center',
 marginRight: SPACING.md,
 overflow: 'hidden',
 },
 templeIconImage: {
 width: '100%',
 height: '100%',
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
 locationRow: {
 flexDirection: 'row',
 alignItems: 'center',
 marginBottom: 2,
 },
 templeLocation: {
 fontSize: 13,
 color: COLORS.textSecondary,
 marginLeft: 6,
 flexShrink: 1,
 },
 templeDeity: {
 fontSize: 12,
 color: COLORS.textLight,
 marginTop: 2,
 },
 templeSchedule: {
 fontSize: 12,
 color: COLORS.textSecondary,
 marginTop: 4,
 },
 highlightText: {
 backgroundColor: '#FFF8B3',
 color: COLORS.text,
 },
 youtubeLink: {
 fontSize: 12,
 color: COLORS.primary,
 fontWeight: '600',
 textDecorationLine: 'underline',
 },
 verifiedBadge: {
 marginRight: SPACING.sm,
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
 section: {
 backgroundColor: COLORS.surface,
 marginHorizontal: SPACING.md,
 marginBottom: SPACING.md,
 padding: SPACING.md,
 borderRadius: BORDER_RADIUS.lg,
 },
 sectionTitle: {
 fontSize: 16,
 fontWeight: '600',
 color: COLORS.text,
 marginBottom: SPACING.md,
 },
 aartiTabCard: {
 width: '100%',
 backgroundColor: COLORS.surface,
 borderRadius: BORDER_RADIUS.md,
 padding: SPACING.lg,
 marginBottom: SPACING.sm,
 borderWidth: 1,
 borderColor: COLORS.border,
 justifyContent: 'center',
 },
 aartiTabLabel: {
 fontSize: 20,
 color: COLORS.text,
 fontWeight: '700',
 },
 aartiTabHint: {
 fontSize: 14,
 color: COLORS.textSecondary,
 marginBottom: SPACING.sm,
 },
 aartiSection: {
 backgroundColor: `${COLORS.primary}08`,
 },
 // Live Mantra Jaap Button
 liveMantraButton: {
 marginHorizontal: SPACING.md,
 marginTop: SPACING.md,
 marginBottom: SPACING.sm,
 borderWidth: 2,
 borderColor: COLORS.primary,
 borderStyle: 'dashed',
 borderRadius: BORDER_RADIUS.lg,
 backgroundColor: `${COLORS.primary}08`,
 },
 liveMantraContent: {
 flexDirection: 'row',
 alignItems: 'flex-start',
 padding: SPACING.md,
 gap: SPACING.md,
 },
 liveMantraIconWrap: {
 width: 52,
 height: 52,
 borderRadius: 16,
 backgroundColor: `${COLORS.primary}15`,
 alignItems: 'center',
 justifyContent: 'center',
 },
 liveMantraTextContainer: {
 flex: 1,
 },
 liveMantraHeaderRow: {
 flexDirection: 'row',
 alignItems: 'center',
 justifyContent: 'space-between',
 gap: SPACING.sm,
 },
 liveMantraTitle: {
 fontSize: 18,
 fontWeight: '700',
 color: COLORS.primary,
 },
 liveMantraSubtitle: {
 fontSize: 12,
 color: COLORS.textSecondary,
 marginTop: 2,
 },
 liveMantraMeta: {
 fontSize: 12,
 color: COLORS.text,
 marginTop: 6,
 fontWeight: '600',
 },
 liveBadge: {
 flexDirection: 'row',
 alignItems: 'center',
 gap: 6,
 paddingHorizontal: 10,
 paddingVertical: 4,
 borderRadius: BORDER_RADIUS.full,
 backgroundColor: `${COLORS.error}14`,
 },
 liveDot: {
 width: 8,
 height: 8,
 borderRadius: 4,
 backgroundColor: COLORS.error,
 },
 liveBadgeText: {
 fontSize: 11,
 fontWeight: '700',
 color: COLORS.error,
 textTransform: 'uppercase',
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