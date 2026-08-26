import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, FONTS } from '../constants/theme';

if (Platform.OS === 'android' && !(global as any).nativeFabricUIManager && !(global as any)._IS_FABRIC && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface Ritual {
  id: string;
  title: string;
  subtitle: string;
  duration?: string;
  details: string;
}

interface QuizOption {
  id: string;
  label: string;
  percentage: number;
}

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
}

interface CelebrationPageProps {
  festivalName: string;
  rituals?: Ritual[];
  quizQuestion?: string;
  quizOptions?: QuizOption[];
  checklistItems?: ChecklistItem[];
}

const DEFAULT_RITUALS: Ritual[] = [
  { id: '1', title: 'Early Morning Meditation', subtitle: 'Start the day with peace', duration: '45 min', details: 'Begin before sunrise. Find a quiet space, sit comfortably, and focus on your breath. Chant mantras or practice mindfulness for a calm start to the festival.' },
  { id: '2', title: 'Temple Visit & Prayer', subtitle: 'Seek blessings at the temple', duration: '1 hour', details: 'Visit your local temple or sacred space. Offer flowers, light diyas, and pray for the well-being of your family and community.' },
  { id: '3', title: 'Prepare Sacred Food', subtitle: 'Cook traditional festival dishes', duration: '2 hours', details: 'Prepare prasad and traditional sweets using family recipes. The act of cooking with devotion is itself a form of worship.' },
  { id: '4', title: 'Community Gathering', subtitle: 'Celebrate with neighbors and friends', duration: '3 hours', details: 'Join your community for shared meals, music, and festivities. Exchange greetings and strengthen bonds with those around you.' },
];

const DEFAULT_QUIZ_OPTIONS: QuizOption[] = [
  { id: '1', label: 'Devotion & Prayer', percentage: 42 },
  { id: '2', label: 'Family & Feasting', percentage: 28 },
  { id: '3', label: 'Music & Dance', percentage: 18 },
  { id: '4', label: 'Charity & Service', percentage: 12 },
];

const DEFAULT_CHECKLIST: ChecklistItem[] = [
  { id: '1', title: 'Wake up before sunrise', description: 'Rise early to begin festival preparations with a fresh mind' },
  { id: '2', title: 'Take a ritual bath', description: 'Cleanse yourself before starting sacred activities' },
  { id: '3', title: 'Decorate your home', description: 'Use flowers, rangoli, and lights to create a festive atmosphere' },
  { id: '4', title: 'Prepare festival food', description: 'Cook traditional dishes and sweets for the celebration' },
  { id: '5', title: 'Visit temple or sacred space', description: 'Seek blessings and participate in community prayers' },
  { id: '6', title: 'Share meals with family', description: 'Enjoy the festival feast together with loved ones' },
  { id: '7', title: 'Light diyas or candles', description: 'Illuminate your home in the evening as part of the ritual' },
  { id: '8', title: 'Give to those in need', description: 'Share food, clothes, or donations with the less fortunate' },
];

const TABS = ['Rituals', 'Quiz', 'Checklist'] as const;

const TabBar = ({ active, onSelect }: { active: string; onSelect: (tab: string) => void }) => (
  <View style={styles.tabBar} accessibilityRole="tablist">
    {TABS.map((tab) => (
      <TouchableOpacity
        key={tab}
        style={[styles.tab, active === tab && styles.tabActive]}
        onPress={() => onSelect(tab)}
        activeOpacity={0.7}
        accessibilityRole="tab"
        accessibilityState={{ selected: active === tab }}
        accessibilityLabel={`${tab} tab`}
      >
        <Text style={[styles.tabText, active === tab && styles.tabTextActive]}>{tab}</Text>
      </TouchableOpacity>
    ))}
  </View>
);

