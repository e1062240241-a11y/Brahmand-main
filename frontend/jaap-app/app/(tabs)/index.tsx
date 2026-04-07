import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MANTRAS } from '../../constants/mantra';

type JaapAppProps = {
  onExit?: () => void;
};

type EnergyLevel = 'low' | 'medium' | 'high' | 'divine';
type ResultState = {
  duration: number;
  energy: EnergyLevel;
};

const COLORS = {
  saffronStart: '#F29D38',
  saffronEnd: '#F8D79A',
  gold: '#D3A53A',
  textPrimary: '#2C1A10',
  textSecondary: '#5C4338',
  softWhite: '#FFF9EE',
};

const DURATIONS = [27, 54, 108];

function SacredBackground({ children }: { children: React.ReactNode }) {
  return (
    <LinearGradient colors={[COLORS.saffronStart, COLORS.saffronEnd]} style={styles.gradient}>
      <View style={styles.mandalaOuter} />
      <View style={styles.mandalaInner} />
      {children}
    </LinearGradient>
  );
}

function Header({ title, onExit }: { title: string; onExit?: () => void }) {
  return (
    <View style={styles.header}>
      <Pressable onPress={onExit} style={styles.headerIcon} disabled={!onExit}>
        {onExit ? <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} /> : null}
      </Pressable>
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={styles.headerIcon} />
    </View>
  );
}

function Complete({
  duration,
  energy,
  onHome,
  onExit,
}: {
  duration: number;
  energy: EnergyLevel;
  onHome: () => void;
  onExit?: () => void;
}) {
  const burst = useRef(new Animated.Value(0.65)).current;

  useEffect(() => {
    Animated.spring(burst, { toValue: 1, friction: 4, useNativeDriver: true }).start();
  }, [burst]);

  return (
    <SacredBackground>
      <Header title="Live Mantra Jaap" onExit={onExit} />
      <View style={styles.completeContainer}>
        <Animated.View style={[styles.completeGlow, { transform: [{ scale: burst }] }]} />
        <Text style={styles.completeTitle}>Jaap Completed</Text>
        <Text style={styles.completeText}>Duration: {duration}</Text>
        <Text style={styles.completeText}>Energy: {energy.toUpperCase()}</Text>

        <Pressable style={styles.cta} onPress={onHome}>
          <Text style={styles.ctaText}>Return Home</Text>
        </Pressable>
      </View>
    </SacredBackground>
  );
}

function Home({
  onStart,
  count,
  targetCount,
  beads,
  onExit,
}: {
  onStart: () => void;
  count: number;
  targetCount: number;
  beads: number[];
  onExit?: () => void;
}) {
  return (
    <SacredBackground>
      <Header title="Live Mantra Jaap" onExit={onExit} />
      <View style={styles.homeContainer}>
        <View style={styles.homeBeads}>
          {beads.map((_, i) => {
            const angle = (i / targetCount) * 2 * Math.PI;
            const radius = 140;
            const x = radius * Math.cos(angle);
            const y = radius * Math.sin(angle);
            const isActive = i < count;

            return (
              <View
                key={`home-bead-${i}`}
                style={[
                  styles.homeBead,
                  {
                    backgroundColor: isActive ? '#FFD700' : 'rgba(255,255,255,0.2)',
                    transform: [{ translateX: x + 150 }, { translateY: y + 150 }],
                  },
                ]}
              />
            );
          })}
        </View>

        <Pressable style={styles.cta} onPress={onStart}>
          <Text style={styles.ctaText}>Start Jaap</Text>
        </Pressable>

        <View style={styles.homeFooter}>
          <Text style={styles.footerText}>🔥 Live chanting room</Text>
          <Text style={styles.footerText}>🧘 1,284 chanting now</Text>
        </View>
      </View>
    </SacredBackground>
  );
}

