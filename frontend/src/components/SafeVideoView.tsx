import React, { Component, ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';

/**
 * Checks if a VideoPlayer object is valid and has not been released natively.
 */
export const isPlayerValid = (player: any): boolean => {
  if (!player) return false;
  try {
    if (player.released === true) return false;
    // Accessing a getter on a released SharedObject in expo-modules-core will throw a CodedException.
    const _ = player.status;
    return true;
  } catch (e) {
    return false;
  }
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
