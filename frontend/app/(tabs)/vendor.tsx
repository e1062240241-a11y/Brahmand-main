import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Pressable,
  TouchableOpacity, 
  RefreshControl,
  FlatList,
  TextInput,
  Linking,
  Alert,
  ActivityIndicator,
  Image,
  Platform,
  Animated,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS } from '../../src/constants/theme';
import formatDistance from '../../src/utils/formatDistance';
import { useScrollToHideTabBar } from '../../src/utils/scroll';
import { VendorRegistrationModal } from '../../src/components/VendorRegistrationModal';
import { JobProfileModal } from '../../src/components/JobProfileModal';
import VendorCategories from '../../src/components/VendorCategories';
import { useTranslation } from '../../src/utils/i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCoachMarkStore } from '../../src/utils/coachMarkState';
import { useIsFocused } from '@react-navigation/native';
import Svg, { Path } from 'react-native-svg';

import { useAuthStore } from '../../src/store/authStore';
import { useVendorStore, Vendor, DEFAULT_CATEGORIES } from '../../src/store/vendorStore';
import { ensureForegroundPermission, getCurrentPosition } from '../../src/services/location';
import { createOrUpdateJobProfile, getJobProfiles, getMyJobProfile, getKYCStatus, uploadJobProfileFile } from '../../src/services/api';
import * as Location from 'expo-location';

const VSCREEN_WIDTH = Dimensions.get('window').width;
const VSCREEN_HEIGHT = Dimensions.get('window').height;

// Responsive variables for Android to prevent horizontal scroll/layout cuts
const wrapperWidth = Platform.OS === 'android' ? VSCREEN_WIDTH - 24 : 394;
const gridPadding = 16;
const gap = 8;
const cardWidth = Platform.OS === 'android' ? (wrapperWidth - (gridPadding * 2) - (gap * 2) - 4) / 3 : 110;
const rightColWidth = Platform.OS === 'android' ? cardWidth * 2 + gap : 228;

const businessGridWidth = Platform.OS === 'android' ? VSCREEN_WIDTH - 32 : 347;
const businessRightColWidth = Platform.OS === 'android' ? (businessGridWidth - 12) / 3.13 : 107;
const businessLeftColWidth = Platform.OS === 'android' ? businessRightColWidth * 2.13 : 228;

const TABS = ['Nearby'];
const MAIN_SECTIONS = ['Services', 'Jobs'];
const TOP_SKILL_SUGGESTIONS = ['Carpenter', 'Housemaid', 'Plumber', 'Electrician', 'Cook', 'Teacher', 'Painter', 'Beautician'];

interface JobProfile {
  id: string;
  owner_id: string;
  name: string;
  current_address: string;
  experience_years: number;
  profession: string;
  preferred_work_city: string;
  latitude?: number;
  longitude?: number;
  location_link?: string;
  photos?: string[];
  cv_url?: string;
  distance?: number;
}

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
    createJobProfile: 'Create Job Profile',
    updateJobProfile: 'Update Job Profile',
    noJobsFound: 'No jobs found',
    noServicesFound: 'No services found',
    createJobProfileSub: 'Create a job profile to appear here.',
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
    createJobProfile: 'नौकरी प्रोफ़ाइल बनाएं',
    updateJobProfile: 'नौकरी प्रोफ़ाइल अपडेट करें',
    noJobsFound: 'कोई नौकरी नहीं मिली',
    noServicesFound: 'कोई सेवाएं नहीं मिलीं',
    createJobProfileSub: 'यहाँ दिखने के लिए एक नौकरी प्रोफ़ाइल बनाएं।',
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
  }
};

