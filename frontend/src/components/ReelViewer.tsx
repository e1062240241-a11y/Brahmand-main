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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { COLORS } from '../constants/theme';
import { Avatar } from './Avatar';
import api from '../services/api';

let ExpoVideoModule: any = null;
try {
  ExpoVideoModule = require('expo-video');
} catch (error) {
  console.warn('expo-video unavailable:', error);
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const HEADER_HEIGHT = Platform.OS === 'ios' ? 78 : 64;

const useSafeVideoPlayer = (source: string | null, setup: (player: any) => void) => {
  if (!ExpoVideoModule?.useVideoPlayer) return null;
  return ExpoVideoModule.useVideoPlayer(source, setup);
};

const ReelVideoItem = React.memo(({
  post,
  isActive,
  onClose,
  onLike,
  onComment,
  onShare,
  isMuted,
  setIsMuted,
}: any) => {
  const [showPlayPause, setShowPlayPause] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isCaptionExpanded, setIsCaptionExpanded] = useState(false);
  const playPauseAnim = useRef(new Animated.Value(0)).current;
  const [localPost, setLocalPost] = useState(post);
  const videoRef = useRef<any>(null);
  const isLongCaption = !!localPost?.caption && localPost.caption.length > 60;

  useEffect(() => {
    if (!isActive) setIsPaused(false);
  }, [isActive]);

  const mediaUrl = String(localPost?.media_url || localPost?.mediaUrl || '');
  const mediaType = String(localPost?.media_type || localPost?.mediaType || '').toLowerCase();
  const isVideo = mediaType.startsWith('video') || /\.(mp4|mov|m4v|webm)(\?|$)/i.test(mediaUrl);

  const playerSource = (Platform.OS === 'web' || !isVideo) ? null : mediaUrl;
  const player = useSafeVideoPlayer(playerSource, (p) => {
    p.loop = true;
    p.muted = isMuted;
  });

  useEffect(() => {
    if (Platform.OS === 'web') {
      if (videoRef.current) {
        if (isActive && !isPaused) {
          videoRef.current.play().catch(() => { });
        } else {
          videoRef.current.pause();
        }
      }
    } else if (player) {
      if (isActive && !isPaused) {
        player.play();
      } else {
        player.pause();
      }
    }
  }, [isActive, isPaused, player]);

  useEffect(() => {
    if (player) player.muted = isMuted;
  }, [isMuted, player]);

  // Keep pause/mute state global across the reel picker so the next video continues the same state.

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
    <View style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT, backgroundColor: '#000' }}>
      {/* Full Screen Video/Photo - Tap to play/pause wrapper (taps excluded for top header) */}
      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        <View style={[StyleSheet.absoluteFill, { zIndex: 1 }]} pointerEvents="none">
          {!isVideo ? (
            <Image
              source={{ uri: mediaUrl }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="contain"
            />
          ) : Platform.OS === 'web' ? (
            <video
              ref={videoRef}
              src={mediaUrl}
              loop
              muted={isMuted}
              playsInline
              autoPlay={isActive && !isPaused}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          ) : ExpoVideoModule?.VideoView && player ? (
            <ExpoVideoModule.VideoView
              player={player}
              style={{ width: '100%', height: '100%' }}
              contentFit="contain"
              allowsPictureInPicture={false}
              nativeControls={false}
              playsInline={true}
            />
          ) : (
            <View style={{ width: '100%', height: '100%', backgroundColor: '#000' }} />
          )}
        </View>

        {/* Pressable area starts below header so header buttons receive touches */}
        <Pressable
          onPress={handleTapVideo}
          style={{ position: 'absolute', top: HEADER_HEIGHT, left: 0, right: 0, bottom: 0, zIndex: 1 }}
        />
      </View>

      {/* Gradient overlay for readability */}
      <View style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 250,
        backgroundColor: 'rgba(0,0,0,0.5)',
        pointerEvents: 'none'
      }} />

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

      {/* Top Header */}
      <SafeAreaView style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 20,
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
      }} pointerEvents="box-none">
        <TouchableOpacity onPress={onClose} hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}>
          <Ionicons name="close" size={30} color="#FFF" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setIsMuted((prev: boolean) => !prev)} hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}>
          <Ionicons name={isMuted ? 'volume-mute' : 'volume-medium'} size={26} color="#FFF" />
        </TouchableOpacity>
      </SafeAreaView>

      {/* Bottom Left - User Info + Caption */}
      <View
        pointerEvents="box-none"
        style={{
          position: 'absolute',
          bottom: Platform.OS === 'ios' ? 18 : 10,
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
        </View>
        {localPost?.caption ? (
          <View
            style={{
              borderRadius: 14,
              padding: 0,
              maxHeight: isCaptionExpanded ? 240 : 60,
              overflow: 'hidden',
              backgroundColor: 'rgba(0,0,0,0.1)',
            }}
          >
            {isCaptionExpanded && (
              <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
            )}
            <View style={{ padding: 10 }}>
              <ScrollView
                nestedScrollEnabled
                scrollEnabled={isCaptionExpanded}
                showsVerticalScrollIndicator={isCaptionExpanded}
                contentContainerStyle={{ flexGrow: 1 }}
                onStartShouldSetResponder={() => isCaptionExpanded}
                onMoveShouldSetResponder={() => isCaptionExpanded}
              >
                <Text style={{ color: '#fff', fontSize: 14, lineHeight: 20 }} numberOfLines={isCaptionExpanded ? undefined : 2}>
                  {localPost.caption}
                </Text>
              </ScrollView>
              {isLongCaption && (
                <TouchableOpacity onPress={() => setIsCaptionExpanded((prev: boolean) => !prev)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Text style={{ color: '#ccc', marginTop: 6, fontSize: 13, fontWeight: '600' }}>
                    {isCaptionExpanded ? 'Show less' : 'Read more'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ) : null}
      </View>

      {/* Right Side - Action Buttons (Instagram style) */}
      <View pointerEvents="box-none" style={{
        position: 'absolute',
        bottom: Platform.OS === 'ios' ? 28 : 18,
        right: 12,
        alignItems: 'center',
        zIndex: 20,
      }}>
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
  const [videos, setVideos] = useState<any[]>([initialPost]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(1);
  const flatListRef = useRef<FlatList<any>>(null);
  const loadingRef = useRef(false);
  const hasMoreRef = useRef(true);
  const offsetRef = useRef(1);
  const videosRef = useRef<any[]>([]);
  const activeIndexRef = useRef(0);
  const [isMuted, setIsMuted] = useState(false);
  const callbacksRef = useRef({ onClose, onLike, onComment, onShare });
  const loadMoreRef = useRef<() => void>(() => {});

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
        params: { limit: 10, offset: offsetRef.current }
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
    } catch (error) {
      console.error('Load more reels error:', error);
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
    const index = Math.round(offsetY / SCREEN_HEIGHT);
    if (index !== activeIndexRef.current) {
      setActiveIndex(index);
    }
    if (index >= videosRef.current.length - 2 && hasMoreRef.current && !loadingRef.current) {
      loadMoreRef.current();
    }
  }).current;

  const getItemLayout = (_: any, index: number) => ({
    length: SCREEN_HEIGHT,
    offset: SCREEN_HEIGHT * index,
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
      setIsMuted={setIsMuted}
    />
  ), [activeIndex, isMuted]);

  return (
    <Modal
      visible={isVisible}
      transparent={false}
      animationType="slide"
      onRequestClose={callbacksRef.current.onClose}
    >
      <View style={{ flex: 1, backgroundColor: '#000' }}>
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
          initialNumToRender={3}
          maxToRenderPerBatch={5}
          windowSize={7}
          removeClippedSubviews={false}
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
      </View>
    </Modal>
  );
};