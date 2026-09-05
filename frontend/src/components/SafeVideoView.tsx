import React, { Component, ReactNode, useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Platform, Image, AppState } from 'react-native';

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
    const _live = player.isLive;
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

const actuallyReleasePlayer = (p: any) => {
  if (!p) return;
  try {
    if (isPlayerValid(p)) {
      try { p.pause(); } catch (_e) {}
      try {
        if (typeof p.replaceAsync === 'function') p.replaceAsync(null);
        else if (typeof p.replace === 'function') p.replace(null);
      } catch (_e) {}
    }
  } catch (_e) {}
  try {
    if (typeof p.release === 'function') p.release();
    else if (typeof p.destroy === 'function') p.destroy();
  } catch (_e) {}
};

const safeReleasePlayer = (p: any, delayMs = 0) => {
  const doRelease = () => actuallyReleasePlayer(p);
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
  const releaseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seekTimeRef = useRef(0);
  const [appActive, setAppActive] = useState(() => AppState.currentState === 'active');
  const sourceKey = typeof source === 'string' ? source : JSON.stringify(source);
  const prevSourceKeyRef = useRef(sourceKey);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'background') {
        const p = playerRef.current;
        if (p) {
          try {
            if (isPlayerValid(p) && typeof p.currentTime === 'number') {
              seekTimeRef.current = p.currentTime;
            }
          } catch (_e) {}
        }
        setAppActive(false);
      } else if (nextAppState === 'active') {
        setAppActive(true);
      }
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!ExpoVideoModule) return;

    if (prevSourceKeyRef.current !== sourceKey) {
      seekTimeRef.current = 0;
      prevSourceKeyRef.current = sourceKey;
    }

    if (!source || !appActive) {
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

    try {
      newPlayer.staysActiveInBackground = false;
    } catch (_e) {}

    if (setup) {
      try { setup(newPlayer); } catch (e) {
        console.warn('[useSafeVideoPlayer] Error running setup:', e);
      }
    }

    try {
      newPlayer.staysActiveInBackground = false;
    } catch (_e) {}

    if (seekTimeRef.current > 0.25) {
      try {
        newPlayer.currentTime = seekTimeRef.current;
      } catch (_e) {
        try {
          if (typeof newPlayer.seekTo === 'function') newPlayer.seekTo(seekTimeRef.current);
        } catch (_e2) {}
      }
    }

    const stalePlayer = playerRef.current;
    playerRef.current = newPlayer;
    setPlayer(newPlayer);

    if (stalePlayer && stalePlayer !== newPlayer) {
      safeReleasePlayer(stalePlayer, DEFERRED_RELEASE_MS);
    }

    return () => {
      if (releaseTimerRef.current) {
        clearTimeout(releaseTimerRef.current);
        releaseTimerRef.current = null;
      }
      if (newPlayer) {
        try {
          if (isPlayerValid(newPlayer) && typeof newPlayer.currentTime === 'number') {
            seekTimeRef.current = newPlayer.currentTime;
          }
        } catch (_e) {}
        playerRef.current = null;
        setPlayer(null);
        safeReleasePlayer(newPlayer, DEFERRED_RELEASE_MS);
      }
    };
  }, [sourceKey, appActive]);

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
