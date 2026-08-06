import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export interface AmenityTile {
  id: string;
  label: string;
  iconName: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  bgColor?: string;
}

export interface GuidelineSection {
  id: string;
  title: string;
  iconName: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  badgeBg: string;
  content: string;
}

interface TempleFacilitiesSectionProps {
  quickGlanceItems?: Array<{ icon: keyof typeof Ionicons.glyphMap; text: string; color?: string }>;
  amenities?: AmenityTile[];
  guidelines?: GuidelineSection[];
  onAmenityPress?: (amenity: AmenityTile) => void;
}

const DEFAULT_QUICK_GLANCE = [
  { icon: 'ticket-outline' as const, text: 'Free entry', color: '#2563EB' },
  { icon: 'time-outline' as const, text: '20–45 min wait', color: '#D97706' },
  { icon: 'shirt-outline' as const, text: 'Modest dress', color: '#7C3AED' },
];

const DEFAULT_AMENITIES: AmenityTile[] = [
  { id: 'parking', label: 'Parking', iconName: 'car-outline', iconColor: '#2563EB', bgColor: '#EFF6FF' },
  { id: 'lockers', label: 'Lockers', iconName: 'lock-closed-outline', iconColor: '#4F46E5', bgColor: '#EEF2FF' },
  { id: 'prasad', label: 'Prasad Counter', iconName: 'restaurant-outline', iconColor: '#EA580C', bgColor: '#FFF7ED' },
  { id: 'restrooms', label: 'Restrooms', iconName: 'man-outline', iconColor: '#059669', bgColor: '#ECFDF5' },
  { id: 'water', label: 'Drinking Water', iconName: 'water-outline', iconColor: '#0284C7', bgColor: '#F0F9FF' },
  { id: 'shoes', label: 'Shoe Stand', iconName: 'footsteps-outline', iconColor: '#D97706', bgColor: '#FFFBEB' },
];

const DEFAULT_GUIDELINES: GuidelineSection[] = [
  {
    id: 'entry',
    title: 'Entry & Darshan',
    iconName: 'ticket-outline',
    iconColor: '#2563EB', // Blue / Accent for access/info
    badgeBg: '#EFF6FF',
    content:
      'General entry is free for all pilgrims. Special VIP or Sugam Darshan passes are available at the trust administrative desk or via the official online portal. Peak festival days may require pre-booked slots.',
  },
  {
    id: 'queue',
    title: 'Queue & Visit Info',
    iconName: 'time-outline',
    iconColor: '#D97706', // Amber / Warning for timing
    badgeBg: '#FFFBEB',
    content:
      'Average queue waiting time is 20 to 45 minutes on general weekdays and 1.5 to 3 hours during weekend mornings and major festive days. Early morning Mangla Aarti hours offer the shortest wait.',
  },
  {
    id: 'dress',
    title: 'Dress Code & Customs',
    iconName: 'shirt-outline',
    iconColor: '#7C3AED', // Purple for rules & customs
    badgeBg: '#F5F3FF',
    content:
      'Devotees are requested to wear modest traditional attire. Shorts, sleeveless tops, and short skirts are strictly disallowed inside the inner mandir. Leather items and shoes must be deposited outside.',
  },
];

export const TempleFacilitiesSection: React.FC<TempleFacilitiesSectionProps> = ({
  quickGlanceItems = DEFAULT_QUICK_GLANCE,
  amenities = DEFAULT_AMENITIES,
  guidelines = DEFAULT_GUIDELINES,
  onAmenityPress,
}) => {
  // First item expanded by default (index 0 / 'entry')
  const [expandedId, setExpandedId] = useState<string | null>(guidelines[0]?.id || 'entry');

  const toggleAccordion = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <View style={styles.container}>
      {/* 1. Header */}
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Facilities, Amenities & Good to Know</Text>
      </View>

      {/* 2. Quick-glance summary strip */}
      <View style={styles.summaryStrip}>
        {quickGlanceItems.map((item, index) => (
          <View key={`summary-${index}`} style={styles.summaryItem}>
            <Ionicons name={item.icon} size={15} color={item.color || '#475569'} />
            <Text style={styles.summaryText}>{item.text}</Text>
            {index < quickGlanceItems.length - 1 && <View style={styles.summaryDivider} />}
          </View>
        ))}
      </View>

      {/* 3. Temple premises amenities (3-Column Uniform Icon Grid) */}
      <View style={styles.sectionBlock}>
        <Text style={styles.sectionSubTitle}>Temple premises amenities</Text>
        <View style={styles.gridContainer}>
          {amenities.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.gridTile}
              activeOpacity={0.7}
              onPress={() => onAmenityPress?.(item)}
            >
              <View style={[styles.amenityIconCircle, { backgroundColor: item.bgColor || '#F8FAFC' }]}>
                <Ionicons name={item.iconName} size={20} color={item.iconColor || '#334155'} />
              </View>
              <Text style={styles.gridTileLabel} numberOfLines={1}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 4. Pilgrim guidelines (Collapsible Accordion Cards) */}
      <View style={styles.sectionBlock}>
        <Text style={styles.sectionSubTitle}>Pilgrim guidelines</Text>
        <View style={styles.accordionList}>
          {guidelines.map((item) => {
            const isExpanded = expandedId === item.id;
            return (
              <View key={item.id} style={styles.accordionCard}>
                <TouchableOpacity
                  style={styles.accordionHeader}
                  onPress={() => toggleAccordion(item.id)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.iconCircle, { backgroundColor: item.badgeBg }]}>
                    <Ionicons name={item.iconName} size={16} color={item.iconColor} />
                  </View>
                  <Text style={styles.accordionTitle}>{item.title}</Text>
                  <Ionicons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color="#64748B"
                  />
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.accordionBody}>
                    <Text style={styles.accordionContent}>{item.content}</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  headerRow: {
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },

  /* 2. Summary Strip */
  summaryStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    justifyContent: 'center',
  },
  summaryText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#334155',
  },
  summaryDivider: {
    width: 1,
    height: 14,
    backgroundColor: '#CBD5E1',
    marginLeft: 8,
  },

  /* Section Spacing & Subtitles */
  sectionBlock: {
    marginBottom: 12,
  },
  sectionSubTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 10,
  },

  /* 3. Icon Grid */
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  gridTile: {
    width: '31%', // 3-column equal grid
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 6,
    gap: 6,
  },
  amenityIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridTileLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#334155',
    textAlign: 'center',
  },

  /* 4. Pilgrim Guidelines Accordions */
  accordionList: {
    gap: 10,
  },
  accordionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 10,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accordionTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  accordionBody: {
    paddingHorizontal: 12,
    paddingBottom: 14,
    paddingTop: 2,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  accordionContent: {
    fontSize: 13,
    fontWeight: '400',
    color: '#475569',
    lineHeight: 21, // ~1.6 line height for enhanced scannability
  },
});
