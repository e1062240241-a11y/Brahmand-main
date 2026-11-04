import React, { forwardRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { FONTS } from '../constants/theme';

export interface DhanterasStoryShareCardProps {
  userName?: string;
  cityName?: string;
  muhurat?: string;
  pradoshKaal?: string;
}

export const DhanterasStoryShareCard = forwardRef<View, DhanterasStoryShareCardProps>(
  (
    {
      userName = '',
      cityName = '',
      muhurat = '6:02 PM – 7:57 PM',
      pradoshKaal = '5:33 PM – 8:09 PM',
    },
    ref
  ) => {
    const cleanUser = (userName || '').trim();
    const displaySender = cleanUser
      ? `WITH LOVE FROM ${cleanUser.toUpperCase()} VIA BRAHMAND`
      : 'WITH LOVE VIA BRAHMAND';
    const hindiSender = cleanUser
      ? `${cleanUser} जी की ओर से सपरिवार सप्रेम भेंट`
      : 'पावन धनतेरस की अनंत मंगलकामनाएं';

    return (
      <View ref={ref} collapsable={false} style={styles.cardCanvas}>
        <LinearGradient
          colors={['#1F0307', '#380910', '#1F0307']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.backgroundGradient}
        >
          {/* Ornate Gold Outer Border */}
          <View style={styles.outerBorder}>
            <View style={styles.innerBorder}>
              {/* 1. TOP BRAND HEADER: Brahmand Logo & Title */}
              <View style={styles.headerContainer}>
                <View style={styles.logoRow}>
                  <ExpoImage
                    source={require('../../assets/images/brahmand_logo_transparent.png')}
                    style={styles.brahmandLogo}
                    contentFit="contain"
                  />
                  <View style={styles.brandTextCol}>
                    <Text style={styles.brandTitleText}>BRAHMAND</Text>
                    <Text style={styles.brandTaglineText}>DAILY SANATAN COMMUNITY</Text>
                  </View>
                </View>

                {/* 2. DEDICATION KICKER: With Love From User via Brahmand */}
                <View style={styles.dedicationPill}>
                  <Text style={styles.dedicationStar}>✨</Text>
                  <Text style={styles.dedicationMainText} numberOfLines={1}>
                    {displaySender}
                  </Text>
                  <Text style={styles.dedicationStar}>✨</Text>
                </View>
                <Text style={styles.dedicationHindiText} numberOfLines={1}>
                  🌸 {hindiSender} 🌸
                </Text>
              </View>

              {/* Decorative Divider */}
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerDiya}>🪔</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* 3. HERO FESTIVAL TITLE & DEITY INVOCATION */}
              <View style={styles.festivalTitleSection}>
                <Text style={styles.festiveGreetingTitle}>शुभ धनतेरस</Text>
                <Text style={styles.tithiBadgeText}>
                  कार्तिक कृष्ण त्रयोदशी महापर्व • 6 नवंबर 2026
                </Text>
                <Text style={styles.vedicMantraText}>
                  — ॐ धं धन्वन्तरये नमः • ॐ श्रीं महालक्ष्म्यै नमः —
                </Text>
              </View>

              {/* 4. SACRED STORY CARD: Dhanteras Amrit Kalash Katha */}
              <View style={styles.storyCard}>
                <LinearGradient
                  colors={['rgba(255, 237, 213, 0.12)', 'rgba(255, 215, 0, 0.05)']}
                  style={styles.storyCardGradient}
                >
                  <View style={styles.storyHeaderRow}>
                    <Text style={styles.storyBookIcon}>📖</Text>
                    <Text style={styles.storyCardHeading}>
                      समुद्र मंथन व भगवान धन्वंतरि अमृत कथा
                    </Text>
                  </View>

                  <Text style={styles.storyBodyText}>
                    कार्तिक कृष्ण त्रयोदशी के दिन समुद्र मंथन से भगवान धन्वंतरि दिव्य अमृत कलश लेकर प्रकट हुए थे। इसी पावन दिन राजा हेम के नवविवाहित पुत्र की यमराज के पाश से रक्षा हुई थी।
                  </Text>

                  <Text style={[styles.storyBodyText, { marginTop: 6 }]}>
                    आज के पावन दिन भगवान धन्वंतरि, माँ महालक्ष्मी व कुबेर देव का पूजन एवं सायंकाल यम दीपदान करने से अकाल मृत्यु का भय समाप्त होता है तथा उत्तम स्वास्थ्य व अखंड समृद्धि का वास होता है।
                  </Text>
                </LinearGradient>
              </View>

              {/* 5. AUSPICIOUS PUJA MUHURAT & SHOPPING INFO */}
              <View style={styles.muhuratGrid}>
                <View style={styles.muhuratBox}>
                  <Text style={styles.muhuratBoxTitle}>🪔 संध्या पूजा मुहूर्त</Text>
                  <Text style={styles.muhuratBoxTime}>{muhurat}</Text>
                  <Text style={styles.muhuratBoxSub}>
                    प्रदोष काल ({pradoshKaal}) • स्थिर वृषभ लग्न
                  </Text>
                </View>

                <View style={styles.muhuratBox}>
                  <Text style={styles.muhuratBoxTitle}>🛍️ मांगलिक खरीदारी</Text>
                  <Text style={styles.muhuratBoxTime}>शुभ, लाभ व अमृत चौघड़िया</Text>
                  <Text style={styles.muhuratBoxSub}>
                    स्वर्ण, रजत, पीतल बर्तन व 13 दीप दान
                  </Text>
                </View>
              </View>

              {/* 6. BOTTOM BRAND STRIP */}
              <View style={styles.bottomBar}>
                <Text style={styles.bottomBarLeft}>
                  🕉️ <Text style={styles.bottomBrandName}>Brahmand</Text> — वैदिक पंचांग, लाइव दर्शन व पावन कथाएं
                </Text>
                <Text style={styles.bottomBarRight}>brahmand.app</Text>
              </View>
            </View>
          </View>
        </LinearGradient>
      </View>
    );
  }
);

