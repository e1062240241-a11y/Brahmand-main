import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Platform,
  TouchableOpacity,
  StyleSheet,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { bhaiDoojCornerImage } from '../home/homeConstants';

interface Props {
  onPress: () => void;
  size?: number;
}

/**
 * BhaiDoojCornerAvatar:
 * Displays the original festive Bhai Dooj illustration (brother-sister tilak
 * with "Happy Bhai Dooj" lettering) in its authentic shape with a smooth,
 * stable breathing animation (no glitching/shaking, no circle clipping).
 */
export const BhaiDoojCornerAvatar: React.FC<Props> = React.memo(({
  onPress,
  size = Platform.OS === 'android' ? 46 : 50,
}) => {
  // Fluid breathing pulse animation (sinusoidal ease, zero jitter)
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.04,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: Platform.OS !== 'web',
        }),
      ])
    );
    pulseLoop.start();

    return () => {
      pulseLoop.stop();
    };
  }, [pulseAnim]);

  const handlePress = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (_e) {}
    onPress();
  };

  const imageWidth = size;
  // Authentic aspect ratio matching the 816 x 810 clean illustration
  const imageHeight = Math.round(imageWidth * (810 / 816));

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel="View your profile - Happy Bhai Dooj"
      style={[styles.container, { width: imageWidth, height: imageHeight }]}
    >
      <Animated.Image
        source={bhaiDoojCornerImage}
        style={[
          styles.cornerImage,
          {
            width: imageWidth,
            height: imageHeight,
            transform: [{ scale: pulseAnim }],
          },
        ]}
        resizeMode="contain"
      />
    </TouchableOpacity>
  );
});

export default BhaiDoojCornerAvatar;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    overflow: 'visible',
  },
  cornerImage: {
    // Note: Do NOT add dynamic shadows to Animated.Image on scaling loops
    // as it causes core-animation raster flickering / glitch on iOS & Android.
    backgroundColor: 'transparent',
  },
});
