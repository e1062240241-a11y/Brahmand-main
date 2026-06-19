import React from 'react';
import { View, Text, StyleSheet, Pressable, Image, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, interpolate } from 'react-native-reanimated';
import { useTabBar } from '../contexts/TabBarContext';
import { Svg, Rect } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useCoachMarkStore } from '../utils/coachMarkState';

const ACTIVE_ORANGE = '#FF8A00';
const INACTIVE_COLOR = '#FFFFFF';
const CAPSULE_BG = '#1C1C1C';

const HIDDEN_ROUTES = new Set(['index', 'legacy_index', 'temple', 'circles', 'jobs', 'discover']);

const TAB_META: Record<string, { label: string; activeIcon: string; inactiveIcon: string }> = {
  home: {
    label: 'Home',
    activeIcon: 'home',
    inactiveIcon: 'home-outline',
  },
  messages: {
    label: 'Community',
    activeIcon: 'people',
    inactiveIcon: 'people-outline',
  },
  vendor: {
    label: 'Service',
    activeIcon: 'accessibility',
    inactiveIcon: 'accessibility-outline',
  },
  jaap: {
    label: 'Temple',
    activeIcon: 'temple',
    inactiveIcon: 'temple',
  },
  profile: {
    label: 'Profile',
    activeIcon: 'person',
    inactiveIcon: 'person-outline',
  },
};

const getIconPositions = (activeIndex: number): number[] => {
  if (activeIndex === 0) {
    return [63, 160, 215, 270, 325];
  }
  if (activeIndex === 1) {
    return [31, 131, 224, 276, 328];
  }
  if (activeIndex === 2) {
    // Left capsule (0-136.5) centers: 38, 94. Active: 186.5. Right capsule (236.5-373) centers: 279, 335.
    return [38, 94, 186.5, 279, 335];
  }
  if (activeIndex === 3) {
    // Left capsule (0-167) centers: 32, 84, 136. Active: 219. Right capsule (271-373) center: 325.
    return [32, 84, 136, 219, 325];
  }
  if (activeIndex === 4) {
    return [48, 103, 158, 213, 310];
  }
  return [38, 113.768, 186.5, 259.232, 335];
};

const getBackgroundRects = (activeIndex: number) => {
  const safeIndex = activeIndex >= 0 && activeIndex < 5 ? activeIndex : 0;
  const GAP = 6;
  
  const getTabWidthForBg = (index: number) => {
    if (index === 0 || index === 4) return 126;
    if (index === 1) return 126;
    if (index === 2) return 100;
    if (index === 3) return 104;
    return 100;
  };

  const tabWidth = getTabWidthForBg(safeIndex);
  const centerX = getIconPositions(safeIndex)[safeIndex];
  const L_active = centerX - tabWidth / 2;
  const R_active = centerX + tabWidth / 2;

  const rects = [];

  // Left Inactive Group
  if (L_active > 20) {
    const x = 0.75;
    const w = L_active - GAP - x;
    rects.push(
      <Rect key="left" x={x} y={0.75} width={w} height={67.5} rx={33.75} fill={CAPSULE_BG} />
    );
  }

  // Right Inactive Group
  if (R_active < 353) {
    const x = R_active + GAP;
    const w = 373 - 0.75 - x;
    rects.push(
      <Rect key="right" x={x} y={0.75} width={w} height={67.5} rx={33.75} fill={CAPSULE_BG} />
    );
  }

  // Active Tab Capsule
  const activeX = Math.max(0.75, L_active);
  const activeW = Math.min(373 - 0.75, R_active) - activeX;
  rects.push(
    <Rect key="active" x={activeX} y={0.75} width={activeW} height={67.5} rx={33.75} fill={CAPSULE_BG} />
  );

  return rects;
};

