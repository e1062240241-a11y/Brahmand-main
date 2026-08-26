// accessibility: placeholder
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../src/store/authStore';
import { getProfile } from '../../src/services/api';
import { SPACING } from '../../src/constants/theme';
import { useTranslation } from '../../src/utils/i18n';

const { width } = Dimensions.get('window');

export default function PersonalityVerificationScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, setUser } = useAuthStore();

  useFocusEffect(
    React.useCallback(() => {
      const refreshProfile = async () => {
        try {
          const res = await getProfile();
          if (res.data) {
            setUser(res.data);
          }
        } catch (err) {
          console.error('Failed to refresh profile:', err);
        }
      };
      refreshProfile();
    }, [])
  );

  React.useEffect(() => {
    const status = user?.personality_verification_status;
    if (status === 'pending' || status === 'approved') {
      router.replace('/profile/personality-verification-success');
    }
  }, [user?.personality_verification_status]);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/profile');
    }
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
          <TouchableOpacity onPress={handleBack} style={styles.backButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {t('language') === 'hi' ? 'व्यक्तित्व सत्यापन' : 'Personality Verification'}
          </Text>
        </View>

        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Main Borderless Transparent Pill Container */}
          <View style={styles.pillContainer}>

            {/* Main Title */}
            <Text style={styles.mainTitle}>
              {t('language') === 'hi' ? 'कौन आवेदन कर सकता है?' : 'Who can apply?'}
            </Text>
            
            {/* Hero Subtitle */}
            <Text style={styles.heroSubtitle}>
              {t('language') === 'hi' 
                ? 'राज्य और राष्ट्रीय समूह उन सत्यापित सनातन हस्तियों के लिए हैं जिनका समाज में सकारात्मक प्रभाव है।' 
                : 'State and National groups are for verified Sanatan personalities who have a positive impact in society.'}
            </Text>

            {/* Hero Illustration */}
            <View style={styles.illustrationContainer}>
              <Image 
                source={{ uri: 'https://brahmandfeed23.b-cdn.net/assets/verification_hero.webp' }} 
                style={styles.illustration}
                resizeMode="contain"
              />
            </View>

            <View style={styles.divider} />

            {/* Who can apply? Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {t('language') === 'hi' ? 'पात्रता सूची' : 'Eligibility Criteria'}
              </Text>
              
              <View style={styles.checklist}>
                <CheckItem text={t('language') === 'hi' ? 'आध्यात्मिक गुरु, आचार्य, वक्ता' : 'Spiritual Gurus, Acharyas, Speakers'} />
                <CheckItem text={t('language') === 'hi' ? 'सामाजिक कार्यकर्ता, एनजीओ संस्थापक' : 'Social Workers, NGO Founders'} />
                <CheckItem text={t('language') === 'hi' ? 'शिक्षक, लेखक, विचारक' : 'Educators, Authors, Thinkers'} />
                <CheckItem text={t('language') === 'hi' ? 'डॉक्टर, पर्यावरण और स्वास्थ्य विशेषज्ञ' : 'Doctors, Environment & Health Experts'} />
                <CheckItem text={t('language') === 'hi' ? 'कलाकार, सांस्कृतिक प्रतीक, प्रभावशाली व्यक्ति' : 'Artists, Cultural Icons, Influencers'} />
                <CheckItem text={t('language') === 'hi' ? 'समाज में सकारात्मक प्रभाव डालने वाला कोई भी व्यक्ति' : 'Any personality with positive impact in society'} />
              </View>
            </View>

            <View style={styles.divider} />

            {/* Benefits Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {t('language') === 'hi' ? 'राज्य / राष्ट्रीय समूह के लाभ' : 'Benefits of Joining State / National Group'}
              </Text>
              
              <View style={styles.benefitsList}>
                <BenefitCard 
                  icon="megaphone" 
                  title={t('language') === 'hi' ? 'आपका संदेश सभी समूहों तक पहुंचेगा' : 'Your message will reach all groups'} 
                  description={t('language') === 'hi' 
                    ? 'यदि आप राज्य समूह का हिस्सा हैं, तो आपका संदेश राज्य भर के सभी शहर समूहों, क्षेत्र समूहों और सभी सदस्यों को दिखाई देगा।' 
                    : 'If you are part of a State Group, your message will be visible to all City Groups, Area Groups and all members across the state.'}
                />
                <View style={styles.itemDivider} />
                
                <BenefitCard 
                  icon="globe-outline" 
                  title={t('language') === 'hi' ? 'व्यापक प्रभाव' : 'Wider Impact'} 
                  description={t('language') === 'hi' 
                    ? 'यदि आप राष्ट्रीय (भारत) समूह का हिस्सा हैं, तो आपका संदेश भारत भर के सभी राज्य समूहों और हर सदस्य तक पहुंचेगा।' 
                    : 'If you are part of the National (India) Group, your message will reach all State Groups and every member across India.'}
                />
                <View style={styles.itemDivider} />
                
                <BenefitCard 
                  icon="people" 
                  title={t('language') === 'hi' ? 'विश्वास और विश्वसनीयता बनाएं' : 'Build Trust & Credibility'} 
                  description={t('language') === 'hi' 
                    ? 'सत्यापित हस्तियों को एक सत्यापित बैज मिलता है और लोग आपके संदेश पर अधिक भरोसा करते हैं।' 
                    : 'Verified personalities get a verified badge and people trust your message more.'}
                />
                <View style={styles.itemDivider} />
                
                <BenefitCard 
                  icon="heart" 
                  title={t('language') === 'hi' ? 'सहयोग करें और बदलाव लाएं' : 'Collaborate & Create Change'} 
                  description={t('language') === 'hi' 
                    ? 'समान विचारधारा वाले नेताओं से जुड़ें और धर्म तथा समाज के लिए मिलकर काम करें।' 
                    : 'Connect with like-minded leaders and work together for Dharma and society.'}
                />
              </View>
            </View>

            <View style={styles.divider} />

            {/* Footer Disclaimer */}
            <View style={styles.footerNotice}>
              <Ionicons name="shield-checkmark" size={22} color="#FF6F00" />
              <Text style={styles.footerText}>
                {t('language') === 'hi' 
                  ? 'सभी आवेदनों की मैन्युअल रूप से समीक्षा की जाती है। गलत जानकारी देने से अस्वीकृति और खाते पर कार्रवाई हो सकती है।' 
                  : 'All applications are manually reviewed. Providing false information may lead to rejection and account action.'}
              </Text>
            </View>

            {/* Proceed Button */}
            <TouchableOpacity 
              style={styles.proceedButton}
              activeOpacity={0.8}
              onPress={() => router.push('/profile/personality-application')}
            >
              <Text style={styles.proceedButtonText}>
                {t('language') === 'hi' ? 'आगे बढ़ें' : 'Proceed'}
              </Text>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
            </TouchableOpacity>

          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const CheckItem = ({ text }: { text: string }) => (
  <View style={styles.checkItem}>
    <View style={styles.checkIcon}>
      <Ionicons name="checkmark" size={12} color="#FFF" />
    </View>
    <Text style={styles.checkText}>{text}</Text>
  </View>
);

