import React, { forwardRef } from 'react';
import { View, Text, StyleSheet, Image as RNImage, Platform } from 'react-native';

interface ShamiLeafWishCardProps {
  festival: any;
}

export const ShamiLeafWishCard = forwardRef<View, ShamiLeafWishCardProps>(
  ({ festival }, ref) => {
    const rawName = festival?.festival_name || festival?.name || festival?.title || 'विजयादशमी';
    const isDussehra =
      rawName.toLowerCase().includes('dussehra') ||
      rawName.toLowerCase().includes('dasara') ||
      rawName.toLowerCase().includes('vijaya');

    const festivalTitle = isDussehra ? 'विजयादशमी' : rawName;

    return (
      <View ref={ref} collapsable={false} style={styles.cardContainer}>
        {/* Sacred Shami / Apta Leaf Image as the sole container / backdrop */}
        <RNImage
          source={require('../../assets/images/festivals/shami_leaf.png')}
          style={styles.leafImage}
          resizeMode="contain"
        />

        {/* Wishes inscribed directly onto the sacred leaf */}
        <View style={styles.inscribedContentOverlay} pointerEvents="none">
          {/* Top Brand Watermark */}
          <View style={styles.brandBadge}>
            <RNImage
              source={require('../../assets/images/brahmand_logo_official.png')}
              style={styles.brandLogo}
              resizeMode="contain"
            />
            <Text style={styles.brandTitle}>BRAHMAND</Text>
          </View>

          {/* Golden Tradition Callout Pill */}
          <View style={styles.goldenTraditionBadge}>
            <Text style={styles.goldenTraditionSparkle}>✨</Text>
            <Text style={styles.goldenTraditionText}>
              सोनं घ्या, सोन्यासारखे राहा!
            </Text>
            <Text style={styles.goldenTraditionSparkle}>✨</Text>
          </View>

          {/* Main Headline */}
          <Text style={styles.headlineText} numberOfLines={1}>
            {festivalTitle}
          </Text>

          {/* Subheading Greeting */}
          <Text style={styles.subheadingText}>
            की हार्दिक शुभकामनाएं
          </Text>

          {/* Golden Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerSparkle}>✦ 🪔 ✦</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Poetic Blessings Box */}
          <View style={styles.poeticBox}>
            <Text style={styles.poeticLine}>
              हर अन्याय पर सत्य की विजय हो,
            </Text>
            <Text style={styles.poeticLine}>
              हर अंधकार पर दिव्य प्रकाश की विजय हो।
            </Text>
            <Text style={styles.poeticGoldLine}>
              शमी पत्र संग सुख, शांति व समृद्धि मिले!
            </Text>
          </View>

          {/* Sacred Shami Sanskrit Mantra with luminous pill */}
          <View style={styles.shamiBlessingRow}>
            <Text style={styles.shamiBlessingText}>
              ॥ शमी शमयेते पापम् शमी लोहितकण्टका ॥
            </Text>
          </View>

          {/* Divine Jai Shri Ram Callout */}
          <View style={styles.sloganPill}>
            <Text style={styles.sloganText}>
              ॥ जय श्री राम ॥
            </Text>
          </View>

          {/* Devotional Footer */}
          <Text style={styles.footerNote}>
            ✦ ब्रह्मण्ड परिवार की ओर से मंगलकामनाएं ✦
          </Text>
        </View>
      </View>
    );
  }
);

ShamiLeafWishCard.displayName = 'ShamiLeafWishCard';

const CARD_WIDTH = 527;
const CARD_HEIGHT = 544;

