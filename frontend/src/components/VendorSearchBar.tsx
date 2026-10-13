import React, { forwardRef, useEffect, useState, useMemo } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextInputProps,
  LayoutChangeEvent,
  Platform,
  AppState,
  AppStateStatus,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withRepeat,
  withTiming,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import Svg, { Rect, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';

// [OPTIMIZATION 1]: Animate SVG properties purely on the native UI thread
const AnimatedRect = Animated.createAnimatedComponent(Rect);

// Default measurements to eliminate the "double-render" micro-stutter / layout flicker
const DEFAULT_HEIGHT = 52;
const DEFAULT_HORIZONTAL_MARGIN = 20 * 2; // marginHorizontal: 20 on both sides
const INITIAL_WIDTH = Math.max(0, Dimensions.get('window').width - DEFAULT_HORIZONTAL_MARGIN);

export interface VendorSearchBarProps extends Omit<TextInputProps, 'style'> {
  searchTerm: string;
  setSearchTerm: (text: string) => void;
  placeholder?: string;
  containerStyle?: StyleProp<ViewStyle>;
  onClear?: () => void;
}

export const VendorSearchBar = React.memo(
  forwardRef<TextInput, VendorSearchBarProps>(function VendorSearchBar(
    {
      searchTerm,
      setSearchTerm,
      placeholder = 'Search services, pujas, pandits...',
      containerStyle,
      onClear,
      onFocus,
      onBlur,
      ...textInputProps
    },
    ref
  ) {
    const [isFocused, setIsFocused] = useState(false);

    // [FIX 1: Anti-Flicker Initial Layout]: Start with precomputed screen-based dimensions
    // SVG renders on frame 1 without waiting for onLayout callback or flickering at w=0
    const [boxLayout, setBoxLayout] = useState<{ width: number; height: number }>({
      width: INITIAL_WIDTH,
      height: DEFAULT_HEIGHT,
    });

    // SharedValue driving the clockwise trace strictly on the UI thread
    const animProgress = useSharedValue(0);

    // [FIX 3: AppState Memory Leak & Re-mount Cleanliness]:
    // Proper subscription cleanup and safe lifecycle animation controls
    useEffect(() => {
      const startLoop = () => {
        animProgress.value = withRepeat(
          withTiming(1, {
            duration: 3600,
            easing: Easing.linear,
          }),
          -1,
          false
        );
      };

      startLoop();

      const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
        if (nextAppState === 'active') {
          startLoop();
        } else {
          cancelAnimation(animProgress);
        }
      });

      return () => {
        subscription.remove();
        cancelAnimation(animProgress);
      };
    }, [animProgress]);

    const handleClear = () => {
      setSearchTerm('');
      if (onClear) onClear();
    };

    const handleLayout = (e: LayoutChangeEvent) => {
      const { width, height } = e.nativeEvent.layout;
      if (width > 0 && height > 0) {
        setBoxLayout((prev) => {
          // Avoid triggering unnecessary re-renders if layout hasn't changed
          if (Math.abs(prev.width - width) < 0.5 && Math.abs(prev.height - height) < 0.5) {
            return prev;
          }
          return { width, height };
        });
      }
    };

    const strokeWidth = 2.5;
    const pad = 4;
    const w = boxLayout.width;
    const h = boxLayout.height;
    const borderRadius = h > 0 ? h / 2 : 26;

    // Geometric calculations for clockwise SVG stroke along rounded rectangle
    const straightW = Math.max(0, w - 2 * borderRadius);
    const straightH = Math.max(0, h - 2 * borderRadius);
    const perimeter = useMemo(
      () => Math.max(1, 2 * straightW + 2 * straightH + 2 * Math.PI * borderRadius),
      [straightW, straightH, borderRadius]
    );

    // Beam spans ~34% of the perimeter
    const beamLength = perimeter * 0.34;
    const gapLength = perimeter - beamLength;

    // [FIX 2: Reanimated v3 Closure Stale Bug]:
    // Pass [perimeter] dependency array so the worklet updates on device orientation / screen resize
    const animatedProps = useAnimatedProps(() => {
      'worklet';
      return {
        strokeDashoffset: -animProgress.value * perimeter,
      };
    }, [perimeter]);

    const displayPlaceholder = placeholder || 'Search services, pujas, pandits...';

    return (
      <View style={[styles.outerWrapper, containerStyle]}>
        {/* Single lightweight SVG element with bleed wrapper */}
        {w > 0 && h > 0 && (
          <View
            style={[
              styles.svgOverlayContainer,
              {
                top: -pad,
                left: -pad,
                right: -pad,
                bottom: -pad,
                width: w + pad * 2,
                height: h + pad * 2,
              },
            ]}
            pointerEvents="none"
          >
            <Svg
              width={w + pad * 2}
              height={h + pad * 2}
              viewBox={`0 0 ${w + pad * 2} ${h + pad * 2}`}
            >
              <Defs>
                <SvgLinearGradient id="brahmandCoreBeam" x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop offset="0%" stopColor="#FF6600" stopOpacity="0.1" />
                  <Stop offset="25%" stopColor="#FF7A00" stopOpacity="0.8" />
                  <Stop offset="55%" stopColor="#FFA500" stopOpacity="1" />
                  <Stop offset="80%" stopColor="#FFD700" stopOpacity="1" />
                  <Stop offset="100%" stopColor="#FFAE42" stopOpacity="0.2" />
                </SvgLinearGradient>
              </Defs>

              {/* Single Animated Core Rect (runs on UI thread, 0 JS thread overhead) */}
              <AnimatedRect
                x={pad + strokeWidth / 2}
                y={pad + strokeWidth / 2}
                width={Math.max(0, w - strokeWidth)}
                height={Math.max(0, h - strokeWidth)}
                rx={borderRadius - strokeWidth / 2}
                ry={borderRadius - strokeWidth / 2}
                fill="none"
                stroke="url(#brahmandCoreBeam)"
                strokeWidth={strokeWidth}
                strokeDasharray={`${beamLength} ${gapLength}`}
                strokeLinecap="round"
                animatedProps={animatedProps}
              />
            </Svg>
          </View>
        )}

        {/* Inner Capsule with Native Hardware-Accelerated Shadows */}
        <View
          onLayout={handleLayout}
          style={[
            styles.innerCapsule,
            isFocused && styles.innerCapsuleFocused,
          ]}
        >
          {/* Leading Search Icon */}
          <View style={styles.iconContainer}>
            <Ionicons
              name="search"
              size={21}
              color={isFocused ? '#E65100' : '#8A7A6E'}
            />
          </View>

          {/* Central Search Area with Text Input & High-Contrast Typography */}
          <View style={styles.inputWrapper}>
            <TextInput
              ref={ref}
              style={styles.searchInput}
              placeholder={displayPlaceholder}
              placeholderTextColor="#7C6D63"
              value={searchTerm}
              onChangeText={setSearchTerm}
              onFocus={(e) => {
                setIsFocused(true);
                if (onFocus) onFocus(e);
              }}
              onBlur={(e) => {
                setIsFocused(false);
                if (onBlur) onBlur(e);
              }}
              returnKeyType="search"
              autoCapitalize="none"
              autoCorrect={false}
              accessibilityRole="search"
              accessibilityLabel={displayPlaceholder}
              {...textInputProps}
            />
          </View>

          {/* Clear Button */}
          {!!searchTerm && (
            <TouchableOpacity
              onPress={handleClear}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={styles.clearButton}
              accessibilityRole="button"
              accessibilityLabel="Clear search"
            >
              <Ionicons name="close-circle" size={20} color="#A89F91" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  })
);

const styles = StyleSheet.create({
  outerWrapper: {
    position: 'relative',
    height: DEFAULT_HEIGHT,
    marginHorizontal: 20,
    justifyContent: 'center',
  },
  svgOverlayContainer: {
    position: 'absolute',
    zIndex: 1,
    pointerEvents: 'none',
  },
  innerCapsule: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 110, 0, 0.22)',
    // Native iOS GPU compositor shadow
    shadowColor: '#FF8C00',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    // Native Android hardware elevation
    elevation: 3,
  },
  innerCapsuleFocused: {
    borderColor: 'rgba(255, 102, 0, 0.55)',
    backgroundColor: '#FFFFFF',
    shadowOpacity: 0.24,
    shadowRadius: 12,
    elevation: 4,
  },
  iconContainer: {
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputWrapper: {
    flex: 1,
    justifyContent: 'center',
    minHeight: 40,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'System',
    color: '#1C1917',
    paddingVertical: 0,
    letterSpacing: -0.2,
  },
  clearButton: {
    paddingLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default VendorSearchBar;
