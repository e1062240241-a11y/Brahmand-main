import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, FONTS } from '../constants/theme';
import festivalEnrichments from '../data/festival-enrichments';
import { getFestivalImage } from '../constants/festivalImages';

interface FestivalMasterCatalogCardProps {
  festival: any;
}

const formatFestivalDate = (dateStr: string) => {
  if (!dateStr) return 'Auspicious Date';
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

export const FestivalMasterCatalogCard = ({ festival }: FestivalMasterCatalogCardProps) => {
  if (!festival) return null;

  const festivalName = festival.festival_name || festival.name || festival.title || 'Sacred Festival';
  const enrichmentKey = (festivalName || '').toLowerCase();
  const enrichment = festivalEnrichments[enrichmentKey];

  const deity = festival.deity || festival.deity_name || (festivalName.toLowerCase().includes('shiva') || festivalName.toLowerCase().includes('teej') ? 'Goddess Parvati & Lord Shiva' : 'Vedic Deities');
  const formattedDate = formatFestivalDate(festival.date || '2026-08-15');
  const festivalImgAsset = getFestivalImage(festival);

  // Deep sections
  const story = enrichment?.origin || festival.story || festival.origin || festival.summary || '';
  const about = enrichment?.summary || festival.summary || '';
  const purpose = enrichment?.purpose || festival.purpose || '';
  const importance = enrichment?.importance || festival.importance || '';
  const celebration = enrichment?.celebration || festival.celebration || '';
  const pujaVidhi = festival.puja_vidhi || (festival.rituals ? (Array.isArray(festival.rituals) ? festival.rituals.join('. ') : festival.rituals) : '');
  const mantra = enrichment?.mantra || festival.mantra || '';

  return (
    <View style={styles.catalogCanvas}>
      {/* 1. TOP HERO BANNER */}
      <LinearGradient
        colors={['#7F1D1D', '#991B1B', '#1E4620']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroBanner}
      >
        {festivalImgAsset && (
          <Image
            source={festivalImgAsset}
            style={styles.heroBackgroundArt}
            contentFit="cover"
          />
        )}
        <View style={styles.heroOverlay} />

        {/* Top Badges */}
        <View style={styles.badgeRow}>
          <View style={styles.sacredBadge}>
            <Text style={styles.sacredBadgeText}>🪔 SANATAN FESTIVAL CATALOG</Text>
          </View>
          <View style={styles.dateBadge}>
            <Ionicons name="calendar" size={13} color="#FFD700" />
            <Text style={styles.dateBadgeText}>{formattedDate}</Text>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.festivalTitle}>{festivalName}</Text>

        {/* Deity */}
        <View style={styles.deityPill}>
          <Ionicons name="sparkles" size={14} color="#FFD700" />
          <Text style={styles.deityText}>{deity}</Text>
        </View>
      </LinearGradient>

      {/* 2. SACRED STORY SECTION */}
      {story ? (
        <View style={styles.sectionCard}>
          <View style={[styles.sectionAccent, { backgroundColor: '#F59E0B' }]} />
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionEmoji}>📖</Text>
            <View>
              <Text style={styles.sectionHeading}>Sacred Story & Origin</Text>
              <Text style={styles.sectionSub}>पौराणिक कथा एवं प्राकट्य</Text>
            </View>
          </View>
          <Text style={styles.sectionBodyText}>{story}</Text>
        </View>
      ) : null}

      {/* 3. ABOUT & SIGNIFICANCE */}
      {(about || importance || purpose) ? (
        <View style={styles.sectionCard}>
          <View style={[styles.sectionAccent, { backgroundColor: '#16A34A' }]} />
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionEmoji}>🌸</Text>
            <View>
              <Text style={styles.sectionHeading}>Spiritual Significance</Text>
              <Text style={styles.sectionSub}>महत्व एवं धार्मिक उद्देश्य</Text>
            </View>
          </View>
          <Text style={styles.sectionBodyText}>{about || importance || purpose}</Text>
        </View>
      ) : null}

      {/* 4. PUJA VIDHI & RITUALS */}
      {pujaVidhi ? (
        <View style={styles.sectionCard}>
          <View style={[styles.sectionAccent, { backgroundColor: '#EA580C' }]} />
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionEmoji}>🔱</Text>
            <View>
              <Text style={styles.sectionHeading}>Puja Vidhi & Rituals</Text>
              <Text style={styles.sectionSub}>पूजा विधि एवं अनुष्ठान विधान</Text>
            </View>
          </View>
          <Text style={styles.sectionBodyText}>{pujaVidhi}</Text>
        </View>
      ) : null}

      {/* 5. SACRED MANTRAS */}
      {mantra ? (
        <View style={styles.sectionCard}>
          <View style={[styles.sectionAccent, { backgroundColor: '#7E22CE' }]} />
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionEmoji}>🕉</Text>
            <View>
              <Text style={styles.sectionHeading}>Sacred Mantras & Chants</Text>
              <Text style={styles.sectionSub}>पावन मंत्र एवं स्तुति</Text>
            </View>
          </View>
          <View style={styles.mantraBox}>
            <Text style={styles.mantraText}>{mantra}</Text>
          </View>
        </View>
      ) : null}

      {/* 6. CELEBRATION & TRADITIONS */}
      {celebration ? (
        <View style={styles.sectionCard}>
          <View style={[styles.sectionAccent, { backgroundColor: '#059669' }]} />
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionEmoji}>🪔</Text>
            <View>
              <Text style={styles.sectionHeading}>Celebration & Traditions</Text>
              <Text style={styles.sectionSub}>उत्सव परंपरा एवं रीति-रिवाज</Text>
            </View>
          </View>
          <Text style={styles.sectionBodyText}>{celebration}</Text>
        </View>
      ) : null}

      {/* 7. BRAHMAND APP WATERMARK FOOTER */}
      <View style={styles.catalogFooter}>
        <View style={styles.footerBorderLine} />
        <View style={styles.footerBrandRow}>
          <View style={styles.footerLogoBadge}>
            <Text style={styles.footerOm}>🕉</Text>
          </View>
          <View style={styles.footerTextCol}>
            <Text style={styles.footerAppName}>Brahmand App</Text>
            <Text style={styles.footerSubtitle}>Your Gateway to Sanatan Heritage, Mandirs & Festivals</Text>
          </View>
        </View>
        <Text style={styles.footerTagline}>🌿 ब्रह्माण्ड • Discover Divine Sanatan Traditions 🌿</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  catalogCanvas: {
    width: 440,
    backgroundColor: '#FDFBF7',
    padding: 16,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#D4AF37',
  },
  heroBanner: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#D4AF37',
    position: 'relative',
    overflow: 'hidden',
  },
  heroBackgroundArt: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.3,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(60, 0, 0, 0.45)',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sacredBadge: {
    backgroundColor: 'rgba(255, 215, 0, 0.25)',
    borderColor: '#FFD700',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  sacredBadgeText: {
    color: '#FFE4B5',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderColor: '#FFD700',
    borderWidth: 0.8,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  dateBadgeText: {
    color: '#FFD700',
    fontSize: 11,
    fontWeight: '700',
  },
  festivalTitle: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  deityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  deityText: {
    color: '#FFF8E7',
    fontSize: 12,
    fontWeight: '700',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
    position: 'relative',
    overflow: 'hidden',
  },
  sectionAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 5,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
    paddingLeft: 6,
  },
  sectionEmoji: {
    fontSize: 22,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: '#451A03',
  },
  sectionSub: {
    fontSize: 11,
    color: '#92400E',
    fontWeight: '600',
  },
  sectionBodyText: {
    fontSize: 13,
    lineHeight: 20,
    color: '#292524',
    paddingLeft: 6,
    fontWeight: '400',
  },
  mantraBox: {
    backgroundColor: '#FAF5FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E9D5FF',
    padding: 12,
    marginTop: 4,
    marginLeft: 6,
  },
  mantraText: {
    fontSize: 13.5,
    lineHeight: 21,
    color: '#581C87',
    fontStyle: 'italic',
    fontWeight: '600',
  },
  catalogFooter: {
    backgroundColor: '#FFFDF9',
    borderRadius: 16,
    padding: 16,
    marginTop: 4,
    borderWidth: 1.2,
    borderColor: '#D4AF37',
  },
  footerBorderLine: {
    height: 1,
    backgroundColor: 'rgba(212, 175, 55, 0.4)',
    marginBottom: 12,
  },
  footerBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  footerLogoBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FEF3C7',
    borderWidth: 1.5,
    borderColor: '#D4AF37',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerOm: {
    fontSize: 22,
    color: '#B45309',
  },
  footerTextCol: {
    flex: 1,
  },
  footerAppName: {
    fontSize: 17,
    fontWeight: '900',
    color: '#78350F',
    letterSpacing: -0.4,
  },
  footerSubtitle: {
    fontSize: 11,
    color: '#92400E',
    fontWeight: '600',
    marginTop: 1,
  },
  footerTagline: {
    fontSize: 11.5,
    color: '#B45309',
    textAlign: 'center',
    fontWeight: '700',
    marginTop: 4,
  },
});

export default FestivalMasterCatalogCard;
