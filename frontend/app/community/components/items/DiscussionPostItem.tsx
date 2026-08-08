import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, Platform } from 'react-native';
import { useCommunityStore } from '../../store/useCommunityStore';
import { useAuthStore } from '../../../../src/store/authStore';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Avatar } from '../../../../src/components/Avatar';
import { formatDateTimeIST } from '../../../../src/utils/dateUtils';
import { styles } from '../sharedStyles';
import { useCommunityActions } from '../../hooks/useCommunityActions';
import { VideoPlayer } from '../VideoPlayer';
import { COLORS } from '../../../../src/constants/theme';
import { useCommunityViewabilityStore } from '../../hooks/useCommunityViewability';

interface DiscussionPostItemProps {
  id: string;
  communityId: string;
  hasNextThreadConnection?: boolean;
  hasPrevThreadConnection?: boolean;
}

export const DiscussionPostItem = React.memo(({
  id,
  communityId,
  hasNextThreadConnection = false,
  hasPrevThreadConnection = false
}: DiscussionPostItemProps) => {
  const post = useCommunityStore(state => state.posts[id]);
  const user = useAuthStore(state => state.user);
  const actions = useCommunityActions(communityId);
  const isVisible = useCommunityViewabilityStore(state => state.visibleItemIds.has(id));

  const [isExpanded, setIsExpanded] = useState(false);

  if (!post || !user) return null;

  const isFulfilled = post.status === 'fulfilled' || post.status === 'resolved' || post.status === 'done';

  const shouldTruncate = (post.content || '').length > 300;
  const displayText = shouldTruncate && !isExpanded
    ? (post.content || '').slice(0, 300) + '...'
    : (post.content || '');

  const reactionsCount = Object.values(post.reactions || {}).reduce((a, b) => a + b, 0);

  return (
    <View style={[
      styles.postContainer,
      hasNextThreadConnection && { paddingBottom: 0, borderBottomWidth: 0 },
      hasPrevThreadConnection && { paddingTop: 0 }
    ]}>
      <View style={styles.postMainRow}>
        <View style={[styles.postLeftCol, { width: 48, alignItems: 'center' }]}>
          {hasPrevThreadConnection ? (
            <View style={{ position: 'absolute', left: 24, top: 0, bottom: 0, width: 2, backgroundColor: '#CFD9DE', zIndex: 1 }} />
          ) : (
            <>
              <TouchableOpacity activeOpacity={0.8} style={{ zIndex: 2 }}>
                <Avatar name={post.sender_name || 'User'} photo={post.sender_photo} size={48} />
              </TouchableOpacity>
              {hasNextThreadConnection && (
                <View style={{ position: 'absolute', left: 24, top: 48, bottom: -20, width: 2, backgroundColor: '#CFD9DE', zIndex: 1 }} />
              )}
            </>
          )}
        </View>

        <View style={styles.postRightCol}>
          <View style={styles.postHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 1, gap: 4 }}>
              {!hasPrevThreadConnection && (
                <TouchableOpacity activeOpacity={0.8}>
                  <Text style={[styles.posterName, isFulfilled && { color: '#9CA3AF' }]} numberOfLines={1}>
                    {post.sender_name || 'User'}
                  </Text>
                </TouchableOpacity>
              )}
              {isFulfilled && (
                <View style={{ backgroundColor: '#F3F4F6', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 }}>
                  <Text style={{ fontSize: 10, color: '#6B7280', fontWeight: '600' }}>Resolved</Text>
                </View>
              )}
              <Text style={styles.postTimestamp}>• {formatDateTimeIST(post.timestamp || '')}</Text>
            </View>

            <TouchableOpacity
              style={styles.postOptionsBtn}
              onPress={() => actions.triggerActionSheet(id)}
              hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
            >
              <Ionicons name="ellipsis-horizontal" size={18} color="#536471" />
            </TouchableOpacity>
          </View>

          {post.content ? (
            <View style={{ marginTop: hasPrevThreadConnection ? 0 : 2 }}>
              <TouchableOpacity activeOpacity={0.7} onPress={() => actions.openThread(id)}>
                <Text style={[styles.postText, isFulfilled && { color: '#9CA3AF' }]}>
                  {displayText}
                </Text>
              </TouchableOpacity>
              {shouldTruncate && !isExpanded && (
                <TouchableOpacity onPress={() => setIsExpanded(true)} style={{ marginTop: 2 }}>
                  <Text style={{ color: COLORS.primary, fontWeight: '600', fontSize: 14 }}>Show more</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : null}

          {post.message_type === 'image' && post.media_url ? (
            <TouchableOpacity
              activeOpacity={0.9}
              style={[styles.postMediaContainer, isFulfilled && { opacity: 0.5 }]}
            >
              <Image
                source={{ uri: post.media_url }}
                style={styles.postImage}
                resizeMode="cover"
              />
            </TouchableOpacity>
          ) : post.message_type === 'video' && post.media_url ? (
            <View style={[styles.postMediaContainer, isFulfilled && { opacity: 0.5 }]}>
              <VideoPlayer
                videoUrl={post.media_url}
                thumbnailUrl={post.thumbnail_url}
                isVisible={true}
                style={styles.postImage}
              />
            </View>
          ) : null}

          <View style={styles.postFooterRow}>
            <TouchableOpacity
              style={styles.postActionBtn}
              onPress={() => actions.openThread(id)}
              hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
            >
              <View style={styles.actionIconBg}>
                <Ionicons name="chatbubble-outline" size={18} color="#536471" />
              </View>
              <Text style={styles.actionCount}>{post.replies_count || 0}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.postActionBtn}
              onPress={() => actions.handleLikePost(id)}
              hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
            >
              <View style={[styles.actionIconBg, post.user_reaction === 'like' && { backgroundColor: 'rgba(249, 24, 128, 0.1)' }]}>
                <Ionicons
                  name={post.user_reaction === 'like' ? "heart" : "heart-outline"}
                  size={18}
                  color={post.user_reaction === 'like' ? "#F91880" : "#536471"}
                />
              </View>
              <Text style={[styles.actionCount, post.user_reaction === 'like' && { color: '#F91880' }]}>
                {reactionsCount || 0}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.postActionBtn}
              onPress={() => actions.handleSharePost(id)}
              hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
            >
              <View style={styles.actionIconBg}>
                <Ionicons name="share-outline" size={18} color="#536471" />
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
});

DiscussionPostItem.displayName = 'DiscussionPostItem';
