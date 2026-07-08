import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Keyboard,
  Image,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/theme';
import * as Location from 'expo-location';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { DEFAULT_CATEGORIES } from '../store/vendorStore';
import * as ImagePicker from 'expo-image-picker';
import Svg, { Path } from 'react-native-svg';
import api from '../services/api';


const AddressIcon = ({ width = 24, height = 24, color = '#94A3B8' }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Path 
      d="M23.2 11.2H20.763C20.5734 9.15211 19.6735 7.23501 18.2193 5.78074C16.765 4.32646 14.8479 3.4266 12.8 3.237V0.8C12.8 0.587827 12.7157 0.384344 12.5657 0.234315C12.4157 0.0842854 12.2122 0 12 0C11.7878 0 11.5843 0.0842854 11.4343 0.234315C11.2843 0.384344 11.2 0.587827 11.2 0.8V3.237C9.15211 3.4266 7.23501 4.32646 5.78074 5.78074C4.32646 7.23501 3.4266 9.15211 3.237 11.2H0.8C0.587827 11.2 0.384344 11.2843 0.234315 11.4343C0.0842854 11.5843 0 11.7878 0 12C0 12.2122 0.0842854 12.4157 0.234315 12.5657C0.384344 12.7157 0.587827 12.8 0.8 12.8H3.237C3.4266 14.8479 4.32646 16.765 5.78074 18.2193C7.23501 19.6735 9.15211 20.5734 11.2 20.763V23.2C11.2 23.4122 11.2843 23.6157 11.4343 23.7657C11.5843 23.9157 11.7878 24 12 24C12.2122 24 12.4157 23.9157 12.5657 23.7657C12.7157 23.6157 12.8 23.4122 12.8 23.2V20.763C14.8479 20.5734 16.765 19.6735 18.2193 18.2193C19.6735 16.765 20.5734 14.8479 20.763 12.8H23.2C23.4122 12.8 23.6157 12.7157 23.7657 12.5657C23.9157 12.4157 24 12.2122 24 12C24 11.7878 23.9157 11.5843 23.7657 11.4343C23.6157 11.2843 23.4122 11.2 23.2 11.2ZM12 19.2C10.576 19.2 9.18393 18.7777 7.99989 17.9866C6.81586 17.1954 5.89302 16.0709 5.34807 14.7553C4.80312 13.4397 4.66053 11.992 4.93835 10.5954C5.21616 9.19869 5.90189 7.91577 6.90883 6.90883C7.91577 5.90189 9.19869 5.21616 10.5954 4.93835C11.992 4.66053 13.4397 4.80312 14.7553 5.34807C16.0709 5.89302 17.1954 6.81586 17.9866 7.99989C18.7777 9.18393 19.2 10.576 19.2 12C19.1979 13.9089 18.4386 15.739 17.0888 17.0888C15.739 18.4386 13.9089 19.1979 12 19.2ZM12 8C11.2089 8 10.4355 8.2346 9.77772 8.67412C9.11992 9.11365 8.60723 9.73836 8.30448 10.4693C8.00173 11.2002 7.92252 12.0044 8.07686 12.7804C8.2312 13.5563 8.61216 14.269 9.17157 14.8284C9.73098 15.3878 10.4437 15.7688 11.2196 15.9231C11.9956 16.0775 12.7998 15.9983 13.5307 15.6955C14.2616 15.3928 14.8864 14.8801 15.3259 14.2223C15.7654 13.5645 16 12.7911 16 12C16 10.9391 15.5786 9.92172 14.8284 9.17157C14.0783 8.42143 13.0609 8 12 8ZM12 14.4C11.5253 14.4 11.0613 14.2592 10.6666 13.9955C10.272 13.7318 9.96434 13.357 9.78269 12.9184C9.60104 12.4799 9.55351 11.9973 9.64612 11.5318C9.73872 11.0662 9.9673 10.6386 10.3029 10.3029C10.6386 9.9673 11.0662 9.73872 11.5318 9.64612C11.9973 9.55351 12.4799 9.60104 12.9184 9.78269C13.357 9.96434 13.7318 10.272 13.9955 10.6666C14.2592 11.0613 14.4 11.5253 14.4 12C14.4 12.6365 14.1471 13.247 13.6971 13.6971C13.247 14.1471 12.6365 14.4 12 14.4Z" 
      fill={color}
    />
  </Svg>
);

const RegisterBusinessIcon = ({ width = 24, height = 24, strokeColor = '#F97316' }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Path 
      d="M19 21V5C19 3.89617 18.1038 3 17 3H7C5.89617 3 5 3.89617 5 5V21M19 21H21M19 21H14M5 21H3M5 21H10M9 7H10M9 11H10M14 7H15M14 11H15M10 21V16C10 15.4481 10.4481 15 11 15H13C13.5519 15 14 15.4481 14 16V21M10 21H14" 
      stroke={strokeColor} 
      strokeWidth={2} 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </Svg>
);

const CategorySelectorIcon = () => (
  <Svg width={40} height={40} viewBox="0 0 40 40" fill="none">
    <Path 
      d="M30.7778 34V8.22222C30.7778 6.44383 29.3339 5 27.5556 5H11.4444C9.66605 5 8.22222 6.44383 8.22222 8.22222V34M30.7778 34H34M30.7778 34H22.7222M8.22222 34H5M8.22222 34H16.2778M22.7222 34V25.9444C22.7222 25.0552 22.0003 24.3333 21.1111 24.3333H17.8889C16.9997 24.3333 16.2778 25.0552 16.2778 25.9444V34M22.7222 34H16.2778M14.6667 11.4444H16.2778M14.6667 17.8889H16.2778M22.7222 11.4444H24.3333M22.7222 17.8889H24.3333" 
      stroke="white" 
      strokeWidth={2} 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </Svg>
);

const DEFAULT_SUBCATEGORIES = [
  'Pooja', 'Havan', 'Marriage', 'Astrology', 'Home Delivery', 
  'Cash on Delivery', 'Personal Training', 'Therapy', 'Consultation',
  'Cardio', 'Strength Training', 'Spa', 'Facial', 'Hair Styling',
  'Catering', 'Desserts', 'Plumbing', 'Wiring', 'Repairs'
];

