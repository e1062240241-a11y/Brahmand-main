import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  Dimensions,
  Platform,
  Alert,
  ImageSourcePropType,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from '../utils/i18n';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const UPCOMING_GRID_PADDING = 16;
const UPCOMING_GRID_GAP = 10;
const UPCOMING_CARD_WIDTH = Math.floor((SCREEN_WIDTH - (2 * UPCOMING_GRID_PADDING) - (2 * UPCOMING_GRID_GAP)) / 3);
const UPCOMING_CARD_HEIGHT = Math.round(UPCOMING_CARD_WIDTH * 1.55);

export interface UpcomingJaapItem {
  id: string;
  title: string;
  titleHi: string;
  mantraType: string;
  image: ImageSourcePropType | { uri: string };
  allowedDays: number[];
}

export const DEFAULT_UPCOMING_JAAPS: UpcomingJaapItem[] = [
  {
    id: 'uj1',
    title: 'Sundarkaand',
    titleHi: 'सुंदरकाण्ड',
    mantraType: 'sundarkaand',
    image: { uri: 'https://brahmandfeed23.b-cdn.net/assets/hanuman_jaap_card_v2.webp' },
    allowedDays: [2, 6], // Tuesday, Saturday
  },
  {
    id: 'uj3',
    title: 'Shiv Mantra',
    titleHi: 'शिव मंत्र',
    mantraType: 'shiva',
    image: { uri: 'https://brahmandfeed23.b-cdn.net/assets/upcoming_shiva.webp' },
    allowedDays: [1], // Monday
  },
  {
    id: 'uj4',
    title: 'Ganga Mantra',
    titleHi: 'गंगा मंत्र',
    mantraType: 'ganga',
    image: { uri: 'https://brahmandfeed23.b-cdn.net/assets/upcoming_ganga.webp' },
    allowedDays: [0], // Sunday
  },
  {
    id: 'uj5',
    title: 'Radha Rani Jaap',
    titleHi: 'राधा रानी जाप',
    mantraType: 'radha_rani',
    image: { uri: 'https://brahmandfeed23.b-cdn.net/assets/upcoming_radha_rani.webp' },
    allowedDays: [5], // Friday
  },
  {
    id: 'uj6',
    title: 'Durga Saptashati',
    titleHi: 'दुर्गा सप्तशती',
    mantraType: 'durga',
    image: { uri: 'https://brahmandfeed23.b-cdn.net/assets/upcoming_durga.webp' },
    allowedDays: [2], // Tuesday
  },
];

interface UpcomingJaapsSectionProps {
  items?: UpcomingJaapItem[];
  onCardPress?: (jaap: UpcomingJaapItem) => void;
}

interface UpcomingJaapCardProps {
  jaap: UpcomingJaapItem;
  isHindi: boolean;
  onPress: (jaap: UpcomingJaapItem) => void;
}

/**
 * 🎨 Varnish Code Quality & Performance Fix:
 * 1. Extracted `UpcomingJaapCard` sub-component wrapped in `React.memo` to eliminate unnecessary card re-renders during parent state updates.
 * 2. Moved inline style allocations (`cardWidth`/`cardHeight`, `cardFillWrapper`, `cardImage`, and Pressable state styles) to `StyleSheet.create`.
 * 3. Added `fadeDuration={0}` to `<Image>` to eliminate flash during re-renders.
 * 4. Added `accessibilityRole="button"` and `accessibilityLabel` for screen readers.
 */
const UpcomingJaapCard = React.memo(({ jaap, isHindi, onPress }: UpcomingJaapCardProps) => {
  const displayName = isHindi ? jaap.titleHi : jaap.title;
  const comingSoonText = isHindi ? 'जल्द ही आ रहा है' : 'COMING SOON';

  const handleCardPress = useCallback(() => {
    onPress(jaap);
  }, [jaap, onPress]);

  return (
    <View style={styles.upcomingCard}>
      <View style={styles.cardFillWrapper}>
        <Image
          source={jaap.image}
          style={styles.cardImage}
          resizeMode="cover"
          fadeDuration={0}
        />
        <LinearGradient
          colors={['transparent', 'rgba(0, 0, 0, 0.3)', 'rgba(0, 0, 0, 0.8)']}
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.upcomingCardContent}>
          <Text style={styles.upcomingCardTitle} numberOfLines={2}>
            {displayName}
          </Text>

          <Pressable
            style={({ pressed }) => [
              styles.upcomingReminderBtn,
              pressed && styles.upcomingReminderBtnPressed,
            ]}
            android_ripple={{ color: 'rgba(255, 255, 255, 0.3)', borderless: false }}
            onPress={handleCardPress}
            accessibilityRole="button"
            accessibilityLabel={`${displayName} - ${comingSoonText}`}
          >
            <Text style={styles.comingSoonText} numberOfLines={1}>
              {comingSoonText}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
});

UpcomingJaapCard.displayName = 'UpcomingJaapCard';

export const UpcomingJaapsSection = React.memo(({
  items = DEFAULT_UPCOMING_JAAPS,
  onCardPress,
}: UpcomingJaapsSectionProps) {
  const { t } = useTranslation();
  const isHindi = t('language') === 'hi';

  const handlePress = useCallback((jaap: UpcomingJaapItem) => {
    if (onCardPress) {
      onCardPress(jaap);
      return;
    }
    const title = isHindi ? jaap.titleHi : jaap.title;
    Alert.alert(
      isHindi ? '🙏 जल्द ही आ रहा है' : '🙏 Coming Soon',
      isHindi
        ? `${title} सेवा जल्द ही आ रही है। कृपया प्रतीक्षा करें!`
        : `${title} is coming soon. Stay tuned!`
    );
  }, [onCardPress, isHindi]);

  return (
    <View style={styles.container}>
      {/* More Upcoming Jaaps Section Header */}
      <View style={styles.sectionHeaderParity}>
        <Text style={styles.sectionTitleText}>
          {isHindi ? 'और आगामी जाप' : 'More Upcoming Jaaps'}
        </Text>
      </View>

      {/* Grid Cards */}
      <View style={styles.upcomingGridContainer}>
        {items.map((jaap) => (
          <UpcomingJaapCard
            key={jaap.id}
            jaap={jaap}
            isHindi={isHindi}
            onPress={handlePress}
          />
        ))}
      </View>
    </View>
  );
});

UpcomingJaapsSection.displayName = 'UpcomingJaapsSection';

export const MoreUpcomingJaapsSection = UpcomingJaapsSection;

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  sectionHeaderParity: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 25,
    marginTop: 4,
    marginBottom: 6,
  },
  sectionTitleText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2D1400',
    letterSpacing: 0.2,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  upcomingGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: UPCOMING_GRID_GAP,
    paddingHorizontal: UPCOMING_GRID_PADDING,
    marginBottom: 20,
  },
  upcomingCard: {
    width: UPCOMING_CARD_WIDTH,
    height: UPCOMING_CARD_HEIGHT,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#1A0A00',
  },
  cardFillWrapper: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  upcomingCardContent: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    padding: 8,
    paddingBottom: 10,
  },
  upcomingCardTitle: {
    color: '#FFF',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
    fontSize: 12.5,
    fontStyle: 'normal',
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    lineHeight: 16,
  },
  upcomingReminderBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderColor: 'rgba(255, 255, 255, 0.4)',
    borderWidth: 1,
    height: 32,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 0,
    overflow: 'hidden',
  },
  upcomingReminderBtnPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.96 }],
  },
  comingSoonText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export default UpcomingJaapsSection;
