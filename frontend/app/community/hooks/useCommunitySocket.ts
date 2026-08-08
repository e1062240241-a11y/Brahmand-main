import { useEffect, useRef } from 'react';
import { socketService } from '../../../src/services/socket';
import { useCommunityStore, Post } from '../store/useCommunityStore';

export const useCommunitySocket = (communityId: string | null, subgroupType: string = 'Feed') => {
  const { prependPost, updatePost, removePost } = useCommunityStore();
  const socketListenerIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!communityId) return;

    const room = `community_${communityId}`;
    let isMounted = true;

    // Join the community socket room
    const joinRoom = async () => {
      try {
        await socketService.connect();
        socketService.joinRoom(room).catch(() => {});
      } catch (error) {
        console.warn('Socket connection error:', error);
      }
    };

    joinRoom();

    const handleSocketMessage = (data: any) => {
      if (!isMounted) return;

      const { type, message, messageId, reactions, status } = data;

      if (type === 'new_message' && message) {
          const newPost = {
              ...message,
              id: message.id || message._id
          };
        prependPost(newPost, subgroupType);
      } else if (type === 'delete_message' && messageId) {
        removePost(messageId);
      } else if (type === 'reaction_update' && messageId) {
          updatePost(messageId, { reactions });
      } else if (type === 'status_update' && messageId) {
          updatePost(messageId, { status });
      } else if (type === 'reply_added' && message) {
          if(data.parentId) {
              useCommunityStore.setState((state) => {
                  const parent = state.posts[data.parentId];
                  if(parent) {
                      return {
                          posts: {
                              ...state.posts,
                              [data.parentId]: {
                                  ...parent,
                                  replies_count: (parent.replies_count || 0) + 1
                              }
                          }
                      }
                  }
                  return state;
              })
          }
      }
    };

    socketListenerIdRef.current = `community_${communityId}_${Date.now()}`;
    socketService.onMessage(socketListenerIdRef.current, handleSocketMessage);

    return () => {
      isMounted = false;
      if (socketListenerIdRef.current) {
        socketService.offMessage(socketListenerIdRef.current);
      }
      try {
        socketService.leaveRoom(room);
      } catch (e) {
         // ignore
      }
    };
  }, [communityId, subgroupType, prependPost, updatePost, removePost]);
};
