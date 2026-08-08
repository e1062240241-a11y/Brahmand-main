import React, { useState } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { CommunityFeedList } from './components/CommunityFeedList';
import { useCommunityFeed } from './hooks/useCommunityFeed';
import { useCommunitySocket } from './hooks/useCommunitySocket';
import { CommunityModals } from './components/CommunityModals';
import { CommunityHeader } from './components/CommunityHeader';

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

  useCommunitySocket(communityId, activeTab);

  return (
    <SafeAreaView style={styles.safeArea}>
      <CommunityFeedList
        communityId={communityId}
        onRefresh={refresh}
        onLoadMore={loadMore}
        refreshing={refreshing}
        loadingMore={loadingMore}
        ListHeaderComponent={
          <CommunityHeader
            communityId={communityId}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        }
      />

      {/* Screen-level modals ensure list items do not re-render when modals open */}
      <CommunityModals communityId={communityId} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF'
  }
});
