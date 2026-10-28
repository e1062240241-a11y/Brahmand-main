import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import {
  CityMoonriseData,
  detectUserMoonCity,
  getKarwaMoonriseCountdown,
  getInitialUserMoonCity,
} from '../../utils/karwaMoonrise';

export const HomeCornerMoonCountdown = React.memo(function HomeCornerMoonCountdown() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [selectedCity, setSelectedCity] = useState<CityMoonriseData>(() => getInitialUserMoonCity(user));
  const [now, setNow] = useState<Date>(new Date());

  // Load selected city from storage or profile location or GPS
  useEffect(() => {
    let isMounted = true;
    detectUserMoonCity(user).then((city) => {
      if (isMounted && city) {
        setSelectedCity(city);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [user]);

  // Real-time ticking interval every second
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const { timeStr } = useMemo(() => {
    return getKarwaMoonriseCountdown(selectedCity, now);
  }, [now, selectedCity]);

  const handlePress = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (_e) {}
    router.push({
      pathname: '/festival-detail',
      params: { name: 'Karva Chauth' },
    });
  };

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={`करवा चौथ चंद्रोदय उल्टी गिनती ${selectedCity.hindiCity} ${timeStr}`}
      style={styles.container}
    >
      <View style={styles.topRow}>
        <Text style={styles.timerText} numberOfLines={1}>
          {timeStr}
        </Text>
      </View>
      <View style={styles.bottomRow}>
        <Text style={styles.subText} numberOfLines={1}>
          चंद्रोदय • {selectedCity.hindiCity.split('/')[0].trim()}
        </Text>
        <Text style={styles.arrowText}>›</Text>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
    paddingVertical: 1,
    paddingHorizontal: 2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timerText: {
    color: '#7C1D1D', // Deep auspicious vermilion/maroon
    fontSize: Platform.OS === 'android' ? 12 : 13,
    fontWeight: '800',
    letterSpacing: 0.5,
    fontVariant: ['tabular-nums'],
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 0.5,
    gap: 2,
  },
  subText: {
    color: '#9A3412', // Rich saffron terracotta
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  arrowText: {
    color: '#C2410C',
    fontSize: 11,
    fontWeight: '800',
    lineHeight: 11,
    marginLeft: 1,
  },
});
