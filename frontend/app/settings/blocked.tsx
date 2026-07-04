import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  TextInput,
  BackHandler,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS } from '../../src/constants/theme';
import api from '../../src/services/api';
import { Avatar } from '../../src/components/Avatar';
import { useTranslation } from '../../src/utils/i18n';

interface BlockedUser {
  id: string;
  name: string;
  username: string;
  sl_id: string;
  photo_url: string;
}

export default function BlockedAccountsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [unblockingIds, setUnblockingIds] = useState<string[]>([]);

  const handleBack = useCallback(() => {
    router.replace('/settings/privacy');
  }, [router]);

  useEffect(() => {
    const backAction = () => {
      handleBack();
      return true;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => subscription.remove();
  }, [handleBack]);

  useEffect(() => {
    fetchBlockedUsers();
  }, []);

  const fetchBlockedUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/user/blocked');
      if (Array.isArray(response.data)) {
        setBlockedUsers(response.data);
      }
    } catch (error) {
      console.error('Error fetching blocked users:', error);
      Alert.alert(t('error'), 'Failed to fetch blocked users list.');
    } finally {
      setLoading(false);
    }
  };

  const handleUnblock = async (userId: string, userName: string) => {
    Alert.alert(
      t('unblockConfirmTitle'),
      `${t('unblockConfirmMessage')}\n(${userName})`,
      [
        {
          text: t('no'),
          style: 'cancel',
        },
        {
          text: t('yes'),
          onPress: () => performUnblock(userId),
        },
      ]
    );
  };

  const performUnblock = async (userId: string) => {
    setUnblockingIds((prev) => [...prev, userId]);
    try {
      await api.post(`/users/${userId}/unblock`);
      // Update local state by filtering out the unblocked user
      setBlockedUsers((prev) => prev.filter((u) => u.id !== userId));
      Alert.alert('Success', t('unblockSuccess'));
    } catch (error) {
      console.error('Error unblocking user:', error);
      Alert.alert(t('error'), 'Failed to unblock user. Please try again.');
    } finally {
      setUnblockingIds((prev) => prev.filter((id) => id !== userId));
    }
  };

  // Filter blocked users based on search query
  const filteredUsers = blockedUsers.filter((user) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    return (
      user.name.toLowerCase().includes(query) ||
      user.username.toLowerCase().includes(query) ||
      user.sl_id.toLowerCase().includes(query)
    );
  });

  const renderBlockedUser = ({ item, index }: { item: BlockedUser; index: number }) => {
    const isUnblocking = unblockingIds.includes(item.id);
    return (
      <View style={styles.userCard}>
        <View style={styles.userInfo}>
          <Avatar name={item.name} photo={item.photo_url} size={48} />
          <View style={styles.userTextContainer}>
            <Text style={styles.userName} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.userHandle} numberOfLines={1}>
              @{item.sl_id || item.username || 'user'}
            </Text>
          </View>
        </View>
        
        <TouchableOpacity
          style={[styles.unblockButton, isUnblocking && styles.disabledButton]}
          onPress={() => handleUnblock(item.id, item.name)}
          disabled={isUnblocking}
          activeOpacity={0.7}
        >
          {isUnblocking ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.unblockButtonText}>{t('unblock')}</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('blockedAccounts')}</Text>
      </View>

      {/* Search Bar */}
      {blockedUsers.length > 0 && (
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color={COLORS.textSecondary} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder={t('searchBlockedPlaceholder')}
              placeholderTextColor={COLORS.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Content */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : filteredUsers.length > 0 ? (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item.id}
          renderItem={renderBlockedUser}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.centerContainer}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="ban-outline" size={64} color={COLORS.textSecondary} />
          </View>
          <Text style={styles.emptyTitle}>
            {searchQuery ? 'No results found' : t('noBlockedUsers')}
          </Text>
          <Text style={styles.emptySubtitle}>
            {searchQuery
              ? 'Try searching with a different name or SL ID.'
              : 'Accounts that you block will show up here.'}
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  backButton: {
    marginRight: SPACING.md,
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  searchContainer: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xs,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.sm,
    height: 44,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  searchIcon: {
    marginRight: SPACING.xs,
  },
  searchInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 15,
  },
  listContent: {
    padding: SPACING.md,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  userTextContainer: {
    flex: 1,
    marginLeft: SPACING.md,
    marginRight: SPACING.sm,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  userHandle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  unblockButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
    height: 32,
  },
  unblockButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
