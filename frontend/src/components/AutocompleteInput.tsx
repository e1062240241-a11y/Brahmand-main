import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Keyboard,
  Platform,
  Dimensions,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  TextInputProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, BORDER_RADIUS, SPACING } from '../constants/theme';

export interface AutocompleteItem {
  label: string;
  value: string;
  latitude?: number;
  longitude?: number;
  address?: any;
  [key: string]: any;
}

interface AutocompleteInputProps extends Omit<TextInputProps, 'value' | 'onChangeText'> {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  onSelect: (item: AutocompleteItem) => void;
  error?: string;
  
  // Data props
  data?: any[]; // Local static options (can be string[] or AutocompleteItem[])
  onSearch?: (query: string) => Promise<any[]>; // Dynamic async fetch callback
  disableLocalFilter?: boolean; // If true, data is rendered as-is (e.g. parent pre-filtered it)
  showSuggestionsOnFocusEmpty?: boolean; // Show suggestions when input is empty and focused
  minimumQueryLength?: number; // Minimum query length to trigger search/filter
  forceShowAbove?: boolean; // If true, force dropdown above input box

  // Custom styles
  containerStyle?: ViewStyle;
  inputContainerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  dropdownStyle?: ViewStyle;
  itemStyle?: ViewStyle;
  itemTextStyle?: TextStyle;
  noResultsStyle?: TextStyle;

  // Icons
  iconName?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  showChevron?: boolean;
}

