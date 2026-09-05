import React, { useRef } from 'react';
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

export const SubtleJoinButton = React.memo(({ onPress, style, children }: SubtleJoinButtonProps) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const isPressingRef = useRef(false);

  const handlePressIn = () => {
    Animated.timing(scaleAnim, {
      toValue: 0.96, // Smooth subtle press inward
      duration: 70,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.timing(scaleAnim, {
      toValue: 1, // Smooth linear return without bounce
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    if (isPressingRef.current) return;
    isPressingRef.current = true;
    try {
      onPress?.();
    } finally {
      setTimeout(() => {
        isPressingRef.current = false;
      }, 800);
    }
  };

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        android_ripple={{
          color: 'rgba(255, 107, 0, 0.22)',
          borderless: false,
          foreground: true,
        }}
        style={({ pressed }) => [
          styles.exactJoinBtn,
          Platform.OS === 'ios' && pressed && { backgroundColor: 'rgba(255, 243, 230, 0.95)' },
        ]}
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
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
});

export default SubtleJoinButton;
