import React, { useEffect, useState, memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeVideoPlayer, SafeVideoView } from '@/src/components/SafeVideoView';
import { useGlobalMute } from '@/src/contexts/MuteContext';
import { Image as ExpoImage } from 'expo-image';

let ExpoVideoModule: any = null;
try {
  ExpoVideoModule = require('expo-video');
} catch (e) {}

interface VideoPlayerProps {
  videoUrl: string;
  thumbnailUrl?: string;
  isVisible: boolean;
  style?: any;
}

export const VideoPlayer = memo(({ videoUrl, thumbnailUrl, isVisible, style }: VideoPlayerProps) => {
  const { isGlobalMuted } = useGlobalMute();
  const [hasRenderedFirstFrame, setHasRenderedFirstFrame] = useState(false);

  const source = isVisible ? videoUrl : null;

  const player = useSafeVideoPlayer(source, (p) => {
     p.loop = true;
     p.muted = isGlobalMuted;
     p.play();
  });

  useEffect(() => {
    if (player && typeof player.muted !== 'undefined') {
       player.muted = isGlobalMuted;
    }
  }, [isGlobalMuted, player]);

  useEffect(() => {
     if (!isVisible) {
         setHasRenderedFirstFrame(false);
     }
  }, [isVisible]);

  return (
    <View style={[styles.container, style]}>
       {(!isVisible || !hasRenderedFirstFrame) && thumbnailUrl ? (
           <ExpoImage
             source={{ uri: thumbnailUrl }}
             style={[StyleSheet.absoluteFill, { borderRadius: 12 }]}
             contentFit="cover"
             cachePolicy="memory-disk"
           />
       ) : null}

       {isVisible && player && ExpoVideoModule && (
          <SafeVideoView
            player={player}
            ExpoVideoModule={ExpoVideoModule}
            source={videoUrl}
            style={[StyleSheet.absoluteFill, { borderRadius: 12 }]}
            contentFit="cover"
            nativeControls={false}
            allowsPictureInPicture={false}
            playsInline={true}
            onFirstFrameRender={() => setHasRenderedFirstFrame(true)}
          />
       )}
    </View>
  );
});

VideoPlayer.displayName = 'VideoPlayer';

const styles = StyleSheet.create({
  container: {
     overflow: 'hidden',
     backgroundColor: '#000',
  }
});
