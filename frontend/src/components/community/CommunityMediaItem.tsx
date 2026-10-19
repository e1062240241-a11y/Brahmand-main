import React, { useRef, useCallback } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Image,
  StyleProp,
  ImageStyle,
  ViewStyle,
  ImageSourcePropType,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface MediaObject {
  uri?: string;
  type?: string;
  media_type?: string;
  mediaType?: string;
}

export interface CommunityMediaItemProps {
  media: string | MediaObject | ImageSourcePropType;
  style?: StyleProp<ImageStyle | ViewStyle>;
  onPress?: (origin?: { x: number; y: number; width: number; height: number } | null) => void;
  isActive?: boolean;
}

/**
 * 🎨 Varnish Code Quality & Performance Fix:
 * 1. Replaced `any` types for `media` and `style` with explicit TypeScript interfaces (`MediaObject`, `StyleProp<ImageStyle | ViewStyle>`).
 * 2. Added `fadeDuration={0}` to plain React Native `<Image>` component to prevent image reloading flashes during list re-renders/scrolling on Android.
 * 3. Extracted inline video container styles (`backgroundColor`, `justifyContent`, `alignItems`) into `StyleSheet.create`.
 * 4. Added accessibility attributes (`accessibilityRole="button"`, `accessibilityLabel`) to touchable wrapper when `onPress` handler is supplied.
 */
export const CommunityMediaItem = React.memo(({
  media,
  style,
  onPress,
}: CommunityMediaItemProps) => {
  const mediaObj = typeof media === 'object' && media !== null && 'uri' in media ? (media as MediaObject) : null;
  const mediaUrl = typeof media === 'string' ? media : (mediaObj?.uri || '');

  const isVideo = (
    (typeof media === 'object' && media !== null && (
      String((media as MediaObject).type || (media as MediaObject).media_type || (media as MediaObject).mediaType || '').toLowerCase().startsWith('video')
    )) || (
      typeof mediaUrl === 'string' && (
        /\.(mp4|mov|m4v|webm|mkv|3gp|avi)(\?|$)/i.test(mediaUrl) ||
        mediaUrl.toLowerCase().startsWith('video') || 
        mediaUrl.toLowerCase().includes('/video/') || 
        mediaUrl.toLowerCase().includes('_video_') ||
        ((mediaUrl.toLowerCase().includes('expopicker') || mediaUrl.toLowerCase().includes('imagepicker')) && 
         !/\.(jpg|jpeg|png|gif|heic|webp|bmp|tiff|avif)(\?|$)/i.test(mediaUrl))
      )
    )
  );

  const containerRef = useRef<View>(null);

  const handlePress = useCallback(() => {
    if (!onPress) return;
    const node = containerRef.current;
    if (node && typeof node.measureInWindow === 'function') {
      node.measureInWindow((x: number, y: number, width: number, height: number) => {
        if (width > 0 && height > 0) {
          onPress({ x, y, width, height });
        } else {
          onPress(null);
        }
      });
    } else {
      onPress(null);
    }
  }, [onPress]);

  const imageSource = typeof media === 'string' ? { uri: media } : (media as ImageSourcePropType);

  if (isVideo) {
    if (onPress) {
      return (
        <TouchableOpacity
          ref={containerRef}
          activeOpacity={0.9}
          onPress={handlePress}
          style={[style, styles.videoContainer]}
          accessibilityRole="button"
          accessibilityLabel="Play video"
        >
          <Ionicons name="play-circle-outline" size={40} color="rgba(255,255,255,0.8)" />
        </TouchableOpacity>
      );
    }
    return (
      <View ref={containerRef} style={[style, styles.videoContainer]}>
        <Ionicons name="play-circle-outline" size={40} color="rgba(255,255,255,0.8)" />
      </View>
    );
  }

  if (onPress) {
    return (
      <TouchableOpacity
        ref={containerRef}
        activeOpacity={0.9}
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel="View media"
      >
        <Image
          source={imageSource}
          style={style as StyleProp<ImageStyle>}
          resizeMode="cover"
          fadeDuration={0}
        />
      </TouchableOpacity>
    );
  }

  return (
    <View ref={containerRef}>
      <Image
        source={imageSource}
        style={style as StyleProp<ImageStyle>}
        resizeMode="cover"
        fadeDuration={0}
      />
    </View>
  );
});

CommunityMediaItem.displayName = 'CommunityMediaItem';

export default CommunityMediaItem;

const styles = StyleSheet.create({
  videoContainer: {
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