const BenefitCard = ({ icon, title, description }: { icon: any; title: string; description: string }) => (
  <View style={styles.benefitCard}>
    <View style={styles.benefitIconContainer}>
      <Ionicons name={icon} size={22} color="#FF6F00" />
    </View>
    <View style={styles.benefitTextContent}>
      <Text style={styles.benefitTitle}>{title}</Text>
      <Text style={styles.benefitDescription}>{description}</Text>
    </View>
  </View>
);

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
    color: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.xs,
    paddingBottom: SPACING.xl * 2.5,
  },
  pillContainer: {
    backgroundColor: 'transparent',
    borderRadius: 24,
    padding: SPACING.sm,
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1F2937',
    textAlign: 'center',
    marginTop: 4,
  },
  heroSubtitle: {
    fontSize: 13,
    color: 'rgba(0,0,0,0.6)',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 8,
    paddingHorizontal: 8,
  },
  illustrationContainer: {
    width: '100%',
    height: 150,
    marginVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustration: {
    width: width * 0.7,
    height: '100%',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
    marginVertical: SPACING.md,
  },
  section: {
    marginVertical: SPACING.xs,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(0,0,0,0.5)',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: SPACING.sm,
  },
  checklist: {
    gap: 10,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FF6F00',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
    flex: 1,
  },
  benefitsList: {
    marginVertical: SPACING.xs,
  },
  benefitCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: SPACING.xs,
  },
  benefitIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 111, 0, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
    marginTop: 2,
  },
  benefitTextContent: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  benefitDescription: {
    fontSize: 12,
    color: 'rgba(0,0,0,0.55)',
    lineHeight: 17,
  },
  itemDivider: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    marginVertical: SPACING.sm,
  },
  footerNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'transparent',
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
  proceedButton: {
    backgroundColor: '#FF6F00',
    borderRadius: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  proceedButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
