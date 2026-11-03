import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';

export interface MantraItem {
  id: string;
  deity: string;
  hindiTitle: string;
  typeBadge: string;
  badgeColor: string;
  mantra: string;
  beejMantra?: string;
  transliteration?: string;
  chantCount?: string;
  rosary?: string;
  direction?: string;
  benefit?: string;
}

export const DHANTERAS_MANTRAS: MantraItem[] = [
  {
    id: 'kuber',
    deity: 'भगवान कुबेर (Lord Kuber)',
    hindiTitle: 'कुबेर धन-समृद्धि महामंत्र',
    typeBadge: 'अमोघ महामंत्र',
    badgeColor: '#D97706',
    mantra: 'ॐ यक्षाय कुबेराय वैश्रवणाय धनधान्याधिपतये धनधान्यसमृद्धिं मे देहि दापय स्वाहा॥',
    beejMantra: 'ॐ ह्रीं कुबेराय नमः',
    transliteration: 'Om Yakshaya Kuberaya Vaishravanaya Dhana-Dhanyadhipataye Dhana-Dhanya Samriddhim Me Dehi Dapaya Swaha',
    chantCount: '108 बार (1 माला)',
    rosary: 'कमलगट्टे या स्फटिक की माला',
    direction: 'उत्तर दिशा (कुबेर देव की दिशा)',
    benefit: 'व्यापार में अकूत वृद्धि, अटका हुआ धन वापस मिलना और संचित धन की रक्षा।',
  },
  {
    id: 'lakshmi',
    deity: 'मां महालक्ष्मी (Maa Mahalakshmi)',
    hindiTitle: 'महालक्ष्मी कमलवासिनी सिद्ध मंत्र',
    typeBadge: 'सिद्ध बीज मंत्र',
    badgeColor: '#B91C1C',
    mantra: 'ॐ श्रीं ह्रीं श्रीं कमले कमलालये प्रसीद प्रसीद श्रीं ह्रीं श्रीं ॐ महालक्ष्म्यै नमः॥',
    beejMantra: 'ॐ श्रीं महालक्ष्म्यै नमः',
    transliteration: 'Om Shreem Hreem Shreem Kamale Kamalalaye Praseeda Praseeda Shreem Hreem Shreem Om Mahalakshmyai Namah',
    chantCount: '108 बार (1 माला)',
    rosary: 'कमलगट्टे की माला',
    direction: 'पूर्व या उत्तर दिशा',
    benefit: 'दरिद्रता का पूर्ण नाश, घर में स्थिर लक्ष्मी का वास और अखंड ऐश्वर्य।',
  },
  {
    id: 'dhanvantari',
    deity: 'भगवान धन्वंतरि (Lord Dhanvantari)',
    hindiTitle: 'धन्वंतरि महा आरोग्य अमृत मंत्र',
    typeBadge: 'आरोग्य मंत्र',
    badgeColor: '#059669',
    mantra: 'ॐ नमो भगवते वासुदेवाय धन्वंतरये अमृतकलश हस्ताय सर्वामय विनाशनाय त्रैलोक्यनाथाय श्री महाविष्णवे नमः॥',
    beejMantra: 'ॐ धन्वंतरये नमः',
    transliteration: 'Om Namo Bhagavate Vasudevaya Dhanvantaraye Amrita-Kalasha Hastaya Sarvamaya Vinashanaya Trailokyanathaya Shri Mahavishnave Namah',
    chantCount: '108 बार (1 माला)',
    rosary: 'तुलसी या रुद्राक्ष की माला',
    direction: 'पूर्व दिशा (पीले वस्त्र धारण कर)',
    benefit: 'समस्त शारीरिक व मानसिक रोगों से मुक्ति, निरोगी काया और दीर्घायु।',
  },
  {
    id: 'yam',
    deity: 'यमराज देव (Lord Yama)',
    hindiTitle: 'यम दीप दान रक्षा मंत्र',
    typeBadge: 'अकाल मृत्यु निवारण',
    badgeColor: '#7C2D12',
    mantra: 'मृत्युना पाशदण्डाभ्यां कालेन श्यामया सह।\nत्रयोदश्यां दीपदानात् सूर्यजः प्रीयतां मम॥',
    transliteration: 'Mrityuna Pashadandabhyam Kalena Shyamaya Saha | Trayodashyam Deepadanat Suryajah Preeyatam Mama ||',
    chantCount: '1 बार (दीप प्रज्वलन समय)',
    direction: 'दक्षिण दिशा (घर के मुख्य द्वार पर)',
    benefit: 'अकाल मृत्यु के भय से मुक्ति, दुर्घटनाओं से रक्षा और कुल का कल्याण।',
  },
];

interface FestivalMantraRendererProps {
  festivalName: string;
  rawMantra?: string;
  isDhanteras?: boolean;
}

