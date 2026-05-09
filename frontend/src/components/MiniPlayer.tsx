import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Animated,
  Image,
  Dimensions,
  PanResponder,
} from 'react-native';
import { usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

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

type MiniPlayerPost = {
  id: string;
  media_url?: string;
  mediaUrl?: string;
  username?: string;
  user_photo?: string;
  caption?: string;
} | null;

type MiniPlayerContextType = {
  post: MiniPlayerPost;
  show: (post: any) => void;
  hide: () => void;
  onReopen?: ((post: any) => void) | null;
  setOnReopen: (fn: ((post: any) => void) | null) => void;
};

const MiniPlayerContext = createContext<MiniPlayerContextType>({
  post: null,
  show: () => {},
  hide: () => {},
  onReopen: null,
  setOnReopen: () => {},
});

export const useMiniPlayer = () => useContext(MiniPlayerContext);

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PLAYER_SIZE = 100;
const MARGIN = 12;

let GlobalReopenHandler: ((post: any) => void) | null = null;

export const MiniPlayerProvider = ({ children }: { children: React.ReactNode }) => {
  const [post, setPost] = useState<MiniPlayerPost>(null);
  const [onReopen, setOnReopen] = useState<((post: any) => void) | null>(null);

  const show = useCallback((p: any) => setPost(p), []);
  const hide = useCallback(() => {
    setPost(null);
  }, []);

  return (
    <MiniPlayerContext.Provider value={{ post, show, hide, onReopen, setOnReopen }}>
      {children}
      <MiniPlayerUI />
    </MiniPlayerContext.Provider>
  );
};

const MiniPlayerUI = () => {
  const { post, hide, onReopen } = useMiniPlayer();
  const pathname = usePathname();
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(100)).current;
  const [pos, setPos] = useState({ x: SCREEN_WIDTH - PLAYER_SIZE - MARGIN, y: 100 });

  const mediaUrl = String(post?.media_url || post?.mediaUrl || '');
  const isVideo = /\.(mp4|mov|m4v|webm)(\?|$)/i.test(mediaUrl);

  const playerSource = (Platform.OS === 'web' || !isVideo || !post) ? null : mediaUrl;
  const [isMuted, setIsMuted] = useState(false);

  const player = useSafeVideoPlayer(playerSource, (p) => {
    p.loop = true;
    p.muted = false;
    p.staysActiveInBackground = true;
  });

  useEffect(() => {
    if (player) player.muted = isMuted;
  }, [isMuted, player]);

  useEffect(() => {
    if (player && post) {
      player.play();
    } else if (player) {
      player.pause();
    }
  }, [player, post]);

  useEffect(() => {
    if (post) {
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, friction: 8 }).start();
    } else {
      Animated.timing(translateY, { toValue: 100, duration: 200, useNativeDriver: true }).start();
    }
  }, [post]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        translateX.setValue(gesture.dx + (pos.x - (SCREEN_WIDTH - PLAYER_SIZE - MARGIN)));
        translateY.setValue(gesture.dy);
      },
      onPanResponderRelease: () => {
        Animated.spring(translateX, { toValue: 0, useNativeDriver: true, friction: 8 }).start();
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, friction: 8 }).start();
      },
    })
  ).current;

  const handleTap = () => {
    if (onReopen && post) {
      const p = post;
      hide();
      onReopen(p);
    }
  };

  const isHomeScreen = pathname === '/' || pathname === '/home' || pathname === '/(tabs)/home';

  useEffect(() => {
    if (player && isHomeScreen) {
      player.pause();
    } else if (player && post && !isHomeScreen) {
      player.play();
    }
  }, [isHomeScreen, player, post]);

  if (!post || isHomeScreen) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ translateY }] },
      ]}
      {...panResponder.panHandlers}
    >
      <TouchableOpacity activeOpacity={0.9} onPress={handleTap} style={styles.touchArea}>
        <View style={styles.playerWrap}>
          {isVideo && player ? (
            <ExpoVideoModule.VideoView
              player={player}
              style={styles.video}
              contentFit="cover"
              nativeControls={false}
            />
          ) : (
            <Image
              source={{ uri: mediaUrl }}
              style={styles.thumb}
              resizeMode="cover"
            />
          )}
        </View>
        <View style={styles.info}>
          <Text style={styles.username} numberOfLines={1}>{post?.username || 'Video'}</Text>
        </View>
      </TouchableOpacity>
      <View style={styles.actions}>
        <TouchableOpacity onPress={() => setIsMuted(v => !v)} style={styles.muteBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name={isMuted ? 'volume-mute' : 'volume-medium'} size={18} color="#FFF" />
        </TouchableOpacity>
        <TouchableOpacity onPress={hide} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="close" size={18} color="#FFF" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 90,
    right: MARGIN,
    width: PLAYER_SIZE + 60,
    height: PLAYER_SIZE + 20,
    backgroundColor: 'rgba(0,0,0,0.9)',
    borderRadius: 12,
    overflow: 'hidden',
    zIndex: 9999,
    elevation: 20,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    flexDirection: 'row',
    alignItems: 'center',
  },
  touchArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 6,
  },
  playerWrap: {
    width: PLAYER_SIZE - 12,
    height: PLAYER_SIZE - 12,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  info: {
    flex: 1,
    paddingHorizontal: 8,
  },
  username: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  actions: {
    alignItems: 'center',
    gap: 6,
    marginRight: 6,
  },
  muteBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default MiniPlayerUI;
