import React, { useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, Platform, Image } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';

interface CommunityLostFoundTabProps {
  lostFoundPosts: any[];
  user: any;
  blockedUserIds: string[];
}

export const CommunityLostFoundTab = React.memo(function CommunityLostFoundTab({
  lostFoundPosts,
  user,
  blockedUserIds,
}: CommunityLostFoundTabProps) {
  
  // Filter out posts from blocked users
  const filteredPosts = useMemo(() => {
    if (!blockedUserIds || blockedUserIds.length === 0) return lostFoundPosts;
    return lostFoundPosts.filter(post => {
      const userId = post.user_id?.toString() || post.created_by?.toString();
      return !userId || !blockedUserIds.includes(userId);
    });
  }, [lostFoundPosts, blockedUserIds]);

  const renderItem = useCallback(({ item }: { item: any }) => {
    const isLost = item.type === 'lost' || item.status === 'lost';
    
    return (
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={[styles.typeBadge, isLost ? styles.lostBadge : styles.foundBadge]}>
            <Ionicons 
              name={isLost ? 'search-outline' : 'checkmark-circle-outline'} 
              size={16} 
              color="#FFF" 
            />
            <Text style={styles.typeBadgeText}>
              {isLost ? 'LOST' : 'FOUND'}
            </Text>
          </View>
          <Text style={styles.timestamp}>
            {item.created_at ? new Date(item.created_at).toLocaleDateString() : ''}
          </Text>
        </View>
        
        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={2}>
            {item.title || (isLost ? 'Lost Item' : 'Found Item')}
          </Text>
          
          {item.description ? (
            <Text style={styles.description} numberOfLines={3}>
              {item.description}
            </Text>
          ) : null}
          
          {item.location ? (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={16} color="#FF6B00" />
              <Text style={styles.locationText} numberOfLines={1}>
                {item.location}
              </Text>
            </View>
          ) : null}
          
          {item.contact_info ? (
            <View style={styles.contactRow}>
              <Ionicons name="call-outline" size={16} color="#10B981" />
              <Text style={styles.contactText} numberOfLines={1}>
                {item.contact_info}
              </Text>
            </View>
          ) : null}
        </View>
        
        {item.image_url ? (
          <Image 
            source={{ uri: item.image_url }} 
            style={styles.itemImage}
            resizeMode="cover"
          />
        ) : null}
      </View>
    );
  }, []);

  const keyExtractor = useCallback((item: any) => String(item.id), []);

  if (filteredPosts.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No lost & found posts</Text>
        <Text style={styles.emptySubtext}>Check back later for community items</Text>
      </View>
    );
  }

  return (
    <FlashList
      data={filteredPosts}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      estimatedItemSize={200}
      drawDistance={600}
      removeClippedSubviews={Platform.OS === 'android'}
      windowSize={Platform.OS === 'android' ? 3 : undefined}
      initialNumToRender={5}
      maxToRenderPerBatch={Platform.OS === 'android' ? 3 : undefined}
      contentInsetAdjustmentBehavior="never"
    />
  );
}, (prevProps, nextProps) => {
  if (prevProps.lostFoundPosts.length !== nextProps.lostFoundPosts.length) return false;
  
  for (let i = 0; i < prevProps.lostFoundPosts.length; i++) {
    if (prevProps.lostFoundPosts[i].id !== nextProps.lostFoundPosts[i].id) return false;
  }
  
  return true;
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  lostBadge: {
    backgroundColor: '#EF4444',
  },
  foundBadge: {
    backgroundColor: '#10B981',
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFF',
    marginLeft: 4,
  },
  timestamp: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  content: {
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 6,
  },
  description: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  locationText: {
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 4,
    flex: 1,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  contactText: {
    fontSize: 13,
    color: '#10B981',
    marginLeft: 4,
    flex: 1,
  },
  itemImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginTop: 8,
  },
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
});
