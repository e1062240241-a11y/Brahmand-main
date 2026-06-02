// accessibility: placeholder
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '../utils/i18n';
import { getUserHoroscope } from '../services/api';
import { LinearGradient } from 'expo-linear-gradient';

export default function HomeJyotishSection() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');

  const fetchDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getUserHoroscope();
      setData(res.data);
    } catch (err: any) {
      console.warn('Failed to load jyotish details', err);
      setError(err?.response?.data?.detail || 'Failed to load details from backend');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FFD26C" />
        <Text style={styles.loadingText}>Reading your cosmic alignments...</Text>
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={48} color="#FF6B00" />
        <Text style={styles.errorText}>{error || 'Could not load details'}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchDetails}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (data.has_profile === false) {
    return (
      <View style={styles.center}>
        <Ionicons name="moon-outline" size={48} color="#FF6B00" />
        <Text style={styles.errorText}>{data.message}</Text>
        <Text style={{ marginTop: 10, color: '#666', textAlign: 'center' }}>
          Please go to Kundli / Astrology tab to set your birth details.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#FFECE0', '#FFFFFF']} style={styles.card}>
        <View style={styles.header}>
            <Ionicons name="star" size={24} color="#FF6B00" />
            <Text style={styles.title}>Your Daily Horoscope</Text>
        </View>
        <Text style={styles.rashiText}>{data.rashi_english || data.rashi} • Zodiac</Text>

        {data.prediction ? (
          <Text style={styles.prediction}>{data.prediction}</Text>
        ) : (
          <Text style={styles.prediction}>The universe is quiet today. Stay peaceful.</Text>
        )}

        <View style={styles.luckyRow}>
            {data.lucky_color ? (
              <View style={[styles.luckyPill, { backgroundColor: data.lucky_color.toLowerCase() === 'white' ? '#EEE' : data.lucky_color.toLowerCase() }]}>
                 <Text style={[styles.luckyText, { color: ['yellow', 'white'].includes(data.lucky_color.toLowerCase()) ? '#000' : '#FFF' }]}>
                   Color: {data.lucky_color}
                 </Text>
              </View>
            ) : null}
            {data.lucky_numbers && data.lucky_numbers.length > 0 ? (
              <View style={styles.luckyPillOutline}>
                 <Text style={styles.luckyTextDark}>Lucky Number: {data.lucky_numbers.join(', ')}</Text>
              </View>
            ) : null}
            {data.lucky_number ? (
               <View style={styles.luckyPillOutline}>
                 <Text style={styles.luckyTextDark}>Lucky Number: {data.lucky_number}</Text>
               </View>
            ) : null}
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
    fontWeight: '600',
  },
  errorText: {
    marginTop: 16,
    color: '#333',
    fontWeight: '600',
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 20,
    backgroundColor: '#FF6B00',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFF',
    fontWeight: '700',
  },
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#333',
    marginLeft: 8,
  },
  rashiText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B00',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  prediction: {
    fontSize: 16,
    lineHeight: 24,
    color: '#444',
    marginBottom: 20,
  },
  luckyRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  luckyPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 100,
    alignItems: 'center',
  },
  luckyPillOutline: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FF6B00',
    minWidth: 100,
    alignItems: 'center',
  },
  luckyText: {
    fontWeight: '700',
    fontSize: 14,
  },
  luckyTextDark: {
    fontWeight: '700',
    fontSize: 14,
    color: '#FF6B00',
  }
});
