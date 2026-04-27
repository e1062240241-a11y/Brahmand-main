import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../src/components/Button';
import { usePassportStore } from '../../src/store/passportStore';
import { COLORS, SPACING, BORDER_RADIUS } from '../../src/constants/theme';

export default function PassportProgressScreen() {
  const loadPassport = usePassportStore((state) => state.loadPassport);
  const totalJaap = usePassportStore((state) => state.total_jaap);
  const booksCompleted = usePassportStore((state) => state.books_completed);
  const certificates = usePassportStore((state) => state.certificates);
  const badges = usePassportStore((state) => state.badges);
  const addJaap = usePassportStore((state) => state.addJaap);
  const completeBook = usePassportStore((state) => state.completeBook);
  const awardBadge = usePassportStore((state) => state.awardBadge);

  const [jaapInput, setJaapInput] = useState('108');
  const [bookName, setBookName] = useState('');
  const [completionDays, setCompletionDays] = useState('30');

  useEffect(() => {
    loadPassport();
  }, []);

  const handleAddJaap = async () => {
    const count = parseInt(jaapInput, 10);
    if (!count || count <= 0) {
      Alert.alert('Invalid count', 'Please enter a valid number of malas.');
      return;
    }
    await addJaap(count);
    if (count >= 108) {
      await awardBadge('First Jaap Milestone', 'Completed a full mala cycle');
    }
    Alert.alert('Jaap saved', 'Your jaap progress has been updated.');
    setJaapInput('108');
  };

  const handleCompleteBook = async () => {
    if (!bookName.trim()) {
      Alert.alert('Missing book', 'Please enter the book name.');
      return;
    }
    const days = parseInt(completionDays, 10) || 0;
    await completeBook(bookName.trim(), days, new Date().toISOString().slice(0, 10));
    await awardBadge('First Book Completion', `Completed ${bookName.trim()}`);
    Alert.alert('Certificate created', `${bookName.trim()} has been marked complete.`);
    setBookName('');
    setCompletionDays('30');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Passport Progress</Text>
        <Text style={styles.subtitle}>Update jaap, awards and reading achievements instantly.</Text>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{totalJaap}</Text>
            <Text style={styles.statLabel}>Total Jaap</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{booksCompleted}</Text>
            <Text style={styles.statLabel}>Books</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{badges.length}</Text>
            <Text style={styles.statLabel}>Badges</Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Complete Jaap</Text>
          <TextInput
            style={styles.input}
            value={jaapInput}
            onChangeText={setJaapInput}
            keyboardType="number-pad"
            placeholder="108"
            placeholderTextColor={COLORS.textSecondary}
          />
          <Button title="Add Jaap" onPress={handleAddJaap} />
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Complete Reading</Text>
          <TextInput
            style={styles.input}
            value={bookName}
            onChangeText={setBookName}
            placeholder="Book name"
            placeholderTextColor={COLORS.textSecondary}
          />
          <TextInput
            style={styles.input}
            value={completionDays}
            onChangeText={setCompletionDays}
            keyboardType="number-pad"
            placeholder="Completion days"
            placeholderTextColor={COLORS.textSecondary}
          />
          <Button title="Create Certificate" onPress={handleCompleteBook} />
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Badges</Text>
          {badges.length === 0 ? (
            <Text style={styles.emptyText}>No badges yet. Complete your first journey, jaap milestone, or book.</Text>
          ) : (
            badges.map((badge) => (
              <View key={badge.id} style={styles.badgeRow}>
                <Text style={styles.badgeTitle}>{badge.title}</Text>
                <Text style={styles.badgeDescription}>{badge.description}</Text>
              </View>
            ))
          )}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Certificates</Text>
          {certificates.length === 0 ? (
            <Text style={styles.emptyText}>No certificates yet. Complete a reading to generate one.</Text>
          ) : (
            certificates.map((certificate) => (
              <View key={certificate.id} style={styles.certificateRow}>
                <Text style={styles.certificateTitle}>{certificate.book_name}</Text>
                <Text style={styles.certificateMeta}>{certificate.completion_days} days • {new Date(certificate.date).toDateString()}</Text>
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
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: SPACING.xs,
  },
  subtitle: {
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginRight: SPACING.sm,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: SPACING.xs,
  },
  statLabel: {
    color: COLORS.textSecondary,
  },
  sectionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: SPACING.sm,
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  emptyText: {
    color: COLORS.textSecondary,
  },
  badgeRow: {
    marginBottom: SPACING.sm,
  },
  badgeTitle: {
    fontWeight: '700',
  },
  badgeDescription: {
    color: COLORS.textSecondary,
  },
  certificateRow: {
    marginBottom: SPACING.sm,
  },
  certificateTitle: {
    fontWeight: '700',
  },
  certificateMeta: {
    color: COLORS.textSecondary,
  },
});
