import React, { forwardRef } from 'react';
import { View, Text, StyleSheet, Image as RNImage, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONTS } from '../constants/theme';

export interface DiwaliShareCardProps {
  userName?: string;
  cityName?: string;
  muhurat?: string;
  pradoshKaal?: string;
  vrishabhaLagna?: string;
}

export const DiwaliShareCard = forwardRef<View, DiwaliShareCardProps>(
  (
    {
      userName,
      muhurat = '5:54 PM – 7:50 PM',
      pradoshKaal = '5:33 PM – 8:09 PM',
    },
    ref
  ) => {
    const formattedSender = userName ? `${userName} जी एवं परिवार` : 'सपरिवार';

    return (
      <View ref={ref} collapsable={false} style={styles.cardContainer}>
        {/* Royal Ivory Floral Arch & Golden Lantern Background */}
        <RNImage
          source={require('../../assets/images/festivals/diwali_card_bg_royal.jpg')}
          style={styles.bgImage}
          resizeMode="cover"
        />

        {/* Clean, Majestic Content Inside the Royal Arch */}
        <View style={styles.contentOverlay} pointerEvents="none">
          {/* 1. TOP BRANDING: LOGO & BRAHMAND TEXT ALIGNED FROM BASE */}
          <View style={styles.brandRow}>
            <RNImage
              source={require('../../assets/images/brahmand_logo_transparent.png')}
              style={styles.brandLogo}
              resizeMode="contain"
            />
            <Text style={styles.brandTitle}>BRAHMAND</Text>
          </View>

          {/* 2. SENDER / USERNAME */}
          <View style={styles.senderSection}>
            <Text style={styles.senderNameText} numberOfLines={1}>
              🌸 {formattedSender} की ओर से 🌸
            </Text>
          </View>

          {/* 3. SACRED CUTOUTS OF DEITIES: GANESHA, MAHA LAKSHMI, SARASWATI */}
          <View style={styles.deitiesRow}>
            {/* Bhagwan Ganesha (Left) */}
            <View style={styles.deityWrapper}>
              <RNImage
                source={require('../../assets/images/festivals/diwali_ganesha_cutout.png')}
                style={styles.ganeshaCutout}
                resizeMode="contain"
              />
            </View>

            {/* Maa Maha Lakshmi (Center) */}
            <View style={styles.deityWrapperCenter}>
              <RNImage
                source={require('../../assets/images/festivals/diwali_lakshmi_cutout.png')}
                style={styles.lakshmiCutout}
                resizeMode="contain"
              />
            </View>

            {/* Maa Saraswati (Right) */}
            <View style={styles.deityWrapper}>
              <RNImage
                source={require('../../assets/images/festivals/diwali_saraswati_cutout.png')}
                style={styles.saraswatiCutout}
                resizeMode="contain"
              />
            </View>
          </View>

          {/* 4. SHREE LAKSHMI YANTRA (Sacred Geometric Plaque - Clear & High-Res) */}
          <View style={styles.yantraContainer}>
            <RNImage
              source={require('../../assets/images/festivals/laxmi_yantra_clean.png')}
              style={styles.yantraImage}
              resizeMode="contain"
            />
          </View>

          {/* 5. GRAND FESTIVE TITLE (Clean - No Sparkles) */}
          <Text style={styles.titleText}>🪔 शुभ दीपावली 🪔</Text>

          {/* 6. OVERWHELMING, HEART-TOUCHING WISHES (No Sparkles) */}
          <View style={styles.blessingsSection}>
            <Text style={styles.blessingLine}>
              🪔 दीपों का पावन प्रकाश आपके जीवन से हर अंधकार व संताप मिटाए
            </Text>
            <Text style={styles.blessingLine}>
              🪙 माँ महालक्ष्मी आपके घर-आंगन को सुख, समृद्धि, वैभव व आरोग्य से परिपूर्ण करें
            </Text>
            <Text style={styles.blessingLine}>
              🌸 विघ्नहर्ता भगवान श्री गणेश जी समस्त बाधाएं हरकर रिद्धि-सिद्धि प्रदान करें
            </Text>
            <Text style={styles.blessingLine}>
              🌺 माँ शारदा (सरस्वती) की पावन अनुकंपा से विद्या, विवेक व ज्ञान का सदैव वास हो
            </Text>
            <Text style={styles.blessingGoldLine}>
              🙏 यह दीपोत्सव आपके पूरे परिवार में असीम आनंद, प्रेम व नवचेतना का आलोक फैलाए!
            </Text>
          </View>

          {/* 7. UNIVERSAL AUSPICIOUS MUHURAT (No Sparkles, No City/Mumbai) */}
          <View style={styles.muhuratSection}>
            <Text style={styles.muhuratTimeText}>
              लक्ष्मी पूजन शुभ मुहूर्त: {muhurat}
            </Text>
            <Text style={styles.muhuratDetailText}>
              प्रदोष काल: {pradoshKaal} • स्थिर वृषभ लग्न
            </Text>
          </View>

          {/* 8. APP STORE & PLAY STORE BADGES */}
          <View style={styles.marketingFooter}>
            <Text style={styles.availableLabel}>Available on App Store & Play Store</Text>
            <View style={styles.storeBadgeRow}>
              <View style={styles.storePill}>
                <Ionicons name="logo-google-playstore" size={12} color="#15803D" />
                <Text style={styles.storeText}>Google Play</Text>
              </View>
              <Text style={styles.storeDivider}>•</Text>
              <View style={styles.storePill}>
                <Ionicons name="logo-apple" size={13} color="#0F172A" />
                <Text style={styles.storeText}>App Store</Text>
              </View>
            </View>
            <Text style={styles.marketingSubText}>brahmand.app</Text>
          </View>
        </View>
      </View>
    );
  }
);

