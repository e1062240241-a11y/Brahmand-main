import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
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
 Dimensions,
 ActivityIndicator,
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getTemples } from '../../src/services/api';
import { FONTS } from '../../src/constants/theme';
import { TEMPLE_IMAGES, DEFAULT_TEMPLE_IMAGE, getTempleImageByName } from '../../src/constants/templeImages';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const JYOTIRLING_TEMPLES = [
  { id: 'jyotirling-somnath-temple-gujarat', name: 'Somnath Temple', location: 'Gujarat', deity: 'Lord Shiva' },
  { id: 'jyotirling-kedarnath-temple-uttarakhand', name: 'Kedarnath Temple', location: 'Uttarakhand', deity: 'Lord Shiva' },
  { id: 'jyotirling-mahakaleshwar-temple-ujjain', name: 'Mahakaleshwar Temple', location: 'Ujjain, Madhya Pradesh', deity: 'Lord Shiva' },
  { id: 'jyotirling-kashi-vishwanath-temple-varanasi', name: 'Kashi Vishwanath Temple', location: 'Varanasi, Uttar Pradesh', deity: 'Lord Shiva' },
  { id: 'jyotirling-bhimashankar-temple-maharashtra', name: 'Bhimashankar Temple', location: 'Pune, Maharashtra', deity: 'Lord Shiva' },
  { id: 'jyotirling-ramanathaswamy-temple-rameswaram', name: 'Ramanathaswamy Temple', location: 'Tamil Nadu', deity: 'Lord Shiva' },
];

