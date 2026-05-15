import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useAudioPlayer } from 'expo-audio';
import { useRouter } from 'expo-router';
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const MANTRA = 'ॐ भूर्भुवः स्वः तत्सवितुर्वरेण्यं भर्गो देवस्य धीमहि धियो यो नः प्रचोदयात्';
const WORDS = MANTRA.split(' ');
const BG_MUSIC = require('../../../assets/audio/audio ekant/leberch-yoga-509070.mp3');

export const LiveMantraRoom = () => {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [roomMuted, setRoomMuted] = useState(false);
  const [isMicEnabled, setIsMicEnabled] = useState(false);

  const bgPlayer = useAudioPlayer(BG_MUSIC);

  useEffect(() => {
    if (bgPlayer) {
      bgPlayer.loop = true;
      bgPlayer.volume = isMuted ? 0 : 0.4;
      // Note: On some browsers, auto-play might still be blocked until user interacts.
      // But since user clicks "Join" to reach this screen, it should work.
      try {
        bgPlayer.play();
      } catch (e) {
        console.warn('Background player failed to auto-play on web:', e);
      }
    }
  }, [bgPlayer, isMuted]);

  const activeIndexAnim = useRef(new Animated.Value(0)).current;
  const glowOpacity = useRef(new Animated.Value(0.3)).current;
  const upcomingFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowOpacity, {
          toValue: 0.9,
          duration: 4000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glowOpacity, {
          toValue: 0.3,
          duration: 4000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [glowOpacity]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(upcomingFade, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(upcomingFade, {
          toValue: 0,
          duration: 2200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.delay(1600),
      ])
    ).start();
  }, [upcomingFade]);

  useEffect(() => {
    Animated.timing(activeIndexAnim, {
      toValue: currentIndex,
      duration: 900,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [activeIndexAnim, currentIndex]);

  const handleClose = useCallback(() => {
    if (router.canGoBack?.()) {
      router.back();
    } else {
      router.replace('/live-mantra');
    }
  }, [router]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (isHolding) {
      timer = setTimeout(() => {
        setIsHolding(false);
        setCurrentIndex(0);
      }, 5000);
      return () => clearTimeout(timer);
    }
    timer = setTimeout(() => {
      if (currentIndex < WORDS.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        setIsHolding(true);
      }
    }, 1800);
    return () => clearTimeout(timer);
  }, [currentIndex, isHolding]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <View style={styles.background}> 
        <LinearGradient
          colors={['#050505', '#120800', '#2f1200']}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <View style={styles.silhouetteOverlay} pointerEvents="none" />
        <View style={styles.header}>
          <View style={styles.statusBlock}>
            <Text style={styles.subTitle}>Live Mantra Room (Web)</Text>
            <Text style={styles.statusText}>Audio limited on web</Text>
          </View>
          <TouchableOpacity
            onPress={() => setIsMuted((prev) => !prev)}
            style={styles.muteButton}
          >
            <Ionicons name={isMuted ? 'volume-mute' : 'volume-high'} size={22} color="#FFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.centerContainer}>
          <View style={styles.glowRing}>
            <Animated.View style={[styles.glowPulse, { opacity: glowOpacity }]} />
          </View>

          <View style={styles.mantraRow}>
            {WORDS.map((word, index) => {
              const scale = activeIndexAnim.interpolate({
                inputRange: [index - 0.8, index, index + 0.8],
                outputRange: [0.95, 1.18, 0.95],
                extrapolate: 'clamp',
              });
              const opacity = activeIndexAnim.interpolate({
                inputRange: [index - 0.8, index, index + 0.8],
                outputRange: [0.22, 1, 0.22],
                extrapolate: 'clamp',
              });
              return (
                <Animated.Text
                  key={`${word}-${index}`}
                  style={[
                    styles.mantraWord,
                    {
                      transform: [{ scale }],
                      opacity,
                      textShadowColor: index === currentIndex ? '#ffd770' : 'transparent',
                      textShadowRadius: index === currentIndex ? 24 : 0,
                    },
                  ]}
                >
                  {word}
                </Animated.Text>
              );
            })}
          </View>

          <Animated.View style={[styles.upcomingContainer, { opacity: upcomingFade }]}> 
            <Text style={styles.upcomingLabel}>Upcoming Mantra</Text>
            <Text style={styles.upcomingText}>ॐ भूर्भुवः स्वः</Text>
          </Animated.View>

          <View style={styles.controlPanel}>
            <TouchableOpacity
              style={[styles.controlButton, isMicEnabled && styles.controlButtonActive]}
              onPress={() => setIsMicEnabled(!isMicEnabled)}
            >
              <Ionicons name={isMicEnabled ? 'mic' : 'mic-off'} size={22} color="#FFF" />
              <Text style={styles.controlLabel}>{isMicEnabled ? 'Mic On' : 'Mic Off'}</Text>
            </TouchableOpacity>
          </View>
        </View>

      </View>
      <TouchableOpacity
        style={styles.closeButton}
        onPress={handleClose}
        activeOpacity={0.8}
      >
        <Ionicons name="close" size={26} color="#FFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#050505' },
  background: { flex: 1, paddingHorizontal: 24, paddingTop: 40, paddingBottom: 96, overflow: 'hidden' },
  silhouetteOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255, 160, 35, 0.08)', opacity: 0.4 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, zIndex: 2 },
  statusBlock: { flex: 1 },
  subTitle: { color: '#FFF', fontSize: 16, fontWeight: '600', letterSpacing: 1.1 },
  statusText: { color: 'rgba(255,255,255,0.68)', fontSize: 12, marginTop: 4 },
  muteButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.12)', justifyContent: 'center', alignItems: 'center' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', zIndex: 1 },
  glowRing: { position: 'absolute', width: 320, height: 320, borderRadius: 160, borderWidth: 1, borderColor: 'rgba(255,215,120,0.16)', alignItems: 'center', justifyContent: 'center' },
  glowPulse: { position: 'absolute', width: 260, height: 260, borderRadius: 130, backgroundColor: 'rgba(255, 205, 74, 0.14)' },
  mantraRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12, paddingHorizontal: 16, zIndex: 2 },
  mantraWord: { color: '#FFF', fontSize: 38, fontWeight: '700', marginHorizontal: 6, textAlign: 'center' },
  upcomingContainer: { position: 'absolute', bottom: 48, alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.08)' },
  upcomingLabel: { color: 'rgba(255,255,255,0.55)', fontSize: 12, letterSpacing: 1.4, marginBottom: 4 },
  upcomingText: { color: '#FFEBB5', fontSize: 14, fontWeight: '600' },
  controlPanel: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 26 },
  controlButton: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)', backgroundColor: 'rgba(255,255,255,0.08)' },
  controlButtonActive: { backgroundColor: 'rgba(255,215,121,0.18)', borderColor: 'rgba(255,215,121,0.35)' },
  controlButtonMuted: { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.18)' },
  controlLabel: { color: '#FFF', fontSize: 13, fontWeight: '600' },
  closeButton: { position: 'absolute', top: 30, left: 20, width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.12)', justifyContent: 'center', alignItems: 'center', zIndex: 3 },
});
