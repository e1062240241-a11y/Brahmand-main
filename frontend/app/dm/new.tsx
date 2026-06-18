import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, TextInput, ScrollView, Image } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
  const params = useLocalSearchParams<{ userId?: string; userName?: string; userSL?: string; shareText?: string }>();
  const { user } = useAuthStore();
  const searchInputRef = useRef<TextInput>(null);

  const selectedUserId = toParamString(params.userId as any);
  const selectedUserName = toParamString(params.userName as any);
  const selectedUserSL = toParamString(params.userSL as any);
  const initialShareText = toParamString(params.shareText as any);

  const [message, setMessage] = useState(initialShareText || '');
  const [foundUser, setFoundUser] = useState<any>(null);
  const [sending, setSending] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [frequentUsers, setFrequentUsers] = useState<any[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<any[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [error, setError] = useState('');

  // Pre-fill if coming from user list click (stable deps to avoid render loops on web)
  useEffect(() => {
    if (selectedUserId && selectedUserName && selectedUserSL) {
      if (foundUser?.id === selectedUserId) {
        return;
      }
      
      const checkExisting = async () => {
        try {
          const convResponse = await getConversations();
          const conversations = convResponse.data || [];
          const existingConv = conversations.find((c: any) => c.user?.id === selectedUserId);
          const conversationId = existingConv?.conversation_id || existingConv?.chat_id || existingConv?.id;

          if (conversationId) {
            router.replace(`/dm/${conversationId}`);
            return;
          }
          
          setFoundUser({
            id: selectedUserId,
            name: selectedUserName,
            sl_id: selectedUserSL
          });
          setError('');
        } catch (e) {
          // Fallback to manual selection if API fails
          setFoundUser({
            id: selectedUserId,
            name: selectedUserName,
            sl_id: selectedUserSL
          });
        }
      };

      checkExisting();
    }
  }, [selectedUserId, selectedUserName, selectedUserSL]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const [usersResponse, convResponse] = await Promise.all([
        getAllUsers(),
        getConversations().catch(() => ({ data: [] }))
      ]);
      const allUsers = usersResponse.data || [];
      const conversationsList = convResponse.data || [];
      const otherUsers = allUsers.filter((u: any) => u.id !== user?.id);

      const chattedUserIds = new Set(
        conversationsList.map((c: any) => c.user?.id).filter(Boolean)
      );
      
      let frequent = otherUsers.filter((u: any) => chattedUserIds.has(u.id));
      let suggested = otherUsers.filter((u: any) => !chattedUserIds.has(u.id));
      
      if (frequent.length === 0 && otherUsers.length > 0) {
        frequent = otherUsers.slice(0, 3);
        suggested = otherUsers.slice(3);
      }
      
      setUsers(otherUsers);
      setFrequentUsers(frequent);
      setSuggestedUsers(suggested);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load users');
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleUserSearch = (query: string) => {
    setUserSearchQuery(query);
  };

  const filteredFrequent = useMemo(() => {
    if (!userSearchQuery.trim()) return frequentUsers;
    const q = userSearchQuery.toLowerCase();
    return frequentUsers.filter((u: any) =>
      u.name?.toLowerCase().includes(q) ||
      u.sl_id?.toLowerCase().includes(q)
    );
  }, [userSearchQuery, frequentUsers]);

  const filteredSuggested = useMemo(() => {
    if (!userSearchQuery.trim()) return suggestedUsers;
    const q = userSearchQuery.toLowerCase();
    return suggestedUsers.filter((u: any) =>
      u.name?.toLowerCase().includes(q) ||
      u.sl_id?.toLowerCase().includes(q)
    );
  }, [userSearchQuery, suggestedUsers]);

  const handleBackNavigation = () => {
    try {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/messages?tab=Private%20Chat');
      }
    } catch (e) {
      console.warn('[New DM] Back navigation failed:', e);
      router.replace('/messages?tab=Private%20Chat');
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
      router.replace(`/dm/${response.data.chat_id}`);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to send message');
      setSending(false);
    }
  };

  const renderUserItem = (item: any) => (
    <TouchableOpacity key={item.id} style={styles.userRow} onPress={() => handleSelectUser(item)}>
      <Avatar name={item.name} photo={item.photo} size={42} />
      <View style={styles.userMeta}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={styles.userName} numberOfLines={1}>{item.name}</Text>
          {item.is_verified && (
            <MaterialCommunityIcons name="check-decagram" size={14} color="#FF6B00" style={{ marginLeft: 4 }} />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <LinearGradient
      colors={['#FF8D57', '#EA9B76', '#FFEEE5']}
      locations={[0, 0.09, 0.25]}
      style={styles.container}
    >
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleBackNavigation} style={styles.backButton}>
              <Ionicons name="chevron-back" size={24} color="#111111" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>New Chat</Text>
          </View>

          <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
            {/* If no user is selected yet, show search + list */}
            {!foundUser && (
              <>
                <View style={styles.searchContainer}>
                  <View style={styles.searchBar}>
                    <Ionicons name="search" size={20} color="#777" />
                    <TextInput
                      ref={searchInputRef}
                      style={styles.searchInput}
                      placeholder="Find people, groups"
                      placeholderTextColor="#777"
                      value={userSearchQuery}
                      onChangeText={handleUserSearch}
                    />
                    {userSearchQuery.length > 0 && (
                      <TouchableOpacity onPress={() => handleUserSearch('')}>
                        <Ionicons name="close-circle" size={18} color="#777" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {/* Quick Row Actions */}
                <View style={styles.rowActionsContainer}>
                  <TouchableOpacity
                    style={styles.actionRow}
                    onPress={() => router.push('/circle/create')}
                  >
                    <MaterialCommunityIcons name="account-group-outline" size={24} color="#111" />
                    <Text style={styles.actionText}>New Group</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionRow}
                    onPress={() => searchInputRef.current?.focus()}
                  >
                    <MaterialCommunityIcons name="account-outline" size={24} color="#111" />
                    <Text style={styles.actionText}>New Contact</Text>
                  </TouchableOpacity>
                </View>

                {loadingUsers ? (
                  <ActivityIndicator size="large" color="#FF8D57" style={{ marginVertical: 32 }} />
                ) : (
                  <View style={{ paddingBottom: 32 }}>
                    {/* Frequently Contacted Section */}
                    {filteredFrequent.length > 0 && (
                      <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Frequently contacted</Text>
                        {filteredFrequent.map(renderUserItem)}
                      </View>
                    )}

                    {/* Suggested Section */}
                    {filteredSuggested.length > 0 && (
                      <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Suggested</Text>
                        {filteredSuggested.map(renderUserItem)}
                      </View>
                    )}

                    {filteredFrequent.length === 0 && filteredSuggested.length === 0 && (
                      <Text style={styles.emptyText}>No users found</Text>
                    )}
                  </View>
                )}

                {error ? <Text style={styles.error}>{error}</Text> : null}
              </>
            )}

            {/* Compose view: shown when a user is selected */}
            {foundUser && (
              <View style={styles.composeContainer}>
                <View style={styles.userCard}>
                  <Avatar name={foundUser.name} photo={foundUser.photo} size={50} />
                  <View style={styles.userInfo}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={styles.selectedUserName}>{foundUser.name}</Text>
                      {(foundUser.is_verified || foundUser.isVerified) && (
                        <MaterialCommunityIcons name="check-decagram" size={14} color="#FF6B00" style={{ marginLeft: 4 }} />
                      )}
                    </View>
                    <Text style={styles.userSlId}>{foundUser.sl_id}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setFoundUser(null)}>
                    <Ionicons name="close-circle" size={24} color="#777" />
                  </TouchableOpacity>
                </View>

                {error ? <Text style={styles.error}>{error}</Text> : null}

                <View style={styles.messageSection}>
                  <Text style={styles.label}>Message</Text>
                  <TextInput
                    placeholder="Type your message..."
                    placeholderTextColor="#777"
                    value={message}
                    onChangeText={setMessage}
                    multiline
                    autoFocus
                    style={styles.messageInput}
                    textAlignVertical="top"
                  />
                  <Button
                    title="Send Message"
                    onPress={handleSend}
                    loading={sending}
                    disabled={!message.trim()}
                  />
                </View>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 16,
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111111',
  },
  content: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginVertical: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 16,
    height: 46,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  searchInput: {
    flex: 1,
    height: '100%',
    marginLeft: 8,
    fontSize: 15,
    color: '#111111',
  },
  rowActionsContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  actionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111111',
    marginLeft: 12,
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333333',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  userMeta: {
    marginLeft: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111111',
  },
  emptyText: {
    textAlign: 'center',
    color: '#777777',
    marginTop: 32,
    fontSize: 15,
  },
  error: {
    color: '#FF3B30',
    paddingHorizontal: 16,
    marginTop: 8,
  },
  composeContainer: {
    padding: 16,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  selectedUserName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111111',
  },
  userSlId: {
    fontSize: 12,
    color: '#FF8D57',
    marginTop: 2,
  },
  messageSection: {
    marginTop: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  messageInput: {
    height: 120,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#111111',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
});
