import React, { useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { CommunityEventCard } from '../cards/CommunityEventCard';

interface CommunityEventsTabProps {
  events: any[];
  user: any;
  blockedUserIds: string[];
  onRSVP?: (eventId: string, response: 'yes' | 'no') => void;
}

export const CommunityEventsTab = React.memo(function CommunityEventsTab({
  events,
  user,
  blockedUserIds,
  onRSVP,
}: CommunityEventsTabProps) {
  
  // Filter out events from blocked users
  const filteredEvents = useMemo(() => {
    if (!blockedUserIds || blockedUserIds.length === 0) return events;
    return events.filter(event => {
      const userId = event.user_id?.toString() || event.created_by?.toString();
      return !userId || !blockedUserIds.includes(userId);
    });
  }, [events, blockedUserIds]);

  const handleRSVP = useCallback((eventId: string, response: 'yes' | 'no') => {
    if (onRSVP) {
      onRSVP(eventId, response);
    }
  }, [onRSVP]);

  const renderItem = useCallback(({ item }: { item: any }) => {
    return (
      <CommunityEventCard
        event={item}
        user={user}
        blockedUserIds={blockedUserIds}
        onRSVP={handleRSVP}
      />
    );
  }, [user, blockedUserIds, handleRSVP]);

  const keyExtractor = useCallback((item: any) => String(item.id), []);

  if (filteredEvents.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No upcoming events</Text>
        <Text style={styles.emptySubtext}>Check back later for community events</Text>
      </View>
    );
  }

  return (
    <FlashList
      data={filteredEvents}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      estimatedItemSize={220}
      drawDistance={600}
      removeClippedSubviews={Platform.OS === 'android'}
      windowSize={Platform.OS === 'android' ? 3 : undefined}
      initialNumToRender={5}
      maxToRenderPerBatch={Platform.OS === 'android' ? 3 : undefined}
      contentInsetAdjustmentBehavior="never"
    />
  );
}, (prevProps, nextProps) => {
  if (prevProps.events.length !== nextProps.events.length) return false;
  
  for (let i = 0; i < prevProps.events.length; i++) {
    if (prevProps.events[i].id !== nextProps.events[i].id) return false;
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
});
