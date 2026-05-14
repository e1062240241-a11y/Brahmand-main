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
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function LiveJaapRoom() {
  const router = useRouter();
  const [count, setCount] = useState(12842);
  const glowAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Glowing Aura Animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 2500, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0, duration: 2500, useNativeDriver: true }),
      ])
    ).start();

    // Subtle Breathing Pulse for Om
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 3000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 3000, useNativeDriver: true }),
      ])
    ).start();

    const interval = setInterval(() => {
      setCount(prev => prev + Math.floor(Math.random() * 3));
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <ImageBackground 
        source={require('../assets/images/jaap_hero_shiva_final.png')} 
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['rgba(26,11,8,0.7)', 'rgba(26,11,8,0.95)']}
          style={StyleSheet.absoluteFill}
        />

        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
              <Ionicons name="chevron-down" size={28} color="#FFF" />
            </TouchableOpacity>
            
            <View style={styles.sessionTitleBox}>
               <Text style={styles.roomTitle}>Maha Mrityunjaya Jaap</Text>
               <View style={styles.liveIndicatorRow}>
                 <View style={styles.pulseDot} />
                 <Text style={styles.liveStatusText}>LIVE CHANTING</Text>
               </View>
            </View>

            <View style={styles.devoteeBadge}>
              <Ionicons name="people" size={14} color="#FFF" />
              <Text style={styles.devoteeText}>{count.toLocaleString()}</Text>
            </View>
          </View>

          <View style={styles.centerContent}>
            {/* RADIANT GLOWING AURA */}
            <Animated.View style={[
              styles.glowCircle, 
              { 
                opacity: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.15, 0.35] }),
                transform: [{ scale: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.4] }) }]
              }
            ]} />
            
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <Text style={styles.omSymbol}>ॐ</Text>
            </Animated.View>
            
            <View style={styles.lyricsContainer}>
              <Text style={styles.lyricsHindi}>ॐ त्र्यम्बकं यजामहे</Text>
              <Text style={styles.lyricsEnglish}>Om Tryambakam Yajamahe</Text>
              <View style={styles.lyricsHighlightBar} />
            </View>
          </View>

          <View style={styles.footer}>
            <View style={styles.audioSyncBox}>
              <LinearGradient
                colors={['rgba(255,102,0,0.1)', 'transparent']}
                style={StyleSheet.absoluteFill}
                borderRadius={20}
              />
              <Ionicons name="mic-circle" size={32} color="#FF6600" />
              <Text style={styles.syncText}>Voice Synchronized</Text>
              <View style={styles.waveformContainer}>
                {[1, 2, 3, 4, 5].map(i => (
                  <View key={i} style={[styles.waveBar, { height: 10 + Math.random() * 15 }]} />
                ))}
              </View>
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
    backgroundColor: '#1A0B08',
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
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sessionTitleBox: {
    flex: 1,
    alignItems: 'center',
  },
  roomTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '900',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    letterSpacing: 0.5,
  },
  liveIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  liveStatusText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginLeft: 6,
  },
  devoteeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF3B30',
  },
  devoteeText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glowCircle: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: '#FF6600',
    shadowColor: '#FF6600',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 50,
  },
  omSymbol: {
    fontSize: 140,
    color: '#FFF',
    fontWeight: 'bold',
    textShadowColor: 'rgba(255,102,0,0.9)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 30,
  },
  lyricsContainer: {
    marginTop: 80,
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  lyricsHindi: {
    fontSize: 36,
    color: '#FFF',
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 1,
  },
  lyricsEnglish: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 15,
    fontWeight: '700',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  lyricsHighlightBar: {
    width: 40,
    height: 3,
    backgroundColor: '#FF6600',
    marginTop: 25,
    borderRadius: 2,
  },
  footer: {
    paddingBottom: 40,
    paddingHorizontal: 30,
    alignItems: 'center',
  },
  audioSyncBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 40,
    marginBottom: 30,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  syncText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginLeft: 10,
  },
  waveBar: {
    width: 3,
    backgroundColor: '#FF6600',
    borderRadius: 1.5,
  },
  leaveBtn: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 50,
    paddingVertical: 16,
    borderRadius: 35,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  leaveBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
