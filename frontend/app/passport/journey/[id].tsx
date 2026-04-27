import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Share, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { usePassportStore } from '../../../src/store/passportStore';
import { Button } from '../../../src/components/Button';
import { COLORS, SPACING, BORDER_RADIUS } from '../../../src/constants/theme';

export default function PassportJourneyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const loadPassport = usePassportStore((state) => state.loadPassport);
  const journeys = usePassportStore((state) => state.journeys);

  useEffect(() => {
    loadPassport();
  }, []);

  const journey = useMemo(() => journeys.find((item) => item.id === id), [journeys, id]);

  if (!journey) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Journey not found.</Text>
          <Button title="Back to Timeline" onPress={() => router.push('/passport/timeline' as any)} />
        </View>
      </SafeAreaView>
    );
  }

  const handleShare = async () => {
    await Share.share({
      message: `${journey.title} – ${journey.location}\n\n${journey.generated_story}`,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{journey.title}</Text>
        <Text style={styles.meta}>{journey.location} · {new Date(journey.date).toDateString()}</Text>
        <View style={styles.visibilityBadge}>
          <Text style={styles.visibilityText}>{journey.visibility.toUpperCase()}</Text>
        </View>

        <View style={styles.storyCard}>
          <Text style={styles.storyText}>{journey.generated_story}</Text>
        </View>

        {journey.media.length > 0 && (
          <View style={styles.mediaSection}>
            <Text style={styles.sectionTitle}>Media</Text>
            {journey.media.map((item) => (
              <Text key={item.id} style={styles.mediaItem}>{item.type.toUpperCase()}: {item.uri}</Text>
            ))}
          </View>
        )}

        <View style={styles.answersSection}>
          <Text style={styles.sectionTitle}>Journey Notes</Text>
          {journey.answers.map((item) => (
            <View key={item.question} style={styles.answerBlock}>
              <Text style={styles.question}>{item.question}</Text>
              <Text style={styles.answer}>{item.answer || 'No note added.'}</Text>
            </View>
          ))}
        </View>

        <View style={styles.buttonRow}>
          <Button title="Share Journey" onPress={handleShare} />
          <Button title="Back" variant="secondary" onPress={() => router.back()} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  meta: {
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  visibilityBadge: {
    alignSelf: 'flex-start',
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: '#E8E0FF',
    marginBottom: SPACING.lg,
  },
  visibilityText: {
    color: '#5B21B6',
    fontWeight: '700',
  },
  storyCard: {
    backgroundColor: '#FAF4EA',
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  storyText: {
    color: COLORS.text,
    lineHeight: 24,
    fontFamily: Platform.OS === 'ios' ? 'Snell Roundhand' : 'serif',
  },
  mediaSection: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: SPACING.sm,
  },
  mediaItem: {
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  answersSection: {
    marginBottom: SPACING.lg,
  },
  answerBlock: {
    marginBottom: SPACING.sm,
  },
  question: {
    fontWeight: '700',
    marginBottom: SPACING.xs,
  },
  answer: {
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.lg,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  emptyText: {
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
});