function Setup({
  mantra,
  duration,
  onSelectMantra,
  onSelectDuration,
  onContinue,
  onExit,
}: {
  mantra: (typeof MANTRAS)[number];
  duration: number;
  onSelectMantra: (value: (typeof MANTRAS)[number]) => void;
  onSelectDuration: (value: number) => void;
  onContinue: () => void;
  onExit?: () => void;
}) {
  return (
    <SacredBackground>
      <Header title="Setup Session" onExit={onExit} />
      <ScrollView contentContainerStyle={styles.setupContainer}>
        <Text style={styles.heading}>Select Mantra</Text>
        {MANTRAS.map((item) => (
          <Pressable
            key={item.id}
            style={[styles.option, mantra.id === item.id && styles.optionActive]}
            onPress={() => onSelectMantra(item)}
          >
            <Text style={styles.optionText}>{item.name}</Text>
          </Pressable>
        ))}

        <Text style={styles.heading}>Select Duration</Text>
        <View style={styles.durationRow}>
          {DURATIONS.map((item) => (
            <Pressable
              key={item}
              style={[styles.duration, duration === item && styles.optionActive]}
              onPress={() => onSelectDuration(item)}
            >
              <Text style={styles.optionText}>{item}</Text>
            </Pressable>
          ))}
        </View>

        <Pressable style={styles.cta} onPress={onContinue}>
          <Text style={styles.ctaText}>Begin Session</Text>
        </Pressable>
      </ScrollView>
    </SacredBackground>
  );
}

