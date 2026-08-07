import React, { useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, Platform, Linking, Alert } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { CommunityRequestCard } from '../cards/CommunityRequestCard';

interface CommunityRequestsTabProps {
  requests: any[];
  user: any;
  blockedUserIds: string[];
  onFulfillRequest?: (requestId: string) => void;
}

export const CommunityRequestsTab = React.memo(function CommunityRequestsTab({
  requests,
  user,
  blockedUserIds,
  onFulfillRequest,
}: CommunityRequestsTabProps) {
  
  // Filter out requests from blocked users
  const filteredRequests = useMemo(() => {
    if (!blockedUserIds || blockedUserIds.length === 0) return requests;
    return requests.filter(request => {
      const userId = request.user_id?.toString() || request.created_by?.toString();
      return !userId || !blockedUserIds.includes(userId);
    });
  }, [requests, blockedUserIds]);

  const handleCall = useCallback((phone: string) => {
    Linking.openURL(`tel:${phone}`);
  }, []);

  const handleWhatsApp = useCallback((phone: string) => {
    Linking.openURL(`https://wa.me/${phone.replace(/[^0-9]/g, '')}`);
  }, []);

  const handleFulfill = useCallback((requestId: string) => {
    if (onFulfillRequest) {
      onFulfillRequest(requestId);
    } else {
      Alert.alert('Fulfill Request', 'Mark this request as fulfilled?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Yes', onPress: () => onFulfillRequest?.(requestId) }
      ]);
    }
  }, [onFulfillRequest]);

  const renderItem = useCallback(({ item }: { item: any }) => {
    return (
      <CommunityRequestCard
        request={item}
        user={user}
        blockedUserIds={blockedUserIds}
        onCall={handleCall}
        onWhatsApp={handleWhatsApp}
        onFulfill={handleFulfill}
      />
    );
  }, [user, blockedUserIds, handleCall, handleWhatsApp, handleFulfill]);

  const keyExtractor = useCallback((item: any) => String(item.id), []);

  if (filteredRequests.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No help requests</Text>
        <Text style={styles.emptySubtext}>Check back later for community requests</Text>
      </View>
    );
  }

  return (
    <FlashList
      data={filteredRequests}
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
  if (prevProps.requests.length !== nextProps.requests.length) return false;
  
  for (let i = 0; i < prevProps.requests.length; i++) {
    if (prevProps.requests[i].id !== nextProps.requests[i].id) return false;
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
