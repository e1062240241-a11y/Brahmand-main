import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../../../src/constants/theme';
import { getCommunityJoinRequests, handleCommunityJoinRequest } from '../../../src/services/api';
import { Avatar } from '../../../src/components/Avatar';

export default function AdminReviewScreen() {
  const router = useRouter();
  const { id: communityId } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<any[]>([]);

  useEffect(() => {
    fetchRequests();
  }, [communityId]);

  const fetchRequests = async () => {
    try {
      const response = await getCommunityJoinRequests(communityId as string);
      setRequests(response.data || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (requestId: string, action: 'approve' | 'reject') => {
    try {
      await handleCommunityJoinRequest(requestId, action);
      Alert.alert('Success', `Request ${action === 'approve' ? 'approved' : 'rejected'} successfully.`);
      setRequests(prev => prev.filter(r => r.id !== requestId));
    } catch (error) {
      Alert.alert('Error', 'Failed to handle request.');
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.requestCard}>
      <Avatar name={item.user_name} photo={item.user_photo} size={50} />
      <View style={styles.requestInfo}>
        <Text style={styles.userName}>{item.user_name}</Text>
        <Text style={styles.requestDate}>Requested on {new Date(item.created_at).toLocaleDateString()}</Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.rejectBtn]}
          onPress={() => handleAction(item.id, 'reject')}
        >
          <Ionicons name="close" size={20} color="#FF3B30" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.approveBtn]}
          onPress={() => handleAction(item.id, 'approve')}
        >
          <Ionicons name="checkmark" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Admin Review</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="checkmark-circle-outline" size={64} color="#CCC" />
              <Text style={styles.emptyText}>No pending requests.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFBF7' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: { marginRight: 8 },
  title: { fontSize: 20, fontFamily: FONTS.bold, color: '#000' },
  listContent: { padding: 16 },
  requestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    elevation: 2,
  },
  requestInfo: { flex: 1, marginLeft: 12 },
  userName: { fontSize: 16, fontFamily: FONTS.bold, color: '#000' },
  requestDate: { fontSize: 12, color: '#888', marginTop: 2 },
  actions: { flexDirection: 'row', gap: 10 },
  actionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rejectBtn: { backgroundColor: '#FFF0F0', borderWidth: 1, borderColor: '#FF3B30' },
  approveBtn: { backgroundColor: '#FF3B30' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyText: { color: '#888', fontSize: 16, marginTop: 12 },
});
