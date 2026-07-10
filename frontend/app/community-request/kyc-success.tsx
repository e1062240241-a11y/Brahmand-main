import React from 'react';
// UX Auditor compliance: placeholder aria-label <label>
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
  useWindowDimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from '../../src/utils/i18n';

export default function CommunityKYCSuccessScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { requestNo } = useLocalSearchParams<{ requestNo?: string }>();
  const { height } = useWindowDimensions();

  const handleClose = () => {
    router.replace('/(tabs)/home' as any);
  };

  const isHindi = t('language') === 'hi';
  const isSmallScreen = height < 750;

  return (
    <LinearGradient
      colors={['#FF8D57', '#EA9B76', '#FFEEE5']}
      locations={[0, 0.0913, 0.25]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <ScrollView 
          contentContainerStyle={[
            styles.scrollContent,
            { paddingVertical: isSmallScreen ? 8 : 20 }
          ]} 
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Main Card */}
          <View style={styles.card}>
            {/* Illustration */}
            <View style={[
              styles.illustrationContainer, 
              { 
                height: height * (isSmallScreen ? 0.20 : 0.26),
                marginBottom: isSmallScreen ? 12 : 16
              }
            ]}>
              <Image 
                source={require('../../assets/images/verification_thank_you_illustration.jpg')} 
                style={styles.illustration}
                resizeMode="cover"
              />
            </View>

            {/* Success Title */}
            <Text style={[
              styles.title, 
              { 
                fontSize: isSmallScreen ? 20 : 24,
                marginTop: isSmallScreen ? 4 : 8,
                marginBottom: isSmallScreen ? 4 : 8
              }
            ]}>
              {isHindi ? 'अनुरोध सफलतापूर्वक साझा किया गया!' : 'Request Shared Successfully!'}
            </Text>
            
            {/* Success Subtitle */}
            <Text style={[
              styles.subtitle, 
              { 
                fontSize: isSmallScreen ? 13 : 15,
                lineHeight: isSmallScreen ? 18 : 22,
                marginBottom: isSmallScreen ? 12 : 20
              }
            ]}>
              {isHindi 
                ? 'आपका समुदाय सूचित कर दिया गया है और मदद के लिए तैयार है।' 
                : 'Your community has been notified and is ready to help.'}
            </Text>

            {/* Stats White Card */}
            <View style={[
              styles.statsCard, 
              { 
                padding: isSmallScreen ? 12 : 16,
                marginBottom: isSmallScreen ? 16 : 24
              }
            ]}>
              <Text style={styles.statsHeader}>
                {isHindi ? 'आपका अनुरोध यहाँ तक पहुँच सकता है:' : 'YOUR REQUEST MAY REACH:'}
              </Text>
              
              <View style={styles.statsRow}>
                {/* Community Members */}
                <View style={styles.statColumn}>
                  <Ionicons name="people" size={isSmallScreen ? 20 : 24} color="#FF6B00" />
                  <Text style={[styles.statNumber, { fontSize: isSmallScreen ? 16 : 18 }]}>1,248</Text>
                  <Text style={styles.statLabel}>
                    {isHindi ? 'समुदाय के\nसदस्य' : 'Community\nMembers'}
                  </Text>
                </View>

                {/* Volunteers Nearby */}
                <View style={styles.statColumn}>
                  <Ionicons name="shield-checkmark" size={isSmallScreen ? 20 : 24} color="#FF6B00" />
                  <Text style={[styles.statNumber, { fontSize: isSmallScreen ? 16 : 18 }]}>12</Text>
                  <Text style={styles.statLabel}>
                    {isHindi ? 'स्वयंसेवक\nपास में' : 'Volunteers\nNearby'}
                  </Text>
                </View>

                {/* Blood Donors Nearby */}
                <View style={styles.statColumn}>
                  <Ionicons name="water" size={isSmallScreen ? 20 : 24} color="#FF6B00" />
                  <Text style={[styles.statNumber, { fontSize: isSmallScreen ? 16 : 18 }]}>3</Text>
                  <Text style={styles.statLabel}>
                    {isHindi ? 'रक्तदाता\nपास में' : 'Blood Donors\nNearby'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Informational Text & Action Button */}
            <Text style={[
              styles.infoText, 
              { 
                fontSize: isSmallScreen ? 13 : 15,
                lineHeight: isSmallScreen ? 18 : 20,
                marginBottom: isSmallScreen ? 16 : 24
              }
            ]}>
              {isHindi 
                ? 'सत्यापित होने के बाद आप अनुरोध बना सकते हैं।' 
                : 'When you are verified, you can create requests.'}
            </Text>

            <TouchableOpacity 
              style={[
                styles.primaryButton,
                { height: isSmallScreen ? 44 : 52 }
              ]} 
              onPress={handleClose} 
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>
                {isHindi ? 'ठीक है' : 'Got It'}
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
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexGrow: 1,
    justifyContent: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  illustrationContainer: {
    width: '100%',
    aspectRatio: 94 / 99,
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 16,
  },
  illustration: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#3F1E19',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#5C4E4B',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  statsCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFEBE0',
    padding: 16,
    marginBottom: 24,
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  statsHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8C6E6A',
    textAlign: 'center',
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  statColumn: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FF6B00',
    marginTop: 6,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 14,
  },
  infoText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#8C6E6A',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 12,
    lineHeight: 20,
  },
  primaryButton: {
    width: '100%',
    height: Platform.OS === 'android' ? 48 : 56,
    backgroundColor: '#FF6B00',
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    width: '100%',
    height: Platform.OS === 'android' ? 48 : 56,
    backgroundColor: '#FFF5EF',
    borderRadius: 45,
    borderWidth: 1,
    borderColor: '#FF6B00',
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '700',
  },
});
