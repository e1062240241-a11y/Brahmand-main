import React from 'react';
import { View, Text, StyleSheet, Pressable, Image, Platform, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, interpolate } from 'react-native-reanimated';
import { useTabBar } from '../contexts/TabBarContext';
import { Svg, Rect } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '../utils/i18n';

const ACTIVE_ORANGE = '#FF8A00';
const INACTIVE_COLOR = '#FFFFFF';
const CAPSULE_BG = Platform.OS === 'android' ? 'rgba(28, 28, 28, 0.85)' : '#1C1C1C';

// Horizontal padding applied to the outer wrapper on each side
const OUTER_H_PADDING = 14;

// The original design was authored against a 373dp tab-bar width.
// All hard-coded positions below are in that coordinate system and are scaled
// at runtime to fit the actual device screen width.
const DESIGN_BAR_WIDTH = 373;

const HIDDEN_ROUTES = new Set(['index', 'legacy_index', 'temple', 'circles', 'discover']);

const TAB_META: Record<string, { activeIcon: string; inactiveIcon: string; labelKey: string }> = {
  home:     { activeIcon: 'home',          inactiveIcon: 'home-outline',          labelKey: 'home'      },
  messages: { activeIcon: 'people',        inactiveIcon: 'people-outline',        labelKey: 'community' },
  vendor:   { activeIcon: 'accessibility', inactiveIcon: 'accessibility-outline', labelKey: 'service'   },
  jaap:     { activeIcon: 'temple',        inactiveIcon: 'temple',                labelKey: 'temple'    },
  profile:  { activeIcon: 'person',        inactiveIcon: 'person-outline',        labelKey: 'profile'   },
};

// Icon centre-X positions in the 373dp design coordinate system.
const DESIGN_ICON_POSITIONS: Record<number, number[]> = {
  0: [63,  160,   215,   270,   325],
  1: [34.5, 131,   224,   276,   328],
  2: [38,   94, 186.5,   279,   335],
  3: [32,   84,   136,   219,   325],
  4: [48,  103,   158,   213,   310],
};
const DEFAULT_ICON_POSITIONS = [38, 113.768, 186.5, 259.232, 335];

const getDesignIconPositions = (activeIndex: number) =>
  DESIGN_ICON_POSITIONS[activeIndex] ?? DEFAULT_ICON_POSITIONS;

// Active-tab capsule widths (design space)
const ACTIVE_TAB_WIDTHS: Record<number, number> = { 0: 126, 1: 126, 2: 100, 3: 104, 4: 126 };
const getActiveTabWidth = (index: number) => ACTIVE_TAB_WIDTHS[index] ?? 100;

// Inactive slot widths (design space)
const getInactiveTabWidth = (index: number) => (index === 0 || index === 4 ? 68 : 60);

// ─── Background capsule geometry (design space, 373-unit) ──────────────────────
interface CapsuleGeometry {
  leftRect: { x: number; w: number } | null;
  rightRect: { x: number; w: number } | null;
  activeRect: { x: number; w: number };
}

function getCapsuleGeometry(activeIndex: number): CapsuleGeometry {
  const safeIndex = activeIndex >= 0 && activeIndex < 5 ? activeIndex : 0;
  const GAP = 6;
  const capsuleH = 67.5;
  const tabWidth = getActiveTabWidth(safeIndex);
  const centerX = getDesignIconPositions(safeIndex)[safeIndex];
  const L_active = centerX - tabWidth / 2;
  const R_active = centerX + tabWidth / 2;

  // When safeIndex === 1 (Community tab is active), Home is index 0.
  // Home icon center is at x = 31. Home circle width is capsuleH (67.5).
  // Home circle center is at 34.5 (left = 0.75, width = 67.5).
  // Community active capsule starts after GAP (0.75 + 67.5 + 6 = 74.25).
  if (safeIndex === 1) {
    const leftW = capsuleH; // 67.5dp width = perfect circle
    const activeX = 74.25;
    return {
      leftRect: { x: 0.75, w: leftW },
      rightRect: R_active < 353 ? { x: R_active + GAP, w: DESIGN_BAR_WIDTH - 0.75 - (R_active + GAP) } : null,
      activeRect: {
        x: activeX,
        w: R_active - activeX,
      },
    };
  }

  return {
    leftRect:  L_active > 20  ? { x: 0.75,        w: L_active - GAP - 0.75                    } : null,
    rightRect: R_active < 353 ? { x: R_active + GAP, w: DESIGN_BAR_WIDTH - 0.75 - (R_active + GAP) } : null,
    activeRect: {
      x: Math.max(0.75, L_active),
      w: Math.min(DESIGN_BAR_WIDTH - 0.75, R_active) - Math.max(0.75, L_active),
    },
  };
}

