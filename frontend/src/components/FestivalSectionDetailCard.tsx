// accessibility: placeholder
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SPACING, BORDER_RADIUS } from '../constants/theme';
import festivalEnrichments from '../data/festival-enrichments';
import CelebrationPage from './CelebrationPage';

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
  const rawSectionValue = enrichment?.[field as keyof typeof enrichment] || festival[field] || '';
  const sectionValue = typeof rawSectionValue === 'string' ? rawSectionValue.trim() : rawSectionValue;

  return (
    <View style={styles.page}>
      <View style={styles.contentCard}>
        <Text style={styles.contentBody}>{sectionValue}</Text>
      </View>
      {section === 'About' && (
        <CelebrationPage
          festivalName={festival.festival_name}
          rituals={festival.rituals && Array.isArray(festival.rituals)
            ? festival.rituals.map((r: string, idx: number) => ({
                id: String(idx + 1),
                title: `Step ${idx + 1}`,
                subtitle: r.split(/[.,;]/)[0] || `Ritual ${idx + 1}`,
                details: r,
              }))
            : undefined
          }
          checklistItems={festival.rituals && Array.isArray(festival.rituals)
            ? festival.rituals.map((r: string, idx: number) => ({
                id: String(idx + 1),
                title: r.split(/[.,;]/)[0] || `Step ${idx + 1}`,
                description: r,
              }))
            : undefined
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  page: {
    padding: SPACING.md,
    paddingTop: 0,
    paddingBottom: SPACING.xl,
    backgroundColor: 'transparent',
  },
  contentCard: {
    borderRadius: BORDER_RADIUS.xl,
    backgroundColor: 'transparent',
    padding: SPACING.lg,
    paddingTop: SPACING.xs,
  },
  contentBody: {
    color: '#4B5563',
    fontSize: 15,
    lineHeight: 24,
  },
});

export default FestivalSectionDetailCard;
