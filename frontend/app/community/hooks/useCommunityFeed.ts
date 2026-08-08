import { useState, useCallback, useRef } from 'react';
import { useCommunityStore, Post } from '../store/useCommunityStore';
import { getCommunityMessages } from '../../../src/services/api';
import { database } from '../../../src/database/index.native';
import { Q, Collection } from '@nozbe/watermelondb';
import CommunityMessageModel from '../../../src/database/models/CommunityMessage';

export const useCommunityFeed = (communityId: string | null, subgroupType: string = 'Feed') => {
  const { setInitialPosts, appendPosts } = useCommunityStore();
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMorePosts, setHasMorePosts] = useState(true);

  const lastDocIdRef = useRef<string | null>(null);

  // Helper to fetch from WatermelonDB
  const fetchFromLocalDB = async (cId: string, limit: number = 20): Promise<Post[]> => {
    if (!database || !database.collections) return [];
    try {
      const messagesCollection = database.collections.get('community_messages') as unknown as Collection<CommunityMessageModel>;
      const localMessages = await messagesCollection
        .query(
          Q.where('community_id', cId),
          Q.sortBy('created_at', Q.desc),
          Q.take(limit)
        )
        .fetch();

      return localMessages.map((msg: any) => ({
        id: msg.id,
        community_id: msg.community_id,
        sender_id: msg.sender_id,
        sender_name: msg.sender_name,
        content: msg.content,
        message_type: msg.message_type,
        timestamp: msg.created_at ? new Date(msg.created_at).toISOString() : new Date().toISOString(),
      }));
    } catch (error) {
      console.warn('WatermelonDB fetch failed:', error);
      return [];
    }
  };

  const fetchPosts = useCallback(async (isRefresh = false) => {
    if (!communityId) return;

    if (isRefresh) {
      setRefreshing(true);
      lastDocIdRef.current = null;
    } else {
      setLoading(true);
    }

    try {
      // 1. Fetch from local WatermelonDB first for instant UI (only on initial load)
      if (!isRefresh && !lastDocIdRef.current) {
        const localPosts = await fetchFromLocalDB(communityId);
        if (localPosts.length > 0) {
          setInitialPosts(localPosts, subgroupType);
          setLoading(false);
        }
      }

      // 2. Fetch from remote API
      const limit = 20;
      const response = await getCommunityMessages(communityId, subgroupType, limit, lastDocIdRef.current || undefined);

      const remotePosts: Post[] = response.data?.messages || response.data || [];

      const normalizedPosts = remotePosts.map(p => ({ ...p, id: p.id || p._id }));

      if (isRefresh || !lastDocIdRef.current) {
        setInitialPosts(normalizedPosts, subgroupType);
      } else {
        appendPosts(normalizedPosts, subgroupType);
      }

      if (normalizedPosts.length > 0) {
        const lastPost = normalizedPosts[normalizedPosts.length - 1];
        lastDocIdRef.current = lastPost.id || lastPost._id || null;
      }

      if (normalizedPosts.length < limit) {
        setHasMorePosts(false);
      } else {
        setHasMorePosts(true);
      }

    } catch (error) {
      console.error('Failed to fetch community posts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [communityId, subgroupType, setInitialPosts, appendPosts]);

  const loadMore = useCallback(() => {
    if (!hasMorePosts || loadingMore || loading || refreshing) return;
    setLoadingMore(true);
    fetchPosts(false);
  }, [hasMorePosts, loadingMore, loading, refreshing, fetchPosts]);

  const refresh = useCallback(() => {
    fetchPosts(true);
  }, [fetchPosts]);

  return {
    loading,
    loadingMore,
    refreshing,
    hasMorePosts,
    fetchPosts,
    loadMore,
    refresh
  };
};
