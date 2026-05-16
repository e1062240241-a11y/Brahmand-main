import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS } from '../../../src/constants/theme';
import { getCommunity, requestToJoinCommunity, parseApiError } from '../../../src/services/api';
import { Avatar } from '../../../src/components/Avatar';

export default function CommunityPreviewScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const [community, setCommunity] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    fetchCommunity();
  }, [id]);

  const fetchCommunity = async () => {
    try {
      const response = await getCommunity(id as string);
      setCommunity(response.data);
    } catch (error) {
      console.error('Error fetching community:', error);
      Alert.alert('Error', 'Failed to load community details');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRequest = async () => {
    setRequesting(true);
    try {
      const res = await requestToJoinCommunity(id as string);
      if (res.data.status === 'requested' || res.data.status === 'pending') {
        router.push({
          pathname: '/community/pending',
          params: { name: community.name, photo: community.photo }
        });
      } else if (res.data.status === 'already_member') {
        Alert.alert('Already a Member', 'You are already a member of this community.', [
          { text: 'OK', onPress: () => router.replace(`/(tabs)/messages`) }
        ]);
      }
    } catch (error: any) {
      Alert.alert('Error', parseApiError(error));
    } finally {
      setRequesting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6600" />
      </View>
    );
  }

  if (!community) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Community not found</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Cover Photo */}
        <View style={styles.coverContainer}>
          {community.cover_photo ? (
            <Image source={{ uri: community.cover_photo }} style={styles.coverImage} />
          ) : (
            <LinearGradient colors={['#FF9933', '#FF6600']} style={styles.coverPlaceholder} />
          )}
          <LinearGradient
            colors={['rgba(0,0,0,0.5)', 'transparent', 'rgba(0,0,0,0.7)']}
            style={styles.coverOverlay}
          />

          <TouchableOpacity
            style={[styles.backButton, { top: insets.top + 10 }]}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Profile Info */}
        <View style={styles.profileSection}>
          <View style={styles.avatarWrapper}>
            <Avatar name={community.name} photo={community.photo} size={100} />
          </View>

          <View style={styles.mainInfo}>
            <Text style={styles.name}>{community.name}</Text>
            <View style={styles.typeTag}>
              <Text style={styles.typeTagText}>{community.category || 'Local Community'}</Text>
            </View>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{community.member_count || 0}</Text>
                <Text style={styles.statLabel}>Members</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{community.location?.city || 'India'}</Text>
                <Text style={styles.statLabel}>Location</Text>
              </View>
            </View>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About Community</Text>
            <Text style={styles.description}>
              {community.description || 'Welcome to our local community group. Join us to connect with neighbors, share updates, and participate in local activities.'}
            </Text>
          </View>

          {/* Rules / Requirements */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Joining Requirements</Text>
            <View style={styles.requirementItem}>
              <View style={styles.reqIconBox}>
                <Ionicons name="shield-checkmark" size={18} color="#FF6600" />
              </View>
              <Text style={styles.reqText}>Admin must approve your join request</Text>
            </View>
            <View style={styles.requirementItem}>
              <View style={styles.reqIconBox}>
                <Ionicons name="location" size={18} color="#FF6600" />
              </View>
              <Text style={styles.reqText}>Open to residents of {community.location?.city || 'the area'}</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Fixed Footer with Button */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity
          style={styles.joinButton}
          onPress={handleJoinRequest}
          disabled={requesting}
        >
          {requesting ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Text style={styles.joinButtonText}>Join Community</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFF" style={{ marginLeft: 8 }} />
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFBF7',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    fontFamily: FONTS.medium,
    marginBottom: 20,
  },
  backBtn: {
    backgroundColor: '#FF6600',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backBtnText: {
    color: '#FFF',
    fontFamily: FONTS.bold,
  },
  scrollContent: {
    flexGrow: 1,
  },
  coverContainer: {
    height: 220,
    width: '100%',
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverPlaceholder: {
    width: '100%',
    height: '100%',
  },
  coverOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  backButton: {
    position: 'absolute',
    left: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileSection: {
    paddingHorizontal: 24,
    marginTop: -50,
  },
  avatarWrapper: {
    width: 110,
    height: 110,
    borderRadius: 28,
    backgroundColor: '#FFF',
    padding: 5,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 8 },
  },
  mainInfo: {
    marginTop: 16,
  },
  name: {
    fontSize: 26,
    fontFamily: FONTS.bold,
    color: '#111',
    fontWeight: '900',
  },
  typeTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFF5EE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 10,
  },
  typeTagText: {
    fontSize: 12,
    color: '#FF6600',
    fontFamily: FONTS.bold,
    textTransform: 'uppercase',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: '#111',
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
    fontFamily: FONTS.regular,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#EEE',
  },
  section: {
    marginTop: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: '#111',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: '#555',
    lineHeight: 24,
    fontFamily: FONTS.regular,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  reqIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#FFF5EE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reqText: {
    fontSize: 14,
    color: '#444',
    fontFamily: FONTS.medium,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  joinButton: {
    backgroundColor: '#FF6600',
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#FF6600',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  joinButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontFamily: FONTS.bold,
  },
});
