import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
  ActivityIndicator,
  StyleSheet,
  Animated,
  PanResponder,
  Alert,
  AppState,
  ActionSheetIOS,
  Share, KeyboardAvoidingView, Keyboard, BackHandler
} from 'react-native';
import { useTabBar } from '../contexts/TabBarContext';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ReportModal } from './ReportModal';
import {
  submitReport,
  blockUser,
  unblockUser,
} from '../services/firebase/moderationService';
import api, { reportComment, API_URL, getPostComments, addPostComment, getPostsFeed, recordWatchEvent, deletePostComment, markPostAsSeen } from '../services/api';
import { useBlockStore } from '../store/blockStore';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { COLORS } from '../constants/theme';
import { Avatar } from './Avatar';
import { useAuthStore } from '../store/authStore';
import { formatTimeAgo, formatReelDate } from '../utils/dateUtils';
import { useGlobalMute } from '../contexts/MuteContext';
import { useRouter } from 'expo-router';
import { socketService } from '../services/socket';
import SharePostModal from './SharePostModal';
import { getFilterStyle, getOverlayStyle } from '../utils/filters';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MentionInput } from './MentionInput';
import { MentionText } from './MentionText';
import * as Clipboard from 'expo-clipboard';
import { SafeVideoView, isPlayerValid, useSafeVideoPlayer } from './SafeVideoView';
import { useTranslation } from '../utils/i18n';

