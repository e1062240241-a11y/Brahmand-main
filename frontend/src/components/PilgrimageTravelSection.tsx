import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
  Platform,
  ImageSourcePropType,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  getExploreNearbyData,
  SacredPlaceItem,
  NearbyTempleItem,
  CircuitJourneyItem,
} from '../data/jyotirlingaTravelData';
import { DEFAULT_TEMPLE_IMAGE, getTempleImageByName, getTempleImageById } from '../constants/templeImages';

// Color Palette Definition
const THEME = {
  bg: '#F8F5EE', // Soft Ivory
  cardBg: '#FFFFFF', // Clean Pure White Card Background
  border: '#E6DFD3', // Thin Sandstone Border
  textPrimary: '#2C2A29', // Calm Charcoal
  textMuted: '#78736E', // Muted Sandstone Text
  accentIndigo: '#3C485E', // Primary Minimal Accent
  accentSaffron: '#D97724', // Subtle Soft Saffron Accent
  badgeBg: '#EFE8DC',
  white: '#FFFFFF',
};

// Helper function to safely resolve image sources (URLs vs require(...) local assets)
const resolveImageSource = (img: any): ImageSourcePropType => {
  if (!img) return DEFAULT_TEMPLE_IMAGE;
  if (typeof img === 'string') {
    if (img.startsWith('http://') || img.startsWith('https://')) {
      return { uri: img };
    }
    return getTempleImageByName(img);
  }
  return img;
};

// Image component with automatic fallback handling
const ImageWithFallback = ({
  source,
  style,
  fallbackName,
}: {
  source: any;
  style: any;
  fallbackName?: string;
}) => {
  const [hasError, setHasError] = useState(false);
  const resolved = hasError ? getTempleImageByName(fallbackName || '') : resolveImageSource(source);

  return (
    <Image
      source={resolved}
      style={style}
      resizeMode="cover"
      onError={() => setHasError(true)}
    />
  );
};

interface PilgrimageTravelSectionProps {
  templeId: string;
  templeName?: string;
  location?: any;
  category?: string;
  coords?: { latitude: number; longitude: number };
}

/** Distance filter options for user control */
const DISTANCE_FILTERS = [
  { label: 'All', value: 0 },
  { label: '< 10 km', value: 10 },
  { label: '< 50 km', value: 50 },
  { label: '< 200 km', value: 200 },
];

/**
 * Main UI component for rendering Nearby Sacred Places, Nearby Temples, and Circuit Journeys.
 * Incorporates interactive distance filter chips, fallback placeholder icons, memoized data calculation,
 * and graceful empty states.
 */
