import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TAB_HEIGHT = 56;
const TAB_RADIUS = 27.55;
const ACTIVE_TAB_WIDTH = 126;

export default function CustomTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();

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
                    Icon = <Ionicons name={isFocused ? 'home' : 'home-outline'} size={24} color={iconColor} style={iconStyle} />;
                    label = 'Home';
                    break;
                  case 'messages':
                    // Using MaterialIcons 'groups' to match the 3-person community icon
                    Icon = <MaterialIcons name={isFocused ? 'groups' : 'groups'} size={28} color={iconColor} style={iconStyle} />;
                    label = 'Community';
                    break;
                  case 'vendor':
                    Icon = <Ionicons name={isFocused ? 'accessibility' : 'accessibility-outline'} size={24} color={iconColor} style={iconStyle} />;
                    label = 'Service';
                    break;
                  case 'jaap':
                    Icon = (
                      <View>
                        <Image
                          source={require('../../assets/images/jaap_tab_icon.png')}
                          style={{ width: 24, height: 24, tintColor: iconColor }}
                          resizeMode="contain"
                        />
                      </View>
                    );
                    label = 'Temple';
                    break;
                  case 'profile':
                    Icon = <Ionicons name={isFocused ? 'person' : 'person-outline'} size={24} color={iconColor} style={iconStyle} />;
                    label = 'Profile';
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
                    <View style={styles.iconContainer}>
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
    width: ACTIVE_TAB_WIDTH,
    height: TAB_HEIGHT,
    borderRadius: TAB_RADIUS,
    paddingHorizontal: 12,
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  activeLabel: {
    color: '#FF7B00',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 6,
    fontFamily: 'System',
  }
});
