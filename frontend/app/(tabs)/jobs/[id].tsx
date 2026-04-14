import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Linking,
  Alert,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS } from '../../../src/constants/theme';
import { getJobProfile, getKYCStatus } from '../../../src/services/api';
import { useAuthStore } from '../../../src/store/authStore';
import { useVendorStore } from '../../../src/store/vendorStore';
import { VendorKYCModal } from '../../../src/components/VendorKYCModal';

interface JobProfile {
  id: string;
  owner_id: string;
  name: string;
  current_address: string;
  experience_years: number;
  profession: string;
  preferred_work_city: string;
  photos?: string[];
  cv_url?: string | null;
}

const asText = (value: unknown, fallback = ''): string => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  return fallback;
};

const asStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string' && !!item);
  }
  if (typeof value === 'string' && value) {
    return [value];
  }
  return [];
};

const normalizeJobProfile = (raw: any): JobProfile | null => {
  if (!raw || typeof raw !== 'object') return null;
  const profileId = asText(raw.id);
  if (!profileId) return null;

  const yearsRaw = raw.experience_years;
  const years = typeof yearsRaw === 'number' ? yearsRaw : parseInt(asText(yearsRaw), 10);

  return {
    id: profileId,
    owner_id: asText(raw.owner_id),
    name: asText(raw.name, 'Unnamed Profile'),
    current_address: asText(raw.current_address),
    experience_years: Number.isFinite(years) ? years : 0,
    profession: asText(raw.profession),
    preferred_work_city: asText(raw.preferred_work_city),
    photos: asStringArray(raw.photos),
    cv_url: typeof raw.cv_url === 'string' ? raw.cv_url : null,
  };
};