const COUNTRY_CODES = [
  { code: '+91', label: '🇮🇳 +91' },
  { code: '+1', label: '🇺🇸 +1' },
  { code: '+44', label: '🇬🇧 +44' },
  { code: '+971', label: '🇦🇪 +971' },
  { code: '+61', label: '🇦🇺 +61' },
  { code: '+65', label: '🇸🇬 +65' },
  { code: '+977', label: '🇳🇵 +977' },
  { code: '+880', label: '🇧🇩 +880' },
  { code: '+92', label: '🇵🇰 +92' },
  { code: '+94', label: '🇱🇰 +94' },
  { code: '+62', label: '🇮🇩 +62' },
  { code: '+60', label: '🇲🇾 +60' },
  { code: '+86', label: '🇨🇳 +86' },
  { code: '+81', label: '🇯🇵 +81' },
];

const ALL_FIGMA_CATEGORIES = [
  'Kirana Stores',
  'Grocery Stores',
  'Dairy Shops',
  'Fruits & Vegetable Vendors',
  'Bakeries',
  'Sweet Shops',
  'Stationery Stores',
  'General Stores',
  'Electricians',
  'Plumbers',
  'Carpenters',
  'Painters',
  'House Cleaners',
  'Pest Control',
  'AC Repair',
  'Appliance Repair',
  'Maid Services',
  'Packers & Movers',
  'Mechanics',
  'Car Wash',
  'Bike Repair',
  'Tyre Shops',
  'Auto Electricians',
  'Towing Services',
  'Medical Stores',
  'Clinics',
  'Doctors',
  'Dentists',
  'Physiotherapists',
  'Fitness Trainers',
  'Yoga Instructors',
  'Salons',
  'Barbers',
  'Beauticians',
  'Makeup Artists',
  'Spa Services',
  'Pandits',
  'Astrologers',
  'Vastu Consultants',
  'Pooja Samagri Stores',
  'Temple Services',
  'Bhajan/Kirtan Groups',
  'Yagya & Ritual Services',
  'Restaurants',
  'Tiffin Services',
  'Home Chefs',
  'Caterers',
  'Street Food Vendors',
  'Juice Centers',
  'Tea Stalls',
  'Tutors',
  'Coaching Classes',
  'Music Teachers',
  'Dance Teachers',
  'Language Trainers',
  'Cow Seva & Animal Care',
  'Gaushalas',
  'Veterinary Doctors',
  'Animal Rescue Volunteers',
  'Professional Services',
  'Chartered Accountants',
  'Lawyers',
  'Insurance Agents',
  'Financial Advisors',
  'Digital Marketing Agencies',
  'IT Services',
  'Packaging Suppliers',
  'Plastic Manufacturers',
  'Industrial Suppliers',
  'Courier Services',
  'BPO Services',
  'Wholesale Traders'
];

let MapView: any = null;
let PROVIDER_GOOGLE: any = null;
if (Platform.OS !== 'web') {
  try {
    const Maps = require('react-native-maps');
    MapView = Maps.default || Maps;
    PROVIDER_GOOGLE = Maps.PROVIDER_GOOGLE;
  } catch (e) {
    console.warn('Native maps failed to load:', e);
  }
}

const getWebMapHtml = (lat: number, lng: number) => `
<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <script src="https://maps.googleapis.com/maps/api/js?key=AIzaSyBK-mmtVFjREbCAP8Ea_a5RfsL4uCAoSUs&libraries=places"></script>
    <style>
      body, html { margin: 0; padding: 0; width: 100%; height: 100%; font-family: sans-serif; }
      #map { width: 100%; height: calc(100% - 70px); }
      #search-box {
        position: absolute; top: 10px; left: 10px; right: 10px; z-index: 5;
        background: #fff; padding: 10px; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      }
      #search-input {
        width: 100%; border: none; outline: none; font-size: 16px;
      }
      #footer {
        position: absolute; bottom: 0; left: 0; right: 0; height: 70px;
        background: #fff; display: flex; align-items: center; justify-content: center;
        box-shadow: 0 -2px 10px rgba(0,0,0,0.1);
      }
      button {
        background: #FF3B30; color: #fff; border: none; padding: 14px 24px;
        border-radius: 8px; font-size: 16px; font-weight: bold; width: 90%; cursor: pointer;
      }
      .center-marker {
        position: absolute; top: 50%; left: 50%; transform: translate(-50%, -100%);
        z-index: 1000; margin-top: -35px; pointer-events: none;
      }
      .pac-container {
        z-index: 10000 !important;
      }
    </style>
  </head>
  <body>
    <div id="search-box">
      <input id="search-input" type="text" placeholder="Search for location" />
    </div>
    <div id="map"></div>
    <div class="center-marker">
      <svg width="36" height="36" viewBox="0 0 24 24" fill="#FF3B30">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
      </svg>
    </div>
    <div id="footer">
      <button onclick="confirmLocation()" id="confirmBtn">Confirm Location</button>
    </div>
    <script>
      let map;
      let centerPos = { lat: ${lat}, lng: ${lng} };
      
      function initMap() {
        map = new google.maps.Map(document.getElementById('map'), {
          center: centerPos,
          zoom: 15,
          disableDefaultUI: true,
          zoomControl: true,
        });

        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              map.setCenter({ lat: position.coords.latitude, lng: position.coords.longitude });
            },
            () => {},
            { timeout: 5000 }
          );
        }

        const input = document.getElementById('search-input');
        const searchBox = new google.maps.places.SearchBox(input);

        map.addListener('bounds_changed', () => {
          searchBox.setBounds(map.getBounds());
        });

        searchBox.addListener('places_changed', () => {
          const places = searchBox.getPlaces();
          if (places.length == 0) return;
          const bounds = new google.maps.LatLngBounds();
          places.forEach((place) => {
            if (!place.geometry || !place.geometry.location) return;
            if (place.geometry.viewport) {
              bounds.union(place.geometry.viewport);
            } else {
              bounds.extend(place.geometry.location);
            }
          });
          map.fitBounds(bounds);
        });
      }

      function confirmLocation() {
        var btn = document.getElementById('confirmBtn');
        btn.innerText = "Loading...";
        btn.disabled = true;

        const center = map.getCenter();
        const lat = center.lat();
        const lng = center.lng();
        
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
          if (status === 'OK' && results[0]) {
            const address = results[0].formatted_address;
            window.parent.postMessage(JSON.stringify({
              type: 'capture',
              latitude: lat,
              longitude: lng,
              address: address
            }), '*');
          } else {
            window.parent.postMessage(JSON.stringify({
              type: 'error',
              message: 'Could not fetch address'
            }), '*');
            btn.innerText = "Confirm Location";
            btn.disabled = false;
          }
        });
      }
      
      window.onload = initMap;
    </script>
  </body>
</html>
`;

