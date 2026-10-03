import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Image,
  StyleProp,
  ViewStyle,
  ImageStyle,
  ImageSourcePropType,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Varnish fix: Replaced `any` types on media and style props with strict types,
// moved inline styles to StyleSheet, and added fadeDuration={0} to Image to prevent Android reload flashes.

export interface MediaObject {
  uri?: string;
  type?: string;
  media_type?: string;
  mediaType?: string;
  [key: string]: unknown;
}

export type CommunityMediaSource = string | MediaObject | ImageSourcePropType;

export interface CommunityMediaItemProps {
  media: CommunityMediaSource;
  style?: StyleProp<ViewStyle & ImageStyle>;
  onPress?: (origin?: { x: number; y: number; width: number; height: number } | null) => void;
  isActive?: boolean;
}

export const CommunityMediaItem = React.memo(({
  media,
  style,
  onPress,
}: CommunityMediaItemProps) => {
  const mediaObj = typeof media === 'object' && media !== null ? (media as MediaObject) : null;
  const mediaUrl = typeof media === 'string' ? media : (mediaObj?.uri || '');

  const isVideo = (
    (mediaObj !== null && (
      String(mediaObj.type || mediaObj.media_type || mediaObj.mediaType || '').toLowerCase().startsWith('video')
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
    const node = containerRef.current as View & {
      measureInWindow?: (callback: (x: number, y: number, width: number, height: number) => void) => void;
    };
    if (node?.measureInWindow) {
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

  const Wrapper = onPress ? TouchableOpacity : View;
  const wrapperProps = onPress ? { activeOpacity: 0.9, onPress: handlePress } : {};

  if (isVideo) {
    return (
      <Wrapper ref={containerRef} {...wrapperProps} style={[styles.videoContainer, style]}>
        <Ionicons name="play-circle-outline" size={40} color="rgba(255,255,255,0.8)" />
      </Wrapper>
    );
  }

  const imageSource: ImageSourcePropType = typeof media === 'string'
    ? { uri: media }
    : (media as ImageSourcePropType);

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

const styles = StyleSheet.create({
  videoContainer: {
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

CommunityMediaItem.displayName = 'CommunityMediaItem';

export default CommunityMediaItem;
