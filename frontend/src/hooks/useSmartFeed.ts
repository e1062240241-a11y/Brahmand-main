/**
 * useSmartFeed.ts
 *
 * Custom hook that handles smart feed visibility logic:
 *  - Detects which posts are visible using a scroll-position + layout map
 *  - Upgrades visible posts from 'thumbnail' → 'high' quality
 *  - Enforces a max of ~5-6 high-quality items in memory at once
 *
 * Usage:
 *   const { onScroll, trackPostLayout } = useSmartFeed({
 *     postIds,
 *     postOffsetsRef,
 *     postHeightsRef,
 *     feedTabsYRef,
 *   });
 */

import { useCallback, useRef } from 'react';
import { Dimensions } from 'react-native';
import { useFeedOptimizationStore } from '../store/feedOptimizationStore';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// How far above/below the viewport to still consider "near screen" for quality upgrade
const UPGRADE_BUFFER_PX = SCREEN_HEIGHT * 0.3;

// Maximum number of posts that should hold 'high' quality at once
const MAX_HIGH_QUALITY_POSTS = 6;

interface UseSmartFeedOptions {
  /** Ordered list of post IDs matching the rendered feed */
  postIds: string[];
  /** Ref map of postKey → vertical offset in the ScrollView */
  postOffsetsRef: React.MutableRefObject<Record<string, number>>;
  /** Ref map of postKey → rendered height */
  postHeightsRef: React.MutableRefObject<Record<string, number>>;
  /** Ref holding the top-of-feed Y offset (header height) */
  feedTabsYRef: React.MutableRefObject<number>;
  /** Extra offset (sticky tab-bar height), defaults to 48 */
  tabBarHeight?: number;
}

export function useSmartFeed({
  postIds,
  postOffsetsRef,
  postHeightsRef,
  feedTabsYRef,
  tabBarHeight = 48,
}: UseSmartFeedOptions) {
  const { upgradeQuality } = useFeedOptimizationStore();
  const currentScrollY = useRef(0);
  const lastSmartScrollTimeRef = useRef(0);

  const onSmartScroll = useCallback(
    (scrollY: number) => {
      const now = Date.now();
      if (now - lastSmartScrollTimeRef.current < 250) return;
      lastSmartScrollTimeRef.current = now;

      currentScrollY.current = scrollY;

      const viewportTop = scrollY - UPGRADE_BUFFER_PX;
      const viewportBottom = scrollY + SCREEN_HEIGHT + UPGRADE_BUFFER_PX;
      const headerOffset = feedTabsYRef.current + tabBarHeight;

      // Collect visible post IDs
      const visibleIds: string[] = [];

      for (const id of postIds) {
        const offset = postOffsetsRef.current[id];
        const height = postHeightsRef.current[id];

        if (typeof offset !== 'number' || typeof height !== 'number') continue;

        const postTop = offset + headerOffset;
        const postBottom = postTop + height;

        const isNearViewport = postBottom > viewportTop && postTop < viewportBottom;
        if (isNearViewport) {
          visibleIds.push(id);
        }
      }

      // Upgrade only up to MAX_HIGH_QUALITY_POSTS
      const toUpgrade = visibleIds.slice(0, MAX_HIGH_QUALITY_POSTS);
      for (const id of toUpgrade) {
        upgradeQuality(id);
      }
    },
    [postIds, postOffsetsRef, postHeightsRef, feedTabsYRef, tabBarHeight, upgradeQuality],
  );

  return { onSmartScroll };
}
