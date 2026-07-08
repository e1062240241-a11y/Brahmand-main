import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  FlatList,
  Keyboard,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../src/components/Button';
import { COLORS, SPACING, BORDER_RADIUS } from '../../src/constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AutocompleteInput } from '../../src/components/AutocompleteInput';

// Indian cities with areas
const CITIES_DATA: Record<string, string[]> = {
  'Mumbai': ['Andheri', 'Bandra', 'Borivali', 'Colaba', 'Dadar', 'Goregaon', 'Juhu', 'Kurla', 'Malad', 'Powai', 'Thane', 'Worli'],
  'Delhi': ['Connaught Place', 'Dwarka', 'Greater Kailash', 'Hauz Khas', 'Janakpuri', 'Karol Bagh', 'Lajpat Nagar', 'Nehru Place', 'Rajouri Garden', 'Rohini', 'Saket', 'Vasant Kunj'],
  'Bangalore': ['Indiranagar', 'Koramangala', 'Whitefield', 'Electronic City', 'HSR Layout', 'Jayanagar', 'JP Nagar', 'Malleshwaram', 'MG Road', 'Marathahalli', 'Yelahanka'],
  'Chennai': ['Adyar', 'Anna Nagar', 'Besant Nagar', 'Egmore', 'Guindy', 'Mylapore', 'Nungambakkam', 'T Nagar', 'Velachery', 'Porur'],
  'Hyderabad': ['Banjara Hills', 'Gachibowli', 'Hitech City', 'Jubilee Hills', 'Kondapur', 'Kukatpally', 'Madhapur', 'Secunderabad', 'Begumpet'],
  'Pune': ['Aundh', 'Baner', 'Hinjewadi', 'Kalyani Nagar', 'Kharadi', 'Koregaon Park', 'Magarpatta', 'Shivaji Nagar', 'Viman Nagar', 'Wakad'],
  'Kolkata': ['Alipore', 'Ballygunge', 'Gariahat', 'Park Street', 'Salt Lake', 'New Town', 'Howrah', 'Dum Dum', 'Behala'],
  'Ahmedabad': ['Ashram Road', 'CG Road', 'Navrangpura', 'Prahlad Nagar', 'Satellite', 'SG Highway', 'Vastrapur', 'Bopal'],
  'Jaipur': ['C Scheme', 'Malviya Nagar', 'Mansarovar', 'Raja Park', 'Tonk Road', 'Vaishali Nagar', 'Vidhyadhar Nagar'],
  'Lucknow': ['Gomti Nagar', 'Hazratganj', 'Indira Nagar', 'Aliganj', 'Mahanagar', 'Aminabad'],
};

const ALL_CITIES = Object.keys(CITIES_DATA);

interface AddressData {
  city: string;
  area: string;
}