DhanterasStoryShareCard.displayName = 'DhanterasStoryShareCard';

const styles = StyleSheet.create({
  cardCanvas: {
    width: 480,
    height: 853,
    backgroundColor: '#1F0307',
  },
  backgroundGradient: {
    flex: 1,
    padding: 12,
  },
  outerBorder: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#D4AF37',
    borderRadius: 16,
    padding: 4,
  },
  innerBorder: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.45)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    justifyContent: 'space-between',
    backgroundColor: 'rgba(20, 3, 5, 0.65)',
  },
  headerContainer: {
    alignItems: 'center',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brahmandLogo: {
    width: 38,
    height: 38,
  },
  brandTextCol: {
    alignItems: 'flex-start',
  },
  brandTitleText: {
    color: '#FFD700',
    fontFamily: FONTS.brandTitle || 'System',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 2,
  },
  brandTaglineText: {
    color: '#FDE68A',
    fontSize: 8.5,
    fontWeight: '700',
    letterSpacing: 1.2,
    opacity: 0.9,
  },
  dedicationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(217, 119, 6, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F59E0B',
    marginTop: 8,
    gap: 4,
  },
  dedicationStar: {
    fontSize: 10,
  },
  dedicationMainText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  dedicationHindiText: {
    color: '#FDE68A',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 3,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 215, 0, 0.35)',
  },
  dividerDiya: {
    fontSize: 14,
  },
  festivalTitleSection: {
    alignItems: 'center',
  },
  festiveGreetingTitle: {
    color: '#FFD700',
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 1.5,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.9)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  tithiBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
    letterSpacing: 0.4,
  },
  vedicMantraText: {
    color: '#FDE68A',
    fontSize: 11,
    fontStyle: 'italic',
    fontWeight: '600',
    marginTop: 4,
    letterSpacing: 0.3,
  },
  storyCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.5)',
    overflow: 'hidden',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  storyCardGradient: {
    padding: 12,
  },
  storyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  storyBookIcon: {
    fontSize: 14,
  },
  storyCardHeading: {
    color: '#FFD700',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  storyBodyText: {
    color: '#F3F4F6',
    fontSize: 11.5,
    lineHeight: 16.5,
    fontWeight: '500',
    textAlign: 'justify',
  },
  muhuratGrid: {
    gap: 8,
  },
  muhuratBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.35)',
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  muhuratBoxTitle: {
    color: '#FFD700',
    fontSize: 11.5,
    fontWeight: '700',
  },
  muhuratBoxTime: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 1,
  },
  muhuratBoxSub: {
    color: '#D1D5DB',
    fontSize: 10,
    fontWeight: '500',
    marginTop: 1,
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 215, 0, 0.25)',
  },
  bottomBarLeft: {
    color: '#E5E7EB',
    fontSize: 9.5,
    fontWeight: '600',
  },
  bottomBrandName: {
    color: '#FFD700',
    fontWeight: '800',
  },
  bottomBarRight: {
    color: '#FDE68A',
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export default DhanterasStoryShareCard;

