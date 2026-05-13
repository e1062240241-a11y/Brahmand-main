import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../src/constants/theme';

const TabIcon = ({ IconComponent, name, color }: { IconComponent: any; name: any; color: string }) => (
  <View style={styles.iconContainer}>
    <IconComponent name={name} size={22} color={color} />
  </View>
);

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const bottomInset = insets.bottom;

  return (
    <Tabs
      initialRouteName="home"
      screenOptions={{
        tabBarActiveTintColor: '#FF6600',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E5E5EA',
          height: 60 + insets.bottom,
          paddingBottom: bottomInset + 4,
          paddingTop: 8,
          elevation: 10,
          shadowOpacity: 0.1,
          shadowRadius: 10,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
        headerShown: false,
        headerShadowVisible: false,
      }}
    >
      {/* 1. Home */}
      <Tabs.Screen
        name="home"
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon IconComponent={Ionicons} name={focused ? "home" : "home-outline"} color={color} />
          ),
        }}
      />

      {/* 2. Community (Previously Chat/Messages) */}
      <Tabs.Screen
        name="messages"
        options={{
          tabBarLabel: 'Community',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon IconComponent={Ionicons} name={focused ? "people" : "people-outline"} color={color} />
          ),
        }}
      />

      {/* 3. Jaap */}
      <Tabs.Screen
        name="jaap"
        options={{
          tabBarLabel: 'Jaap',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon IconComponent={FontAwesome5} name="pray" color={color} />
          ),
        }}
      />
      
      {/* 4. Temple */}
      <Tabs.Screen
        name="temple"
        options={{
          tabBarLabel: 'Temple',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon IconComponent={MaterialCommunityIcons} name={focused ? "temple-hindu" : "temple-hindu-outline"} color={color} />
          ),
        }}
      />
      
      {/* 5. Profile */}
      <Tabs.Screen
        name="profile"
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon IconComponent={Ionicons} name={focused ? "person" : "person-outline"} color={color} />
          ),
        }}
      />
      
      {/* Hidden Screens */}
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen name="circles" options={{ href: null }} />
      <Tabs.Screen name="jobs" options={{ href: null }} />
      <Tabs.Screen name="discover" options={{ href: null }} />
      <Tabs.Screen name="vendor" options={{ href: null }} />
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
