import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';

interface CommunitySevaTabProps {
  sevaPosts: any[];
  user: any;
  blockedUserIds: string[];
}

export const CommunitySevaTab = React.memo(function CommunitySevaTab({
  sevaPosts,
  user,
  blockedUserIds,
}: CommunitySevaTabProps) {
  
  const renderItem = useCallback(({ item }: { item: any }) => {
    const senderId = item.user_id || item.sender_id || item.created_by;
    if (senderId && blockedUserIds.includes(String(senderId))) {
      return null;
    }

    return (
      <View style={styles.sevaCard}>
        <View style={styles.header}>
          <Ionicons 
            name="hand-left-outline" 
            size={24} 
            color="#FF6B00" 
            style={styles.icon}
          />
          <Text style={styles.title}>{item.title || 'Seva Opportunity'}</Text>
        </View>
        <Text style={styles.description} numberOfLines={3}>
          {item.description || 'No description provided'}
        </Text>
        <View style={styles.metaRow}>
          {item.location && (
            <Text style={styles.metaText}>
              <Ionicons name="location-outline" size={12} color="#6B7280" />
              {' '}{item.location}
            </Text>
          )}
          {item.date && (
            <Text style={styles.metaText}>
              <Ionicons name="calendar-outline" size={12} color="#6B7280" />
              {' '}{new Date(item.date).toLocaleDateString()}
            </Text>
          )}
        </View>
      </View>
    );
  }, [blockedUserIds]);

  const keyExtractor = useCallback((item: any) => String(item.id), []);

  const filteredSevaPosts = sevaPosts.filter(post => {
    const userId = post.user_id || post.sender_id || post.created_by;
    return !userId || !blockedUserIds.includes(String(userId));
  });

  if (filteredSevaPosts.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="hand-left-outline" size={48} color="#9CA3AF" />
        <Text style={styles.emptyText}>No seva opportunities yet</Text>
        <Text style={styles.emptySubtext}>Check back later for community service opportunities</Text>
      </View>
    );
  }

  return (
    <FlashList
      data={filteredSevaPosts}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      estimatedItemSize={160}
      drawDistance={400}
      removeClippedSubviews={Platform.OS === 'android'}
      windowSize={Platform.OS === 'android' ? 3 : undefined}
      initialNumToRender={5}
      maxToRenderPerBatch={Platform.OS === 'android' ? 3 : undefined}
      contentInsetAdjustmentBehavior="never"
    />
  );
}, (prevProps, nextProps) => {
  if (prevProps.sevaPosts.length !== nextProps.sevaPosts.length) return false;
  if (prevProps.user?.id !== nextProps.user?.id) return false;
  
  for (let i = 0; i < prevProps.sevaPosts.length; i++) {
    if (prevProps.sevaPosts[i].id !== nextProps.sevaPosts[i].id) return false;
  }
  
  return true;
});

const styles = StyleSheet.create({
  sevaCard: {
    backgroundColor: '#FFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  icon: {
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metaText: {
    fontSize: 12,
    color: '#6B7280',
    flexDirection: 'row',
    alignItems: 'center',
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
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
  },
});