export default function TempleScreen() {
  const router = useRouter();
  const [selectedTempleSection, setSelectedTempleSection] = useState<'Jyotirling' | 'Others'>('Jyotirling');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [temples, setTemples] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<'All' | 'Jyotirlinga' | 'Sacred'>('All');
  const [loading, setLoading] = useState(true);
  const [selectedLocations, setSelectedLocations] = useState<Set<string>>(new Set());
  const scrollY = useRef(new Animated.Value(0)).current;

  const fetchData = async () => {
    try {
      setRefreshing(true);
      const response = await getTemples();
      if (response.data) {
        setTemples(response.data);
      }
    } catch (error) {
      console.error('Error fetching temples:', error);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openTempleDetails = (item: any) => {
    router.push(`/temple/${encodeURIComponent(String(item.id))}`);
  };

  const getTempleDisplayName = (item: any) => item.name;
  const getTempleLocation = (item: any) => {
    if (typeof item.location === 'string') return item.location;
    if (typeof item.location === 'object' && item.location !== null) {
      const { area, city, state } = item.location;
      return [area, city, state].filter(Boolean).join(', ');
    }
    return item.location || 'Unknown Location';
  };
  const getTempleDeityLabel = (item: any) => item.deity;

  const filteredTempleList = (temples || []).filter(t => {
    const loc = getTempleLocation(t);
    const matchesSearch = (t.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
     loc.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesLocation = (selectedLocations.size === 0 || selectedLocations.has(loc.split(',').pop()?.trim() || loc));
    
    let matchesCategory = true;
    if (selectedCategory === 'Jyotirlinga') {
      matchesCategory = t.category === 'Jyotirlinga';
    } else if (selectedCategory === 'Sacred') {
      matchesCategory = t.category !== 'Jyotirlinga';
    }

    return matchesSearch && matchesLocation && matchesCategory;
  });

  const uniqueLocations = Array.from(new Set((temples || []).map(t => {
    const loc = getTempleLocation(t);
    return loc.split(',').pop()?.trim() || loc;
  }))).sort();

  const toggleLocationFilter = (location: string) => {
    const newLocs = new Set(selectedLocations);
    if (newLocs.has(location)) newLocs.delete(location);
    else newLocs.add(location);
    setSelectedLocations(newLocs);
  };

  return (
    <LinearGradient
      colors={['#FF8D57', '#EA9B76', '#FFFFFF']}
      locations={[0, 0.0481, 0.2404]}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={styles.container} edges={['top']}>
      {/* Top Tab Switcher */}
      <View style={styles.topTabsContainer}>
        <View style={styles.topTabsInner}>
          <TouchableOpacity 
            style={styles.topTabButton}
            onPress={() => router.push('/jaap' as any)}
          >
            <Text style={styles.topTabText}>Jaap</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.topTabButton, styles.topTabButtonActive]}
            activeOpacity={1}
          >
            <Text style={[styles.topTabText, styles.topTabTextActive]}>Temple</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Animated.ScrollView
        style={styles.contentScroll}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={fetchData} />
        }
      >
        {/* Hero Section */}
        <View style={styles.heroRowLayout}>
          <View style={styles.heroLeftContent}>
            <TouchableOpacity style={styles.heroBackButton} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={28} color="#2D1B13" />
            </TouchableOpacity>
            
            <Text style={styles.heroDiscoverText}>Discover</Text>
            <Text style={styles.heroSacredText}>Sacred</Text>
            <Text style={styles.heroSacredText}>Temples</Text>
            
            <View style={styles.ornateDivider}>
              <LinearGradient
                colors={['rgba(255, 102, 0, 0)', 'rgba(255, 102, 0, 0.5)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.ornateLineGradient}
              />
              <View style={styles.ornateDiamond}>
                <View style={styles.diamondInner} />
              </View>
              <LinearGradient
                colors={['rgba(255, 102, 0, 0.5)', 'rgba(255, 102, 0, 0)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.ornateLineGradient}
              />
            </View>

            <Text style={styles.heroSubtitleBlended}>
              Explore divine places, seek blessings{"\n"}and connect with spirituality.
            </Text>
          </View>

          <View style={styles.heroRightImageContainer}>
            <Image 
              source={require('../../assets/images/image temple/SomnathTemple.jpg')} 
              style={styles.heroSideImage} 
              resizeMode="cover"
            />
            <LinearGradient
              colors={['#FFFCEB', 'rgba(255, 252, 235, 0)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.heroLeftMask}
            />
            <View style={styles.heroAncientOverlay} />
          </View>
        </View>

        <View style={styles.searchSection}>
          <View style={styles.searchBarWrapper}>
            <Ionicons name="search-outline" size={22} color="#111" style={{ marginRight: 12 }} />
            <TextInput 
              placeholder="Search temple name..."
              style={styles.searchInputField}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#888"
            />
            <TouchableOpacity onPress={() => setShowFilterModal(true)}>
              <Ionicons name="options-outline" size={22} color="#FF6600" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Category Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryPillsRow} contentContainerStyle={{ paddingHorizontal: 20 }}>
          <TouchableOpacity 
            style={[styles.catPill, selectedCategory === 'All' && styles.catPillActive]}
            onPress={() => setSelectedCategory('All')}
          >
            <MaterialCommunityIcons name="home-variant" size={18} color={selectedCategory === 'All' ? "#FF6600" : "#555"} style={{ marginRight: 6 }} />
            <Text style={[styles.catPillText, selectedCategory === 'All' && styles.catPillTextActive]}>All Temples</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.catPill, selectedCategory === 'Jyotirlinga' && styles.catPillActive]}
            onPress={() => setSelectedCategory('Jyotirlinga')}
          >
            <Text style={{ fontSize: 18, marginRight: 6 }}>🔱</Text>
            <Text style={[styles.catPillText, selectedCategory === 'Jyotirlinga' && styles.catPillTextActive]}>Jyotirlinga</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.catPill, selectedCategory === 'Sacred' && styles.catPillActive]}
            onPress={() => setSelectedCategory('Sacred')}
          >
            <Ionicons name="sparkles-outline" size={16} color={selectedCategory === 'Sacred' ? "#FF6600" : "#555"} style={{ marginRight: 6 }} />
            <Text style={[styles.catPillText, selectedCategory === 'Sacred' && styles.catPillTextActive]}>Sacred</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Temple List */}
        <View style={styles.templeListContainer}>
          {loading && !refreshing ? (
            <ActivityIndicator size="large" color="#FF6600" style={{ marginTop: 40 }} />
          ) : filteredTempleList.length > 0 ? (
            filteredTempleList.map((item) => (
              <Link href={`/temple/${encodeURIComponent(String(item.id))}`} asChild key={item.id}>
                <TouchableOpacity 
                  style={styles.templeItemCard}
                  activeOpacity={0.7}
                >
                  <Image 
                    source={TEMPLE_IMAGES[item.id] || getTempleImageByName(item.name) || (item.image_url ? { uri: item.image_url } : DEFAULT_TEMPLE_IMAGE)} 
                    style={styles.templeItemImage} 
                  />
                  <View style={styles.templeItemInfo}>
                    <Text style={styles.templeItemName}>{getTempleDisplayName(item)}</Text>
                    <View style={styles.templeItemLocRow}>
                      <Ionicons name="location" size={14} color="#888" />
                      <Text style={styles.templeItemLocText}>{getTempleLocation(item)}</Text>
                    </View>
                    <Text style={styles.templeItemDeity}>Dedicated to {getTempleDeityLabel(item)}</Text>
                    <View style={styles.templeItemTag}>
                      <Ionicons name="sparkles" size={12} color="#D35400" />
                      <Text style={styles.templeItemTagText}>{item.category || 'Sacred'}</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#BBB" />
                </TouchableOpacity>
              </Link>
            ))
          ) : (
            <View style={{ alignItems: 'center', marginTop: 40 }}>
              <Text style={{ color: '#888', fontFamily: FONTS.medium }}>No temples found matching your search.</Text>
            </View>
          )}
        </View>
      </Animated.ScrollView>

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
                <Ionicons name="close" size={24} color="#111" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.filterOptionsList}>
              {uniqueLocations.map((location) => (
                <TouchableOpacity
                  key={location}
                  style={styles.filterOption}
                  onPress={() => toggleLocationFilter(location)}
                >
                  <View style={[styles.filterCheckbox, selectedLocations.has(location) && styles.filterCheckboxActive]}>
                    {selectedLocations.has(location) && <Ionicons name="checkmark" size={16} color="#FF6600" />}
                  </View>
                  <Text style={[styles.filterOptionText, selectedLocations.has(location) && styles.filterOptionTextActive]}>
                    {location}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentScroll: { flex: 1 },
  topTabsContainer: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 5 },
  topTabsInner: {
    flexDirection: 'row',
    backgroundColor: 'rgba(243, 244, 246, 0.5)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(229, 231, 235, 0.5)',
    paddingTop: 5,
    paddingRight: 7.5,
    paddingBottom: 4,
    paddingLeft: 4,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  topTabButton: { 
    flex: 1, 
    height: 34, 
    borderRadius: 12, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  topTabButtonActive: { 
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 2, height: 0 },
    elevation: 5,
  },
  topTabText: { fontSize: 14, fontFamily: FONTS.bold, color: '#8E8E93' },
  topTabTextActive: { color: '#EA4C0F' },

  heroRowLayout: { flexDirection: 'row', width: '100%', marginBottom: 20, paddingBottom: 25 },
  heroLeftContent: { flex: 1, paddingLeft: 20, paddingTop: 15, justifyContent: 'center' },
  heroRightImageContainer: { width: '50%', height: 345, position: 'relative', overflow: 'hidden' },
  heroSideImage: { width: '100%', height: '100%', transform: [{ scale: 1.6 }] },
  heroLeftMask: { position: 'absolute', left: 0, top: 0, width: '75%', height: '100%', zIndex: 2 },
  heroAncientOverlay: { position: 'absolute', width: '100%', height: '100%', backgroundColor: 'rgba(184, 134, 11, 0.28)', zIndex: 1 },
  
  heroBackButton: { marginBottom: 15 },
  heroDiscoverText: { fontSize: 42, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', fontWeight: 'bold', color: '#2D1B13', letterSpacing: -0.5 },
  heroSacredText: { fontSize: 42, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', fontWeight: 'bold', color: '#FF6600', marginTop: -10, letterSpacing: -0.5 },
  
  ornateDivider: { flexDirection: 'row', alignItems: 'center', marginVertical: 15, width: '90%' },
  ornateLineGradient: { flex: 1, height: 1.5 },
  ornateDiamond: { width: 14, height: 14, backgroundColor: 'transparent', marginHorizontal: 6, justifyContent: 'center', alignItems: 'center' },
  diamondInner: { width: 7, height: 7, backgroundColor: '#FF6600', transform: [{ rotate: '45deg' }] },
  
  heroSubtitleBlended: { fontSize: 14, color: '#4E342E', fontFamily: FONTS.medium, lineHeight: 20, opacity: 0.9 },

  searchSection: { paddingHorizontal: 20, marginBottom: 20 },
  searchBarWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 30, paddingHorizontal: 20, paddingVertical: 14, elevation: 4, shadowOpacity: 0.1, shadowRadius: 10 },
  searchInputField: { flex: 1, fontSize: 14, color: '#333', fontFamily: FONTS.medium },

  categoryPillsRow: { marginBottom: 20 },
  catPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 30, marginRight: 12 },
  catPillActive: { backgroundColor: '#FFF5EB' },
  catPillText: { fontSize: 14, fontFamily: FONTS.bold, color: '#555' },
  catPillTextActive: { color: '#FF6600' },

  templeListContainer: { paddingHorizontal: 20, paddingBottom: 40 },
  templeItemCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 20, padding: 12, marginBottom: 15, elevation: 2, shadowOpacity: 0.05, shadowRadius: 5 },
  templeItemImage: { width: 90, height: 90, borderRadius: 15 },
  templeItemInfo: { flex: 1, marginLeft: 15 },
  templeItemName: { fontSize: 16, fontFamily: FONTS.bold, color: '#111', marginBottom: 4 },
  templeItemLocRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  templeItemLocText: { fontSize: 12, color: '#888', marginLeft: 4, fontFamily: FONTS.medium },
  templeItemDeity: { fontSize: 11, color: '#555', fontFamily: FONTS.medium, marginBottom: 6 },
  templeItemTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF4E5', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  templeItemTagText: { fontSize: 10, fontFamily: FONTS.bold, color: '#D35400', marginLeft: 4 },

  filterModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  filterModalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '70%', paddingBottom: 40 },
  filterModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  filterModalTitle: { fontSize: 18, fontFamily: FONTS.bold, color: '#111' },
  filterOptionsList: { padding: 20 },
  filterOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  filterCheckbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: '#DDD', marginRight: 12, justifyContent: 'center', alignItems: 'center' },
  filterCheckboxActive: { borderColor: '#FF6600', backgroundColor: '#FFFBF1' },
  filterOptionText: { fontSize: 16, color: '#444', fontFamily: FONTS.regular },
  filterOptionTextActive: { color: '#FF6600', fontFamily: FONTS.bold },
});
