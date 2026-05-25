import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/theme';

interface FestivalSectionDetailCardProps {
  festival: any;
  section: string;
  onBack: () => void;
}

const FestivalSectionDetailCard = ({ festival, section, onBack }: FestivalSectionDetailCardProps) => {
  const sectionMap: Record<string, string> = {
    About: festival.summary,
    Origin: festival.origin,
    Purpose: festival.purpose,
    Importance: festival.importance,
    Celebration: festival.celebration,
    Mantra: festival.mantra,
  };
  const sectionValue = sectionMap[section] || '';

  return (
    <View style={styles.page}>
      <View style={styles.heroCard}>
        <Text style={styles.heroSubtitle}>{section}</Text>
        <Text style={styles.heroTitle}>{festival.festival_name}</Text>
        <Text style={styles.heroDate}>{festival.date}</Text>
      </View>

      <View style={styles.contentCard}>
        <Text style={styles.contentTitle}>{section}</Text>
        <Text style={styles.contentBody}>{sectionValue}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  page: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
    backgroundColor: COLORS.background,
  },
  heroCard: {
    borderRadius: BORDER_RADIUS.xl,
    backgroundColor: '#2B1C4A',
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  backButton: {
    padding: SPACING.xs,
    backgroundColor: 'transparent',
  },
  backText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  heroSubtitle: {
    color: '#D8B4FE',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    fontWeight: '700',
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: SPACING.xs,
  },
  heroDate: {
    color: '#C4B5FD',
    fontSize: 14,
  },
  contentCard: {
    borderRadius: BORDER_RADIUS.xl,
    backgroundColor: 'transparent',
    padding: SPACING.lg,
  },
  contentTitle: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: SPACING.sm,
  },
  contentBody: {
    color: '#4B5563',
    fontSize: 15,
    lineHeight: 24,
  },
});

export default FestivalSectionDetailCard;
