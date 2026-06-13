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
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';

import { sendOTP, verifyOTP, getKYCStatus } from '../../src/services/api';

export default function VendorDashboardScreen() {
  const router = useRouter();
  const { myVendor, fetchMyVendor, updateVendor, updateBusinessProfile, deleteVendor, uploadBusinessImage } = useVendorStore();
  const { user, isLoading: authLoading, isAuthenticated, updateUser } = useAuthStore();
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

  
  // Edit modals
  const [editModal, setEditModal] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editCategories, setEditCategories] = useState<string[]>([]);
  const [categorySearch, setCategorySearch] = useState('');

  // Editable Form states matching the mockup
  const [ownerName, setOwnerName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [phoneVal, setPhoneVal] = useState('');
  const [emailVal, setEmailVal] = useState('');
  const [websiteVal, setWebsiteVal] = useState('');
  const [instagramVal, setInstagramVal] = useState('');
  const [whatsappVal, setWhatsappVal] = useState('');
  const [descriptionVal, setDescriptionVal] = useState('');
  const [addressVal, setAddressVal] = useState('');
  const [categoriesVal, setCategoriesVal] = useState<string[]>([]);
  const [businessHoursVal, setBusinessHoursVal] = useState('');
  const [loadingSlot, setLoadingSlot] = useState<number | null>(null);

  // Sync data from store when myVendor is loaded
  useEffect(() => {
    if (myVendor) {
      setOwnerName(myVendor.owner_name || '');
      setBusinessName(myVendor.business_name || '');
      setPhoneVal(myVendor.phone_number || '');
      setEmailVal(myVendor.business_email || '');
      setWebsiteVal(myVendor.website_link || '');
      setInstagramVal(myVendor.social_media?.instagram || '');
      setWhatsappVal(myVendor.social_media?.whatsapp || '');
      setDescriptionVal(myVendor.business_description || '');
      setAddressVal(myVendor.full_address || '');
      setCategoriesVal(myVendor.categories || []);
      setBusinessHoursVal(myVendor.business_hours || '');
    }
  }, [myVendor]);

  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // Refresh myVendor and KYC status on mount and when this component re-renders.
    const initialize = async () => {
      try {
        await fetchMyVendor();
        const response = await getKYCStatus();
        const serverStatus = response?.data?.kyc_status || (response?.data?.is_verified ? 'verified' : null);
        updateUser({
          kyc_status: serverStatus,
          is_verified: Boolean(response?.data?.is_verified) || serverStatus === 'verified',
        } as any);
      } catch (e) {
        console.warn('Initialization failed', e);
      } finally {
        setIsInitializing(false);
      }
    };
    initialize();
  }, [fetchMyVendor, updateUser]);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/vendor');
    }
  };

  useEffect(() => {
    const onBackPress = () => {
      handleBack();
      return true; // prevent default behavior
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

    return () => {
      subscription.remove();
    };
  }, [router]);

  if (authLoading || isInitializing) {
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
          <TouchableOpacity onPress={handleBack}>
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
        return 'KYC Verified';
      case 'manual_review':
        return 'Admin Review';
      case 'rejected':
        return 'Rejected';
      default:
        return 'Pending KYC';
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

  const getParsedHours = () => {
    const val = businessHoursVal || 'Mon-Sat: 6:00 AM - 11:00 PM, Sun: 10:00 AM - 6:00 PM';
    const parts = val.split(',');
    let weekday = '6:00 AM - 11:00 PM';
    let sunday = '10:00 AM - 6:00 PM';
    parts.forEach(p => {
      const trimmed = p.trim();
      if (trimmed.toLowerCase().includes('sun')) {
        const colonIdx = trimmed.indexOf(':');
        sunday = colonIdx !== -1 ? trimmed.substring(colonIdx + 1).trim() : trimmed;
      } else if (trimmed.toLowerCase().includes('mon')) {
        const colonIdx = trimmed.indexOf(':');
        weekday = colonIdx !== -1 ? trimmed.substring(colonIdx + 1).trim() : trimmed;
      }
    });
    return { weekday, sunday };
  };

  const handleSaveEdit = async () => {
    try {
      switch (editModal) {
        case 'phone':
          if (editValue !== myVendor.phone_number && phoneOtpStage !== 'verified') {
            Alert.alert('Verify phone', 'Please verify the new phone number with SMS before saving.');
            return;
          }
          setPhoneVal(editValue);
          setEditModal(null);
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
          setCategoriesVal(editCategories);
          setEditModal(null);
          break;
        case 'weekday_hours':
          const { sunday: currentSunday } = getParsedHours();
          setBusinessHoursVal(`Mon-Sat: ${editValue}, Sun: ${currentSunday}`);
          setEditModal(null);
          break;
        case 'sunday_hours':
          const { weekday: currentWeekday } = getParsedHours();
          setBusinessHoursVal(`Mon-Sat: ${currentWeekday}, Sun: ${editValue}`);
          setEditModal(null);
          break;
      }
    } catch (error: any) {
      Alert.alert('Error', 'Failed to update field');
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

  const isUserVerified = (user as any)?.kyc_status === 'verified' || Boolean((user as any)?.is_verified);
  const isVendorVerified = myVendor?.kyc_status === 'verified';
  const isVerified = isUserVerified || isVendorVerified;

  const isUserManualReview = (user as any)?.kyc_status === 'manual_review';
  const isVendorManualReview = myVendor?.kyc_status === 'manual_review';
  const isManualReview = isUserManualReview || isVendorManualReview;

  const isUserKycVerified = isUserVerified;
  const effectiveKycStatus = isVerified ? 'verified' : (isManualReview ? 'manual_review' : (myVendor?.kyc_status || (user as any)?.kyc_status || 'pending'));
  const isReviewOrVerified = isManualReview || isVerified;
  const isVendorApproved = isVerified;
  const hasVerifiedKyc = isVerified;

  const handleTellBusiness = () => {
    router.push('/vendor/business-details');
  };

  const handleOpenKyc = () => {
    router.push('/kyc');
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
        router.back();
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

  const handleEditWeekdayHours = () => {
    const { weekday } = getParsedHours();
    setEditValue(weekday);
    setEditModal('weekday_hours');
  };

  const handleEditSundayHours = () => {
    const { sunday } = getParsedHours();
    setEditValue(sunday);
    setEditModal('sunday_hours');
  };

  const pickAndUploadImage = async (slot: number) => {
    if (!myVendor) return;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== 'granted') {
      Alert.alert('Permission Denied', 'Media library access is required.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.length) return;

    const asset = result.assets[0];
    const fileName = (asset as any).fileName || `business-${slot + 1}.jpg`;
    const mimeType = asset.mimeType || 'image/jpeg';
    const localUri = asset.uri;

    try {
      setLoadingSlot(slot);
      await uploadBusinessImage(myVendor.id, slot, { uri: localUri, name: fileName, type: mimeType });
      await fetchMyVendor();
      Alert.alert('Success', 'Photo uploaded successfully.');
    } catch (error: any) {
      Alert.alert('Upload failed', error?.response?.data?.detail || 'Could not upload image.');
    } finally {
      setLoadingSlot(null);
    }
  };

  const handleSaveAll = async () => {
    setLoading(true);
    try {
      const vendorUpdates: any = {
        business_name: businessName,
        owner_name: ownerName,
        phone_number: phoneVal,
        business_description: descriptionVal,
        full_address: addressVal,
        categories: categoriesVal,
        business_email: emailVal,
      };

      await updateVendor(myVendor.id, vendorUpdates);

      await updateBusinessProfile(myVendor.id, {
        website_link: websiteVal,
        social_media: {
          instagram: instagramVal,
          whatsapp: whatsappVal,
        },
        business_hours: businessHoursVal,
      });

      Alert.alert('Success', 'Business profile updated successfully!');
      handleBack();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.detail || err?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const parsedHours = getParsedHours();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Background Gradient */}
      <LinearGradient 
        colors={['#FF8D57', '#EA9B76', '#FFEEE5']} 
        locations={[0, 0.0913, 0.25]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerLeft} onPress={handleBack}>
          <Ionicons name="chevron-back" size={24} color="#5C3B24" />
          <Text style={styles.headerTitle}>Edit Profile</Text>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={handleSaveAll} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color="#E06B2B" />
          ) : (
            <Text style={styles.saveHeaderText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Image Section */}
        <View style={styles.profileSection}>
          <View style={styles.profileImageContainer}>
            <Image
              source={myVendor.photos && myVendor.photos.length > 0 ? { uri: myVendor.photos[0] } : require('../../assets/images/favicon.png')}
              style={styles.profileImage}
            />
            <TouchableOpacity style={styles.profileEditBadge} onPress={() => pickAndUploadImage(0)}>
              {loadingSlot === 0 ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="pencil" size={16} color="#FFF" />
              )}
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={() => pickAndUploadImage(0)}>
            <Text style={styles.changePhotoText}>Change Profile Photo</Text>
          </TouchableOpacity>
        </View>

        {/* Section: Personal Information */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="person-outline" size={20} color="#C67A53" />
            <Text style={styles.cardTitle}>Personal Information</Text>
          </View>

          <Text style={styles.inputLabel}>Full Name</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              value={ownerName}
              onChangeText={setOwnerName}
              placeholder="Full Name"
              placeholderTextColor="#9A897E"
            />
          </View>

          <Text style={styles.inputLabel}>Phone Number</Text>
          <TouchableOpacity style={styles.inputContainer} onPress={handleEditPhone}>
            <Text style={styles.pressableInputText}>{phoneVal || 'Add Phone Number'}</Text>
            <Ionicons name="shield-checkmark" size={16} color="#5C3B24" style={{ opacity: 0.5 }} />
          </TouchableOpacity>

          <Text style={styles.inputLabel}>Email Address</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              value={emailVal}
              onChangeText={setEmailVal}
              placeholder="Email Address"
              placeholderTextColor="#9A897E"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        </View>

        {/* Section: Contact Information */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="link-outline" size={20} color="#C67A53" />
            <Text style={styles.cardTitle}>Contact Information</Text>
          </View>

          <Text style={styles.inputLabel}>Website Link</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              value={websiteVal}
              onChangeText={setWebsiteVal}
              placeholder="Website Link"
              placeholderTextColor="#9A897E"
              keyboardType="url"
              autoCapitalize="none"
            />
          </View>

          <Text style={styles.inputLabel}>Instagram</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              value={instagramVal}
              onChangeText={setInstagramVal}
              placeholder="Instagram handle (e.g. @username)"
              placeholderTextColor="#9A897E"
              autoCapitalize="none"
            />
          </View>

          <Text style={styles.inputLabel}>WhatsApp</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              value={whatsappVal}
              onChangeText={setWhatsappVal}
              placeholder="WhatsApp Number"
              placeholderTextColor="#9A897E"
              keyboardType="phone-pad"
            />
          </View>
        </View>

        {/* Section: Business Information */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="briefcase-outline" size={20} color="#C67A53" />
            <Text style={styles.cardTitle}>Business Information</Text>
          </View>

          <Text style={styles.inputLabel}>Business Name</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              value={businessName}
              onChangeText={setBusinessName}
              placeholder="Business Name"
              placeholderTextColor="#9A897E"
            />
          </View>

          <Text style={styles.inputLabel}>Categories</Text>
          <View style={styles.categoriesRow}>
            {categoriesVal.map((cat, idx) => (
              <View key={idx} style={styles.categoryChip}>
                <Text style={styles.categoryChipText}>{cat}</Text>
                <TouchableOpacity onPress={() => setCategoriesVal(categoriesVal.filter(c => c !== cat))}>
                  <Ionicons name="close" size={14} color="#8C7769" style={{ marginLeft: 4 }} />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity style={styles.addCategoryChip} onPress={handleEditCategories}>
              <Ionicons name="add" size={14} color="#8C7769" />
              <Text style={styles.addCategoryChipText}>Add Category</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.inputLabel}>Description</Text>
          <View style={[styles.inputContainer, styles.textAreaContainer]}>
            <TextInput
              style={[styles.textInput, styles.textAreaInput]}
              value={descriptionVal}
              onChangeText={setDescriptionVal}
              placeholder="Description"
              placeholderTextColor="#9A897E"
              multiline
              numberOfLines={4}
            />
          </View>

          <Text style={styles.inputLabel}>Address</Text>
          <View style={[styles.inputContainer, styles.textAreaContainer]}>
            <TextInput
              style={[styles.textInput, styles.textAreaInput]}
              value={addressVal}
              onChangeText={setAddressVal}
              placeholder="Address"
              placeholderTextColor="#9A897E"
              multiline
              numberOfLines={3}
            />
          </View>

          <Text style={styles.inputLabel}>Business Hours</Text>
          <View style={styles.hoursBox}>
            <View style={styles.hoursRow}>
              <View>
                <Text style={styles.hoursLabel}>Mon - Sat</Text>
                <Text style={styles.hoursValue}>{parsedHours.weekday}</Text>
              </View>
              <TouchableOpacity onPress={handleEditWeekdayHours}>
                <Ionicons name="pencil" size={18} color="#C67A53" />
              </TouchableOpacity>
            </View>

            <View style={styles.hoursDivider} />

            <View style={styles.hoursRow}>
              <View>
                <Text style={styles.hoursLabel}>Sunday</Text>
                <Text style={styles.hoursValue}>{parsedHours.sunday}</Text>
              </View>
              <TouchableOpacity onPress={handleEditSundayHours}>
                <Ionicons name="pencil" size={18} color="#C67A53" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Section: Gallery */}
        <View style={styles.card}>
          <View style={[styles.cardHeader, { justifyContent: 'space-between' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="images-outline" size={20} color="#C67A53" />
              <Text style={styles.cardTitle}>Gallery</Text>
            </View>
            <TouchableOpacity onPress={pickAndUploadImage.bind(null, (myVendor.photos || []).length)}>
              <Text style={styles.addPhotoLink}>Add Photo</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.galleryScroll}>
            {(myVendor.photos || []).map((photoUrl, idx) => (
              <View key={idx} style={styles.galleryImageContainer}>
                <Image source={{ uri: photoUrl }} style={styles.galleryImage} />
                {loadingSlot === idx && (
                  <View style={styles.galleryImageLoader}>
                    <ActivityIndicator size="small" color="#fff" />
                  </View>
                )}
              </View>
            ))}
            {!(myVendor.photos && myVendor.photos.length > 0) && (
              <Text style={styles.emptyGalleryText}>No gallery photos uploaded yet.</Text>
            )}
          </ScrollView>
        </View>

        {/* Section: Delete Account */}
        <View style={styles.deactivateCard}>
          <Text style={styles.deactivateTitle}>Delete Account</Text>
          <TouchableOpacity style={styles.deactivateButton} onPress={handleDeleteBusiness}>
            <Ionicons name="trash-outline" size={18} color="#D34F40" style={{ marginRight: 8 }} />
            <Text style={styles.deactivateButtonText}>Deactivate Business Profile</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Edit Modal (used for Category/Phone verification/Hours popups) */}
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
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {editModal === 'phone' && 'Update Phone'}
                  {editModal === 'categories' && 'Update Categories'}
                  {editModal === 'weekday_hours' && 'Mon - Sat Hours'}
                  {editModal === 'sunday_hours' && 'Sunday Hours'}
                </Text>
                <TouchableOpacity onPress={() => {
                  setEditModal(null);
                  resetPhoneVerification();
                }}>
                  <Ionicons name="close" size={24} color="#5C3B24" />
                </TouchableOpacity>
              </View>

              {editModal === 'categories' ? (
                <View>
                  <Text style={styles.modalInputLabel}>Selected Categories ({editCategories.length}/5)</Text>
                  <View style={styles.modalSelectedCats}>
                    {editCategories.map((cat, idx) => (
                      <TouchableOpacity 
                        key={idx} 
                        style={styles.modalSelectedCatChip}
                        onPress={() => removeCategory(cat)}
                      >
                        <Text style={styles.modalSelectedCatText}>{cat}</Text>
                        <Ionicons name="close" size={14} color="#D34F40" />
                      </TouchableOpacity>
                    ))}
                  </View>
                  
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Search or add category..."
                    placeholderTextColor="#9A897E"
                    value={categorySearch}
                    onChangeText={setCategorySearch}
                  />
                  
                  {filteredCategories.length > 0 && (
                    <View style={styles.modalSuggestions}>
                      {filteredCategories.map((cat, idx) => (
                        <TouchableOpacity
                          key={idx}
                          style={styles.modalSuggestionItem}
                          onPress={() => addCategory(cat)}
                        >
                          <Text style={styles.modalSuggestionText}>{cat}</Text>
                          <Ionicons name="add" size={18} color="#C67A53" />
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                  
                  {categorySearch && !filteredCategories.includes(categorySearch) && (
                    <TouchableOpacity
                      style={styles.modalAddCustomBtn}
                      onPress={() => addCategory(categorySearch)}
                    >
                      <Ionicons name="add-circle" size={18} color="#C67A53" />
                      <Text style={styles.modalAddCustomText}>Add "{categorySearch}" as new category</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                <View>
                  <Text style={styles.modalInputLabel}>
                    {editModal === 'phone' && 'Phone Number'}
                    {editModal === 'weekday_hours' && 'Weekday Hours (Mon - Sat)'}
                    {editModal === 'sunday_hours' && 'Sunday Hours'}
                  </Text>
                  <TextInput
                    style={styles.modalInput}
                    value={editValue}
                    onChangeText={(text) => {
                      setEditValue(text);
                      if (editModal === 'phone') {
                        resetPhoneVerification();
                      }
                    }}
                    keyboardType={editModal === 'phone' ? 'phone-pad' : 'default'}
                  />

                  {editModal === 'phone' && editValue.replace(/[^0-9]/g, '') !== myVendor.phone_number.replace(/[^0-9]/g, '') && (
                    <View style={styles.phoneVerificationSection}>
                      {phoneOtpMessage ? <Text style={styles.phoneVerificationMessage}>{phoneOtpMessage}</Text> : null}
                      {phoneOtpError ? <Text style={styles.phoneVerificationError}>{phoneOtpError}</Text> : null}

                      {phoneOtpStage === 'idle' && (
                        <TouchableOpacity
                          style={[styles.modalVerifyBtn, phoneSending && styles.modalVerifyBtnDisabled]}
                          onPress={handleSendPhoneOtp}
                          disabled={phoneSending}
                        >
                          {phoneSending ? (
                            <ActivityIndicator color="#FFFFFF" />
                          ) : (
                            <Text style={styles.modalVerifyBtnText}>Send OTP</Text>
                          )}
                        </TouchableOpacity>
                      )}

                      {phoneOtpStage === 'sent' && (
                        <>
                          <TextInput
                            style={styles.modalInput}
                            value={phoneOtp}
                            onChangeText={setPhoneOtp}
                            placeholder="Enter OTP"
                            placeholderTextColor="#9A897E"
                            keyboardType="phone-pad"
                          />
                          <TouchableOpacity
                            style={[styles.modalVerifyBtn, phoneVerifying && styles.modalVerifyBtnDisabled]}
                            onPress={handleVerifyPhoneOtp}
                            disabled={phoneVerifying}
                          >
                            {phoneVerifying ? (
                              <ActivityIndicator color="#FFFFFF" />
                            ) : (
                              <Text style={styles.modalVerifyBtnText}>Verify OTP</Text>
                            )}
                          </TouchableOpacity>
                        </>
                      )}

                      {phoneOtpStage === 'verified' && (
                        <Text style={styles.phoneVerificationSuccess}>Phone verified. Press Save Changes below.</Text>
                      )}
                    </View>
                  )}
                </View>
              )}

              <TouchableOpacity
                style={[styles.modalSaveBtn, loading && styles.modalSaveBtnDisabled]}
                onPress={handleSaveEdit}
                disabled={loading || (editModal === 'phone' && editValue.replace(/[^0-9]/g, '') !== myVendor.phone_number.replace(/[^0-9]/g, '') && phoneOtpStage !== 'verified')}
              >
                <Text style={styles.modalSaveBtnText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#000000',
    marginLeft: 8,
    lineHeight: 28.6,
  },
  saveHeaderText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#D46A43',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  profileSection: {
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 16,
  },
  profileImageContainer: {
    position: 'relative',
    width: 100,
    height: 100,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#FFF',
  },
  profileEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E06B2B',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  changePhotoText: {
    fontSize: 12,
    color: '#5A4136',
    fontWeight: '500',
    marginTop: 8,
    lineHeight: 14.4,
    letterSpacing: 0.24,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 32,
    borderWidth: 1,
    borderColor: '#E2BFB0',
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3D281A',
    marginLeft: 8,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8C7769',
    marginTop: 14,
    marginBottom: 6,
  },
  inputContainer: {
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#EFE8E2',
    borderRadius: 14,
    height: 48,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: '#3D281A',
    height: '100%',
    padding: 0,
  },
  pressableInputText: {
    fontSize: 15,
    color: '#3D281A',
  },
  textAreaContainer: {
    height: 'auto',
    minHeight: 80,
    paddingVertical: 12,
    alignItems: 'flex-start',
  },
  textAreaInput: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  categoriesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF0E8',
    borderColor: '#EEDCD0',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  categoryChipText: {
    fontSize: 13,
    color: '#8C7769',
    fontWeight: '600',
  },
  addCategoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderColor: '#D4BFA7',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  addCategoryChipText: {
    fontSize: 13,
    color: '#8C7769',
    fontWeight: '600',
    marginLeft: 4,
  },
  hoursBox: {
    marginTop: 8,
  },
  hoursRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#EFE8E2',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  hoursLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8C7769',
    marginBottom: 2,
  },
  hoursValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3D281A',
  },
  hoursDivider: {
    height: 8,
  },
  addPhotoLink: {
    fontSize: 13,
    fontWeight: '700',
    color: '#D46A43',
  },
  galleryScroll: {
    marginTop: 8,
  },
  galleryImageContainer: {
    position: 'relative',
    marginRight: 12,
  },
  galleryImage: {
    width: 90,
    height: 90,
    borderRadius: 16,
    backgroundColor: '#FAF8F5',
  },
  galleryImageLoader: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyGalleryText: {
    fontSize: 13,
    color: '#8C7769',
    fontStyle: 'italic',
    paddingVertical: 12,
  },
  deactivateCard: {
    backgroundColor: '#FFF5F2',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#FAD5C6',
    padding: 20,
    marginVertical: 16,
    alignItems: 'center',
  },
  deactivateTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#D34F40',
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  deactivateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: '#D34F40',
    borderWidth: 1,
    borderRadius: 16,
    width: '100%',
    paddingVertical: 12,
  },
  deactivateButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#D34F40',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3D281A',
  },
  modalInputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8C7769',
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#EFE8E2',
    borderRadius: 14,
    padding: 14,
    fontSize: 15,
    color: '#3D281A',
    marginBottom: 16,
  },
  modalSelectedCats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  modalSelectedCatChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF0E8',
    borderColor: '#EEDCD0',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  modalSelectedCatText: {
    fontSize: 13,
    color: '#8C7769',
    fontWeight: '600',
    marginRight: 4,
  },
  modalSuggestions: {
    backgroundColor: '#FAF8F5',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EFE8E2',
    marginBottom: 16,
    overflow: 'hidden',
  },
  modalSuggestionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EFE8E2',
  },
  modalSuggestionText: {
    fontSize: 14,
    color: '#3D281A',
  },
  modalAddCustomBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#FAF0E8',
    borderRadius: 14,
    marginBottom: 16,
  },
  modalAddCustomText: {
    marginLeft: 8,
    color: '#D46A43',
    fontSize: 14,
    fontWeight: '600',
  },
  modalSaveBtn: {
    backgroundColor: '#D46A43',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  modalSaveBtnDisabled: {
    opacity: 0.6,
  },
  modalSaveBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  phoneVerificationSection: {
    marginBottom: 16,
  },
  phoneVerificationMessage: {
    color: '#D46A43',
    fontSize: 13,
    marginBottom: 8,
  },
  phoneVerificationError: {
    color: '#D34F40',
    fontSize: 13,
    marginBottom: 8,
  },
  phoneVerificationSuccess: {
    color: '#4CAF50',
    fontSize: 13,
    fontWeight: '600',
    marginVertical: 8,
  },
  modalVerifyBtn: {
    backgroundColor: '#D46A43',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  modalVerifyBtnDisabled: {
    opacity: 0.6,
  },
  modalVerifyBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#8C7769',
    marginTop: 12,
    marginBottom: 20,
  },
  registerBtn: {
    backgroundColor: '#D46A43',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
  },
  registerBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});