export default function App({ onExit }: JaapAppProps) {
  const [screen, setScreen] = useState<'home' | 'setup' | 'session' | 'complete'>('setup');
  const [selectedMantra, setSelectedMantra] = useState(MANTRAS[0]);
  const [selectedDuration, setSelectedDuration] = useState(108);
  const [targetCount, setTargetCount] = useState(108);
  const [count, setCount] = useState(0);
  const [flash, setFlash] = useState(false);
  const [result, setResult] = useState<ResultState>({ duration: 108, energy: 'low' });
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(1)).current;

  const progress = targetCount > 0 ? count / targetCount : 0;
  const beads = useMemo(() => Array.from({ length: targetCount }, (_, index) => index), [targetCount]);
  const words = useMemo(() => selectedMantra.text.split(''), [selectedMantra]);
  const [currentWord, setCurrentWord] = useState(0);

  useEffect(() => {
    setTargetCount(selectedDuration);
  }, [selectedDuration]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1.08,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [glowAnim]);

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  useEffect(() => {
    if (!sound || !isPlaying) return;

    const interval = setInterval(async () => {
      const status = await sound.getStatusAsync();

      if (status.isLoaded) {
        const position = status.positionMillis;
        const wordIndex = Math.floor(position / 800);
        setCurrentWord(wordIndex % words.length);
        setCount(Math.min(targetCount, wordIndex + 1));
      }
    }, 200);

    return () => clearInterval(interval);
  }, [isPlaying, sound, targetCount, words.length]);

  async function playMantra() {
    if (!selectedMantra?.audio) return;

    const { sound: nextSound } = await Audio.Sound.createAsync({ uri: selectedMantra.audio });
    setSound(nextSound);
    await nextSound.playAsync();
    setIsPlaying(true);
  }

  function handleTap() {
    setCount((prev) => {
      const newCount = Math.min(targetCount, prev + 1);
      const ratio = newCount / Math.max(1, targetCount);

      setCurrentWord((prevWord) => (prevWord + 1) % words.length);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      playMantra();

      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.15,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();

      if (newCount === targetCount) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setFlash(true);

        const energy: EnergyLevel =
          ratio >= 1 ? 'divine' : ratio >= 0.7 ? 'high' : ratio >= 0.4 ? 'medium' : 'low';

        setResult({
          duration: selectedDuration,
          energy,
        });

        setTimeout(() => {
          setFlash(false);
          setScreen('complete');
          setCount(0);
          setCurrentWord(0);
        }, 500);
      }

      return newCount;
    });
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />

      {screen === 'home' && (
        <Home
          onStart={() => setScreen('setup')}
          count={count}
          targetCount={targetCount}
          beads={beads}
          onExit={onExit}
        />
      )}

      {screen === 'setup' && (
        <Setup
          mantra={selectedMantra}
          duration={selectedDuration}
          onSelectMantra={setSelectedMantra}
          onSelectDuration={setSelectedDuration}
          onContinue={() => {
            setCount(0);
            setCurrentWord(0);
            setScreen('session');
          }}
          onExit={onExit}
        />
      )}

      {screen === 'session' && (
        <SacredBackground>
          <Header title="Live Mantra Jaap" onExit={onExit} />
          <View style={styles.sessionShell}>
            <Text style={styles.liveCount}>🧘 1,284 chanting now</Text>

            <View style={styles.sessionCircle}>
              <View style={styles.sessionBackgroundRing} />

              <View style={styles.sessionBeadLayer}>
                {beads.map((_, i) => {
                  const angle = (i / targetCount) * 2 * Math.PI;
                  const radius = 130;
                  const x = radius * Math.cos(angle);
                  const y = radius * Math.sin(angle);

                  return (
                    <View
                      key={`session-bead-${i}`}
                      style={{
                        position: 'absolute',
                        width: i < count ? 10 : 6,
                        height: i < count ? 10 : 6,
                        borderRadius: 5,
                        backgroundColor: i < count ? '#FFD700' : 'rgba(255,255,255,0.2)',
                        left: 130 + x - 5,
                        top: 130 + y - 5,
                      }}
                    />
                  );
                })}
              </View>

              <View
                style={[
                  styles.sessionProgressRing,
                  {
                    transform: [{ rotate: `${progress * 360}deg` }],
                  },
                ]}
              />

              {flash ? <View style={styles.flashOverlay} /> : null}

              <Animated.View
                style={{
                  transform: [{ scale: scaleAnim }, { scale: glowAnim }],
                }}
              >
                <Pressable onPress={handleTap} style={styles.sessionTapButton}>
                  <Text style={styles.sessionCountText}>
                    {count} / {targetCount}
                  </Text>

                  <Text style={styles.sessionMantraText}>
                    {words.map((word, index) => (
                      <Text
                        key={`${selectedMantra.id}-${index}`}
                        style={{
                          color: index === currentWord ? '#FFD700' : '#fff',
                          fontSize: index === currentWord ? 20 : 16,
                          fontWeight: index === currentWord ? 'bold' : 'normal',
                        }}
                      >
                        {word}
                      </Text>
                    ))}
                  </Text>

                  <Text style={styles.sessionFooter}>🔥 {count} chants • 🧘 1,284 chanting now</Text>
                </Pressable>
              </Animated.View>
            </View>
          </View>
        </SacredBackground>
      )}

      {screen === 'complete' && (
        <Complete
          duration={result.duration}
          energy={result.energy}
          onHome={() => setScreen('setup')}
          onExit={onExit}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.saffronStart,
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  headerIcon: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mandalaOuter: {
    position: 'absolute',
    width: 360,
    height: 360,
    borderRadius: 180,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    top: '30%',
    alignSelf: 'center',
  },
  mandalaInner: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.30)',
    top: '38%',
    alignSelf: 'center',
  },
  homeContainer: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '45%',
  },
  homeBeads: {
    position: 'absolute',
    width: 300,
    height: 300,
  },
  homeBead: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  homeFooter: {
    marginBottom: 28,
    gap: 4,
  },
  footerText: {
    color: COLORS.textPrimary,
    fontWeight: '600',
    textAlign: 'center',
  },
  cta: {
    backgroundColor: COLORS.gold,
    borderRadius: 999,
    paddingHorizontal: 34,
    paddingVertical: 16,
    elevation: 3,
  },
  ctaText: {
    color: COLORS.softWhite,
    fontWeight: '700',
    fontSize: 21,
  },
  setupContainer: {
    padding: 20,
    paddingTop: 40,
  },
  heading: {
    color: COLORS.textPrimary,
    fontSize: 22,
    fontWeight: '700',
    marginVertical: 12,
  },
  option: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.82)',
    marginBottom: 10,
  },
  optionActive: {
    backgroundColor: '#F1CB79',
  },
  optionText: {
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  durationRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  duration: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderRadius: 12,
    padding: 12,
  },
  sessionShell: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 36,
  },
  liveCount: {
    marginBottom: 16,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  sessionCircle: {
    width: 280,
    height: 280,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sessionBackgroundRing: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 6,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  sessionBeadLayer: {
    position: 'absolute',
    width: 260,
    height: 260,
  },
  sessionProgressRing: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 6,
    borderColor: '#FFD700',
  },
  flashOverlay: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#FFD700',
    opacity: 0.25,
    zIndex: 1,
  },
  sessionTapButton: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#F29D38',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 20,
    elevation: 20,
    paddingHorizontal: 14,
  },
  sessionCountText: {
    fontSize: 34,
    color: '#fff',
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  sessionMantraText: {
    marginTop: 10,
    textAlign: 'center',
    paddingHorizontal: 20,
    width: '100%',
  },
  sessionFooter: {
    color: '#fff',
    marginTop: 10,
    fontSize: 12,
  },
  completeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  completeGlow: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(255, 229, 156, 0.45)',
  },
  completeTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  completeText: {
    fontSize: 18,
    color: COLORS.textSecondary,
  },
});