export const FestivalMantraRenderer: React.FC<FestivalMantraRendererProps> = ({
  festivalName,
  rawMantra = '',
  isDhanteras = false,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Extract mantras cleanly without repetition
  const mantraList: MantraItem[] = React.useMemo(() => {
    if (isDhanteras) {
      return DHANTERAS_MANTRAS;
    }

    if (!rawMantra || !rawMantra.trim()) {
      return [
        {
          id: 'gen-1',
          deity: festivalName,
          hindiTitle: `${festivalName} पावन मंत्र`,
          typeBadge: 'वैदिक मंत्र',
          badgeColor: '#D97706',
          mantra: 'ॐ नमो भगवते वासुदेवाय॥',
          chantCount: '108 बार',
          benefit: 'आत्मिक शांति व ईश्वर की कृपा प्राप्ति।',
        },
      ];
    }

    // Parse rawMantra string cleanly: split by '•' or newlines or ';'
    const rawParts = rawMantra
      .split(/[•\n;]/)
      .map((p) => p.trim())
      .filter((p) => p.length > 5);

    const items: MantraItem[] = [];

    rawParts.forEach((part, idx) => {
      let deity = `${festivalName} मंत्र`;
      let text = part;

      if (part.includes(':')) {
        const splitIdx = part.indexOf(':');
        deity = part.substring(0, splitIdx).trim();
        text = part.substring(splitIdx + 1).trim();
      }

      text = text.replace(/^["'\s]+|["'\s]+$/g, '');

      items.push({
        id: `m-${idx}`,
        deity,
        hindiTitle: `${deity} सिद्ध मंत्र`,
        typeBadge: 'सिद्ध मंत्र',
        badgeColor: idx % 2 === 0 ? '#D97706' : '#059669',
        mantra: text,
        chantCount: '108 बार (1 माला)',
        benefit: `${festivalName} पर इस मंत्र का श्रद्धापूर्वक जप करना कल्याणकारी है।`,
      });
    });

    return items.length > 0
      ? items
      : [
          {
            id: 'gen-fallback',
            deity: festivalName,
            hindiTitle: `${festivalName} मंत्र`,
            typeBadge: 'पावन मंत्र',
            badgeColor: '#D97706',
            mantra: rawMantra.trim(),
            chantCount: '108 बार',
          },
        ];
  }, [festivalName, rawMantra, isDhanteras]);

  const handleCopy = async (id: string, text: string) => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (_e) {}
    try {
      await Clipboard.setStringAsync(text);
      setCopiedId(id);
      setTimeout(() => {
        setCopiedId((current) => (current === id ? null : current));
      }, 2500);
    } catch (_e) {}
  };

  return (
    <View style={styles.container}>
      {/* Page Header (Centered) */}
      <View style={styles.headerBox}>
        <View style={styles.headerIconCircle}>
          <Text style={styles.omSymbol}>🕉</Text>
        </View>
        <Text style={styles.pageTitle}>वैदिक एवं सिद्ध मंत्र</Text>
        <Text style={styles.pageSubtitle}>
          {isDhanteras
            ? 'धनतेरस के पावन अवसर पर भगवान कुबेर, मां लक्ष्मी, भगवान धन्वंतरि एवं यमराज के इन सिद्ध मंत्रों का जप करना विशेष फलदायी है।'
            : `${festivalName} के पावन अवसर पर इन पवित्र मंत्रों का श्रद्धापूर्वक जप करने से दैवीय कृपा और मनोवांछित फल की प्राप्ति होती है।`}
        </Text>
      </View>

      {/* Mantra Cards (Single occurrence, clean typography) */}
      <View style={styles.mantraCardsList}>
        {mantraList.map((m, index) => {
          const isCopied = copiedId === m.id;
          return (
            <View key={m.id} style={styles.mantraCard}>
              {/* Card Header (Centered) */}
              <View style={styles.cardHeaderBox}>
                <View style={[styles.typeBadge, { borderColor: m.badgeColor }]}>
                  <Text style={[styles.typeBadgeText, { color: m.badgeColor }]}>
                    {m.typeBadge}
                  </Text>
                </View>
                <Text style={styles.deityText}>{m.deity}</Text>
                <Text style={styles.hindiTitleText}>{m.hindiTitle}</Text>
              </View>

              {/* Sacred Sanskrit Shloka Box */}
              <View style={styles.shlokaBox}>
                <Text style={styles.shlokaText}>{m.mantra}</Text>

                {/* Beej Mantra Pill */}
                {!!m.beejMantra && (
                  <View style={styles.beejMantraPill}>
                    <Text style={styles.beejMantraLabel}>बीज मंत्र:</Text>
                    <Text style={styles.beejMantraValue}>{m.beejMantra}</Text>
                  </View>
                )}

                {/* Roman Transliteration */}
                {!!m.transliteration && (
                  <Text style={styles.transliterationText}>
                    "{m.transliteration}"
                  </Text>
                )}
              </View>

              {/* Chanting Details */}
              <View style={styles.detailsBlock}>
                {!!m.chantCount && (
                  <View style={styles.detailRow}>
                    <Ionicons name="radio-button-on" size={13} color="#B45309" style={{ marginTop: 2 }} />
                    <Text style={styles.detailLabel}>जप संख्या:</Text>
                    <Text style={styles.detailValue}>{m.chantCount}</Text>
                  </View>
                )}

                {!!m.rosary && (
                  <View style={styles.detailRow}>
                    <Ionicons name="sparkles" size={13} color="#B45309" style={{ marginTop: 2 }} />
                    <Text style={styles.detailLabel}>माला:</Text>
                    <Text style={styles.detailValue}>{m.rosary}</Text>
                  </View>
                )}

                {!!m.direction && (
                  <View style={styles.detailRow}>
                    <Ionicons name="compass-outline" size={14} color="#B45309" style={{ marginTop: 1 }} />
                    <Text style={styles.detailLabel}>दिशा:</Text>
                    <Text style={styles.detailValue}>{m.direction}</Text>
                  </View>
                )}

                {!!m.benefit && (
                  <View style={styles.detailRow}>
                    <Ionicons name="ribbon-outline" size={14} color="#B45309" style={{ marginTop: 1 }} />
                    <Text style={styles.detailLabel}>शुभ फल:</Text>
                    <Text style={styles.detailValue}>{m.benefit}</Text>
                  </View>
                )}
              </View>

              {/* Copy Button (Centered, Jaap button removed) */}
              <View style={styles.actionButtonsRow}>
                <TouchableOpacity
                  style={[styles.copyButton, isCopied && styles.copyButtonActive]}
                  onPress={() => handleCopy(m.id, m.mantra)}
                  activeOpacity={0.7}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <Ionicons
                    name={isCopied ? 'checkmark-circle' : 'copy-outline'}
                    size={15}
                    color={isCopied ? '#059669' : '#78350F'}
                  />
                  <Text style={[styles.copyButtonText, isCopied && styles.copyButtonTextActive]}>
                    {isCopied ? 'कॉपी हो गया! ✓' : 'मंत्र कॉपी करें'}
                  </Text>
                </TouchableOpacity>
              </View>

              {index < mantraList.length - 1 && <View style={styles.cardSeparator} />}
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 40,
    backgroundColor: 'transparent',
  },
  headerBox: {
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 8,
    width: '100%',
  },
  headerIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(217, 119, 6, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  omSymbol: {
    fontSize: 22,
    color: '#92400E',
  },
  pageTitle: {
    color: '#431407',
    fontSize: 21,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.3,
    width: '100%',
  },
  pageSubtitle: {
    color: '#78350F',
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 6,
    width: '100%',
  },
  mantraCardsList: {
    gap: 16,
  },
  mantraCard: {
    paddingBottom: 8,
  },
  cardHeaderBox: {
    alignItems: 'center',
    marginBottom: 10,
    gap: 4,
    width: '100%',
  },
  deityText: {
    color: '#431407',
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.1,
  },
  hindiTitleText: {
    color: '#78350F',
    fontSize: 12.5,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 1,
  },
  typeBadge: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginBottom: 2,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  shlokaBox: {
    borderWidth: 1,
    borderColor: 'rgba(180, 83, 9, 0.22)',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 251, 235, 0.65)',
    marginBottom: 12,
  },
  shlokaText: {
    color: '#3B1103',
    fontSize: Platform.OS === 'android' ? 17 : 18,
    fontWeight: '700',
    lineHeight: 28,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  beejMantraPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(180, 83, 9, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginTop: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  beejMantraLabel: {
    color: '#78350F',
    fontSize: 12,
    fontWeight: '600',
  },
  beejMantraValue: {
    color: '#92400E',
    fontSize: 13.5,
    fontWeight: '700',
  },
  transliterationText: {
    color: '#78350F',
    fontSize: 11.5,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 8,
    paddingHorizontal: 6,
  },
  detailsBlock: {
    gap: 6,
    marginBottom: 12,
    paddingLeft: 2,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  detailLabel: {
    color: '#78350F',
    fontSize: 12.5,
    fontWeight: '600',
    width: 68,
  },
  detailValue: {
    color: '#1C1917',
    fontSize: 12.5,
    lineHeight: 17,
    flex: 1,
    fontWeight: '500',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#78350F',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 10,
  },
  copyButtonActive: {
    borderColor: '#059669',
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
  },
  copyButtonText: {
    color: '#78350F',
    fontSize: 12.5,
    fontWeight: '700',
  },
  copyButtonTextActive: {
    color: '#059669',
  },
  cardSeparator: {
    height: 1,
    backgroundColor: 'rgba(120, 53, 15, 0.12)',
    marginTop: 18,
  },
});

export default FestivalMantraRenderer;
