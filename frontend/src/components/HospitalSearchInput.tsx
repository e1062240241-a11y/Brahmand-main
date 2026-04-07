import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/theme';
import { searchHospitals } from '../services/api';

interface HospitalSearchInputProps {
  value: string;
  onSelect: (hospital: { name: string; address: string; area: string; city: string }) => void;
  placeholder?: string;
}

interface HospitalSuggestion {
  name: string;
  address: string;
  area: string;
  city: string;
}

export const HospitalSearchInput: React.FC<HospitalSearchInputProps> = ({
  value,
  onSelect,
  placeholder = 'Search hospital name...',
}) => {
  const [selectedArea, setSelectedArea] = useState('');
  const [hospitalQuery, setHospitalQuery] = useState('');
  const [manualResults, setManualResults] = useState<HospitalSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const handleManualChange = (text: string) => {
    setHospitalQuery(text);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    const q = text.trim();
    if (q.length < 2) {
      setManualResults([]);
      setHasSearched(false);
      return;
    }

    setHasSearched(true);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await searchHospitals(q, 10);
        const rows = response?.data?.results;
        if (Array.isArray(rows) && rows.length > 0) {
          const normalized: HospitalSuggestion[] = rows
            .filter((item: any) => item && item.name)
            .map((item: any) => ({
              name: item.name,
              address: item.address || item.name,
              area: item.area || '',
              city: item.city || '',
            }));
          setManualResults(normalized);
        } else {
          setManualResults([]);
        }
      } catch {
        setManualResults([]);
      } finally {
        setLoading(false);
      }
    }, 350);
  };

  const handleManualSelect = (hospital: HospitalSuggestion) => {
    setHospitalQuery(hospital.name);
    setManualResults([]);
    onSelect({
      name: hospital.name,
      address: hospital.address || hospital.name,
      area: hospital.area || '',
      city: hospital.city || '',
    });
    setSelectedArea(hospital.area || '');
  };

  const handleClear = () => {
    setSelectedArea('');
    setHospitalQuery('');
    setManualResults([]);
    setHasSearched(false);
    onSelect({ name: '', address: '', area: '', city: '' });
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.textInput}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textLight}
        value={hospitalQuery}
        onChangeText={handleManualChange}
      />

      {loading ? (
        <View style={styles.loaderRow}>
          <ActivityIndicator size="small" color={COLORS.primary} />
          <Text style={styles.loaderText}>Searching hospitals...</Text>
        </View>
      ) : (
        hasSearched && manualResults.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hospitalChipScroll}>
            {manualResults.map((hospital) => (
              <TouchableOpacity
                key={`${hospital.name}-${hospital.address}`}
                style={[
                  styles.hospitalChip,
                  hospitalQuery === hospital.name && styles.hospitalChipSelected,
                ]}
                onPress={() => handleManualSelect(hospital)}
              >
                <Text
                  style={[
                    styles.hospitalChipText,
                    hospitalQuery === hospital.name && styles.hospitalChipTextSelected,
                  ]}
                >
                  {hospital.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )
      )}

      {value && (
        <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
          <Ionicons name="close-circle" size={18} color={COLORS.textLight} />
        </TouchableOpacity>
      )}

      {selectedArea ? (
        <View style={styles.areaInfoContainer}>
          <Ionicons name="location" size={14} color={COLORS.primary} />
          <Text style={styles.areaInfoText}>Area: {selectedArea}</Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 100,
  },
  textInputContainer: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.divider,
    paddingHorizontal: SPACING.xs,
  },
  textInput: {
    backgroundColor: COLORS.background,
    color: COLORS.text,
    fontSize: 15,
    paddingVertical: SPACING.sm,
  },
  clearButton: {
    position: 'absolute',
    right: 10,
    top: '50%',
    marginTop: -9,
    zIndex: 10,
  },
  areaInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    backgroundColor: `${COLORS.primary}10`,
    borderRadius: BORDER_RADIUS.sm,
  },
  areaInfoText: {
    marginLeft: SPACING.xs,
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '500',
  },
  hospitalChipScroll: {
    marginTop: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  hospitalChip: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.divider,
    marginRight: SPACING.xs,
  },
  hospitalChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  hospitalChipText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  hospitalChipTextSelected: {
    color: COLORS.surface,
  },
  loaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  loaderText: {
    marginLeft: SPACING.xs,
    fontSize: 12,
    color: COLORS.textSecondary,
  },
});

export default HospitalSearchInput;
