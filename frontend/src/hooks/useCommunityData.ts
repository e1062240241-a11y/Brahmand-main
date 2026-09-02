import { useState, useCallback } from 'react';
import { Platform } from 'react-native';
import { useChatStore } from '../store/chatStore';
import { useAuthStore } from '../store/authStore';
import {
  getCommunity,
  getCommunityRequests,
  getEvents,
  getCommunityMessages,
  getFestivalList,
  getCommunities,
} from '../services/api';
import {
  ensureCategoriesLoaded,
  getLocalCategory,
  iosUserCreatedPostIds,
} from '../services/localPostCache';
import { parseUTCDate } from '../utils/dateUtils';
import { useTranslation } from '../utils/i18n';

export interface UseCommunityDataReturn {
  community: any;
  setCommunity: React.Dispatch<React.SetStateAction<any>>;
  requests: any[];
  setRequests: React.Dispatch<React.SetStateAction<any[]>>;
  events: any[];
  setEvents: React.Dispatch<React.SetStateAction<any[]>>;
  communityPosts: any[];
  setCommunityPosts: React.Dispatch<React.SetStateAction<any[]>>;
  allFestivals: any[];
  setAllFestivals: React.Dispatch<React.SetStateAction<any[]>>;
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  refreshing: boolean;
  setRefreshing: React.Dispatch<React.SetStateAction<boolean>>;
  hasMorePosts: boolean;
  setHasMorePosts: React.Dispatch<React.SetStateAction<boolean>>;
  loadingMore: boolean;
  setLoadingMore: React.Dispatch<React.SetStateAction<boolean>>;
  isLocked: boolean;
  setIsLocked: React.Dispatch<React.SetStateAction<boolean>>;
  lockReason: string;
  setLockReason: React.Dispatch<React.SetStateAction<string>>;
  fetchCommunity: (force?: boolean) => Promise<void>;
  handleLoadMore: () => Promise<void>;
  onRefresh: () => void;
}

