import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, BORDER_RADIUS, SPACING } from '../constants/theme';

interface BadgeProps {
  name: string;
  size?: 'small' | 'medium';
}

const DEFAULT_CONFIG: { color: string; icon: keyof typeof Ionicons.glyphMap } = {
  color: COLORS.textSecondary,
  icon: 'ribbon',
};

const BADGE_CONFIG: Record<string, { color: string; icon: keyof typeof Ionicons.glyphMap }> = {
  'New Member': { color: COLORS.textSecondary, icon: 'person' },
  'Verified Member': { color: COLORS.badge.verified, icon: 'checkmark-circle' },
  'Trusted Community Member': { color: COLORS.badge.trusted, icon: 'shield-checkmark' },
  'Temple Volunteer': { color: COLORS.badge.volunteer, icon: 'heart' },
  'Event Organizer': { color: COLORS.badge.organizer, icon: 'calendar' },
  'Community Helper': { color: COLORS.success, icon: 'hand-left' },
  'Verified Vendor': { color: COLORS.badge.vendor, icon: 'storefront' },
  'Local Resident': { color: COLORS.info, icon: 'home' },
};

// Varnish Fix: Memoize Badge component to eliminate unnecessary re-renders in list items and profiles.
// Move inline font sizes to StyleSheet and extract DEFAULT_CONFIG fallback object.
export const Badge: React.FC<BadgeProps> = React.memo(({ name, size = 'small' }) => {
  const config = BADGE_CONFIG[name] || DEFAULT_CONFIG;
  const isSmall = size === 'small';
  const iconSize = isSmall ? 12 : 16;

  return (
    <View
      style={[styles.badge, { backgroundColor: `${config.color}20` }]}
      accessibilityRole="text"
      accessibilityLabel={`Badge: ${name}`}
    >
      <Ionicons name={config.icon} size={iconSize} color={config.color} />
      <Text style={[styles.text, { color: config.color }, isSmall ? styles.textSmall : styles.textMedium]}>
        {name}
      </Text>
    </View>
  );
});

Badge.displayName = 'Badge';

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
    marginRight: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  text: {
    marginLeft: 4,
    fontWeight: '500',
  },
  textSmall: {
    fontSize: 10,
  },
  textMedium: {
    fontSize: 12,
  },
});
