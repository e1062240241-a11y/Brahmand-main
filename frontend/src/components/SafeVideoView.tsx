import React, { Component, ReactNode, useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Platform, Image } from 'react-native';

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
const DEFERRED_RELEASE_MS = 500;

const safeReleasePlayer = (p: any, delayMs = 0) => {
  const doRelease = () => {
    try {
      if (isPlayerValid(p)) {
        p.pause();
        if (typeof p.release === 'function') {
          p.release();
        }
      }
    } catch (_e) {}
  };
  if (delayMs > 0) {
    setTimeout(doRelease, delayMs);
  } else {
    doRelease();
  }
};

export const useSafeVideoPlayer = (
  source: string | any | null,
  setup?: (player: any) => void
) => {
  const [player, setPlayer] = useState<any>(null);
  const playerRef = useRef<any>(null);
  // Track pending release timers so we can cancel them if needed
  const releaseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!ExpoVideoModule) return;

    if (!source) {
      // Null source: pause + deferred release current player
      if (playerRef.current) {
        const stale = playerRef.current;
        playerRef.current = null;
        setPlayer(null);
        safeReleasePlayer(stale, DEFERRED_RELEASE_MS);
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

    if (!newPlayer) return;

    // Run setup (mute/loop/play) on the new player
    if (setup) {
      try { setup(newPlayer); } catch (e) {
        console.warn('[useSafeVideoPlayer] Error running setup:', e);
      }
    }

    // Swap ref: deferred-release the old player AFTER React commits new player
    const stalePlayer = playerRef.current;
    playerRef.current = newPlayer;
    setPlayer(newPlayer);

    if (stalePlayer && stalePlayer !== newPlayer) {
      safeReleasePlayer(stalePlayer, DEFERRED_RELEASE_MS);
    }

    // Cleanup on unmount or source change: deferred release
    return () => {
      if (releaseTimerRef.current) {
        clearTimeout(releaseTimerRef.current);
        releaseTimerRef.current = null;
      }
      if (newPlayer) {
        playerRef.current = null;
        safeReleasePlayer(newPlayer, DEFERRED_RELEASE_MS);
      }
    };
  }, [typeof source === 'string' ? source : JSON.stringify(source)]);

  return player;
};

interface SafeVideoViewProps {
  player: any;
  ExpoVideoModule: any;
  source?: string;
  posterSource?: any;
  style?: any;
  contentFit?: any;
  nativeControls?: boolean;
  allowsPictureInPicture?: boolean;
  allowsVideoFrameAnalysis?: boolean;
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
    const { player, ExpoVideoModule, source, posterSource, fallback, ...restProps } = this.props;

    if (Platform.OS === 'web' && source) {
      const fitMode = this.props.contentFit || 'fill';
      const cssObjectFit = fitMode === 'contain' ? 'contain' : (fitMode === 'cover' ? 'cover' : 'fill');
      return (
        <video
          src={source}
          controls={false}
          autoPlay
          playsInline
          style={{
            width: '100%',
            height: '100%',
            objectFit: cssObjectFit,
            borderRadius: 12,
            backgroundColor: 'transparent',
          }}
        />
      );
    }

    if (this.state.hasError || !ExpoVideoModule?.VideoView || !isPlayerValid(player)) {
      if (fallback) return fallback;
      if (posterSource) {
        return <Image source={typeof posterSource === 'string' ? { uri: posterSource } : posterSource} style={[styles.defaultFallback, this.props.style]} resizeMode="cover" />;
      }
      return <View style={[styles.defaultFallback, this.props.style]} />;
    }

    const VideoViewComponent = ExpoVideoModule.VideoView;

    return (
      <VideoViewComponent
        player={player}
        allowsVideoFrameAnalysis={this.props.allowsVideoFrameAnalysis ?? false}
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
