import React from 'react';
import { Image } from 'expo-image';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  BackHandler,
  ActivityIndicator,
  Dimensions,
  Platform,
  Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, G } from 'react-native-svg';
import * as Location from 'expo-location';
import { COLORS, SPACING } from '../../src/constants/theme';
import { useAuthStore } from '../../src/store/authStore';
import { useVendorStore } from '../../src/store/vendorStore';
import { getUserProfile, sendDirectMessage, getVendor } from '../../src/services/api';
import { formatDistance, calculateHaversineDistance } from '../../src/utils/formatDistance';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function VendorProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [userCoords, setUserCoords] = React.useState<{ lat: number; lng: number } | null>(null);
  
  const { vendors, myVendor } = useVendorStore();
  const { user } = useAuthStore();
  const [isSendingRequest, setIsSendingRequest] = React.useState(false);
  const [fetchedVendor, setFetchedVendor] = React.useState<any>(null);
  const [vendorLoading, setVendorLoading] = React.useState(false);
  const [vendorError, setVendorError] = React.useState(false);
  const [selectedImage, setSelectedImage] = React.useState<string | null>(null);

  // First try from myVendor (fastest & most up-to-date for owner) or local vendors store, fall back to API fetch
  const storeVendor = (myVendor?.id === id ? myVendor : null) || vendors.find(v => v.id === id);
  const vendor = storeVendor || fetchedVendor;
  const isOwner = Boolean(user && vendor && (vendor.owner_id === user.id || myVendor?.id === vendor.id));

  const formatExternalUrl = (url: string) => {
    const trimmed = url.trim();
    if (/^https?:\/\//i.test(trimmed)) {
      return trimmed;
    }
    return `https://${trimmed}`;
  };

  const openExternalUrl = async (url: string) => {
    try {
      const targetUrl = formatExternalUrl(url);
      const supported = await Linking.canOpenURL(targetUrl);
      if (!supported) {
        Alert.alert('Unable to open link', 'This link cannot be opened.');
        return;
      }
      await Linking.openURL(targetUrl);
    } catch (error) {
      console.warn('Failed to open external URL', error);
      Alert.alert('Unable to open link', 'Please try again in your browser.');
    }
  };

  const handleBack = () => {
    router.back();
  };

  React.useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      router.back();
      return true; // prevent default behavior
    });

    return () => {
      subscription.remove();
    };
  }, [router]);

  React.useEffect(() => {
    if (!id) return;
    
    // If we have no local cache at all, show loading spinner
    if (!vendor) {
      setVendorLoading(true);
    }
    setVendorError(false);

    getVendor(id)
      .then((res) => {
        const data = res?.data;
        if (data && data.id) {
          setFetchedVendor(data);
        } else if (!vendor) {
          setVendorError(true);
        }
      })
      .catch(() => {
        if (!vendor) {
          setVendorError(true);
        }
      })
      .finally(() => {
        setVendorLoading(false);
      });
  }, [id]);

  const [vendorCoords, setVendorCoords] = React.useState<{ lat: number; lng: number } | null>(null);

  React.useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          if (loc?.coords) {
            setUserCoords({ lat: loc.coords.latitude, lng: loc.coords.longitude });
          }
        }
      } catch (err) {
        if (user?.home_location?.latitude && user?.home_location?.longitude) {
          setUserCoords({ lat: Number(user.home_location.latitude), lng: Number(user.home_location.longitude) });
        }
      }
    })();
  }, [user?.home_location]);

  React.useEffect(() => {
    if (!vendor) return;
    const vLat = Number(vendor.latitude);
    const vLng = Number(vendor.longitude);
    if (Number.isFinite(vLat) && Number.isFinite(vLng) && Math.abs(vLat) > 0.001 && Math.abs(vLng) > 0.001) {
      setVendorCoords({ lat: vLat, lng: vLng });
    } else if (vendor.full_address || vendor.address) {
      const addr = (vendor.full_address || vendor.address || '').trim();
      if (addr) {
        Location.geocodeAsync(addr)
          .then((results) => {
            if (results && results.length > 0) {
              setVendorCoords({ lat: results[0].latitude, lng: results[0].longitude });
            }
          })
          .catch(() => {});
      }
    }
  }, [vendor?.id, vendor?.latitude, vendor?.longitude, vendor?.full_address, vendor?.address]);

  const calculatedDistance = React.useMemo(() => {
    if (!vendor) return null;

    const uLat = userCoords?.lat ?? (user?.home_location?.latitude ? Number(user.home_location.latitude) : null);
    const uLng = userCoords?.lng ?? (user?.home_location?.longitude ? Number(user.home_location.longitude) : null);
    const vLat = vendorCoords?.lat ?? (vendor.latitude ? Number(vendor.latitude) : null);
    const vLng = vendorCoords?.lng ?? (vendor.longitude ? Number(vendor.longitude) : null);

    const dynamicDist = calculateHaversineDistance(uLat, uLng, vLat, vLng);
    if (dynamicDist !== null) {
      return dynamicDist;
    }

    // Secondary Fallback: If distance was pre-calculated and dynamic coordinates are unavailable
    if (vendor.distance !== undefined && vendor.distance !== null && Number.isFinite(Number(vendor.distance))) {
      return Number(vendor.distance);
    }

    return null;
  }, [vendor, vendorCoords, userCoords, user?.home_location]);

  if (vendorLoading) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#FF6600" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!vendor) {
    return (
      <View style={[styles.errorContainer, { paddingTop: insets.top }]}>
        <View style={styles.errorHeader}>
          <TouchableOpacity onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
        </View>
        <View style={styles.errorContent}>
          <Ionicons name="storefront-outline" size={48} color="#999" />
          <Text style={styles.errorText}>Vendor not found</Text>
        </View>
      </View>
    );
  }

  const galleryImages = (vendor.business_gallery_images || vendor.photos || []).filter((photo: string) => !!photo);
  const vendorCategories = Array.isArray(vendor.categories) ? vendor.categories : [];

  const handleCall = () => {
    if (vendor.phone_number) {
      Linking.openURL(`tel:${vendor.phone_number}`);
    } else {
      Alert.alert('No Phone', 'Phone number not available for this vendor.');
    }
  };

  const notifyVendorOwner = async () => {
    if (!user) {
      throw new Error('Please login to notify the business owner.');
    }
    if (!vendor.owner_id) {
      throw new Error('Vendor owner information is unavailable.');
    }
    if (vendor.owner_id === user.id) {
      return;
    }

    const profileResponse = await getUserProfile(vendor.owner_id);
    const ownerProfile = profileResponse?.data;
    const ownerSlId = ownerProfile?.sl_id;
    if (!ownerSlId) {
      throw new Error('Vendor owner SL ID is unavailable.');
    }

    const callerName = user.name || 'A user';
    const callerPhone = user.phone || 'phone number unavailable';
    const message = `${callerName} wants to connect to your business and is waiting for your call. Phone: ${callerPhone}`;
    await sendDirectMessage(ownerSlId, message);
  };

  const handleGetCall = async () => {
    setIsSendingRequest(true);
    try {
      await notifyVendorOwner();
      if (user && vendor.owner_id === user.id) {
        Alert.alert('Info', 'You are the owner of this business.');
      } else {
        Alert.alert('Request sent', 'The business owner has been notified and can call you back.');
      }
    } catch (error: any) {
      console.warn('Failed to notify vendor owner:', error?.message || error);
      Alert.alert('Could not send request', 'Please try again later.');
    } finally {
      setIsSendingRequest(false);
    }
  };

  const handleDirections = () => {
    const address = (vendor.full_address || vendor.address || '').trim();
    const hasCoords =
      Number.isFinite(Number(vendor.latitude)) &&
      Number.isFinite(Number(vendor.longitude)) &&
      Math.abs(Number(vendor.latitude)) > 0.001 &&
      Math.abs(Number(vendor.longitude)) > 0.001;

    // Prioritize full_address provided by vendor so Google Maps searches the exact typed address from current user location
    let destinationParam = '';
    if (address) {
      destinationParam = encodeURIComponent(address);
    } else if (hasCoords) {
      destinationParam = `${vendor.latitude},${vendor.longitude}`;
    } else if (vendor.location_link && /^https?:\/\//i.test(vendor.location_link.trim())) {
      Linking.openURL(vendor.location_link.trim()).catch(() => {
        Alert.alert('Unable to open link', 'Invalid location link.');
      });
      return;
    }

    if (!destinationParam) {
      Alert.alert('No Location', 'Location details are not available for this vendor.');
      return;
    }

    // Launch Google Maps / Apple Maps Directions with explicit User GPS Location as starting point (origin)
    const originParam = userCoords ? `${userCoords.lat},${userCoords.lng}` : '';
    const googleMapsUrl = originParam
      ? `https://www.google.com/maps/dir/?api=1&origin=${originParam}&destination=${destinationParam}&travelmode=driving`
      : `https://www.google.com/maps/dir/?api=1&destination=${destinationParam}&travelmode=driving`;

    const appleMapsUrl = originParam
      ? `http://maps.apple.com/?saddr=${originParam}&daddr=${destinationParam}&dirflg=d`
      : `http://maps.apple.com/?daddr=${destinationParam}&dirflg=d`;

    const mapsUrl = Platform.OS === 'ios' ? appleMapsUrl : googleMapsUrl;

    Linking.openURL(mapsUrl).catch(() => {
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${destinationParam}`);
    });
  };

  return (
    <LinearGradient
      colors={['#FF8D57', '#EA9B76', '#FFFFFF', '#FFF8F0', '#FFF8F0']}
      locations={[0, 0.0481, 0.2404, 0.6202, 1.0]}
      style={styles.container}
    >
      {/* Solid Header Screen */}
      <View style={[styles.headerContainer, { paddingTop: Math.max(insets.top, 10) }]}>
        <View style={styles.headerLeftCol}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="chevron-back" size={26} color="#000" />
          </TouchableOpacity>
          <View style={styles.kycRow}>
            <Text style={styles.kycVerifiedText}>KYC Verified</Text>
            {vendor.kyc_status === 'verified' && (
              <Ionicons name="shield-checkmark" size={16} color="#FF4005" style={{ marginLeft: 6 }} />
            )}
          </View>
        </View>
        {isOwner && (
          <TouchableOpacity 
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#FF6600',
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 16,
            }}
            onPress={() => router.push('/vendor/dashboard')}
          >
            <Ionicons name="pencil" size={14} color="#FFF" style={{ marginRight: 4 }} />
            <Text style={{ color: '#FFF', fontSize: 12, fontWeight: '700' }}>Edit Profile</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Banner Cover Photo */}
        <View style={styles.bannerContainer}>
          {galleryImages.length > 0 ? (
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => setSelectedImage(galleryImages[0])}
              style={styles.bannerImageWrapper}
            >
              {/* Blurred background photo layer */}
              <Image
                source={{ uri: galleryImages[0] }}
                style={StyleSheet.absoluteFillObject}
                resizeMode="cover"
                blurRadius={20}
              />
              <View style={styles.bannerOverlay} />
              {/* Foreground photo layer with contain resizeMode so full image is shown */}
              <Image
                source={{ uri: galleryImages[0] }}
                style={styles.bannerImage}
                resizeMode="contain"
              />
            </TouchableOpacity>
          ) : (
            <View style={styles.bannerPlaceholder}>
              <Ionicons name="storefront" size={60} color="#FF6600" />
            </View>
          )}
        </View>

        {/* Business Title & Details */}
        <View style={styles.titleSection}>
          <View style={styles.businessHeaderRow}>
            <View style={styles.businessNameCol}>
              <Text style={styles.businessName}>{vendor.business_name}</Text>
              <Text style={styles.ownerName}>by {vendor.owner_name}</Text>
            </View>
            <TouchableOpacity
              style={styles.requestCallBtn}
              onPress={handleGetCall}
              disabled={isSendingRequest}
            >
              <Text style={styles.requestCallBtnText}>
                {isSendingRequest ? 'Sending...' : 'Request a Call Back'}
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* Trust Badge */}
          <View style={styles.communityBadge}>
            <Svg width={16} height={16} viewBox="0 0 16 16" fill="none" style={{ marginRight: 8 }}>
              <Path
                d="M8.66667 4.66602H14M14 4.66602V9.99935M14 4.66602L8.66667 9.99935L6 7.33268L2 11.3327"
                stroke="#00E100"
                strokeWidth={1.33333}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
            <Text style={styles.communityBadgeText}>Frequently Used by Community</Text>
          </View>

          {vendor.business_description ? (
            <Text style={styles.businessDescriptionText}>{vendor.business_description}</Text>
          ) : null}

          {/* Meta Info Row */}
          <View style={styles.metaRow}>
            {vendor.years_in_business !== undefined && (
              <View style={styles.metaItem}>
                <Svg width={20} height={20} viewBox="0 0 20 20" fill="none" style={{ marginRight: 6 }}>
                  <G opacity={0.7}>
                    <Path
                      d="M10.006 2.16016C3.97076 2.16016 0.198737 8.69349 3.21636 13.9202C6.23397 19.1468 13.778 19.1468 16.7956 13.9202C17.4837 12.7283 17.846 11.3764 17.846 10.0002C17.8414 5.67214 14.334 2.16473 10.006 2.16016ZM14.2275 10.6032H11.4617L13.4481 12.5889C13.7765 12.9173 13.6262 13.4782 13.1776 13.5984C12.9693 13.6542 12.7471 13.5947 12.5947 13.4422L9.57932 10.4268C9.25086 10.0987 9.40074 9.53812 9.84911 9.41771C9.90027 9.40398 9.95302 9.39704 10.006 9.39708H14.2275C14.6918 9.39708 14.9819 9.89964 14.7498 10.3017C14.6421 10.4883 14.443 10.6032 14.2275 10.6032Z"
                      fill="black"
                    />
                  </G>
                </Svg>
                <Text style={styles.metaText}>{vendor.years_in_business} years in business</Text>
              </View>
            )}
            <View style={[styles.metaItem, vendor.years_in_business !== undefined && { marginTop: 8 }]}>
              <Svg width={20} height={20} viewBox="0 0 20 20" fill="none" style={{ marginRight: 6 }}>
                <G opacity={0.7}>
                  <Path
                    d="M9.99991 2.36328C6.5994 2.36714 3.8437 5.12284 3.83984 8.52334C3.83984 13.7944 9.4399 17.7753 9.67861 17.9419C9.87149 18.0771 10.1283 18.0771 10.3212 17.9419C10.5599 17.7753 16.16 13.7944 16.16 8.52334C16.1561 5.12284 13.4004 2.36714 9.99991 2.36328ZM9.99991 6.28332C11.7243 6.28332 12.802 8.15001 11.9398 9.64336C11.0776 11.1367 8.92218 11.1367 8.05999 9.64336C7.86339 9.30282 7.75988 8.91655 7.75988 8.52334C7.75988 7.28618 8.76274 6.28326 9.99991 6.28332Z"
                    fill="black"
                  />
                </G>
              </Svg>
              <Text style={styles.metaText}>{formatDistance(calculatedDistance)}</Text>
            </View>
          </View>
        </View>

        {/* Business Categories Section */}
        {vendorCategories.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.categoriesTitle}>Business Categories</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsContainer}>
              {vendorCategories.map((cat: string, index: number) => (
                <View key={index} style={styles.categoryPill}>
                  <Text style={styles.categoryPillText}>{cat}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Gallery Section */}
        {galleryImages.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Gallery</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.galleryContainer}>
              {galleryImages.map((photo: string, index: number) => (
                <TouchableOpacity key={index} activeOpacity={0.85} onPress={() => setSelectedImage(photo)}>
                  <Image source={{ uri: photo }} style={styles.galleryPhoto} contentFit="cover" cachePolicy="memory-disk" />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Address Section */}
        {!!vendor.full_address && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Address</Text>
            <Text style={styles.addressText}>{vendor.full_address}</Text>
          </View>
        )}

        {/* Business Hours Section */}
        {!!vendor.business_hours && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderInline}>
              <Ionicons name="time-outline" size={18} color="#FF6600" style={{ marginRight: 8 }} />
              <Text style={styles.sectionTitleNoMargin}>Business Hours</Text>
            </View>
            <View style={styles.scheduleStack}>
              {vendor.business_hours.split(',').map((line: string, index: number) => (
                <Text key={index} style={styles.scheduleLineText}>
                  {line.trim()}
                </Text>
              ))}
            </View>
          </View>
        )}

        {/* Offers & Deals Section */}
        {!!vendor.offers && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderInline}>
              <Svg width={15.363} height={15.398} viewBox="0 0 24 24" fill="none" style={{ marginRight: 8 }}>
                <Path
                  d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z M5 5a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"
                  fill="#FF6600"
                />
              </Svg>
              <Text style={styles.sectionTitleNoMargin}>Offers & Deals</Text>
            </View>
            <Text style={styles.offerText}>{vendor.offers}</Text>
          </View>
        )}

        {/* Connect Section */}
        {!!(vendor.business_email || vendor.website_link || vendor.social_media?.instagram || vendor.social_media?.whatsapp) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Connect</Text>
            
            {!!vendor.business_email && (
              <TouchableOpacity style={styles.connectRow} onPress={() => vendor.business_email && Linking.openURL(`mailto:${vendor.business_email}`)}>
                <Ionicons name="mail-outline" size={18} color="#FF6600" />
                <Text style={styles.connectLinkText}>{vendor.business_email}</Text>
              </TouchableOpacity>
            )}

            {!!vendor.website_link && (
              <TouchableOpacity style={styles.connectRow} onPress={() => vendor.website_link && openExternalUrl(vendor.website_link)}>
                <Ionicons name="globe-outline" size={18} color="#FF6600" />
                <Text style={styles.connectLinkText}>{vendor.website_link}</Text>
              </TouchableOpacity>
            )}
            
            {!!vendor.social_media?.instagram && (
              <TouchableOpacity style={styles.connectRow} onPress={() => {
                let instaVal = (vendor.social_media?.instagram || '').trim();
                if (/^https?:\/\//i.test(instaVal)) {
                  openExternalUrl(instaVal);
                } else {
                  const cleanHandle = instaVal.replace(/^@/, '');
                  openExternalUrl(`https://instagram.com/${cleanHandle}`);
                }
              }}>
                <Ionicons name="logo-instagram" size={18} color="#FF6600" />
                <Text style={styles.connectLinkText}>
                  {(() => {
                    const raw = (vendor.social_media.instagram || '').trim();
                    if (/^https?:\/\//i.test(raw)) {
                      const match = raw.match(/instagram\.com\/([^\/\?]+)/i);
                      return match ? `@${match[1]}` : raw;
                    }
                    return raw.startsWith('@') ? raw : `@${raw}`;
                  })()}
                </Text>
              </TouchableOpacity>
            )}
            
            {!!vendor.social_media?.whatsapp && (
              <TouchableOpacity style={styles.connectRow} onPress={() => vendor.social_media?.whatsapp && Linking.openURL(`https://wa.me/${vendor.social_media.whatsapp}`)}>
                <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
                <Text style={styles.connectLinkText}>{vendor.social_media.whatsapp}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Spacing for floating bottom buttons */}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Floating Bottom Action Buttons */}
      <View style={[styles.bottomButtonsWrapper, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity style={styles.bottomButton} onPress={handleCall}>
          <Svg width={18} height={18} viewBox="0 0 18 18" fill="none" style={{ marginRight: 6 }}>
            <Path
              d="M10.8244 1.25358C10.9271 0.869279 11.3221 0.641165 11.7064 0.74418C14.4242 1.4533 16.5467 3.57577 17.2558 6.29361C17.3588 6.67786 17.1307 7.07283 16.7464 7.17562C16.6856 7.19159 16.623 7.19977 16.5601 7.19992C16.2341 7.20002 15.9487 6.98109 15.8644 6.66622C15.2863 4.44716 13.5536 2.7141 11.3347 2.13559C10.95 2.0332 10.7214 1.6381 10.8244 1.25358ZM10.6146 5.01561C11.8558 5.34681 12.6532 6.14511 12.9844 7.38622C13.0687 7.7011 13.3541 7.92003 13.6801 7.91993C13.7429 7.91977 13.8055 7.9116 13.8664 7.89562C14.2507 7.79284 14.4788 7.39786 14.3758 7.01362C13.915 5.28921 12.7108 4.085 10.9864 3.6242C10.4508 3.48113 9.96121 3.97147 10.1051 4.5068C10.1719 4.75525 10.3661 4.94921 10.6146 5.01561ZM17.1334 12.1014L12.8935 10.2014L12.8818 10.196C12.4346 10.0048 11.9211 10.0522 11.5165 10.322C11.493 10.3375 11.4705 10.3544 11.449 10.3724L9.25835 12.24C7.87054 11.5659 6.43773 10.1438 5.76363 8.77403L7.63384 6.55012C7.65184 6.52762 7.66894 6.50512 7.68514 6.48082C7.94914 6.07739 7.99374 5.56861 7.80394 5.12541V5.11461L5.89863 0.867478C5.64492 0.282025 5.03619 -0.0666615 4.40283 0.0106753C1.88001 0.342652 -0.00455487 2.49535 8.26879e-06 5.03991C8.26879e-06 12.186 5.81403 18 12.9601 18C15.5046 18.0046 17.6573 16.12 17.9893 13.5972C18.0668 12.964 17.7185 12.3554 17.1334 12.1014Z"
              fill="#F26522"
            />
          </Svg>
          <Text style={styles.bottomButtonText}>Call</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.bottomButton, { marginLeft: 13 }]} onPress={handleDirections}>
          <Svg width={19} height={19} viewBox="0 0 19 19" fill="none" style={{ marginRight: 6 }}>
            <Path
              d="M18.616 8.57296L10.427 0.384006C10.3053 0.262261 10.1608 0.165688 10.0017 0.0998001C9.84265 0.0339121 9.67217 0 9.5 0C9.32783 0 9.15735 0.0339121 8.99829 0.0998001C8.83923 0.165688 8.6947 0.262261 8.57296 0.384006L0.384006 8.57296C0.262261 8.6947 0.165688 8.83923 0.0998001 8.99829C0.0339121 9.15735 0 9.32783 0 9.5C0 9.67217 0.0339121 9.84265 0.0998001 10.0017C0.165688 10.1608 0.262261 10.3053 0.384006 10.427L8.57296 18.616C8.6947 18.7377 8.83923 18.8343 8.99829 18.9002C9.15735 18.9661 9.32783 19 9.5 19C9.67217 19 9.84265 18.9661 10.0017 18.9002C10.1608 18.8343 10.3053 18.7377 10.427 18.616L18.616 10.427C18.7377 10.3053 18.8343 10.1608 18.9002 10.0017C18.9661 9.84265 19 9.67217 19 9.5C19 9.32783 18.9661 9.15735 18.9002 8.99829C18.8343 8.83923 18.7377 8.6947 18.616 8.57296ZM13.1147 9.31475L11.2147 11.2147C11.0959 11.3336 10.9347 11.4003 10.7667 11.4003C10.5986 11.4003 10.4374 11.3336 10.3186 11.2147C10.1997 11.0959 10.133 10.9347 10.133 10.7667C10.133 10.5986 10.1997 10.4374 10.3186 10.3186L11.1379 9.5H8.23334C7.8974 9.5 7.57522 9.63345 7.33768 9.871C7.10013 10.1085 6.96668 10.4307 6.96668 10.7667V11.4C6.96668 11.568 6.89995 11.7291 6.78118 11.8478C6.66241 11.9666 6.50132 12.0333 6.33335 12.0333C6.16538 12.0333 6.00429 11.9666 5.88552 11.8478C5.76675 11.7291 5.70002 11.568 5.70002 11.4V10.7667C5.70002 10.0948 5.96692 9.45042 6.44201 8.97533C6.9171 8.50024 7.56146 8.23334 8.23334 8.23334H11.1379L10.3186 7.41476C10.1997 7.29592 10.133 7.13474 10.133 6.96668C10.133 6.79862 10.1997 6.63744 10.3186 6.5186C10.4374 6.39976 10.5986 6.333 10.7667 6.333C10.9347 6.333 11.0959 6.39976 11.2147 6.5186L13.1147 8.41859C13.1736 8.47741 13.2203 8.54726 13.2522 8.62414C13.2841 8.70103 13.3005 8.78344 13.3005 8.86667C13.3005 8.9499 13.2841 9.03231 13.2522 9.1092C13.2203 9.18608 13.1736 9.25593 13.1147 9.31475Z"
              fill="#F26522"
            />
          </Svg>
          <Text style={styles.bottomButtonText}>Get Directions</Text>
        </TouchableOpacity>
      </View>

      {/* Fullscreen Image View Modal */}
      <Modal
        visible={!!selectedImage}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedImage(null)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.modalCloseButton} onPress={() => setSelectedImage(null)} activeOpacity={0.7}>
            <Ionicons name="close" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          {selectedImage && (
            <Image
              source={{ uri: selectedImage }}
              style={styles.fullImage}
              contentFit="contain"
              transition={0}
              cachePolicy="memory-disk"
            />
          )}
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: SPACING.md,
    color: '#6B7280',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  errorHeader: {
    padding: 16,
  },
  errorContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
  },
  headerContainer: {
    backgroundColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  headerLeftCol: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  kycRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  kycVerifiedText: {
    color: '#000000',
    fontSize: 24,
    fontWeight: '700',
    fontStyle: 'normal',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro' : 'System',
  },
  requestCallBtn: {
    display: 'flex',
    backgroundColor: '#FF6600',
    width: 152,
    height: 35,
    borderRadius: 17.5,
    paddingTop: 10,
    paddingRight: 16,
    paddingBottom: 9,
    paddingLeft: 17,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginTop: 0,
  },
  requestCallBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro' : 'System',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  bannerContainer: {
    width: '100%',
    height: 260,
    flexShrink: 0,
    backgroundColor: '#1A1A1A',
    overflow: 'hidden',
  },
  bannerImageWrapper: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    right: 20,
    zIndex: 10,
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
  },
  fullImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 1.25,
    maxHeight: '80%',
  },
  bannerPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFEFE5',
  },
  titleSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: 'transparent',
  },
  businessHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
  },
  businessNameCol: {
    flex: 1,
    paddingRight: 12,
  },
  businessName: {
    fontSize: 30,
    fontWeight: '700',
    color: '#000000',
    lineHeight: 36,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro' : 'System',
  },
  ownerName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
    lineHeight: 24,
    marginTop: 4,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro' : 'System',
  },
  communityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6FFEB',
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 9999,
    marginTop: 12,
  },
  communityBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#00E100',
    lineHeight: 20,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro' : 'System',
  },
  businessDescriptionText: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '400',
    lineHeight: 20,
    marginTop: 12,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro' : 'System',
  },
  metaRow: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    marginTop: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '500',
    lineHeight: 20,
    marginLeft: 6,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro' : 'System',
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: 'transparent',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  categoriesTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    lineHeight: 28,
    marginBottom: 12,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro' : 'System',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    lineHeight: 28,
    marginBottom: 12,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro' : 'System',
  },
  sectionTitleNoMargin: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    lineHeight: 28,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro' : 'System',
  },
  sectionHeaderInline: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  pillsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  categoryPill: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FFEDD5',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 9999,
  },
  categoryPillText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FF6B00',
    lineHeight: 20,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro' : 'System',
  },
  galleryContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  galleryPhoto: {
    width: 128,
    height: 176,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  addressText: {
    fontSize: 16,
    fontWeight: '400',
    color: '#4B5563',
    lineHeight: 26,
    flexWrap: 'wrap',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  scheduleStack: {
    flexDirection: 'column',
    gap: 4,
  },
  scheduleLineText: {
    fontSize: 16,
    fontWeight: '400',
    color: '#4B5563',
    lineHeight: 24,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  offerText: {
    fontSize: 16,
    fontWeight: '400',
    color: '#4B5563',
    lineHeight: 24,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  connectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 45,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingVertical: 12,
  },
  connectLinkText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FF6600',
    lineHeight: 20,
    marginLeft: 8,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  bottomButtonsWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFF8F0',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  bottomButton: {
    width: 174,
    height: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOpacity: 0.15,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
      },
      android: {
        elevation: 4,
      },
    }),
  },
  bottomButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F26522',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
});
