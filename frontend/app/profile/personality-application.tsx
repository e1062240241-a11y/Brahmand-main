// accessibility: placeholder
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePersonalityStore } from '../../src/store/personalityStore';
import { COLORS, SPACING, BORDER_RADIUS } from '../../src/constants/theme';
import { useTranslation } from '../../src/utils/i18n';

const { width } = Dimensions.get('window');

export default function PersonalityApplicationScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data, updateData } = usePersonalityStore();
  const [selectedLevel, setSelectedLevel] = useState<'state' | 'national' | null>(data.level);

  const handleBack = () => {
    router.back();
  };

  const handleStartApplication = () => {
    if (!selectedLevel) {
      Alert.alert(
        t('language') === 'hi' ? 'चयन आवश्यक है' : 'Selection Required', 
        t('language') === 'hi' ? 'कृपया आवेदन करने के लिए एक समूह स्तर चुनें।' : 'Please choose a group level to apply for.'
      );
      return;
    }
    updateData({ level: selectedLevel });
    router.push('/profile/personality-details');
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
            {t('language') === 'hi' ? 'सत्यापित व्यक्तित्व के लिए आवेदन करें' : 'Apply for Verified Personality'}
          </Text>
          
          {/* Subtitle */}
          <Text style={styles.subtitle}>
            {t('language') === 'hi' ? 'उस समूह स्तर का चयन करें जिसके लिए आप आवेदन करना चाहते हैं।' : 'Choose the group level you want to apply for.'}
          </Text>

          {/* Level Options */}
          <View style={styles.optionsContainer}>
            <TouchableOpacity 
              style={[
                styles.optionCard, 
                selectedLevel === 'state' && styles.selectedOptionCard
              ]}
              onPress={() => setSelectedLevel('state')}
              activeOpacity={0.7}
            >
              <View style={styles.optionHeader}>
                <View style={styles.iconCircle}>
                  <Image 
                    source={require('../../assets/images/state_personality_icon.webp')} 
                    style={styles.levelIcon}
                    resizeMode="contain"
                  />
                </View>
                <View style={[
                  styles.radioButton,
                  selectedLevel === 'state' && styles.radioButtonActive
                ]}>
                  {selectedLevel === 'state' && <View style={styles.radioInner} />}
                </View>
              </View>
              
              <Text style={styles.optionTitle}>
                {t('language') === 'hi' ? 'राज्य स्तर का व्यक्तित्व' : 'State Level Personality'}
              </Text>
              <Text style={styles.optionDescription}>
                {t('language') === 'hi' 
                  ? 'आपका संदेश पूरे राज्य में सभी शहर समूहों, क्षेत्र समूहों और सदस्यों को दिखाई देगा।' 
                  : 'Your message will be visible to all City Groups, Area Groups and members across the entire state.'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[
                styles.optionCard, 
                selectedLevel === 'national' && styles.selectedOptionCard
              ]}
              onPress={() => setSelectedLevel('national')}
              activeOpacity={0.7}
            >
              <View style={styles.optionHeader}>
                <View style={[styles.iconCircle, { backgroundColor: '#FFF7F1' }]}>
                  <Ionicons name="globe-outline" size={36} color="#FF6600" />
                </View>
                <View style={[
                  styles.radioButton,
                  selectedLevel === 'national' && styles.radioButtonActive
                ]}>
                  {selectedLevel === 'national' && <View style={styles.radioInner} />}
                </View>
              </View>
              
              <Text style={styles.optionTitle}>
                {t('language') === 'hi' ? 'राष्ट्रीय (भारत) स्तर का व्यक्तित्व' : 'National (India) Level Personality'}
              </Text>
              <Text style={styles.optionDescription}>
                {t('language') === 'hi' 
                  ? 'आपका संदेश भारत भर के सभी राज्य समूहों और हर सदस्य तक पहुंचेगा।' 
                  : 'Your message will be visible to all State Groups and every member across India.'}
              </Text>
            </TouchableOpacity>
          </View>


          {/* Footer Action */}
          <TouchableOpacity 
            style={[
              styles.actionButton,
              !selectedLevel && styles.actionButtonDisabled
            ]}
            onPress={handleStartApplication}
          >
            <Text style={styles.actionButtonText}>
              {t('language') === 'hi' ? 'आवेदन शुरू करें' : 'Start Application'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
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
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  mainTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#3D1C10',
    marginTop: 8,
    fontFamily: 'Inter_700Bold',
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    marginTop: 12,
    fontFamily: 'Inter_400Regular',
  },
  optionsContainer: {
    marginTop: 32,
    gap: 20,
  },
  optionCard: {
    backgroundColor: 'transparent',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  selectedOptionCard: {
    borderColor: '#FF6600',
    backgroundColor: 'transparent',
  },
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFF1E8',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  levelIcon: {
    width: '100%',
    height: '100%',
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  radioButtonActive: {
    borderColor: '#FF6600',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF6600',
  },
  optionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#2D2D2D',
    marginBottom: 8,
    fontFamily: 'Inter_600SemiBold',
  },
  optionDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    fontFamily: 'Inter_400Regular',
  },
  noteBox: {
    backgroundColor: '#FFF4EB',
    padding: 20,
    borderRadius: 20,
    marginTop: 32,
  },
  noteTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#AF4F0B',
    marginBottom: 6,
    fontFamily: 'Inter_600SemiBold',
  },
  noteText: {
    fontSize: 14,
    color: '#7D4A26',
    lineHeight: 20,
    fontFamily: 'Inter_400Regular',
  },
  actionButton: {
    backgroundColor: '#FF6600',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 40,
    shadowColor: '#FF6600',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  actionButtonDisabled: {
    backgroundColor: '#FFCCAB',
    shadowOpacity: 0,
    elevation: 0,
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
    fontFamily: 'Inter_600SemiBold',
  },
});