const styles = StyleSheet.create({
  cardContainer: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  leafImage: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    position: 'absolute',
    top: 0,
    left: 0,
  },
  inscribedContentOverlay: {
    position: 'absolute',
    top: 55,
    bottom: 30,
    left: 42,
    right: 42,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 4.5,
    borderRadius: 20,
    marginBottom: 5,
    gap: 7,
    borderWidth: 1.2,
    borderColor: '#D97706',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.25,
    shadowRadius: 2.5,
    elevation: 3,
  },
  brandLogo: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  brandTitle: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 2.8,
    color: '#78350F',
    fontFamily: Platform.select({
      ios: 'Cinzel-Regular',
      android: 'serif',
      default: 'serif',
    }),
  },
  goldenTraditionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF9C3',
    paddingHorizontal: 16,
    paddingVertical: 4.5,
    borderRadius: 16,
    borderWidth: 1.4,
    borderColor: '#D97706',
    marginTop: 1,
    marginBottom: 4,
    shadowColor: '#78350F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.38,
    shadowRadius: 3.5,
    elevation: 4,
  },
  goldenTraditionSparkle: {
    fontSize: 12,
    marginHorizontal: 3,
  },
  goldenTraditionText: {
    fontSize: 14.5,
    fontWeight: '900',
    color: '#78350F',
    letterSpacing: 0.6,
    fontFamily: Platform.select({
      ios: 'System',
      android: 'serif',
      default: 'serif',
    }),
  },
  headlineText: {
    fontSize: 40,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 2,
    textAlign: 'center',
    marginTop: 0,
    fontFamily: Platform.select({
      ios: 'System',
      android: 'serif',
      default: 'serif',
    }),
    textShadowColor: 'rgba(0, 0, 0, 0.98)',
    textShadowOffset: { width: 0, height: 2.5 },
    textShadowRadius: 7,
  },
  subheadingText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FEF08A',
    letterSpacing: 1,
    textAlign: 'center',
    marginTop: 0,
    textShadowColor: 'rgba(0, 0, 0, 0.98)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 5,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
    gap: 10,
  },
  dividerLine: {
    width: 38,
    height: 1.5,
    backgroundColor: '#FEF08A',
    opacity: 0.9,
  },
  dividerSparkle: {
    fontSize: 12,
    color: '#FEF08A',
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.85)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  poeticBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  poeticLine: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 20.5,
    textAlign: 'center',
    fontFamily: Platform.select({
      ios: 'System',
      android: 'serif',
      default: 'serif',
    }),
    textShadowColor: 'rgba(0, 0, 0, 0.98)',
    textShadowOffset: { width: 0, height: 1.8 },
    textShadowRadius: 5,
  },
  poeticGoldLine: {
    fontSize: 15.5,
    fontWeight: '900',
    color: '#FEF08A',
    lineHeight: 21,
    textAlign: 'center',
    marginTop: 1,
    fontFamily: Platform.select({
      ios: 'System',
      android: 'serif',
      default: 'serif',
    }),
    textShadowColor: 'rgba(0, 0, 0, 0.98)',
    textShadowOffset: { width: 0, height: 1.8 },
    textShadowRadius: 5,
  },
  shamiBlessingRow: {
    marginTop: 6,
    paddingHorizontal: 14,
    paddingVertical: 3.5,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderWidth: 1,
    borderColor: '#D97706',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.22,
    shadowRadius: 2.5,
    elevation: 3,
  },
  shamiBlessingText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#78350F',
    letterSpacing: 0.4,
    textAlign: 'center',
  },
  sloganPill: {
    marginTop: 6,
    paddingHorizontal: 22,
    paddingVertical: 5,
    borderRadius: 18,
    backgroundColor: '#7C2D12',
    borderWidth: 1.5,
    borderColor: '#FEF08A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.38,
    shadowRadius: 3.5,
    elevation: 4,
  },
  sloganText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFBEB',
    letterSpacing: 1.5,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2.5,
  },
  footerNote: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FEF9C3',
    letterSpacing: 0.8,
    marginTop: 5,
    textShadowColor: 'rgba(0, 0, 0, 0.98)',
    textShadowOffset: { width: 0, height: 1.2 },
    textShadowRadius: 3,
  },
});
