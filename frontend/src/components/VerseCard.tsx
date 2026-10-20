import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const convertToHindiNumerals = (num: number) => {
  const hindiNumerals = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
  return num.toString().split('').map(digit => hindiNumerals[parseInt(digit)]).join('');
};

interface VerseTranslation {
  author_name?: string;
  language?: string;
  description?: string;
}

interface VerseData {
  text?: string;
  verse: number | string;
  chapter?: number;
  translations?: VerseTranslation[] | Record<string, string> | VerseTranslation;
}

interface VerseCardProps {
  verse: VerseData;
  nightMode: boolean;
  index: number;
  isLast: boolean;
  bookId?: string;
  chapterNumber?: number;
  fontSizeScale?: number;
  isBookmarked?: boolean;
  onToggleBookmark?: () => void;
}

const cleanTranslationString = (raw: string | null | undefined): string | null => {
  if (!raw || typeof raw !== 'string') return null;
  let text = raw.trim();
  if (text.toLowerCase().includes('did not comment')) return null;
  // Strip leading verse markers e.g. "।।1.1।।", "1.1.", "1.1 - 1.19"
  text = text.replace(/^(?:।।\s*\d+(?:\.\d+)?\s*।।|\d+\.\d+(?:\s*-\s*\d+\.\d+)?\.?)\s*/, '');
  text = text.replace(/\s+/g, ' ').trim();
  return text || null;
};

