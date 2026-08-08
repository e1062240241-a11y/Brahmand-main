import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { useCommunityStore } from '../../store/useCommunityStore';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../sharedStyles';
import { useCommunityActions } from '../../hooks/useCommunityActions';
import { VideoPlayer } from '../VideoPlayer';
import { useCommunityViewabilityStore } from '../../hooks/useCommunityViewability';

export const FestivalPostItem = React.memo(({ id, communityId }: { id: string, communityId: string }) => {
  const post = useCommunityStore(state => state.posts[id]);
  const actions = useCommunityActions(communityId);
  const isVisible = useCommunityViewabilityStore(state => state.visibleItemIds.has(id));

  if (!post) return null;

  return (
    <View style={styles.festEventCard}>
      <View style={styles.festBanner}>
         <View style={styles.festBannerLeft}>
            <Ionicons name="sparkles-outline" size={28} color="#FF6B00" />
            <View style={{ marginLeft: 12, flex: 1 }}>
               <Text style={styles.festBannerTitle}>{post.content || 'Festival Updates'}</Text>
               <Text style={styles.festBannerSub}>{post.caption || 'Join the celebration!'}</Text>
            </View>
         </View>
      </View>

       {post.media_url && post.message_type === 'image' && (
           <Image source={{ uri: post.media_url }} style={styles.festEventImage} />
        )}
       {post.media_url && post.message_type === 'video' && (
           <VideoPlayer
              videoUrl={post.media_url}
              thumbnailUrl={post.thumbnail_url}
              isVisible={isVisible}
              style={styles.festEventImage}
            />
        )}

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
         <TouchableOpacity
           style={[styles.festActionBtn, { flex: 1, backgroundColor: '#FFF0E5', borderColor: '#FFD7B5' }]}
           onPress={() => actions.handleSharePost(id)}
         >
           <Ionicons name="share-social-outline" size={16} color="#FF6B00" />
           <Text style={[styles.festActionBtnText, { color: '#FF6B00' }]}>Share</Text>
         </TouchableOpacity>
      </View>
    </View>
  );
});

FestivalPostItem.displayName = 'FestivalPostItem';
