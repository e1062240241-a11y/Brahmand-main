import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface CommunityMediaItemProps {
  media: string | any;
  style: any;
  onPress?: () => void;
  isActive?: boolean;
}

export const CommunityMediaItem = React.memo(({
  media,
  style,
  onPress,
  isActive = true,
}: CommunityMediaItemProps) => {
  const mediaUrl = typeof media === 'string' ? media : (media?.uri || '');
  const isVideo = (
    (typeof media === 'object' && media !== null && (
      String(media.type || media.media_type || media.mediaType || '').toLowerCase().startsWith('video')
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

  const Wrapper = onPress ? TouchableOpacity : View;
  const wrapperProps = onPress ? { activeOpacity: 0.9, onPress } : {};

  if (isVideo) {
    return (
      <Wrapper {...wrapperProps} style={[StyleSheet.flatten(style), { backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }]}>
        <Ionicons name="play-circle-outline" size={40} color="rgba(255,255,255,0.8)" />
      </Wrapper>
    );
  }

  return (
    <Wrapper {...wrapperProps}>
      <Image
        source={typeof media === 'string' ? { uri: media } : media}
        style={style}
        resizeMode="cover"
      />
    </Wrapper>
  );
});

CommunityMediaItem.displayName = 'CommunityMediaItem';

export default CommunityMediaItem;
