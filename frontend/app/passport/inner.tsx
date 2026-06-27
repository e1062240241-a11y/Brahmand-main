import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore, sanitizeUserProfile } from '../../src/store/authStore';
import { usePassportStore } from '../../src/store/passportStore';
import { usePersonalityStore } from '../../src/store/personalityStore';
import { getUserProfile } from '../../src/services/api';
import withObservables from '@nozbe/with-observables';
import { database } from '../../src/database';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width: windowWidth } = Dimensions.get('window');
const CARD_WIDTH = Math.min(windowWidth - 32, 361);

function PassportInnerScreen({
  observedJourneys = [],
  observedBadges = [],
}: {
  observedJourneys?: any[];
  observedBadges?: any[];
}) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  const totalJaap = usePassportStore((state) => state.total_jaap);
  const loadPassport = usePassportStore((state) => state.loadPassport);
  const personalityData = usePersonalityStore((state) => state.data);

  const [localUser, setLocalUser] = React.useState<any>(
    Platform.OS === 'android' ? sanitizeUserProfile(user) : user
  );

  useEffect(() => {
    loadPassport();
    const fetchLatest = async () => {
      try {
        const res = await getUserProfile();
        if (res.data) {
          const sanitized = Platform.OS === 'android' ? sanitizeUserProfile(res.data) : res.data;
          setLocalUser(sanitized);
          updateUser(sanitized);
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

  const journeysCount = observedJourneys.length;
  const jaapCount = totalJaap || 0;
  const badgesCount = observedBadges.length;

  // ── Derived data (English only) ────────────────────────────

  const hasPhoto =
    localUser?.photo &&
    localUser.photo !== 'nan' &&
    localUser.photo !== 'NaN' &&
    localUser.photo !== 'None' &&
    localUser.photo !== '';

  const userPhoto = hasPhoto ? localUser.photo : null;

  const userNameEnglish = (localUser?.name || 'SANATANI').toUpperCase();

  const countryCode =
    localUser?.home_location?.country
      ? String(localUser.home_location.country).toUpperCase() === 'BHARAT' ||
        String(localUser.home_location.country).toUpperCase() === 'INDIA'
        ? 'IND'
        : String(localUser.home_location.country).substring(0, 3).toUpperCase()
      : 'IND';

  // Brahmand ID = sl_id (fallback to padded user id)
  const brahmandId = localUser?.sl_id
    ? String(localUser.sl_id)
    : localUser?.id
    ? String(localUser.id).replace(/[^0-9]/g, '').padEnd(12, '0').slice(0, 12)
    : '456712340098';

  // Date of birth
  const getDob = () => {
    const dobVal = localUser?.date_of_birth;
    if (!dobVal) return 'N/A';
    const dob = String(dobVal);

    if (Platform.OS === 'android') {
      if (dob === 'nan' || dob === 'NaN' || dob === 'None' || dob === 'undefined') {
        return 'N/A';
      }
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
      const parts = dob.split('-');
      const y = parts[0] || '';
      const m = parts[1] || '';
      const d = parts[2] || '';
      return `${d}/${m}/${y}`;
    }
    return dob;
  };
  const dobFormatted = getDob();

  // Sex
  const rawGender = localUser?.gender || personalityData?.gender || '';
  const userGender = String(
    Platform.OS === 'android' && (rawGender === 'nan' || rawGender === 'NaN' || rawGender === 'None' || rawGender === 'undefined')
      ? ''
      : rawGender
  );
  const isFemale =
    userGender.toLowerCase().includes('female') || userGender.toLowerCase() === 'f';
  const sexLabel = Platform.OS === 'android' ? (userGender ? (isFemale ? 'F' : 'M') : 'N/A') : (isFemale ? 'F' : 'M');

  // Nationality
  const nationalityEnglish =
    countryCode === 'IND'
      ? 'INDIAN'
      : String(localUser?.home_location?.country || 'INDIAN').toUpperCase();

  // Place of birth
  const homeLoc = localUser?.home_location || localUser?.location;
  const placeOfBirthEnglish = String(
    localUser?.place_of_birth ||
    [homeLoc?.city, homeLoc?.state].filter(Boolean).join(', ') ||
    'MUMBAI, MAHARASHTRA'
  ).toUpperCase();

  // Signature
  const signatureName = typeof localUser?.name === 'string' ? localUser.name.split(' ')[0] : 'Sanatani';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      <LinearGradient
        colors={['#FF8D57', '#EA9B76', '#FFEEE5']}
        locations={[0, 0.0913, 0.25]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Passport</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── ID Card ── */}
        <View style={styles.idCard}>
          {/* Card title */}
          <Text style={styles.cardTitle}>BRAHMAND PASSPORT</Text>

          {/* Two-column grid */}
          <View style={styles.gridContainer}>

            {/* LEFT: passport fields */}
            <View style={styles.leftColumn}>

              {/* COUNTRY CODE – inline */}
              <View style={styles.inlineRow}>
                <Text style={styles.inlineLabel}>COUNTRY CODE</Text>
                <Text style={styles.fieldValueLarge}>{countryCode}</Text>
              </View>

              {/* BRAHMAND ID – inline */}
              <View style={styles.inlineRow}>
                <Text style={styles.inlineLabel}>BRAHMAND ID</Text>
                <Text style={styles.fieldValueLarge}>{brahmandId}</Text>
              </View>

              {/* FULL NAME – inline */}
              <View style={styles.inlineRow}>
                <Text style={styles.inlineLabel}>FULL NAME</Text>
                <Text style={styles.fieldValueName}>{userNameEnglish}</Text>
              </View>

              {/* DATE OF BIRTH  +  SEX (stacked side-by-side, NOT inline) */}
              <View style={styles.inlineFields}>
                <View style={styles.dobBlock}>
                  <Text style={styles.fieldLabel}>DATE OF BIRTH</Text>
                  <Text style={styles.fieldValue}>{dobFormatted}</Text>
                </View>
                <View style={styles.sexBlock}>
                  <Text style={styles.fieldLabel}>SEX</Text>
                  <Text style={styles.fieldValue}>{sexLabel}</Text>
                </View>
              </View>

              {/* NATIONALITY – inline */}
              <View style={styles.inlineRow}>
                <Text style={styles.inlineLabel}>NATIONALITY</Text>
                <Text style={styles.fieldValue}>{nationalityEnglish}</Text>
              </View>

              {/* PLACE OF BIRTH – inline */}
              <View style={styles.inlineRow}>
                <Text style={styles.inlineLabel}>PLACE OF BIRTH</Text>
                <Text style={[styles.fieldValue, { flex: 1 }]}>{placeOfBirthEnglish}</Text>
              </View>

            </View>

            {/* RIGHT: photo + signature */}
            <View style={styles.rightColumn}>
              <View style={styles.photoContainer}>
                {userPhoto ? (
                  <Image
                    source={{ uri: userPhoto }}
                    style={styles.photo}
                    contentFit="cover"
                  />
                ) : (
                  <View style={styles.photoPlaceholder}>
                    <Ionicons name="person" size={40} color="rgba(0,0,0,0.25)" />
                  </View>
                )}
              </View>

              <View style={styles.signatureContainer}>
                <Text style={styles.signatureText}>{signatureName}</Text>
                <View style={styles.signatureLine} />
                <Text style={styles.signatureLabel}>OWNER / SIGNATURE</Text>
              </View>
            </View>

          </View>
        </View>

        {/* ── Spiritual Record Card ── */}
        <View style={styles.spiritualRecordCard}>
          <Text style={styles.recordTitle}>STIRITUAL RECORD</Text>

          <View style={styles.recordGrid}>
            <View style={styles.recordCol}>
              <Text style={styles.recordLabel}>Total Journeys</Text>
              <Text style={styles.recordValue}>{journeysCount}</Text>
            </View>

            <View style={styles.recordDivider} />

            <View style={styles.recordCol}>
              <Text style={styles.recordLabel}>{"Jaap Count's"}</Text>
              <Text style={styles.recordValue}>{jaapCount}</Text>
            </View>

            <View style={styles.recordDivider} />

            <View style={styles.recordCol}>
              <Text style={styles.recordLabel}>Earned Badges</Text>
              <Text style={styles.recordValue}>{badgesCount}</Text>
            </View>
          </View>
        </View>

        {/* ── Action Buttons ── */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            activeOpacity={0.8}
            onPress={() => router.push('/passport/timeline' as any)}
          >
            <Text style={styles.primaryButtonText}>Passport Timeline</Text>
            <Ionicons name="arrow-forward" size={16} color="#000" style={{ marginLeft: 8 }} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            activeOpacity={0.8}
            onPress={() => router.push('/passport/journey/new' as any)}
          >
            <Ionicons name="add-circle-outline" size={18} color="#000" style={{ marginRight: 6 }} />
            <Text style={styles.secondaryButtonText}>Log a New Journey</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 52,
  },
  backButton: { padding: 8, marginLeft: -8 },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000',
    flex: 1,
    textAlign: 'center',
  },

  // Scroll
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
    alignItems: 'center',
  },

  // ── ID Card ──────────────────────────────────────────────────
  idCard: {
    width: CARD_WIDTH,
    backgroundColor: '#FFF5F1',
    borderRadius: 15,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.10)',
  },
  cardTitle: {
    color: '#000',
    fontFamily: 'SF Pro',
    fontSize: 12,
    fontStyle: 'normal',
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 14,
  },

  // Two-column grid
  gridContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  leftColumn: {
    flex: 1,
    paddingRight: 12,
  },
  rightColumn: {
    width: 108,
    alignItems: 'center',
  },

  // Fields
  fieldBlock: {
    marginBottom: 4,
  },
  // Inline row: label left, value right
  inlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  inlineLabel: {
    fontSize: 7.5,
    color: '#555',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    width: 82,          // fixed width so all values start at same x
    flexShrink: 0,
  },
  fieldLabel: {
    fontSize: 7.5,
    color: '#555',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 1,
  },
  fieldValueLarge: {
    color: '#000',
    fontFamily: 'SF Pro',
    fontSize: 11,
    fontStyle: 'normal',
    fontWeight: '700',
    flex: 1,
  },
  fieldValueName: {
    color: '#000',
    fontFamily: 'SF Pro',
    fontSize: 11,
    fontStyle: 'normal',
    fontWeight: '700',
    flex: 1,
  },
  fieldValue: {
    color: '#000',
    fontFamily: 'SF Pro',
    fontSize: 11,
    fontStyle: 'normal',
    fontWeight: '700',
  },

  // DOB + SEX stacked side by side (NOT inline)
  inlineFields: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 12,
  },
  dobBlock: {
    marginRight: 20,
  },
  sexBlock: {},

  // Photo
  photoContainer: {
    width: 108,
    height: 136,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: '#D8D0BA',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    marginBottom: 8,
  },
  photo: { width: '100%', height: '100%' },
  photoPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E5DDC8',
  },

  // Signature
  signatureContainer: {
    width: 108,
    paddingTop: 4,
    paddingBottom: 4,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.12)',
    borderRadius: 4,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  signatureText: {
    fontFamily: Platform.OS === 'ios' ? 'Snell Roundhand' : 'serif',
    fontSize: 14,
    fontStyle: 'italic',
    color: '#111',
    fontWeight: '700',
    marginBottom: 3,
  },
  signatureLine: {
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.15)',
    marginBottom: 3,
  },
  signatureLabel: {
    fontSize: 6,
    color: '#666',
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.3,
  },

  // ── Spiritual Record Card ──────────────────────────────────
  spiritualRecordCard: {
    width: 361,
    height: 111,
    backgroundColor: '#FFF5F1',
    borderRadius: 15,
    paddingTop: 17,
    paddingRight: 11,
    paddingBottom: 22,
    paddingLeft: 0,
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.10)',
  },
  recordTitle: {
    width: 147,
    height: 14,
    fontSize: 12,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
    fontFamily: 'SF Pro',
  },
  recordGrid: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordCol: {
    flex: 1,
    alignItems: 'center',
  },
  recordDivider: {
    width: 1,
    height: 44,
    backgroundColor: 'rgba(0,0,0,0.12)',
  },
  recordLabel: {
    fontSize: 12,
    color: '#000',
    fontWeight: '700',
    fontFamily: 'SF Pro',
    textAlign: 'center',
    marginBottom: 8,
  },
  recordValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
    fontFamily: 'SF Pro',
  },

  // ── Buttons ────────────────────────────────────────────────
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: 277,
    paddingTop: 17,
    paddingRight: 27,
    paddingBottom: 15,
    paddingLeft: 28,
    backgroundColor: '#FFF',
    borderRadius: 26,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  primaryButtonText: {
    color: '#000',
    fontSize: 15,
    fontWeight: '600',
    width: 134,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: 277,
    paddingTop: 17,
    paddingRight: 27,
    paddingBottom: 15,
    paddingLeft: 28,
    backgroundColor: '#FFF',
    borderRadius: 26,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
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
