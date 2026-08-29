import React, { forwardRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Image as RNImage } from 'react-native';
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
  if (!dateStr) return '26TH AUGUST 2025';
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
    const suffix = (d: number) => {
      if (d > 3 && d < 21) return 'TH';
      switch (d % 10) {
        case 1: return 'ST';
        case 2: return 'ND';
        case 3: return 'RD';
        default: return 'TH';
      }
    };
    return `${day}${suffix(day)} ${monthName} ${year}`;
  }
  return dateStr.toUpperCase();
};

export const FestivalMasterCatalogCard = forwardRef<View, FestivalMasterCatalogCardProps>(({
  festival,
  personalizedMessage,
}, ref) => {
  if (!festival) return null;

  const rawName = festival.festival_name || festival.name || festival.title || 'Festival';
  const festivalName = rawName.toUpperCase();
  const formattedDate = formatFestivalDate(festival.date || '');
  const festivalImgAsset = getFestivalImage(festival);

  // Extract deity name for custom blessing line
  const getDeityName = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('janmashtami') || lower.includes('krishna')) return "Lord Krishna";
    if (lower.includes('shiv') || lower.includes('mahadev')) return "Lord Shiva";
    if (lower.includes('ram') || lower.includes('navami')) return "Lord Ram";
    if (lower.includes('ganesh') || lower.includes('chaturthi')) return "Lord Ganesha";
    if (lower.includes('durga') || lower.includes('navratri')) return "Maa Durga";
    if (lower.includes('diwali') || lower.includes('lakshmi')) return "Maa Lakshmi";
    if (lower.includes('hanuman')) return "Lord Hanuman";
    return "the Almighty";
  };

  const deityName = getDeityName(rawName);

  const handleOpenPlayStore = () => {
    Linking.openURL(PLAY_STORE_URL).catch((err) =>
      console.warn('Could not open Google Play Store:', err)
    );
  };

  return (
    <View ref={ref} collapsable={false} style={styles.cardCanvas}>
      {/* ------------------------------------------------------------- */}
      {/* 1. TOP HALF (50% HEIGHT: 426px): DEITY IMAGE + HEADER + OVERLAYS */}
      {/* ------------------------------------------------------------- */}
      <View style={styles.topHalfContainer}>
        {festivalImgAsset ? (
          <RNImage
            source={festivalImgAsset}
            style={styles.topDeityImage}
            resizeMode="cover"
          />
        ) : (
          <LinearGradient
            colors={['#451A03', '#78350F', '#B45309']}
            style={styles.imagePlaceholder}
          >
            <Text style={styles.placeholderIcon}>🪔</Text>
          </LinearGradient>
        )}

        {/* Top Header Dark Gradient Overlay for Brand Title Readability */}
        <LinearGradient
          colors={['rgba(0, 0, 0, 0.75)', 'rgba(0, 0, 0, 0.3)', 'transparent']}
          locations={[0, 0.5, 1]}
          style={styles.topHeaderGradient}
        />

        {/* Bottom Dark Gradient Overlay for Festival Name & Date Readability */}
        <LinearGradient
          colors={['transparent', 'rgba(10, 3, 3, 0.65)', 'rgba(10, 3, 3, 0.95)']}
          locations={[0, 0.45, 1]}
          style={styles.bottomImageGradient}
        />

        {/* Top Brand Header */}
        <View style={styles.topBrandHeader}>
          <RNImage
            source={require('../../assets/images/icon.png')}
            style={styles.brandLogoIcon}
            resizeMode="contain"
          />
          <View style={styles.brandTextWrapper}>
            <Text style={styles.brandMainTitle}>BRAHMAND</Text>
            <Text style={styles.brandSubTitle}>India's Spiritual Network</Text>
          </View>
        </View>

        {/* Overlaid Festival Name, Date & Subtext */}
        <View style={styles.topImageOverlayContent}>
          {/* Main Festival Title in Cinzel Font */}
          <Text style={styles.festivalTitleText} numberOfLines={2}>
            {festivalName}
          </Text>

          {/* Flourish Date Badge Line */}
          <View style={styles.dateFlourishRow}>
            <Text style={styles.flourishSymbol}>☙</Text>
            <View style={styles.dateBorderBadge}>
              <Text style={styles.dateText}>{formattedDate}</Text>
            </View>
            <Text style={styles.flourishSymbol}>❧</Text>
          </View>

          {/* Sub-caption */}
          <Text style={styles.subcaptionText}>
            ☨ A celebration of faith, devotion & tradition ☨
          </Text>
        </View>
      </View>

      {/* ------------------------------------------------------------- */}
      {/* 2. BOTTOM HALF (50% HEIGHT: 427px): LIGHT PARCHMENT & WISDOM */}
      {/* ------------------------------------------------------------- */}
      <View style={styles.bottomHalfContainer}>
        {/* Background Dark Royal Gradient */}
        <LinearGradient
          colors={['#0F0818', '#160B24', '#0A0412']}
          style={StyleSheet.absoluteFillObject}
        />

        {/* Inner Content Padding Wrapper */}
        <View style={styles.bottomContentInner}>

          {/* A. PARCHMENT CARD 1: DUAL-COLUMN BLESSINGS & GREETING */}
          <View style={styles.parchmentCard}>
            {/* Top Row: Dual Columns */}
            <View style={styles.parchmentDualRow}>
              {/* Left Column: Line art icon + Blessing */}
              <View style={styles.parchmentLeftCol}>
                <Text style={styles.parchmentSymbolIcon}>🪷</Text>
                <Text style={styles.parchmentLeftText}>
                  May the divine light of this auspicious festival fill your home with happiness, your heart with peace, and your life with countless blessings.
                </Text>
              </View>

              {/* Vertical Gold Separator */}
              <View style={styles.verticalGoldDivider} />

              {/* Right Column: Greeting Header */}
              <View style={styles.parchmentRightCol}>
                <Text style={styles.parchmentGreetingLead}>
                  Wishing you and your family a very <Text style={styles.boldText}>Happy & Blessed</Text>
                </Text>
                <Text style={styles.parchmentFestivalName}>
                  {rawName}.
                </Text>
                <Text style={styles.peacockFeatherIcon}>🪶</Text>
              </View>
            </View>

            {/* Bottom Row: Full Width Deity Blessing Quote */}
            <View style={styles.parchmentBottomRow}>
              <Text style={styles.parchmentBottomQuote}>
                May {deityName}'s blessings bring love, joy, harmony, good health and prosperity to you and your loved ones.
              </Text>
            </View>
          </View>

          {/* B. MID QUOTE BANNER */}
          <View style={styles.midQuoteBanner}>
            <Text style={styles.midQuoteText}>
              “ Some festivals are celebrated for a day. Their blessings stay with us for a lifetime. ”
            </Text>
          </View>

          {/* C. PARCHMENT CARD 2: FEATURE HIGHLIGHTS */}
          <View style={styles.parchmentCardSmall}>
            <View style={styles.featureDualRow}>
              <View style={styles.featureLeftCol}>
                <Text style={styles.featureItemText}>📖  Every festival has a story.</Text>
                <Text style={styles.featureItemText}>🪷  Every tradition has a meaning.</Text>
                <Text style={styles.featureItemText}>🛕  Every sacred place has a journey.</Text>
              </View>

              <View style={styles.verticalGoldDividerSmall} />

              <View style={styles.featureRightCol}>
                <Text style={styles.featureRightDescription}>
                  Discover the stories, temples, traditions and spiritual experiences behind India's festivals on <Text style={styles.boldBrahmandBrand}>Brahmand</Text>.
                </Text>
              </View>
            </View>
          </View>

          {/* D. FOOTER CTA BANNER */}
          <View style={styles.footerCtaCard}>
            <LinearGradient
              colors={['#0F203C', '#0A1528']}
              style={styles.footerGradientBackground}
            />

            <Text style={styles.footerHeaderTitle}>
              ✨ Discover {rawName} on <Text style={styles.goldBrahmandBrand}>Brahmand</Text>
            </Text>
            <Text style={styles.footerSubText}>
              Explore  •  Learn  •  Experience
            </Text>

            {/* Gold Pill Download Button */}
            <TouchableOpacity
              style={styles.downloadButtonWrapper}
              activeOpacity={0.85}
              onPress={handleOpenPlayStore}
            >
              <LinearGradient
                colors={['#FFE279', '#D4AF37', '#B38728']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.downloadButtonPill}
              >
                <Text style={styles.downloadArrow}>↓</Text>
                <Text style={styles.downloadButtonText}>DOWNLOAD BRAHMAND</Text>
              </LinearGradient>
            </TouchableOpacity>

            <Text style={styles.footerTaglineText}>
              Your journey into India's spiritual heritage starts here.
            </Text>
          </View>

          {/* E. VERY BOTTOM BRAND STRIP */}
          <View style={styles.veryBottomBar}>
            <Text style={styles.bottomBarLeft}>
              <Text style={styles.cinzelBrandName}>Brahmand</Text> — India's Spiritual Network
            </Text>
            <Text style={styles.bottomBarRight}>DOWNLOAD • EXPLORE • CONNECT • EXPERIENCE</Text>
          </View>

        </View>
      </View>
    </View>
  );
});

