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
  ActivityIndicator,
  StyleSheet,
  Animated,
  PanResponder,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { COLORS } from '../constants/theme';
import { Avatar } from './Avatar';
import api, { getPostComments, addPostComment, getProfile, getPostsFeed, recordWatchEvent, deletePostComment } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { formatTimeAgo } from '../utils/dateUtils';
import { useGlobalMute } from '../contexts/MuteContext';
import { useRouter } from 'expo-router';
import SharePostModal from './SharePostModal';
import { MentionInput } from './MentionInput';
import { MentionText } from './MentionText';
import * as Clipboard from 'expo-clipboard';
import { Share, KeyboardAvoidingView, Keyboard } from 'react-native';

let ExpoVideoModule: any = null;
try {
  ExpoVideoModule = require('expo-video');
} catch (error) {
  console.warn('expo-video unavailable:', error);
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

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
  onShareLocal,
  onCommentLocal,
}: any) => {
  const [showPlayPause, setShowPlayPause] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isCaptionExpanded, setIsCaptionExpanded] = useState(false);
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const [showSpinner, setShowSpinner] = useState(false);
  const playPauseAnim = useRef(new Animated.Value(0)).current;
  const [localPost, setLocalPost] = useState(post);

  useEffect(() => {
    setLocalPost(post);
  }, [post]);
  const videoRef = useRef<any>(null);
  const captionText = String(localPost?.caption || '');
  const captionWords = captionText.trim().split(/\s+/).filter(Boolean);
  const isLongCaption = captionWords.length > 4 || captionText.length > 45;
  const reelPostTimeText = formatTimeAgo(localPost?.created_at || localPost?.createdAt || localPost?.createdAtUtc || null);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showSpeedBadge, setShowSpeedBadge] = useState(false);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const seekingRef = useRef<'left' | 'right' | null>(null);
  const seekIntervalRef = useRef<any>(null);
  const timeIntervalRef = useRef<any>(null);
  const durationRef = useRef(0);
  const lastTapRef = useRef<number>(0);
  const heartScale = useRef(new Animated.Value(0)).current;
  const heartOpacity = useRef(new Animated.Value(0)).current;

  const animateHeart = () => {
    heartScale.setValue(0.3);
    heartOpacity.setValue(0);
    Animated.sequence([
      Animated.parallel([
        Animated.spring(heartScale, { toValue: 1.2, friction: 3, useNativeDriver: true }),
        Animated.timing(heartOpacity, { toValue: 1, duration: 150, useNativeDriver: true }),
      ]),
      Animated.delay(400),
      Animated.parallel([
        Animated.timing(heartScale, { toValue: 1.5, duration: 150, useNativeDriver: true }),
        Animated.timing(heartOpacity, { toValue: 0, duration: 150, useNativeDriver: true }),
      ]),
    ]).start();
  };

  const handleDoubleTapLike = () => {
    animateHeart();
    if (!likedByMe) {
      handleLike();
    }
  };

  useEffect(() => {
    if (!isActive) setIsPaused(false);
  }, [isActive]);

  const mediaUrl = String(localPost?.media_url || localPost?.mediaUrl || '');
  const posterUrl = String(
    localPost?.thumbnail_url || localPost?.thumbnailUrl || localPost?.metadata?.thumbnail_url || localPost?.metadata?.thumbnailUrl || ''
  );
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
        preferredForwardBufferDuration: 2, // Smaller look-ahead to prioritize start
        waitsToMinimizeStalling: true,    
        minBufferForPlayback: 0.3,        // Start faster (0.3s instead of 0.5s)
        maxBufferBytes: 10 * 1024 * 1024,  // 10MB limit
        prioritizeTimeOverSizeThreshold: true,
      };
    }
  });

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

  const seekPlayerRef = useRef<(pageX: number) => void>(() => { });

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
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      lastTapRef.current = 0;
      handleDoubleTapLike();
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

  const handleLike = () => {
    onLike?.(localPost);
    setLocalPost((prev: any) => ({
      ...prev,
      liked_by_me: !prev.liked_by_me,
      likes_count: prev.liked_by_me ? Math.max(0, Number(prev.likes_count) - 1) : Number(prev.likes_count) + 1
    }));
  };

  const handleComment = () => {
    onCommentLocal?.(localPost);
  };

  const handleShare = () => {
    onShareLocal?.(localPost);
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
              contentFit="cover"
              transition={300}
            />
          ) : Platform.OS === 'web' ? (
            <>
              <video
                ref={videoRef}
                src={mediaUrl}
                preload="auto"
                loop
                muted={isMuted}
                playsInline
                autoPlay={isActive && !isPaused}
                poster={posterUrl || undefined}
                onLoadStart={() => setIsVideoLoading(true)}
                onLoadedData={() => setIsVideoLoading(false)}
                onCanPlay={() => setIsVideoLoading(false)}
                onWaiting={() => setIsVideoLoading(true)}
                onPlaying={() => setIsVideoLoading(false)}
                style={{ width: '100%', height: '100%', objectFit: contentFitMode }}
              />
              {isVideoLoading && posterUrl && (
                <Image
                  source={{ uri: posterUrl }}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                  pointerEvents="none"
                />
              )}
            </>
          ) : ExpoVideoModule?.VideoView && player ? (
            <>
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
              {isVideoLoading && posterUrl && (
                <Image
                  source={{ uri: posterUrl }}
                  style={[StyleSheet.absoluteFill, { zIndex: 2 }]}
                  contentFit="cover"
                  pointerEvents="none"
                />
              )}
            </>
          ) : (
            <View style={{ width: '100%', height: '100%', backgroundColor: '#000' }} />
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

      {/* Animated Heart Overlay */}
      <Animated.View
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          marginTop: -50,
          marginLeft: -50,
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 99999,
          transform: [{ scale: heartScale }],
          opacity: heartOpacity,
        }}
        pointerEvents="none"
      >
        <Ionicons 
          name="heart" 
          size={100} 
          color="#FFF" 
          style={{
            textShadowColor: 'rgba(0, 0, 0, 0.3)',
            textShadowOffset: { width: 0, height: 4 },
            textShadowRadius: 6,
          }} 
        />
      </Animated.View>

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
        <TouchableOpacity onPress={onClose} hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }} style={{ alignSelf: 'flex-start' }}>
          <Ionicons name="close" size={30} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Seek bar at bottom */}
      {isVideo && (
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
          <Avatar photo={localPost?.user_photo} name={localPost?.username || 'User'} size={36} />
          <View style={{ marginLeft: 10 }}>
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>
              {localPost?.username || 'User'}
            </Text>
            <Text style={{ color: '#ccc', fontSize: 12, marginTop: 2 }}>
              {reelPostTimeText}
            </Text>
          </View>
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
                fontWeight: '600',
              }}
              numberOfLines={isCaptionExpanded ? undefined : 1}
              ellipsizeMode="tail"
            >
              <Text style={{ fontWeight: 'bold' }}>{localPost?.username || 'User'} </Text>
              {captionText}
            </Text>
            {isLongCaption && !isCaptionExpanded && (
              <Text style={{ color: '#ccc', fontSize: 13, fontWeight: '700', marginTop: 2 }}>
                ...more
              </Text>
            )}
            {isCaptionExpanded && (
              <View style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ color: '#ccc', fontSize: 13, fontWeight: '700' }}>
                  Show less
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
          style={{
            alignItems: 'center',
            marginBottom: 24,
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
        <TouchableOpacity style={{ alignItems: 'center', marginBottom: 24 }} onPress={handleLike}>
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
          <Text style={{ color: '#fff', marginTop: 4, fontSize: 13, fontWeight: '700', textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 3 }}>
            {likesCount > 0 ? likesCount : ''}
          </Text>
        </TouchableOpacity>

        {/* Comment */}
        <TouchableOpacity style={{ alignItems: 'center', marginBottom: 24 }} onPress={handleComment}>
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
          <Text style={{ color: '#fff', marginTop: 4, fontSize: 13, fontWeight: '700', textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 3 }}>
            {commentsCount > 0 ? commentsCount : ''}
          </Text>
        </TouchableOpacity>

        {/* Share */}
        <TouchableOpacity style={{ alignItems: 'center', marginBottom: 20 }} onPress={handleShare}>
          <Ionicons 
            name="paper-plane" 
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

export const ReelViewer = ({ isVisible, initialPost, onClose, onLike, onComment, onShare }: any) => {
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
  const callbacksRef = useRef({ onClose, onLike, onComment, onShare });

  // Session-level seen IDs — prevents same reel appearing twice
  const seenIdsRef = useRef<Set<string>>(new Set());

  // Watch-time tracking
  const watchStartRef = useRef<number>(Date.now());
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await getProfile();
        setCurrentUser(res.data);
      } catch (e) {
        console.warn('Failed to fetch user in ReelViewer', e);
      }
    };
    if (isVisible) fetchMe();
  }, [isVisible]);

  const [isShareVisible, setIsShareVisible] = useState(false);
  const [isCommentVisible, setIsCommentVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [localComments, setLocalComments] = useState<any[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [activeCommentMenuId, setActiveCommentMenuId] = useState<string | null>(null);

  const handleShareLocal = useCallback((post: any) => {
    setSelectedPost(post);
    setIsShareVisible(true);
  }, []);

  const handleCommentLocal = useCallback(async (post: any) => {
    setSelectedPost(post);
    setIsCommentVisible(true);
    setCommentsLoading(true);
    try {
      const res = await getPostComments(post.id);
      setLocalComments(res.data || []);
    } catch (e) {
      console.warn('Failed to load reel comments', e);
    } finally {
      setCommentsLoading(false);
    }
  }, []);

  const submitLocalComment = async () => {
    if (!selectedPost || !newCommentText.trim() || isSubmittingComment) return;

    const textToPost = newCommentText.trim();
    const tempId = `temp-${Date.now()}`;

    // Create optimistic comment object
    const optimisticComment = {
      id: tempId,
      text: textToPost,
      username: currentUser?.name || 'User',
      user_photo: currentUser?.photo || '',
      created_at: new Date().toISOString(),
      is_optimistic: true,
      user_id: user?.id,
    };

    // Add to UI immediately
    setLocalComments(prev => [optimisticComment, ...prev]);
    setNewCommentText('');
    Keyboard.dismiss();

    setIsSubmittingComment(true);
    try {
      const res = await addPostComment(selectedPost.id, textToPost);
      // Replace temporary comment with real one from server
      setLocalComments(prev => prev.map(c => c.id === tempId ? res.data : c));

      // Update comment count on post
      setSelectedPost((prev: any) => prev ? {
        ...prev,
        comments_count: (Number(prev.comments_count) || 0) + 1,
      } : null);
      setVideos(prev => prev.map(v => {
        if (v.id === selectedPost.id) {
          return {
            ...v,
            comments_count: (Number(v.comments_count) || 0) + 1,
          };
        }
        return v;
      }));
    } catch (e) {
      // Rollback on failure
      setLocalComments(prev => prev.filter(c => c.id !== tempId));
      Alert.alert('Error', 'Could not post comment. Please try again.');
    } finally {
      setIsSubmittingComment(false);
    }
  };

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
      Alert.alert('Error', detail || 'Could not delete comment. Please try again.');
    }
  }, [localComments, selectedPost, videos]);

  const handleCopyLink = async () => {
    const postId = selectedPost?.id;
    if (!postId) return;
    const link = `sanatanlok://post/${postId}`;
    await Clipboard.setStringAsync(link);
    Alert.alert('Link Copied', 'The post link has been copied to your clipboard.');
  };

  const handleExternalShare = async () => {
    if (!selectedPost) return;
    try {
      const link = `sanatanlok://post/${selectedPost.id}`;
      await Share.share({
        message: `${selectedPost.caption || 'Check this reel on Brahmand!'}\n\n${link}`,
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
  callbacksRef.current = { onClose, onLike, onComment, onShare };

  const loadMoreReels = useCallback(async () => {
    if (loadingRef.current || !hasMoreRef.current) return;

    setLoading(true);
    try {
      // Build seen_ids param (cap at 200 to keep URL sane)
      const seenParam = Array.from(seenIdsRef.current).slice(-200).join(',');

      const res = await getPostsFeed(10, 0, 'for_you', seenParam);
      const newPosts = res.data?.items || res.data || [];

      if (newPosts.length === 0) {
        setHasMore(false);
        hasMoreRef.current = false;
      } else {
        setVideos(prev => {
          const existingIds = new Set(prev.map((p: any) => p.id));
          const uniqueNew = newPosts.filter((p: any) => !existingIds.has(p.id));
          // Track seen IDs
          uniqueNew.forEach((p: any) => p.id && seenIdsRef.current.add(p.id));
          return [...prev, ...uniqueNew];
        });
      }
    } catch (error: any) {
      if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
        console.warn('Load more reels timed out — retrying later');
        setHasMore(false);
        hasMoreRef.current = false;
      } else {
        console.error('Load more reels error:', error);
      }
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, []);

  loadMoreRef.current = loadMoreReels;

  useEffect(() => {
    if (isVisible) {
      // Track initial post
      if (initialPost?.id) seenIdsRef.current.add(initialPost.id);
      setVideos([initialPost]);
      setActiveIndex(0);
      setHasMore(true);
      setLoading(false);
      loadingRef.current = false;
      hasMoreRef.current = true;
      watchStartRef.current = Date.now();
      // Increase delay to 2.5s to let the initial video load without API competition
      setTimeout(() => loadMoreReels(), 2500);
    }
  }, [isVisible, initialPost, loadMoreReels]);

  // Send watch event when active reel changes
  const sendWatchEventLocal = useCallback((post: any, watchedMs: number) => {
    if (!post?.id) return;
    const watchSecs = watchedMs / 1000;
    const durSecs = post.duration || post.metadata?.duration_seconds || 30;
    recordWatchEvent(post.id, {
      watch_seconds: watchSecs,
      duration_seconds: durSecs,
      rewatched: false,
    }).catch(() => {}); // fire-and-forget
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
    const nextPost = videos[activeIndex + 1];
    if (!nextPost) return;
    const nextUrl = String(nextPost?.media_url || nextPost?.mediaUrl || '');
    const isNextVideo = /\.(mp4|mov|m4v|webm)(\?|$)/i.test(nextUrl);
    if (isNextVideo && nextUrl) {
      // Pre-warm the cache for the next reel
      fetch(nextUrl, { method: 'GET', headers: { Range: 'bytes=0-1048576' } }).catch(() => { });
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
      onShareLocal={handleShareLocal}
      onCommentLocal={handleCommentLocal}
    />
  ), [activeIndex, isMuted, screenSize, handleShareLocal, handleCommentLocal]);

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
            extraData={{ activeIndex, isMuted }}
            keyExtractor={(item, index) => `${item.id || index}`}
            pagingEnabled={Platform.OS !== 'web'}
            showsVerticalScrollIndicator={false}
            onScroll={handleReelScroll}
            scrollEventThrottle={16}
            onMomentumScrollEnd={handleMomentumScrollEnd}
            onViewableItemsChanged={handleViewableItemsChanged}
            viewabilityConfig={viewabilityConfigRef.current}
            getItemLayout={getItemLayout}
            initialNumToRender={1}
            maxToRenderPerBatch={2}
            windowSize={2}
            removeClippedSubviews={Platform.OS !== 'web'}
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
          }}
        >
          <TouchableOpacity
            style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}
            activeOpacity={1}
            onPress={() => {
              setIsCommentVisible(false);
              setActiveCommentMenuId(null);
            }}
          >
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={{
                backgroundColor: '#FFF',
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                height: '75%',
                paddingTop: 12,
              }}
            >
              <View style={{ width: 40, height: 5, backgroundColor: '#DDD', borderRadius: 3, alignSelf: 'center', marginBottom: 15 }} />
              <Text style={{ fontSize: 16, fontWeight: 'bold', textAlign: 'center', marginBottom: 15 }}>Comments</Text>

              <FlatList
                data={localComments}
                keyExtractor={(item) => String(item.id)}
                renderItem={({ item }) => {
                  const canDelete = item.user_id === user?.id || selectedPost?.user_id === user?.id;
                  return (
                    <View style={{
                      flexDirection: 'row',
                      padding: 15,
                      borderBottomWidth: 0.5,
                      borderBottomColor: '#F0F0F0',
                      alignItems: 'flex-start',
                    }}>
                      <Avatar photo={item.user_photo} name={item.username} size={36} />
                      <View style={{ marginLeft: 12, flex: 1 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={{ fontWeight: 'bold', fontSize: 13, color: '#111' }}>{item.username}</Text>
                            <Text style={{ fontSize: 11, color: '#888', marginLeft: 8 }}>{formatTimeAgo(item.created_at)}</Text>
                          </View>
                          {canDelete && (
                            <TouchableOpacity
                              style={{ padding: 4, marginRight: -4 }}
                              onPress={() => {
                                Alert.alert(
                                  'Delete Comment',
                                  'Are you sure you want to delete this comment?',
                                  [
                                    { text: 'Cancel', style: 'cancel' },
                                    { text: 'Delete', style: 'destructive', onPress: () => handleDeleteComment(item) },
                                  ]
                                );
                              }}
                            >
                              <Ionicons name="trash-outline" size={16} color="#888" />
                            </TouchableOpacity>
                          )}
                        </View>
                        <MentionText
                          text={item.text}
                          style={{ fontSize: 14, color: '#333', marginTop: 4, lineHeight: 18 }}
                        />
                      </View>
                    </View>
                  );
                }}
                ListEmptyComponent={
                  commentsLoading ? (
                    <ActivityIndicator style={{ marginTop: 40 }} color={COLORS.primary} />
                  ) : (
                    <View style={{ marginTop: 60, alignItems: 'center' }}>
                      <Ionicons name="chatbubbles-outline" size={48} color="#CCC" />
                      <Text style={{ color: '#999', marginTop: 10 }}>No comments yet. Be the first!</Text>
                    </View>
                  )
                }
              />

              <View style={{ padding: 15, borderTopWidth: 1, borderTopColor: '#EEE', flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ flex: 1, backgroundColor: '#F5F5F5', borderRadius: 24, paddingHorizontal: 16, paddingVertical: 8, flexDirection: 'row', alignItems: 'center' }}>
                  <MentionInput
                    value={newCommentText}
                    onChangeText={setNewCommentText}
                    placeholder="Add a comment..."
                    style={{ flex: 1 }}
                    inputStyle={{ fontSize: 14, color: '#111', maxHeight: 100 }}
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
                      {isSubmittingComment ? '...' : 'Post'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </KeyboardAvoidingView>
          </TouchableOpacity>
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
});