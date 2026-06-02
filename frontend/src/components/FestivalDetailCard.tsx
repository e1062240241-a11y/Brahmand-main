// accessibility: placeholder
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/theme';

interface FestivalDetailCardProps {
  festival: any;
  onBack: () => void;
  onGuidePress?: (section: string) => void;
}

const FestivalDetailCard = ({ festival, onBack, onGuidePress }: FestivalDetailCardProps) => {
  const sections = [
    { title: 'About', value: festival.summary },
    { title: 'Origin', value: festival.origin },
    { title: 'Purpose', value: festival.purpose },
    { title: 'Importance', value: festival.importance },
    { title: 'Celebration', value: festival.celebration },
    { title: 'Mantra', value: festival.mantra },
  ].filter((section) => section.value);

  return (
    <View style={styles.page}>
      <View style={styles.heroCard}>
        <Text style={styles.heroSubtitle}>Upcoming Festival</Text>
        <Text style={styles.heroTitle}>{festival.festival_name}</Text>
        <Text style={styles.heroDate}>{festival.date}</Text>
        <Text style={styles.heroMiniText}>Tap each section for a clear festival guide.</Text>
      </View>

      <View style={styles.guideSection}>
        <Text style={styles.sectionHeading}>Festival Guide</Text>
        {sections.map((section) => (
          <TouchableOpacity
            key={section.title}
            style={styles.guideItem}
            activeOpacity={0.8}
            onPress={() => onGuidePress?.(section.title)}
          >
            <View style={styles.guideIcon}><Text style={styles.iconText}>{section.title[0]}</Text></View>
            <View style={styles.guideTextContainer}>
              <Text style={styles.guideTitle}>{section.title}</Text>
              <Text numberOfLines={2} style={styles.guideDescription}>
                {section.value}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
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
    backgroundColor: '#083344',
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  notificationButton: {
    padding: SPACING.xs,
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
    color: '#38BDF8',
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
    color: '#7DD3FC',
    fontSize: 14,
    marginBottom: SPACING.sm,
  },
  heroMiniText: {
    color: '#E0F2FE',
    fontSize: 13,
    lineHeight: 20,
  },
  guideSection: {
    marginBottom: SPACING.md,
  },
  sectionHeading: {
    color: '#1F2937',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: SPACING.sm,
  },
  guideItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  guideIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  guideTextContainer: {
    flex: 1,
  },
  guideTitle: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  guideDescription: {
    color: '#4B5563',
    fontSize: 13,
    lineHeight: 18,
  },
  iconText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default FestivalDetailCard;