FestivalMasterCatalogCard.displayName = 'FestivalMasterCatalogCard';

const styles = StyleSheet.create({
  // Fixed 9:16 canvas for WhatsApp Status & IG Stories (480px width x 853px height)
  cardCanvas: {
    width: 480,
    height: 853,
    backgroundColor: '#0F0818',
    position: 'relative',
    overflow: 'hidden',
  },

  /* ------------------------------------------------------------- */
  /* 1. TOP HALF (50% HEIGHT: 426px) */
  /* ------------------------------------------------------------- */
  topHalfContainer: {
    width: '100%',
    height: 426,
    position: 'relative',
    overflow: 'hidden',
  },
  topDeityImage: {
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
  topHeaderGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    zIndex: 2,
  },
  bottomImageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
    zIndex: 2,
  },
  topBrandHeader: {
    position: 'absolute',
    top: 18,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    zIndex: 5,
  },
  brandLogoIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
  },
  brandTextWrapper: {
    alignItems: 'center',
  },
  brandMainTitle: {
    color: '#FFD700',
    fontFamily: FONTS.brandTitle, // Cinzel font family
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  brandSubTitle: {
    color: '#F3F4F6',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.5,
    marginTop: -1,
    opacity: 0.9,
  },

  topImageOverlayContent: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  festivalTitleText: {
    color: '#FFD700',
    fontFamily: FONTS.brandTitle, // Cinzel font family
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: 3,
    textAlign: 'center',
    lineHeight: 42,
    textTransform: 'uppercase',
    textShadowColor: 'rgba(0, 0, 0, 0.95)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 10,
  },
  dateFlourishRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 8,
  },
  flourishSymbol: {
    color: '#D4AF37',
    fontSize: 18,
  },
  dateBorderBadge: {
    borderWidth: 1,
    borderColor: '#D4AF37',
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 14,
    backgroundColor: 'rgba(20, 5, 5, 0.65)',
  },
  dateText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 2,
    textAlign: 'center',
  },
  subcaptionText: {
    color: '#E5E7EB',
    fontSize: 12,
    fontStyle: 'italic',
    fontWeight: '500',
    letterSpacing: 0.8,
    textAlign: 'center',
  },

  /* ------------------------------------------------------------- */
  /* 2. BOTTOM HALF (50% HEIGHT: 427px) */
  /* ------------------------------------------------------------- */
  bottomHalfContainer: {
    width: '100%',
    height: 427,
    position: 'relative',
  },
  bottomContentInner: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    justifyContent: 'space-between',
  },

  /* A. PARCHMENT CARD 1: DUAL-COLUMN BLESSINGS */
  parchmentCard: {
    backgroundColor: '#FAF6EE',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#D4AF37',
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  parchmentDualRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  parchmentLeftCol: {
    flex: 1,
    paddingRight: 10,
    alignItems: 'flex-start',
  },
  parchmentSymbolIcon: {
    fontSize: 18,
    marginBottom: 2,
  },
  parchmentLeftText: {
    color: '#2D1B0E',
    fontSize: 10.5,
    lineHeight: 14.5,
    fontStyle: 'italic',
    fontWeight: '500',
  },
  verticalGoldDivider: {
    width: 1,
    height: '85%',
    backgroundColor: '#D4AF37',
    opacity: 0.6,
  },
  parchmentRightCol: {
    flex: 1,
    paddingLeft: 10,
    justifyContent: 'center',
    position: 'relative',
  },
  parchmentGreetingLead: {
    color: '#2D1B0E',
    fontSize: 12,
    lineHeight: 16,
  },
  boldText: {
    fontWeight: '800',
    color: '#1A0C03',
  },
  boldBrahmandBrand: {
    fontFamily: FONTS.brandTitle, // Cinzel font family
    fontWeight: '900',
    color: '#1A0C03',
  },
  goldBrahmandBrand: {
    fontFamily: FONTS.brandTitle, // Cinzel font family
    fontWeight: '900',
    color: '#FFD700',
  },
  cinzelBrandName: {
    fontFamily: FONTS.brandTitle, // Cinzel font family
    fontWeight: '900',
    color: '#FFD700',
  },
  parchmentFestivalName: {
    color: '#78350F',
    fontFamily: FONTS.brandTitle, // Cinzel font family
    fontSize: 18,
    fontWeight: '900',
    marginTop: 2,
  },
  peacockFeatherIcon: {
    position: 'absolute',
    right: 0,
    bottom: -4,
    fontSize: 16,
    opacity: 0.7,
  },
  parchmentBottomRow: {
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(212, 175, 55, 0.3)',
    alignItems: 'center',
  },
  parchmentBottomQuote: {
    color: '#3B1F0E',
    fontSize: 10.5,
    lineHeight: 14.5,
    textAlign: 'center',
    fontWeight: '500',
  },

  /* B. MID QUOTE BANNER */
  midQuoteBanner: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  midQuoteText: {
    color: '#FFD700',
    fontSize: 11.5,
    fontStyle: 'italic',
    fontWeight: '600',
    letterSpacing: 0.4,
    textAlign: 'center',
  },

  /* C. PARCHMENT CARD 2: FEATURE HIGHLIGHTS */
  parchmentCardSmall: {
    backgroundColor: '#FAF6EE',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#D4AF37',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  featureDualRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureLeftCol: {
    flex: 1.1,
    paddingRight: 8,
    gap: 3,
  },
  featureItemText: {
    color: '#2D1B0E',
    fontSize: 10,
    fontWeight: '600',
  },
  verticalGoldDividerSmall: {
    width: 1,
    height: '80%',
    backgroundColor: '#D4AF37',
    opacity: 0.6,
  },
  featureRightCol: {
    flex: 0.9,
    paddingLeft: 8,
    justifyContent: 'center',
  },
  featureRightDescription: {
    color: '#2D1B0E',
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '500',
  },

  /* D. FOOTER CTA CARD */
  footerCtaCard: {
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#D4AF37',
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  footerGradientBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  footerHeaderTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  footerSubText: {
    color: '#D1D5DB',
    fontSize: 10.5,
    fontWeight: '600',
    letterSpacing: 1,
    marginTop: 2,
    marginBottom: 6,
  },
  downloadButtonWrapper: {
    marginVertical: 2,
  },
  downloadButtonPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    paddingHorizontal: 22,
    borderRadius: 20,
    gap: 6,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  downloadArrow: {
    color: '#140303',
    fontSize: 14,
    fontWeight: '900',
  },
  downloadButtonText: {
    color: '#140303',
    fontFamily: FONTS.brandTitle, // Cinzel font family
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  footerTaglineText: {
    color: '#9CA3AF',
    fontSize: 9.5,
    fontStyle: 'italic',
    marginTop: 4,
  },

  /* E. VERY BOTTOM BRAND STRIP */
  veryBottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingTop: 2,
  },
  bottomBarLeft: {
    color: '#D4AF37',
    fontSize: 8.5,
    fontWeight: '700',
  },
  bottomBarRight: {
    color: '#9CA3AF',
    fontSize: 7.5,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});

export default FestivalMasterCatalogCard;
