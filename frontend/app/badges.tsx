import React, { useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS, SPACING, BORDER_RADIUS } from '../src/constants/theme';
import { useLanguageStore } from '../src/utils/i18n';

// 🧲 Magnet: Reframed cold community badges screen & developer notes into warm, localized engagement copy + Passport CTA
export default function BadgesScreen() {
  const router = useRouter();
  const language = useLanguageStore((state) => state.language);
  const isHindi = language === 'hi';

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  useEffect(() => {
    const backAction = () => {
      handleBack();
      return true;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => subscription.remove();
  }, [handleBack]);

  const handleOpenPassport = () => {
    router.push('/passport');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title}>
          {isHindi ? 'सामुदायिक सम्मान एवं बैज' : 'Community Badges'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.message}>
          {isHindi
            ? 'यहाँ आपकी साधना, योगदान और सामुदायिक सेवा के लिए प्राप्त सम्मान एवं बैज प्रदर्शित होंगे। 🙏'
            : 'Your earned community badges, recognitions, and spiritual journey milestones will be displayed here. 🙏'}
        </Text>
        <Text style={styles.note}>
          {isHindi
            ? 'साधना में निरंतरता बनाए रखें और अपने अनुभव समुदाय के साथ साझा करें। ✨'
            : 'Keep up your regular spiritual practice and share your journey with the community. ✨'}
        </Text>

        <TouchableOpacity
          style={styles.ctaButton}
          activeOpacity={0.8}
          onPress={handleOpenPassport}
        >
          <Text style={styles.ctaButtonText}>
            {isHindi ? 'अपना पासपोर्ट देखें ➔' : 'View Your Passport ➔'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  content: {
    margin: SPACING.lg,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.surface,
  },
  message: {
    color: COLORS.text,
    fontSize: 16,
    lineHeight: 22,
    marginBottom: SPACING.md,
  },
  note: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginBottom: SPACING.lg,
  },
  ctaButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
