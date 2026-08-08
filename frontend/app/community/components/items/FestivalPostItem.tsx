import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { useCommunityStore } from '../../store/useCommunityStore';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../sharedStyles';
import { useCommunityActions } from '../../hooks/useCommunityActions';

export const FestivalPostItem = React.memo(({ id, communityId }: { id: string, communityId: string }) => {
  const post = useCommunityStore(state => state.posts[id]);
  const actions = useCommunityActions(communityId);

  if (!post) return null;

  return (
    <View style={styles.festEventCard}>
      <Text style={styles.festEventTitle}>Festival: {post.content}</Text>
       {post.media_url && post.message_type === 'image' && (
           <Image source={{ uri: post.media_url }} style={styles.festEventImage} />
        )}
    </View>
  );
});

FestivalPostItem.displayName = 'FestivalPostItem';
