import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS } from '../../../src/constants/theme';

interface MantraSession {
  id: string;
  name: string;
  mantra: string;
  participants: number;
  duration: string;
  isLive: boolean;
}

const MOCK_SESSIONS: MantraSession[] = [
  { id: '1', name: 'Radha Krishna 108x', mantra: 'Om Kleem Krishnaya Namah', participants: 14, duration: '45 min', isLive: true },
  { id: '2', name: 'Gayatri Mantra', mantra: 'Om Bhur Bhuva Swaha', participants: 9, duration: '30 min', isLive: true },
  { id: '3', name: 'Mahamrityunjaya Jaap', mantra: 'Om Tryambakam Yajamahe', participants: 5, duration: '20 min', isLive: true },
  { id: '4', name: 'Om Namah Shivaya', mantra: 'Om Namah Shivaya', participants: 12, duration: '15 min', isLive: false },
  { id: '5', name: 'Hanuman Chalisa', mantra: 'Shri Guru Charan Saroj Raj', participants: 8, duration: '25 min', isLive: false },
];

export default function MantraJaapRoom() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [sessions, setSessions] = useState<MantraSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSession, setActiveSession] = useState<MantraSession | null>(null);

  useEffect(() => {
    setTimeout(() => {
      setSessions(MOCK_SESSIONS);
      setLoading(false);
    }, 500);
  }, []);

  const renderSession = ({ item }: { item: MantraSession }) => (
    <View style={[styles.sessionCard, !item.isLive && styles.sessionCardInactive]}>
      <View style={styles.sessionHeader}>
        <View style={styles.sessionTitleRow}>
          <Text style={styles.sessionName}>{item.name}</Text>
          {item.isLive && (
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveBadgeText}>LIVE</Text>
            </View>
          )}
        </View>
        <Text style={styles.sessionMantra}>{item.mantra}</Text>
      </View>
      
      <View style={styles.sessionStats}>
        <View style={styles.statItem}>
          <Ionicons name="people" size={16} color={COLORS.textSecondary} />
          <Text style={styles.statText}>{item.participants} participants</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="time" size={16} color={COLORS.textSecondary} />
          <Text style={styles.statText}>{item.duration}</Text>
        </View>
      </View>

      <TouchableOpacity 
        style={[styles.joinButton, item.isLive ? styles.joinButtonActive : styles.joinButtonInactive]}
        onPress={() => setActiveSession(item)}
      >
        <Ionicons name={item.isLive ? 'play' : 'play-circle-outline'} size={20} color="#FFFFFF" />
        <Text style={styles.joinButtonText}>
          {activeSession?.id === item.id ? 'Joined!' : (item.isLive ? 'Join Now' : 'View')}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.title}>Live Mantra Jaap</Text>
          <Text style={styles.subtitle}>Join spiritual sessions with community</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading sessions...</Text>
        </View>
      ) : (
        <>
          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Text style={styles.statBoxNumber}>{sessions.filter(s => s.isLive).length}</Text>
              <Text style={styles.statBoxLabel}>Live Now</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statBoxNumber}>{sessions.reduce((a, s) => a + s.participants, 0)}</Text>
              <Text style={styles.statBoxLabel}>Total Chanting</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statBoxNumber}>{sessions.length}</Text>
              <Text style={styles.statBoxLabel}>Sessions</Text>
            </View>
          </View>

          <FlatList
            data={sessions}
            renderItem={renderSession}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            ListHeaderComponent={
              <Text style={styles.sectionTitle}>Active & Upcoming Sessions</Text>
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="musical-notes-outline" size={48} color={COLORS.textLight} />
                <Text style={styles.emptyText}>No sessions available</Text>
              </View>
            }
          />
        </>
      )}

      {activeSession && (
        <View style={styles.activePlayerContainer}>
          <View style={styles.playerInfo}>
            <View style={styles.playerMantraInfo}>
              <Text style={styles.playerMantraName}>{activeSession.name}</Text>
              <Text style={styles.playerMantraText}>{activeSession.mantra}</Text>
            </View>
            <View style={styles.playerStats}>
              <Ionicons name="people" size={16} color="#FFFFFF" />
              <Text style={styles.playerStatText}>{activeSession.participants}</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.stopButton}
            onPress={() => setActiveSession(null)}
          >
            <Ionicons name="stop" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  backButton: {
    marginRight: SPACING.md,
    padding: SPACING.xs,
  },
  headerTitleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: SPACING.md,
    backgroundColor: COLORS.primary,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statBoxNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statBoxLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  listContent: {
    padding: SPACING.md,
  },
  sessionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  sessionCardInactive: {
    opacity: 0.7,
  },
  sessionHeader: {
    marginBottom: SPACING.sm,
  },
  sessionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sessionName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.error,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: 8,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
    marginRight: 4,
  },
  liveBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  sessionMantra: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
    fontStyle: 'italic',
  },
  sessionStats: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  statText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  joinButtonActive: {
    backgroundColor: 'orange', // force orange for live sessions
  },
  joinButtonInactive: {
    backgroundColor: '#FFA500', // softer orange for inactive sessions
  },
  joinButtonText: {
    color: '#FFFFFF', // white text stands out on orange
    fontWeight: '600',
    marginLeft: SPACING.xs,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xl * 2,
  },
  emptyText: {
    marginTop: SPACING.md,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  activePlayerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  playerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  playerMantraInfo: {
    flex: 1,
  },
  playerMantraName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  playerMantraText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginTop: 2,
  },
  playerStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  playerStatText: {
    color: '#FFFFFF',
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '600',
  },
  stopButton: {
    marginLeft: SPACING.md,
    backgroundColor: COLORS.error,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
