// accessibility: placeholder
import React, { useState, useEffect, useRef, useCallback, memo, useMemo } from 'react';
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
  TextInput,
  AppState,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useIsFocused } from "expo-router/react-navigation";

import { API_URL } from '../services/api';
import { COLORS, SPACING } from '../constants/theme';
import { Avatar } from './Avatar';
import { ReelViewer } from './ReelViewer';
import NativeVideoPlayer from './NativeVideoPlayer';
import { formatTimeAgo, formatDateTimeIST, formatReelDate } from '../utils/dateUtils';
import { useGlobalMute } from '../contexts/MuteContext';
import { getFilterStyle, getOverlayStyle } from '../utils/filters';
import { useTranslation } from '../utils/i18n';
import { useTabBar } from '../contexts/TabBarContext';

const { width: SCREEN_WIDTH_DEFAULT } = Dimensions.get('window');



type PostFeedCardProps = {
  distanceFromActive?: number;
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
  isFocused?: boolean;
  onLayout?: (event: any) => void;
  theme?: 'light' | 'dark';
  openCommentsOnCaptionPress?: boolean;
  isBlackBackground?: boolean;
  isFirstReel?: boolean;
  isEditing?: boolean;
  editedCaption?: string;
  onChangeEditedCaption?: (text: string) => void;
  onCancelEdit?: () => void;
  onSaveEdit?: () => void;
  isSavingEdit?: boolean;
};

const formatTime = (raw: any) => {
  if (!raw) return 'now';
  const date = new Date(raw);
  if (isNaN(date.getTime())) return 'now';
  return formatDateTimeIST(date);
};

