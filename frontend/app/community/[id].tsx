import React, { useEffect, useCallback, useRef } from 'react';
import { Platform, KeyboardAvoidingView, View, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@expo/router';
import { InteractionManager } from 'react-native';

import { useCommunityData } from '../../src/components/community/hooks/useCommunityData';
import { CommunityHeader } from '../../src/components/community/CommunityHeader';
import { CommunityTabs } from '../../src/components/community/CommunityTabs';
import { CommunityFeedTab } from '../../src/components/community/tabs/CommunityFeedTab';
import { CommunityRequestsTab } from '../../src/components/community/tabs/CommunityRequestsTab';
import { CommunityEventsTab } from '../../src/components/community/tabs/CommunityEventsTab';
import { CommunityFestivalsTab } from '../../src/components/community/tabs/CommunityFestivalsTab';
import { CommunityLostFoundTab } from '../../src/components/community/tabs/CommunityLostFoundTab';
import { CommunitySevaTab } from '../../src/components/community/tabs/CommunitySevaTab';
import { CommunityTempleTab } from '../../src/components/community/tabs/CommunityTempleTab';
import { CommunityMyPostsTab } from '../../src/components/community/tabs/CommunityMyPostsTab';

// Module-level tracker for video playback (only ONE video plays at a time)
let currentlyPlayingVideoKey: string | null = null;

export default function CommunityScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  
  const data = useCommunityData(id as string);
  const { community, activeTab, setActiveTab, user, blockedUserIds, loading } = data;

  // Cleanup on screen unmount - reset video tracker
  useEffect(() => {
    return () => {
      currentlyPlayingVideoKey = null;
    };
  }, []);

  // Android: Defer heavy data fetch until after screen transition
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS === 'android') {
        const task = InteractionManager.runAfterInteractions(() => {
          data.handleRefresh();
        });
        return () => task.cancel();
      } else {
        data.handleRefresh();
      }
    }, [id])
  );

  const handleGoBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/messages');
    }
  }, [router]);

  // Render active tab component
  const renderActiveTab = () => {
    const commonProps = {
      user,
      blockedUserIds,
      onLikePost: data.handleLikePost,
      onComment: data.handleComment,
      onShare: data.handleShare,
    };

    switch (activeTab) {
      case 'Feed':
        return (
          <CommunityFeedTab
            posts={data.posts}
            loadingMore={data.loadingMore}
            onLoadMore={data.handleLoadMore}
            activePostIndexRef={data.activePostIndexRef}
            {...commonProps}
          />
        );
      
      case 'My Posts':
        return (
          <CommunityMyPostsTab
            myPosts={data.myPosts}
            {...commonProps}
          />
        );

      case 'Requests':
        return (
          <CommunityRequestsTab
            requests={data.requests}
            {...commonProps}
          />
        );

      case 'Events':
        return (
          <CommunityEventsTab
            events={data.events}
            {...commonProps}
          />
        );

      case 'Festivals':
        return (
          <CommunityFestivalsTab
            festivals={data.festivals}
            selectedFestival={data.selectedFestival}
            festivalSort={data.festivalSort}
            onSelectFestival={data.setSelectedFestival}
            onSortChange={data.setFestivalSort}
            onCreateFestivalPost={() => data.handleCreatePost('', 'Festivals')}
            {...commonProps}
          />
        );

      case 'Lost & Found':
        return (
          <CommunityLostFoundTab
            lostFoundPosts={data.lostFoundPosts}
            {...commonProps}
          />
        );

      case 'Seva':
        return (
          <CommunitySevaTab
            sevaPosts={data.sevaPosts}
            {...commonProps}
          />
        );

      case 'Temple Updates':
        return (
          <CommunityTempleTab
            templeUpdates={data.templeUpdates}
            {...commonProps}
          />
        );

      default:
        return (
          <CommunityFeedTab
            posts={data.posts}
            loadingMore={data.loadingMore}
            onLoadMore={data.handleLoadMore}
            activePostIndexRef={data.activePostIndexRef}
            {...commonProps}
          />
        );
    }
  };

  if (loading && !community) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <View style={styles.placeholderHeader} />
          <View style={styles.loadingContent}>
            <ActivityIndicator size="large" color="#FF6B00" />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <CommunityHeader
          community={community}
          onBack={handleGoBack}
          onCreatePost={() => data.handleCreatePost('', activeTab === 'Feed' ? 'Feed' : activeTab)}
        />
        
        <CommunityTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          communityType={community?.type}
        />

        <View style={styles.tabContent}>
          {renderActiveTab()}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  placeholderHeader: {
    height: 120,
    backgroundColor: '#FFF5EE',
  },
  loadingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContent: {
    flex: 1,
  },
});
