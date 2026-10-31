import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { gitaSpeechService, SpeechLanguage } from '../services/gita-speech-service';

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
  isPlayingAudio?: boolean;
  onToggleAudio?: (type?: 'sanskrit' | 'hindi' | 'english' | 'both') => void;
  onLayout?: (event: any) => void;
}

const cleanTranslationString = (raw: string | null | undefined): string | null => {
  if (!raw || typeof raw !== 'string') return null;
  let text = raw.trim();
  if (text.toLowerCase().includes('did not comment')) return null;
  // Strip leading verse markers e.g. "।।1.1।।", "1.1.", "1.1 - 1.19"
  text = text.replace(/^(?:।।|॥|\/\/|\|\|)?\s*\d+(?:\.\d+)?(?:\s*--\s*\d+(?:\.\d+)?)?\s*(?:।।|॥|\/\/|\|\|)?\.?\s*/, '');
  text = text.replace(/(?:।।|॥|\/\/|\|\|)\s*\d+(?:\.\d+)?\s*(?:।।|॥|\/\/|\|\|)/g, '');
  // Clean footnote annotations e.g. (टिप्पणी प0 1.2)
  text = text.replace(/\s*\([^)]*टिप्पणी[^)]*\)\s*/g, ' ');
  text = text.replace(/\s*\[[^\]]*टिप्पणी[^\]]*\]\s*/g, ' ');
  text = text.replace(/\s*\([^)]*प0[^)]*\)\s*/g, ' ');
  // Clean colons inside brackets e.g. (युयुत्सव:) -> (युयुत्सव)
  text = text.replace(/\s*\(\s*([^)]*?):?\s*\)\s*/g, ' ($1) ');
  // Fix corrupt duplicate matras (e.g. मेरेे -> मेरे)
  text = text.replace(/([\u093E-\u094C])[\u093E-\u094C]+/g, '$1');
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
  isPlayingAudio,
  onToggleAudio,
  onLayout,
}: VerseCardProps) => {
  const [activeTab, setActiveTab] = useState<'both' | 'hindi' | 'english'>('both');
  const [isExpanded, setIsExpanded] = useState(true);
  const [showAudioSheet, setShowAudioSheet] = useState(false);
  const [localPlaying, setLocalPlaying] = useState(false);

  const isAudioActive = isPlayingAudio !== undefined ? isPlayingAudio : localPlaying;

  useEffect(() => {
    return () => {
      if (localPlaying) {
        gitaSpeechService.stop();
      }
    };
  }, [localPlaying]);

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

  const handleSpeakerPress = () => {
    if (isAudioActive) {
      if (onToggleAudio) {
        onToggleAudio();
      } else {
        gitaSpeechService.stop();
        setLocalPlaying(false);
      }
      return;
    }
    setShowAudioSheet(true);
  };

  const handleSelectAudioOption = (type: 'sanskrit' | 'hindi' | 'english' | 'both') => {
    setShowAudioSheet(false);
    if (onToggleAudio) {
      onToggleAudio(type);
      return;
    }

    const ch = Number(verse.chapter) || chapterNumber || 1;
    const v = Number(verse.verse) || (verse as any).id || index + 1;

    let textToSpeak = '';
    let secText: string | undefined = undefined;
    let speechLang: SpeechLanguage = 'sanskrit';

    if (type === 'sanskrit') {
      textToSpeak = (speakerHeading ? `${speakerHeading}। ` : '') + cleanSanskrit;
      speechLang = 'sanskrit';
    } else if (type === 'hindi') {
      textToSpeak = hindiText || cleanSanskrit;
      speechLang = 'hindi';
    } else if (type === 'english') {
      textToSpeak = englishText || cleanSanskrit;
      speechLang = 'english';
    } else if (type === 'both') {
      textToSpeak = (speakerHeading ? `${speakerHeading}। ` : '') + cleanSanskrit;
      secText = hindiText ? `भावार्थ: ${hindiText}` : (englishText ? `Meaning: ${englishText}` : undefined);
      speechLang = 'sanskrit';
    }

    setLocalPlaying(true);
    gitaSpeechService.speak({
      text: textToSpeak,
      secondaryText: secText,
      chapter: ch,
      verse: v,
      type: speechLang,
      onStart: () => setLocalPlaying(true),
      onDone: () => setLocalPlaying(false),
      onStopped: () => setLocalPlaying(false),
      onError: () => setLocalPlaying(false),
    });
  };

  return (
    <View
      onLayout={onLayout}
      style={[
        styles.cardContainer,
        nightMode && styles.cardContainerNight,
        isAudioActive && (nightMode ? styles.cardContainerPlayingNight : styles.cardContainerPlaying),
      ]}
    >
      {/* ── Top Header / Metadata Bar ── */}
      <View style={styles.cardHeader}>
        <View style={styles.refBadge}>
          <Text style={[styles.refText, nightMode && styles.refTextNight]}>{verseRefLabel}</Text>
        </View>

        <View style={styles.headerRightActions}>
          {/* Audio Recitation Button */}
          <TouchableOpacity
            onPress={handleSpeakerPress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={[
              styles.actionBtn,
              isAudioActive && (nightMode ? styles.actionBtnActiveNight : styles.actionBtnActive),
            ]}
            accessibilityLabel="श्लोक पाठ सुनें"
          >
            <Ionicons
              name={isAudioActive ? 'volume-high' : 'volume-medium-outline'}
              size={18}
              color={isAudioActive ? '#FF9933' : (nightMode ? '#A8927F' : '#9E8674')}
            />
          </TouchableOpacity>

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

      {/* ── Audio Recitation Mode Modal ── */}
      <Modal visible={showAudioSheet} transparent animationType="fade">
        <Pressable style={styles.audioModalOverlay} onPress={() => setShowAudioSheet(false)}>
          <View style={[styles.audioModalBox, nightMode && styles.audioModalBoxNight]}>
            <View style={styles.audioModalHeader}>
              <View style={styles.audioHeaderTitleRow}>
                <Ionicons name="musical-notes" size={18} color={nightMode ? '#FFB870' : '#8A4A28'} />
                <Text style={[styles.audioModalTitle, nightMode && styles.audioModalTitleNight]}>
                  {verseRefLabel} पाठ सुनें
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowAudioSheet(false)} style={styles.audioModalCloseBtn}>
                <Ionicons name="close" size={18} color={nightMode ? '#C4B5A5' : '#8A7568'} />
              </TouchableOpacity>
            </View>

            <View style={styles.audioOptionsList}>
              <TouchableOpacity
                style={[styles.audioOptionItem, nightMode && styles.audioOptionItemNight]}
                onPress={() => handleSelectAudioOption('sanskrit')}
                activeOpacity={0.8}
              >
                <View style={[styles.audioOptionIconCircle, { backgroundColor: '#FFF3E0' }]}>
                  <Text style={styles.audioOptionOm}>ॐ</Text>
                </View>
                <View style={styles.audioOptionTextCol}>
                  <Text style={[styles.audioOptionLabel, nightMode && styles.audioOptionLabelNight]}>
                    संस्कृत श्लोक पाठ
                  </Text>
                  <Text style={[styles.audioOptionSub, nightMode && styles.audioOptionSubNight]}>
                    मधुर दिव्य स्वर (रुक-रुक कर शांत उच्चारण)
                  </Text>
                </View>
                <Ionicons name="play-circle" size={24} color="#E89A3C" />
              </TouchableOpacity>

              {hindiText ? (
                <TouchableOpacity
                  style={[styles.audioOptionItem, nightMode && styles.audioOptionItemNight]}
                  onPress={() => handleSelectAudioOption('hindi')}
                  activeOpacity={0.8}
                >
                  <View style={[styles.audioOptionIconCircle, { backgroundColor: '#FDF1E6' }]}>
                    <Ionicons name="book-outline" size={17} color="#B35B21" />
                  </View>
                  <View style={styles.audioOptionTextCol}>
                    <Text style={[styles.audioOptionLabel, nightMode && styles.audioOptionLabelNight]}>
                      हिन्दी अनुवाद
                    </Text>
                    <Text style={[styles.audioOptionSub, nightMode && styles.audioOptionSubNight]}>
                      सरल हिन्दी भावार्थ (मधुर दिव्य स्वर)
                    </Text>
                  </View>
                  <Ionicons name="play-circle" size={24} color="#B35B21" />
                </TouchableOpacity>
              ) : null}

              {englishText ? (
                <TouchableOpacity
                  style={[styles.audioOptionItem, nightMode && styles.audioOptionItemNight]}
                  onPress={() => handleSelectAudioOption('english')}
                  activeOpacity={0.8}
                >
                  <View style={[styles.audioOptionIconCircle, { backgroundColor: '#F0F4F8' }]}>
                    <Ionicons name="globe-outline" size={17} color="#3B6790" />
                  </View>
                  <View style={styles.audioOptionTextCol}>
                    <Text style={[styles.audioOptionLabel, nightMode && styles.audioOptionLabelNight]}>
                      English Translation
                    </Text>
                    <Text style={[styles.audioOptionSub, nightMode && styles.audioOptionSubNight]}>
                      English meaning and commentary
                    </Text>
                  </View>
                  <Ionicons name="play-circle" size={24} color="#3B6790" />
                </TouchableOpacity>
              ) : null}

              {hindiText ? (
                <TouchableOpacity
                  style={[styles.audioOptionItem, nightMode && styles.audioOptionItemNight]}
                  onPress={() => handleSelectAudioOption('both')}
                  activeOpacity={0.8}
                >
                  <View style={[styles.audioOptionIconCircle, { backgroundColor: '#FDF7EB' }]}>
                    <Ionicons name="sparkles" size={17} color="#D48817" />
                  </View>
                  <View style={styles.audioOptionTextCol}>
                    <Text style={[styles.audioOptionLabel, nightMode && styles.audioOptionLabelNight]}>
                      सम्पूर्ण पाठ
                    </Text>
                    <Text style={[styles.audioOptionSub, nightMode && styles.audioOptionSubNight]}>
                      संस्कृत श्लोक एवं हिन्दी भावार्थ (विश्राम सहित)
                    </Text>
                  </View>
                  <Ionicons name="play-circle" size={24} color="#D48817" />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        </Pressable>
      </Modal>
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
    prev.isBookmarked === next.isBookmarked &&
    prev.isPlayingAudio === next.isPlayingAudio
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
  cardContainerPlaying: {
    borderColor: '#E89A3C',
    borderWidth: 1.5,
    backgroundColor: '#FFFBF2',
    shadowColor: '#E89A3C',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  cardContainerPlayingNight: {
    borderColor: '#FFA534',
    borderWidth: 1.5,
    backgroundColor: '#261B14',
    shadowColor: '#FFA534',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
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
    gap: 6,
  },
  actionBtn: {
    padding: 6,
    borderRadius: 8,
  },
  actionBtnActive: {
    backgroundColor: 'rgba(232, 154, 60, 0.15)',
  },
  actionBtnActiveNight: {
    backgroundColor: 'rgba(255, 165, 52, 0.2)',
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

  /* Audio Recitation Modal */
  audioModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  audioModalBox: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFDF9',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E8DEC9',
    shadowColor: '#5A4136',
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  audioModalBoxNight: {
    backgroundColor: '#201814',
    borderColor: 'rgba(198, 161, 107, 0.25)',
    shadowColor: '#000',
  },
  audioModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0E7D8',
  },
  audioHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  audioModalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#743B27',
  },
  audioModalTitleNight: {
    color: '#FFD9B3',
  },
  audioModalCloseBtn: {
    padding: 4,
  },
  audioOptionsList: {
    gap: 10,
  },
  audioOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FAF5ED',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EBE1D0',
  },
  audioOptionItemNight: {
    backgroundColor: '#2A1F1A',
    borderColor: 'rgba(198, 161, 107, 0.18)',
  },
  audioOptionIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  audioOptionOm: {
    fontSize: 18,
    fontWeight: '700',
    color: '#E89A3C',
  },
  audioOptionTextCol: {
    flex: 1,
  },
  audioOptionLabel: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#42372F',
    marginBottom: 2,
  },
  audioOptionLabelNight: {
    color: '#EFE7DC',
  },
  audioOptionSub: {
    fontSize: 12,
    color: '#8A7568',
  },
  audioOptionSubNight: {
    color: '#A8927F',
  },
});

export default VerseCard;
