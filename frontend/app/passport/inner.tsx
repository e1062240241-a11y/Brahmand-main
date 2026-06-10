import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { usePassportStore } from '../../src/store/passportStore';
import { usePersonalityStore } from '../../src/store/personalityStore';
import { getUserProfile } from '../../src/services/api';
import withObservables from '@nozbe/with-observables';
import { database } from '../../src/database';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width: windowWidth } = Dimensions.get('window');

function PassportInnerScreen({
  observedJourneys,
  observedBadges,
  observedCertificates,
}: {
  observedJourneys: any[];
  observedBadges: any[];
  observedCertificates: any[];
}) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  const totalJaap = usePassportStore((state) => state.total_jaap);
  const loadPassport = usePassportStore((state) => state.loadPassport);
  const personalityData = usePersonalityStore((state) => state.data);

  // Guarantee local reactivity to avoid HOC caching / stale state on first render
  const [localUser, setLocalUser] = React.useState<any>(user);

  useEffect(() => {
    loadPassport();

    const fetchLatest = async () => {
      try {
        const res = await getUserProfile();
        if (res.data) {
          setLocalUser(res.data);
          updateUser(res.data);
        }
      } catch (err) {
        console.warn('[PassportInner] Profile fetch failed:', err);
      }
    };
    fetchLatest();
  }, []);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/passport' as any);
    }
  };

  // Get dynamic stats or use exact dummy values from screenshot as fallbacks
  const journeysCount = observedJourneys.length > 0 ? observedJourneys.length : 2;
  const jaapCount = totalJaap > 0 ? totalJaap : 4;
  const badgesCount = observedBadges.length > 0 ? observedBadges.length : 7;
  const certificatesCount = observedCertificates.length > 0 ? observedCertificates.length : 1;

  // Use user's real avatar if available, otherwise standard dummy photo
  const userPhoto = localUser?.photo || 'https://images.unsplash.com/photo-1517292987719-0369a794ec0f?auto=format&fit=crop&w=500&q=80';
  const userNameEnglish = (localUser?.name || 'SANATANI').toUpperCase();

  // Dynamic Country Code mapping
  const countryCode = localUser?.home_location?.country
    ? (localUser.home_location.country.toUpperCase() === 'BHARAT' || localUser.home_location.country.toUpperCase() === 'INDIA' ? 'IND' : localUser.home_location.country.substring(0, 3).toUpperCase())
    : 'IND';

  // Dynamic National ID (derive from phone)
  const phoneDigits = localUser?.phone ? localUser.phone.replace(/[^0-9]/g, '') : '';
  const nationalId = phoneDigits
    ? phoneDigits.padEnd(12, '0').slice(-12).replace(/(\d{4})/g, '$1 ').trim()
    : (localUser?.id ? localUser.id.replace(/[^0-9]/g, '').padEnd(12, '9').slice(-12).replace(/(\d{4})/g, '$1 ').trim() : 'XXXX XXXX XXXX');

  // Dynamic Date of Birth
  const getDob = () => {
    if (!localUser?.date_of_birth) return 'N/A';
    const dob = localUser.date_of_birth;
    if (/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
      const [y, m, d] = dob.split('-');
      return `${d}/${m}/${y}`;
    }
    return dob;
  };
  const dobFormatted = getDob();

  // Dynamic Sex/Gender
  const userGender = localUser?.gender || personalityData?.gender || '';
  const isFemale = userGender.toLowerCase().includes('female') || userGender.toLowerCase() === 'f';
  const sexLabel = isFemale ? 'महिला / F' : 'पुरुष / M';

  // Dynamic Nationality
  const nationalityText = countryCode === 'IND' ? 'भारतीय / INDIAN' : `${localUser?.home_location?.country || 'INDIAN'}`.toUpperCase();

  // Dynamic Place of Birth
  const placeOfBirthText = localUser?.place_of_birth || 'MUMBAI, MAHARASHTRA';
  const placeOfBirthEnglish = placeOfBirthText.toUpperCase();
  const placeOfBirthHindi = placeOfBirthText;

  // Dynamic Passport Number
  const getPassportNo = () => {
    if (localUser?.sl_id) {
      const sl = localUser.sl_id.replace(/[^A-Z0-9]/ig, '').toUpperCase();
      return `Z${sl.padEnd(7, '0').substring(0, 7)}`;
    }
    if (localUser?.id) {
      const numericId = localUser.id.replace(/[^0-9]/g, '');
      return `Z${numericId.padEnd(7, '7').substring(0, 7)}`;
    }
    return 'Z6477975';
  };
  const passportNo = getPassportNo();

  // Dynamic Signature Name
  const signatureName = localUser?.name ? localUser.name.split(' ')[0] : 'Sanatani';

  // Dynamic Address (balanced left-right split)
  const homeLoc = localUser?.home_location || localUser?.location;
  const addressLine1Hindi = [homeLoc?.area, homeLoc?.city].filter(Boolean).join(', ') || 'नया इलाका';
  const addressLine2Hindi = [homeLoc?.state, homeLoc?.country || 'भारत'].filter(Boolean).join(', ');

  const addressLine1English = [homeLoc?.area, homeLoc?.city].filter(Boolean).join(', ').toUpperCase() || 'NEW AREA';
  const addressLine2English = [homeLoc?.state, homeLoc?.country || 'INDIA'].filter(Boolean).map(s => s.toUpperCase()).join(', ');

  // Dynamic MRZ Zone
  const getMrzText = () => {
    const name = localUser?.name ? localUser.name.toUpperCase().replace(/[^A-Z]/g, ' ') : 'SANATANI';
    const parts = name.split(' ').filter(Boolean);
    const lastName = parts[parts.length - 1] || 'MEMBER';
    const firstNames = parts.slice(0, parts.length - 1).join('<');
    const basemrz = firstNames ? `P<IND${lastName}<<${firstNames}` : `P<IND${lastName}`;
    return basemrz.padEnd(44, '<').substring(0, 44);
  };
  const mrzText = getMrzText();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      {/* Background Peach to Cream Gradient */}
      <LinearGradient 
        colors={['#FFB085', '#FFF7F2', '#FFFDFB']} 
        style={StyleSheet.absoluteFillObject}
      />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Top Card: Identity Card Page */}
        <View style={styles.idCard}>
          <Text style={styles.cardTitleHindi}>ब्रह्मांड पासपोर्ट</Text>
          <Text style={styles.cardTitleEnglish}>BRAHMAND PASSPORT</Text>

          <View style={styles.gridContainer}>
            {/* Left Fields Column */}
            <View style={styles.leftColumn}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <View>
                  <Text style={styles.fieldLabel}>कंट्री कोड / COUNTRY CODE</Text>
                  <Text style={styles.fieldValue}>{countryCode}</Text>
                </View>
                <View style={{ marginRight: 24 }}>
                  <Text style={styles.fieldLabel}>प्रकार / TYPE</Text>
                  <Text style={styles.fieldValue}>P</Text>
                </View>
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>राष्ट्रीय पहचान / NATIONAL ID</Text>
                <Text style={styles.fieldValue}>{nationalId}</Text>
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>पूरा नाम / FULL NAME</Text>
                <Text style={styles.fieldValueHindi}>{localUser?.name || 'सनतनी'}</Text>
                <Text style={styles.fieldValue}>{userNameEnglish}</Text>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <View>
                  <Text style={styles.fieldLabel}>जन्म तिथि / DATE OF BIRTH</Text>
                  <Text style={styles.fieldValue}>{dobFormatted}</Text>
                </View>
                <View style={{ marginRight: 16 }}>
                  <Text style={styles.fieldLabel}>लिंग / SEX</Text>
                  <Text style={styles.fieldValue}>{sexLabel}</Text>
                </View>
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>राष्ट्रीयता / NATIONALITY</Text>
                <Text style={styles.fieldValue}>{nationalityText}</Text>
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>जन्म स्थान / PLACE OF BIRTH</Text>
                <Text style={styles.fieldValueHindi}>{placeOfBirthHindi}</Text>
                <Text style={styles.fieldValue}>{placeOfBirthEnglish}</Text>
              </View>
            </View>

            {/* Right Photo Column */}
            <View style={styles.rightColumn}>
              <Text style={styles.fieldLabel}>PASSPORT NO.</Text>
              <Text style={[styles.fieldValue, { fontSize: 12, marginBottom: 8 }]}>{passportNo}</Text>

              <View style={styles.photoContainer}>
                <Image source={{ uri: userPhoto }} style={styles.photo} contentFit="cover" />
              </View>

              <View style={styles.signatureContainer}>
                <View style={styles.signatureWrapper}>
                  <Text style={styles.signatureText}>
                    {signatureName}
                  </Text>
                </View>
                <View style={styles.signatureLine} />
                <Text style={styles.signatureLabel}>हस्ताक्षर / SIGNATURE</Text>
              </View>
            </View>
          </View>

          {/* Address Section */}
          <View style={styles.addressSection}>
            <Text style={styles.fieldLabel}>पता / Address</Text>
            
            <View style={styles.addressGrid}>
              <View style={styles.addressCol}>
                <Text style={styles.addressTextHindi}>
                  {addressLine1Hindi}
                </Text>
              </View>
              <View style={styles.addressCol}>
                <Text style={styles.addressTextHindi}>
                  {addressLine2Hindi}
                </Text>
              </View>
            </View>

            <View style={[styles.addressGrid, { marginTop: 4 }]}>
              <View style={styles.addressCol}>
                <Text style={styles.addressText}>
                  {addressLine1English}
                </Text>
              </View>
              <View style={styles.addressCol}>
                <Text style={styles.addressText}>
                  {addressLine2English}
                </Text>
              </View>
            </View>
          </View>

          {/* Machine Readable Zone */}
          <View style={styles.mrzSection}>
            <Text style={styles.mrzText} numberOfLines={1} adjustsFontSizeToFit>
              {mrzText}
            </Text>
          </View>
        </View>

        {/* Bottom Card: Spiritual Record */}
        <View style={styles.spiritualRecordCard}>
          <Text style={styles.recordTitle}>SPIRITUAL RECORD</Text>
          
          <View style={styles.recordGrid}>
            <TouchableOpacity 
              style={styles.recordCol}
              activeOpacity={0.7}
              onPress={() => router.push('/passport/timeline' as any)}
            >
              <Text style={styles.recordLabel}>Journeys</Text>
              <Text style={styles.recordValue}>{journeysCount}</Text>
            </TouchableOpacity>
            
            <View style={styles.recordDivider} />

            <TouchableOpacity 
              style={styles.recordCol}
              activeOpacity={0.7}
              onPress={() => router.push('/passport/progress' as any)}
            >
              <Text style={styles.recordLabel}>Jaap</Text>
              <Text style={styles.recordValue}>{jaapCount}</Text>
            </TouchableOpacity>
            
            <View style={styles.recordDivider} />

            <TouchableOpacity 
              style={styles.recordCol}
              activeOpacity={0.7}
              onPress={() => router.push('/passport/badge' as any)}
            >
              <Text style={styles.recordLabel}>Badges</Text>
              <Text style={styles.recordValue}>{badgesCount}</Text>
            </TouchableOpacity>

            <View style={styles.recordDivider} />

            <TouchableOpacity 
              style={styles.recordCol}
              activeOpacity={0.7}
              onPress={() => router.push('/passport/progress' as any)}
            >
              <Text style={styles.recordLabel}>Certificates</Text>
              <Text style={styles.recordValue}>{certificatesCount}</Text>
            </TouchableOpacity>
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
            <Ionicons name="arrow-forward" size={18} color="#000" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.secondaryButton}
            activeOpacity={0.8}
            onPress={() => router.push('/passport/journey/new' as any)}
          >
            <Ionicons name="add-circle-outline" size={18} color="#000" style={{ marginRight: 8 }} />
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 48,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    alignItems: 'center',
  },
  idCard: {
    width: windowWidth * 0.92,
    maxWidth: 380,
    backgroundColor: '#FAF5EC', // Antique paper color matching passport page style
    borderRadius: 24,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E8DCB9',
  },
  cardTitleHindi: {
    fontSize: 13,
    fontWeight: '800',
    color: '#000',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  cardTitleEnglish: {
    fontSize: 14,
    fontWeight: '900',
    color: '#000',
    textAlign: 'center',
    letterSpacing: 1,
    marginBottom: 16,
  },
  gridContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  leftColumn: {
    width: '66%',
  },
  rightColumn: {
    width: '32%',
    alignItems: 'flex-end',
  },
  fieldContainer: {
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 7.5,
    color: '#6e6e6e',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.25,
  },
  fieldValue: {
    fontSize: 11.5,
    color: '#000',
    fontWeight: '800',
    marginTop: 0.5,
  },
  fieldValueHindi: {
    fontSize: 11,
    color: '#000',
    fontWeight: '700',
  },
  photoContainer: {
    width: 78,
    height: 98,
    borderWidth: 1,
    borderColor: '#C5BA9D',
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: '#E5DDC7',
    marginBottom: 8,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  signatureContainer: {
    width: 78,
    alignItems: 'center',
  },
  signatureWrapper: {
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  signatureText: {
    fontFamily: Platform.OS === 'ios' ? 'Snell Roundhand' : 'serif',
    fontSize: 15,
    fontStyle: 'italic',
    color: '#111',
    fontWeight: '700',
  },
  signatureLine: {
    width: '100%',
    height: 0.8,
    backgroundColor: '#C5BA9D',
    marginTop: 2,
  },
  signatureLabel: {
    fontSize: 6,
    color: '#6e6e6e',
    fontWeight: '700',
    marginTop: 2,
  },
  addressSection: {
    marginTop: 12,
    borderTopWidth: 0.8,
    borderTopColor: '#C5BA9D',
    paddingTop: 8,
  },
  addressGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  addressCol: {
    width: '49%',
  },
  addressTextHindi: {
    fontSize: 9,
    color: '#111',
    lineHeight: 12,
    fontWeight: '700',
  },
  addressText: {
    fontSize: 9,
    color: '#222',
    lineHeight: 12,
    fontWeight: '700',
  },
  mrzSection: {
    marginTop: 14,
    borderTopWidth: 0.8,
    borderTopColor: '#C5BA9D',
    paddingTop: 8,
    alignItems: 'center',
  },
  mrzText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 9.5,
    color: '#000',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  spiritualRecordCard: {
    width: windowWidth * 0.92,
    maxWidth: 380,
    backgroundColor: '#FAF5EC',
    borderRadius: 24,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E8DCB9',
  },
  recordTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#000',
    letterSpacing: 1,
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
    width: 0.8,
    height: 35,
    backgroundColor: '#C5BA9D',
  },
  recordLabel: {
    fontSize: 10,
    color: '#4f4f4f',
    fontWeight: '800',
    marginBottom: 6,
  },
  recordValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#000',
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: windowWidth * 0.78,
    maxWidth: 320,
    height: 48,
    backgroundColor: '#FFF',
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  primaryButtonText: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#000',
    marginRight: 6,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: windowWidth * 0.78,
    maxWidth: 320,
    height: 48,
    backgroundColor: '#FFF',
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  secondaryButtonText: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#000',
  },
});

const enhance = withObservables([], () => ({
  observedJourneys: database.get('passport_journeys').query().observe(),
  observedBadges: database.get('passport_badges').query().observe(),
  observedCertificates: database.get('passport_certificates').query().observe(),
}));

export default enhance(PassportInnerScreen);