export default function AddressEntryScreen() {
  const router = useRouter();
  
  const [homeCity, setHomeCity] = useState('');
  const [homeArea, setHomeArea] = useState('');
  const [officeCity, setOfficeCity] = useState('');
  const [officeArea, setOfficeArea] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleContinue = async () => {
    if (!homeCity || !homeArea) {
      setError('Please enter your home city and area');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Store entered addresses for comparison
      const addressData = {
        home: { city: homeCity, area: homeArea },
        office: officeCity && officeArea ? { city: officeCity, area: officeArea } : null,
      };
      
      await AsyncStorage.setItem('entered_addresses', JSON.stringify(addressData));
      
      // Navigate to location permission screen
      router.push('/auth/location-permission');
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepText}>Step 1 of 3</Text>
            </View>
            <Ionicons name="home" size={48} color={COLORS.primary} />
            <Text style={styles.title}>Enter Your Addresses</Text>
            <Text style={styles.subtitle}>
              Tell us where you live and work to join local communities
            </Text>
          </View>

          {/* Home Address */}
          <View style={styles.addressSection}>
            <View style={styles.sectionHeader}>
              <View style={[styles.iconCircle, { backgroundColor: `${COLORS.primary}20` }]}>
                <Ionicons name="home" size={20} color={COLORS.primary} />
              </View>
              <Text style={styles.sectionTitle}>Home Address</Text>
              <Text style={styles.requiredBadge}>Required</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>City</Text>
              <AutocompleteInput
                placeholder="Enter city name"
                placeholderTextColor={COLORS.textLight}
                value={homeCity}
                onChangeText={(text) => {
                  setHomeCity(text);
                  if (text !== homeCity) setHomeArea('');
                }}
                onSelect={(item) => {
                  setHomeCity(item.label);
                  setHomeArea('');
                }}
                data={ALL_CITIES}
                inputContainerStyle={styles.input}
                inputStyle={{ paddingVertical: 0 }}
                dropdownStyle={styles.suggestionsContainer}
                itemStyle={styles.suggestionItem}
                itemTextStyle={styles.suggestionText}
                showChevron={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Area / Locality</Text>
              <AutocompleteInput
                placeholder={homeCity ? "Enter area name" : "Select city first"}
                placeholderTextColor={COLORS.textLight}
                value={homeArea}
                onChangeText={setHomeArea}
                onSelect={(item) => setHomeArea(item.label)}
                data={CITIES_DATA[homeCity] || []}
                showSuggestionsOnFocusEmpty={true}
                minimumQueryLength={0}
                editable={!!homeCity}
                inputContainerStyle={[styles.input, !homeCity && styles.inputDisabled]}
                inputStyle={{ paddingVertical: 0 }}
                dropdownStyle={styles.suggestionsContainer}
                itemStyle={styles.suggestionItem}
                itemTextStyle={styles.suggestionText}
                showChevron={false}
              />
            </View>
          </View>

          {/* Office Address */}
          <View style={styles.addressSection}>
            <View style={styles.sectionHeader}>
              <View style={[styles.iconCircle, { backgroundColor: `${COLORS.secondary}20` }]}>
                <Ionicons name="briefcase" size={20} color={COLORS.secondary} />
              </View>
              <Text style={styles.sectionTitle}>Office Address</Text>
              <Text style={styles.optionalBadge}>Optional</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>City</Text>
              <AutocompleteInput
                placeholder="Enter city name"
                placeholderTextColor={COLORS.textLight}
                value={officeCity}
                onChangeText={(text) => {
                  setOfficeCity(text);
                  if (text !== officeCity) setOfficeArea('');
                }}
                onSelect={(item) => {
                  setOfficeCity(item.label);
                  setOfficeArea('');
                }}
                data={ALL_CITIES}
                inputContainerStyle={styles.input}
                inputStyle={{ paddingVertical: 0 }}
                dropdownStyle={styles.suggestionsContainer}
                itemStyle={styles.suggestionItem}
                itemTextStyle={styles.suggestionText}
                showChevron={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Area / Locality</Text>
              <AutocompleteInput
                placeholder={officeCity ? "Enter area name" : "Select city first"}
                placeholderTextColor={COLORS.textLight}
                value={officeArea}
                onChangeText={setOfficeArea}
                onSelect={(item) => setOfficeArea(item.label)}
                data={CITIES_DATA[officeCity] || []}
                showSuggestionsOnFocusEmpty={true}
                minimumQueryLength={0}
                editable={!!officeCity}
                inputContainerStyle={[styles.input, !officeCity && styles.inputDisabled]}
                inputStyle={{ paddingVertical: 0 }}
                dropdownStyle={styles.suggestionsContainer}
                itemStyle={styles.suggestionItem}
                itemTextStyle={styles.suggestionText}
                showChevron={false}
              />
            </View>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Button
            title={loading ? 'Please wait...' : 'Continue'}
            onPress={handleContinue}
            disabled={loading || !homeCity || !homeArea}
            style={styles.continueButton}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: SPACING.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  stepBadge: {
    backgroundColor: `${COLORS.primary}15`,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    marginBottom: SPACING.md,
  },
  stepText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: SPACING.md,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.sm,
    lineHeight: 20,
  },
  addressSection: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginLeft: SPACING.sm,
    flex: 1,
  },
  requiredBadge: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.error,
    backgroundColor: `${COLORS.error}15`,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  optionalBadge: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textSecondary,
    backgroundColor: COLORS.divider,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  inputDisabled: {
    opacity: 0.5,
  },
  suggestionsContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.divider,
    maxHeight: 200,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  suggestionText: {
    fontSize: 14,
    color: COLORS.text,
    marginLeft: SPACING.sm,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  continueButton: {
    marginTop: SPACING.md,
  },
});
