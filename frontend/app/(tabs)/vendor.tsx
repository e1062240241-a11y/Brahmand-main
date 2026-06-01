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
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS } from '../../src/constants/theme';
import formatDistance from '../../src/utils/formatDistance';
import { VendorRegistrationModal } from '../../src/components/VendorRegistrationModal';
import { JobProfileModal } from '../../src/components/JobProfileModal';
import { useTranslation } from '../../src/utils/i18n';

import { useAuthStore } from '../../src/store/authStore';
import { useVendorStore, Vendor, DEFAULT_CATEGORIES } from '../../src/store/vendorStore';
import { ensureForegroundPermission, getCurrentPosition } from '../../src/services/location';
import { createOrUpdateJobProfile, getJobProfiles, getMyJobProfile, getKYCStatus, uploadJobProfileFile } from '../../src/services/api';
import * as Location from 'expo-location';

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
  const isKycVerified = currentKycStatus === 'verified' || Boolean((user as any)?.is_verified);
  const { 
    vendors, 
    myVendor, 
    categories,
    loading,
    fetchVendors, 
    fetchMyVendor,
    fetchCategories,
    createVendor 
  } = useVendorStore();
  const hasVerifiedKyc = isKycVerified || myVendor?.kyc_status === 'verified';
  
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

  const loadKycStatus = useCallback(async (): Promise<string | null> => {
    try {
      const response = await getKYCStatus();
      const serverStatus = response?.data?.kyc_status || (response?.data?.is_verified ? 'verified' : null);
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
      Boolean((user as any)?.is_verified) ||
      myVendor?.kyc_status === 'verified';

    if (isVerified) {
      return true;
    }

    router.push('/kyc');
    return false;
  }, [loadKycStatus, user, myVendor?.kyc_status, router]);
  const filterAnim = useRef(new Animated.Value(0)).current;
  const searchInputRef = useRef<TextInput | null>(null);

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
      router.replace('/auth' as any);
      return;
    }
    
    if (!userId) {
      return;
    }
    loadData();
  }, [loadData, userId, authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!userId) return;
    if (activeSection === 'Jobs') {
      loadJobsData();
      loadKycStatus();
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

    // Show all vendors if distance cannot be computed (e.g. location disabled),
    // or limit to a generous 100km radius so users/testers can see profiles.
    filtered = filtered.filter((v) => typeof v.distance !== 'number' || v.distance <= 100);

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
      
      // Close modal immediately so UI feels fast
      setShowRegistrationModal(false);
      
      // Refresh vendor data so the UI updates before the modal closes
      await Promise.all([
        fetchMyVendor(),
        userLocation ? fetchVendors(userLocation) : fetchVendors()
      ]).catch(err => console.warn('Background fetch error:', err));
      
      // Check vendor status and prompt accordingly
      const kycStatus = newVendor?.kyc_status;
      
      console.log('KYC Status from registration:', kycStatus);
      
      if (kycStatus === 'verified' || hasVerifiedKyc) {
        Alert.alert(
          localT('approvedTitle'), 
          localT('approvedMsg'),
          [
            {
              text: localT('goDashboard'),
              onPress: () => router.push('/vendor/dashboard')
            }
          ]
        );
      } else {
        // Show KYC modal for verification
        Alert.alert(
          localT('regCompleteTitle'), 
          localT('regCompleteMsg'),
          [
            { 
              text: localT('later'), 
              style: 'cancel',
              onPress: () => {
                router.push('/vendor/dashboard');
              }
            },
            { 
              text: localT('completeKyc'), 
              onPress: () => {
                router.push('/kyc');
              }
            }
          ]
        );
      }
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
      item.kyc_status === 'verified' ||
      item.kyc_status === 'approved' ||
      item.is_verified ||
      (item as any).review_status === 'approved' ||
      (item as any).review_status === 'verified' ||
      (item as any).review_state === 'closed';
    
    return (
      <TouchableOpacity 
        style={styles.vendorCard}
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
        <TouchableOpacity 
          style={styles.callButton}
          onPress={() => handleCall(item.phone_number)}
        >
          <Ionicons name="call" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderJobProfile = ({ item }: { item: JobProfile }) => {
    const firstPhoto = (item.photos || []).find((url) => !!url);
    const cvIconName = isKycVerified ? 'document-text' : 'lock-closed';
    const cvIconColor = isKycVerified ? COLORS.primary : COLORS.textLight;

    return (
      <TouchableOpacity
        style={styles.vendorCard}
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
          <TouchableOpacity
            style={styles.callButton}
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
          </TouchableOpacity>
        ) : null}
      </TouchableOpacity>
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
      {/* Top Tabs */}
      <View style={[styles.tabsContainer, { paddingTop: insets.top || SPACING.sm }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => {
                requestAnimationFrame(() => {
                  setActiveTab(tab);
                });
              }}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab === 'Nearby' ? localT('nearby') : tab}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <Animated.View
          style={[
            styles.inlineSearchContainer,
            {
              width: searchAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 230],
              }),
              opacity: searchAnim,
            },
          ]}
          pointerEvents={showSearch ? 'auto' : 'none'}
        >
          <Ionicons name="search" size={16} color={COLORS.textLight} />
          <Pressable
            style={styles.inlineInputWrapper}
            onPress={() => searchInputRef.current?.focus()}
          >
            {!searchTerm && (
              <View style={styles.inlinePlaceholderRow} pointerEvents="box-none">
                <Text style={styles.inlinePlaceholderText}>{localT('searchFor')}</Text>
                <Pressable
                  onPress={handleSkillPlaceholderPress}
                  onHoverIn={() => setIsPlaceholderPaused(true)}
                  onHoverOut={() => setIsPlaceholderPaused(false)}
                >
                  <Text style={styles.inlinePlaceholderBold}>
                    {(() => {
                      const skillKey = typedSkillPlaceholder.toLowerCase() as any;
                      return localT(skillKey) || typedSkillPlaceholder;
                    })()}
                  </Text>
                </Pressable>
                <Text style={styles.inlinePlaceholderText}>"</Text>
              </View>
            )}
            <TextInput
              ref={searchInputRef}
              style={styles.inlineSearchInput}
              placeholder=""
              value={searchTerm}
              onChangeText={setSearchTerm}
              returnKeyType="search"
              blurOnSubmit={false}
            />
          </Pressable>
          {!!searchTerm && (
            <TouchableOpacity onPress={() => setSearchTerm('')}>
              <Ionicons name="close-circle" size={16} color={COLORS.textLight} />
            </TouchableOpacity>
          )}
        </Animated.View>

        <TouchableOpacity
          style={styles.inlineFilterButton}
          onPress={() => {
            if (!showSearch) {
              setShowSearch(true);
            }
            setShowCategoryFilter((prev) => !prev);
          }}
        >
          <Ionicons name={showCategoryFilter ? 'close' : 'filter'} size={18} color={COLORS.primary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.headerIcon}
          onPress={() => {
            if (showSearch) {
              setShowSearch(false);
              setShowCategoryFilter(false);
            } else {
              setShowSearch(true);
            }
          }}
        >
          <Ionicons name={showSearch ? 'close' : 'search'} size={22} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <Animated.View
        style={[
          styles.inlineFilterPanelWrapper,
          {
            opacity: filterAnim,
            maxHeight: filterAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 500],
            }),
            overflow: 'hidden',
          },
        ]}
        pointerEvents={showCategoryFilter ? 'auto' : 'none'}
      >
        <View style={styles.filterPanel}>
          <View style={[styles.chipsContainer, { flexWrap: 'wrap' }]}>
            <TouchableOpacity
              style={[styles.categoryChip, searchCategory === 'All' && styles.categoryChipActive]}
              onPress={() => {
                setSearchCategory('All');
                setShowCategoryFilter(false);
              }}
            >
              <Text style={[styles.categoryChipText, searchCategory === 'All' && styles.categoryChipTextActive]}>{localT('all')}</Text>
            </TouchableOpacity>
            
            {(activeSection === 'Jobs' ? jobProfessionFilters : categories)
              .slice(0, showExpandedCategories ? undefined : 7)
              .map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.categoryChip, searchCategory === cat && styles.categoryChipActive]}
                onPress={() => {
                  setSearchCategory(cat);
                  setShowCategoryFilter(false);
                }}
              >
                <Text style={[styles.categoryChipText, searchCategory === cat && styles.categoryChipTextActive]}>
                  {localT(cat.toLowerCase() as any) || cat}
                </Text>
              </TouchableOpacity>
            ))}
            
            {!showExpandedCategories && (activeSection === 'Jobs' ? jobProfessionFilters : categories).length > 7 && (
              <TouchableOpacity
                style={styles.categoryChip}
                onPress={() => setShowExpandedCategories(true)}
              >
                <Text style={styles.categoryChipText}>{localT('more')}</Text>
              </TouchableOpacity>
            )}
            
            {showExpandedCategories && (
              <TouchableOpacity
                style={styles.categoryChip}
                onPress={() => setShowExpandedCategories(false)}
              >
                <Text style={styles.categoryChipText}>{localT('showLess')}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Animated.View>

      {!!searchTerm && searchSuggestions.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.suggestionsScroll}
          contentContainerStyle={styles.suggestionsContent}
        >
          {searchSuggestions.map((suggestion) => (
            <TouchableOpacity
              key={`${suggestion.type}-${suggestion.label}`}
              style={styles.suggestionChip}
              onPress={() => {
                if (suggestion.type === 'category' || suggestion.type === 'profession') {
                  setSearchCategory(suggestion.label);
                  setSearchTerm('');
                } else {
                  setSearchTerm(suggestion.label);
                }
              }}
            >
              <Text style={styles.suggestionText}>
                {suggestion.type === 'category'
                  ? `${localT('categoryPrefix')}${localT(suggestion.label.toLowerCase() as any) || suggestion.label}`
                  : suggestion.type === 'profession'
                    ? `${localT('professionPrefix')}${localT(suggestion.label.toLowerCase() as any) || suggestion.label}`
                    : suggestion.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* My Business Section (if vendor owner) */}
      {activeSection === 'Services' && myVendor && (
        <View style={styles.myBusinessCard}>
          <TouchableOpacity 
            style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}
            onPress={() => {
              router.push('/vendor/dashboard');
            }}
          >
            <View style={styles.myBusinessIcon}>
              <Ionicons name="storefront" size={24} color={COLORS.primary} />
            </View>
            <View style={styles.myBusinessInfo}>
              <Text style={styles.myBusinessLabel}>{localT('manageMyService')}</Text>
              <Text style={styles.myBusinessName}>{myVendor.business_name}</Text>
              {hasVerifiedKyc ? (
                <View style={{ marginTop: SPACING.xs }}>
                  <View style={styles.kycStatusBadge}>
                    <Ionicons name="checkmark-circle" size={12} color="#2E7D32" style={{ marginRight: SPACING.xs }} />
                    <Text style={[styles.kycStatusText, { color: '#2E7D32' }]}>
                      {localT('kycVerified')}
                    </Text>
                  </View>
                </View>
              ) : (
                (myVendor.kyc_status === 'pending' || myVendor.kyc_status === 'manual_review' || myVendor.kyc_status === 'rejected' || !myVendor.kyc_status) && (
                  <View style={{ marginTop: SPACING.xs }}>
                    <View style={styles.kycStatusBadge}>
                      <View style={[
                        styles.kycStatusDot,
                        { 
                          backgroundColor: myVendor.kyc_status === 'rejected' ? COLORS.error : COLORS.warning 
                        }
                      ]} />
                      <Text style={[
                        styles.kycStatusText,
                        { color: myVendor.kyc_status === 'rejected' ? COLORS.error : COLORS.warning }
                      ]}>
                        {myVendor.kyc_status === 'rejected'
                          ? localT('kycRejected')
                          : myVendor.kyc_status === 'manual_review'
                            ? localT('verificationInReview')
                            : localT('pendingKyc')}
                      </Text>
                    </View>
                  </View>
                )
              )}
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} style={{ marginRight: 8 }} />
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingLeft: 8, borderLeftWidth: 1, borderLeftColor: COLORS.divider }}>
            {!hasVerifiedKyc && (myVendor.kyc_status === 'pending' || myVendor.kyc_status === 'rejected' || !myVendor.kyc_status) && (
              <TouchableOpacity
                style={{
                  backgroundColor: COLORS.primary,
                  paddingVertical: 6,
                  paddingHorizontal: 12,
                  borderRadius: 12,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
                onPress={() => {
                  router.push('/kyc');
                }}
              >
                <Text style={{ color: COLORS.surface, fontSize: 11, fontWeight: '700' }}>
                  {localT('verify')}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: 'rgba(211, 47, 47, 0.1)',
                justifyContent: 'center',
                alignItems: 'center',
              }}
              onPress={handleDeleteVendor}
            >
              <Ionicons name="trash" size={18} color={COLORS.error} />
            </TouchableOpacity>
          </View>
        </View>
      )}


      {/* Create button */}
      {activeSection === 'Services' && !myVendor && (
        <TouchableOpacity 
          style={styles.registerButton}
          onPress={() => setShowRegistrationModal(true)}
        >
          <Ionicons name="add-circle" size={20} color={COLORS.primary} />
          <Text style={styles.registerText}>{localT('registerYourService')}</Text>
        </TouchableOpacity>
      )}

      {activeSection === 'Jobs' && (
        <TouchableOpacity
          style={styles.registerButton}
          onPress={() => setShowJobProfileModal(true)}
        >
          <Ionicons name="add-circle" size={20} color={COLORS.primary} />
          <Text style={styles.registerText}>{myJobProfile ? localT('updateJobProfile') : localT('createJobProfile')}</Text>
        </TouchableOpacity>
      )}

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
});
