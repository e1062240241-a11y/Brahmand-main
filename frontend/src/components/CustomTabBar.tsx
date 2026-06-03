import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { useTabBar } from '../contexts/TabBarContext';
import { Svg, Path, G } from 'react-native-svg';

const ACTIVE_ORANGE = '#FF8A00';
const INACTIVE_ICON_COLOR = 'rgba(255,255,255,0.95)';

const HIDDEN_ROUTES = new Set(['index', 'temple', 'circles', 'jobs', 'discover']);

const TAB_META: Record<string, any> = {
  home: {
    label: 'Home',
    activeIcon: require('../../assets/images/tab bar/hoe.png'),
    inactiveIcon: require('../../assets/images/tab bar/home_outline.png'),
    activeSize: { width: 22, height: 22 },
    inactiveSize: { width: 20, height: 20 },
  },
  messages: {
    label: 'Community',
    activeIcon: require('../../assets/images/tab bar/comunity2.png'),
    inactiveIcon: require('../../assets/images/tab bar/community.png'),
    activeSize: { width: 22, height: 22 },
    inactiveSize: { width: 20, height: 20 },
  },
  vendor: {
    label: 'Service',
    activeIcon: require('../../assets/images/tab bar/ser.png'),
    inactiveIcon: require('../../assets/images/tab bar/service.png'),
    activeSize: { width: 20, height: 22 },
    inactiveSize: { width: 18, height: 20 },
  },
  jaap: {
    label: 'Temple',
    activeIcon: require('../../assets/images/tab bar/temp.png'),
    inactiveIcon: require('../../assets/images/tab bar/temple.png'),
    activeSize: { width: 22, height: 22 },
    inactiveSize: { width: 20, height: 20 },
  },
  profile: {
    label: 'Profile',
    activeIcon: require('../../assets/images/tab bar/profile2.png'),
    inactiveIcon: require('../../assets/images/tab bar/profile.png'),
    activeSize: { width: 22, height: 22 },
    inactiveSize: { width: 20, height: 20 },
  },
};

const SVG_PATHS: Record<string, string> = {
  home: 'M338.2 0C357.088 0.000146337 372.4 15.3121 372.4 34.2002C372.4 53.0883 357.088 68.4003 338.2 68.4004H151.05C136.174 68.4003 123.517 58.9014 118.812 45.6387C117.218 45.1417 115.525 44.8721 113.768 44.8721C111.716 44.8721 109.749 45.2374 107.93 45.9062C103.158 58.9165 90.664 68.2002 76 68.2002H34C15.2223 68.2002 0 52.9779 0 34.2002C0 15.4225 15.2223 0.200196 34 0.200195H76C90.9505 0.200195 103.647 9.84999 108.201 23.2607C109.945 23.8679 111.817 24.2002 113.768 24.2002C115.431 24.2002 117.037 23.9579 118.556 23.5107C123.044 9.85805 135.895 6.45047e-05 151.05 0H338.2Z',
  messages: 'M175 0C190.189 5.21126e-08 203.049 9.96031 207.411 23.7051C208.434 23.898 209.489 24 210.567 24C211.595 24 212.602 23.9071 213.579 23.7314C217.933 9.97284 230.801 4.17171e-07 246 0H338C356.778 0 372 15.2223 372 34C372 52.7777 356.778 68 338 68H246C231.066 68 218.381 58.3719 213.813 44.9844C212.763 44.7802 211.678 44.6719 210.567 44.6719C209.406 44.6719 208.272 44.7889 207.176 45.0117C202.6 58.3847 189.924 68 175 68H105C90.0661 68 77.381 58.3719 72.8135 44.9844C71.7629 44.7802 70.6778 44.6719 69.5674 44.6719C68.4058 44.6719 67.2716 44.7889 66.1758 45.0117C61.6002 58.3847 48.9236 68 34 68C15.2223 68 0 52.7777 0 34C0 15.2223 15.2223 0 34 0C49.1888 0 62.0492 9.96031 66.4111 23.7051C67.4338 23.898 68.4887 24 69.5674 24C70.5954 24 71.6017 23.9071 72.5791 23.7314C76.9328 9.97284 89.8014 5.21464e-08 105 0H175Z',
  vendor: 'M203.45 0C216.367 9.15527e-05 227.206 8.89043 230.187 20.8857C232.284 22.4659 234.891 23.4042 237.72 23.4043C240.079 23.4043 242.286 22.7509 244.17 21.6172C246.957 9.35328 257.927 0.19931 271.035 0.199219H333.936C349.151 0.199326 361.485 12.5337 361.485 27.749V28.6494C361.485 43.8647 349.151 56.1991 333.936 56.1992H271.035C257.436 56.1991 246.14 46.3461 243.893 33.3896C242.07 32.3561 239.965 31.7646 237.72 31.7646C234.994 31.7647 232.472 32.6342 230.416 34.1113C227.805 46.6108 216.725 55.9999 203.45 56H158.55C145.153 55.9999 133.991 46.4373 131.514 33.7656C129.556 32.5002 127.224 31.7646 124.72 31.7646C122.015 31.7647 119.511 32.6221 117.463 34.0791C114.941 46.6939 103.807 56.1991 90.4502 56.1992H27.5498C12.3345 56.1991 0.000106812 43.8647 0 28.6494V27.749C0.000106812 12.5337 12.3345 0.199326 27.5498 0.199219H90.4502C103.28 0.19931 114.06 8.96907 117.126 20.8408C119.233 22.4485 121.864 23.4042 124.72 23.4043C127.313 23.4043 129.721 22.6147 131.72 21.2656C134.563 9.07833 145.496 9.15527e-05 158.55 0H203.45Z',
  jaap: 'M217 0C201.636 0 188.654 10.1921 184.441 24.1836C183.637 24.3009 182.814 24.3633 181.978 24.3633C181.157 24.3633 180.351 24.3043 179.562 24.1914C175.351 10.1958 162.367 5.9316e-08 147 0H34C15.2223 0 0 15.2223 0 34C0 52.7777 15.2223 68 34 68H147C161.823 68 174.428 58.5141 179.081 45.2822C180.022 45.1199 180.99 45.0352 181.978 45.0352C182.982 45.0352 183.966 45.1232 184.923 45.291C189.579 58.5181 202.181 68 217 68H267C281.934 68 294.619 58.3719 299.187 44.9844C300.237 44.7802 301.322 44.6719 302.433 44.6719C303.594 44.6719 304.728 44.7889 305.824 45.0117C310.4 58.3847 323.076 68 338 68C356.778 68 372 52.7777 372 34C372 15.2223 356.778 0 338 0C322.811 0 309.951 9.96031 305.589 23.7051C304.566 23.898 303.511 24 302.433 24C301.405 24 300.398 23.9071 299.421 23.7314C295.067 9.97284 282.199 0 267 0H217Z',
};

