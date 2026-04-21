import React, { useMemo, useState } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/theme';

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

  const filteredRoles = useMemo(() => {
    const term = professionSearch.trim().toLowerCase();
    if (!term) return JOB_ROLE_OPTIONS;
    return JOB_ROLE_OPTIONS.filter((role) => role.toLowerCase().includes(term));
  }, [professionSearch]);

  const filteredCities = useMemo(() => {
    const term = citySearch.trim().toLowerCase();
    if (!term) return CITY_OPTIONS;
    return CITY_OPTIONS.filter((city) => city.toLowerCase().includes(term));
  }, [citySearch]);

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
          Alert.alert('Error', 'Geolocation is not supported in this browser.');
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
          Alert.alert('Permission Denied', 'Location permission is required.');
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
      Alert.alert('Error', 'Unable to get current location.');
    } finally {
      setLocationLoading(false);
    }
  };

  const pickPhotoFromGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== 'granted') {
      Alert.alert('Permission Denied', 'Media library access is required.');
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
      Alert.alert('Permission Denied', 'Camera access is required.');
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
      Alert.alert('Unavailable', 'Document picker is not installed. You can still capture CV as an image.');
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
      Alert.alert('Permission Denied', 'Camera access is required.');
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
    if (!name.trim()) {
      Alert.alert('Required Field', 'Please enter your name.');
      return;
    }
    if (!currentAddress.trim()) {
      Alert.alert('Required Field', 'Please enter current address.');
      return;
    }
    if (!profession.trim()) {
      Alert.alert('Required Field', 'Please select work profession.');
      return;
    }
    if (!preferredWorkCity.trim()) {
      Alert.alert('Required Field', 'Please select preferred work city.');
      return;
    }
    if (!cvFile) {
      Alert.alert('Required Field', 'Please upload CV (doc/image/pdf) or capture it.');
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
      Alert.alert('Error', error?.message || 'Failed to save job profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Create Job Profile</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.form} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Text style={styles.label}>Name *</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Enter full name" placeholderTextColor={COLORS.textLight} />

            <Text style={styles.label}>Current Address *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={currentAddress}
              onChangeText={setCurrentAddress}
              placeholder="Enter current address"
              placeholderTextColor={COLORS.textLight}
              multiline
              numberOfLines={3}
            />

            <TouchableOpacity style={styles.locationButton} onPress={getCurrentLocation} disabled={locationLoading}>
              {locationLoading ? <ActivityIndicator color={COLORS.primary} /> : <Ionicons name="locate" size={18} color={COLORS.primary} />}
              <Text style={styles.locationButtonText}>Use Current Location</Text>
            </TouchableOpacity>

            {!!locationLink && (
              <Text style={styles.locationLinkText} numberOfLines={1}>{locationLink}</Text>
            )}

            <Text style={styles.label}>Work Experience (Years)</Text>
            <TextInput
              style={styles.input}
              value={experienceYears}
              onChangeText={setExperienceYears}
              placeholder="e.g. 3"
              placeholderTextColor={COLORS.textLight}
              keyboardType="numeric"
            />

            <Text style={styles.label}>Work Profession *</Text>
            <TextInput
              style={styles.input}
              value={professionSearch}
              onChangeText={(text) => {
                setProfessionSearch(text);
                setShowProfessionDropdown(true);
              }}
              onFocus={() => setShowProfessionDropdown(true)}
              placeholder={profession || 'Search profession'}
              placeholderTextColor={COLORS.textLight}
            />
            {showProfessionDropdown && (
              <View style={styles.dropdown}>
                <ScrollView style={{ maxHeight: 180 }} keyboardShouldPersistTaps="handled">
                  {filteredRoles.map((role) => (
                    <TouchableOpacity
                      key={role}
                      style={styles.dropdownItem}
                      onPress={() => {
                        setProfession(role);
                        setProfessionSearch(role);
                        setShowProfessionDropdown(false);
                      }}
                    >
                      <Text style={styles.dropdownItemText}>{role}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            <Text style={styles.label}>Preferred Work City *</Text>
            <TextInput
              style={styles.input}
              value={citySearch}
              onChangeText={(text) => {
                setCitySearch(text);
                setShowCityDropdown(true);
              }}
              onFocus={() => setShowCityDropdown(true)}
              placeholder={preferredWorkCity || 'Search city'}
              placeholderTextColor={COLORS.textLight}
            />
            {showCityDropdown && (
              <View style={styles.dropdown}>
                <ScrollView style={{ maxHeight: 180 }} keyboardShouldPersistTaps="handled">
                  {filteredCities.map((city) => (
                    <TouchableOpacity
                      key={city}
                      style={styles.dropdownItem}
                      onPress={() => {
                        setPreferredWorkCity(city);
                        setCitySearch(city);
                        setShowCityDropdown(false);
                      }}
                    >
                      <Text style={styles.dropdownItemText}>{city}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            <Text style={styles.label}>Upload Profile Photo</Text>
            <View style={styles.rowButtons}>
              <TouchableOpacity style={styles.secondaryButton} onPress={pickPhotoFromGallery}>
                <Ionicons name="images" size={16} color={COLORS.primary} />
                <Text style={styles.secondaryButtonText}>Gallery</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryButton} onPress={capturePhotoFromCamera}>
                <Ionicons name="camera" size={16} color={COLORS.primary} />
                <Text style={styles.secondaryButtonText}>Camera</Text>
              </TouchableOpacity>
            </View>
            {photoFile && (
              <View style={styles.fileRow} key={photoFile.uri}>
                <Text style={styles.fileText} numberOfLines={1}>{photoFile.name}</Text>
                <TouchableOpacity onPress={removePhoto}>
                  <Ionicons name="close-circle" size={20} color={COLORS.error} />
                </TouchableOpacity>
              </View>
            )}

            <Text style={styles.label}>Upload CV (doc/image/pdf) *</Text>
            <View style={styles.rowButtons}>
              <TouchableOpacity style={styles.secondaryButton} onPress={pickCvDocument}>
                <Ionicons name="document-attach" size={16} color={COLORS.primary} />
                <Text style={styles.secondaryButtonText}>Choose File</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryButton} onPress={captureCvFromCamera}>
                <Ionicons name="camera" size={16} color={COLORS.primary} />
                <Text style={styles.secondaryButtonText}>Capture Doc</Text>
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

            <TouchableOpacity style={[styles.submitBtn, loading && styles.submitBtnDisabled]} onPress={handleSubmit} disabled={loading}>
              {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.submitBtnText}>Save Job Profile</Text>}
            </TouchableOpacity>

            <View style={{ height: 40 }} />
          </ScrollView>
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
