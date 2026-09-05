import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  RefreshControl,
  TextInput,
  Linking,
  Alert,
  ActivityIndicator,
  Image,
  Platform,
  Dimensions,
  AppState,
  Modal,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Keyboard,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  useAnimatedReaction,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useRouter } from 'expo-router';
import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FlashList, FlashListProps } from '@shopify/flash-list';
import * as Location from 'expo-location';

import { COLORS, SPACING, BORDER_RADIUS } from '../../src/constants/theme';
import { calculateHaversineDistance } from '../../src/utils/formatDistance';
import { sortItemsByLocationPreference, computeLocationTier } from '../../src/utils/locationPreference';
import { useTabBar } from '../../src/contexts/TabBarContext';
import { filterVendorsBySmartSearch } from '../../src/utils/categoryMatcher';
import { VendorRegistrationModal } from '../../src/components/VendorRegistrationModal';
import VendorCategories from '../../src/components/VendorCategories';
import { VendorSearchBar } from '../../src/components/VendorSearchBar';
import { useTranslation } from '../../src/utils/i18n';
import { useAuthStore } from '../../src/store/authStore';
import { useVendorStore, Vendor } from '../../src/store/vendorStore';
import { ensureForegroundPermission, getCurrentPosition } from '../../src/services/location';
import { getKYCStatus } from '../../src/services/api';

// ============================================================================
// Types & Interfaces
// ============================================================================

export type TranslationKey = keyof typeof LOCAL_TRANSLATIONS.en;

export interface UploadablePhoto {
  uri: string;
  name: string;
  type: string;
}

export interface VendorRegistrationFormData {
  businessName: string;
  ownerName: string;
  yearsInBusiness?: number;
  categories?: string[];
  address: string;
  locationLink?: string;
  phoneNumber: string;
  latitude?: number;
  longitude?: number;
  isCurrentLocation?: boolean;
  photos?: (string | UploadablePhoto)[];
}

export interface UserLocationInfo {
  latitude?: number;
  longitude?: number;
  area?: string;
  city?: string;
  state?: string;
  country?: string;
}

interface ServiceCardProps {
  category: string;
  title: string;
  imageUri: string;
  iconUri: string;
  width: number;
  height: number;
  isTall?: boolean;
  onPress: (category: string) => void;
}

interface BusinessCardProps {
  category: string;
  title: string;
  imageUri: string;
  iconUri: string;
  width?: number;
  height: number;
  marginBottom?: number;
  onPress: (category: string) => void;
}

interface VendorCardComponentProps {
  item: Vendor;
  userLocInfo: UserLocationInfo;
  localT: (key: TranslationKey) => string;
  onPress: (id: string) => void;
  onCall: (phoneNumber: string) => void;
}

// ============================================================================
// Constants & Module-Level Variables
// ============================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const AnimatedFlashList = Animated.createAnimatedComponent(FlashList as React.ComponentType<FlashListProps<any>>);

const VSCREEN_WIDTH = Dimensions.get('window').width;

// Responsive variables to prevent horizontal scroll/layout cuts on both platforms
const wrapperWidth = Math.min(394, VSCREEN_WIDTH - 16);
const gridPadding = 16;
const gap = 8;
const cardWidth = (wrapperWidth - (gridPadding * 2) - (gap * 2) - 4) / 3;
const rightColWidth = cardWidth * 2 + gap;

const businessGridWidth = Math.min(347, VSCREEN_WIDTH - 16);
const businessRightColWidth = (businessGridWidth - 12) / 3.13;
const businessLeftColWidth = businessRightColWidth * 2.13;

