// accessibility: placeholder
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  RefreshControl,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, FONTS } from '../../src/constants/theme';
import { discoverCommunities, getMyCreationRequests, joinCommunityDirect, parseApiError, resendCommunityInvite , addCommunityKey, getCommunityKey } from '../../src/services/api';
import { generateSymmetricKey, encryptSymmetricKeyForUser } from '../../src/utils/cryptoUtil';
import { Avatar } from '../../src/components/Avatar';
import { useAuthStore } from '../../src/store/authStore';

interface Community {
  id: string;
  name: string;
  type: string;
  label?: string;
  member_count: number;
  photo?: string;
  is_default?: boolean;
  is_member?: boolean;
}

interface InviteeStatus {
  id: string;
  name: string;
  photo?: string;
  status: 'pending' | 'accepted' | 'declined';
}

interface CreationRequest {
  id: string;
  name: string;
  description?: string;
  photo?: string;
  status: 'pending' | 'approved' | 'declined';
  created_at: string;
  admins: InviteeStatus[];
  members: InviteeStatus[];
  community_id?: string;
}

const CACHE_KEY = 'discover_communities_cache_v2';
const CACHE_TTL_MS = 5 * 60 * 1000;

export default function DiscoverCommunitiesScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [createdGroups, setCreatedGroups] = useState<Community[]>([]);
  const [filteredGroups, setFilteredGroups] = useState<Community[]>([]);
  const [myRequests, setMyRequests] = useState<CreationRequest[]>([]);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [expandedRequestId, setExpandedRequestId] = useState<string | null>(null);
  const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set());

  const fetchAll = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        const age = Date.now() - timestamp;
        if (Array.isArray(data) && data.length > 0) {
          setCreatedGroups(data);
          setFilteredGroups(data);
          // Restore joined state from cache
          const cachedJoined = new Set<string>(
            data.filter((c: Community) => c.is_member).map((c: Community) => c.id)
          );
          if (cachedJoined.size > 0) setJoinedIds(cachedJoined);
          setLoading(false);
          if (age < CACHE_TTL_MS && !showRefresh) {
            setRefreshing(false);
            return;
          }
        }
      }
    } catch { /* ignore */ }

    try {
      const [discoverRes, requestsRes] = await Promise.allSettled([
        discoverCommunities(),
        getMyCreationRequests(),
      ]);

      if (discoverRes.status === 'fulfilled') {
        const allComms = discoverRes.value.data || [];
        const userGroupsList = allComms.filter(
          (item: Community) => item.type === 'user_group' || item.type === 'local'
        );
        setCreatedGroups(userGroupsList);
        setFilteredGroups(userGroupsList);
        // Seed joinedIds from backend's is_member flag
        const alreadyJoined = new Set<string>(
          userGroupsList.filter((c: Community) => c.is_member).map((c: Community) => c.id)
        );
        setJoinedIds(prev => new Set([...prev, ...alreadyJoined]));
        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ data: userGroupsList, timestamp: Date.now() }));
      }

      if (requestsRes.status === 'fulfilled') {
        setMyRequests(requestsRes.value.data || []);
      }
    } catch (error) {
      console.error('Error fetching discover data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchAll();
    }, [fetchAll])
  );

  // Filter on search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredGroups(createdGroups);
    } else {
      const q = searchQuery.toLowerCase();
      setFilteredGroups(
        createdGroups.filter(
          g => g.name.toLowerCase().includes(q) || (g.label || '').toLowerCase().includes(q)
        )
      );
    }
  }, [searchQuery, createdGroups]);


  const handleJoin = async (communityId: string, communityName: string) => {
    setJoiningId(communityId);
    try {
      await joinCommunityDirect(communityId);

      // Try to setup encryption key if missing
      try {
        const keyRes = await getCommunityKey(communityId).catch(() => ({ data: { encrypted_key: null } }));
        if (!keyRes?.data?.encrypted_key) {
           const newSymKeyBase64 = generateSymmetricKey();
           const user = useAuthStore.getState().user as any;
           const userKey = user?.public_key || user?.publicKey;
           if (user && userKey) {
             const encryptedSymKey = await encryptSymmetricKeyForUser(newSymKeyBase64, userKey);
             await addCommunityKey(communityId, user.id, encryptedSymKey);
           }
        }
      } catch (e) {
        console.warn("Key generation on join failed", e);
      }

      setJoinedIds(prev => new Set(prev).add(communityId));


      // Update cache so it persists when returning to this screen
      try {
        const cached = await AsyncStorage.getItem(CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed.data && Array.isArray(parsed.data)) {
            parsed.data = parsed.data.map((c: any) => 
              c.id === communityId ? { ...c, is_member: true } : c
            );
            await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(parsed));
          }
        }
      } catch (cacheErr) {
        console.warn('Failed to update cache after join', cacheErr);
      }

      Alert.alert('Joined!', `You have joined ${communityName}.`);
    } catch (error: any) {
      Alert.alert('Error', parseApiError(error));
    } finally {
      setJoiningId(null);
    }
  };

  const [resendingInviteIds, setResendingInviteIds] = useState<Set<string>>(new Set());

  const handleResendInvite = async (requestId: string, userId: string, userName: string) => {
    const key = `${requestId}-${userId}`;
    setResendingInviteIds(prev => new Set(prev).add(key));
    try {
      await resendCommunityInvite(requestId, userId);
      Alert.alert('Success', `Invitation notification sent again to ${userName}.`);
    } catch (error: any) {
      Alert.alert('Error', parseApiError(error));
    } finally {
      setResendingInviteIds(prev => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  };

  // --- Render: My Created Communities Section ---
  const renderStatusDot = (status: string) => {
    const color = status === 'accepted' ? '#22C55E' : status === 'declined' ? '#EF4444' : '#F59E0B';
    const label = status === 'accepted' ? 'Accepted' : status === 'declined' ? 'Declined' : 'Pending';
    return (
      <View style={styles.statusBadge}>
        <View style={[styles.statusDot, { backgroundColor: color }]} />
        <Text style={[styles.statusLabel, { color }]}>{label}</Text>
      </View>
    );
  };

  const renderMyCreationRequest = (req: CreationRequest) => {
    const allAccepted = [...req.admins, ...req.members].every(u => u.status === 'accepted');
    const anyDeclined = [...req.admins, ...req.members].some(u => u.status === 'declined');
    const isExpanded = expandedRequestId === req.id;

    const overallColor = req.status === 'approved' ? '#22C55E' : anyDeclined ? '#EF4444' : '#F59E0B';
    const overallLabel = req.status === 'approved' ? 'Live ✓' : anyDeclined ? 'Declined' : 'Pending';

    return (
      <View key={req.id} style={styles.myRequestCard}>
        <TouchableOpacity
          style={styles.myRequestHeader}
          onPress={() => setExpandedRequestId(isExpanded ? null : req.id)}
          activeOpacity={0.8}
        >
          {req.photo ? (
            <Image source={{ uri: req.photo }} style={styles.myRequestAvatar} />
          ) : (
            <Avatar name={req.name} size={44} />
          )}

          <View style={styles.myRequestInfo}>
            <Text style={styles.myRequestName} numberOfLines={1}>{req.name}</Text>
            <Text style={styles.myRequestSub}>
              {req.admins.length} admin{req.admins.length !== 1 ? 's' : ''} · {req.members.length} member{req.members.length !== 1 ? 's' : ''}
            </Text>
          </View>

          <View style={styles.myRequestRight}>
            <View style={[styles.overallBadge, { backgroundColor: overallColor + '20', borderColor: overallColor }]}>
              <Text style={[styles.overallBadgeText, { color: overallColor }]}>{overallLabel}</Text>
            </View>
            <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={18} color="#888" style={{ marginTop: 4 }} />
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.myRequestDetails}>
            {req.admins.length > 0 && (
              <>
                <Text style={styles.memberRoleLabel}>Admins</Text>
                {req.admins.map(u => (
                  <View key={u.id} style={styles.memberRow}>
                    {u.photo
                      ? <Image source={{ uri: u.photo }} style={styles.memberAvatar} />
                      : <Avatar name={u.name} size={32} />
                    }
                    <Text style={styles.memberName} numberOfLines={1}>{u.name}</Text>
                    {renderStatusDot(u.status)}
                    {u.status === 'pending' && (
                      <TouchableOpacity
                        style={styles.resendBtn}
                        onPress={() => handleResendInvite(req.id, u.id, u.name)}
                        disabled={resendingInviteIds.has(`${req.id}-${u.id}`)}
                      >
                        {resendingInviteIds.has(`${req.id}-${u.id}`) ? (
                          <ActivityIndicator size="small" color="#FF3400" />
                        ) : (
                          <>
                            <Ionicons name="notifications-outline" size={12} color="#FF3400" />
                            <Text style={styles.resendBtnText}>Resend</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </>
            )}
            {req.members.length > 0 && (
              <>
                <Text style={[styles.memberRoleLabel, { marginTop: 8 }]}>Members</Text>
                {req.members.map(u => (
                  <View key={u.id} style={styles.memberRow}>
                    {u.photo
                      ? <Image source={{ uri: u.photo }} style={styles.memberAvatar} />
                      : <Avatar name={u.name} size={32} />
                    }
                    <Text style={styles.memberName} numberOfLines={1}>{u.name}</Text>
                    {renderStatusDot(u.status)}
                    {u.status === 'pending' && (
                      <TouchableOpacity
                        style={styles.resendBtn}
                        onPress={() => handleResendInvite(req.id, u.id, u.name)}
                        disabled={resendingInviteIds.has(`${req.id}-${u.id}`)}
                      >
                        {resendingInviteIds.has(`${req.id}-${u.id}`) ? (
                          <ActivityIndicator size="small" color="#FF3400" />
                        ) : (
                          <>
                            <Ionicons name="notifications-outline" size={12} color="#FF3400" />
                            <Text style={styles.resendBtnText}>Resend</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </>
            )}
            {req.status === 'approved' && req.community_id && (
              <TouchableOpacity
                style={styles.viewLiveBtn}
                onPress={() => router.push(`/community/${req.community_id}`)}
              >
                <Ionicons name="people" size={14} color="#FFF" />
                <Text style={styles.viewLiveBtnText}>View Live Community</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  };

  // --- Render: Public Community Card with Join Button ---
  const renderCommunityItem = ({ item, index }: { item: Community; index: number }) => {
    const isTeal = index % 2 === 1 || (item.label || '').toLowerCase().includes('youth');
    const cardBg = isTeal ? '#E0F2F1' : '#EEF5EA';
    const borderColor = isTeal ? '#00796B' : '#437953';
    const isJoined = joinedIds.has(item.id);
    const isJoining = joiningId === item.id;

    return (
      <TouchableOpacity
        style={[styles.groupCard, { backgroundColor: cardBg }]}
        onPress={() => router.push(`/community/${item.id}`)}
        activeOpacity={0.85}
      >
        <View style={styles.avatarWrapper}>
          {item.photo ? (
            <Image source={{ uri: item.photo }} style={styles.avatarImage} />
          ) : (
            <Avatar name={item.name} size={48} />
          )}
        </View>

        <View style={styles.cardContent}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.cardMembers}>{(item.member_count || (item as any).members_count || (item as any).memberCount || 0)} members</Text>
        </View>

        <TouchableOpacity
          style={[styles.joinBtn, isJoined && styles.joinBtnJoined, { borderColor }]}
          onPress={(e) => {
            e.stopPropagation();
            if (!isJoined) handleJoin(item.id, item.name);
          }}
          disabled={isJoining || isJoined}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          {isJoining ? (
            <ActivityIndicator size="small" color={borderColor} />
          ) : (
            <Text style={[styles.joinBtnText, { color: isJoined ? '#888' : borderColor }]}>
              {isJoined ? 'Joined ✓' : 'Join'}
            </Text>
          )}
        </TouchableOpacity>

        <Ionicons name="chevron-forward" size={16} color={borderColor} style={{ marginLeft: 4 }} />
      </TouchableOpacity>
    );
  };

  const pendingRequests = myRequests.filter(r => r.status === 'pending');
  const completedRequests = myRequests.filter(r => r.status !== 'pending');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Local Communities</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => router.push('/community/create')}
        >
          <Ionicons name="add" size={14} color="#FFF" />
          <Text style={styles.createButtonText}>Create</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#888" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search local communities..."
            placeholderTextColor="#888"
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#FF3400" />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => fetchAll(true)} />
          }
        >
          {/* ─── My Created Communities ─── */}
          {myRequests.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <MaterialCommunityIcons name="crown" size={18} color="#FF6600" />
                <Text style={styles.sectionTitle}>Your Created Local Communities</Text>
              </View>

              {pendingRequests.length > 0 && (
                <>
                  <Text style={styles.sectionSubLabel}>⏳ Awaiting Consensus</Text>
                  {pendingRequests.map(renderMyCreationRequest)}
                </>
              )}

              {completedRequests.length > 0 && (
                <>
                  <Text style={[styles.sectionSubLabel, { marginTop: 12 }]}>✅ Completed</Text>
                  {completedRequests.map(renderMyCreationRequest)}
                </>
              )}

              <View style={styles.divider} />
            </View>
          )}

          {/* ─── All Local Communities ─── */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons name="people-outline" size={18} color="#437953" />
              <Text style={styles.sectionTitle}>All Local Communities</Text>
            </View>

            {filteredGroups.length === 0 ? (
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconCircle}>
                  <Ionicons name="people-outline" size={48} color="#FF3400" />
                </View>
                <Text style={styles.emptyTitle}>No Communities Found</Text>
                <Text style={styles.emptySubtitle}>
                  {searchQuery.trim()
                    ? "We couldn't find any groups matching your query."
                    : "No user groups have been created yet."}
                </Text>
                <TouchableOpacity
                  style={styles.emptyCreateBtn}
                  onPress={() => router.push('/community/create')}
                >
                  <Text style={styles.emptyCreateBtnText}>Create the First One</Text>
                </TouchableOpacity>
              </View>
            ) : (
              filteredGroups.map((item, index) => (
                <View key={item.id} style={{ marginBottom: 12 }}>
                  {renderCommunityItem({ item, index })}
                </View>
              ))
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFBF7' },

  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontFamily: FONTS.bold, color: '#000' },
  createButton: {
    backgroundColor: '#FF3400',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 3,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  createButtonText: { color: '#FFF', fontSize: 12, fontFamily: FONTS.bold },

  searchWrapper: { paddingHorizontal: 16, paddingVertical: 12 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F2EE',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#000', fontFamily: FONTS.regular },

  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  section: { paddingHorizontal: 16, paddingTop: 12 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  sectionTitle: { fontSize: 15, fontFamily: FONTS.bold, color: '#111' },
  sectionSubLabel: { fontSize: 12, color: '#888', fontFamily: FONTS.regular, marginBottom: 6, marginLeft: 2 },
  divider: { height: 1, backgroundColor: 'rgba(0,0,0,0.07)', marginVertical: 16 },

  // My Request Card
  myRequestCard: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    marginBottom: 10,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  myRequestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  myRequestAvatar: { width: 44, height: 44, borderRadius: 22 },
  myRequestInfo: { flex: 1, marginLeft: 10 },
  myRequestName: { fontSize: 14, fontFamily: FONTS.bold, color: '#111' },
  myRequestSub: { fontSize: 11, color: '#888', marginTop: 2 },
  myRequestRight: { alignItems: 'flex-end', gap: 4 },
  overallBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  overallBadgeText: { fontSize: 11, fontFamily: FONTS.bold },

  myRequestDetails: {
    paddingHorizontal: 14,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  memberRoleLabel: { fontSize: 11, color: '#888', fontFamily: FONTS.bold, marginTop: 8, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  memberRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 5, gap: 10 },
  memberAvatar: { width: 32, height: 32, borderRadius: 16 },
  memberName: { flex: 1, fontSize: 13, color: '#222', fontFamily: FONTS.regular },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusLabel: { fontSize: 11, fontFamily: FONTS.bold },
  resendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF1EE',
    borderColor: '#FF3400',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  resendBtnText: {
    color: '#FF3400',
    fontSize: 10,
    fontFamily: FONTS.bold,
  },

  viewLiveBtn: {
    marginTop: 12,
    backgroundColor: '#FF6600',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  viewLiveBtnText: { color: '#FFF', fontSize: 13, fontFamily: FONTS.bold },

  // Public Community Card
  groupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  avatarWrapper: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  avatarImage: { width: 48, height: 48, borderRadius: 24 },
  cardContent: { flex: 1, marginLeft: 12, justifyContent: 'center' },
  cardTitle: { fontSize: 14, fontFamily: FONTS.bold, color: '#000' },
  cardMembers: { fontSize: 11, color: '#666', marginTop: 2 },

  joinBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1.5,
    marginRight: 4,
    minWidth: 58,
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinBtnJoined: { borderColor: '#CCC' },
  joinBtnText: { fontSize: 12, fontFamily: FONTS.bold },

  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingTop: 40 },
  emptyIconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#FFF1EE', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 16, fontFamily: FONTS.bold, color: '#000', marginBottom: 6 },
  emptySubtitle: { fontSize: 12, color: '#666', textAlign: 'center', lineHeight: 18, marginBottom: 20 },
  emptyCreateBtn: { backgroundColor: '#FF3400', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  emptyCreateBtnText: { color: '#FFF', fontSize: 13, fontFamily: FONTS.bold },
});
