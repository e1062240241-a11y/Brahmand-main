import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { useTabBar } from '../contexts/TabBarContext';
import { Svg, Path } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';

const ACTIVE_ORANGE = '#FF8A00';
const INACTIVE_COLOR = '#8A8A8F';
const CAPSULE_BG = '#1C1C1C';
const BORDER_COLOR = '#CECECE';

const HIDDEN_ROUTES = new Set(['index', 'temple', 'circles', 'jobs', 'discover']);

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
    return [34, 131, 224, 276, 328];
  }
  if (activeIndex === 2) {
    // Left capsule (0-136.5) centers: 38, 94. Active: 186.5. Right capsule (236.5-373) centers: 279, 335.
    return [38, 94, 186.5, 279, 335];
  }
  if (activeIndex === 3) {
    // Left capsule (0-167) centers: 32, 84, 136. Active: 219. Right capsule (271-373) center: 322.
    return [32, 84, 136, 219, 322];
  }
  if (activeIndex === 4) {
    return [48, 103, 158, 213, 310];
  }
  return [38, 113.768, 186.5, 259.232, 335];
};

// Parameterized Figma Bezier curves for bottom bridge transitions (height 68.4px)
const getBottomBridge = (X: number): string => {
  return `C ${X + 22.406} 68.4003, ${X + 9.749} 58.9014, ${X + 5.044} 45.6387 C ${X + 3.45} 45.1417, ${X + 1.757} 44.8721, ${X} 44.8721 C ${X - 2.052} 44.8721, ${X - 4.019} 45.2374, ${X - 5.838} 45.9062 C ${X - 10.61} 58.9165, ${X - 23.104} 68.2002, ${X - 37.768} 68.2002`;
};

// Parameterized Figma Bezier curves for top bridge transitions (height 68.4px)
const getTopBridge = (X: number): string => {
  return `C ${X - 22.8175} 0.200195, ${X - 10.121} 9.84999, ${X - 5.567} 23.2607 C ${X - 3.823} 23.8679, ${X - 1.951} 24.2002, ${X} 24.2002 C ${X + 1.663} 24.2002, ${X + 3.269} 23.9579, ${X + 4.788} 23.5107 C ${X + 9.276} 9.85805, ${X + 22.127} 0, ${X + 37.282} 0`;
};

const getPath = (activeIndex: number): string => {
  let X1 = 0;
  let X2 = 0;
  let singleBridgeX = 0;

  if (activeIndex === 0) {
    singleBridgeX = 126;
  } else if (activeIndex === 4) {
    singleBridgeX = 247;
  } else if (activeIndex === 1) {
    X1 = 68;
    X2 = 194;
  } else if (activeIndex === 2) {
    // Service Active: Left inactive capsule width is exactly 136.5px, active is 100px, symmetrical
    X1 = 136.5;
    X2 = 236.5;
  } else if (activeIndex === 3) {
    X1 = 167;
    X2 = 271;
  }

  const buildPath = (x1: number, x2: number, single: number) => {
    let XA = single > 0 ? single : x1;
    let XB = single > 0 ? single : x2;
    
    let L_edge = XA - 37.768;
    let R_edge = XB + 37.282;

    // Dynamically scale left cap to prevent inner loops
    // FIX: Use Math.min to correctly span back to 34 when L_edge is larger than 34
    let leftCapBottomStart = Math.min(34, L_edge);
    
    let leftCap = `C 15.2223 68.2002, 0 52.9779, 0 34.2002 C 0 15.4225, 15.2223 0.200196, 34 0.200195`;
    if (L_edge < 34) {
      const cp = L_edge * 0.447;
      leftCap = `C ${cp} 68.2002, 0 52.9779, 0 34.2002 C 0 15.4225, ${cp} 0.200196, ${L_edge} 0.200195`;
      leftCapBottomStart = L_edge;
    }

    // Dynamically scale right cap to prevent inner loops
    // FIX: Use Math.max to correctly span forward to 338.2 when R_edge is smaller than 338.2
    let rightCapStart = `M 338.2 0 C 357.088 0.000146337, 372.4 15.3121, 372.4 34.2002 C 372.4 53.0883, 357.088 68.4003, 338.2 68.4004`;
    let rightCapTopStart = Math.max(338.2, R_edge);

    if (R_edge > 338.2) {
      const w = 373 - R_edge;
      const cp = 373 - w * 0.447;
      rightCapStart = `M ${R_edge} 0 C ${cp} 0.000146337, 372.4 15.3121, 372.4 34.2002 C 372.4 53.0883, ${cp} 68.4003, ${R_edge} 68.4004`;
      rightCapTopStart = R_edge;
    }

    if (single > 0) {
      return `${rightCapStart} H ${XB + 37.282} ${getBottomBridge(XB)} H ${leftCapBottomStart} ${leftCap} H ${L_edge} ${getTopBridge(XA)} H ${rightCapTopStart} Z`;
    }

    return `${rightCapStart} H ${XB + 37.282} ${getBottomBridge(XB)} H ${XA + 37.282} ${getBottomBridge(XA)} H ${leftCapBottomStart} ${leftCap} H ${L_edge} ${getTopBridge(XA)} H ${XB - 37.768} ${getTopBridge(XB)} H ${rightCapTopStart} Z`;
  };

  return buildPath(X1, X2, singleBridgeX);
};

export default function CustomTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { tabBarTranslateY } = useTabBar();

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: 0 }], // Disabled hide-on-scroll to keep tab bar fixed
  }));

  const visibleRoutes = state.routes.filter((route: any) => !HIDDEN_ROUTES.has(route.name));

  const activeRoute = visibleRoutes.find(
    (route: any) => state.routes.findIndex((r: any) => r.key === route.key) === state.index
  ) ?? visibleRoutes[0];

  const activeIndex = visibleRoutes.findIndex((r: any) => r.key === activeRoute.key);

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
    if (routeName === 'jaap') {
      return (
        <Image
          source={focused ? require('../../assets/images/tab bar/temp.png') : require('../../assets/images/tab bar/temple.png')}
          style={styles.jaapIcon}
          contentFit="contain"
          tintColor={focused ? ACTIVE_ORANGE : INACTIVE_COLOR}
        />
      );
    }

    const iconName = TAB_META[routeName]?.[focused ? 'activeIcon' : 'inactiveIcon'] as any;
    return (
      <Ionicons
        name={iconName}
        size={22}
        color={focused ? ACTIVE_ORANGE : INACTIVE_COLOR}
        style={focused ? styles.activeIconGlow : null}
      />
    );
  };

  const iconPositions = getIconPositions(activeIndex);

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
    <Animated.View style={[styles.outerContainer, { bottom: insets.bottom > 0 ? insets.bottom : 15 }, animatedStyle]}>
      <View style={styles.tabBarContainer}>
        {/* Dynamic Connected SVG Background */}
        <Svg width={373} height={69} viewBox="0 0 373 69" style={styles.svgBackground}>
          <Path
            d={getPath(activeIndex)}
            fill={CAPSULE_BG}
            stroke={BORDER_COLOR}
            strokeWidth={1.5}
          />
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
