import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Platform,
  Share as RNShare,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { COLORS, SPACING, BORDER_RADIUS, FONTS } from '../constants/theme';
import festivalEnrichments from '../data/festival-enrichments';
import { getFestivalImage } from '../constants/festivalImages';
import { getFestivalPujaVidhi } from '../data/festivalPujaVidhiData';
import { ShamiLeafWishCard } from './ShamiLeafWishCard';
import { ChandDikhaScratchCard } from './ChandDikhaScratchCard';
import { PersonalizedKarwaCard } from './PersonalizedKarwaCard';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { getTrackedBrahmandUrl, shareFestivalStoryPdf } from '../utils/generateFestivalStoryPdf';

const safeCaptureRef = async (ref: any, options: any): Promise<{ uri: string | null; error?: string }> => {
  try {
    const ViewShot = require('react-native-view-shot');
    const capture = ViewShot?.captureRef || ViewShot?.default?.captureRef || ViewShot;
    if (typeof capture === 'function') {
      const uri = await capture(ref, options);
      return { uri };
    }
    return { uri: null, error: 'captureRef is not a function' };
  } catch (e: any) {
    return { uri: null, error: e?.message || String(e) };
  }
};

const safeShareFile = async (uri: string, options: any): Promise<{ shared: boolean; error?: string }> => {
  try {
    const Sharing = require('expo-sharing');
    if (Sharing && typeof Sharing.isAvailableAsync === 'function') {
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri, options);
        return { shared: true };
      }
    }
    return { shared: false, error: 'expo-sharing not available' };
  } catch (e: any) {
    return { shared: false, error: e?.message || String(e) };
  }
};

interface RelatedFestival {
  id?: string;
  name: string;
  date?: string;
  emoji?: string;
}

interface FestivalDetailCardProps {
  festival: any;
  onBack: () => void;
  onGuidePress?: (section: string) => void;
  /** Optional — called when a related festival chip is tapped. Safe to omit. */
  onRelatedFestivalPress?: (relatedFestival: RelatedFestival) => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IS_SMALL_SCREEN = SCREEN_WIDTH <= 360;

// Unique Section Styling & Icons Config
const SECTION_CONFIG: Record<string, {
  icon: keyof typeof Ionicons.glyphMap;
  accent: string;
  bgGradient: [string, string];
  emoji: string;
  stripColor: string;
}> = {
  Story: {
    icon: 'book',
    accent: '#D97706',
    bgGradient: ['#FFFBEB', '#FEF3C7'],
    emoji: '📖',
    stripColor: '#F59E0B',
  },
  Origin: {
    icon: 'compass',
    accent: '#B45309',
    bgGradient: ['#FEF3C7', '#FDE68A'],
    emoji: '🧭',
    stripColor: '#D97706',
  },
  About: {
    icon: 'flower',
    accent: '#15803D',
    bgGradient: ['#F0FDF4', '#DCFCE7'],
    emoji: '🌸',
    stripColor: '#16A34A',
  },
  'Nav Durga': {
    icon: 'sparkles',
    accent: '#C2410C',
    bgGradient: ['#FFF7ED', '#FFEDD5'],
    emoji: '🔱',
    stripColor: '#EA580C',
  },
  Purpose: {
    icon: 'sparkles',
    accent: '#C2410C',
    bgGradient: ['#FFEDD5', '#FED7AA'],
    emoji: '✨',
    stripColor: '#EA580C',
  },
  Importance: {
    icon: 'star',
    accent: '#B91C1C',
    bgGradient: ['#FEF2F2', '#FEE2E2'],
    emoji: '👑',
    stripColor: '#DC2626',
  },
  Celebration: {
    icon: 'happy',
    accent: '#047857',
    bgGradient: ['#ECFDF5', '#D1FAE5'],
    emoji: '🪔',
    stripColor: '#059669',
  },
  'Puja Vidhi': {
    icon: 'flame',
    accent: '#9A3412',
    bgGradient: ['#FFF7ED', '#FFEDD5'],
    emoji: '🔱',
    stripColor: '#C2410C',
  },
  Mantra: {
    icon: 'musical-notes',
    accent: '#6B21A8',
    bgGradient: ['#F3E8FF', '#E9D5FF'],
    emoji: '🕉',
    stripColor: '#7E22CE',
  },
  'Fun Facts': {
    icon: 'bulb',
    accent: '#B45309',
    bgGradient: ['#FFFBEB', '#FEF3C7'],
    emoji: '💡',
    stripColor: '#D97706',
  },
};

// Date Formatter & Days Countdown Calculation
const formatFestivalDate = (dateStr: string) => {
  if (!dateStr) return 'Date TBD';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parts[0];
    const monthIndex = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];
    const monthName = months[monthIndex] || parts[1];
    return `${day} ${monthName} ${year}`;
  }
  return dateStr;
};

