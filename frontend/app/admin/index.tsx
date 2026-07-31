// accessibility: placeholder
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
  AdminAnonymousUser,
  adminApproveVendor,
  adminRejectVendor,
  adminReviewReport,
  adminVerifyUserKyc,
  getAdminReports,
  getAdminPendingKyc,
  getAdminVendorReviewQueue,
  getAdminAnonymousUsers,
  disableAdminAnonymousUser,
  adminListPersonalityVerifications,
  adminActionPersonalityVerification,
  AdminPersonalityVerification,
  AdminSOSMisuseReport,
  getAdminSOSMisuseReports,
  adminBlockSOS,
  adminUnblockSOS,
  adminDeleteVendor,
  adminDeleteUserKyc,
} from '../../src/services/api';
import { useAdminStore } from '../../src/store/adminStore';
import { Ionicons } from '@expo/vector-icons';

// UI Helper Component for Metadata rows
const InfoRow = ({ icon, label, value }: { icon: string; label: string; value: string }) => (
  <View style={styles.infoRow}>
    <Ionicons name={icon as any} size={14} color={COLORS.textSecondary} style={styles.infoIcon} />
    <Text style={styles.infoLabel}>{label}:</Text>
    <Text style={styles.infoValue} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
  </View>
);

// UI Helper Component for Section Header
const SectionHeader = ({ title, count }: { title: string; count: number }) => (
  <View style={styles.sectionHeaderContainer}>
    <View style={styles.sectionHeaderIndicator} />
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.countBadge}>
      <Text style={styles.countBadgeText}>{count}</Text>
    </View>
  </View>
);

