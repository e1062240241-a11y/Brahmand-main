import React, { useEffect, useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS } from '../src/constants/theme';
import {
  getCurrentGayatriEnd,
  getNextGayatriStart,
  getScheduleWindows,
  isWithinGayatriMantraWindow,
  formatTime,
} from '../src/features/live-mantra/schedule';

const LiveMantraPage = () => {
  const router = useRouter();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 15_000);
    return () => clearInterval(timer);
  }, []);

  const active = useMemo(() => isWithinGayatriMantraWindow(now), [now]);
  const currentEnd = useMemo(() => getCurrentGayatriEnd(now), [now]);
  const nextStart = useMemo(() => getNextGayatriStart(now), [now]);
  const schedule = useMemo(() => getScheduleWindows(), []);

  const joinText = active ? 'Join Live Gayatri Mantra' : 'Live tonight will start at';
  const statusText = active ? 'Gayatri Mantra is live now' : 'Gayatri Mantra is not active at this time';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Live Mantras</Text>
            <Text style={styles.subtitle}>Gayatri Mantra</Text>
          </View>
          <Ionicons name="sunny" size={36} color={COLORS.primary} />
        </View>

        <View style={styles.statusCard}>
          <Text style={styles.statusLabel}>{statusText}</Text>
          {active && currentEnd ? (
            <Text style={styles.statusValue}>Ends at {formatTime(currentEnd)}</Text>
          ) : (
            <Text style={styles.statusValue}>Next session begins at {formatTime(nextStart)}</Text>
          )}
        </View>

        <View style={styles.scheduleCard}>
          <Text style={styles.sectionTitle}>Daily Gayatri Mantra Timing</Text>
          {schedule.map((item) => (
            <View style={styles.scheduleRow} key={item.label}>
              <Text style={styles.scheduleLabel}>{item.label}</Text>
              <Text style={styles.scheduleNote}>Daily</Text>
            </View>
          ))}
        </View>

        <Text style={styles.description}>
          Gayatri Mantra chanting begins daily at 8:00–10:00 AM and 4:00–5:00 PM. Join the live jaap during these windows for a shared experience.
        </Text>

        <TouchableOpacity
          style={[styles.joinButton, !active && styles.joinButtonDisabled]}
          disabled={!active}
          onPress={() => {
            if (active) {
              router.push('/mantra-jaap');
            }
          }}
          activeOpacity={active ? 0.8 : 1}
        >
          <Text style={[styles.joinButtonText, !active && styles.joinButtonTextDisabled]}>
            {joinText}
          </Text>
        </TouchableOpacity>

        {!active && (
          <Text style={styles.noteText}>
            You can only join during daily Gayatri Mantra hours.
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    padding: SPACING.md,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  statusCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: SPACING.sm,
  },
  statusValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  scheduleCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  scheduleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  scheduleLabel: {
    color: COLORS.text,
    fontSize: 15,
  },
  scheduleNote: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  description: {
    color: COLORS.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: SPACING.lg,
  },
  joinButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.xl,
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinButtonDisabled: {
    backgroundColor: `${COLORS.textLight}33`,
  },
  joinButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  joinButtonTextDisabled: {
    color: `${COLORS.textLight}`,
  },
  noteText: {
    marginTop: SPACING.md,
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },
});

export default LiveMantraPage;