const calculateDaysRemaining = (dateStr: string) => {
  if (!dateStr) return null;
  const festDate = new Date(dateStr);
  if (isNaN(festDate.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  festDate.setHours(0, 0, 0, 0);
  const diffTime = festDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today!';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays > 1) return `${diffDays} Days to go`;
  return null;
};

// Fun Facts Carousel ("Did You Know?")
const FACT_CARD_GAP = 12;
const FACT_CARD_WIDTH = SCREEN_WIDTH - SPACING.md * 2 - 36;

const FunFactsCarousel = ({ facts }: { facts: string[] }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const fadeIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeIn, {
      toValue: 1,
      duration: 320,
      delay: 120,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [fadeIn]);

  const handleScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / (FACT_CARD_WIDTH + FACT_CARD_GAP));
    setActiveIndex(Math.max(0, Math.min(index, facts.length - 1)));
  };

  if (!facts || facts.length === 0) return null;

  return (
    <Animated.View style={[styles.factsSection, { opacity: fadeIn }]}>
      <View style={styles.sectionHeaderRow}>
        <View style={styles.factsHeadingRow}>
          <View style={styles.goldBadgeDot} />
          <Ionicons name="bulb" size={18} color="#D4AF37" />
          <Text style={styles.sectionHeading}>Did You Know?</Text>
        </View>
        {facts.length > 1 && (
          <Text style={styles.sectionCount}>
            {activeIndex + 1}/{facts.length}
          </Text>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={FACT_CARD_WIDTH + FACT_CARD_GAP}
        decelerationRate="fast"
        onMomentumScrollEnd={handleScrollEnd}
        contentContainerStyle={styles.factsScrollContent}
      >
        {facts.map((fact, i) => (
          <View
            key={i}
            style={[
              styles.factCard,
              { width: FACT_CARD_WIDTH, marginRight: i === facts.length - 1 ? 0 : FACT_CARD_GAP },
            ]}
          >
            <View style={styles.factCardDecor}>
              <Text style={styles.mandalaPattern}>🌸 🪔 🌸</Text>
            </View>
            <Ionicons name="sparkles" size={18} color="#D4AF37" style={styles.factIcon} />
            <Text style={styles.factText} maxFontSizeMultiplier={1.3}>
              {fact}
            </Text>
          </View>
        ))}
      </ScrollView>

      {facts.length > 1 && (
        <View style={styles.dotsRow}>
          {facts.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === activeIndex && styles.dotActive]}
            />
          ))}
        </View>
      )}
    </Animated.View>
  );
};

// Animated & Unique Section Item Card
const GuideItem = ({
  section,
  index,
  festivalName,
  isVisited,
  onPress,
}: {
  section: { title: string; value: string; customHeading?: string; subtitle?: string };
  index: number;
  festivalName: string;
  isVisited: boolean;
  onPress: () => void;
}) => {
  const translateY = useRef(new Animated.Value(16)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  const [isTruncated, setIsTruncated] = useState(false);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 280,
        delay: index * 60,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 260,
        delay: index * 60,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, [index, opacity, translateY]);

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 40,
      bounciness: 0,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 4,
    }).start();
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => { });
    onPress();
  };

  const handleTextLayout = useCallback((e: any) => {
    if (e.nativeEvent.lines.length > 2) {
      setIsTruncated(true);
    }
  }, []);

  const cfg = SECTION_CONFIG[section.title] || {
    icon: 'sparkles',
    accent: '#C2410C',
    bgGradient: ['#FFF7ED', '#FFEDD5'],
    emoji: '🪔',
    stripColor: '#EA580C',
  };

  return (
    <Animated.View style={{ transform: [{ translateY }, { scale }], opacity }}>
      <TouchableOpacity
        style={[
          styles.guideItem,
          isVisited && styles.guideItemVisited,
          IS_SMALL_SCREEN && styles.guideItemCompact,
        ]}
        activeOpacity={0.92}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        {/* Decorative Top Accent Strip */}
        <View style={[styles.cardAccentStrip, { backgroundColor: cfg.stripColor }]} />

        {/* Custom Icon Box */}
        <LinearGradient
          colors={section.title === 'Mantra' ? ['transparent', 'transparent'] : cfg.bgGradient}
          style={[
            styles.guideIconBox,
            section.title === 'Mantra' && styles.guideIconBoxTransparent,
          ]}
        >
          {section.title === 'Nav Durga' ? (
            <Image
              source={require('../../assets/images/india.png')}
              style={styles.navDurgaIndiaLogo}
              contentFit="contain"
            />
          ) : section.title === 'Puja Vidhi' ? (
            <Image
              source={require('../../assets/images/pujav.png')}
              style={styles.navDurgaIndiaLogo}
              contentFit="contain"
            />
          ) : section.title === 'Mantra' ? (
            <Image
              source={require('../../assets/images/mantra.png')}
              style={styles.navDurgaIndiaLogo}
              contentFit="contain"
            />
          ) : section.title === 'Importance' ? (
            <Image
              source={require('../../assets/images/importantance.png')}
              style={styles.navDurgaIndiaLogo}
              contentFit="contain"
            />
          ) : section.title === 'Story' ? (
            <Image
              source={require('../../assets/images/story.png')}
              style={styles.navDurgaIndiaLogo}
              contentFit="contain"
            />
          ) : (
            <Text style={styles.guideEmoji}>{cfg.emoji}</Text>
          )}
        </LinearGradient>

        {/* Text Details */}
        <View style={styles.guideTextContainer}>
          <View style={styles.guideHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={[styles.guideTitle, { color: cfg.accent }]}>
                {section.customHeading || section.title}
              </Text>
            </View>
            {isVisited && (
              <View style={styles.visitedBadge}>
                <Ionicons name="checkmark-circle" size={14} color="#D4AF37" />
                <Text style={styles.visitedText}>Explored</Text>
              </View>
            )}
          </View>
          <Text
            numberOfLines={2}
            onTextLayout={handleTextLayout}
            style={styles.guideDescription}
            maxFontSizeMultiplier={1.3}
          >
            {section.subtitle || section.value}
          </Text>
          {isTruncated && (
            <Text style={[styles.seeMore, { color: cfg.accent }]} maxFontSizeMultiplier={1.3}>
              Explore Section →
            </Text>
          )}
        </View>

        {/* Chevron */}
        <Ionicons
          name="chevron-forward"
          size={18}
          color={cfg.accent}
          style={styles.chevron}
        />
      </TouchableOpacity>
    </Animated.View>
  );
};

