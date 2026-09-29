import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Image,
  StyleProp,
  ImageStyle,
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
  style: StyleProp<ImageStyle>;
  onPress?: (origin?: { x: number; y: number; width: number; height: number } | null) => void;
  isActive?: boolean;
}

/**
 * CommunityMediaItem
 *
 * 🎨 Varnish Code Quality & Re-render Optimization:
 * 1. Replaced `media: string | any` and `style: any` with strict `MediaObject` and `StyleProp<ImageStyle>` interfaces.
 * 2. Replaced inline style object `{ backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }`
 *    and runtime `StyleSheet.flatten` calls with `localStyles.videoContainer` static StyleSheet rule to eliminate per-render allocations.
 * 3. Added `fadeDuration={0}` to RN Image to prevent image flashing on Android during re-renders.
 */
export const CommunityMediaItem = React.memo(({
  media,
  style,
  onPress,
  isActive = true,
}: CommunityMediaItemProps) => {
  const mediaUrl = typeof media === 'string' ? media : (typeof media === 'object' && media !== null && 'uri' in media ? (media as MediaObject).uri || '' : '');
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

  const containerRef = React.useRef<View>(null);

  const handlePress = React.useCallback(() => {
    if (!onPress) return;
    const node = containerRef.current;
    if (node && 'measureInWindow' in node && typeof (node as any).measureInWindow === 'function') {
      (node as any).measureInWindow((x: number, y: number, width: number, height: number) => {
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

  const Wrapper = onPress ? TouchableOpacity : View;
  const wrapperProps = onPress ? { activeOpacity: 0.9, onPress: handlePress } : {};

  if (isVideo) {
    return (
      <Wrapper ref={containerRef} {...wrapperProps} style={[style, localStyles.videoContainer]}>
        <Ionicons name="play-circle-outline" size={40} color="rgba(255,255,255,0.8)" />
      </Wrapper>
    );
  }

  const imageSource: ImageSourcePropType = typeof media === 'string' ? { uri: media } : (media as ImageSourcePropType);

  return (
    <Wrapper ref={containerRef} {...wrapperProps}>
      <Image
        source={imageSource}
        style={style}
        resizeMode="cover"
        fadeDuration={0}
      />
    </Wrapper>
  );
});

CommunityMediaItem.displayName = 'CommunityMediaItem';

const localStyles = StyleSheet.create({
  videoContainer: {
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CommunityMediaItem;
