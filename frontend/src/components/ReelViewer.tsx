import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  ScrollView,
  Dimensions,
  FlatList,
  Modal,
  TouchableOpacity,
  Pressable,
  Text,
  Platform,
  Image,
  ActivityIndicator,
  StyleSheet,
  Animated,
  PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { COLORS } from '../constants/theme';
import { Avatar } from './Avatar';
import api from '../services/api';
import { useGlobalMute } from '../contexts/MuteContext';
import { useRouter } from 'expo-router';

let ExpoVideoModule: any = null;
try {
  ExpoVideoModule = require('expo-video');
} catch (error) {
  console.warn('expo-video unavailable:', error);
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const timeAgo = (date: any): string => {
  if (!date) return '';
  const now = Date.now();
  const then = new Date(date).getTime();
  if (isNaN(then)) return '';
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
  if (diff < 31536000) return `${Math.floor(diff / 2592000)}w ago`;
  return `${Math.floor(diff / 31536000)}y ago`;
};

const useSafeVideoPlayer = (source: string | null, setup: (player: any) => void) => {
  if (!ExpoVideoModule?.useVideoPlayer) return null;
  return ExpoVideoModule.useVideoPlayer(source, setup);
};

const SPEEDS = [1, 1.5, 2, 0.5];
const SEEK_STEP = 10;

const formatTime = (seconds: number): string => {
  if (!seconds || !isFinite(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const ReelVideoItem = React.memo(({
  post,
  isActive,
  onClose,
  onLike,
  onComment,
  onShare,
  isMuted,
  toggleMute,
  screenSize,
}: any) => {
  const [showPlayPause, setShowPlayPause] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isCaptionExpanded, setIsCaptionExpanded] = useState(false);
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const playPauseAnim = useRef(new Animated.Value(0)).current;
  const [localPost, setLocalPost] = useState(post);
  const videoRef = useRef<any>(null);
  const captionText = String(localPost?.caption || '');
  const captionWords = captionText.trim().split(/\s+/).filter(Boolean);
  const isLongCaption = captionWords.length > 4 || captionText.length > 45;
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showSpeedBadge, setShowSpeedBadge] = useState(false);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const seekingRef = useRef<'left' | 'right' | null>(null);
  const seekIntervalRef = useRef<any>(null);
  const timeIntervalRef = useRef<any>(null);
  const durationRef = useRef(0);

  useEffect(() => {
    if (!isActive) setIsPaused(false);
  }, [isActive]);

  const mediaUrl = String(localPost?.media_url || localPost?.mediaUrl || '');
  const mediaType = String(localPost?.media_type || localPost?.mediaType || '').toLowerCase();
  const isVideo = mediaType.startsWith('video') || /\.(mp4|mov|m4v|webm)(\?|$)/i.test(mediaUrl);
  const mediaWidth = Number(localPost?.media_width || localPost?.mediaWidth || 0);
  const mediaHeight = Number(localPost?.media_height || localPost?.mediaHeight || 0);
  const isPortrait = mediaHeight > mediaWidth;
  const contentFitMode = isVideo ? (isPortrait ? 'cover' : 'contain') : 'contain';

  const playerSource = (Platform.OS === 'web' || !isVideo) ? null : mediaUrl;
  const player = useSafeVideoPlayer(playerSource, (p) => {
    p.loop = true;
    p.muted = isMuted;
    p.staysActiveInBackground = true;
    if (Platform.OS !== 'web') {
      p.bufferOptions = {
        preferredForwardBufferDuration: 5,
        waitsToMinimizeStalling: true,
        minBufferForPlayback: 3,
        maxBufferBytes: 5 * 1024 * 1024,
        prioritizeTimeOverSizeThreshold: false,
      };
    }
  });

  useEffect(() => {
    setIsVideoLoading(isVideo);
  }, [mediaUrl, isVideo]);

  useEffect(() => {
    if (Platform.OS === 'web') {
      if (videoRef.current) {
        if (isActive && !isPaused) {
          videoRef.current.playbackRate = playbackSpeed;
          videoRef.current.play().catch(() => { });
        } else {
          videoRef.current.pause();
        }
      }
    } else if (player) {
      player.playbackRate = playbackSpeed;
      if (isActive && !isPaused) {
        player.play();
      } else {
        player.pause();
      }
    }
  }, [isActive, isPaused, player, playbackSpeed]);

  useEffect(() => {
    if (player) player.muted = isMuted;
  }, [isMuted, player]);

  useEffect(() => {
    if (!player || !isActive || !isVideo) return;
    const dur = player.duration || player.currentTime || 120;
    if (dur > 0) {
      setDuration(dur);
      durationRef.current = dur;
    }
    timeIntervalRef.current = setInterval(() => {
      if (player && !seekingRef.current) {
        const ct = player.currentTime || 0;
        setCurrentTime(ct);
        const pd = player.duration || durationRef.current;
        if (pd > 0 && pd !== durationRef.current) {
          durationRef.current = pd;
          setDuration(pd);
        }
      }
    }, 200);
    return () => {
      if (timeIntervalRef.current) clearInterval(timeIntervalRef.current);
    };
  }, [player, isActive, isVideo]);

  const cycleSpeed = () => {
    const idx = SPEEDS.indexOf(playbackSpeed);
    const next = SPEEDS[(idx + 1) % SPEEDS.length];
    setPlaybackSpeed(next);
    setShowSpeedBadge(true);
    setTimeout(() => setShowSpeedBadge(false), 1200);
  };

  const startSeek = (direction: 'left' | 'right') => {
    if (!player) return;
    seekingRef.current = direction;
    setIsPaused(true);
    const step = direction === 'left' ? -SEEK_STEP : SEEK_STEP;
    player.currentTime = Math.max(0, Math.min((player.currentTime || 0) + step, player.duration || Infinity));
    setCurrentTime(player.currentTime || 0);
    seekIntervalRef.current = setInterval(() => {
      if (player && seekingRef.current) {
        player.currentTime = Math.max(0, Math.min((player.currentTime || 0) + step, player.duration || Infinity));
        setCurrentTime(player.currentTime || 0);
      }
    }, 300);
  };

  const stopSeek = () => {
    seekingRef.current = null;
    if (seekIntervalRef.current) {
      clearInterval(seekIntervalRef.current);
      seekIntervalRef.current = null;
    }
    setIsPaused(false);
  };

  const seekBarRef = useRef<any>(null);

  const seekPlayerRef = useRef<(pageX: number) => void>(() => {});

  seekPlayerRef.current = (pageX: number) => {
    if (!player) return;
    const dur = duration || durationRef.current || player.duration || 0;
    if (!dur) return;
    const barWidth = screenSize.width - 32;
    const x = Math.max(0, Math.min(pageX - 16, barWidth));
    const ratio = x / barWidth;
    player.currentTime = ratio * dur;
    setCurrentTime(player.currentTime || 0);
  };

  const seekBarPan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (evt) => {
      setIsScrubbing(true);
      seekPlayerRef.current(evt.nativeEvent.pageX);
    },
    onPanResponderMove: (evt) => {
      setIsScrubbing(true);
      seekPlayerRef.current(evt.nativeEvent.pageX);
    },
    onPanResponderRelease: () => setIsScrubbing(false),
    onPanResponderTerminate: () => setIsScrubbing(false),
  })).current;

  const handleTapVideo = () => {
    setIsPaused((prev: boolean) => !prev);
    setShowPlayPause(true);
    playPauseAnim.setValue(0.8);
    Animated.sequence([
      Animated.spring(playPauseAnim, { toValue: 1, useNativeDriver: true, friction: 4 }),
      Animated.timing(playPauseAnim, { toValue: 0, duration: 600, delay: 200, useNativeDriver: true }),
    ]).start(() => setShowPlayPause(false));
  };

  const handleLike = () => {
    onLike?.(localPost);
    setLocalPost((prev: any) => ({
      ...prev,
      liked_by_me: !prev.liked_by_me,
      likes_count: prev.liked_by_me ? Math.max(0, Number(prev.likes_count) - 1) : Number(prev.likes_count) + 1
    }));
  };

  const handleComment = () => {
    onClose?.();
    setTimeout(() => onComment?.(localPost), 150);
  };

  const handleShare = () => {
    onClose();
    setTimeout(() => onShare?.(localPost), 300);
  };

  const likedByMe = !!localPost?.liked_by_me;
  const likesCount = Number(localPost?.likes_count || 0);
  const commentsCount = Number(localPost?.comments_count || 0);

  return (
    <View style={{ width: screenSize.width, height: screenSize.height, backgroundColor: '#000', overflow: 'hidden' }}>
      {/* Full Screen Video/Photo */}
      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        <View style={[StyleSheet.absoluteFill, { zIndex: 1 }]} pointerEvents="none">
          {!isVideo ? (
            <Image
              source={{ uri: mediaUrl }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
          ) : Platform.OS === 'web' ? (
            <video
              ref={videoRef}
              src={mediaUrl}
              preload="auto"
              loop
              muted={isMuted}
              playsInline
              autoPlay={isActive && !isPaused}
              onLoadStart={() => setIsVideoLoading(true)}
              onLoadedData={() => setIsVideoLoading(false)}
              style={{ width: '100%', height: '100%', objectFit: contentFitMode }}
            />
          ) : ExpoVideoModule?.VideoView && player ? (
            <ExpoVideoModule.VideoView
              player={player}
              style={{ width: '100%', height: '100%' }}
              contentFit={contentFitMode}
              allowsPictureInPicture={false}
              nativeControls={false}
              useExoShutter={false}
              playsInline={true}
              onFirstFrameRender={() => setIsVideoLoading(false)}
            />
          ) : (
            <View style={{ width: '100%', height: '100%', backgroundColor: '#000' }} />
          )}
        </View>

        {/* Left side - hold to rewind */}
        {isVideo && (
          <Pressable
            onPress={handleTapVideo}
            onLongPress={() => startSeek('left')}
            onPressOut={stopSeek}
            style={{ position: 'absolute', top: 0, left: 0, width: '35%', bottom: 0, zIndex: 2 }}
          />
        )}
        {/* Right side - hold to fast forward */}
        {isVideo && (
          <Pressable
            onPress={handleTapVideo}
            onLongPress={() => startSeek('right')}
            onPressOut={stopSeek}
            style={{ position: 'absolute', top: 0, right: 0, width: '35%', bottom: 0, zIndex: 2 }}
          />
        )}
        {/* Center tap area for pause/play */}
        {isVideo && (
          <Pressable
            onPress={handleTapVideo}
            style={{ position: 'absolute', top: 0, left: '35%', width: '30%', bottom: 0, zIndex: 2 }}
          />
        )}
      </View>

      {isVideo && isVideoLoading && (
        <View style={{
          ...StyleSheet.absoluteFillObject,
          zIndex: 15,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(0,0,0,0.35)',
        }}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={{ color: '#fff', marginTop: 12, fontSize: 14, opacity: 0.9 }}>Loading video…</Text>
        </View>
      )}

      {/* Play/Pause animation */}
      {showPlayPause && isVideo && (
        <Animated.View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            justifyContent: 'center',
            alignItems: 'center',
            transform: [{ scale: playPauseAnim }],
            opacity: playPauseAnim,
            pointerEvents: 'none',
          }}
        >
          <View style={{ width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
            <Ionicons name={isPaused ? 'play' : 'pause'} size={48} color="#FFF" />
          </View>
        </Animated.View>
      )}

      {/* Speed badge */}
      {showSpeedBadge && isVideo && (
        <View style={{
          position: 'absolute',
          top: '30%',
          alignSelf: 'center',
          zIndex: 25,
          backgroundColor: 'rgba(0,0,0,0.7)',
          paddingHorizontal: 16,
          paddingVertical: 8,
          borderRadius: 20,
        }}>
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>{playbackSpeed}x</Text>
        </View>
      )}

      {/* Seek badge - shows when holding left/right */}
      {seekingRef.current && isVideo && (
        <View style={{
          position: 'absolute',
          top: '45%',
          alignSelf: 'center',
          zIndex: 25,
          backgroundColor: 'rgba(0,0,0,0.7)',
          paddingHorizontal: 20,
          paddingVertical: 10,
          borderRadius: 12,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        }}>
          <Ionicons name={seekingRef.current === 'left' ? 'play-back' : 'play-forward'} size={22} color="#FFF" />
          <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>
            {formatTime(currentTime)} / {formatTime(duration)}
          </Text>
        </View>
      )}

      {/* Top Left - Close button */}
      <View
        pointerEvents="box-none"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 20,
          paddingTop: Platform.OS === 'ios' ? 54 : 24,
          paddingLeft: 16,
        }}
      >
        <TouchableOpacity onPress={() => onClose?.()} hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }} style={{ alignSelf: 'flex-start' }}>
          <Ionicons name="close" size={30} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Seek bar at bottom */}
      {isVideo && (
        <View
          {...seekBarPan.panHandlers}
          style={{
            position: 'absolute',
            bottom: Platform.OS === 'ios' ? 60 : 50,
            left: 16,
            right: 16,
            height: isScrubbing ? 40 : 20,
            zIndex: 20,
            justifyContent: 'flex-end',
            paddingBottom: 4,
          }}
        >
          <View style={{
            width: '100%',
            height: isScrubbing ? 6 : 2,
            backgroundColor: 'rgba(255,255,255,0.3)',
            borderRadius: 3,
            overflow: 'visible',
          }}>
            <View style={{
              width: `${duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0}%`,
              height: '100%',
              backgroundColor: '#FFF',
              borderRadius: 3,
            }} />
          </View>
          {isScrubbing && (
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginTop: 4,
            }}>
              <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 11, fontWeight: 'bold' }}>{formatTime(currentTime)}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 11, fontWeight: 'bold' }}>{duration > 0 ? formatTime(duration) : '--:--'}</Text>
            </View>
          )}
        </View>
      )}

      {/* Bottom Left - User Info + Caption */}
      <View
        pointerEvents="box-none"
        style={{
          position: 'absolute',
          bottom: Platform.OS === 'ios' ? 120 : 100,
          left: 16,
          right: 90,
          zIndex: 20,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
          <Avatar photo={localPost?.user_photo} name={localPost?.username || 'User'} size={36} />
          <Text style={{ color: '#fff', fontWeight: 'bold', marginLeft: 10, fontSize: 14 }}>
            {localPost?.username || 'User'}
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.6)', marginLeft: 8, fontSize: 12 }}>
            {timeAgo(localPost?.created_at || localPost?.timestamp || localPost?.createdAt)}
          </Text>
        </View>
        {localPost?.caption ? (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => {
              const nextExpanded = !isCaptionExpanded;
              setIsCaptionExpanded(nextExpanded);
              if (nextExpanded) {
                setTimeout(() => onComment?.(localPost), 150);
              }
            }}
            style={{
              borderRadius: 14,
              backgroundColor: 'transparent',
              padding: 0,
              maxHeight: isCaptionExpanded ? 220 : 50,
              overflow: 'hidden',
            }}
          >
            <Text
              style={{
                color: '#fff',
                fontSize: 14,
                lineHeight: 20,
                textShadowColor: 'rgba(0, 0, 0, 0.8)',
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 3,
              }}
              numberOfLines={isCaptionExpanded ? undefined : 1}
              ellipsizeMode="tail"
            >
              {captionText}
            </Text>
            {isLongCaption ? (
              <View style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ color: '#ccc', fontSize: 13, fontWeight: '600' }}>
                  {isCaptionExpanded ? 'Show less' : 'More'}
                </Text>
              </View>
            ) : null}
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Right Side - Action Buttons + Speed */}
      <View pointerEvents="box-none" style={{
        position: 'absolute',
        bottom: Platform.OS === 'ios' ? 120 : 100,
        right: 12,
        alignItems: 'center',
        zIndex: 20,
      }}>
        {/* Speed control */}
        {isVideo && (
          <TouchableOpacity
            style={{
              alignItems: 'center',
              marginBottom: 18,
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 12,
              backgroundColor: 'rgba(255,255,255,0.2)',
            }}
            onPress={cycleSpeed}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          >
            <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>{playbackSpeed}x</Text>
          </TouchableOpacity>
        )}

        {/* Volume toggle */}
        <TouchableOpacity
          style={{
            alignItems: 'center',
            marginBottom: 18,
            padding: 10,
            borderRadius: 30,
            backgroundColor: 'rgba(0,0,0,0.4)',
          }}
          onPress={toggleMute}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
        >
          <Ionicons name={isMuted ? 'volume-mute' : 'volume-medium'} size={28} color="#FFF" />
        </TouchableOpacity>

        {/* Like */}
        <TouchableOpacity style={{ alignItems: 'center', marginBottom: 20 }} onPress={handleLike}>
          <Ionicons
            name={likedByMe ? 'heart' : 'heart-outline'}
            size={32}
            color={likedByMe ? '#FF2D55' : '#FFF'}
          />
          <Text style={{ color: '#fff', marginTop: 4, fontSize: 12, fontWeight: '600' }}>
            {likesCount > 0 ? likesCount : ''}
          </Text>
        </TouchableOpacity>

        {/* Comment */}
        <TouchableOpacity style={{ alignItems: 'center', marginBottom: 20 }} onPress={handleComment}>
          <Ionicons name="chatbubble" size={30} color="#FFF" />
          <Text style={{ color: '#fff', marginTop: 4, fontSize: 12, fontWeight: '600' }}>
            {commentsCount > 0 ? commentsCount : ''}
          </Text>
        </TouchableOpacity>

        {/* Share */}
        <TouchableOpacity style={{ alignItems: 'center', marginBottom: 20 }} onPress={handleShare}>
          <Ionicons name="paper-plane" size={30} color="#FFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
});

