import React, { forwardRef } from 'react';
import { View, Text, StyleSheet, Image as RNImage, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SharadMoonWishCardProps {
  festival?: any;
  senderName?: string;
}

const CARD_WIDTH = 580;
const CARD_HEIGHT = 580;

export const SharadMoonWishCard = forwardRef<View, SharadMoonWishCardProps>(
  ({ festival, senderName }, ref) => {
    const rawName = festival?.festival_name || festival?.name || festival?.title || 'शरद पूर्णिमा';
    const isSharadPurnima =
      rawName.toLowerCase().includes('sharad') ||
      rawName.toLowerCase().includes('kojagiri') ||
      rawName.includes('शरद');

    const festivalTitle = isSharadPurnima ? 'शरद पूर्णिमा' : rawName;
    const cleanSender = (senderName || '').trim();

    return (
      <View ref={ref} collapsable={false} style={styles.cardContainer}>
        {/* Sole container / backdrop: The user's attached Full Moon */}
        <RNImage
          source={require('../../assets/images/festivals/sharad_moon_transparent.png')}
          style={styles.moonImage}
          resizeMode="contain"
        />

        {/* Wishes inscribed directly onto the sacred moon face */}
        <View style={styles.inscribedContentOverlay} pointerEvents="none">
          {/* Pure Seamless Creative Brand Header without Background Box */}
          <View style={styles.brandCrest}>
            <RNImage
              source={require('../../assets/images/brahmand_logo_official.png')}
              style={styles.brandLogo}
              resizeMode="contain"
            />
            <Text style={styles.brandTitle}>BRAHMAND</Text>
          </View>

          {/* Golden Sacred Pill */}
          <View style={styles.goldenTraditionBadge}>
            <Text style={styles.goldenTraditionSparkle}>✨</Text>
            <Text style={styles.goldenTraditionText}>
              ॥ ॐ सों सोमाय नमः • ॐ महालक्ष्म्यै नमः ॥
            </Text>
            <Text style={styles.goldenTraditionSparkle}>✨</Text>
          </View>

          {/* Main Headline with RozhaOne & Prominent Font Size */}
          <Text style={styles.headlineText} numberOfLines={1}>
            {festivalTitle}
          </Text>

          {/* Subheading Greeting */}
          <Text style={styles.subheadingText}>
            की अमृतमयी हार्दिक शुभकामनाएं
          </Text>

          {/* Golden Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerSparkle}>✦ 🌕 ✦</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Poetic & Personalised Blessings Box with Increased Font */}
          <View style={styles.poeticBox}>
            <Text style={styles.poeticLine}>
              शरद पूर्णिमा के चंद्रमा की धवल चांदनी आपके जीवन में
            </Text>
            <Text style={styles.poeticHighlightLine}>
              उत्तम आरोग्य, सुख-शांति एवं माँ लक्ष्मी की अखंड कृपा बरसाए।
            </Text>
          </View>

          {/* Sacred Kheer Prasad Tradition Pill */}
          <View style={styles.kheerPill}>
            <Text style={styles.kheerSparkle}>🥣</Text>
            <Text style={styles.kheerText}>
              अमृत वर्षिणी रात्रि • आरोग्यता एवं सुख-समृद्धि प्रदाता
            </Text>
            <Text style={styles.kheerSparkle}>✨</Text>
          </View>

          {/* Personalised Sender Name with "सपरिवार" warmth */}
          {cleanSender ? (
            <View style={styles.senderPill}>
              <Text style={styles.senderNamaste}>🙏</Text>
              <Text style={styles.senderLabel}>सप्रेम प्रेषक :</Text>
              <Text style={styles.senderNameText}>{cleanSender} सपरिवार</Text>
            </View>
          ) : (
            <View style={styles.senderPill}>
              <Text style={styles.senderNamaste}>🙏</Text>
              <Text style={styles.senderNameText}>॥ सर्वे भवन्तु सुखिनः सर्वे सन्तु निरामयाः ॥</Text>
            </View>
          )}

          {/* App Download & Official Store Availability Badge */}
          <View style={styles.appStoreBadge}>
            <View style={styles.appStoreHeaderRow}>
              <Ionicons name="sparkles" size={11} color="#D97706" />
              <Text style={styles.appStoreTitle}>Download Brahmand App</Text>
              <Ionicons name="sparkles" size={11} color="#D97706" />
            </View>
            <View style={styles.storePlatformsRow}>
              <View style={styles.platformPill}>
                <Ionicons name="logo-google-playstore" size={12} color="#059669" />
                <Text style={styles.platformText}>Google Play</Text>
              </View>
              <Text style={styles.platformDivider}>•</Text>
              <View style={styles.platformPill}>
                <Ionicons name="logo-apple" size={13} color="#0F172A" />
                <Text style={styles.platformText}>App Store</Text>
              </View>
            </View>
          </View>

          {/* Footer Sub-Note with via Brahmand App */}
          <Text style={styles.footerNote}>
            🌸 सनातन ज्ञान • मंदिर दर्शन • वैदिक उत्सव • via Brahmand App
          </Text>
        </View>
      </View>
    );
  }
);

SharadMoonWishCard.displayName = 'SharadMoonWishCard';

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
  moonImage: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    position: 'absolute',
    top: 0,
    left: 0,
  },
  inscribedContentOverlay: {
    position: 'absolute',
    top: 34,
    bottom: 24,
    left: 40,
    right: 40,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  brandCrest: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    marginBottom: 6,
    gap: 8,
  },
  brandLogo: {
    width: 24,
    height: 24,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 4.5,
    color: '#FFFFFF',
    fontFamily: 'Cinzel',
    textShadowColor: 'rgba(0, 0, 0, 0.95)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  goldenTraditionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF9C3',
    paddingHorizontal: 16,
    paddingVertical: 3.5,
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: '#D97706',
    marginTop: 1,
    marginBottom: 3,
    shadowColor: '#78350F',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.35,
    shadowRadius: 2.5,
    elevation: 3,
  },
  goldenTraditionSparkle: {
    fontSize: 11,
    marginHorizontal: 3,
  },
  goldenTraditionText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#78350F',
    letterSpacing: 0.5,
  },
  headlineText: {
    fontSize: 46,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 2.2,
    textAlign: 'center',
    marginTop: 0,
    fontFamily: Platform.select({
      ios: 'RozhaOne',
      android: 'RozhaOne',
      default: 'serif',
    }),
    textShadowColor: 'rgba(0, 0, 0, 0.95)',
    textShadowOffset: { width: 0, height: 2.2 },
    textShadowRadius: 9,
  },
  subheadingText: {
    fontSize: 18.5,
    fontWeight: '900',
    color: '#FEF08A',
    letterSpacing: 0.9,
    textAlign: 'center',
    marginTop: 0,
    textShadowColor: 'rgba(0, 0, 0, 0.95)',
    textShadowOffset: { width: 0, height: 1.8 },
    textShadowRadius: 6,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4.5,
    width: '72%',
  },
  dividerLine: {
    flex: 1,
    height: 1.4,
    backgroundColor: '#FDE047',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
  },
  dividerSparkle: {
    fontSize: 13,
    color: '#FEF08A',
    marginHorizontal: 8,
    fontWeight: '900',
  },
  poeticBox: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 2.5,
    marginVertical: 2,
  },
  poeticLine: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 20,
    letterSpacing: 0.35,
    textShadowColor: 'rgba(0, 0, 0, 0.95)',
    textShadowOffset: { width: 0, height: 1.5 },
    textShadowRadius: 4.5,
  },
  poeticHighlightLine: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FEF08A',
    textAlign: 'center',
    lineHeight: 21,
    letterSpacing: 0.35,
    marginTop: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.95)',
    textShadowOffset: { width: 0, height: 1.5 },
    textShadowRadius: 4.5,
  },
  kheerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 5,
    paddingHorizontal: 14,
    paddingVertical: 3.5,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderWidth: 1.1,
    borderColor: '#D97706',
    gap: 4.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  kheerSparkle: {
    fontSize: 11,
  },
  kheerText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#78350F',
    letterSpacing: 0.35,
    textAlign: 'center',
  },
  senderPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 5,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 16,
    backgroundColor: 'rgba(254, 240, 138, 0.96)',
    borderWidth: 1.2,
    borderColor: '#B45309',
    gap: 5,
    shadowColor: '#78350F',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.3,
    shadowRadius: 2.5,
    elevation: 3,
  },
  senderNamaste: {
    fontSize: 13,
  },
  senderLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#78350F',
  },
  senderNameText: {
    fontSize: 13.5,
    fontWeight: '900',
    color: '#78350F',
    letterSpacing: 0.45,
  },
  appStoreBadge: {
    marginTop: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 15,
    borderWidth: 1.3,
    borderColor: '#D97706',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.25,
    shadowRadius: 2.5,
    elevation: 3,
  },
  appStoreHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4.5,
    marginBottom: 2,
  },
  appStoreTitle: {
    fontSize: 11.5,
    fontWeight: '900',
    color: '#78350F',
    letterSpacing: 0.5,
    fontFamily: 'Cinzel',
  },
  storePlatformsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  platformPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  platformText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.2,
  },
  platformDivider: {
    fontSize: 10.5,
    color: '#94A3B8',
    fontWeight: '900',
  },
  footerNote: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#FEF9C3',
    letterSpacing: 0.5,
    marginTop: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.98)',
    textShadowOffset: { width: 0, height: 1.2 },
    textShadowRadius: 3,
    textAlign: 'center',
  },
});
