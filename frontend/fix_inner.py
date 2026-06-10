import os

filepath = "/Users/Developer/Desktop/Brahmand-main/frontend/app/passport/inner.tsx"

with open(filepath, 'w') as f:
    f.write('''import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { usePassportStore } from '../../src/store/passportStore';
import withObservables from '@nozbe/with-observables';
import { database } from '../../src/database';
import { Ionicons } from '@expo/vector-icons';
import { formatDateIST } from '../../src/utils/dateUtils';

const { width: windowWidth } = Dimensions.get('window');

function PassportInnerScreen({
  observedJourneys,
  observedBadges,
}: {
  observedJourneys: any[];
  observedBadges: any[];
}) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const totalJaap = usePassportStore((state) => state.total_jaap);
  const loadPassport = usePassportStore((state) => state.loadPassport);

  useEffect(() => {
    loadPassport();
  }, []);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/passport' as any);
    }
  };

  const journeysCount = observedJourneys.length;
  const jaapCount = totalJaap || 0;
  const badgesCount = observedBadges.length;

  const userPhoto = user?.photo || 'https://images.unsplash.com/photo-1517292987719-0369a794ec0f?auto=format&fit=crop&w=500&q=80';
  const userNameEnglish = (user?.name || 'Sanatani').toUpperCase();
  const userNameHindi = user?.name_hindi || userNameEnglish;
  const dob = user?.dob ? formatDateIST(user.dob) : '-';
  const sex = user?.gender ? user.gender.charAt(0).toUpperCase() : '-';
  const sexHindi = sex === 'M' ? 'पुरुष' : sex === 'F' ? 'महिला' : '-';
  const placeOfBirth = user?.place_of_birth || '-';
  const placeOfBirthHindi = user?.place_of_birth_hindi || placeOfBirth;
  const passportId = user?.brahmand_id || '456712340098'; // Fallback if no ID is available
  const firstName = user?.name ? user.name.split(' ')[0].toUpperCase() : 'SANATANI';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#FFF5F1' }]} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Passport</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Top Card: Identity Card Page */}
        <View style={styles.idCard}>
          <Text style={styles.cardTitleHindi}>ब्रह्मांड पासपोर्ट</Text>
          <Text style={styles.cardTitleEnglish}>BRAHMAND PASSPORT</Text>

          <View style={styles.gridContainer}>
            {/* Left Fields Column */}
            <View style={styles.leftColumn}>
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>कंट्री कोड / COUNTRY CODE</Text>
                <Text style={styles.fieldValue}>IND</Text>
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>राष्ट्रीय पहचान / BRAHMAND ID</Text>
                <Text style={styles.fieldValue}>{passportId}</Text>
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>पूरा नाम / FULL NAME</Text>
                <Text style={styles.fieldValueHindi}>{userNameHindi}</Text>
                <Text style={styles.fieldValueEnglish}>{userNameEnglish}</Text>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <View>
                  <Text style={styles.fieldLabel}>जन्म तिथि</Text>
                  <Text style={styles.fieldLabel}>DATE OF BIRTH</Text>
                  <Text style={styles.fieldValue}>{dob}</Text>
                </View>
                <View style={{ marginRight: 32 }}>
                  <Text style={styles.fieldLabel}>लिंग / SEX</Text>
                  <Text style={styles.fieldValueHindi}>{sexHindi}</Text>
                  <Text style={styles.fieldValueEnglish}>{sex}</Text>
                </View>
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>राष्ट्रीयता / NATIONALITY</Text>
                <Text style={styles.fieldValueHindi}>भारतीय</Text>
                <Text style={styles.fieldValueEnglish}>INDIAN</Text>
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>जन्म स्थान / PLACE OF BIRTH</Text>
                <Text style={styles.fieldValueHindi}>{placeOfBirthHindi}</Text>
                <Text style={styles.fieldValueEnglish}>{placeOfBirth.toUpperCase()}</Text>
              </View>
            </View>

            {/* Right Photo Column */}
            <View style={styles.rightColumn}>
              <View style={styles.photoContainer}>
                <Image source={{ uri: userPhoto }} style={styles.photo} contentFit="cover" />
              </View>

              <View style={styles.signatureContainer}>
                <Text style={styles.signatureLabel}>{firstName} | SIGNATURE</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Bottom Card: Spiritual Record */}
        <View style={styles.spiritualRecordCard}>
          <Text style={styles.recordTitle}>SPIRITUAL RECORD</Text>
          
          <View style={styles.recordGrid}>
            <View style={styles.recordCol}>
              <Text style={styles.recordLabel}>Total Journeys</Text>
              <Text style={styles.recordValue}>{journeysCount}</Text>
            </View>
            
            <View style={styles.recordDivider} />

            <View style={styles.recordCol}>
              <Text style={styles.recordLabel}>Jaap Count's</Text>
              <Text style={styles.recordValue}>{jaapCount}</Text>
            </View>
            
            <View style={styles.recordDivider} />

            <View style={styles.recordCol}>
              <Text style={styles.recordLabel}>Earned Badges</Text>
              <Text style={styles.recordValue}>{badgesCount}</Text>
            </View>
          </View>
        </View>

        {/* Navigation Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.primaryButton}
            activeOpacity={0.8}
            onPress={() => router.push('/passport/timeline' as any)}
          >
            <Text style={styles.primaryButtonText}>Turn Page &amp; View Stamps</Text>
            <Ionicons name="arrow-forward" size={12} color="#000" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.secondaryButton}
            activeOpacity={0.8}
            onPress={() => router.push('/passport/journey/new' as any)}
          >
            <Ionicons name="add-circle-outline" size={13} color="#000" style={{ marginRight: 6 }} />
            <Text style={styles.secondaryButtonText}>Log a New Journey</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF5F1',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 56,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 40,
    alignItems: 'center',
  },
  idCard: {
    width: 361,
    maxWidth: '100%',
    backgroundColor: '#FFF5F1',
    borderRadius: 15,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.50,
    shadowRadius: 14,
    elevation: 8,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.10)',
  },
  cardTitleHindi: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
  },
  cardTitleEnglish: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
    marginBottom: 16,
  },
  gridContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  leftColumn: {
    width: '65%',
  },
  rightColumn: {
    width: '32%',
    alignItems: 'flex-end',
  },
  fieldContainer: {
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 5,
    color: '#000',
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  fieldValue: {
    fontSize: 12,
    color: '#000',
    fontWeight: '700',
    marginTop: 2,
  },
  fieldValueHindi: {
    fontSize: 11,
    color: '#000',
    fontWeight: '700',
    marginTop: 2,
  },
  fieldValueEnglish: {
    fontSize: 11,
    color: '#000',
    fontWeight: '700',
  },
  photoContainer: {
    width: 73,
    height: 89,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: '#E5DDC7',
    marginBottom: 4,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  signatureContainer: {
    width: 73,
    alignItems: 'center',
  },
  signatureLabel: {
    fontSize: 6,
    color: '#000',
    fontWeight: '700',
    marginTop: 2,
    textAlign: 'center',
  },
  spiritualRecordCard: {
    width: 361,
    maxWidth: '100%',
    height: 111,
    backgroundColor: '#FFF5F1',
    borderRadius: 15,
    paddingTop: 17,
    paddingBottom: 22,
    paddingRight: 11,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.50,
    shadowRadius: 14,
    elevation: 8,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.10)',
  },
  recordTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
    marginBottom: 16,
  },
  recordGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recordCol: {
    flex: 1,
    alignItems: 'center',
  },
  recordDivider: {
    width: 1,
    height: 43,
    backgroundColor: 'rgba(0, 0, 0, 0.10)',
  },
  recordLabel: {
    fontSize: 10,
    color: '#000',
    fontWeight: '700',
    marginBottom: 6,
  },
  recordValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000',
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 10,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: 277,
    height: 52,
    backgroundColor: '#FFF',
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.10)',
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    marginRight: 6,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: 277,
    height: 51,
    backgroundColor: '#FFF',
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.10)',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
});

const enhance = withObservables([], () => ({
  observedJourneys: database.get('passport_journeys').query().observe(),
  observedBadges: database.get('passport_badges').query().observe(),
}));

export default enhance(PassportInnerScreen);
''')
