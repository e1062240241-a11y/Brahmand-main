import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from '../../src/utils/i18n';
import FloatingMenu from '../../src/components/FloatingMenu';

const TabIcon = ({ IconComponent, name, color }: { IconComponent: any; name: any; color: string }) => (
  <View style={styles.iconContainer}>
    <IconComponent name={name} size={22} color={color} />
  </View>
);

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const bottomInset = insets.bottom;
  const { t } = useTranslation();

  return (
    <>
    <Tabs
      initialRouteName="home"
      screenOptions={{
        tabBarActiveTintColor: '#FF6600',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0,
          height: 65 + insets.bottom,
          paddingBottom: bottomInset + 4,
          paddingTop: 8,
          elevation: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.05,
          shadowRadius: 10,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: 2,
        },
        headerShown: false,
      }}
    >
      {/* 1. Home */}
      <Tabs.Screen
        name="home"
        options={{
          tabBarLabel: t('home') as any,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon IconComponent={Ionicons} name={focused ? "home" : "home-outline"} color={color} />
          ),
        }}
      />

      {/* 2. Community */}
      <Tabs.Screen
        name="messages"
        options={{
          tabBarLabel: t('community') as any,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon IconComponent={Ionicons} name={focused ? "people" : "people-outline"} color={color} />
          ),
        }}
      />

      {/* 3. Temple (jaap screen) */}
      <Tabs.Screen
        name="jaap"
        options={{
          tabBarLabel: t('temple') as any,
          tabBarIcon: ({ color }) => (
            <View style={styles.iconContainer}>
              <Image
                source={require('../../assets/images/jaap_tab_icon.png')}
                style={[styles.jaapTabIcon, { tintColor: color }]}
                resizeMode="contain"
              />
            </View>
          ),
        }}
      />
      
      {/* 4. Service (Vendors/Jobs) */}
      <Tabs.Screen
        name="vendor"
        options={{
          tabBarLabel: t('service') as any,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon IconComponent={MaterialCommunityIcons} name={focused ? "hand-heart" : "hand-heart-outline"} color={color} />
          ),
        }}
      />

      {/* 5. Profile */}
      <Tabs.Screen
        name="profile"
        options={{
          tabBarLabel: t('profile') as any,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon IconComponent={Ionicons} name={focused ? "person" : "person-outline"} color={color} />
          ),
        }}
      />

      {/* Hidden Screens */}
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen name="temple" options={{ href: null }} />
      <Tabs.Screen name="circles" options={{ href: null }} />
      <Tabs.Screen name="jobs" options={{ href: null }} />
      <Tabs.Screen name="discover" options={{ href: null }} />
    </Tabs>
    <FloatingMenu bottomOffset={65} />
    </>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    width: 42,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  jaapTabIcon: {
    width: 28,
    height: 28,
  },
});
