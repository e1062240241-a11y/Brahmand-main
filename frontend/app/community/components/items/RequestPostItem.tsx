import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, Platform } from 'react-native';
import { useCommunityStore } from '../../store/useCommunityStore';
import { useAuthStore } from '../../../../src/store/authStore';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '../../../../src/components/Avatar';
import { formatDateTimeIST } from '../../../../src/utils/dateUtils';
import { styles } from '../sharedStyles';
import { useCommunityActions } from '../../hooks/useCommunityActions';
import { VideoPlayer } from '../VideoPlayer';
import { useCommunityViewabilityStore } from '../../hooks/useCommunityViewability';

const getTimeAgo = (dateStr: string) => {
    return formatDateTimeIST(dateStr);
};

interface RequestPostItemProps {
  id: string;
  communityId: string;
}

export const RequestPostItem = React.memo(({ id, communityId }: RequestPostItemProps) => {
  const post = useCommunityStore(state => state.posts[id]);
  const user = useAuthStore(state => state.user);
  const actions = useCommunityActions(communityId);
  const isVisible = useCommunityViewabilityStore(state => state.visibleItemIds.has(id));

  if (!post || !user) return null;

  const myId = user.id || user._id;
  const isFulfilled = post.status === 'fulfilled' || post.status === 'resolved' || post.status === 'done';
  const ownerName = post.sender_name || 'Requester';

  const requestTypeLabel = (post as any).request_type ? String((post as any).request_type).toUpperCase() : 'REQUEST';
  const title = (post as any).title || post.content || 'Request';
  const description = (post as any).description;
  const location = (post as any).location;
  const contact = (post as any).contact_number || (post as any).contact;

  return (
    <View style={styles.festEventCard}>
      <View style={[styles.requestOwnerRow, { alignItems: 'flex-start', justifyContent: 'flex-start', marginBottom: 8 }]}>
        <Avatar name={ownerName} photo={post.sender_photo} size={40} />
        <View style={{ marginLeft: 10, flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
            <Text style={styles.feedPostUserName} numberOfLines={1}>{ownerName}</Text>
            <Text style={styles.postHandle} numberOfLines={1}>
              {post.sender_sl_id ? ` @${post.sender_sl_id}` : ` @${ownerName.replace(/\s+/g, '').toLowerCase()}`}
            </Text>
            <Text style={styles.postHandle} numberOfLines={1}> · {getTimeAgo(post.timestamp || '')}</Text>
            <View style={{ backgroundColor: '#F8FAFC', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 6, borderWidth: 1, borderColor: '#E2E8F0' }}>
              <Text style={{ fontSize: 10, color: '#64748B', fontWeight: '500' }}>{requestTypeLabel}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={[{ backgroundColor: '#FFF', borderRadius: 20, borderWidth: 1, borderColor: isFulfilled ? '#A7F3D0' : '#F0F0F0', padding: 16 }, isFulfilled ? { backgroundColor: '#F0FDF4' } : {}]}>
        <View style={styles.festEventMain}>
          {post.media_url && post.message_type === 'image' && (
             <Image source={{ uri: post.media_url }} style={styles.festEventImage} />
          )}
          {post.media_url && post.message_type === 'video' && (
             <VideoPlayer
                videoUrl={post.media_url}
                thumbnailUrl={post.thumbnail_url}
                isVisible={true} // Hardcoded true
                style={styles.festEventImage}
              />
          )}

          <View style={styles.festEventInfo}>
            <Text style={styles.festEventTitle} numberOfLines={2}>{title}</Text>
            {description ? (
              <Text style={styles.festEventDesc} numberOfLines={2}>{description}</Text>
            ) : null}
            <View style={styles.festEventMeta}>
              {location ? (
                <TouchableOpacity style={styles.festMetaRow} activeOpacity={0.7}>
                  <Ionicons name="location" size={14} color="#FF6B00" />
                  <Text style={[styles.festMetaText, { color: '#FF6B00', textDecorationLine: 'underline' }]} numberOfLines={1}>
                    {location}
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        </View>

        {isFulfilled && (
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#D1FAE5', padding: 8, borderRadius: 8, marginTop: 12, justifyContent: 'center' }}>
            <Ionicons name="checkmark-circle" size={16} color="#059669" />
            <Text style={{ marginLeft: 6, fontSize: 13, color: '#059669', fontWeight: '700' }}>Resolved / Found</Text>
          </View>
        )}

        {!isFulfilled && (
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#F1F5F9' }}>
             {contact ? (
                <TouchableOpacity style={[styles.festActionBtn, { flex: 1, backgroundColor: '#FFF0E5', borderColor: '#FFD7B5' }]}>
                  <Ionicons name="call" size={16} color="#FF6B00" />
                  <Text style={[styles.festActionBtnText, { color: '#FF6B00' }]}>Call</Text>
                </TouchableOpacity>
             ) : (
                <TouchableOpacity style={[styles.festActionBtn, { flex: 1, backgroundColor: '#FFF0E5', borderColor: '#FFD7B5' }]} onPress={() => actions.openThread(id)}>
                  <Ionicons name="chatbubble" size={16} color="#FF6B00" />
                  <Text style={[styles.festActionBtnText, { color: '#FF6B00' }]}>Message</Text>
                </TouchableOpacity>
             )}

            {myId === post.sender_id && (
              <TouchableOpacity style={[styles.festActionBtn, { flex: 1, backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]} onPress={() => actions.resolveRequest(id)}>
                <Ionicons name="checkmark-done-circle" size={16} color="#16A34A" />
                <Text style={[styles.festActionBtnText, { color: '#16A34A' }]}>Mark Resolved</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </View>
  );
});

RequestPostItem.displayName = 'RequestPostItem';
