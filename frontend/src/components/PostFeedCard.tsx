import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
  SafeAreaView,
  Dimensions,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { COLORS, SPACING } from '../constants/theme';
import { Avatar } from './Avatar';
import { ReelViewer } from './ReelViewer';
import { formatTimeAgo } from '../utils/dateUtils';
import { useGlobalMute } from '../contexts/MuteContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

let ExpoVideoModule: any = null;
try {
  ExpoVideoModule = require('expo-video');
} catch (error) {
  console.warn('expo-video unavailable:', error);
}

const useSafeVideoPlayer = (source: string | null, setup: (player: any) => void) => {
  if (!ExpoVideoModule?.useVideoPlayer) return null;
  return ExpoVideoModule.useVideoPlayer(source, setup);
};

type PostFeedCardProps = {
  post: any;
  onLike?: (post: any) => void;
  onComment?: (post: any) => void;
  onShare?: (post: any) => void;
  onRepost?: (post: any) => void;
  onEdit?: (post: any) => void;
  onHashtagPress?: (hashtag: string) => void;
  onUserPress?: (post: any) => void;
  onPostMenuPress?: (post: any) => void;
  postMenuType?: 'delete' | 'report';
  isActive?: boolean;
  onLayout?: (event: any) => void;
  theme?: 'light' | 'dark';
  openCommentsOnCaptionPress?: boolean;
};

const formatTime = (raw: any) => {
  if (!raw) return 'now';
  const date = new Date(raw);
  if (isNaN(date.getTime())) return 'now';
  return date.toLocaleString();
};