const WEB_MAP_HTML_DEFAULT = getWebMapHtml(19.0760, 72.8777);

interface VendorRegistrationModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
}

export const VendorRegistrationModal: React.FC<VendorRegistrationModalProps> = ({
  visible,
  onClose,
  onSubmit,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [businessName, setBusinessName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);

  const [yearsInBusiness, setYearsInBusiness] = useState('');
  const [address, setAddress] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedPhotos, setSelectedPhotos] = useState<{ uri: string; name: string; type: string }[]>([]);
  const [showCategorySelector, setShowCategorySelector] = useState(false);
  const [selectedTempCategories, setSelectedTempCategories] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [customCategoryQuery, setCustomCategoryQuery] = useState('');



  const pickBusinessPhotos = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== 'granted') {
      Alert.alert('Permission Denied', 'Media library access is required to upload photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.length) return;

    const newPhotos = result.assets.map(asset => {
      const fileName = (asset as any).fileName || `business-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.jpg`;
      const mimeType = asset.mimeType || 'image/jpeg';
      return {
        uri: asset.uri,
        name: fileName,
        type: mimeType,
      };
    });

    setSelectedPhotos(prev => [...prev, ...newPhotos]);
  };

  const removePhoto = (index: number) => {
    setSelectedPhotos(prev => prev.filter((_, i) => i !== index));
  };
  const [categoryInput, setCategoryInput] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  const [subCategories, setSubCategories] = useState<string[]>([]);
  const [subCategoryInput, setSubCategoryInput] = useState('');
  const [showSubCategoryDropdown, setShowSubCategoryDropdown] = useState(false);

  const filteredCategories = categoryInput.trim()
    ? DEFAULT_CATEGORIES.filter(c => 
        c.toLowerCase().includes(categoryInput.toLowerCase()) && 
        !categories.includes(c)
      )
    : DEFAULT_CATEGORIES.filter(c => !categories.includes(c));

  const filteredSubCategories = subCategoryInput.trim()
    ? DEFAULT_SUBCATEGORIES.filter(c => 
        c.toLowerCase().includes(subCategoryInput.toLowerCase()) && 
        !subCategories.includes(c)
      )
    : DEFAULT_SUBCATEGORIES.filter(c => !subCategories.includes(c));

  const [mapPickerVisible, setMapPickerVisible] = useState(false);
  const [mapRegion, setMapRegion] = useState<any>(null);
  const vendorMapRef = React.useRef<any>(null);

  React.useEffect(() => {
    if (Platform.OS === 'web' && mapPickerVisible) {
      const handleWebMessage = (event: any) => {
        try {
          if (typeof event.data !== 'string') return;
          const payload = JSON.parse(event.data);
          if (payload.type === 'capture') {
            setAddress(payload.address);
            setMapPickerVisible(false);
          } else if (payload.type === 'error') {
            Alert.alert('Error', payload.message);
          }
        } catch (e) {}
      };
      window.addEventListener('message', handleWebMessage);
      return () => window.removeEventListener('message', handleWebMessage);
    }
  }, [mapPickerVisible]);

  const detectLocation = async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required.');
        return;
      }
      const location = await Location.getCurrentPositionAsync({});
      const lat = location.coords.latitude;
      const lng = location.coords.longitude;
      
      const geocoded = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      if (geocoded.length > 0) {
        const place = geocoded[0];
        const components = [
          place.name,
          place.streetNumber,
          place.street,
          place.district,
          place.city,
          place.subregion,
          place.region,
          place.postalCode,
          place.country
        ];
        const uniqueComponents = [...new Set(components.filter(Boolean))];
        const addr = uniqueComponents.join(', ');
        setAddress(addr);
      } else {
        Alert.alert('Error', 'Could not determine address from location.');
      }
    } catch (error) {
      Alert.alert('Error', 'Unable to get location.');
    } finally {
      setLoading(false);
    }
  };

  const openMap = async () => {
    if (Platform.OS !== 'web' && !MapView) {
      Alert.alert('Unavailable', 'Map functionality is currently unavailable.');
      return;
    }
    
    // Set a default fallback immediately so the map renders while waiting
    if (!mapRegion) {
      setMapRegion({ latitude: 19.0760, longitude: 72.8777, latitudeDelta: 0.05, longitudeDelta: 0.05 });
    }
    
    // Open immediately to prevent blocking UI
    setMapPickerVisible(true);

    try {
      let { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        const res = await Location.requestForegroundPermissionsAsync();
        status = res.status;
      }

      if (status === 'granted') {
        const locationPromise = Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const timeoutPromise = new Promise<any>((_, reject) => setTimeout(() => reject(new Error('timeout')), 4000));
        
        const location: any = await Promise.race([locationPromise, timeoutPromise]);
        const lat = parseFloat(location.coords.latitude as any);
        const lng = parseFloat(location.coords.longitude as any);
        if (!isNaN(lat) && !isNaN(lng)) {
          const newRegion = {
            latitude: lat,
            longitude: lng,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          };
          setMapRegion(newRegion);
          setTimeout(() => {
            if (vendorMapRef.current) {
              vendorMapRef.current.animateToRegion(newRegion, 1000);
            }
          }, 500);
        }
      }
    } catch (e) {
      // Keep default mapRegion if location fetching fails
      console.warn('Location error in openMap:', e);
    }
  };



  const handleMapConfirm = async () => {
    if (!mapRegion) {
      setMapPickerVisible(false);
      return;
    }
    setLoading(true);
    try {
      const geocoded = await Location.reverseGeocodeAsync({ 
        latitude: mapRegion.latitude, 
        longitude: mapRegion.longitude 
      });
      if (geocoded.length > 0) {
        const place = geocoded[0];
        const components = [
          place.name,
          place.streetNumber,
          place.street,
          place.district,
          place.city,
          place.subregion,
          place.region,
          place.postalCode,
          place.country
        ];
        const uniqueComponents = [...new Set(components.filter(Boolean))];
        const addr = uniqueComponents.join(', ');
        setAddress(addr);
      } else {
        Alert.alert('Error', 'Could not get address for selected location.');
      }
    } catch (error) {
      Alert.alert('Error', 'Could not get address for selected location.');
    } finally {
      setLoading(false);
      setMapPickerVisible(false);
    }
  };

  const resetForm = () => {
    setBusinessName('');
    setOwnerName('');
    setPhoneNumber('');
    setCountryCode('+91');
    setShowCountryDropdown(false);
    setYearsInBusiness('');
    setAddress('');
    setCategories([]);
    setCategoryInput('');
    setSubCategories([]);
    setSubCategoryInput('');
    setSelectedPhotos([]);
  };

  const handleSubmit = async () => {
    setErrorMsg('');
    Keyboard.dismiss();
    
    const trimmedBusinessName = businessName.trim();
    const trimmedOwnerName = ownerName.trim();
    const trimmedPhone = phoneNumber.trim();
    const trimmedAddress = address.trim();

    console.log('Form Data:', {
      businessName: trimmedBusinessName,
      ownerName: trimmedOwnerName,
      phone: trimmedPhone,
      years: yearsInBusiness,
      address: trimmedAddress,
    });



    const businessNameRegex = /^[a-zA-Z0-9\u0900-\u097F\s&.,'-\/]{2,100}$/;
    const ownerNameRegex = /^[a-zA-Z\u0900-\u097F\s.'-]{2,100}$/;
    const addressRegex = /^[a-zA-Z0-9\u0900-\u097F\s.,'#\-\/()]{5,250}$/;
    const phoneRegex = /^\d+$/;

    // Validation
    if (!trimmedBusinessName) {
      setErrorMsg('Business name is required');
      return;
    }
    if (!businessNameRegex.test(trimmedBusinessName)) {
      setErrorMsg('Business name must be 2 to 100 characters and contain only letters, numbers, spaces, and basic symbols (&.,\'-/)');
      return;
    }

    if (!trimmedOwnerName) {
      setErrorMsg('Owner name is required');
      return;
    }
    if (!ownerNameRegex.test(trimmedOwnerName)) {
      setErrorMsg('Owner name must be 2 to 100 characters and contain only letters, spaces, dots, and hyphens');
      return;
    }

    if (!trimmedPhone) {
      setErrorMsg('Phone number is required');
      return;
    }
    if (!phoneRegex.test(trimmedPhone)) {
      setErrorMsg('Phone number must contain only digits');
      return;
    }
    if (countryCode === '+91' && trimmedPhone.length !== 10) {
      setErrorMsg('Indian phone numbers must be exactly 10 digits');
      return;
    }
    if (trimmedPhone.length < 7 || trimmedPhone.length > 15) {
      setErrorMsg('Phone number must be between 7 and 15 digits');
      return;
    }

    let cleanedPhone = trimmedPhone;
    if (cleanedPhone.startsWith('0')) {
      cleanedPhone = cleanedPhone.substring(1);
    }
    const fullPhone = countryCode + cleanedPhone;

    if (!yearsInBusiness) {
      setErrorMsg('Years in business is required');
      return;
    }
    const yearsNum = parseInt(yearsInBusiness, 10);
    if (isNaN(yearsNum) || yearsNum < 0 || yearsNum > 99) {
      setErrorMsg('Years in business must be a valid number between 0 and 99');
      return;
    }

    if (categories.length === 0) {
      setErrorMsg('Please select at least one category');
      return;
    }

    if (!trimmedAddress) {
      setErrorMsg('Address is required');
      return;
    }
    if (!addressRegex.test(trimmedAddress)) {
      setErrorMsg('Address must be between 5 and 250 characters and can only contain letters, numbers, spaces, and basic symbols (.,\'#-/())');
      return;
    }

    if (selectedPhotos.length < 2) {
      setErrorMsg('Please upload at least 2 business photos');
      return;
    }

    console.log('Validation passed');

    const mergedCategories = [...categories, ...subCategories].filter(Boolean).slice(0, 5);

    const payload = {
      businessName: trimmedBusinessName,
      ownerName: trimmedOwnerName,
      phoneNumber: fullPhone,
      yearsInBusiness: parseInt(yearsInBusiness, 10),
      address: trimmedAddress,
      categories: mergedCategories,
      photos: selectedPhotos,
    };

    if (!onSubmit) {
      console.error('onSubmit is undefined!');
      setErrorMsg('Submit function is not available');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(payload);
      resetForm();
      // Parent (handleRegisterVendor) handles modal close and navigation
    } catch (error: any) {
      console.error('Submit error:', error);
      let errMsg = error?.message || 'Registration failed';
      if (error?.response?.data?.detail) {
        errMsg = Array.isArray(error.response.data.detail)
          ? error.response.data.detail[0].msg
          : error.response.data.detail;
      }
      setErrorMsg(String(errMsg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType={Platform.OS === 'android' ? 'fade' : 'slide'}
      hardwareAccelerated={Platform.OS === 'android'}
      statusBarTranslucent={Platform.OS === 'android'}
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <SafeAreaView style={styles.container} edges={['bottom']}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconBg}>
                <RegisterBusinessIcon />
              </View>
              <Text style={styles.headerTitle}>Register Your Business</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.form} 
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Business Name */}
            <Text style={styles.label}>Business Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter business name"
              placeholderTextColor={COLORS.textLight}
              value={businessName}
              onChangeText={(text) => {
                const filtered = text.replace(/[^a-zA-Z0-9\s&.,'-\/]/g, '');
                const capitalized = filtered
                  .split(' ')
                  .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(' ');
                setBusinessName(capitalized.slice(0, 50));
              }}
            />

            {/* Owner Name */}
            <Text style={styles.label}>Owner Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter owner name"
              placeholderTextColor={COLORS.textLight}
              value={ownerName}
              onChangeText={(text) => {
                const filtered = text.replace(/[^a-zA-Z\s.'-]/g, '');
                const capitalized = filtered
                  .split(' ')
                  .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(' ');
                setOwnerName(capitalized.slice(0, 50));
              }}
            />

            {/* Phone Number */}
            <Text style={styles.label}>Mobile Number *</Text>
            <View style={{ flexDirection: 'row', gap: 8, zIndex: 30, position: 'relative' }}>
              <TouchableOpacity 
                style={[styles.input, { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', width: 90, paddingHorizontal: 8 }]}
                onPress={() => setShowCountryDropdown(!showCountryDropdown)}
              >
                <Text style={{ fontSize: 15, color: COLORS.text, fontWeight: '500', marginRight: 4 }}>{countryCode}</Text>
                <Ionicons name={showCountryDropdown ? "chevron-up" : "chevron-down"} size={16} color={COLORS.textSecondary} />
              </TouchableOpacity>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Enter mobile number"
                placeholderTextColor={COLORS.textLight}
                value={phoneNumber}
                editable={true}
                onChangeText={(text) => {
                  const numericText = text.replace(/\D/g, '');
                  setPhoneNumber(numericText.slice(0, 15));
                }}
                keyboardType="phone-pad"
                maxLength={15}
              />
              
              {showCountryDropdown && (
                <View style={[styles.dropdownListContainer, { position: 'absolute', top: 52, left: 0, width: 140, zIndex: 100, maxHeight: 200 }]}>
                  <ScrollView nestedScrollEnabled={true} keyboardShouldPersistTaps="handled">
                    {COUNTRY_CODES.map((item) => (
                      <TouchableOpacity
                        key={item.code}
                        style={[styles.dropdownListItem, { paddingVertical: 10, paddingHorizontal: 12 }]}
                        onPress={() => {
                          setCountryCode(item.code);
                          setShowCountryDropdown(false);
                        }}
                      >
                        <Text style={{ fontSize: 14, color: COLORS.text }}>{item.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* Years in Business */}
            <Text style={styles.label}>Years in Business *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter years (e.g., 5)"
              placeholderTextColor={COLORS.textLight}
              value={yearsInBusiness}
              onChangeText={(text) => {
                const numericText = text.replace(/\D/g, '');
                setYearsInBusiness(numericText.slice(0, 2));
              }}
              keyboardType="number-pad"
              maxLength={2}
            />

            {/* Categories */}
            <Text style={styles.label}>Categories *</Text>
            <View style={{ marginBottom: SPACING.md }}>
              <TouchableOpacity 
                style={styles.dropdownInputContainer}
                onPress={() => {
                  setSelectedTempCategories(categories);
                  setShowCategorySelector(true);
                }}
              >
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Select categories"
                  placeholderTextColor={COLORS.textLight}
                  editable={false}
                  pointerEvents="none"
                  value={Platform.OS === 'android' ? categories.join(', ') : (categories.length > 0 ? `${categories.length} selected` : "")}
                />
                <View style={styles.dropdownToggleButton}>
                  <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
                </View>
              </TouchableOpacity>
            </View>

            {/* Selected Categories */}
            {categories.length > 0 && (
              <View style={[styles.selectedCategories, { marginBottom: SPACING.md }]}>
                {categories.map((cat, idx) => (
                  <View key={idx} style={styles.categoryTag}>
                    <Text style={styles.categoryTagText}>{cat}</Text>
                    <TouchableOpacity onPress={() => setCategories(categories.filter(c => c !== cat))}>
                      <Ionicons name="close-circle" size={16} color={COLORS.primary} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* Sub Categories */}
            <Text style={styles.label}>Sub Categories</Text>
            <View style={{ marginBottom: SPACING.md }}>
              <View style={styles.dropdownInputContainer}>
                <TextInput
                  style={[styles.input, { flex: 1, borderTopRightRadius: 0, borderBottomRightRadius: 0 }]}
                  placeholder="Select or search a subcategory"
                  placeholderTextColor={COLORS.textLight}
                  value={subCategoryInput}
                  onChangeText={(text) => {
                    const filtered = text.replace(/[^a-zA-Z\s]/g, '');
                    setSubCategoryInput(filtered.slice(0, 30));
                    setShowSubCategoryDropdown(true);
                  }}
                  onFocus={() => setShowSubCategoryDropdown(true)}
                  onSubmitEditing={() => {
                    const subCat = subCategoryInput.trim();
                    if (subCat && !subCategories.includes(subCat)) {
                      if (subCategories.length >= 5) {
                        Alert.alert('Limit reached', 'Maximum 5 sub categories allowed');
                        return;
                      }
                      setSubCategories([...subCategories, subCat]);
                    }
                    setSubCategoryInput('');
                    setShowSubCategoryDropdown(false);
                  }}
                />
                <TouchableOpacity
                  style={styles.dropdownToggleButton}
                  onPress={() => {
                    Keyboard.dismiss();
                    setShowSubCategoryDropdown(!showSubCategoryDropdown);
                  }}
                >
                  <Ionicons name={showSubCategoryDropdown ? 'chevron-up' : 'chevron-down'} size={20} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Sub Category Dropdown List */}
              {showSubCategoryDropdown && (
                <View style={styles.dropdownListContainer}>
                  <ScrollView
                    style={{ maxHeight: 200 }}
                    nestedScrollEnabled={true}
                    keyboardShouldPersistTaps="handled"
                  >
                    {filteredSubCategories.length > 0 ? (
                      filteredSubCategories.map((subCat) => (
                        <TouchableOpacity
                          key={subCat}
                          style={styles.dropdownListItem}
                          onPress={() => {
                            if (subCategories.length >= 5) {
                              Alert.alert('Limit reached', 'Maximum 5 sub categories allowed');
                              return;
                            }
                            setSubCategories([...subCategories, subCat]);
                            setSubCategoryInput('');
                            setShowSubCategoryDropdown(false);
                          }}
                        >
                          <Text style={styles.dropdownListItemText}>{subCat}</Text>
                          <Ionicons name="add" size={16} color={COLORS.primary} />
                        </TouchableOpacity>
                      ))
                    ) : (
                      <View style={styles.dropdownListEmpty}>
                        <Text style={styles.dropdownListEmptyText}>No matching subcategories</Text>
                      </View>
                    )}

                    {/* Add Custom Sub Category Option */}
                    {subCategoryInput.trim() && !filteredSubCategories.includes(subCategoryInput.trim()) && (
                      <TouchableOpacity
                        style={[styles.dropdownListItem, { borderTopWidth: 1, borderTopColor: COLORS.divider }]}
                        onPress={() => {
                          if (subCategories.length >= 5) {
                            Alert.alert('Limit reached', 'Maximum 5 sub categories allowed');
                            return;
                          }
                          setSubCategories([...subCategories, subCategoryInput.trim()]);
                          setSubCategoryInput('');
                          setShowSubCategoryDropdown(false);
                        }}
                      >
                        <Text style={[styles.dropdownListItemText, { color: COLORS.primary, fontWeight: '600' }]}>
                          Add "{subCategoryInput.trim()}"
                        </Text>
                        <Ionicons name="add-circle" size={18} color={COLORS.primary} />
                      </TouchableOpacity>
                    )}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* Selected Sub Categories */}
            {subCategories.length > 0 && (
              <View style={[styles.selectedCategories, { marginBottom: SPACING.md }]}>
                {subCategories.map((subCat, idx) => (
                  <View key={idx} style={styles.categoryTag}>
                    <Text style={styles.categoryTagText}>{subCat}</Text>
                    <TouchableOpacity onPress={() => setSubCategories(subCategories.filter(s => s !== subCat))}>
                      <Ionicons name="close-circle" size={16} color={COLORS.primary} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* Address */}
            <Text style={styles.label}>Full Address *</Text>
            <View style={{ position: 'relative', marginBottom: 16 }}>
              <TextInput
                style={styles.addressInput}
                placeholder="Enter complete business address"
                placeholderTextColor={COLORS.textLight}
                value={address}
                onChangeText={(text) => {
                  const filtered = text.replace(/[^a-zA-Z0-9\s.,'#\-\/()]/g, '');
                  setAddress(filtered.slice(0, 150));
                }}
              />
              <TouchableOpacity 
                style={{ position: 'absolute', right: 20, top: 16.5, zIndex: 10 }}
                onPress={detectLocation}
                disabled={loading}
              >
                <AddressIcon width={24} height={24} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            {/* Business Photos */}
            <Text style={styles.label}>Business Photos *</Text>
            <Text style={styles.photoSublabel}>Minimum 2 photos</Text>
            
            <TouchableOpacity 
              style={styles.uploadArea} 
              onPress={pickBusinessPhotos}
            >
              <View style={styles.cloudIconContainer}>
                <Ionicons name="cloud-upload" size={26} color="#FF6600" />
              </View>
              <Text style={styles.uploadTitle}>Upload Photos</Text>
              <Text style={styles.uploadSubtext}>(JPEG, PNG or PDF up to 5MB)</Text>
            </TouchableOpacity>

            {/* Selected Photos Previews */}
            {selectedPhotos.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.previewScroll}>
                {selectedPhotos.map((photo, index) => (
                  <View key={index} style={styles.previewWrapper}>
                    <Image source={{ uri: photo.uri }} style={styles.previewImage} />
                    <TouchableOpacity style={styles.removeBadge} onPress={() => removePhoto(index)}>
                      <Ionicons name="close" size={12} color="#FFF" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}

            {/* Inline Error Banner */}
            {!!errorMsg && (
              <View style={{
                backgroundColor: '#FEE2E2',
                borderRadius: 10,
                padding: 12,
                marginBottom: 12,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
              }}>
                <Ionicons name="alert-circle" size={18} color="#DC2626" />
                <Text style={{ color: '#DC2626', fontSize: 13, fontWeight: '600', flex: 1, flexWrap: 'wrap' }}>
                  {errorMsg}
                </Text>
              </View>
            )}

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitBtnText}>Register Business</Text>
              )}
            </TouchableOpacity>


            <View style={{ height: 40 }} />
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>

      {/* Map Picker Modal */}
      <Modal
        visible={mapPickerVisible}
        animationType={Platform.OS === 'android' ? 'fade' : 'slide'}
        hardwareAccelerated={Platform.OS === 'android'}
        statusBarTranslucent={Platform.OS === 'android'}
        presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : undefined}
        onRequestClose={() => setMapPickerVisible(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.surface }} edges={["top", "bottom"]}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <TouchableOpacity onPress={() => setMapPickerVisible(false)} style={{ marginRight: SPACING.md }}>
                <Ionicons name="arrow-back" size={24} color={COLORS.text} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Select Location</Text>
            </View>
          </View>
          
          {Platform.OS === 'web' ? (
            <View style={{ flex: 1, backgroundColor: COLORS.surface }}>
              {React.createElement('iframe', {
                title: 'Web Map Picker',
                srcDoc: WEB_MAP_HTML_DEFAULT,
                style: {
                  width: '100%',
                  height: '100%',
                  border: '0',
                  display: 'block',
                },
              } as any)}
            </View>
          ) : MapView && mapRegion ? (
            <View style={{ flex: 1 }}>
              <MapView
                ref={vendorMapRef}
                provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
                style={{ flex: 1 }}
                initialRegion={mapRegion}
                onRegionChangeComplete={(region: any) => setMapRegion(region)}
                showsUserLocation
                showsMyLocationButton={false}
              />
              <View style={{ position: 'absolute', top: 10, left: 10, right: 10, zIndex: 10 }}>
                <GooglePlacesAutocomplete
                  placeholder="Search for location"
                  fetchDetails={true}
                  keyboardShouldPersistTaps="handled"
                  onPress={(data, details = null) => {
                    if (details?.geometry?.location) {
                      const lat = parseFloat(details.geometry.location.lat as any);
                      const lng = parseFloat(details.geometry.location.lng as any);
                      if (!isNaN(lat) && !isNaN(lng)) {
                        const newRegion = {
                          latitude: lat,
                          longitude: lng,
                          latitudeDelta: 0.01,
                          longitudeDelta: 0.01,
                        };
                        setMapRegion(newRegion);
                        if (vendorMapRef.current) {
                          vendorMapRef.current.animateToRegion(newRegion, 1000);
                        }
                      }
                    }
                  }}
                  query={{
                    key: 'AIzaSyBK-mmtVFjREbCAP8Ea_a5RfsL4uCAoSUs',
                    language: 'en',
                  }}
                  styles={{
                    container: { flex: 1 },
                    listView: { position: 'absolute', top: 50, backgroundColor: 'white', borderRadius: 8, elevation: 5, zIndex: 20, width: '100%' },
                    textInput: { height: 44, borderRadius: 8, paddingHorizontal: 12, backgroundColor: '#FFF', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 5 },
                  }}
                />
              </View>
              <View style={{ position: 'absolute', top: '50%', left: '50%', marginLeft: -16, marginTop: -32 }} pointerEvents="none">
                <Ionicons name="location" size={36} color={COLORS.primary} />
              </View>
              <View style={{ position: 'absolute', bottom: 30, left: 20, right: 20 }}>
                <TouchableOpacity
                  style={[styles.submitBtn, { marginTop: 0, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5 }, loading && styles.submitBtnDisabled]}
                  onPress={handleMapConfirm}
                  disabled={loading}
                >
                  {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.submitBtnText}>Confirm Location</Text>}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ color: COLORS.text }}>Map unavailable.</Text>
            </View>
          )}
        </SafeAreaView>
      </Modal>

      {/* Full-Screen Category Selector Modal */}
      <Modal
        visible={showCategorySelector}
        animationType={Platform.OS === 'android' ? 'fade' : 'slide'}
        hardwareAccelerated={Platform.OS === 'android'}
        statusBarTranslucent={Platform.OS === 'android'}
        transparent={false}
        onRequestClose={() => {
          setCustomCategoryQuery('');
          setShowCategorySelector(false);
        }}
      >
        <SafeAreaView style={styles.selectorSafeArea}>
          <LinearGradient
            colors={['#FF8D57', '#EA9B76', '#FFEEE5']}
            locations={[0, 0.0913, 0.25]}
            style={styles.selectorGradient}
          >
            {/* Header */}
            <View style={styles.selectorHeader}>
              <TouchableOpacity
                style={styles.selectorBackButton}
                onPress={() => {
                  setCustomCategoryQuery('');
                  setShowCategorySelector(false);
                }}
              >
                <Ionicons name="chevron-back" size={24} color="#231917" />
              </TouchableOpacity>
              <View style={styles.selectorIconBg}>
                <CategorySelectorIcon />
              </View>
              <Text style={styles.selectorHeaderTitle}>Register Your Business</Text>
            </View>

            {/* Label */}
            <View style={styles.selectorLabelContainer}>
              <Text style={styles.selectorLabel}>
                Type of Service <Text style={{ color: '#BA1A1A' }}>*</Text>
              </Text>
            </View>

            {/* Search or Type Custom Category Input */}
            {Platform.OS === 'android' && (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 12, gap: 8 }}>
                <View style={[styles.selectorSearchContainer, { flex: 1, marginHorizontal: 0, marginBottom: 0 }]}>
                  <Ionicons name="search" size={20} color="#85736E" style={styles.selectorSearchIcon} />
                  <TextInput
                    style={styles.selectorSearchInput}
                    placeholder="Search or type a custom category"
                    placeholderTextColor="#85736E"
                    value={customCategoryQuery}
                    onChangeText={(text) => {
                      const filtered = text.replace(/[^a-zA-Z0-9\s&.,'-\/]/g, '');
                      setCustomCategoryQuery(filtered.slice(0, 40));
                    }}
                  />
                  {customCategoryQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setCustomCategoryQuery('')} style={{ marginRight: 4 }}>
                      <Ionicons name="close-circle" size={18} color="#85736E" />
                    </TouchableOpacity>
                  )}
                </View>
                {customCategoryQuery.trim().length > 0 && (
                  <TouchableOpacity
                    style={{
                      backgroundColor: '#F97316',
                      paddingHorizontal: 16,
                      height: 48,
                      borderRadius: 8,
                      justifyContent: 'center',
                      alignItems: 'center',
                      flexDirection: 'row',
                      gap: 4,
                    }}
                    onPress={() => {
                      const newCat = customCategoryQuery.trim();
                      if (selectedTempCategories.includes(newCat)) {
                        Alert.alert('Already Selected', 'This category is already selected.');
                        return;
                      }
                      if (selectedTempCategories.length >= 5) {
                        Alert.alert('Limit reached', 'Maximum 5 categories allowed');
                        return;
                      }
                      setSelectedTempCategories(prev => [...prev, newCat]);
                      setCustomCategoryQuery('');
                    }}
                  >
                    <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 14 }}>Add</Text>
                    <Ionicons name="add" size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Selected Temp Categories Tags inside selector modal */}
            {Platform.OS === 'android' && selectedTempCategories.length > 0 && (
              <View style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: 8,
                marginHorizontal: 16,
                marginBottom: 12,
              }}>
                {selectedTempCategories.map((cat, idx) => (
                  <View key={idx} style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: '#FFFFFF',
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: '#FF8D57',
                    gap: 4,
                  }}>
                    <Text style={{ fontSize: 13, color: '#FF8D57', fontWeight: '600' }}>{cat}</Text>
                    <TouchableOpacity onPress={() => setSelectedTempCategories(selectedTempCategories.filter(c => c !== cat))}>
                      <Ionicons name="close-circle" size={16} color="#FF8D57" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* Categories FlatList */}
            <FlatList
              data={Platform.OS === 'android'
                ? [
                    ...(customCategoryQuery.trim() && !ALL_FIGMA_CATEGORIES.some(c => c.toLowerCase() === customCategoryQuery.trim().toLowerCase())
                      ? [`ADD_CUSTOM:${customCategoryQuery.trim()}`]
                      : []),
                    ...(customCategoryQuery.trim()
                      ? ALL_FIGMA_CATEGORIES.filter(c => c.toLowerCase().includes(customCategoryQuery.toLowerCase()))
                      : ALL_FIGMA_CATEGORIES)
                  ]
                : ALL_FIGMA_CATEGORIES
              }
              keyExtractor={(item) => item}
              contentContainerStyle={styles.selectorListContent}
              renderItem={({ item }) => {
                const isCustom = item.startsWith('ADD_CUSTOM:');
                const displayName = isCustom ? item.replace('ADD_CUSTOM:', '') : item;
                const isSelected = selectedTempCategories.includes(displayName);
                return (
                  <TouchableOpacity
                    style={[
                      styles.selectorItemRow,
                      isSelected && styles.selectorItemRowSelected,
                      isCustom && { backgroundColor: '#FFF7ED', borderBottomColor: '#FFE0CC' }
                    ]}
                    onPress={() => {
                      if (isSelected) {
                        setSelectedTempCategories(prev => prev.filter(c => c !== displayName));
                      } else {
                        if (selectedTempCategories.length >= 5) {
                          Alert.alert('Limit reached', 'Maximum 5 categories allowed');
                          return;
                        }
                        setSelectedTempCategories(prev => [...prev, displayName]);
                        if (isCustom) {
                          setCustomCategoryQuery('');
                        }
                      }
                    }}
                  >
                    <Text style={[
                      styles.selectorItemText,
                      isSelected && styles.selectorItemTextSelected,
                      isCustom && { color: '#F97316', fontWeight: '700' }
                    ]}>
                      {isCustom ? `Add custom: "${displayName}"` : item}
                    </Text>
                    {isCustom ? (
                      <Ionicons name="add-circle" size={22} color="#F97316" />
                    ) : isSelected ? (
                      <Ionicons name="checkmark-circle" size={20} color="#F97316" />
                    ) : null}
                  </TouchableOpacity>
                );
              }}
              style={styles.selectorFlatList}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            />

            {/* Done Button */}
            <View style={styles.selectorBottomBar}>
              <TouchableOpacity
                style={styles.selectorDoneButton}
                onPress={() => {
                  setCategories(selectedTempCategories);
                  setCustomCategoryQuery('');
                  setShowCategorySelector(false);
                }}
              >
                <Text style={styles.selectorDoneButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </SafeAreaView>
      </Modal>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBg: {
    display: 'flex',
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#FFF7ED',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  headerTitle: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignSelf: 'stretch',
    color: '#000000',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
    fontSize: 20,
    fontStyle: 'normal',
    fontWeight: '700',
    lineHeight: 28,
    letterSpacing: -0.5,
  },
  form: {
    padding: SPACING.md,
  },
  label: {
    color: '#000000',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
    fontSize: 14,
    fontStyle: 'normal',
    fontWeight: '600',
    lineHeight: 20,
    letterSpacing: 0.35,
    textTransform: 'uppercase',
    marginBottom: SPACING.sm,
    marginTop: SPACING.md,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: SPACING.md,
    fontSize: 15,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.00)',
  },
  addressInput: {
    display: 'flex',
    height: 57,
    paddingTop: 16,
    paddingBottom: 16,
    paddingLeft: 20,
    paddingRight: 52,
    justifyContent: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.00)',
    backgroundColor: '#F8FAFC',
    fontSize: 15,
    color: COLORS.text,
  },
  textArea: {
    height: 80,
    paddingTop: SPACING.md,
  },
  selectedCategories: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  categoryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.primary}15`,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 16,
    gap: 4,
  },
  categoryTagText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '500',
  },
  categorySearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.divider,
    marginBottom: SPACING.sm,
  },
  categorySearchInput: {
    flex: 1,
    marginLeft: SPACING.sm,
    fontSize: 15,
    color: COLORS.text,
  },
  categoryDropdown: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  suggestionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  suggestionPillText: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '500',
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: 45,
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  dropdownInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    overflow: 'hidden',
  },
  dropdownToggleButton: {
    paddingHorizontal: SPACING.md,
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    minHeight: 50,
  },
  dropdownListContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.divider,
    borderRadius: 16,
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  dropdownListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  dropdownListItemText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  dropdownListEmpty: {
    padding: 16,
    alignItems: 'center',
  },
  dropdownListEmptyText: {
    fontSize: 13,
    color: COLORS.textLight,
  },
  photoSublabel: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: -6,
    marginBottom: 12,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  uploadArea: {
    display: 'flex',
    alignSelf: 'center',
    width: 361,
    maxWidth: '100%',
    padding: 32,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    backgroundColor: '#FFFAF5',
    marginBottom: SPACING.md,
  },
  cloudIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#FF6600',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  uploadTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  uploadSubtext: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  previewScroll: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
  },
  previewWrapper: {
    position: 'relative',
    marginRight: 12,
    marginTop: 6,
    marginBottom: 6,
  },
  previewImage: {
    width: 72,
    height: 72,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  removeBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#EF4444',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 2,
  },
  selectorSafeArea: {
    flex: 1,
    backgroundColor: '#FF8D57',
  },
  selectorGradient: {
    flex: 1,
  },
  selectorHeader: {
    height: Platform.OS === 'ios' ? 110 : 88,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 40 : 0,
    gap: 12,
  },
  selectorBackButton: {
    padding: 8,
  },
  selectorHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#231917',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
    flexShrink: 1,
  },
  selectorIconBg: {
    width: 64,
    height: 64,
    backgroundColor: '#FF7B00',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectorLabelContainer: {
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  selectorLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#231917',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  selectorFlatList: {
    flex: 1,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  selectorListContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    paddingVertical: 8,
  },
  selectorItemRow: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  selectorItemRowSelected: {
    backgroundColor: '#FFF7ED',
  },
  selectorItemText: {
    fontSize: 16,
    fontWeight: '400',
    color: '#85736E',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  selectorItemTextSelected: {
    color: '#F97316',
    fontWeight: '600',
  },
  selectorBottomBar: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    paddingTop: 8,
  },
  selectorDoneButton: {
    height: 53,
    backgroundColor: '#F97316',
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectorDoneButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  selectorSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    height: 48,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectorSearchInput: {
    flex: 1,
    fontSize: 16,
    color: '#231917',
    paddingVertical: 8,
  },
  selectorSearchIcon: {
    marginRight: 8,
  },
});