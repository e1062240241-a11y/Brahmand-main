import { create } from 'zustand';

export interface Post {
  id: string;
  _id?: string;
  sender_id?: string;
  sender_name?: string;
  sender_photo?: string;
  sender_sl_id?: string;
  content?: string;
  message_type?: string;
  media_url?: string;
  thumbnail_url?: string;
  caption?: string;
  timestamp?: string;
  community_id?: string;
  replies_count?: number;
  replies?: any[];
  reactions?: Record<string, number>;
  user_reaction?: string | null;
  status?: string;
  attendees?: string[];
  mentions?: any[];
  category?: string;
  threadParentId?: string;
  isEventPost?: boolean;
  isRequestItem?: boolean;
}

export interface FeedItem {
  id: string;
  itemType: string;
  hasPrevThreadConnection: boolean;
  hasNextThreadConnection: boolean;
}

interface CommunityState {
  posts: Record<string, Post>;
  feedItems: FeedItem[]; // Precomputed view for FlashList
  addPost: (post: Post, subgroupType?: string) => void;
  updatePost: (id: string, updates: Partial<Post>) => void;
  removePost: (id: string) => void;
  setInitialPosts: (posts: Post[], subgroupType?: string) => void;
  appendPosts: (posts: Post[], subgroupType?: string) => void;
  prependPost: (post: Post, subgroupType?: string) => void;
}

// Helper to determine itemType based on the current active tab / subgroupType and post fields
const determineItemType = (post: Post, subgroupType?: string): string => {
  const type = post.message_type || post.category || 'discussion';

  if (subgroupType === 'Events' || type === 'Events' || post.isEventPost) return 'event';
  if (subgroupType === 'Requests' || type === 'Requests' || post.isRequestItem) return 'request';
  if (subgroupType === 'Seva' || type === 'Seva') return 'seva';
  if (subgroupType === 'Festivals' || type === 'Festivals') return 'festival';

  return 'discussion';
};

// Helper to compute thread flags for an array of posts
const computeFeedItems = (orderedIds: string[], postsMap: Record<string, Post>, subgroupType?: string): FeedItem[] => {
  return orderedIds.map((id, index) => {
    const post = postsMap[id];
    const itemType = determineItemType(post, subgroupType);

    const nextId = index < orderedIds.length - 1 ? orderedIds[index + 1] : null;
    const nextPost = nextId ? postsMap[nextId] : null;

    const threadParentId = post?.threadParentId;
    const nextThreadParentId = nextPost?.threadParentId;

    const hasNextThreadConnection = !!(nextPost && (
      nextThreadParentId === id ||
      (threadParentId && nextThreadParentId === threadParentId)
    ));
    const hasPrevThreadConnection = threadParentId !== undefined;

    return {
      id,
      itemType,
      hasPrevThreadConnection,
      hasNextThreadConnection
    };
  });
};

export const useCommunityStore = create<CommunityState>((set) => ({
  posts: {},
  feedItems: [],

  addPost: (post, subgroupType) =>
    set((state) => {
      const postId = post.id || post._id;
      if (!postId) return state;

      const isNew = !state.posts[postId];
      const newPosts = { ...state.posts, [postId]: { ...state.posts[postId], ...post } };

      if (!isNew) {
        return { posts: newPosts };
      }

      const currentIds = state.feedItems.map(f => f.id);
      const newIds = [...currentIds, postId];
      const newFeedItems = computeFeedItems(newIds, newPosts, subgroupType);

      return {
        posts: newPosts,
        feedItems: newFeedItems,
      };
    }),

  prependPost: (post, subgroupType) =>
    set((state) => {
      const postId = post.id || post._id;
      if (!postId) return state;

      const isNew = !state.posts[postId];
      const newPosts = { ...state.posts, [postId]: { ...state.posts[postId], ...post } };

      if (!isNew) {
         return { posts: newPosts };
      }

      const currentIds = state.feedItems.map(f => f.id);
      const newIds = [postId, ...currentIds];
      const newFeedItems = computeFeedItems(newIds, newPosts, subgroupType);

      return {
        posts: newPosts,
        feedItems: newFeedItems,
      };
    }),

  updatePost: (id, updates) =>
    set((state) => {
      if (!state.posts[id]) return state;

      const updatedPost = { ...state.posts[id], ...updates };
      const newPosts = { ...state.posts, [id]: updatedPost };

      // If threadParentId or category changes, recompute feedItems
      if ('threadParentId' in updates || 'category' in updates || 'message_type' in updates || 'isEventPost' in updates || 'isRequestItem' in updates) {
          const orderedIds = state.feedItems.map(f => f.id);
          const newFeedItems = computeFeedItems(orderedIds, newPosts);
          return { posts: newPosts, feedItems: newFeedItems };
      }

      return {
        posts: newPosts,
      };
    }),

  removePost: (id) =>
    set((state) => {
      if (!state.posts[id]) return state;
      const { [id]: _, ...remainingPosts } = state.posts;

      const orderedIds = state.feedItems.map(f => f.id).filter(postId => postId !== id);
      const newFeedItems = computeFeedItems(orderedIds, remainingPosts);

      return {
        posts: remainingPosts,
        feedItems: newFeedItems,
      };
    }),

  setInitialPosts: (posts, subgroupType) =>
    set(() => {
      const newPosts: Record<string, Post> = {};
      const newOrderedIds: string[] = [];

      posts.forEach((post) => {
        const id = post.id || post._id;
        if (id) {
          newPosts[id] = post;
          newOrderedIds.push(id);
        }
      });

      const newFeedItems = computeFeedItems(newOrderedIds, newPosts, subgroupType);

      return {
        posts: newPosts,
        feedItems: newFeedItems,
      };
    }),

  appendPosts: (posts, subgroupType) =>
    set((state) => {
      const newPosts = { ...state.posts };
      const currentIds = state.feedItems.map(f => f.id);
      const newOrderedIds = [...currentIds];

      let changed = false;
      posts.forEach((post) => {
        const id = post.id || post._id;
        if (id && !newPosts[id]) {
          newPosts[id] = post;
          newOrderedIds.push(id);
          changed = true;
        } else if (id && newPosts[id]) {
          newPosts[id] = { ...newPosts[id], ...post };
        }
      });

      if (!changed) {
         return { posts: newPosts };
      }

      const newFeedItems = computeFeedItems(newOrderedIds, newPosts, subgroupType);

      return {
        posts: newPosts,
        feedItems: newFeedItems,
      };
    }),
}));
