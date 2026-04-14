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
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS } from '../../src/constants/theme';
import formatDistance from '../../src/utils/formatDistance';
import { VendorRegistrationModal } from '../../src/components/VendorRegistrationModal';
import { JobProfileModal } from '../../src/components/JobProfileModal';
import { VendorKYCModal } from '../../src/components/VendorKYCModal';
import { useAuthStore } from '../../src/store/authStore';
import { useVendorStore, Vendor, DEFAULT_CATEGORIES } from '../../src/store/vendorStore';
import { ensureForegroundPermission, getCurrentPosition } from '../../src/services/location';
import { createOrUpdateJobProfile, getJobProfiles, getMyJobProfile, getKYCStatus, uploadJobProfileFile } from '../../src/services/api';
import * as Location from 'expo-location';

const TABS = ['Nearby'];
const MAIN_SECTIONS = ['Vendors', 'Jobs'];
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

export default function VendorScreen() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated, updateUser } = useAuthStore();
  const userId = user?.id;
  const [kycStatus, setKycStatus] = useState<string | null>((user as any)?.kyc_status || null);
  const currentKycStatus = kycStatus || (user as any)?.kyc_status || null;
  const isKycVerified = currentKycStatus === 'verified' || Boolean((user as any)?.is_verified);
  const hasVerifiedKyc = isKycVerified || myVendor?.kyc_status === 'verified';
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
  
  const [activeTab, setActiveTab] = useState('Nearby');
  const [activeSection, setActiveSection] = useState('Vendors');
  const [refreshing, setRefreshing] = useState(false);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [showJobProfileModal, setShowJobProfileModal] = useState(false);
  const [showKycModal, setShowKycModal] = useState(false);
  const [kycModalVendorId, setKycModalVendorId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [filteredCategories, setFilteredCategories] = useState<string[]>([]);
  const [searchCategory, setSearchCategory] = useState<string>('All');
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);
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
    const effectiveStatus = latestStatus || currentKycStatus;

    if (effectiveStatus === 'verified') {
      return true;
    }

    setKycModalVendorId(myVendor?.id || '');
    setShowKycModal(true);
    return false;
  }, [loadKycStatus, currentKycStatus, myVendor?.id]);
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
          const location = await Location.getCurrentPositionAsync({});
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
    setJobsLoading(true);
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
    if (!term) return [] as Array<{ label: string; type: 'vendor' | 'category' | 'job' | 'profession' }>;

    const seen = new Set<string>();
    const suggestions: Array<{ label: string; type: 'vendor' | 'category' | 'job' | 'profession' }> = [];

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
        categories: data.categories,
        address: data.address,
        locationLink: data.locationLink || undefined,
        phoneNumber: data.phoneNumber,
        latitude: data.latitude || undefined,
        longitude: data.longitude || undefined,
      });
      
      console.log('Vendor registration response:', JSON.stringify(newVendor, null, 2));
      
      // Refresh vendor data to get the actual status
      await fetchMyVendor();
      if (userLocation) {
        await fetchVendors(userLocation);
      } else {
        await fetchVendors();
      }
      
      // Check vendor status and prompt accordingly
      const kycStatus = newVendor?.kyc_status;
      
      console.log('KYC Status from registration:', kycStatus);
      
      setShowRegistrationModal(false);
      
      if (kycStatus === 'verified' || hasVerifiedKyc) {
        Alert.alert('Approved', 'Your business has been registered and your KYC is already verified.');
      } else {
        // Show KYC modal for verification
        Alert.alert(
          'Registration Complete', 
          'Your business is registered. Please complete KYC verification to make it visible and access all features.',
          [
            { text: 'Later', style: 'cancel' },
            { 
              text: 'Complete KYC', 
              onPress: () => {
                console.log('Opening KYC modal with vendor ID:', newVendor?.id);
                setKycModalVendorId(newVendor?.id);
                setShowKycModal(true);
              }
            }
          ]
        );
      }
    } catch (error: any) {
      console.error('Vendor API Registration Error:', error.response?.data);
      let errorMsg = 'Failed to register business';
      if (error.response?.data?.detail) {
        if (Array.isArray(error.response.data.detail)) {
          errorMsg = error.response.data.detail.map((err: any) => `${err.loc?.[1] || err.loc?.[0]}: ${err.msg}`).join('\n');
        } else if (typeof error.response.data.detail === 'string') {
          errorMsg = error.response.data.detail;
        } else {
          errorMsg = JSON.stringify(error.response.data.detail);
        }
      }
      Alert.alert('Error', errorMsg);
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
            <Text style={styles.vendorName}>{item.business_name || 'Unnamed Business'}</Text>
            {isApprovedVendor && (
              <Ionicons name="checkmark-circle" size={16} color="#1DA1F2" style={styles.vendorVerifiedIcon} />
            )}
          </View>
          
          {/* Categories */}
          {vendorCategories.length > 0 && (
            <View style={styles.categoriesRow}>
              {vendorCategories.slice(0, 2).map((cat, idx) => (
                <View key={idx} style={styles.categoryBadge}>
                  <Text style={styles.categoryBadgeText}>{cat}</Text>
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
              <Text style={styles.categoryBadgeText}>{item.profession || 'Profession'}</Text>
            </View>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>{item.experience_years || 0} yrs</Text>
            </View>
          </View>

          <View style={styles.distanceRow}>
            <Ionicons name="location" size={12} color={COLORS.textLight} />
            <Text style={styles.distanceText}>{item.preferred_work_city || 'Preferred city not set'}</Text>
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
                  Alert.alert('Unavailable', 'CV link is not available.');
                  return;
                }
                const canOpen = await Linking.canOpenURL(url);
                if (!canOpen) {
                  Alert.alert('Unavailable', 'Could not open CV link.');
                  return;
                }
                await Linking.openURL(url);
              } catch {
                Alert.alert('Unavailable', 'Could not open CV link.');
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
    <View style={styles.container}>
      <View style={styles.sectionTabsContainer}>
        <View style={styles.sectionTabsInner}>
          {MAIN_SECTIONS.map((section) => (
            <TouchableOpacity
              key={section}
              style={[styles.sectionTab, activeSection === section && styles.sectionTabActive]}
              onPress={() => setActiveSection(section)}
            >
              <Text style={[styles.sectionTabText, activeSection === section && styles.sectionTabTextActive]}>
                {section}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Top Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab}
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
                <Text style={styles.inlinePlaceholderText}>Search for "</Text>
                <Pressable
                  onPress={handleSkillPlaceholderPress}
                  onHoverIn={() => setIsPlaceholderPaused(true)}
                  onHoverOut={() => setIsPlaceholderPaused(false)}
                >
                  <Text style={styles.inlinePlaceholderBold}>{typedSkillPlaceholder}</Text>
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
            height: filterAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 76],
            }),
            overflow: 'hidden',
          },
        ]}
        pointerEvents={showCategoryFilter ? 'auto' : 'none'}
      >
        <View style={styles.filterPanel}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsContainer}>
            <TouchableOpacity
              style={[styles.categoryChip, searchCategory === 'All' && styles.categoryChipActive]}
              onPress={() => {
                setSearchCategory('All');
                setShowCategoryFilter(false);
              }}
            >
              <Text style={[styles.categoryChipText, searchCategory === 'All' && styles.categoryChipTextActive]}>All</Text>
            </TouchableOpacity>
            {(activeSection === 'Jobs' ? jobProfessionFilters : categories).map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.categoryChip, searchCategory === cat && styles.categoryChipActive]}
                onPress={() => {
                  setSearchCategory(cat);
                  setShowCategoryFilter(false);
                }}
              >
                <Text style={[styles.categoryChipText, searchCategory === cat && styles.categoryChipTextActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
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
                  ? `Category: ${suggestion.label}`
                  : suggestion.type === 'profession'
                    ? `Profession: ${suggestion.label}`
                    : suggestion.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* My Business Section (if vendor owner) */}
      {activeSection === 'Vendors' && myVendor && (
        <TouchableOpacity 
          style={styles.myBusinessCard}
          onPress={() => {
            if (hasVerifiedKyc) {
              router.push('/vendor/dashboard');
              return;
            }
            if (myVendor.kyc_status !== 'verified') {
              setKycModalVendorId(myVendor.id);
              setShowKycModal(true);
            } else {
              router.push('/vendor/dashboard');
            }
          }}
        >
          <View style={styles.myBusinessIcon}>
            <Ionicons name="storefront" size={24} color={COLORS.primary} />
          </View>
          <View style={styles.myBusinessInfo}>
            <Text style={styles.myBusinessLabel}>Manage My Business</Text>
            <Text style={styles.myBusinessName}>{myVendor.business_name}</Text>
            {!hasVerifiedKyc && (myVendor.kyc_status === 'pending' || myVendor.kyc_status === 'manual_review' || myVendor.kyc_status === 'rejected' || !myVendor.kyc_status) && (
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
                    ? 'KYC Rejected - Tap to Update'
                    : myVendor.kyc_status === 'manual_review'
                      ? 'KYC In Review'
                      : 'KYC Pending - Tap to Complete'}
                </Text>
              </View>
            )}
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
        </TouchableOpacity>
      )}

      {/* Create button */}
      {activeSection === 'Vendors' && !myVendor && (
        <TouchableOpacity 
          style={styles.registerButton}
          onPress={() => setShowRegistrationModal(true)}
        >
          <Ionicons name="add-circle" size={20} color={COLORS.primary} />
          <Text style={styles.registerText}>Register Your Business</Text>
        </TouchableOpacity>
      )}

      {activeSection === 'Jobs' && (
        <TouchableOpacity
          style={styles.registerButton}
          onPress={() => setShowJobProfileModal(true)}
        >
          <Ionicons name="add-circle" size={20} color={COLORS.primary} />
          <Text style={styles.registerText}>{myJobProfile ? 'Update Job Profile' : 'Create Job Profile'}</Text>
        </TouchableOpacity>
      )}

      {/* Loading State */}
      {((activeSection === 'Vendors' && loading && vendors.length === 0) || (activeSection === 'Jobs' && jobsLoading && jobProfiles.length === 0)) && (
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
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={handleRefresh}
            colors={[COLORS.primary]}
          />
        }
        ListEmptyComponent={
          !((activeSection === 'Vendors' && loading) || (activeSection === 'Jobs' && jobsLoading)) ? (
            <View style={styles.emptyState}>
              <Ionicons name={activeSection === 'Jobs' ? 'briefcase-outline' : 'storefront-outline'} size={48} color={COLORS.textLight} />
              <Text style={styles.emptyText}>
                {searchTerm
                  ? `No '${searchTerm}' in your area.`
                  : (activeSection === 'Jobs' ? 'No jobs found' : 'No vendors found')}
              </Text>
              {!searchTerm && (
                <Text style={styles.emptySubtext}>
                  {activeSection === 'Jobs' ? 'Create a job profile to appear here.' : 'Be the first to register in this area!'}
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

      <VendorKYCModal
        visible={showKycModal}
        vendorId={kycModalVendorId || ''}
        allowUserKycFallback
        onClose={() => setShowKycModal(false)}
        onKycUpdated={() => {
          setShowKycModal(false);
          loadKycStatus();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
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
    paddingBottom: 100,
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
