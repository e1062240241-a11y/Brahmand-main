import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../src/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

const TabIcon = ({ IconComponent, name, color, focused, isCenter }: { IconComponent: any; name: any; color: string; focused?: boolean; isCenter?: boolean }) => {
  if (isCenter) {
    return (
      <View style={styles.centerButtonWrapper}>
        <LinearGradient
          colors={['#FF8D57', '#FF6600']}
          style={styles.centerButton}
        >
          <View style={styles.centerIconShadow}>
            <Text style={styles.omSymbol}>ॐ</Text>
          </View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.iconContainer}>
      <IconComponent name={name} size={22} color={color} />
    </View>
  );
};

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
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon IconComponent={Ionicons} name={focused ? "home" : "home-outline"} color={color} focused={focused} />
          ),
        }}
      />

      {/* 2. Community */}
      <Tabs.Screen
        name="messages"
        options={{
          tabBarLabel: 'Community',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon IconComponent={Ionicons} name={focused ? "people" : "people-outline"} color={color} focused={focused} />
          ),
        }}
      />

      {/* 3. Jaap (Center Highlighted) */}
      <Tabs.Screen
        name="jaap"
        options={{
          tabBarLabel: 'Jaap',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon IconComponent={FontAwesome5} name="pray" color={color} focused={focused} isCenter={true} />
          ),
          tabBarLabelStyle: {
            color: '#FF6600',
            fontWeight: '700',
            fontSize: 11,
          }
        }}
      />
      
      {/* 4. Service (Previously Temple) */}
      <Tabs.Screen
        name="temple"
        options={{
          tabBarLabel: 'Service',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon IconComponent={MaterialCommunityIcons} name={focused ? "hand-heart" : "hand-heart-outline"} color={color} focused={focused} />
          ),
        }}
      />
      
      {/* 5. Profile */}
      <Tabs.Screen
        name="profile"
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon IconComponent={Ionicons} name={focused ? "person" : "person-outline"} color={color} focused={focused} />
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerButtonWrapper: {
    position: 'absolute',
    top: -30,
    justifyContent: 'center',
    alignItems: 'center',
    width: 60,
    height: 60,
  },
  centerButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#FF6600',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  centerIconShadow: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  omSymbol: {
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});