const LOCAL_TRANSLATIONS = {
  en: {
    nearby: 'Nearby',
    searchFor: 'Search for "',
    all: 'All',
    more: '+ More',
    showLess: 'Show Less',
    categoryPrefix: 'Category: ',
    professionPrefix: 'Profession: ',
    manageMyService: 'Manage My Service',
    kycVerified: 'KYC Verified',
    kycRejected: 'KYC Rejected',
    verificationInReview: 'Verification In Review',
    pendingKyc: 'Pending KYC',
    verify: 'Verify',
    registerYourService: 'Register Your Service',
    registerBusinessService: 'Register Your Business/Service',
    noServicesFound: 'No services found',
    beFirstRegisterSub: 'Be the first to register in this area!',
    preferredCityNotSet: 'Preferred city not set',
    years: 'yrs',
    profession: 'Profession',
    carpenter: 'Carpenter',
    housemaid: 'Housemaid',
    plumber: 'Plumber',
    electrician: 'Electrician',
    cook: 'Cook',
    teacher: 'Teacher',
    painter: 'Painter',
    beautician: 'Beautician',
    astrologer: 'Astrologer',
    panditji: 'Panditji',
    salon: 'Salon',
    generalstore: 'General Store',
    'general store': 'General Store',
    dairy: 'Dairy',
    deleteTitle: 'Delete Service Profile',
    deleteConfirm: 'Are you sure you want to permanently delete your service business profile? This action cannot be undone.',
    deletedTitle: 'Deleted',
    deletedMsg: 'Your service registration was deleted successfully.',
    unavailable: 'Unavailable',
    cvNotAvailable: 'CV link is not available.',
    cvOpenError: 'Could not open CV link.',
    regCompleteTitle: 'Registration Complete',
    regCompleteMsg: 'Your business is registered. Please complete KYC verification to make it visible and access all features.',
    later: 'Later',
    completeKyc: 'Complete KYC',
    cancel: 'Cancel',
    deletePermanently: 'Delete Permanently',
    failedDelete: 'Failed to delete service.',
    error: 'Error',
    approvedTitle: 'Approved',
    approvedMsg: 'Your business has been registered and your KYC is already verified.',
    goDashboard: 'Go to Dashboard',
    searchRequests: 'Search services...',
    sanataniServicesAround: 'Sanatani Services Around You',
    sanataniBusinessAround: "Sanatani Business's Around You",
    allVendorsKyc: 'All vendors are KYC verified.',
    kycComplete: 'KYC Complete',
    kycUnderReview: 'KYC Under Review',
    kycRequired: 'KYC Required',
    kycRequiredTitle: 'KYC Required',
    kycRequiredMsg: 'Please complete your KYC verification to manage your business/service.',
  },
  hi: {
    nearby: 'आस-पास',
    searchFor: 'खोजें "',
    all: 'सभी',
    more: '+ अधिक',
    showLess: 'कम दिखाएं',
    categoryPrefix: 'श्रेणी: ',
    professionPrefix: 'पेशा: ',
    manageMyService: 'मेरी सेवा प्रबंधित करें',
    kycVerified: 'केवाईसी सत्यापित',
    kycRejected: 'केवाईसी अस्वीकृत',
    verificationInReview: 'सत्यापन समीक्षा में है',
    pendingKyc: 'लंबित केवाईसी',
    verify: 'सत्यापित करें',
    registerYourService: 'अपनी सेवा पंजीकृत करें',
    registerBusinessService: 'अपना व्यवसाय/सेवा पंजीकृत करें',
    noServicesFound: 'कोई सेवाएं नहीं मिलीं',
    beFirstRegisterSub: 'इस क्षेत्र में पंजीकरण करने वाले पहले व्यक्ति बनें!',
    preferredCityNotSet: 'पसंदीदा शहर सेट नहीं है',
    years: 'वर्ष',
    profession: 'पेशा',
    carpenter: 'बढ़ई',
    housemaid: 'कामवाली',
    plumber: 'नलसाज',
    electrician: 'बिजली मिस्त्री',
    cook: 'रसोइया',
    teacher: 'शिक्षक',
    painter: 'चित्रकार',
    beautician: 'ब्यूटीशियन',
    astrologer: 'ज्योतिषी',
    panditji: 'पंडितजी',
    salon: 'सैलून',
    generalstore: 'किराना दुकान',
    'general store': 'किराना दुकान',
    dairy: 'डेयरी',
    deleteTitle: 'सेवा प्रोफ़ाइल हटाएं',
    deleteConfirm: 'क्या आप वाकई अपनी सेवा व्यवसाय प्रोफ़ाइल को स्थायी रूप से हटाना चाहते हैं? इस कार्रवाई को वापस नहीं लिया जा सकता।',
    deletedTitle: 'हटा दिया गया',
    deletedMsg: 'आपका सेवा पंजीकरण सफलतापूर्वक हटा दिया गया था।',
    unavailable: 'अनुपलब्ध',
    cvNotAvailable: 'सीवी लिंक उपलब्ध नहीं है।',
    cvOpenError: 'सीवी लिंक नहीं खोला जा सका।',
    regCompleteTitle: 'पंजीकरण पूरा हुआ',
    regCompleteMsg: 'आपका व्यवसाय पंजीकृत है। कृपया इसे दृश्यमान बनाने और सभी सुविधाओं का उपयोग करने के लिए केवाईसी सत्यापन पूरा करें।',
    later: 'बाद में',
    completeKyc: 'केवाईसी पूरा करें',
    cancel: 'रद्द करें',
    deletePermanently: 'स्थायी रूप से हटाएं',
    failedDelete: 'सेवा हटाने में विफल।',
    error: 'त्रुटि',
    approvedTitle: 'सत्यापित',
    approvedMsg: 'आपका व्यवसाय पंजीकृत कर दिया गया है और आपका केवाईसी पहले से ही सत्यापित है।',
    goDashboard: 'डैशबोर्ड पर जाएं',
    searchRequests: 'सेवाएं खोजें...',
    sanataniServicesAround: 'आपके आसपास सनातनी सेवाएं',
    sanataniBusinessAround: 'आपके आसपास सनातनी व्यवसाय',
    allVendorsKyc: 'सभी विक्रेता केवाईसी सत्यापित हैं।',
    kycComplete: 'केवाईसी पूर्ण',
    kycUnderReview: 'केवाईसी समीक्षाधीन',
    kycRequired: 'केवाईसी आवश्यक',
    kycRequiredTitle: 'केवाईसी आवश्यक',
    kycRequiredMsg: 'अपना व्यवसाय/सेवा प्रबंधित करने के लिए कृपया केवाईसी सत्यापन पूरा करें।',
  },
};

const getVendorIcon = (vendorCategories?: string[]): keyof typeof Ionicons.glyphMap => {
  const cats = vendorCategories || [];
  const category = cats[0]?.toLowerCase() || '';
  if (category.includes('pooja') || category.includes('pandit')) return 'flower';
  if (category.includes('grocery') || category.includes('sweets')) return 'basket';
  if (category.includes('restaurant') || category.includes('catering')) return 'restaurant';
  if (category.includes('gym') || category.includes('yoga')) return 'fitness';
  if (category.includes('salon')) return 'cut';
  return 'storefront';
};

// ============================================================================
// Extracted Sub-Components
// ============================================================================

