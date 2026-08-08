import React, { useState } from 'react';
import { SafeAreaView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { CommunityFeedList } from './components/CommunityFeedList';
import { useCommunityFeed } from './hooks/useCommunityFeed';
import { useCommunitySocket } from './hooks/useCommunitySocket';

export default function CommunityDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState('Feed');

  const communityId = id || '';

  const {
    loading,
    loadingMore,
    refreshing,
    fetchPosts,
    loadMore,
    refresh
  } = useCommunityFeed(communityId, activeTab);

  useCommunitySocket(communityId);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF' }}>
      {/* Header and Tabs would go here inside ListHeaderComponent */}
      <CommunityFeedList
        communityId={communityId}
        onRefresh={refresh}
        onLoadMore={loadMore}
        refreshing={refreshing}
        loadingMore={loadingMore}
      />
    </SafeAreaView>
  );
}
