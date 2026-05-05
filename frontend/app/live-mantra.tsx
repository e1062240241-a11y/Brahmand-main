import React, { useEffect, useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS } from '../src/constants/theme';
import {
  getCurrentGayatriEnd,
  getNextGayatriStart,
  getScheduleWindows,
  isWithinGayatriMantraWindow,
  formatTime,
  getNextChantingTime,
  getAllAvailableTimes,
} from '../src/features/live-mantra/schedule';

const LiveMantraPage = () => {
  const router = useRouter();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 15_000);
    return () => clearInterval(timer);
  }, []);

  const activeStatus = useMemo(() => isWithinGayatriMantraWindow(now), [now]);
  const active = !!activeStatus;
  const currentEnd = useMemo(() => getCurrentGayatriEnd(now), [now]);
  const nextChanting = useMemo(() => getNextChantingTime(), []);
  const schedule = useMemo(() => getAllAvailableTimes(), []);

  const joinText = active ? 'Join Live Gayatri Mantra' : 'Next session starts at';
  const statusText = active
    ? `Live now: ${activeStatus.slot}`
    : 'Gayatri Mantra is not active right now';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Live Jaap</Text>
            <Text style={styles.subtitle}>Group Chanting Room</Text>
          </View>
          <Ionicons name="mic-circle" size={48} color={COLORS.primary} />
        </View>

        <View style={styles.statusCard}>
          <Text style={styles.statusLabel}>{statusText}</Text>
          {active && currentEnd ? (
            <Text style={styles.statusValue}>Ends at {currentEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
          ) : (
            <Text style={styles.statusValue}>
              {nextChanting.slot}: {nextChanting.formattedTime}
            </Text>
          )}
        </View>

        <View style={styles.scheduleCard}>
          <Text style={styles.sectionTitle}>Daily Chanting Windows</Text>
          <ScrollView style={{ maxHeight: 200 }} showsVerticalScrollIndicator={false}>
            {schedule.slice(0, 8).map((item) => (
              <View style={styles.scheduleRow} key={item.name}>
                <Text style={styles.scheduleLabel}>{item.name}</Text>
                <Text style={styles.scheduleNote}>{item.time} - {item.endTime}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        <Text style={styles.description}>
          Join the spiritual community for shared mantra jaap. Collective chanting creates powerful energy and focused meditation.
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
            {joinText} {!active && nextChanting.formattedTime}
          </Text>
        </TouchableOpacity>

        {!active && (
          <Text style={styles.noteText}>
            Please wait for the next scheduled window to join the room.
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
