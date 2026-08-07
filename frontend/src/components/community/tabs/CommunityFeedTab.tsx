import React, { useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { CommunityPostCard } from '../cards/CommunityPostCard';

interface CommunityFeedTabProps {
  posts: any[];
  onLikePost: (postId: string) => void;
  onComment: (postId: string, content: string) => void;
  onShare: (postId: string) => void;
  user: any;
  loadingMore: boolean;
  onLoadMore: () => void;
  blockedUserIds: string[];
  activePostIndexRef?: React.MutableRefObject<number>;
}

export const CommunityFeedTab = React.memo(function CommunityFeedTab({
  posts,
  onLikePost,
  onComment,
  onShare,
  user,
  loadingMore,
  onLoadMore,
  blockedUserIds,
  activePostIndexRef,
}: CommunityFeedTabProps) {
  
  const renderItem = useCallback(({ item, index }: { item: any; index: number }) => {
    // Filter blocked users
    const senderId = item.sender_id || item.user?.id || item.user?.sender_id;
    if (senderId && blockedUserIds.includes(String(senderId))) {
      return null;
    }

    // Calculate distance from active post for video optimization
    const distanceFromActive = activePostIndexRef 
      ? Math.abs(index - activePostIndexRef.current)
      : 0;

    return (
      <CommunityPostCard
        post={item}
        onLike={onLikePost}
        onComment={onComment}
        onShare={onShare}
        currentUserId={user?.id}
        distanceFromActive={distanceFromActive}
      />
    );
  }, [onLikePost, onComment, onShare, user?.id, blockedUserIds, activePostIndexRef]);

  const keyExtractor = useCallback((item: any) => String(item.id), []);

  const ListFooterComponent = useCallback(() => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color="#FF6B00" />
      </View>
    );
  }, [loadingMore]);

  const filteredPosts = posts.filter(post => {
    const senderId = post.sender_id || post.user?.id || post.user?.sender_id;
    return !senderId || !blockedUserIds.includes(String(senderId));
  });

  if (filteredPosts.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No posts yet</Text>
        <Text style={styles.emptySubtext}>Be the first to share something!</Text>
      </View>
    );
  }

  return (
    <FlashList
      data={filteredPosts}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      estimatedItemSize={180}
      drawDistance={800}
      removeClippedSubviews={Platform.OS === 'android'}
      windowSize={Platform.OS === 'android' ? 3 : undefined}
      initialNumToRender={5}
      maxToRenderPerBatch={Platform.OS === 'android' ? 3 : undefined}
      contentInsetAdjustmentBehavior="never"
      onEndReached={onLoadMore}
      onEndReachedThreshold={0.5}
      ListFooterComponent={ListFooterComponent}
    />
  );
}, (prevProps, nextProps) => {
  // Custom comparator to prevent unnecessary re-renders
  if (prevProps.posts.length !== nextProps.posts.length) return false;
  if (prevProps.loadingMore !== nextProps.loadingMore) return false;
  if (prevProps.user?.id !== nextProps.user?.id) return false;
  
  // Check if any post has changed
  for (let i = 0; i < prevProps.posts.length; i++) {
    if (
      prevProps.posts[i].id !== nextProps.posts[i].id ||
      prevProps.posts[i].likes !== nextProps.posts[i].likes ||
      prevProps.posts[i].liked !== nextProps.posts[i].liked ||
      prevProps.posts[i].comments !== nextProps.posts[i].comments
    ) {
      return false;
    }
  }
  
  return true;
});

const styles = StyleSheet.create({
  footer: {
    paddingVertical: 20,
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
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
  },
});
