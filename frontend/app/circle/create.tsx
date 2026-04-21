import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView,
  FlatList,
  TextInput,
  Image,
  Alert,
  Share,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Input } from '../../src/components/Input';
import { useAuthStore } from '../../src/store/authStore';
import { Button } from '../../src/components/Button';
import { createCircle, getAllUsers, joinCircle } from '../../src/services/api';
import { COLORS, SPACING, BORDER_RADIUS } from '../../src/constants/theme';

type PrivacyType = 'private' | 'invite_code';

type InviteUser = {
  id: string;
  name?: string;
  photo?: string;
  sl_id?: string;
};

type UserListItemProps = {
  item: InviteUser;
  selected: boolean;
  onPress: (userId: string) => void;
};

const UserListItem = React.memo(({ item, selected, onPress }: UserListItemProps) => {
  return (
    <TouchableOpacity
      style={[styles.userCard, selected && styles.userCardSelected]}
      onPress={() => onPress(item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.userAvatar}>
        {item.photo ? (
          <Image source={{ uri: item.photo }} style={styles.avatarImage} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitial}>{item.name?.charAt(0)?.toUpperCase() || '?'}</Text>
          </View>
        )}
        {selected && (
          <View style={styles.selectedBadge}>
            <Ionicons name="checkmark" size={12} color="#FFFFFF" />
          </View>
        )}
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.name}</Text>
        <Text style={styles.userSL}>SL: {item.sl_id}</Text>
      </View>
      <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
        {selected && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
      </View>
    </TouchableOpacity>
  );
}, (prev, next) => {
  return prev.item.id === next.item.id && prev.selected === next.selected && prev.onPress === next.onPress;
});