export const PilgrimageTravelSection: React.FC<PilgrimageTravelSectionProps> = ({
  templeId,
  templeName = '',
  category = '',
  coords,
}) => {
  const router = useRouter();
  const [selectedMaxDist, setSelectedMaxDist] = useState<number>(0);

  // Memoized data resolution with distance filter support
  const data = React.useMemo(() => {
    return getExploreNearbyData(
      templeId,
      templeName,
      category,
      coords,
      selectedMaxDist > 0 ? { maxDistanceKm: selectedMaxDist } : undefined
    );
  }, [templeId, templeName, category, coords?.latitude, coords?.longitude, selectedMaxDist]);

  const sacredPlaces = data?.nearbySacredPlaces ?? [];
  const nearbyTemples = data?.nearbyTemples ?? [];
  const circuitJourney = data?.circuitJourney ?? [];

  const hasNoNearbyData = sacredPlaces.length === 0 && nearbyTemples.length === 0;

  return (
    <View style={styles.container}>
      {/* INTERACTIVE DISTANCE FILTER CHIPS */}
      {!hasNoNearbyData && (
        <View style={styles.filterChipContainer}>
          <Text style={styles.filterChipLabel}>Proximity:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {DISTANCE_FILTERS.map((f) => {
              const active = selectedMaxDist === f.value;
              return (
                <TouchableOpacity
                  key={f.label}
                  style={[styles.filterChip, active && styles.filterChipActive]}
                  onPress={() => setSelectedMaxDist(f.value)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                    {f.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* EMPTY DATA STATE */}
      {hasNoNearbyData && (
        <View style={styles.emptyStateContainer}>
          <Ionicons name="compass-outline" size={24} color={THEME.textMuted} />
          <Text style={styles.emptyStateText}>
            No additional nearby shrines found within selected range. Explore the pilgrimage circuit below.
          </Text>
        </View>
      )}

      {/* SECTION 1 — NEARBY SACRED PLACES */}
      {sacredPlaces.length > 0 && (
        <SacredPlacesDropdown sacredPlaces={sacredPlaces} router={router} />
      )}

      {/* SECTION 2 — NEARBY TEMPLES */}
      {nearbyTemples.length > 0 && (
        <>
          <View style={[styles.sectionHeader, { marginTop: 28 }]}>
            <Text style={styles.sectionTitle}>Nearby Temples</Text>
          </View>
          <View style={styles.verticalListPadding}>
            {nearbyTemples.map((temple) => (
              <NearbyTempleCard key={temple.templeId} temple={temple} router={router} />
            ))}
          </View>
        </>
      )}

      {/* SECTION 3 — CONTINUE YOUR JOURNEY */}
      {circuitJourney.length > 0 && (
        <>
          <View style={[styles.sectionHeader, { marginTop: 28 }]}>
            <Text style={styles.sectionTitle}>{data.journeyTitle}</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={180}
            decelerationRate="fast"
            contentContainerStyle={styles.horizontalScrollPadding}
          >
            {circuitJourney.map((item) => (
              <CircuitJourneyCard
                key={item.templeId}
                item={item}
                isCurrent={item.templeId === templeId}
                router={router}
              />
            ))}
          </ScrollView>
        </>
      )}
    </View>
  );
};



/* -------------------------------------------------------------------------- */
/* SUB-COMPONENTS                                                             */
/* -------------------------------------------------------------------------- */

const SacredPlacesDropdown: React.FC<{ sacredPlaces: SacredPlaceItem[]; router: any }> = ({ sacredPlaces, router }) => {
  return (
    <View style={styles.directSectionContainer}>
      <View style={styles.sectionHeaderRowInline}>
        <Text style={styles.sectionHeaderTitleBold}>Nearby Sacred Places</Text>
      </View>

      <View style={styles.directVerticalList}>
        {sacredPlaces.map((place) => (
          <SacredPlaceCard key={place.id} place={place} router={router} />
        ))}
      </View>
    </View>
  );
};

/* Section 1 Card: Vertical Row Sacred Place Card (Matches Nearby Temples design) */
const SacredPlaceCard: React.FC<{ place: SacredPlaceItem; router: any }> = ({ place, router }) => {
  const handlePress = () => {
    if (place.linkedTempleId) {
      router.push(`/temple/${place.linkedTempleId}`);
      return;
    }

    // Determine base query
    let searchQuery = place.locationQuery || place.name;

    // If query is identical to plain name, add category context for better search accuracy
    if (searchQuery === place.name && place.category) {
      searchQuery = `${place.name} ${place.category}`;
    }

    // Clean search query (strip quotes & trim)
    const cleanedQuery = searchQuery.replace(/^['"]+|['"]+$/g, '').trim();

    // Universal Google Maps search URL
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cleanedQuery)}`;
    
    // Native Maps app intent scheme for Android / iOS fallback
    const nativeMapsUrl = Platform.OS === 'android'
      ? `geo:0,0?q=${encodeURIComponent(cleanedQuery)}`
      : `maps:0,0?q=${encodeURIComponent(cleanedQuery)}`;

    Linking.openURL(googleMapsUrl).catch(() => {
      Linking.openURL(nativeMapsUrl).catch((error) => {
        console.warn('[SACRED PLACE MAP ERROR]', error);
        const fallbackUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}`;
        Linking.openURL(fallbackUrl).catch((err) => console.error('[SACRED PLACE FALLBACK ERROR]', err));
      });
    });
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'Ghat':
        return 'water-outline';
      case 'Cave':
        return 'compass-outline';
      case 'Fort':
        return 'shield-outline';
      case 'Lake':
        return 'water-outline';
      case 'Temple':
        return 'location-outline';
      default:
        return 'sparkles-outline';
    }
  };

  return (
    <TouchableOpacity
      style={styles.sacredRowCard}
      onPress={handlePress}
      activeOpacity={0.88}
    >
      <View style={styles.sacredIconCircle}>
        <Ionicons name={getCategoryIcon(place.category) as any} size={20} color={THEME.accentIndigo} />
      </View>
      <View style={styles.nearbyTempleTextContainer}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={styles.nearbyTempleName} numberOfLines={1}>
            {place.name}
          </Text>
        </View>
        <Text style={styles.nearbyTempleDistance} numberOfLines={1}>
          📍 {place.distance} • {place.category}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={THEME.textMuted} />
    </TouchableOpacity>
  );
};

/* Section 2 Card: Nearby Temples */
const NearbyTempleCard: React.FC<{ temple: NearbyTempleItem; router: any }> = ({ temple, router }) => {
  const handlePress = () => {
    router.push(`/temple/${temple.templeId}`);
  };

  const resolvedImage = (() => {
    if (temple.image && temple.image !== DEFAULT_TEMPLE_IMAGE) {
      return resolveImageSource(temple.image);
    }
    if (temple.templeId) {
      const byId = getTempleImageById(temple.templeId);
      if (byId && byId !== DEFAULT_TEMPLE_IMAGE) return byId;
    }
    if (temple.name) {
      const byName = getTempleImageByName(temple.name);
      if (byName && byName !== DEFAULT_TEMPLE_IMAGE) return byName;
    }
    return null;
  })();

  const hasValidPhoto = Boolean(resolvedImage && resolvedImage !== DEFAULT_TEMPLE_IMAGE);

  return (
    <TouchableOpacity
      style={styles.nearbyTempleCard}
      onPress={handlePress}
      activeOpacity={0.88}
    >
      {hasValidPhoto ? (
        <Image
          source={resolvedImage!}
          style={styles.nearbyTempleImage}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.sacredIconCircle}>
          <Ionicons name="location-outline" size={20} color={THEME.accentIndigo} />
        </View>
      )}
      <View style={styles.nearbyTempleTextContainer}>
        <Text style={styles.nearbyTempleName} numberOfLines={1}>
          {temple.name}
        </Text>
        <Text style={styles.nearbyTempleDistance}>{temple.distance}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={THEME.textMuted} />
    </TouchableOpacity>
  );
};

/* Section 3 Card: Circuit Journey Carousel (Jyotirlinga / Shakti Peetha) */
const CircuitJourneyCard: React.FC<{
  item: CircuitJourneyItem;
  isCurrent: boolean;
  router: any;
}> = ({ item, isCurrent, router }) => {
  const handlePress = () => {
    if (!isCurrent) {
      router.push(`/temple/${item.templeId}`);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.circuitCard, isCurrent && styles.circuitCurrentCard]}
      onPress={handlePress}
      activeOpacity={0.88}
    >
      <ImageWithFallback source={item.image} style={styles.circuitImage} fallbackName={item.name} />
      <View style={styles.circuitCardContent}>
        <Text style={styles.circuitName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.circuitState}>{item.state}</Text>
      </View>
    </TouchableOpacity>
  );
};

