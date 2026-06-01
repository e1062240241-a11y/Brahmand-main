import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from '../utils/i18n';

const TAB_HEIGHT = 56;
const TAB_RADIUS = 27.55;
const ACTIVE_TAB_WIDTH = 126;

export default function CustomTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  // Filter out hidden routes first
  const visibleRoutes = state.routes.filter((route: any) => 
    !['index', 'temple', 'circles', 'jobs', 'discover'].includes(route.name)
  );

  // Group routes: consecutive inactive tabs form one group, the active tab forms its own group.
  const groups: { isActive: boolean; routes: any[] }[] = [];
  let currentGroup: any[] = [];

  visibleRoutes.forEach((route: any) => {
    const isFocused = state.routes.findIndex((r: any) => r.key === route.key) === state.index;
    if (isFocused) {
      if (currentGroup.length > 0) {
        groups.push({ isActive: false, routes: currentGroup });
        currentGroup = [];
      }
      groups.push({ isActive: true, routes: [route] });
    } else {
      currentGroup.push(route);
    }
  });
  if (currentGroup.length > 0) {
    groups.push({ isActive: false, routes: currentGroup });
  }

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 12 }]}>
      <View style={styles.tabBarWrapper}>
        {groups.map((group, groupIndex) => (
          <React.Fragment key={`group-${groupIndex}`}>
            {/* Render a thin connecting bridge between groups */}
            {groupIndex > 0 && <View style={styles.bridge} />}
            <View style={styles.groupPill}>
              {group.routes.map((route: any) => {
                const { options } = descriptors[route.key];
                const isFocused = group.isActive;

                const onPress = () => {
                  const event = navigation.emit({
                    type: 'tabPress',
                    target: route.key,
                    canPreventDefault: true,
                  });

                  if (!isFocused && !event.defaultPrevented) {
                    navigation.navigate(route.name);
                  }
                };

                let Icon = null;
                let label = '';
                const iconColor = isFocused ? '#FF7B00' : '#8E8E93';
                
                // Active icons do not have shadows anymore
                const iconStyle = {};

                switch (route.name) {
                  case 'home':
                    Icon = (
                      <Image
                        source={isFocused ? require('../../assets/images/tab bar/hoe.png') : require('../../assets/images/tab bar/home_outline.png')}
                        style={isFocused ? { width: 28.719, height: 28.719, aspectRatio: 1, tintColor: iconColor } : { width: 26, height: 26, aspectRatio: 1, tintColor: iconColor }}
                        resizeMode="contain"
                      />
                    );
                    label = t('home');
                    break;
                  case 'messages':
                    Icon = (
                      <Image
                        source={isFocused ? require('../../assets/images/tab bar/comunity2.png') : require('../../assets/images/tab bar/community.png')}
                        style={isFocused ? { width: 36, height: 36, tintColor: iconColor } : { width: 32.548, height: 23.75, tintColor: iconColor }}
                        resizeMode="contain"
                      />
                    );
                    label = t('community');
                    break;
                  case 'vendor':
                    Icon = (
                      <Image
                        source={isFocused ? require('../../assets/images/tab bar/ser.png') : require('../../assets/images/tab bar/service.png')}
                        style={isFocused ? { width: 24, height: 28, aspectRatio: 6/7, tintColor: iconColor } : { width: 20.983, height: 23.28, tintColor: iconColor }}
                        resizeMode="contain"
                      />
                    );
                    label = t('service');
                    break;
                  case 'jaap':
                    Icon = (
                      <Image
                        source={isFocused ? require('../../assets/images/tab bar/temp.png') : require('../../assets/images/tab bar/temple.png')}
                        style={isFocused ? { width: 30.078, height: 30.067, tintColor: iconColor } : { width: 23.035, height: 23.803, tintColor: iconColor }}
                        resizeMode="contain"
                      />
                    );
                    label = t('temple');
                    break;
                  case 'profile':
                    Icon = (
                      <Image
                        source={isFocused ? require('../../assets/images/tab bar/profile2.png') : require('../../assets/images/tab bar/profile.png')}
                        style={isFocused ? { width: 28, height: 28, aspectRatio: 1, tintColor: iconColor } : { width: 24.89, height: 23.75, tintColor: iconColor }}
                        resizeMode="contain"
                      />
                    );
                    label = t('profile');
                    break;
                  default:
                    break;
                }

                return (
                  <TouchableOpacity
                    key={route.key}
                    accessibilityRole="button"
                    accessibilityState={isFocused ? { selected: true } : {}}
                    accessibilityLabel={options.tabBarAccessibilityLabel}
                    testID={options.tabBarTestID}
                    onPress={onPress}
                    style={[
                      styles.tabItem,
                      isFocused && styles.activeTabItem
                    ]}
                  >
                    <View style={[styles.iconContainer, isFocused && styles.glassEffect]}>
                      {Icon}
                    </View>
                    {isFocused && (
                      <Text style={styles.activeLabel}>{label}</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </React.Fragment>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  tabBarWrapper: {
    height: 74,
    borderRadius: 37,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.40)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 10,
  },
  bridge: {
    width: 14,
    height: 14,
    backgroundColor: '#FFFFFF',
    marginHorizontal: -4, // Overlap slightly to ensure it seamlessly connects
    zIndex: -1,
  },
  groupPill: {
    backgroundColor: '#FFFFFF',
    borderRadius: TAB_RADIUS,
    height: TAB_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  tabItem: {
    height: TAB_HEIGHT,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 54, // Ensure inactive icons have enough touch area
  },
  activeTabItem: {
    minWidth: ACTIVE_TAB_WIDTH,
    height: TAB_HEIGHT,
    borderRadius: TAB_RADIUS,
    paddingHorizontal: 16,
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  glassEffect: {
    // Removed orange background circle
  },
  activeLabel: {
    color: '#FF8A00',
    fontSize: 12,
    fontStyle: 'normal',
    fontWeight: '700',
    fontFamily: 'SF Pro',
    marginLeft: 4,
  }
});
