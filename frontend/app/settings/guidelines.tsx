// accessibility: placeholder
import React, { useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, BackHandler } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SPACING } from '../../src/constants/theme';
import { useTranslation } from '../../src/utils/i18n';

const GUIDELINES = [
  {
    icon: 'heart',
    title: 'Respect Sanatan Dharma Traditions',
    description: 'Honor and respect the teachings, rituals, and traditions of Sanatan Dharma. This community is dedicated to preserving and promoting Hindu culture.',
  },
  {
    icon: 'ban',
    title: 'No Anti-Hindu or Abusive Content',
    description: 'Content that disrespects, mocks, or attacks Hindu religion, deities, scriptures, or practices is strictly prohibited.',
  },
  {
    icon: 'shield-checkmark',
    title: 'No Religious Attacks',
    description: 'Do not engage in attacks against any religion or religious community. Maintain harmony and mutual respect.',
  },
  {
    icon: 'home',
    title: 'Respect Temples and Devotees',
    description: 'Show respect to temples, priests, and fellow devotees. Do not share misleading or false information about temples.',
  },
  {
    icon: 'people',
    title: 'Follow Moderator Instructions',
    description: 'Community moderators help maintain a positive environment. Follow their guidance and decisions.',
  },
  {
    icon: 'chatbubble-ellipses',
    title: 'Constructive Communication',
    description: 'Engage in meaningful discussions. Avoid spam, harassment, and personal attacks against other members.',
  },
  {
    icon: 'document-text',
    title: 'Authentic Information',
    description: 'Share only verified and authentic information about events, temples, and religious matters.',
  },
  {
    icon: 'lock-closed',
    title: 'Privacy and Safety',
    description: "Respect others' privacy. Do not share personal information of other members without consent.",
  },
];

