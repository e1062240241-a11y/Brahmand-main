import React, { useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { CommunityPostCard } from '../cards/CommunityPostCard';

interface CommunityMyPostsTabProps {
  myPosts: any[];
  user: any;
  blockedUserIds: string[];
  onLikePost?: (postId: string) => void;
  onComment?: (postId: string, content: string) => void;
  onShare?: (postId: string) => void;
}

export const CommunityMyPostsTab = React.memo(function CommunityMyPostsTab({
  myPosts,
  user,
  blockedUserIds,
  onLikePost,
  onComment,
  onShare,
}: CommunityMyPostsTabProps) {
  
  // Filter out posts from blocked users (shouldn't happen for own posts, but for consistency)
  const filteredPosts = useMemo(() => {
    if (!blockedUserIds || blockedUserIds.length === 0) return myPosts;
    return myPosts.filter(post => {
      const userId = post.user_id?.toString() || post.created_by?.toString();
      return !userId || !blockedUserIds.includes(userId);
    });
  }, [myPosts, blockedUserIds]);

  const renderItem = useCallback(({ item }: { item: any }) => {
    return (
      <CommunityPostCard
        post={item}
        onLike={onLikePost}
        onComment={onComment}
        onShare={onShare}
        currentUserId={user?.id}
        distanceFromActive={0}
      />
    );
  }, [onLikePost, onComment, onShare, user?.id]);

  const keyExtractor = useCallback((item: any) => String(item.id), []);

  if (filteredPosts.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No posts yet</Text>
        <Text style={styles.emptySubtext}>Create your first post to get started</Text>
      </View>
    );
  }

  return (
    <FlashList
      data={filteredPosts}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      estimatedItemSize={180}
      drawDistance={600}
      removeClippedSubviews={Platform.OS === 'android'}
      windowSize={Platform.OS === 'android' ? 3 : undefined}
      initialNumToRender={5}
      maxToRenderPerBatch={Platform.OS === 'android' ? 3 : undefined}
      contentInsetAdjustmentBehavior="never"
    />
  );
}, (prevProps, nextProps) => {
  if (prevProps.myPosts.length !== nextProps.myPosts.length) return false;
  
  for (let i = 0; i < prevProps.myPosts.length; i++) {
    if (prevProps.myPosts[i].id !== nextProps.myPosts[i].id) return false;
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
