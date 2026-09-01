import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

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
  translations?: VerseTranslation[] | Record<string, string> | VerseTranslation;
}

interface VerseCardProps {
  verse: VerseData;
  nightMode: boolean;
  index: number;
  isLast: boolean;
  bookId?: string;
}

/**
 * 🎨 Varnish Code Quality Fix:
 * Replaced `verse: any` with strict `VerseData` & `VerseTranslation` interfaces.
 * Replaced dynamic inline style objects `{ backgroundColor: '#6e4733' }` in the divider section
 * with StyleSheet.create static properties to eliminate unnecessary allocations during render.
 */
const VerseCard = React.memo(({ verse, nightMode, index, isLast, bookId }: VerseCardProps) => {
  // Common text cleaning logic
  const cleanSanskrit = (verse.text || '').replace(/[\u1CD0-\u1CFF\u0951-\u0952]/g, '');

  let translationText: string | null = null;
  if (verse.translations) {
    if (bookId === 'bhagvad-geeta' || bookId === 'gita' || bookId === 'bhagavad-gita-3d') {
      const gitaTranslations: VerseTranslation[] = Array.isArray(verse.translations)
        ? verse.translations
        : [verse.translations as VerseTranslation];

      const ramsukhdas = gitaTranslations.find((t) => t.author_name === 'Swami Ramsukhdas');
      const sivananda = gitaTranslations.find((t) => t.author_name === 'Swami Sivananda');
      const hindiTrans = ramsukhdas || gitaTranslations.find((t) => t.language === 'hindi');
      const englishTrans = sivananda || gitaTranslations.find((t) => t.language === 'english');

      translationText = hindiTrans?.description || englishTrans?.description || null;
    } else if (typeof verse.translations === 'object' && !Array.isArray(verse.translations)) {
      const dict = verse.translations as Record<string, string>;
      translationText = dict.hindi || dict.english || null;
    }
  }

  return (
    <View style={styles.verseContainer}>
      {/* Sanskrit Text */}
      <View style={styles.sanskritWrapper}>
        <Text style={[styles.sanskritText, nightMode && styles.textNight]}>{cleanSanskrit}</Text>
        <Text style={[styles.sanskritVerseNumber, nightMode && styles.textNight]}>{convertToHindiNumerals(Number(verse.verse) || 0)}</Text>
      </View>

      {/* Hindi/English Translation */}
      {translationText ? (
        <Text style={[styles.hindiText, nightMode && styles.textNightMuted]}>
          <Text style={[styles.hindiVerseNumber, nightMode && styles.textNight]}>{convertToHindiNumerals(Number(verse.verse) || 0)}. </Text>
          {translationText}
        </Text>
      ) : null}

      {/* Divider */}
      {!isLast && (
        <View style={styles.dividerContainer}>
          <View style={[styles.dividerLine, nightMode && styles.dividerLineNight]} />
          <View style={[styles.dividerDot, nightMode && styles.dividerDotNight]} />
          <View style={[styles.dividerLine, nightMode && styles.dividerLineNight]} />
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
    prev.bookId === next.bookId
  );
});

VerseCard.displayName = 'VerseCard';

const styles = StyleSheet.create({
  verseContainer: {
    marginBottom: 24,
  },
  sanskritWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  sanskritText: {
    fontSize: 17,
    lineHeight: 28,
    color: '#691F0A',
    textAlign: 'center',
    fontWeight: '600',
  },
  sanskritVerseNumber: {
    fontSize: 16,
    color: '#691F0A',
    fontWeight: '600',
    marginLeft: 12,
    position: 'absolute',
    right: 0,
    bottom: 0,
  },
  hindiText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#3B3B3B',
    textAlign: 'justify',
  },
  hindiVerseNumber: {
    fontSize: 15,
    color: '#691F0A',
    fontWeight: '600',
  },
  textNight: {
    color: '#EBD7B6',
  },
  textNightMuted: {
    color: '#C4B49A',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    width: 40,
    height: 1,
    backgroundColor: '#8C5A3C',
  },
  dividerLineNight: {
    backgroundColor: '#6e4733',
  },
  dividerDot: {
    width: 6,
    height: 6,
    backgroundColor: '#8C5A3C',
    marginHorizontal: 12,
  },
  dividerDotNight: {
    backgroundColor: '#6e4733',
  },
});

export default VerseCard;
