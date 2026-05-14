import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  SafeAreaView,
  StatusBar,
  ImageBackground,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function LiveJaapRoom() {
  const router = useRouter();
  const [count, setCount] = useState(12842);
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    ).start();

    const interval = setInterval(() => {
      setCount(prev => prev + Math.floor(Math.random() * 5));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <ImageBackground 
        source={require('../assets/images/jaap_hero_final_clean.png')} 
        style={StyleSheet.absoluteFill}
        blurRadius={10}
      >
        <LinearGradient
          colors={['rgba(0,0,0,0.7)', 'rgba(45,20,0,0.9)']}
          style={StyleSheet.absoluteFill}
        />

        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
              <Ionicons name="close" size={28} color="#FFF" />
            </TouchableOpacity>
            <View style={styles.sessionTitleBox}>
               <Text style={styles.roomTitle}>Maha Mrityunjaya Jaap</Text>
            </View>
            <View style={styles.devoteeBadge}>
              <View style={styles.pulseDot} />
              <Text style={styles.devoteeText}>{count.toLocaleString()} Devotees</Text>
            </View>
          </View>

          <View style={styles.centerContent}>
            <Animated.View style={[styles.glowCircle, { opacity: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.2, 0.4] }) }]} />
            <Text style={styles.omSymbol}>ॐ</Text>
            
            <View style={styles.lyricsContainer}>
              <Text style={styles.lyricsHindi}>ॐ त्र्यम्बकं यजामहे</Text>
              <Text style={styles.lyricsEnglish}>Om Tryambakam Yajamahe</Text>
            </View>
          </View>

          <View style={styles.footer}>
            <View style={styles.audioSync}>
              <Ionicons name="mic" size={24} color="#FF6600" />
              <Text style={styles.syncText}>Voice Synchronized</Text>
            </View>
            
            <TouchableOpacity style={styles.leaveBtn} onPress={() => router.back()}>
              <Text style={styles.leaveBtnText}>Leave Room</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sessionTitleBox: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 10,
  },
  roomTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  devoteeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,102,0,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,102,0,0.3)',
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF6600',
    marginRight: 8,
  },
  devoteeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glowCircle: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#FF6600',
  },
  omSymbol: {
    fontSize: 120,
    color: '#FFF',
    fontWeight: 'bold',
    textShadowColor: 'rgba(255,102,0,0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  lyricsContainer: {
    marginTop: 60,
    alignItems: 'center',
  },
  lyricsHindi: {
    fontSize: 42,
    color: '#FFF',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  lyricsEnglish: {
    fontSize: 24,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 10,
    fontWeight: '600',
  },
  footer: {
    padding: 30,
    alignItems: 'center',
  },
  audioSync: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 8,
  },
  syncText: {
    color: '#FF6600',
    fontSize: 14,
    fontWeight: '700',
  },
  leaveBtn: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 30,
  },
  leaveBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
