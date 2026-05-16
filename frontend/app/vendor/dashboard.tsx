import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
  BackHandler,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS } from '../../src/constants/theme';
import { useVendorStore, DEFAULT_CATEGORIES } from '../../src/store/vendorStore';
import { useAuthStore } from '../../src/store/authStore';
import { VendorKYCModal } from '../../src/components/VendorKYCModal';
import { sendOTP, verifyOTP } from '../../src/services/api';

export default function VendorDashboardScreen() {
  const router = useRouter();
  const { myVendor, fetchMyVendor, updateVendor, updateBusinessProfile, deleteVendor } = useVendorStore();
  const { user, isLoading: authLoading, isAuthenticated } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [deletingBusiness, setDeletingBusiness] = useState(false);
  const [phoneOtpStage, setPhoneOtpStage] = useState<'idle' | 'sent' | 'verified'>('idle');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [phoneOtpError, setPhoneOtpError] = useState<string | null>(null);
  const [phoneOtpMessage, setPhoneOtpMessage] = useState<string | null>(null);
  const [phoneSending, setPhoneSending] = useState(false);
  const [phoneVerifying, setPhoneVerifying] = useState(false);

  const resetPhoneVerification = () => {
    setPhoneOtpStage('idle');
    setPhoneOtp('');
    setPhoneOtpError(null);
    setPhoneOtpMessage(null);
    setPhoneSending(false);
    setPhoneVerifying(false);
  };

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/auth' as any);
    }
  }, [authLoading, isAuthenticated, router]);
  const [kycVisible, setKycVisible] = useState(false);
  
  // Edit modals
  const [editModal, setEditModal] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editCategories, setEditCategories] = useState<string[]>([]);
  const [categorySearch, setCategorySearch] = useState('');

  useEffect(() => {
    // Refresh myVendor on mount and when this component re-renders.
    fetchMyVendor().catch((e) => console.warn('fetchMyVendor failed', e));
  }, [fetchMyVendor]);

  useEffect(() => {
    const onBackPress = () => {
      router.replace('/vendor');
      return true; // prevent default behavior
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

    return () => {
      subscription.remove();
    };
  }, [router]);

  if (authLoading || !myVendor) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!myVendor) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.replace('/vendor')}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Vendor Dashboard</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="storefront-outline" size={48} color={COLORS.textLight} />
          <Text style={styles.errorText}>No business registered</Text>
          <TouchableOpacity 
            style={styles.registerBtn}
            onPress={() => router.replace('/vendor')}
          >
            <Text style={styles.registerBtnText}>Register Your Business</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleEditBusinessName = () => {
    setEditValue(myVendor.business_name);
    setEditModal('business_name');
  };

  const handleEditAddress = () => {
    setEditValue(myVendor.full_address);
    setEditModal('address');
  };

  const handleEditPhone = () => {
    setEditValue(myVendor.phone_number);
    resetPhoneVerification();
    setEditModal('phone');
  };

  const handleEditDescription = () => {
    setEditValue(myVendor.business_description || '');
    setEditModal('business_description');
  };

  const handleEditCategories = () => {
    setEditCategories([...myVendor.categories]);
    setEditModal('categories');
  };

  const formatKycStatus = (status?: string) => {
    switch (status) {
      case 'verified':
        return 'Approved';
      case 'manual_review':
        return 'Admin Review';
      case 'rejected':
        return 'Rejected';
      default:
        return 'Pending';
    }
  };

  const getKycChipColor = (status?: string) => {
    switch (status) {
      case 'verified':
        return '#DFF7E3';
      case 'manual_review':
        return '#FFF5D6';
      case 'rejected':
        return '#FAD6D6';
      default:
        return '#EDF4FF';
    }
  };

  const handleSaveEdit = async () => {
    setLoading(true);
    try {
      let updateData: any = {};
      
      switch (editModal) {
        case 'business_name':
          updateData.business_name = editValue;
          break;
        case 'address':
          updateData.full_address = editValue;
          break;
        case 'phone':
          if (editValue !== myVendor.phone_number && phoneOtpStage !== 'verified') {
            Alert.alert('Verify phone', 'Please verify the new phone number with SMS before saving.');
            return;
          }
          updateData.phone_number = editValue;
          break;
        case 'business_description':
          updateData.business_description = editValue;
          break;
        case 'categories':
          if (editCategories.length === 0) {
            Alert.alert('Error', 'Please select at least one category');
            return;
          }
          if (editCategories.length > 5) {
            Alert.alert('Error', 'Maximum 5 categories allowed');
            return;
          }
          updateData.categories = editCategories;
          break;
      }
      
      await updateVendor(myVendor.id, updateData);
      await fetchMyVendor();
      setEditModal(null);
      Alert.alert('Success', 'Business details updated!');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to update');
    } finally {
      setLoading(false);
    }
  };

  const handleSendPhoneOtp = async () => {
    const phone = editValue.replace(/[^0-9]/g, '');
    if (phone.length !== 10) {
      Alert.alert('Invalid number', 'Please enter a valid 10-digit phone number.');
      return;
    }

    setPhoneOtpError(null);
    setPhoneOtpMessage(null);
    setPhoneSending(true);

    try {
      await sendOTP(phone);
      setPhoneOtpStage('sent');
      setPhoneOtpMessage(`OTP sent to +91${phone}.`);
    } catch (error: any) {
      setPhoneOtpError(error?.response?.data?.detail || error?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setPhoneSending(false);
    }
  };

  const handleVerifyPhoneOtp = async () => {
    if (!phoneOtp.trim()) {
      setPhoneOtpError('Please enter the OTP sent to your phone.');
      return;
    }

    setPhoneOtpError(null);
    setPhoneVerifying(true);

    try {
      await verifyOTP(editValue.replace(/[^0-9]/g, ''), phoneOtp.trim());
      setPhoneOtpStage('verified');
      setPhoneOtpMessage('Phone verified successfully. You can now save the number.');
    } catch (error: any) {
      setPhoneOtpError(error?.response?.data?.detail || error?.message || 'OTP verification failed. Please try again.');
    } finally {
      setPhoneVerifying(false);
    }
  };

  const addCategory = (cat: string) => {
    if (editCategories.length >= 5) {
      Alert.alert('Limit', 'Maximum 5 categories allowed');
      return;
    }
    if (!editCategories.includes(cat)) {
      setEditCategories([...editCategories, cat]);
    }
    setCategorySearch('');
  };

  const removeCategory = (cat: string) => {
    setEditCategories(editCategories.filter(c => c !== cat));
  };

  const filteredCategories = categorySearch
    ? DEFAULT_CATEGORIES.filter(c => 
        c.toLowerCase().includes(categorySearch.toLowerCase()) &&
        !editCategories.includes(c)
      ).slice(0, 5)
    : [];

  const isVerified = myVendor?.kyc_status === 'verified';
  const isManualReview = myVendor?.kyc_status === 'manual_review';
  const isUserKycVerified = (user as any)?.kyc_status === 'verified' || Boolean((user as any)?.is_verified);
  const effectiveKycStatus = isVerified || isUserKycVerified ? 'verified' : myVendor?.kyc_status;
  const isReviewOrVerified = isManualReview || effectiveKycStatus === 'verified';
  const isVendorApproved = isVerified || isUserKycVerified;
  const hasVerifiedKyc = isUserKycVerified || isVendorApproved;

  const handleTellBusiness = () => {
    router.push('/vendor/business-details');
  };

  const handleOpenKyc = () => {
    if (hasVerifiedKyc || isReviewOrVerified) {
      router.push('/kyc');
      return;
    }
    setKycVisible(true);
  };

  const handleDeleteBusiness = () => {
    const confirmDelete = async () => {
      if (!myVendor) return;
      setDeletingBusiness(true);
      try {
        await deleteVendor(myVendor.id);
        if (Platform.OS === 'web') {
          window.alert('Your business has been deleted.');
        } else {
          Alert.alert('Deleted', 'Your business has been deleted.');
        }
        router.replace('/vendor');
      } catch (error: any) {
        const message = error?.response?.data?.detail || error?.message || 'Failed to delete business.';
        if (Platform.OS === 'web') {
          window.alert(`Error: ${message}`);
        } else {
          Alert.alert('Error', message);
        }
      } finally {
        setDeletingBusiness(false);
      }
    };

    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Are you sure you want to delete your business? This action cannot be undone.');
      if (confirmed) {
        confirmDelete();
      }
      return;
    }

    Alert.alert(
      'Delete Business',
      'Are you sure you want to delete your business? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: confirmDelete,
        }
      ]
    );
  };

  type MenuItem = {
    icon: string;
    label: string;
    action: () => void | Promise<void>;
    emphasis?: boolean;
  };

  const menuItems: MenuItem[] = isVendorApproved
    ? [
        { icon: 'create', label: 'Tell about your business', action: handleTellBusiness },
      ]
    : isReviewOrVerified
    ? [
        { icon: '', label: 'KYC & Verification', action: handleOpenKyc, emphasis: true },
      ]
    : [
        { icon: 'create', label: 'Edit Business Name', action: handleEditBusinessName },
        { icon: 'document-text', label: 'Edit Business Description', action: handleEditDescription },
        { icon: 'location', label: 'Update Address', action: handleEditAddress },
        { icon: 'pricetags', label: 'Update Categories', action: handleEditCategories },
        { icon: 'call', label: 'Manage Contact Number', action: handleEditPhone },
        { icon: 'id-card', label: 'Complete KYC & Verification', action: handleOpenKyc },
      ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/vendor')}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Vendor Dashboard</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Business Card */}
        <View style={styles.businessCard}>
          <View style={styles.businessIconContainer}>
            <Ionicons name="storefront" size={36} color={COLORS.primary} />
          </View>
          <View style={styles.businessNameRow}>
            <Text style={styles.businessName}>{myVendor.business_name}</Text>
            {effectiveKycStatus === 'verified' && (
              <Ionicons name="checkmark-circle" size={18} color={COLORS.info} style={styles.verifiedIcon} />
            )}
          </View>
          <Text style={styles.businessOwner}>{myVendor.owner_name}</Text>
          {myVendor.business_description ? (
            <Text style={styles.businessDescription}>{myVendor.business_description}</Text>
          ) : null}

          {/* KYC Status Badge */}
          <View style={[styles.kycChip, { backgroundColor: getKycChipColor(effectiveKycStatus) }]}> 
            <Text style={styles.kycChipText}>{formatKycStatus(effectiveKycStatus)}</Text>
          </View>
          {myVendor.kyc_status === 'manual_review' && !isUserKycVerified && (
            <Text style={styles.kycReviewText}>Your application is under review.</Text>
          )}

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{myVendor.years_in_business || 0}</Text>
              <Text style={styles.statLabel}>Years</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{myVendor.categories?.length || 0}</Text>
              <Text style={styles.statLabel}>Categories</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{myVendor.photos?.length || 0}</Text>
              <Text style={styles.statLabel}>Photos</Text>
            </View>
          </View>

          {/* Categories */}
          <View style={styles.categoriesContainer}>
            {(myVendor.categories || []).map((cat, idx) => (
              <View key={idx} style={styles.categoryChip}>
                <Text style={styles.categoryChipText}>{cat}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Manage Business</Text>

        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.menuItem,
                item.emphasis && styles.menuItemEmphasis
              ]}
              onPress={item.action}
            >
              {item.emphasis ? (
                <Text style={styles.menuLabelEmphasis}>{item.label}  →</Text>
              ) : (
                <>
                  <View style={styles.menuIcon}>
                    <Ionicons name={item.icon as any} size={22} color={COLORS.primary} />
                  </View>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
                </>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Contact Info */}
        <Text style={styles.sectionTitle}>Contact Information</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="call" size={18} color={COLORS.primary} />
            <Text style={styles.infoText}>{myVendor.phone_number}</Text>
            {isVendorApproved && (
              <TouchableOpacity style={styles.editIconButton} onPress={handleEditPhone}>
                <Ionicons name="pencil" size={18} color={COLORS.primary} />
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="location" size={18} color={COLORS.primary} />
            <Text style={styles.infoText}>{myVendor.full_address}</Text>
          </View>
          {isVendorApproved && (
            <View style={styles.deleteRow}>
              <TouchableOpacity
                style={[styles.deleteButton, deletingBusiness && styles.deleteButtonDisabled]}
                onPress={handleDeleteBusiness}
                disabled={deletingBusiness}
              >
                {deletingBusiness ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="trash" size={18} color="#FFFFFF" />
                    <Text style={styles.deleteButtonText}>Delete Business</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Edit Modal */}
      <Modal
        visible={editModal !== null}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setEditModal(null);
          resetPhoneVerification();
        }}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editModal === 'business_name' && 'Edit Business Name'}
                {editModal === 'business_description' && 'Edit Business Description'}
                {editModal === 'address' && 'Update Address'}
                {editModal === 'phone' && 'Update Phone'}
                {editModal === 'categories' && 'Update Categories'}
              </Text>
              <TouchableOpacity onPress={() => {
                setEditModal(null);
                resetPhoneVerification();
              }}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            {editModal === 'categories' ? (
              <View>
                <Text style={styles.inputLabel}>Selected Categories ({editCategories.length}/5)</Text>
                <View style={styles.selectedCats}>
                  {editCategories.map((cat, idx) => (
                    <TouchableOpacity 
                      key={idx} 
                      style={styles.selectedCatChip}
                      onPress={() => removeCategory(cat)}
                    >
                      <Text style={styles.selectedCatText}>{cat}</Text>
                      <Ionicons name="close" size={14} color={COLORS.error} />
                    </TouchableOpacity>
                  ))}
                </View>
                
                <TextInput
                  style={styles.input}
                  placeholder="Search or add category..."
                  value={categorySearch}
                  onChangeText={setCategorySearch}
                />
                
                {filteredCategories.length > 0 && (
                  <View style={styles.suggestions}>
                    {filteredCategories.map((cat, idx) => (
                      <TouchableOpacity
                        key={idx}
                        style={styles.suggestionItem}
                        onPress={() => addCategory(cat)}
                      >
                        <Text style={styles.suggestionText}>{cat}</Text>
                        <Ionicons name="add" size={18} color={COLORS.primary} />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
                
                {categorySearch && !filteredCategories.includes(categorySearch) && (
                  <TouchableOpacity
                    style={styles.addCustomBtn}
                    onPress={() => addCategory(categorySearch)}
                  >
                    <Ionicons name="add-circle" size={18} color={COLORS.primary} />
                    <Text style={styles.addCustomText}>Add "{categorySearch}" as new category</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <View>
                <Text style={styles.inputLabel}>
                  {editModal === 'business_name' && 'Business Name'}
                  {editModal === 'business_description' && 'Business Description'}
                  {editModal === 'address' && 'Full Address'}
                  {editModal === 'phone' && 'Phone Number'}
                </Text>
                <TextInput
                  style={[styles.input, (editModal === 'address' || editModal === 'business_description') && styles.textArea]}
                  value={editValue}
                  onChangeText={(text) => {
                    setEditValue(text);
                    if (editModal === 'phone') {
                      resetPhoneVerification();
                    }
                  }}
                  multiline={editModal === 'address' || editModal === 'business_description'}
                  numberOfLines={editModal === 'address' || editModal === 'business_description' ? 3 : 1}
                  keyboardType={editModal === 'phone' ? 'phone-pad' : 'default'}
                />

                {editModal === 'phone' && editValue.replace(/[^0-9]/g, '') !== myVendor.phone_number.replace(/[^0-9]/g, '') && (
                  <View style={styles.phoneVerificationSection}>
                    {phoneOtpMessage ? <Text style={styles.phoneVerificationMessage}>{phoneOtpMessage}</Text> : null}
                    {phoneOtpError ? <Text style={styles.phoneVerificationError}>{phoneOtpError}</Text> : null}

                    {phoneOtpStage === 'idle' && (
                      <TouchableOpacity
                        style={[styles.sendOtpBtn, phoneSending && styles.saveBtnDisabled]}
                        onPress={handleSendPhoneOtp}
                        disabled={phoneSending}
                      >
                        {phoneSending ? (
                          <ActivityIndicator color="#FFFFFF" />
                        ) : (
                          <Text style={styles.sendOtpBtnText}>Send OTP</Text>
                        )}
                      </TouchableOpacity>
                    )}

                    {phoneOtpStage === 'sent' && (
                      <>
                        <TextInput
                          style={styles.input}
                          value={phoneOtp}
                          onChangeText={setPhoneOtp}
                          placeholder="Enter OTP"
                          keyboardType="phone-pad"
                        />
                        <TouchableOpacity
                          style={[styles.sendOtpBtn, phoneVerifying && styles.saveBtnDisabled]}
                          onPress={handleVerifyPhoneOtp}
                          disabled={phoneVerifying}
                        >
                          {phoneVerifying ? (
                            <ActivityIndicator color="#FFFFFF" />
                          ) : (
                            <Text style={styles.sendOtpBtnText}>Verify OTP</Text>
                          )}
                        </TouchableOpacity>
                      </>
                    )}

                    {phoneOtpStage === 'verified' && (
                      <Text style={styles.phoneVerificationSuccess}>Phone verified. Save to update.</Text>
                    )}
                  </View>
                )}
              </View>
            )}

            <TouchableOpacity
              style={[styles.saveBtn, loading && styles.saveBtnDisabled]}
              onPress={handleSaveEdit}
              disabled={loading || (editModal === 'phone' && editValue.replace(/[^0-9]/g, '') !== myVendor.phone_number.replace(/[^0-9]/g, '') && phoneOtpStage !== 'verified')}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.saveBtnText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
      </Modal>

      <VendorKYCModal 
        visible={kycVisible}
        onClose={() => setKycVisible(false)}
        vendorId={myVendor.id}
        onKycUpdated={fetchMyVendor}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
  },
  registerBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  registerBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  businessCard: {
    backgroundColor: COLORS.surface,
    margin: SPACING.sm,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    minHeight: 160,
  },
  businessIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: `${COLORS.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  businessName: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  businessNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  verifiedIcon: {
    marginLeft: 4,
  },
  businessOwner: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  businessDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  kycChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: SPACING.sm,
  },
  kycChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
  },
  kycReviewText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: SPACING.sm,
  },
  categoryChip: {
    backgroundColor: `${COLORS.primary}15`,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 12,
    margin: 2,
  },
  categoryChipText: {
    fontSize: 12,
    color: COLORS.primary,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  section: {
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
  },
  menuContainer: {
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: `${COLORS.primary}10`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
  },
  menuLabelEmphasis: {
    flex: 1,
    fontSize: 18,
    color: COLORS.primary,
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
  menuItemEmphasis: {
    borderWidth: 0,
    margin: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: 'transparent',
    alignItems: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
  menuIconButton: {
    padding: SPACING.xs,
  },
  menuBox: {
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  menuBoxText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  menuUploadButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  menuUploadButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  detectedItemsContainer: {
    marginTop: SPACING.sm,
  },
  detectedItemsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  detectedItemText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  saveButton: {
    backgroundColor: COLORS.success,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
  reviewNotice: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    color: COLORS.text,
    fontWeight: '700',
    fontSize: 16,
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.xl,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  infoText: {
    marginLeft: SPACING.sm,
    fontSize: 14,
    color: COLORS.text,
    flex: 1,
  },
  editIconButton: {
    padding: SPACING.xs,
    borderRadius: 8,
    backgroundColor: `${COLORS.primary}15`,
    marginLeft: SPACING.sm,
  },
  deleteRow: {
    marginTop: SPACING.sm,
    alignItems: 'flex-end',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.error,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.sm,
  },
  deleteButtonDisabled: {
    opacity: 0.6,
  },
  deleteButtonText: {
    color: '#FFFFFF',
    marginLeft: SPACING.xs,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: SPACING.lg,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: 16,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  selectedCats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: SPACING.md,
  },
  selectedCatChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.primary}15`,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 12,
    margin: 2,
  },
  selectedCatText: {
    fontSize: 13,
    color: COLORS.primary,
    marginRight: 4,
  },
  suggestions: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
  },
  suggestionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  suggestionText: {
    fontSize: 14,
    color: COLORS.text,
  },
  addCustomBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
    backgroundColor: `${COLORS.primary}10`,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
  },
  addCustomText: {
    marginLeft: SPACING.xs,
    color: COLORS.primary,
    fontSize: 14,
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  sendOtpBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  sendOtpBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  phoneVerificationSection: {
    marginBottom: SPACING.sm,
  },
  phoneVerificationMessage: {
    color: COLORS.primary,
    fontSize: 13,
    marginBottom: SPACING.xs,
  },
  phoneVerificationError: {
    color: COLORS.error,
    fontSize: 13,
    marginBottom: SPACING.xs,
  },
  phoneVerificationSuccess: {
    color: COLORS.success,
    fontSize: 13,
    marginTop: SPACING.xs,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