export function useCommunityData(
  id: string,
  cacheKey: string,
  user: any,
  stateCommunityIdRef: React.MutableRefObject<string | null>,
  countryCommunityIdRef: React.MutableRefObject<string | null>,
  ensureSocketRooms?: (subgroup: string) => void
): UseCommunityDataReturn {
  const { t } = useTranslation();

  const [community, setCommunity] = useState<any>(() => {
    const cachedData = useChatStore.getState().communityScreenCaches[cacheKey];
    return cachedData?.community || null;
  });

  const [requests, setRequests] = useState<any[]>(() => {
    const cachedData = useChatStore.getState().communityScreenCaches[cacheKey];
    return cachedData?.requests || [];
  });

  const [events, setEvents] = useState<any[]>(() => {
    const cachedData = useChatStore.getState().communityScreenCaches[cacheKey];
    return cachedData?.events || [];
  });

  const [communityPosts, setCommunityPosts] = useState<any[]>(() => {
    const cachedData = useChatStore.getState().communityScreenCaches[cacheKey];
    return cachedData?.communityPosts || [];
  });

  const [allFestivals, setAllFestivals] = useState<any[]>(() => {
    const cachedData = useChatStore.getState().communityScreenCaches[cacheKey];
    return cachedData?.allFestivals || [];
  });

  const [loading, setLoading] = useState<boolean>(() => {
    const cachedData = useChatStore.getState().communityScreenCaches[cacheKey];
    return !cachedData;
  });

  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [hasMorePosts, setHasMorePosts] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [lockReason, setLockReason] = useState<string>('');

  const fetchCommunity = async (force = false): Promise<void> => {
    try {
      if (Platform.OS === 'android' || Platform.OS === 'ios') {
        await ensureCategoriesLoaded();
      }
      const cachedData = useChatStore.getState().communityScreenCaches[cacheKey];
      if (!force && cachedData && Date.now() - (cachedData.lastFetched || 0) < 120000) {
        console.log('[Community] Using fresh cache, skipping fetchCommunity');
        setCommunity(cachedData.community);
        setRequests(cachedData.requests || []);
        setEvents(cachedData.events || []);
        setAllFestivals(cachedData.allFestivals || []);
        setCommunityPosts(cachedData.communityPosts || []);
        setLoading(false);
        return;
      }
      if (!cachedData) {
        setCommunity(null);
        setRequests([]);
        setEvents([]);
        setCommunityPosts([]);
        setLoading(true);
      }
      setHasMorePosts(true);
      let nextCommunity: any = { type: 'city', name: 'Community' };
      try {
        const response = await getCommunity(id as string);
        nextCommunity = response.data;
      } catch (err) {
        if (id === 'food_pune') {
          nextCommunity = {
            id: 'food_pune',
            name: 'Pune Food Sharing Group',
            type: 'city',
            members_count: 0,
            description: 'A community group for sharing food in Pune.',
          };
        } else if (id === 'mumbai-fallback' || id === 'city_default') {
          nextCommunity = {
            id: id,
            name: t('language') === 'hi' ? 'मेरा समुदाय' : 'My Community',
            type: 'city',
            members_count: 0,
            description: 'My Community Group',
          };
        } else if (id === 'maharashtra-fallback') {
          nextCommunity = {
            id: id,
            name: t('language') === 'hi' ? 'महाराष्ट्र समुदाय' : 'Maharashtra Community',
            type: 'state',
            members_count: 0,
            description: 'Maharashtra State Community Group',
          };
        } else if (id === 'bharat-fallback') {
          nextCommunity = {
            id: id,
            name: t('language') === 'hi' ? 'भारत समुदाय' : 'Bharat Community',
            type: 'country',
            members_count: 0,
            description: 'Bharat National Community Group',
          };
        } else {
          throw err;
        }
      }
      setCommunity(nextCommunity);

      const currentSubgroup =
        nextCommunity.type === 'state'
          ? 'state'
          : nextCommunity.type === 'country' || nextCommunity.type === 'national'
          ? 'national'
          : 'city';

      let stateCommunityId: string | null = null;
      let countryCommunityId: string | null = null;

      if (nextCommunity.type === 'city') {
        if (Platform.OS === 'android' && stateCommunityIdRef.current) {
          stateCommunityId = stateCommunityIdRef.current;
          countryCommunityId = countryCommunityIdRef.current;
        } else {
          try {
            const allJoinedRes = await getCommunities().catch(() => ({ data: [] }));
            const joinedList = allJoinedRes.data || [];

            const stateCommunity = joinedList.find((c: any) => c.type === 'state');
            const countryCommunity = joinedList.find((c: any) => c.type === 'country' || c.type === 'national');

            if (stateCommunity) {
              stateCommunityId = stateCommunity.id;
              stateCommunityIdRef.current = stateCommunity.id;
            }
            if (countryCommunity) {
              countryCommunityId = countryCommunity.id;
              countryCommunityIdRef.current = countryCommunity.id;
            }
          } catch (e) {
            console.warn('[Community] Failed to fetch joined communities:', e);
          }
        }
      }

      if (ensureSocketRooms) {
        ensureSocketRooms(currentSubgroup);
      }

      let targetFetchCommId = id as string;
      if (currentSubgroup === 'state' && stateCommunityId) {
        targetFetchCommId = stateCommunityId;
      } else if (currentSubgroup === 'national' && countryCommunityId) {
        targetFetchCommId = countryCommunityId;
      }

      const promises: Promise<any>[] = [
        getCommunityRequests({ community_id: targetFetchCommId }).catch(() => ({ data: [] })),
        getEvents().catch(() => ({ data: [] })),
        getCommunityMessages(targetFetchCommId, currentSubgroup, 15).catch(() => ({ data: [] })),
        getFestivalList().catch(() => ({ data: [] })),
      ];

      const isLocalCommunity = nextCommunity.type === 'city';
      if (isLocalCommunity) {
        promises.push(getCommunityRequests({ status: 'active', limit: 50 }).catch(() => ({ data: [] })));
      }

      const results = await Promise.all(promises);
      const reqResponse = results[0];
      const eventResponse = results[1];
      const msgResponse = results[2];
      const festResponse = results[3];
      const globalReqResponse = isLocalCommunity ? results[4] : null;

      if (msgResponse && msgResponse.data && msgResponse.data.locked) {
        setIsLocked(true);
        setLockReason(msgResponse.data.reason || 'Verification required to access discussions.');
      } else {
        setIsLocked(false);
        setLockReason('');
      }

      const rawMsgData = msgResponse?.data?.messages || (Array.isArray(msgResponse?.data) ? msgResponse.data : []);

      console.log('[Community] Requests fetched:', reqResponse.data?.length);
      let nextRequests = reqResponse.data || [];
      if (globalReqResponse && globalReqResponse.data) {
        const combined = [...nextRequests, ...globalReqResponse.data];
        nextRequests = combined.filter((v: any, i: number, a: any[]) => a.findIndex((t: any) => t.id === v.id) === i);
      }
      const nextEvents = eventResponse.data || [];
      setRequests(nextRequests);
      setEvents(nextEvents);

      let nextFestivals = allFestivals;
      if (festResponse.data && festResponse.data.length > 0) {
        nextFestivals = festResponse.data.map((f: any) => ({
          ...f,
          icon: 'flower-outline',
          color: '#F0F9FF',
          iconColor: '#00A3FF',
        }));
        setAllFestivals(nextFestivals);
      }

      const formattedMsgs = rawMsgData.map((msg: any) => ({
        id: msg.id || Math.random().toString(),
        user: {
          name: msg.sender_name || 'Anonymous',
          photo: msg.sender_photo,
          isVerified: msg.is_verified || false,
          verificationLabel: msg.verification_level === 'national' ? 'Bharat Verified' : 'State Verified',
        },
        content: msg.content,
        image: msg.media_url || msg.mediaUrl || msg.image,
        timestamp: msg.created_at || 'Just now',
        raw_timestamp: msg.created_at,
        likes: msg.likes_count || 0,
        comments: msg.comments_count || 0,
        shares: 0,
        reposts: 0,
        hideBadge: false,
        liked: (msg.liked_by || []).includes(user?.id),
        category: getLocalCategory(msg.content) || msg.category || 'Feed',
        sender_id: msg.sender_id,
        isCommunityMsg: true,
        subgroupType: currentSubgroup,
        communityId: id as string,
        contact: msg.contact,
        sevaDetails: msg.seva_details,
        location: msg.location,
        start_time: msg.start_time,
      }));

      const currentCache = useChatStore.getState().communityScreenCaches[cacheKey];
      const deletedIds = new Set<string>(currentCache?.deletedPostIds || []);

      let finalPosts: any[] = [];
      if (Platform.OS === 'ios') {
        const currentUser = useAuthStore.getState().user;
        const currentUserIdStr = currentUser?.id ? String(currentUser.id) : null;
        const currentUserName = currentUser?.name || null;

        const serverPosts = [...formattedMsgs];
        const serverIds = new Set<string>();
        for (const p of serverPosts) serverIds.add(String(p.id));
        const prevPosts = currentCache?.communityPosts || [];

        const localPosts = prevPosts.filter((p: any) => {
          const pIdStr = String(p.id);
          const isDeleted = deletedIds.has(pIdStr);
          if (isDeleted) return false;

          if (serverIds.has(pIdStr)) {
            return false;
          }

          if (pIdStr.startsWith('post-')) {
            const hasServerMatch = serverPosts.some((sp: any) => {
              const contentMatches = (p.content || '').trim() === (sp.content || '').trim();
              const senderMatches =
                (sp.sender_id && currentUserIdStr && String(sp.sender_id) === currentUserIdStr) ||
                (sp.user_id && currentUserIdStr && String(sp.user_id) === currentUserIdStr) ||
                (sp.user?.name && currentUserName && sp.user.name === currentUserName);
              return contentMatches && senderMatches;
            });
            if (hasServerMatch) {
              return false;
            }
          }

          const isLocal =
            pIdStr.startsWith('post-') ||
            p.isUniversal ||
            iosUserCreatedPostIds.has(pIdStr) ||
            (p.sender_id && currentUserIdStr && String(p.sender_id) === currentUserIdStr) ||
            (p.user_id && currentUserIdStr && String(p.user_id) === currentUserIdStr);

          return isLocal;
        });

        const seenIds = new Set<string>();
        for (const p of localPosts) seenIds.add(String(p.id));
        const uniqueServerMsgs = formattedMsgs.filter(
          (p: any) => !seenIds.has(String(p.id)) && !deletedIds.has(String(p.id))
        );

        const getPostTimeMs = (p: any) => {
          const ts = p.timestamp || p.created_at;
          if (!ts || ts === 'Just now') return Date.now();
          const parsed = parseUTCDate(ts).getTime();
          return Number.isNaN(parsed) ? Date.now() : parsed;
        };

        finalPosts = [...localPosts, ...uniqueServerMsgs].sort(
          (a, b) => getPostTimeMs(b) - getPostTimeMs(a)
        );

        setCommunityPosts(finalPosts);

        useChatStore.getState().setCommunityScreenCache(cacheKey, {
          community: nextCommunity,
          requests: nextRequests,
          events: nextEvents,
          allFestivals: nextFestivals,
          communityPosts: finalPosts,
          lastFetched: Date.now(),
        });
      } else {
        setCommunityPosts((prev: any[]) => {
          const serverIds = new Set<string>();
          for (const p of formattedMsgs) serverIds.add(p.id);
          const serverPosts = [...formattedMsgs];

          const localPosts = prev.filter((p: any) => {
            const isDeleted = deletedIds.has(String(p.id));
            if (isDeleted) return false;

            const isLocal =
              String(p.id).startsWith('post-') ||
              p.isUniversal ||
              (p.sender_id && user?.id && String(p.sender_id) === String(user?.id)) ||
              (p.user_id && user?.id && String(p.user_id) === String(user?.id));

            if (!isLocal) return false;
            if (serverIds.has(p.id)) return false;

            if (String(p.id).startsWith('post-')) {
              const hasServerMatch = serverPosts.some((sp: any) => {
                const contentMatches = (p.content || '').trim() === (sp.content || '').trim();
                const senderMatches =
                  (sp.sender_id && user?.id && String(sp.sender_id) === String(user?.id)) ||
                  (sp.user_id && user?.id && String(sp.user_id) === String(user?.id)) ||
                  (sp.user?.name && user?.name && sp.user.name === user.name);
                return contentMatches && senderMatches;
              });
              if (hasServerMatch) return false;
            }

            return true;
          });
          const seenIds = new Set<string>();
          for (const p of localPosts) seenIds.add(p.id);
          const uniqueServerMsgs = formattedMsgs.filter(
            (p: any) => !seenIds.has(p.id) && !deletedIds.has(String(p.id))
          );

          const getPostTimeMs = (p: any) => {
            const ts = p.timestamp || p.created_at;
            if (!ts || ts === 'Just now') return Date.now();
            const parsed = parseUTCDate(ts).getTime();
            return Number.isNaN(parsed) ? Date.now() : parsed;
          };

          finalPosts = [...localPosts, ...uniqueServerMsgs].sort(
            (a, b) => getPostTimeMs(b) - getPostTimeMs(a)
          );

          useChatStore.getState().setCommunityScreenCache(cacheKey, {
            community: nextCommunity,
            requests: nextRequests,
            events: nextEvents,
            allFestivals: nextFestivals,
            communityPosts: finalPosts,
            lastFetched: Date.now(),
          });

          return finalPosts;
        });
      }
    } catch (error) {
      console.error('Error fetching community data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = async (): Promise<void> => {
    if (loadingMore || !hasMorePosts) return;
    setLoadingMore(true);
    try {
      const currentSubgroup =
        community?.type === 'state'
          ? 'state'
          : community?.type === 'country' || community?.type === 'national'
          ? 'national'
          : 'city';
      const cityPosts = communityPosts.filter(
        (p: any) => !p.isStateAnnouncement && !p.isNationalAnnouncement && !String(p.id).startsWith('post-')
      );
      if (cityPosts.length === 0) {
        setHasMorePosts(false);
        setLoadingMore(false);
        return;
      }

      const oldestPost = cityPosts[cityPosts.length - 1];
      let beforeTimestamp = oldestPost.raw_timestamp || oldestPost.timestamp;
      if (beforeTimestamp === 'Just now' || beforeTimestamp === 'now') {
        beforeTimestamp = new Date().toISOString();
      }

      const msgResponse = await getCommunityMessages(id as string, currentSubgroup, 25, beforeTimestamp);
      const newMsgs = (msgResponse.data || []).map((msg: any) => ({
        id: msg.id || Math.random().toString(),
        user: {
          name: msg.sender_name || 'Anonymous',
          photo: msg.sender_photo,
          isVerified: msg.is_verified || false,
          verificationLabel: msg.verification_level === 'national' ? 'Bharat Verified' : 'State Verified',
        },
        content: msg.content,
        image: msg.media_url || msg.mediaUrl || msg.image,
        timestamp: msg.created_at || 'Just now',
        raw_timestamp: msg.created_at,
        likes: msg.likes_count || 0,
        comments: msg.comments_count || 0,
        shares: 0,
        reposts: 0,
        hideBadge: false,
        liked: (msg.liked_by || []).includes(user?.id),
        category: getLocalCategory(msg.content) || msg.category || 'Feed',
        sender_id: msg.sender_id,
        isCommunityMsg: true,
        subgroupType: currentSubgroup,
        communityId: id as string,
        contact: msg.contact,
        sevaDetails: msg.seva_details,
        location: msg.location,
      }));

      if (newMsgs.length > 0) {
        setCommunityPosts((prev) => {
          const updatedPosts = [...prev, ...newMsgs];
          const currentCache = useChatStore.getState().communityScreenCaches[cacheKey];
          if (currentCache) {
            useChatStore.getState().setCommunityScreenCache(cacheKey, {
              ...currentCache,
              communityPosts: updatedPosts,
              lastFetched: Date.now(),
            });
          }
          return updatedPosts;
        });
      } else {
        setHasMorePosts(false);
      }
    } catch (error) {
      console.error('Error loading more posts:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchCommunity(true).then(() => setRefreshing(false));
  }, []);

  return {
    community,
    setCommunity,
    requests,
    setRequests,
    events,
    setEvents,
    communityPosts,
    setCommunityPosts,
    allFestivals,
    setAllFestivals,
    loading,
    setLoading,
    refreshing,
    setRefreshing,
    hasMorePosts,
    setHasMorePosts,
    loadingMore,
    setLoadingMore,
    isLocked,
    setIsLocked,
    lockReason,
    setLockReason,
    fetchCommunity,
    handleLoadMore,
    onRefresh,
  };
}