const parseCaption = (caption: string): { text: string; isHashtag: boolean; isMention: boolean }[] => {
  const parts = caption.split(/(#\w+|@\w+)/g);
  return parts.map((part) => ({
    text: part,
    isHashtag: part.startsWith('#'),
    isMention: part.startsWith('@'),
  }));
};

const PostFeedCardComponent = ({
  post,
  distanceFromActive = 0,
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
  isFocused: isFocusedProp,
  onLayout,
  theme = 'light',
  openCommentsOnCaptionPress = false,
  isBlackBackground = false,
  isFirstReel = false,
  isEditing = false,
  editedCaption = '',
  onChangeEditedCaption,
  onCancelEdit,
  onSaveEdit,
  isSavingEdit = false,
}: PostFeedCardProps) => {
  const { t, language } = useTranslation();
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const isFocusedNav = useIsFocused();
  const isFocused = isFocusedProp ?? isFocusedNav;
  const filterName = post?.filter_name || post?.metadata?.filter_name || 'Normal';
  const [isPausedByUser, setIsPausedByUser] = useState(false);
  const { isGloballyMuted: isMuted, toggleMute: toggleMute } = useGlobalMute();
  const [menuVisible, setMenuVisible] = useState(false);
  const menuAnim = useRef(new Animated.Value(0)).current;

  const openMenu = useCallback(() => {
    setMenuVisible(true);
    Animated.spring(menuAnim, {
      toValue: 1,
      tension: 240,
      friction: 16,
      useNativeDriver: true,
    }).start();
  }, [menuAnim]);

  const closeMenu = useCallback((callback?: () => void) => {
    Animated.timing(menuAnim, {
      toValue: 0,
      duration: 120,
      useNativeDriver: true,
    }).start(() => {
      setMenuVisible(false);
      callback?.();
    });
  }, [menuAnim]);

  const toggleMenu = useCallback(() => {
    if (menuVisible) {
      closeMenu();
    } else {
      openMenu();
    }
  }, [menuVisible, openMenu, closeMenu]);

  const [isFullscreen, setIsFullscreen] = useState(false);

  // Tab bar visibility control
  let showTabBar: (() => void) | undefined;
  let hideTabBar: (() => void) | undefined;
  try {
    const tabBar = useTabBar();
    showTabBar = tabBar.showTabBar;
    hideTabBar = tabBar.hideTabBar;
  } catch (e) { }

  useEffect(() => {
    if (isFullscreen) {
      hideTabBar?.();
    } else {
      showTabBar?.();
    }
  }, [isFullscreen]);
  const [mediaLoading, setMediaLoading] = useState(true);
  const [showSpinner, setShowSpinner] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const w = Number(post?.media_width || post?.metadata?.width);
  const h = Number(post?.media_height || post?.metadata?.height);
  const initialRawRatio = (w && h) ? (w / h) : null;

  const [dynamicRatio, setDynamicRatio] = useState(initialRawRatio || 4 / 5);
  const [isCaptionExpanded, setIsCaptionExpanded] = useState(false);
  const [shouldLoadVideo, setShouldLoadVideo] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const hasLoadedOnceRef = useRef(false);

  useEffect(() => {
    if (isActive && isFocused && !hasLoadedOnceRef.current) {
      hasLoadedOnceRef.current = true;
      setShouldLoadVideo(true);
    }

    // Unmount if scrolled far away
    if (distanceFromActive > 3) {
      setShouldLoadVideo(false);
      setIsVideoReady(false);
      hasLoadedOnceRef.current = false; // Reset so it reloads if scrolled back
    }
  }, [isActive, isFocused, distanceFromActive]);

  useEffect(() => {
    hasLoadedOnceRef.current = false;
    setShouldLoadVideo(false);
    setIsVideoReady(false);
    setMediaLoading(true);
  }, [post?.id]);

  useEffect(() => {
    if (initialRawRatio) {
      setDynamicRatio(initialRawRatio);
    }
  }, [initialRawRatio]);

  const rawMediaUrl =
    post?.media_url ||
    post?.mediaUrl ||
    post?.image_url ||
    post?.imageUrl ||
    post?.image ||
    post?.thumbnail_url ||
    post?.thumbnailUrl;

  const posterUrl = String(
    post?.thumbnail_url || post?.thumbnailUrl || post?.metadata?.thumbnail_url || post?.metadata?.thumbnailUrl || rawMediaUrl || ''
  );
  let mediaUrl = rawMediaUrl ? String(rawMediaUrl) : '';
  if (mediaUrl.includes('.a.run.app') && mediaUrl.startsWith('http://')) {
    mediaUrl = mediaUrl.replace('http://', 'https://');
  }

  const [imageUri, setImageUri] = useState(mediaUrl);
  const [videoPosterUrl, setVideoPosterUrl] = useState(posterUrl);
  const [showFallback, setShowFallback] = useState(Platform.OS !== 'android');

  useEffect(() => {
    if (Platform.OS === 'android') {
      if (mediaUrl) {
        setShowFallback(false);
      } else {
        const timer = setTimeout(() => {
          setShowFallback(true);
        }, 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [mediaUrl]);

  useEffect(() => {
    setImageUri(mediaUrl);
  }, [mediaUrl]);

  useEffect(() => {
    setVideoPosterUrl(posterUrl);
  }, [posterUrl]);

  // ponytail: removed 1MB preload fetch — caused iOS overheating. web preloads fine via <video preload>


  const handleImageError = (e: any) => {
    if (imageUri && imageUri.includes('b-cdn.net')) {
      const urlParts = imageUri.split('b-cdn.net/');
      if (urlParts.length > 1) {
        const filePath = urlParts[1];
        const fallbackUrl = `${API_URL}/api/bunny-media/${filePath}`;
        setImageUri(fallbackUrl);
        return;
      }
    }
    setMediaLoading(false);
    setMediaError(t('language') === 'hi' ? 'छवि लोड करने में विफल' : 'Failed to load image');
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

  const rawMediaType =
    post?.media_type ||
    post?.mediaType ||
    post?.type;

  const mediaType = rawMediaType ? String(rawMediaType).toLowerCase() : '';

  const isVideo = mediaType.startsWith('video') || /\.(mp4|mov|m4v|webm)(\?|$)/i.test(mediaUrl);

  const displayRatio = dynamicRatio;
  const feedHeight = SCREEN_WIDTH / displayRatio;

  const cropStyle = useMemo(() => {
    const cropX = post?.crop_offset_x ?? post?.metadata?.crop_offset_x;
    const cropY = post?.crop_offset_y ?? post?.metadata?.crop_offset_y;

    if (cropX === undefined && cropY === undefined) {
      return null;
    }

    const origW = post?.original_width ?? post?.metadata?.original_width;
    const origH = post?.original_height ?? post?.metadata?.original_height;

    if (!origW || !origH) {
      return null;
    }

    const rOrig = origW / origH;
    const cardHeight = feedHeight;

    const imgWidth = displayRatio < rOrig ? cardHeight * rOrig : SCREEN_WIDTH;
    const imgHeight = displayRatio > rOrig ? SCREEN_WIDTH / rOrig : cardHeight;

    const maxDragX = imgWidth - SCREEN_WIDTH;
    const maxDragY = imgHeight - cardHeight;

    const targetCropX = cropX !== undefined ? cropX : 0.5;
    const targetCropY = cropY !== undefined ? cropY : 0.5;

    const translateX = maxDragX > 0 ? -targetCropX * maxDragX : 0;
    const translateY = maxDragY > 0 ? -targetCropY * maxDragY : 0;

    const transformStyle = Platform.OS === 'web'
      ? `translateX(${translateX}px) translateY(${translateY}px)`
      : [
        { translateX },
        { translateY }
      ];

    return {
      position: 'absolute' as const,
      left: 0,
      top: 0,
      width: imgWidth,
      height: imgHeight,
      transform: transformStyle as any
    };
  }, [post, displayRatio, feedHeight]);

  const [appState, setAppState] = useState(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      setAppState(nextAppState);
    });
    return () => subscription.remove();
  }, []);

  const shouldPlay = Boolean(isFocused && isActive && !isPausedByUser && !isFullscreen && appState === 'active');
  const videoRef = useRef<any>(null);

  useEffect(() => {
    if (Platform.OS === 'web' && videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

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
    if (Platform.OS === 'web' && videoRef.current) {
      if (shouldPlay) {
        videoRef.current.play().catch((e: any) => {
          console.warn('[PostFeedCard] Web Video Play Error:', e);
        });
      } else {
        videoRef.current.pause();
      }
    }
  }, [shouldPlay]);

  // Clean up player on unmount
  useEffect(() => {
    return () => {
      if (Platform.OS === 'web' && videoRef.current) {
        try {
          videoRef.current.pause();
        } catch (e) { }
      }
    };
  }, []);

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
  const touchMoved = useRef<boolean>(false);
  const touchStartTime = useRef<number>(0);
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

  // ponytail: rapid instagram double-tap pink heart pop & float up animation
  const triggerInstagramHeart = (tapX?: number, tapY?: number) => {
    const id = `${Date.now()}-${Math.random()}`;
    const x = tapX && tapX > 0 ? tapX : SCREEN_WIDTH / 2;
    const y = tapY && tapY > 0 ? tapY : feedHeight / 2;
    const rotation = `${(Math.random() - 0.5) * 30}deg`;

    const scale = new Animated.Value(0);
    const opacity = new Animated.Value(0);
    const translateY = new Animated.Value(0);

    const newHeart: InstagramHeartItem = { id, x, y, rotation, scale, opacity, translateY };
    setInstagramHearts(prev => [...prev, newHeart]);

    Animated.parallel([
      Animated.sequence([
        Animated.spring(scale, {
          toValue: 1.2,
          friction: 3,
          tension: 260,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1.35,
          duration: 180,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          delay: 50,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(translateY, {
        toValue: -95,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setInstagramHearts(prev => prev.filter(h => h.id !== id));
    });
  };

  const handleDoubleTapLike = (tapX?: number, tapY?: number) => {
    triggerInstagramHeart(tapX, tapY);
    if (!likedByMe) {
      onLike?.(post);
    }
  };

  const handleTouchStart = (e: any) => {
    touchStartX.current = e.nativeEvent.pageX;
    touchStartY.current = e.nativeEvent.pageY;
    touchStartTime.current = Date.now();
    touchMoved.current = false;
    if (e.nativeEvent.locationX !== undefined && e.nativeEvent.locationY !== undefined) {
      lastTapCoords.current = {
        x: e.nativeEvent.locationX,
        y: e.nativeEvent.locationY,
      };
    }
    swipeDetected.current = false;
  };

  const handleTouchEnd = (e: any) => {
    const deltaX = e.nativeEvent.pageX - touchStartX.current;
    const deltaY = e.nativeEvent.pageY - touchStartY.current;

    // Track whether the finger moved significantly during this touch.
    // A scroll gesture (or any finger drift) must not be treated as a tap,
    // otherwise an accidental touch while browsing opens the full-screen reel.
    if (Math.abs(deltaX) > 12 || Math.abs(deltaY) > 12) {
      touchMoved.current = true;
    }

    // Detect swipe (horizontal drag in either direction)
    if (Math.abs(deltaX) > 60 && Math.abs(deltaY) < 30) {
      swipeDetected.current = true;
      setIsFullscreen(true);
    }
  };

  const handleMediaPress = (e?: any) => {
    if (swipeDetected.current) return;

    // Ignore scroll/finger drift touches — they shouldn't trigger tap actions
    if (touchMoved.current) return;

    if (e?.nativeEvent?.locationX !== undefined && e?.nativeEvent?.locationY !== undefined) {
      lastTapCoords.current = {
        x: e.nativeEvent.locationX,
        y: e.nativeEvent.locationY,
      };
    }

    const now = Date.now();
    const DOUBLE_TAP_DELAY = 350;
    if (now - lastTapRef.current < DOUBLE_TAP_DELAY && lastTapRef.current !== 0) {
      lastTapRef.current = 0;
      handleDoubleTapLike(lastTapCoords.current.x, lastTapCoords.current.y);
    } else {
      lastTapRef.current = now;
      // Single tap: open full screen for video posts
      setTimeout(() => {
        if (Date.now() - lastTapRef.current >= DOUBLE_TAP_DELAY && lastTapRef.current !== 0) {
          if (isVideo) {
            setIsFullscreen(true);
          }
        }
      }, DOUBLE_TAP_DELAY);
    }
  };
  const likesCount = Number(post?.likes_count || 0);
  const commentsCount = Number(post?.comments_count || 0);
  const viewsCount = Number(post?.views_count || 0);
  const topComments = Array.isArray(post?.top_comments) ? post.top_comments.slice(0, 5) : [];
  const captionText = String(post?.caption || '').trim();

  const { captionWords, collapsedCaption, isLongCaption } = useMemo(() => {
    const words = captionText.split(/\s+/).filter(Boolean);
    const collapsed = words.slice(0, 4).join(' ') + (words.length > 4 ? '...' : '');
    return {
      captionWords: words,
      collapsedCaption: collapsed,
      isLongCaption: words.length > 4
    };
  }, [captionText]);

  const captionSegments = useMemo(() => {
    if (!captionText) return [];
    return parseCaption(captionText);
  }, [captionText]);
  const router = useRouter();
  const postedAt = post?.created_at || post?.createdAt || post?.createdAtUtc || post?.created_at || null;
  const isReel = post?.category === 'reels' || isVideo;
  const postTimeText = isReel ? formatReelDate(postedAt, language) : formatTimeAgo(postedAt);

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
      {isEditing ? (
        <View style={styles.editHeaderRow}>
          <TouchableOpacity
            onPress={onCancelEdit}
            style={styles.editHeaderBtn}
            disabled={isSavingEdit}
            accessibilityRole="button"
            accessibilityLabel={t('cancel')}
          >
            <Text style={styles.editHeaderCancelText}>{t('cancel')}</Text>
          </TouchableOpacity>
          <Text style={styles.editHeaderTitle}>{t('language') === 'hi' ? 'जानकारी संपादित करें' : 'Edit Info'}</Text>
          <TouchableOpacity
            onPress={onSaveEdit}
            style={styles.editHeaderBtn}
            disabled={isSavingEdit}
            accessibilityRole="button"
            accessibilityLabel={t('language') === 'hi' ? 'हो गया' : 'Done'}
            accessibilityState={{ disabled: isSavingEdit, busy: isSavingEdit }}
          >
            {isSavingEdit ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <Text style={styles.editHeaderDoneText}>{t('language') === 'hi' ? 'हो गया' : 'Done'}</Text>
            )}
          </TouchableOpacity>
        </View>
      ) : (
        <View style={[styles.headerRow, isFirstReel && { backgroundColor: '#FFFFFF', paddingTop: SPACING.md, paddingBottom: SPACING.md }]}>
          <TouchableOpacity
            style={styles.userPressWrap}
            onPress={() => onUserPress?.(post)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={`View profile of ${post?.username || 'User'}`}
          >
            <Avatar name={post?.username || 'User'} photo={post?.user_photo} size={34} />
            <View style={styles.userMeta}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={[styles.username, (theme === 'light' || isFirstReel) ? styles.usernameLight : { color: '#FFF' }]}>{post?.username || 'User'}</Text>
                {post?.is_verified && <MaterialCommunityIcons name="check-decagram" size={14} color="#FF6B00" style={{ marginLeft: 4 }} />}
              </View>
              <Text style={[styles.timeText, (theme === 'light' || isFirstReel) ? styles.timeTextLight : { color: '#FFFFFF', fontWeight: '900' }]}>{postTimeText}</Text>
            </View>
          </TouchableOpacity>

          {onPostMenuPress && postMenuType && (
            <View style={styles.menuWrap}>
              <Pressable
                style={({ pressed }) => [
                  styles.menuBtn,
                  pressed && { backgroundColor: (theme === 'light' || isFirstReel) ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.15)' }
                ]}
                android_ripple={{
                  color: (theme === 'light' || isFirstReel) ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.2)',
                  borderless: false,
                  radius: 20,
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                onPress={toggleMenu}
                accessibilityRole="button"
                accessibilityLabel={t('openMenu')}
              >
                <View style={{ justifyContent: 'center', alignItems: 'flex-end', width: 24, height: 18 }}>
                  <View style={{ width: 22, height: 3, backgroundColor: (theme === 'light' || isFirstReel) ? '#333' : '#FFFFFF', borderRadius: 1.5, marginBottom: 4 }} />
                  <View style={{ width: 14, height: 3, backgroundColor: (theme === 'light' || isFirstReel) ? '#333' : '#FFFFFF', borderRadius: 1.5 }} />
                </View>
              </Pressable>
              {menuVisible && (
                <Animated.View
                  style={[
                    styles.dropdownMenu,
                    {
                      opacity: menuAnim,
                      transform: [
                        {
                          scale: menuAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.88, 1],
                          }),
                        },
                        {
                          translateY: menuAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [-6, 0],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  {postMenuType === 'delete' && onEdit && (
                    <Pressable
                      style={({ pressed }) => [
                        styles.dropdownItem,
                        styles.dropdownItemBorder,
                        pressed && { backgroundColor: 'rgba(0, 0, 0, 0.06)' },
                      ]}
                      android_ripple={{ color: 'rgba(0, 0, 0, 0.08)', borderless: false }}
                      onPress={() => closeMenu(() => onEdit?.(post))}
                    >
                      <Ionicons name="pencil-outline" size={15} color="#3A3835" />
                      <Text style={styles.dropdownText}>
                        {t('language') === 'hi' ? 'संपादित करें' : 'Edit'}
                      </Text>
                    </Pressable>
                  )}
                  <Pressable
                    style={({ pressed }) => [
                      styles.dropdownItem,
                      styles.dropdownItemBorder,
                      pressed && { backgroundColor: 'rgba(224, 62, 62, 0.08)' },
                    ]}
                    android_ripple={{ color: 'rgba(224, 62, 62, 0.12)', borderless: false }}
                    onPress={() => closeMenu(() => onPostMenuPress?.(post))}
                  >
                    <Ionicons
                      name={postMenuType === 'delete' ? 'trash-outline' : 'flag-outline'}
                      size={15}
                      color="#E03E3E"
                    />
                    <Text style={[styles.dropdownText, styles.dropdownDangerText]}>
                      {postMenuType === 'delete'
                        ? (t('language') === 'hi' ? 'पोस्ट हटाएं' : 'Delete post')
                        : (t('language') === 'hi' ? 'रिपोर्ट करें' : 'Report')}
                    </Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [
                      styles.dropdownItem,
                      pressed && { backgroundColor: 'rgba(0, 0, 0, 0.06)' },
                    ]}
                    android_ripple={{ color: 'rgba(0, 0, 0, 0.08)', borderless: false }}
                    onPress={() => closeMenu()}
                  >
                    <Ionicons name="close-circle-outline" size={15} color="#75716B" />
                    <Text style={styles.dropdownCancelText}>{t('cancel')}</Text>
                  </Pressable>
                </Animated.View>
              )}
            </View>
          )}
        </View>
      )}

      {/* Media */}
      <View style={[styles.mediaWrap, { width: SCREEN_WIDTH, height: feedHeight, backgroundColor: theme === 'light' ? '#F5F5F5' : '#111' }]}>
        {mediaUrl ? (
          isVideo ? (
            <View style={[styles.videoContainer, { overflow: 'hidden' }]}>
              {Platform.OS === 'web' ? (
                <>
                  <video
                    ref={videoRef as any}
                    src={mediaUrl}
                    preload="auto"
                    loop
                    muted={isMuted}
                    autoPlay={isActive && !isPausedByUser}
                    playsInline
                    crossOrigin="anonymous"
                    onLoadStart={() => setMediaLoading(true)}
                    onLoadedData={() => setMediaLoading(false)}
                    onCanPlay={() => setMediaLoading(false)}
                    onWaiting={() => {
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
                    style={cropStyle ? { ...cropStyle, objectFit: 'cover', ...getFilterStyle(filterName) } : { width: '100%', height: '100%', objectFit: 'cover', ...getFilterStyle(filterName) } as any}
                    poster={posterUrl || undefined}
                  />
                  {mediaLoading && (
                    <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.1)' }]}>
                      <ActivityIndicator color={theme === 'light' ? '#FF8F00' : '#FFD26C'} />
                    </View>
                  )}
                  {(Platform.OS as string) !== 'web' && filterName !== 'Normal' && (
                    <View style={[StyleSheet.absoluteFill, getOverlayStyle(filterName)]} pointerEvents="none" />
                  )}
                </>
              ) : (
                <>
                  {/* Poster hamesha niche - memory-disk cache */}
                  <View pointerEvents="none" style={[StyleSheet.absoluteFill, { zIndex: 2, opacity: isVideoReady ? 0 : 1, backgroundColor: '#111' }]}>
                    {videoPosterUrl ? (
                      <Image
                        source={{ uri: videoPosterUrl }}
                        style={[StyleSheet.absoluteFill, getFilterStyle(filterName)]}
                        contentFit="cover"
                        cachePolicy="memory-disk"
                        priority={isActive ? "high" : "low"}
                        transition={0}
                        onLoad={() => {
                          if (!shouldLoadVideo) setMediaLoading(false);
                        }}
                        onError={handlePosterError}
                      />
                    ) : null}
                  </View>

                  {/* Video ek baar load hua to mounted rahega, sirf shouldPlay se pause/play */}
                  {shouldLoadVideo && (
                    <NativeVideoPlayer
                      mediaUrl={mediaUrl}
                      shouldPlay={shouldPlay}
                      isMuted={isMuted}
                      onFirstFrameRender={() => {
                        setMediaLoading(false);
                        setIsVideoReady(true);
                      }}
                      style={[
                        StyleSheet.absoluteFill,
                        { zIndex: 3 },
                        cropStyle ? { ...cropStyle, ...getFilterStyle(filterName) } : { ...getFilterStyle(filterName) }
                      ]}
                      contentFit="cover"
                    />
                  )}
                </>
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
                accessibilityRole="button"
                accessibilityLabel={isMuted ? t('unmute') : t('mute')}
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
              style={[styles.media, { overflow: 'hidden' }]}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              onPress={handleMediaPress}
            >
              <Image
                source={{ uri: imageUri }}
                style={[cropStyle || StyleSheet.absoluteFill, getFilterStyle(filterName)]}
                contentFit="cover"
                transition={0}
                recyclingKey={post.id}
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
                onError={handleImageError}
              />
              {((Platform.OS as string) !== 'web') && filterName !== 'Normal' && (
                <View style={[StyleSheet.absoluteFill, getOverlayStyle(filterName)]} pointerEvents="none" />
              )}
            </Pressable>
          )
        ) : showFallback ? (
          <View style={[styles.media, { backgroundColor: theme === 'light' ? '#FAFAFA' : '#1A1A1A', justifyContent: 'center', alignItems: 'center' }]}>
            <Ionicons name="image-outline" size={40} color="rgba(0,0,0,0.05)" />
            <Text style={{ color: '#888', fontSize: 12, marginTop: 8 }}>{t('language') === 'hi' ? 'सामग्री हटा दी गई है या गायब है' : 'Content removed or missing'}</Text>
          </View>
        ) : (
          <View style={[styles.media, { backgroundColor: theme === 'light' ? '#FAFAFA' : '#1A1A1A', justifyContent: 'center', alignItems: 'center' }]}>
            <ActivityIndicator color={theme === 'light' ? '#FF8F00' : '#FFD26C'} />
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
              <Text style={{ color: '#FFF', fontSize: 12, fontWeight: '900' }}>{t('language') === 'hi' ? 'पुनः प्रयास करें' : 'RETRY'}</Text>
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

        {/* Instagram Double Tap Pink Hearts */}
        {instagramHearts.map(heart => (
          <Animated.View
            key={heart.id}
            style={[
              styles.instaHeartContainer,
              {
                left: heart.x - 45,
                top: heart.y - 45,
                transform: [
                  { translateY: heart.translateY },
                  { scale: heart.scale },
                  { rotate: heart.rotation },
                ],
                opacity: heart.opacity,
              },
            ]}
            pointerEvents="none"
          >
            <View style={styles.instaHeartInner}>
              <Ionicons name="heart" size={92} color="#FFFFFF" style={styles.instaHeartBorder} />
              <Ionicons name="heart" size={82} color="#FF2D55" style={styles.instaHeartMain} />
            </View>
          </Animated.View>
        ))}
      </View>

      {/* Actions */}
      {!isEditing && (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => onLike?.(post)}
            accessibilityRole="button"
            accessibilityLabel={likedByMe ? t('unlike') : t('like')}
          >
            <Ionicons name={likedByMe ? 'heart' : 'heart-outline'} size={26} color={likedByMe ? COLORS.primary : (theme === 'light' ? '#000' : '#FFFFFF')} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => onComment?.(post)}
            accessibilityRole="button"
            accessibilityLabel={t('commentAction')}
          >
            <Ionicons name="chatbubble-outline" size={24} color={theme === 'light' ? '#000' : '#FFFFFF'} />
            {commentsCount > 0 && (
              <Text style={[styles.actionText, theme === 'light' ? styles.actionTextLight : { color: '#FFF' }]}>
                {commentsCount}
              </Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => onShare?.(post)}
            accessibilityRole="button"
            accessibilityLabel={t('share')}
          >
            <Ionicons name="send-outline" size={24} color={theme === 'light' ? '#000' : '#FFFFFF'} style={{ transform: [{ rotate: '-30deg' }, { translateY: -2 }] }} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => onRepost?.(post)}
            accessibilityRole="button"
            accessibilityLabel={t('repost')}
          >
            <Ionicons name="repeat-outline" size={26} color={theme === 'light' ? '#000' : '#FFFFFF'} />
          </TouchableOpacity>
        </View>
      )}

      {/* Stats Summary */}
      {!isEditing && (
        <View style={{ paddingHorizontal: SPACING.md, paddingBottom: 2 }}>
          <Text style={{
            color: theme === 'light' ? '#000' : '#FFFFFF',
            fontWeight: '900',
            fontSize: 14
          }}>
            {likesCount > 0 ? (
              t('language') === 'hi'
                ? `${likesCount.toLocaleString()} पसंद`
                : `${likesCount.toLocaleString()} ${likesCount === 1 ? 'like' : 'likes'}`
            ) : (
              t('language') === 'hi' ? 'पसंद करने वाले पहले बनें' : 'Be the first to like'
            )}
          </Text>
        </View>
      )}

      {/* Caption */}
      {isEditing ? (
        <View style={styles.editCaptionContainer}>
          <View style={styles.editCaptionRow}>
            <Avatar name={post?.username || 'User'} photo={post?.user_photo} size={30} />
            <View style={{ flex: 1, marginLeft: 8 }}>
              <TextInput
                value={editedCaption}
                onChangeText={onChangeEditedCaption}
                style={styles.editCaptionInputInline}
                multiline
                maxLength={500}
                placeholder={t('language') === 'hi' ? 'एक कैप्शन लिखें...' : 'Write a caption...'}
                placeholderTextColor="rgba(255,255,255,0.4)"
              />
              <Text style={styles.charCountTextInline}>{editedCaption?.length || 0}/500</Text>
            </View>
          </View>

          {/* Quick Emoji Helper */}
          <View style={styles.quickEmojisContainerInline}>
            {['✨', '🙏', '🕉️', '🌸', '🚩', '📿'].map((emoji) => (
              <TouchableOpacity
                key={emoji}
                style={styles.quickEmojiBtnInline}
                onPress={() => onChangeEditedCaption?.(((editedCaption || '') + emoji).slice(0, 500))}
                activeOpacity={0.7}
              >
                <Text style={styles.quickEmojiTextInline}>{emoji}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.clearCaptionBtnInline}
              onPress={() => onChangeEditedCaption?.('')}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel={t('clearCaption')}
            >
              <Ionicons name="trash-outline" size={11} color="#FF6B00" />
              <Text style={styles.clearCaptionTextInline}>
                {t('language') === 'hi' ? 'साफ़ करें' : 'Clear'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        captionSegments.length > 0 && (
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
                <Text style={{ fontWeight: '900', color: theme === 'light' ? '#000' : '#FFFFFF' }}>
                  {post?.username || 'User'} {post?.is_verified && <MaterialCommunityIcons name="check-decagram" size={14} color="#FF6B00" style={{ marginRight: 4 }} />}
                </Text>
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
                    <Text key={idx} style={{ color: theme === 'light' ? '#222' : '#FFFFFF', fontWeight: '900' }}>{seg.text}</Text>
                  )
                ) : collapsedCaption}
              </Text>
              {isLongCaption && (
                <Text style={{ color: COLORS.primary, marginTop: 4, fontWeight: '900' }}>
                  {isCaptionExpanded ? (t('language') === 'hi' ? 'कम दिखाएं' : 'Show less') : (t('language') === 'hi' ? 'अधिक' : 'More')}
                </Text>
              )}
            </Pressable>
          </View>
        )
      )}

      {!isEditing && viewsCount > 0 && <Text style={[styles.viewsText, theme === 'light' && { color: '#444' }]}>{viewsCount} {t('language') === 'hi' ? 'व्यूज' : 'views'}</Text>}

      {!isEditing && (
        <TouchableOpacity onPress={() => onComment?.(post)} style={{ paddingHorizontal: SPACING.md, marginTop: 2, marginBottom: 4 }}>
          <Text style={{ color: theme === 'light' ? '#666' : '#FFFFFF', fontSize: 13, fontWeight: '900' }}>
            {commentsCount > 0
              ? (t('language') === 'hi' ? `सभी ${commentsCount} टिप्पणियां देखें` : `View all ${commentsCount} comments`)
              : (t('language') === 'hi' ? 'एक टिप्पणी जोड़ें...' : 'Add a comment...')}
          </Text>
        </TouchableOpacity>
      )}

      {!isEditing && topComments.length > 0 && (
        <View style={styles.topCommentsWrap}>
          {topComments.map((comment: any, index: number) => (
            <Text key={comment.id ?? index} style={styles.topCommentText} numberOfLines={1}>
              <Text style={[styles.topCommentUser, theme === 'light' ? styles.topCommentUserLight : { color: '#FFF' }]}>
                {comment?.username || 'User'} {comment?.is_verified && <MaterialCommunityIcons name="check-decagram" size={12} color="#FF6B00" style={{ marginRight: 2 }} />}
              </Text>
              <Text style={{ color: theme === 'light' ? '#444' : '#FFFFFF', fontSize: 13, fontWeight: '900' }}>{comment?.text || ''}</Text>
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
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'transparent',
    marginBottom: 0,
    paddingBottom: 12,
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
  menuBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  menuWrap: { position: 'relative', zIndex: 1000, elevation: 12 },
  dropdownMenu: {
    position: 'absolute',
    right: 0,
    top: 36,
    minWidth: 152,
    backgroundColor: '#FAF8F5',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#ECE7DE',
    shadowColor: '#2D2214',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 16,
    zIndex: 1001,
    overflow: 'hidden',
    paddingVertical: 4,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 9,
  },
  dropdownItemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#EBE6DE',
  },
  dropdownText: {
    color: '#2E2B28',
    fontSize: 13.5,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  dropdownDangerText: {
    color: '#E03E3E',
    fontWeight: '600',
  },
  dropdownCancelText: {
    color: '#75716B',
    fontSize: 13.5,
    fontWeight: '600',
  },
  mediaWrap: { backgroundColor: '#000', overflow: 'hidden', position: 'relative' },
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
  instaHeartContainer: {
    position: 'absolute',
    width: 90,
    height: 90,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99999,
  },
  instaHeartInner: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF2D55',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
    elevation: 10,
  },
  instaHeartBorder: {
    position: 'absolute',
  },
  instaHeartMain: {
    position: 'absolute',
  },
  editHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    height: 48,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  editHeaderBtn: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editHeaderCancelText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '500',
  },
  editHeaderTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  editHeaderDoneText: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: '700',
  },
  editCaptionContainer: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  editCaptionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  editCaptionInputInline: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 18,
    minHeight: 60,
    maxHeight: 120,
    padding: 0,
    textAlignVertical: 'top',
  },
  charCountTextInline: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 10,
    fontWeight: '600',
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  quickEmojisContainerInline: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
    flexWrap: 'wrap',
  },
  quickEmojiBtnInline: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  quickEmojiTextInline: {
    fontSize: 14,
  },
  clearCaptionBtnInline: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 107, 0, 0.1)',
    marginLeft: 'auto',
    gap: 4,
  },
  clearCaptionTextInline: {
    color: '#FF6B00',
    fontSize: 10,
    fontWeight: '700',
  },
});

export const PostFeedCard = memo(
  PostFeedCardComponent,
  (prevProps, nextProps) => {
    return (
      prevProps.post?.id === nextProps.post?.id &&
      prevProps.post?.likes_count === nextProps.post?.likes_count &&
      prevProps.post?.liked_by_me === nextProps.post?.liked_by_me &&
      prevProps.post?.comments_count === nextProps.post?.comments_count &&
      prevProps.post?.caption === nextProps.post?.caption &&
      prevProps.post?.media_url === nextProps.post?.media_url &&
      prevProps.isActive === nextProps.isActive &&
      prevProps.isFocused === nextProps.isFocused &&
      prevProps.distanceFromActive === nextProps.distanceFromActive
    );
  }
);

PostFeedCard.displayName = 'PostFeedCard';

export default PostFeedCard;