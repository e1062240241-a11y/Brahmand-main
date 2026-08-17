import React, { useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  BackHandler,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SPACING } from '../../src/constants/theme';
import { useTranslation } from '../../src/utils/i18n';

export default function AboutSettingsScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/profile');
    }
  }, [router]);

  useEffect(() => {
    const backAction = () => {
      handleBack();
      return true;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => subscription.remove();
  }, [handleBack]);

  const isHindi = t('language') === 'hi';

  return (
    <LinearGradient
      colors={['#FF8D57', '#EA9B76', '#FFEEE5']}
      locations={[0, 0.0913, 0.25]}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="chevron-back" size={28} color="#000000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{isHindi ? 'हमारे बारे में' : 'About Us'}</Text>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Brahmand</Text>
          <Text style={styles.subtitle}>Version 1.0.0</Text>

          {/* Single Borderless Transparent Pill Container */}
          <View style={styles.pillContainer}>
            <View style={styles.cardSection}>
              <Text style={styles.cardText}>
                {isHindi 
                  ? 'ब्रह्मांड सनातन लोक समुदाय का एक सुंदर मंच है जो भक्तों, मंदिरों और पुजारियों को एक साथ जोड़ता है।' 
                  : 'Brahmand is a beautiful Sanatan Lok community platform dedicated to connecting devotees, temples, and priests.'}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{isHindi ? 'हमारा मिशन' : 'Our Mission'}</Text>
              <Text style={styles.sectionText}>
                {isHindi 
                  ? 'सनातन धर्म की समृद्ध संस्कृति, ज्ञान और आध्यात्मिकता को आधुनिक तकनीक के माध्यम से दुनिया भर में फैलाना।' 
                  : 'To spread the rich culture, wisdom, and spirituality of Sanatan Dharma globally using modern technology.'}
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  backButton: {
    marginRight: SPACING.md,
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
  },
  content: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.xs,
    paddingBottom: SPACING.xl * 2.5,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1F2937',
    marginTop: 8,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(0,0,0,0.5)',
    fontWeight: '600',
    marginBottom: 20,
  },
  pillContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    borderRadius: 24,
    padding: SPACING.lg,
    width: '100%',
  },
  cardSection: {
    width: '100%',
  },
  cardText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#1F2937',
    textAlign: 'center',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
    marginVertical: SPACING.lg,
  },
  section: {
    width: '100%',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF6F00',
    marginBottom: SPACING.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionText: {
    fontSize: 14,
    lineHeight: 22,
    color: 'rgba(0,0,0,0.7)',
    fontWeight: '400',
  },
});
