import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps } from 'react-native';
import { COLORS, BORDER_RADIUS, SPACING } from '../constants/theme';
import { validateInput, ValidationRules } from '../utils/validation';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  rules?: ValidationRules;
  onErrorChange?: (error: string | null) => void;
}

export const Input: React.FC<InputProps> = ({ label, error: externalError, rules, onErrorChange, style, onBlur, ...props }) => {
  const [internalValue, setInternalValue] = useState(props.defaultValue || '');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  const displayValue = props.value !== undefined ? props.value : internalValue;
  const stringValue = typeof displayValue === 'string' ? displayValue : '';
  const currentLength = stringValue.length;

  const activeError = externalError || (touched ? validationError : null);

  const runValidation = (text: string) => {
    if (rules || rules?.preventInjection !== false) {
      const err = validateInput(text, rules || { preventInjection: true });
      setValidationError(err);
      if (onErrorChange) {
        onErrorChange(err);
      }
    }
  };

  const handleChangeText = (text: string) => {
    setTouched(true);
    if (props.value === undefined) {
      setInternalValue(text);
    }
    runValidation(text);
    if (props.onChangeText) {
      props.onChangeText(text);
    }
  };

  const handleBlur = (e: any) => {
    setTouched(true);
    runValidation(stringValue);
    if (onBlur) {
      onBlur(e);
    }
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[
          styles.input,
          activeError ? styles.inputError : null,
          style,
        ]}
        placeholderTextColor={COLORS.textLight}
        accessibilityLabel={label}
        aria-invalid={!!activeError}
        aria-errormessage={activeError || undefined}
        {...props}
        onChangeText={handleChangeText}
        onBlur={handleBlur}
      />
      {props.maxLength && (
        <Text
          style={styles.charCount}
          accessibilityLabel={`${currentLength} of ${props.maxLength} characters used`}
          accessibilityRole="text"
        >
          {currentLength}/{props.maxLength}
        </Text>
      )}
      {activeError ? <Text style={styles.error}>{activeError}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 4,
    fontSize: 16,
    color: COLORS.text,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  error: {
    fontSize: 12,
    color: COLORS.error,
    marginTop: SPACING.xs,
  },
  charCount: {
    fontSize: 12,
    color: COLORS.textLight,
    textAlign: 'right',
    marginTop: 4,
    marginRight: 4,
  },
});
