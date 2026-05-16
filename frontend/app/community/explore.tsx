import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING } from '../../src/constants/theme';
import { discoverCommunities } from '../../src/services/api';
import { Avatar } from '../../src/components/Avatar';

interface Community {
  id: string;
  name: string;
  type: string;
  member_count: number;
  photo?: string;
}

export default function CommunityExploreScreen() {
  const router = useRouter();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchCommunities();
  }, []);

  const fetchCommunities = async () => {
    try {
      const response = await discoverCommunities();
      // Filter for user groups as per request context "Local Communities (User Groups)"
      const filtered = (response.data || []).filter((c: any) => c.type === 'user_group');
      setCommunities(filtered);
    } catch (error) {
      console.error('Error fetching communities:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCommunities = communities.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderCommunityItem = ({ item }: { item: Community }) => (
    <View style={styles.communityItem}>
      <Avatar name={item.name} photo={item.photo} size={50} />
      <View style={styles.communityInfo}>
        <Text style={styles.communityName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.memberCount}>{item.member_count} members</Text>
      </View>
      <TouchableOpacity
        style={styles.joinButton}
        onPress={() => router.push({
          pathname: '/community/join-prompt',
          params: { id: item.id, name: item.name, photo: item.photo }
        })}
      >
        <Text style={styles.joinButtonText}>Join</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Explore Groups</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#888" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search groups..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {loading ? (
          <ActivityIndicator style={{ flex: 1 }} color={COLORS.primary} />
        ) : (
          <FlatList
            data={filteredCommunities}
            keyExtractor={item => item.id}
            renderItem={renderCommunityItem}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No groups found</Text>
              </View>
            }
          />
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFBF7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: '#000',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1,
    borderColor: '#EEE',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    fontFamily: FONTS.regular,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  communityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F5F5F5',
    elevation: 1,
  },
  communityInfo: {
    flex: 1,
    marginLeft: 12,
  },
  communityName: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: '#111',
  },
  memberCount: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
    fontFamily: FONTS.regular,
  },
  joinButton: {
    backgroundColor: '#FF6600',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 10,
  },
  joinButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontFamily: FONTS.bold,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    fontFamily: FONTS.medium,
  },
});
