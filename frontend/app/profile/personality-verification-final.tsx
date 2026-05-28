import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePersonalityStore } from '../../src/store/personalityStore';
import axios from 'axios'; // Import axios for API requests
import { API_URL } from '../../src/services/api';
import { COLORS } from '../../src/constants/theme';
import { useTranslation } from '../../src/utils/i18n';

const { width } = Dimensions.get('window');

export default function PersonalityFinalScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data, resetData } = usePersonalityStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleBack = () => router.back();

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const authToken = await AsyncStorage.getItem('auth_token');
      if (!authToken) throw new Error(t('language') === 'hi' ? 'सत्र समाप्त हो गया। कृपया पुनः लॉगिन करें।' : 'Session expired. Please login again.');

      // Final submission to backend
      console.log('[Final] Submitting application for user:', data.fullName);
      const response = await axios.post(`${API_URL}/api/user/personality-verification`, {
        level: data.level,
        full_name: data.fullName,
        dob: data.dob,
        gender: data.gender,
        mobile: data.mobile,
        email: data.email,
        city: data.city,
        profession: data.profession,
        organization: data.organization,
        areas: data.areas,
        experience: data.experience,
        bio: data.bio,
        doc_type: data.docType,
        front_url: data.frontUrl,
        back_url: data.backUrl,
        additional_urls: data.additionalUrls,
      }, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        timeout: 30000
      });

      console.log('[Final] Submission successful:', response.data);

      // Navigate directly to success screen instead of Alert
      router.replace('/profile/personality-verification-success');
    } catch (error: any) {
      console.error('[Final] Submission failed:', error);
      const errorMsg = error.response?.data?.detail || error.message || (t('language') === 'hi' ? 'आपका आवेदन सबमिट करते समय कुछ गलत हो गया।' : 'Something went wrong while submitting your application.');
      Alert.alert(t('language') === 'hi' ? 'सबमिशन विफल' : 'Submission Failed', errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { 
      icon: 'person-outline', 
      text: t('language') === 'hi' ? 'हम आपकी जानकारी सत्यापित करेंगे' : 'We will verify your information' 
    },
    { 
      icon: 'call-outline', 
      text: t('language') === 'hi' ? 'अतिरिक्त विवरण के लिए आपसे संपर्क किया जा सकता है' : 'You may be contacted for additional details' 
    },
    { 
      icon: 'shield-checkmark-outline', 
      text: t('language') === 'hi' ? 'आपके आवेदन की समीक्षा हमारी सत्यापन टीम द्वारा की जाएगी' : 'Your application will be reviewed by our verification team' 
    },
    { 
      icon: 'notifications-outline', 
      text: t('language') === 'hi' ? 'आपका आवेदन स्वीकृत होने पर आपको सूचित किया जाएगा' : 'You will be notified once your application is approved' 
    },
  ];

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color="#2D2D2D" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {/* Illustration - Slightly smaller and cleaner */}
          <View style={styles.illustrationContainer}>
            <Image 
              source={require('../../assets/images/verification_submit_illustration.jpg')} 
              style={styles.illustration}
              resizeMode="contain"
            />
          </View>

          {/* Title - Exact wording from reference */}
          <Text style={styles.mainTitle}>
            {t('language') === 'hi' ? 'सबमिट करने के बाद' : 'After you submit'}
          </Text>
          
          {/* List Items - Exact icons and spacing from reference */}
          <View style={styles.stepsContainer}>
            {steps.map((step, index) => (
              <View key={index} style={styles.stepRow}>
                <View style={styles.iconContainer}>
                  <Ionicons name={step.icon as any} size={18} color="#FF6600" />
                </View>
                <Text style={styles.stepText}>{step.text}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Footer Button - Matching reference */}
        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.submitButton, isSubmitting && styles.disabledButton]} 
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.submitButtonText}>
                {t('language') === 'hi' ? 'सबमिट करें और जारी रखें' : 'Submit & Continue'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFBF7',
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
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  illustrationContainer: {
    width: width * 0.65, // Reduced size
    height: width * 0.65,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  illustration: {
    width: '100%',
    height: '100%',
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#3D1C10',
    marginTop: 30,
    marginBottom: 40,
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
  },
  stepsContainer: {
    width: '100%',
    gap: 32,
    paddingHorizontal: 10,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconContainer: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    lineHeight: 20,
    fontFamily: 'Inter_500Medium',
  },
  footer: {
    padding: 24,
    paddingBottom: 40,
  },
  submitButton: {
    backgroundColor: '#FF6600',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#FF6600',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  disabledButton: {
    backgroundColor: '#FFCCAB',
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
    fontFamily: 'Inter_600SemiBold',
  },
});
