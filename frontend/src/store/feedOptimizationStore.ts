/**
 * feedOptimizationStore.ts
 *
 * A lightweight Zustand store that manages ONLY the feed optimization layer:
 *  - qualityMap: per-post media quality level ('high' | 'thumbnail')
 *  - upgradeQuality: action to promote a post to 'high' when it scrolls into view
 *  - resetQuality: reset all qualities on refresh (first 5 high, rest thumbnail)
 *
 * This is intentionally SEPARATE from the existing feedStore so there are
 * zero breaking changes to the rest of the app.
 */

import { create } from 'zustand';
import { MediaQuality, getInitialQuality } from '../utils/mediaQuality';

interface FeedOptimizationState {
  /** Map of postId → quality level */
  qualityMap: Record<string, MediaQuality>;

  /**
   * Promote a post to high quality.
   * No-op if it is already high.
   */
  upgradeQuality: (postId: string) => void;

  /**
   * Reset quality map for a fresh batch of posts.
   * First `initialHighCount` posts get 'high', the rest get 'thumbnail'.
   */
  resetQuality: (posts: any[], initialHighCount?: number) => void;

  /**
   * Ensure a specific post index is set to thumbnail if not already upgraded.
   */
  ensureQuality: (postId: string, index: number) => void;
}

export const useFeedOptimizationStore = create<FeedOptimizationState>((set, get) => ({
  qualityMap: {},

  upgradeQuality: (postId: string) => {
    const current = get().qualityMap[postId];
    if (current === 'high') return; // Already high – skip unnecessary re-render
    set((state) => ({
      qualityMap: { ...state.qualityMap, [postId]: 'high' },
    }));
  },

  resetQuality: (posts: any[], initialHighCount = 5) => {
    const map: Record<string, MediaQuality> = {};
    posts.forEach((post, index) => {
      const id = String(post?.id || post?.media_url || index);
      map[id] = getInitialQuality(index < initialHighCount ? 0 : index);
    });
    set({ qualityMap: map });
  },

  ensureQuality: (postId: string, index: number) => {
    const current = get().qualityMap[postId];
    if (current !== undefined) return; // Already set
    const quality = getInitialQuality(index);
    set((state) => ({
      qualityMap: { ...state.qualityMap, [postId]: quality },
    }));
  },
}));