const ServiceCard = memo<ServiceCardProps>(({
  category,
  title,
  imageUri,
  iconUri,
  width,
  height,
  isTall = false,
  onPress,
}) => {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={`View ${title} services`}
      style={[
        styles.figmaServiceCard,
        {
          width,
          height,
          ...(isTall ? { alignItems: 'flex-start' } : {}),
        },
      ]}
      onPress={() => onPress(category)}
    >
      <ExpoImage
        source={imageUri}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        cachePolicy="memory-disk"
      />
      <View style={[styles.figmaServiceBadge, isTall && { marginLeft: 8 }]}>
        <ExpoImage
          source={iconUri}
          style={styles.badgeIcon}
          contentFit="contain"
          cachePolicy="memory-disk"
        />
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          style={styles.figmaServiceBadgeText}
        >
          {title}
        </Text>
      </View>
    </TouchableOpacity>
  );
});
ServiceCard.displayName = 'ServiceCard';

const BusinessCard = memo<BusinessCardProps>(({
  category,
  title,
  imageUri,
  iconUri,
  width,
  height,
  marginBottom,
  onPress,
}) => {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={`View ${title} businesses`}
      style={[
        styles.figmaBusinessCard,
        {
          height,
          ...(width !== undefined ? { width } : {}),
          ...(marginBottom !== undefined ? { marginBottom } : {}),
        },
      ]}
      onPress={() => onPress(category)}
    >
      <ExpoImage
        source={imageUri}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        cachePolicy="memory-disk"
      />
      <View style={styles.figmaServiceBadge}>
        <ExpoImage
          source={iconUri}
          style={styles.badgeIcon}
          contentFit="contain"
          cachePolicy="memory-disk"
        />
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          style={styles.figmaServiceBadgeText}
        >
          {title}
        </Text>
      </View>
    </TouchableOpacity>
  );
});
BusinessCard.displayName = 'BusinessCard';

const VendorCardComponent = memo<VendorCardComponentProps>(({
  item,
  userLocInfo,
  localT,
  onPress,
  onCall,
}) => {
  const vendorCategories = item?.categories || [];
  const isApprovedVendor =
    (item.kyc_status === 'verified' ||
      item.kyc_status === 'approved' ||
      item.is_verified ||
      item.review_status === 'approved' ||
      item.review_status === 'verified') &&
    item.kyc_status !== 'rejected' &&
    item.review_status !== 'rejected';

  const previewImage =
    (item.business_gallery_images && item.business_gallery_images.find((url: string) => Boolean(url))) ||
    (item.photos && item.photos.length > 0 ? item.photos[0] : null);

  const locTier = computeLocationTier(item, userLocInfo);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${item.business_name || 'Business'} profile`}
      style={({ pressed }) => [
        styles.vendorCard,
        Platform.OS === 'ios' && pressed && { opacity: 0.7 },
      ]}
      android_ripple={{ color: 'rgba(0, 0, 0, 0.1)' }}
      onPress={() => onPress(item.id)}
    >
      {/* Business Image Placeholder */}
      <View style={styles.vendorImageContainer}>
        {previewImage ? (
          <ExpoImage
            source={{ uri: previewImage }}
            style={styles.vendorImage}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={200}
          />
        ) : (
          <View style={styles.vendorImagePlaceholder}>
            <Ionicons name={getVendorIcon(vendorCategories)} size={28} color={COLORS.primary} />
          </View>
        )}
      </View>

      <View style={styles.vendorInfo}>
        <View style={styles.vendorNameRow}>
          <Text style={styles.vendorName} numberOfLines={1}>
            {item.business_name || 'Unnamed Business'}
          </Text>
          {isApprovedVendor && (
            <Ionicons name="checkmark-circle" size={16} color="#1DA1F2" style={styles.vendorVerifiedIcon} />
          )}
        </View>

        {/* Categories */}
        {vendorCategories.length > 0 && (
          <View style={styles.categoriesRow}>
            {vendorCategories.slice(0, 2).map((cat: string, idx: number) => {
              const lowerKey = cat.toLowerCase() as TranslationKey;
              const translated = (LOCAL_TRANSLATIONS.en[lowerKey] !== undefined) ? localT(lowerKey) : cat;
              return (
                <View key={idx} style={styles.categoryBadge}>
                  <Text style={styles.categoryBadgeText} numberOfLines={1}>
                    {translated || cat}
                  </Text>
                </View>
              );
            })}
            {vendorCategories.length > 2 && (
              <Text style={styles.moreCats}>+{vendorCategories.length - 2}</Text>
            )}
          </View>
        )}

        {/* Distance & Location Preference Sub-Tier Badge */}
        <View style={styles.distanceRow}>
          <Ionicons name="location" size={12} color={COLORS.primary} />
          <Text style={styles.distanceText}>{locTier.fullLabel}</Text>
        </View>
      </View>

      {/* Call Button */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Call ${item.business_name || 'Vendor'}`}
        style={({ pressed }) => [
          styles.callButton,
          Platform.OS === 'ios' && pressed && { opacity: 0.7 },
        ]}
        android_ripple={{ color: 'rgba(0, 0, 0, 0.05)', borderless: true }}
        onPress={() => onCall(item.phone_number)}
      >
        <Ionicons name="call" size={20} color={COLORS.primary} />
      </Pressable>
    </Pressable>
  );
});
VendorCardComponent.displayName = 'VendorCardComponent';

// ============================================================================
// Main Component (VendorScreen)
// ============================================================================

