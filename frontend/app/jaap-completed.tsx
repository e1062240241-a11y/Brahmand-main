import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  StatusBar,
  Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function JaapCompleted() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const mantraType = (params.mantraType as string) || 'gayatri';
  const fromHome = params.fromHome === 'true';

  const handlePressContinue = () => {
    if (mantraType === 'kedarnath' || fromHome) {
      router.replace('/(tabs)/home');
    } else {
      router.replace('/(tabs)/jaap');
    }
  };

  return (
    <ImageBackground
      source={require('../assets/images/jaap_complete_bg.png')}
      style={styles.container}
      resizeMode="cover"
    >
      <StatusBar barStyle="light-content" />
      <View style={[styles.safeArea, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}>
        {/* Header Lotus Icon */}
        <View style={styles.lotusContainer}>
          <Text style={styles.lotusEmoji}>🪷</Text>
        </View>

        {/* Heading Section */}
        <Text style={styles.title}>You Did It!</Text>
        <Text style={styles.subtitle}>
          Your effort, your time, your energy — all have meaning.
        </Text>

        {/* Spacer */}
        <View style={{ flex: 1 }} />

        {/* Glassmorphic Card */}
        <View style={styles.card}>
          <BlurView intensity={30} tint="light" style={styles.blurView} />
          <Text style={styles.cardText1}>
            Your journey and records are now stored in your{' '}
            <Text style={{ fontFamily: 'Outfit_700Bold' }}>Brahmand</Text> Passport.
          </Text>
          <Text style={styles.cardText2}>
            Carry this feeling forward. You're capable of amazing things. ✨
          </Text>

          {/* Button */}
          <TouchableOpacity
            style={styles.button}
            activeOpacity={0.85}
            onPress={handlePressContinue}
          >
            <Text style={styles.buttonText}>KEEP GOING, KEEP GLOWING</Text>
          </TouchableOpacity>
        </View>

        {/* Spacer */}
        <View style={{ flex: 1 }} />

        {/* Footer Mantra */}
        <View style={styles.footerContainer}>
          <Text style={styles.footerMantra}>PURPOSE • PROGRESS • PEACE</Text>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  safeArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  lotusContainer: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(255, 255, 255, 0.90)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  lotusEmoji: {
    fontSize: 42,
  },
  title: {
    fontSize: 36,
    fontFamily: 'Outfit_700Bold',
    color: '#5A4136',
    textAlign: 'center',
    letterSpacing: -0.9,
    marginTop: 24,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    fontFamily: 'Outfit_500Medium',
    color: '#5A4136',
    opacity: 0.9,
    textAlign: 'center',
    lineHeight: 29.25,
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  card: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.30)',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: 8 },
    overflow: 'hidden',
  },
  blurView: {
    ...StyleSheet.absoluteFillObject,
  },
  cardText1: {
    fontSize: 18,
    fontFamily: 'Outfit_500Medium',
    color: '#FFF',
    textAlign: 'center',
    lineHeight: 24.75,
    marginBottom: 16,
    zIndex: 1,
  },
  cardText2: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    fontStyle: 'italic',
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    zIndex: 1,
  },
  button: {
    width: '100%',
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FF7B00',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    zIndex: 1,
  },
  buttonText: {
    fontSize: 16,
    fontFamily: 'Outfit_500Medium',
    color: '#FFF',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  footerContainer: {
    marginBottom: 20,
    alignItems: 'center',
    width: '100%',
  },
  footerMantra: {
    fontSize: 14,
    fontFamily: 'Outfit_700Bold',
    color: 'rgba(255, 255, 255, 0.8)',
    letterSpacing: 1.4,
    textAlign: 'center',
  },
});