// Renders background as plain Views (Android – avoids SVG rendering glitches on some devices)
function BackgroundViews({ geom, scaleX }: { geom: CapsuleGeometry; scaleX: number }) {
  const capsuleH = 67.5;
  const radius = 33.75;
  const rects = [geom.leftRect, geom.rightRect, geom.activeRect].filter(Boolean) as { x: number; w: number }[];
  const keys = ['left', 'right', 'active'];
  return (
    <View style={StyleSheet.absoluteFill}>
      {rects.map((r, i) => (
        <View
          key={keys[i]}
          style={{
            position: 'absolute',
            left: r.x * scaleX,
            top: 0.75,
            width: r.w * scaleX,
            height: capsuleH,
            borderRadius: radius,
            backgroundColor: CAPSULE_BG,
          }}
        />
      ))}
    </View>
  );
}

// Renders background as SVG (iOS – crisper on iOS Retina screens)
function BackgroundSvg({ geom, barWidth }: { geom: CapsuleGeometry; barWidth: number }) {
  const scaleX = barWidth / DESIGN_BAR_WIDTH;
  const capsuleH = 67.5;
  const radius = 33.75;
  const rects = [geom.leftRect, geom.rightRect, geom.activeRect].filter(Boolean) as { x: number; w: number }[];
  const keys = ['left', 'right', 'active'];
  return (
    <Svg width={barWidth} height={69} viewBox={`0 0 ${barWidth} 69`} style={{ position: 'absolute', top: 0, left: 0 }}>
      {rects.map((r, i) => (
        <Rect
          key={keys[i]}
          x={r.x * scaleX}
          y={0.75}
          width={r.w * scaleX}
          height={capsuleH}
          rx={radius}
          fill={CAPSULE_BG}
        />
      ))}
    </Svg>
  );
}

