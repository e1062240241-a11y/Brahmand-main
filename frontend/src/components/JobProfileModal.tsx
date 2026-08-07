import React, { useMemo, useState } from 'react';
import {View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/theme';
import { useTranslation } from '../utils/i18n';
import { KeyboardAwareScrollView } from './KeyboardAwareScrollView';

let hasLoggedDocumentPickerError = false;
const getDocumentPickerModule = async () => {
  try {
    return await import('expo-document-picker');
  } catch (error) {
    if (!hasLoggedDocumentPickerError) {
      console.warn('expo-document-picker unavailable:', error);
      hasLoggedDocumentPickerError = true;
    }
    return null;
  }
};

const JOB_ROLE_OPTIONS = [
  'App Developer', 'Accountant', 'Cook', 'Driver', 'Electrician', 'Plumber', 'Carpenter',
  'Teacher', 'Nurse', 'Pharmacist', 'Office Assistant', 'Sales Executive', 'Store Manager',
  'Receptionist', 'Data Entry Operator', 'Graphic Designer', 'Digital Marketing Executive',
  'Tailor', 'Beautician', 'Housekeeping Staff', 'Delivery Partner', 'Security Guard',
  'Welder', 'Machine Operator', 'Helper', 'Lab Technician', 'Customer Support Executive',
];

const CITY_OPTIONS = [
  'Mumbai', 'Delhi', 'Bengaluru', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad',
  'Jaipur', 'Lucknow', 'Indore', 'Bhopal', 'Nagpur', 'Chandigarh', 'Surat', 'Kanpur',
  'Patna', 'Ranchi', 'Noida', 'Gurugram',
];

interface LocalFile {
  uri: string;
  name: string;
  type: string;
}

interface JobProfileModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    currentAddress: string;
    experienceYears: number;
    profession: string;
    preferredWorkCity: string;
    latitude?: number;
    longitude?: number;
    locationLink?: string;
    photoFile?: LocalFile;
    cvFile?: LocalFile;
  }) => Promise<void>;
}

