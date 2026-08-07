import React, { useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { CommunityFestivalCard } from '../cards/CommunityFestivalCard';

interface CommunityFestivalsTabProps {
  festivals: any[];
  user: any;
  blockedUserIds: string[];
  selectedFestival?: any;
  festivalSort?: string;
  onSelectFestival?: (festival: any) => void;
  onSortChange?: (sort: string) => void;
  onCreateFestivalPost?: () => void;
}

export const CommunityFestivalsTab = React.memo(function CommunityFestivalsTab({
  festivals,
  user,
  blockedUserIds,
  selectedFestival,
  festivalSort = 'latest',
  onSelectFestival,
  onSortChange,
  onCreateFestivalPost,
}: CommunityFestivalsTabProps) {
  
  // Filter out festivals from blocked users
  const filteredFestivals = useMemo(() => {
    if (!blockedUserIds || blockedUserIds.length === 0) return festivals;
    return festivals.filter(festival => {
      const userId = festival.user_id?.toString() || festival.created_by?.toString();
      return !userId || !blockedUserIds.includes(userId);
    });
  }, [festivals, blockedUserIds]);

  // Sort festivals based on selection
  const sortedFestivals = useMemo(() => {
    const sorted = [...filteredFestivals];
    if (festivalSort === 'oldest') {
      sorted.sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateA - dateB;
      });
    } else {
      // Default: latest first
      sorted.sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateB - dateA;
      });
    }
    return sorted;
  }, [filteredFestivals, festivalSort]);

  const renderItem = useCallback(({ item }: { item: any }) => {
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => onSelectFestival && onSelectFestival(item)}
      >
        <CommunityFestivalCard
          festival={item}
          user={user}
          blockedUserIds={blockedUserIds}
        />
      </TouchableOpacity>
    );
  }, [user, blockedUserIds, onSelectFestival]);

  const keyExtractor = useCallback((item: any) => String(item.id), []);

  const handleSortPress = useCallback(() => {
    if (onSortChange) {
      onSortChange(festivalSort === 'latest' ? 'oldest' : 'latest');
    }
  }, [festivalSort, onSortChange]);

  if (sortedFestivals.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No upcoming festivals</Text>
        <Text style={styles.emptySubtext}>Check back later for community festivals</Text>
        {onCreateFestivalPost && (
          <TouchableOpacity style={styles.createButton} onPress={onCreateFestivalPost}>
            <Ionicons name="add-circle-outline" size={24} color="#FF6B00" />
            <Text style={styles.createButtonText}>Create Festival Post</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <>
      <View style={styles.headerRow}>
        <View style={styles.sortButton} onTouchEnd={handleSortPress}>
          <Ionicons 
            name={festivalSort === 'latest' ? 'arrow-down' : 'arrow-up'} 
            size={18} 
            color="#FF6B00" 
          />
          <Text style={styles.sortText}>
            {festivalSort === 'latest' ? 'Latest First' : 'Oldest First'}
          </Text>
        </View>
        <Text style={styles.countText}>
          {sortedFestivals.length} {sortedFestivals.length === 1 ? 'Festival' : 'Festivals'}
        </Text>
      </View>
      <FlashList
        data={sortedFestivals}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        estimatedItemSize={280}
        drawDistance={600}
        removeClippedSubviews={Platform.OS === 'android'}
        windowSize={Platform.OS === 'android' ? 3 : undefined}
        initialNumToRender={5}
        maxToRenderPerBatch={Platform.OS === 'android' ? 3 : undefined}
        contentInsetAdjustmentBehavior="never"
      />
    </>
  );
}, (prevProps, nextProps) => {
  if (prevProps.festivals.length !== nextProps.festivals.length) return false;
  if (prevProps.festivalSort !== nextProps.festivalSort) return false;
  
  for (let i = 0; i < prevProps.festivals.length; i++) {
    if (prevProps.festivals[i].id !== nextProps.festivals[i].id) return false;
  }
  
  return true;
});

const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: '#FFF5EE',
    borderWidth: 1,
    borderColor: '#FF6B00',
  },
  createButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FF6B00',
    marginLeft: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#FFF5EE',
  },
  sortText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF6B00',
    marginLeft: 6,
  },
  countText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
});
