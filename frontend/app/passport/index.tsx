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
import { useIsFocused } from 'expo-router';

const { width: windowWidth } = Dimensions.get('window');

export default function PassportCoverScreen() {
  const router = useRouter();
  const loadPassport = usePassportStore((state) => state.loadPassport);
  const { user } = useAuthStore();
  const isFocused = useIsFocused();

  const [isOpening, setIsOpening] = useState(false);

  useEffect(() => {
    loadPassport();
  }, []);

  useEffect(() => {
    if (isFocused) {
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
    router.push('/passport/inner' as any);
  };

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
          <View style={styles.cardContainer}>
            <Image 
              source={{ uri: 'https://brahmandfeed23.b-cdn.net/assets/pass.webp' }}
              style={styles.passportImage}
              contentFit="contain"
            />
            <View style={styles.textOverlay}>
              <Text style={styles.userName}>{user?.name || 'Sanatani'}</Text>
              <Text style={styles.subText}>Your Sanatani Passport</Text>
            </View>
          </View>
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 0,
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
