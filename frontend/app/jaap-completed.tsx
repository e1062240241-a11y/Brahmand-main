import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  Platform,
  Image,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../src/store/authStore';
import { useLanguageStore } from '../src/utils/i18n';

// 🧡 Engagement: Reframed jaap completion screen from transactional task completion ("You Have Done It!")
//               to devotional offering ("आपकी साधना पूर्ण हुई 🙏").
// Lever: Reframing + Devotion + Mother Tongue (Hindi Primary)
// Why: "आपकी साधना पूर्ण हुई" connects deeply with Sanatan spiritual sentiment (bhavna),
//      turning a routine app action into a meaningful devotional milestone.
// UI: Text-only change, zero structural or visual component modifications.
export default function JaapCompleted() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const language = useLanguageStore((state) => state.language);
  const isHindi = language === 'hi';

  const handlePressContinue = () => {
    router.replace('/(tabs)/home');
  };

  return (
    <ImageBackground
      source={{ uri: 'https://brahmandfeed23.b-cdn.net/assets/jaap_complete_bg.webp' }}
      style={styles.container}
      resizeMode="cover"
    >
      <View
        style={[
          styles.safeArea,
          {
            paddingTop: Math.max(insets.top, 16),
            paddingBottom: Math.max(insets.bottom, 16),
          },
        ]}
      >
        {/* Header Section */}
        <View style={styles.headerContainer}>
          {/* Header Lotus Icon */}
          <View style={styles.lotusContainer}>
            <Image
              source={{ uri: 'https://brahmandfeed23.b-cdn.net/assets/pink_lotus_splash.webp' }}
              style={styles.lotusImage}
              resizeMode="cover"
            />
          </View>

          {/* Heading Section */}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>
              {isHindi ? 'आपकी साधना पूर्ण हुई 🙏' : 'You Have Done It!'}
            </Text>
            {user?.name ? (
              <Text style={styles.userName}>{user.name.trim()}</Text>
            ) : null}
          </View>
          
          <Text style={styles.subtitle}>
            {isHindi
              ? 'आपका समय, आपका समर्पण, आपकी साधना\n— ईश्वर को सहर्ष समर्पित है।'
              : 'Your effort, your time, your energy\n— all have meaning.'}
          </Text>
        </View>

        {/* Spacer to expose the meditating person image in the background */}
        <View style={styles.middleSpacer} />

        {/* Glassmorphic Card */}
        <View style={styles.cardWrapper}>
          <BlurView 
            intensity={35} 
            tint="light" 
            style={[StyleSheet.absoluteFillObject, { borderRadius: 24 }]} 
          />
          <View style={styles.cardContent}>
            <Text style={styles.cardText1}>
              {isHindi ? (
                <>
                  आपकी इस पावन साधना का विवरण आपके{' '}
                  <Text style={styles.cardText1Bold}>Brahmand Passport</Text> में अंकित कर दिया गया है।
                </>
              ) : (
                <>
                  Your journey and records are now stored in your{' '}
                  <Text style={styles.cardText1Bold}>Brahmand Passport</Text>.
                </>
              )}
            </Text>
            <Text style={styles.cardText2}>
              {isHindi
                ? 'इस पवित्र भाव को मन में बनाए रखें। ✨'
                : "Carry this feeling forward.\nYou're capable of amazing things. ✨"}
            </Text>

            {/* Button */}
            <TouchableOpacity
              style={styles.button}
              activeOpacity={0.85}
              onPress={handlePressContinue}
            >
              <Text style={styles.buttonText}>
                {isHindi ? 'मुख्य पृष्ठ पर लौटें' : 'BACK TO HOME'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Space after card */}
        <View style={{ height: 12 }} />

        {/* Footer Mantra */}
        <View style={styles.footerContainer}>
          <Text style={styles.footerMantra}>
            {isHindi ? 'संकल्प • साधना • शांति' : 'PURPOSE • PROGRESS • PEACE'}
          </Text>
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
    paddingHorizontal: 16,
  },
  headerContainer: {
    alignItems: 'center',
    alignSelf: 'center',
    width: '100%',
    marginTop: 2,
    gap: 8,
  },
  lotusContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  lotusImage: {
    width: '100%',
    height: '100%',
  },
  titleContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  title: {
    fontSize: 32,
    color: '#3F1E19',
    textAlign: 'center',
    fontWeight: '800',
    lineHeight: 38,
    fontFamily: 'Outfit_700Bold',
    letterSpacing: -0.5,
  },
  userName: {
    fontSize: 32,
    color: '#3F1E19',
    textAlign: 'center',
    fontWeight: '800',
    lineHeight: 38,
    fontFamily: 'Outfit_700Bold',
    letterSpacing: -0.5,
    marginTop: 2,
  },
  subtitle: {
    fontSize: 16,
    color: '#5A4136',
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 22,
    paddingHorizontal: 20,
    fontFamily: 'Outfit_600SemiBold',
    marginTop: 4,
    alignSelf: 'center',
  },
  middleSpacer: {
    flex: 1,
    minHeight: 12,
    maxHeight: 120,
    alignSelf: 'center',
  },
  cardWrapper: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: Platform.OS === 'android' ? 0 : 8,
    overflow: 'hidden',
  },
  cardContent: {
    paddingHorizontal: 28,
    paddingVertical: 32,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText1: {
    fontSize: 17,
    color: '#FFF',
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 24,
    marginBottom: 12,
    zIndex: 1,
    fontFamily: 'Outfit_600SemiBold',
  },
  cardText1Bold: {
    fontFamily: 'Outfit_700Bold',
    fontWeight: '700',
    fontSize: 17,
    lineHeight: 24,
    color: '#FFF',
  },
  cardText2: {
    fontSize: 14,
    fontStyle: 'italic',
    color: 'rgba(255, 255, 255, 0.90)',
    textAlign: 'center',
    fontWeight: '400',
    lineHeight: 20,
    marginBottom: 16,
    zIndex: 1,
    fontFamily: 'Outfit_400Regular',
  },
  button: {
    height: 48,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'stretch',
    borderRadius: 24,
    backgroundColor: '#FF6B00',
    shadowColor: '#FF6B00',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
    zIndex: 1,
  },
  buttonText: {
    fontSize: 15,
    color: '#FFF',
    textAlign: 'center',
    fontWeight: '700',
    letterSpacing: 0.5,
    fontFamily: 'Outfit_700Bold',
  },
  footerContainer: {
    alignItems: 'center',
    alignSelf: 'center',
    width: '100%',
  },
  footerMantra: {
    fontSize: 13,
    fontFamily: 'Outfit_700Bold',
    color: 'rgba(255, 255, 255, 0.8)',
    letterSpacing: 1.5,
    textAlign: 'center',
  },
});
