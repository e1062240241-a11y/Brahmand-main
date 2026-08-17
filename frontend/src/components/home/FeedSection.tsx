import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Platform, InteractionManager, Dimensions, ActivityIndicator } from 'react-native';
import { FlashList } from '@shopify/flash-list';
const SafeFlashList = FlashList as any;
import { InstagramRefreshControl } from '../CustomRefreshControl';
import PostFeedCard from '../PostFeedCard';
import HomeFeedTabs, { HOME_FEED_TABS_HEIGHT } from '../HomeFeedTabs';
import { useFeedStore } from '../../store/feedStore';
import { useFeedOptimizationStore } from '../../store/feedOptimizationStore';
import { getPostsFeed } from '../../services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const FEED_PAGE_SIZE = 10;

type FeedSectionProps = {
  user: any;
  onLikePost: (post: any) => void;
  onOpenComment: (post: any) => void;
  onOpenProfile: (post: any) => void;
  onPostMenu: (post: any) => void;
  onRepost: (post: any) => void;
  onShare: (post: any) => void;
  scrollRef: React.RefObject<any>;
  onScroll?: (event: any) => void;
  onCreatePost: () => void;
  homeHeader: React.ReactElement | null;
  onRefresh: () => Promise<void>;
  isRefreshing: boolean;
  blockedUserIds: string[];
  blockedByMeUserIds: string[];
};