const RitualsTab = ({ rituals }: { rituals: Ritual[] }) => {
  const [expanded, setExpanded] = useState<string | null>(null);

  const toggle = useCallback((id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => (prev === id ? null : id));
  }, []);

  return (
    <View>
      {rituals.map((ritual, i) => {
        const isOpen = expanded === ritual.id;
        return (
          <View key={ritual.id} style={[styles.ritualCard, i === 0 && styles.ritualCardFirst]}>
            <TouchableOpacity
              style={styles.ritualHeader}
              onPress={() => toggle(ritual.id)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityState={{ expanded: isOpen }}
              accessibilityLabel={`Toggle ${ritual.title} details`}
            >
              <View style={styles.ritualBadge}>
                <Text style={styles.ritualBadgeText}>{i + 1}</Text>
              </View>
              <View style={styles.ritualTextWrap}>
                <Text style={styles.ritualTitle}>{ritual.title}</Text>
                <Text style={styles.ritualSubtitle}>{ritual.subtitle}</Text>
              </View>
              <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={20} color={COLORS.primary} />
            </TouchableOpacity>
            {isOpen && (
              <View style={styles.ritualDetails}>
                {ritual.duration && (
                  <View style={styles.durationBadge}>
                    <Ionicons name="time-outline" size={12} color={COLORS.primary} />
                    <Text style={styles.durationText}>{ritual.duration}</Text>
                  </View>
                )}
                <Text style={styles.ritualDetailsText}>{ritual.details}</Text>
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
};

const QuizTab = ({ question, options, festivalName }: { question: string; options: QuizOption[]; festivalName: string }) => {
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = useCallback((id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelected(id);
  }, []);

  const resultMessage = (() => {
    if (!selected) return null;
    const label = options.find((o) => o.id === selected)?.label ?? '';
    if (label === 'Devotion & Prayer') return `Devotion is at the heart of this ${festivalName} celebration!`;
    if (label === 'Family & Feasting') return `Family and food bring everyone together during ${festivalName}!`;
    if (label === 'Music & Dance') return `Joy and rhythm are the soul of ${festivalName}!`;
    return `Sharing and kindness make ${festivalName} truly special!`;
  })();

  return (
    <View>
      <Text style={styles.quizQuestion}>{question}</Text>
      {options.map((opt) => (
        <TouchableOpacity
          key={opt.id}
          style={[styles.quizOption, selected && styles.quizOptionDisabled]}
          onPress={() => !selected && handleSelect(opt.id)}
          activeOpacity={selected ? 1 : 0.7}
          accessibilityRole="radio"
          accessibilityState={{ checked: selected === opt.id, disabled: !!selected }}
          accessibilityLabel={opt.label}
        >
          <View style={[styles.radio, selected === opt.id && styles.radioSelected]}>
            {selected === opt.id && <View style={styles.radioDot} />}
          </View>
          <Text style={[styles.quizOptionText, selected && styles.quizOptionTextDisabled]}>{opt.label}</Text>
        </TouchableOpacity>
      ))}
      {selected && (
        <View style={styles.quizResult}>
          <Text style={styles.quizResultEmoji}>🙏</Text>
          <Text style={styles.quizResultText}>{resultMessage}</Text>
          <Text style={styles.quizResultSub}>Community Results:</Text>
          {options.map((opt) => (
            <View key={opt.id} style={styles.statRow}>
              <Text style={[styles.statLabel, selected === opt.id && styles.statLabelActive]}>{opt.label}</Text>
              <View style={styles.statBarBg}>
                <View style={[styles.statBarFill, { width: `${opt.percentage}%` as any }]} />
              </View>
              <Text style={styles.statPercent}>{opt.percentage}%</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const ChecklistTab = ({ items }: { items: ChecklistItem[] }) => {
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const toggle = useCallback((id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const progress = Math.round((checked.size / items.length) * 100);

  return (
    <View>
      <View style={styles.progressHeader}>
        <Text style={styles.progressLabel}>Progress</Text>
        <Text style={styles.progressPercent}>{progress}%</Text>
      </View>
      <View style={styles.progressBarBg}>
        <View style={[styles.progressBarFill, { width: `${progress}%` as any }]} />
      </View>
      {items.map((item) => {
        const done = checked.has(item.id);
        return (
          <TouchableOpacity
            key={item.id}
            style={styles.checkItem}
            onPress={() => toggle(item.id)}
            activeOpacity={0.7}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: done }}
            accessibilityLabel={`${item.title}, ${item.description}`}
          >
            <View style={[styles.checkbox, done && styles.checkboxChecked]}>
              {done && <Ionicons name="checkmark" size={14} color="#fff" />}
            </View>
            <View style={styles.checkTextWrap}>
              <Text style={[styles.checkTitle, done && styles.checkTitleDone]}>{item.title}</Text>
              <Text style={[styles.checkDesc, done && styles.checkDescDone]}>{item.description}</Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const CelebrationPage = ({
  festivalName,
  rituals = DEFAULT_RITUALS,
  quizQuestion,
  quizOptions = DEFAULT_QUIZ_OPTIONS,
  checklistItems = DEFAULT_CHECKLIST,
}: CelebrationPageProps) => {
  const [activeTab, setActiveTab] = useState('Rituals');

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.heading}>Celebrate {festivalName}</Text>
        <TabBar active={activeTab} onSelect={setActiveTab} />
        <View style={styles.tabContent}>
          {activeTab === 'Rituals' && <RitualsTab rituals={rituals} />}
          {activeTab === 'Quiz' && (
            <QuizTab question={quizQuestion ?? `How do you celebrate ${festivalName}?`} options={quizOptions} festivalName={festivalName} />
          )}
          {activeTab === 'Checklist' && <ChecklistTab items={checklistItems} />}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  heading: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: FONTS.brandTitle,
    color: COLORS.text,
    marginBottom: 12,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: BORDER_RADIUS.md,
    padding: 3,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.md - 2,
  },
  tabActive: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: '#fff',
  },
  tabContent: {
    minHeight: 200,
  },
  ritualCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: BORDER_RADIUS.md,
    marginBottom: 10,
    overflow: 'hidden',
  },
  ritualCardFirst: {
    marginTop: 0,
  },
  ritualHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  ritualBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  ritualBadgeText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  ritualTextWrap: {
    flex: 1,
  },
  ritualTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  ritualSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  ritualDetails: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(25,118,210,0.1)',
    alignSelf: 'flex-start',
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 8,
    gap: 4,
  },
  durationText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  ritualDetailsText: {
    fontSize: 14,
    lineHeight: 22,
    color: COLORS.textSecondary,
  },
  quizQuestion: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
    lineHeight: 24,
  },
  quizOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: BORDER_RADIUS.md,
    padding: 14,
    marginBottom: 10,
  },
  quizOptionDisabled: {
    opacity: 0.7,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  radioSelected: {
    borderColor: COLORS.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  quizOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  quizOptionTextDisabled: {
    color: COLORS.textSecondary,
  },
  quizResult: {
    backgroundColor: '#f9f9f9',
    borderRadius: BORDER_RADIUS.md,
    padding: 16,
    marginTop: 10,
  },
  quizResultEmoji: {
    fontSize: 28,
    marginBottom: 8,
  },
  quizResultText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  quizResultSub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 10,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statLabel: {
    width: 100,
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  statLabelActive: {
    fontWeight: '700',
    color: COLORS.text,
  },
  statBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  statBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  statPercent: {
    width: 36,
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'right',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 16,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  checkItem: {
    flexDirection: 'row',
    backgroundColor: '#f9f9f9',
    borderRadius: BORDER_RADIUS.md,
    padding: 14,
    marginBottom: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 1,
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkTextWrap: {
    flex: 1,
  },
  checkTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  checkTitleDone: {
    textDecorationLine: 'line-through',
    color: COLORS.textSecondary,
  },
  checkDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  checkDescDone: {
    textDecorationLine: 'line-through',
    color: '#bbb',
  },
});

export default CelebrationPage;
