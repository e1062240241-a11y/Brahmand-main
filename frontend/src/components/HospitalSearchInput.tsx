import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ScrollView,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../constants/theme';
import { searchHospitals, reverseGeocode } from '../services/api';
import { ensureForegroundPermission, getCurrentPosition } from '../services/location';

export interface HospitalSuggestion {
  name: string;
  address: string;
  area: string;
  city: string;
  [key: string]: any;
}

export interface HospitalSearchInputProps {
  value: string;
  onSelect: (hospital: HospitalSuggestion) => void;
  placeholder?: string;
  label?: string;
  showGpsButton?: boolean;
  onGpsDetect?: () => void;
  forceShowAbove?: boolean;
  containerStyle?: ViewStyle;
  inputContainerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  dropdownStyle?: ViewStyle;
}

export const HospitalSearchInput: React.FC<HospitalSearchInputProps> = ({
  value,
  onSelect,
  placeholder = 'Search hospital name or area...',
  label,
  showGpsButton = true,
  onGpsDetect,
  forceShowAbove = true,
  containerStyle,
  inputContainerStyle,
  inputStyle,
  dropdownStyle,
}) => {
  const [hospitalQuery, setHospitalQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState<HospitalSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [selectedItem, setSelectedItem] = useState<HospitalSuggestion | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync external value
  useEffect(() => {
    setHospitalQuery(value || '');
  }, [value]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  // Search logic starting from 1st character (minimumQueryLength = 1)
  const performSearch = useCallback(async (queryText: string) => {
    const q = queryText.trim();
    if (q.length < 1) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await searchHospitals(q, 10);
      const rows = response?.data?.results || response?.data || [];
      if (Array.isArray(rows) && rows.length > 0) {
        const normalized: HospitalSuggestion[] = rows
          .filter((item: any) => item && (item.name || item.display_name))
          .map((item: any) => ({
            name: item.name || item.display_name,
            address: item.address || item.formatted_address || item.name || '',
            area: item.area || '',
            city: item.city || '',
          }));
        setSuggestions(normalized);
      } else {
        setSuggestions([]);
      }
    } catch (err) {
      console.warn('Hospital search failed:', err);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChangeText = (text: string) => {
    setHospitalQuery(text);
    if (selectedItem) {
      setSelectedItem(null);
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (text.trim().length < 1) {
      setSuggestions([]);
      return;
    }

    debounceRef.current = setTimeout(() => {
      performSearch(text);
    }, 300);
  };

  const handleSelectHospital = (item: HospitalSuggestion) => {
    setHospitalQuery(item.name);
    setSelectedItem(item);
    setSuggestions([]);
    setIsFocused(false);
    onSelect(item);
  };

  const handleClear = () => {
    setHospitalQuery('');
    setSelectedItem(null);
    setSuggestions([]);
    onSelect({ name: '', address: '', area: '', city: '' });
  };

  const handleGpsClick = async () => {
    if (onGpsDetect) {
      onGpsDetect();
      return;
    }

    setLoading(true);
    try {
      const hasPermission = await ensureForegroundPermission();
      if (!hasPermission) {
        Alert.alert('Permission Denied', 'Please grant location permissions to detect your current position.');
        return;
      }
      const position = await getCurrentPosition({ accuracy: 3 });
      const { latitude, longitude } = position.coords;
      const response = await reverseGeocode(latitude, longitude);
      const data = response.data;
      if (data && (data.display_name || data.name)) {
        const detectedName = data.display_name || data.name;
        const hospitalObj: HospitalSuggestion = {
          name: detectedName,
          address: detectedName,
          area: data.area || '',
          city: data.city || '',
        };
        handleSelectHospital(hospitalObj);
      } else {
        Alert.alert('Detection Failed', 'Could not resolve address for current location.');
      }
    } catch (err) {
      console.error('GPS detection failed:', err);
      Alert.alert('Detection Error', 'Unable to fetch current location.');
    } finally {
      setLoading(false);
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    if (hospitalQuery.trim().length >= 1 && !selectedItem) {
      performSearch(hospitalQuery);
    }
  };

  const handleBlur = () => {
    // Delay blur to allow item onPress to trigger smoothly
    setTimeout(() => {
      setIsFocused(false);
    }, 250);
  };

  const showSuggestions = isFocused && hospitalQuery.trim().length >= 1 && !selectedItem;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View style={styles.inputWrapperContainer}>
        <View style={[styles.inputContainer, inputContainerStyle]}>
          {showGpsButton && (
            <TouchableOpacity
              onPress={handleGpsClick}
              style={styles.gpsIconButton}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel="Detect current location"
            >
              <Ionicons name="location-sharp" size={18} color="#E53935" />
            </TouchableOpacity>
          )}

          <TextInput
            style={[styles.input, inputStyle]}
            placeholder={placeholder}
            placeholderTextColor="#BBB"
            value={hospitalQuery}
            onChangeText={handleChangeText}
            onFocus={handleFocus}
            onBlur={handleBlur}
            autoCorrect={false}
          />

          {loading ? (
            <ActivityIndicator size="small" color="#E53935" style={styles.rightIcon} />
          ) : hospitalQuery.length > 0 ? (
            <TouchableOpacity
              onPress={handleClear}
              style={styles.rightIcon}
              accessibilityRole="button"
              accessibilityLabel="Clear search input"
            >
              <Ionicons name="close-circle" size={18} color="#BBB" />
            </TouchableOpacity>
          ) : (
            <View style={styles.rightIcon}>
              <Ionicons name="search" size={18} color="#BBB" />
            </View>
          )}
        </View>

        {/* Floating Autocomplete Overlay Dropdown */}
        {showSuggestions && (
          <View style={[styles.dropdownContainer, forceShowAbove ? styles.dropdownAbove : styles.dropdownBelow, dropdownStyle]}>
            {loading && suggestions.length === 0 ? (
              <Text style={styles.statusText}>Searching hospitals...</Text>
            ) : suggestions.length > 0 ? (
              <ScrollView
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled={true}
                style={{ maxHeight: 200 }}
              >
                {suggestions.map((item, index) => (
                  <TouchableOpacity
                    key={`${item.name}-${index}`}
                    style={styles.suggestionItem}
                    onPress={() => handleSelectHospital(item)}
                    accessibilityRole="button"
                    accessibilityLabel={`Select hospital: ${item.name}`}
                  >
                    <Ionicons name="navigate-circle-outline" size={20} color="#E53935" style={{ marginRight: 10 }} />
                    <View style={styles.suggestionTextCol}>
                      <Text style={styles.suggestionTitle} numberOfLines={1}>
                        {item.name}
                      </Text>
                      {item.address && item.address !== item.name ? (
                        <Text style={styles.suggestionAddress} numberOfLines={1}>
                          {item.address}
                        </Text>
                      ) : (item.area || item.city) ? (
                        <Text style={styles.suggestionAddress} numberOfLines={1}>
                          {[item.area, item.city].filter(Boolean).join(', ')}
                        </Text>
                      ) : null}
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <View>
                <Text style={styles.statusText}>No hospitals found</Text>
                <TouchableOpacity
                  style={styles.suggestionItem}
                  onPress={() =>
                    handleSelectHospital({
                      name: hospitalQuery.trim(),
                      address: hospitalQuery.trim(),
                      area: '',
                      city: '',
                    })
                  }
                  accessibilityRole="button"
                  accessibilityLabel={`Use custom search query: ${hospitalQuery.trim()}`}
                >
                  <Ionicons name="add-circle-outline" size={18} color="#E53935" style={{ marginRight: 8 }} />
                  <Text style={styles.suggestionTitle} numberOfLines={1}>
                    Use "{hospitalQuery.trim()}" as typed
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 100,
  },
  label: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    color: '#333',
    marginBottom: 8,
    marginLeft: 2,
  },
  inputWrapperContainer: {
    position: 'relative',
    zIndex: 999,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9FB',
    borderWidth: 1,
    borderColor: '#F0F0F3',
    borderRadius: 16,
    paddingHorizontal: 14,
    minHeight: 52,
  },
  gpsIconButton: {
    padding: 6,
    marginRight: 4,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: FONTS.regular,
    color: '#333',
    paddingVertical: 12,
  },
  rightIcon: {
    padding: 6,
  },
  dropdownContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F0F0F3',
    maxHeight: 220,
    zIndex: 9999,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  dropdownAbove: {
    bottom: 58,
    shadowOffset: { width: 0, height: -6 },
  },
  dropdownBelow: {
    top: 58,
    shadowOffset: { width: 0, height: 6 },
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F7',
  },
  suggestionTextCol: {
    flex: 1,
  },
  suggestionTitle: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    color: '#222',
  },
  suggestionAddress: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: '#888',
    marginTop: 2,
  },
  statusText: {
    padding: 14,
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: '#888',
    textAlign: 'center',
  },
});

export default HospitalSearchInput;