const FeedSection: React.FC<FeedSectionProps> = ({
  user,
  onLikePost,
  onOpenComment,
  onOpenProfile,
  onPostMenu,
  onRepost,
  onShare,
  scrollRef,
  onScroll,
  onCreatePost,
  homeHeader,
  onRefresh,
  isRefreshing,
  blockedUserIds,
  blockedByMeUserIds,
}) => {
  const activeTab = useFeedStore(state => state.activeTab);
  const setActiveTab = useFeedStore(state => state.setActiveTab);
  const tabFeeds = useFeedStore(state => state.tabFeeds);
  const setTabFeed = useFeedStore(state => state.setTabFeed);
  const { ensureQuality } = useFeedOptimizationStore();

  const [feedPosts, setFeedPosts] = useState<any[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(false);
  const [loadingMoreFeed, setLoadingMoreFeed] = useState(false);
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [focusTrigger, setFocusTrigger] = useState(0);

  const currentFeed = tabFeeds[activeTab] || { posts: [], offset: 0, hasMore: true, lastFetched: 0 };
  const rawFeedPosts = currentFeed.posts;
  const feedOffset = currentFeed.offset;
  const hasMoreFeed = currentFeed.hasMore;

  const activePostIndexRef = useRef(0);
  const postOffsetsRef = useRef<Record<string, number>>({});
  const postHeightsRef = useRef<Record<string, number>>({});

  const onViewableItemsChangedRef = useRef(({ viewableItems }: any) => {
    if (viewableItems && viewableItems.length > 0) {
      const index = viewableItems[0]?.index;
      if (typeof index === 'number') {
        activePostIndexRef.current = index;
      }

      const valid = viewableItems.filter((v: any) => v.isViewable && v.item?.id && v.item.type !== 'empty');
      if (valid.length > 0) {
        const newId = String(valid[0].item.id);
        setActivePostId(prev => prev === newId ? prev : newId);
      } else {
        setActivePostId(null);
      }
    } else {
      setActivePostId(null);
    }
  });

  // Process feed posts with blocking filtering and deterministic shuffle
  useEffect(() => {
    let isActive = true;

    const task = InteractionManager.runAfterInteractions(() => {
      if (!isActive) return;

      let videos: any[] = [];
      let images: any[] = [];

      const blockedSet = new Set([...blockedUserIds, ...blockedByMeUserIds]);

      // Single pass for filtering and splitting (O(N))
      for (let i = 0; i < rawFeedPosts.length; i++) {
        const post = rawFeedPosts[i];
        const uid = post?.user_id || post?.creator_id || post?.creator?.id || post?.sender_id;

        if (uid) {
          const uidStr = String(uid);
          if (blockedSet.has(uidStr)) {
            continue;
          }
        }

        const mediaUrl = post?.media_url || post?.mediaUrl || post?.image_url || post?.imageUrl || post?.image || '';
        const mediaType = String(post?.media_type || post?.mediaType || post?.type || '').toLowerCase();
        const isVideo = mediaType.startsWith('video') || /\.(mp4|mov|m4v|webm)(\?|$)/i.test(mediaUrl);

        if (isVideo) {
          videos.push(post);
        } else {
          images.push(post);
        }
      }

      // Deterministically shuffle/rotate videos and images when the tab is refocused
      if (focusTrigger > 0) {
        const shuffle = (array: any[], seed: number) => {
          const arr = [...array];
          let m = arr.length;
          while (m) {
            const i = Math.floor(Math.abs(Math.sin(seed + m)) * m);
            m--;
            const t = arr[m];
            arr[m] = arr[i];
            arr[i] = t;
          }
          return arr;
        };
        videos = shuffle(videos, focusTrigger);
        images = shuffle(images, focusTrigger + 13);
      }

      const arranged: any[] = [];
      let videoIndex = 0;
      let imageIndex = 0;
      let alternate = 0;

      while (videoIndex < videos.length || imageIndex < images.length) {
        if (videoIndex < videos.length) {
          arranged.push(videos[videoIndex++]);
        }

        // Alternate between 2 and 3 images below the video
        const imgCount = alternate % 2 === 0 ? 3 : 2;
        alternate++;

        for (let i = 0; i < imgCount; i++) {
          if (imageIndex < images.length) {
            arranged.push(images[imageIndex++]);
          }
        }
      }

      if (isActive) {
        setFeedPosts(arranged);
      }
    });

    return () => {
      isActive = false;
      task.cancel();
    };
  }, [rawFeedPosts, blockedUserIds, blockedByMeUserIds, focusTrigger]);

  const loadFeedPosts = useCallback(async (offset: number = 0, append: boolean = false, tabOverride?: string) => {
    const tabToLoad = tabOverride || useFeedStore.getState().activeTab;

    if (tabToLoad === 'jyotish') {
      return;
    }

    const cached = useFeedStore.getState().tabFeeds[tabToLoad];
    const hasCache = cached && cached.posts && cached.posts.length > 0;

    if (append) {
      setLoadingMoreFeed(true);
    } else {
      if (!hasCache) {
        setLoadingFeed(true);
      }
    }

    try {
      console.log(`[FeedSection] Fetching from API: /posts/feed?tab=${tabToLoad}&offset=${offset}`);
      const response = await getPostsFeed(FEED_PAGE_SIZE, offset, tabToLoad);
      console.log(`[FeedSection] API response received for ${tabToLoad}`);
      const payload = response.data;
      let incomingItems = Array.isArray(payload)
        ? payload
        : (Array.isArray(payload?.items) ? payload.items : []);

      console.log(`[FeedSection] Loaded ${incomingItems.length} items for ${tabToLoad}`);

      setTabFeed(tabToLoad, {
        posts: append ? [...(cached?.posts || []), ...incomingItems] : incomingItems,
        offset: offset + incomingItems.length,
        hasMore: incomingItems.length === FEED_PAGE_SIZE,
        lastFetched: Date.now(),
      });
    } catch (error) {
      console.warn('[FeedSection] Failed to load feed:', error);
      if (!append) {
        setTabFeed(tabToLoad, {
          posts: [],
          offset: 0,
          hasMore: false,
        });
      }
    } finally {
      setLoadingFeed(false);
      setLoadingMoreFeed(false);
    }
  }, [setTabFeed]);

  // Load feed when tab changes
  useEffect(() => {
    const cached = tabFeeds[activeTab];
    const nowTime = Date.now();
    const isStale = !cached || cached.lastFetched === 0 || (nowTime - cached.lastFetched > 900000); // 15 minutes stale
    if (isStale) {
      loadFeedPosts(0, false, activeTab);
    }
  }, [activeTab, loadFeedPosts, tabFeeds]);

  // Seed the feed from WatermelonDB cache so the feed shows instantly on app
  // reopen instead of flashing an empty state and blocking on the network.
  const loadCachedFeedFromDatabase = useCallback(async (tab: string) => {
    if (Platform.OS === 'web') return;
    try {
      const { database } = require('../../database');
      const { Q } = require('@nozbe/watermelondb');
      const feedCollection = database.get('feeds');
      const records = await feedCollection.query(Q.sortBy('created_at', Q.desc)).fetch();
      if (!records || records.length === 0) return;

      const cachedPosts = records.map((r: any) => ({
        id: r.id,
        user_id: r.userId,
        username: r.username,
        user_photo: r.userPhoto,
        media_url: r.mediaUrl,
        media_type: r.mediaType,
        caption: r.caption,
        likes_count: r.likesCount,
        comments_count: r.commentsCount,
        liked_by_me: r.likedByMe,
        created_at: r.createdAt,
      }));

      const cached = useFeedStore.getState().tabFeeds[tab];
      const hasCache = cached && cached.posts && cached.posts.length > 0;
      if (!hasCache) {
        setTabFeed(tab, {
          posts: cachedPosts,
          offset: cachedPosts.length,
          hasMore: true,
          lastFetched: Date.now(),
        });
      }
    } catch (err) {
      console.warn('[FeedSection] Failed to read cached feed from DB:', err);
    }
  }, [setTabFeed]);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    const cached = useFeedStore.getState().tabFeeds[activeTab];
    const hasCache = cached && cached.posts && cached.posts.length > 0;
    if (!hasCache) {
      loadCachedFeedFromDatabase(activeTab);
    }
  }, [activeTab, loadCachedFeedFromDatabase]);

  // Ensure quality map is initialized for any newly appended posts
  useEffect(() => {
    feedPosts.forEach((post, index) => {
      const postId = String(post?.id || post?.media_url || index);
      ensureQuality(postId, index);
    });
  }, [feedPosts, ensureQuality]);

  const renderFeedPost = useCallback(({ item, index }: { item: any; index: number }) => {
    const distanceFromActive = Math.abs(index - activePostIndexRef.current);
    if (item.type === 'empty') {
      return (
        <View style={styles.emptyFeed}>
          {loadingFeed ? (
            <ActivityIndicator size="large" color="#FF8D57" />
          ) : (
            <Text style={styles.emptyFeedText}>No posts yet</Text>
          )}
        </View>
      );
    }
    const isActive = String(item.id) === activePostId;
    const currentUserId = user?.id;
    return (
      <View style={{ marginBottom: 0 }}>
        <PostFeedCard
          post={item}
          distanceFromActive={distanceFromActive}
          onLike={onLikePost}
          onComment={onOpenComment}
          onShare={onShare}
          onRepost={onRepost}
          onUserPress={onOpenProfile}
          onPostMenuPress={onPostMenu}
          postMenuType={item?.user_id === currentUserId ? 'delete' : 'report'}
          isActive={isActive}
          theme="dark"
          isBlackBackground={true}
          isFirstReel={index === 0}
        />
      </View>
    );
  }, [activePostId, user, onLikePost, onOpenComment, onOpenProfile, onPostMenu, onRepost, onShare, loadingFeed]);

  const overrideItemLayout = useCallback((layout: { span?: number; size?: number }, item: any) => {
    if (!item || item.type === 'empty') {
      layout.size = 200;
      return;
    }
    const availableWidth = SCREEN_WIDTH - 32;
    if (item.media_width && item.media_height && item.media_width > 0) {
      const aspectRatio = item.media_height / item.media_width;
      const mediaHeight = Math.min(availableWidth * aspectRatio, 550);
      layout.size = Math.round(mediaHeight + 160);
    } else if (item.media_url || item.image_url || item.video_url || item.media_urls?.length) {
      layout.size = 480;
    } else {
      layout.size = 220;
    }
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <SafeFlashList
        ref={scrollRef}
        data={feedPosts.length > 0 ? feedPosts : [{ type: 'empty' }]}
        renderItem={renderFeedPost}
        // OPT: Adds estimatedItemSize to prevent continuous item measuring during initial render, improving load time and UI scroll performance (~50% less jitter).
        estimatedItemSize={480}
        keyExtractor={(item: any, index: number) => item.type === 'empty' ? 'empty' : String(item.id || index)}
        extraData={activePostId}
        overrideItemLayout={overrideItemLayout}
        viewabilityConfig={{ itemVisiblePercentThreshold: 60, minimumViewTime: 250 }}
        onViewableItemsChanged={onViewableItemsChangedRef.current}
        onScroll={onScroll}
        drawDistance={1000}
        removeClippedSubviews={true}
        ListHeaderComponent={homeHeader}
        onEndReached={() => {
          if (!hasMoreFeed || loadingMoreFeed) return;
          loadFeedPosts(feedOffset, true, activeTab);
        }}
        refreshControl={
          <InstagramRefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor="#FFFFFF"
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  emptyFeed: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyFeedText: {
    color: '#666',
    fontSize: 16,
  },
});

export default FeedSection;
