import React, { Component, ReactNode, useEffect, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';

let ExpoVideoModule: any = null;
try {
  ExpoVideoModule = require('expo-video');
} catch (e) {}

/**
 * Checks if a VideoPlayer object is valid and has not been released natively.
 */
export const isPlayerValid = (player: any): boolean => {
  if (!player) return false;
  try {
    if (player.released === true || player.isReleased === true) return false;
    // Accessing a getter on a released SharedObject in expo-modules-core will throw a CodedException.
    const _ = player.status;
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * Custom hook that wraps expo-video's player creation with safe deferred cleanup,
 * preventing native "Cannot use shared object that was already released" errors
 * during component unmounts and prop reconciliation.
 */
export const useSafeVideoPlayer = (
  source: string | any | null,
  setup?: (player: any) => void
) => {
  const [player, setPlayer] = useState<any>(null);
  const playerRef = useRef<any>(null);

  useEffect(() => {
    if (!ExpoVideoModule) return;
    if (!source) {
      if (playerRef.current) {
        const oldPlayer = playerRef.current;
        playerRef.current = null;
        setPlayer(null);
        setTimeout(() => {
          if (isPlayerValid(oldPlayer)) {
            try {
              oldPlayer.pause();
              oldPlayer.release();
            } catch (e) {}
          }
        }, 300);
      }
      return;
    }

    let newPlayer: any = null;
    try {
      if (ExpoVideoModule.createVideoPlayer) {
        newPlayer = ExpoVideoModule.createVideoPlayer(source);
      } else if (ExpoVideoModule.VideoPlayer) {
        newPlayer = new ExpoVideoModule.VideoPlayer(source);
      }
    } catch (e) {
      console.warn('[useSafeVideoPlayer] Error creating player:', e);
    }

    if (newPlayer) {
      if (setup) {
        try {
          setup(newPlayer);
        } catch (e) {
          console.warn('[useSafeVideoPlayer] Error running setup:', e);
        }
      }

      if (playerRef.current && playerRef.current !== newPlayer) {
        const oldPlayer = playerRef.current;
        setTimeout(() => {
          if (isPlayerValid(oldPlayer)) {
            try {
              oldPlayer.pause();
              oldPlayer.release();
            } catch (e) {}
          }
        }, 300);
      }

      playerRef.current = newPlayer;
      setPlayer(newPlayer);
    }

    return () => {
      if (newPlayer) {
        playerRef.current = null;
        setTimeout(() => {
          if (isPlayerValid(newPlayer)) {
            try {
              newPlayer.pause();
              newPlayer.release();
            } catch (e) {}
          }
        }, 300);
      }
    };
  }, [typeof source === 'string' ? source : JSON.stringify(source)]);

  return player;
};

interface SafeVideoViewProps {
  player: any;
  ExpoVideoModule: any;
  style?: any;
  contentFit?: any;
  nativeControls?: boolean;
  allowsPictureInPicture?: boolean;
  playsInline?: boolean;
  useExoShutter?: boolean;
  onFirstFrameRender?: () => void;
  onError?: (error: any) => void;
  fallback?: ReactNode;
}

interface SafeVideoViewState {
  hasError: boolean;
}

export class SafeVideoView extends Component<SafeVideoViewProps, SafeVideoViewState> {
  state: SafeVideoViewState = { hasError: false };

  static getDerivedStateFromError(_: any): SafeVideoViewState {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.warn('[SafeVideoView] Caught error in VideoView render:', error, errorInfo);
  }

  componentDidUpdate(prevProps: SafeVideoViewProps) {
    if (prevProps.player !== this.props.player && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }

  render() {
    const { player, ExpoVideoModule, fallback, ...restProps } = this.props;

    if (this.state.hasError || !ExpoVideoModule?.VideoView || !isPlayerValid(player)) {
      return fallback || <View style={[styles.defaultFallback, this.props.style]} />;
    }

    const VideoViewComponent = ExpoVideoModule.VideoView;

    return (
      <VideoViewComponent
        player={player}
        {...restProps}
      />
    );
  }
}

const styles = StyleSheet.create({
  defaultFallback: {
    backgroundColor: '#000',
  },
});
