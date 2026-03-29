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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { COLORS, SPACING, BORDER_RADIUS } from '../../src/constants/theme';
import {
  AdminVendorReview,
  adminApproveVendor,
  adminRejectVendor,
  getAdminVendorReviewQueue,
} from '../../src/services/api';
import { useAdminStore } from '../../src/store/adminStore';

export default function AdminPanelScreen() {
  const router = useRouter();
  const { adminToken, isAdminAuthenticated, adminLogout, adminUser } = useAdminStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingVendorId, setProcessingVendorId] = useState<string | null>(null);
  const [requests, setRequests] = useState<AdminVendorReview[]>([]);

  const isKycCompleted = (record: AdminVendorReview) => {
    const hasOtpVerified = !!record.aadhaar_otp_verified_at;
    const hasAllDocs = !!record.aadhar_url && !!record.pan_url && !!record.face_scan_url;
    return hasOtpVerified || hasAllDocs;
  };

  const pendingKycRequests = useMemo(
    () => requests.filter((record) => (record.review_status || 'pending') === 'pending' && isKycCompleted(record)),
    [requests]
  );

  const loadRequests = async () => {
    if (!adminToken) return;
    try {
      const response = await getAdminVendorReviewQueue(adminToken, 'pending');
      setRequests(Array.isArray(response.data) ? response.data : []);
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
    setProcessingVendorId(vendorId);
    try {
      await adminApproveVendor(adminToken, vendorId);
      await loadRequests();
      Alert.alert('Success', 'Vendor approved.');
    } catch (error: any) {
      const detail = error?.response?.data?.detail || 'Approve failed';
      Alert.alert('Error', detail);
    } finally {
      setProcessingVendorId(null);
    }
  };

  const handleDeny = async (vendorId: string) => {
    if (!adminToken) return;
    setProcessingVendorId(vendorId);
    try {
      await adminRejectVendor(adminToken, vendorId, 'Denied by admin');
      await loadRequests();
      Alert.alert('Updated', 'Vendor request denied. Business stays in pending state.');
    } catch (error: any) {
      const detail = error?.response?.data?.detail || 'Deny failed';
      Alert.alert('Error', detail);
    } finally {
      setProcessingVendorId(null);
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

  const renderItem = ({ item }: { item: AdminVendorReview }) => {
    const busy = processingVendorId === item.vendor_id;

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
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={styles.emptyText}>No pending KYC approval requests.</Text>
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
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 15,
    textAlign: 'center',
  },
});