const VerseCard = React.memo(({
  verse,
  nightMode,
  index,
  isLast,
  bookId,
  chapterNumber = 1,
  fontSizeScale = 1.0,
  isBookmarked = false,
  onToggleBookmark,
}: VerseCardProps) => {
  const [activeTab, setActiveTab] = useState<'both' | 'hindi' | 'english'>('both');
  const [isExpanded, setIsExpanded] = useState(true);

  // Extract Speaker heading (e.g. "धृतराष्ट्र उवाच", "सञ्जय उवाच", "श्रीभगवानुवाच", "अर्जुन उवाच")
  const rawText = verse.text || '';
  const speakerMatch = rawText.match(/^([^\n]+उवाच[^\n]*)\n+/);
  const speakerHeading = speakerMatch ? speakerMatch[1].trim() : null;
  const rawShloka = speakerMatch ? rawText.replace(speakerMatch[0], '').trim() : rawText;

  // Clean Sanskrit shloka (remove Vedic accent marks and trailing number labels e.g. "।।1.1।।")
  const cleanSanskrit = rawShloka
    .replace(/\s*।।\s*\d+(?:\.\d+)?\s*।।\s*$/, '')
    .replace(/[\u1CD0-\u1CFF\u0951-\u0952]/g, '')
    .trim();

  let rawHindi: string | null = null;
  let rawEnglish: string | null = null;

  if (verse.translations) {
    if (Array.isArray(verse.translations)) {
      const gitaTranslations: VerseTranslation[] = verse.translations;
      const sivananda = gitaTranslations.find((t) => t.author_name === 'Swami Sivananda');
      const purohit = gitaTranslations.find((t) => t.author_name === 'Shri Purohit Swami');
      const sankaranarayan = gitaTranslations.find((t) => t.author_name === 'Dr. S. Sankaranarayan');
      const adidevananda = gitaTranslations.find((t) => t.author_name === 'Swami Adidevananda');
      const generalEnglish = gitaTranslations.find((t) => t.language === 'english');

      const ramsukhdas = gitaTranslations.find((t) => t.author_name === 'Swami Ramsukhdas');
      const tejomayananda = gitaTranslations.find((t) => t.author_name === 'Swami Tejomayananda');
      const generalHindi = gitaTranslations.find((t) => t.language === 'hindi');

      rawHindi = ramsukhdas?.description || tejomayananda?.description || generalHindi?.description || null;
      rawEnglish =
        sivananda?.description ||
        purohit?.description ||
        sankaranarayan?.description ||
        generalEnglish?.description ||
        adidevananda?.description ||
        null;
    } else if (typeof verse.translations === 'object') {
      const dict = verse.translations as Record<string, any>;
      rawHindi =
        dict.hindi ||
        dict['swami tejomayananda'] ||
        dict['swami ramsukhdas'] ||
        dict['sri harikrishnadas goenka'] ||
        null;

      rawEnglish =
        dict.english ||
        dict['swami sivananda'] ||
        dict['shri purohit swami'] ||
        dict['dr. s. sankaranarayan'] ||
        dict['swami adidevananda'] ||
        dict['swami gambirananda'] ||
        null;

      if (!rawHindi && typeof dict.description === 'string' && (!dict.language || dict.language === 'hindi')) {
        rawHindi = dict.description;
      }
      if (!rawEnglish && typeof dict.description === 'string' && dict.language === 'english') {
        rawEnglish = dict.description;
      }
    }
  }

  const hindiText = cleanTranslationString(rawHindi);
  const englishText = cleanTranslationString(rawEnglish);

  const verseNumHindi = convertToHindiNumerals(Number(verse.verse) || index + 1);
  const chNumHindi = convertToHindiNumerals(chapterNumber);

  let prefix = 'श्लोक';
  if (bookId === 'ramcharitmanas') {
    prefix = (verse as any)?.type || 'पद';
  } else if (bookId === 'rigveda' || bookId === 'yajurveda' || bookId === 'atharvaved') {
    prefix = 'मन्त्र';
  } else if (bookId === 'upanishads') {
    prefix = 'मन्त्र';
  }

  const verseRefLabel = `${prefix} ${chNumHindi}.${verseNumHindi}`;

  return (
    <View style={[styles.cardContainer, nightMode && styles.cardContainerNight]}>
      {/* ── Top Header / Metadata Bar ── */}
      <View style={styles.cardHeader}>
        <View style={styles.refBadge}>
          <Text style={[styles.refText, nightMode && styles.refTextNight]}>{verseRefLabel}</Text>
        </View>

        <View style={styles.headerRightActions}>
          {onToggleBookmark && (
            <TouchableOpacity
              onPress={onToggleBookmark}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.actionBtn}
            >
              <Ionicons
                name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
                size={18}
                color={isBookmarked ? '#C6A16B' : (nightMode ? '#A8927F' : '#9E8674')}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Sanskrit Verse Section (The Visual Centerpiece) ── */}
      <View style={styles.shlokaSection}>
        {speakerHeading ? (
          <View style={styles.speakerBadgeWrapper}>
            <Text style={[styles.speakerText, nightMode && styles.speakerTextNight]}>
              ॥ {speakerHeading} ॥
            </Text>
          </View>
        ) : null}

        <Text
          style={[
            styles.sanskritVerse,
            { fontSize: 18 * fontSizeScale, lineHeight: 30 * fontSizeScale },
            nightMode && styles.sanskritVerseNight,
          ]}
        >
          {cleanSanskrit}
        </Text>

        <View style={styles.verseNumberRow}>
          <View style={[styles.decorativeDash, nightMode && styles.decorativeDashNight]} />
          <Text style={[styles.verseEndingBadge, nightMode && styles.verseEndingBadgeNight]}>
            ॥ {chNumHindi}.{verseNumHindi} ॥
          </Text>
          <View style={[styles.decorativeDash, nightMode && styles.decorativeDashNight]} />
        </View>
      </View>

      {/* ── Translation & Bhashya Card ── */}
      {(hindiText || englishText) && (
        <View style={[styles.translationCard, nightMode && styles.translationCardNight]}>
          {/* Tabs to switch or view both */}
          <View style={styles.tabBar}>
            <View style={styles.tabButtonsRow}>
              <TouchableOpacity
                style={[
                  styles.tabButton,
                  activeTab === 'both' && (nightMode ? styles.tabButtonActiveNight : styles.tabButtonActive),
                ]}
                onPress={() => setActiveTab('both')}
              >
                <Text
                  style={[
                    styles.tabButtonText,
                    activeTab === 'both' && (nightMode ? styles.tabButtonTextActiveNight : styles.tabButtonTextActive),
                    nightMode && activeTab !== 'both' && styles.textMutedNight,
                  ]}
                >
                  सभी अर्थ
                </Text>
              </TouchableOpacity>

              {hindiText && (
                <TouchableOpacity
                  style={[
                    styles.tabButton,
                    activeTab === 'hindi' && (nightMode ? styles.tabButtonActiveNight : styles.tabButtonActive),
                  ]}
                  onPress={() => setActiveTab('hindi')}
                >
                  <Text
                    style={[
                      styles.tabButtonText,
                      activeTab === 'hindi' && (nightMode ? styles.tabButtonTextActiveNight : styles.tabButtonTextActive),
                      nightMode && activeTab !== 'hindi' && styles.textMutedNight,
                    ]}
                  >
                    हिन्दी
                  </Text>
                </TouchableOpacity>
              )}

              {englishText && (
                <TouchableOpacity
                  style={[
                    styles.tabButton,
                    activeTab === 'english' && (nightMode ? styles.tabButtonActiveNight : styles.tabButtonActive),
                  ]}
                  onPress={() => setActiveTab('english')}
                >
                  <Text
                    style={[
                      styles.tabButtonText,
                      activeTab === 'english' && (nightMode ? styles.tabButtonTextActiveNight : styles.tabButtonTextActive),
                      nightMode && activeTab !== 'english' && styles.textMutedNight,
                    ]}
                  >
                    English
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Expand / Collapse Control */}
            <TouchableOpacity
              onPress={() => setIsExpanded(!isExpanded)}
              style={styles.expandBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name={isExpanded ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={nightMode ? '#C6A16B' : '#8A705C'}
              />
            </TouchableOpacity>
          </View>

          {/* Translation Content */}
          {isExpanded && (
            <View style={styles.translationBody}>
              {/* Hindi Translation */}
              {(activeTab === 'both' || activeTab === 'hindi') && hindiText && (
                <View style={styles.langSection}>
                  <View style={styles.langHeaderRow}>
                    <View style={[styles.langDot, { backgroundColor: '#C6A16B' }]} />
                    <Text style={[styles.langHeading, nightMode && styles.langHeadingNight]}>
                      हिन्दी अर्थ
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.hindiContentText,
                      { fontSize: 15 * fontSizeScale, lineHeight: 24 * fontSizeScale },
                      nightMode && styles.textContentNight,
                    ]}
                  >
                    {hindiText}
                  </Text>
                </View>
              )}

              {/* English Translation */}
              {(activeTab === 'both' || activeTab === 'english') && englishText && (
                <View
                  style={[
                    styles.langSection,
                    activeTab === 'both' && hindiText && styles.langSectionDivider,
                    activeTab === 'both' && hindiText && nightMode && styles.langSectionDividerNight,
                  ]}
                >
                  <View style={styles.langHeaderRow}>
                    <View style={[styles.langDot, { backgroundColor: '#743B27' }]} />
                    <Text style={[styles.langHeading, nightMode && styles.langHeadingNight]}>
                      English Translation
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.englishContentText,
                      { fontSize: 14.5 * fontSizeScale, lineHeight: 23 * fontSizeScale },
                      nightMode && styles.textContentNightEnglish,
                    ]}
                  >
                    {englishText}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      )}

      {/* ── Elegant Section Divider between Verses ── */}
      {!isLast && (
        <View style={styles.dividerRow}>
          <View style={[styles.dividerHairline, nightMode && styles.dividerHairlineNight]} />
          <View style={[styles.mandalaDot, nightMode && styles.mandalaDotNight]} />
          <View style={[styles.dividerHairline, nightMode && styles.dividerHairlineNight]} />
        </View>
      )}
    </View>
  );
}, (prev, next) => {
  return (
    prev.verse === next.verse &&
    prev.nightMode === next.nightMode &&
    prev.index === next.index &&
    prev.isLast === next.isLast &&
    prev.bookId === next.bookId &&
    prev.chapterNumber === next.chapterNumber &&
    prev.fontSizeScale === next.fontSizeScale &&
    prev.isBookmarked === next.isBookmarked
  );
});

VerseCard.displayName = 'VerseCard';

const styles = StyleSheet.create({
  cardContainer: {
    marginBottom: 20,
    backgroundColor: '#FFFCF6', // Soft paper white from design system
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E3D4BC', // Warm ivory divider border
    shadowColor: '#5A4136',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  cardContainerNight: {
    backgroundColor: '#1C1512',
    borderColor: 'rgba(198, 161, 107, 0.2)',
    shadowColor: '#000',
    shadowOpacity: 0.3,
  },

  /* Header */
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  refBadge: {
    backgroundColor: 'rgba(198, 161, 107, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: 'rgba(198, 161, 107, 0.35)',
  },
  refText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#743B27', // Temple brown
    letterSpacing: 0.5,
  },
  refTextNight: {
    color: '#E6D3B8',
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBtn: {
    padding: 4,
  },

  /* Sanskrit Shloka */
  shlokaSection: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  speakerBadgeWrapper: {
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 2,
    backgroundColor: 'rgba(116, 59, 39, 0.06)',
    borderRadius: 6,
  },
  speakerText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#743B27',
    letterSpacing: 0.6,
  },
  speakerTextNight: {
    color: '#C6A16B',
  },
  sanskritVerse: {
    color: '#743B27', // Primary temple brown
    textAlign: 'center',
    fontWeight: '700',
    letterSpacing: 0.3,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  sanskritVerseNight: {
    color: '#F4ECE0',
  },
  verseNumberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    marginBottom: 4,
  },
  decorativeDash: {
    width: 24,
    height: 1,
    backgroundColor: '#C6A16B',
    opacity: 0.6,
  },
  decorativeDashNight: {
    backgroundColor: 'rgba(198, 161, 107, 0.3)',
  },
  verseEndingBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: '#C6A16B',
    marginHorizontal: 10,
  },
  verseEndingBadgeNight: {
    color: '#D8B885',
  },

  /* Translation Card */
  translationCard: {
    marginTop: 16,
    backgroundColor: '#F9F4EB',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8DEC9',
    overflow: 'hidden',
  },
  translationCardNight: {
    backgroundColor: '#261D19',
    borderColor: 'rgba(227, 212, 188, 0.1)',
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(227, 212, 188, 0.6)',
  },
  tabButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 6,
  },
  tabButtonActive: {
    backgroundColor: '#743B27',
  },
  tabButtonActiveNight: {
    backgroundColor: '#C6A16B',
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#796858',
  },
  tabButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  tabButtonTextActiveNight: {
    color: '#1C1512',
    fontWeight: '700',
  },
  textMutedNight: {
    color: '#A8927F',
  },
  expandBtn: {
    padding: 4,
  },
  translationBody: {
    padding: 14,
  },
  langSection: {
    marginBottom: 2,
  },
  langSectionDivider: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E8DEC9',
  },
  langSectionDividerNight: {
    borderTopColor: 'rgba(227, 212, 188, 0.12)',
  },
  langHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  langDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  langHeading: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#796858',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  langHeadingNight: {
    color: '#C6A16B',
  },
  hindiContentText: {
    color: '#42372F',
    textAlign: 'left',
    lineHeight: 24,
  },
  englishContentText: {
    color: '#4A3E36',
    textAlign: 'left',
    fontStyle: 'italic',
    lineHeight: 23,
  },
  textContentNight: {
    color: '#E0D4C5',
  },
  textContentNightEnglish: {
    color: '#D4C6B5',
  },

  /* Inter-verse divider */
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 4,
  },
  dividerHairline: {
    width: 48,
    height: 1,
    backgroundColor: '#E3D4BC',
  },
  dividerHairlineNight: {
    backgroundColor: 'rgba(198, 161, 107, 0.2)',
  },
  mandalaDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#C6A16B',
    marginHorizontal: 10,
  },
  mandalaDotNight: {
    backgroundColor: '#C6A16B',
  },
});

export default VerseCard;
