// accessibility: placeholder
import React, { useEffect, useState } from 'react';
import { View, ScrollView, ActivityIndicator, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING } from '../src/constants/theme';
import { getFestivalList } from '../src/services/api';
import FestivalSectionDetailCard from '../src/components/FestivalSectionDetailCard';
import { CustomLoader } from '../src/components/CustomLoader';

const FestivalSectionDetailPage = () => {
  const params = useLocalSearchParams();
  const router = useRouter();
  const festivalIndex = Number(params?.index ?? params?.festivalIndex ?? -1);
  const section = String(params?.section ?? 'About');
  const [festival, setFestival] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadFestival = async () => {
      if (Number.isNaN(festivalIndex) || festivalIndex < 0) {
        setError('Festival not found.');
        setLoading(false);
        return;
      }

      try {
        const response = await getFestivalList();
        const items = response.data || [];
        const selected = items[festivalIndex];
        if (!selected) {
          setError('Festival not found.');
        } else {
          setFestival(selected);
        }
      } catch (err) {
        console.warn('Failed to load festival section', err);
        setError('Unable to load festival section.');
      } finally {
        setLoading(false);
      }
    };

    loadFestival();
  }, [festivalIndex]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <CustomLoader size={70} message="Loading Festival Section..." />
      </View>
    );
  }

  if (error || !festival) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error || 'Something went wrong.'}</Text>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={['#FF8D57', '#EA9B76', '#FFEEE5']}
      locations={[0, 0.1058, 0.2212]}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace(`/festival-detail?index=${festivalIndex}`);
              }
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-back" size={28} color="#000000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{decodeURIComponent(section)}</Text>
          <View style={styles.headerPlaceholder} />
        </View>
        <ScrollView contentContainerStyle={styles.container}>
          <FestivalSectionDetailCard
            festival={festival}
            section={decodeURIComponent(section)}
            onBack={() => router.back()}
          />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: SPACING.xl,
    backgroundColor: 'transparent',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: SPACING.md,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 14,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: 'transparent',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    color: '#111827',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  headerPlaceholder: {
    width: 40,
  },
});

export default FestivalSectionDetailPage;
