import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { COLORS, SPACING, BORDER_RADIUS } from '../../src/constants/theme';
import {
  AdminPostReport,
  AdminUserKycRequest,
  AdminVendorReview,
  adminApproveVendor,
  adminRejectVendor,
  adminReviewReport,
  adminVerifyUserKyc,
  getAdminReports,
  getAdminPendingKyc,
  getAdminVendorReviewQueue,
} from '../../src/services/api';
import { useAdminStore } from '../../src/store/adminStore';

export default function AdminPanelScreen() {
  const router = useRouter();
  const { adminToken, isAdminAuthenticated, adminLogout, adminUser } = useAdminStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingKey, setProcessingKey] = useState<string | null>(null);
  const [vendorRequests, setVendorRequests] = useState<AdminVendorReview[]>([]);
  const [userKycRequests, setUserKycRequests] = useState<AdminUserKycRequest[]>([]);
  const [reportedPosts, setReportedPosts] = useState<AdminPostReport[]>([]);

  const isKycCompleted = (record: AdminVendorReview) => {
    const hasOtpVerified = !!record.aadhaar_otp_verified_at;
    const hasAllDocs = !!record.aadhar_url && !!record.pan_url && !!record.face_scan_url;
    return hasOtpVerified || hasAllDocs;
  };

  const pendingKycRequests = useMemo(
    () => vendorRequests.filter((record) => (record.review_status || 'pending') === 'pending' && isKycCompleted(record)),
    [vendorRequests]
  );

  const pendingUserKycRequests = useMemo(
    () => (userKycRequests || []).filter((record) => !!record?.id),
    [userKycRequests]
  );

  const pendingPostReports = useMemo(
    () => (reportedPosts || []).filter((record) => (record?.status || 'pending') === 'pending'),
    [reportedPosts]
  );

  const loadRequests = async () => {
    if (!adminToken) return;
    try {
      const [vendorResponse, userKycResponse, reportsResponse] = await Promise.all([
        getAdminVendorReviewQueue(adminToken, 'pending'),
        getAdminPendingKyc(adminToken),
        getAdminReports(adminToken, 'pending', 'post', 150),
      ]);
      setVendorRequests(Array.isArray(vendorResponse.data) ? vendorResponse.data : []);
      setUserKycRequests(Array.isArray(userKycResponse.data) ? userKycResponse.data : []);
      setReportedPosts(Array.isArray(reportsResponse.data) ? reportsResponse.data : []);
    } catch (error: any) {
      const detail = error?.response?.data?.detail || 'Failed to load review queue';
      Alert.alert('Error', detail);
    }
  };

  useEffect(() => {
    if (!isAdminAuthenticated || !adminToken) {
      router.replace('/admin/login');
      return;
    }

    setLoading(true);
    loadRequests().finally(() => setLoading(false));
  }, [isAdminAuthenticated, adminToken, router]);

  const handleApprove = async (vendorId: string) => {
    if (!adminToken) return;
    setProcessingKey(`vendor:${vendorId}`);
    try {
      await adminApproveVendor(adminToken, vendorId);
      await loadRequests();
      Alert.alert('Success', 'Vendor approved.');
    } catch (error: any) {
      const detail = error?.response?.data?.detail || 'Approve failed';
      Alert.alert('Error', detail);
    } finally {
      setProcessingKey(null);
    }
  };

  const handleDeny = async (vendorId: string) => {
    if (!adminToken) return;
    setProcessingKey(`vendor:${vendorId}`);
    try {
      await adminRejectVendor(adminToken, vendorId, 'Denied by admin');
      await loadRequests();
      Alert.alert('Updated', 'Vendor request denied. Business stays in pending state.');
    } catch (error: any) {
      const detail = error?.response?.data?.detail || 'Deny failed';
      Alert.alert('Error', detail);
    } finally {
      setProcessingKey(null);
    }
  };

  const handleApproveUserKyc = async (userId: string) => {
    if (!adminToken) return;
    setProcessingKey(`user:${userId}`);
    try {
      await adminVerifyUserKyc(adminToken, userId, 'verify');
      await loadRequests();
      Alert.alert('Success', 'User KYC approved.');
    } catch (error: any) {
      const detail = error?.response?.data?.detail || 'Approve failed';
      Alert.alert('Error', detail);
    } finally {
      setProcessingKey(null);
    }
  };

  const handleDenyUserKyc = async (userId: string) => {
    if (!adminToken) return;
    setProcessingKey(`user:${userId}`);
    try {
      await adminVerifyUserKyc(adminToken, userId, 'reject', 'Denied by admin');
      await loadRequests();
      Alert.alert('Updated', 'User KYC denied.');
    } catch (error: any) {
      const detail = error?.response?.data?.detail || 'Deny failed';
      Alert.alert('Error', detail);
    } finally {
      setProcessingKey(null);
    }
  };

  const handleApproveReport = async (reportId: string) => {
    if (!adminToken) return;
    setProcessingKey(`report:${reportId}`);
    try {
      await adminReviewReport(adminToken, reportId, 'approve');
      await loadRequests();
      Alert.alert('Success', 'Report approved and moderated.');
    } catch (error: any) {
      const detail = error?.response?.data?.detail || 'Approve failed';
      Alert.alert('Error', detail);
    } finally {
      setProcessingKey(null);
    }
  };

  const handleDenyReport = async (reportId: string) => {
    if (!adminToken) return;
    setProcessingKey(`report:${reportId}`);
    try {
      await adminReviewReport(adminToken, reportId, 'deny', 'Denied by admin');
      await loadRequests();
      Alert.alert('Updated', 'Report denied.');
    } catch (error: any) {
      const detail = error?.response?.data?.detail || 'Deny failed';
      Alert.alert('Error', detail);
    } finally {
      setProcessingKey(null);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRequests();
    setRefreshing(false);
  };

  const handleLogout = async () => {
    await adminLogout();
    router.replace('/admin/login');
  };

  const renderVendorItem = ({ item }: { item: AdminVendorReview }) => {
    const busy = processingKey === `vendor:${item.vendor_id}`;

    return (
      <View style={styles.card}>
        <Text style={styles.businessName}>{item.business_name || 'Unnamed Business'}</Text>
        <Text style={styles.meta}>Owner: {item.owner_name || 'N/A'}</Text>
        <Text style={styles.meta}>Phone: {item.phone_number || 'N/A'}</Text>
        <Text style={styles.meta}>Address: {item.full_address || 'N/A'}</Text>
        <Text style={styles.meta}>Categories: {(item.categories || []).join(', ') || 'N/A'}</Text>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.button, styles.approveButton, busy && styles.buttonDisabled]}
            disabled={busy}
            onPress={() => handleApprove(item.vendor_id)}
          >
            {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Approve</Text>}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.denyButton, busy && styles.buttonDisabled]}
            disabled={busy}
            onPress={() => handleDeny(item.vendor_id)}
          >
            <Text style={styles.buttonText}>Deny</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderUserKycItem = ({ item }: { item: AdminUserKycRequest }) => {
    const busy = processingKey === `user:${item.id}`;

    return (
      <View style={styles.card}>
        <Text style={styles.businessName}>{item.name || 'Unnamed User'}</Text>
        <Text style={styles.meta}>SL ID: {item.sl_id || 'N/A'}</Text>
        <Text style={styles.meta}>Role: {item.kyc_role || 'N/A'}</Text>
        <Text style={styles.meta}>ID Type: {item.kyc_id_type || 'N/A'}</Text>
        <Text style={styles.meta}>Submitted: {item.kyc_submitted_at || 'N/A'}</Text>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.button, styles.approveButton, busy && styles.buttonDisabled]}
            disabled={busy}
            onPress={() => handleApproveUserKyc(item.id)}
          >
            {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Approve</Text>}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.denyButton, busy && styles.buttonDisabled]}
            disabled={busy}
            onPress={() => handleDenyUserKyc(item.id)}
          >
            <Text style={styles.buttonText}>Deny</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderReportedPostItem = ({ item }: { item: AdminPostReport }) => {
    const busy = processingKey === `report:${item.id}`;
    const snapshot = item.snapshot || {};

    return (
      <View style={styles.card}>
        <Text style={styles.businessName}>Reported Post</Text>
        <Text style={styles.meta}>Reported user: {snapshot.post_username || snapshot.post_user_id || item.reported_user_id || 'N/A'}</Text>
        <Text style={styles.meta}>Category: {item.category || 'other'}</Text>
        {!!item.description && <Text style={styles.meta}>Reason: {item.description}</Text>}
        {!!snapshot.caption && <Text style={styles.meta}>Caption: {snapshot.caption}</Text>}
        {!!snapshot.media_url && (
          <>
            <Text style={styles.meta}>Media: {snapshot.media_type || 'unknown'}</Text>
            {snapshot.media_type === 'image' ? (
              <Image source={{ uri: snapshot.media_url }} style={styles.reportImage} resizeMode="cover" />
            ) : (
              <Text style={styles.linkText}>{snapshot.media_url}</Text>
            )}
          </>
        )}

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.button, styles.approveButton, busy && styles.buttonDisabled]}
            disabled={busy}
            onPress={() => handleApproveReport(item.id)}
          >
            {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Approve</Text>}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.denyButton, busy && styles.buttonDisabled]}
            disabled={busy}
            onPress={() => handleDenyReport(item.id)}
          >
            <Text style={styles.buttonText}>Deny</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Admin Panel</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.subtitle}>Pending vendor KYC requests ({pendingKycRequests.length})</Text>
      <Text style={styles.adminName}>Logged in as {adminUser?.name || 'Admin'}</Text>

      <FlatList
        data={pendingKycRequests}
        keyExtractor={(item) => item.vendor_id}
        renderItem={renderVendorItem}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={styles.emptyText}>No pending KYC approval requests.</Text>
          </View>
        }
        ListFooterComponent={
          <View style={styles.footerSection}>
            <Text style={styles.subtitle}>Pending user/jobs KYC requests ({pendingUserKycRequests.length})</Text>
            {pendingUserKycRequests.length === 0 ? (
              <View style={styles.centeredCompact}>
                <Text style={styles.emptyText}>No pending user KYC approval requests.</Text>
              </View>
            ) : (
              pendingUserKycRequests.map((item) => (
                <View key={item.id}>
                  {renderUserKycItem({ item })}
                </View>
              ))
            )}

            <Text style={styles.subtitle}>Pending reported posts ({pendingPostReports.length})</Text>
            {pendingPostReports.length === 0 ? (
              <View style={styles.centeredCompact}>
                <Text style={styles.emptyText}>No pending post reports.</Text>
              </View>
            ) : (
              pendingPostReports.map((item) => (
                <View key={item.id}>
                  {renderReportedPostItem({ item })}
                </View>
              ))
            )}
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.xs,
  },
  adminName: {
    fontSize: 13,
    color: COLORS.textSecondary,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
  logoutText: {
    color: COLORS.primary,
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
  listContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
    gap: SPACING.md,
  },
  footerSection: {
    marginTop: SPACING.lg,
    gap: SPACING.md,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 6,
  },
  businessName: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
  },
  meta: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  actionRow: {
    marginTop: SPACING.sm,
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  button: {
    flex: 1,
    paddingVertical: SPACING.sm + 2,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  approveButton: {
    backgroundColor: COLORS.success,
  },
  denyButton: {
    backgroundColor: COLORS.error,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  centeredCompact: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 15,
    textAlign: 'center',
  },
  reportImage: {
    width: '100%',
    height: 180,
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.xs,
  },
  linkText: {
    color: COLORS.primary,
    fontSize: 12,
    marginTop: SPACING.xs,
  },
});
