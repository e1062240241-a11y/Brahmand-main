import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { COLORS, BORDER_RADIUS, SPACING } from '../constants/theme';
import { OmSpinner } from './CustomRefreshControl';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

/**
 * Varnish performance fixes:
 * 1. Wrapped component in `React.memo` to eliminate unnecessary button re-renders during parent screen state changes.
 * 2. Removed inline object creation `{ opacity: 0.8 }` inside `Pressable` style callback and moved it to `styles.pressed` in `StyleSheet.create`.
 * 3. Removed runtime `StyleSheet.flatten` array wrapper to avoid unnecessary object allocations during press/render cycles.
 */
export const Button: React.FC<ButtonProps> = React.memo(({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  textStyle,
}) => {
  const textStyleFinal = [
    styles.text,
    variant === 'primary' && styles.textPrimary,
    variant === 'secondary' && styles.textSecondary,
    variant === 'outline' && styles.textOutline,
    textStyle,
  ];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      style={({ pressed }) => [
        styles.button,
        variant === 'primary' && styles.primary,
        variant === 'secondary' && styles.secondary,
        variant === 'outline' && styles.outline,
        disabled && styles.disabled,
        pressed && !disabled && !loading && styles.pressed,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      android_ripple={{
        color: variant === 'outline' ? 'rgba(255, 107, 0, 0.15)' : 'rgba(255, 255, 255, 0.2)',
        borderless: false,
      }}
    >
      {loading ? (
        <OmSpinner size="small" color={variant === 'outline' ? COLORS.primary : COLORS.textWhite} />
      ) : (
        <Text style={textStyleFinal}>{title}</Text>
      )}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  button: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  pressed: {
    opacity: 0.8,
  },
  primary: {
    backgroundColor: COLORS.primary,
  },
  secondary: {
    backgroundColor: COLORS.secondary,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
  textPrimary: {
    color: COLORS.textWhite,
  },
  textSecondary: {
    color: COLORS.textWhite,
  },
  textOutline: {
    color: COLORS.primary,
  },
});
