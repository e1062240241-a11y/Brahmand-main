import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { useCommunityStore } from '../../store/useCommunityStore';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../sharedStyles';
import { useCommunityActions } from '../../hooks/useCommunityActions';
import { Avatar } from '../../../../src/components/Avatar';
import { formatDateTimeIST } from '../../../../src/utils/dateUtils';

export const SevaPostItem = React.memo(({ id, communityId }: { id: string, communityId: string }) => {
  const post = useCommunityStore(state => state.posts[id]);
  const actions = useCommunityActions(communityId);

  if (!post) return null;

  return (
    <View style={[styles.postContainer, { backgroundColor: '#FDF7F0' }]}>
      <View style={styles.postMainRow}>
        <View style={styles.postLeftCol}>
          <Avatar name={post.sender_name || 'Seva'} photo={post.sender_photo} size={48} />
        </View>
        <View style={styles.postRightCol}>
          <View style={styles.postHeaderRow}>
            <Text style={styles.posterName}>{post.sender_name}</Text>
            <Text style={styles.postTimestamp}>• {formatDateTimeIST(post.timestamp || '')}</Text>
          </View>
          <Text style={styles.postText}>{post.content}</Text>
          {post.media_url && post.message_type === 'image' && (
             <Image source={{ uri: post.media_url }} style={styles.postImage} />
          )}
          <View style={styles.postFooterRow}>
             <TouchableOpacity style={styles.postActionBtn} onPress={() => actions.handleLikePost(id)}>
                <Ionicons
                  name={post.user_reaction === 'like' ? "heart" : "heart-outline"}
                  size={18}
                  color={post.user_reaction === 'like' ? "#F91880" : "#536471"}
                />
             </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
});

SevaPostItem.displayName = 'SevaPostItem';
