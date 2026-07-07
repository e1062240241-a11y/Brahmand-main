import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, TextInput, FlatList, Platform, Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useVendorStore } from '../../../src/store/vendorStore';
import formatDistance from '../../../src/utils/formatDistance';

export default function CategoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { category } = useLocalSearchParams<{ category: string }>();
  const [searchTerm, setSearchTerm] = useState('');
  
  const { vendors, fetchVendors } = useVendorStore();
  const [displayVendors, setDisplayVendors] = useState<any[]>([]);

  useEffect(() => {
    fetchVendors();
  }, []);

  useEffect(() => {
    const term = (category || '').toLowerCase();
    const filtered = vendors.filter(v => {
      const cats = v.categories || [];
      const hasCat = cats.some(c => c.toLowerCase().includes(term));
      const hasName = (v.business_name || '').toLowerCase().includes(term);
      const isSearchMatch = searchTerm ? (v.business_name || '').toLowerCase().includes(searchTerm.toLowerCase()) : true;
      return (hasCat || hasName) && isSearchMatch;
    });
    // For demo purposes and exact match with screenshot, we can just render the filtered list.
    setDisplayVendors(filtered);
  }, [vendors, category, searchTerm]);

  const handleCall = (phone: string) => {
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    }
  };

  const renderVendorCard = ({ item, index }: { item: any, index: number }) => {
    const photo = (item.business_gallery_images || []).find((url: string) => !!url) || (item.photos && item.photos[0]);
    const displayName = item.business_name && item.business_name.length > 0 ? item.business_name : 'Unnamed Business';
    const displayTag = (item.categories && item.categories.length > 0) ? item.categories[0] : category;
    const distanceStr = item.distance !== undefined && item.distance !== null ? formatDistance(item.distance) : '762m away';

    return (
      <TouchableOpacity 
        style={styles.cardContainer}
        activeOpacity={0.85}
        onPress={() => router.push(`/vendor/${item.id}`)}
      >
        {photo ? (
          <Image source={{ uri: photo }} style={styles.cardImage} />
        ) : (
          <View style={[styles.cardImage, { backgroundColor: '#F0F0F0', justifyContent: 'center', alignItems: 'center' }]}>
            <Ionicons name="hammer" size={32} color="#FD6500" />
          </View>
        )}
        <View style={styles.cardInfo}>
          <Text style={styles.cardName} numberOfLines={1}>{displayName}</Text>
          <View style={styles.tagContainer}>
            <Text style={styles.tagText}>{displayTag}</Text>
          </View>
          <View style={styles.locationContainer}>
            <Ionicons name="location-outline" size={14} color="#666" />
            <Text style={styles.locationText}>{distanceStr}</Text>
          </View>
          <TouchableOpacity style={styles.requestButton} onPress={() => handleCall(item.phone_number)}>
            <Text style={styles.requestButtonText}>Request Call</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.callCircle} onPress={() => handleCall(item.phone_number)}>
            <Ionicons name="call" size={16} color="#FD6500" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const getCategoryIcon = () => {
    const cat = (category || '').trim().toLowerCase();
    switch (cat) {
      case 'astrologer':
        return <Image source={require('../../../assets/images/tab-bar/rashi/vendor/siren.png')} style={{ width: 48, height: 48, marginBottom: 12 }} resizeMode="contain" />;
      case 'electrician':
        return <Image source={require('../../../assets/images/tab-bar/rashi/vendor/lightning.png')} style={{ width: 48, height: 48, marginBottom: 12 }} resizeMode="contain" />;
      case 'panditji':
        return <Image source={require('../../../assets/images/tab-bar/rashi/vendor/panditji_icon.png')} style={{ width: 48, height: 48, marginBottom: 12 }} resizeMode="contain" />;
      case 'carpenter':
        return <Image source={require('../../../assets/images/tab-bar/rashi/vendor/hammer_custom.png')} style={{ width: 48, height: 48, marginBottom: 12 }} resizeMode="contain" />;
      case 'plumber':
        return <Image source={require('../../../assets/images/tab-bar/rashi/vendor/plumber_icon.png')} style={{ width: 48, height: 48, marginBottom: 12 }} resizeMode="contain" />;
      case 'general store':
        return <Image source={require('../../../assets/images/tab-bar/rashi/vendor/general_store.png')} style={{ width: 48, height: 48, marginBottom: 12 }} resizeMode="contain" />;
      case 'dairy':
        return <Image source={require('../../../assets/images/tab-bar/rashi/vendor/cow.png')} style={{ width: 48, height: 48, marginBottom: 12 }} resizeMode="contain" />;
      case 'salon':
        return <Image source={require('../../../assets/images/tab-bar/rashi/vendor/salon_icon.png')} style={{ width: 48, height: 48, marginBottom: 12 }} resizeMode="contain" />;
      default:
        return <Ionicons name="alert-circle-outline" size={48} color="#FD6500" style={{ marginBottom: 12 }} />;
    }
  };

  const dataToRender = displayVendors;

  return (
    <LinearGradient
      colors={['#FF8D57', '#EA9B76', '#F8EDE7']}
      locations={[0, 0.05, 0.25]}
      style={styles.container}
    >
      <View style={{ paddingTop: Math.max(insets.top, 20) }}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color="#000" />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            {category === 'Carpenter' && (
               <Image source={require('../../../assets/images/tab-bar/rashi/vendor/hammer_custom.png')} style={{width: 24, height: 24, marginRight: 8}} resizeMode="contain" />
            )}
            <Text style={styles.headerTitle}>{category}</Text>
          </View>
          <TouchableOpacity style={styles.bellButton} onPress={() => router.push('/notifications?filter=vendor')}>
            <Ionicons name="notifications-outline" size={22} color="#000" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search..."
            placeholderTextColor="#9CA3AF"
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
          <TouchableOpacity style={styles.filterButton}>
            <Ionicons name="options-outline" size={20} color="#FD6500" />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={dataToRender}
        renderItem={renderVendorCard}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        // ponytail: Display a friendly empty state instead of a blank screen when no vendors are in the area
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            {getCategoryIcon()}
            <Text style={styles.emptyText}>Currently no "{category}" in your area.</Text>
          </View>
        }
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  backButton: {
    padding: 4,
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#000',
  },
  bellButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    height: 44,
    borderRadius: 22,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#666',
  },
  filterButton: {
    padding: 4,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 16,
  },
  cardContainer: {
    width: '100%',
    height: 130,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    flexDirection: 'row',
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  cardImage: {
    width: 110,
    height: 110,
    borderRadius: 16,
    marginRight: 16,
  },
  cardInfo: {
    flex: 1,
    justifyContent: 'center',
    position: 'relative',
  },
  cardName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#000',
    marginBottom: 6,
    paddingRight: 32, // leave space for call icon
  },
  tagContainer: {
    backgroundColor: '#FFF0E6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  tagText: {
    color: '#FD6500',
    fontSize: 12,
    fontWeight: '600',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationText: {
    fontSize: 12,
    color: '#000',
    marginLeft: 4,
    fontWeight: '500',
  },
  requestButton: {
    backgroundColor: '#FD6500',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    alignSelf: 'flex-start',
  },
  requestButtonText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  callCircle: {
    position: 'absolute',
    right: 4,
    top: 24,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF0E6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 120,
    paddingHorizontal: 24,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    fontWeight: '600',
  },
});

