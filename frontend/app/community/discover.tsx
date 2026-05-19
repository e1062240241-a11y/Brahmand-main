import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  ActivityIndicator,
  FlatList,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, FONTS } from '../../src/constants/theme';
import { getCommunities } from '../../src/services/api';
import { Avatar } from '../../src/components/Avatar';

const { width } = Dimensions.get('window');

interface Community {
  id: string;
  name: string;
  type: string;
  label?: string;
  member_count: number;
  photo?: string;
  is_default?: boolean;
}

export default function DiscoverCommunitiesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [createdGroups, setCreatedGroups] = useState<Community[]>([]);
  const [filteredGroups, setFilteredGroups] = useState<Community[]>([]);

  const fetchCommunities = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getCommunities();
      const allComms = response.data || [];
      // Filter exclusively for created local communities
      const userGroupsList = allComms.filter(
        (item: Community) => item.type === 'user_group' || item.type === 'local'
      );
      setCreatedGroups(userGroupsList);
      setFilteredGroups(userGroupsList);
    } catch (error) {
      console.error('Error fetching communities for discovery:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCommunities();
  }, [fetchCommunities]);

  // Handle Search Input Filtering
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredGroups(createdGroups);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = createdGroups.filter(
        group =>
          group.name.toLowerCase().includes(query) ||
          (group.label || '').toLowerCase().includes(query)
      );
      setFilteredGroups(filtered);
    }
  }, [searchQuery, createdGroups]);

  const renderCommunityItem = ({ item, index }: { item: Community; index: number }) => {
    const isPurple = index % 2 === 1 || (item.label || '').toLowerCase().includes('youth');
    const cardBg = isPurple ? '#F7ECFC' : '#EEF5EA';
    const borderColor = isPurple ? '#7A38B3' : '#437953';
    const badgeBg = '#FFFFFF';
    const pillText = isPurple ? 'Youth' : 'Seva';

    return (
      <TouchableOpacity
        style={[styles.groupCard, { backgroundColor: cardBg, borderColor }]}
        onPress={() => router.push(`/community/${item.id}`)}
      >
        <View style={[styles.avatarWrapper, { borderColor: `${borderColor}33` }]}>
          {item.photo ? (
            <Image source={{ uri: item.photo }} style={styles.avatarImage} />
          ) : (
            <Avatar name={item.name} size={48} />
          )}
        </View>

        <View style={styles.cardContent}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.cardMembers}>
            {item.member_count} members
          </Text>
        </View>

        <View style={styles.rightAction}>
          <View style={[styles.pillBadge, { backgroundColor: badgeBg, borderColor }]}>
            <Text style={[styles.pillBadgeText, { color: borderColor }]}>
              {pillText}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={borderColor} style={{ marginLeft: 6 }} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header Bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Local Communities</Text>

        <TouchableOpacity 
          style={styles.createButton}
          onPress={() => router.push('/community/create')}
        >
          <Ionicons name="add" size={14} color="#FFF" />
          <Text style={styles.createButtonText}>Create</Text>
        </TouchableOpacity>
      </View>

      {/* Search Input Container */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#888" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search local communities..."
            placeholderTextColor="#888"
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
        </View>
      </View>

      {/* Content Area */}
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#FF3400" />
        </View>
      ) : filteredGroups.length > 0 ? (
        <FlatList
          data={filteredGroups}
          keyExtractor={item => item.id}
          renderItem={renderCommunityItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="people-outline" size={48} color="#FF3400" />
          </View>
          <Text style={styles.emptyTitle}>No Communities Found</Text>
          <Text style={styles.emptySubtitle}>
            {searchQuery.trim()
              ? "We couldn't find any groups matching your query."
              : "No user groups have been created in the app yet."}
          </Text>
          <TouchableOpacity
            style={styles.emptyCreateBtn}
            onPress={() => router.push('/community/create')}
          >
            <Text style={styles.emptyCreateBtnText}>Create the First One</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFBF7',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: '#000',
  },
  createButton: {
    backgroundColor: '#FF3400',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 3,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  createButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontFamily: FONTS.bold,
  },
  searchWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F2EE',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#000',
    fontFamily: FONTS.regular,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 12,
  },
  groupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  avatarWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1.5,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  cardContent: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    color: '#000',
  },
  cardMembers: {
    fontSize: 11,
    color: '#666',
    fontFamily: FONTS.regular,
    marginTop: 2,
  },
  rightAction: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pillBadge: {
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
  },
  pillBadgeText: {
    fontSize: 10,
    fontFamily: FONTS.bold,
  },
  loadingBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 0.8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF1EE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: '#000',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#666',
    fontFamily: FONTS.regular,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  emptyCreateBtn: {
    backgroundColor: '#FF3400',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  emptyCreateBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontFamily: FONTS.bold,
  },
});
