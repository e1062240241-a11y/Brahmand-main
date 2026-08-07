import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, useWindowDimensions, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Image as ExpoImage } from 'expo-image';

const { width } = Dimensions.get('window');

const ZODIAC_DATA = [
  { id: 'aries', name: 'Aries', hindi: 'Mesh', image: require('../../assets/images/tab-bar/rashi/Aries.webp') },
  { id: 'taurus', name: 'Taurus', hindi: 'Vrishabh', image: require('../../assets/images/tab-bar/rashi/Taurus.webp') },
  { id: 'gemini', name: 'Gemini', hindi: 'Mithun', image: require('../../assets/images/tab-bar/rashi/gemini.webp') },
  { id: 'cancer', name: 'Cancer', hindi: 'Kark', image: require('../../assets/images/tab-bar/rashi/cancer.webp') },
  { id: 'leo', name: 'Leo', hindi: 'Simha', image: require('../../assets/images/tab-bar/rashi/Leo.webp') },
  { id: 'virgo', name: 'Virgo', hindi: 'Kanya', image: require('../../assets/images/tab-bar/rashi/Virgo.webp') },
  { id: 'libra', name: 'Libra', hindi: 'Tula', image: require('../../assets/images/tab-bar/rashi/Libra.webp') },
  { id: 'scorpio', name: 'Scorpio', hindi: 'Vrishchik', image: require('../../assets/images/tab-bar/rashi/Scorpio.webp') },
  { id: 'sagittarius', name: 'Sagittarius', hindi: 'Dhanu', image: require('../../assets/images/tab-bar/rashi/sagittarius.webp') },
  { id: 'capricorn', name: 'Capricorn', hindi: 'Makar', image: require('../../assets/images/tab-bar/rashi/Capricorn.webp') },
  { id: 'aquarius', name: 'Aquarius', hindi: 'Kumbh', image: require('../../assets/images/tab-bar/rashi/Aquarius.webp') },
  { id: 'pisces', name: 'Pisces', hindi: 'Meen', image: require('../../assets/images/tab-bar/rashi/Pisces.webp') },
];

export default function HomeJyotishSection() {
  const router = useRouter();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const dynamicWidth = Platform.OS === 'android' ? windowWidth : width;
  const dynamicHeight = Platform.OS === 'android' ? windowHeight : Dimensions.get('window').height;

  return (
    <LinearGradient
      colors={['#FF8D57', '#EA9B76', '#FFEEE5']}
      locations={[0, 0.0913, 0.25]}
      style={[styles.container, Platform.OS === 'android' && { minHeight: dynamicHeight }]}
    >
      <Text style={[styles.title, Platform.OS === 'android' && { fontSize: 22, marginBottom: 20 }]}>What's your Rashi</Text>
      
      <View style={styles.grid}>
        {ZODIAC_DATA.map((zodiac) => {
          return (
            <TouchableOpacity 
              key={zodiac.id} 
              style={[
                styles.card, 
                Platform.OS === 'android' && { 
                  width: (dynamicWidth - 32 - 24) / 3,
                  padding: 10,
                  borderRadius: 16
                }
              ]}
              onPress={() = accessibilityRole="button" accessibilityLabel="Button"> router.push('/horoscope')}
              activeOpacity={0.8}
            >
              <View style={[styles.iconContainer, Platform.OS === 'android' && { width: 50, height: 50, borderRadius: 25, marginBottom: 8 }]}>
                <ExpoImage 
                  source={zodiac.image} 
                  style={Platform.OS === 'android' ? { width: 38, height: 38 } : { width: 52, height: 52 }} 
                  contentFit="contain" 
                />
              </View>
              <Text style={[styles.name, Platform.OS === 'android' && { fontSize: 13 }]}>{zodiac.name}</Text>
              <Text style={[styles.hindiName, Platform.OS === 'android' && { fontSize: 11 }]}>{zodiac.hindi}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 32,
    paddingBottom: 120, // Safe padding for tab-bar
    minHeight: Dimensions.get('window').height,
  },
  title: {
    fontSize: 26,
    color: '#FFFFFF',
    marginBottom: 32,
    textAlign: 'center',
    fontFamily: 'Inter_800ExtraBold',
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  card: {
    width: (width - 32 - 24) / 3, // 3 columns, 32 total side padding, 24 total gap (12*2)
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 24,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#FE6339',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  iconContainer: {
    width: 64,
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  name: {
    fontSize: 15,
    color: '#333333',
    marginBottom: 2,
    fontFamily: 'Inter_700Bold',
  },
  hindiName: {
    fontSize: 12,
    color: '#FF6B00',
    fontFamily: 'Inter_600SemiBold',
  }
});
