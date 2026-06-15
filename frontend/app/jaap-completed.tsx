import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  StatusBar,
  ScrollView,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';


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
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <ScrollView
        contentContainerStyle={[
          styles.safeArea,
          {
            paddingTop: Math.max(insets.top, 20),
            paddingBottom: Math.max(insets.bottom, 20),
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Navigation Row */}
        <View style={{ width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', marginTop: 10, marginBottom: 15, paddingHorizontal: 4 }}>
          <TouchableOpacity
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: 'rgba(255, 255, 255, 0.75)',
              justifyContent: 'center',
              alignItems: 'center',
              shadowColor: '#000',
              shadowOpacity: 0.1,
              shadowRadius: 5,
              shadowOffset: { width: 0, height: 2 },
              elevation: 2,
            }}
            activeOpacity={0.85}
            onPress={handlePressContinue}
          >
            <Ionicons name="arrow-back" size={22} color="#5A4136" />
          </TouchableOpacity>
        </View>
        {/* Header Section */}
        <View style={styles.headerContainer}>
          {/* Header Lotus Icon */}
          <View style={styles.lotusContainer}>
            <Text style={styles.lotusEmoji}>🪷</Text>
          </View>

          {/* Heading Section */}
          <Text style={styles.title}>You Did It!</Text>
          <Text style={styles.subtitle}>
            Your effort, your time, your energy — all have meaning.
          </Text>
        </View>

        {/* Spacer */}
        <View style={{ flex: 1, minHeight: 24 }} />

        {/* Glassmorphic Card */}
        <View style={styles.cardWrapper}>
          {Platform.OS === 'ios' ? (
            <BlurView intensity={30} tint="light" style={StyleSheet.absoluteFillObject} />
          ) : (
            <View style={[StyleSheet.absoluteFillObject, styles.cardAndroidBg]} />
          )}
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

        {/* Space after card */}
        <View style={{ height: 24 }} />

        {/* Footer Mantra */}
        <View style={styles.footerContainer}>
          <Text style={styles.footerMantra}>PURPOSE • PROGRESS • PEACE</Text>
        </View>
      </ScrollView>
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
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  headerContainer: {
    alignItems: 'center',
    width: '100%',
    marginTop: 0,
    gap: 16,
  },
  lotusContainer: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(255, 255, 255, 0.90)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  lotusEmoji: {
    fontSize: 42,
  },
  title: {
    fontSize: 36,
    color: '#5A4136',
    textAlign: 'center',
    fontWeight: '700',
    lineHeight: 40,
    letterSpacing: -0.9,
    ...Platform.select({
      ios: { fontFamily: 'System' },
      android: { fontFamily: 'sans-serif' },
      default: { fontFamily: 'System' },
    }),
  },
  subtitle: {
    fontSize: 18,
    color: '#5A4136',
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 29.25,
    paddingHorizontal: 20,
    ...Platform.select({
      ios: { fontFamily: 'System' },
      android: { fontFamily: 'sans-serif' },
      default: { fontFamily: 'System' },
    }),
  },
  cardWrapper: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.30)',
    backgroundColor: 'rgba(255, 255, 255, 0.20)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  cardAndroidBg: {
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.30)',
  },
  cardText1: {
    fontSize: 18,
    color: '#FFF',
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 24.75,
    marginBottom: 16,
    zIndex: 1,
    ...Platform.select({
      ios: { fontFamily: 'System' },
      android: { fontFamily: 'sans-serif' },
      default: { fontFamily: 'System' },
    }),
  },
  cardText2: {
    fontSize: 14,
    fontStyle: 'italic',
    color: 'rgba(255, 255, 255, 0.80)',
    textAlign: 'center',
    fontWeight: '400',
    lineHeight: 20,
    marginBottom: 24,
    zIndex: 1,
    ...Platform.select({
      ios: { fontFamily: 'System' },
      android: { fontFamily: 'sans-serif' },
      default: { fontFamily: 'System' },
    }),
  },
  button: {
    height: 48,
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'stretch',
    borderRadius: 9999,
    backgroundColor: '#FF7B00',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
    zIndex: 1,
  },
  buttonText: {
    fontSize: 14,
    color: '#FFF',
    textAlign: 'center',
    fontWeight: '600',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    ...Platform.select({
      ios: { fontFamily: 'System' },
      android: { fontFamily: 'sans-serif' },
      default: { fontFamily: 'System' },
    }),
  },
  footerContainer: {
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
