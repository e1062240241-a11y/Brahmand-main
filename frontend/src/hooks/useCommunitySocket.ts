import { useEffect, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import { socketService } from '../services/socket';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';

export interface UseCommunitySocketReturn {
  ensureSocketRooms: (primarySubgroup?: string) => void;
}

export function useCommunitySocket(
  id: string,
  cacheKey: string,
  stateCommunityIdRef: React.MutableRefObject<string | null>,
  countryCommunityIdRef: React.MutableRefObject<string | null>,
  onNewMessage: (formattedPost: any) => void
): UseCommunitySocketReturn {
  const joinedSocketRoomsRef = useRef<Set<string>>(new Set());
  const socketListenerIdRef = useRef<string | null>(null);

  const handleSocketMessage = useCallback(
    (message: any) => {
      if (!message || !message.id) return;
      const msgCommunityId = message.community_id;
      const subgroup = message.subgroup_type;
      if (!msgCommunityId || (subgroup !== 'city' && subgroup !== 'state' && subgroup !== 'national')) return;
      if (
        msgCommunityId !== id &&
        msgCommunityId !== stateCommunityIdRef.current &&
        msgCommunityId !== countryCommunityIdRef.current
      )
        return;

      const currentUserId = useAuthStore.getState().user?.id;
      if (message.sender_id && currentUserId && String(message.sender_id) === String(currentUserId)) return;

      const currentCache = useChatStore.getState().communityScreenCaches[cacheKey];
      const deletedIds = new Set(currentCache?.deletedPostIds || []);
      if (deletedIds.has(String(message.id))) return;

      const formattedPost = {
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
      };

      onNewMessage(formattedPost);
    },
    [id, cacheKey, stateCommunityIdRef, countryCommunityIdRef, onNewMessage]
  );

  const ensureSocketRooms = useCallback(
    (primarySubgroup?: string) => {
      if (Platform.OS === 'web') return;
      let targetCommId = id as string;
      if (primarySubgroup === 'state' && stateCommunityIdRef.current) {
        targetCommId = stateCommunityIdRef.current;
      } else if (
        (primarySubgroup === 'national' || primarySubgroup === 'country') &&
        countryCommunityIdRef.current
      ) {
        targetCommId = countryCommunityIdRef.current;
      }

      const activeSubgroupRoom = primarySubgroup
        ? `community_${targetCommId}_${primarySubgroup}`
        : `community_${targetCommId}_city`;

      joinedSocketRoomsRef.current.forEach((room) => {
        if (room !== activeSubgroupRoom) {
          socketService.leaveRoom(room);
          joinedSocketRoomsRef.current.delete(room);
        }
      });

      if (!joinedSocketRoomsRef.current.has(activeSubgroupRoom)) {
        joinedSocketRoomsRef.current.add(activeSubgroupRoom);
        socketService.joinRoom(activeSubgroupRoom).catch(() => {});
      }
    },
    [id, stateCommunityIdRef, countryCommunityIdRef]
  );

  useEffect(() => {
    if (Platform.OS === 'web') return;
    let mounted = true;
    socketService
      .connect()
      .then(() => {
        if (!mounted) return;
        const listenerId = `community_screen_${id}_${Date.now()}`;
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
  }, [id, handleSocketMessage]);

  return { ensureSocketRooms };
}
