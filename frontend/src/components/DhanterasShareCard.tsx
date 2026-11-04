import React, { forwardRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
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
      cityName,
      muhurat = '6:02 PM – 7:57 PM',
      pradoshKaal = '5:33 PM – 8:09 PM',
      vrishabhaLagna = '6:02 PM – 7:57 PM',
    },
    ref
  ) => {
    return (
      <View ref={ref} collapsable={false} style={styles.cardContainer}>
        {/* Pure Transparent Container - Absolutely NO background behind the coin */}
        <View style={styles.coinWrapper}>
          <Image
            source={require('../../assets/images/festivals/dhanteras_gold_coin.png')}
            style={styles.coinImage}
            contentFit="contain"
          />

          {/* Minted Logo, Brand, Auspicious Muhurat, Shopping, Wishes & Sender directly on Coin Face */}
          <View style={styles.coinCenterContent} pointerEvents="none">
            {/* Brahmand Logo */}
            <Image
              source={require('../../assets/images/brahmand_logo_transparent.png')}
              style={styles.coinLogo}
              contentFit="contain"
            />

            {/* Brand Name */}
            <Text style={styles.coinBrandText}>BRAHMAND</Text>

            {/* Auspicious Mahalakshmi Inscription */}
            <Text style={styles.coinInvocationText}>
              — ॐ श्रीं ह्रीं क्लीं महालक्ष्म्यै नमः —
            </Text>

            {/* Main Festive Greeting on Coin */}
            <Text style={styles.coinWishTitle}>शुभ धनतेरस</Text>

            {/* Shortened Auspicious Muhurat Block on Coin */}
            <View style={styles.muhuratPill}>
              <Text style={styles.muhuratHighlightText}>
                ✨ पूजा मुहूर्त: {muhurat} ✨
              </Text>
              <Text style={styles.muhuratDetailText}>
                प्रदोष काल: {pradoshKaal} • स्थिर वृषभ लग्न
              </Text>
            </View>

            {/* Shortened Shopping & Ritual Pointer on Coin */}
            <Text style={styles.shoppingRitualText}>
              🛍️ खरीदारी: शुभ व लाभ चौघड़िया • 🪔 यम दीप दान
            </Text>

            {/* Core Wishes Message directly on Coin */}
            <Text style={styles.coinWishMessage}>
              सुख, उत्तम स्वास्थ्य व अटूट समृद्धि की मंगलकामनाएं
            </Text>

            {/* Sender / Devotee Greetings on Coin */}
            <View style={styles.coinSenderPill}>
              <Text style={styles.coinSenderText} numberOfLines={1}>
                {userName
                  ? `🌸 ${userName} जी की ओर से सपरिवार 🌸`
                  : '🌸 पावन धनतेरस की अनंत शुभकामनाएं 🌸'}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  cardContainer: {
    width: 500,
    height: 500,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coinWrapper: {
    width: 500,
    height: 500,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    backgroundColor: 'transparent',
  },
  coinImage: {
    width: 500,
    height: 500,
  },
  coinCenterContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: 340,
    height: 340,
    paddingHorizontal: 10,
  },
  coinLogo: {
    width: 44,
    height: 44,
    marginBottom: 1,
  },
  coinBrandText: {
    color: '#3B1A00',
    fontFamily: FONTS.brandTitle,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  coinInvocationText: {
    color: '#5C2B00',
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.3,
    marginTop: 2,
  },
  coinWishTitle: {
    color: '#3B1A00',
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  muhuratPill: {
    backgroundColor: 'rgba(59, 26, 0, 0.08)',
    borderWidth: 0.8,
    borderColor: 'rgba(59, 26, 0, 0.22)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignItems: 'center',
    marginTop: 4,
    width: '92%',
  },
  muhuratHighlightText: {
    color: '#3B1A00',
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
  },
  muhuratDetailText: {
    color: '#5C2B00',
    fontSize: 9,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 1,
  },
  shoppingRitualText: {
    color: '#5C2B00',
    fontSize: 9,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 3,
  },
  coinWishMessage: {
    color: '#4A2100',
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 3,
  },
  coinSenderPill: {
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: 'rgba(59, 26, 0, 0.08)',
    borderWidth: 0.6,
    borderColor: 'rgba(59, 26, 0, 0.2)',
  },
  coinSenderText: {
    color: '#3B1A00',
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'center',
  },
});

export default DhanterasShareCard;