DiwaliShareCard.displayName = 'DiwaliShareCard';

const styles = StyleSheet.create({
  cardContainer: {
    width: 735,
    height: 490,
    position: 'relative',
    backgroundColor: '#FBF8F2',
    overflow: 'hidden',
  },
  bgImage: {
    ...StyleSheet.absoluteFillObject,
    width: 735,
    height: 490,
  },
  contentOverlay: {
    position: 'absolute',
    top: 18,
    bottom: 14,
    left: 70,
    right: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 1,
  },
  brandLogo: {
    width: 28,
    height: 28,
  },
  brandTitle: {
    color: '#6E280A',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 2,
    fontFamily: Platform.select({
      ios: 'Cinzel-Bold',
      android: 'Cinzel-Bold',
      default: 'Cinzel-Bold',
    }),
    includeFontPadding: false,
    lineHeight: 22,
    marginBottom: 1,
  },
  senderSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  senderNameText: {
    color: '#8C2E0B',
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
  deitiesRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 16,
    marginTop: 1,
    marginBottom: 2,
  },
  deityWrapper: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  deityWrapperCenter: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  ganeshaCutout: {
    width: 82,
    height: 108,
  },
  lakshmiCutout: {
    width: 94,
    height: 116,
  },
  saraswatiCutout: {
    width: 76,
    height: 110,
  },
  yantraContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 2,
    shadowColor: '#7C2D12',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 3,
  },
  yantraImage: {
    width: 52,
    height: 52,
    borderRadius: 6,
  },
  titleText: {
    color: '#7C2D12',
    fontSize: 23,
    fontWeight: '900',
    fontFamily: FONTS.brandTitle,
    letterSpacing: 0.8,
    textAlign: 'center',
    marginVertical: 1,
  },
  blessingsSection: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 2,
  },
  blessingLine: {
    color: '#6E280A',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 15.5,
  },
  blessingGoldLine: {
    color: '#9A3412',
    fontSize: 11.5,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 1,
    lineHeight: 16,
  },
  muhuratSection: {
    width: '100%',
    alignItems: 'center',
    marginTop: 3,
    marginBottom: 2,
  },
  muhuratTimeText: {
    color: '#7C2D12',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  muhuratDetailText: {
    color: '#B45309',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 1,
    textAlign: 'center',
  },
  marketingFooter: {
    marginTop: 3,
    alignItems: 'center',
    width: '100%',
  },
  availableLabel: {
    color: '#8C3C0F',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
    marginBottom: 2,
    textAlign: 'center',
  },
  storeBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 1,
  },
  storePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3.5,
  },
  storeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#1F2937',
    letterSpacing: 0.2,
  },
  storeDivider: {
    fontSize: 9,
    color: '#B45309',
    fontWeight: '900',
    marginHorizontal: 2,
  },
  marketingSubText: {
    color: '#8C3C0F',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.4,
    marginTop: 1,
    textAlign: 'center',
  },
});
