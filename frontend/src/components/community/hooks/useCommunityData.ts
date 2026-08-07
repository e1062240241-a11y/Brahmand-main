import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Platform } from 'react-native';
import { useAuthStore } from '../../../store/authStore';
import { useChatStore } from '../../../store/chatStore';
import { useBlockStore } from '../../../store/blockStore';
import { useVendorStore } from '../../../store/vendorStore';
import { socketService } from '../../../services/socket';
import {
  getCommunity,
  getCommunityMessages,
  sendCommunityMessage,
  togglePostLike,
  toggleCommunityMessageLike,
  getCommunityRequests,
  getEvents,
  getFestivalList,
  getSevaPosts,
  getTempleUpdates,
  getLostFoundPosts,
  parseApiError,
} from '../../../services/api';
import { decryptGroupMessage, getKeys, decryptSymmetricKey, generateSymmetricKey } from '../../../utils/cryptoUtil';
import { blockUser, unblockUser } from '../../../services/firebase/moderationService';

interface CommunityDataReturn {
  // State
  community: any;
  posts: any[];
  requests: any[];
  events: any[];
  festivals: any[];
  sevaPosts: any[];
  templeUpdates: any[];
  lostFoundPosts: any[];
  myPosts: any[];
  loading: boolean;
  refreshing: boolean;
  loadingMore: boolean;
  activeTab: string;
  selectedFestival: string | null;
  festivalSort: 'latest' | 'oldest';

  // Refs
  activePostIndexRef: React.MutableRefObject<number>;

  // Handlers
  setActiveTab: (tab: string) => void;
  setSelectedFestival: (festival: string | null) => void;
  setFestivalSort: (sort: 'latest' | 'oldest') => void;
  handleRefresh: () => Promise<void>;
  handleLoadMore: () => Promise<void>;
  handleCreatePost: (content: string, category: string, image?: any) => Promise<void>;
  handleLikePost: (postId: string) => void;
  handleComment: (postId: string, content: string) => Promise<void>;
  handleShare: (postId: string) => void;
  handleToggleBlock: (userId: string, userName: string) => Promise<void>;
  blockedUserIds: string[];
  user: any;
}

const POST_CACHE_KEY = 'brahmand_local_posts';
const localPostCategories = new Map<string, string>();

