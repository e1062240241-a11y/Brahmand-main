import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, BackHandler, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS, SPACING, BORDER_RADIUS } from '../src/constants/theme';
import { useVendorStore } from '../src/store/vendorStore';
import { useAuthStore } from '../src/store/authStore';
import { VendorKYCModal } from '../src/components/VendorKYCModal';
import { getKYCStatus } from '../src/services/api';

export default function KYCStatusScreen() {
  const router = useRouter();
  const { myVendor, fetchMyVendor } = useVendorStore();
  const { user, updateUser } = useAuthStore();
  const [kycVisible, setKycVisible] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(true);

  const refreshKycStatus = useCallback(async () => {
    try {
      await fetchMyVendor();
      const response = await getKYCStatus();
      const serverStatus = response?.data?.kyc_status || (response?.data?.is_verified ? 'verified' : null);
      updateUser({
        kyc_status: serverStatus,
        is_verified: Boolean(response?.data?.is_verified) || serverStatus === 'verified',
      } as any);
    } catch (error) {
      console.warn('Failed to refresh KYC status:', error);
    } finally {
      setLoadingStatus(false);
    }
  }, [fetchMyVendor, updateUser]);

  useEffect(() => {
    refreshKycStatus();
  }, [refreshKycStatus]);

  const isUserVerified = (user as any)?.kyc_status === 'verified' || Boolean((user as any)?.is_verified);
  const isVendorVerified = (myVendor as any)?.kyc_status === 'verified';
  const isVerified = isUserVerified || isVendorVerified;

  const isUserReview = (user as any)?.kyc_status === 'manual_review';
  const isVendorReview = (myVendor as any)?.kyc_status === 'manual_review';
  const isReview = isUserReview || isVendorReview;

  const isUserRejected = (user as any)?.kyc_status === 'rejected';
  const isVendorRejected = (myVendor as any)?.kyc_status === 'rejected';
  const isRejected = isUserRejected || isVendorRejected;

  const getStatusTitle = () => {
    if (isVerified) return 'Verified & Approved';
    if (isReview) return 'Under Review';
    if (isRejected) return 'Verification Rejected';
    return 'Verification Pending';
  };

  const getStatusDescription = () => {
    if (isVerified) {
      return 'Your identity has been successfully verified. You now have full access to all features.';
    }
    if (isReview) {
      return 'Your KYC documents are currently being processed by our admin team. This usually takes 24-48 hours.';
    }
    if (isRejected) {
      const reason = (myVendor as any)?.kyc_rejection_reason || 'Denied by admin. Please upload clear documents and try again.';
      return `Reason: ${reason}`;
    }
    return 'Verify your identity using Aadhaar or PAN card to enable secure community features and listings.';
  };

  const getStatusColor = () => {
    if (isVerified) return '#2E7D32'; // Green
    if (isReview) return '#E65100'; // Amber/Orange
    if (isRejected) return '#C62828'; // Red
    return '#1565C0'; // Blue
  };

  const getStatusBgColor = () => {
    if (isVerified) return '#E8F5E9';
    if (isReview) return '#FFF3E0';
    if (isRejected) return '#FFEBEE';
    return '#E3F2FD';
  };

  const getStatusIcon = () => {
    if (isVerified) return 'shield-checkmark';
    if (isReview) return 'time';
    if (isRejected) return 'close-circle';
    return 'alert-circle';
  };

  const handleBack = useCallback(() => {
    router.replace('/(tabs)/profile');
  }, [router]);

  useEffect(() => {
    const backAction = () => {
      handleBack();
      return true;
    };
    const subscription = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => subscription.remove();
  }, [handleBack]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title}>KYC Verification</Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={() => { setLoadingStatus(true); refreshKycStatus(); }}>
          <Ionicons name="refresh" size={20} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      {loadingStatus ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <View style={styles.content}>
          <View style={[styles.card, { backgroundColor: getStatusBgColor() }]}>
            <View style={[styles.iconContainer, { backgroundColor: `${getStatusColor()}15` }]}>
              <Ionicons name={getStatusIcon()} size={48} color={getStatusColor()} />
            </View>
            <Text style={[styles.statusTitle, { color: getStatusColor() }]}>
              {getStatusTitle()}
            </Text>
            <Text style={styles.statusDescription}>
              {getStatusDescription()}
            </Text>
          </View>

          {!isVerified && !isReview && (
            <TouchableOpacity style={styles.actionBtn} onPress={() => setKycVisible(true)}>
              <Text style={styles.actionBtnText}>
                {isRejected ? 'Resubmit Verification' : 'Start Verification'}
              </Text>
            </TouchableOpacity>
          )}

          {isReview && (
            <View style={styles.infoBox}>
              <Ionicons name="information-circle-outline" size={20} color={COLORS.textSecondary} />
              <Text style={styles.infoText}>
                You will be notified as soon as our team reviews your documents.
              </Text>
            </View>
          )}
        </View>
      )}

      <VendorKYCModal
        visible={kycVisible}
        onClose={() => setKycVisible(false)}
        vendorId={myVendor?.id || ''}
        allowUserKycFallback
        onKycUpdated={() => {
          setKycVisible(false);
          setLoadingStatus(true);
          refreshKycStatus();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  backBtn: {
    padding: SPACING.xs,
  },
  refreshBtn: {
    padding: SPACING.xs,
  },
  title: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    padding: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: '100%',
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    marginBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  statusTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  statusDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: SPACING.sm,
  },
  actionBtn: {
    backgroundColor: COLORS.primary,
    width: '100%',
    paddingVertical: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.md,
  },
  infoText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    flex: 1,
  },
});
