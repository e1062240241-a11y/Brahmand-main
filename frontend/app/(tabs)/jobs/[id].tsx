import React, { useEffect, useState } from 'react';
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
import { getJobProfile } from '../../../src/services/api';
import { useAuthStore } from '../../../src/store/authStore';

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
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<JobProfile | null>(null);

  const isKycVerified = (user as any)?.kyc_status === 'verified';

  useEffect(() => {
    const fetchProfile = async () => {
      if (!id) return;
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
    router.replace('/(tabs)/vendor');
  };

  const handleViewCv = async () => {
    if (!isKycVerified) {
      Alert.alert('Not Verified', 'Only verified users can view the CV.');
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
        <View style={styles.topCard}>
          {photo ? (
            <Image source={{ uri: photo }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={44} color={COLORS.primary} />
            </View>
          )}

          <View style={styles.topInfo}>
            <Text style={styles.name}>{asText(profile.name, 'Unnamed Profile')}</Text>
            <Text style={styles.profession}>{asText(profile.profession, 'Profession')}</Text>
            <View style={styles.expRow}>
              <Ionicons name="briefcase" size={14} color={COLORS.textSecondary} />
              <Text style={styles.expText}>{profile.experience_years || 0} years experience</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Address</Text>
          <Text style={styles.sectionText}>{asText(profile.current_address, 'Address not available')}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferred Work City</Text>
          <Text style={styles.sectionText}>{asText(profile.preferred_work_city, 'Not provided')}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CV</Text>
          <TouchableOpacity
            style={[styles.cvButton, !profile.cv_url && styles.cvButtonDisabled]}
            onPress={handleViewCv}
            disabled={!profile.cv_url}
          >
            <Ionicons name="document-text" size={18} color="#FFFFFF" />
            <Text style={styles.cvButtonText}>{isKycVerified ? 'View CV' : 'Complete KYC to View CV'}</Text>
          </TouchableOpacity>
          {!isKycVerified && (
            <Text style={styles.cvHint}>Tap above to submit KYC. CV opens only after admin approval.</Text>
          )}
        </View>
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
