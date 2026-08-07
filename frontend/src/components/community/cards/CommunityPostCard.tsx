import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Avatar } from '../../Avatar';
import { COLORS } from '../../../constants/theme';

interface CommunityPostCardProps {
  post: any;
  onLike: (postId: string) => void;
  onComment: (postId: string, content: string) => void;
  onShare: (postId: string) => void;
  currentUserId?: string;
  distanceFromActive?: number;
}

export const CommunityPostCard = React.memo(
  function CommunityPostCard({ 
    post, 
    onLike, 
    onComment, 
    onShare, 
    currentUserId,
    distanceFromActive = 0,
  }: CommunityPostCardProps) {
    
    const handleLikePress = useCallback(() => {
      onLike(post.id);
    }, [onLike, post.id]);

    const handleCommentPress = useCallback(() => {
      onComment(post.id, '');
    }, [onComment, post.id]);

    const handleSharePress = useCallback(() => {
      onShare(post.id);
    }, [onShare, post.id]);

    const isOwner = currentUserId && String(post.sender_id || post.user?.id) === String(currentUserId);

    // Determine if media should be active based on distance from active post
    const isMediaActive = distanceFromActive <= 2;
    const shouldUnmountMedia = distanceFromActive > 3;

    return (
      <View style={styles.card}>
        <View style={styles.header}>
          <Avatar 
            uri={post.user?.photo || post.photo} 
            size={40} 
            name={post.user?.name || 'User'}
            fallbackIcon="person"
          />
          <View style={styles.userInfo}>
            <Text style={styles.userName} numberOfLines={1}>
              {post.user?.name || 'Anonymous'}
            </Text>
            <Text style={styles.timestamp} numberOfLines={1}>
              {post.timestamp || 'Just now'}
            </Text>
          </View>
          {post.user?.isVerified && (
            <Ionicons name="checkmark-circle" size={18} color="#3B82F6" style={styles.verifiedIcon} />
          )}
        </View>

        {post.content ? (
          <Text style={styles.content} selectable>
            {post.content}
          </Text>
        ) : null}

        {post.image && (
          <Image 
            source={{ uri: typeof post.image === 'string' ? post.image : post.image.uri }} 
            style={styles.image}
            resizeMode="cover"
          />
        )}

        {post.media_url && (
          <View style={styles.mediaContainer}>
            {/* Video component would be rendered here with isActive prop */}
            <View style={[styles.videoPlaceholder, { opacity: isMediaActive ? 1 : 0.5 }]}>
              {!isMediaActive && (
                <Ionicons name="play-circle-outline" size={40} color="rgba(255,255,255,0.6)" />
              )}
            </View>
          </View>
        )}

        <View style={styles.actions}>
          <TouchableOpacity 
            style={[styles.actionButton, post.liked && styles.likedButton]} 
            onPress={handleLikePress}
            activeOpacity={0.7}
          >
            <Ionicons 
              name={post.liked ? 'heart' : 'heart-outline'} 
              size={22} 
              color={post.liked ? '#EF4444' : '#6B7280'} 
            />
            <Text style={[styles.actionText, post.liked && styles.likedText]}>
              {post.likes || 0}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={handleCommentPress}
            activeOpacity={0.7}
          >
            <Ionicons name="chatbubble-outline" size={22} color="#6B7280" />
            <Text style={styles.actionText}>{post.comments || 0}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={handleSharePress}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="share-outline" size={22} color="#6B7280" />
            <Text style={styles.actionText}>{post.shares || 0}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparator to prevent unnecessary re-renders
    return (
      prevProps.post.id === nextProps.post.id &&
      prevProps.post.likes === nextProps.post.likes &&
      prevProps.post.liked === nextProps.post.liked &&
      prevProps.post.comments === nextProps.post.comments &&
      prevProps.post.content === nextProps.post.content &&
      prevProps.post.image === nextProps.post.image &&
      prevProps.currentUserId === nextProps.currentUserId &&
      prevProps.distanceFromActive === nextProps.distanceFromActive
    );
  }
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  timestamp: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  verifiedIcon: {
    marginLeft: 4,
  },
  content: {
    fontSize: 15,
    lineHeight: 22,
    color: '#374151',
    marginBottom: 12,
  },
  image: {
    width: '100%',
    height: 250,
    borderRadius: 12,
    marginBottom: 12,
  },
  mediaContainer: {
    width: '100%',
    height: 250,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  videoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  actions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  actionText: {
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 6,
  },
  likedButton: {
    opacity: 1,
  },
  likedText: {
    color: '#EF4444',
  },
});
