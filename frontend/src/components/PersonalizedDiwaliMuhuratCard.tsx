import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  DIWALI_2026_CONFIG,
  DIWALI_5_DAYS,
  DIWALI_RULES_NIYAM,
  DIWALI_2026_SPECIAL_NOTES,
} from '../utils/diwaliMuhurat';

/**
 * Muhurat & 5-Day Festive Calendar component (Non-overlapping, only 2 tabs)
 */
export const PersonalizedDiwaliMuhuratCard: React.FC<{ festival?: any }> = React.memo(
  function PersonalizedDiwaliMuhuratCard() {
    const [activeTab, setActiveTab] = useState<'muhurat' | '5days'>('muhurat');

    return (
      <View style={styles.container}>
        {/* Navigation Tabs (Only Muhurat & 5-Day Calendar) */}
        <View style={styles.tabToggleRow}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'muhurat' && styles.tabButtonActive]}
            onPress={() => setActiveTab('muhurat')}
            activeOpacity={0.8}
          >
            <Ionicons name="flame" size={14} color={activeTab === 'muhurat' ? '#FFF' : '#92400E'} />
            <Text style={[styles.tabText, activeTab === 'muhurat' && styles.tabTextActive]}>
              शुभ मुहूर्त
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === '5days' && styles.tabButtonActive]}
            onPress={() => setActiveTab('5days')}
            activeOpacity={0.8}
          >
            <Ionicons name="calendar" size={14} color={activeTab === '5days' ? '#FFF' : '#92400E'} />
            <Text style={[styles.tabText, activeTab === '5days' && styles.tabTextActive]}>
              5 दिवसीय उत्सव
            </Text>
          </TouchableOpacity>
        </View>

        {/* TAB 1: MAIN PUJA MUHURAT */}
        {activeTab === 'muhurat' && (
          <View>
            <View style={styles.heroSection}>
              <View style={styles.cityHeaderRow}>
                <Text style={styles.cityTitleText}>
                  दीपावली मुख्य लक्ष्मी पूजन मुहूर्त
                </Text>
              </View>

              <Text style={styles.festivalDateHeader}>
                {DIWALI_2026_CONFIG.hindiDateString}
              </Text>

              {/* Grand Bold Muhurat Display */}
              <Text style={styles.mainMuhuratTime}>{DIWALI_2026_CONFIG.mainPujaMuhurat}</Text>

              {/* Duration Badge */}
              <View style={styles.durationPill}>
                <Ionicons name="time-outline" size={14} color="#78350F" />
                <Text style={styles.durationText}>
                  पूजा अवधि: {DIWALI_2026_CONFIG.pujaDuration}
                </Text>
              </View>

              {/* Pradosh Kaal & Vrishabha Sthir Lagna explanation */}
              <View style={styles.lagnaBox}>
                <View style={styles.lagnaRow}>
                  <Text style={styles.lagnaLabel}>प्रदोष काल:</Text>
                  <Text style={styles.lagnaVal}>{DIWALI_2026_CONFIG.pradoshKaal}</Text>
                </View>
                <View style={styles.lagnaRow}>
                  <Text style={styles.lagnaLabel}>वृषभ स्थिर लग्न:</Text>
                  <Text style={styles.lagnaVal}>{DIWALI_2026_CONFIG.vrishabhaLagna}</Text>
                </View>
                <Text style={styles.lagnaExplanation}>
                  <Text style={{ fontWeight: '700' }}>स्थिर लग्न का रहस्य:</Text> प्रदोष काल के दौरान स्थिर वृषभ लग्न में पूजा की जाती है ताकि माँ लक्ष्मी आपके घर-आंगन में स्थिर रूप से निवास करें।
                </Text>
              </View>

              {/* Abhyang Snan & Amavasya Tithi */}
              <View style={styles.snanBox}>
                <View style={styles.snanRow}>
                  <Ionicons name="water-outline" size={16} color="#B45309" />
                  <Text style={styles.snanTitle}>नरक चतुर्दशी अभ्यंग स्नान:</Text>
                  <Text style={styles.snanTime}>{DIWALI_2026_CONFIG.abhyangSnan}</Text>
                </View>
                <Text style={styles.snanSub}>
                  (सूर्योदय 6:37 AM से पूर्व, जब तक चंद्रमा आकाश में दृश्यमान हो)
                </Text>
                <View style={[styles.snanRow, { marginTop: 6 }]}>
                  <Ionicons name="moon-outline" size={16} color="#B45309" />
                  <Text style={styles.snanTitle}>अमावस्या तिथि:</Text>
                  <Text style={styles.snanTime}>8 Nov 11:27 AM से 9 Nov 12:31 PM</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* TAB 2: THE 5 FESTIVE DAYS (DHANTERAS TO BHAI DOOJ) */}
        {activeTab === '5days' && (
          <View style={styles.daysSection}>
            <Text style={styles.sectionHeading}>
              🪔 5 दिवसीय दीपोत्सव — तिथियाँ एवं विधि
            </Text>
            <Text style={styles.sectionSubtitle}>
              धनतेरस से भाई दूज तक संपूर्ण शुभ मुहूर्त व करने योग्य कार्य:
            </Text>

            {DIWALI_5_DAYS.map((d, index) => (
              <View key={d.day} style={styles.dayCard}>
                <View style={styles.dayHeaderRow}>
                  <View style={styles.dayBadge}>
                    <Text style={styles.dayBadgeText}>दिवस {index + 1}</Text>
                  </View>
                  <Text style={styles.dayDateText}>{d.date}</Text>
                </View>

                <Text style={styles.dayTitleText}>{d.hindiDay}</Text>
                <Text style={styles.dayTithiText}>{d.tithiDesc}</Text>

                <View style={styles.dayActionBox}>
                  <Text style={styles.dayActionText}>{d.action}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  }
);

/**
 * Dedicated Standalone Rules & Niyam (14 Points)
 */
export const DiwaliRulesNiyamCard: React.FC = React.memo(function DiwaliRulesNiyamCard() {
  return (
    <View style={styles.container}>
      <View style={styles.rulesSection}>
        <Text style={styles.sectionHeading}>
          🛡️ शास्त्रसम्मत पूजा निर्देश व सावधानियाँ
        </Text>
        <Text style={styles.sectionSubtitle}>
          दीपावली पूजन में इन 14 महत्वपूर्ण बातों का विशेष ध्यान रखें:
        </Text>

        <View style={styles.rulesListCard}>
          {DIWALI_RULES_NIYAM.map((rule, idx) => (
            <View key={idx} style={styles.ruleItemRow}>
              <View style={styles.ruleNumberCircle}>
                <Text style={styles.ruleNumberText}>{idx + 1}</Text>
              </View>
              <Text style={styles.ruleDetailText}>{rule}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
});

/**
 * Dedicated Standalone 2026 Special Notes (Adhika Masa & Panchang Split)
 */
export const DiwaliSpecialNotesCard: React.FC = React.memo(function DiwaliSpecialNotesCard() {
  return (
    <View style={styles.container}>
      <View style={styles.specialSection}>
        <Text style={styles.sectionHeading}>
          📜 2026 में दिवाली विशेष क्यों है?
        </Text>
        <Text style={styles.sectionSubtitle}>
          अधिक मास प्रभाव एवं पंचांग भेद का प्रामाणिक विश्लेषण:
        </Text>

        {DIWALI_2026_SPECIAL_NOTES.map((note, idx) => (
          <View key={idx} style={styles.specialNoteCard}>
            <View style={styles.specialNoteHeader}>
              <Ionicons name="bookmarks" size={16} color="#78350F" />
              <Text style={styles.specialNoteTitle}>{note.title}</Text>
            </View>
            <Text style={styles.specialNoteContent}>{note.content}</Text>
          </View>
        ))}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: 10,
  },
  tabToggleRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  tabButtonActive: {
    backgroundColor: '#F59E0B',
    borderColor: '#D97706',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
  },
  tabTextActive: {
    color: '#FFF',
  },
  heroSection: {
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
    marginBottom: 14,
  },
  cityHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  cityTitleText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#78350F',
    letterSpacing: 0.2,
  },
  festivalDateHeader: {
    fontSize: 12.5,
    color: '#B45309',
    fontWeight: '600',
    marginBottom: 10,
  },
  mainMuhuratTime: {
    fontSize: Platform.OS === 'android' ? 24 : 26,
    fontWeight: '900',
    color: '#92400E',
    letterSpacing: 0.8,
    textAlign: 'center',
  },
  durationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'transparent',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  durationText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#78350F',
  },
  lagnaBox: {
    width: '100%',
    backgroundColor: 'transparent',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: 12,
    marginTop: 14,
  },
  lagnaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  lagnaLabel: {
    fontSize: 12.5,
    color: '#78350F',
    fontWeight: '600',
  },
  lagnaVal: {
    fontSize: 12.5,
    color: '#92400E',
    fontWeight: '800',
  },
  lagnaExplanation: {
    fontSize: 11.5,
    color: '#92400E',
    lineHeight: 17,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 0.8,
    borderTopColor: '#FDE68A',
  },
  snanBox: {
    width: '100%',
    backgroundColor: 'transparent',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: 10,
    marginTop: 10,
  },
  snanRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  snanTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#78350F',
  },
  snanTime: {
    fontSize: 12,
    fontWeight: '800',
    color: '#92400E',
  },
  snanSub: {
    fontSize: 10.5,
    color: '#B45309',
    marginLeft: 22,
    fontStyle: 'italic',
  },
  citySection: {
    marginTop: 6,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: '#78350F',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#92400E',
    marginBottom: 10,
  },
  cityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cityChip: {
    width: '48.5%',
    backgroundColor: '#FFFDF5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  cityChipActive: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
    borderWidth: 1.5,
  },
  cityNameText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#78350F',
  },
  cityNameTextActive: {
    color: '#B45309',
    fontWeight: '800',
  },
  cityTimeText: {
    fontSize: 11,
    color: '#92400E',
    marginTop: 2,
    fontWeight: '600',
  },
  cityTimeTextActive: {
    color: '#78350F',
    fontWeight: '700',
  },
  ruleNoteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 10,
    padding: 10,
    marginTop: 12,
  },
  ruleNoteText: {
    flex: 1,
    fontSize: 11.5,
    color: '#92400E',
    lineHeight: 16,
  },
  daysSection: {
    gap: 10,
  },
  dayCard: {
    backgroundColor: 'transparent',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: 12,
  },
  dayHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  dayBadge: {
    backgroundColor: 'transparent',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  dayBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#92400E',
  },
  dayDateText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#B45309',
  },
  dayTitleText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#78350F',
    marginBottom: 4,
  },
  dayTithiText: {
    fontSize: 12,
    color: '#4B5563',
    lineHeight: 18,
    marginBottom: 6,
  },
  dayActionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'transparent',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  dayActionText: {
    flex: 1,
    fontSize: 11.5,
    fontWeight: '600',
    color: '#78350F',
    lineHeight: 16,
  },
  rulesSection: {
    gap: 8,
  },
  rulesListCard: {
    backgroundColor: 'transparent',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: 12,
    gap: 10,
  },
  ruleItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  ruleNumberCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  ruleNumberText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#92400E',
  },
  ruleDetailText: {
    flex: 1,
    fontSize: 12,
    color: '#374151',
    lineHeight: 18,
  },
  specialSection: {
    gap: 12,
  },
  specialNoteCard: {
    backgroundColor: '#FFFDF5',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: 14,
  },
  specialNoteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  specialNoteTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#78350F',
  },
  specialNoteContent: {
    fontSize: 12.5,
    color: '#374151',
    lineHeight: 19,
  },
});
