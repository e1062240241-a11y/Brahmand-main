/**
 * SmartPost.tsx
 *
 * Thin wrapper around PostFeedCard that injects smart media quality.
 *
 * How it works:
 *  - Reads `qualityMap[postId]` from feedOptimizationStore
 *  - Builds an augmented `post` object with the correct media URL
 *    based on the current quality level ('high' | 'thumbnail')
 *  - Renders the existing PostFeedCard with no changes to its props/API
 *
 * ─── NO CHANGES to PostFeedCard ──────────────────────────────────────────────
 * This component deliberately does NOT modify PostFeedCard. It only passes a
 * modified `post` prop so that the existing card renders the right media.
 */

import React, { memo, useMemo } from 'react';
import { View, StyleSheet, Image, ActivityIndicator } from 'react-native';
import PostFeedCard from './PostFeedCard';
import { useFeedOptimizationStore } from '../store/feedOptimizationStore';
import { getMediaUrl } from '../utils/mediaQuality';

type SmartPostProps = {
  post: any;
  postId: string;
  onLike?: (post: any) => void;
  onComment?: (post: any) => void;
  onShare?: (post: any) => void;
  onRepost?: (post: any) => void;
  onUserPress?: (post: any) => void;
  onPostMenuPress?: (post: any) => void;
  postMenuType?: 'delete' | 'report';
  isActive?: boolean;
  onLayout?: (event: any) => void;
  theme?: 'light' | 'dark';
  isBlackBackground?: boolean;
  isFirstReel?: boolean;
};

export const SmartPost = memo(({
  post,
  postId,
  onLike,
  onComment,
  onShare,
  onRepost,
  onUserPress,
  onPostMenuPress,
  postMenuType,
  isActive,
  onLayout,
  theme = 'dark',
  isBlackBackground,
  isFirstReel,
}: SmartPostProps) => {
  // Subscribe only to this post's quality — no global re-renders
  const quality = useFeedOptimizationStore(
    (state) => state.qualityMap[postId] ?? 'thumbnail',
  );

  /**
   * Build an augmented post with the correct media_url for the current quality.
   * We preserve ALL other fields so likes, comments, captions etc. are unaffected.
   */
  const smartPost = useMemo(() => {
    const mediaUrl = getMediaUrl(post, quality);

    if (!mediaUrl || mediaUrl === (post?.media_url || post?.mediaUrl)) {
      // No change needed – avoid creating a new object every render
      return post;
    }

    return {
      ...post,
      // Override the URL the card will display
      media_url: mediaUrl,
      mediaUrl: mediaUrl,
      // Keep thumbnail_url untouched so the blur poster still works
    };
  }, [post, quality]);

  return (
    <View onLayout={onLayout}>
      {/* Quality indicator badge in dev builds (remove in production if desired) */}
      {__DEV__ && quality === 'thumbnail' && (
        <View style={styles.devBadge} pointerEvents="none">
          {/* tiny dev indicator – invisible at glance */}
        </View>
      )}
      <PostFeedCard
        post={smartPost}
        onLike={onLike}
        onComment={onComment}
        onShare={onShare}
        onRepost={onRepost}
        onUserPress={onUserPress}
        onPostMenuPress={onPostMenuPress}
        postMenuType={postMenuType}
        isActive={isActive}
        theme={theme}
        isBlackBackground={isBlackBackground}
        isFirstReel={isFirstReel}
      />
    </View>
  );
});

SmartPost.displayName = 'SmartPost';

const styles = StyleSheet.create({
  devBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 165, 0, 0.5)',
    zIndex: 9999,
  },
});

export default SmartPost;
