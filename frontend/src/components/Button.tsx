import React, { useCallback, useMemo } from 'react';
import { Pressable, Text, StyleSheet, ViewStyle, TextStyle, StyleProp } from 'react-native';
import { COLORS, BORDER_RADIUS, SPACING } from '../constants/theme';
import { OmSpinner } from './CustomRefreshControl';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

const ANDROID_RIPPLE_PRIMARY = {
  color: 'rgba(255, 255, 255, 0.2)',
  borderless: false,
};

const ANDROID_RIPPLE_OUTLINE = {
  color: 'rgba(255, 107, 0, 0.15)',
  borderless: false,
};

// Varnish fix: Wrapped with React.memo, extracted static android_ripple configs, replaced inline pressed opacity object and StyleSheet.flatten allocations with StyleSheet.create definitions.
export const Button = React.memo<ButtonProps>(({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  textStyle,
}) => {
  const isOutline = variant === 'outline';
  const isSecondary = variant === 'secondary';

  const getStyle = useCallback(
    ({ pressed }: { pressed: boolean }) => [
      styles.button,
      variant === 'primary' && styles.primary,
      isSecondary && styles.secondary,
      isOutline && styles.outline,
      disabled && styles.disabled,
      pressed && !disabled && !loading && styles.pressed,
      style,
    ],
    [variant, isSecondary, isOutline, disabled, loading, style]
  );

  const textStyleFinal = useMemo(
    () => [
      styles.text,
      variant === 'primary' && styles.textPrimary,
      isSecondary && styles.textSecondary,
      isOutline && styles.textOutline,
      textStyle,
    ],
    [variant, isSecondary, isOutline, textStyle]
  );

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      style={getStyle}
      onPress={onPress}
      disabled={disabled || loading}
      android_ripple={isOutline ? ANDROID_RIPPLE_OUTLINE : ANDROID_RIPPLE_PRIMARY}
    >
      {loading ? (
        <OmSpinner size="small" color={isOutline ? COLORS.primary : COLORS.textWhite} />
      ) : (
        <Text style={textStyleFinal}>{title}</Text>
      )}
    </Pressable>
  );
});

Button.displayName = 'Button';

const styles = StyleSheet.create({
  button: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
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
  pressed: {
    opacity: 0.8,
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
