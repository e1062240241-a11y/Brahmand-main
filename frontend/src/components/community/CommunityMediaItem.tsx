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

export interface MediaObject {
  uri?: string;
  type?: string;
  media_type?: string;
  mediaType?: string;
  [key: string]: unknown;
}

// Varnish fix: Replaced loose `media: string | any` and `style: any` with strong TypeScript definitions (`MediaObject`, `StyleProp<ImageStyle>`) and extracted video container inline style into StyleSheet.
export interface CommunityMediaItemProps {
  media: string | ImageSourcePropType | MediaObject;
  style?: StyleProp<ImageStyle>;
  onPress?: (origin?: { x: number; y: number; width: number; height: number } | null) => void;
  isActive?: boolean;
}

export const CommunityMediaItem = React.memo(({
  media,
  style,
  onPress,
  isActive = true,
}: CommunityMediaItemProps) => {
  const mediaObj = typeof media === 'object' && media !== null ? (media as Record<string, any>) : null;
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
    const node = containerRef.current as any;
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
      <Wrapper ref={containerRef} {...wrapperProps} style={[StyleSheet.flatten(style), localStyles.videoContainer]}>
        <Ionicons name="play-circle-outline" size={40} color="rgba(255,255,255,0.8)" />
      </Wrapper>
    );
  }

  return (
    <Wrapper ref={containerRef} {...wrapperProps}>
      <Image
        source={typeof media === 'string' ? { uri: media } : media}
        style={style}
        resizeMode="cover"
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
