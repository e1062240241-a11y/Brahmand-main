import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const ZODIAC_DATA: Array<{ id: string; name: string; hindi: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }> = [
  { id: 'aries', name: 'Aries', hindi: 'Mesh', icon: 'zodiac-aries' },
  { id: 'taurus', name: 'Taurus', hindi: 'Vrishabh', icon: 'zodiac-taurus' },
  { id: 'gemini', name: 'Gemini', hindi: 'Mithun', icon: 'zodiac-gemini' },
  { id: 'cancer', name: 'Cancer', hindi: 'Kark', icon: 'zodiac-cancer' },
  { id: 'leo', name: 'Leo', hindi: 'Simha', icon: 'zodiac-leo' },
  { id: 'virgo', name: 'Virgo', hindi: 'Kanya', icon: 'zodiac-virgo' },
  { id: 'libra', name: 'Libra', hindi: 'Tula', icon: 'zodiac-libra' },
  { id: 'scorpio', name: 'Scorpio', hindi: 'Vrishchik', icon: 'zodiac-scorpio' },
  { id: 'sagittarius', name: 'Sagittarius', hindi: 'Dhanu', icon: 'zodiac-sagittarius' },
  { id: 'capricorn', name: 'Capricorn', hindi: 'Makar', icon: 'zodiac-capricorn' },
  { id: 'aquarius', name: 'Aquarius', hindi: 'Kumbh', icon: 'zodiac-aquarius' },
  { id: 'pisces', name: 'Pisces', hindi: 'Meen', icon: 'zodiac-pisces' },
];

export default function HomeJyotishSection() {
  const router = useRouter();

  return (
    <LinearGradient
      colors={['#FF8D57', '#EA9B76', '#FFEEE5']}
      locations={[0, 0.0913, 0.25]}
      style={styles.container}
    >
      <Text style={styles.title}>What's your Rashi</Text>
      
      <View style={styles.grid}>
        {ZODIAC_DATA.map((zodiac) => {
          return (
            <TouchableOpacity 
              key={zodiac.id} 
              style={styles.card}
              onPress={() => router.push('/horoscope')}
              activeOpacity={0.8}
            >
              <View style={styles.iconContainer}>
                <MaterialCommunityIcons name={zodiac.icon} size={36} color="#FF6B00" />
              </View>
              <Text style={styles.name}>{zodiac.name}</Text>
              <Text style={styles.hindiName}>{zodiac.hindi}</Text>
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
    paddingBottom: 120, // Safe padding for tab bar
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
