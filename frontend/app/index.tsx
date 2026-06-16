import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, Image, Platform, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';
import Svg, { Path } from 'react-native-svg';

const LotusOrnament = () => (
  <Svg width={12} height={12} viewBox="0 0 24 24" fill="#D4AF37">
    <Path d="M12 2a2 2 0 00-2 2v2.28A6.002 6.002 0 006.1 11H3a2 2 0 00-2 2v1a2 2 0 002 2h3.1a6.002 6.002 0 003.9 4.72V20a2 2 0 004 0v-2.28A6.002 6.002 0 0017.9 13H21a2 2 0 002-2v-1a2 2 0 00-2-2h-3.1A6.002 6.002 0 0014 4.28V4a2 2 0 00-2-2zm0 6.5c1.93 0 3.5 1.57 3.5 3.5S13.93 15.5 12 15.5 8.5 13.93 8.5 12 10.07 8.5 12 8.5z" />
  </Svg>
);

export default function IndexRoute() {
  const { token, isLoading } = useAuthStore();
  const router = useRouter();
  const [timePassed, setTimePassed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setTimePassed(true);
    }, 1500); // 1.5 seconds minimum show time for splash screen

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Redirection temporarily paused for inspection
    /*
    if (timePassed && !isLoading) {
      if (token) {
        router.replace('/home');
      } else {
        router.replace('/auth/entry-animation');
      }
    }
    */
  }, [timePassed, isLoading, token, router]);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.imageContainer}>
          <Image
            source={require('../assets/images/icon.png')}
            style={styles.lotusImage}
            resizeMode="cover"
          />
        </View>
        
        <View style={styles.contentContainer}>
          <Text style={styles.title}>BRAHMAND</Text>
          
          <View style={styles.dividerContainer}>
            <View style={styles.line} />
            <View style={styles.ornamentWrapper}>
              <LotusOrnament />
            </View>
            <View style={styles.line} />
          </View>
          
          <Text style={styles.subtitle}>The Daily Sanatan Community</Text>
          
          <View style={styles.dividerContainer}>
            <View style={styles.line} />
            <View style={styles.ornamentWrapper}>
              <LotusOrnament />
            </View>
            <View style={styles.line} />
          </View>
          
          <Text style={styles.tagline}>Dharama • Safety • Trusted help</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: 357,
    height: 537,
    backgroundColor: '#000000',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#322B20',
    overflow: 'hidden',
    alignItems: 'center',
  },
  imageContainer: {
    width: 357,
    height: 370,
    borderRadius: 22,
    overflow: 'hidden',
  },
  lotusImage: {
    width: '100%',
    height: '100%',
    transform: [{ scale: 1.25 }],
  },
  contentContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingBottom: 38,
    paddingHorizontal: 20,
    marginTop: -10,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Cinzel',
    fontWeight: '500',
    color: '#E6C87A',
    letterSpacing: 14,
    textAlign: 'center',
    marginBottom: 10,
    paddingLeft: 14,
    fontStyle: 'normal',
    lineHeight: 36,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 248,
    height: 12,
    marginVertical: 12,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#D4AF37',
    opacity: 0.8,
  },
  ornamentWrapper: {
    marginHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Outfit_400Regular',
    color: '#F5EEDC',
    letterSpacing: 1,
    textAlign: 'center',
    lineHeight: 20,
  },
  tagline: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    color: '#FFB065',
    letterSpacing: -0.15,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 12,
  },
});