export default function VendorScreen() {
  const router = useRouter();
  const { language } = useTranslation();
  const { showTabBar, hideTabBar } = useTabBar();
  const currentLang = (language === 'hi' || language === 'en') ? language : 'en';

  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const scrollY = useSharedValue(0);

  const animatedScrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => {
      'worklet';
      scrollY.set(e.contentOffset.y);
    },
  });

  const animatedSearchContainerStyle = useAnimatedStyle(() => ({
    height: interpolate(scrollY.get(), [0, 65], [52, 0], Extrapolation.CLAMP),
    opacity: interpolate(scrollY.get(), [0, 55], [1, 0], Extrapolation.CLAMP),
    overflow: 'hidden' as const,
  }));

  const animatedSearchInnerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(scrollY.get(), [0, 65], [0, -14], Extrapolation.CLAMP) }],
  }));

  const tabBarHidden = useSharedValue(false);
  const lastScrollY = useSharedValue(0);
  const accumulatedDelta = useSharedValue(0);

  useAnimatedReaction(
    () => scrollY.get(),
    (cur, prev) => {
      if (prev === null) {
        lastScrollY.set(cur);
        return;
      }
      if (cur <= 10) {
        accumulatedDelta.set(0);
        lastScrollY.set(cur);
        if (tabBarHidden.get()) {
          tabBarHidden.set(false);
          scheduleOnRN(showTabBar);
        }
        return;
      }
      const delta = cur - lastScrollY.get();
      lastScrollY.set(cur);
      if (Math.abs(delta) < 1) return;

      if (delta > 0) {
        // Scrolling down
        if (accumulatedDelta.get() < 0) {
          accumulatedDelta.set(delta);
        } else {
          accumulatedDelta.set(accumulatedDelta.get() + delta);
        }
        if (accumulatedDelta.get() >= 20 && !tabBarHidden.get()) {
          tabBarHidden.set(true);
          scheduleOnRN(hideTabBar);
        }
      } else {
        // Scrolling up
        if (accumulatedDelta.get() > 0) {
          accumulatedDelta.set(delta);
        } else {
          accumulatedDelta.set(accumulatedDelta.get() + delta);
        }
        if (accumulatedDelta.get() <= -20 && tabBarHidden.get()) {
          tabBarHidden.set(false);
          scheduleOnRN(showTabBar);
        }
      }
    }
  );

  const localT = useCallback((key: TranslationKey): string => {
    return LOCAL_TRANSLATIONS[currentLang]?.[key] || LOCAL_TRANSLATIONS.en[key] || key;
  }, [currentLang]);

  const getNoItemsInAreaText = (term: string) => {
    if (currentLang === 'hi') {
      return `आपके क्षेत्र में कोई '${term}' नहीं है।`;
    }
    return `No '${term}' in your area.`;
  };

  // Atomic store selectors
  const user = useAuthStore(state => state.user);
  const authLoading = useAuthStore(state => state.isLoading);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const updateUser = useAuthStore(state => state.updateUser);

  const userId = user?.id;
  const [kycStatus, setKycStatus] = useState<string | null>(user?.kyc_status || null);
  const currentKycStatus = kycStatus || user?.kyc_status || null;
  const isKycVerified = currentKycStatus === 'verified';
  const isKycPending = currentKycStatus === 'pending' || currentKycStatus === 'manual_review';

  const vendors = useVendorStore(state => state.vendors);
  const myVendor = useVendorStore(state => state.myVendor);
  const loading = useVendorStore(state => state.loading);
  const fetchVendors = useVendorStore(state => state.fetchVendors);
  const fetchMyVendor = useVendorStore(state => state.fetchMyVendor);
  const fetchCategories = useVendorStore(state => state.fetchCategories);
  const createVendor = useVendorStore(state => state.createVendor);
  const uploadBusinessImage = useVendorStore(state => state.uploadBusinessImage);

  const hasVerifiedKyc =
    isKycVerified ||
    Boolean(user?.is_verified) ||
    user?.kyc_status === 'verified' ||
    myVendor?.kyc_status === 'verified';

  const hasPendingKyc =
    isKycPending ||
    user?.kyc_status === 'pending' ||
    user?.kyc_status === 'manual_review' ||
    myVendor?.kyc_status === 'pending' ||
    myVendor?.kyc_status === 'manual_review';

  const canAccessDashboard = hasVerifiedKyc || hasPendingKyc;

  const [refreshing, setRefreshing] = useState(false);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  const loadKycStatus = useCallback(async (): Promise<string | null> => {
    try {
      const response = await getKYCStatus();
      const serverStatus = response?.data?.kyc_status || null;
      if (isMountedRef.current) {
        setKycStatus(serverStatus);
      }
      updateUser({
        kyc_status: serverStatus,
        is_verified: Boolean(response?.data?.is_verified) || serverStatus === 'verified',
      });
      return serverStatus;
    } catch (error: unknown) {
      console.warn('Failed to refresh KYC status:', error instanceof Error ? error.message : String(error));
      return null;
    }
  }, [updateUser]);

  const searchInputRef = useRef<TextInput | null>(null);
  const registerBtnRef = useRef<any>(null);
  const dismissSearch = useCallback(() => {
    searchInputRef.current?.blur();
    Keyboard.dismiss();
  }, []);
  const homeLocation = (user as any)?.home_location;
  const hLatVal = Number(homeLocation?.latitude ?? homeLocation?.lat);
  const hLngVal = Number(homeLocation?.longitude ?? homeLocation?.lng);
  const homeLatitude = Number.isFinite(hLatVal) && Math.abs(hLatVal) > 0.001 ? hLatVal : undefined;
  const homeLongitude = Number.isFinite(hLngVal) && Math.abs(hLngVal) > 0.001 ? hLngVal : undefined;
  const hasHomeCoordinates = typeof homeLatitude === 'number' && typeof homeLongitude === 'number';

  const loadData = useCallback(async () => {
    try {
      if (Platform.OS === 'web') {
        const hasPermission = await ensureForegroundPermission();
        if (hasPermission) {
          const location = await getCurrentPosition();
          if (isMountedRef.current) {
            setUserLocation({
              lat: location.coords.latitude,
              lng: location.coords.longitude,
            });
          }
          await fetchVendors({
            lat: location.coords.latitude,
            lng: location.coords.longitude,
          });
        } else if (hasHomeCoordinates && homeLatitude !== undefined && homeLongitude !== undefined) {
          if (isMountedRef.current) {
            setUserLocation({
              lat: homeLatitude,
              lng: homeLongitude,
            });
          }
          await fetchVendors({
            lat: homeLatitude,
            lng: homeLongitude,
          });
        } else {
          await fetchVendors();
        }
      } else {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          if (hasHomeCoordinates && homeLatitude !== undefined && homeLongitude !== undefined) {
            if (isMountedRef.current) {
              setUserLocation({ lat: homeLatitude, lng: homeLongitude });
            }
            await fetchVendors({ lat: homeLatitude, lng: homeLongitude });
          } else {
            await fetchVendors();
          }
          await fetchMyVendor();
          await fetchCategories();
          return;
        }

        // Robust location retrieval with timeout
        const location = await Promise.race([
          (async () => {
            try {
              const lastKnown = await Location.getLastKnownPositionAsync({});
              if (lastKnown) return lastKnown;
            } catch {
              // fallback to getCurrentPositionAsync
            }
            return await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
            });
          })(),
          new Promise<null>((_, reject) =>
            setTimeout(() => reject(new Error('Location timeout')), 4000)
          ),
        ]);

        if (location && isMountedRef.current) {
          setUserLocation({
            lat: location.coords.latitude,
            lng: location.coords.longitude,
          });
          await fetchVendors({
            lat: location.coords.latitude,
            lng: location.coords.longitude,
          });
        } else {
          await fetchVendors();
        }
      }
    } catch {
      if (hasHomeCoordinates && homeLatitude !== undefined && homeLongitude !== undefined) {
        if (isMountedRef.current) {
          setUserLocation({
            lat: homeLatitude,
            lng: homeLongitude,
          });
        }
        await fetchVendors({
          lat: homeLatitude,
          lng: homeLongitude,
        });
      } else {
        await fetchVendors();
      }
    }

    await fetchMyVendor();
    await fetchCategories();
  }, [fetchVendors, fetchMyVendor, fetchCategories, hasHomeCoordinates, homeLatitude, homeLongitude]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/');
      return;
    }

    if (!userId) {
      return;
    }
    loadData();
  }, [loadData, userId, authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!userId) return;
    loadKycStatus();
  }, [userId, loadKycStatus]);

  const userLocInfo = React.useMemo<UserLocationInfo>(() => {
    return {
      latitude: userLocation?.lat ?? homeLatitude,
      longitude: userLocation?.lng ?? homeLongitude,
      area: homeLocation?.area,
      city: homeLocation?.city,
      state: homeLocation?.state,
      country: homeLocation?.country,
    };
  }, [userLocation, homeLocation, homeLatitude, homeLongitude]);

  const displayVendors = React.useMemo(() => {
    let filtered = vendors || [];

    if (searchTerm && searchTerm.trim()) {
      filtered = filterVendorsBySmartSearch(filtered, searchTerm);
    }

    // Map each vendor with its live dynamic distance
    const withDist = filtered.map((v) => {
      const dynDist = calculateHaversineDistance(userLocInfo.latitude, userLocInfo.longitude, v.latitude, v.longitude);
      const effectiveDist = dynDist !== null ? dynDist : (typeof v.distance === 'number' ? v.distance : undefined);
      return { ...v, effectiveDist };
    });

    // Sort by Search Relevance -> Location Tier -> SubTier -> Distance
    return sortItemsByLocationPreference(withDist, userLocInfo, searchTerm);
  }, [vendors, searchTerm, userLocInfo]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    if (isMountedRef.current) {
      setRefreshing(false);
    }
  };

  const handleRegisterVendor = async (data: VendorRegistrationFormData) => {
    try {
      const newVendor = await createVendor({
        businessName: data.businessName,
        ownerName: data.ownerName,
        yearsInBusiness: data.yearsInBusiness || 0,
        categories: data.categories || [],
        address: data.address,
        locationLink: data.locationLink || undefined,
        phoneNumber: data.phoneNumber,
        latitude: data.latitude ?? (data.isCurrentLocation ? userLocation?.lat : undefined),
        longitude: data.longitude ?? (data.isCurrentLocation ? userLocation?.lng : undefined),
      });

      // Upload selected photos if present
      if (data.photos && data.photos.length > 0) {
        for (let i = 0; i < data.photos.length; i++) {
          const rawPhoto = data.photos[i];
          const photoPayload: UploadablePhoto = typeof rawPhoto === 'string'
            ? { uri: rawPhoto, name: `photo-${i}.jpg`, type: 'image/jpeg' }
            : rawPhoto;
          try {
            await uploadBusinessImage(newVendor.id, i, photoPayload);
          } catch (uploadErr: unknown) {
            console.warn(`Failed to upload photo at slot ${i}:`, uploadErr instanceof Error ? uploadErr.message : String(uploadErr));
          }
        }
      }

      if (isMountedRef.current) {
        setShowRegistrationModal(false);
      }

      // Refresh vendor data in background
      Promise.all([
        fetchMyVendor(),
        userLocation ? fetchVendors(userLocation) : fetchVendors(),
      ]).catch(err => console.warn('Background fetch error:', err instanceof Error ? err.message : String(err)));

      const isAlreadyVerified =
        Boolean(user?.is_verified) ||
        user?.kyc_status === 'verified' ||
        myVendor?.kyc_status === 'verified';

      if (isAlreadyVerified) {
        router.push({
          pathname: '/vendor/[id]',
          params: { id: newVendor.id, justCreated: 'true' },
        } as never);
      } else {
        router.push({
          pathname: '/kyc',
          params: { returnUrl: `/vendor/${newVendor.id}?justCreated=true` },
        } as never);
      }
    } catch (error: unknown) {
      console.error('Vendor API Registration Error:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  };

  const handleCategoryPress = useCallback((cat: string) => {
    router.push(`/vendor/category/${cat}` as never);
  }, [router]);

  const handleVendorPress = useCallback((id: string) => {
    router.push(`/vendor/${id}` as never);
  }, [router]);

  const handleCall = useCallback((phone: string) => {
    Linking.openURL(`tel:${phone}`);
  }, []);

  const renderVendorItem = useCallback(({ item }: { item: Vendor }) => {
    return (
      <VendorCardComponent
        item={item}
        userLocInfo={userLocInfo}
        localT={localT}
        onPress={handleVendorPress}
        onCall={handleCall}
      />
    );
  }, [userLocInfo, localT, handleVendorPress, handleCall]);

  if (authLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={['#FF8D57', '#EA9B76', '#FFEEE5']}
      locations={[0, 0.09, 0.25]}
      style={styles.container}
    >
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        <View style={{ flex: 1 }}>
          <View style={styles.stickyHeaderArea} pointerEvents="box-none">
            <Animated.View style={animatedSearchContainerStyle}>
              <Animated.View style={animatedSearchInnerStyle}>
                <VendorSearchBar
                  ref={searchInputRef}
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  placeholder={localT('searchRequests')}
                  containerStyle={Platform.OS === 'android' ? { marginHorizontal: 20, height: 48, elevation: 0, shadowOpacity: 0 } : { marginHorizontal: 20, height: 48 }}
                />
              </Animated.View>
            </Animated.View>
          </View>

        {!searchTerm ? (
          <AnimatedFlashList
            data={[{ id: 'landing_sections' }]}
            renderItem={() => (
              <>
                <VendorCategories containerStyle={{ marginBottom: 10, marginTop: 6 }} />
                {/* Registration Button */}
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel={myVendor ? localT('manageMyService') : localT('registerBusinessService')}
                  ref={registerBtnRef}
                  style={[styles.figmaRegisterBtn, { zIndex: 10, marginTop: 6 }]}
                  onPress={() => {
                    if (myVendor) {
                      if (canAccessDashboard) {
                        router.push(`/vendor/${myVendor.id}` as never);
                      } else {
                        Alert.alert(
                          localT('kycRequiredTitle'),
                          localT('kycRequiredMsg'),
                          [
                            { text: localT('cancel'), style: 'cancel' },
                            { text: localT('completeKyc'), onPress: () => router.push({ pathname: '/kyc', params: { returnUrl: '/(tabs)/vendor' } } as never) },
                          ]
                        );
                      }
                    } else {
                      if (!hasVerifiedKyc) {
                        router.push({
                          pathname: '/kyc',
                          params: { returnUrl: '/(tabs)/vendor' },
                        } as never);
                        return;
                      }
                      setShowRegistrationModal(true);
                    }
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <Text style={styles.figmaRegisterBtnText}>
                      {myVendor
                        ? localT('manageMyService')
                        : localT('registerBusinessService')}
                    </Text>
                    {myVendor && hasVerifiedKyc && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 8, backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 }}>
                        <Ionicons name="checkmark-circle" size={14} color="#FFF" />
                        <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '700', marginLeft: 3 }}>{localT('kycComplete')}</Text>
                      </View>
                    )}
                    {myVendor && !hasVerifiedKyc && hasPendingKyc && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 8, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 }}>
                        <Ionicons name="time" size={12} color="#FFF" />
                        <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '600', marginLeft: 3 }}>{localT('kycUnderReview')}</Text>
                      </View>
                    )}
                    {myVendor && !hasVerifiedKyc && !hasPendingKyc && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 8, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 }}>
                        <Ionicons name="lock-closed" size={12} color="#FFF" />
                        <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '600', marginLeft: 3 }}>{localT('kycRequired')}</Text>
                      </View>
                    )}
                  </View>
                  <Ionicons name="arrow-forward" size={20} color="#FFF" />
                </TouchableOpacity>

                {/* KYC Banner and Services Grid Wrapper */}
                <View style={{ width: wrapperWidth, height: 360, backgroundColor: '#FCECD1', alignSelf: 'center', borderRadius: 20, paddingTop: 24, marginTop: -10, paddingBottom: 20 }}>
                  {/* KYC Banner */}
                  <View style={styles.figmaCapsuleContainer}>
                    <View style={styles.figmaKycCapsule}>
                      <Text
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        style={styles.figmaKycCapsuleText}
                      >
                        {localT('allVendorsKyc')}
                      </Text>
                      <Ionicons name="checkmark-circle" size={14} color="#F26522" />
                    </View>
                  </View>

                  {/* Services Grid (3x2) */}
                  <View style={[styles.figmaServicesGrid, { marginTop: 24 }]}>
                    {/* Left Column (Astrologer spans 2 rows) */}
                    <ServiceCard
                      category="Astrologer"
                      title={localT('astrologer')}
                      imageUri="https://brahmandfeed23.b-cdn.net/assets/tab-bar/rashi/vendor/Astrologer.webp"
                      iconUri="https://brahmandfeed23.b-cdn.net/assets/tab-bar/rashi/vendor/siren.webp"
                      width={cardWidth}
                      height={208}
                      isTall
                      onPress={handleCategoryPress}
                    />

                    {/* Right Columns (2x2 grid) */}
                    <View style={{ width: rightColWidth, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                      <ServiceCard
                        category="Electrician"
                        title={localT('electrician')}
                        imageUri="https://brahmandfeed23.b-cdn.net/assets/tab-bar/rashi/vendor/Electrician.webp"
                        iconUri="https://brahmandfeed23.b-cdn.net/assets/tab-bar/rashi/vendor/lightning.webp"
                        width={cardWidth}
                        height={100}
                        onPress={handleCategoryPress}
                      />
                      <ServiceCard
                        category="Panditji"
                        title={localT('panditji')}
                        imageUri="https://brahmandfeed23.b-cdn.net/assets/tab-bar/rashi/vendor/panditji.webp"
                        iconUri="https://brahmandfeed23.b-cdn.net/assets/tab-bar/rashi/vendor/panditji_icon.webp"
                        width={cardWidth}
                        height={100}
                        onPress={handleCategoryPress}
                      />
                      <ServiceCard
                        category="Carpenter"
                        title={localT('carpenter')}
                        imageUri="https://brahmandfeed23.b-cdn.net/assets/tab-bar/rashi/vendor/carpener.webp"
                        iconUri="https://brahmandfeed23.b-cdn.net/assets/tab-bar/rashi/vendor/hammer_custom.webp"
                        width={cardWidth}
                        height={100}
                        onPress={handleCategoryPress}
                      />
                      <ServiceCard
                        category="Plumber"
                        title={localT('plumber')}
                        imageUri="https://brahmandfeed23.b-cdn.net/assets/tab-bar/rashi/vendor/plumber.webp"
                        iconUri="https://brahmandfeed23.b-cdn.net/assets/tab-bar/rashi/vendor/plumber_icon.webp"
                        width={cardWidth}
                        height={100}
                        onPress={handleCategoryPress}
                      />
                    </View>
                  </View>

                  {/* Services Header */}
                  <View style={[styles.figmaCapsuleContainer, { marginTop: 16 }]}>
                    <View style={styles.figmaServicesCapsule}>
                      <Text
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        style={styles.figmaServicesCapsuleText}
                      >
                        {localT('sanataniServicesAround')}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Colorful Background Container for the Business Section */}
                <View style={{ marginTop: -30, paddingBottom: 32, alignItems: 'center' }}>
                  <ExpoImage
                    source={{ uri: 'https://brahmandfeed23.b-cdn.net/assets/tab-bar/rashi/vendor/background.webp' }}
                    style={{ position: 'absolute', width: '100%', height: 364, top: 0, left: 0, right: 0 }}
                    contentFit="cover"
                    cachePolicy="memory-disk"
                  />

                  {/* Business Header */}
                  <View style={[styles.figmaCapsuleContainer, { marginTop: 24, marginBottom: 24 }]}>
                    <View style={styles.figmaBusinessCapsule}>
                      <Text
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        style={styles.figmaBusinessCapsuleText}
                      >
                        {localT('sanataniBusinessAround')}
                      </Text>
                    </View>
                  </View>

                  {/* Business Grid */}
                  <View style={styles.figmaBusinessGrid}>
                    <View style={[styles.figmaBusinessLeftCol, { width: businessLeftColWidth }]}>
                      <BusinessCard
                        category="General Store"
                        title={localT('general store')}
                        imageUri="https://brahmandfeed23.b-cdn.net/assets/tab-bar/rashi/vendor/generalstore.webp"
                        iconUri="https://brahmandfeed23.b-cdn.net/assets/tab-bar/rashi/vendor/general_store.webp"
                        height={92}
                        marginBottom={11}
                        onPress={handleCategoryPress}
                      />
                      <BusinessCard
                        category="Dairy"
                        title={localT('dairy')}
                        imageUri="https://brahmandfeed23.b-cdn.net/assets/tab-bar/rashi/vendor/dairy.webp"
                        iconUri="https://brahmandfeed23.b-cdn.net/assets/tab-bar/rashi/vendor/cow.webp"
                        height={92}
                        onPress={handleCategoryPress}
                      />
                    </View>
                    <View style={[styles.figmaBusinessRightCol, { width: businessRightColWidth }]}>
                      <BusinessCard
                        category="Salon"
                        title={localT('salon')}
                        imageUri="https://brahmandfeed23.b-cdn.net/assets/tab-bar/rashi/vendor/salon.webp"
                        iconUri="https://brahmandfeed23.b-cdn.net/assets/tab-bar/rashi/vendor/salon_icon.webp"
                        height={195}
                        onPress={handleCategoryPress}
                      />
                    </View>
                  </View>
                </View>
              </>
            )}
            keyExtractor={(item) => (item as { id: string }).id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingTop: 64, paddingBottom: 100 }}
            onScroll={animatedScrollHandler}
            scrollEventThrottle={16}
            keyboardShouldPersistTaps="handled"
            onScrollBeginDrag={dismissSearch}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[COLORS.primary]}
                progressViewOffset={64}
              />
            }
          />
        ) : (
          <View style={{ flex: 1 }}>
            {loading && vendors.length === 0 && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
              </View>
            )}

            <AnimatedFlashList
              data={displayVendors}
              renderItem={renderVendorItem}
              keyExtractor={(item) => (item as Vendor).id}
              contentContainerStyle={[styles.listContent, { paddingTop: 64, paddingBottom: 90 }]}
              onScroll={animatedScrollHandler}
              scrollEventThrottle={16}
              keyboardShouldPersistTaps="handled"
              onScrollBeginDrag={dismissSearch}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  colors={[COLORS.primary]}
                  progressViewOffset={64}
                />
              }
              ListEmptyComponent={
                !loading ? (
                  <View style={styles.emptyState}>
                    <Ionicons name="storefront-outline" size={48} color={COLORS.textLight} />
                    <Text style={styles.emptyText}>
                      {searchTerm
                        ? getNoItemsInAreaText(searchTerm)
                        : localT('noServicesFound')}
                    </Text>
                    {!searchTerm && (
                      <Text style={styles.emptySubtext}>
                        {localT('beFirstRegisterSub')}
                      </Text>
                    )}
                  </View>
                ) : null
              }
            />
          </View>
        )}
        </View>
        <VendorRegistrationModal
          visible={showRegistrationModal}
          onClose={() => setShowRegistrationModal(false)}
          onSubmit={handleRegisterVendor}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}

