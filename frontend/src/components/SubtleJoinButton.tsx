import React, { useRef, useCallback } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  View,
  ViewStyle,
  StyleProp,
} from 'react-native';

interface SubtleJoinButtonProps {
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

const ANDROID_RIPPLE_CONFIG = {
  color: 'rgba(255, 107, 0, 0.22)',
  borderless: false,
  foreground: true,
};

// Varnish fix: Eliminated render-scope Animated.Value allocation and inline objects/handlers.
// Uses lazy ref initialization to guarantee ref persistence without instantiating Animated.Value on every render pass.
export const SubtleJoinButton = React.memo(({ onPress, style, children }: SubtleJoinButtonProps) => {
  const scaleAnimRef = useRef<Animated.Value | null>(null);
  if (!scaleAnimRef.current) {
    scaleAnimRef.current = new Animated.Value(1);
  }
  const scaleAnim = scaleAnimRef.current;

  const isPressingRef = useRef(false);

  const handlePressIn = useCallback(() => {
    Animated.timing(scaleAnim, {
      toValue: 0.96, // Smooth subtle press inward
      duration: 70,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.timing(scaleAnim, {
      toValue: 1, // Smooth linear return without bounce
      duration: 100,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  const handlePress = useCallback(() => {
    if (isPressingRef.current) return;
    isPressingRef.current = true;
    try {
      onPress?.();
    } finally {
      setTimeout(() => {
        isPressingRef.current = false;
      }, 800);
    }
  }, [onPress]);

  const getStyle = useCallback(
    ({ pressed }: { pressed: boolean }) => [
      styles.exactJoinBtn,
      Platform.OS === 'ios' && pressed && styles.iosPressed,
    ],
    []
  );

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        android_ripple={ANDROID_RIPPLE_CONFIG}
        style={getStyle}
      >
        <View
          pointerEvents="none"
          style={styles.contentContainer}
        >
          {children}
        </View>
      </Pressable>
    </Animated.View>
  );
});

SubtleJoinButton.displayName = 'SubtleJoinButton';

const styles = StyleSheet.create({
  exactJoinBtn: {
    backgroundColor: '#FFF',
    height: 32,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  iosPressed: {
    backgroundColor: 'rgba(255, 243, 230, 0.95)',
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
});

export default SubtleJoinButton;