export default function AdminPanelScreen() {
  const router = useRouter();
  const { adminToken, isAdminAuthenticated, adminLogout, adminUser } = useAdminStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingKey, setProcessingKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'verified'>('pending');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const [vendorRequests, setVendorRequests] = useState<AdminVendorReview[]>([]);
  const [verifiedVendorRequests, setVerifiedVendorRequests] = useState<AdminVendorReview[]>([]);

  const [userKycRequests, setUserKycRequests] = useState<AdminUserKycRequest[]>([]);
  const [verifiedUserKycRequests, setVerifiedUserKycRequests] = useState<AdminUserKycRequest[]>([]);

  const [reportedPosts, setReportedPosts] = useState<AdminPostReport[]>([]);
  const [anonymousUsers, setAnonymousUsers] = useState<AdminAnonymousUser[]>([]);

  const [personalityRequests, setPersonalityRequests] = useState<AdminPersonalityVerification[]>([]);
  const [verifiedPersonalityRequests, setVerifiedPersonalityRequests] = useState<AdminPersonalityVerification[]>([]);

  const [misuseReports, setMisuseReports] = useState<AdminSOSMisuseReport[]>([]);

  const isKycCompleted = (record: AdminVendorReview) => {
    const hasOtpVerified = !!record.aadhaar_otp_verified_at;
    const hasAadhaar = !!record.aadhar_url;
    const hasPan = !!record.pan_url;
    return hasOtpVerified || hasAadhaar || hasPan;
  };

  const pendingKycRequests = useMemo(
    () => vendorRequests
      .filter((record) => (record.review_status || 'pending') === 'pending' && isKycCompleted(record))
      .sort((a, b) => new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime()),
    [vendorRequests]
  );

  const approvedKycRequests = useMemo(
    () => (verifiedVendorRequests || [])
      .filter((record) => record.review_status === 'approved')
      .sort((a, b) => new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime()),
    [verifiedVendorRequests]
  );

  const pendingUserKycRequests = useMemo(
    () => (userKycRequests || [])
      .filter((record) => !!record?.id)
      .sort((a, b) => new Date(b.kyc_submitted_at || 0).getTime() - new Date(a.kyc_submitted_at || 0).getTime()),
    [userKycRequests]
  );

  const approvedUserKycRequests = useMemo(
    () => (verifiedUserKycRequests || [])
      .filter((record) => !!record?.id)
      .sort((a, b) => new Date(b.kyc_submitted_at || 0).getTime() - new Date(a.kyc_submitted_at || 0).getTime()),
    [verifiedUserKycRequests]
  );

  const pendingPostReports = useMemo(
    () => (reportedPosts || [])
      .filter((record) => (record?.status || 'pending') === 'pending')
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()),
    [reportedPosts]
  );

  const activeAnonymousUsers = useMemo(
    () => (anonymousUsers || [])
      .filter((user) => !user.anonymous_disabled)
      .sort((a, b) => new Date(b.anonymous_created_at || 0).getTime() - new Date(a.anonymous_created_at || 0).getTime()),
    [anonymousUsers]
  );

  const disabledAnonymousUsers = useMemo(
    () => (anonymousUsers || [])
      .filter((user) => !!user.anonymous_disabled)
      .sort((a, b) => new Date(b.anonymous_created_at || 0).getTime() - new Date(a.anonymous_created_at || 0).getTime()),
    [anonymousUsers]
  );

  const pendingPersonalityRequests = useMemo(
    () => (personalityRequests || [])
      .filter((req) => req.status === 'pending')
      .sort((a, b) => new Date(b.submitted_at || 0).getTime() - new Date(a.submitted_at || 0).getTime()),
    [personalityRequests]
  );

  const approvedPersonalityRequests = useMemo(
    () => (verifiedPersonalityRequests || [])
      .filter((req) => req.status === 'approved')
      .sort((a, b) => new Date(b.submitted_at || 0).getTime() - new Date(a.submitted_at || 0).getTime()),
    [verifiedPersonalityRequests]
  );

  const sortedMisuseReports = useMemo(
    () => (misuseReports || [])
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()),
    [misuseReports]
  );

  const loadRequests = async () => {
    if (!adminToken) return;
    try {
      const [
        vendorResponse,
        verifiedVendorResponse,
        userKycResponse,
        verifiedUserKycResponse,
        reportsResponse,
        anonymousResponse,
        personalityResponse,
        verifiedPersonalityResponse,
        sosReportsResponse
      ] = await Promise.all([
        getAdminVendorReviewQueue(adminToken, 'pending'),
        getAdminVendorReviewQueue(adminToken, 'approved'),
        getAdminPendingKyc(adminToken, 'pending'),
        getAdminPendingKyc(adminToken, 'verified'),
        getAdminReports(adminToken, 'pending', undefined, 150),
        getAdminAnonymousUsers(adminToken),
        adminListPersonalityVerifications(adminToken, 'pending'),
        adminListPersonalityVerifications(adminToken, 'approved'),
        getAdminSOSMisuseReports(adminToken),
      ]);
      console.log('[Admin] Loaded requests:', {
        vendors: vendorResponse.data?.length,
        verifiedVendors: verifiedVendorResponse.data?.length,
        kyc: userKycResponse.data?.length,
        verifiedKyc: verifiedUserKycResponse.data?.length,
        personality: personalityResponse.data?.length,
        verifiedPersonality: verifiedPersonalityResponse.data?.length,
        sosReports: sosReportsResponse.data?.length
      });
      setVendorRequests(Array.isArray(vendorResponse.data) ? vendorResponse.data : []);
      setVerifiedVendorRequests(Array.isArray(verifiedVendorResponse.data) ? verifiedVendorResponse.data : []);
      setUserKycRequests(Array.isArray(userKycResponse.data) ? userKycResponse.data : []);
      setVerifiedUserKycRequests(Array.isArray(verifiedUserKycResponse.data) ? verifiedUserKycResponse.data : []);
      setReportedPosts(Array.isArray(reportsResponse.data) ? reportsResponse.data : []);
      setAnonymousUsers(Array.isArray(anonymousResponse.data?.users) ? anonymousResponse.data.users : []);
      setPersonalityRequests(Array.isArray(personalityResponse.data) ? personalityResponse.data : []);
      setVerifiedPersonalityRequests(Array.isArray(verifiedPersonalityResponse.data) ? verifiedPersonalityResponse.data : []);
      setMisuseReports(Array.isArray(sosReportsResponse.data) ? sosReportsResponse.data : []);
    } catch (error: any) {
      console.error('[Admin] Load failed:', error);
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

  const handleDeleteVendor = async (vendorId: string) => {
    if (!adminToken) return;
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to permanently delete this vendor? This will delete the vendor profile, reset the owner’s KYC status, and remove any verified badges.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setProcessingKey(`vendor:${vendorId}`);
            try {
              await adminDeleteVendor(adminToken, vendorId);
              await loadRequests();
              Alert.alert('Success', 'Vendor deleted successfully.');
            } catch (error: any) {
              const detail = error?.response?.data?.detail || 'Delete failed';
              Alert.alert('Error', detail);
            } finally {
              setProcessingKey(null);
            }
          },
        },
      ]
    );
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

  const handleDeleteUserKyc = async (userId: string) => {
    if (!adminToken) return;
    Alert.alert(
      'Confirm Reset',
      "Are you sure you want to permanently delete/reset this user's KYC? This will reset their KYC status, remove their verified badge, and clear all submitted documents.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete & Reset',
          style: 'destructive',
          onPress: async () => {
            setProcessingKey(`user:${userId}`);
            try {
              await adminDeleteUserKyc(adminToken, userId);
              await loadRequests();
              Alert.alert('Success', 'User KYC deleted and reset successfully.');
            } catch (error: any) {
              const detail = error?.response?.data?.detail || 'Delete failed';
              Alert.alert('Error', detail);
            } finally {
              setProcessingKey(null);
            }
          },
        },
      ]
    );
  };


  const handleApprovePost = async (reportId: string) => {
    if (!adminToken) return;
    setProcessingKey(`report:${reportId}`);
    try {
      await adminReviewReport(adminToken, reportId, 'deny', 'Approved by admin');
      await loadRequests();
      Alert.alert('Success', 'Content approved and kept.');
    } catch (error: any) {
      const detail = error?.response?.data?.detail || 'Approve failed';
      Alert.alert('Error', detail);
    } finally {
      setProcessingKey(null);
    }
  };

  const handleDeletePost = async (reportId: string) => {
    if (!adminToken) return;
    setProcessingKey(`report:${reportId}`);
    try {
      await adminReviewReport(adminToken, reportId, 'approve');
      await loadRequests();
      Alert.alert('Success', 'Content deleted successfully.');
    } catch (error: any) {
      const detail = error?.response?.data?.detail || 'Delete failed';
      Alert.alert('Error', detail);
    } finally {
      setProcessingKey(null);
    }
  };

  const handleDisableAnonymousUser = async (userId: string) => {
    if (!adminToken) return;
    setProcessingKey(`anonymous:${userId}`);
    try {
      await disableAdminAnonymousUser(adminToken, userId);
      await loadRequests();
      Alert.alert('Success', 'Anonymous user disabled. They can no longer login.');
    } catch (error: any) {
      const detail = error?.response?.data?.detail || 'Disable failed';
      Alert.alert('Error', detail);
    } finally {
      setProcessingKey(null);
    }
  };

  const handlePersonalityAction = async (requestId: string, action: 'approve' | 'reject') => {
    if (!adminToken) return;
    setProcessingKey(`personality:${requestId}`);
    try {
      await adminActionPersonalityVerification(adminToken, requestId, action);
      await loadRequests();
      Alert.alert('Success', `Personality verification ${action}ed.`);
    } catch (error: any) {
      const detail = error?.response?.data?.detail || `${action} failed`;
      Alert.alert('Error', detail);
    } finally {
      setProcessingKey(null);
    }
  };

  const handleBlockUserSOS = async (userId: string) => {
    if (!adminToken) return;
    setProcessingKey(`block:${userId}`);
    try {
      await adminBlockSOS(adminToken, userId);
      await loadRequests();
      Alert.alert('Success', 'User SOS privileges suspended.');
    } catch (error: any) {
      const detail = error?.response?.data?.detail || 'Failed to suspend privileges';
      Alert.alert('Error', detail);
    } finally {
      setProcessingKey(null);
    }
  };

  const handleUnblockUserSOS = async (userId: string) => {
    if (!adminToken) return;
    setProcessingKey(`unblock:${userId}`);
    try {
      await adminUnblockSOS(adminToken, userId);
      await loadRequests();
      Alert.alert('Success', 'User SOS privileges restored.');
    } catch (error: any) {
      const detail = error?.response?.data?.detail || 'Failed to restore privileges';
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
    const isExpanded = expandedId === item.vendor_id;

    return (
      <TouchableOpacity activeOpacity={0.9} onPress={() => toggleExpand(item.vendor_id)} style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.titleIconGroup}>
            <View style={[styles.iconWrapper, { backgroundColor: 'rgba(255, 102, 0, 0.08)' }]}>
              <Ionicons name="business" size={18} color={COLORS.primary} />
            </View>
            <Text style={styles.businessName}>{item.business_name || 'Unnamed Business'}</Text>
          </View>
          <Ionicons 
            name={isExpanded ? "chevron-up" : "chevron-down"} 
            size={18} 
            color={COLORS.textSecondary} 
          />
        </View>

        <View style={styles.cardBody}>
          <InfoRow icon="person-outline" label="Owner" value={item.owner_name || 'N/A'} />
          <InfoRow icon="phone-portrait-outline" label="Phone" value={item.phone_number || 'N/A'} />

          {isExpanded ? (
            <View style={styles.expandedContent}>
              <InfoRow icon="location-outline" label="Address" value={item.full_address || 'N/A'} />
              <InfoRow icon="pricetags-outline" label="Categories" value={(item.categories || []).join(', ') || 'N/A'} />
              <InfoRow icon="shield-checkmark-outline" label="Aadhaar OTP" value={item.aadhaar_otp_verified_at ? `Verified at ${item.aadhaar_otp_verified_at}` : 'No'} />
              <InfoRow icon="alert-circle-outline" label="Status" value={item.review_status || 'pending'} />

              <Text style={styles.sectionSub}>Submitted Documents</Text>
              <View style={styles.docRow}>
                {item.aadhar_url ? (
                  <TouchableOpacity 
                    style={styles.docItem}
                    onPress={() => Alert.alert('Aadhaar Document', item.aadhar_url || undefined)}
                    activeOpacity={0.7}
                  >
                    <Image source={{ uri: item.aadhar_url }} style={styles.docThumbnail} />
                    <View style={styles.docBadge}>
                      <Text style={styles.docBadgeText}>Aadhaar</Text>
                    </View>
                  </TouchableOpacity>
                ) : null}
                {item.pan_url ? (
                  <TouchableOpacity 
                    style={styles.docItem}
                    onPress={() => Alert.alert('PAN Document', item.pan_url || undefined)}
                    activeOpacity={0.7}
                  >
                    <Image source={{ uri: item.pan_url }} style={styles.docThumbnail} />
                    <View style={styles.docBadge}>
                      <Text style={styles.docBadgeText}>PAN</Text>
                    </View>
                  </TouchableOpacity>
                ) : null}
                {item.face_scan_url ? (
                  <TouchableOpacity 
                    style={styles.docItem}
                    onPress={() => Alert.alert('Face Scan / Selfie', item.face_scan_url || undefined)}
                    activeOpacity={0.7}
                  >
                    <Image source={{ uri: item.face_scan_url }} style={styles.docThumbnail} />
                    <View style={styles.docBadge}>
                      <Text style={styles.docBadgeText}>Selfie</Text>
                    </View>
                  </TouchableOpacity>
                ) : null}
                {!item.aadhar_url && !item.pan_url && !item.face_scan_url && (
                  <View style={styles.noDocsContainer}>
                    <Ionicons name="document-text-outline" size={20} color={COLORS.textLight} />
                    <Text style={styles.emptyTextCompact}>No documents uploaded.</Text>
                  </View>
                )}
              </View>
            </View>
          ) : (
            <View style={styles.expandHintContainer}>
              <Text style={styles.expandHint}>Tap to view details & documents</Text>
            </View>
          )}
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.button, styles.approveButton, busy && styles.buttonDisabled]}
            disabled={busy}
            onPress={() => handleApprove(item.vendor_id)}
            activeOpacity={0.8}
          >
            {busy ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <View style={styles.buttonInner}>
                <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />
                <Text style={styles.buttonText}>Approve</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.warningButton, busy && styles.buttonDisabled]}
            disabled={busy}
            onPress={() => handleDeny(item.vendor_id)}
            activeOpacity={0.8}
          >
            <View style={styles.buttonInner}>
              <Ionicons name="close-circle-outline" size={16} color="#fff" />
              <Text style={styles.buttonText}>Deny</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.deleteButton, busy && styles.buttonDisabled]}
            disabled={busy}
            onPress={() => handleDeleteVendor(item.vendor_id)}
            activeOpacity={0.8}
          >
            <View style={styles.buttonInner}>
              <Ionicons name="trash-outline" size={16} color="#fff" />
              <Text style={styles.buttonText}>Delete</Text>
            </View>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderUserKycItem = ({ item }: { item: AdminUserKycRequest }) => {
    const busy = processingKey === `user:${item.id}`;
    const isExpanded = expandedId === item.id;

    return (
      <TouchableOpacity activeOpacity={0.9} onPress={() => toggleExpand(item.id)} style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.titleIconGroup}>
            <View style={[styles.iconWrapper, { backgroundColor: 'rgba(33, 150, 243, 0.08)' }]}>
              <Ionicons name="person" size={18} color="#2196F3" />
            </View>
            <Text style={styles.businessName}>{item.name || 'Unnamed User'}</Text>
          </View>
          <Ionicons 
            name={isExpanded ? "chevron-up" : "chevron-down"} 
            size={18} 
            color={COLORS.textSecondary} 
          />
        </View>

        <View style={styles.cardBody}>
          <InfoRow icon="finger-print-outline" label="SL ID" value={item.sl_id || 'N/A'} />
          <InfoRow icon="call-outline" label="Phone" value={item.kyc_verified_phone || item.phone || 'N/A'} />
          <InfoRow icon="briefcase-outline" label="Role" value={item.kyc_role || 'N/A'} />
          <InfoRow icon="document-text-outline" label="Request No" value={item.kyc_request_no || 'N/A'} />

          {isExpanded ? (
            <View style={styles.expandedContent}>
              <InfoRow icon="card-outline" label="ID Type" value={item.kyc_id_type || 'N/A'} />
              <InfoRow icon="barcode-outline" label="ID Number" value={item.kyc_id_number || 'N/A'} />
              <InfoRow icon="time-outline" label="Submitted" value={item.kyc_submitted_at || 'N/A'} />

              <Text style={styles.sectionSub}>Submitted Documents</Text>
              <View style={styles.docRow}>
                {item.kyc_id_photo ? (
                  <TouchableOpacity 
                    style={styles.docItem}
                    onPress={() => Alert.alert('ID Photo', item.kyc_id_photo)}
                    activeOpacity={0.7}
                  >
                    <Image source={{ uri: item.kyc_id_photo }} style={styles.docThumbnail} />
                    <View style={styles.docBadge}>
                      <Text style={styles.docBadgeText}>ID Photo</Text>
                    </View>
                  </TouchableOpacity>
                ) : null}
                {item.kyc_selfie_photo ? (
                  <TouchableOpacity 
                    style={styles.docItem}
                    onPress={() => Alert.alert('Selfie Photo', item.kyc_selfie_photo)}
                    activeOpacity={0.7}
                  >
                    <Image source={{ uri: item.kyc_selfie_photo }} style={styles.docThumbnail} />
                    <View style={styles.docBadge}>
                      <Text style={styles.docBadgeText}>Selfie</Text>
                    </View>
                  </TouchableOpacity>
                ) : null}
                {!item.kyc_id_photo && !item.kyc_selfie_photo && (
                  <View style={styles.noDocsContainer}>
                    <Ionicons name="document-text-outline" size={20} color={COLORS.textLight} />
                    <Text style={styles.emptyTextCompact}>No documents uploaded.</Text>
                  </View>
                )}
              </View>
            </View>
          ) : (
            <View style={styles.expandHintContainer}>
              <Text style={styles.expandHint}>Tap to view details & documents</Text>
            </View>
          )}
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.button, styles.approveButton, busy && styles.buttonDisabled]}
            disabled={busy}
            onPress={() => handleApproveUserKyc(item.id)}
            activeOpacity={0.8}
          >
            {busy ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <View style={styles.buttonInner}>
                <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />
                <Text style={styles.buttonText}>Approve</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.denyButton, busy && styles.buttonDisabled]}
            disabled={busy}
            onPress={() => handleDenyUserKyc(item.id)}
            activeOpacity={0.8}
          >
            <View style={styles.buttonInner}>
              <Ionicons name="close-circle-outline" size={16} color="#fff" />
              <Text style={styles.buttonText}>Deny</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.deleteButton, busy && styles.buttonDisabled]}
            disabled={busy}
            onPress={() => handleDeleteUserKyc(item.id)}
            activeOpacity={0.8}
          >
            <View style={styles.buttonInner}>
              <Ionicons name="trash-outline" size={16} color="#fff" />
              <Text style={styles.buttonText}>Delete</Text>
            </View>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderReportedPostItem = ({ item }: { item: AdminPostReport }) => {
    const busy = processingKey === `report:${item.id}`;
    const snapshot = item.snapshot || {};
    const isComment = item.content_type === 'comment';

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.titleIconGroup}>
            <View style={[styles.iconWrapper, { backgroundColor: isComment ? 'rgba(156, 39, 176, 0.08)' : 'rgba(229, 57, 53, 0.08)' }]}>
              <Ionicons name={isComment ? "chatbubble-outline" : "warning"} size={18} color={isComment ? "#9C27B0" : COLORS.error} />
            </View>
            <Text style={styles.businessName}>{isComment ? 'Reported Comment' : 'Reported Post'}</Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <InfoRow 
            icon="flag-outline" 
            label="Reporter" 
            value={`${item.reporter_name || 'N/A'} (ID: ${item.reporter_username || item.reporter_id || 'N/A'})`}
          />
          <InfoRow 
            icon="person-outline" 
            label="Content Creator" 
            value={`${item.reported_user_name || (isComment ? snapshot.comment_username : snapshot.post_username) || 'N/A'} (ID: ${item.reported_user_username || (isComment ? snapshot.comment_user_id : snapshot.post_user_id) || item.reported_user_id || 'N/A'})`} 
          />
          <InfoRow icon="alert-circle-outline" label="Category" value={item.category || 'other'} />
          {!!item.description && <InfoRow icon="chatbubble-ellipses-outline" label="Reason" value={item.description} />}
          {isComment ? (
            !!snapshot.text && <InfoRow icon="chatbox-ellipses-outline" label="Comment Text" value={snapshot.text} />
          ) : (
            !!snapshot.caption && <InfoRow icon="document-text-outline" label="Caption" value={snapshot.caption} />
          )}
          
          {!isComment && !!snapshot.media_url && (
            <View style={styles.reportedMediaContainer}>
              <Text style={styles.reportedMediaTitle}>
                <Ionicons name="image-outline" size={12} color={COLORS.textSecondary} /> Media Preview ({snapshot.media_type || 'unknown'}):
              </Text>
              {snapshot.media_type === 'image' ? (
                <Image source={{ uri: snapshot.media_url }} style={styles.reportImage} resizeMode="cover" />
              ) : (
                <Text style={styles.linkText} numberOfLines={1}>{snapshot.media_url}</Text>
              )}
            </View>
          )}
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.button, styles.approveButton, busy && styles.buttonDisabled]}
            disabled={busy}
            onPress={() => handleApprovePost(item.id)}
            activeOpacity={0.8}
          >
            {busy ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <View style={styles.buttonInner}>
                <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />
                <Text style={styles.buttonText}>{isComment ? 'Keep Comment' : 'Keep Post'}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.denyButton, busy && styles.buttonDisabled]}
            disabled={busy}
            onPress={() => handleDeletePost(item.id)}
            activeOpacity={0.8}
          >
            <View style={styles.buttonInner}>
              <Ionicons name="trash-outline" size={16} color="#fff" />
              <Text style={styles.buttonText}>{isComment ? 'Delete Comment' : 'Delete Post'}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderMisuseReportItem = ({ item }: { item: AdminSOSMisuseReport }) => {
    const isBlocking = processingKey === `block:${item.creator_id}`;
    const isUnblocking = processingKey === `unblock:${item.creator_id}`;
    
    return (
      <View style={styles.card} key={item.id}>
        <View style={styles.cardHeader}>
          <View style={styles.titleIconGroup}>
            <View style={[styles.iconWrapper, { backgroundColor: 'rgba(229, 57, 53, 0.12)' }]}>
              <Ionicons name="alert-circle" size={18} color={COLORS.error} />
            </View>
            <Text style={styles.businessName}>SOS Misuse Report</Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <InfoRow icon="barcode-outline" label="Report ID" value={item.id} />
          <InfoRow icon="person-outline" label="Creator" value={`${item.creator_name || 'N/A'} (ID: ${item.creator_id})`} />
          <InfoRow icon="flag-outline" label="Reporter" value={`${item.reporter_name || 'N/A'} (ID: ${item.reporter_id})`} />
          <InfoRow icon="chatbubble-outline" label="Reason" value={item.reason || 'N/A'} />
          <InfoRow icon="time-outline" label="Timestamp" value={item.created_at || 'N/A'} />
        </View>
        
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.button, styles.denyButton, isBlocking && styles.buttonDisabled]}
            disabled={isBlocking || isUnblocking}
            onPress={() => handleBlockUserSOS(item.creator_id)}
            activeOpacity={0.8}
          >
            {isBlocking ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <View style={styles.buttonInner}>
                <Ionicons name="ban-outline" size={16} color="#fff" />
                <Text style={styles.buttonText}>Block SOS</Text>
              </View>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, styles.approveButton, isUnblocking && styles.buttonDisabled]}
            disabled={isBlocking || isUnblocking}
            onPress={() => handleUnblockUserSOS(item.creator_id)}
            activeOpacity={0.8}
          >
            {isUnblocking ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <View style={styles.buttonInner}>
                <Ionicons name="checkmark-done-circle-outline" size={16} color="#fff" />
                <Text style={styles.buttonText}>Unblock SOS</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderAnonymousUserItem = ({ item }: { item: AdminAnonymousUser }) => {
    const busy = processingKey === `anonymous:${item.id}`;
    const displayName = item.name || item.phone || item.id;
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.titleIconGroup}>
            <View style={[styles.iconWrapper, { backgroundColor: 'rgba(156, 39, 176, 0.08)' }]}>
              <Ionicons name="eye-off-outline" size={18} color="#9C27B0" />
            </View>
            <Text style={styles.businessName}>{displayName}</Text>
          </View>
          <View style={[
            styles.miniStatusBadge, 
            item.anonymous_disabled ? styles.miniStatusBadgeDisabled : styles.miniStatusBadgeActive
          ]}>
            <Text style={styles.miniStatusBadgeText}>
              {item.anonymous_disabled ? 'DISABLED' : 'ACTIVE'}
            </Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <InfoRow icon="phone-portrait-outline" label="Phone" value={item.phone || 'N/A'} />
        </View>

        {!item.anonymous_disabled && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.button, styles.denyButton, busy && styles.buttonDisabled]}
              disabled={busy || item.anonymous_disabled}
              onPress={() => handleDisableAnonymousUser(item.id)}
              activeOpacity={0.8}
            >
              {busy ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <View style={styles.buttonInner}>
                  <Ionicons name="ban-outline" size={16} color="#fff" />
                  <Text style={styles.buttonText}>Disable Access</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const renderPersonalityRequestItem = ({ item }: { item: AdminPersonalityVerification }) => {
    const busy = processingKey === `personality:${item.id}`;
    const level = item.level || 'unknown';

    return (
      <View style={styles.card}>
        <View style={styles.badgeContainer}>
          <Text style={[styles.levelBadge, level === 'national' ? styles.nationalBadge : styles.stateBadge]}>
            {level.toUpperCase()}
          </Text>
        </View>

        <View style={styles.cardHeader}>
          <View style={styles.titleIconGroup}>
            <View style={[styles.iconWrapper, { backgroundColor: 'rgba(255, 215, 0, 0.1)' }]}>
              <Ionicons name="ribbon-outline" size={18} color="#FFD700" />
            </View>
            <Text style={styles.businessName}>{item.full_name || 'Anonymous'}</Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <InfoRow icon="star-outline" label="Profession" value={item.profession} />
          <InfoRow icon="business-outline" label="Organization" value={item.organization || 'N/A'} />
          <InfoRow icon="location-outline" label="City" value={item.city || 'N/A'} />
          <InfoRow icon="earth-outline" label="Areas" value={Array.isArray(item.areas) ? item.areas.join(', ') : 'None'} />
          <InfoRow icon="calendar-outline" label="Experience" value={item.experience || 'N/A'} />
          
          <View style={styles.bioContainer}>
            <Ionicons name="document-text-outline" size={14} color={COLORS.textSecondary} style={{ marginRight: 6 }} />
            <Text style={styles.bioText} numberOfLines={3}>{`"${item.bio || 'No bio provided'}"`}</Text>
          </View>

          <Text style={styles.sectionSub}>Submitted Documents ({item.doc_type})</Text>
          <View style={styles.docRow}>
            <TouchableOpacity 
              style={styles.docItem}
              onPress={() => Alert.alert('View Document', item.front_url)}
              activeOpacity={0.7}
            >
              <Image source={{ uri: item.front_url }} style={styles.docThumbnail} />
              <View style={styles.docBadge}>
                <Text style={styles.docBadgeText}>Front</Text>
              </View>
            </TouchableOpacity>
            {item.back_url && (
              <TouchableOpacity 
                style={styles.docItem}
                onPress={() => Alert.alert('View Document', item.back_url)}
                activeOpacity={0.7}
              >
                <Image source={{ uri: item.back_url }} style={styles.docThumbnail} />
                <View style={styles.docBadge}>
                  <Text style={styles.docBadgeText}>Back</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.button, styles.approveButton, busy && styles.buttonDisabled]}
            disabled={busy}
            onPress={() => handlePersonalityAction(item.id, 'approve')}
            activeOpacity={0.8}
          >
            {busy ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <View style={styles.buttonInner}>
                <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />
                <Text style={styles.buttonText}>Approve</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.denyButton, busy && styles.buttonDisabled]}
            disabled={busy}
            onPress={() => handlePersonalityAction(item.id, 'reject')}
            activeOpacity={0.8}
          >
            <View style={styles.buttonInner}>
              <Ionicons name="close-circle-outline" size={16} color="#fff" />
              <Text style={styles.buttonText}>Reject</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderApprovedVendorItem = ({ item }: { item: AdminVendorReview }) => {
    const busy = processingKey === `vendor:${item.vendor_id}`;
    const isExpanded = expandedId === item.vendor_id;

    return (
      <TouchableOpacity activeOpacity={0.9} onPress={() => toggleExpand(item.vendor_id)} style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.titleIconGroup}>
            <View style={[styles.iconWrapper, { backgroundColor: 'rgba(76, 175, 80, 0.08)' }]}>
              <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
            </View>
            <Text style={styles.businessName}>{item.business_name || 'Unnamed Business'}</Text>
          </View>
          <View style={[styles.statusBadge, styles.successBadge]}>
            <Text style={styles.statusBadgeText}>APPROVED</Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <InfoRow icon="person-outline" label="Owner" value={item.owner_name || 'N/A'} />
          <InfoRow icon="phone-portrait-outline" label="Phone" value={item.phone_number || 'N/A'} />

          {isExpanded ? (
            <View style={styles.expandedContent}>
              <InfoRow icon="location-outline" label="Address" value={item.full_address || 'N/A'} />
              <InfoRow icon="pricetags-outline" label="Categories" value={(item.categories || []).join(', ') || 'N/A'} />
              <InfoRow icon="shield-checkmark-outline" label="Aadhaar OTP" value={item.aadhaar_otp_verified_at || 'No'} />

              <Text style={styles.sectionSub}>Submitted Documents</Text>
              <View style={styles.docRow}>
                {item.aadhar_url ? (
                  <TouchableOpacity 
                    style={styles.docItem}
                    onPress={() => Alert.alert('Aadhaar Document', item.aadhar_url || undefined)}
                    activeOpacity={0.7}
                  >
                    <Image source={{ uri: item.aadhar_url }} style={styles.docThumbnail} />
                    <View style={styles.docBadge}>
                      <Text style={styles.docBadgeText}>Aadhaar</Text>
                    </View>
                  </TouchableOpacity>
                ) : null}
                {item.pan_url ? (
                  <TouchableOpacity 
                    style={styles.docItem}
                    onPress={() => Alert.alert('PAN Document', item.pan_url || undefined)}
                    activeOpacity={0.7}
                  >
                    <Image source={{ uri: item.pan_url }} style={styles.docThumbnail} />
                    <View style={styles.docBadge}>
                      <Text style={styles.docBadgeText}>PAN</Text>
                    </View>
                  </TouchableOpacity>
                ) : null}
                {item.face_scan_url ? (
                  <TouchableOpacity 
                    style={styles.docItem}
                    onPress={() => Alert.alert('Face Scan / Selfie', item.face_scan_url || undefined)}
                    activeOpacity={0.7}
                  >
                    <Image source={{ uri: item.face_scan_url }} style={styles.docThumbnail} />
                    <View style={styles.docBadge}>
                      <Text style={styles.docBadgeText}>Selfie</Text>
                    </View>
                  </TouchableOpacity>
                ) : null}
                {!item.aadhar_url && !item.pan_url && !item.face_scan_url && (
                  <View style={styles.noDocsContainer}>
                    <Ionicons name="document-text-outline" size={20} color={COLORS.textLight} />
                    <Text style={styles.emptyTextCompact}>No documents uploaded.</Text>
                  </View>
                )}
              </View>
            </View>
          ) : (
            <View style={styles.expandHintContainer}>
              <Text style={styles.expandHint}>Tap to view details & documents</Text>
            </View>
          )}
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.button, styles.deleteButton, busy && styles.buttonDisabled]}
            disabled={busy}
            onPress={() => handleDeleteVendor(item.vendor_id)}
            activeOpacity={0.8}
          >
            {busy ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <View style={styles.buttonInner}>
                <Ionicons name="trash-outline" size={16} color="#fff" />
                <Text style={styles.buttonText}>Delete Vendor</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderApprovedUserKycItem = ({ item }: { item: AdminUserKycRequest }) => {
    const busy = processingKey === `user:${item.id}`;
    const isExpanded = expandedId === item.id;

    return (
      <TouchableOpacity activeOpacity={0.9} onPress={() => toggleExpand(item.id)} style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.titleIconGroup}>
            <View style={[styles.iconWrapper, { backgroundColor: 'rgba(76, 175, 80, 0.08)' }]}>
              <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
            </View>
            <Text style={styles.businessName}>{item.name || 'Unnamed User'}</Text>
          </View>
          <View style={[styles.statusBadge, styles.successBadge]}>
            <Text style={styles.statusBadgeText}>VERIFIED</Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <InfoRow icon="finger-print-outline" label="SL ID" value={item.sl_id || 'N/A'} />
          <InfoRow icon="call-outline" label="Phone" value={item.kyc_verified_phone || item.phone || 'N/A'} />
          <InfoRow icon="briefcase-outline" label="Role" value={item.kyc_role || 'N/A'} />
          <InfoRow icon="document-text-outline" label="Request No" value={item.kyc_request_no || 'N/A'} />

          {isExpanded ? (
            <View style={styles.expandedContent}>
              <InfoRow icon="card-outline" label="ID Type" value={item.kyc_id_type || 'N/A'} />
              <InfoRow icon="barcode-outline" label="ID Number" value={item.kyc_id_number || 'N/A'} />
              <InfoRow icon="time-outline" label="Submitted" value={item.kyc_submitted_at || 'N/A'} />

              <Text style={styles.sectionSub}>Submitted Documents</Text>
              <View style={styles.docRow}>
                {item.kyc_id_photo ? (
                  <TouchableOpacity 
                    style={styles.docItem}
                    onPress={() => Alert.alert('ID Photo', item.kyc_id_photo)}
                    activeOpacity={0.7}
                  >
                    <Image source={{ uri: item.kyc_id_photo }} style={styles.docThumbnail} />
                    <View style={styles.docBadge}>
                      <Text style={styles.docBadgeText}>ID Photo</Text>
                    </View>
                  </TouchableOpacity>
                ) : null}
                {item.kyc_selfie_photo ? (
                  <TouchableOpacity 
                    style={styles.docItem}
                    onPress={() => Alert.alert('Selfie Photo', item.kyc_selfie_photo)}
                    activeOpacity={0.7}
                  >
                    <Image source={{ uri: item.kyc_selfie_photo }} style={styles.docThumbnail} />
                    <View style={styles.docBadge}>
                      <Text style={styles.docBadgeText}>Selfie</Text>
                    </View>
                  </TouchableOpacity>
                ) : null}
                {!item.kyc_id_photo && !item.kyc_selfie_photo && (
                  <View style={styles.noDocsContainer}>
                    <Ionicons name="document-text-outline" size={20} color={COLORS.textLight} />
                    <Text style={styles.emptyTextCompact}>No documents uploaded.</Text>
                  </View>
                )}
              </View>
            </View>
          ) : (
            <View style={styles.expandHintContainer}>
              <Text style={styles.expandHint}>Tap to view details & documents</Text>
            </View>
          )}
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.button, styles.denyButton, busy && styles.buttonDisabled]}
            disabled={busy}
            onPress={() => handleDenyUserKyc(item.id)}
            activeOpacity={0.8}
          >
            <View style={styles.buttonInner}>
              <Ionicons name="close-circle-outline" size={16} color="#fff" />
              <Text style={styles.buttonText}>Deny</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.deleteButton, busy && styles.buttonDisabled]}
            disabled={busy}
            onPress={() => handleDeleteUserKyc(item.id)}
            activeOpacity={0.8}
          >
            <View style={styles.buttonInner}>
              <Ionicons name="trash-outline" size={16} color="#fff" />
              <Text style={styles.buttonText}>Delete</Text>
            </View>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderApprovedPersonalityRequestItem = ({ item }: { item: AdminPersonalityVerification }) => {
    const level = item.level || 'unknown';

    return (
      <View style={styles.card}>
        <View style={styles.badgeContainer}>
          <Text style={[styles.levelBadge, level === 'national' ? styles.nationalBadge : styles.stateBadge]}>
            {level.toUpperCase()}
          </Text>
        </View>
        <View style={styles.cardHeader}>
          <View style={styles.titleIconGroup}>
            <View style={[styles.iconWrapper, { backgroundColor: 'rgba(76, 175, 80, 0.08)' }]}>
              <Ionicons name="star" size={18} color={COLORS.success} />
            </View>
            <Text style={styles.businessName}>{item.full_name || 'Anonymous'}</Text>
          </View>
          <View style={[styles.statusBadge, styles.successBadge]}>
            <Text style={styles.statusBadgeText}>APPROVED</Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <InfoRow icon="star-outline" label="Profession" value={item.profession} />
          <InfoRow icon="business-outline" label="Organization" value={item.organization || 'N/A'} />
          <InfoRow icon="location-outline" label="City" value={item.city || 'N/A'} />
          <InfoRow icon="earth-outline" label="Areas" value={Array.isArray(item.areas) ? item.areas.join(', ') : 'None'} />
          <InfoRow icon="calendar-outline" label="Experience" value={item.experience || 'N/A'} />
          
          <View style={styles.bioContainer}>
            <Ionicons name="document-text-outline" size={14} color={COLORS.textSecondary} style={{ marginRight: 6 }} />
            <Text style={styles.bioText} numberOfLines={3}>{`"${item.bio || 'No bio provided'}"`}</Text>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Fetching system queues...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTitleGroup}>
          <Text style={styles.title}>Brahmand Control</Text>
          <View style={styles.adminBadge}>
            <Ionicons name="ribbon" size={11} color="#FFF" style={{ marginRight: 3 }} />
            <Text style={styles.adminBadgeText}>{adminUser?.name || 'Admin'}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.7}>
          <Ionicons name="log-out-outline" size={18} color={COLORS.primary} style={{ marginRight: 4 }} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Prominent Direct Button: Upload Video to Bunny */}
      <TouchableOpacity
        style={styles.uploadBunnyBannerBtn}
        onPress={() => router.push('/admin/katha-upload')}
        activeOpacity={0.85}
      >
        <View style={styles.uploadBunnyIconCircle}>
          <Ionicons name="cloud-upload" size={20} color="#FFF" />
        </View>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.uploadBunnyTitle}>Upload Video to Bunny</Text>
          <Text style={styles.uploadBunnySubtitle}>Saavan Katha Daily Video & Stream Manager</Text>
        </View>
        <Ionicons name="arrow-forward" size={18} color="#FFF" />
      </TouchableOpacity>

      {/* Tab Switcher */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'pending' && styles.activeTabButton]}
          onPress={() => setActiveTab('pending')}
          activeOpacity={0.8}
        >
          <Ionicons 
            name="hourglass-outline" 
            size={16} 
            color={activeTab === 'pending' ? '#fff' : COLORS.textSecondary} 
            style={{ marginRight: 6 }} 
          />
          <Text style={[styles.tabText, activeTab === 'pending' && styles.activeTabText]}>
            Pending Review
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'verified' && styles.activeTabButton]}
          onPress={() => setActiveTab('verified')}
          activeOpacity={0.8}
        >
          <Ionicons 
            name="checkbox-outline" 
            size={16} 
            color={activeTab === 'verified' ? '#fff' : COLORS.textSecondary} 
            style={{ marginRight: 6 }} 
          />
          <Text style={[styles.tabText, activeTab === 'verified' && styles.activeTabText]}>
            Approved & Verified
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'pending' ? (
        <FlatList
          data={pendingKycRequests}
          keyExtractor={(item) => item.vendor_id}
          renderItem={renderVendorItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
          ListEmptyComponent={
            <View style={styles.centered}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="briefcase-outline" size={40} color={COLORS.textLight} />
              </View>
              <Text style={styles.emptyText}>No pending KYC approval requests.</Text>
              <Text style={styles.emptySubtext}>All vendor registration requests are up to date.</Text>
            </View>
          }
          ListHeaderComponent={
            <View style={{ marginBottom: 12 }}>
              <SectionHeader title="Personality Verifications" count={pendingPersonalityRequests.length} />
              {pendingPersonalityRequests.length === 0 ? (
                <View style={styles.centeredCompact}>
                  <Text style={styles.emptyTextCompact}>No pending personality requests.</Text>
                </View>
              ) : (
                pendingPersonalityRequests.map((item) => (
                  <View key={item.id} style={{ marginVertical: 6 }}>
                    {renderPersonalityRequestItem({ item })}
                  </View>
                ))
              )}
              <View style={styles.divider} />
              <SectionHeader title="Vendor KYC Queue" count={pendingKycRequests.length} />
            </View>
          }
          ListFooterComponent={
            <View style={styles.footerSection}>
              <View style={styles.divider} />
              
              <SectionHeader title="Request KYC Queue" count={pendingUserKycRequests.length} />
              {pendingUserKycRequests.length === 0 ? (
                <View style={styles.centeredCompact}>
                  <Text style={styles.emptyTextCompact}>No pending user KYC requests.</Text>
                </View>
              ) : (
                pendingUserKycRequests.map((item) => (
                  <View key={item.id} style={{ marginVertical: 6 }}>
                    {renderUserKycItem({ item })}
                  </View>
                ))
              )}

              <View style={styles.divider} />

              <SectionHeader title="Active Anonymous Users" count={activeAnonymousUsers.length} />
              {activeAnonymousUsers.length === 0 ? (
                <View style={styles.centeredCompact}>
                  <Text style={styles.emptyTextCompact}>No active anonymous users.</Text>
                </View>
              ) : (
                activeAnonymousUsers.map((item) => (
                  <View key={item.id} style={{ marginVertical: 6 }}>
                    {renderAnonymousUserItem({ item })}
                  </View>
                ))
              )}

              <View style={styles.divider} />

              <SectionHeader title="Disabled Anonymous Users" count={disabledAnonymousUsers.length} />
              {disabledAnonymousUsers.length === 0 ? (
                <View style={styles.centeredCompact}>
                  <Text style={styles.emptyTextCompact}>No disabled anonymous users.</Text>
                </View>
              ) : (
                disabledAnonymousUsers.map((item) => (
                  <View key={item.id} style={{ marginVertical: 6 }}>
                    {renderAnonymousUserItem({ item })}
                  </View>
                ))
              )}

              <View style={styles.divider} />

              <SectionHeader title="Reported Content (Posts & Comments)" count={pendingPostReports.length} />
              {pendingPostReports.length === 0 ? (
                <View style={styles.centeredCompact}>
                  <Text style={styles.emptyTextCompact}>No pending reports.</Text>
                </View>
              ) : (
                pendingPostReports.map((item) => (
                  <View key={item.id} style={{ marginVertical: 6 }}>
                    {renderReportedPostItem({ item })}
                  </View>
                ))
              )}

              <View style={styles.divider} />

              <SectionHeader title="SOS Misuse Reports" count={sortedMisuseReports.length} />
              {sortedMisuseReports.length === 0 ? (
                <View style={styles.centeredCompact}>
                  <Text style={styles.emptyTextCompact}>No SOS misuse reports.</Text>
                </View>
              ) : (
                sortedMisuseReports.map((item) => (
                  <View key={item.id} style={{ marginVertical: 6 }}>
                    {renderMisuseReportItem({ item })}
                  </View>
                ))
              )}
            </View>
          }
        />
      ) : (
        <FlatList
          data={approvedKycRequests}
          keyExtractor={(item) => item.vendor_id}
          renderItem={renderApprovedVendorItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
          ListEmptyComponent={
            <View style={styles.centered}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="checkmark-done" size={40} color={COLORS.textLight} />
              </View>
              <Text style={styles.emptyText}>No approved vendor requests.</Text>
              <Text style={styles.emptySubtext}>Approved vendors will appear here once verified.</Text>
            </View>
          }
          ListHeaderComponent={
            <View style={{ marginBottom: 12 }}>
              <SectionHeader title="Verified Personalities" count={approvedPersonalityRequests.length} />
              {approvedPersonalityRequests.length === 0 ? (
                <View style={styles.centeredCompact}>
                  <Text style={styles.emptyTextCompact}>No verified personality requests found.</Text>
                </View>
              ) : (
                approvedPersonalityRequests.map((item) => (
                  <View key={item.id} style={{ marginVertical: 6 }}>
                    {renderApprovedPersonalityRequestItem({ item })}
                  </View>
                ))
              )}
              <View style={styles.divider} />
              <SectionHeader title="Verified Vendor Queue" count={approvedKycRequests.length} />
            </View>
          }
          ListFooterComponent={
            <View style={styles.footerSection}>
              <View style={styles.divider} />
              <SectionHeader title="Verified User KYC Requests" count={approvedUserKycRequests.length} />
              {approvedUserKycRequests.length === 0 ? (
                <View style={styles.centeredCompact}>
                  <Text style={styles.emptyTextCompact}>No verified user KYC requests found.</Text>
                </View>
              ) : (
                approvedUserKycRequests.map((item) => (
                  <View key={item.id} style={{ marginVertical: 6 }}>
                    {renderApprovedUserKycItem({ item })}
                  </View>
                ))
              )}
            </View>
          }
        />
      )}
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
    paddingBottom: SPACING.xs,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(232, 224, 216, 0.4)',
    backgroundColor: COLORS.surface,
  },
  headerTitleGroup: {
    flexDirection: 'column',
    gap: 2,
    marginBottom: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: 0.2,
  },
  adminBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 99,
    flexDirection: 'row',
    alignItems: 'center',
  },
  adminBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFF',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 102, 0, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 102, 0, 0.15)',
  },
  logoutText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 13,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: SPACING.md,
    marginVertical: SPACING.md,
    backgroundColor: '#FFF5EB',
    borderRadius: BORDER_RADIUS.md,
    padding: 4,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BORDER_RADIUS.md - 2,
  },
  activeTabButton: {
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  activeTabText: {
    color: '#fff',
  },
  listContent: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  footerSection: {
    marginTop: SPACING.md,
    gap: SPACING.sm,
  },
  divider: {
    height: 1.5,
    backgroundColor: 'rgba(232, 224, 216, 0.6)',
    marginVertical: SPACING.md,
  },
  sectionHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  sectionHeaderIndicator: {
    width: 4,
    height: 18,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
    flex: 1,
  },
  countBadge: {
    backgroundColor: 'rgba(255, 102, 0, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 99,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
    shadowColor: '#CC5200',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#FFF8F0',
    marginBottom: SPACING.xs,
  },
  titleIconGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  iconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  businessName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
  },
  cardBody: {
    gap: 5,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
  },
  infoIcon: {
    marginRight: 6,
    width: 14,
  },
  infoLabel: {
    fontSize: 12.5,
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginRight: 4,
  },
  infoValue: {
    fontSize: 12.5,
    color: COLORS.text,
    fontWeight: '600',
    flex: 1,
  },
  bioContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFBF7',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F5EBE1',
    marginTop: 4,
  },
  bioText: {
    fontSize: 12.5,
    color: COLORS.text,
    fontStyle: 'italic',
    flex: 1,
    lineHeight: 17,
  },
  sectionSub: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: 10,
    marginBottom: 6,
  },
  docRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  docItem: {
    position: 'relative',
    borderRadius: BORDER_RADIUS.sm,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    width: 90,
    height: 70,
    backgroundColor: '#FAF5EF',
  },
  docThumbnail: {
    width: '100%',
    height: '100%',
  },
  docBadge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: 2,
  },
  docBadgeText: {
    fontSize: 8.5,
    textAlign: 'center',
    color: '#FFF',
    fontWeight: '700',
  },
  noDocsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: SPACING.xs,
  },
  badgeContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
  },
  levelBadge: {
    fontSize: 9,
    fontWeight: '800',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    color: '#fff',
    overflow: 'hidden',
  },
  nationalBadge: {
    backgroundColor: '#D4AF37',
  },
  stateBadge: {
    backgroundColor: '#4169E1',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  successBadge: {
    backgroundColor: 'rgba(76, 175, 80, 0.08)',
    borderWidth: 1,
    borderColor: COLORS.success,
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.success,
  },
  miniStatusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  miniStatusBadgeActive: {
    backgroundColor: 'rgba(76, 175, 80, 0.08)',
    borderWidth: 1,
    borderColor: COLORS.success,
  },
  miniStatusBadgeDisabled: {
    backgroundColor: 'rgba(229, 57, 53, 0.08)',
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  miniStatusBadgeText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: COLORS.success,
  },
  actionRow: {
    marginTop: SPACING.sm,
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  buttonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  approveButton: {
    backgroundColor: COLORS.success,
  },
  denyButton: {
    backgroundColor: COLORS.error,
  },
  warningButton: {
    backgroundColor: COLORS.warning,
  },
  deleteButton: {
    backgroundColor: COLORS.error,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
  },
  centeredCompact: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    backgroundColor: '#FFFBF7',
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: '#FAF0E6',
    marginVertical: 4,
  },
  emptyIconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FFF0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  emptySubtext: {
    color: COLORS.textLight,
    fontSize: 12,
    textAlign: 'center',
  },
  emptyTextCompact: {
    fontSize: 12,
    color: COLORS.textLight,
    textAlign: 'center',
    fontWeight: '500',
  },
  loadingText: {
    marginTop: SPACING.sm,
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  reportedMediaContainer: {
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#FFF8F0',
    paddingTop: 6,
  },
  reportedMediaTitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginBottom: 4,
  },
  reportImage: {
    width: '100%',
    height: 150,
    borderRadius: BORDER_RADIUS.sm,
    marginTop: 2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  linkText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  expandedContent: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1.5,
    borderTopColor: 'rgba(232, 224, 216, 0.4)',
    gap: 4,
  },
  expandHintContainer: {
    alignItems: 'center',
    paddingTop: 6,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#FFF8F0',
  },
  expandHint: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '700',
  },
  uploadBunnyBannerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B00',
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    padding: 12,
    borderRadius: BORDER_RADIUS.md,
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  uploadBunnyIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadBunnyTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  uploadBunnySubtitle: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
});
