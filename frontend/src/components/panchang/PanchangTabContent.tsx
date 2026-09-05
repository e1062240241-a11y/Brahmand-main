import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  AdvancedPanchangData,
  ChoghadiyaItem,
  OverviewItem,
  PanchangPayload,
} from '../../types/panchang';
import { SUN_MOON_ICONS } from '../../constants/panchang';
import { formatTimeValue } from '../../utils/panchangTimeUtils';
import { styles } from './panchangStyles';

export interface PanchangTabContentProps {
  payload: PanchangPayload | null;
  overview: OverviewItem[];
  activeChoghadiyaList: readonly ChoghadiyaItem[] | ChoghadiyaItem[];
  choghadiyaMode: 'day' | 'night';
  language: string;
  onNavigateToTemples: () => void;
}

export const PanchangTabContent: React.FC<PanchangTabContentProps> = ({
  payload,
  overview,
  activeChoghadiyaList,
  choghadiyaMode,
  language,
  onNavigateToTemples,
}) => {
  const advanced: AdvancedPanchangData | undefined =
    payload?.sources?.advanced_panchang || payload?.sources?.panchang_advanced;

  if (!advanced && !payload?.overview?.length) {
    return (
      <Text style={styles.emptyText}>
        {language === 'hi'
          ? 'इस तिथि के लिए पंचांग उपलब्ध नहीं है। कृपया अन्य तिथि चुनें ✨'
          : 'Panchang is not available for this date. Please select another date ✨'}
      </Text>
    );
  }

  return (
    <View style={styles.tabContent}>
      {/* Panchang Details */}
      <Text style={styles.sectionHeader}>Panchang Details</Text>
      <View style={styles.card}>
        {overview.map((item: OverviewItem, idx: number) => (
          <View key={`${item.label}-${idx}`} style={{ alignSelf: 'stretch' }}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{item.label}</Text>
              <Text style={styles.infoValue}>{item.value}</Text>
            </View>
            {idx < overview.length - 1 && <View style={styles.infoDivider} />}
          </View>
        ))}
      </View>

      {/* Sun & Moon Times */}
      <Text style={styles.sectionHeader}>Sun & Moon Times</Text>
      <View style={[styles.card, { paddingHorizontal: 0, paddingVertical: 0, overflow: 'hidden' }]}>
        <View style={styles.sunMoonGrid}>
          <View style={styles.sunMoonItem}>
            <View style={styles.sunMoonIconBox}>
              <Image
                source={{ uri: SUN_MOON_ICONS.sunrise }}
                style={{ width: 20, height: 20 }}
                resizeMode="contain"
              />
            </View>
            <View style={styles.sunMoonMeta}>
              <Text style={styles.sunMoonLabel}>SUNRISE</Text>
              <Text style={styles.sunMoonValue}>
                {formatTimeValue(advanced?.sunrise) || '05:45 AM'}
              </Text>
            </View>
          </View>

          <View style={styles.sunMoonItem}>
            <View style={styles.sunMoonIconBox}>
              <Image
                source={{ uri: SUN_MOON_ICONS.sunset }}
                style={{ width: 20, height: 20 }}
                resizeMode="contain"
              />
            </View>
            <View style={styles.sunMoonMeta}>
              <Text style={styles.sunMoonLabel}>SUNSET</Text>
              <Text style={styles.sunMoonValue}>
                {formatTimeValue(advanced?.sunset) || '06:30 PM'}
              </Text>
            </View>
          </View>

          <View style={styles.sunMoonItem}>
            <View style={styles.sunMoonIconBox}>
              <Image
                source={{ uri: SUN_MOON_ICONS.moonrise }}
                style={{ width: 20, height: 20 }}
                resizeMode="contain"
              />
            </View>
            <View style={styles.sunMoonMeta}>
              <Text style={styles.sunMoonLabel}>MOONRISE</Text>
              <Text style={styles.sunMoonValue}>
                {formatTimeValue(advanced?.moonrise) || '07:15 PM'}
              </Text>
            </View>
          </View>

          <View style={styles.sunMoonItem}>
            <View style={styles.sunMoonIconBox}>
              <Image
                source={{ uri: SUN_MOON_ICONS.moonset }}
                style={{ width: 20, height: 20 }}
                resizeMode="contain"
              />
            </View>
            <View style={styles.sunMoonMeta}>
              <Text style={styles.sunMoonLabel}>MOONSET</Text>
              <Text style={styles.sunMoonValue}>
                {formatTimeValue(advanced?.moonset) || '05:30 AM'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Inauspicious Times */}
      <View style={styles.inauspiciousHeaderBox}>
        <View style={styles.alertIconBox}>
          <Ionicons name="warning" size={14} color="#BA1A1A" />
        </View>
        <Text style={styles.sectionHeaderAlert}>Inauspicious Times</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.inauspiciousRow}>
          <Text style={styles.inauspiciousLabel}>Rahu Kaal</Text>
          <Text style={styles.inauspiciousValue}>
            {advanced?.rahu_kaal || '09:00 AM - 10:30 AM'}
          </Text>
        </View>
        <View style={styles.infoDivider} />
        <View style={styles.inauspiciousRow}>
          <Text style={styles.inauspiciousLabel}>Gulika Kaal</Text>
          <Text style={styles.inauspiciousValue}>
            {advanced?.gulika_kaal || '06:00 AM - 07:30 AM'}
          </Text>
        </View>
        <View style={styles.infoDivider} />
        <View style={styles.inauspiciousRow}>
          <Text style={styles.inauspiciousLabel}>Yamaganda</Text>
          <Text style={styles.inauspiciousValue}>
            {advanced?.yamaganda || '01:00 PM - 03:00 PM'}
          </Text>
        </View>
      </View>

      {/* Day Choghadiya Section */}
      <Text style={[styles.sectionHeader, { marginTop: 0 }]}>Day Choghadiya</Text>
      <View style={styles.choghadiyaGrid}>
        {activeChoghadiyaList.map((m: ChoghadiyaItem, idx: number) => (
          <View key={`${choghadiyaMode}-${idx}`} style={styles.choghadiyaCard}>
            <Text style={styles.choghadiyaTitle}>{m.muhurta}</Text>
            <Text style={styles.choghadiyaTime} numberOfLines={1}>
              {m.time}
            </Text>
            <View
              style={[
                styles.choghadiyaBadge,
                m.is_good ? styles.choghadiyaBadgeGood : styles.choghadiyaBadgeBad,
              ]}
            >
              <Text
                style={
                  m.is_good
                    ? styles.choghadiyaBadgeTextGood
                    : styles.choghadiyaBadgeTextBad
                }
              >
                {m.is_good ? 'Good' : 'Bad'}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Cross-Feature Connection: Nearby Temples */}
      <TouchableOpacity
        style={styles.templeBannerCard}
        onPress={onNavigateToTemples}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={
          language === 'hi' ? 'आस-पास के मंदिर देखें' : 'Explore Nearby Temples'
        }
      >
        <View style={styles.templeBannerIconBox}>
          <Ionicons name="location-sharp" size={20} color="#9B4500" />
        </View>
        <View style={styles.templeBannerContent}>
          <Text style={styles.templeBannerTitle}>
            {language === 'hi' ? 'आस-पास के मंदिर देखें →' : 'Nearby Temples →'}
          </Text>
          <Text style={styles.templeBannerDesc}>
            {language === 'hi'
              ? 'शुभ दर्शन और प्रार्थना के लिए अपने पास के पवित्र मंदिर खोजें।'
              : 'Find sacred mandirs near you for auspicious darshan and prayers.'}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};