export default function GuidelinesScreen() {
  const { t } = useTranslation();
  const router = useRouter();

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

  const getGuidelineTranslation = (index: number) => {
    const hiData = [
      {
        title: 'सनातन धर्म परंपराओं का सम्मान करें',
        description: 'सनातन धर्म की शिक्षाओं, अनुष्ठानों और परंपराओं का आदर और सम्मान करें। यह समुदाय हिंदू संस्कृति के संरक्षण और प्रचार के लिए समर्पित है।',
      },
      {
        title: 'हिंदू विरोधी या अपमानजनक सामग्री नहीं',
        description: 'हिंदू धर्म, देवताओं, शास्त्रों या प्रथाओं का अनादर, मज़ाक उड़ाने या हमला करने वाली सामग्री सख्त वर्जित है।',
      },
      {
        title: 'धार्मिक हमले नहीं',
        description: 'किसी भी धर्म या धार्मिक समुदाय के खिलाफ हमलों में शामिल न हों। सद्भाव और आपसी सम्मान बनाए रखें।',
      },
      {
        title: 'मंदिरों और भक्तों का सम्मान करें',
        description: 'मंदिरों, पुजारियों और साथी भक्तों के प्रति सम्मान दिखाएं। मंदिरों के बारे में भ्रामक या गलत जानकारी साझा न करें।',
      },
      {
        title: 'मॉडरेटर के निर्देशों का पालन करें',
        description: 'समुदाय मॉडरेटर सकारात्मक माहौल बनाए रखने में मदद करते हैं। उनके मार्गदर्शन और निर्णयों का पालन करें।',
      },
      {
        title: 'सकारात्मक बातचीत',
        description: 'सार्थक चर्चाओं में शामिल हों। अन्य सदस्यों के खिलाफ स्पैम, उत्पीड़न और व्यक्तिगत हमलों से बचें।',
      },
      {
        title: 'प्रामाणिक जानकारी',
        description: 'आयोजनों, मंदिरों और धार्मिक मामलों के बारे में केवल सत्यापित और प्रामाणिक जानकारी साझा करें।',
      },
      {
        title: 'गोपनीयता और सुरक्षा',
        description: 'दूसरों की गोपनीयता का सम्मान करें। सहमति के बिना अन्य सदस्यों की व्यक्तिगत जानकारी साझा न करें।',
      },
    ];
    
    if (t('language') === 'hi') {
      return hiData[index] || GUIDELINES[index];
    }
    return GUIDELINES[index];
  };

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
          <Text style={styles.headerTitle}>
            {t('language') === 'hi' ? 'समुदाय के नियम' : 'Community Guidelines'}
          </Text>
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Main Borderless Transparent Pill Container */}
          <View style={styles.pillContainer}>
            {/* Introduction */}
            <View style={styles.introSection}>
              <Text style={styles.introTitle}>
                {t('language') === 'hi' ? 'ब्रह्मांड में आपका स्वागत है' : 'Welcome to Brahmand'}
              </Text>
              <Text style={styles.introText}>
                {t('language') === 'hi' 
                  ? 'ये नियम हमें सभी भक्तों के लिए एक सम्मानजनक और सकारात्मक समुदाय बनाए रखने में मदद करते हैं। ब्रह्मांड का उपयोग करके, आप इन नियमों का पालन करने के लिए सहमत हैं।' 
                  : 'These guidelines help us maintain a respectful and positive community for all devotees. By using Brahmand, you agree to follow these guidelines.'}
              </Text>
            </View>

            <View style={styles.divider} />

            {/* Guidelines List */}
            <View style={styles.guidelinesList}>
              {GUIDELINES.map((guideline, index) => {
                const translated = getGuidelineTranslation(index);
                return (
                  <React.Fragment key={index}>
                    <View style={styles.guidelineItem}>
                      <View style={styles.guidelineIcon}>
                        <Ionicons name={guideline.icon as any} size={20} color="#FF6F00" />
                      </View>
                      <View style={styles.guidelineContent}>
                        <Text style={styles.guidelineTitle}>{translated.title}</Text>
                        <Text style={styles.guidelineDescription}>{translated.description}</Text>
                      </View>
                    </View>
                    {index < GUIDELINES.length - 1 && <View style={styles.itemDivider} />}
                  </React.Fragment>
                );
              })}
            </View>

            <View style={styles.divider} />

            {/* Footer Note */}
            <View style={styles.footerBox}>
              <Ionicons name="information-circle" size={20} color="#EAB308" />
              <Text style={styles.footerText}>
                {t('language') === 'hi' 
                  ? 'इन नियमों के उल्लंघन के परिणामस्वरूप सामग्री को हटाया जा सकता है, खाता निलंबित किया जा सकता है, या स्थायी प्रतिबंध लगाया जा सकता है। यदि आप ऐसी सामग्री देखते हैं जो इन नियमों का उल्लंघन करती है, तो कृपया इसकी रिपोर्ट करें।' 
                  : 'Violation of these guidelines may result in content removal, account suspension, or permanent ban. If you see content that violates these guidelines, please report it.'}
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
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.xs,
    paddingBottom: SPACING.xl * 2.5,
  },
  pillContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    borderRadius: 24,
    padding: SPACING.lg,
  },
  introSection: {
    marginBottom: SPACING.xs,
  },
  introTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FF6F00',
    marginBottom: SPACING.xs,
  },
  introText: {
    fontSize: 13,
    color: 'rgba(0,0,0,0.65)',
    lineHeight: 20,
    fontWeight: '400',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
    marginVertical: SPACING.md,
  },
  guidelinesList: {
    marginVertical: SPACING.xs,
  },
  guidelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: SPACING.xs,
  },
  guidelineIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 111, 0, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
    marginTop: 2,
  },
  guidelineContent: {
    flex: 1,
  },
  guidelineTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  guidelineDescription: {
    fontSize: 12,
    color: 'rgba(0,0,0,0.55)',
    lineHeight: 18,
  },
  itemDivider: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    marginVertical: SPACING.sm,
  },
  footerBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 14,
    padding: SPACING.md,
  },
  footerText: {
    flex: 1,
    fontSize: 12,
    color: 'rgba(0,0,0,0.6)',
    marginLeft: SPACING.sm,
    lineHeight: 18,
  },
});
