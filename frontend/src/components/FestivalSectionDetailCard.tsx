// accessibility: placeholder
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SPACING, BORDER_RADIUS } from '../constants/theme';
import festivalEnrichments from '../data/festival-enrichments';

interface FestivalSectionDetailCardProps {
  festival: any;
  section: string;
  onBack: () => void;
}

const FestivalSectionDetailCard = ({ festival, section }: FestivalSectionDetailCardProps) => {
  // Try to find enrichment data by festival name (case-insensitive)
  const enrichmentKey = (festival.festival_name || '').toLowerCase();
  const enrichment = festivalEnrichments[enrichmentKey];

  // Section field mapping
  const sectionFieldMap: Record<string, string> = {
    About: 'summary',
    Origin: 'origin',
    Purpose: 'purpose',
    Importance: 'importance',
    Celebration: 'celebration',
    Mantra: 'mantra',
  };

  const field = sectionFieldMap[section] || '';
  // Use enrichment data if available, otherwise fall back to API data
  const sectionValue = enrichment?.[field as keyof typeof enrichment] || festival[field] || '';

  return (
    <View style={styles.page}>
      <View style={styles.contentCard}>
        <Text style={styles.contentBody}>{sectionValue}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  page: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
    backgroundColor: 'transparent',
  },
  contentCard: {
    borderRadius: BORDER_RADIUS.xl,
    backgroundColor: 'transparent',
    padding: SPACING.lg,
  },
  contentBody: {
    color: '#4B5563',
    fontSize: 15,
    lineHeight: 24,
  },
});

export default FestivalSectionDetailCard;
