import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Animated,
} from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';

import { COLORS, SPACING } from '../constants/theme';
import { Avatar } from './Avatar';
import { ReelViewer } from './ReelViewer';

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
};

const formatTime = (raw: any) => {
  if (!raw) return 'now';
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return 'now';
  return date.toLocaleString();
};

// Safely parse a caption into plain text segments and hashtag segments
const parseCaption = (caption: string): { text: string; isHashtag: boolean }[] => {
  const parts = caption.split(/(#\w+)/g);
  return parts.map((part) => ({
    text: part,
    isHashtag: part.startsWith('#'),
  }));
};

export const PostFeedCard = ({
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
}: PostFeedCardProps) => {
  const [isPausedByUser, setIsPausedByUser] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [menuVisible, setMenuVisible] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showHeartBurst, setShowHeartBurst] = useState(false);

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
  const isVideo =
    mediaType.startsWith('video') || /\.(mp4|mov|m4v|webm)(\?|$)/i.test(mediaUrl);

  // ─── aspect ratio: use post metadata if available, else safe default ───
  const w = Number(post?.media_width);
  const h = Number(post?.media_height);
  const initialRawRatio = (w && h) ? (w / h) : null;

  // DYNAMIC RATIO STATE: Defaults to backend ratio OR fallback to 4/5
  const [dynamicRatio, setDynamicRatio] = useState(initialRawRatio || 4 / 5);

  // Calculate exact Instagram style dynamic feed dimensions
  // Landscape/Square use natural ratio, Portrait caps at 4:5 height
  const screenWidth = Dimensions.get('window').width;
  const displayRatio = Math.max(4 / 5, dynamicRatio);
  const feedHeight = screenWidth / displayRatio;

  const shouldPlay = isActive && !isPausedByUser;

  // ─── native video player (non-web only) ───
  const playerSource = Platform.OS === 'web' ? null : mediaUrl;
  const player = useVideoPlayer(playerSource, (p) => {
    p.loop = true;
    p.muted = isMuted;
    if (shouldPlay) p.play();
  });

  useEffect(() => {
    if (player) player.muted = isMuted;
  }, [isMuted, player]);

  useEffect(() => {
    if (player) {
      if (shouldPlay) player.play();
      else player.pause();
    }
  }, [shouldPlay, player]);

  // ─── FIX: only reset isPausedByUser when card transitions from inactive → active ───
  const prevIsActive = useRef(isActive);
  useEffect(() => {
    if (isActive && !prevIsActive.current) {
      setIsPausedByUser(false);
    }
    prevIsActive.current = isActive;
  }, [isActive]);

  // ─── FIX: web video ref — stable ref, updated via useEffect, not inline callback ───
  const webVideoRef = useRef<HTMLVideoElement | null>(null);
  useEffect(() => {
    const vid = webVideoRef.current;
    if (!vid) return;
    vid.muted = isMuted;
  }, [isMuted]);
  useEffect(() => {
    const vid = webVideoRef.current;
    if (!vid) return;
    if (shouldPlay) vid.play().catch(() => {});
    else vid.pause();
  }, [shouldPlay]);

  const likedByMe = !!post?.liked_by_me;
  const likesCount = Number(post?.likes_count || 0);
  const commentsCount = Number(post?.comments_count || 0);
  const viewsCount = Number(post?.views_count || 0);
  const topComments = Array.isArray(post?.top_comments)
    ? post.top_comments.slice(0, 5)
    : [];

  const lastTap = useRef<number>(0);
  const heartScale = useRef(new Animated.Value(0)).current;
  const heartOpacity = useRef(new Animated.Value(0)).current;
  // guard so fullscreen can't be re-triggered while it's open
  const fullscreenCooldown = useRef(false);

  const triggerHeartBurst = useCallback(() => {
    setShowHeartBurst(true);
    heartScale.setValue(0.3);
    heartOpacity.setValue(1);
    Animated.parallel([
      Animated.spring(heartScale, {
        toValue: 1,
        useNativeDriver: true,
        friction: 4,
      }),
      Animated.timing(heartOpacity, {
        toValue: 0,
        duration: 700,
        delay: 300,
        useNativeDriver: true,
      }),
    ]).start(() => setShowHeartBurst(false));
  }, [heartScale, heartOpacity]);

  const handleVideoPress = () => {
    if (fullscreenCooldown.current) return;

    const now = Date.now();
    const DOUBLE_PRESS_DELAY = 300;

    if (now - lastTap.current < DOUBLE_PRESS_DELAY) {
      lastTap.current = 0;
      // Double tap: open fullscreen (existing behaviour preserved)
      // Set cooldown so a 3rd immediate tap doesn't re-fire
      fullscreenCooldown.current = true;
      setIsFullscreen(true);
      setIsPausedByUser(false);
      setTimeout(() => {
        fullscreenCooldown.current = false;
      }, 500);
    } else {
      lastTap.current = now;
      setIsPausedByUser((prev) => !prev);
    }
  };

  const handleMenuAction = () => {
    setMenuVisible(false);
    onPostMenuPress?.(post);
  };

  const captionSegments = post?.caption ? parseCaption(post.caption) : [];

  return (
    <View style={styles.card} onLayout={onLayout}>
      {/* ─── Header ─── */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.userPressWrap}
          onPress={() => {
            setMenuVisible(false);
            onUserPress?.(post);
          }}
          activeOpacity={0.8}
        >
          <Avatar name={post?.username || 'User'} photo={post?.user_photo} size={34} />
          <View style={styles.userMeta}>
            <Text style={styles.username}>{post?.username || 'User'}</Text>
            <Text style={styles.timeText}>{formatTime(post?.created_at)}</Text>
          </View>
        </TouchableOpacity>

        {onPostMenuPress && postMenuType && (
          <View style={styles.menuWrap}>
            <TouchableOpacity
              style={styles.menuBtn}
              onPress={() => setMenuVisible((prev) => !prev)}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="ellipsis-horizontal" size={18} color={COLORS.text} />
            </TouchableOpacity>

            {/* ─── FIX: dropdown rendered in card-level View via absolute positioning ─── */}
            {menuVisible && (
              <View style={styles.dropdownMenu}>
                {postMenuType === 'delete' && onEdit && (
                  <TouchableOpacity
                    style={styles.dropdownItem}
                    onPress={() => {
                      setMenuVisible(false);
                      onEdit?.(post);
                    }}
                  >
                    <Text style={styles.dropdownText}>Edit</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.dropdownItem} onPress={handleMenuAction}>
                  <Text
                    style={[
                      styles.dropdownText,
                      postMenuType !== 'delete' && styles.dropdownDangerText,
                    ]}
                  >
                    {postMenuType === 'delete' ? 'Delete post' : 'Report'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => setMenuVisible(false)}
                >
                  <Text style={styles.dropdownText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </View>

      {/* ─── Media ─── */}
      <View style={[styles.mediaWrap, { width: screenWidth, height: feedHeight }]}>
        {mediaUrl ? (
          isVideo ? (
            <View style={styles.videoContainer}>
              {Platform.OS === 'web' ? (
                // ─── FIX: stable ref, no inline callback that fires on every render ───
                <video
                  ref={webVideoRef as any}
                  src={mediaUrl}
                  loop
                  muted={isMuted}
                  playsInline
                  onLoadedMetadata={(e) => {
                    if (!initialRawRatio) {
                      const target = e.target as HTMLVideoElement;
                        const ratio = target.videoWidth / target.videoHeight;
                        if (ratio && !isNaN(ratio)) setDynamicRatio(ratio);
                    }
                  }}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    pointerEvents: 'none',
                  }}
                />
              ) : (
                <VideoView
                  player={player}
                  style={styles.videoBackground}
                  contentFit="cover"
                  allowsPictureInPicture={false}
                  nativeControls={false}
                  playsInline={true}
                  // pointerEvents handled by overlay Pressable below
                />
              )}

              {/* Touch overlay: handles single/double tap */}
              <Pressable style={styles.videoOverlay} onPress={handleVideoPress} />

              {/* Heart burst on like (double-tap in a future iteration) */}
              {showHeartBurst && (
                <Animated.View
                  style={[
                    styles.heartBurst,
                    { transform: [{ scale: heartScale }], opacity: heartOpacity },
                  ]}
                  pointerEvents="none"
                >
                  <Ionicons name="heart" size={90} color="white" />
                </Animated.View>
              )}

              {/* Pause indicator */}
              {isPausedByUser && (
                <View style={styles.pauseIndicator} pointerEvents="none">
                  <View style={styles.pauseIconBg}>
                    <Ionicons name="pause" size={28} color="#FFF" />
                  </View>
                </View>
              )}

              {/* Mute button */}
              <TouchableOpacity
                style={styles.muteButton}
                activeOpacity={0.8}
                onPress={() => setIsMuted((prev) => !prev)}
              >
                <View style={styles.muteIconBg}>
                  <Ionicons
                    name={isMuted ? 'volume-mute' : 'volume-medium'}
                    size={16}
                    color="#FFF"
                  />
                </View>
              </TouchableOpacity>
            </View>
          ) : (
            <Image 
              source={{ uri: mediaUrl }} 
              style={styles.media} 
              resizeMode="cover" 
              // IMAGE FALLBACK: Get ratio once image loads
              onLoad={(e) => {
                if (!initialRawRatio) {
                  const source = e.nativeEvent.source;
                  // Handle both Native and Web event structures safely
                  const width = source?.width || (e.nativeEvent as any).width;
                  const height = source?.height || (e.nativeEvent as any).height;
                  
                  if (width && height) {
                    setDynamicRatio(width / height);
                  }
                }
              }}
            />
          )
        ) : null}
      </View>

      {/* ─── Actions ─── */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => {
            setMenuVisible(false);
            onLike?.(post);
          }}
        >
          <Ionicons
            name={likedByMe ? 'heart' : 'heart-outline'}
            size={24}
            color={likedByMe ? COLORS.primary : COLORS.text}
          />
          {likesCount > 0 && (
            <Text style={[styles.actionText, likedByMe && styles.actionTextActive]}>
              {likesCount}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => {
            setMenuVisible(false);
            onComment?.(post);
          }}
        >
          <Ionicons
            name="chatbubble-outline"
            size={22}
            color={COLORS.text}
            style={{ transform: [{ scaleX: -1 }] }}
          />
          {commentsCount > 0 && (
            <Text style={styles.actionText}>{commentsCount}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => {
            setMenuVisible(false);
            onShare?.(post);
          }}
        >
          <Ionicons name="paper-plane-outline" size={22} color={COLORS.text} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => {
            setMenuVisible(false);
            onRepost?.(post);
          }}
        >
          <Ionicons name="repeat-outline" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      {/* ─── Caption: FIX — each hashtag tappable individually ─── */}
      {captionSegments.length > 0 && (
        <Text style={styles.caption}>
          <Text style={{ fontWeight: '700', color: COLORS.text }}>
            {post?.username || 'User'}{' '}
          </Text>
          {captionSegments.map((seg, idx) =>
            seg.isHashtag ? (
              <Text
                key={idx}
                style={{ color: COLORS.primary, fontSize: 13.5 }}
                onPress={() =>
                  onHashtagPress?.(seg.text.replace('#', ''))
                }
              >
                {seg.text}
              </Text>
            ) : (
              <Text key={idx} style={{ color: COLORS.text, fontSize: 13.5 }}>
                {seg.text}
              </Text>
            )
          )}
        </Text>
      )}

      {viewsCount > 0 && (
        <Text style={styles.viewsText}>{viewsCount} views</Text>
      )}

      <TouchableOpacity
        onPress={() => onComment?.(post)}
        style={{ paddingHorizontal: SPACING.md, marginTop: 2, marginBottom: 4 }}
      >
        <Text style={{ color: COLORS.textSecondary, fontSize: 13, fontWeight: '500' }}>
          {commentsCount > 0 ? `View all ${commentsCount} comments` : 'Add a comment...'}
        </Text>
      </TouchableOpacity>

      {/* ─── Top comments: FIX — safe keys ─── */}
      {topComments.length > 0 && (
        <View style={styles.topCommentsWrap}>
          {topComments.map((comment: any, index: number) => (
            <Text
              key={comment.id ?? `comment-fallback-${index}`}
              style={styles.topCommentText}
              numberOfLines={1}
            >
              <Text style={styles.topCommentUser}>
                {comment?.username || 'User'}{' '}
              </Text>
              <Text style={{ color: COLORS.text, fontSize: 13 }}>
                {comment?.text || ''}
              </Text>
            </Text>
          ))}
        </View>
      )}

      {/* ─── Fullscreen modal (double-tap, preserved) ─── */}
      {isVideo && isFullscreen && (
        <ReelViewer
          isVisible={isFullscreen}
          initialPost={post}
          onClose={() => {
            setIsFullscreen(false);
            setIsPausedByUser(false);
          }}
          onLike={onLike}
          onComment={onComment}
          onShare={onShare}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
    // removed overflow: 'visible' — use menuWrap absolute positioning instead
    zIndex: 100,
  },
  userPressWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userMeta: {
    marginLeft: SPACING.sm,
  },
  username: {
    color: COLORS.text,
    fontWeight: '700',
    fontSize: 14,
  },
  timeText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  menuBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: SPACING.sm,
    zIndex: 5,
  },
  menuWrap: {
    position: 'relative',
    zIndex: 1000,
    // FIX for Android: elevate the wrapper so dropdown isn't clipped
    elevation: 12,
  },
  dropdownMenu: {
    position: 'absolute',
    right: 0,
    top: 36,
    minWidth: 140,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 20,           // higher than menuWrap so it renders on top on Android
    zIndex: 1001,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  dropdownText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '600',
  },
  dropdownDangerText: {
    color: COLORS.error,
  },
  mediaWrap: {
    width: '100%',
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  videoContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  videoBackground: {
    width: '100%',
    height: '100%',
    // pointer events blocked by overlay Pressable; no need for pointerEvents prop here
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
  heartBurst: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10001,
  },
  pauseIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10000,
  },
  pauseIconBg: {
    backgroundColor: 'rgba(0,0,0,0.45)',
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  muteButton: {
    position: 'absolute',
    bottom: SPACING.md,
    left: SPACING.md,
    zIndex: 10000,
  },
  muteIconBg: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  media: {
    width: '100%',
    height: '100%',
  },
  caption: {
    color: COLORS.text,
    fontSize: 13,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.sm,
  },
  topCommentsWrap: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  topCommentText: {
    marginBottom: 4,
    flexDirection: 'row',
  },
  topCommentUser: {
    color: COLORS.text,
    fontWeight: '700',
    fontSize: 13,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.lg,
  },
  actionText: {
    color: COLORS.text,
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '600',
  },
  actionTextActive: {
    color: COLORS.primary,
  },
  viewsText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
  },
});

export default PostFeedCard;