export const AutocompleteInput: React.FC<AutocompleteInputProps> = ({
  label,
  value,
  onChangeText,
  onSelect,
  error,
  data,
  onSearch,
  disableLocalFilter = false,
  showSuggestionsOnFocusEmpty = false,
  minimumQueryLength = 1,
  forceShowAbove = true,
  containerStyle,
  inputContainerStyle,
  inputStyle,
  dropdownStyle,
  itemStyle,
  itemTextStyle,
  noResultsStyle,
  iconName,
  iconColor = COLORS.textSecondary,
  showChevron = true,
  placeholderTextColor = COLORS.textLight,
  style,
  ...textInputProps
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<AutocompleteItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAbove, setShowAbove] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  
  const containerRef = useRef<View>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Normalize any array items to AutocompleteItem format
  const getNormalizedItem = useCallback((item: any): AutocompleteItem => {
    if (typeof item === 'string') {
      return { label: item, value: item };
    }
    
    let itemLabel = item.label || item.formatted_name;
    if (!itemLabel && item.address) {
      const addr = item.address;
      const city = addr.city || addr.town || addr.village || addr.municipality || addr.city_district || addr.suburb || addr.hamlet;
      const state = addr.state || addr.region || addr.province || addr.state_district;
      const country = addr.country;

      const parts = [];
      if (city) parts.push(city);
      if (state) parts.push(state);
      if (country) parts.push(country);

      itemLabel = parts.length > 0 ? parts.join(', ') : item.display_name;
    }
    
    if (!itemLabel) {
      itemLabel = item.display_name || item.name || String(item);
    }

    return {
      label: itemLabel,
      value: item.value || itemLabel,
      latitude: item.latitude || (item.lat ? parseFloat(item.lat) : undefined),
      longitude: item.longitude || (item.lon ? parseFloat(item.lon) : undefined),
      address: item.address,
      ...item,
    };
  }, []);

  // Sync keyboard height to adjust flip calculations
  useEffect(() => {
    const showSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => setKeyboardHeight(e.endCoordinates.height)
    );
    const hideSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
        setShowAbove(false);
      }
    );
    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  // Measure space to determine if we need to flip the dropdown above the input
  const checkSpace = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.measureInWindow((x, y, width, height) => {
        const windowHeight = Dimensions.get('window').height;
        // On Android with resize mode, windowHeight is already adjusted.
        // On iOS, we need to subtract keyboardHeight.
        const adjustedWindowHeight = Platform.OS === 'ios' ? windowHeight - keyboardHeight : windowHeight;
        const spaceBelow = adjustedWindowHeight - y - height;
        // Flip if space below is less than dropdown height + margin (approx 220px)
        if (spaceBelow < 220 && (keyboardHeight > 0 || y > windowHeight / 2)) {
          setShowAbove(true);
        } else {
          setShowAbove(false);
        }
      });
    }
  }, [keyboardHeight]);

  // Recalculate space when suggestions change or keyboard is toggled
  useEffect(() => {
    if (suggestions.length > 0 && isFocused) {
      checkSpace();
    }
  }, [suggestions, isFocused, keyboardHeight, checkSpace]);

  // Run local filtering or trigger async search
  const handleQuery = useCallback(async (query: string) => {
    const trimmed = query.trim();
    
    // Check minimum query length
    if (trimmed.length < minimumQueryLength && !(showSuggestionsOnFocusEmpty && trimmed.length === 0)) {
      setSuggestions([]);
      return;
    }

    const appendAddOptionIfNeeded = (items: AutocompleteItem[]) => {
      if (!trimmed) return items;
      const hasExact = items.some(
        item => item.label.toLowerCase() === trimmed.toLowerCase() || item.value.toLowerCase() === trimmed.toLowerCase()
      );
      if (!hasExact) {
        return [
          ...items,
          {
            label: `Add "${trimmed}"`,
            value: trimmed,
            isCustom: true,
          },
        ];
      }
      return items;
    };

    // Dynamic search via onSearch callback
    if (onSearch) {
      setLoading(true);
      try {
        const results = await onSearch(trimmed);
        if (Array.isArray(results)) {
          const normalized = results.map(getNormalizedItem);
          setSuggestions(appendAddOptionIfNeeded(normalized));
        } else {
          setSuggestions(appendAddOptionIfNeeded([]));
        }
      } catch (err) {
        console.warn('AutocompleteInput search error:', err);
        setSuggestions(appendAddOptionIfNeeded([]));
      } finally {
        setLoading(false);
      }
      return;
    }

    // Static data filtering
    if (data) {
      if (disableLocalFilter) {
        setSuggestions(appendAddOptionIfNeeded(data.map(getNormalizedItem)));
      } else {
        const lowerQuery = trimmed.toLowerCase();
        const filtered = data
          .map(getNormalizedItem)
          .filter(item => item.label.toLowerCase().includes(lowerQuery));
        setSuggestions(appendAddOptionIfNeeded(filtered.slice(0, 5)));
      }
    } else if (trimmed.length > 0) {
      setSuggestions(appendAddOptionIfNeeded([]));
    }
  }, [data, onSearch, disableLocalFilter, showSuggestionsOnFocusEmpty, minimumQueryLength, getNormalizedItem]);

  // Debounced search trigger for keystrokes
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // If it's a dynamic search, debounce the API call
    if (onSearch) {
      searchTimeoutRef.current = setTimeout(() => {
        handleQuery(value);
      }, 350);
    } else {
      // Local static filtering is fast, execute immediately
      handleQuery(value);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [value, handleQuery, onSearch]);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    checkSpace();
    handleQuery(value);
    if (textInputProps.onFocus) {
      textInputProps.onFocus(e);
    }
  };

  const handleBlur = (e: any) => {
    // Delay blur slightly to allow suggestion onPress to be registered
    setTimeout(() => {
      setIsFocused(false);
    }, 250);
    if (textInputProps.onBlur) {
      textInputProps.onBlur(e);
    }
  };

  const handleSelect = (item: AutocompleteItem) => {
    onSelect(item);
    setIsFocused(false);
    setSuggestions([]);
  };

  const showSuggestions = isFocused && (
    suggestions.length > 0 || 
    (value.trim().length >= minimumQueryLength && !loading)
  );

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <View ref={containerRef} style={styles.inputWrapperContainer}>
        <View style={[
          styles.inputWrapper,
          error && styles.inputWrapperError,
          inputContainerStyle
        ]}>
          {iconName && (
            <Ionicons name={iconName} size={18} color={iconColor} style={styles.leftIcon} />
          )}
          
          <TextInput
            value={value}
            onChangeText={onChangeText}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholderTextColor={placeholderTextColor}
            style={[styles.input, inputStyle, style]}
            {...textInputProps}
          />
          
          {loading && (
            <ActivityIndicator size="small" color={COLORS.primary} style={styles.rightIcon} />
          )}
          
          {!loading && showChevron && (
            <TouchableOpacity 
              onPress={() = accessibilityRole="button" accessibilityLabel="Button"> {
                if (suggestions.length > 0) {
                  setSuggestions([]);
                } else {
                  handleQuery(value || ' ');
                }
              }}
              style={styles.rightIcon}
            >
              <Ionicons 
                name={showSuggestions && suggestions.length > 0 ? "chevron-up-outline" : "chevron-down-outline"} 
                size={18} 
                color={iconColor} 
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Inline Dropdown */}
        {showSuggestions && (
          <View style={[
            styles.dropdown,
            (forceShowAbove || showAbove) ? styles.dropdownAbove : styles.dropdownBelow,
            dropdownStyle
          ]}>
            <ScrollView
              nestedScrollEnabled={true}
              keyboardShouldPersistTaps="handled"
              style={styles.scrollView}
            >
              {suggestions.length > 0 ? (
                suggestions.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.item,
                      index === suggestions.length - 1 && styles.lastItem,
                      itemStyle
                    ]}
                    onPress={() = accessibilityRole="button" accessibilityLabel="Button"> handleSelect(item)}
                  >
                    <Ionicons
                      name={item.isCustom ? "add-circle-outline" : "location-outline"}
                      size={16}
                      color={COLORS.primary}
                      style={styles.itemIcon}
                    />
                    <Text
                      style={[
                        styles.itemText,
                        item.isCustom && { color: COLORS.primary, fontWeight: '600' },
                        itemTextStyle
                      ]}
                      numberOfLines={1}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.noResults}>
                  <Text style={[styles.noResultsText, noResultsStyle]}>
                    No results found
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        )}
      </View>
      
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  inputWrapperContainer: {
    position: 'relative',
    zIndex: 50,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
  },
  inputWrapperError: {
    borderColor: COLORS.error,
  },
  leftIcon: {
    marginRight: SPACING.sm,
  },
  rightIcon: {
    padding: SPACING.xs,
  },
  input: {
    flex: 1,
    paddingVertical: SPACING.sm + 4,
    fontSize: 16,
    color: COLORS.text,
  },
  error: {
    fontSize: 12,
    color: COLORS.error,
    marginTop: SPACING.xs,
  },
  dropdown: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    maxHeight: 220,
    overflow: 'hidden',
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 5,
  },
  dropdownBelow: {
    top: 56,
  },
  dropdownAbove: {
    bottom: '100%',
    marginBottom: 6,
  },
  scrollView: {
    maxHeight: 220,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  itemIcon: {
    marginRight: SPACING.sm,
  },
  itemText: {
    color: COLORS.text,
    fontSize: 14,
    flex: 1,
  },
  noResults: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noResultsText: {
    color: COLORS.textLight,
    fontSize: 14,
    fontStyle: 'italic',
  },
});
