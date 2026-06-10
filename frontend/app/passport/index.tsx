import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Platform } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { usePassportStore } from '../../src/store/passportStore';
import { useAuthStore } from '../../src/store/authStore';
import { getUserProfile } from '../../src/services/api';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { useIsFocused } from '@react-navigation/native';

const { width: windowWidth } = Dimensions.get('window');

export default function PassportCoverScreen() {
  const router = useRouter();
  const loadPassport = usePassportStore((state) => state.loadPassport);
  const { user } = useAuthStore();
  const isFocused = useIsFocused();

  // Animation values
  const floatingY = useSharedValue(0);
  const openProgress = useSharedValue(0);
  const [isOpening, setIsOpening] = useState(false);

  useEffect(() => {
    loadPassport();
  }, []);

  useEffect(() => {
    if (isFocused) {
      // Reset animation states when returning to cover screen
      openProgress.value = 0;
      setIsOpening(false);

      // Fetch latest profile from backend
      const fetchLatest = async () => {
        try {
          const res = await getUserProfile();
          if (res.data) {
            useAuthStore.getState().updateUser(res.data);
          }
        } catch (e) {
          console.warn('[PassportCover] Profile fetch failed:', e);
        }
      };
      fetchLatest();
      
      // Start subtle floating animation while idle
      floatingY.value = withRepeat(
        withSequence(
          withTiming(-8, { duration: 2500, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: 2500, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        true
      );
    }
  }, [isFocused]);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/home' as any);
    }
  };

  const handleOpenPassport = () => {
    if (isOpening) return;
    setIsOpening(true);

    // Stop floating smoothly
    floatingY.value = withTiming(0, { duration: 300 });

    // Animate book opening
    openProgress.value = withTiming(1, {
      duration: 1200,
      easing: Easing.bezier(0.25, 1, 0.5, 1),
    });

    setTimeout(() => {
      router.push('/passport/inner' as any);
    }, 1000);
  };

  const animatedCoverStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(openProgress.value, [0, 1], [0, -110]);
    // Move to the left so the spine stays somewhat grounded
    const translateX = interpolate(openProgress.value, [0, 1], [0, -windowWidth * 0.3]);
    const scale = interpolate(openProgress.value, [0, 0.5, 1], [1, 1.15, 1.3]);
    const opacity = interpolate(openProgress.value, [0, 0.8, 1], [1, 1, 0]);

    return {
      opacity,
      transform: [
        { perspective: 1200 },
        { translateY: floatingY.value },
        { translateX },
        { scale },
        { rotateY: `${rotateY}deg` },
      ],
    };
  });

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      {/* Background Peach to Cream Gradient */}
      <LinearGradient 
        colors={['#FF8D57', '#EA9B76', '#FFEEE5']} 
        locations={[0, 0.0913, 0.25]}
        style={StyleSheet.absoluteFillObject}
      />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>BRAHMAND PASSPORT</Text>
      </View>

      {/* Main Content Area */}
      <View style={styles.content}>
        <TouchableOpacity 
          activeOpacity={0.9}
          onPress={handleOpenPassport}
          disabled={isOpening}
        >
          <Animated.View style={[styles.cardContainer, animatedCoverStyle]}>
            <Image 
              source={require('../../assets/images/pass.png')}
              style={styles.passportImage}
              contentFit="contain"
            />
            <View style={styles.textOverlay}>
              <Text style={styles.userName}>{user?.name || 'Sanatani'}</Text>
              <Text style={styles.subText}>Your Sanatani Passport</Text>
            </View>
          </Animated.View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 20,
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    left: 16,
    top: 10,
    padding: 8,
    zIndex: 10,
  },
  headerTitle: {
    marginTop: 40,
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 160,
  },
  cardContainer: {
    width: 287,
    height: 364,
    aspectRatio: 41 / 52,
    borderRadius: 20,
    backgroundColor: 'transparent',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
      },
      android: {
        elevation: 0,
      },
      default: {
        elevation: 0,
      }
    }),
    marginBottom: 24,
    alignItems: 'center',
  },
  passportImage: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    position: 'absolute',
  },
  textOverlay: {
    position: 'absolute',
    bottom: 50,
    alignItems: 'center',
    width: '100%',
  },
  userName: {
    color: '#FED274',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  subText: {
    color: '#FED274',
    fontSize: 10,
    fontWeight: '600',
  },
  helperText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    letterSpacing: 0.5,
    opacity: 0.8,
  },
});