const CreateCircleScreen = () => {
  const router = useRouter();
  const { user } = useAuthStore();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [privacy, setPrivacy] = useState<PrivacyType>('invite_code');
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const [createdCircle, setCreatedCircle] = useState<any>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const res = await getAllUsers();
        const allUsers = res.data || [];
        const filtered = allUsers.filter((u: any) => u.id !== user?.id);
        setUsers(filtered);
      } catch (err: any) {
        console.warn('Failed to load users for group invite', err);
      }
    };

    loadUsers();
  }, [user?.id]);

  const toggleUserSelection = useCallback((userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  }, []);

  const renderUserItem = useCallback(
    ({ item }: { item: InviteUser }) => (
      <UserListItem
        item={item}
        selected={selectedUsers.includes(item.id)}
        onPress={toggleUserSelection}
      />
    ),
    [selectedUsers, toggleUserSelection]
  );

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your photo library to upload a group photo.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'] as any,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const removeImage = () => {
    setProfileImage(null);
  };

  const copyCodeToClipboard = async () => {
    if (createdCircle?.code) {
      await Clipboard.setStringAsync(createdCircle.code);
      Alert.alert('Copied!', 'Circle code copied to clipboard');
    }
  };

  const shareCircleLink = async () => {
    if (!createdCircle?.code) return;
    
    const shareUrl = `sanatanlok://join-circle/${createdCircle.code}`;
    const shareMessage = `Join my circle "${createdCircle.name}" on Sanatan Lok!\n\nCircle Code: ${createdCircle.code}\n\nOr use this link: ${shareUrl}`;

    try {
      await Share.share({
        message: shareMessage,
        title: `Join ${createdCircle.name}`,
      });
    } catch (error) {
      await Clipboard.setStringAsync(shareMessage);
      Alert.alert('Link Copied!', 'Share link copied to clipboard. You can paste it in any messaging app.');
    }
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      setError('Please enter a circle name');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await createCircle({
        name: name.trim(),
        description: description.trim() || undefined,
        privacy,
        member_ids: selectedUsers
      });
      setCreatedCircle(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create circle');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinByCode = async () => {
    if (!joinCode.trim()) {
      setJoinError('Please enter a group code');
      return;
    }

    setJoinLoading(true);
    setJoinError('');

    try {
      const response = await joinCircle(joinCode.trim().toUpperCase());
      if (response.data?.circle_id) {
        Alert.alert('Joined!', 'You have successfully joined the group.');
        router.replace(`/chat/circle/${response.data.circle_id}`);
      } else {
        Alert.alert('Joined!', 'You have joined the group.');
      }
    } catch (err: any) {
      setJoinError(err.response?.data?.detail || 'Failed to join group with code');
    } finally {
      setJoinLoading(false);
    }
  };


  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="close" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Circle</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          {!createdCircle ? (
            <>
              <View style={styles.profileImageSection}>
                <TouchableOpacity style={styles.profileImageContainer} onPress={pickImage} activeOpacity={0.7}>
                  {profileImage ? (
                    <>
                      <Image source={{ uri: profileImage }} style={styles.profileImage} />
                      <View style={styles.editBadge}>
                        <Ionicons name="camera" size={16} color="#FFFFFF" />
                      </View>
                      <TouchableOpacity style={styles.removeButton} onPress={removeImage}>
                        <Ionicons name="close-circle" size={24} color="#E53935" />
                      </TouchableOpacity>
                    </>
                  ) : (
                    <View style={styles.profileImagePlaceholder}>
                      <Ionicons name="camera" size={32} color="#0088CC" />
                      <Text style={styles.profileImagePlaceholderText}>Add Photo</Text>
                    </View>
                  )}
                </TouchableOpacity>
                <Text style={styles.profileImageHint}>Add a group photo (optional)</Text>
              </View>

              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Circle Name *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g., Family Circle, Temple Friends"
                  placeholderTextColor={COLORS.textLight}
                  value={name}
                  onChangeText={(text) => {
                    setName(text);
                    setError('');
                  }}
                />
                {error ? <Text style={styles.errorText}>{error}</Text> : null}
              </View>

              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Description (Optional)</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  placeholder="What is this circle about?"
                  placeholderTextColor={COLORS.textLight}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>

              <Text style={styles.sectionTitle}>Invite Members (optional)</Text>
              <View style={styles.usersListContainer}>
                {users.length === 0 ? (
                  <Text style={styles.emptyText}>No users available to invite.</Text>
                ) : (
                  <FlatList
                    data={users}
                    extraData={selectedUsers}
                    keyExtractor={(item) => item.id}
                    renderItem={renderUserItem}
                    showsVerticalScrollIndicator={false}
                    initialNumToRender={8}
                    maxToRenderPerBatch={12}
                    windowSize={5}
                    removeClippedSubviews={true}
                  />
                )}
              </View>

              <Text style={styles.sectionTitle}>Group Code Settings</Text>
              <Text style={styles.subHeaderText}>
                This group uses a group code (invite code). Anyone entering this code can join directly.
              </Text>

              <View style={styles.joinBox}>
                <Text style={styles.inputLabel}>Enter existing group code</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. ABC123"
                  placeholderTextColor={COLORS.textLight}
                  value={joinCode}
                  onChangeText={(text) => {
                    setJoinCode(text);
                    setJoinError('');
                  }}
                  autoCapitalize="characters"
                />
                {joinError ? <Text style={styles.errorText}>{joinError}</Text> : null}
                <Button
                  title="Join Group"
                  onPress={handleJoinByCode}
                  loading={joinLoading}
                  style={styles.joinButton}
                />
              </View>

              <Button
                title="Create Circle"
                onPress={handleCreate}
                loading={loading}
                disabled={!name.trim()}
                style={styles.button}
              />

              <View style={styles.infoBox}>
                <Ionicons name="information-circle" size={20} color={COLORS.info} />
                <Text style={styles.infoText}>
                  You&apos;ll be the admin of this circle. Share the group code with others to let them join.
                </Text>
              </View>
            </>
          ) : (
            <View style={styles.successContainer}>
              <View style={styles.successIcon}>
                <Ionicons name="checkmark-circle" size={64} color={COLORS.success} />
              </View>
              <Text style={styles.successTitle}>Circle Created!</Text>
              <Text style={styles.circleName}>{createdCircle.name}</Text>

              {createdCircle.description && (
                <Text style={styles.circleDescription}>{createdCircle.description}</Text>
              )}

              <View style={styles.codeCard}>
                <Text style={styles.codeLabel}>Circle Code</Text>
                <Text style={styles.codeText}>{createdCircle.code}</Text>
                <View style={styles.codeActions}>
                  <TouchableOpacity style={styles.codeActionButton} onPress={copyCodeToClipboard}>
                    <Ionicons name="copy" size={18} color="#0088CC" />
                    <Text style={styles.codeActionText}>Copy Code</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.codeActionButton} onPress={shareCircleLink}>
                    <Ionicons name="share-social" size={18} color="#0088CC" />
                    <Text style={styles.codeActionText}>Share Code</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.codeHint}>
                  Share this group code with others so they can join your group
                </Text>
              </View>

              <View style={styles.privacyBadge}>
                <Ionicons 
                  name={createdCircle.privacy === 'private' ? 'lock-closed' : 'key'} 
                  size={16} 
                  color={COLORS.textSecondary} 
                />
                <Text style={styles.privacyBadgeText}>
                  {createdCircle.privacy === 'private' ? 'Private - Approval required' : 'Open - Code join allowed'}
                </Text>
              </View>

              <Button
                title="Go to Circle"
                onPress={() => {
                  router.back();
                  setTimeout(() => {
                    router.push(`/chat/circle/${createdCircle.id}`);
                  }, 100);
                }}
                style={styles.button}
              />

              <Button
                title="Close"
                onPress={() => router.back()}
                variant="outline"
                style={styles.closeButton}
              />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E0D8',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  profileImageSection: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  profileImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'visible',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  profileImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFF8F0',
    borderWidth: 2,
    borderColor: '#E8E0D8',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImagePlaceholderText: {
    fontSize: 12,
    color: '#0088CC',
    marginTop: 4,
  },
  profileImageHint: {
    fontSize: 12,
    color: '#666666',
    marginTop: SPACING.sm,
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0088CC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  pageDescription: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: SPACING.lg,
    lineHeight: 20,
  },
  inputSection: {
    marginBottom: SPACING.md,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: SPACING.xs,
  },
  textInput: {
    backgroundColor: '#FFF8F0',
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#E8E0D8',
  },
  textArea: {
    minHeight: 80,
    paddingTop: 12,
  },
  errorText: {
    color: '#E53935',
    fontSize: 12,
    marginTop: SPACING.xs,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
  },
  usersListContainer: {
    borderWidth: 1,
    borderColor: '#E8E0D8',
    borderRadius: BORDER_RADIUS.lg,
    maxHeight: 250,
    marginBottom: SPACING.md,
    backgroundColor: '#FFFFFF',
  },
  emptyText: {
    padding: SPACING.md,
    textAlign: 'center',
    color: '#666666',
    fontSize: 14,
  },
  subHeaderText: {
    fontSize: 13,
    color: '#666666',
    lineHeight: 20,
    marginBottom: SPACING.sm,
  },
  joinBox: {
    backgroundColor: '#FFF8F0',
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: '#E8E0D8',
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  joinButton: {
    marginTop: SPACING.sm,
  },
  infoBox: {
    marginTop: SPACING.md,
    borderWidth: 1,
    borderColor: `${COLORS.info}25`,
    backgroundColor: `${COLORS.info}10`,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    marginLeft: SPACING.sm,
    fontSize: 13,
    color: '#4A5A63',
    lineHeight: 18,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: '#E8E0D8',
  },
  userCardSelected: {
    borderColor: '#0088CC',
    backgroundColor: '#0088CC10',
  },
  userAvatar: {
    position: 'relative',
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0088CC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  selectedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#0088CC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  userInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  userSL: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E8E0D8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#0088CC',
    borderColor: '#0088CC',
  },
  privacyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  privacyOptionSelected: {
    borderColor: '#0088CC',
    backgroundColor: '#0088CC10',
  },
  privacyIcon: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: '#FFF8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  privacyIconSelected: {
    backgroundColor: '#0088CC',
  },
  privacyContent: {
    flex: 1,
  },
  privacyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  privacyTitleSelected: {
    color: '#0088CC',
  },
  privacySubtitle: {
    fontSize: 13,
    color: '#666666',
  },
  button: {
    marginTop: SPACING.lg,
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl,
  },
  successIcon: {
    marginBottom: SPACING.md,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  circleName: {
    marginTop: SPACING.xs,
    fontSize: 18,
    fontWeight: '600',
    color: '#0088CC',
  },
  circleDescription: {
    marginTop: SPACING.sm,
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING.md,
  },
  privacyBadge: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: '#F3F4F6',
    marginBottom: SPACING.sm,
    gap: SPACING.xs,
  },
  privacyBadgeText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  closeButton: {
    marginTop: SPACING.sm,
    width: '100%',
  },
  codeCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: '#E8E0D8',
  },
  codeLabel: {
    fontSize: 12,
    color: '#666666',
    marginBottom: SPACING.xs,
  },
  codeText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#0088CC',
    letterSpacing: 4,
    marginBottom: SPACING.md,
  },
  codeActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.lg,
    marginBottom: SPACING.md,
  },
  codeActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: '#0088CC15',
    borderRadius: BORDER_RADIUS.md,
  },
  codeActionText: {
    fontSize: 14,
    color: '#0088CC',
    marginLeft: SPACING.xs,
    fontWeight: '600',
  },
  codeHint: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
  },
});
export default CreateCircleScreen;
