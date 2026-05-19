import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { Image } from 'expo-image';
import {
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
  useWindowDimensions,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';

import { COLORS, SPACING } from '../constants/theme';
import { Avatar } from './Avatar';
import { ReelViewer } from './ReelViewer';
import { formatTimeAgo } from '../utils/dateUtils';
import { useGlobalMute } from '../contexts/MuteContext';

const { width: SCREEN_WIDTH_DEFAULT } = Dimensions.get('window');

let ExpoVideoModule: any = null;
try {
  ExpoVideoModule = require('expo-video');
} catch (error) {
  console.warn('expo-video unavailable:', error);
}

const useSafeVideoPlayer = (source: string | null, setup: (player: any) => void) => {
  if (!ExpoVideoModule?.useVideoPlayer || !source) return null;
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
  isBlackBackground?: boolean;
};

const formatTime = (raw: any) => {
  if (!raw) return 'now';
  const date = new Date(raw);
  if (isNaN(date.getTime())) return 'now';
  return date.toLocaleString();
};

const parseCaption = (caption: string): { text: string; isHashtag: boolean; isMention: boolean }[] => {
  const parts = caption.split(/(#\w+|@\w+)/g);
  return parts.map((part) => ({
    text: part,
    isHashtag: part.startsWith('#'),
    isMention: part.startsWith('@'),
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
  theme = 'light',
  openCommentsOnCaptionPress = false,
  isBlackBackground = false,
}: PostFeedCardProps) => {
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const [isPausedByUser, setIsPausedByUser] = useState(false);
  const { isGloballyMuted: isMuted, toggleMute: toggleMute } = useGlobalMute();
  const [menuVisible, setMenuVisible] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mediaLoading, setMediaLoading] = useState(true);
  const [showSpinner, setShowSpinner] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [dynamicRatio, setDynamicRatio] = useState(4 / 5);
  const [isCaptionExpanded, setIsCaptionExpanded] = useState(false);

  const rawMediaUrl =
    post?.media_url ||
    post?.mediaUrl ||
    post?.image_url ||
    post?.imageUrl ||
    post?.image ||
    post?.thumbnail_url ||
    post?.thumbnailUrl;

  const mediaUrl = rawMediaUrl ? String(rawMediaUrl) : '';

  const rawMediaType =
    post?.media_type ||
    post?.mediaType ||
    post?.type;

  const mediaType = rawMediaType ? String(rawMediaType).toLowerCase() : '';

  const isVideo = mediaType.startsWith('video') || /\.(mp4|mov|m4v|webm)(\?|$)/i.test(mediaUrl);

  const w = Number(post?.media_width);
  const h = Number(post?.media_height);
  const initialRawRatio = (w && h) ? (w / h) : null;

  const displayRatio = dynamicRatio < 1 ? dynamicRatio : Math.max(4 / 5, dynamicRatio);
  const feedHeight = SCREEN_WIDTH / displayRatio;

  const isFocused = useIsFocused();
  const shouldPlay = isFocused && isActive && !isPausedByUser;
  const videoRef = useRef<any>(null);

  const playerSource = (Platform.OS === 'web' || !isVideo) ? null : mediaUrl;
  const player = useSafeVideoPlayer(playerSource, (p) => {
    if (p) {
      p.loop = true;
      p.muted = isMuted;
      if (Platform.OS !== 'web') {
        p.bufferOptions = {
          preferredForwardBufferDuration: 20, // Pre-load 20 seconds ahead
          waitsToMinimizeStalling: true,
          minBufferForPlayback: 5, // Wait for 5s of buffer before starting
          maxBufferBytes: 20 * 1024 * 1024, // Use more memory for smoother reels
        };
      }
    }
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
    let timer: any;
    if (mediaLoading) {
      // Shorter delay to make it responsive but avoid flickering
      timer = setTimeout(() => setShowSpinner(true), 400);
    } else {
      setShowSpinner(false);
    }
    return () => clearTimeout(timer);
  }, [mediaLoading]);

  useEffect(() => {
    if (Platform.OS === 'web') {
      if (videoRef.current) {
        if (shouldPlay) {
          videoRef.current.play().catch((e: any) => {
            console.warn('[PostFeedCard] Web Video Play Error:', e);
          });
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

  const likedByMe = !!post?.liked_by_me;

  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const swipeDetected = useRef<boolean>(false);
  const lastTapRef = useRef<number>(0);

  const heartScale = useRef(new Animated.Value(0)).current;
  const heartOpacity = useRef(new Animated.Value(0)).current;

  const animateHeart = () => {
    heartScale.setValue(0.3);
    heartOpacity.setValue(0);

    Animated.sequence([
      Animated.parallel([
        Animated.spring(heartScale, {
          toValue: 1.2,
          friction: 3,
          useNativeDriver: true,
        }),
        Animated.timing(heartOpacity, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(400),
      Animated.parallel([
        Animated.timing(heartScale, {
          toValue: 1.5,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(heartOpacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  };

  const handleDoubleTapLike = () => {
    animateHeart();
    if (!likedByMe) {
      onLike?.(post);
    }
  };

  const handleTouchStart = (e: any) => {
    touchStartX.current = e.nativeEvent.pageX;
    touchStartY.current = e.nativeEvent.pageY;
    swipeDetected.current = false;
  };

  const handleTouchEnd = (e: any) => {
    const deltaX = e.nativeEvent.pageX - touchStartX.current;
    const deltaY = e.nativeEvent.pageY - touchStartY.current;

    // Detect swipe (horizontal drag in either direction)
    if (Math.abs(deltaX) > 60 && Math.abs(deltaY) < 30) {
      swipeDetected.current = true;
      setIsFullscreen(true);
    }
  };

  const handleMediaPress = () => {
    if (swipeDetected.current) return;

    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      lastTapRef.current = 0;
      handleDoubleTapLike();
    } else {
      lastTapRef.current = now;
      if (isVideo) {
        setTimeout(() => {
          if (Date.now() - lastTapRef.current >= DOUBLE_TAP_DELAY && lastTapRef.current !== 0) {
            setIsPausedByUser((prev) => !prev);
          }
        }, DOUBLE_TAP_DELAY);
      }
    }
  };
  const likesCount = Number(post?.likes_count || 0);
  const commentsCount = Number(post?.comments_count || 0);
  const viewsCount = Number(post?.views_count || 0);
  const topComments = Array.isArray(post?.top_comments) ? post.top_comments.slice(0, 5) : [];
  const captionText = String(post?.caption || '').trim();
  const captionWords = captionText.split(/\s+/).filter(Boolean);
  const collapsedCaption = captionWords.slice(0, 4).join(' ') + (captionWords.length > 4 ? '...' : '');
  const isLongCaption = captionWords.length > 4;
  const captionSegments = captionText ? parseCaption(captionText) : [];
  const router = useRouter();
  const postedAt = post?.created_at || post?.createdAt || post?.createdAtUtc || post?.created_at || null;
  const postTimeText = formatTimeAgo(postedAt);

  const handleMentionPress = useCallback(async (username: string) => {
    try {
      const { searchUserBySLId } = await import('../services/api');
      const res = await searchUserBySLId(username);
      const user = res.data;
      if (user?.id) router.push(`/profile/${user.id}`);
    } catch { }
  }, [router]);

  return (
    <View style={[styles.card, isBlackBackground && { backgroundColor: '#000' }]} onLayout={onLayout}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.userPressWrap} onPress={() => onUserPress?.(post)} activeOpacity={0.8}>
          <Avatar name={post?.username || 'User'} photo={post?.user_photo} size={34} />
          <View style={styles.userMeta}>
            <Text style={[styles.username, theme === 'light' ? styles.usernameLight : { color: '#FFF' }]}>{post?.username || 'User'}</Text>
            <Text style={[styles.timeText, theme === 'light' ? styles.timeTextLight : {}]}>{postTimeText}</Text>
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
      <View style={[styles.mediaWrap, { width: SCREEN_WIDTH, height: feedHeight, backgroundColor: theme === 'light' ? '#F5F5F5' : '#111' }]}>
        {/* Blurred Poster Background for smooth transition */}
        {(post?.thumbnail_url || post?.metadata?.thumbnail_url) && mediaLoading && (
          <Image
            source={{ uri: post?.thumbnail_url || post?.metadata?.thumbnail_url }}
            style={[StyleSheet.absoluteFill, { opacity: 0.6 }]}
            contentFit="cover"
            blurRadius={20}
          />
        )}

        {mediaUrl ? (
          isVideo ? (
            <View style={styles.videoContainer}>
              {Platform.OS === 'web' ? (
                <>
                  <video
                    ref={videoRef as any}
                    src={mediaUrl}
                    loop
                    muted={isMuted}
                    autoPlay={isActive && !isPausedByUser}
                    playsInline
                    crossOrigin="anonymous"
                    onLoadedData={() => setMediaLoading(false)}
                    onWaiting={() => {
                      // Only show loader if we haven't started playing or if it stays stuck
                      if (videoRef.current && videoRef.current.currentTime === 0) {
                        setMediaLoading(true);
                      }
                    }}
                    onPlaying={() => setMediaLoading(false)}
                    onLoadedMetadata={(e) => {
                      if (!initialRawRatio) {
                        const target = e.target as HTMLVideoElement;
                        const ratio = target.videoWidth / target.videoHeight;
                        if (ratio && !isNaN(ratio)) setDynamicRatio(ratio);
                      }
                    }}
                    onError={(e) => {
                      setMediaLoading(false);
                      setMediaError('Video failed to load');
                      console.warn('[PostFeedCard] Web Video Load Error:', e);
                    }}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    poster={post?.thumbnail_url || post?.metadata?.thumbnail_url || ''}
                  />
                  {mediaLoading && (
                    <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.1)' }]}>
                      <ActivityIndicator color={theme === 'light' ? '#FF8F00' : '#FFD26C'} />
                    </View>
                  )}
                </>
              ) : ExpoVideoModule?.VideoView && player ? (
                <ExpoVideoModule.VideoView
                  player={player}
                  style={styles.videoBackground}
                  contentFit="cover"
                  nativeControls={false}
                  onFirstFrameRender={() => setMediaLoading(false)}
                  onError={(e: any) => {
                    setMediaLoading(false);
                    setMediaError('Video player error');
                  }}
                />
              ) : (
                <View style={[styles.videoBackground, { backgroundColor: '#111', justifyContent: 'center', alignItems: 'center' }]}>
                  <Ionicons name="alert-circle-outline" size={32} color="#444" />
                  <Text style={{ color: '#666', fontSize: 10, marginTop: 8 }}>Player unavailable</Text>
                </View>
              )}
              <Pressable
                style={styles.videoOverlay}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                onPress={handleMediaPress}
              />
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
            <Pressable
              style={styles.media}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              onPress={handleMediaPress}
            >
              <Image
                source={{ uri: mediaUrl }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                transition={300}
                onLoadStart={() => setMediaLoading(true)}
                onLoad={(e) => {
                  setMediaLoading(false);
                  if (!initialRawRatio) {
                    const { width, height } = e.source;
                    if (width && height) {
                      setDynamicRatio(width / height);
                    }
                  }
                }}
                onError={(e) => {
                  setMediaLoading(false);
                  setMediaError('Failed to load image');
                  console.warn('[PostFeedCard] Image Load Error:', e, 'URL:', mediaUrl);
                }}
              />
            </Pressable>
          )
        ) : (
          <View style={[styles.media, { backgroundColor: theme === 'light' ? '#FAFAFA' : '#1A1A1A', justifyContent: 'center', alignItems: 'center' }]}>
            <Ionicons name="image-outline" size={40} color="rgba(0,0,0,0.05)" />
            <Text style={{ color: '#888', fontSize: 12, marginTop: 8 }}>Content removed or missing</Text>
          </View>
        )}

        {mediaError && (
          <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.8)' }]}>
            <Ionicons name="alert-circle" size={40} color="#FF5252" />
            <Text style={{ color: '#FFF', marginTop: 10, fontSize: 13, fontWeight: '700' }}>{mediaError}</Text>
            <TouchableOpacity
              style={{ marginTop: 15, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)' }}
              onPress={() => { setMediaError(null); setMediaLoading(true); }}
            >
              <Text style={{ color: '#FFF', fontSize: 12, fontWeight: '900' }}>RETRY</Text>
            </TouchableOpacity>
          </View>
        )}

        {showSpinner && !mediaError && (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.1)', justifyContent: 'center', alignItems: 'center' }]}>
            <ActivityIndicator color="#FFD26C" size="large" />
          </View>
        )}

        {mediaError && (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' }]}>
            <Ionicons name="alert-circle-outline" size={32} color="#FF4500" />
            <Text style={{ color: '#FF4500', fontSize: 12, marginTop: 4 }}>{mediaError}</Text>
          </View>
        )}

        {/* Animated Heart Overlay */}
        <Animated.View
          style={[
            styles.heartOverlay,
            {
              transform: [{ scale: heartScale }],
              opacity: heartOpacity,
            },
          ]}
          pointerEvents="none"
        >
          <Ionicons name="heart" size={100} color="#FFF" style={styles.heartShadow} />
        </Animated.View>
      </View>

      {/* Actions */}
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => onLike?.(post)}>
          <Ionicons name={likedByMe ? 'heart' : 'heart-outline'} size={26} color={likedByMe ? COLORS.primary : (theme === 'light' ? '#000' : '#FFFFFF')} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => onComment?.(post)}>
          <Ionicons name="chatbubble-outline" size={24} color={theme === 'light' ? '#000' : '#FFFFFF'} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => onShare?.(post)}>
          <Ionicons name="paper-plane-outline" size={24} color={theme === 'light' ? '#000' : '#FFFFFF'} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => onRepost?.(post)}>
          <Ionicons name="repeat-outline" size={26} color={theme === 'light' ? '#000' : '#FFFFFF'} />
        </TouchableOpacity>
      </View>

      {/* Stats Summary */}
      <View style={{ paddingHorizontal: SPACING.md, paddingBottom: 2 }}>
        <Text style={{
          color: theme === 'light' ? '#000' : '#FFF',
          fontWeight: '900',
          fontSize: 14
        }}>
          {likesCount > 0 ? `${likesCount.toLocaleString()} ${likesCount === 1 ? 'like' : 'likes'}` : 'Be the first to like'}
        </Text>
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
            <Text style={[styles.captionText, theme === 'light' ? styles.captionTextLight : { color: '#FFF' }]} numberOfLines={isCaptionExpanded ? undefined : 1} ellipsizeMode="tail">
              <Text style={{ fontWeight: '900', color: theme === 'light' ? '#000' : '#FFF' }}>{post?.username || 'User'} </Text>
              {isCaptionExpanded ? captionSegments.map((seg, idx) =>
                seg.isHashtag ? (
                  <Text key={idx} style={{ color: COLORS.primary, fontWeight: '800' }} onPress={() => onHashtagPress?.(seg.text.replace('#', ''))}>
                    {seg.text}
                  </Text>
                ) : seg.isMention ? (
                  <Text key={idx} style={{ color: '#8C36DB', fontWeight: '800' }} onPress={() => handleMentionPress(seg.text.slice(1))}>
                    {seg.text}
                  </Text>
                ) : (
                  <Text key={idx} style={{ color: theme === 'light' ? '#222' : '#EEE', fontWeight: '700' }}>{seg.text}</Text>
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
        <Text style={{ color: theme === 'light' ? '#666' : 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '700' }}>
          {commentsCount > 0 ? `View all ${commentsCount} comments` : 'Add a comment...'}
        </Text>
      </TouchableOpacity>

      {topComments.length > 0 && (
        <View style={styles.topCommentsWrap}>
          {topComments.map((comment: any, index: number) => (
            <Text key={comment.id ?? index} style={styles.topCommentText} numberOfLines={1}>
              <Text style={[styles.topCommentUser, theme === 'light' ? styles.topCommentUserLight : { color: '#FFF' }]}>{comment?.username || 'User'} </Text>
              <Text style={{ color: theme === 'light' ? '#444' : '#DDD', fontSize: 13, fontWeight: '600' }}>{comment?.text || ''}</Text>
            </Text>
          ))}
        </View>
      )}

      {isFullscreen && (
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
  timeText: { color: 'rgba(255, 255, 255, 0.85)', fontSize: 11, marginTop: 2, fontWeight: '800' },
  timeTextLight: { color: '#666', fontSize: 11, marginTop: 2, fontWeight: '700' },
  menuBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  menuWrap: { position: 'relative', zIndex: 1000, elevation: 12 },
  dropdownMenu: { position: 'absolute', right: 0, top: 36, minWidth: 140, backgroundColor: '#FFF', borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 10, elevation: 20, zIndex: 1001, overflow: 'hidden' },
  dropdownItem: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm },
  dropdownText: { color: '#000000', fontSize: 13, fontWeight: '700' },
  dropdownDangerText: { color: COLORS.error },
  mediaWrap: { backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  videoContainer: { width: '100%', height: '100%', position: 'relative' },
  videoBackground: { width: '100%', height: '100%' },
  videoOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 },
  muteToggle: { position: 'absolute', top: 12, right: 12, zIndex: 10000, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  media: { width: '100%', height: '100%' },
  captionText: { color: '#FFFFFF', fontSize: 14, lineHeight: 19, fontWeight: '800' },
  captionTextLight: { color: '#111111' },
  topCommentsWrap: { paddingHorizontal: SPACING.md, paddingBottom: SPACING.lg },
  topCommentText: { marginBottom: 4 },
  topCommentUser: { color: '#000000', fontWeight: '900', fontSize: 13 },
  topCommentUserLight: { color: '#000' },
  actionRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm },
  actionBtn: { flexDirection: 'row', alignItems: 'center', marginRight: SPACING.lg },
  actionText: { color: '#FFFFFF', marginLeft: 6, fontSize: 12, fontWeight: '800' },
  actionTextLight: { color: '#333333' },
  actionTextActive: { color: COLORS.primary },
  viewsText: { color: 'rgba(255,255,255,0.95)', fontSize: 12, paddingHorizontal: SPACING.md, paddingBottom: 4, fontWeight: '800' },
  heartOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -50,
    marginLeft: -50,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99999,
  },
  heartShadow: {
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 6,
  },
});

export default PostFeedCard;