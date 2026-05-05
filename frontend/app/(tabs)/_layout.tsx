import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../src/constants/theme';

const TabIcon = ({ name, color }: { name: any; color: string; focused?: boolean }) => (
  <View style={styles.iconContainer}>
    <Ionicons name={name} size={22} color={color} />
  </View>
);

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const bottomInset = insets.bottom; // use real inset so tab sits flush with system nav

  return (
    <Tabs
      initialRouteName="home"
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textLight,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
          height: 58 + insets.bottom,
          paddingBottom: bottomInset,
          paddingTop: 8,
        },
        tabBarItemStyle: {
          flex: 1,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          marginTop: 2,
        },
        headerStyle: {
          backgroundColor: COLORS.surface,
        },
        headerTitleStyle: {
          color: COLORS.text,
          fontWeight: '600',
          fontSize: 18,
        },
        headerShadowVisible: false,
      }}
    >
      {/* 1. Home */}
      <Tabs.Screen
        name="home"
        options={{
          title: '',
          tabBarLabel: 'Home',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="home" color={color} focused={focused} />
          ),
        }}
      />

      {/* 2. Vendor (hidden from bottom tab bar, still accessible via route) */}
      <Tabs.Screen
        name="vendor"
        options={{
          href: null,
          title: '',
          headerShown: false,
        }}
      />
      
      {/* 3. Chat (contains Community & Private Chat tabs) */}
      <Tabs.Screen
        name="messages"
        options={{
          title: '',
          tabBarLabel: 'Chat',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="chatbubbles" color={color} focused={focused} />
          ),
        }}
      />
      
      {/* 4. Temple */}
      <Tabs.Screen
        name="temple"
        options={{
          title: '',
          tabBarLabel: 'Temple',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="business" color={color} focused={focused} />
          ),
        }}
      />
      
      {/* 5. Profile */}
      <Tabs.Screen
        name="profile"
        options={{
          title: '',
          tabBarLabel: 'Profile',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? "person" : "person-outline"} color={color} focused={focused} />
          ),
        }}
      />
      
      {/* Hide these screens from tab bar */}
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen name="circles" options={{ href: null }} />
      <Tabs.Screen name="discover" options={{ href: null }} />
      <Tabs.Screen name="jobs" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    width: 42,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