export const ReelViewer = ({ isVisible, initialPost, onClose, onLike, onComment, onShare }: any) => {
  const router = useRouter();
  const [videos, setVideos] = useState<any[]>([initialPost]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(1);
  const [screenSize, setScreenSize] = useState({ width: SCREEN_WIDTH, height: SCREEN_HEIGHT });
  const flatListRef = useRef<FlatList<any>>(null);
  const loadingRef = useRef(false);
  const hasMoreRef = useRef(true);
  const offsetRef = useRef(1);
  const videosRef = useRef<any[]>([]);
  const activeIndexRef = useRef(0);
  const { isGloballyMuted: isMuted, toggleMute } = useGlobalMute();
  const callbacksRef = useRef({ onClose, onLike, onComment, onShare });
  const loadMoreRef = useRef<() => void>(() => { });
  const swipeTranslateX = useRef(new Animated.Value(0)).current;
  const swipeStartX = useRef(0);

  const swipePan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => {
        if (Math.abs(g.dx) > Math.abs(g.dy) * 2) return true;
        return false;
      },
      onPanResponderGrant: () => {
        swipeStartX.current = 0;
        swipeTranslateX.setOffset(0);
        swipeTranslateX.setValue(0);
      },
      onPanResponderMove: (_, g) => {
        swipeTranslateX.setValue(g.dx);
      },
      onPanResponderRelease: (_, g) => {
        swipeTranslateX.flattenOffset();
        if (g.dx > SCREEN_WIDTH * 0.3) {
          Animated.timing(swipeTranslateX, {
            toValue: SCREEN_WIDTH,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            callbacksRef.current.onClose?.();
          });
        } else if (g.dx < -SCREEN_WIDTH * 0.3) {
          Animated.timing(swipeTranslateX, {
            toValue: -SCREEN_WIDTH,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            swipeTranslateX.setValue(0);
            if (callbacksRef.current.onClose) callbacksRef.current.onClose();
            router.push('/(tabs)/messages');
          });
        } else {
          Animated.spring(swipeTranslateX, {
            toValue: 0,
            useNativeDriver: true,
            friction: 7,
          }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    const handler = ({ window }: { window: { width: number; height: number } }) => {
      setScreenSize({ width: window.width, height: window.height });
    };
    const subscription = Dimensions.addEventListener?.('change', handler);
    return () => subscription?.remove?.();
  }, []);

  useEffect(() => {
    const handler = ({ window }: { window: { width: number; height: number } }) => {
      setScreenSize({ width: window.width, height: window.height });
    };
    const subscription = Dimensions.addEventListener?.('change', handler);
    return () => subscription?.remove?.();
  }, []);

  loadingRef.current = loading;
  hasMoreRef.current = hasMore;
  offsetRef.current = offset;
  videosRef.current = videos;
  activeIndexRef.current = activeIndex;
  callbacksRef.current = { onClose, onLike, onComment, onShare };

  const loadMoreReels = useCallback(async () => {
    if (loadingRef.current || !hasMoreRef.current) return;

    setLoading(true);
    try {
      const res = await api.get('/posts/feed', {
        params: { limit: 10, offset: offsetRef.current },
        timeout: 60000,
      });
      const newPosts = res.data?.items || res.data || [];

      if (newPosts.length === 0) {
        setHasMore(false);
      } else {
        setVideos(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const uniqueNew = newPosts.filter((p: any) => !existingIds.has(p.id));
          return [...prev, ...uniqueNew];
        });
        setOffset(prev => prev + newPosts.length);
      }
    } catch (error: any) {
      if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
        console.warn('Load more reels timed out — retrying later');
        setHasMore(false);
      } else {
        console.error('Load more reels error:', error);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  loadMoreRef.current = loadMoreReels;

  useEffect(() => {
    if (isVisible) {
      setVideos([initialPost]);
      setActiveIndex(0);
      setOffset(1);
      setHasMore(true);
      setLoading(false);
      loadingRef.current = false;
      hasMoreRef.current = true;
      offsetRef.current = 1;
      setTimeout(() => loadMoreReels(), 300);
    }
  }, [isVisible, initialPost, loadMoreReels]);

  const viewabilityConfigRef = useRef({ itemVisiblePercentThreshold: 50 });

  const handleViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      const index = viewableItems[0].index;
      setActiveIndex(index);
      if (index >= videosRef.current.length - 2 && hasMoreRef.current && !loadingRef.current) {
        loadMoreRef.current();
      }
    }
  }).current;

  const handleMomentumScrollEnd = useRef((event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / Dimensions.get('window').height);
    if (index !== activeIndexRef.current) {
      setActiveIndex(index);
    }
    if (index >= videosRef.current.length - 2 && hasMoreRef.current && !loadingRef.current) {
      loadMoreRef.current();
    }
  }).current;

  useEffect(() => {
    const nextPost = videos[activeIndex + 1];
    if (!nextPost) return;
    const nextUrl = String(nextPost?.media_url || nextPost?.mediaUrl || '');
    const isNextVideo = /\.(mp4|mov|m4v|webm)(\?|$)/i.test(nextUrl);
    if (isNextVideo && nextUrl) {
      fetch(nextUrl, { method: 'HEAD' }).catch(() => { });
    }
  }, [activeIndex, videos]);

  const getItemLayout = (_: any, index: number) => ({
    length: screenSize.height,
    offset: screenSize.height * index,
    index,
  });

  const renderItem = useCallback(({ item, index }: { item: any; index: number }) => (
    <ReelVideoItem
      post={item}
      isActive={index === activeIndex}
      onClose={callbacksRef.current.onClose}
      onLike={callbacksRef.current.onLike}
      onComment={callbacksRef.current.onComment}
      onShare={callbacksRef.current.onShare}
      isMuted={isMuted}
      toggleMute={toggleMute}
      screenSize={screenSize}
    />
  ), [activeIndex, isMuted, screenSize]);

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => { callbacksRef.current.onClose?.(); }}
    >
      <View style={{ flex: 1 }}>
        <Animated.View
          style={{ flex: 1, backgroundColor: '#000', transform: [{ translateX: swipeTranslateX }] }}
          {...swipePan.panHandlers}
        >
        <FlatList
          ref={flatListRef}
          data={videos}
          renderItem={renderItem}
          extraData={{ activeIndex, isMuted }}
          keyExtractor={(item, index) => `${item.id || index}`}
          pagingEnabled={true}
          showsVerticalScrollIndicator={false}
          onMomentumScrollEnd={handleMomentumScrollEnd}
          onViewableItemsChanged={handleViewableItemsChanged}
          viewabilityConfig={viewabilityConfigRef.current}
          getItemLayout={getItemLayout}
          initialNumToRender={2}
          maxToRenderPerBatch={3}
          windowSize={3}
          removeClippedSubviews={true}
          snapToInterval={screenSize.height}
          snapToAlignment="start"
          decelerationRate="fast"
          ListFooterComponent={
            loading ? (
              <View style={{ height: 100, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={COLORS.primary} />
              </View>
            ) : null
          }
        />
        </Animated.View>
      </View>
    </Modal>
  );
};
