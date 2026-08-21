import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { FONTS } from '../constants/theme';
import { getFestivalImage } from '../constants/festivalImages';

const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.brahmand.app';

interface FestivalMasterCatalogCardProps {
  festival: any;
  userName?: string;
  personalizedMessage?: string;
}

const formatFestivalDate = (dateStr: string) => {
  if (!dateStr) return 'Auspicious Date';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parts[0];
    const monthIndex = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const months = [
      'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
      'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER',
    ];
    const monthName = months[monthIndex] || parts[1];
    return `${day} ${monthName} ${year}`;
  }
  return dateStr.toUpperCase();
};

export const FestivalMasterCatalogCard = ({
  festival,
}: FestivalMasterCatalogCardProps) => {
  if (!festival) return null;

  const festivalName = (festival.festival_name || festival.name || festival.title || 'Sacred Festival').toUpperCase();
  const formattedDate = formatFestivalDate(festival.date || '');
  const festivalImgAsset = getFestivalImage(festival);

  const handleOpenPlayStore = () => {
    Linking.openURL(PLAY_STORE_URL).catch((err) =>
      console.warn('Could not open Google Play Store:', err)
    );
  };




  return (
    <View style={styles.cardCanvas}>
      {/* Premium Dark Saffron & Burgundy Gradient Background */}
      <LinearGradient
        colors={['#140303', '#2B0808', '#451007', '#200505', '#100202']}
        locations={[0, 0.25, 0.55, 0.8, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.gradientBackground}
      />

      {/* Subtle Background Radial Gold Glow */}
      <View style={styles.radialGlow} />

      {/* Elegant Corner Ornaments */}
      <View style={[styles.cornerOrnament, styles.cornerTL]}>
        <View style={styles.cornerDot} />
      </View>
      <View style={[styles.cornerOrnament, styles.cornerTR]}>
        <View style={styles.cornerDot} />
      </View>
      <View style={[styles.cornerOrnament, styles.cornerBL]}>
        <View style={styles.cornerDot} />
      </View>
      <View style={[styles.cornerOrnament, styles.cornerBR]}>
        <View style={styles.cornerDot} />
      </View>

      {/* Outer Border Frame */}
      <View style={styles.goldBorderFrame}>
        <View style={styles.innerBorderFrame}>

          {/* 1. TOP BRAND HEADER */}
          <View style={styles.headerContainer}>
            <Image
              source={require('../../assets/images/icon.png')}
              style={styles.headerAppLogo}
              contentFit="contain"
            />
            <Text style={styles.brandTitle}>BRAHMAND</Text>
          </View>

          {/* 2. CENTER CONTENT (IMAGE + FESTIVAL NAME + DATE) */}
          <View style={styles.centerContainer}>
            {/* Festival Image */}
            <View style={styles.imageFrame}>
              {festivalImgAsset ? (
                <Image
                  source={festivalImgAsset}
                  style={styles.festivalImage}
                  contentFit="cover"
                  transition={200}
                />
              ) : (
                <LinearGradient
                  colors={['#78350F', '#B45309', '#451A03']}
                  style={styles.imagePlaceholder}
                >
                  <Text style={styles.placeholderIcon}>🪔</Text>
                </LinearGradient>
              )}
              {/* Bottom Subtle Overlay */}
              <LinearGradient
                colors={['transparent', 'rgba(20, 3, 3, 0.6)']}
                style={styles.imageBottomOverlay}
              />
            </View>

            {/* Festival Name */}
            <Text style={styles.festivalName} numberOfLines={2}>
              {festivalName}
            </Text>

            {/* Ornamental Gold Divider */}
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <View style={styles.dividerDot} />
              <View style={styles.dividerLine} />
            </View>

            {/* Festival Date */}
            {formattedDate ? (
              <View style={styles.dateBadge}>
                <Text style={styles.festivalDate}>
                  {formattedDate}
                </Text>
              </View>
            ) : null}
          </View>

          {/* 3. BOTTOM CTA */}
          <View style={styles.bottomCtaSection}>
            <Text style={styles.ctaSubtext}>
              For more information, download the Brahmand App
            </Text>

            <TouchableOpacity
              style={styles.ctaButtonWrapper}
              activeOpacity={0.85}
              onPress={handleOpenPlayStore}
            >
              <LinearGradient
                colors={['#FFE279', '#D4AF37', '#B38728']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.ctaButtonPill}
              >
                <Image
                  source={require('../../assets/images/icon.png')}
                  style={styles.ctaLogoIcon}
                  contentFit="contain"
                />
                <Text style={styles.ctaButtonText}>Download Brahmand</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // Fixed 9:16 aspect ratio canvas (480px width x 853px height) for WhatsApp Status & IG Stories
  cardCanvas: {
    width: 480,
    height: 853,
    backgroundColor: '#140303',
    position: 'relative',
    overflow: 'hidden',
  },
  gradientBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  radialGlow: {
    position: 'absolute',
    top: 180,
    alignSelf: 'center',
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
  },
  cornerOrnament: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: '#D4AF37',
    zIndex: 10,
  },
  cornerDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFD700',
    position: 'absolute',
    top: 2,
    left: 2,
  },
  cornerTL: { top: 12, left: 12, borderTopWidth: 2, borderLeftWidth: 2 },
  cornerTR: { top: 12, right: 12, borderTopWidth: 2, borderRightWidth: 2 },
  cornerBL: { bottom: 12, left: 12, borderBottomWidth: 2, borderLeftWidth: 2 },
  cornerBR: { bottom: 12, right: 12, borderBottomWidth: 2, borderRightWidth: 2 },

  goldBorderFrame: {
    flex: 1,
    margin: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(212, 175, 55, 0.4)',
    borderRadius: 20,
    padding: 4,
  },
  innerBorderFrame: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 20,
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },

  /* 1. Top Header */
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingTop: 8,
  },
  headerAppLogo: {
    width: 34,
    height: 34,
    borderRadius: 8,
  },
  brandTitle: {
    color: '#FFD700',
    fontFamily: FONTS.brandTitle,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 4,
    textAlign: 'center',
  },

  /* 2. Center Content */
  centerContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  imageFrame: {
    width: '100%',
    height: 400,
    borderRadius: 18,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1.5,
    borderColor: '#D4AF37',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  festivalImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderIcon: {
    fontSize: 64,
  },
  imageBottomOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 90,
  },
  festivalName: {
    color: '#FFFFFF',
    fontFamily: FONTS.brandTitle,
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: 1.5,
    textAlign: 'center',
    lineHeight: 36,
    textTransform: 'uppercase',
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
    paddingHorizontal: 8,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
    gap: 8,
    width: '60%',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(212, 175, 55, 0.4)',
  },
  dividerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFD700',
  },
  dateBadge: {
    backgroundColor: 'rgba(212, 175, 55, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.4)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 14,
  },
  festivalDate: {
    color: '#FFD700',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 1.5,
    textAlign: 'center',
  },

  /* 3. Bottom CTA */
  bottomCtaSection: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingBottom: 8,
    gap: 10,
  },
  ctaSubtext: {
    color: '#E5E7EB',
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: 0.3,
    opacity: 0.9,
  },
  ctaButtonWrapper: {
    marginTop: 2,
  },
  ctaButtonPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 24,
    gap: 8,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
  ctaLogoIcon: {
    width: 22,
    height: 22,
    borderRadius: 6,
  },
  ctaButtonText: {
    color: '#140303',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
});

export default FestivalMasterCatalogCard;
