import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  ActivityIndicator,
  Image,
  ScrollView
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import Svg, { Path } from 'react-native-svg';
import { registerUser } from '../../src/services/api';
import { useAuthStore } from '../../src/store/authStore';
import { COLORS } from '../../src/constants/theme';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
  const router = useRouter();
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const { login } = useAuthStore();
  
  const [name, setName] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [language, setLanguage] = useState('English');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFetchLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location permission was denied');
        return;
      }

      setLoading(true);
      const loc = await Location.getCurrentPositionAsync({});
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });

      if (reverseGeocode && reverseGeocode.length > 0) {
        const address = reverseGeocode[0];
        const readableLocation = [
          address.city || address.subregion || address.district,
          address.region,
          address.country
        ].filter(Boolean).join(', ');
        setLocation(readableLocation || `${loc.coords.latitude.toFixed(4)}, ${loc.coords.longitude.toFixed(4)}`);
      } else {
        setLocation(`${loc.coords.latitude.toFixed(4)}, ${loc.coords.longitude.toFixed(4)}`);
      }
    } catch (err) {
      console.warn('Error fetching location:', err);
      setError('Error fetching location');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Camera roll permission needed');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.3,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setPhoto(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const handleContinue = async () => {
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await registerUser({
        phone: phone || '',
        name: name.trim(),
        photo,
        language,
      });

      await login(response.data.user, response.data.token);
      router.replace('/auth/location');
    } catch (err: any) {
      console.warn('Registration failed/warning, proceeding anyway:', err);
      router.replace('/auth/location');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#FF8D57', '#EA9B76', '#FFEEE5']}
      locations={[0, 0.1058, 0.2212]}
      style={styles.container}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <Text style={styles.title}>Begin Your Journey</Text>

            {/* Profile Photo */}
            <TouchableOpacity style={styles.photoContainer} onPress={pickImage}>
              {photo ? (
                <Image source={{ uri: photo }} style={styles.photo} />
              ) : (
                <View style={styles.photoPlaceholder} />
              )}
              <View style={styles.photoEditBadge}>
                <Ionicons name="camera" size={18} color="#FFFFFF" />
              </View>
            </TouchableOpacity>

            <Text style={styles.caption}>Awaken your visual essence</Text>

            {/* Full Name */}
            <Text style={styles.label}>Full Name</Text>
            <View style={styles.inputContainer}>
              <View style={styles.inputIconContainer}>
                <Ionicons name="person-outline" size={22} color="#C5B49F" />
              </View>
              <TextInput
                style={styles.textInput}
                placeholder="Soul name or legal name"
                placeholderTextColor="#C5B49F"
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  setError('');
                }}
                autoCapitalize="words"
              />
            </View>

            {/* Location */}
            <Text style={styles.label}>Location</Text>
            <View style={styles.inputContainer}>
              <TouchableOpacity onPress={handleFetchLocation} style={styles.inputIconContainer} disabled={loading}>
                <Ionicons name="location-outline" size={22} color="#C5B49F" />
              </TouchableOpacity>
              <TextInput
                style={styles.textInput}
                placeholder="Your current coordinates..."
                placeholderTextColor="#C5B49F"
                value={location}
                onChangeText={(text) => setLocation(text)}
              />
            </View>

            {/* Information Card */}
            <View style={styles.infoCard}>
              <Ionicons name="information-circle-outline" size={24} color="#FF7B00" />
              <Text style={styles.infoText}>
                Your selected location will help us connect you with nearby devotees, temples, and your local Sanatan community. 🕉️🙏
              </Text>
            </View>

            {/* Sacred Language */}
            <Text style={styles.sacredLanguageLabel}>Sacred Language</Text>
            <View style={styles.languageContainer}>
              <TouchableOpacity 
                style={[
                  styles.languageButton, 
                  language === 'English' ? styles.languageButtonActive : styles.languageButtonInactive
                ]}
                onPress={() => setLanguage('English')}
              >
                <Text 
                  style={
                    language === 'English' ? styles.languageButtonTextActive : styles.languageButtonTextInactive
                  }
                >
                  English
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[
                  styles.languageButton, 
                  language === 'Hindi' ? styles.languageButtonActive : styles.languageButtonInactive
                ]}
                onPress={() => setLanguage('Hindi')}
              >
                <Text 
                  style={
                    language === 'Hindi' ? styles.languageButtonTextActive : styles.languageButtonTextInactive
                  }
                >
                  हिन्दी
                </Text>
              </TouchableOpacity>
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            {/* Continue Button */}
            <TouchableOpacity
              style={[
                styles.continueButton,
                !name.trim() && styles.continueButtonEmpty,
              ]}
              onPress={handleContinue}
              disabled={!name.trim() || loading}
            >
              {loading ? (
                <ActivityIndicator color="#FF7B00" />
              ) : (
                <View style={styles.continueButtonContent}>
                  <Text style={[styles.continueButtonText, !name.trim() && styles.continueButtonTextEmpty]}>Continue to My Journey </Text>
                  <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
                    <Path d="M18 8L16.75 5.25L14 4L16.75 2.75L18 0L19.25 2.75L22 4L19.25 5.25L18 8ZM18 22L16.75 19.25L14 18L16.75 16.75L18 14L19.25 16.75L22 18L19.25 19.25L18 22ZM8 19L5.5 13.5L0 11L5.5 8.5L8 3L10.5 8.5L16 11L10.5 13.5L8 19Z" fill={!name.trim() ? '#FF7B00' : 'white'}/>
                  </Svg>
                </View>
              )}
            </TouchableOpacity>

            {/* Footer Text */}
            <Text style={styles.footerText}>
              By beginning, you align with our Terms of Spiritual Connection and Privacy Sanctuary.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 55 : 30,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  content: {
    alignItems: 'center',
    width: '100%',
  },
  title: {
    color: '#5A4136',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro' : 'System',
    fontSize: 24,
    fontStyle: 'normal',
    fontWeight: '700',
    lineHeight: 28,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  photoContainer: {
    position: 'relative',
    marginTop: 8,
    marginBottom: 12,
    shadowColor: 'rgba(139, 79, 59, 0.15)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 5,
  },
  photo: {
    width: 128,
    height: 128,
    borderRadius: 9999,
  },
  photoPlaceholder: {
    width: 128,
    height: 128,
    borderRadius: 9999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(153, 71, 0, 0.20)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 4,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FF7B00',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  caption: {
    color: '#584235',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro' : 'System',
    fontSize: 14,
    fontStyle: 'normal',
    fontWeight: '600',
    lineHeight: 20,
    letterSpacing: 0.14,
    textAlign: 'center',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8B4F3B',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro' : 'System',
    alignSelf: 'flex-start',
    marginBottom: 8,
    marginTop: 12,
  },
  inputContainer: {
    display: 'flex',
    flexDirection: 'row',
    height: 56,
    paddingTop: 16.5,
    paddingRight: 16,
    paddingBottom: 16.5,
    paddingLeft: 48,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'stretch',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0C0AF',
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  inputIconContainer: {
    position: 'absolute',
    left: 16,
    zIndex: 1,
  },
  textInput: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: '#8B4F3B',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro' : 'System',
  },
  readOnlyText: {
    flex: 1,
    fontSize: 16,
    color: '#C5B49F',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro' : 'System',
  },
  infoCard: {
    width: '100%',
    backgroundColor: '#FFFDFB',
    borderRadius: 14,
    borderLeftWidth: 4,
    borderLeftColor: '#FF7B00',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
    shadowColor: 'rgba(139, 79, 59, 0.05)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 19.5,
    color: '#584235',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro' : 'System',
    fontWeight: '500',
    fontStyle: 'normal',
    marginLeft: 12,
  },
  languageContainer: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    gap: 12,
    marginBottom: 24,
    marginTop: 4,
  },
  languageButton: {
    height: 44,
    borderRadius: 22,
    paddingHorizontal: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  languageButtonActive: {
    backgroundColor: '#FF7B00',
    borderColor: '#FF7B00',
  },
  languageButtonInactive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FF7B00',
  },
  languageButtonTextActive: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro' : 'System',
    fontSize: 14,
    fontStyle: 'normal',
    fontWeight: '600',
    lineHeight: 20,
    letterSpacing: 0.14,
  },
  languageButtonTextInactive: {
    color: '#584235',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro' : 'System',
    fontSize: 14,
    fontStyle: 'normal',
    fontWeight: '600',
    lineHeight: 20,
    letterSpacing: 0.14,
  },
  sacredLanguageLabel: {
    color: '#994700',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro' : 'System',
    fontSize: 14,
    fontStyle: 'normal',
    fontWeight: '600',
    lineHeight: 20,
    letterSpacing: 0.14,
    alignSelf: 'flex-start',
    marginBottom: 4,
    marginTop: 6,
  },
  error: {
    color: '#FF3B30',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  continueButton: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF7B00',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 16,
    shadowColor: 'rgba(143, 76, 56, 0.30)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
  continueButtonEmpty: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#FF7B00',
    shadowOpacity: 0,
    elevation: 0,
  },
  continueButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro' : 'System',
    fontStyle: 'normal',
    textAlign: 'center',
    lineHeight: 28,
  },
  continueButtonTextEmpty: {
    color: '#FF7B00',
  },
  continueButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#584235',
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 20,
    marginTop: 8,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro' : 'System',
    fontWeight: '500',
    fontStyle: 'normal',
  },
});
