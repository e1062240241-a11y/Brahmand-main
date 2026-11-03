import React, { forwardRef } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { FONTS } from '../constants/theme';

export interface DhanterasShareCardProps {
  userName?: string;
  cityName?: string;
  muhurat?: string;
  pradoshKaal?: string;
  vrishabhaLagna?: string;
}

export const DhanterasShareCard = forwardRef<any, DhanterasShareCardProps>(
  (
    {
      userName,
      cityName = 'नई दिल्ली / NCR',
      muhurat = '6:02 PM – 7:57 PM',
      pradoshKaal = '5:33 PM – 8:09 PM',
      vrishabhaLagna = '6:02 PM – 7:57 PM',
    },
    ref
  ) => {
    return (
      <View ref={ref} collapsable={false} style={styles.cardContainer}>
        {/* Royal Festive Background */}
        <LinearGradient
          colors={['#2A060C', '#450A13', '#2A060C']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardGradient}
        >
          {/* Ornate Golden Borders */}
          <View style={styles.outerBorder}>
            <View style={styles.innerBorder}>
              {/* Header Decorative Motif */}
              <View style={styles.topMotifRow}>
                <Text style={styles.topMotifText}>— 🪔 ॐ श्रीं महालक्ष्म्यै नमः 🪔 —</Text>
              </View>

              {/* Main Heading */}
              <Text style={styles.mainTitleText}>शुभ धनतेरस</Text>
              <Text style={styles.festivalDateText}>
                धनत्रयोदशी महापर्व • शुक्रवार, 6 नवंबर 2026
              </Text>

              {/* Devotee Greetings Pill */}
              <View style={styles.senderPill}>
                <Text style={styles.senderText} numberOfLines={1}>
                  {userName
                    ? `🌸 ${userName} जी की ओर से सपरिवार हार्दिक शुभकामनाएं`
                    : '🌸 पावन धनतेरस की अनंत मंगलकामनाएं'}
                </Text>
              </View>

              {/* Central 3D Gold Coin with Brahmand Branding */}
              <View style={styles.coinSection}>
                <View style={styles.coinWrapper}>
                  <Image
                    source={require('../../assets/images/festivals/dhanteras_gold_coin.png')}
                    style={styles.coinImage}
                    contentFit="contain"
                  />

                  {/* Minted Logo & Brand Name on Coin Face */}
                  <View style={styles.coinCenterContent} pointerEvents="none">
                    <Image
                      source={require('../../assets/images/brahmand_logo_transparent.png')}
                      style={styles.coinLogo}
                      contentFit="contain"
                    />
                    <Text style={styles.coinBrandText}>BRAHMAND</Text>
                    <Text style={styles.coinTaglineText}>धन समृद्धि</Text>
                  </View>
                </View>
              </View>

              {/* Useful Information Card */}
              <View style={styles.infoBox}>
                <View style={styles.infoBoxHeader}>
                  <Text style={styles.infoBoxHeaderTitle}>✨ शास्त्रसम्मत शुभ मुहूर्त ✨</Text>
                  <Text style={styles.cityNameText}>📍 {cityName}</Text>
                </View>

                {/* Primary Puja Muhurat */}
                <View style={styles.primaryMuhuratBlock}>
                  <Text style={styles.muhuratLabel}>धनतेरस पूजा शुभ मुहूर्त</Text>
                  <Text style={styles.muhuratTimeHighlight}>{muhurat}</Text>
                  <Text style={styles.muhuratSubDetail}>
                    प्रदोष काल: {pradoshKaal} • स्थिर वृषभ लग्न: {vrishabhaLagna}
                  </Text>
                </View>

                <View style={styles.infoDivider} />

                {/* Shopping Choghadiya */}
                <View style={styles.shoppingSection}>
                  <Text style={styles.shoppingTitle}>🛍️ खरीदारी के सर्वश्रेष्ठ चौघड़िया:</Text>
                  <Text style={styles.shoppingItemText}>
                    • दोपहर 12:02 – 01:24 PM (शुभ चौघड़िया)
                  </Text>
                  <Text style={styles.shoppingItemText}>
                    • शाम 04:07 – 05:29 PM (चर चौघड़िया)
                  </Text>
                  <Text style={styles.shoppingItemText}>
                    • रात 08:46 – 10:24 PM (लाभ चौघड़िया)
                  </Text>
                </View>

                {/* Yam Deep Daan */}
                <View style={styles.yamDeepBox}>
                  <Text style={styles.yamDeepText}>
                    🪔 यम दीप दान: शाम प्रदोष काल में मुख्य द्वार के बाहर दक्षिण मुखी चौमुखा दीपक प्रज्वलित करें।
                  </Text>
                </View>
              </View>

              {/* Call to Action Footer */}
              <View style={styles.footerContainer}>
                <View style={styles.footerBrandRow}>
                  <Ionicons name="sparkles" size={13} color="#D4AF37" />
                  <Text style={styles.ctaHighlightText}>
                    और जानने के लिए डाउनलोड करें ब्रह्मांड ऐप
                  </Text>
                  <Ionicons name="sparkles" size={13} color="#D4AF37" />
                </View>
                <Text style={styles.footerSubText}>
                  सनातन धर्म का ऑल-इन-वन सुपर ऐप • Daily Panchang, Puja & Jaap
                </Text>
                <Text style={styles.footerUrlText}>
                  brahmand.app • Available on Google Play & App Store
                </Text>
              </View>
            </View>
          </View>
        </LinearGradient>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  cardContainer: {
    width: 440,
    height: 780,
    backgroundColor: '#2A060C',
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardGradient: {
    flex: 1,
    padding: 10,
  },
  outerBorder: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#D4AF37',
    borderRadius: 12,
    padding: 4,
  },
  innerBorder: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.4)',
    borderRadius: 8,
    padding: 10,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topMotifRow: {
    alignItems: 'center',
    marginTop: 2,
  },
  topMotifText: {
    color: '#FDE68A',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  mainTitleText: {
    color: '#FFD700',
    fontSize: 27,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  festivalDateText: {
    color: '#FBCFE8',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 1,
  },
  senderPill: {
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 12,
    marginTop: 4,
  },
  senderText: {
    color: '#FDE68A',
    fontSize: 11.5,
    fontWeight: '700',
    textAlign: 'center',
  },

  // Central Coin
  coinSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  coinWrapper: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  coinImage: {
    width: 200,
    height: 200,
  },
  coinCenterContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: 130,
    height: 130,
  },
  coinLogo: {
    width: 50,
    height: 50,
    marginBottom: 2,
  },
  coinBrandText: {
    color: '#4A2500',
    fontFamily: FONTS.brandTitle,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  coinTaglineText: {
    color: '#6B3300',
    fontSize: 9.5,
    fontWeight: '800',
    marginTop: 1,
  },

  // Info Box
  infoBox: {
    width: '100%',
    backgroundColor: 'rgba(58, 12, 20, 0.85)',
    borderWidth: 1.5,
    borderColor: '#D4AF37',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  infoBoxHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 55, 0.25)',
    paddingBottom: 4,
    marginBottom: 6,
  },
  infoBoxHeaderTitle: {
    color: '#FDE68A',
    fontSize: 12.5,
    fontWeight: '800',
  },
  cityNameText: {
    color: '#FDE68A',
    fontSize: 12,
    fontWeight: '700',
  },
  primaryMuhuratBlock: {
    alignItems: 'center',
    paddingVertical: 2,
  },
  muhuratLabel: {
    color: '#FDE68A',
    fontSize: 11.5,
    fontWeight: '600',
  },
  muhuratTimeHighlight: {
    color: '#FFD700',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginVertical: 2,
  },
  muhuratSubDetail: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '600',
  },
  infoDivider: {
    height: 1,
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    marginVertical: 6,
  },
  shoppingSection: {
    gap: 2,
  },
  shoppingTitle: {
    color: '#FDE68A',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 2,
  },
  shoppingItemText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    lineHeight: 15,
  },
  yamDeepBox: {
    marginTop: 6,
    paddingTop: 4,
    borderTopWidth: 0.8,
    borderTopColor: 'rgba(212, 175, 55, 0.2)',
  },
  yamDeepText: {
    color: '#FCA5A5',
    fontSize: 9.5,
    lineHeight: 13.5,
    fontWeight: '600',
  },

  // Footer CTA
  footerContainer: {
    width: '100%',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(212, 175, 55, 0.3)',
    paddingTop: 6,
    marginTop: 4,
  },
  footerBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  ctaHighlightText: {
    color: '#FDE68A',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  footerSubText: {
    color: '#E5E7EB',
    fontSize: 9.5,
    fontWeight: '500',
    marginTop: 1,
  },
  footerUrlText: {
    color: '#9CA3AF',
    fontSize: 8.5,
    fontWeight: '600',
    marginTop: 1,
  },
});

export default DhanterasShareCard;