const ICON_POSITIONS: Record<string, number[]> = {
  home: [46, 175, 228.3, 281.6, 324],
  messages: [38, 140, 260, 292, 324],
  vendor: [38, 78, 181, 284, 324],
  jaap: [38, 105, 172, 242, 324],
  profile: [38, 91.4, 144.7, 198, 316],
};

export default function CustomTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { tabBarTranslateY } = useTabBar();

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: tabBarTranslateY.value }],
  }));

  const visibleRoutes = state.routes.filter((route: any) => !HIDDEN_ROUTES.has(route.name));

  const activeRoute = visibleRoutes.find(
    (route: any) => state.routes.findIndex((r: any) => r.key === route.key) === state.index
  ) ?? visibleRoutes[0];

  const renderTabIcon = (routeName: string, focused: boolean) => {
    const meta = TAB_META[routeName];
    if (!meta) return null;

    return (
      <Image
        source={focused ? meta.activeIcon : meta.inactiveIcon}
        style={focused ? meta.activeSize : meta.inactiveSize}
        contentFit="contain"
        tintColor={focused ? ACTIVE_ORANGE : INACTIVE_ICON_COLOR}
      />
    );
  };

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

  const positions = ICON_POSITIONS[activeRoute.name] || ICON_POSITIONS.home;

  return (
    <Animated.View style={[styles.outerContainer, { bottom: insets.bottom > 0 ? insets.bottom - 20 : -5 }, animatedStyle]}>
      <View style={[styles.shadowWrap, { width: 373, height: 69, alignSelf: 'center' }]}>
        
        {/* Dynamic Background SVG based on active tab */}
        <View style={styles.svgOuterWrap}>
          <Svg width={373} height={69} viewBox="0 0 373 69" fill="none">
            {activeRoute.name === 'profile' ? (
              <G scaleX={-1} originX={186.5}>
                <Path d={SVG_PATHS.home} fill="#E8E4DF" fillOpacity="0.95" />
              </G>
            ) : (
              <Path d={SVG_PATHS[activeRoute.name] || SVG_PATHS.home} fill="#E8E4DF" fillOpacity="0.95" />
            )}
          </Svg>
        </View>

        {/* Absolutely Positioned Icons aligned to SVG cutouts */}
        <View style={styles.barRow}>
          {visibleRoutes.map((route: any, index: number) => {
            const isFocused = activeRoute.key === route.key;
            const centerX = positions[index];

            return (
              <View 
                key={route.key} 
                style={[styles.iconWrapperAbsolute, { left: centerX - 50 }]}
              >
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={isFocused ? { selected: true } : {}}
                  accessibilityLabel={descriptors[route.key]?.options?.tabBarAccessibilityLabel}
                  testID={descriptors[route.key]?.options?.tabBarTestID}
                  onPress={() => onTabPress(route, isFocused)}
                  style={styles.iconContainer}
                >
                  {isFocused ? (
                    <View style={styles.activeInner}>
                      <View style={styles.activeIconWrap}>{renderTabIcon(route.name, true)}</View>
                      <Text style={styles.activeLabel}>{TAB_META[route.name]?.label ?? ''}</Text>
                    </View>
                  ) : (
                    <View style={styles.iconWrap}>{renderTabIcon(route.name, false)}</View>
                  )}
                </Pressable>
              </View>
            );
          })}
        </View>
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
  shadowWrap: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  svgOuterWrap: {
    position: 'absolute',
    width: 373,
    height: 69,
    left: '50%',
    top: '50%',
    marginLeft: -186.5,
    marginTop: -34.5,
    zIndex: 0,
  },
  barRow: {
    width: 373,
    height: 69,
    position: 'relative',
    zIndex: 2,
  },
  iconWrapperAbsolute: {
    position: 'absolute',
    width: 100,
    height: 69,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: 100,
    height: 56,
    backgroundColor: 'white',
    borderRadius: 27.55,
    gap: 6,
  },
  activeIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF8A00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.7,
    shadowRadius: 12,
    elevation: 8,
  },
  activeLabel: {
    color: ACTIVE_ORANGE,
    fontSize: 13,
    fontWeight: '700',
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
