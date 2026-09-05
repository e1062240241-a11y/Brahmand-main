import React, { useEffect, memo } from 'react';
import { AppState } from 'react-native';
import { SafeVideoView, useSafeVideoPlayer, isPlayerValid } from './SafeVideoView';

let ExpoVideoModule: any = null;
try {
  ExpoVideoModule = require('expo-video');
} catch (e) {}

interface NativeVideoPlayerProps {
  mediaUrl: string;
  shouldPlay: boolean;
  isMuted: boolean;
  onFirstFrameRender?: () => void;
  style?: any;
  contentFit?: any;
  fallback?: React.ReactNode;
}

const NativeVideoPlayer: React.FC<NativeVideoPlayerProps> = ({
  mediaUrl,
  shouldPlay,
  isMuted,
  onFirstFrameRender,
  style,
  contentFit,
  fallback,
}) => {
  const player = useSafeVideoPlayer(mediaUrl, (p) => {
    if (p) {
      try {
        p.loop = true;
        p.muted = isMuted;
        p.staysActiveInBackground = false;
        if (p.bufferOptions) {
          p.bufferOptions = {
            preferredForwardBufferDuration: 5,
            minBufferForPlayback: 1,
            maxBufferBytes: 15 * 1024 * 1024,
          };
        }
      } catch (e) {
        console.warn('[NativeVideoPlayer] Error setting player config:', e);
      }
    }
  });

  useEffect(() => {
    if (isPlayerValid(player)) {
      try {
        player.muted = isMuted;
      } catch (e) {}
    }
  }, [isMuted, player]);

  useEffect(() => {
    if (isPlayerValid(player)) {
      try {
        if (shouldPlay && AppState.currentState === 'active') {
          player.play();
        } else {
          player.pause();
        }
      } catch (e) {
        console.warn('[NativeVideoPlayer] player play/pause error:', e);
      }
    }
  }, [shouldPlay, player]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active' && shouldPlay && isPlayerValid(player)) {
        try {
          player.play();
        } catch (_e) {}
      }
    });
    return () => subscription.remove();
  }, [player, shouldPlay]);

  return (
    <SafeVideoView
      player={player}
      ExpoVideoModule={ExpoVideoModule}
      style={style}
      contentFit={contentFit}
      nativeControls={false}
      allowsPictureInPicture={false}
      playsInline={true}
      onFirstFrameRender={onFirstFrameRender}
      fallback={fallback}
    />
  );
};

export default memo(NativeVideoPlayer);
