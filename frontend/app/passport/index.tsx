import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image, Dimensions, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { usePassportStore } from '../../src/store/passportStore';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width: windowWidth } = Dimensions.get('window');

export default function PassportCoverScreen() {
  const router = useRouter();
  const loadPassport = usePassportStore((state) => state.loadPassport);

  useEffect(() => {
    loadPassport();
  }, []);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/home' as any);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      {/* Background Peach to Cream Gradient */}
      <LinearGradient 
        colors={['#FFB085', '#FFF7F2', '#FFFDFB']} 
        style={StyleSheet.absoluteFillObject}
      />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>BRAHMAND PASSPORT</Text>
        <View style={styles.headerRightPlaceholder} />
      </View>

      {/* Main Content Area */}
      <View style={styles.content}>
        <TouchableOpacity 
          style={styles.cardContainer}
          activeOpacity={0.9}
          onPress={() => router.push('/passport/inner' as any)}
        >
          <Image 
            source={require('../../assets/images/pass.png')}
            style={styles.passportImage}
            resizeMode="contain"
          />
        </TouchableOpacity>
        
        <Text style={styles.helperText}>Tap cover to view stamps</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 56,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#000',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  headerRightPlaceholder: {
    width: 40,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 40,
  },
  cardContainer: {
    width: windowWidth * 0.8,
    maxWidth: 320,
    aspectRatio: 0.72,
    borderRadius: 20,
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
    marginBottom: 24,
  },
  passportImage: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  helperText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    letterSpacing: 0.5,
    opacity: 0.8,
  },
});
