import React, { useEffect } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Tabs, useRouter, usePathname } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from '../../src/utils/i18n';
import CustomTabBar from '../../src/components/CustomTabBar';
import { TabBarProvider } from '../../src/contexts/TabBarContext';
import { ThemeProvider, DefaultTheme } from '@react-navigation/native';
import { useAuthStore } from '../../src/store/authStore';

const MyTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#FFF8F0',
  },
};

const TabIcon = ({ IconComponent, name, color }: { IconComponent: any; name: any; color: string }) => (
  <View style={styles.iconContainer}>
    <IconComponent name={name} size={22} color={color} />
  </View>
);

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const bottomInset = insets.bottom;
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading } = useAuthStore();



  return (
    <ThemeProvider value={MyTheme}>
      <TabBarProvider>
        <Tabs
          initialRouteName="home"
          tabBar={(props) => <CustomTabBar {...props} />}
          screenOptions={{
            headerShown: false,
            // ponytail: Preload all tabs on startup to make tab-switching completely instant
            lazy: false,
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

      {/* 3. Service (Vendors/Jobs) */}
      <Tabs.Screen
        name="vendor"
        options={{
          tabBarLabel: t('service') as any,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon IconComponent={MaterialCommunityIcons} name={focused ? "hand-heart" : "hand-heart-outline"} color={color} />
          ),
        }}
      />

      {/* 4. Temple (jaap screen) */}
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
      <Tabs.Screen name="legacy_index" options={{ href: null }} />
      <Tabs.Screen name="temple" options={{ href: null }} />
      <Tabs.Screen name="circles" options={{ href: null }} />
      <Tabs.Screen name="jobs" options={{ href: null }} />
      <Tabs.Screen name="discover" options={{ href: null }} />
    </Tabs>
      </TabBarProvider>
    </ThemeProvider>
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
