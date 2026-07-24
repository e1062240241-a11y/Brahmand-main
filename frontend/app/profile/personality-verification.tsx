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
  Platform,
} from 'react-native';
import { useRouter , useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../src/store/authStore';
import { getProfile } from '../../src/services/api';
import { COLORS, SPACING, BORDER_RADIUS } from '../../src/constants/theme';
import { useTranslation } from '../../src/utils/i18n';

const { width } = Dimensions.get('window');

export default function PersonalityVerificationScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
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
    router.back();
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color="#2D2D2D" />
          </TouchableOpacity>
        </View>

        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
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
              source={require('../../assets/images/verification_hero.jpg')} 
              style={styles.illustration}
              resizeMode="contain"
            />
          </View>

          {/* Who can apply? Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {t('language') === 'hi' ? 'कौन आवेदन कर सकता है?' : 'Who can apply?'}
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

          {/* Benefits Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {t('language') === 'hi' ? 'राज्य / राष्ट्रीय समूह में शामिल होने के लाभ' : 'Benefits of Joining State / National Group'}
            </Text>
            
            <BenefitCard 
              icon="megaphone" 
              title={t('language') === 'hi' ? 'आपका संदेश सभी समूहों तक पहुंचेगा' : 'Your message will reach all groups'} 
              description={t('language') === 'hi' 
                ? 'यदि आप राज्य समूह का हिस्सा हैं, तो आपका संदेश राज्य भर के सभी शहर समूहों, क्षेत्र समूहों और सभी सदस्यों को दिखाई देगा।' 
                : 'If you are part of a State Group, your message will be visible to all City Groups, Area Groups and all members across the state.'}
            />
            
            <BenefitCard 
              icon="globe-outline" 
              title={t('language') === 'hi' ? 'व्यापक प्रभाव' : 'Wider Impact'} 
              description={t('language') === 'hi' 
                ? 'यदि आप राष्ट्रीय (भारत) समूह का हिस्सा हैं, तो आपका संदेश भारत भर के सभी राज्य समूहों और हर सदस्य तक पहुंचेगा।' 
                : 'If you are part of the National (India) Group, your message will reach all State Groups and every member across India.'}
            />
            
            <BenefitCard 
              icon="people" 
              title={t('language') === 'hi' ? 'विश्वास और विश्वसनीयता बनाएं' : 'Build Trust & Credibility'} 
              description={t('language') === 'hi' 
                ? 'सत्यापित हस्तियों को एक सत्यापित बैज मिलता है और लोग आपके संदेश पर अधिक भरोसा करते हैं।' 
                : 'Verified personalities get a verified badge and people trust your message more.'}
            />
            
            <BenefitCard 
              icon="heart" 
              title={t('language') === 'hi' ? 'सहयोग करें और बदलाव लाएं' : 'Collaborate & Create Change'} 
              description={t('language') === 'hi' 
                ? 'समान विचारधारा वाले नेताओं से जुड़ें और धर्म तथा समाज के लिए मिलकर काम करें।' 
                : 'Connect with like-minded leaders and work together for Dharma and society.'}
            />
          </View>

          {/* Footer Disclaimer */}
          <View style={styles.footerNotice}>
            <View style={styles.footerIconContainer}>
              <Ionicons name="shield-checkmark" size={24} color="#FF6600" />
            </View>
            <Text style={styles.footerText}>
              {t('language') === 'hi' 
                ? 'सभी आवेदनों की मैन्युअल रूप से समीक्षा की जाती है। गलत जानकारी देने से अस्वीकृति और खाते पर कार्रवाई हो सकती है।' 
                : 'All applications are manually reviewed. Providing false information may lead to rejection and account action.'}
            </Text>
          </View>

          <TouchableOpacity 
            style={styles.proceedButton}
            onPress={() => router.push('/profile/personality-application')}
          >
            <Text style={styles.proceedButtonText}>
              {t('language') === 'hi' ? 'आगे बढ़ें' : 'Proceed'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const CheckItem = ({ text }: { text: string }) => (
  <View style={styles.checkItem}>
    <View style={styles.checkIcon}>
      <Ionicons name="checkmark" size={14} color="#FFF" />
    </View>
    <Text style={styles.checkText}>{text}</Text>
  </View>
);

const BenefitCard = ({ icon, title, description }: { icon: any; title: string; description: string }) => (
  <View style={styles.benefitCard}>
    <View style={styles.benefitIconContainer}>
      <Ionicons name={icon} size={32} color="#FF6600" />
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
    backgroundColor: '#FFFBF7', // Matching the peach/cream background
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#3D1C10',
    textAlign: 'center',
    marginTop: 8,
    fontFamily: 'Inter_700Bold',
  },
  heroSubtitle: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 16,
    paddingHorizontal: 10,
    fontFamily: 'Inter_400Regular',
  },
  illustrationContainer: {
    width: '100%',
    height: 180,
    marginVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustration: {
    width: width * 0.8,
    height: '100%',
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2D2D2D',
    marginBottom: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  checklist: {
    gap: 12,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FF6600',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkText: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
    fontFamily: 'Inter_400Regular',
  },
  benefitCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    borderWidth: 1,
    borderColor: '#FFF1E8',
  },
  benefitIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#FFF7F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  benefitTextContent: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2D2D2D',
    marginBottom: 4,
    fontFamily: 'Inter_600SemiBold',
  },
  benefitDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    fontFamily: 'Inter_400Regular',
  },
  footerNotice: {
    flexDirection: 'row',
    backgroundColor: '#FFF4EB',
    padding: 16,
    borderRadius: 16,
    marginTop: 24,
    gap: 12,
    alignItems: 'center',
  },
  footerIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    flex: 1,
    fontSize: 12,
    color: '#7D4A26',
    lineHeight: 18,
    fontFamily: 'Inter_400Regular',
  },
  proceedButton: {
    backgroundColor: '#FF6600',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 32,
    shadowColor: '#FF6600',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  proceedButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
    fontFamily: 'Inter_600SemiBold',
  },
});