export default function VendorScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, language } = useTranslation();
  const onVendorScrollTabBar = useScrollToHideTabBar();
  const currentLang = (language === 'hi' || language === 'en') ? language : 'en';

  const localT = (key: keyof typeof LOCAL_TRANSLATIONS.en): any => {
    return (LOCAL_TRANSLATIONS[currentLang] as any)[key] || (LOCAL_TRANSLATIONS.en as any)[key] || key;
  };

  const getNoItemsInAreaText = (term: string) => {
    if (currentLang === 'hi') {
      return `आपके क्षेत्र में कोई '${term}' नहीं है।`;
    }
    return `No '${term}' in your area.`;
  };

  const { user, isLoading: authLoading, isAuthenticated, updateUser } = useAuthStore();
  const userId = user?.id;
  const [kycStatus, setKycStatus] = useState<string | null>((user as any)?.kyc_status || null);
  const currentKycStatus = kycStatus || (user as any)?.kyc_status || null;
  const isKycVerified = currentKycStatus === 'verified';
  const isKycPending = currentKycStatus === 'pending' || currentKycStatus === 'manual_review';
  const { 
    vendors, 
    myVendor, 
    categories,
    loading,
    fetchVendors, 
    fetchMyVendor,
    fetchCategories,
    createVendor,
    uploadBusinessImage
  } = useVendorStore();
  const hasVerifiedKyc = isKycVerified || myVendor?.kyc_status === 'verified';
  const hasPendingKyc = isKycPending || myVendor?.kyc_status === 'pending' || myVendor?.kyc_status === 'manual_review';
  const canAccessDashboard = hasVerifiedKyc || hasPendingKyc;
  
  const [activeTab, setActiveTab] = useState('Nearby');
  const [activeSection, setActiveSection] = useState('Services');
  const [refreshing, setRefreshing] = useState(false);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [showJobProfileModal, setShowJobProfileModal] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [filteredCategories, setFilteredCategories] = useState<string[]>([]);
  const [searchCategory, setSearchCategory] = useState<string>('All');
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);
  const [showExpandedCategories, setShowExpandedCategories] = useState(false);
  const [searchPlaceholderIndex, setSearchPlaceholderIndex] = useState(0);
  const [typedSkillPlaceholder, setTypedSkillPlaceholder] = useState('');
  const [isPlaceholderPaused, setIsPlaceholderPaused] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [jobProfiles, setJobProfiles] = useState<JobProfile[]>([]);
  const [myJobProfile, setMyJobProfile] = useState<JobProfile | null>(null);
  const [jobsLoading, setJobsLoading] = useState(false);

  const searchAnim = useRef(new Animated.Value(0)).current;

  // Coach marks
  const { coachMarkStep, setCoachMarkStep, showCoachMarks, setShowCoachMarks, seenFlags, loadFlags, setFlagSeen } = useCoachMarkStore();
  const [searchBarLayout, setSearchBarLayout] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [registerBtnLayout, setRegisterBtnLayout] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  const isFocused = useIsFocused();

  useEffect(() => {
    if (!isFocused) return;
    const checkVendorCoach = async () => {
      const userId = user?.id;
      await loadFlags(userId);
      const latestFlags = useCoachMarkStore.getState().seenFlags;
      
      if (!latestFlags.vendorCoachSeen) {
        const latestState = useCoachMarkStore.getState();
        if (!latestState.showCoachMarks || (latestState.coachMarkStep !== 7 && latestState.coachMarkStep !== 8)) {
          setShowCoachMarks(true);
          setCoachMarkStep(7);
        }
      } else {
        const latestState = useCoachMarkStore.getState();
        if (latestState.showCoachMarks && (latestState.coachMarkStep === 7 || latestState.coachMarkStep === 8)) {
          setShowCoachMarks(false);
          setCoachMarkStep(1);
        }
      }
    };
    checkVendorCoach();
  }, [isFocused, user?.id]);

  const loadKycStatus = useCallback(async (): Promise<string | null> => {
    try {
      const response = await getKYCStatus();
      const serverStatus = response?.data?.kyc_status || null;
      setKycStatus(serverStatus);
      updateUser({
        kyc_status: serverStatus,
        is_verified: Boolean(response?.data?.is_verified) || serverStatus === 'verified',
      } as any);
      return serverStatus;
    } catch (error) {
      console.warn('Failed to refresh KYC status:', error);
      return null;
    }
  }, [updateUser]);

  const ensureKycVerifiedForCv = useCallback(async () => {
    const latestStatus = await loadKycStatus();
    const isVerified =
      latestStatus === 'verified' ||
      (user as any)?.kyc_status === 'verified' ||
      myVendor?.kyc_status === 'verified';

    if (isVerified) {
      return true;
    }

    router.push('/kyc');
    return false;
  }, [loadKycStatus, user, myVendor?.kyc_status, router]);
  const filterAnim = useRef(new Animated.Value(0)).current;
  const searchInputRef = useRef<TextInput | null>(null);
  const registerBtnRef = useRef<any>(null);
  const homeLocation = (user as any)?.home_location;
  const homeLatitude = homeLocation?.latitude;
  const homeLongitude = homeLocation?.longitude;
  const hasHomeCoordinates = typeof homeLatitude === 'number' && typeof homeLongitude === 'number';

  const jobProfessionFilters = React.useMemo(() => {
    const professions = [...new Set((jobProfiles || []).map((profile) => (profile.profession || '').trim()).filter(Boolean))];
    return professions.sort();
  }, [jobProfiles]);

  const loadData = useCallback(async () => {
    // Get user location
    try {
      if (Platform.OS === 'web') {
        const hasPermission = await ensureForegroundPermission();
        if (hasPermission) {
          const location = await getCurrentPosition();
          setUserLocation({
            lat: location.coords.latitude,
            lng: location.coords.longitude
          });
          await fetchVendors({
            lat: location.coords.latitude,
            lng: location.coords.longitude
          });
        } else if (hasHomeCoordinates) {
          setUserLocation({
            lat: homeLatitude!,
            lng: homeLongitude!,
          });
          await fetchVendors({
            lat: homeLatitude!,
            lng: homeLongitude!,
          });
        } else {
          await fetchVendors();
        }
      } else {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          // Robust location retrieval with timeout to avoid permanent hangs on devices/emulators
          const location = await Promise.race([
            (async () => {
              try {
                const lastKnown = await Location.getLastKnownPositionAsync({});
                if (lastKnown) return lastKnown;
              } catch (e) {}
              return await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
              });
            })(),
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error('Location timeout')), 4000)
            )
          ]) as any;

          setUserLocation({
            lat: location.coords.latitude,
            lng: location.coords.longitude
          });
          await fetchVendors({
            lat: location.coords.latitude,
            lng: location.coords.longitude
          });
        } else {
          await fetchVendors();
        }
      }
    } catch (error) {
      if (Platform.OS === 'web' && hasHomeCoordinates) {
        setUserLocation({
          lat: homeLatitude!,
          lng: homeLongitude!,
        });
        await fetchVendors({
          lat: homeLatitude!,
          lng: homeLongitude!,
        });
      } else {
        await fetchVendors();
      }
    }
    
    await fetchMyVendor();
    await fetchCategories();
  }, [fetchVendors, fetchMyVendor, fetchCategories, hasHomeCoordinates, homeLatitude, homeLongitude]);

  const loadJobsData = useCallback(async () => {
    setJobsLoading((prev) => jobProfiles.length === 0 ? true : prev);
    try {
      const [profilesRes, myProfileRes] = await Promise.all([
        getJobProfiles({
          search: searchTerm || undefined,
          profession: searchCategory !== 'All' ? searchCategory : undefined,
          lat: userLocation?.lat,
          lng: userLocation?.lng,
          limit: 50,
        }),
        getMyJobProfile(),
      ]);

      setJobProfiles((profilesRes?.data || []) as JobProfile[]);
      setMyJobProfile((myProfileRes?.data || null) as JobProfile | null);
    } catch (error: any) {
      console.warn('Error loading jobs:', error?.message || error);
      setJobProfiles([]);
      setMyJobProfile(null);
    } finally {
      setJobsLoading(false);
    }
  }, [searchTerm, searchCategory, userLocation?.lat, userLocation?.lng]);

  useEffect(() => {
    // Redirect to auth if not authenticated after auth is loaded
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

    // Background sync: poll to refresh vendor data and update WatermelonDB every 30 seconds
    const interval = setInterval(() => {
      console.log('[Background Sync] Refreshing vendors list and syncing with WatermelonDB...');
      loadData().catch((err) => console.warn('[Background Sync] Failed to refresh vendors:', err));
    }, 30000);

    return () => clearInterval(interval);
  }, [userId, loadData]);

  useEffect(() => {
    if (!userId) return;
    // Always load KYC status so the Manage My Service button can enforce KYC
    loadKycStatus();
    if (activeSection === 'Jobs') {
      loadJobsData();
    }
  }, [activeSection, userId, loadJobsData, loadKycStatus]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = categories.filter(cat => 
        cat.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCategories(filtered);
    } else {
      setFilteredCategories([]);
    }
  }, [searchTerm, categories]);

  const searchSuggestions = React.useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return [] as { label: string; type: 'vendor' | 'category' | 'job' | 'profession' }[];

    const seen = new Set<string>();
    const suggestions: { label: string; type: 'vendor' | 'category' | 'job' | 'profession' }[] = [];

    if (activeSection === 'Jobs') {
      (jobProfiles || []).forEach((job) => {
        const name = (job.name || '').trim();
        if (name && name.toLowerCase().includes(term)) {
          const key = `job:${name.toLowerCase()}`;
          if (!seen.has(key)) {
            seen.add(key);
            suggestions.push({ label: name, type: 'job' });
          }
        }

        const role = (job.profession || '').trim();
        if (role && role.toLowerCase().includes(term)) {
          const key = `profession:${role.toLowerCase()}`;
          if (!seen.has(key)) {
            seen.add(key);
            suggestions.push({ label: role, type: 'profession' });
          }
        }
      });

      return suggestions.slice(0, 10);
    }

    (vendors || []).forEach((vendor) => {
      const name = (vendor.business_name || '').trim();
      if (!name || !name.toLowerCase().includes(term)) return;
      const key = `vendor:${name.toLowerCase()}`;
      if (seen.has(key)) return;
      seen.add(key);
      suggestions.push({ label: name, type: 'vendor' });
    });

    filteredCategories.forEach((category) => {
      const key = `category:${category.toLowerCase()}`;
      if (seen.has(key)) return;
      seen.add(key);
      suggestions.push({ label: category, type: 'category' });
    });

    return suggestions.slice(0, 10);
  }, [activeSection, searchTerm, vendors, filteredCategories, jobProfiles]);

  useEffect(() => {
    let typeTimeout: ReturnType<typeof setTimeout> | null = null;
    let switchTimeout: ReturnType<typeof setTimeout> | null = null;
    const currentSuggestion = TOP_SKILL_SUGGESTIONS[searchPlaceholderIndex];

    if (showSearch && !searchTerm && isPlaceholderPaused) {
      setTypedSkillPlaceholder(currentSuggestion);
    } else if (showSearch && !searchTerm) {
      let index = 0;

      const typeNext = () => {
        if (index <= currentSuggestion.length) {
          setTypedSkillPlaceholder(currentSuggestion.slice(0, index));
          index += 1;
          typeTimeout = setTimeout(typeNext, 80);
        } else {
          switchTimeout = setTimeout(() => {
            setSearchPlaceholderIndex((prev) => (prev + 1) % TOP_SKILL_SUGGESTIONS.length);
          }, 1000);
        }
      };

      typeNext();
    } else {
      setTypedSkillPlaceholder('');
    }

    return () => {
      if (typeTimeout) {
        clearTimeout(typeTimeout);
      }
      if (switchTimeout) {
        clearTimeout(switchTimeout);
      }
    };
  }, [showSearch, searchTerm, searchPlaceholderIndex, isPlaceholderPaused]);

  useEffect(() => {
    Animated.timing(searchAnim, {
      toValue: showSearch ? 1 : 0,
      duration: 375,
      useNativeDriver: false,
    }).start();
  }, [showSearch, searchAnim]);

  useEffect(() => {
    Animated.timing(filterAnim, {
      toValue: showCategoryFilter ? 1 : 0,
      duration: 375,
      useNativeDriver: false,
    }).start();
  }, [showCategoryFilter, filterAnim]);

  const displayVendors = React.useMemo(() => {
    let filtered = vendors || [];
    const effectiveCategory = searchCategory !== 'All' ? searchCategory : activeTab;

    if (effectiveCategory && effectiveCategory !== 'Nearby') {
      const lowerCategory = effectiveCategory.toLowerCase();
      filtered = filtered.filter((v) => {
        const categories = v.categories || [];
        return categories.some((c) => (c || '').toLowerCase().includes(lowerCategory));
      });
    }

    if (searchTerm && searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((v) => {
        const name = (v.business_name || '').toLowerCase();
        return name.includes(term);
      });
    }

    // Show only vendors within a strict 8km radius as requested by the user
    filtered = filtered.filter((v) => typeof v.distance === 'number' && v.distance <= 8);

    return filtered.sort((a, b) => (a.distance || 9999) - (b.distance || 9999));
  }, [vendors, activeTab, searchTerm, searchCategory]);

  const displayJobProfiles = React.useMemo(() => {
    let filtered = [...(jobProfiles || [])];

    if (searchCategory !== 'All') {
      const target = searchCategory.toLowerCase();
      filtered = filtered.filter((profile) => (profile.profession || '').toLowerCase().includes(target));
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((profile) => {
        const name = (profile.name || '').toLowerCase();
        const profession = (profile.profession || '').toLowerCase();
        const city = (profile.preferred_work_city || '').toLowerCase();
        return name.includes(term) || profession.includes(term) || city.includes(term);
      });
    }

    return filtered.sort((a, b) => (a.distance || 9999) - (b.distance || 9999));
  }, [jobProfiles, searchCategory, searchTerm]);

  const handleRefresh = async () => {
    setRefreshing(true);
    if (activeSection === 'Jobs') {
      await loadKycStatus();
      await loadJobsData();
    } else {
      await loadData();
    }
    setRefreshing(false);
  };

  const handleCreateJobProfile = async (data: {
    name: string;
    currentAddress: string;
    experienceYears: number;
    profession: string;
    preferredWorkCity: string;
    latitude?: number;
    longitude?: number;
    locationLink?: string;
    photoFile?: { uri: string; name: string; type: string };
    cvFile?: { uri: string; name: string; type: string };
  }) => {
    try {
      const profileRes = await createOrUpdateJobProfile({
        name: data.name,
        current_address: data.currentAddress,
        experience_years: data.experienceYears,
        profession: data.profession,
        preferred_work_city: data.preferredWorkCity,
        latitude: data.latitude,
        longitude: data.longitude,
        location_link: data.locationLink,
        photos: [],
        cv_url: undefined,
      });

      const profileId = profileRes?.data?.id;
      if (!profileId) {
        throw new Error('Could not create job profile.');
      }

      const uploadedPhotos: string[] = [];
      if (data.photoFile) {
        const uploadRes = await uploadJobProfileFile(profileId, 'photo', data.photoFile);
        const photos = uploadRes?.data?.photos || [];
        if (Array.isArray(photos)) {
          uploadedPhotos.splice(0, uploadedPhotos.length, ...photos);
        }
      }

      let uploadedCvUrl: string | undefined;
      if (data.cvFile) {
        const cvRes = await uploadJobProfileFile(profileId, 'cv', data.cvFile);
        uploadedCvUrl = cvRes?.data?.cv_url || cvRes?.data?.url;
      }

      await createOrUpdateJobProfile({
        name: data.name,
        current_address: data.currentAddress,
        experience_years: data.experienceYears,
        profession: data.profession,
        preferred_work_city: data.preferredWorkCity,
        latitude: data.latitude,
        longitude: data.longitude,
        location_link: data.locationLink,
        photos: uploadedPhotos,
        cv_url: uploadedCvUrl,
      });

      Alert.alert('Success', 'Job profile saved successfully.');
      await loadJobsData();
    } catch (error: any) {
      const detail = error?.response?.data?.detail;
      const detailMessage = typeof detail === 'string'
        ? detail
        : detail?.message || (detail ? JSON.stringify(detail) : '');
      throw new Error(detailMessage || error?.message || 'Failed to save job profile.');
    }
  };

  const handleSkillPlaceholderPress = () => {
    const selectedSkill = TOP_SKILL_SUGGESTIONS[searchPlaceholderIndex];
    setSearchTerm(selectedSkill);
    setIsPlaceholderPaused(false);
  };

  const handleRegisterVendor = async (data: any) => {
    try {
      const newVendor = await createVendor({
        businessName: data.businessName,
        ownerName: data.ownerName,
        yearsInBusiness: data.yearsInBusiness || 0,
        categories: data.categories || [],
        address: data.address,
        locationLink: data.locationLink || undefined,
        phoneNumber: data.phoneNumber,
        latitude: data.latitude || userLocation?.lat || undefined,
        longitude: data.longitude || userLocation?.lng || undefined,
      });
      
      console.log('Vendor registration response:', JSON.stringify(newVendor, null, 2));

      // Upload selected photos if present!
      if (data.photos && data.photos.length > 0) {
        for (let i = 0; i < data.photos.length; i++) {
          const photo = data.photos[i];
          try {
            await uploadBusinessImage(newVendor.id, i, photo);
          } catch (uploadErr) {
            console.warn(`Failed to upload photo at slot ${i}:`, uploadErr);
          }
        }
      }
      
      // Close modal immediately
      setShowRegistrationModal(false);
      
      // Refresh vendor data in background
      Promise.all([
        fetchMyVendor(),
        userLocation ? fetchVendors(userLocation) : fetchVendors()
      ]).catch(err => console.warn('Background fetch error:', err));
      
      // Navigate to Number & KYC verification
      router.push('/kyc');
    } catch (error: any) {
      console.error('Vendor API Registration Error:', error.response?.data);
      throw error;
    }
  };

  const handleDeleteVendor = () => {
    if (!myVendor?.id) return;

    const performDelete = async () => {
      try {
        const store = useVendorStore.getState();
        await store.deleteVendor(myVendor.id);
        if (Platform.OS === 'web') {
          window.alert(localT('deletedMsg'));
        } else {
          Alert.alert(localT('deletedTitle'), localT('deletedMsg'));
        }
        await loadData();
      } catch (error: any) {
        if (Platform.OS === 'web') {
          window.alert(error?.message || localT('failedDelete'));
        } else {
          Alert.alert(localT('error'), error?.message || localT('failedDelete'));
        }
      }
    };

    if (Platform.OS === 'web') {
      const confirm = window.confirm(localT('deleteConfirm'));
      if (confirm) {
        performDelete();
      }
    } else {
      Alert.alert(
        localT('deleteTitle'),
        localT('deleteConfirm'),
        [
          { text: localT('cancel'), style: 'cancel' },
          {
            text: localT('deletePermanently'),
            style: 'destructive',
            onPress: performDelete
          }
        ]
      );
    }
  };


  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  // ─── Vendor Coach Marks Renderer ────────────────────────────────────────────
  const renderVendorCoachMarks = () => {
    const isStep7 = coachMarkStep === 7;
    const targetLayout = isStep7 ? searchBarLayout : registerBtnLayout;

    if (!targetLayout) return null;

    const { x: tX, y: tY, width: tW, height: tH } = targetLayout;
    const cardWidth = 320;
    const cardLeft = (VSCREEN_WIDTH - cardWidth) / 2;
    const cardTop = tY + tH + 14;
    const arrowX = tX + tW / 2 - cardLeft;

    const handleVendorSkip = async () => {
      setCoachMarkStep(1);
      setShowCoachMarks(false);
      try {
        const userId = user?.id;
        await setFlagSeen(userId, 'vendorCoachSeen');
      } catch (e) {}
    };

    const handleVendorNext = async () => {
      if (coachMarkStep === 7) {
        setCoachMarkStep(8);
      } else {
        // Step 8 — done
        setCoachMarkStep(1);
        setShowCoachMarks(false);
        try {
          const userId = user?.id;
          await setFlagSeen(userId, 'vendorCoachSeen');
        } catch (e) {}
      }
    };

    const stepData = [
      {
        title: 'Find Services Near You',
        desc: 'Search for local Sanatani professionals — from astrologers and pandits to electricians and carpenters.',
        callout: 'Type any skill or profession to instantly discover verified vendors in your area.',
      },
      {
        title: 'Register Your Business',
        desc: 'Are you a local business or professional? Register here to connect with your community and grow.',
        callout: 'Complete KYC verification to unlock full visibility and attract more customers.',
      },
    ];

    const current = stepData[coachMarkStep - 7];
    const dotCount = 2;
    const activeDot = coachMarkStep - 7; // 0 or 1

    return (
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99999 }} pointerEvents="box-none">
        {/* Dark overlays around target */}
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: tY - 4, backgroundColor: 'rgba(0,0,0,0.72)' }} />
        <View style={{ position: 'absolute', top: tY - 4, left: 0, width: tX - 4, height: tH + 8, backgroundColor: 'rgba(0,0,0,0.72)' }} />
        <View style={{ position: 'absolute', top: tY - 4, left: tX + tW + 4, right: 0, height: tH + 8, backgroundColor: 'rgba(0,0,0,0.72)' }} />
        <View style={{ position: 'absolute', top: tY + tH + 4, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.72)' }} />

        {/* Coach card */}
        <View
          style={[
            vendorCoachStyles.card,
            { top: cardTop, left: cardLeft, width: cardWidth },
          ]}
          pointerEvents="box-none"
        >
          {/* Arrow pointing up to the target */}
          <View style={{
            position: 'absolute', top: -8, left: arrowX,
            width: 0, height: 0,
            borderLeftWidth: 8, borderRightWidth: 8, borderBottomWidth: 8,
            borderLeftColor: 'transparent', borderRightColor: 'transparent',
            borderBottomColor: '#FCF3EE',
          }} />

          {/* Skip */}
          <TouchableOpacity style={vendorCoachStyles.skip} onPress={handleVendorSkip}>
            <Text style={vendorCoachStyles.skipText}>Skip</Text>
          </TouchableOpacity>

          {/* Icon + title */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 }}>
            <View style={vendorCoachStyles.iconWrap}>
              <Ionicons name={isStep7 ? 'search' : 'storefront'} size={22} color="#FF701F" />
            </View>
            <Text style={vendorCoachStyles.title}>{current.title}</Text>
          </View>

          {/* Desc */}
          <Text style={vendorCoachStyles.desc}>{current.desc}</Text>

          {/* Callout */}
          <View style={vendorCoachStyles.callout}>
            <Ionicons name="information-circle" size={14} color="#FF701F" style={{ marginRight: 8 }} />
            <View style={{ flex: 1 }}>
              <Text style={vendorCoachStyles.calloutText}>{current.callout}</Text>
            </View>
          </View>

          {/* Footer */}
          <View style={vendorCoachStyles.footer}>
            {/* Dots */}
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {Array.from({ length: dotCount }).map((_, i) => (
                <View
                  key={i}
                  style={[
                    vendorCoachStyles.dot,
                    i === activeDot && vendorCoachStyles.dotActive,
                  ]}
                />
              ))}
            </View>

            {/* Next / Done button */}
            <TouchableOpacity style={vendorCoachStyles.nextBtn} onPress={handleVendorNext} activeOpacity={0.85}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Text style={vendorCoachStyles.nextText}>{coachMarkStep === 8 ? 'Done' : 'Next'}</Text>
                {coachMarkStep !== 8 && (
                  <Svg width={7.4} height={12} viewBox="0 0 8 12">
                    <Path d="M4.6 6L0 1.4L1.4 0L7.4 6L1.4 12L0 10.6L4.6 6Z" fill="white" />
                  </Svg>
                )}
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };
  // ────────────────────────────────────────────────────────────────────────────


  const getVendorIcon = (vendorCategories?: string[]) => {
    const cats = vendorCategories || [];
    const category = cats[0]?.toLowerCase() || '';
    if (category.includes('pooja') || category.includes('pandit')) return 'flower';
    if (category.includes('grocery') || category.includes('sweets')) return 'basket';
    if (category.includes('restaurant') || category.includes('catering')) return 'restaurant';
    if (category.includes('gym') || category.includes('yoga')) return 'fitness';
    if (category.includes('salon')) return 'cut';
    return 'storefront';
  };

  const renderVendor = ({ item }: { item: Vendor }) => {
    const vendorCategories = item?.categories || [];
    const isApprovedVendor =
      (item.kyc_status === 'verified' ||
       item.kyc_status === 'approved' ||
       item.is_verified ||
       (item as any).review_status === 'approved' ||
       (item as any).review_status === 'verified') &&
      item.kyc_status !== 'rejected' &&
      (item as any).review_status !== 'rejected';
    
    return (
      <Pressable 
        style={({ pressed }) => [
          styles.vendorCard,
          Platform.OS === 'ios' && pressed && { opacity: 0.7 }
        ]}
        android_ripple={{ color: 'rgba(0, 0, 0, 0.1)' }}
        onPress={() => router.push(`/vendor/${item.id}`)}
      >
        {/* Business Image Placeholder */}
        <View style={styles.vendorImageContainer}>
          {(item.business_gallery_images && item.business_gallery_images.find((url) => !!url)) || (item.photos && item.photos.length > 0) ? (
            <Image
              source={{ uri: (item.business_gallery_images || []).find((url) => !!url) || item.photos[0] }}
              style={styles.vendorImage}
            />
          ) : (
            <View style={styles.vendorImagePlaceholder}>
              <Ionicons name={getVendorIcon(vendorCategories) as any} size={28} color={COLORS.primary} />
            </View>
          )}
        </View>

        <View style={styles.vendorInfo}>
          <View style={styles.vendorNameRow}>
            <Text style={styles.vendorName} numberOfLines={1}>{item.business_name || 'Unnamed Business'}</Text>
            {isApprovedVendor && (
              <Ionicons name="checkmark-circle" size={16} color="#1DA1F2" style={styles.vendorVerifiedIcon} />
            )}
          </View>
          
          {/* Categories */}
          {vendorCategories.length > 0 && (
            <View style={styles.categoriesRow}>
              {vendorCategories.slice(0, 2).map((cat, idx) => (
                <View key={idx} style={styles.categoryBadge}>
                  <Text style={styles.categoryBadgeText} numberOfLines={1}>{localT(cat.toLowerCase() as any) || cat}</Text>
                </View>
              ))}
              {vendorCategories.length > 2 && (
                <Text style={styles.moreCats}>+{vendorCategories.length - 2}</Text>
              )}
            </View>
          )}
          
          {/* Distance */}
          <View style={styles.distanceRow}>
            <Ionicons name="location" size={12} color={COLORS.textLight} />
            <Text style={styles.distanceText}>{formatDistance(item.distance)}</Text>
          </View>
        </View>

        {/* Call Button */}
        <Pressable 
          style={({ pressed }) => [
            styles.callButton,
            Platform.OS === 'ios' && pressed && { opacity: 0.7 }
          ]}
          android_ripple={{ color: 'rgba(0, 0, 0, 0.05)', borderless: true }}
          onPress={() => handleCall(item.phone_number)}
        >
          <Ionicons name="call" size={20} color={COLORS.primary} />
        </Pressable>
      </Pressable>
    );
  };

  const renderJobProfile = ({ item }: { item: JobProfile }) => {
    const firstPhoto = (item.photos || []).find((url) => !!url);
    const cvIconName = isKycVerified ? 'document-text' : 'lock-closed';
    const cvIconColor = isKycVerified ? COLORS.primary : COLORS.textLight;

    return (
      <Pressable
        style={({ pressed }) => [
          styles.vendorCard,
          Platform.OS === 'ios' && pressed && { opacity: 0.7 }
        ]}
        android_ripple={{ color: 'rgba(0, 0, 0, 0.1)' }}
        onPress={() => {
          setSearchTerm('');
          router.push(`/jobs/${item.id}`);
        }}
      >
        <View style={styles.vendorImageContainer}>
          {firstPhoto ? (
            <Image source={{ uri: firstPhoto }} style={styles.vendorImage} />
          ) : (
            <View style={styles.vendorImagePlaceholder}>
              <Ionicons name="briefcase" size={28} color={COLORS.primary} />
            </View>
          )}
        </View>

        <View style={styles.vendorInfo}>
          <View style={styles.vendorNameRow}>
            <Text style={styles.vendorName}>{item.name || 'Unnamed Profile'}</Text>
            {myJobProfile?.id === item.id && (
              <Ionicons name="person-circle" size={16} color={COLORS.info} style={styles.vendorVerifiedIcon} />
            )}
          </View>

          <View style={styles.categoriesRow}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>
                {localT(item.profession?.toLowerCase() as any) || item.profession || localT('profession')}
              </Text>
            </View>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>{item.experience_years || 0} {localT('years')}</Text>
            </View>
          </View>

          <View style={styles.distanceRow}>
            <Ionicons name="location" size={12} color={COLORS.textLight} />
            <Text style={styles.distanceText}>{item.preferred_work_city || localT('preferredCityNotSet')}</Text>
          </View>
        </View>

        {item.cv_url ? (
          <Pressable
            style={({ pressed }) => [
              styles.callButton,
              Platform.OS === 'ios' && pressed && { opacity: 0.7 }
            ]}
            android_ripple={{ color: 'rgba(0, 0, 0, 0.05)', borderless: true }}
            onPress={async () => {
              const canViewCv = await ensureKycVerifiedForCv();
              if (!canViewCv) {
                return;
              }

              try {
                const url = typeof item.cv_url === 'string' ? item.cv_url : '';
                if (!url) {
                  Alert.alert(localT('unavailable'), localT('cvNotAvailable'));
                  return;
                }
                const canOpen = await Linking.canOpenURL(url);
                if (!canOpen) {
                  Alert.alert(localT('unavailable'), localT('cvOpenError'));
                  return;
                }
                await Linking.openURL(url);
              } catch {
                Alert.alert(localT('unavailable'), localT('cvOpenError'));
              }
            }}
          >
            <Ionicons name={cvIconName} size={18} color={cvIconColor} />
          </Pressable>
        ) : null}
      </Pressable>
    );
  };

  // Show loading while checking auth
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
      {/* Top Search Bar (Figma Design) */}
      <View
        style={[styles.figmaSearchContainer, { marginTop: insets.top > 0 ? insets.top + 16 : 28 }]}
        onLayout={(e) => {
          const { x, y, width, height } = e.nativeEvent.layout;
          setSearchBarLayout({ x, y: y + (insets.top > 0 ? insets.top + 16 : 28), width, height });
        }}
      >
        <Ionicons name="search" size={20} color="#9CA3AF" style={{ marginRight: 8 }} />
        <TextInput
          ref={searchInputRef}
          style={styles.figmaSearchInput}
          placeholder="Search requests..."
          placeholderTextColor="#9CA3AF"
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
        {!!searchTerm && (
          <TouchableOpacity onPress={() => setSearchTerm('')}>
            <Ionicons name="close-circle" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      {!searchTerm ? (
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          onScroll={onVendorScrollTabBar}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[COLORS.primary]} />
          }
        >
          {/* Categories Row */}
          <VendorCategories />

          {/* Registration Button */}
          <TouchableOpacity 
            ref={registerBtnRef}
            style={[styles.figmaRegisterBtn, { zIndex: 10 }]}
            onLayout={(e) => {
              registerBtnRef.current?.measure((_x: number, _y: number, width: number, height: number, pageX: number, pageY: number) => {
                setRegisterBtnLayout({ x: pageX, y: pageY, width, height });
              });
            }}
            onPress={() => {
              if (myVendor) {
                if (canAccessDashboard) {
                  router.push('/vendor/dashboard');
                } else {
                  Alert.alert(
                    'KYC Required',
                    'Please complete your KYC verification to manage your business/service.',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Complete KYC', onPress: () => router.push('/kyc') }
                    ]
                  );
                }
              } else {
                setShowRegistrationModal(true);
              }
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <Text style={styles.figmaRegisterBtnText}>
                {myVendor 
                  ? 'Manage My Service'
                  : 'Register Your Business/Service'}
              </Text>
              {myVendor && hasVerifiedKyc && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 8, backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 }}>
                  <Ionicons name="checkmark-circle" size={14} color="#FFF" />
                  <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '700', marginLeft: 3 }}>KYC Complete</Text>
                </View>
              )}
              {myVendor && !hasVerifiedKyc && hasPendingKyc && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 8, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 }}>
                  <Ionicons name="time" size={12} color="#FFF" />
                  <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '600', marginLeft: 3 }}>KYC Under Review</Text>
                </View>
              )}
              {myVendor && !hasVerifiedKyc && !hasPendingKyc && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 8, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 }}>
                  <Ionicons name="lock-closed" size={12} color="#FFF" />
                  <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '600', marginLeft: 3 }}>KYC Required</Text>
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
                  All vendors are KYC verified.
                </Text>
                <Ionicons name="checkmark-circle" size={14} color="#F26522" />
              </View>
            </View>

            {/* Services Grid (3x2) */}
            <View style={[styles.figmaServicesGrid, { marginTop: 24 }]}>
              {/* Left Column (Astrologer spans 2 rows) */}
              <TouchableOpacity 
                style={[styles.figmaServiceCard, { width: cardWidth, height: 208, alignItems: 'flex-start', paddingBottom: 8, paddingLeft: 8 }]} 
                onPress={() => router.push('/vendor/category/Astrologer' as any)}
              >
                {/* Manual crop offset for landscape Astrologer image */}
                <Image 
                  source={require('../../assets/images/tab-bar/rashi/vendor/Astrologer.jpg')} 
                  style={{ position: 'absolute', width: cardWidth * 3.01, height: 210, left: -cardWidth, top: -1, borderRadius: 11 }} 
                  resizeMode="cover" 
                />
                <View style={styles.figmaServiceBadge}>
                  <Image 
                    source={require('../../assets/images/tab-bar/rashi/vendor/siren.png')} 
                    style={{ width: 12, height: 12, marginRight: 2 }} 
                    resizeMode="contain"
                  />
                  <Text 
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    style={styles.figmaServiceBadgeText}
                  >
                    Astrologer
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Right Columns (2x2 grid) */}
              <View style={{ width: rightColWidth, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {/* Electrician */}
                <TouchableOpacity style={[styles.figmaServiceCard, { width: cardWidth, height: 100 }]} onPress={() => router.push('/vendor/category/Electrician' as any)}>
                  <Image source={require('../../assets/images/tab-bar/rashi/vendor/Electrician.jpg')} style={{ position: 'absolute', width: cardWidth * 1.36, height: 102, left: -cardWidth * 0.18, top: -1, borderRadius: 11 }} resizeMode="cover" />
                  <View style={styles.figmaServiceBadge}>
                    <Image 
                      source={require('../../assets/images/tab-bar/rashi/vendor/lightning.png')} 
                      style={{ width: 12, height: 12, marginRight: 2 }} 
                      resizeMode="contain"
                    />
                    <Text 
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      style={styles.figmaServiceBadgeText}
                    >
                      Electrician
                    </Text>
                  </View>
                </TouchableOpacity>
                {/* Panditji */}
                <TouchableOpacity style={[styles.figmaServiceCard, { width: cardWidth, height: 100 }]} onPress={() => router.push('/vendor/category/Panditji' as any)}>
                  <Image source={require('../../assets/images/tab-bar/rashi/vendor/panditji.jpg')} style={{ position: 'absolute', width: cardWidth * 1.36, height: 102, left: -cardWidth * 0.18, top: -1, borderRadius: 11 }} resizeMode="cover" />
                  <View style={styles.figmaServiceBadge}>
                    <Image 
                      source={require('../../assets/images/tab-bar/rashi/vendor/panditji_icon.png')} 
                      style={{ width: 12, height: 12, marginRight: 2 }} 
                      resizeMode="contain"
                    />
                    <Text 
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      style={styles.figmaServiceBadgeText}
                    >
                      Panditji
                    </Text>
                  </View>
                </TouchableOpacity>
                {/* Carpenter */}
                <TouchableOpacity style={[styles.figmaServiceCard, { width: cardWidth, height: 100 }]} onPress={() => router.push('/vendor/category/Carpenter' as any)}>
                  <Image source={require('../../assets/images/tab-bar/rashi/vendor/carpener.png')} style={{ position: 'absolute', width: cardWidth * 1.36, height: 102, left: -cardWidth * 0.18, top: -1, borderRadius: 11 }} resizeMode="cover" />
                  <View style={styles.figmaServiceBadge}>
                    <Image 
                      source={require('../../assets/images/tab-bar/rashi/vendor/hammer_custom.png')} 
                      style={{ width: 12, height: 12, marginRight: 2 }} 
                      resizeMode="contain"
                  />
                    <Text 
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      style={styles.figmaServiceBadgeText}
                    >
                      Carpenter
                    </Text>
                  </View>
                </TouchableOpacity>
                {/* Plumber */}
                <TouchableOpacity style={[styles.figmaServiceCard, { width: cardWidth, height: 100 }]} onPress={() => router.push('/vendor/category/Plumber' as any)}>
                  <Image source={require('../../assets/images/tab-bar/rashi/vendor/plumber.png')} style={{ position: 'absolute', width: cardWidth * 1.42, height: 102, left: -cardWidth * 0.21, top: -1, borderRadius: 11 }} resizeMode="cover" />
                  <View style={styles.figmaServiceBadge}>
                    <Image 
                      source={require('../../assets/images/tab-bar/rashi/vendor/plumber_icon.png')} 
                      style={{ width: 12, height: 12, marginRight: 2 }} 
                      resizeMode="contain"
                    />
                    <Text 
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      style={styles.figmaServiceBadgeText}
                    >
                      Plumber
                    </Text>
                  </View>
                </TouchableOpacity>
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
                  Sanatani Services Around You
                </Text>
              </View>
            </View>
          </View>

          {/* Colorful Background Container for the Business Section */}
          <View style={{ marginTop: -30, paddingBottom: 32, alignItems: 'center' }}>
            <Image 
              source={require('../../assets/images/tab-bar/rashi/vendor/background.png')} 
              style={{ position: 'absolute', width: Platform.OS === 'android' ? VSCREEN_WIDTH : 487, height: 364, top: 0 }} 
              resizeMode={Platform.OS === 'android' ? 'cover' : 'stretch'} 
            />
            
            {/* Business Header */}
            <View style={[styles.figmaCapsuleContainer, { marginTop: 24, marginBottom: 24 }]}>
              <View style={styles.figmaBusinessCapsule}>
                <Text 
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  style={styles.figmaBusinessCapsuleText}
                >
                  Sanatani Business’s Around You
                </Text>
              </View>
            </View>

            {/* Business Grid */}
            <View style={styles.figmaBusinessGrid}>
              <View style={[styles.figmaBusinessLeftCol, { width: businessLeftColWidth }]}>
                <TouchableOpacity style={[styles.figmaBusinessCard, { height: 92, marginBottom: 11 }]} onPress={() => router.push('/vendor/category/General Store' as any)}>
                  <Image source={require('../../assets/images/tab-bar/rashi/vendor/generalstore.jpg')} style={{ position: 'absolute', width: businessLeftColWidth, height: 128, top: -18, borderRadius: 11 }} resizeMode="cover" />
                  <View style={styles.figmaServiceBadge}>
                    <Image 
                      source={require('../../assets/images/tab-bar/rashi/vendor/general_store.png')} 
                      style={{ width: 12, height: 12, marginRight: 2 }} 
                      resizeMode="contain"
                    />
                    <Text 
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      style={styles.figmaServiceBadgeText}
                    >
                      General Store
                    </Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.figmaBusinessCard, { height: 92 }]} onPress={() => router.push('/vendor/category/Dairy' as any)}>
                  <Image source={require('../../assets/images/tab-bar/rashi/vendor/dairy.jpg')} style={{ position: 'absolute', width: businessLeftColWidth, height: 128, top: -18, borderRadius: 11 }} resizeMode="cover" />
                  <View style={styles.figmaServiceBadge}>
                    <Image 
                      source={require('../../assets/images/tab-bar/rashi/vendor/cow.png')} 
                      style={{ width: 12, height: 12, marginRight: 2 }} 
                      resizeMode="contain"
                    />
                    <Text 
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      style={styles.figmaServiceBadgeText}
                    >
                      Dairy
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
              <View style={[styles.figmaBusinessRightCol, { width: businessRightColWidth }]}>
                <TouchableOpacity style={[styles.figmaBusinessCard, { height: 195 }]} onPress={() => router.push('/vendor/category/Salon' as any)}>
                  <Image source={require('../../assets/images/tab-bar/rashi/vendor/salon.png')} style={{ position: 'absolute', width: businessRightColWidth * 3.22, height: 197, left: -businessRightColWidth * 1.11, top: -1, borderRadius: 11 }} resizeMode="cover" />
                  <View style={styles.figmaServiceBadge}>
                    <Image 
                      source={require('../../assets/images/tab-bar/rashi/vendor/salon_icon.png')} 
                      style={{ width: 12, height: 12, marginRight: 2 }} 
                      resizeMode="contain"
                    />
                    <Text 
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      style={styles.figmaServiceBadgeText}
                    >
                      Salon
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </View>

        </ScrollView>
      ) : (
        <View style={{ flex: 1 }}>
          {/* Loading State */}
          {((activeSection === 'Services' && loading && vendors.length === 0) || (activeSection === 'Jobs' && jobsLoading && jobProfiles.length === 0)) && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          )}

          {/* Listing */}
          <FlatList
            key={activeSection}
            data={activeSection === 'Jobs' ? displayJobProfiles : displayVendors}
            renderItem={activeSection === 'Jobs' ? (renderJobProfile as any) : (renderVendor as any)}
            keyExtractor={(item: any) => item.id}
            contentContainerStyle={[styles.listContent, { paddingBottom: 90 }]}
            onScroll={onVendorScrollTabBar}
            scrollEventThrottle={16}
            refreshControl={
              <RefreshControl 
                refreshing={refreshing} 
                onRefresh={handleRefresh}
                colors={[COLORS.primary]}
              />
            }
            ListEmptyComponent={
              !((activeSection === 'Services' && loading) || (activeSection === 'Jobs' && jobsLoading)) ? (
                <View style={styles.emptyState}>
                  <Ionicons name={activeSection === 'Jobs' ? 'briefcase-outline' : 'storefront-outline'} size={48} color={COLORS.textLight} />
                  <Text style={styles.emptyText}>
                    {searchTerm
                      ? getNoItemsInAreaText(searchTerm)
                      : (activeSection === 'Jobs' ? localT('noJobsFound') : localT('noServicesFound'))}
                  </Text>
                  {!searchTerm && (
                    <Text style={styles.emptySubtext}>
                      {activeSection === 'Jobs' ? localT('createJobProfileSub') : localT('beFirstRegisterSub')}
                    </Text>
                  )}
                </View>
              ) : null
            }
          />
        </View>
      )}

      {/* Vendor Registration Modal */}
      <VendorRegistrationModal
        visible={showRegistrationModal}
        onClose={() => setShowRegistrationModal(false)}
        onSubmit={handleRegisterVendor}
      />

      <JobProfileModal
        visible={showJobProfileModal}
        onClose={() => setShowJobProfileModal(false)}
        onSubmit={handleCreateJobProfile}
      />

      {/* Vendor Coach Marks (Steps 6 & 7) */}
      {showCoachMarks && (coachMarkStep === 7 || coachMarkStep === 8) && renderVendorCoachMarks()}

    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  sectionTabsContainer: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xs,
    backgroundColor: COLORS.background,
  },
  sectionTabsInner: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  sectionTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  sectionTabActive: {
    backgroundColor: `${COLORS.primary}15`,
  },
  sectionTabText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  sectionTabTextActive: {
    color: COLORS.primary,
  },
  loadingContainer: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    paddingVertical: SPACING.sm,
  },
  tabsScroll: {
    flex: 1,
  },
  tab: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginLeft: SPACING.sm,
    borderRadius: 20,
  },
  tabActive: {
    backgroundColor: `${COLORS.primary}15`,
  },
  tabText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  tabTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  headerIcon: {
    padding: SPACING.sm,
    marginRight: SPACING.sm,
  },
  inlineSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    marginRight: SPACING.xs,
    overflow: 'hidden',
  },
  inlineFilterButton: {
    width: 34,
    height: 34,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: `${COLORS.primary}10`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.xs,
  },
  inlineInputWrapper: {
    flex: 1,
    position: 'relative',
    justifyContent: 'center',
  },
  inlineSearchInput: {
    width: '100%',
    fontSize: 14,
    color: COLORS.text,
    paddingVertical: 0,
    paddingLeft: 0,
  },
  inlinePlaceholderRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inlinePlaceholderText: {
    color: COLORS.textLight,
    fontSize: 14,
    lineHeight: 20,
  },
  inlinePlaceholderBold: {
    fontWeight: '700',
    color: COLORS.text,
  },
  inlineFilterPanelWrapper: {
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    paddingHorizontal: SPACING.sm,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    flex: 1,
  },
  searchInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  filterIconButton: {
    width: 40,
    height: 40,
    backgroundColor: `${COLORS.primary}10`,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeFilterContainer: {
    marginTop: SPACING.xs,
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeFilterText: {
    fontSize: 12,
    color: COLORS.primary,
    marginRight: SPACING.xs,
  },
  filterPanel: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.divider,
    padding: SPACING.sm,
    marginTop: SPACING.xs,
    width: '100%',
    maxHeight: 400,
  },
  filterModalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  filterModal: {
    width: '90%',
    maxHeight: '65%',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  filterModalTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: SPACING.sm,
    color: COLORS.text,
  },
  filterOptionsList: {
    marginBottom: SPACING.sm,
  },
  chipsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  filterOption: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.xs,
    backgroundColor: COLORS.background,
  },
  filterOptionActive: {
    backgroundColor: `${COLORS.primary}20`,
  },
  filterOptionText: {
    color: COLORS.text,
    fontSize: 14,
  },
  categoryChip: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryChipText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '500',
  },
  categoryChipTextActive: {
    color: COLORS.surface,
  },
  filterActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  filterActionButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
  },
  filterActionText: {
    color: COLORS.surface,
    fontWeight: '600',
  },
  searchInput: {
    flex: 1,
    marginLeft: SPACING.sm,
    fontSize: 15,
    color: COLORS.text,
  },
  suggestionsScroll: {
    marginTop: SPACING.xs,
    maxHeight: 44,
    paddingHorizontal: SPACING.md,
  },
  suggestionsContent: {
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  suggestionChip: {
    backgroundColor: `${COLORS.primary}15`,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: SPACING.sm,
  },
  suggestionText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '500',
  },
  myBusinessCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.primary}10`,
    margin: SPACING.md,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  myBusinessIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  myBusinessInfo: {
    flex: 1,
  },
  myBusinessLabel: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
  },
  myBusinessName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 2,
  },
  kycStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  kycStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: SPACING.xs,
  },
  kycStatusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  registerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${COLORS.primary}10`,
    margin: SPACING.md,
    padding: SPACING.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
  },
  registerText: {
    fontSize: 15,
    color: COLORS.primary,
    fontWeight: '600',
    marginLeft: SPACING.sm,
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
  figmaSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    marginTop: 20,
    marginBottom: 20,
    borderRadius: 26,
    height: 52,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  figmaSearchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  figmaCategoriesRow: {
    paddingHorizontal: 24,
    gap: 40,
    marginBottom: 24,
  },
  figmaCategoryItem: {
    alignItems: 'center',
    gap: 8,
  },
  figmaCategoryIconContainer: {
    // Deprecated for categories, but keeping if needed elsewhere
  },
  figmaCategoryText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000000',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  figmaRegisterBtn: {
    flexDirection: 'row',
    width: Platform.OS === 'android' ? VSCREEN_WIDTH - 32 : 361,
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
  figmaCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 14,
  },
  figmaCapsuleText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
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
    width: 110,
    height: 100,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#F26522',
    overflow: 'hidden',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 8,
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
    paddingBottom: 7,
  },
});

