// accessibility: placeholder
import React, { useEffect, useState } from 'react';
import { View, ScrollView, ActivityIndicator, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../src/constants/theme';
import { getFestivalList } from '../src/services/api';
import FestivalSectionDetailCard from '../src/components/FestivalSectionDetailCard';

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
        <ActivityIndicator size="large" color={COLORS.primary} />
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
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#000000" />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.container}>
        <FestivalSectionDetailCard
          festival={festival}
          section={decodeURIComponent(section)}
          onBack={() => router.back()}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: SPACING.xl,
    backgroundColor: COLORS.background,
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
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    padding: SPACING.xs,
  },
});

export default FestivalSectionDetailPage;