export default function CustomTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { tabBarTranslateY } = useTabBar();

  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      tabBarTranslateY.value,
      [0, 150],
      [1, 0.85],
      'clamp'
    );
    
    // When shrinking, we move it down a bit so it looks like it sticks to the bottom
    const translateY = interpolate(
      tabBarTranslateY.value,
      [0, 150],
      [0, Platform.OS === 'android' ? 15 : 20],
      'clamp'
    );

    return {
      transform: [{ translateY }, { scale }],
    };
  });

  // Move the tab bar down slightly by default, taking Android into account
  const bottomPosition = Platform.OS === 'android' 
    ? Math.max(insets.bottom + 5, 5) 
    : (insets.bottom > 0 ? Math.max(insets.bottom - 10, 5) : 10);

  const visibleRoutes = state.routes.filter((route: any) => !HIDDEN_ROUTES.has(route.name));

  const { showCoachMarks, coachMarkStep } = useCoachMarkStore();

  let activeRoute = visibleRoutes.find(
    (route: any) => state.routes.findIndex((r: any) => r.key === route.key) === state.index
  ) ?? visibleRoutes[0];

  let activeIndex = visibleRoutes.findIndex((r: any) => r.key === activeRoute.key);

  if (showCoachMarks) {
    if (coachMarkStep === 6) {
      activeIndex = 1;
      activeRoute = visibleRoutes[1] || activeRoute;
    } else if (coachMarkStep === 7 || coachMarkStep === 8) {
      activeIndex = 2;
      activeRoute = visibleRoutes[2] || activeRoute;
    }
  }

  const onTabPress = (route: any, isFocused: boolean) => {
    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });

    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(route.name);
    }
  };

  const renderTabIcon = (routeName: string, focused: boolean) => {
    let activeSrc: any;
    let inactiveSrc: any;

    switch (routeName) {
      case 'home':
        activeSrc = require('../../assets/images/tab bar/hoe.png');
        inactiveSrc = require('../../assets/images/tab bar/home_outline.png');
        break;
      case 'messages': // Community
        activeSrc = require('../../assets/images/tab bar/comunity2.png');
        inactiveSrc = require('../../assets/images/tab bar/community.png');
        break;
      case 'vendor': // Service
        activeSrc = require('../../assets/images/tab bar/ser.png');
        inactiveSrc = require('../../assets/images/tab bar/service.png');
        break;
      case 'jaap': // Temple
        activeSrc = require('../../assets/images/tab bar/temp.png');
        inactiveSrc = require('../../assets/images/tab bar/temple.png');
        break;
      case 'profile':
        activeSrc = require('../../assets/images/tab bar/profile2.png');
        inactiveSrc = require('../../assets/images/tab bar/profile.png');
        break;
      default:
        // Fallback if needed
        return (
          <Ionicons
            name={TAB_META[routeName]?.[focused ? 'activeIcon' : 'inactiveIcon'] as any}
            size={22}
            color={focused ? ACTIVE_ORANGE : INACTIVE_COLOR}
            style={focused ? styles.activeIconGlow : null}
          />
        );
    }

    return (
      <Image
        source={focused ? activeSrc : inactiveSrc}
        style={[
          { width: 22, height: 22 },
          { tintColor: focused ? ACTIVE_ORANGE : INACTIVE_COLOR }
        ]}
        resizeMode="contain"
      />
    );
  };

  const safeActiveIndex = activeIndex >= 0 && activeIndex < 5 ? activeIndex : 0;
  const iconPositions = getIconPositions(safeActiveIndex);

  // Dynamic slot width based on active and inactive state
  const getTabWidth = (index: number, isFocused: boolean) => {
    if (isFocused) {
      if (index === 0 || index === 4) return 126;
      if (index === 1) return 126;
      if (index === 2) return 100;
      if (index === 3) return 104;
      return 100;
    } else {
      // Inactive Home & Profile are exactly 68px circles (matching height)
      if (index === 0 || index === 4) return 68;
      return 60;
    }
  };

  return (
    <Animated.View style={[styles.outerContainer, { bottom: bottomPosition }, animatedStyle]}>
      <View style={styles.tabBarContainer}>
        {/* Dynamic Separate Background */}
        <Svg width={373} height={69} viewBox="0 0 373 69" style={styles.svgBackground}>
          {getBackgroundRects(safeActiveIndex)}
        </Svg>

        {/* Dynamic Slotted Tab Items */}
        {visibleRoutes.map((route: any, index: number) => {
          const isFocused = activeRoute.key === route.key;
          const centerX = iconPositions[index];
          const tabWidth = getTabWidth(index, isFocused);

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
                { 
                  left: centerX - tabWidth / 2,
                  width: tabWidth,
                }
              ]}
            >
              {isFocused ? (
                <View style={styles.activeSlotContent}>
                  {renderTabIcon(route.name, true)}
                  <Text 
                    style={styles.activeLabel}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    {TAB_META[route.name]?.label ?? ''}
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
    paddingHorizontal: 14,
  },
  tabBarContainer: {
    width: 373,
    height: 69,
    position: 'relative',
  },
  svgBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 1,
  },
  slotContainer: {
    position: 'absolute',
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
  jaapIcon: {
    width: 22,
    height: 22,
  },
});