let ExpoVideoModule: any = null;
try {
  ExpoVideoModule = require('expo-video');
} catch (error) {
  console.warn('expo-video unavailable:', error);
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const NativeVideoPlayer = React.memo(({
  mediaUrl,
  isMuted,
  contentFitMode,
  setIsVideoLoading,
  videoPosterUrl,
  handlePosterError,
  onPlayerReady,
  onPlayerDestroy,
  isVideoLoading,
}: {
  mediaUrl: string;
  isMuted: boolean;
  contentFitMode: any;
  setIsVideoLoading: (loading: boolean) => void;
  videoPosterUrl: string;
  handlePosterError: () => void;
  onPlayerReady: (player: any) => void;
  onPlayerDestroy: () => void;
  isVideoLoading: boolean;
}) => {
  const player = useSafeVideoPlayer(mediaUrl, (p) => {
    if (p) {
      p.loop = true;
      p.muted = isMuted;
      p.staysActiveInBackground = false;
      if (Platform.OS !== 'web') {
        p.bufferOptions = {
          preferredForwardBufferDuration: 2,
          waitsToMinimizeStalling: true,
          minBufferForPlayback: 0.3,
          maxBufferBytes: 10 * 1024 * 1024,
          prioritizeTimeOverSizeThreshold: true,
        };
      }
    }
  });

  useEffect(() => {
    if (isPlayerValid(player)) {
      onPlayerReady(player);
    }
    return () => {
      onPlayerDestroy();
    };
  }, [player]);

  const fallback = <View style={{ width: '100%', height: '100%', backgroundColor: '#000' }} />;

  if (!ExpoVideoModule?.VideoView || !isPlayerValid(player)) {
    return fallback;
  }

  return (
    <>
      <SafeVideoView
        key={mediaUrl}
        player={player}
        ExpoVideoModule={ExpoVideoModule}
        style={{ width: '100%', height: '100%' }}
        contentFit={contentFitMode}
        allowsPictureInPicture={false}
        nativeControls={false}
        useExoShutter={false}
        playsInline={true}
        onFirstFrameRender={() => setIsVideoLoading(false)}
        fallback={fallback}
      />
      {isVideoLoading && videoPosterUrl && (
        <Image
          source={{ uri: videoPosterUrl }}
          style={[StyleSheet.absoluteFill, { zIndex: 2 }]}
          contentFit={contentFitMode}
          pointerEvents="none"
          onError={handlePosterError}
        />
      )}
    </>
  );
});
NativeVideoPlayer.displayName = 'NativeVideoPlayer';

const SPEEDS = [1, 1.5, 2, 0.5];
const SEEK_STEP = 10;

const formatTime = (seconds: number): string => {
  if (!seconds || !isFinite(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const ReelProgressBar = React.memo(({ player, isActive, screenSize }: any) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const durationRef = useRef(0);
  const animFrameRef = useRef<number | undefined>(undefined);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!player || !isActive || !isMountedRef.current) return;

    const updateProgress = () => {
      if (!isMountedRef.current || !player) return;
      try {
        const ct = player.currentTime || 0;
        setCurrentTime(ct);
        const pd = player.duration || durationRef.current;
        if (pd > 0 && pd !== durationRef.current) {
          durationRef.current = pd;
          setDuration(pd);
        }
        animFrameRef.current = requestAnimationFrame(updateProgress);
      } catch (e) {
        // Silent fail
      }
    };

    animFrameRef.current = requestAnimationFrame(updateProgress);
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [player, isActive]);

  const seekPlayerRef = useRef<(pageX: number) => void>(() => { });

  seekPlayerRef.current = (pageX: number) => {
    if (!player) return;
    try {
      const dur = duration || durationRef.current || player.duration || 0;
      if (!dur) return;
      const barWidth = screenSize.width - 32;
      const x = Math.max(0, Math.min(pageX - 16, barWidth));
      const ratio = x / barWidth;
      player.currentTime = ratio * dur;
      setCurrentTime(player.currentTime || 0);
    } catch (e) {
      console.warn('[ReelProgressBar] seek failed:', e);
    }
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

  return (
    <View
      {...seekBarPan.panHandlers}
      style={{
        position: 'absolute',
        bottom: Platform.OS === 'ios' ? 40 : 30,
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
  );
});
ReelProgressBar.displayName = 'ReelProgressBar';

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
  onShareLocal,
  onCommentLocal,
  autoScroll,
  onVideoEnded,
  onOpenOptions,
  shouldLoad,
  // OPT-2: appState is now received as a prop from the single parent listener
  appState,
}: any) => {
  const { t, language } = useTranslation();
  const [showPlayPause, setShowPlayPause] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isCaptionExpanded, setIsCaptionExpanded] = useState(false);
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const [showSpinner, setShowSpinner] = useState(false);
  const playPauseAnim = useRef(new Animated.Value(0)).current;
  // OPT-7: removed localPost mirror state — read directly from post prop
  const videoRef = useRef<any>(null);
  const filterName = post?.filter_name || post?.metadata?.filter_name || 'Normal';
  const captionText = String(post?.caption || '');
  const captionWords = captionText.trim().split(/\s+/).filter(Boolean);
  const isLongCaption = captionWords.length > 4 || captionText.length > 45;
  const reelPostTimeText = formatReelDate(post?.created_at || post?.createdAt || post?.createdAtUtc || null, language);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSpeedBadge, setShowSpeedBadge] = useState(false);
  const seekingRef = useRef<'left' | 'right' | null>(null);
  const seekIntervalRef = useRef<any>(null);
  const durationRef = useRef(0);
  const lastTapRef = useRef<number>(0);
  const lastTapCoords = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  interface InstagramHeartItem {
    id: string;
    x: number;
    y: number;
    rotation: string;
    scale: Animated.Value;
    opacity: Animated.Value;
    translateY: Animated.Value;
  }

  const [instagramHearts, setInstagramHearts] = useState<InstagramHeartItem[]>([]);

  // ponytail: rapid instagram double-tap pink heart pop animation
  const triggerInstagramHeart = (_tapX?: number, _tapY?: number) => {
    const id = `${Date.now()}-${Math.random()}`;
    const x = SCREEN_WIDTH / 2;
    const y = SCREEN_HEIGHT / 2;
    const rotation = `${(Math.random() - 0.5) * 30}deg`;

    const scale = new Animated.Value(0);
    const opacity = new Animated.Value(0);
    const translateY = new Animated.Value(0);

    const newHeart: InstagramHeartItem = { id, x, y, rotation, scale, opacity, translateY };
    setInstagramHearts(prev => [...prev, newHeart]);

    Animated.parallel([
      Animated.sequence([
        Animated.spring(scale, { toValue: 1.2, friction: 3, tension: 260, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1.35, duration: 180, useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 50, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 200, delay: 50, useNativeDriver: true }),
      ]),
      Animated.timing(translateY, { toValue: -95, duration: 300, useNativeDriver: true }),
    ]).start(() => {
      setInstagramHearts(prev => prev.filter(h => h.id !== id));
    });
  };

  const handleDoubleTapLike = (tapX?: number, tapY?: number) => {
    triggerInstagramHeart(tapX, tapY);
    if (!likedByMe) {
      handleLike();
    }
  };

  useEffect(() => {
    if (!isActive) setIsPaused(false);
  }, [isActive]);

  // OPT-7: read directly from post prop
  let mediaUrl = String(post?.media_url || post?.mediaUrl || '');
  if (mediaUrl.includes('.a.run.app') && mediaUrl.startsWith('http://')) {
    mediaUrl = mediaUrl.replace('http://', 'https://');
  }
  const posterUrl = String(
    post?.thumbnail_url || post?.thumbnailUrl || post?.metadata?.thumbnail_url || post?.metadata?.thumbnailUrl || ''
  );

  const [imageUri, setImageUri] = useState(mediaUrl);
  const [videoPosterUrl, setVideoPosterUrl] = useState(posterUrl);

  useEffect(() => {
    setImageUri(mediaUrl);
  }, [mediaUrl]);

  useEffect(() => {
    setVideoPosterUrl(posterUrl);
  }, [posterUrl]);

  // OPT-10: guard logs with __DEV__
  const handleImageError = (e: any) => {
    if (imageUri && imageUri.includes('b-cdn.net')) {
      const urlParts = imageUri.split('b-cdn.net/');
      if (urlParts.length > 1) {
        const filePath = urlParts[1];
        const fallbackUrl = `${API_URL}/api/bunny-media/${filePath}`;
        setImageUri(fallbackUrl);
      }
    }
  };

  const handlePosterError = () => {
    if (videoPosterUrl && videoPosterUrl.includes('b-cdn.net')) {
      const urlParts = videoPosterUrl.split('b-cdn.net/');
      if (urlParts.length > 1) {
        const filePath = urlParts[1];
        const fallbackUrl = `${API_URL}/api/bunny-media/${filePath}`;
        setVideoPosterUrl(fallbackUrl);
      }
    }
  };
  // OPT-7: read directly from post prop
  const mediaType = String(post?.media_type || post?.mediaType || '').toLowerCase();
  const isVideo = mediaType.startsWith('video') || /\.(mp4|mov|m4v|webm)(\?|$)/i.test(mediaUrl);
  const mediaWidth = Number(post?.media_width || post?.mediaWidth || 0);
  const mediaHeight = Number(post?.media_height || post?.mediaHeight || 0);
  const [aspectRatio, setAspectRatio] = useState<number | null>(
    (mediaWidth && mediaHeight && mediaHeight > 0) ? (mediaWidth / mediaHeight) : null
  );
  const isPortrait = aspectRatio ? (aspectRatio < 1) : (mediaHeight > mediaWidth);
  const contentFitMode = isVideo ? 'cover' : (isPortrait ? 'cover' : 'contain');

  const [player, setPlayer] = useState<any>(null);

  useEffect(() => {
    if (player && Platform.OS !== 'web') {
      try {
        if (isActive) {
          player.bufferOptions = {
            preferredForwardBufferDuration: 8, // Fully buffer active video
            waitsToMinimizeStalling: true,
            minBufferForPlayback: 0.1,        // Start almost instantly
            maxBufferBytes: 25 * 1024 * 1024,  // 25MB limit for full quality
            prioritizeTimeOverSizeThreshold: true,
          };
        } else {
          player.bufferOptions = {
            preferredForwardBufferDuration: 1, // Only pre-buffer 1 second of next videos
            waitsToMinimizeStalling: false,
            minBufferForPlayback: 0.8,
            maxBufferBytes: 1.5 * 1024 * 1024,  // Minimal background buffer
            prioritizeTimeOverSizeThreshold: true,
          };
        }
      } catch (err) {
        console.warn('Failed to set bufferOptions dynamically:', err);
      }
    }
  }, [player, isActive]);

  useEffect(() => {
    setIsVideoLoading(isVideo);
  }, [mediaUrl, isVideo]);

  useEffect(() => {
    let timer: any;
    if (isVideoLoading) {
      // Show thumbnail first, only show spinner if it takes more than 1s
      timer = setTimeout(() => setShowSpinner(true), 1000);
    } else {
      setShowSpinner(false);
    }
    return () => clearTimeout(timer);
  }, [isVideoLoading]);

  useEffect(() => {
    if (Platform.OS === 'web') {
      if (videoRef.current) {
        if (isActive && !isPaused && appState === 'active') {
          videoRef.current.playbackRate = playbackSpeed;
          videoRef.current.play().catch(() => { });
        } else {
          videoRef.current.pause();
        }
      }
    } else if (player) {
      try {
        player.playbackRate = playbackSpeed;
        if (isActive && !isPaused && appState === 'active') {
          player.play();
        } else {
          player.pause();
        }
      } catch (e) {
        console.warn('[ReelViewer] Playback speed / play / pause state change failed:', e);
      }
    }
  }, [isActive, isPaused, player, playbackSpeed, appState]);

  useEffect(() => {
    if (player) {
      try {
        player.muted = isMuted;
      } catch (e) {
        console.warn('[ReelViewer] Muted state change failed:', e);
      }
    }
  }, [isMuted, player]);

  // Fix 3: Clean up video player & web element on unmount or player change
  useEffect(() => {
    return () => {
      if (player) {
        try {
          player.pause();
          if (typeof player.replaceAsync === 'function') {
            player.replaceAsync(null);
          } else if (typeof player.replace === 'function') {
            player.replace(null);
          }
          if (Platform.OS !== 'web') {
            player.destroy?.();
          }
        } catch (e) { }
      }
      if (Platform.OS === 'web' && videoRef.current) {
        try {
          videoRef.current.pause();
          videoRef.current.src = '';
          videoRef.current.load();
        } catch (e) { }
      }
    };
  }, [player]);

  const prevPostIdRef = useRef(post?.id);
  useEffect(() => {
    const currentPostId = post?.id;
    if (prevPostIdRef.current !== currentPostId) {
      if (player) {
        try {
          player.pause();
          if (typeof player.replaceAsync === 'function') {
            player.replaceAsync(null);
          } else if (typeof player.replace === 'function') {
            player.replace(null);
          }
        } catch (e) { }
      }
      prevPostIdRef.current = currentPostId;
    }
  }, [post?.id, player]);

  useEffect(() => {
    if (player) {
      try {
        player.loop = !autoScroll;
      } catch (e) {
        console.warn('[ReelViewer] Loop state change failed:', e);
      }
    }
  }, [player, autoScroll]);

  useEffect(() => {
    if (!player) return;
    let subscription: any;
    try {
      subscription = player.addListener('playToEnd', () => {
        onVideoEnded?.();
      });
    } catch (e) {
      console.warn('[ReelViewer] Failed to add listener:', e);
    }
    return () => {
      if (subscription) {
        try {
          subscription.remove();
        } catch (e) {
          console.warn('[ReelViewer] Failed to remove listener:', e);
        }
      }
    };
  }, [player, onVideoEnded]);

  useEffect(() => {
    if (!player || !isActive || !isVideo) return;
    try {
      const dur = player.duration || player.currentTime || 120;
      if (dur > 0) {
        durationRef.current = dur;
      }
    } catch (e) {
      console.warn('[ReelViewer] Duration fetch failed:', e);
    }
  }, [player, isActive, isVideo]);

  const cycleSpeed = () => {
    const idx = SPEEDS.indexOf(playbackSpeed);
    const next = SPEEDS[(idx + 1) % SPEEDS.length];
    setPlaybackSpeed(next);
    setShowSpeedBadge(true);
    setTimeout(() => setShowSpeedBadge(false), 1200);
  };

  const [seekingDirection, setSeekingDirection] = useState<'left' | 'right' | null>(null);
  const [seekTime, setSeekTime] = useState(0);

  const startSeek = (direction: 'left' | 'right') => {
    if (!player) return;
    try {
      seekingRef.current = direction;
      setSeekingDirection(direction);
      setIsPaused(true);
      const step = direction === 'left' ? -SEEK_STEP : SEEK_STEP;
      player.currentTime = Math.max(0, Math.min((player.currentTime || 0) + step, player.duration || Infinity));
      setSeekTime(player.currentTime || 0);
      seekIntervalRef.current = setInterval(() => {
        if (player && seekingRef.current) {
          try {
            player.currentTime = Math.max(0, Math.min((player.currentTime || 0) + step, player.duration || Infinity));
            setSeekTime(player.currentTime || 0);
          } catch (e) {
            console.warn('[ReelViewer] seek interval step failed:', e);
          }
        }
      }, 300);
    } catch (e) {
      console.warn('[ReelViewer] startSeek failed:', e);
    }
  };

  const stopSeek = () => {
    seekingRef.current = null;
    setSeekingDirection(null);
    if (seekIntervalRef.current) {
      clearInterval(seekIntervalRef.current);
      seekIntervalRef.current = null;
    }
    setIsPaused(false);
  };

  const handleTapVideo = (e?: any) => {
    if (e?.nativeEvent?.locationX !== undefined && e?.nativeEvent?.locationY !== undefined) {
      lastTapCoords.current = {
        x: e.nativeEvent.locationX,
        y: e.nativeEvent.locationY,
      };
    }
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      lastTapRef.current = 0;
      handleDoubleTapLike(lastTapCoords.current.x, lastTapCoords.current.y);
    } else {
      lastTapRef.current = now;
      setTimeout(() => {
        if (Date.now() - lastTapRef.current >= DOUBLE_TAP_DELAY && lastTapRef.current !== 0) {
          setIsPaused((prev: boolean) => !prev);
          setShowPlayPause(true);
          playPauseAnim.setValue(0.8);
          Animated.sequence([
            Animated.spring(playPauseAnim, { toValue: 1, useNativeDriver: true, friction: 4 }),
            Animated.timing(playPauseAnim, { toValue: 0, duration: 600, delay: 200, useNativeDriver: true }),
          ]).start(() => setShowPlayPause(false));
        }
      }, DOUBLE_TAP_DELAY);
    }
  };

  // OPT-7: actions now operate on post prop directly; optimistic like state
  // is managed by the parent (ReelViewer) via onLike callback
  const handleLike = () => {
    onLike?.(post);
  };

  const handleComment = () => {
    onCommentLocal?.(post);
  };

  const handleShare = () => {
    onShareLocal?.(post);
  };

  const likedByMe = !!post?.liked_by_me;
  const likesCount = Number(post?.likes_count || 0);
  const commentsCount = Number(post?.comments_count || 0);

  return (
    <View style={{ width: screenSize.width, height: screenSize.height, backgroundColor: '#000', overflow: 'hidden' }}>
      {/* Full Screen Video/Photo */}
      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        <View style={[StyleSheet.absoluteFill, { zIndex: 1 }]} pointerEvents="none">
          {!isVideo ? (
            <Image
              source={{ uri: imageUri }}
              style={[{ width: '100%', height: '100%' }, getFilterStyle(filterName)]}
              contentFit={contentFitMode}
              transition={300}
              onLoad={(e) => {
                if (!aspectRatio) {
                  const { width, height } = e.source;
                  if (width && height) {
                    setAspectRatio(width / height);
                  }
                }
              }}
              onError={handleImageError}
            />
          ) : Platform.OS === 'web' ? (
            <>
              <video
                ref={videoRef}
                src={shouldLoad ? mediaUrl : undefined}
                preload="auto"
                loop={!autoScroll}
                muted={isMuted}
                playsInline
                autoPlay={isActive && !isPaused}
                poster={posterUrl || undefined}
                onLoadStart={() => setIsVideoLoading(true)}
                onLoadedData={() => setIsVideoLoading(false)}
                onCanPlay={() => setIsVideoLoading(false)}
                onWaiting={() => setIsVideoLoading(true)}
                onPlaying={() => setIsVideoLoading(false)}
                onEnded={onVideoEnded}
                style={{ width: '100%', height: '100%', objectFit: contentFitMode, ...getFilterStyle(filterName) }}
              />
              {isVideoLoading && videoPosterUrl && (
                <Image
                  source={{ uri: videoPosterUrl }}
                  style={StyleSheet.absoluteFill}
                  contentFit={contentFitMode}
                  pointerEvents="none"
                  onError={handlePosterError}
                />
              )}
            </>
          ) : shouldLoad ? (
            <NativeVideoPlayer
              mediaUrl={mediaUrl}
              isMuted={isMuted}
              contentFitMode={contentFitMode}
              setIsVideoLoading={setIsVideoLoading}
              videoPosterUrl={videoPosterUrl}
              handlePosterError={handlePosterError}
              onPlayerReady={setPlayer}
              onPlayerDestroy={() => setPlayer(null)}
              isVideoLoading={isVideoLoading}
            />
          ) : (
            <View style={{ width: '100%', height: '100%', backgroundColor: '#000' }}>
              {videoPosterUrl && (
                <Image
                  source={{ uri: videoPosterUrl }}
                  style={StyleSheet.absoluteFill}
                  contentFit={contentFitMode}
                  onError={handlePosterError}
                />
              )}
            </View>
          )}
          {Platform.OS !== 'web' && filterName !== 'Normal' && (
            <View style={[StyleSheet.absoluteFill, getOverlayStyle(filterName)]} pointerEvents="none" />
          )}
        </View>

        {/* Universal tap handler for images */}
        {!isVideo && (
          <Pressable
            onPress={handleTapVideo}
            style={StyleSheet.absoluteFill}
          />
        )}

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

      {isVideo && showSpinner && (
        <View style={{
          ...StyleSheet.absoluteFillObject,
          zIndex: 15,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(0,0,0,0.15)',
        }}>
          <ActivityIndicator size="large" color="#fff" />
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
            zIndex: 30,
          }}
        >
          <View style={{ width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
            <Ionicons name={isPaused ? 'play' : 'pause'} size={48} color="#FFF" />
          </View>
        </Animated.View>
      )}

      {/* Instagram Double Tap Pink Hearts */}
      {instagramHearts.map(heart => (
        <Animated.View
          key={heart.id}
          style={{
            position: 'absolute',
            left: heart.x - 45,
            top: heart.y - 45,
            width: 90,
            height: 90,
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 99999,
            transform: [
              { translateY: heart.translateY },
              { scale: heart.scale },
              { rotate: heart.rotation },
            ],
            opacity: heart.opacity,
          }}
          pointerEvents="none"
        >
          <View style={{
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: '#FF2D55',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.8,
            shadowRadius: 12,
            elevation: 10,
          }}>
            <Ionicons name="heart" size={92} color="#FFFFFF" style={{ position: 'absolute' }} />
            <Ionicons name="heart" size={82} color="#FF2D55" style={{ position: 'absolute' }} />
          </View>
        </Animated.View>
      ))}

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
      {seekingDirection && isVideo && (
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
          <Ionicons name={seekingDirection === 'left' ? 'play-back' : 'play-forward'} size={22} color="#FFF" />
          <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>
            {formatTime(seekTime)} / {formatTime(durationRef.current || (player ? player.duration : 120))}
          </Text>
        </View>
      )}

      {/* Top Gradient Overlay for Status Bar Readability */}
      <LinearGradient
        colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.3)', 'transparent']}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: Platform.OS === 'ios' ? 140 : 100,
          zIndex: 10,
        }}
        pointerEvents="none"
      />

      <StatusBar style="light" hidden={false} />

      {/* Top Left - Close button */}
      <View
        pointerEvents="box-none"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 20,
          paddingTop: Platform.OS === 'ios' ? 56 : 32,
          paddingLeft: 16,
        }}
      >
        <TouchableOpacity accessibilityRole="button" accessibilityLabel={t('close') || 'Close'} onPress={onClose} hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }} style={{ alignSelf: 'flex-start' }}>
          <Ionicons name="close" size={30} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Seek bar at bottom */}
      {isVideo && player && (
        <ReelProgressBar player={player} isActive={isActive} screenSize={screenSize} />
      )}

      {/* Bottom Gradient Overlay for caption readability */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.85)']}
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 250,
          zIndex: 10,
        }}
        pointerEvents="none"
      />

      {/* Bottom Left - User Info + Caption */}
      <View
        pointerEvents="box-none"
        style={{
          position: 'absolute',
          bottom: Platform.OS === 'ios' ? 95 : 75,
          left: 16,
          right: 90,
          zIndex: 20,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
          <Avatar photo={post?.user_photo} name={post?.username || 'User'} size={36} />
          <View style={{ marginLeft: 10 }}>
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>
              {post?.username || 'User'}
            </Text>
            <Text style={{ color: '#ccc', fontSize: 12, marginTop: 2 }}>
              {reelPostTimeText}
            </Text>
          </View>
        </View>
        {post?.caption ? (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => {
              const nextExpanded = !isCaptionExpanded;
              setIsCaptionExpanded(nextExpanded);
              if (nextExpanded) {
                setTimeout(() => onComment?.(post), 150);
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
                fontWeight: '600',
              }}
              numberOfLines={isCaptionExpanded ? undefined : 1}
              ellipsizeMode="tail"
            >
              <Text style={{ fontWeight: 'bold' }}>{post?.username || 'User'} </Text>
              {captionText}
            </Text>
            {isLongCaption && !isCaptionExpanded && (
              <Text style={{ color: '#ccc', fontSize: 13, fontWeight: '700', marginTop: 2 }}>
                {t('language') === 'hi' ? '...और देखें' : '...more'}
              </Text>
            )}
            {isCaptionExpanded && (
              <View style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ color: '#ccc', fontSize: 13, fontWeight: '700' }}>
                  {t('language') === 'hi' ? 'कम दिखाएं' : 'Show less'}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Right Side - Action Buttons + Speed */}
      <View style={{
        position: 'absolute',
        bottom: '22%', // Moved up closer to upper-middle/right
        right: 12,
        alignItems: 'center',
        zIndex: 20,
      }}>
        {/* Speed control */}
        {isVideo && (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={`Playback speed: ${playbackSpeed}x`}
            style={{
              alignItems: 'center',
              marginBottom: 24,
              paddingHorizontal: 8,
              paddingVertical: 6,
              borderRadius: 14,
              backgroundColor: 'rgba(0,0,0,0.4)',
            }}
            onPress={cycleSpeed}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          >
            <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800' }}>{playbackSpeed}x</Text>
          </TouchableOpacity>
        )}

        {/* Volume toggle */}
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={isMuted ? (t('unmute') || 'Unmute') : (t('mute') || 'Mute')}
          style={{
            alignItems: 'center',
            marginBottom: 20,
            padding: 10,
            borderRadius: 30,
            backgroundColor: 'rgba(0,0,0,0.4)',
          }}
          onPress={toggleMute}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        >
          <Ionicons name={isMuted ? 'volume-mute' : 'volume-medium'} size={26} color="#FFF" />
        </TouchableOpacity>

        {/* Like */}
        <TouchableOpacity accessibilityRole="button" accessibilityLabel={likedByMe ? (t('unlike') || 'Unlike') : (t('like') || 'Like')} style={{ alignItems: 'center', marginBottom: 20 }} onPress={handleLike}>
          <Ionicons
            name={likedByMe ? 'heart' : 'heart-outline'}
            size={34}
            color={likedByMe ? '#FF2D55' : '#FFF'}
            style={{
              textShadowColor: 'rgba(0, 0, 0, 0.4)',
              textShadowOffset: { width: 0, height: 2 },
              textShadowRadius: 4,
            }}
          />
          {likesCount > 0 ? (
            <Text style={{ color: '#fff', marginTop: 4, fontSize: 13, fontWeight: '700', textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 3 }}>
              {likesCount}
            </Text>
          ) : null}
        </TouchableOpacity>

        {/* Comment */}
        <TouchableOpacity accessibilityRole="button" accessibilityLabel={t('comments') || 'Comments'} style={{ alignItems: 'center', marginBottom: 20 }} onPress={handleComment}>
          <Ionicons
            name="chatbubble"
            size={32}
            color="#FFF"
            style={{
              textShadowColor: 'rgba(0, 0, 0, 0.4)',
              textShadowOffset: { width: 0, height: 2 },
              textShadowRadius: 4,
            }}
          />
        </TouchableOpacity>

        {/* Share */}
        <TouchableOpacity accessibilityRole="button" accessibilityLabel={t('share') || 'Share'} style={{ alignItems: 'center', marginBottom: 20 }} onPress={handleShare}>
          <Ionicons
            name="send"
            size={32}
            color="#FFF"
            style={{
              textShadowColor: 'rgba(0, 0, 0, 0.4)',
              textShadowOffset: { width: 0, height: 2 },
              textShadowRadius: 4,
            }}
          />
        </TouchableOpacity>

        {/* Options (Three Dots) */}
        <TouchableOpacity accessibilityRole="button" accessibilityLabel={t('openMenu') || 'Open menu'} style={{ alignItems: 'center', marginBottom: 20 }} onPress={onOpenOptions}>
          <Ionicons
            name="ellipsis-horizontal"
            size={32}
            color="#FFF"
            style={{
              textShadowColor: 'rgba(0, 0, 0, 0.4)',
              textShadowOffset: { width: 0, height: 2 },
              textShadowRadius: 4,
            }}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
});

const CommentItem = React.memo(({
  item,
  replies,
  user,
  selectedPost,
  onDelete,
  onMenuPress,
  onReply,
  t
}: any) => {
  const canDelete = item.user_id === user?.id || selectedPost?.user_id === user?.id;
  return (
    <View style={{ marginBottom: 12, position: 'relative', paddingHorizontal: 16 }}>
      {replies.length > 0 && (
        <View style={{
          position: 'absolute',
          left: 31,
          top: 32,
          bottom: 0,
          width: 1.5,
          backgroundColor: '#E6E1E8',
          zIndex: 1,
        }} />
      )}
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        <Avatar photo={item?.user_photo} name={item?.username || 'User'} size={32} />
        <View style={{
          flex: 1,
          marginLeft: 10,
          backgroundColor: '#F7EDE7',
          borderRadius: 16,
          padding: 12,
        }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Text style={{ fontWeight: 'bold', fontSize: 13, color: '#3F2C20' }}>{item?.username || 'User'}</Text>
            {canDelete ? (
              <TouchableOpacity
                style={{ padding: 4, marginRight: -4, marginTop: -4 }}
                onPress={() => onDelete(item)}
              >
                <Ionicons name="trash-outline" size={16} color="#FF3B30" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={{ padding: 4, marginRight: -4, marginTop: -4 }}
                onPress={() => onMenuPress(item)}
              >
                <Ionicons name="ellipsis-horizontal" size={16} color="#A88876" />
              </TouchableOpacity>
            )}
          </View>
          <MentionText
            text={item?.text || ''}
            style={{ fontSize: 14, color: '#3F2C20', marginTop: 3, lineHeight: 18 }}
          />
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
            <Text style={{ fontSize: 11, color: '#A88876' }}>{formatTimeAgo(item?.created_at)}</Text>
            <TouchableOpacity
              style={{ marginLeft: 16 }}
              onPress={() => onReply(item)}
            >
              <Text style={{ fontSize: 12, color: COLORS.primary, fontWeight: '600' }}>{t('language') === 'hi' ? 'जवाब दें' : 'Reply'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Render nested replies */}
      {replies.map((reply: any, index: number) => {
        const canDeleteReply = reply.user_id === user?.id || selectedPost?.user_id === user?.id;
        const isLastReply = index === replies.length - 1;
        return (
          <View key={reply.id || `${reply.user_id}-${reply.created_at}`} style={{ flexDirection: 'row', alignItems: 'flex-start', marginLeft: 42, marginTop: 8, position: 'relative' }}>
            <View style={{
              position: 'absolute',
              left: -26,
              top: 0,
              bottom: isLastReply ? undefined : 0,
              height: isLastReply ? 12 : undefined,
              width: 1.5,
              backgroundColor: '#E6E1E8',
              zIndex: 1,
            }} />
            <View style={{
              position: 'absolute',
              left: -26,
              top: 12,
              width: 26,
              height: 1.5,
              backgroundColor: '#E6E1E8',
              zIndex: 1,
            }} />

            <Avatar photo={reply?.user_photo} name={reply?.username || 'User'} size={24} />
            <View style={{
              flex: 1,
              marginLeft: 8,
              backgroundColor: '#FAF7F5',
              borderRadius: 16,
              padding: 12,
            }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ fontWeight: 'bold', fontSize: 12, color: '#222' }}>{reply.username}</Text>
                  <Text style={{ fontSize: 10, color: '#999', marginLeft: 8 }}>{formatTimeAgo(reply.created_at)}</Text>
                </View>
                {canDeleteReply ? (
                  <TouchableOpacity
                    style={{ padding: 4, marginRight: -4 }}
                    onPress={() => onDelete(reply)}
                  >
                    <Ionicons name="trash-outline" size={14} color="#FF3B30" />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={{ padding: 4, marginRight: -4 }}
                    onPress={() => onMenuPress(reply)}
                  >
                    <Ionicons name="ellipsis-horizontal" size={14} color="#A88876" />
                  </TouchableOpacity>
                )}
              </View>
              <MentionText
                text={reply.text}
                style={{ fontSize: 13, color: '#444', marginTop: 3, lineHeight: 17 }}
              />
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                <TouchableOpacity
                  onPress={() => onReply(item, reply.username)}
                >
                  <Text style={{ fontSize: 11, color: COLORS.primary, fontWeight: '600' }}>{t('language') === 'hi' ? 'जवाब दें' : 'Reply'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
});
CommentItem.displayName = 'CommentItem';

export const ReelViewer = ({ isVisible, initialPost, onClose, onLike, onComment, onShare }: any) => {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuthStore();
  const [videos, setVideos] = useState<any[]>([initialPost]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [screenSize, setScreenSize] = useState({ width: SCREEN_WIDTH, height: SCREEN_HEIGHT });
  const flatListRef = useRef<FlatList<any>>(null);
  const loadingRef = useRef(false);
  const hasMoreRef = useRef(true);
  const videosRef = useRef<any[]>([]);
  const activeIndexRef = useRef(0);
  const { isGloballyMuted: isMuted, toggleMute } = useGlobalMute();
  const callbacksRef = useRef<Record<string, any>>({ onClose, onLike, onComment, onShare, toggleMute });

  // OPT-2: Single AppState listener in parent — passed down as a prop to
  // ReelVideoItem. Previously every item created its own listener (N leaks).
  const [appState, setAppState] = useState(AppState.currentState);
  useEffect(() => {
    const sub = AppState.addEventListener('change', setAppState);
    return () => sub.remove();
  }, []);

  // Session-level seen IDs — prevents same reel appearing twice in the same batch
  const seenIdsRef = useRef<Set<string>>(new Set());
  // Global pool of ALL posts ever loaded this session — used for recycling when all seen
  const allSessionPostsRef = useRef<any[]>([]);
  // O(1) lookup set for global session pool to prevent O(N) array iteration on every swipe/fetch
  const allSessionIdsRef = useRef<Set<string>>(new Set());

  // Watch-time tracking
  const watchStartRef = useRef<number>(Date.now());
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', (e) => {
      const h = e.endCoordinates.height;
      requestAnimationFrame(() => {
        setKeyboardHeight(h);
        setKeyboardVisible(true);
      });
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      requestAnimationFrame(() => {
        setKeyboardHeight(0);
        setKeyboardVisible(false);
      });
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);
  const [isShareVisible, setIsShareVisible] = useState(false);
  const [isCommentVisible, setIsCommentVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [localComments, setLocalComments] = useState<any[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [activeCommentMenuId, setActiveCommentMenuId] = useState<string | null>(null);
  const [replyingToComment, setReplyingToComment] = useState<any | null>(null);

  // Apple Guideline 1.2 - report comment state & blocked users
  // Global block store — shared across all screens
  const blockedUserSet = useBlockStore(state => state.blockedUserSet);
  const blockedByMeUserSet = useBlockStore(state => state.blockedByMeUserSet);
  const addBlock = useBlockStore(state => state.addBlock);
  const removeBlock = useBlockStore(state => state.removeBlock);
  const [reportCommentModalVisible, setReportCommentModalVisible] = useState(false);
  const [pendingReportComment, setPendingReportComment] = useState<any | null>(null);
  const [commentModalToRestore, setCommentModalToRestore] = useState(false);

  // Tab bar visibility control
  let showTabBar: (() => void) | undefined;
  let hideTabBar: (() => void) | undefined;
  try {
    const tabBar = useTabBar();
    showTabBar = tabBar.showTabBar;
    hideTabBar = tabBar.hideTabBar;
  } catch (e) { }

  useEffect(() => {
    if (isVisible) {
      hideTabBar?.();
    } else {
      showTabBar?.();
    }
    return () => {
      showTabBar?.();
    };
  }, [isVisible]);

  // Hardware Back Button handler on Android
  useEffect(() => {
    if (Platform.OS !== 'android' || !isVisible) return;
    const backAction = () => {
      if (reportCommentModalVisible) {
        setReportCommentModalVisible(false);
        return true;
      }
      if (isCommentVisible) {
        setIsCommentVisible(false);
        return true;
      }
      if (isShareVisible) {
        setIsShareVisible(false);
        return true;
      }
      showTabBar?.();
      onClose?.();
      return true;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [isVisible, reportCommentModalVisible, isCommentVisible, isShareVisible, onClose]);

  const handleCommentMenuPress = useCallback((comment: any) => {
    if (!comment || !user?.id) return;

    const targetUserId = comment.user_id || comment.userId || comment.sender_id || comment.user?.id;
    if (!targetUserId) return;

    const isUserCurrentlyBlocked = blockedByMeUserSet.has(String(targetUserId));
    const blockLabel = isUserCurrentlyBlocked ? 'Unblock User' : 'Block User';

    const handleToggleBlock = async () => {
      try {
        if (isUserCurrentlyBlocked) {
          await unblockUser(user.id, targetUserId);
          removeBlock(String(targetUserId));
          Alert.alert('Success', `${comment.username || 'User'} has been unblocked.`);
        } else {
          Alert.alert(
            'Block User',
            `Are you sure you want to block ${comment.username || 'this user'}? You will no longer see their posts, comments, or messages.`,
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Block',
                style: 'destructive',
                onPress: async () => {
                  await blockUser(user.id, targetUserId);
                  addBlock(String(targetUserId));
                  Alert.alert('Success', `${comment.username || 'User'} has been blocked.`);
                }
              }
            ]
          );
        }
      } catch (err) {
        console.error('Error toggling block in comment menu:', err);
        Alert.alert('Error', 'Could not update block status. Please try again.');
      }
    };

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Report Comment', blockLabel],
          destructiveButtonIndex: 2,
          cancelButtonIndex: 0,
          title: 'Comment Options'
        },
        async (buttonIndex) => {
          if (buttonIndex === 1) {
            setPendingReportComment(comment);
            setCommentModalToRestore(isCommentVisible);
            setIsCommentVisible(false);
            setTimeout(() => {
              setReportCommentModalVisible(true);
            }, 300);
          } else if (buttonIndex === 2) {
            await handleToggleBlock();
          }
        }
      );
    } else {
      Alert.alert(
        'Comment Options',
        'Choose an action:',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Report Comment', onPress: () => {
              setPendingReportComment(comment);
              setCommentModalToRestore(isCommentVisible);
              setIsCommentVisible(false);
              setTimeout(() => {
                setReportCommentModalVisible(true);
              }, 300);
            }
          },
          { text: blockLabel, style: 'destructive', onPress: handleToggleBlock }
        ],
        { cancelable: true }
      );
    }
  }, [user?.id, blockedByMeUserSet, isCommentVisible]);

  const [autoScroll, setAutoScroll] = useState(true);
  const [isOptionsVisible, setIsOptionsVisible] = useState(false);

  const handleCloseWrapper = useCallback(() => {
    callbacksRef.current.onClose?.();
  }, []);

  const handleCommentWrapper = useCallback((post: any) => {
    callbacksRef.current.onComment?.(post);
  }, []);

  const handleShareWrapper = useCallback((post: any) => {
    callbacksRef.current.onShare?.(post);
  }, []);

  const handleOpenOptions = useCallback(() => {
    setIsOptionsVisible(true);
  }, []);

  const handleToggleMuteWrapper = useCallback(() => {
    callbacksRef.current.toggleMute?.();
  }, []);

  useEffect(() => {
    const loadAutoScrollPref = async () => {
      try {
        const val = await AsyncStorage.getItem('@reel_auto_scroll');
        if (val !== null) {
          setAutoScroll(val === 'true');
        } else {
          setAutoScroll(true);
        }
      } catch (e) {
        console.warn('Failed to load autoScroll preference', e);
      }
    };
    if (isVisible) {
      loadAutoScrollPref();
    }
  }, [isVisible]);

  const toggleAutoScroll = async () => {
    try {
      const newVal = !autoScroll;
      setAutoScroll(newVal);
      await AsyncStorage.setItem('@reel_auto_scroll', newVal ? 'true' : 'false');
    } catch (e) {
      console.warn('Failed to save autoScroll preference', e);
    }
  };

  const handleVideoEnded = useCallback(() => {
    if (!autoScroll) return;
    const nextIndex = activeIndexRef.current + 1;
    if (nextIndex < videosRef.current.length) {
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
    }
  }, [autoScroll]);

  const handleShareLocal = useCallback((post: any) => {
    setSelectedPost(post);
    setIsShareVisible(true);
  }, []);

  // OPT-7 follow-up: optimistic like updates now live in the parent videos
  // array so ReelVideoItem can read from its post prop without needing local state.
  const handleLikeLocal = useCallback((likedPost: any) => {
    if (!likedPost?.id) return;
    setVideos(prev => prev.map(v => {
      if (v.id !== likedPost.id) return v;
      const wasLiked = !!v.liked_by_me;
      return {
        ...v,
        liked_by_me: !wasLiked,
        likes_count: wasLiked ? Math.max(0, Number(v.likes_count) - 1) : Number(v.likes_count) + 1,
      };
    }));
    // Fire the external onLike callback (backend call)
    callbacksRef.current.onLike?.(likedPost);
  }, []);

  const handleCommentLocal = useCallback(async (post: any) => {
    setSelectedPost(post);
    setIsCommentVisible(true);
    setCommentsLoading(true);
    try {
      const res = await getPostComments(post.id);
      setLocalComments(res.data || []);
    } catch (e) {
      if (__DEV__) console.warn('Failed to load reel comments', e);
    } finally {
      setCommentsLoading(false);
    }
  }, []);

  // Fix 2: Stable socket comment handlers with useCallback
  const handleNewComment = useCallback((data: any) => {
    const postId = selectedPost?.id ? String(selectedPost.id) : null;
    if (!postId || String(data.post_id) !== postId) return;
    setLocalComments(prev => {
      const comment = data.comment;
      if (!comment) return prev;
      if (prev.some((c: any) => c.id === comment.id)) return prev;
      const filtered = prev.filter((c: any) => c.id !== comment.id);
      return [comment, ...filtered];
    });
  }, [selectedPost?.id]);

  const handleCommentDeleted = useCallback((data: any) => {
    const postId = selectedPost?.id ? String(selectedPost.id) : null;
    if (!postId || String(data.post_id) !== postId) return;
    setLocalComments(prev => prev.filter((c: any) => c.id !== data.comment_id));
  }, [selectedPost?.id]);

  // Listen for new comments via socket — clean lifecycle
  useEffect(() => {
    if (!isCommentVisible || !selectedPost?.id) return;
    const postId = String(selectedPost.id);
    const room = `post_${postId}`;

    socketService.joinRoom(room).catch(() => { });

    socketService.onEvent('new_comment', handleNewComment);
    socketService.onEvent('comment_deleted', handleCommentDeleted);

    return () => {
      socketService.offEvent('new_comment', handleNewComment);
      socketService.offEvent('comment_deleted', handleCommentDeleted);
      socketService.leaveRoom(room);
    };
  }, [isCommentVisible, selectedPost?.id, handleNewComment, handleCommentDeleted]);

  // Fix 4: Batched comment submission
  const submitLocalComment = useCallback(async () => {
    if (!selectedPost || !newCommentText.trim() || isSubmittingComment) return;

    const textToPost = newCommentText.trim();
    const tempId = `temp-${Date.now()}`;
    const parentId = replyingToComment?.id || null;

    // Create optimistic comment
    const optimisticComment = {
      id: tempId,
      text: textToPost,
      username: user?.name || 'User',
      user_photo: user?.photo || '',
      created_at: new Date().toISOString(),
      is_optimistic: true,
      user_id: user?.id,
      parent_id: parentId,
    };

    // BATCH optimistic updates together
    setIsSubmittingComment(true);
    setNewCommentText('');
    setReplyingToComment(null);
    setLocalComments(prev => [optimisticComment, ...prev]);
    Keyboard.dismiss();

    try {
      const res = await addPostComment(selectedPost.id, textToPost, parentId || undefined);
      const serverComment = res.data?.comment || res.data;

      // BATCH server response updates
      const updatedPost = {
        ...selectedPost,
        comments_count: (Number(selectedPost.comments_count) || 0) + 1,
      };

      setLocalComments(prev =>
        prev.map(c => c.id === tempId ? { ...serverComment, is_optimistic: false } : c)
      );
      setSelectedPost(updatedPost);
      setVideos(prev => prev.map(v =>
        v.id === selectedPost.id ? updatedPost : v
      ));

    } catch (e) {
      setLocalComments(prev => prev.filter(c => c.id !== tempId));
      Alert.alert(
        t('language') === 'hi' ? 'त्रुटि' : 'Error',
        t('language') === 'hi' ? 'टिप्पणी पोस्ट नहीं की जा सकी। कृपया पुनः प्रयास करें।' : 'Could not post comment. Please try again.'
      );
    } finally {
      setIsSubmittingComment(false);
    }
  }, [selectedPost, newCommentText, isSubmittingComment, replyingToComment, user, t]);

  const handleDeleteComment = useCallback(async (comment: any) => {
    const commentId = comment?.id;
    if (!commentId || !selectedPost?.id) return;

    const originalComments = [...localComments];
    const originalSelectedPost = { ...selectedPost };
    const originalVideos = [...videos];

    // Optimistic update
    setLocalComments(prev => prev.filter(c => c.id !== commentId));
    setSelectedPost((prev: any) => prev ? {
      ...prev,
      comments_count: Math.max(0, (Number(prev.comments_count) || 0) - 1),
    } : null);
    setVideos(prev => prev.map(v => {
      if (v.id === selectedPost.id) {
        return {
          ...v,
          comments_count: Math.max(0, (Number(v.comments_count) || 0) - 1),
        };
      }
      return v;
    }));

    try {
      const res = await deletePostComment(selectedPost.id, commentId);
      const updatedPost = res.data?.post || res.data;
      if (updatedPost) {
        setSelectedPost((prev: any) => prev ? { ...prev, ...updatedPost } : null);
        setVideos(prev => prev.map(v => v.id === selectedPost.id ? { ...v, ...updatedPost } : v));
      }
    } catch (error: any) {
      console.warn('Failed to delete comment:', error);
      setLocalComments(originalComments);
      setSelectedPost(originalSelectedPost);
      setVideos(originalVideos);
      const detail = error.response?.data?.detail || error.message;
      Alert.alert(
        t('language') === 'hi' ? 'त्रुटि' : 'Error',
        detail || (t('language') === 'hi' ? 'टिप्पणी हटाई नहीं जा सकी। कृपया पुनः प्रयास करें।' : 'Could not delete comment. Please try again.')
      );
    }
  }, [localComments, selectedPost, videos]);

  const handleCopyLink = async () => {
    const postId = selectedPost?.id;
    if (!postId) return;
    const link = `https://brahmand.app/post/${postId}`;
    await Clipboard.setStringAsync(link);
    Alert.alert(
      t('language') === 'hi' ? 'लिंक कॉपी हो गया' : 'Link Copied',
      t('language') === 'hi' ? 'पोस्ट लिंक आपके क्लिपबोर्ड पर कॉपी हो गया है।' : 'The post link has been copied to your clipboard.'
    );
  };

  const handleExternalShare = async () => {
    if (!selectedPost) return;
    try {
      const link = `https://brahmand.app/post/${selectedPost.id}`;
      await Share.share({
        message: `${selectedPost.caption || (t('language') === 'hi' ? 'ब्रह्मांड पर इस रील को देखें!' : 'Check this reel on Brahmand!')}\n\n${link}`,
        url: link,
      });
    } catch (e) {
      console.warn('External share error', e);
    }
  };
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
        const winWidth = Dimensions.get('window').width;
        swipeTranslateX.flattenOffset();
        if (g.dx > winWidth * 0.3) {
          Animated.timing(swipeTranslateX, {
            toValue: winWidth,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            callbacksRef.current.onClose?.();
          });
        } else if (g.dx < -winWidth * 0.3) {
          Animated.timing(swipeTranslateX, {
            toValue: -winWidth,
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

  loadingRef.current = loading;
  hasMoreRef.current = hasMore;
  videosRef.current = videos;
  activeIndexRef.current = activeIndex;
  callbacksRef.current = {
    onClose,
    onLike,
    onComment,
    onShare,
    toggleMute,
    handleCloseWrapper,
    handleLikeLocal,
    handleCommentWrapper,
    handleShareWrapper,
    handleToggleMuteWrapper,
    handleOpenOptions,
    handleShareLocal,
    handleCommentLocal,
    handleVideoEnded,
  };

  const lastLoadTimeRef = useRef<number>(0);

  const loadMoreReels = useCallback(async () => {
    if (loadingRef.current) return;
    if (Date.now() - lastLoadTimeRef.current < 1500) return;

    lastLoadTimeRef.current = Date.now();
    setLoading(true);
    loadingRef.current = true;
    try {
      const currentVideos = videosRef.current;

      // Build set of all IDs currently in the queue to avoid immediate duplicates
      const currentIds = new Set(currentVideos.map((p: any) => p.id).filter(Boolean));

      // Pass ALL session-seen IDs so backend prioritises truly unseen posts
      const allSeenIds = Array.from(seenIdsRef.current).slice(-250).join(',');

      const res = await getPostsFeed(20, 0, 'for_you', allSeenIds);
      const rawPosts: any[] = res.data?.items || (Array.isArray(res.data) ? res.data : []);

      // Only keep video posts in the ReelViewer
      const newPosts = rawPosts.filter((p: any) => {
        const mediaUrl = p?.media_url || p?.mediaUrl || p?.image_url || p?.imageUrl || p?.image || '';
        const mediaType = String(p?.media_type || p?.mediaType || p?.type || '').toLowerCase();
        return mediaType.startsWith('video') || /\.(mp4|mov|m4v|webm)(\?|$)/i.test(mediaUrl);
      });

      // Add any new posts to the global session pool
      // OPT: Use a parallel Set for O(1) lookup to prevent O(N*M) CPU bottleneck
      for (const p of newPosts) {
        if (p?.id && !allSessionIdsRef.current.has(p.id)) {
          allSessionPostsRef.current.push(p);
          allSessionIdsRef.current.add(p.id);
        }
      }

      // Filter to only truly new posts not already in current queue
      const uniqueNew = newPosts.filter((p: any) => p?.id && !currentIds.has(p.id));

      if (uniqueNew.length > 0) {
        // Great — append fresh unseen content with state deduplication
        setVideos(prev => {
          const existingIds = new Set(prev.map((p: any) => p.id));
          const filtered = uniqueNew.filter((p: any) => !existingIds.has(p.id));
          if (filtered.length === 0) return prev;
          return [...prev, ...filtered];
        });
      } else {
        // All returned posts already queued — recycle from the full session pool
        const pool = allSessionPostsRef.current;
        if (pool.length > 1) {
          // Shuffle the entire session pool and append, giving a fresh experience
          const shuffled = [...pool].sort(() => Math.random() - 0.5);
          setVideos(prev => {
            const existingIds = new Set(prev.map((p: any) => p.id));
            const filtered = shuffled.filter((p: any) => !existingIds.has(p.id));
            return filtered.length > 0 ? [...prev, ...filtered] : prev;
          });
        } else if (currentVideos.length > 1) {
          // Fallback: recycle what's currently queued
          const shuffled = [...currentVideos].sort(() => Math.random() - 0.5);
          setVideos(prev => {
            const existingIds = new Set(prev.map((p: any) => p.id));
            const filtered = shuffled.filter((p: any) => !existingIds.has(p.id));
            return filtered.length > 0 ? [...prev, ...filtered] : prev;
          });
        }
      }

      // Always keep hasMore true — we recycle content so the feed is truly infinite
      hasMoreRef.current = true;
      setHasMore(true);
    } catch (error: any) {
      if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
        console.warn('Load more reels timed out — retrying later');
      } else {
        console.error('Load more reels error:', error);
      }
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, []);

  loadMoreRef.current = loadMoreReels;

  const initialPostRef = useRef(initialPost);
  const isInitialLoadDoneRef = useRef(false);

  useEffect(() => {
    if (isVisible) {
      if (initialPostRef.current?.id !== initialPost?.id) {
        initialPostRef.current = initialPost;
        seenIdsRef.current.clear();
        allSessionPostsRef.current = [];
        allSessionIdsRef.current.clear();
        if (initialPost?.id) {
          seenIdsRef.current.add(initialPost.id);
          allSessionPostsRef.current.push(initialPost);
          allSessionIdsRef.current.add(initialPost.id);
        }
        setVideos([initialPost]);
        setActiveIndex(0);
        setHasMore(true);
        setLoading(false);
        loadingRef.current = false;
        hasMoreRef.current = true;
        watchStartRef.current = Date.now();
        isInitialLoadDoneRef.current = false;
      }
      if (!isInitialLoadDoneRef.current) {
        isInitialLoadDoneRef.current = true;
        const timer = setTimeout(() => loadMoreRef.current(), 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [isVisible, initialPost?.id]);

  // Send watch event when active reel changes
  const sendWatchEventLocal = useCallback((post: any, watchedMs: number) => {
    if (!post?.id) return;
    const watchSecs = watchedMs / 1000;
    const durSecs = post.duration || post.metadata?.duration_seconds || 30;
    recordWatchEvent(post.id, {
      watch_seconds: watchSecs,
      duration_seconds: durSecs,
      rewatched: false,
    }).catch(() => { }); // fire-and-forget
  }, []);

  const handleClose = useCallback(() => {
    // Send final watch event
    const currentPost = videosRef.current[activeIndexRef.current];
    if (currentPost) {
      const elapsed = Date.now() - watchStartRef.current;
      sendWatchEventLocal(currentPost, elapsed);
    }
    callbacksRef.current.onClose?.();
  }, [sendWatchEventLocal]);

  const viewabilityConfigRef = useRef({
    itemVisiblePercentThreshold: 50,
    minimumViewTime: 50,
    waitForInteraction: false,
  });

  const handleViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      const firstVisible = viewableItems[0];
      const newIndex = firstVisible.index;
      const prevIndex = activeIndexRef.current;

      // Send watch event for the reel we're leaving
      if (prevIndex !== newIndex) {
        const prevPost = videosRef.current[prevIndex];
        if (prevPost) {
          const elapsed = Date.now() - watchStartRef.current;
          sendWatchEventLocal(prevPost, elapsed);
        }
        watchStartRef.current = Date.now();
      }

      setActiveIndex(newIndex);
      activeIndexRef.current = newIndex;
      if (newIndex >= videosRef.current.length - 2 && hasMoreRef.current && !loadingRef.current) {
        loadMoreRef.current();
      }
    }
  }).current;

  const handleReelScroll = useRef((event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const newIndex = Math.min(
      Math.max(Math.round(offsetY / screenSize.height), 0),
      videosRef.current.length - 1,
    );
    if (newIndex !== activeIndexRef.current) {
      const prevPost = videosRef.current[activeIndexRef.current];
      if (prevPost) {
        const elapsed = Date.now() - watchStartRef.current;
        sendWatchEventLocal(prevPost, elapsed);
      }
      setActiveIndex(newIndex);
      activeIndexRef.current = newIndex;
      watchStartRef.current = Date.now();
    }
  }).current;

  const handleMomentumScrollEnd = useRef((event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / Dimensions.get('window').height);
    if (index !== activeIndexRef.current) {
      setActiveIndex(index);
      activeIndexRef.current = index;
    }
    if (index >= videosRef.current.length - 2 && hasMoreRef.current && !loadingRef.current) {
      loadMoreRef.current();
    }
  }).current;

  useEffect(() => {
    const activePost = videos[activeIndex];
    if (activePost?.id) {
      markPostAsSeen(activePost.id);
      // Track in session seen set for smarter backend querying
      seenIdsRef.current.add(activePost.id);
      // Add to global session pool if not already there
      // OPT: Use parallel Set for O(1) lookup to prevent O(N) iteration on every swipe
      if (!allSessionIdsRef.current.has(activePost.id)) {
        allSessionPostsRef.current.push(activePost);
        allSessionIdsRef.current.add(activePost.id);
      }
    }
  }, [activeIndex, videos]);

  // Fix 5: AbortController ref for video pre-warming fetch requests
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());

  useEffect(() => {
    const nextPost = videos[activeIndex + 1];
    if (!nextPost) return;
    const nextUrl = String(nextPost?.media_url || nextPost?.mediaUrl || '');
    const isNextVideo = /\.(mp4|mov|m4v|webm)(\?|$)/i.test(nextUrl);
    if (isNextVideo && nextUrl) {
      // Cancel any existing pre-warming for this URL
      const existingController = abortControllersRef.current.get(nextUrl);
      if (existingController) {
        existingController.abort();
        abortControllersRef.current.delete(nextUrl);
      }

      const abortController = new AbortController();
      abortControllersRef.current.set(nextUrl, abortController);

      // Delay pre-warming by 1500ms to allow active video to start playing smoothly first
      const timer = setTimeout(() => {
        fetch(nextUrl, {
          method: 'GET',
          headers: { Range: 'bytes=0-1048576' },
          signal: abortController.signal,
        }).catch((error) => {
          if (error.name === 'AbortError') return;
          if (__DEV__) console.warn('Pre-warm failed:', error);
        });
      }, 1500);

      return () => {
        clearTimeout(timer);
        abortController.abort();
        abortControllersRef.current.delete(nextUrl);
      };
    }
  }, [activeIndex, videos]);

  // Clean up all pending pre-warm abort controllers on component unmount
  useEffect(() => {
    return () => {
      abortControllersRef.current.forEach((controller) => {
        controller.abort();
      });
      abortControllersRef.current.clear();
    };
  }, []);

  const getItemLayout = (_: any, index: number) => ({
    length: screenSize.height,
    offset: screenSize.height * index,
    index,
  });

  // Fix 1: renderItem depends ONLY on stable values (isMuted, screenSize, autoScroll, appState).
  // All callbacks are accessed via callbacksRef.current to avoid recreation & FlatList re-renders.
  const renderItem = useCallback(({ item, index }: { item: any; index: number }) => {
    const isActive = index === activeIndexRef.current;
    const shouldLoad = Math.abs(index - activeIndexRef.current) <= 1;

    return (
      <ReelVideoItem
        key={item?.id || index}
        post={item}
        isActive={isActive}
        shouldLoad={shouldLoad}
        onClose={callbacksRef.current.handleCloseWrapper}
        onLike={callbacksRef.current.handleLikeLocal}
        onComment={callbacksRef.current.handleCommentWrapper}
        onShare={callbacksRef.current.handleShareWrapper}
        isMuted={isMuted}
        toggleMute={callbacksRef.current.handleToggleMuteWrapper}
        screenSize={screenSize}
        onShareLocal={callbacksRef.current.handleShareLocal}
        onCommentLocal={callbacksRef.current.handleCommentLocal}
        autoScroll={autoScroll}
        onVideoEnded={callbacksRef.current.handleVideoEnded}
        onOpenOptions={callbacksRef.current.handleOpenOptions}
        appState={appState}
      />
    );
  }, [isMuted, screenSize, autoScroll, appState]);

  // OPT-5: memoize comment tree — only recomputes when localComments changes,
  // not on every parent render triggered by swipe/mute/etc.
  // Filters out comments from blocked users.
  const parentComments = React.useMemo(() => {
    return localComments.filter((c: any) => {
      const uid = c.user_id || c.userId || c.sender_id || c.user?.id;
      const isBlocked = uid && blockedUserSet.has(String(uid));
      return !c.parent_id && !isBlocked;
    });
  }, [localComments, blockedUserSet]);

  const repliesMap = React.useMemo(() => {
    return localComments.reduce((acc: Record<string, any[]>, c: any) => {
      const uid = c.user_id || c.userId || c.sender_id || c.user?.id;
      const isBlocked = uid && blockedUserSet.has(String(uid));
      if (c.parent_id && !isBlocked) {
        if (!acc[c.parent_id]) acc[c.parent_id] = [];
        acc[c.parent_id].push(c);
      }
      return acc;
    }, {} as Record<string, any[]>);
  }, [localComments, blockedUserSet]);

  const handleReply = useCallback((item: any, replyUsername?: string) => {
    setReplyingToComment(item);
    if (replyUsername) {
      setNewCommentText(`@${replyUsername} `);
    }
  }, []);

  const renderCommentItem = useCallback(({ item }: { item: any }) => {
    const replies = repliesMap[item.id] || [];
    return (
      <CommentItem
        item={item}
        replies={replies}
        user={user}
        selectedPost={selectedPost}
        onDelete={handleDeleteComment}
        onMenuPress={handleCommentMenuPress}
        onReply={handleReply}
        t={t}
      />
    );
  }, [repliesMap, user, selectedPost, handleDeleteComment, handleCommentMenuPress, handleReply, t]);

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleClose}
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
            extraData={isMuted}
            // OPT-1: key by post.id (stable) instead of array index
            // This makes FlatList use O(1) key matching on mutations instead
            // of O(n) full reconciliation every time setVideos() is called.
            keyExtractor={(item, index) => item?.id ? `reel-${item.id}` : `reel-idx-${index}`}
            pagingEnabled={Platform.OS !== 'web'}
            showsVerticalScrollIndicator={false}
            onScroll={handleReelScroll}
            scrollEventThrottle={16}
            onMomentumScrollEnd={handleMomentumScrollEnd}
            onViewableItemsChanged={handleViewableItemsChanged}
            viewabilityConfig={viewabilityConfigRef.current}
            getItemLayout={getItemLayout}
            initialNumToRender={1}
            maxToRenderPerBatch={1}
            windowSize={3}
            removeClippedSubviews={true}
            snapToInterval={screenSize.height}
            snapToAlignment="start"
            decelerationRate="fast"
            disableIntervalMomentum={true}
            ListFooterComponent={
              loading ? (
                <View style={{ height: 100, justifyContent: 'center', alignItems: 'center' }}>
                  <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
              ) : null
            }
          />
        </Animated.View>

        {/* Local Share Modal */}
        {selectedPost && (
          <SharePostModal
            visible={isShareVisible}
            post={selectedPost}
            onClose={() => setIsShareVisible(false)}
            onCopyLink={handleCopyLink}
            onShareExternal={handleExternalShare}
          />
        )}

        {/* Local Comment Bottom Sheet */}
        <Modal
          visible={isCommentVisible}
          transparent
          animationType="slide"
          onRequestClose={() => {
            setIsCommentVisible(false);
            setActiveCommentMenuId(null);
            setReplyingToComment(null);
          }}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}
          >
            <TouchableOpacity
              style={{ ...StyleSheet.absoluteFillObject }}
              activeOpacity={1}
              onPress={() => {
                setIsCommentVisible(false);
                setActiveCommentMenuId(null);
                setReplyingToComment(null);
              }}
            />
            <View
              style={{
                backgroundColor: '#FFF',
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                height: '75%',
                paddingTop: 12,
              }}
            >
              <View style={{ width: 40, height: 5, backgroundColor: '#DDD', borderRadius: 3, alignSelf: 'center', marginBottom: 15 }} />
              <Text style={{ fontSize: 16, fontWeight: 'bold', textAlign: 'center', marginBottom: 15 }}>{t('language') === 'hi' ? 'टिप्पणियाँ' : 'Comments'}</Text>

              {/* OPT-5: repliesMap & parentComments are now pre-computed useMemo values */}
              <FlatList
                data={parentComments}
                keyExtractor={(item) => item.id || `${item.user_id}-${item.created_at}`}
                initialNumToRender={10}
                maxToRenderPerBatch={5}
                windowSize={5}
                removeClippedSubviews={Platform.OS === 'android'}
                renderItem={renderCommentItem}
                ListEmptyComponent={
                  commentsLoading ? (
                    <ActivityIndicator style={{ marginTop: 40 }} color={COLORS.primary} />
                  ) : (
                    <View style={{ marginTop: 60, alignItems: 'center' }}>
                      <Ionicons name="chatbubbles-outline" size={48} color="#CCC" />
                      <Text style={{ color: '#999', marginTop: 10 }}>{t('noCommentsYet')}</Text>
                    </View>
                  )
                }
              />


              {replyingToComment && (
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: '#F9F9F9',
                  paddingVertical: 8,
                  paddingHorizontal: 16,
                  borderTopWidth: 0.5,
                  borderTopColor: '#EEE'
                }}>
                  <Text style={{ fontSize: 13, color: '#444' }}>
                    {t('language') === 'hi' ? 'को जवाब दिया जा रहा है' : 'Replying to'}{' '}
                    <Text style={{ fontWeight: 'bold', color: COLORS.primary }}>@{replyingToComment.username}</Text>
                  </Text>
                  <TouchableOpacity onPress={() => setReplyingToComment(null)}>
                    <Ionicons name="close-circle" size={18} color="#999" />
                  </TouchableOpacity>
                </View>
              )}

              <View style={{
                paddingTop: 12,
                paddingHorizontal: 15,
                paddingBottom: Platform.OS === 'android' ? (keyboardVisible ? 8 : Math.max(insets.bottom, 12)) : Math.max(insets.bottom, 12),
                borderTopWidth: 1,
                borderTopColor: '#EEE',
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#FFF',
              }}>
                <View style={{ flex: 1, backgroundColor: '#F5F5F5', borderRadius: 24, paddingHorizontal: 16, paddingVertical: 8, flexDirection: 'row', alignItems: 'center' }}>
                  <MentionInput
                    value={newCommentText}
                    onChangeText={setNewCommentText}
                    placeholder={replyingToComment ? `${t('language') === 'hi' ? 'को जवाब दें' : 'Reply to'} @${replyingToComment.username}...` : t('addComment')}
                    style={{ flex: 1 }}
                    inputStyle={{ fontSize: 14, color: '#111', minHeight: 24, maxHeight: 100, paddingVertical: 2, lineHeight: 20 }}
                    multiline
                  />
                  <TouchableOpacity
                    onPress={submitLocalComment}
                    disabled={!newCommentText.trim() || isSubmittingComment}
                  >
                    <Text style={{
                      color: newCommentText.trim() ? COLORS.primary : '#999',
                      fontWeight: 'bold',
                      marginLeft: 10
                    }}>
                      {isSubmittingComment ? '...' : t('post')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              {Platform.OS === 'android' && <View style={{ height: keyboardVisible ? keyboardHeight + insets.bottom + 8 : 0 }} />}
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* Apple Guideline 1.2 - Report Comment Modal */}
        <ReportModal
          visible={reportCommentModalVisible}
          onClose={() => {
            setReportCommentModalVisible(false);
            setPendingReportComment(null);
            if (commentModalToRestore) {
              setTimeout(() => {
                setIsCommentVisible(true);
                setCommentModalToRestore(false);
              }, 300);
            }
          }}
          reporterUid={user?.id || ''}
          reportedUserUid={pendingReportComment?.user_id || pendingReportComment?.userId || pendingReportComment?.sender_id || pendingReportComment?.user?.id || ''}
          contentId={pendingReportComment?.id || ''}
          contentType="comment"
          postId={pendingReportComment?.post_id || selectedPost?.id || ''}
          apiFallback={async (reason, description) => {
            if (pendingReportComment?.id) {
              await reportComment(String(pendingReportComment.id), reason, description || '');
            }
          }}
          onSuccess={() => {
            // Keep reported comment visible
          }}
        />

        {/* Options Settings Modal */}
        <Modal
          visible={isOptionsVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setIsOptionsVisible(false)}
        >
          <View style={styles.sheetBackdrop}>
            <TouchableOpacity
              style={{ ...StyleSheet.absoluteFillObject }}
              activeOpacity={1}
              onPress={() => setIsOptionsVisible(false)}
            />
            <View style={[styles.sheetContainer, { paddingBottom: Math.max(insets.bottom, 24) }]}>
              <View style={styles.sheetHandle} />
              <Text style={styles.sheetTitle}>{t('reelSettings')}</Text>

              <TouchableOpacity
                style={styles.sheetRow}
                onPress={() => {
                  toggleAutoScroll();
                  setIsOptionsVisible(false);
                }}
              >
                <View style={styles.sheetRowLeft}>
                  <Ionicons
                    name={autoScroll ? 'repeat' : 'infinite-outline'}
                    size={22}
                    color="#FFF"
                    style={styles.sheetIcon}
                  />
                  <Text style={styles.sheetRowText}>{t('autoScrollNextReel')}</Text>
                </View>
                <View style={[styles.toggleTrack, autoScroll && styles.toggleTrackActive]}>
                  <View style={[styles.toggleThumb, autoScroll && styles.toggleThumbActive]} />
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  inlineDeletePopover: {
    position: 'absolute',
    right: 0,
    top: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 5,
    minWidth: 80,
    zIndex: 999,
  },
  inlineDeleteText: {
    color: '#FF3B30',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#1E1E24',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
  },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  sheetRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sheetIcon: {
    opacity: 0.9,
  },
  sheetRowText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
  toggleTrack: {
    width: 46,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    padding: 2,
    justifyContent: 'center',
  },
  toggleTrackActive: {
    backgroundColor: COLORS.primary,
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFF',
  },
  toggleThumbActive: {
    transform: [{ translateX: 22 }],
  },
  sheetCancelBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetCancelText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
});