export const JobProfileModal: React.FC<JobProfileModalProps> = ({
  visible,
  onClose,
  onSubmit,
}) => {
  const { t } = useTranslation();
  const isHi = t('language') === 'hi';

  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [currentAddress, setCurrentAddress] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  const [profession, setProfession] = useState('');
  const [professionSearch, setProfessionSearch] = useState('');
  const [showProfessionDropdown, setShowProfessionDropdown] = useState(false);
  const [preferredWorkCity, setPreferredWorkCity] = useState('');
  const [citySearch, setCitySearch] = useState('');
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locationLink, setLocationLink] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);
  const [photoFile, setPhotoFile] = useState<LocalFile | undefined>(undefined);
  const [cvFile, setCvFile] = useState<LocalFile | undefined>(undefined);

  const getRoleTranslation = (role: string) => {
    const map: { [key: string]: string } = {
      'App Developer': 'ऐप डेवलपर',
      'Accountant': 'मुनीम (अकाउंटेंट)',
      'Cook': 'रसोइया (कुक)',
      'Driver': 'चालक (ड्राइवर)',
      'Electrician': 'बिजली मिस्त्री (इलेक्ट्रीशियन)',
      'Plumber': 'नलसाज (प्लंबर)',
      'Carpenter': 'बढ़ई (कारपेंटर)',
      'Teacher': 'शिक्षक (टीचर)',
      'Nurse': 'नर्स',
      'Pharmacist': 'दवा विक्रेता (फार्मासिस्ट)',
      'Office Assistant': 'कार्यालय सहायक',
      'Sales Executive': 'बिक्री कार्यकारी',
      'Store Manager': 'दुकान प्रबंधक',
      'Receptionist': 'रिसेप्शनिस्ट',
      'Data Entry Operator': 'डेटा एंट्री ऑपरेटर',
      'Graphic Designer': 'ग्राफिक डिजाइनर',
      'Digital Marketing Executive': 'डिजिटल मार्केटिंग',
      'Tailor': 'दर्जी (टेलर)',
      'Beautician': 'ब्यूटीशियन',
      'Housekeeping Staff': 'हाउसकीपिंग स्टाफ',
      'Delivery Partner': 'डिलिवरी पार्टनर',
      'Security Guard': 'सुरक्षा गार्ड',
      'Welder': 'वेल्डर',
      'Machine Operator': 'मशीन ऑपरेटर',
      'Helper': 'सहायक (हेल्पर)',
      'Lab Technician': 'लैब तकनीशियन',
      'Customer Support Executive': 'ग्राहक सेवा कार्यकारी',
    };
    return isHi ? (map[role] || role) : role;
  };

  const getCityTranslation = (city: string) => {
    const map: { [key: string]: string } = {
      'Mumbai': 'मुंबई',
      'Delhi': 'दिल्ली',
      'Bengaluru': 'बेंगलुरु',
      'Hyderabad': 'हैदराबाद',
      'Chennai': 'चेन्नई',
      'Kolkata': 'कोलकाता',
      'Pune': 'पुणे',
      'Ahmedabad': 'अहमदाबाद',
      'Jaipur': 'जयपुर',
      'Lucknow': 'लखनऊ',
      'Indore': 'इंदौर',
      'Bhopal': 'भोपाल',
      'Nagpur': 'नागपुर',
      'Chandigarh': 'चंडीगढ़',
      'Surat': 'सूरत',
      'Kanpur': 'कानपुर',
      'Patna': 'पटना',
      'Ranchi': 'रांची',
      'Noida': 'नोएडा',
      'Gurugram': 'गुरुग्राम',
    };
    return isHi ? (map[city] || city) : city;
  };

  const filteredRoles = useMemo(() => {
    const term = professionSearch.trim().toLowerCase();
    if (!term) return JOB_ROLE_OPTIONS;
    return JOB_ROLE_OPTIONS.filter((role) => {
      const translated = getRoleTranslation(role).toLowerCase();
      return role.toLowerCase().includes(term) || translated.includes(term);
    });
  }, [professionSearch, isHi]);

  const filteredCities = useMemo(() => {
    const term = citySearch.trim().toLowerCase();
    if (!term) return CITY_OPTIONS;
    return CITY_OPTIONS.filter((city) => {
      const translated = getCityTranslation(city).toLowerCase();
      return city.toLowerCase().includes(term) || translated.includes(term);
    });
  }, [citySearch, isHi]);

  const resetForm = () => {
    setName('');
    setCurrentAddress('');
    setExperienceYears('');
    setProfession('');
    setProfessionSearch('');
    setShowProfessionDropdown(false);
    setPreferredWorkCity('');
    setCitySearch('');
    setShowCityDropdown(false);
    setLatitude(null);
    setLongitude(null);
    setLocationLink('');
    setPhotoFile(undefined);
    setCvFile(undefined);
  };

  const closeWithReset = () => {
    resetForm();
    onClose();
  };

  const getCurrentLocation = async () => {
    setLocationLoading(true);
    try {
      if (Platform.OS === 'web') {
        if (!navigator.geolocation) {
          Alert.alert(
            isHi ? 'त्रुटि' : 'Error',
            isHi ? 'इस ब्राउज़र में जियोलोकेशन समर्थित नहीं है।' : 'Geolocation is not supported in this browser.'
          );
          return;
        }
        await new Promise<void>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const lat = position.coords.latitude;
              const lng = position.coords.longitude;
              setLatitude(lat);
              setLongitude(lng);
              setLocationLink(`https://maps.google.com/?q=${lat},${lng}`);
              const geocoded = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
              if (geocoded.length > 0 && !currentAddress.trim()) {
                const place = geocoded[0];
                const address = [place.name, place.street, place.city, place.region, place.country]
                  .filter(Boolean)
                  .join(', ');
                setCurrentAddress(address);
              }
              resolve();
            },
            reject,
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
          );
        });
      } else {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            isHi ? 'अनुमति अस्वीकृत' : 'Permission Denied',
            isHi ? 'स्थान की अनुमति आवश्यक है।' : 'Location permission is required.'
          );
          return;
        }

        const location = await Location.getCurrentPositionAsync({});
        const lat = location.coords.latitude;
        const lng = location.coords.longitude;
        setLatitude(lat);
        setLongitude(lng);
        setLocationLink(`https://maps.google.com/?q=${lat},${lng}`);

        const geocoded = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
        if (geocoded.length > 0 && !currentAddress.trim()) {
          const place = geocoded[0];
          const address = [place.name, place.street, place.city, place.region, place.country]
            .filter(Boolean)
            .join(', ');
          setCurrentAddress(address);
        }
      }
    } catch (error) {
      Alert.alert(
        isHi ? 'त्रुटि' : 'Error',
        isHi ? 'वर्तमान स्थान प्राप्त करने में असमर्थ।' : 'Unable to get current location.'
      );
    } finally {
      setLocationLoading(false);
    }
  };

  const pickPhotoFromGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== 'granted') {
      Alert.alert(
        isHi ? 'अनुमति अस्वीकृत' : 'Permission Denied',
        isHi ? 'मीडिया लाइब्रेरी तक पहुँच आवश्यक है।' : 'Media library access is required.'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: false,
      allowsEditing: true,
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.length) return;
    const asset = result.assets[0];
    const file: LocalFile = {
      uri: asset.uri,
      name: (asset as any).fileName || `photo-${Date.now()}.jpg`,
      type: asset.mimeType || 'image/jpeg',
    };
    setPhotoFile(file);
  };

  const capturePhotoFromCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (permission.status !== 'granted') {
      Alert.alert(
        isHi ? 'अनुमति अस्वीकृत' : 'Permission Denied',
        isHi ? 'कैमरा तक पहुँच आवश्यक है।' : 'Camera access is required.'
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.length) return;
    const asset = result.assets[0];
    const file: LocalFile = {
      uri: asset.uri,
      name: `captured-${Date.now()}.jpg`,
      type: asset.mimeType || 'image/jpeg',
    };
    setPhotoFile(file);
  };

  const pickCvDocument = async () => {
    const DocumentPickerModule = await getDocumentPickerModule();
    if (!DocumentPickerModule) {
      Alert.alert(
        isHi ? 'अनुपलब्ध' : 'Unavailable',
        isHi 
          ? 'दस्तावेज़ चयनकर्ता स्थापित नहीं है। आप अभी भी छवि के रूप में सीवी कैप्चर कर सकते हैं।' 
          : 'Document picker is not installed. You can still capture CV as an image.'
      );
      return;
    }

    const result = await DocumentPickerModule.getDocumentAsync({
      type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/*'],
      copyToCacheDirectory: true,
      multiple: false,
    });

    if ((result as any).canceled) return;

    const asset = (result as any).assets?.[0];
    if (!asset) return;

    setCvFile({
      uri: asset.uri,
      name: asset.name || `cv-${Date.now()}`,
      type: asset.mimeType || 'application/pdf',
    });
  };

  const captureCvFromCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (permission.status !== 'granted') {
      Alert.alert(
        isHi ? 'अनुमति अस्वीकृत' : 'Permission Denied',
        isHi ? 'कैमरा तक पहुँच आवश्यक है।' : 'Camera access is required.'
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.length) return;
    const asset = result.assets[0];
    setCvFile({
      uri: asset.uri,
      name: `cv-captured-${Date.now()}.jpg`,
      type: asset.mimeType || 'image/jpeg',
    });
  };

  const removePhoto = () => {
    setPhotoFile(undefined);
  };

  const handleSubmit = async () => {
    const nameRegex = /^[a-zA-Z\u0900-\u097F\s.'-]{2,50}$/;
    const addressRegex = /^[a-zA-Z0-9\u0900-\u097F\s.,'#\-\/()]{5,150}$/;
    const experienceRegex = /^(0|[1-9]\d?)$/;

    const trimmedName = name.trim();
    const trimmedAddress = currentAddress.trim();

    if (!trimmedName) {
      Alert.alert(
        isHi ? 'आवश्यक फ़ील्ड' : 'Required Field',
        isHi ? 'कृपया अपना नाम दर्ज करें।' : 'Please enter your name.'
      );
      return;
    }
    if (!nameRegex.test(trimmedName)) {
      Alert.alert(
        isHi ? 'अमान्य नाम' : 'Invalid Name',
        isHi 
          ? 'नाम 2 से 50 वर्णों का होना चाहिए और इसमें केवल अक्षर, रिक्त स्थान, बिंदु और हाइफ़न होने चाहिए।' 
          : 'Name must be 2 to 50 characters and contain only letters, spaces, dots, and hyphens.'
      );
      return;
    }

    if (!trimmedAddress) {
      Alert.alert(
        isHi ? 'आवश्यक फ़ील्ड' : 'Required Field',
        isHi ? 'कृपया वर्तमान पता दर्ज करें।' : 'Please enter current address.'
      );
      return;
    }
    if (!addressRegex.test(trimmedAddress)) {
      Alert.alert(
        isHi ? 'अमान्य पता' : 'Invalid Address',
        isHi 
          ? 'पता 5 से 150 वर्णों के बीच होना चाहिए और इसमें केवल अक्षर, संख्याएं, रिक्त स्थान और मूल प्रतीक (.,\'#-/()) हो सकते हैं।' 
          : 'Address must be between 5 and 150 characters and can only contain letters, numbers, spaces, and basic symbols (.,\'#-/()).'
      );
      return;
    }

    if (experienceYears && !experienceRegex.test(experienceYears)) {
      Alert.alert(
        isHi ? 'अमान्य अनुभव' : 'Invalid Experience',
        isHi 
          ? 'अनुभव 0 और 99 के बीच वर्षों की एक वैध संख्या होनी चाहिए।' 
          : 'Experience must be a valid number of years between 0 and 99.'
      );
      return;
    }

    if (!profession.trim()) {
      Alert.alert(
        isHi ? 'आवश्यक फ़ील्ड' : 'Required Field',
        isHi ? 'कृपया कार्य पेशा चुनें।' : 'Please select work profession.'
      );
      return;
    }
    if (!preferredWorkCity.trim()) {
      Alert.alert(
        isHi ? 'आवश्यक फ़ील्ड' : 'Required Field',
        isHi ? 'कृपया पसंदीदा कार्य शहर चुनें।' : 'Please select preferred work city.'
      );
      return;
    }
    if (!cvFile) {
      Alert.alert(
        isHi ? 'आवश्यक फ़ील्ड' : 'Required Field',
        isHi ? 'कृपया सीवी (दस्तावेज़/छवि/पीडीएफ) अपलोड करें या इसे कैप्चर करें।' : 'Please upload CV (doc/image/pdf) or capture it.'
      );
      return;
    }

    try {
      setLoading(true);
      await onSubmit({
        name: name.trim(),
        currentAddress: currentAddress.trim(),
        experienceYears: parseInt(experienceYears, 10) || 0,
        profession: profession.trim(),
        preferredWorkCity: preferredWorkCity.trim(),
        latitude: latitude || undefined,
        longitude: longitude || undefined,
        locationLink: locationLink || undefined,
        photoFile,
        cvFile,
      });
      closeWithReset();
    } catch (error: any) {
      Alert.alert(
        isHi ? 'त्रुटि' : 'Error',
        error?.message || (isHi ? 'नौकरी प्रोफ़ाइल सहेजने में विफल।' : 'Failed to save job profile.')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              {isHi ? 'नौकरी प्रोफ़ाइल बनाएं' : 'Create Job Profile'}
            </Text>
            <TouchableOpacity onPress={onClose} accessibilityRole="button" accessibilityLabel="Button">
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          <KeyboardAwareScrollView style={styles.form} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Text style={styles.label}>{isHi ? 'नाम *' : 'Name *'}</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder={isHi ? 'पूरा नाम दर्ज करें' : 'Enter full name'} placeholderTextColor={COLORS.textLight} />

            <Text style={styles.label}>{isHi ? 'वर्तमान पता *' : 'Current Address *'}</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={currentAddress}
              onChangeText={setCurrentAddress}
              placeholder={isHi ? 'वर्तमान पता दर्ज करें' : 'Enter current address'}
              placeholderTextColor={COLORS.textLight}
              multiline
              numberOfLines={3}
            />

            <TouchableOpacity style={styles.locationButton} onPress={getCurrentLocation} disabled={locationLoading} accessibilityRole="button" accessibilityLabel="Button">
              {locationLoading ? <ActivityIndicator color={COLORS.primary} /> : <Ionicons name="locate" size={18} color={COLORS.primary} />}
              <Text style={styles.locationButtonText}>
                {isHi ? 'वर्तमान स्थान का उपयोग करें' : 'Use Current Location'}
              </Text>
            </TouchableOpacity>

            {!!locationLink && (
              <Text style={styles.locationLinkText} numberOfLines={1}>{locationLink}</Text>
            )}

            <Text style={styles.label}>{isHi ? 'कार्य अनुभव (वर्ष)' : 'Work Experience (Years)'}</Text>
            <TextInput
              style={styles.input}
              value={experienceYears}
              onChangeText={setExperienceYears}
              placeholder={isHi ? 'जैसे: 3' : 'e.g. 3'}
              placeholderTextColor={COLORS.textLight}
              keyboardType="numeric"
            />

            <Text style={styles.label}>{isHi ? 'कार्य पेशा *' : 'Work Profession *'}</Text>
            <TextInput
              style={styles.input}
              value={professionSearch}
              onChangeText={(text) => {
                setProfessionSearch(text);
                setShowProfessionDropdown(true);
              }}
              onFocus={() => setShowProfessionDropdown(true)}
              placeholder={profession ? getRoleTranslation(profession) : (isHi ? 'पेशा खोजें' : 'Search profession')}
              placeholderTextColor={COLORS.textLight}
            />
            {showProfessionDropdown && (
              <View style={styles.dropdown}>
                <KeyboardAwareScrollView style={{ maxHeight: 180 }} keyboardShouldPersistTaps="handled">
                  {filteredRoles.map((role) => (
                    <TouchableOpacity
                      key={role}
                      style={styles.dropdownItem}
                      onPress={() => {
                        setProfession(role);
                        setProfessionSearch(getRoleTranslation(role));
                        setShowProfessionDropdown(false);
                      }}
                    >
                      <Text style={styles.dropdownItemText}>{getRoleTranslation(role)}</Text>
                    </TouchableOpacity>
                  ))}
                </KeyboardAwareScrollView>
              </View>
            )}

            <Text style={styles.label}>{isHi ? 'पसंदीदा कार्य शहर *' : 'Preferred Work City *'}</Text>
            <TextInput
              style={styles.input}
              value={citySearch}
              onChangeText={(text) => {
                setCitySearch(text);
                setShowCityDropdown(true);
              }}
              onFocus={() => setShowCityDropdown(true)}
              placeholder={preferredWorkCity ? getCityTranslation(preferredWorkCity) : (isHi ? 'शहर खोजें' : 'Search city')}
              placeholderTextColor={COLORS.textLight}
            />
            {showCityDropdown && (
              <View style={styles.dropdown}>
                <KeyboardAwareScrollView style={{ maxHeight: 180 }} keyboardShouldPersistTaps="handled">
                  {filteredCities.map((city) => (
                    <TouchableOpacity
                      key={city}
                      style={styles.dropdownItem}
                      onPress={() => {
                        setPreferredWorkCity(city);
                        setCitySearch(getCityTranslation(city));
                        setShowCityDropdown(false);
                      }}
                    >
                      <Text style={styles.dropdownItemText}>{getCityTranslation(city)}</Text>
                    </TouchableOpacity>
                  ))}
                </KeyboardAwareScrollView>
              </View>
            )}

            <Text style={styles.label}>{isHi ? 'प्रोफ़ाइल फ़ोटो अपलोड करें' : 'Upload Profile Photo'}</Text>
            <View style={styles.rowButtons}>
              <TouchableOpacity style={styles.secondaryButton} onPress={pickPhotoFromGallery} accessibilityRole="button" accessibilityLabel="Button">
                <Ionicons name="images" size={16} color={COLORS.primary} />
                <Text style={styles.secondaryButtonText}>{isHi ? 'गैलरी' : 'Gallery'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryButton} onPress={capturePhotoFromCamera} accessibilityRole="button" accessibilityLabel="Button">
                <Ionicons name="camera" size={16} color={COLORS.primary} />
                <Text style={styles.secondaryButtonText}>{isHi ? 'कैमरा' : 'Camera'}</Text>
              </TouchableOpacity>
            </View>
            {photoFile && (
              <View style={styles.fileRow} key={photoFile.uri}>
                <Text style={styles.fileText} numberOfLines={1}>{photoFile.name}</Text>
                <TouchableOpacity onPress={removePhoto} accessibilityRole="button" accessibilityLabel="Button">
                  <Ionicons name="close-circle" size={20} color={COLORS.error} />
                </TouchableOpacity>
              </View>
            )}

            <Text style={styles.label}>
              {isHi ? 'सीवी अपलोड करें (दस्तावेज़/छवि/पीडीएफ) *' : 'Upload CV (doc/image/pdf) *'}
            </Text>
            <View style={styles.rowButtons}>
              <TouchableOpacity style={styles.secondaryButton} onPress={pickCvDocument} accessibilityRole="button" accessibilityLabel="Button">
                <Ionicons name="document-attach" size={16} color={COLORS.primary} />
                <Text style={styles.secondaryButtonText}>{isHi ? 'फ़ाइल चुनें' : 'Choose File'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryButton} onPress={captureCvFromCamera} accessibilityRole="button" accessibilityLabel="Button">
                <Ionicons name="camera" size={16} color={COLORS.primary} />
                <Text style={styles.secondaryButtonText}>{isHi ? 'दस्तावेज़ कैप्चर करें' : 'Capture Doc'}</Text>
              </TouchableOpacity>
            </View>
            {cvFile && (
              <View style={styles.fileRow}>
                <Text style={styles.fileText} numberOfLines={1}>{cvFile.name}</Text>
                <TouchableOpacity onPress={() => setCvFile(undefined)}>
                  <Ionicons name="close-circle" size={20} color={COLORS.error} />
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity style={[styles.submitBtn, loading && styles.submitBtnDisabled]} onPress={handleSubmit} disabled={loading} accessibilityRole="button" accessibilityLabel="Button">
              {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.submitBtnText}>
                {isHi ? 'नौकरी प्रोफ़ाइल सहेजें' : 'Save Job Profile'}
              </Text>}
            </TouchableOpacity>

            <View style={{ height: 40 }} />
          </KeyboardAwareScrollView>
        </View>
      </KeyboardAvoidingView>
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
    maxHeight: '92%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  form: {
    padding: SPACING.md,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
    marginTop: SPACING.md,
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: 15,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  textArea: {
    height: 88,
    textAlignVertical: 'top',
  },
  locationButton: {
    marginTop: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.primary,
    alignSelf: 'flex-start',
  },
  locationButtonText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  locationLinkText: {
    marginTop: SPACING.xs,
    color: COLORS.primary,
    fontSize: 12,
  },
  dropdown: {
    marginTop: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.divider,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surface,
  },
  dropdownItem: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  dropdownItemText: {
    color: COLORS.text,
    fontSize: 14,
  },
  rowButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: `${COLORS.primary}10`,
  },
  secondaryButtonText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 13,
  },
  fileRow: {
    marginTop: SPACING.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.divider,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.background,
  },
  fileText: {
    color: COLORS.text,
    fontSize: 13,
    flex: 1,
    marginRight: SPACING.sm,
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
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
});