/* -------------------------------------------------------------------------- */
/* STYLES (Soft Ivory #F8F5EE & Warm Cream #F4EFE4 Minimalist Aesthetics)      */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  container: {
    paddingTop: 16,
    paddingBottom: 28,
    marginTop: 16,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.textPrimary,
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: THEME.textMuted,
    marginTop: 2,
  },
  directSectionContainer: {
    marginVertical: 12,
  },
  sectionHeaderRowInline: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  sectionHeaderTitleBold: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  directVerticalList: {
    paddingHorizontal: 20,
    gap: 10,
  },
  dropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dropdownChevronCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: THEME.badgeBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownVerticalPadding: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    paddingTop: 4,
    gap: 10,
  },
  sacredRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  sacredImageThumbnail: {
    width: 52,
    height: 52,
    borderRadius: 14,
    marginRight: 12,
  },
  sacredIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: THEME.badgeBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  horizontalScrollPadding: {
    paddingLeft: 20,
    paddingRight: 8,
  },
  verticalListPadding: {
    paddingHorizontal: 20,
    gap: 10,
  },

  /* Section 1: Enhanced Informative Sacred Place Card */
  sacredCardEnhanced: {
    width: 230,
    minHeight: 125,
    backgroundColor: THEME.cardBg,
    borderRadius: 22,
    marginRight: 12,
    padding: 14,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: THEME.border,
  },
  sacredCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: THEME.badgeBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  sacredCategoryText: {
    fontSize: 11,
    fontWeight: '600',
    color: THEME.accentIndigo,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: THEME.badgeBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  sacredDistanceBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.textPrimary,
  },
  sacredCardBody: {
    marginVertical: 4,
  },
  sacredNameEnhanced: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.textPrimary,
    marginBottom: 4,
  },
  sacredSignificance: {
    fontSize: 12,
    color: THEME.textMuted,
    lineHeight: 16,
  },
  sacredCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(230, 223, 211, 0.6)',
    marginTop: 6,
  },
  sacredFooterActionText: {
    fontSize: 11,
    fontWeight: '600',
    color: THEME.accentIndigo,
  },

  /* Section 2: Nearby Temple Vertical Card */
  nearbyTempleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.cardBg,
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  nearbyTempleImage: {
    width: 52,
    height: 52,
    borderRadius: 14,
    marginRight: 12,
  },
  nearbyTempleTextContainer: {
    flex: 1,
  },
  nearbyTempleName: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.textPrimary,
  },
  nearbyTempleDistance: {
    fontSize: 12,
    color: THEME.textMuted,
    marginTop: 2,
  },

  /* Section 3: Circuit Journey Card */
  circuitCard: {
    width: 150,
    backgroundColor: THEME.cardBg,
    borderRadius: 20,
    marginRight: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: THEME.border,
  },
  circuitCurrentCard: {
    borderColor: THEME.accentIndigo,
    borderWidth: 2,
  },
  circuitImage: {
    width: '100%',
    height: 95,
  },
  circuitCardContent: {
    padding: 10,
  },
  circuitName: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.textPrimary,
  },
  circuitState: {
    fontSize: 11,
    color: THEME.textMuted,
    marginTop: 2,
  },
  emptyStateContainer: {
    marginHorizontal: 20,
    marginVertical: 12,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyStateText: {
    fontSize: 13,
    color: THEME.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  filterChipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 14,
    gap: 10,
  },
  filterChipLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.textMuted,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#EFE8DC',
    borderWidth: 1,
    borderColor: THEME.border,
  },
  filterChipActive: {
    backgroundColor: THEME.accentIndigo,
    borderColor: THEME.accentIndigo,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.textPrimary,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
});


