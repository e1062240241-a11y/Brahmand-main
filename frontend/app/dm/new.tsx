import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, TextInput, FlatList, Image, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../src/components/Button';
import { getAllUsers, getConversations, sendDirectMessage } from '../../src/services/api';
import { COLORS, SPACING, BORDER_RADIUS } from '../../src/constants/theme';
import { Avatar } from '../../src/components/Avatar';
import { useAuthStore } from '../../src/store/authStore';

const toParamString = (value: string | string[] | undefined): string => {
  if (Array.isArray(value)) {
    return value[0] || '';
  }
  return value || '';
};

export default function NewDMScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ userId?: string; userName?: string; userSL?: string }>();
  const { user } = useAuthStore();

  const selectedUserId = toParamString(params.userId as any);
  const selectedUserName = toParamString(params.userName as any);
  const selectedUserSL = toParamString(params.userSL as any);

  const [message, setMessage] = useState('');
  const [foundUser, setFoundUser] = useState<any>(null);
  const [sending, setSending] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [error, setError] = useState('');

  // Pre-fill if coming from user list click (stable deps to avoid render loops on web)
  useEffect(() => {
    if (selectedUserId && selectedUserName && selectedUserSL) {
      if (foundUser?.id === selectedUserId) {
        return;
      }
      setFoundUser({
        id: selectedUserId,
        name: selectedUserName,
        sl_id: selectedUserSL
      });
      setError('');
    }
  }, [selectedUserId, selectedUserName, selectedUserSL]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const response = await getAllUsers();
      const allUsers = response.data || [];
      const otherUsers = allUsers.filter((u: any) => u.id !== user?.id);
      setUsers(otherUsers);
      setFilteredUsers(otherUsers);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load users');
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleUserSearch = (query: string) => {
    setUserSearchQuery(query);
    if (!query.trim()) {
      setFilteredUsers(users);
      return;
    }

    const q = query.toLowerCase();
    const filtered = users.filter((u: any) =>
      u.name?.toLowerCase().includes(q) ||
      u.sl_id?.toLowerCase().includes(q)
    );
    setFilteredUsers(filtered);
  };

  const handleBackNavigation = () => {
    try {
      router.replace('/messages');
    } catch (e) {
      console.warn('[New DM] Back navigation failed:', e);
    }
  };

  const handleSelectUser = async (selectedUser: any) => {
    setError('');
    try {
      const convResponse = await getConversations();
      const conversations = convResponse.data || [];
      const existingConv = conversations.find((c: any) => c.user?.id === selectedUser.id);
      const conversationId = existingConv?.conversation_id || existingConv?.chat_id || existingConv?.id;

      if (conversationId) {
        router.replace(`/dm/${conversationId}`);
        return;
      }

      setFoundUser(selectedUser);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Could not open chat');
    }
  };

  const handleSend = async () => {
    if (!foundUser || !message.trim()) return;

    setSending(true);
    try {
      const response = await sendDirectMessage(foundUser.sl_id, message.trim());
      // Navigate to the chat conversation
      router.replace(`/dm/${response.data.chat_id}`);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to send message');
      setSending(false);
    }
  };

  const renderUserItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.userItem} onPress={() => handleSelectUser(item)}>
      <View style={styles.userAvatar}>
        {item.photo ? (
          <Image source={{ uri: item.photo }} style={styles.avatarImage} />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarText}>{item.name?.charAt(0)?.toUpperCase() || '?'}</Text>
          </View>
        )}
      </View>
      <View style={styles.userMeta}>
        <Text style={styles.userName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.userSl}>SL: {item.sl_id}</Text>
      </View>
      <Ionicons name="chatbubble-outline" size={20} color={COLORS.primary} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBackNavigation}>
            <Ionicons name="close" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Message</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.content}>
          <View style={styles.topActions}>
            <TouchableOpacity
              style={styles.createGroupPill}
              onPress={() => router.push('/circle/create')}
            >
              <Ionicons name="add" size={16} color={COLORS.primary} />
              <Text style={styles.createGroupText}>Create Group</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.searchWrap}>
            <Ionicons name="search" size={18} color={COLORS.textLight} />
            <TextInput
              style={styles.searchInputText}
              placeholder="Search users by name or SL number"
              placeholderTextColor={COLORS.textLight}
              value={userSearchQuery}
              onChangeText={handleUserSearch}
            />
            {userSearchQuery.length > 0 && (
              <TouchableOpacity onPress={() => handleUserSearch('')}>
                <Ionicons name="close-circle" size={18} color={COLORS.textLight} />
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.label}>All Registered Users</Text>

          {loadingUsers ? (
            <ActivityIndicator size="large" color={COLORS.primary} style={{ marginVertical: SPACING.lg }} />
          ) : (
            <FlatList
              data={filteredUsers}
              renderItem={renderUserItem}
              keyExtractor={(item) => item.id}
              style={styles.usersList}
              contentContainerStyle={{ paddingBottom: SPACING.lg }}
              ListEmptyComponent={
                <Text style={styles.emptyUsersText}>No users found</Text>
              }
            />
          )}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          {/* Found User */}
          {foundUser && (
            <View style={styles.userCard}>
              <Avatar name={foundUser.name} photo={foundUser.photo} size={50} />
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{foundUser.name}</Text>
                <Text style={styles.userSlId}>{foundUser.sl_id}</Text>
              </View>
              <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
            </View>
          )}

          {/* Message Input */}
          {foundUser && (
            <View style={styles.messageSection}>
              <Text style={styles.label}>Message</Text>
              <TextInput
                placeholder="Type your message..."
                placeholderTextColor={COLORS.textLight}
                value={message}
                onChangeText={setMessage}
                multiline
                style={styles.messageInput}
              />
              <Button
                title="Send Message"
                onPress={handleSend}
                loading={sending}
                disabled={!message.trim()}
              />
            </View>
          )}

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  content: {
    flex: 1,
    padding: SPACING.lg,
  },
  topActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: SPACING.sm,
  },
  createGroupPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.primary}15`,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 16,
    gap: 4,
  },
  createGroupText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 13,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.divider,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  searchInputText: {
    flex: 1,
    color: COLORS.text,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xs,
    fontSize: 14,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  usersList: {
    flex: 1,
    marginBottom: 0,
  },
  emptyUsersText: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    paddingVertical: SPACING.md,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    marginRight: SPACING.sm,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  userMeta: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  userSl: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  error: {
    color: COLORS.error,
    marginTop: SPACING.sm,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    marginTop: SPACING.lg,
  },
  userInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  userSlId: {
    fontSize: 12,
    color: COLORS.primary,
    marginTop: 2,
  },
  messageSection: {
    marginTop: SPACING.lg,
  },
  messageInput: {
    height: 100,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.divider,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.md,
    color: COLORS.text,
    textAlignVertical: 'top',
  },
});