// Main Component
const FestivalDetailCard = ({ festival, onBack, onGuidePress, onRelatedFestivalPress }: FestivalDetailCardProps) => {
  const [visitedSections, setVisitedSections] = useState<string[]>([]);
  const festivalName = festival.festival_name || festival.name || festival.title || '';
  const festivalTitle = festivalName || 'पावन पर्व';
  const festivalId = festival.id || festivalName;

  // Enrichments data mapping
  const enrichmentKey = (festivalName || '').toLowerCase();
  const normalizedKey = enrichmentKey.replace('karwa', 'karva');
  const enrichment = festivalEnrichments[enrichmentKey] || festivalEnrichments[normalizedKey];

  // Dynamic section data per festival with distinct non-overlapping fields
  const rawStory = enrichment?.origin || festival.story || festival.origin || festival.summary;
  const rawAbout = enrichment?.summary || festival.summary;
  const rawPurpose = enrichment?.purpose || festival.purpose;
  const rawImportance = enrichment?.importance || festival.importance;
  const rawCelebration = enrichment?.celebration || festival.celebration;
  const rawPujaVidhi = festival.puja_vidhi || (festival.rituals ? (Array.isArray(festival.rituals) ? festival.rituals.join('. ') : festival.rituals) : null) || getFestivalPujaVidhi(festivalName, festival).title;
  const rawMantra = enrichment?.mantra || festival.mantra;

  const funFacts: string[] = enrichment?.fun_facts ?? festival.funFacts ?? festival.fun_facts ?? [];

  const isNavratriFestival =
    festivalName.toLowerCase().includes('navratri') ||
    festivalName.toLowerCase().includes('durga') ||
    (festival.id && String(festival.id).toLowerCase().includes('navratri'));

  const isDussehraFestival =
    festivalName.toLowerCase().includes('dussehra') ||
    festivalName.toLowerCase().includes('dasara') ||
    festivalName.toLowerCase().includes('vijaya') ||
    (festival.id && String(festival.id).toLowerCase().includes('dussehra'));

  const isKarvaChauthFestival =
    festivalName.toLowerCase().includes('karva') ||
    festivalName.toLowerCase().includes('karwa') ||
    /करवा\s*चौथ/i.test(festivalName) ||
    (festival.id && String(festival.id).toLowerCase().includes('karva'));

  const isSharadPurnimaFestival =
    festivalName.toLowerCase().includes('sharad') ||
    festivalName.toLowerCase().includes('kojagiri') ||
    festivalName.includes('शरद') ||
    (festival.id && String(festival.id).toLowerCase().includes('sharad'));

  const isMoonFestival =
    isSharadPurnimaFestival ||
    festivalName.toLowerCase().includes('purnima') ||
    festivalName.includes('पूर्णिमा');

  const router = useRouter();
  const currentUser = useAuthStore((state) => state.user);
  const currentUserName = (currentUser?.name || '').trim();
  const [chandSenderName, setChandSenderName] = useState<string>(currentUserName || '');
  const moonCardRef = useRef<any>(null);
  const [isSharingMoonCard, setIsSharingMoonCard] = useState<boolean>(false);

  const leafCardRef = useRef<any>(null);
  const [isSharingLeaf, setIsSharingLeaf] = useState<boolean>(false);
  const [isSharingPdf, setIsSharingPdf] = useState<boolean>(false);

  const handleShareFestivalPdf = async () => {
    if (isSharingPdf) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      setIsSharingPdf(true);
      await shareFestivalStoryPdf(festival);
    } catch (err) {
      console.warn('Failed to share festival PDF booklet:', err);
    } finally {
      setIsSharingPdf(false);
    }
  };

  const handleShareShamiLeaf = async () => {
    if (isSharingLeaf) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      setIsSharingLeaf(true);
      const name = (festival.festival_name || festival.name || festival.title || 'Dussehra').toUpperCase();

      let imageUri: string | null = null;
      if (leafCardRef.current) {
        await new Promise((res) => setTimeout(res, 350));
        const captureResult = await safeCaptureRef(leafCardRef, {
          format: 'png',
          quality: 0.98,
          result: 'tmpfile',
        });
        imageUri = captureResult.uri;
      }

      if (!imageUri) {
        const fallback = getFestivalImage(festival);
        if (fallback) imageUri = fallback;
      }

      if (!imageUri) {
        console.warn('[FestivalDetailCard] Leaf capture failed');
        return;
      }

      const webUrl = getTrackedBrahmandUrl(name, 'whatsapp_share');
      const message = `🌿 *विजयादशमी की हार्दिक शुभकामनाएं* 🌿\n\n✨ "सोनं घ्या, सोन्यासारखे राहा!" ✨\n\n🍃 *Share virtual Shami leaves with your loved ones & spread divine blessings!* 🍃\n\nDiscover the profound divine story, rituals & sacred significance on Brahmand:\n${webUrl}`;

      const shareResult = await safeShareFile(imageUri, {
        mimeType: 'image/png',
        dialogTitle: `Share Shami Leaf - ${name}`,
        UTI: 'public.png',
        message: message,
      });

      if (!shareResult.shared && shareResult.error) {
        await RNShare.share({
          message: `${message}\n${imageUri}`,
          title: `Share Shami Leaf`,
        });
      }
    } catch (err) {
      console.warn('Failed to share Shami leaf from festival detail:', err);
    } finally {
      setIsSharingLeaf(false);
    }
  };

  const handleShareChandDikha = async () => {
    if (isSharingMoonCard) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      setIsSharingMoonCard(true);

      const senderText = chandSenderName.trim() || currentUserName || 'शुभचिंतक';
      // Share the brahmand.app URL: app installed → OS opens the in-app route
      // directly (Universal/App Links); no app → web build redirects to the
      // backend's instant standalone HTML scratch card.
      const webUrl = `https://brahmand.app/chand-dikha?festival=${encodeURIComponent(
        festivalTitle
      )}&sender=${encodeURIComponent(senderText)}`;

      const message = `🌕 *चाँद दिखा? जब तक चाँद नहीं देखा, तब तक विश नहीं मिलेगी!* 🌙\n\n✨ *${senderText}* ने आपके लिए एक सीक्रेट स्क्रैच कार्ड भेजा है!\n\n👉 अपनी उंगली से स्क्रीन पर स्क्रैच करें और चाँद का दीदार करें:\n${webUrl}\n\n(जब तक आप उंगली से चाँद नहीं देखेंगे, तब तक मंगलकामना नहीं खुलेगी!)\n\n॥ सर्वे भवन्तु सुखिनः ॥\nब्रह्मांड — सनातन संस्कृति एवं उत्सव`;

      await RNShare.share({
        title: 'चाँद दिखा? सीक्रेट स्क्रैच कार्ड',
        message,
        url: webUrl,
      });
    } catch (err) {
      console.warn('[FestivalDetailCard] Chand Dikha share failed:', err);
    } finally {
      setIsSharingMoonCard(false);
    }
  };

  const karwaChauthSections = [
    {
      title: 'Story',
      customHeading: 'करवा चौथ व्रत कथा',
      subtitle: 'रानी वीरवती और करवा माता की पावन अमर कथा (ऑडियो सहित सुनें)',
      value: rawStory || 'रानी वीरवती और करवा माता की पावन कथा, जिसने पति के प्राणों की रक्षा की और अमर सुहाग का वरदान प्राप्त किया।',
    },
    {
      title: 'Puja Vidhi',
      customHeading: 'सम्पूर्ण पूजा विधि व सामग्री',
      subtitle: 'करवा पूजन, सरगी, गौरी पूजन व चंद्र अर्घ्य की सम्पूर्ण विधि',
      value: rawPujaVidhi || 'मिट्टी का करवा, छलनी, कच्चा दूध, अक्षत, रोली, कुमकुम, सुहाग सामग्री व जल से माता पार्वती व शिव परिवार का पूजन करें।',
    },
    {
      title: 'Importance',
      customHeading: 'महत्व व अखंड सौभाग्य नियम',
      subtitle: 'पति की दीर्घायु, निर्जला व्रत के नियम एवं आध्यात्मिक महत्व',
      value: rawImportance || 'पति की दीर्घायु और अखंड सौभाग्य के लिए निर्जला व्रत, चंद्र दर्शन और अर्घ्य का पावन विधान।',
    },
  ];

  const sections = isKarvaChauthFestival
    ? karwaChauthSections
    : [
        { title: 'Story', value: rawStory },
        { title: 'About', value: rawAbout },
        ...(isNavratriFestival ? [{ title: 'Nav Durga', value: '९ देवियों के पावन स्वरूप, शुभ रंग, दैनिक भोग, प्रिय पुष्प व सिद्ध मंत्र जानें' }] : []),
        { title: 'Importance', value: rawImportance },
        { title: 'Puja Vidhi', value: rawPujaVidhi },
        ...(!isKarvaChauthFestival ? [{ title: 'Mantra', value: rawMantra }] : []),
        { title: 'Fun Facts', value: funFacts && funFacts.length > 0 ? funFacts.join(' • ') : null },
      ].filter((s) => Boolean(s.value));

  // Load visited sections progress
  useEffect(() => {
    const loadProgress = async () => {
      try {
        const stored = await AsyncStorage.getItem(`@visited_${festivalId}`);
        if (stored) {
          setVisitedSections(JSON.parse(stored));
        }
      } catch (e) {
        console.warn('Failed to load visited sections', e);
      }
    };
    loadProgress();
  }, [festivalId]);

  const handleGuideSectionClick = (sectionTitle: string) => {
    if (!visitedSections.includes(sectionTitle)) {
      const updated = [...visitedSections, sectionTitle];
      setVisitedSections(updated);
      AsyncStorage.setItem(`@visited_${festivalId}`, JSON.stringify(updated)).catch(() => { });
    }
    onGuidePress?.(sectionTitle);
  };

  const deity = festival.deity || festival.deity_name || (festivalName.toLowerCase().includes('shiva') || festivalName.toLowerCase().includes('teej') ? 'Goddess Parvati & Lord Shiva' : 'Vedic Deities');
  const daysRemaining = calculateDaysRemaining(festival.date || '2026-08-15');
  const festivalImgAsset = getFestivalImage(festival);

  const completedCount = visitedSections.filter((v) => sections.some((s) => s.title === v)).length;
  const totalCount = sections.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <View style={styles.page}>
      {/* Background Watermark Mehndi Motif Overlay */}
      <View style={styles.watermarkOverlay} pointerEvents="none">
        <Text style={styles.watermarkText}>☸ 🌿 🏵 🌿 ☸</Text>
      </View>

      {/* Cultural Hero Card (For other festivals; Karwa Chauth uses its dedicated unified card) */}
      {!isKarvaChauthFestival && (
        <LinearGradient
          colors={['#8B0000', '#B22222', '#1E4620']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.heroCard, IS_SMALL_SCREEN && styles.heroCardCompact]}
        >
          {/* Low-opacity Hero Image Background */}
          {festivalImgAsset && (
            <Image
              source={festivalImgAsset}
              style={styles.heroBackgroundImage}
              contentFit="cover"
            />
          )}
          <View style={styles.heroGradientOverlay} />

          {/* Top Badges Row */}
          <View style={styles.heroTopRow}>
            <View style={styles.heroPill}>
              <Text style={styles.heroPillText}>🪔 SACRED FESTIVAL GUIDE</Text>
            </View>
            {daysRemaining && (
              <View style={styles.countdownBadge}>
                <Ionicons name="time" size={12} color="#FFD700" />
                <Text style={styles.countdownText}>{daysRemaining}</Text>
              </View>
            )}
          </View>

          {/* Title */}
          <Text
            style={[styles.heroTitle, IS_SMALL_SCREEN && styles.heroTitleCompact]}
            adjustsFontSizeToFit
            minimumFontScale={0.75}
            numberOfLines={2}
          >
            {festivalName}
          </Text>

          {/* Deity & Date Row */}
          <View style={styles.deityDateContainer}>
            <View style={styles.deityBadge}>
              <Ionicons name="sparkles" size={13} color="#FFD700" />
              <Text style={styles.deityBadgeText}>{deity}</Text>
            </View>
            <View style={styles.dateRow}>
              <Ionicons name="calendar" size={14} color="#FFD580" />
              <Text style={styles.heroDate}>{formatFestivalDate(festival.date || '2026-08-15')}</Text>
            </View>
          </View>

          {/* Gold Accent Divider */}
          <View style={styles.heroDivider} />

          <Text style={styles.heroHint}>
            🌿 Immerse yourself in divine mythology, rituals & monsoon traditions
          </Text>
        </LinearGradient>
      )}

      {/* Hidden Leaf Wish Card for Screenshot/Capture */}
      {isDussehraFestival && (
        <View
          style={{
            position: 'absolute',
            left: -9999,
            top: -9999,
            opacity: 1,
            zIndex: -1,
          }}
          pointerEvents="none"
        >
          <View collapsable={false} style={{ width: 527, height: 544, backgroundColor: 'transparent' }}>
            <ShamiLeafWishCard
              ref={leafCardRef}
              festival={festival}
            />
          </View>
        </View>
      )}

      {/* For Dussehra: Replaced Section Completion Tracker with Sacred Virtual Shami Leaf Share Banner */}
      {isDussehraFestival ? (
        <View style={styles.shamiShareBanner}>
          <LinearGradient
            colors={['#FEF9C3', '#FEF08A', '#FDE047']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.shamiShareGradient}
          >
            <View style={styles.shamiShareContentRow}>
              <View style={styles.shamiShareLeafIconWrapper}>
                <Image
                  source={require('../../assets/images/festivals/shami_leaf.png')}
                  style={styles.shamiShareLeafIcon}
                  contentFit="contain"
                />
              </View>

              <View style={styles.shamiShareTextCol}>
                <View style={styles.shamiSharePill}>
                  <Text style={styles.shamiSharePillText}>✨ सुवर्ण शमी पत्र ✨</Text>
                </View>
                <Text style={styles.shamiShareMainTitle}>सोनं घ्या, सोन्यासारखे राहा!</Text>
                <Text style={styles.shamiShareTagline}>
                  🍃 Share virtual Shami leaves with your loved ones & spread divine blessings!
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.shamiShareButton}
              onPress={handleShareShamiLeaf}
              disabled={isSharingLeaf}
              activeOpacity={0.85}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Share Virtual Shami Leaf"
            >
              <LinearGradient
                colors={['#854D0E', '#78350F', '#7C2D12']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.shamiShareButtonGradient}
              >
                <Ionicons
                  name="share-social"
                  size={18}
                  color="#FEF08A"
                />
                <Text style={styles.shamiShareButtonText}>
                  {isSharingLeaf ? 'Preparing...' : 'Share Virtual Leaf'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      ) : isKarvaChauthFestival ? null : (
        /* Progress Bar for Other Festivals */
        totalCount > 0 && (
          <View style={styles.progressContainer}>
            <View style={styles.progressHeaderRow}>
              <Text style={styles.progressTitle}>Section Completion Tracker</Text>
              <Text style={styles.progressCount}>
                {completedCount} of {totalCount} Explored
              </Text>
            </View>
            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
            </View>
          </View>
        )
      )}



      {/* For Karwa Chauth: Highly Personalized Devotee Card & Day Tracker */}
      {isKarvaChauthFestival && (
        <PersonalizedKarwaCard festival={festival} />
      )}

      {/* For Non-Karwa Moon Festivals (Sharad Purnima, Purnima): Interactive "चाँद दिखा" Scratch Card Banner & Live Card */}
      {isMoonFestival && !isKarvaChauthFestival && (
        <View style={styles.chandDikhaSection}>
          <LinearGradient
            colors={['#070B1C', '#0B132B', '#111A38']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.chandDikhaGradient}
          >
            {/* Top Pill & Action Row */}
            <View style={styles.chandDikhaHeaderRow}>
              <View style={styles.chandDikhaPill}>
                <Text style={styles.chandDikhaPillEmoji}>🌙</Text>
                <Text style={styles.chandDikhaPillText}>स्पेशल स्क्रैच विश</Text>
                <Text style={styles.chandDikhaPillEmoji}>✨</Text>
              </View>

              <TouchableOpacity
                style={styles.fullScreenBadgeBtn}
                onPress={() =>
                  router.push(
                    `/chand-dikha?festival=${encodeURIComponent(
                      festivalTitle
                    )}&sender=${encodeURIComponent(currentUserName)}`
                  )
                }
                activeOpacity={0.8}
              >
                <Ionicons name="expand" size={13} color="#FDE047" />
                <Text style={styles.fullScreenBadgeText}>बड़ा देखें</Text>
              </TouchableOpacity>
            </View>

            {/* Catchy Taglines */}
            <Text style={styles.chandDikhaMainTitle}>"चाँद दिखा" सीक्रेट विश कार्ड</Text>
            <Text style={styles.chandDikhaPunchline}>
              "जब तक चाँद नहीं देखा, तब तक विश नहीं मिलेगी!"
            </Text>
            <Text style={styles.chandDikhaInstructions}>
              🎁 इसे जिसे आप भेजेंगे, वो अपनी उंगली से स्क्रैच करके ही चाँद और आपकी शुभकामना देख पाएगा!
            </Text>

            {/* Sender Name Customization Input */}
            <View style={styles.senderInputContainer}>
              <Text style={styles.senderInputLabel}>✍️ प्रेषक का नाम (आपका नाम):</Text>
              <TextInput
                style={styles.senderTextInput}
                value={chandSenderName}
                onChangeText={setChandSenderName}
                placeholder="उदा. राहुल, शर्मा परिवार"
                placeholderTextColor="#64748B"
                maxLength={40}
              />
            </View>

            {/* The Interactive Scratch Card Preview */}
            <View style={styles.scratchCardContainer}>
              <ChandDikhaScratchCard
                ref={moonCardRef}
                festivalName={festivalTitle}
                senderName={chandSenderName || currentUserName}
              />
            </View>

            {/* Share Action */}
            <View style={styles.chandDikhaActionRow}>
              <TouchableOpacity
                style={styles.chandDikhaShareBtn}
                onPress={handleShareChandDikha}
                disabled={isSharingMoonCard}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#F59E0B', '#D97706', '#B45309']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.chandDikhaShareGradient}
                >
                  <Ionicons name="logo-whatsapp" size={19} color="#1E1B4B" />
                  <Text style={styles.chandDikhaShareBtnText}>
                    {isSharingMoonCard ? 'तैयार हो रहा है...' : 'यह सीक्रेट कार्ड व्हाट्सएप पर भेजें'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      )}

      {/* Reordered Guide Sections */}
      <View style={styles.guideSection}>
        <View style={styles.sectionHeaderRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
            <Text style={styles.sectionHeading}>
              {isKarvaChauthFestival ? 'करवा चौथ पावन मार्गदर्शिका' : 'Festival Guide Topics'}
            </Text>
            {sections.length > 0 && (
              <Text style={styles.sectionCount}>({sections.length})</Text>
            )}
          </View>

          <TouchableOpacity
            style={styles.shareAllHeaderBtn}
            onPress={handleShareFestivalPdf}
            disabled={isSharingPdf}
            activeOpacity={0.8}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Share all festival topics"
          >
            {isSharingPdf ? (
              <ActivityIndicator size="small" color="#B45309" />
            ) : (
              <>
                <Ionicons name="share-social-outline" size={15} color="#92400E" />
                <Text style={styles.shareAllHeaderText}>Share All</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {sections.map((section, index) => (
          <GuideItem
            key={section.title}
            section={section}
            index={index}
            festivalName={festivalName}
            isVisited={visitedSections.includes(section.title)}
            onPress={() => handleGuideSectionClick(section.title)}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  page: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
    backgroundColor: '#FDFBF7',
    position: 'relative',
  },
  watermarkOverlay: {
    position: 'absolute',
    top: 40,
    right: 10,
    left: 10,
    opacity: 0.04,
    alignItems: 'center',
  },
  watermarkText: {
    fontSize: 54,
    color: '#B8860B',
  },

  // Hero
  heroCard: {
    borderRadius: 22,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 22,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#D4AF37',
    shadowColor: '#8B0000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  heroCardCompact: {
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  heroBackgroundImage: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.35,
  },
  heroGradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(75, 0, 0, 0.45)',
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  heroPill: {
    backgroundColor: 'rgba(255, 215, 0, 0.22)',
    borderColor: '#FFD700',
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  heroPillText: {
    color: '#FFE4B5',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  countdownBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 0.8,
    borderColor: '#FFD700',
  },
  countdownText: {
    color: '#FFD700',
    fontSize: 11,
    fontWeight: '700',
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    fontFamily: FONTS.brandTitle,
    lineHeight: 34,
    letterSpacing: -0.5,
    marginBottom: 10,
  },
  heroTitleCompact: {
    fontSize: 24,
    lineHeight: 30,
  },
  deityDateContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  deityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  deityBadgeText: {
    color: '#FFF8E7',
    fontSize: 11.5,
    fontWeight: '600',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroDate: {
    color: '#FFD580',
    fontSize: 13,
    fontWeight: '600',
  },
  heroDivider: {
    height: 1.5,
    backgroundColor: 'rgba(255, 215, 0, 0.4)',
    marginBottom: 10,
  },
  heroHint: {
    color: '#FFE4B5',
    fontSize: 12,
    fontStyle: 'italic',
    lineHeight: 18,
  },

  // Progress Bar
  progressContainer: {
    backgroundColor: '#FFFBF0',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
    padding: 14,
    marginBottom: 16,
  },
  progressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressTitle: {
    color: '#78350F',
    fontSize: 13,
    fontWeight: '700',
  },
  progressCount: {
    color: '#B45309',
    fontSize: 12,
    fontWeight: '600',
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#D97706',
    borderRadius: 3,
  },

  // Dussehra Virtual Shami Leaf Share Banner
  shamiShareBanner: {
    marginBottom: 16,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    shadowColor: '#854D0E',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 4,
  },
  shamiShareGradient: {
    padding: 16,
    borderRadius: 18,
  },
  shamiShareContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 12,
  },
  shamiShareLeafIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#D97706',
    shadowColor: '#78350F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  shamiShareLeafIcon: {
    width: 48,
    height: 48,
  },
  shamiShareTextCol: {
    flex: 1,
  },
  shamiSharePill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(120, 53, 15, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginBottom: 4,
  },
  shamiSharePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#78350F',
    letterSpacing: 0.5,
  },
  shamiShareMainTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#78350F',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  shamiShareTagline: {
    fontSize: 12,
    fontWeight: '700',
    color: '#854D0E',
    lineHeight: 16.5,
  },
  shamiShareButton: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
  },
  shamiShareButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    paddingHorizontal: 16,
    gap: 8,
  },
  shamiShareButtonText: {
    color: '#FFFBEB',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.6,
  },

  // Guide Section
  guideSection: {
    marginBottom: SPACING.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionHeading: {
    color: '#451A03',
    fontSize: 17,
    fontWeight: '700',
  },
  shareAllHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  shareAllHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
  },
  goldBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D4AF37',
  },
  sectionCount: {
    color: '#B45309',
    fontSize: 13,
    fontWeight: '600',
  },

  // Guide Item Card
  guideItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 12,
    shadowColor: '#78350F',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    position: 'relative',
    overflow: 'hidden',
  },
  guideItemVisited: {
    borderColor: '#D4AF37',
    backgroundColor: '#FFFDF5',
  },
  guideItemCompact: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  cardAccentStrip: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  guideIconBox: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.4)',
  },
  guideIconBoxTransparent: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    borderWidth: 0,
  },
  guideEmoji: {
    fontSize: 22,
  },
  navDurgaIndiaLogo: {
    width: 28,
    height: 28,
  },
  guideTextContainer: {
    flex: 1,
  },
  guideHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  guideTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  visitedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FFF8E7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  visitedText: {
    color: '#B83200',
    fontSize: 10,
    fontWeight: '700',
  },
  guideDescription: {
    color: '#4B5563',
    fontSize: 13,
    lineHeight: 19,
  },
  seeMore: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'right',
  },
  chevron: {
    marginLeft: 8,
  },

  // Fun Facts / Carousel
  factsSection: {
    marginBottom: 20,
  },
  factsHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  factsScrollContent: {
    paddingRight: SPACING.md,
  },
  factCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.4)',
    padding: 16,
    minHeight: 88,
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  factCardDecor: {
    position: 'absolute',
    top: 4,
    right: 8,
    opacity: 0.15,
  },
  mandalaPattern: {
    fontSize: 12,
  },
  factIcon: {
    marginBottom: 6,
  },
  factText: {
    color: '#451A03',
    fontSize: 13.5,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(217, 119, 6, 0.25)',
  },
  dotActive: {
    backgroundColor: '#D97706',
    width: 18,
  },


  // Chand Dikha Section Styles
  chandDikhaSection: {
    borderRadius: 22,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1.2,
    borderColor: 'rgba(251, 191, 36, 0.45)',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  chandDikhaGradient: {
    padding: 16,
    alignItems: 'center',
  },
  chandDikhaHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 8,
  },
  chandDikhaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.18)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 14,
    borderWidth: 0.8,
    borderColor: 'rgba(251, 191, 36, 0.4)',
    gap: 4,
  },
  chandDikhaPillEmoji: {
    fontSize: 10,
  },
  chandDikhaPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FDE047',
  },
  fullScreenBadgeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 0.8,
    borderColor: 'rgba(254, 240, 138, 0.3)',
    gap: 4,
  },
  fullScreenBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FEF08A',
  },
  chandDikhaMainTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFBEB',
    textAlign: 'center',
    letterSpacing: 0.4,
    marginTop: 2,
    textShadowColor: 'rgba(245, 158, 11, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  chandDikhaPunchline: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#FBBF24',
    textAlign: 'center',
    marginTop: 2,
    letterSpacing: 0.2,
  },
  chandDikhaInstructions: {
    fontSize: 11.5,
    color: '#CBD5E1',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 8,
  },
  senderInputContainer: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 0.8,
    borderColor: 'rgba(251, 191, 36, 0.35)',
    marginBottom: 10,
  },
  senderInputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FDE047',
    marginBottom: 4,
  },
  senderTextInput: {
    color: '#FFFBEB',
    fontSize: 13,
    fontWeight: '600',
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  scratchCardContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chandDikhaActionRow: {
    width: '100%',
    maxWidth: 340,
    marginTop: 6,
  },
  chandDikhaShareBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  chandDikhaShareGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  chandDikhaShareBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E1B4B',
    letterSpacing: 0.3,
  },
});

export default FestivalDetailCard;