const vendorCoachStyles = StyleSheet.create({
  card: {
    position: 'absolute',
    backgroundColor: '#FCF3EE',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#FFEFE5',
    paddingTop: 16,
    paddingHorizontal: 18,
    paddingBottom: 72,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
    zIndex: 100000,
  },
  skip: {
    position: 'absolute',
    top: 12,
    right: 16,
    zIndex: 5,
  },
  skipText: {
    color: '#8E7D90',
    fontSize: 13,
    fontWeight: '600',
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF3EC',
    borderWidth: 1,
    borderColor: '#FFCFAA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    flex: 1,
    color: '#000',
    fontSize: 15,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  desc: {
    marginTop: 10,
    color: '#444',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 18,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  callout: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.10)',
    borderRadius: 7,
    paddingVertical: 8,
    paddingHorizontal: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  calloutText: {
    fontSize: 9,
    color: '#444',
    fontWeight: '400',
    lineHeight: 13,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  footer: {
    position: 'absolute',
    bottom: 14,
    left: 18,
    right: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E6DDD5',
  },
  dotActive: {
    backgroundColor: '#FF701F',
    width: 12,
  },
  nextBtn: {
    backgroundColor: '#FF701F',
    width: 120,
    height: 44,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#A04100',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 4,
  },
  nextText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
});
