import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';

interface CommunityTempleTabProps {
  templeUpdates: any[];
  user: any;
  blockedUserIds: string[];
}

export const CommunityTempleTab = React.memo(function CommunityTempleTab({
  templeUpdates,
  user,
  blockedUserIds,
}: CommunityTempleTabProps) {
  
  const renderItem = useCallback(({ item }: { item: any }) => {
    const senderId = item.user_id || item.sender_id || item.created_by;
    if (senderId && blockedUserIds.includes(String(senderId))) {
      return null;
    }

    return (
      <View style={styles.templeCard}>
        <View style={styles.header}>
          <Ionicons 
            name="business-outline" 
            size={24} 
            color="#8B5CF6" 
            style={styles.icon}
          />
          <Text style={styles.title}>{item.title || 'Temple Update'}</Text>
        </View>
        <Text style={styles.description} numberOfLines={4}>
          {item.content || item.description || 'No update available'}
        </Text>
        <View style={styles.metaRow}>
          {item.temple_name && (
            <Text style={styles.metaText}>
              <Ionicons name="location-outline" size={12} color="#6B7280" />
              {' '}{item.temple_name}
            </Text>
          )}
          {item.created_at && (
            <Text style={styles.metaText}>
              <Ionicons name="time-outline" size={12} color="#6B7280" />
              {' '}{new Date(item.created_at).toLocaleDateString()}
            </Text>
          )}
        </View>
      </View>
    );
  }, [blockedUserIds]);

  const keyExtractor = useCallback((item: any) => String(item.id), []);

  const filteredTempleUpdates = templeUpdates.filter(update => {
    const userId = update.user_id || update.sender_id || update.created_by;
    return !userId || !blockedUserIds.includes(String(userId));
  });

  if (filteredTempleUpdates.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="business-outline" size={48} color="#9CA3AF" />
        <Text style={styles.emptyText}>No temple updates yet</Text>
        <Text style={styles.emptySubtext}>Check back later for temple announcements</Text>
      </View>
    );
  }

  return (
    <FlashList
      data={filteredTempleUpdates}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      estimatedItemSize={180}
      drawDistance={400}
      removeClippedSubviews={Platform.OS === 'android'}
      windowSize={Platform.OS === 'android' ? 3 : undefined}
      initialNumToRender={5}
      maxToRenderPerBatch={Platform.OS === 'android' ? 3 : undefined}
      contentInsetAdjustmentBehavior="never"
    />
  );
}, (prevProps, nextProps) => {
  if (prevProps.templeUpdates.length !== nextProps.templeUpdates.length) return false;
  if (prevProps.user?.id !== nextProps.user?.id) return false;
  
  for (let i = 0; i < prevProps.templeUpdates.length; i++) {
    if (prevProps.templeUpdates[i].id !== nextProps.templeUpdates[i].id) return false;
  }
  
  return true;
});

const styles = StyleSheet.create({
  templeCard: {
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
