import React, { forwardRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { FONTS } from '../constants/theme';

export interface KarwaChauthShareCardProps {
  userName: string;
  cityName: string;
  moonriseTime: string;
  sargiTime?: string;
  pujaTime?: string;
}

export const KarwaChauthShareCard = forwardRef<any, KarwaChauthShareCardProps>(
  (
    {
      userName,
      cityName,
      moonriseTime,
      sargiTime = '04:45 AM - 05:35 AM',
      pujaTime = '05:43 PM - 07:01 PM',
    },
    ref
  ) => {
    return (
      <View ref={ref} collapsable={false} style={styles.cardContainer}>
        {/* Background Image: Sacred Moon, Lake & Parchment */}
        <Image
          source={require('../../assets/images/festivals/karwa_chauth_share_bg.jpg')}
          style={styles.bgImage}
          contentFit="cover"
        />

        {/* Content Area placed directly over the parchment scroll */}
        <View style={styles.parchmentArea}>
          {/* Top Lotus Decorative Motif */}
          <View style={styles.topMotif}>
            <Text style={styles.topMotifText}>— 🪔 🌸 🪔 —</Text>
          </View>

          {/* Main Title */}
          <Text style={styles.titleText}>करवा चौथ</Text>
          <Text style={styles.subTitleText}>अखंड सौभाग्य महापर्व • 29 अक्टूबर 2026</Text>

          {/* Devotee Sender Greeting */}
          <View style={styles.senderPill}>
            <Text style={styles.senderText} numberOfLines={1}>
              {userName ? `🌸 ${userName} जी की ओर से` : '🌸 पावन मंगलकामनाएं'}
            </Text>
          </View>

          {/* Golden Divider */}
          <View style={styles.divider} />

          {/* City & Moonrise Spotlight Box */}
          <View style={styles.moonriseHighlightBox}>
            <Text style={styles.cityLocationText}>📍 {cityName}</Text>
            <View style={styles.moonTimeRow}>
              <Text style={styles.moonTimeIcon}>🌕</Text>
              <Text style={styles.moonTimeLabel}>संभावित चंद्रोदय:</Text>
              <Text style={styles.moonTimeVal}>{moonriseTime}</Text>
            </View>
            <Text style={styles.moonHintText}>
              छलनी से चंद्र दर्शन कर अर्घ्य दें और व्रत पूर्ण करें
            </Text>
          </View>

          {/* Sacred Muhurats Table */}
          <View style={styles.muhuratTable}>
            <View style={styles.muhuratRow}>
              <Text style={styles.muhuratName}>🌅 सरगी मुहूर्त:</Text>
              <Text style={styles.muhuratTime}>{sargiTime}</Text>
            </View>
            <View style={styles.muhuratRow}>
              <Text style={styles.muhuratName}>🪔 संध्या पूजा व कथा:</Text>
              <Text style={styles.muhuratTime}>{pujaTime}</Text>
            </View>
            <View style={[styles.muhuratRow, styles.muhuratRowHighlight]}>
              <Text style={[styles.muhuratName, { fontWeight: '800', color: '#78350F' }]}>
                🌕 चंद्र अर्घ्य समय:
              </Text>
              <Text style={[styles.muhuratTime, { fontWeight: '800', color: '#9A3412' }]}>
                {moonriseTime}
              </Text>
            </View>
          </View>

          {/* Sacred Sanskrit Shloka */}
          <View style={styles.shlokaBox}>
            <Text style={styles.shlokaText}>
              नमः शिवायै शर्वाण्यै सौभाग्यं संततिं शुभाम्।{'\n'}
              प्रयच्छ भक्तियुक्तानां नारीणां हरवल्लभे॥
            </Text>
          </View>

          {/* Footer Branding */}
          <View style={styles.footerRow}>
            <Text style={styles.footerText}>
              सनातन धर्म की पावन परंपरा • ब्रह्मांड (brahmand.app)
            </Text>
          </View>
        </View>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  cardContainer: {
    width: 576,
    height: 1024,
    position: 'relative',
    backgroundColor: '#070B19',
    overflow: 'hidden',
  },
  bgImage: {
    ...StyleSheet.absoluteFillObject,
  },
  parchmentArea: {
    position: 'absolute',
    top: '25%',
    bottom: '22%',
    left: '10%',
    right: '10%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  topMotif: {
    marginBottom: 2,
  },
  topMotifText: {
    color: '#92400E',
    fontSize: 11,
    letterSpacing: 2,
  },
  titleText: {
    color: '#78350F',
    fontSize: 27,
    fontWeight: '800',
    fontFamily: FONTS.brandTitle,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  subTitleText: {
    color: '#9A3412',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
    marginBottom: 6,
    textAlign: 'center',
  },
  senderPill: {
    backgroundColor: 'rgba(217, 119, 6, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(180, 83, 9, 0.35)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginBottom: 6,
  },
  senderText: {
    color: '#78350F',
    fontSize: 12,
    fontWeight: '800',
  },
  divider: {
    width: '80%',
    height: 1,
    backgroundColor: 'rgba(180, 83, 9, 0.25)',
    marginVertical: 4,
  },
  moonriseHighlightBox: {
    width: '100%',
    backgroundColor: 'rgba(254, 243, 199, 0.75)',
    borderWidth: 1.2,
    borderColor: '#D97706',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginVertical: 5,
  },
  cityLocationText: {
    color: '#92400E',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 2,
  },
  moonTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  moonTimeIcon: {
    fontSize: 16,
  },
  moonTimeLabel: {
    color: '#78350F',
    fontSize: 13,
    fontWeight: '700',
  },
  moonTimeVal: {
    color: '#9A3412',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  moonHintText: {
    color: '#B45309',
    fontSize: 9.5,
    fontWeight: '600',
    marginTop: 2,
  },
  muhuratTable: {
    width: '100%',
    marginVertical: 4,
    gap: 3,
  },
  muhuratRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2.5,
    paddingHorizontal: 6,
  },
  muhuratRowHighlight: {
    backgroundColor: 'rgba(253, 230, 138, 0.55)',
    borderRadius: 6,
  },
  muhuratName: {
    color: '#78350F',
    fontSize: 11,
    fontWeight: '600',
  },
  muhuratTime: {
    color: '#92400E',
    fontSize: 11,
    fontWeight: '700',
  },
  shlokaBox: {
    marginTop: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  shlokaText: {
    color: '#78350F',
    fontSize: 9.5,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 14,
    fontWeight: '600',
  },
  footerRow: {
    marginTop: 6,
    paddingTop: 4,
    borderTopWidth: 0.8,
    borderTopColor: 'rgba(180, 83, 9, 0.2)',
  },
  footerText: {
    color: '#92400E',
    fontSize: 8.5,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