export function useCommunityData(communityId: string): CommunityDataReturn {
  const { user } = useAuthStore();
  const { myVendor, fetchMyVendor } = useVendorStore();
  const blockedUserIds = useBlockStore(state => state.blockedUserIds);
  const blockedByMeUserIds = useBlockStore(state => state.blockedByMeUserIds);
  const addBlock = useBlockStore(state => state.addBlock);
  const removeBlock = useBlockStore(state => state.removeBlock);

  const cacheKey = `community_screen_${communityId}`;
  
  // State
  const [community, setCommunity] = useState<any>(() => {
    const cachedData = useChatStore.getState().communityScreenCaches[cacheKey];
    return cachedData?.community || null;
  });
  
  const [posts, setPosts] = useState<any[]>(() => {
    const cachedData = useChatStore.getState().communityScreenCaches[cacheKey];
    return cachedData?.communityPosts || [];
  });
  
  const [requests, setRequests] = useState<any[]>(() => {
    const cachedData = useChatStore.getState().communityScreenCaches[cacheKey];
    return cachedData?.requests || [];
  });
  
  const [events, setEvents] = useState<any[]>(() => {
    const cachedData = useChatStore.getState().communityScreenCaches[cacheKey];
    return cachedData?.events || [];
  });
  
  const [festivals, setFestivals] = useState<any[]>(() => {
    const cachedData = useChatStore.getState().communityScreenCaches[cacheKey];
    return cachedData?.allFestivals || [];
  });
  
  const [sevaPosts, setSevaPosts] = useState<any[]>([]);
  const [templeUpdates, setTempleUpdates] = useState<any[]>([]);
  const [lostFoundPosts, setLostFoundPosts] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(() => {
    const cachedData = useChatStore.getState().communityScreenCaches[cacheKey];
    return !cachedData;
  });
  
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeTab,
    selectedFestival,
    festivalSort,
    activePostIndexRef, setActiveTab] = useState('Feed');
  const [selectedFestival, setSelectedFestival] = useState<string | null>(null);
  const [festivalSort, setFestivalSort] = useState<'latest' | 'oldest'>('latest');
  const activePostIndexRef = useRef<number>(0);
  
  // Socket refs
  const joinedSocketRoomsRef = useRef<Set<string>>(new Set());
  const socketListenerIdRef = useRef<string | null>(null);
  const pendingMessagesRef = useRef<any[]>([]);
  const rafIdRef = useRef<number | null>(null);
  
  // Cached symmetric key for E2EE
  const [cachedSymmetricKey, setCachedSymmetricKey] = useState<CryptoKey | null>(null);

  // Socket message handler with RAF batching
  const handleSocketMessage = useCallback((message: any) => {
    if (!message || !message.id) return;
    
    const msgCommunityId = message.community_id;
    const subgroup = message.subgroup_type;
    
    if (!msgCommunityId || (subgroup !== 'city' && subgroup !== 'state' && subgroup !== 'national')) return;
    if (msgCommunityId !== communityId) return;
    
    const currentUserId = useAuthStore.getState().user?.id;
    if (message.sender_id && currentUserId && String(message.sender_id) === String(currentUserId)) return;
    
    const currentCache = useChatStore.getState().communityScreenCaches[cacheKey];
    const deletedIds = new Set(currentCache?.deletedPostIds || []);
    if (deletedIds.has(String(message.id))) return;
    
    // Batch using RAF
    pendingMessagesRef.current.push({
      id: message.id,
      user: {
        name: message.sender_name || 'Anonymous',
        photo: message.sender_photo,
        isVerified: message.is_verified || false,
        verificationLabel: message.verification_level === 'national' ? 'Bharat Verified' : 'State Verified',
      },
      content: message.content,
      image: message.media_url || message.mediaUrl || message.image,
      timestamp: message.created_at || 'Just now',
      raw_timestamp: message.created_at,
      likes: message.likes_count || 0,
      comments: message.comments_count || 0,
      shares: 0,
      reposts: 0,
      hideBadge: false,
      liked: (message.liked_by || []).includes(currentUserId),
      category: message.category || 'Feed',
      sender_id: message.sender_id,
      isCommunityMsg: true,
      subgroupType: subgroup,
      communityId: msgCommunityId,
      isStateAnnouncement: subgroup === 'state',
      isNationalAnnouncement: subgroup === 'national',
      contact: message.contact,
      sevaDetails: message.seva_details,
      location: message.location,
      start_time: message.start_time,
    });
    
    if (!rafIdRef.current) {
      rafIdRef.current = requestAnimationFrame(() => {
        const batch = [...pendingMessagesRef.current];
        pendingMessagesRef.current = [];
        rafIdRef.current = null;
        
        setPosts(prev => {
          const filtered = batch.filter(b => !prev.some(p => String(p.id) === String(b.id)));
          if (filtered.length === 0) return prev;
          const next = [...filtered, ...prev];
          const cur = useChatStore.getState().communityScreenCaches[cacheKey];
          if (cur) {
            useChatStore.getState().setCommunityScreenCache(cacheKey, {
              ...cur,
              communityPosts: next,
              lastFetched: Date.now(),
            });
          }
          return next;
        });
      });
    }
  }, [communityId, cacheKey]);

  // Ensure socket rooms
  const ensureSocketRooms = useCallback((primarySubgroup?: string) => {
    if (Platform.OS === 'web') return;
    const rooms: string[] = [];
    if (primarySubgroup) rooms.push(`community_${communityId}_${primarySubgroup}`);
    rooms.forEach((room) => {
      if (!joinedSocketRoomsRef.current.has(room)) {
        joinedSocketRoomsRef.current.add(room);
        socketService.joinRoom(room).catch(() => {});
      }
    });
  }, [communityId]);

  // Fetch community data
  const fetchCommunityData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    
    try {
      const response = await getCommunity(communityId);
      const nextCommunity = response.data;
      setCommunity(nextCommunity);
      
      const currentSubgroup = nextCommunity.type === 'state'
        ? 'state'
        : (nextCommunity.type === 'country' || nextCommunity.type === 'national' ? 'national' : 'city');
      
      ensureSocketRooms(currentSubgroup);
      
      // Fetch all data in parallel
      const [requestsRes, eventsRes, messagesRes, festivalsRes, sevaRes, templeRes, lostFoundRes] = await Promise.all([
        getCommunityRequests({ community_id: communityId }).catch(() => ({ data: [] })),
        getEvents({ community_id: communityId }).catch(() => ({ data: [] })),
        getCommunityMessages(communityId, currentSubgroup, 15).catch(() => ({ data: [] })),
        getFestivalList({ community_id: communityId }).catch(() => ({ data: [] })),
        getSevaPosts({ community_id: communityId }).catch(() => ({ data: [] })),
        getTempleUpdates({ community_id: communityId }).catch(() => ({ data: [] })),
        getLostFoundPosts({ community_id: communityId }).catch(() => ({ data: [] })),
      ]);
      
      setRequests(requestsRes.data || []);
      setEvents(eventsRes.data || []);
      setPosts(messagesRes.data || []);
      setFestivals(festivalsRes.data || []);
      setSevaPosts(sevaRes.data || []);
      setTempleUpdates(templeRes.data || []);
      setLostFoundPosts(lostFoundRes.data || []);
      
      // Cache the data
      useChatStore.getState().setCommunityScreenCache(cacheKey, {
        community: nextCommunity,
        requests: requestsRes.data || [],
        events: eventsRes.data || [],
        communityPosts: messagesRes.data || [],
        festivals: festivalsRes.data || [],
        sevaPosts: sevaRes.data || [],
        templeUpdates: templeRes.data || [],
        lostFoundPosts: lostFoundRes.data || [],
        lastFetched: Date.now(),
      });
      
    } catch (error) {
      console.error('[useCommunityData] Failed to fetch community data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [communityId, cacheKey, ensureSocketRooms]);

  // Load more posts
  const handleLoadMore = useCallback(async () => {
    if (loadingMore || posts.length === 0) return;
    
    setLoadingMore(true);
    try {
      const currentSubgroup = community?.type === 'state'
        ? 'state'
        : (community?.type === 'country' || community?.type === 'national' ? 'national' : 'city');
      
      const lastPost = posts[posts.length - 1];
      const beforeTimestamp = lastPost?.raw_timestamp || lastPost?.timestamp;
      
      const response = await getCommunityMessages(communityId, currentSubgroup, 25, beforeTimestamp);
      const newPosts = response.data || [];
      
      if (newPosts.length > 0) {
        setPosts(prev => {
          const updated = [...prev, ...newPosts];
          const cur = useChatStore.getState().communityScreenCaches[cacheKey];
          if (cur) {
            useChatStore.getState().setCommunityScreenCache(cacheKey, {
              ...cur,
              communityPosts: updated,
            });
          }
          return updated;
        });
      }
    } catch (error) {
      console.error('[useCommunityData] Failed to load more:', error);
    } finally {
      setLoadingMore(false);
    }
  }, [communityId, community, posts, cacheKey]);

  // Refresh handler
  const handleRefresh = useCallback(async () => {
    await fetchCommunityData(true);
  }, [fetchCommunityData]);

  // Create post handler
  const handleCreatePost = useCallback(async (content: string, category: string, image?: any) => {
    if (!content.trim() && !image) return;
    
    const currentSubgroup = community?.type === 'state'
      ? 'state'
      : (community?.type === 'country' || community?.type === 'national' ? 'national' : 'city');
    
    const finalCategory = (category === 'Others' || !category) ? 'Feed' : category;
    
    const newPost = {
      id: `post-${Date.now()}`,
      user: {
        name: user?.name || 'User',
        photo: user?.photo,
        isVerified: user?.personality_verification_status === 'approved',
        verificationLabel: (user as any)?.verification_level === 'national' ? 'Bharat Verified' : 'State Verified',
      },
      content,
      image,
      timestamp: new Date().toISOString(),
      likes: 0,
      comments: 0,
      shares: 0,
      reposts: 0,
      liked: false,
      hideBadge: false,
      category: finalCategory,
      sender_id: user?.id,
      isCommunityMsg: true,
      subgroupType: currentSubgroup,
      communityId,
    };
    
    setPosts(prev => {
      const updated = [newPost, ...prev];
      useChatStore.getState().setCommunityScreenCache(cacheKey, { communityPosts: updated });
      return updated;
    });
    
    // Send to API
    try {
      await sendCommunityMessage(
        communityId,
        currentSubgroup,
        content,
        'text',
        finalCategory,
        image,
        undefined,
        undefined,
        undefined,
        undefined,
        cachedSymmetricKey
      );
    } catch (error) {
      console.error('[useCommunityData] Failed to create post:', error);
    }
  }, [community, user, communityId, cacheKey, cachedSymmetricKey]);

  // Like post handler
  const handleLikePost = useCallback((postId: string) => {
    const matchedPost = posts.find(p => p.id === postId);
    const isCommunityMsg = matchedPost ? !!matchedPost.isCommunityMsg : false;
    const targetSubgroup = matchedPost?.subgroupType || 'city';
    const targetCommunityId = matchedPost?.communityId || communityId;
    
    setPosts(prev => {
      const updated = prev.map(post => {
        if (post.id === postId) {
          const isLiked = post.liked;
          return {
            ...post,
            liked: !isLiked,
            likes: isLiked ? Math.max(0, post.likes - 1) : post.likes + 1
          };
        }
        return post;
      });
      useChatStore.getState().setCommunityScreenCache(cacheKey, { communityPosts: updated });
      return updated;
    });
    
    // API call
    if (!postId.startsWith('post-')) {
      (async () => {
        try {
          if (isCommunityMsg) {
            await toggleCommunityMessageLike(targetCommunityId, targetSubgroup, postId);
          } else {
            await togglePostLike(postId);
          }
        } catch (error) {
          console.error('[useCommunityData] Failed to toggle like:', error);
        }
      })();
    }
  }, [posts, communityId, cacheKey]);

  // Comment handler
  const handleComment = useCallback(async (postId: string, content: string) => {
    // Implementation would go here
    console.log('[useCommunityData] Comment on post:', postId, content);
  }, []);

  // Share handler
  const handleShare = useCallback((postId: string) => {
    // Implementation would go here
    console.log('[useCommunityData] Share post:', postId);
  }, []);

  // Block/Unblock handler
  const handleToggleBlock = useCallback(async (targetUid: string, targetName: string) => {
    if (!user?.id) return;
    const isCurrentlyBlocked = blockedByMeUserIds.includes(String(targetUid));
    
    try {
      if (isCurrentlyBlocked) {
        await unblockUser(user.id, targetUid);
        removeBlock(String(targetUid));
      } else {
        await blockUser(user.id, targetUid);
        addBlock(String(targetUid));
      }
    } catch (error) {
      console.error('[useCommunityData] Error toggling block status:', error);
    }
  }, [user?.id, blockedByMeUserIds, addBlock, removeBlock]);

  // Socket connection effect
  useEffect(() => {
    if (Platform.OS === 'web') return;
    let mounted = true;
    
    socketService
      .connect()
      .then(() => {
        if (!mounted) return;
        const listenerId = `community_screen_${communityId}_${Date.now()}`;
        socketListenerIdRef.current = listenerId;
        socketService.onMessage(listenerId, handleSocketMessage);
      })
      .catch(() => {});
    
    return () => {
      mounted = false;
      if (socketListenerIdRef.current) {
        socketService.offMessage(socketListenerIdRef.current);
        socketListenerIdRef.current = null;
      }
      joinedSocketRoomsRef.current.forEach((room) => {
        socketService.leaveRoom(room);
      });
      joinedSocketRoomsRef.current.clear();
    };
  }, [communityId, handleSocketMessage]);

  // Initial data fetch
  useEffect(() => {
    fetchCommunityData();
  }, [fetchCommunityData]);

  // Compute my posts
  const myPosts = useMemo(() => {
    return posts.filter(post => String(post.sender_id) === String(user?.id));
  }, [posts, user?.id]);

  return {
    community,
    posts,
    requests,
    events,
    festivals,
    sevaPosts,
    templeUpdates,
    lostFoundPosts,
    myPosts,
    loading,
    refreshing,
    loadingMore,
    activeTab,
    selectedFestival,
    festivalSort,
    activePostIndexRef,
    setActiveTab,
    setSelectedFestival,
    setFestivalSort,
    handleRefresh,
    handleLoadMore,
    handleCreatePost,
    handleLikePost,
    handleComment,
    handleShare,
    handleToggleBlock,
    blockedUserIds,
    user,
  };
}
