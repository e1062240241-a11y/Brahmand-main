import React, { forwardRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextInputProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface VendorSearchBarProps extends Omit<TextInputProps, 'style'> {
  searchTerm: string;
  setSearchTerm: (text: string) => void;
  placeholder?: string;
  containerStyle?: StyleProp<ViewStyle>;
  onClear?: () => void;
}

export const VendorSearchBar = React.memo(
  forwardRef<TextInput, VendorSearchBarProps>(function VendorSearchBar(
    {
      searchTerm,
      setSearchTerm,
      placeholder = 'Search services...',
      containerStyle,
      onClear,
      ...textInputProps
    },
    ref
  ) {
    const handleClear = () => {
      setSearchTerm('');
      if (onClear) onClear();
    };

    return (
      <View style={[styles.figmaSearchContainer, containerStyle]}>
        <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
        <TextInput
          ref={ref}
          style={styles.figmaSearchInput}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          value={searchTerm}
          onChangeText={setSearchTerm}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
          {...textInputProps}
        />
        {!!searchTerm && (
          <TouchableOpacity
            onPress={handleClear}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel="Clear search"
          >
            <Ionicons name="close-circle" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>
    );
  })
);

const styles = StyleSheet.create({
  figmaSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    borderRadius: 26,
    height: 52,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  searchIcon: {
    marginRight: 8,
  },
  figmaSearchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    paddingVertical: 0,
  },
});

export default VendorSearchBar;
