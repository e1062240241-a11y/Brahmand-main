import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { usePassportStore } from '../../src/store/passportStore';
import { Button } from '../../src/components/Button';
import { PassportJourney } from '../../src/types/passport';
import { COLORS, SPACING, BORDER_RADIUS } from '../../src/constants/theme';

const renderJourneyCard = (journey: PassportJourney, onPress: () => void) => {
  const preview = journey.generated_story.split('\n').slice(0, 3).join(' ');
  return (
    <TouchableOpacity key={journey.id} style={{ marginBottom: SPACING.md }} onPress={onPress}>
      <View style={styles.journeyCard}>
        <Text style={styles.journeyTitle}>{journey.title}</Text>
        <Text style={styles.journeyMeta}>{journey.location} · {new Date(journey.date).toDateString()}</Text>
        <Text style={styles.journeyPreview} numberOfLines={3}>{preview}</Text>
      </View>
    </TouchableOpacity>
  );
};

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function PassportTimelineScreen() {
  const router = useRouter();
  const journeys = usePassportStore((state) => state.journeys);
  const badges = usePassportStore((state) => state.badges);
  const certificates = usePassportStore((state) => state.certificates);
  const totalJaap = usePassportStore((state) => state.total_jaap);
  const booksCompleted = usePassportStore((state) => state.books_completed);
  const loadPassport = usePassportStore((state) => state.loadPassport);

  const [queryLocation, setQueryLocation] = useState('');
  const [queryMonth, setQueryMonth] = useState('');
  const [queryYear, setQueryYear] = useState('');

  useEffect(() => {
    loadPassport();
  }, []);

  const monthOptions = useMemo(() => monthNames, []);
  const yearOptions = useMemo(() => {
    const years = Array.from(new Set(journeys.map((journey) => new Date(journey.date).getFullYear().toString())));
    return years.sort((a, b) => Number(b) - Number(a));
  }, [journeys]);

  const filteredJourneys = useMemo(() => {
    return journeys.filter((journey) => {
      const date = new Date(journey.date);
      const monthMatch = queryMonth ? monthNames[date.getMonth()] === queryMonth : true;
      const yearMatch = queryYear ? date.getFullYear().toString() === queryYear : true;
      const locationMatch = queryLocation ? journey.location.toLowerCase().includes(queryLocation.toLowerCase()) : true;
      return monthMatch && yearMatch && locationMatch;
    });
  }, [journeys, queryMonth, queryYear, queryLocation]);

  const journeyCount = journeys.length;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.pageTitle}>Passport Timeline</Text>
            <Text style={styles.pageSubtitle}>Your Yatra memories, jaap milestones and reading badges.</Text>
          </View>
          <Button title="New Journey" onPress={() => router.push('/passport/journey/new' as any)} />
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBlock}>
            <Text style={styles.statLabel}>Journeys</Text>
            <Text style={styles.statValue}>{journeyCount}</Text>
          </View>
          <View style={styles.statBlock}>
            <Text style={styles.statLabel}>Total Jaap</Text>
            <Text style={styles.statValue}>{totalJaap}</Text>
          </View>
          <View style={styles.statBlock}>
            <Text style={styles.statLabel}>Books</Text>
            <Text style={styles.statValue}>{booksCompleted}</Text>
          </View>
        </View>

        <View style={styles.filterRow}>
          <TextInput
            placeholder="Filter by location"
            placeholderTextColor={COLORS.textSecondary}
            style={[styles.filterInput, styles.filterInputSpacing]}
            value={queryLocation}
            onChangeText={setQueryLocation}
          />
          <TextInput
            placeholder="Month"
            placeholderTextColor={COLORS.textSecondary}
            style={[styles.filterInput, styles.filterInputSpacing]}
            value={queryMonth}
            onChangeText={setQueryMonth}
          />
          <TextInput
            placeholder="Year"
            placeholderTextColor={COLORS.textSecondary}
            style={styles.filterInput}
            value={queryYear}
            onChangeText={setQueryYear}
          />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Journey Cards</Text>
          <Text style={styles.sectionCount}>{filteredJourneys.length} found</Text>
        </View>

        {filteredJourneys.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No journeys match the selected filters. Create a new Yatra memory to begin.</Text>
          </View>
        ) : (
          filteredJourneys.map((journey) => renderJourneyCard(journey, () => router.push(`/passport/journey/${journey.id}` as any)))
        )}

        <View style={styles.moduleSection}>
          <Text style={styles.sectionTitle}>Milestones</Text>
          <View style={styles.milestoneRow}>
            <View style={styles.milestoneCard}>
              <Text style={styles.milestoneNumber}>{journeyCount}</Text>
              <Text style={styles.milestoneLabel}>Journeys</Text>
            </View>
            <View style={styles.milestoneCard}>
              <Text style={styles.milestoneNumber}>{totalJaap}</Text>
              <Text style={styles.milestoneLabel}>Jaap</Text>
            </View>
            <View style={styles.milestoneCard}>
              <Text style={styles.milestoneNumber}>{booksCompleted}</Text>
              <Text style={styles.milestoneLabel}>Books</Text>
            </View>
          </View>
        </View>

        <View style={styles.badgePanel}>
          <Text style={styles.sectionTitle}>Badges</Text>
          {badges.length === 0 ? (
            <Text style={styles.emptyText}>Earn badges for first journey, first jaap milestone, and first book completion.</Text>
          ) : (
            badges.map((badge) => (
              <View key={badge.id} style={styles.badgeTile}>
                <Text style={styles.badgeTileTitle}>{badge.title}</Text>
                <Text style={styles.badgeTileMeta}>{badge.description}</Text>
              </View>
            ))
          )}
        </View>

        <View style={styles.certificatePanel}>
          <Text style={styles.sectionTitle}>Certificates</Text>
          {certificates.length === 0 ? (
            <Text style={styles.emptyText}>Complete a book to generate your first certificate.</Text>
          ) : (
            certificates.map((certificate) => (
              <View key={certificate.id} style={styles.certificateCard}>
                <Text style={styles.certificateLabel}>{certificate.book_name}</Text>
                <Text style={styles.certificateMeta}>Completed in {certificate.completion_days} days • {new Date(certificate.date).toDateString()}</Text>
              </View>
            ))
          )}
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.lg,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
  },
  pageSubtitle: {
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginTop: SPACING.xs,
    maxWidth: '70%',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  statBlock: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
  },
  statLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: SPACING.xs,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: SPACING.lg,
  },
  filterInput: {
    flex: 1,
    minWidth: 100,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    color: COLORS.text,
    fontSize: 14,
  },
  filterInputSpacing: {
    marginRight: SPACING.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  sectionCount: {
    color: COLORS.textSecondary,
  },
  journeyCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
  },
  journeyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: SPACING.xs,
  },
  journeyMeta: {
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    fontSize: 13,
  },
  journeyPreview: {
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  emptyCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
  },
  emptyText: {
    color: COLORS.textSecondary,
  },
  moduleSection: {
    marginTop: SPACING.lg,
  },
  milestoneRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  milestoneCard: {
    flex: 1,
    backgroundColor: '#FEF3E7',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
  },
  milestoneNumber: {
    fontSize: 24,
    fontWeight: '700',
  },
  milestoneLabel: {
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  badgePanel: {
    marginTop: SPACING.lg,
  },
  badgeTile: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  badgeTileTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: SPACING.xs,
  },
  badgeTileMeta: {
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  certificatePanel: {
    marginTop: SPACING.lg,
  },
  certificateCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  certificateLabel: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: SPACING.xs,
  },
  certificateMeta: {
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
});