export default function CustomTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { tabBarTranslateY } = useTabBar();
  const { t } = useTranslation();

  // ── Responsive geometry ────────────────────────────────────────────────────
  const { width: screenWidth } = useWindowDimensions();
  // Real pixel width the tab bar may occupy (subtract outer padding on both sides)
  const rawBarWidth = Math.max(screenWidth - OUTER_H_PADDING * 2, 200);
  // Capped at the design width of 373 only on Android to prevent stretching/sizing anomalies on wider devices
  const barWidth = Platform.OS === 'android'
    ? Math.min(rawBarWidth, DESIGN_BAR_WIDTH)
    : rawBarWidth;
  // Scale factor to map design-space (373) coordinates to real device pixels
  const scaleX = barWidth / DESIGN_BAR_WIDTH;
  // ──────────────────────────────────────────────────────────────────────────

  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(tabBarTranslateY.value, [0, 150], [1, 0.85], 'clamp');
    const translateY = interpolate(
      tabBarTranslateY.value,
      [0, 150],
      [0, Platform.OS === 'android' ? 15 : 20],
      'clamp'
    );
    return { transform: [{ translateY }, { scale }] };
  });

  const bottomPosition = Platform.OS === 'android'
    ? (insets.bottom > 0 ? insets.bottom + 10 : 20)
    : (insets.bottom > 0 ? Math.max(insets.bottom - 10, 5) : 10);

  const visibleRoutes = state.routes.filter((route: any) => !HIDDEN_ROUTES.has(route.name));



  let activeRoute = visibleRoutes.find(
    (route: any) => state.routes.findIndex((r: any) => r.key === route.key) === state.index
  ) ?? visibleRoutes[0];

  let activeIndex = visibleRoutes.findIndex((r: any) => r.key === activeRoute.key);



  const onTabPress = (route: any, isFocused: boolean) => {
    const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(route.name);
    }
  };

  const renderTabIcon = (routeName: string, focused: boolean) => {
    let activeSrc: any;
    let inactiveSrc: any;

    switch (routeName) {
      case 'home':
        activeSrc   = require('../../assets/images/tab-bar/hoe.webp');
        inactiveSrc = require('../../assets/images/tab-bar/home_outline.webp');
        break;
      case 'messages':
        activeSrc   = require('../../assets/images/tab-bar/comunity2.webp');
        inactiveSrc = require('../../assets/images/tab-bar/community.webp');
        break;
      case 'vendor':
        activeSrc   = require('../../assets/images/tab-bar/ser.webp');
        inactiveSrc = require('../../assets/images/tab-bar/service.webp');
        break;
      case 'jaap':
        activeSrc   = require('../../assets/images/tab-bar/temp.webp');
        inactiveSrc = require('../../assets/images/tab-bar/temple.webp');
        break;
      case 'profile':
        activeSrc   = require('../../assets/images/tab-bar/profile2.webp');
        inactiveSrc = require('../../assets/images/tab-bar/profile.webp');
        break;
      default:
        return (
          <Ionicons
            name={TAB_META[routeName]?.[focused ? 'activeIcon' : 'inactiveIcon'] as any}
            size={22}
            color={focused ? ACTIVE_ORANGE : INACTIVE_COLOR}
            style={focused ? styles.activeIconGlow : undefined}
          />
        );
    }

    return (
      <Image
        source={focused ? activeSrc : inactiveSrc}
        style={{ width: 22, height: 22, tintColor: focused ? ACTIVE_ORANGE : INACTIVE_COLOR }}
        resizeMode="contain"
      />
    );
  };

  const safeActiveIndex = activeIndex >= 0 && activeIndex < 5 ? activeIndex : 0;
  const geom = getCapsuleGeometry(safeActiveIndex);

  // Design-space icon positions for this active index
  const designPositions = getDesignIconPositions(safeActiveIndex);

  return (
    <Animated.View style={[styles.outerContainer, { bottom: bottomPosition }, animatedStyle]}>
      <View style={{ width: barWidth, height: 69, position: 'relative' }}>

        {/* Background capsules */}
        {Platform.OS === 'android' ? (
          <BackgroundViews geom={geom} scaleX={scaleX} />
        ) : (
          <BackgroundSvg geom={geom} barWidth={barWidth} />
        )}

        {/* Tab slots – positions mapped from design space to real pixels */}
        {visibleRoutes.map((route: any, index: number) => {
          const isFocused = activeRoute.key === route.key;
          // Convert design-space centre to real pixel centre
          const realCenterX = designPositions[index] * scaleX;
          // Convert design-space width to real pixel width
          const designW = isFocused
            ? getActiveTabWidth(index)
            : getInactiveTabWidth(index);
          const realW = designW * scaleX;

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={descriptors[route.key]?.options?.tabBarAccessibilityLabel}
              testID={descriptors[route.key]?.options?.tabBarTestID}
              onPress={() => onTabPress(route, isFocused)}
              style={[
                styles.slotContainer,
                { left: realCenterX - realW / 2, width: realW },
              ]}
            >
              {isFocused ? (
                <View style={styles.activeSlotContent}>
                  {renderTabIcon(route.name, true)}
                  <Text style={styles.activeLabel} numberOfLines={1} adjustsFontSizeToFit>
                    {TAB_META[route.name]?.labelKey ? t(TAB_META[route.name].labelKey) : ''}
                  </Text>
                </View>
              ) : (
                <View style={styles.inactiveSlotContent}>
                  {renderTabIcon(route.name, false)}
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    position: 'absolute',
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: OUTER_H_PADDING,
  },
  slotContainer: {
    position: 'absolute',
    ...Platform.select({
      android: { top: 0 },
    }),
    height: 69,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 4,
  },
  activeSlotContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 4,
    gap: 5,
  },
  inactiveSlotContent: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  activeLabel: {
    color: ACTIVE_ORANGE,
    fontSize: 12.5,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  activeIconGlow: {
    textShadowColor: 'rgba(255, 138, 0, 0.7)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
});
