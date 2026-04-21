import React, { useState, useCallback, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image,
  RefreshControl,
  Alert,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';
import { getUserProfile } from '../../src/services/api';
import { Avatar } from '../../src/components/Avatar';
import { COLORS, SPACING, BORDER_RADIUS } from '../../src/constants/theme';

const MENU_ITEMS = [
  { id: 'edit', icon: 'person-circle', label: 'Edit Profile', route: '/profile/edit' },
  { id: 'location', icon: 'location', label: 'Change Location', route: '/settings/location', disabled: true, subLabel: 'Coming soon' },
  { id: 'privacy', icon: 'shield-checkmark', label: 'Privacy', route: '/settings/privacy', disabled: true, subLabel: 'Coming soon' },
  { id: 'notifications', icon: 'notifications', label: 'Notifications', route: '/settings/notifications' },
  { id: 'kyc', icon: 'document-text', label: 'KYC Verification', route: '/kyc' },
  { id: 'badges', icon: 'ribbon', label: 'Community Badges', route: '/badges', disabled: true, subLabel: 'Coming soon' },
];

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, updateUser } = useAuthStore();
  const userId = user?.id;
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await getUserProfile();
      setProfile(res.data);
      updateUser(res.data || {});
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      if (error?.response?.status === 401 || error?.response?.status === 502) {
        // token may be invalid/expired, force logout and go to login
        await logout();
        router.replace('/');
      }
    } finally {
      setRefreshing(false);
    }
  }, [logout, router, updateUser]);

  useEffect(() => {
    if (!userId) {
      router.replace('/');
      return;
    }
    fetchProfile();
  }, [fetchProfile, router, userId]);

  const handleMenuPress = (item: any) => {
    if (item.disabled) {
      return;
    }
    if (item.route) {
      router.push(item.route as any);
    }
  };

  const performLogout = async () => {
    await logout();
    router.replace('/');
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      performLogout();
      return;
    }

    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => {
          performLogout();
        } },
      ]
    );
  };

  const displayUser = profile || user;

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchProfile(); }} />
      }
    >
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          {displayUser?.photo ? (
            <Image source={{ uri: displayUser.photo }} style={styles.avatar} />
          ) : (
            <Avatar name={displayUser?.name || 'User'} size={100} />
          )}
          {displayUser?.is_verified && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
            </View>
          )}
        </View>
        <Text style={styles.userName}>{displayUser?.name || 'User'}</Text>
        <Text style={styles.userId}>{displayUser?.sl_id || ''}</Text>
        
        {/* Location Info */}
        {displayUser?.home_location && (
          <View style={styles.locationRow}>
            <Ionicons name="location" size={14} color={COLORS.textSecondary} />
            <Text style={styles.locationText}>
              {displayUser.home_location.area}, {displayUser.home_location.city}
            </Text>
          </View>
        )}
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{displayUser?.communities?.length || 0}</Text>
          <Text style={styles.statLabel}>Communities</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{displayUser?.badges?.length || 0}</Text>
          <Text style={styles.statLabel}>Badges</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{displayUser?.reputation || 0}</Text>
          <Text style={styles.statLabel}>Reputation</Text>
        </View>
      </View>

      {/* Horoscope Profile removed per request */}

      {/* Menu Items */}
      <View style={styles.menuSection}>
        {MENU_ITEMS.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[styles.menuItem, item.disabled && styles.menuItemDisabled]}
            activeOpacity={item.disabled ? 1 : 0.7}
            onPress={() => handleMenuPress(item)}
          >
            <View style={styles.menuIconContainer}>
              <Ionicons name={item.icon as any} size={22} color={COLORS.primary} />
            </View>
            <View style={styles.menuLabelContainer}>
              <Text style={styles.menuLabel}>{item.label}</Text>
              {item.disabled && <Text style={styles.menuSubLabel}>{item.subLabel}</Text>}
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
          </TouchableOpacity>
        ))}
      </View>

      {/* Guidelines Link */}
      <TouchableOpacity 
        style={styles.guidelinesLink}
        onPress={() => router.push('/settings/guidelines')}
      >
        <Ionicons name="document-text" size={18} color={COLORS.info} />
        <Text style={styles.guidelinesText}>Community Guidelines</Text>
      </TouchableOpacity>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out" size={20} color={COLORS.error} />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    backgroundColor: COLORS.surface,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: SPACING.md,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  userId: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    borderRadius: 16,
    padding: SPACING.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: COLORS.divider,
    marginVertical: 8,
  },
  astrologyCard: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.surface,
  },
  astrologyCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  astrologyIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#EAF3FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  astrologyCardContent: {
    flex: 1,
  },
  astrologyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  astrologySubtitle: {
    marginTop: 4,
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  astrologyBadge: {
    alignSelf: 'flex-start',
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.full,
  },
  astrologyBadgeReady: {
    backgroundColor: `${COLORS.success}15`,
  },
  astrologyBadgePending: {
    backgroundColor: `${COLORS.warning}18`,
  },
  astrologyBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  astrologyBadgeTextReady: {
    color: COLORS.success,
  },
  astrologyBadgeTextPending: {
    color: COLORS.warning,
  },
  menuSection: {
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    borderRadius: 16,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: `${COLORS.primary}10`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  menuLabel: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
  },
  menuLabelContainer: {
    flex: 1,
  },
  menuSubLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  menuItemDisabled: {
    backgroundColor: `${COLORS.divider}15`,
  },
  guidelinesLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.lg,
  },
  guidelinesText: {
    fontSize: 14,
    color: COLORS.info,
    marginLeft: SPACING.xs,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  logoutText: {
    fontSize: 16,
    color: COLORS.error,
    fontWeight: '600',
    marginLeft: SPACING.sm,
  },
  // Lok Sangam Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: SPACING.lg,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  lockedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.error}15`,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
  },
  lockedText: {
    fontSize: 13,
    color: COLORS.error,
    marginLeft: SPACING.xs,
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    marginTop: SPACING.xl,
  },
});