// ============================================================================
// StyleSheet & Default Export
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: SPACING.md,
    paddingBottom: 20,
  },
  vendorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: 12,
  },
  vendorImageContainer: {
    marginRight: SPACING.md,
  },
  vendorImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vendorImagePlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: `${COLORS.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vendorInfo: {
    flex: 1,
  },
  vendorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  vendorVerifiedIcon: {
    marginLeft: 4,
  },
  vendorName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    flexShrink: 1,
  },
  categoriesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  categoryBadge: {
    backgroundColor: `${COLORS.primary}10`,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 4,
    marginBottom: 2,
    flexShrink: 1,
  },
  categoryBadgeText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '500',
  },
  moreCats: {
    fontSize: 11,
    color: COLORS.textLight,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distanceText: {
    fontSize: 12,
    color: COLORS.textLight,
    marginLeft: 4,
  },
  callButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: `${COLORS.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xl * 2,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: SPACING.md,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  stickyHeaderArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: 'transparent',
    paddingTop: 8,
    paddingBottom: 2,
  },
  figmaRegisterBtn: {
    flexDirection: 'row',
    width: Math.min(361, VSCREEN_WIDTH - 32),
    paddingVertical: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    borderRadius: 16,
    backgroundColor: '#F97316',
    shadowColor: '#FED7AA',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 15,
    elevation: 8,
    alignSelf: 'center',
    marginBottom: 0,
  },
  figmaRegisterBtnText: {
    color: '#FFF',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    fontSize: 16,
    fontStyle: 'normal',
    fontWeight: '600',
    lineHeight: 24,
  },
  figmaCapsuleContainer: {
    alignItems: 'center',
  },
  figmaBusinessCapsule: {
    width: 228,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#F26522',
    justifyContent: 'center',
    alignItems: 'center',
  },
  figmaBusinessCapsuleText: {
    color: '#000000',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro' : 'System',
    fontSize: 12,
    fontStyle: 'normal',
    fontWeight: '600',
  },
  figmaServicesCapsule: {
    width: 228,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#F26522',
    justifyContent: 'center',
    alignItems: 'center',
  },
  figmaServicesCapsuleText: {
    color: '#000000',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro' : 'System',
    fontSize: 12,
    fontStyle: 'normal',
    fontWeight: '600',
  },
  figmaKycCapsule: {
    width: 228,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#F26522',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 12,
  },
  figmaKycCapsuleText: {
    color: '#000000',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro' : 'System',
    fontSize: 12,
    fontStyle: 'normal',
    fontWeight: '600',
    marginRight: 6,
  },
  figmaServicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  figmaServiceCard: {
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#F26522',
    overflow: 'hidden',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  cardCoverImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  badgeIcon: {
    width: 12,
    height: 12,
    marginRight: 2,
  },
  figmaServiceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#F26522',
    borderRadius: 9.5,
    minWidth: 89,
    height: 19,
    paddingTop: 3,
    paddingRight: 9,
    paddingBottom: 3,
    paddingLeft: 10,
    gap: 4,
    marginBottom: 8,
  },
  figmaServiceBadgeText: {
    color: '#000000',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro' : 'System',
    fontSize: 11,
    fontStyle: 'normal',
    fontWeight: '700',
  },
  figmaBusinessGrid: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 16,
  },
  figmaBusinessLeftCol: {
    width: Platform.OS === 'android' ? undefined : 228,
    justifyContent: 'space-between',
  },
  figmaBusinessRightCol: {
    width: Platform.OS === 'android' ? undefined : 107,
  },
  figmaBusinessCard: {
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#F26522',
    overflow: 'hidden',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
});