export default function JobProfileDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user, updateUser } = useAuthStore();
  const { myVendor, fetchMyVendor } = useVendorStore();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<JobProfile | null>(null);
  const [showKycModal, setShowKycModal] = useState(false);
  const [kycModalVendorId, setKycModalVendorId] = useState<string | null>(myVendor?.id || null);

  const isKycVerified =
    (user as any)?.kyc_status === 'verified' ||
    Boolean((user as any)?.is_verified) ||
    myVendor?.kyc_status === 'verified';

  const loadKycStatus = useCallback(async (): Promise<string | null> => {
    try {
      const response = await getKYCStatus();
      const serverStatus = response?.data?.kyc_status || (response?.data?.is_verified ? 'verified' : null);
      updateUser({
        kyc_status: serverStatus,
        is_verified: Boolean(response?.data?.is_verified) || serverStatus === 'verified',
      } as any);
      // Fetch vendor data to get vendor ID
      if (!myVendor) {
        await fetchMyVendor();
      }
      return serverStatus;
    } catch (error) {
      console.warn('Failed to refresh KYC status:', error);
      return null;
    }
  }, [updateUser, myVendor, fetchMyVendor]);

  const ensureKycVerifiedForCv = useCallback(async () => {
    const latestStatus = await loadKycStatus();
    const effectiveStatus =
      latestStatus ||
      (user as any)?.kyc_status ||
      ((user as any)?.is_verified ? 'verified' : null) ||
      (myVendor?.kyc_status === 'verified' ? 'verified' : null);

    if (effectiveStatus === 'verified') {
      return true;
    }

    let vendorId = myVendor?.id || null;
    if (!vendorId) {
      await fetchMyVendor();
      vendorId = useVendorStore.getState().myVendor?.id || null;
    }

    setKycModalVendorId(vendorId || '');
    setShowKycModal(true);
    return false;
  }, [loadKycStatus, user, myVendor?.id, fetchMyVendor]);

  useEffect(() => {
    loadKycStatus();
  }, [loadKycStatus]);

  useEffect(() => {
    if (myVendor?.id) {
      setKycModalVendorId(myVendor.id);
    }
  }, [myVendor?.id]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!id) return;
      setProfile(null);
      try {
        setLoading(true);
        const response = await getJobProfile(id);
        setProfile(normalizeJobProfile(response?.data));
      } catch (error: any) {
        Alert.alert('Error', error?.response?.data?.detail || error?.message || 'Failed to load job profile.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [id]);

  const handleBack = () => {
    router.replace('/vendor');
  };

  const handleViewCv = async () => {
    const canViewCv = await ensureKycVerifiedForCv();
    if (!canViewCv) {
      return;
    }

    if (!profile?.cv_url) {
      Alert.alert('Unavailable', 'CV is not available.');
      return;
    }

    const canOpen = await Linking.canOpenURL(profile.cv_url);
    if (!canOpen) {
      Alert.alert('Unable to Open', 'Could not open CV link.');
      return;
    }

    await Linking.openURL(profile.cv_url);
  };

  const handleKycSuccess = () => {
    setShowKycModal(false);
    loadKycStatus();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Job Profile</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.centered}>
          <Text style={styles.emptyText}>Job profile not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const photo = asStringArray(profile.photos).find((url) => !!url);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Job Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heroCard}>
          <View style={styles.heroImageWrap}>
            {photo ? (
              <Image source={{ uri: photo }} style={styles.heroImage} />
            ) : (
              <View style={styles.heroImagePlaceholder}>
                <Ionicons name="person" size={40} color={COLORS.primary} />
              </View>
            )}
          </View>
          <View style={styles.heroDetails}>
            <Text style={styles.jobTitle}>{asText(profile.name, 'Unnamed Candidate')}</Text>
            <Text style={styles.jobMeta}>{asText(profile.profession, 'Profession')}</Text>
            <View style={styles.badgeRow}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{profile.experience_years || 0} yrs exp</Text>
              </View>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{profile.preferred_work_city || 'No city set'}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Job Details</Text>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Current Address</Text>
            <Text style={styles.fieldValue}>{asText(profile.current_address, 'Not available')}</Text>
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Preferred City</Text>
            <Text style={styles.fieldValue}>{asText(profile.preferred_work_city, 'Not provided')}</Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>CV Access</Text>
          <Text style={styles.sectionText}>Only verified users can open candidate CVs. Complete KYC to unlock access.</Text>
          <TouchableOpacity
            style={[styles.cvButton, isKycVerified && !profile.cv_url && styles.cvButtonDisabled]}
            onPress={handleViewCv}
            disabled={isKycVerified && !profile.cv_url}
          >
            <Ionicons name="document-text" size={18} color="#FFFFFF" />
            <Text style={styles.cvButtonText}>{isKycVerified ? (profile.cv_url ? 'View CV' : 'CV Unavailable') : 'Complete KYC to View CV'}</Text>
          </TouchableOpacity>
          <Text style={styles.cvHint}>
            {isKycVerified
              ? profile.cv_url
                ? 'You can open the candidate CV now.'
                : 'This candidate has not uploaded a CV yet.'
              : 'Complete your vendor KYC to access CVs.'}
          </Text>
        </View>
        <VendorKYCModal
          visible={showKycModal}
          vendorId={kycModalVendorId || ''}
          allowUserKycFallback
          onClose={() => setShowKycModal(false)}
          onKycUpdated={handleKycSuccess}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    backgroundColor: COLORS.surface,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
  },
  content: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  topCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: COLORS.background,
    marginRight: SPACING.md,
  },
  avatarPlaceholder: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: `${COLORS.primary}15`,
    marginRight: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topInfo: {
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  profession: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
    marginTop: SPACING.xs,
  },
  expRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  expText: {
    marginLeft: SPACING.xs,
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  section: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  sectionText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  sectionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  heroImageWrap: {
    width: 96,
    height: 96,
    borderRadius: 24,
    backgroundColor: `${COLORS.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  heroImage: {
    width: 96,
    height: 96,
    borderRadius: 24,
  },
  heroImagePlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 24,
    backgroundColor: `${COLORS.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroDetails: {
    flex: 1,
  },
  jobTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  jobMeta: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: SPACING.xs,
  },
  badge: {
    backgroundColor: `${COLORS.primary}10`,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    marginRight: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  badgeText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  fieldRow: {
    marginTop: SPACING.sm,
  },
  fieldLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginBottom: SPACING.xs,
  },
  fieldValue: {
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 20,
  },
  cvButton: {
    marginTop: SPACING.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.xs,
  },
  cvButtonDisabled: {
    opacity: 0.5,
  },
  cvButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  cvHint: {
    marginTop: SPACING.xs,
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 15,
  },
});
