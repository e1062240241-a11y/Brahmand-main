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
import { COLORS, SPACING } from '../../src/constants/theme';
import { useTranslation } from '../../src/utils/i18n';

export default function AboutSettingsScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  const handleBack = useCallback(() => {
    router.replace('/profile');
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
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isHindi ? 'हमारे बारे में' : 'About Us'}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Brahmand</Text>
        <Text style={styles.subtitle}>Version 1.0.0</Text>
        
        <View style={styles.card}>
          <Text style={styles.cardText}>
            {isHindi 
              ? 'ब्रह्मांड सनातन लोक समुदाय का एक सुंदर मंच है जो भक्तों, मंदिरों और पुजारियों को एक साथ जोड़ता है।' 
              : 'Brahmand is a beautiful Sanatan Lok community platform dedicated to connecting devotees, temples, and priests.'}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{isHindi ? 'हमारा मिशन' : 'Our Mission'}</Text>
          <Text style={styles.sectionText}>
            {isHindi 
              ? 'सनातन धर्म की समृद्ध संस्कृति, ज्ञान और आध्यात्मिकता को आधुनिक तकनीक के माध्यम से दुनिया भर में फैलाना।' 
              : 'To spread the rich culture, wisdom, and spirituality of Sanatan Dharma globally using modern technology.'}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  backButton: {
    marginRight: SPACING.md,
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  content: {
    padding: SPACING.lg,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginTop: 20,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 30,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.lg,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 24,
  },
  cardText: {
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.text,
    textAlign: 'center',
  },
  section: {
    width: '100%',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  sectionText: {
    fontSize: 14,
    lineHeight: 22,
    color: COLORS.textSecondary,
  },
});