const parseCaption = (caption: string): { text: string; isHashtag: boolean }[] => {
  const parts = caption.split(/(#\w+)/g);
  return parts.map((part) => ({
    text: part,
    isHashtag: part.startsWith('#'),
  }));
};

export const PostFeedCard = memo(({ 
  post,
  onLike,
  onComment,
  onShare,
  onRepost,
  onEdit,
  onHashtagPress,
  onUserPress,
  onPostMenuPress,
  postMenuType,
  isActive = false,
  onLayout,
  theme = 'dark',
  openCommentsOnCaptionPress = false,
}: PostFeedCardProps) => {
  const [isPausedByUser, setIsPausedByUser] = useState(false);
  const { isGloballyMuted: isMuted, toggleMute: toggleMute } = useGlobalMute();
  const [menuVisible, setMenuVisible] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [dynamicRatio, setDynamicRatio] = useState(4 / 5);
  const [isCaptionExpanded, setIsCaptionExpanded] = useState(false);

  const mediaUrl = String(
    post?.media_url ||
    post?.mediaUrl ||
    post?.image_url ||
    post?.imageUrl ||
    post?.image ||
    post?.thumbnail_url ||
    post?.thumbnailUrl ||
    ''
  );

  const mediaType = String(
    post?.media_type ||
    post?.mediaType ||
    post?.type ||
    ''
  ).toLowerCase();

  const isVideo = mediaType.startsWith('video') || /\.(mp4|mov|m4v|webm)(\?|$)/i.test(mediaUrl);

  const w = Number(post?.media_width);
  const h = Number(post?.media_height);
  const initialRawRatio = (w && h) ? (w / h) : null;

  const displayRatio = dynamicRatio < 1 ? dynamicRatio : Math.max(4 / 5, dynamicRatio);
  const feedHeight = SCREEN_WIDTH / displayRatio;

  const shouldPlay = isActive && !isPausedByUser;
  const videoRef = useRef<any>(null);

  const playerSource = (Platform.OS === 'web' || !isVideo) ? null : mediaUrl;
  const player = useSafeVideoPlayer(playerSource, (p) => {
    p.loop = true;
    p.muted = isMuted;
  });

  useEffect(() => {
    if (player) {
      player.muted = isMuted;
    }
    if (Platform.OS === 'web' && videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted, player]);

  useEffect(() => {
    if (Platform.OS === 'web') {
      if (videoRef.current) {
        if (shouldPlay) {
          videoRef.current.play().catch(() => { });
        } else {
          videoRef.current.pause();
        }
      }
    } else if (player) {
      if (shouldPlay) {
        player.play();
      } else {
        player.pause();
      }
    }
  }, [shouldPlay, player]);

  const prevIsActive = useRef(isActive);
  useEffect(() => {
    if (isActive && !prevIsActive.current && post?.id) {
      setIsPausedByUser(false);
      try {
        import('../services/api').then(m => m.viewPost(post.id)).catch(() => { });
      } catch (e) { }
    }
    prevIsActive.current = isActive;
  }, [isActive, post.id]);

  const lastTap = useRef<number>(0);

  const handleVideoPress = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    if (now - lastTap.current < DOUBLE_TAP_DELAY) {
      lastTap.current = 0;
      setIsFullscreen(true);
    } else {
      lastTap.current = now;
      setIsPausedByUser((prev) => !prev);
    }
  };

  const likedByMe = !!post?.liked_by_me;
  const likesCount = Number(post?.likes_count || 0);
  const commentsCount = Number(post?.comments_count || 0);
  const viewsCount = Number(post?.views_count || 0);
  const topComments = Array.isArray(post?.top_comments) ? post.top_comments.slice(0, 5) : [];
  const captionText = String(post?.caption || '').trim();
  const captionWords = captionText.split(/\s+/).filter(Boolean);
  const collapsedCaption = captionWords.slice(0, 4).join(' ') + (captionWords.length > 4 ? '...' : '');
  const isLongCaption = captionWords.length > 4;
  const captionSegments = captionText ? parseCaption(captionText) : [];

  return (
    <View style={styles.card} onLayout={onLayout}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.userPressWrap} onPress={() => onUserPress?.(post)} activeOpacity={0.8}>
          <Avatar name={post?.username || 'User'} photo={post?.user_photo} size={34} />
           <View style={styles.userMeta}>
             <Text style={[styles.username, theme === 'light' && styles.usernameLight]}>{post?.username || 'User'}</Text>
             {theme === 'light' && (
               <Text style={styles.timeTextLight}>{formatTime(post?.created_at)}, {post?.location?.city || 'Chennai'}</Text>
             )}
           </View>
        </TouchableOpacity>

        {onPostMenuPress && postMenuType && (
          <View style={styles.menuWrap}>
             <TouchableOpacity style={styles.menuBtn} onPress={() => setMenuVisible(!menuVisible)}>
               <Ionicons name="ellipsis-horizontal" size={18} color={theme === 'light' ? '#333' : '#FFFFFF'} />
             </TouchableOpacity>
            {menuVisible && (
              <View style={styles.dropdownMenu}>
                {postMenuType === 'delete' && onEdit && (
                  <TouchableOpacity style={styles.dropdownItem} onPress={() => { setMenuVisible(false); onEdit?.(post); }}>
                    <Text style={styles.dropdownText}>Edit</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.dropdownItem} onPress={() => { setMenuVisible(false); onPostMenuPress?.(post); }}>
                  <Text style={[styles.dropdownText, postMenuType !== 'delete' && styles.dropdownDangerText]}>
                    {postMenuType === 'delete' ? 'Delete post' : 'Report'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.dropdownItem} onPress={() => setMenuVisible(false)}>
                  <Text style={styles.dropdownText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Media */}
      <View style={[styles.mediaWrap, { height: feedHeight }]}>
        {mediaUrl ? (
          isVideo ? (
            <View style={styles.videoContainer}>
              {Platform.OS === 'web' ? (
                <video
                  ref={videoRef as any}
                  src={mediaUrl}
                  loop
                  muted
                  autoPlay
                  playsInline
                  onLoadedMetadata={(e) => {
                    if (!initialRawRatio) {
                      const target = e.target as HTMLVideoElement;
                      const ratio = target.videoWidth / target.videoHeight;
                      if (ratio && !isNaN(ratio)) setDynamicRatio(ratio);
                    }
                  }}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }}
                />
              ) : ExpoVideoModule?.VideoView && player ? (
                <ExpoVideoModule.VideoView 
                  player={player} 
                  style={styles.videoBackground} 
                  contentFit="cover" 
                  nativeControls={false}
                />
              ) : (
                <View style={[styles.videoBackground, { backgroundColor: '#000' }]} />
              )}
              <Pressable style={styles.videoOverlay} onPress={handleVideoPress} />
              <TouchableOpacity
                style={styles.muteToggle}
                onPress={toggleMute}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons
                  name={isMuted ? 'volume-mute' : 'volume-medium'}
                  size={20}
                  color="#FFF"
                />
              </TouchableOpacity>
            </View>
          ) : (
            <Image
              source={{ uri: mediaUrl }}
              style={styles.media}
              resizeMode="cover"
              onLoad={(e) => {
                if (!initialRawRatio) {
                  const source = e.nativeEvent.source;
                  if (source?.width && source?.height) {
                    setDynamicRatio(source.width / source.height);
                  }
                }
              }}
            />
          )
        ) : null}
      </View>

      {/* Actions */}
      <View style={styles.actionRow}>
         <TouchableOpacity style={styles.actionBtn} onPress={() => onLike?.(post)}>
           <Ionicons name={likedByMe ? 'heart' : 'heart-outline'} size={24} color={likedByMe ? COLORS.primary : (theme === 'light' ? '#333' : '#FFFFFF')} />
           {likesCount > 0 && <Text style={[styles.actionText, likedByMe && styles.actionTextActive, theme === 'light' && styles.actionTextLight]}>{likesCount}</Text>}
         </TouchableOpacity>
         <TouchableOpacity style={styles.actionBtn} onPress={() => onComment?.(post)}>
           <Ionicons name="chatbubble-outline" size={22} color={theme === 'light' ? '#333' : '#FFFFFF'} />
           {commentsCount > 0 && <Text style={[styles.actionText, theme === 'light' && styles.actionTextLight]}>{commentsCount}</Text>}
         </TouchableOpacity>
         <TouchableOpacity style={styles.actionBtn} onPress={() => onShare?.(post)}>
           <Ionicons name="paper-plane-outline" size={22} color={theme === 'light' ? '#333' : '#FFFFFF'} />
         </TouchableOpacity>
         <TouchableOpacity style={styles.actionBtn} onPress={() => onRepost?.(post)}>
           <Ionicons name="repeat-outline" size={24} color={theme === 'light' ? '#333' : '#FFFFFF'} />
         </TouchableOpacity>
      </View>

      {/* Caption */}
      {captionSegments.length > 0 && (
        <View style={{ paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm }}>
          <Pressable
        onPress={() => {
          if (!isLongCaption) return;
          const nextExpanded = !isCaptionExpanded;
          setIsCaptionExpanded(nextExpanded);
          if (nextExpanded && onComment && openCommentsOnCaptionPress) {
            setTimeout(() => onComment(post), 150);
          }
        }}
      >
            <Text style={[styles.captionText, theme === 'light' && styles.captionTextLight]} numberOfLines={isCaptionExpanded ? undefined : 1} ellipsizeMode="tail">
              <Text style={{ fontWeight: '900', color: theme === 'light' ? '#000' : '#222' }}>{post?.username || 'User'} </Text>
              {isCaptionExpanded ? captionSegments.map((seg, idx) =>
                seg.isHashtag ? (
                  <Text key={idx} style={{ color: COLORS.primary, fontWeight: '800' }} onPress={() => onHashtagPress?.(seg.text.replace('#', ''))}>
                    {seg.text}
                  </Text>
                ) : (
                  <Text key={idx} style={{ color: theme === 'light' ? '#222' : '#333', fontWeight: '700' }}>{seg.text}</Text>
                )
              ) : collapsedCaption}
            </Text>
            {isLongCaption && (
              <Text style={{ color: COLORS.primary, marginTop: 4, fontWeight: '900' }}>
                {isCaptionExpanded ? 'Show less' : 'More'}
              </Text>
            )}
          </Pressable>
        </View>
      )}

      {viewsCount > 0 && <Text style={[styles.viewsText, theme === 'light' && { color: '#444' }]}>{viewsCount} views</Text>}

      <TouchableOpacity onPress={() => onComment?.(post)} style={{ paddingHorizontal: SPACING.md, marginTop: 2, marginBottom: 4 }}>
        <Text style={{ color: theme === 'light' ? '#666' : 'rgba(0,0,0,0.6)', fontSize: 13, fontWeight: '700' }}>
          {commentsCount > 0 ? `View all ${commentsCount} comments` : 'Add a comment...'}
        </Text>
      </TouchableOpacity>

      {topComments.length > 0 && (
        <View style={styles.topCommentsWrap}>
          {topComments.map((comment: any, index: number) => (
             <Text key={comment.id ?? index} style={styles.topCommentText} numberOfLines={1}>
               <Text style={[styles.topCommentUser, theme === 'light' && styles.topCommentUserLight, { color: '#000' }]}>{comment?.username || 'User'} </Text>
               <Text style={{ color: theme === 'light' ? '#444' : '#222', fontSize: 13, fontWeight: '600' }}>{comment?.text || ''}</Text>
             </Text>
          ))}
        </View>
      )}

      {isVideo && isFullscreen && (
        <ReelViewer
          isVisible={isFullscreen}
          initialPost={post}
          onClose={() => { setIsFullscreen(false); setIsPausedByUser(false); }}
          onMinimize={() => { setIsFullscreen(false); setIsPausedByUser(false); }}
          onLike={onLike}
          onComment={onComment}
          onShare={onShare}
        />
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'transparent',
    marginBottom: 0,
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
    zIndex: 100
  },
  userPressWrap: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  userMeta: { marginLeft: SPACING.sm },
  username: { color: '#FFFFFF', fontWeight: '900', fontSize: 14 },
  usernameLight: { color: '#000' },
  timeText: { color: 'rgba(255, 255, 255, 0.7)', fontSize: 11, marginTop: 2, fontWeight: '600' },
  timeTextLight: { color: '#666', fontSize: 11, marginTop: 2, fontWeight: '600' },
  menuBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  menuWrap: { position: 'relative', zIndex: 1000, elevation: 12 },
  dropdownMenu: { position: 'absolute', right: 0, top: 36, minWidth: 140, backgroundColor: '#FFF', borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 10, elevation: 20, zIndex: 1001, overflow: 'hidden' },
  dropdownItem: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm },
  dropdownText: { color: '#000000', fontSize: 13, fontWeight: '700' },
  dropdownDangerText: { color: COLORS.error },
  mediaWrap: { width: SCREEN_WIDTH, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  videoContainer: { width: '100%', height: '100%', position: 'relative' },
  videoBackground: { width: '100%', height: '100%' },
  videoOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 },
  muteToggle: { position: 'absolute', top: 12, right: 12, zIndex: 10000, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  media: { width: '100%', height: '100%' },
  captionText: { color: '#111111', fontSize: 13, lineHeight: 18, fontWeight: '700' },
  captionTextLight: { color: '#333' },
  topCommentsWrap: { paddingHorizontal: SPACING.md, paddingBottom: SPACING.lg },
  topCommentText: { marginBottom: 4 },
  topCommentUser: { color: '#000000', fontWeight: '900', fontSize: 13 },
  topCommentUserLight: { color: '#000' },
  actionRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm },
  actionBtn: { flexDirection: 'row', alignItems: 'center', marginRight: SPACING.lg },
  actionText: { color: '#333333', marginLeft: 6, fontSize: 12, fontWeight: '800' },
  actionTextLight: { color: '#333' },
  actionTextActive: { color: COLORS.primary },
  viewsText: { color: 'rgba(255,255,255,0.9)', fontSize: 11, paddingHorizontal: SPACING.md, paddingBottom: 4, fontWeight: '700' },
});

export default PostFeedCard;