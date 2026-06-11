import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Modal,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePersonalityStore } from '../../src/store/personalityStore';
import { COLORS, SPACING, BORDER_RADIUS } from '../../src/constants/theme';
import { useTranslation } from '../../src/utils/i18n';

const { width } = Dimensions.get('window');

export default function PersonalityBackgroundScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data, updateData } = usePersonalityStore();

  const [formData, setFormData] = useState({
    profession: data.profession,
    organization: data.organization,
    areas: data.areas,
    experience: data.experience,
    bio: data.bio,
  });

  const [errors, setErrors] = useState<any>({});
  const [showProfessionPicker, setShowProfessionPicker] = useState(false);

  // Sync with store if data hydrates after mount
  React.useEffect(() => {
    if (data.profession && !formData.profession) {
      setFormData({
        profession: data.profession,
        organization: data.organization,
        areas: data.areas,
        experience: data.experience,
        bio: data.bio,
      });
    }
  }, [data]);

  const professionOptions = [
    'Spiritual Guru / Acharya',
    'Social Worker / NGO Founder',
    'Educator / Author',
    'Doctor / Health Expert',
    'Artist / Cultural Icon',
    'Influencer / Speaker',
    'Other',
  ];

  const areaOptions = [
    'Spiritual / Religious',
    'Social Service',
    'Education',
    'Health / Medical',
    'Culture & Heritage',
    'Environment',
    'Other',
  ];

  const handleBack = () => {
    router.back();
  };

  const getProfessionText = (prof: string) => {
    const map: { [key: string]: string } = {
      'Spiritual Guru / Acharya': 'आध्यात्मिक गुरु / आचार्य',
      'Social Worker / NGO Founder': 'सामाजिक कार्यकर्ता / एनजीओ संस्थापक',
      'Educator / Author': 'शिक्षक / लेखक',
      'Doctor / Health Expert': 'डॉक्टर / स्वास्थ्य विशेषज्ञ',
      'Artist / Cultural Icon': 'कलाकार / सांस्कृतिक प्रतीक',
      'Influencer / Speaker': 'प्रभावशाली व्यक्ति / वक्ता',
      'Other': 'अन्य',
    };
    return t('language') === 'hi' ? (map[prof] || prof) : prof;
  };

  const getAreaText = (area: string) => {
    const map: { [key: string]: string } = {
      'Spiritual / Religious': 'आध्यात्मिक / धार्मिक',
      'Social Service': 'समाज सेवा',
      'Education': 'शिक्षा',
      'Health / Medical': 'स्वास्थ्य / चिकित्सा',
      'Culture & Heritage': 'संस्कृति और विरासत',
      'Environment': 'पर्यावरण',
      'Other': 'अन्य',
    };
    return t('language') === 'hi' ? (map[area] || area) : area;
  };

  const toggleArea = (area: string) => {
    if (formData.areas.includes(area)) {
      setFormData({ ...formData, areas: formData.areas.filter((a) => a !== area) });
    } else {
      setFormData({ ...formData, areas: [...formData.areas, area] });
    }
  };

  const validate = () => {
    const newErrors: any = {};
    const reqText = t('language') === 'hi' ? 'आवश्यक' : 'Required';
    if (!formData.profession) newErrors.profession = reqText;
    if (formData.areas.length === 0) newErrors.areas = reqText;
    if (!formData.experience) newErrors.experience = reqText;
    if (!formData.bio) newErrors.bio = reqText;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    if (validate()) {
      updateData(formData);
      router.push('/profile/personality-verification-docs');
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color="#2D2D2D" />
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.mainTitle}>
              {t('language') === 'hi' ? 'पहचान और पृष्ठभूमि' : 'Identity & Background'}
            </Text>
            <Text style={styles.subtitle}>
              {t('language') === 'hi' ? 'हमें अपने और अपने काम के बारे में अधिक बताएं।' : 'Tell us more about yourself and your work.'}
            </Text>

            <View style={styles.form}>
              {/* Profession / Role */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  {t('language') === 'hi' ? 'पेशा / भूमिका' : 'Profession / Role'} <Text style={styles.required}>*</Text>
                </Text>
                <TouchableOpacity
                  style={[styles.inputWrapper, errors.profession && styles.inputError]}
                  onPress={() => setShowProfessionPicker(true)}
                >
                  <Text style={[styles.inputText, !formData.profession && styles.placeholderText]}>
                    {getProfessionText(formData.profession) || (t('language') === 'hi' ? 'अपने पेशे / भूमिका का चयन करें' : 'Select your profession / role')}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#2D2D2D" />
                </TouchableOpacity>
              </View>

              {/* Organization */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  {t('language') === 'hi' ? 'संगठन / संस्था' : 'Organization / Institution'}{' '}
                  <Text style={styles.subLabel}>{t('language') === 'hi' ? '(यदि लागू हो)' : '(If applicable)'}</Text>
                </Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder={t('language') === 'hi' ? 'संगठन का नाम दर्ज करें' : 'Enter organization name'}
                    placeholderTextColor="#999"
                    value={formData.organization}
                    onChangeText={(val) => setFormData({ ...formData, organization: val })}
                  />
                </View>
              </View>

              {/* Area of Influence */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  {t('language') === 'hi' ? 'प्रभाव / कार्य का क्षेत्र' : 'Area of Influence / Work'} <Text style={styles.required}>*</Text>
                </Text>
                <Text style={styles.subLabel}>
                  {t('language') === 'hi' ? '(लागू होने वाले सभी का चयन करें)' : '(Select all that apply)'}
                </Text>
                <View style={styles.checkboxContainer}>
                  {areaOptions.map((option) => (
                    <TouchableOpacity
                      key={option}
                      style={styles.checkboxItem}
                      onPress={() => toggleArea(option)}
                    >
                      <View style={[
                        styles.checkbox,
                        formData.areas.includes(option) && styles.checkboxActive
                      ]}>
                        {formData.areas.includes(option) && (
                          <Ionicons name="checkmark" size={14} color="#FFF" />
                        )}
                      </View>
                      <Text style={styles.checkboxLabel}>{getAreaText(option)}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {errors.areas && (
                  <Text style={styles.errorText}>
                    {t('language') === 'hi' ? 'कृपया कम से कम एक क्षेत्र चुनें।' : 'Please select at least one area.'}
                  </Text>
                )}
              </View>

              {/* Years of Experience */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  {t('language') === 'hi' ? 'अनुभव / योगदान के वर्ष' : 'Years of Experience / Contribution'} <Text style={styles.required}>*</Text>
                </Text>
                <View style={[styles.inputWrapper, errors.experience && styles.inputError]}>
                  <TextInput
                    style={styles.input}
                    placeholder={t('language') === 'hi' ? 'अनुभव के वर्ष दर्ज करें' : 'Enter years of experience'}
                    placeholderTextColor="#999"
                    keyboardType="numeric"
                    value={formData.experience}
                    onChangeText={(val) => setFormData({ ...formData, experience: val })}
                  />
                </View>
              </View>

              {/* Brief About Yourself */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  {t('language') === 'hi' ? 'अपने बारे में संक्षेप में' : 'Brief About Yourself'} <Text style={styles.required}>*</Text>
                </Text>
                <View style={[styles.textAreaWrapper, errors.about && styles.inputError]}>
                  <TextInput
                    style={styles.textArea}
                    placeholder={t('language') === 'hi' ? 'अपनी यात्रा, काम और प्रभाव के बारे में एक संक्षिप्त नोट लिखें...' : 'Write a short note about your journey, work and impact...'}
                    placeholderTextColor="#999"
                    multiline
                    numberOfLines={6}
                    maxLength={500}
                    textAlignVertical="top"
                    value={formData.bio}
                    onChangeText={(val) => setFormData({ ...formData, bio: val })}
                  />
                  <Text style={styles.charCount}>{formData.bio.length}/500</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
              <Text style={styles.continueButtonText}>
                {t('language') === 'hi' ? 'जारी रखें' : 'Continue'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <SelectionModal
        visible={showProfessionPicker}
        onClose={() => setShowProfessionPicker(false)}
        options={professionOptions}
        onSelect={(val: string) => setFormData({ ...formData, profession: val })}
        title={t('language') === 'hi' ? 'पेशा चुनें' : 'Select Profession'}
        getOptionLabel={getProfessionText}
      />
    </View>
  );
}

const SelectionModal = ({ visible, onClose, options, onSelect, title, getOptionLabel }: any) => (
  <Modal visible={visible} transparent animationType="slide">
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{title}</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#2D2D2D" />
          </TouchableOpacity>
        </View>
        <FlatList
          data={options}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.optionItem}
              onPress={() => {
                onSelect(item);
                onClose();
              }}
            >
              <Text style={styles.optionText}>
                {getOptionLabel ? getOptionLabel(item) : item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>
    </View>
  </Modal>
);

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
    marginBottom: 32,
    fontFamily: 'Inter_400Regular',
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2D2D2D',
    fontFamily: 'Inter_600SemiBold',
  },
  subLabel: {
    fontSize: 13,
    color: '#666',
    fontWeight: '400',
    fontFamily: 'Inter_400Regular',
  },
  required: {
    color: '#FF6600',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#F0E8E0',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
  },
  textAreaWrapper: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#F0E8E0',
    borderRadius: 16,
    padding: 16,
    minHeight: 160,
  },
  inputError: {
    borderColor: '#FF4B4B',
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    color: '#2D2D2D',
    fontFamily: 'Inter_400Regular',
  },
  inputText: {
    flex: 1,
    fontSize: 15,
    color: '#2D2D2D',
    fontFamily: 'Inter_400Regular',
  },
  placeholderText: {
    color: '#999',
  },
  textArea: {
    flex: 1,
    fontSize: 15,
    color: '#2D2D2D',
    lineHeight: 22,
    fontFamily: 'Inter_400Regular',
  },
  charCount: {
    alignSelf: 'flex-end',
    fontSize: 12,
    color: '#999',
    marginTop: 8,
    fontFamily: 'Inter_400Regular',
  },
  checkboxContainer: {
    gap: 12,
    marginTop: 4,
  },
  checkboxItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  checkboxActive: {
    borderColor: '#FF6600',
    backgroundColor: '#FF6600',
  },
  checkboxLabel: {
    fontSize: 15,
    color: '#333',
    fontFamily: 'Inter_400Regular',
  },
  errorText: {
    color: '#FF4B4B',
    fontSize: 12,
    marginTop: 4,
    fontFamily: 'Inter_400Regular',
  },
  continueButton: {
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
  continueButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
    fontFamily: 'Inter_600SemiBold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: '60%',
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F0E8E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2D2D2D',
    fontFamily: 'Inter_600SemiBold',
  },
  optionItem: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
    fontFamily: 'Inter_400Regular',
  },
});
