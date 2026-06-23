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
} from '../../src/services/api';
import { useAdminStore } from '../../src/store/adminStore';

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
    () => vendorRequests.filter((record) => (record.review_status || 'pending') === 'pending' && isKycCompleted(record)),
    [vendorRequests]
  );

  const approvedKycRequests = useMemo(
    () => (verifiedVendorRequests || []).filter((record) => record.review_status === 'approved'),
    [verifiedVendorRequests]
  );

  const pendingUserKycRequests = useMemo(
    () => (userKycRequests || []).filter((record) => !!record?.id),
    [userKycRequests]
  );

  const approvedUserKycRequests = useMemo(
    () => (verifiedUserKycRequests || []).filter((record) => !!record?.id),
    [verifiedUserKycRequests]
  );

  const pendingPostReports = useMemo(
    () => (reportedPosts || []).filter((record) => (record?.status || 'pending') === 'pending'),
    [reportedPosts]
  );

  const activeAnonymousUsers = useMemo(
    () => (anonymousUsers || []).filter((user) => !user.anonymous_disabled),
    [anonymousUsers]
  );

  const disabledAnonymousUsers = useMemo(
    () => (anonymousUsers || []).filter((user) => !!user.anonymous_disabled),
    [anonymousUsers]
  );

  const pendingPersonalityRequests = useMemo(
    () => (personalityRequests || []).filter((req) => req.status === 'pending'),
    [personalityRequests]
  );

  const approvedPersonalityRequests = useMemo(
    () => (verifiedPersonalityRequests || []).filter((req) => req.status === 'approved'),
    [verifiedPersonalityRequests]
  );

  const loadRequests = async () => {
    // Triggering fast refresh
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
        getAdminReports(adminToken, 'pending', 'post', 150),
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

  const handleApprovePost = async (reportId: string) => {
    if (!adminToken) return;
    setProcessingKey(`report:${reportId}`);
    try {
      await adminReviewReport(adminToken, reportId, 'deny', 'Approved by admin');
      await loadRequests();
      Alert.alert('Success', 'Post approved and kept.');
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
      Alert.alert('Success', 'Post deleted successfully.');
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
      <TouchableOpacity activeOpacity={0.8} onPress={() => toggleExpand(item.vendor_id)} style={styles.card}>
        <Text style={styles.businessName}>{item.business_name || 'Unnamed Business'}</Text>
        <Text style={styles.meta}>Owner: {item.owner_name || 'N/A'}</Text>
        <Text style={styles.meta}>Phone: {item.phone_number || 'N/A'}</Text>
        
        {isExpanded ? (
          <View style={styles.expandedContent}>
            <Text style={styles.meta}>Address: {item.full_address || 'N/A'}</Text>
            <Text style={styles.meta}>Categories: {(item.categories || []).join(', ') || 'N/A'}</Text>
            <Text style={styles.meta}>Aadhaar OTP Verified: {item.aadhaar_otp_verified_at || 'No'}</Text>
            <Text style={styles.meta}>Review Status: {item.review_status || 'pending'}</Text>

            <Text style={styles.sectionSub}>Submitted Documents</Text>
            <View style={styles.docRow}>
              {item.aadhar_url ? (
                <TouchableOpacity onPress={() => Alert.alert('Aadhaar Document', item.aadhar_url || undefined)}>
                  <Image source={{ uri: item.aadhar_url }} style={styles.docThumbnail} />
                  <Text style={styles.docLabel}>Aadhaar</Text>
                </TouchableOpacity>
              ) : null}
              {item.pan_url ? (
                <TouchableOpacity onPress={() => Alert.alert('PAN Document', item.pan_url || undefined)}>
                  <Image source={{ uri: item.pan_url }} style={styles.docThumbnail} />
                  <Text style={styles.docLabel}>PAN</Text>
                </TouchableOpacity>
              ) : null}
              {item.face_scan_url ? (
                <TouchableOpacity onPress={() => Alert.alert('Face Scan / Selfie', item.face_scan_url || undefined)}>
                  <Image source={{ uri: item.face_scan_url }} style={styles.docThumbnail} />
                  <Text style={styles.docLabel}>Selfie</Text>
                </TouchableOpacity>
              ) : null}
              {!item.aadhar_url && !item.pan_url && !item.face_scan_url && (
                <Text style={styles.emptyTextCompact}>No documents uploaded.</Text>
              )}
            </View>
          </View>
        ) : (
          <Text style={styles.expandHint}>Tap to view details & documents</Text>
        )}

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.button, styles.approveButton, busy && styles.buttonDisabled]}
            disabled={busy}
            onPress={() => handleApprove(item.vendor_id)}
          >
            {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Approve</Text>}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.warningButton, busy && styles.buttonDisabled]}
            disabled={busy}
            onPress={() => handleDeny(item.vendor_id)}
          >
            <Text style={styles.buttonText}>Deny</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.deleteButton, busy && styles.buttonDisabled]}
            disabled={busy}
            onPress={() => handleDeleteVendor(item.vendor_id)}
          >
            <Text style={styles.buttonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderUserKycItem = ({ item }: { item: AdminUserKycRequest }) => {
    const busy = processingKey === `user:${item.id}`;
    const isExpanded = expandedId === item.id;

    return (
      <TouchableOpacity activeOpacity={0.8} onPress={() => toggleExpand(item.id)} style={styles.card}>
        <Text style={styles.businessName}>{item.name || 'Unnamed User'}</Text>
        <Text style={styles.meta}>SL ID: {item.sl_id || 'N/A'}</Text>
        <Text style={styles.meta}>Role: {item.kyc_role || 'N/A'}</Text>

        {isExpanded ? (
          <View style={styles.expandedContent}>
            <Text style={styles.meta}>ID Type: {item.kyc_id_type || 'N/A'}</Text>
            <Text style={styles.meta}>ID Number: {item.kyc_id_number || 'N/A'}</Text>
            <Text style={styles.meta}>Submitted: {item.kyc_submitted_at || 'N/A'}</Text>

            <Text style={styles.sectionSub}>Submitted Documents</Text>
            <View style={styles.docRow}>
              {item.kyc_id_photo ? (
                <TouchableOpacity onPress={() => Alert.alert('ID Photo', item.kyc_id_photo)}>
                  <Image source={{ uri: item.kyc_id_photo }} style={styles.docThumbnail} />
                  <Text style={styles.docLabel}>ID Photo</Text>
                </TouchableOpacity>
              ) : null}
              {item.kyc_selfie_photo ? (
                <TouchableOpacity onPress={() => Alert.alert('Selfie Photo', item.kyc_selfie_photo)}>
                  <Image source={{ uri: item.kyc_selfie_photo }} style={styles.docThumbnail} />
                  <Text style={styles.docLabel}>Selfie</Text>
                </TouchableOpacity>
              ) : null}
              {!item.kyc_id_photo && !item.kyc_selfie_photo && (
                <Text style={styles.emptyTextCompact}>No documents uploaded.</Text>
              )}
            </View>
          </View>
        ) : (
          <Text style={styles.expandHint}>Tap to view details & documents</Text>
        )}

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
      </TouchableOpacity>
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
            onPress={() => handleApprovePost(item.id)}
          >
            {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Approve</Text>}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.denyButton, busy && styles.buttonDisabled]}
            disabled={busy}
            onPress={() => handleDeletePost(item.id)}
          >
            <Text style={styles.buttonText}>Delete</Text>
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

  const renderMisuseReportItem = ({ item }: { item: AdminSOSMisuseReport }) => {
    const isBlocking = processingKey === `block:${item.creator_id}`;
    const isUnblocking = processingKey === `unblock:${item.creator_id}`;
    
    return (
      <View style={styles.card} key={item.id}>
        <Text style={styles.businessName}>SOS Misuse Report</Text>
        <Text style={styles.meta}>Report ID: {item.id}</Text>
        <Text style={styles.meta}>Creator: {item.creator_name || 'N/A'} (ID: {item.creator_id})</Text>
        <Text style={styles.meta}>Reporter: {item.reporter_name || 'N/A'} (ID: {item.reporter_id})</Text>
        <Text style={styles.meta}>Reason: {item.reason || 'N/A'}</Text>
        <Text style={styles.meta}>Timestamp: {item.created_at || 'N/A'}</Text>
        
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.button, styles.denyButton, isBlocking && styles.buttonDisabled]}
            disabled={isBlocking || isUnblocking}
            onPress={() => handleBlockUserSOS(item.creator_id)}
          >
            {isBlocking ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Block Creator</Text>}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, styles.approveButton, isUnblocking && styles.buttonDisabled]}
            disabled={isBlocking || isUnblocking}
            onPress={() => handleUnblockUserSOS(item.creator_id)}
          >
            {isUnblocking ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Unblock Creator</Text>}
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
        <Text style={styles.businessName}>{displayName}</Text>
        <Text style={styles.meta}>Phone: {item.phone || 'N/A'}</Text>
        <Text style={styles.meta}>Status: {item.anonymous_disabled ? 'Disabled' : 'Active'}</Text>
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.button, styles.denyButton, busy && styles.buttonDisabled]}
            disabled={busy || item.anonymous_disabled}
            onPress={() => handleDisableAnonymousUser(item.id)}
          >
            {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Disable</Text>}
          </TouchableOpacity>
        </View>
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
        <Text style={styles.businessName}>{item.full_name || 'Anonymous'}</Text>
        <Text style={styles.meta}>Profession: {item.profession}</Text>
        <Text style={styles.meta}>Org: {item.organization || 'N/A'}</Text>
        <Text style={styles.meta}>City: {item.city || 'N/A'}</Text>
        <Text style={styles.meta}>Areas: {Array.isArray(item.areas) ? item.areas.join(', ') : 'None'}</Text>
        <Text style={styles.meta}>Experience: {item.experience || 'N/A'}</Text>
        <Text style={styles.bioMeta}>Bio: {item.bio || 'No bio provided'}</Text>

        <Text style={styles.sectionSub}>Documents ({item.doc_type})</Text>
        <View style={styles.docRow}>
          <TouchableOpacity onPress={() => Alert.alert('View Document', item.front_url)}>
             <Image source={{ uri: item.front_url }} style={styles.docThumbnail} />
             <Text style={styles.docLabel}>Front</Text>
          </TouchableOpacity>
          {item.back_url && (
            <TouchableOpacity onPress={() => Alert.alert('View Document', item.back_url)}>
              <Image source={{ uri: item.back_url }} style={styles.docThumbnail} />
              <Text style={styles.docLabel}>Back</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.button, styles.approveButton, busy && styles.buttonDisabled]}
            disabled={busy}
            onPress={() => handlePersonalityAction(item.id, 'approve')}
          >
            {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Approve</Text>}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.denyButton, busy && styles.buttonDisabled]}
            disabled={busy}
            onPress={() => handlePersonalityAction(item.id, 'reject')}
          >
            <Text style={styles.buttonText}>Reject</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };
  const renderApprovedVendorItem = ({ item }: { item: AdminVendorReview }) => {
    const busy = processingKey === `vendor:${item.vendor_id}`;
    const isExpanded = expandedId === item.vendor_id;

    return (
      <TouchableOpacity activeOpacity={0.8} onPress={() => toggleExpand(item.vendor_id)} style={styles.card}>
        <View style={styles.badgeRow}>
          <Text style={styles.businessName}>{item.business_name || 'Unnamed Business'}</Text>
          <View style={[styles.statusBadge, styles.successBadge]}>
            <Text style={styles.statusBadgeText}>APPROVED</Text>
          </View>
        </View>
        <Text style={styles.meta}>Owner: {item.owner_name || 'N/A'}</Text>
        <Text style={styles.meta}>Phone: {item.phone_number || 'N/A'}</Text>

        {isExpanded ? (
          <View style={styles.expandedContent}>
            <Text style={styles.meta}>Address: {item.full_address || 'N/A'}</Text>
            <Text style={styles.meta}>Categories: {(item.categories || []).join(', ') || 'N/A'}</Text>
            <Text style={styles.meta}>Aadhaar OTP Verified: {item.aadhaar_otp_verified_at || 'No'}</Text>

            <Text style={styles.sectionSub}>Submitted Documents</Text>
            <View style={styles.docRow}>
              {item.aadhar_url ? (
                <TouchableOpacity onPress={() => Alert.alert('Aadhaar Document', item.aadhar_url || undefined)}>
                  <Image source={{ uri: item.aadhar_url }} style={styles.docThumbnail} />
                  <Text style={styles.docLabel}>Aadhaar</Text>
                </TouchableOpacity>
              ) : null}
              {item.pan_url ? (
                <TouchableOpacity onPress={() => Alert.alert('PAN Document', item.pan_url || undefined)}>
                  <Image source={{ uri: item.pan_url }} style={styles.docThumbnail} />
                  <Text style={styles.docLabel}>PAN</Text>
                </TouchableOpacity>
              ) : null}
              {item.face_scan_url ? (
                <TouchableOpacity onPress={() => Alert.alert('Face Scan / Selfie', item.face_scan_url || undefined)}>
                  <Image source={{ uri: item.face_scan_url }} style={styles.docThumbnail} />
                  <Text style={styles.docLabel}>Selfie</Text>
                </TouchableOpacity>
              ) : null}
              {!item.aadhar_url && !item.pan_url && !item.face_scan_url && (
                <Text style={styles.emptyTextCompact}>No documents uploaded.</Text>
              )}
            </View>
          </View>
        ) : (
          <Text style={styles.expandHint}>Tap to view details & documents</Text>
        )}

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.button, styles.deleteButton, busy && styles.buttonDisabled]}
            disabled={busy}
            onPress={() => handleDeleteVendor(item.vendor_id)}
          >
            {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Delete Vendor</Text>}
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderApprovedUserKycItem = ({ item }: { item: AdminUserKycRequest }) => {
    const isExpanded = expandedId === item.id;

    return (
      <TouchableOpacity activeOpacity={0.8} onPress={() => toggleExpand(item.id)} style={styles.card}>
        <View style={styles.badgeRow}>
          <Text style={styles.businessName}>{item.name || 'Unnamed User'}</Text>
          <View style={[styles.statusBadge, styles.successBadge]}>
            <Text style={styles.statusBadgeText}>VERIFIED</Text>
          </View>
        </View>
        <Text style={styles.meta}>SL ID: {item.sl_id || 'N/A'}</Text>
        <Text style={styles.meta}>Role: {item.kyc_role || 'N/A'}</Text>

        {isExpanded ? (
          <View style={styles.expandedContent}>
            <Text style={styles.meta}>ID Type: {item.kyc_id_type || 'N/A'}</Text>
            <Text style={styles.meta}>ID Number: {item.kyc_id_number || 'N/A'}</Text>
            <Text style={styles.meta}>Submitted: {item.kyc_submitted_at || 'N/A'}</Text>

            <Text style={styles.sectionSub}>Submitted Documents</Text>
            <View style={styles.docRow}>
              {item.kyc_id_photo ? (
                <TouchableOpacity onPress={() => Alert.alert('ID Photo', item.kyc_id_photo)}>
                  <Image source={{ uri: item.kyc_id_photo }} style={styles.docThumbnail} />
                  <Text style={styles.docLabel}>ID Photo</Text>
                </TouchableOpacity>
              ) : null}
              {item.kyc_selfie_photo ? (
                <TouchableOpacity onPress={() => Alert.alert('Selfie Photo', item.kyc_selfie_photo)}>
                  <Image source={{ uri: item.kyc_selfie_photo }} style={styles.docThumbnail} />
                  <Text style={styles.docLabel}>Selfie</Text>
                </TouchableOpacity>
              ) : null}
              {!item.kyc_id_photo && !item.kyc_selfie_photo && (
                <Text style={styles.emptyTextCompact}>No documents uploaded.</Text>
              )}
            </View>
          </View>
        ) : (
          <Text style={styles.expandHint}>Tap to view details & documents</Text>
        )}
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
        <View style={styles.badgeRow}>
          <Text style={styles.businessName}>{item.full_name || 'Anonymous'}</Text>
          <View style={[styles.statusBadge, styles.successBadge]}>
            <Text style={styles.statusBadgeText}>APPROVED</Text>
          </View>
        </View>
        <Text style={styles.meta}>Profession: {item.profession}</Text>
        <Text style={styles.meta}>Org: {item.organization || 'N/A'}</Text>
        <Text style={styles.meta}>City: {item.city || 'N/A'}</Text>
        <Text style={styles.meta}>Areas: {Array.isArray(item.areas) ? item.areas.join(', ') : 'None'}</Text>
        <Text style={styles.meta}>Experience: {item.experience || 'N/A'}</Text>
        <Text style={styles.bioMeta}>Bio: {item.bio || 'No bio provided'}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Admin Panel</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.adminName}>Logged in as {adminUser?.name || 'Admin'}</Text>

      {/* Tab Switcher */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'pending' && styles.activeTabButton]}
          onPress={() => setActiveTab('pending')}
        >
          <Text style={[styles.tabText, activeTab === 'pending' && styles.activeTabText]}>
            Pending Review
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'verified' && styles.activeTabButton]}
          onPress={() => setActiveTab('verified')}
        >
          <Text style={[styles.tabText, activeTab === 'verified' && styles.activeTabText]}>
            Verified & Approved
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'pending' ? (
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
          ListHeaderComponent={
            <View style={{ marginBottom: 20 }}>
              <Text style={styles.subtitle}>Pending Personality Verifications ({pendingPersonalityRequests.length})</Text>
              {pendingPersonalityRequests.length === 0 ? (
                <View style={styles.centeredCompact}>
                  <Text style={styles.emptyText}>No pending requests found.</Text>
                </View>
              ) : (
                pendingPersonalityRequests.map((item) => (
                  <View key={item.id} style={{ marginVertical: 8 }}>
                    {renderPersonalityRequestItem({ item })}
                  </View>
                ))
              )}
              <View style={{ height: 1, backgroundColor: COLORS.border, marginVertical: 15 }} />
              <Text style={styles.subtitle}>Pending Vendor KYC requests ({pendingKycRequests.length})</Text>
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

              <Text style={styles.subtitle}>Active anonymous predefined users ({activeAnonymousUsers.length})</Text>
              {activeAnonymousUsers.length === 0 ? (
                <View style={styles.centeredCompact}>
                  <Text style={styles.emptyText}>No active anonymous predefined users.</Text>
                </View>
              ) : (
                activeAnonymousUsers.map((item) => (
                  <View key={item.id}>
                    {renderAnonymousUserItem({ item })}
                  </View>
                ))
              )}

              <Text style={styles.subtitle}>Disabled anonymous predefined users ({disabledAnonymousUsers.length})</Text>
              {disabledAnonymousUsers.length === 0 ? (
                <View style={styles.centeredCompact}>
                  <Text style={styles.emptyText}>No disabled anonymous predefined users.</Text>
                </View>
              ) : (
                disabledAnonymousUsers.map((item) => (
                  <View key={item.id}>
                    {renderAnonymousUserItem({ item })}
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

              <Text style={styles.subtitle}>SOS Misuse Reports ({misuseReports.length})</Text>
              {misuseReports.length === 0 ? (
                <View style={styles.centeredCompact}>
                  <Text style={styles.emptyText}>No SOS misuse reports.</Text>
                </View>
              ) : (
                misuseReports.map((item) => (
                  <View key={item.id}>
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
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Text style={styles.emptyText}>No approved/verified vendor requests.</Text>
            </View>
          }
          ListHeaderComponent={
            <View style={{ marginBottom: 20 }}>
              <Text style={styles.subtitle}>Approved Personality Verifications ({approvedPersonalityRequests.length})</Text>
              {approvedPersonalityRequests.length === 0 ? (
                <View style={styles.centeredCompact}>
                  <Text style={styles.emptyText}>No approved requests found.</Text>
                </View>
              ) : (
                approvedPersonalityRequests.map((item) => (
                  <View key={item.id} style={{ marginVertical: 8 }}>
                    {renderApprovedPersonalityRequestItem({ item })}
                  </View>
                ))
              )}
              <View style={{ height: 1, backgroundColor: COLORS.border, marginVertical: 15 }} />
              <Text style={styles.subtitle}>Approved Vendor KYC requests ({approvedKycRequests.length})</Text>
            </View>
          }
          ListFooterComponent={
            <View style={styles.footerSection}>
              <Text style={styles.subtitle}>Approved user/jobs KYC requests ({approvedUserKycRequests.length})</Text>
              {approvedUserKycRequests.length === 0 ? (
                <View style={styles.centeredCompact}>
                  <Text style={styles.emptyText}>No approved/verified user KYC requests.</Text>
                </View>
              ) : (
                approvedUserKycRequests.map((item) => (
                  <View key={item.id}>
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
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.md - 2,
  },
  activeTabButton: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  activeTabText: {
    color: '#fff',
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
  bioMeta: {
    fontSize: 13,
    color: COLORS.text,
    marginTop: 4,
    fontStyle: 'italic',
  },
  sectionSub: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 10,
    marginBottom: 6,
  },
  docRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 10,
  },
  docThumbnail: {
    width: 100,
    height: 70,
    borderRadius: 8,
    backgroundColor: '#eee',
  },
  docLabel: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 2,
    color: COLORS.textSecondary,
  },
  badgeContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  levelBadge: {
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 8,
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
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  successBadge: {
    backgroundColor: COLORS.success + '20',
    borderWidth: 1,
    borderColor: COLORS.success,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.success,
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
  warningButton: {
    backgroundColor: COLORS.warning,
  },
  deleteButton: {
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
  expandedContent: {
    marginTop: SPACING.xs,
    paddingTop: SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 4,
  },
  expandHint: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
  emptyTextCompact: {
    fontSize: 12,
    color: COLORS.textLight,
    fontStyle: 'italic',
  },
});
