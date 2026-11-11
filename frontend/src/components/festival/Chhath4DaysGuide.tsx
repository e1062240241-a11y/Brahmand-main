import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { CHHATH_PUJA_4_DAYS, ChhathDayDetail } from '../../data/chhathPujaDaysData';

interface Props {
  onBack?: () => void;
}

export const Chhath4DaysGuide: React.FC<Props> = () => {
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0);
  const activeDay: ChhathDayDetail = CHHATH_PUJA_4_DAYS[selectedDayIndex] || CHHATH_PUJA_4_DAYS[0];

  const handleDaySelect = (index: number) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (_e) {}
    setSelectedDayIndex(index);
  };

  return (
    <View style={styles.container}>
      {/* 1. Clean Day Selector Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScrollContent}
        >
          {CHHATH_PUJA_4_DAYS.map((item, idx) => {
            const isSelected = selectedDayIndex === idx;
            return (
              <TouchableOpacity
                key={`day-tab-${item.day}`}
                style={[
                  styles.dayTab,
                  isSelected && styles.dayTabActive,
                ]}
                onPress={() => handleDaySelect(idx)}
                activeOpacity={0.8}
              >
                <View style={styles.dayTabBadge}>
                  <Text style={[styles.dayTabBadgeText, isSelected && styles.dayTabBadgeTextActive]}>
                    DAY {item.day}
                  </Text>
                </View>
                <Text style={[styles.dayTabTitle, isSelected && styles.dayTabTitleActive]} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.dayTabDate} numberOfLines={1}>
                  {item.day === 1 ? '13 Nov' : item.day === 2 ? '14 Nov' : item.day === 3 ? '15 Nov' : '16 Nov'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* 2. Active Day Detail Card */}
      <View style={styles.contentWrapper}>
        <View style={styles.dayCard}>
          {/* Top Tag & Tithi */}
          <View style={styles.dayTopRow}>
            <View style={styles.dayNumberPill}>
              <Text style={styles.dayNumberPillText}>Day {activeDay.day} of 4</Text>
            </View>
            <View style={styles.tithiPill}>
              <Ionicons name="calendar-outline" size={13} color="#92400E" />
              <Text style={styles.tithiPillText}>{activeDay.tithi}</Text>
            </View>
          </View>

          {/* Title & Date */}
          <Text style={styles.dayMainTitle}>{activeDay.name}</Text>
          <Text style={styles.dayHindiTitle}>{activeDay.nameHi}</Text>
          <Text style={styles.dayDateText}>📅 {activeDay.dateStr}</Text>

          <View style={styles.taglineBox}>
            <Text style={styles.taglineText}>{activeDay.tagline}</Text>
          </View>

          {/* Authentic Meaning & Full Narrative */}
          <View style={styles.narrativeSection}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons name="book-outline" size={18} color="#92400E" />
              <Text style={styles.sectionHeading}>विधि व परंपरा (Ritual & Significance)</Text>
            </View>
            <Text style={styles.narrativeText}>{activeDay.description}</Text>
          </View>

          {/* Key Rituals Highlights */}
          <View style={styles.ritualsSection}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons name="flame-outline" size={18} color="#92400E" />
              <Text style={styles.sectionHeading}>प्रमुख अनुष्ठान (Key Rituals)</Text>
            </View>

            <View style={styles.ritualsList}>
              {activeDay.keyRituals.map((r, i) => (
                <View key={`ritual-${i}`} style={styles.ritualItemCard}>
                  <View style={styles.ritualIconBox}>
                    <Ionicons name={r.icon as any} size={18} color="#92400E" />
                  </View>
                  <View style={styles.ritualTextBox}>
                    <Text style={styles.ritualItemTitle}>{r.title}</Text>
                    <Text style={styles.ritualItemDesc}>{r.desc}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Prasad & Fasting Rules */}
          <View style={styles.metaRow}>
            <View style={styles.metaCard}>
              <View style={styles.metaTitleRow}>
                <Text style={{ fontSize: 15 }}>🍲</Text>
                <Text style={styles.metaTitle}>पावन प्रसाद</Text>
              </View>
              <Text style={styles.metaContent}>{activeDay.prasad}</Text>
            </View>

            <View style={styles.metaCard}>
              <View style={styles.metaTitleRow}>
                <Text style={{ fontSize: 15 }}>⏳</Text>
                <Text style={styles.metaTitle}>व्रत नियम</Text>
              </View>
              <Text style={styles.metaContent}>{activeDay.fastingRule}</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

export default Chhath4DaysGuide;

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  tabsContainer: {
    backgroundColor: 'transparent',
    paddingVertical: 4,
    marginBottom: 12,
  },
  tabsScrollContent: {
    gap: 8,
  },
  dayTab: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.25)',
    alignItems: 'center',
    minWidth: 94,
  },
  dayTabActive: {
    backgroundColor: '#FEF3C7',
    borderColor: '#D97706',
    shadowColor: '#92400E',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
  },
  dayTabBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
    marginBottom: 2,
  },
  dayTabBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#6B7280',
    letterSpacing: 0.4,
  },
  dayTabBadgeTextActive: {
    color: '#92400E',
  },
  dayTabTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
    textAlign: 'center',
  },
  dayTabTitleActive: {
    color: '#92400E',
    fontWeight: '800',
  },
  dayTabDate: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 1,
  },
  contentWrapper: {
    gap: 14,
  },
  dayCard: {
    backgroundColor: 'transparent',
    paddingVertical: 2,
  },
  dayTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dayNumberPill: {
    backgroundColor: '#78350F',
    paddingVertical: 3,
    paddingHorizontal: 9,
    borderRadius: 10,
  },
  dayNumberPillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  tithiPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
    gap: 4,
  },
  tithiPillText: {
    color: '#92400E',
    fontSize: 11,
    fontWeight: '700',
  },
  dayMainTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#111827',
    letterSpacing: -0.2,
    marginTop: 2,
  },
  dayHindiTitle: {
    fontSize: 15.5,
    fontWeight: '700',
    color: '#92400E',
    marginTop: 2,
  },
  dayDateText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 3,
    marginBottom: 10,
  },
  taglineBox: {
    backgroundColor: 'rgba(254, 243, 199, 0.45)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderLeftWidth: 3.5,
    borderLeftColor: '#D97706',
    marginBottom: 16,
  },
  taglineText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#78350F',
    lineHeight: 18,
  },
  narrativeSection: {
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  sectionHeading: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: 0.1,
  },
  narrativeText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#374151',
    fontWeight: '400',
  },
  ritualsSection: {
    marginBottom: 16,
  },
  ritualsList: {
    gap: 6,
    marginTop: 4,
  },
  ritualItemCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'transparent',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(217, 119, 6, 0.15)',
    gap: 10,
  },
  ritualIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(254, 243, 199, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  ritualTextBox: {
    flex: 1,
  },
  ritualItemTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  ritualItemDesc: {
    fontSize: 12,
    lineHeight: 17,
    color: '#4B5563',
  },
  metaRow: {
    gap: 10,
    marginTop: 4,
  },
  metaCard: {
    backgroundColor: 'rgba(254, 243, 199, 0.35)',
    padding: 12,
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#D97706',
  },
  metaTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  metaTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#111827',
  },
  metaContent: {
    fontSize: 12.5,
    lineHeight: 18,
    color: '#4B5563',
    fontWeight: '500',
  },
});
