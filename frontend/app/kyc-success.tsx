import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  ScrollView,
  Platform,
  Share,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from '../src/utils/i18n';
import Svg, { Path } from 'react-native-svg';

import { ProfileCompletionCard } from '../src/components/ProfileCompletionCard';

const { width } = Dimensions.get('window');

export default function KYCSuccessScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { requestNo, returnUrl } = useLocalSearchParams<{ requestNo?: string; returnUrl?: string }>();

  const handleClose = () => {
    if (returnUrl) {
      router.replace(returnUrl as any);
    } else {
      router.replace('/(tabs)/vendor' as any);
    }
  };

  const handleViewRequest = () => {
    router.replace('/vendor/dashboard' as any);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: t('language') === 'hi' 
          ? 'मैंने ब्रह्मांड पर विक्रेता केवाईसी पंजीकरण पूरा कर लिया है!' 
          : 'I have successfully submitted my KYC details on Brahmand app!',
      });
    } catch (error) {
      console.warn(error);
    }
  };

  const isHindi = t('language') === 'hi';

  return (
    <LinearGradient
      colors={['#FF8D57', '#EA9B76', '#FFEEE5']}
      locations={[0, 0.0913, 0.25]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Completion Card (Replaces success animation) */}
          <ProfileCompletionCard
            progress={60}
            onEditProfile={() => router.push('/vendor/dashboard')}
          />

          {/* Title */}
          <Text style={styles.mainTitle}>
            {isHindi ? 'आपके विवरण सफलतापूर्वक सबमिट हो गए हैं' : 'You’re Details Have Been Submitted Successfully.'}
          </Text>
          
          {/* Subtitle */}
          <Text style={styles.subtitle}>
            {isHindi 
              ? 'सत्यापन पूरा होने पर आपको सूचित किया जाएगा।' 
              : 'You’ll be notified once when you’re verification is complete.'}
          </Text>

          {requestNo && (
            <View style={styles.requestNoBadge}>
              <Text style={styles.requestNoLabel}>
                {isHindi ? 'अनुरोध संख्या:' : 'Request ID:'}
              </Text>
              <Text style={styles.requestNoValue}>{requestNo}</Text>
            </View>
          )}

          {/* Info Card / Box */}
          <View style={styles.infoBox}>
            <Text style={styles.infoBoxTitle}>
              {isHindi ? 'क्या आप जानते हैं?' : 'Did you know ?'}
            </Text>
            <View style={styles.infoColumnsRow}>
              <View style={styles.infoColumn}>
                <Svg width={29} height={21} viewBox="0 0 29 21" fill="none" style={{ marginBottom: 4 }}>
                  <Path d="M28.6104 12.1988C28.1834 12.5146 27.5776 12.4293 27.2573 12.0082C26.0759 10.4427 24.2106 9.52321 22.2314 9.53078C21.8428 9.53074 21.4921 9.30129 21.341 8.94834C21.2396 8.7115 21.2396 8.44433 21.341 8.20748C21.4921 7.85453 21.8428 7.62508 22.2314 7.62504C24.4635 7.62485 25.8583 5.24255 24.7421 3.3369C23.6259 1.43125 20.8358 1.4315 19.7199 3.33734C19.5889 3.56119 19.4892 3.80152 19.4237 4.05178C19.2377 4.76238 18.3412 5.00798 17.8099 4.49388C17.5634 4.25527 17.4647 3.90513 17.5511 3.57534C18.4819 0.0244065 22.9627 -1.2015 25.6165 1.3687C27.5921 3.28205 27.5359 6.43755 25.4934 8.28133C26.8077 8.84233 27.9501 9.73257 28.8074 10.8636C29.1277 11.2857 29.0394 11.8841 28.6104 12.1988ZM22.1009 19.5359C22.5001 20.155 22.0698 20.9678 21.3265 20.9991C20.9522 21.0149 20.6025 20.816 20.4289 20.4888C17.7637 16.0397 11.2348 16.0397 8.56969 20.4888C8.22481 21.1388 7.29558 21.1769 6.89708 20.5575C6.69645 20.2456 6.69666 19.8476 6.89708 20.5575C6.69645 20.2456 6.69666 19.8476 6.89761 19.5359C7.83464 17.9487 9.26339 16.6996 10.9739 15.9722C7.42935 13.2967 8.15182 7.84158 12.2743 6.15301C16.3969 4.46445 20.8275 7.80884 20.2496 12.1729C20.0499 13.6806 19.2492 15.0478 18.0246 15.9722C19.7351 16.6996 21.1639 17.9487 22.1009 19.5359ZM14.4993 15.248C17.4754 15.2479 19.3355 12.0716 17.8473 9.53063C16.3591 6.98971 12.639 6.98987 11.1511 9.53093C10.8118 10.1103 10.6332 10.7675 10.6332 11.4365C10.6332 13.5416 12.364 15.2481 14.4993 15.248ZM7.73365 8.57791C7.73365 8.05166 7.30092 7.62504 6.76713 7.62504C4.53505 7.62485 3.14021 5.24255 4.25642 3.3369C5.37264 1.43125 8.16273 1.4315 9.2786 3.33734C9.40966 3.56119 9.50932 3.80152 9.57487 4.05178C9.76087 4.76238 10.6574 5.00798 11.1886 4.49388C11.4351 4.25527 11.5338 3.90513 11.4475 3.57534C10.5167 0.0244065 6.03583 -1.2015 3.382 1.3687C1.40641 3.28205 1.46262 6.43755 3.50512 8.28133C2.19221 8.84286 1.05103 9.73306 0.194799 10.8636C-0.252077 11.4504 0.112963 12.2941 0.851884 12.3823C1.19481 12.4232 1.53383 12.2806 1.74123 12.0082C2.92263 10.4427 4.7879 9.52321 6.76713 9.53078C7.30093 9.53081 7.73365 9.10418 7.73365 8.57791Z" fill="#FF7B00" />
                </Svg>
                <Text style={styles.infoColumnText}>
                  {isHindi ? 'केवाईसी सत्यापित और विश्वसनीय' : 'KYC Verified & Trusted'}
                </Text>
              </View>
              <View style={styles.infoColumn}>
                <Svg width={22} height={24} viewBox="0 0 22 24" fill="none" style={{ marginBottom: 4 }}>
                  <Path d="M20.1667 0H1.83334C0.820811 0 0 0.859611 0 1.91999V8.63998C0 14.9664 2.92417 18.8003 5.3774 20.9027C8.01968 23.1659 10.6482 23.9339 10.7628 23.9663C10.9204 24.0112 11.0865 24.0112 11.2441 23.9663C11.3586 23.9339 13.9837 23.1659 16.6295 20.9027C19.0758 18.8003 22 14.9664 22 8.63998V1.91999C22 0.859611 21.1792 0 20.1667 0ZM20.1667 8.63997C20.1667 13.0884 18.6015 16.6992 15.5146 19.3703C14.1708 20.5292 12.6426 21.431 11 22.0343C9.37888 21.4415 7.86952 20.5557 6.54042 19.4171C3.41687 16.7412 1.83334 13.116 1.83334 8.63998V1.91999H20.1667V8.63997ZM5.76813 12.1992C5.26888 11.6763 5.4973 10.7835 6.17929 10.5922C6.4958 10.5033 6.83351 10.5981 7.06521 10.8408L9.16667 13.0428L14.9348 7.00078C15.434 6.47793 16.2865 6.71715 16.4693 7.43137C16.5541 7.76284 16.4636 8.11652 16.2319 8.35918L9.8152 15.0792C9.45715 15.4546 8.87618 15.4546 8.51813 15.0792L5.76813 12.1992Z" fill="#FF7B00" />
                </Svg>
                <Text style={styles.infoColumnText}>
                  {isHindi ? 'ऑफ़र और सेवाओं का प्रचार करें' : 'Promote Offers & Services'}
                </Text>
              </View>
              <View style={styles.infoColumn}>
                <Svg width={23} height={21} viewBox="0 0 23 21" fill="none" style={{ marginBottom: 4 }}>
                  <Path d="M23 10.0785C22.9971 7.29672 20.7105 5.04233 17.8889 5.03944H13.6509C13.3411 5.02159 7.94139 4.64682 2.7994 0.395077C1.7951 -0.436507 0.254322 0.115623 0.026018 1.38891C0.0087827 1.48503 7.33418e-05 1.58244 0 1.68004V18.477C0.000174187 19.7701 1.42004 20.578 2.55575 19.9314C2.64179 19.8824 2.72332 19.8261 2.7994 19.7631C6.8212 16.4372 10.9985 15.484 12.7778 15.2174V18.5474C12.7771 19.1095 13.0616 19.6348 13.5359 19.9468L14.7072 20.7163C15.6837 21.3589 17.0113 20.858 17.3032 19.7368L18.5565 15.0798C21.0997 14.7462 22.9995 12.608 23 10.0785ZM1.7037 18.4697V1.68004C6.26217 5.44992 10.9282 6.4042 12.7778 6.63936V13.5135C10.9303 13.7529 6.26537 14.7051 1.7037 18.4697ZM15.6528 19.3095V19.3211L14.4815 18.5516V15.1176H16.7815L15.6528 19.3095ZM17.8889 13.4379H14.4815V6.71914H17.8889C20.5119 6.71779 22.1528 9.51646 20.8424 11.7567C20.2337 12.7975 19.1075 13.4386 17.8889 13.4379Z" fill="#FF7B00" />
                </Svg>
                <Text style={styles.infoColumnText}>
                  {isHindi ? 'समुदाय से जुड़ें' : 'Connect with Community'}
                </Text>
              </View>
            </View>
          </View>

          {/* Bottom Description Text */}
          <Text style={styles.bottomDescriptionText}>
            {isHindi 
              ? 'हम वर्तमान में बड़ी संख्या में पंजीकरण प्राप्त कर रहे हैं, लेकिन हर सनातनी व्यवसाय हमारे लिए महत्वपूर्ण है। कृपया हमें ब्रह्मांड पर आपके व्यवसाय को सत्यापित करने और प्रदर्शित करने के लिए कुछ दिनों का समय दें। आपके धैर्य और समर्थन के लिए धन्यवाद।' 
              : "We're currently receiving a large number of registrations, but every Sanatani business is important to us. Please allow us a few days to verify and feature your business on Brahmand. Thank you for your patience and support."}
          </Text>

          {/* Action Buttons Section */}
          <View style={styles.actionButtonsSection}>
            {/* View My Request Button */}
            <TouchableOpacity style={styles.primaryBtn} onPress={handleViewRequest}>
              <Text style={styles.primaryBtnText}>
                {isHindi ? 'मेरा अनुरोध देखें' : 'View My Request'}
              </Text>
            </TouchableOpacity>

            {/* Share Externally Button */}
            <TouchableOpacity style={styles.secondaryBtn} onPress={handleShare}>
              <Ionicons name="share-social-outline" size={20} color="#F97316" />
              <Text style={styles.secondaryBtnText}>
                {isHindi ? 'बाहर साझा करें' : 'Share Externally'}
              </Text>
            </TouchableOpacity>
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
  safeArea: {
    flex: 1,
  },
  floatingBackButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 12 : 16,
    left: 16,
    zIndex: 10,
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  illustrationContainer: {
    width: 320,
    height: 337,
    aspectRatio: 94 / 99,
    borderRadius: 18,
    backgroundColor: 'lightgray',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 0,
  },
  illustration: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
  },
  mainTitle: {
    color: '#4A2C2A',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro' : 'System',
    fontSize: 30,
    fontStyle: 'normal',
    fontWeight: '700',
    lineHeight: 37.5,
    marginTop: 10,
  },
  subtitle: {
    color: '#4B5563',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro' : 'System',
    fontSize: 18,
    fontStyle: 'normal',
    fontWeight: '400',
    lineHeight: 29.25,
    marginTop: 6,
  },
  primaryBtn: {
    width: Platform.OS === 'android' ? 320 : 361,
    height: Platform.OS === 'android' ? 48 : 56,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 45,
    backgroundColor: '#FF6600',
    shadowColor: '#FED7AA',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 15,
    elevation: 8,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 24,
    textAlign: 'center',
  },
  secondaryBtn: {
    width: Platform.OS === 'android' ? 320 : 361,
    height: Platform.OS === 'android' ? 48 : 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 45,
    borderWidth: 2,
    borderColor: '#F97316',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    gap: 8,
  },
  secondaryBtnText: {
    color: '#F97316',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 24,
    textAlign: 'center',
  },
  infoBox: {
    width: Platform.OS === 'android' ? 320 : 361,
    height: Platform.OS === 'android' ? 140 : 150,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF6601',
    backgroundColor: 'rgba(255, 255, 255, 0.30)',
    padding: Platform.OS === 'android' ? 12 : 16,
    marginTop: 12,
    alignSelf: 'center',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  infoBoxTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(0, 0, 0, 0.50)',
    textAlign: 'center',
    marginBottom: 10,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro' : 'System',
  },
  infoColumnsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flex: 1,
    paddingTop: 10,
  },
  infoColumn: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 4,
    gap: 8,
  },
  infoColumnText: {
    color: '#000000',
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 14,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  bottomDescriptionText: {
    color: '#4B5563',
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
    marginTop: 10,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  actionButtonsSection: {
    width: '100%',
    alignItems: 'center',
    gap: 16,
    marginBottom: 30,
  },
  requestNoBadge: {
    backgroundColor: '#FFF0E6',
    borderWidth: 1,
    borderColor: '#FFD3B6',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  requestNoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D25F27',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  requestNoValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FF6600',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
});
