import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Dimensions, FlatList, Modal, TouchableOpacity, TouchableWithoutFeedback, Text, Platform, useWindowDimensions, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Video as ExpoAvVideo, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { Avatar } from './Avatar';
import api from '../services/api';

let ExpoVideoModule: any = null;
try {
  ExpoVideoModule = require('expo-video');
} catch (error) {
  console.warn('expo-video unavailable in ReelViewer, using expo-av fallback:', error);
}

const useSafeVideoPlayer = (source: string | null, setup: (player: any) => void) => {
  if (!ExpoVideoModule?.useVideoPlayer) {
    return null;
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return ExpoVideoModule.useVideoPlayer(source, setup);
};

const ReelVideoItem = React.memo(
  ({ post, isActive, onClose, onLike, onComment, onShare, onNext, hasNext }: any) => {
    const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = useWindowDimensions();
  const [isMuted, setIsMuted] = useState(false);
  const [localPost, setLocalPost] = useState(post);
  const mediaUrl = String(localPost?.media_url || '');
  const mediaType = String(localPost?.media_type || '').toLowerCase();
  const isVideo = mediaType.startsWith('video') || /\.(mp4|mov|m4v|webm)(\?|$)/i.test(mediaUrl);

  const playerSource = (Platform.OS === 'web' || !isVideo) ? null : mediaUrl;
  const player = useSafeVideoPlayer(playerSource, (p) => {
    p.loop = true;
    p.muted = isMuted;
    if (isActive) p.play();
  });

  useEffect(() => {
    if (player) {
      if (isActive) player.play();
      else player.pause();
    }
  }, [isActive, player]);

  const handleLike = () => {
    onLike?.(localPost);
    setLocalPost((prev: any) => ({
      ...prev,
      liked_by_me: !prev.liked_by_me,
      likes_count: prev.liked_by_me ? Math.max(0, Number(prev.likes_count) - 1) : Number(prev.likes_count) + 1
    }));
  };

  const handleComment = () => {
    onClose();
    setTimeout(() => {
      onComment?.(localPost);
    }, 300);
  };

  const likedByMe = !!localPost?.liked_by_me;
  const likesCount = Number(localPost?.likes_count || 0);
  const commentsCount = Number(localPost?.comments_count || 0);

  return (
    <View style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT, backgroundColor: '#000' }}>
      <SafeAreaView style={{ position: 'absolute', top: Platform.OS === 'ios' ? 40 : 20, left: 0, right: 0, zIndex: 10, padding: 15, flexDirection: 'row' }}>
        <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="chevron-back" size={32} color="#FFF" style={{ textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 10 }} />
        </TouchableOpacity>
      </SafeAreaView>

      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        {!isVideo ? (
          <Image 
            source={{ uri: mediaUrl }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
        ) : Platform.OS === 'web' ? (
          <video
            src={mediaUrl}
            loop
            muted={isMuted}
            playsInline
            autoPlay={isActive}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            ref={(ref) => {
              if (ref) {
                if (isActive) ref.play().catch(() => {});
                else ref.pause();
              }
            }}
          />
        ) : ExpoVideoModule?.VideoView && player ? (
          <ExpoVideoModule.VideoView
            player={player}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
            allowsPictureInPicture={false}
            nativeControls={false}
            playsInline={true}
          />
        ) : (
          <ExpoAvVideo
            source={{ uri: mediaUrl }}
            style={{ width: '100%', height: '100%' }}
            resizeMode={ResizeMode.COVER}
            shouldPlay={isActive}
            isMuted={isMuted}
            isLooping
            useNativeControls={false}
          />
        )}
      </View>

      {/* Reel-like Overlays */}
      <View pointerEvents="box-none" style={{ position: 'absolute', bottom: Platform.OS === 'ios' ? 100 : 80, left: 15, right: 70, zIndex: 2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
          <Avatar photo={localPost?.user_photo} name={localPost?.username || 'User'} size={40} />
          <Text style={{ color: '#fff', fontWeight: 'bold', marginLeft: 10, fontSize: 16, textShadowColor: 'rgba(0,0,0,0.6)', textShadowRadius: 5 }}>{localPost?.username || 'User'}</Text>
        </View>
        <Text style={{ color: '#fff', fontSize: 14, textShadowColor: 'rgba(0,0,0,0.6)', textShadowRadius: 5 }} numberOfLines={3}>{localPost?.caption || ''}</Text>
      </View>

      <View pointerEvents="box-none" style={{ position: 'absolute', bottom: Platform.OS === 'ios' ? 100 : 80, right: 10, alignItems: 'center', zIndex: 3 }}>
        <TouchableOpacity style={{ alignItems: 'center', marginBottom: 25 }} onPress={handleLike}>
          <Ionicons name={likedByMe ? 'heart' : 'heart-outline'} size={36} color={likedByMe ? COLORS.primary : '#FFF'} style={{ textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 10 }} />
          <Text style={{ color: '#fff', marginTop: 5, fontSize: 13, fontWeight: '600', textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 5 }}>{likesCount}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{ alignItems: 'center', marginBottom: 25 }} onPress={handleComment}>
          <Ionicons name="chatbubble-outline" size={34} color="#FFF" style={{ transform: [{ scaleX: -1 }], textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 10 }} />
          <Text style={{ color: '#fff', marginTop: 5, fontSize: 13, fontWeight: '600', textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 5 }}>{commentsCount}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{ alignItems: 'center', marginBottom: 25 }} onPress={() => onShare?.(localPost)}>
          <Ionicons name="paper-plane-outline" size={34} color="#FFF" style={{ textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 10 }} />
        </TouchableOpacity>
        {hasNext && (
          <TouchableOpacity style={{ alignItems: 'center', marginBottom: 25 }} onPress={onNext}>
            <Ionicons name="chevron-down-circle-outline" size={36} color="#FFF" style={{ textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 10 }} />
            <Text style={{ color: '#fff', marginTop: 5, fontSize: 13, fontWeight: '600', textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 5 }}>Next</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}, (prev: any, next: any) => {
  return (
    prev.post?.id === next.post?.id &&
    prev.isActive === next.isActive &&
    prev.hasNext === next.hasNext &&
    prev.onClose === next.onClose &&
    prev.onLike === next.onLike &&
    prev.onComment === next.onComment &&
    prev.onShare === next.onShare &&
    prev.onNext === next.onNext
  );
});

export const ReelViewer = ({ isVisible, initialPost, onClose, onLike, onComment, onShare }: any) => {
  const REEL_PAGE_SIZE = 20;
  const [videos, setVideos] = useState([initialPost]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [reelOffset, setReelOffset] = useState(0);
  const [reelHasMore, setReelHasMore] = useState(true);
  const [reelLoading, setReelLoading] = useState(false);
  const { height: SCREEN_HEIGHT } = useWindowDimensions();
  const flatListRef = useRef<FlatList<any>>(null);

  const handleNext = useCallback(() => {
    if (activeIndex < videos.length - 1) {
      flatListRef.current?.scrollToOffset({
        offset: (activeIndex + 1) * SCREEN_HEIGHT,
        animated: true,
      });
    }
  }, [activeIndex, SCREEN_HEIGHT, videos.length]);

  const renderItem = useCallback(
    ({ item, index }: { item: any; index: number }) => (
      <ReelVideoItem
        post={item}
        isActive={index === activeIndex}
        onClose={onClose}
        onLike={onLike}
        onComment={onComment}
        onShare={onShare}
        onNext={handleNext}
        hasNext={index < videos.length - 1}
      />
    ),
    [activeIndex, onClose, onLike, onComment, onShare, handleNext, videos.length]
  );

  const loadReelPage = useCallback(async (offset: number, replace: boolean = false) => {
    if (reelLoading || !reelHasMore) {
      return;
    }

    setReelLoading(true);
    try {
      const res = await api.get('/posts/feed', { params: { limit: REEL_PAGE_SIZE, offset } });
      const payload = res.data;
      const incomingItems = Array.isArray(payload) ? payload : (Array.isArray(payload?.items) ? payload.items : []);
      if (incomingItems.length === 0) {
        setReelHasMore(false);
        return;
      }

      setVideos((prev) => {
        const existingIds = new Set(prev.map((item: any) => item?.id));
        const deduped = incomingItems.filter((item: any) => item?.id && !existingIds.has(item.id));
        if (deduped.length === 0) {
          return prev;
        }
        return replace ? [initialPost, ...deduped] : [...prev, ...deduped];
      });
      setReelOffset(offset + incomingItems.length);
      setReelHasMore(incomingItems.length === REEL_PAGE_SIZE);
    } catch (err) {
      console.log('Reel fetch error', err);
    } finally {
      setReelLoading(false);
    }
  }, [initialPost, reelHasMore, reelLoading]);

  useEffect(() => {
    if (isVisible) {
      setVideos([initialPost]);
      setActiveIndex(0);
      setReelOffset(0);
      setReelHasMore(true);
      loadReelPage(0, true);
    } else {
      setActiveIndex(0);
    }
  }, [isVisible, initialPost, loadReelPage]);

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 }).current;
  const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      const nextIndex = viewableItems[0].index;
      if (typeof nextIndex === 'number') {
        setActiveIndex(nextIndex);
        if (nextIndex >= videos.length - 2 && reelHasMore && !reelLoading) {
          loadReelPage(reelOffset);
        }
      }
    }
  }, [videos.length, reelHasMore, reelLoading, reelOffset, loadReelPage]);

  return (
    <Modal visible={isVisible} transparent={false} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        <FlatList
          ref={flatListRef}
          extraData={activeIndex}
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1 }}
          data={videos}
          keyExtractor={(item, index) => String(item.id || index)}
          pagingEnabled
          snapToInterval={SCREEN_HEIGHT}
          snapToAlignment="start"
          decelerationRate="fast"
          showsVerticalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          onScrollEndDrag={({ nativeEvent }) => {
            const offsetY = nativeEvent.contentOffset.y;
            const nextIndex = Math.round(offsetY / SCREEN_HEIGHT);
            const targetOffset = nextIndex * SCREEN_HEIGHT;
            if (Math.abs(offsetY - targetOffset) > SCREEN_HEIGHT * 0.1) {
              flatListRef.current?.scrollToOffset({ offset: targetOffset, animated: true });
            }
          }}
          onMomentumScrollEnd={(event) => {
            const offsetY = event.nativeEvent.contentOffset.y;
            const nextIndex = Math.round(offsetY / SCREEN_HEIGHT);
            if (nextIndex !== activeIndex) {
              setActiveIndex(nextIndex);
            }
            if (nextIndex >= videos.length - 2 && reelHasMore && !reelLoading) {
              loadReelPage(reelOffset);
            }
          }}
          getItemLayout={(data, index) => ({
            length: SCREEN_HEIGHT,
            offset: SCREEN_HEIGHT * index,
            index,
          })}
          initialNumToRender={2}
          maxToRenderPerBatch={2}
          windowSize={3}
          updateCellsBatchingPeriod={50}
          removeClippedSubviews={true}
          renderItem={renderItem}
        />
      </View>
    </Modal>
  );
};
