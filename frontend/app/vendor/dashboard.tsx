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
import Svg, { Path } from 'react-native-svg';
import { DeleteOTPModal } from '../../src/components/DeleteOTPModal';

import { sendOTP, verifyOTP, getKYCStatus } from '../../src/services/api';

const PersonalInfoIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
    <Path d="M8 8C6.9 8 5.95833 7.60833 5.175 6.825C4.39167 6.04167 4 5.1 4 4C4 2.9 4.39167 1.95833 5.175 1.175C5.95833 0.391667 6.9 0 8 0C9.1 0 10.0417 0.391667 10.825 1.175C11.6083 1.95833 12 2.9 12 4C12 5.1 11.6083 6.04167 10.825 6.825C10.0417 7.60833 9.1 8 8 8ZM0 16V13.2C0 12.6333 0.145833 12.1125 0.4375 11.6375C0.729167 11.1625 1.11667 10.8 1.6 10.55C2.63333 10.0333 3.68333 9.64583 4.75 9.3875C5.81667 9.12917 6.9 9 8 9C9.1 9 10.1833 9.12917 11.25 9.3875C12.3167 9.64583 13.3667 10.0333 14.4 10.55C14.8833 10.8 15.2708 11.1625 15.5625 11.6375C15.8542 12.1125 16 12.6333 16 13.2V16H0ZM2 14H14V13.2C14 13.0167 13.9542 12.85 13.8625 12.7C13.7708 12.55 13.65 12.4333 13.5 12.35C12.6 11.9 11.6917 11.5625 10.775 11.3375C9.85833 11.1125 8.93333 11 8 11C7.06667 11 6.14167 11.1125 5.225 11.3375C4.30833 11.5625 3.4 11.9 2.5 12.35C2.35 12.4333 2.22917 12.55 2.1375 12.7C2.04583 12.85 2 13.0167 2 13.2V14ZM8 6C8.55 6 9.02083 5.80417 9.4125 5.4125C9.80417 5.02083 10 4.55 10 4C10 3.45 9.80417 2.97917 9.4125 2.5875C9.02083 2.19583 8.55 2 8 2C7.45 2 6.97917 2.19583 6.5875 2.5875C6.19583 2.97917 6 3.45 6 4C6 4.55 6.19583 5.02083 6.5875 5.4125C6.97917 5.80417 7.45 6 8 6Z" fill="#A04100" />
  </Svg>
);

const ContactInfoIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
    <Path d="M7.32374 11.7963C7.39366 11.866 7.44913 11.9488 7.48699 12.04C7.52484 12.1311 7.54433 12.2289 7.54433 12.3276C7.54433 12.4263 7.52484 12.524 7.48699 12.6152C7.44913 12.7064 7.39366 12.7892 7.32374 12.8588L7.00374 13.1788C6.66405 13.5198 6.26014 13.79 5.81536 13.9739C5.37058 14.1578 4.89377 14.2516 4.41249 14.2501C3.68769 14.2503 2.97912 14.0356 2.3764 13.633C1.77368 13.2304 1.30391 12.6582 1.02651 11.9886C0.749115 11.3189 0.676559 10.5821 0.818022 9.87125C0.959486 9.1604 1.30861 8.50747 1.82124 7.99509L3.99311 5.82321C4.45507 5.36132 5.03209 5.0313 5.66443 4.86731C6.29677 4.70332 6.96146 4.71132 7.58967 4.89049C8.21788 5.06966 8.78678 5.41348 9.23748 5.88637C9.68818 6.35925 10.0043 6.944 10.1531 7.58009C10.1778 7.6768 10.1829 7.77746 10.1681 7.87617C10.1533 7.97488 10.119 8.06965 10.0672 8.15493C10.0153 8.24021 9.94698 8.31428 9.86614 8.37281C9.78529 8.43133 9.69358 8.47313 9.59637 8.49576C9.49917 8.51839 9.39842 8.52139 9.30004 8.50458C9.20166 8.48777 9.10763 8.4515 9.02345 8.39789C8.93926 8.34427 8.86663 8.27439 8.8098 8.19235C8.75297 8.1103 8.71309 8.01774 8.69249 7.92009C8.60418 7.54461 8.4172 7.19952 8.15086 6.92051C7.88452 6.6415 7.54849 6.43869 7.17752 6.33304C6.80654 6.2274 6.41409 6.22275 6.04071 6.31958C5.66734 6.41641 5.32661 6.61121 5.05374 6.88384L2.88186 9.05571C2.57912 9.35821 2.37288 9.74369 2.28923 10.1634C2.20557 10.5831 2.24827 11.0182 2.41191 11.4137C2.57555 11.8091 2.85278 12.1472 3.20855 12.385C3.56432 12.6229 3.98264 12.75 4.41061 12.7501C4.69497 12.7509 4.97666 12.6953 5.23939 12.5865C5.50212 12.4777 5.74067 12.3179 5.94124 12.1163L6.26061 11.7963C6.3303 11.7263 6.41313 11.6708 6.50435 11.6329C6.59558 11.5949 6.69339 11.5754 6.79217 11.5754C6.89096 11.5754 6.98877 11.5949 7.07999 11.6329C7.17121 11.6708 7.25405 11.7263 7.32374 11.7963ZM14.1769 2.82321C13.4895 2.13603 12.5573 1.75 11.5853 1.75C10.6133 1.75 9.68114 2.13603 8.99374 2.82321L8.67436 3.14259C8.53346 3.28348 8.45431 3.47458 8.45431 3.67384C8.45431 3.87309 8.53346 4.06419 8.67436 4.20509C8.81526 4.34598 9.00635 4.42514 9.20561 4.42514C9.40487 4.42514 9.59596 4.34598 9.73686 4.20509L10.0569 3.88509C10.463 3.47897 11.0138 3.25082 11.5881 3.25082C12.1624 3.25082 12.7132 3.47897 13.1194 3.88509C13.5255 4.2912 13.7536 4.84201 13.7536 5.41634C13.7536 5.99067 13.5255 6.54147 13.1194 6.94759L10.9437 9.11634C10.7432 9.31797 10.5047 9.47781 10.2419 9.5866C9.97919 9.69539 9.69748 9.75096 9.41311 9.75009C8.9253 9.74974 8.4519 9.58461 8.0697 9.28149C7.6875 8.97836 7.41891 8.55501 7.30749 8.08009C7.2624 7.88631 7.14218 7.71839 6.97328 7.61325C6.80438 7.50811 6.60063 7.47437 6.40686 7.51946C6.21309 7.56455 6.04516 7.68476 5.94002 7.85366C5.83489 8.02256 5.80115 8.22631 5.84624 8.42009C6.03443 9.22438 6.4888 9.94152 7.13567 10.4552C7.78254 10.9689 8.58397 11.249 9.40999 11.2501H9.41311C9.89462 11.2514 10.3716 11.1572 10.8165 10.973C11.2614 10.7888 11.6653 10.5183 12.005 10.177L14.1769 8.00509C14.5172 7.66487 14.7871 7.26094 14.9713 6.81638C15.1554 6.37183 15.2502 5.89534 15.2502 5.41415C15.2502 4.93295 15.1554 4.45647 14.9713 4.01191C14.7871 3.56736 14.5172 3.16343 14.1769 2.82321Z" fill="#A04100" />
  </Svg>
);

const BusinessInfoIcon = () => (
  <Svg width={20} height={19} viewBox="0 0 20 19" fill="none">
    <Path d="M2 19C1.45 19 0.979167 18.8042 0.5875 18.4125C0.195833 18.0208 0 17.55 0 17V6C0 5.45 0.195833 4.97917 0.5875 4.5875C0.979167 4.19583 1.45 4 2 4H6V2C6 1.45 6.19583 0.979167 6.5875 0.5875C6.97917 0.195833 7.45 0 8 0H12C12.55 0 13.0208 0.195833 13.4125 0.5875C13.8042 0.979167 14 1.45 14 2V4H18C18.55 4 19.0208 4.19583 19.4125 4.5875C19.8042 4.97917 20 5.45 20 6V17C20 17.55 19.8042 18.0208 19.4125 18.4125C19.0208 18.8042 18.55 19 18 19H2ZM8 4H12V2H8V4ZM18 13H13V15H7V13H2V17H18V13ZM9 13H11V11H9V13ZM2 11H7V9H13V11H18V6H2V11Z" fill="#A04100" />
  </Svg>
);

const GalleryIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
    <Path d="M7 12H17L13.55 7.5L11.25 10.5L9.7 8.5L7 12ZM6 16C5.45 16 4.97917 15.8042 4.5875 15.4125C4.19583 15.0208 4 14.55 4 14V2C4 1.45 4.19583 0.979167 4.5875 0.5875C4.97917 0.195833 5.45 0 6 0H18C18.55 0 19.0208 0.195833 19.4125 0.5875C19.8042 0.979167 20 1.45 20 2V14C20 14.55 19.8042 15.0208 19.4125 15.4125C19.0208 15.8042 18.55 16 18 16H6ZM6 14H18V2H6V14ZM2 20C1.45 20 0.979167 19.8042 0.5875 19.4125C0.195833 19.0208 0 18.55 0 18V4H2V18H16V20H2ZM6 2V14V2Z" fill="#A04100" />
  </Svg>
);

export default function VendorDashboardScreen() {
  const router = useRouter();
  const { myVendor, fetchMyVendor, updateVendor, updateBusinessProfile, deleteVendor, uploadBusinessImage } = useVendorStore();
  const { user, isLoading: authLoading, isAuthenticated, updateUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [deletingBusiness, setDeletingBusiness] = useState(false);
  const [deleteOtpModalVisible, setDeleteOtpModalVisible] = useState(false);
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

  const profileUri = (myVendor.business_gallery_images && myVendor.business_gallery_images[0]) || (myVendor.photos && myVendor.photos[0]);

  const getGalleryPhotos = () => {
    const list: Array<{ url: string | null; slot: number; isLoading?: boolean }> = [];
    const images = myVendor.business_gallery_images || [];
    for (let i = 1; i < 5; i++) {
      if (images[i]) {
        list.push({ url: images[i], slot: i });
      } else if (loadingSlot === i) {
        list.push({ url: null, slot: i, isLoading: true });
      }
    }
    if (list.length === 0 && myVendor.photos && myVendor.photos.length > 1) {
      for (let i = 1; i < myVendor.photos.length; i++) {
        list.push({ url: myVendor.photos[i], slot: i });
      }
    }
    return list;
  };

  const galleryPhotos = getGalleryPhotos();

  const getNextGallerySlot = () => {
    const images = myVendor.business_gallery_images || [];
    for (let i = 1; i < 5; i++) {
      if (!images[i]) return i;
    }
    return 5;
  };

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
    if (!myVendor) return;
    const vendorPhone = myVendor.phone_number || (user as any)?.phone_number;
    if (!vendorPhone) {
      Alert.alert(
        'Phone Number Required',
        'A registered mobile number is required to delete your business. Please update your phone number first.'
      );
      return;
    }

    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Are you sure you want to delete your business? This action cannot be undone.');
      if (confirmed) {
        setDeleteOtpModalVisible(true);
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
          onPress: () => setDeleteOtpModalVisible(true),
        }
      ]
    );
  };

  const handleVerifyOTPAndDeleteBusiness = async (otp: string) => {
    if (!myVendor) return;
    try {
      await deleteVendor(myVendor.id, otp);
      setDeleteOtpModalVisible(false);
      if (Platform.OS === 'web') {
        window.alert('Your business has been deleted.');
      } else {
        Alert.alert('Deleted', 'Your business has been deleted.');
      }
      router.replace('/(tabs)/vendor');
    } catch (error: any) {
      throw error; // Let modal handle error display
    }
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
      router.replace(`/vendor/${myVendor.id}`);
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
              source={profileUri ? { uri: profileUri } : require('../../assets/images/favicon.png')}
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
            <PersonalInfoIcon />
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
            <ContactInfoIcon />
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
            <BusinessInfoIcon />
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
                  <Ionicons name="close" size={14} color="#A04100" style={{ marginLeft: 4 }} />
                </TouchableOpacity>
              </View>
            ))}
             <TouchableOpacity style={styles.addCategoryChip} onPress={handleEditCategories}>
              <Ionicons name="add" size={14} color="#A04100" />
              <Text style={styles.addCategoryChipText}>Add Category</Text>
             </TouchableOpacity>
          </View>

          <Text style={[styles.inputLabel, { marginTop: 14 }]}>Description</Text>
          <View style={[styles.inputContainer, styles.descriptionContainer]}>
            <TextInput
              style={[styles.textInput, styles.textAreaInput, { height: '100%' }]}
              value={descriptionVal}
              onChangeText={setDescriptionVal}
              placeholder="Description"
              placeholderTextColor="#9A897E"
              multiline
              numberOfLines={4}
            />
          </View>

          <Text style={styles.inputLabel}>Address</Text>
          <View style={[styles.inputContainer, styles.addressContainer]}>
            <TextInput
              style={[styles.textInput, styles.textAreaInput, { height: '100%' }]}
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
              <GalleryIcon />
              <Text style={styles.cardTitle}>Gallery</Text>
            </View>
            {getNextGallerySlot() < 5 && (
              <TouchableOpacity onPress={() => pickAndUploadImage(getNextGallerySlot())}>
                <Text style={styles.addPhotoLink}>Add Photo</Text>
              </TouchableOpacity>
            )}
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.galleryScroll}>
            {galleryPhotos.map((item, idx) => (
              <View key={idx} style={styles.galleryImageContainer}>
                {item.url ? (
                  <Image source={{ uri: item.url }} style={styles.galleryImage} />
                ) : (
                  <View style={[styles.galleryImage, { backgroundColor: '#FAF8F5', justifyContent: 'center', alignItems: 'center' }]}>
                    <ActivityIndicator size="small" color="#A04100" />
                  </View>
                )}
                {loadingSlot === item.slot && item.url && (
                  <View style={styles.galleryImageLoader}>
                    <ActivityIndicator size="small" color="#fff" />
                  </View>
                )}
              </View>
            ))}
            {galleryPhotos.length === 0 && (
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

      <DeleteOTPModal
        visible={deleteOtpModalVisible}
        phoneNumber={myVendor?.phone_number || (user as any)?.phone_number || ''}
        onClose={() => setDeleteOtpModalVisible(false)}
        onVerify={handleVerifyOTPAndDeleteBusiness}
        title="Delete Business"
        description="Verify OTP to delete your business profile"
      />

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
                        <Ionicons name="close" size={14} color="#A04100" />
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
    color: '#000000',
    fontSize: 20,
    fontStyle: 'normal',
    fontWeight: '600',
    lineHeight: 28,
    marginLeft: 8,
  },
  inputLabel: {
    color: '#5A4136',
    fontSize: 12,
    fontStyle: 'normal',
    fontWeight: '500',
    lineHeight: 14.4,
    letterSpacing: 0.24,
    marginTop: 0,
    marginBottom: 6,
  },
  inputContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2BFB0',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
    marginBottom: 16,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: '#3D281A',
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
  descriptionContainer: {
    height: 123,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'flex-start',
  },
  addressContainer: {
    height: 99,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'flex-start',
  },
  textAreaInput: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  categoriesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginTop: 4,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFDBCC',
    borderColor: '#A04100',
    borderWidth: 1,
    borderRadius: 9999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  categoryChipText: {
    fontSize: 13,
    color: '#A04100',
    fontWeight: '600',
  },
  addCategoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderColor: '#A04100',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 9999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  addCategoryChipText: {
    fontSize: 13,
    color: '#A04100',
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
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2BFB0',
    borderRadius: 12,
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
    height: 14,
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
    width: 97.33,
    height: 97.33,
    borderRadius: 16,
    backgroundColor: '#FAF8F5',
  },
  galleryImageLoader: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.40)',
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
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2BFB0',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#3D281A',
    marginBottom: 16,
    alignSelf: 'stretch',
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
    backgroundColor: '#FFDBCC',
    borderColor: '#A04100',
    borderWidth: 1,
    borderRadius: 9999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  modalSelectedCatText: {
    fontSize: 13,
    color: '#A04100',
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
