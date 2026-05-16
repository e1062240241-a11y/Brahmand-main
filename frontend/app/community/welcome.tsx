import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Image,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS } from '../../src/constants/theme';
import { Avatar } from '../../src/components/Avatar';
import { getCommunity } from '../../src/services/api';

const { width } = Dimensions.get('window');

export default function CommunityWelcomeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string; name?: string; photo?: string }>();
  const insets = useSafeAreaInsets();
  const [community, setCommunity] = useState<any>(null);
  const [loading, setLoading] = useState(!params.name);

  useEffect(() => {
    if (!params.name && params.id) {
      fetchCommunity();
    } else {
      setCommunity({
        id: params.id,
        name: params.name,
        photo: params.photo
      });
    }
  }, [params.id, params.name]);

  const fetchCommunity = async () => {
    try {
      const res = await getCommunity(params.id as string);
      setCommunity(res.data);
    } catch (error) {
      console.error('Error fetching community:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartChat = () => {
    router.replace(`/community/${params.id}`);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#FF6600" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <View style={styles.content}>
          <LinearGradient
            colors={['#FFF5EE', '#FFFBF7']}
            style={styles.welcomeCard}
          >
            <View style={styles.celebrationIcon}>
              <MaterialCommunityIcons name="party-popper" size={80} color="#FF6600" />
            </View>

            <Text style={styles.title}>Welcome!</Text>
            <Text style={styles.subtitle}>
              Your request has been approved. You are now a member of
            </Text>

            <View style={styles.groupInfo}>
              <Avatar name={community?.name || 'Group'} photo={community?.photo} size={80} />
              <Text style={styles.groupName}>{community?.name}</Text>
            </View>

            <View style={styles.badgeRow}>
              <View style={styles.badge}>
                <Ionicons name="shield-checkmark" size={16} color="#4CAF50" />
                <Text style={styles.badgeText}>Verified Member</Text>
              </View>
            </View>

            <Text style={styles.congratsText}>
              Connect with your community, share updates, and participate in discussions.
            </Text>
          </LinearGradient>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.chatButton}
            onPress={handleStartChat}
          >
            <Text style={styles.chatButtonText}>Start Chatting</Text>
            <Ionicons name="chatbubbles" size={20} color="#FFF" style={{ marginLeft: 8 }} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.replace('/(tabs)/messages')}
          >
            <Text style={styles.backButtonText}>Go to Messages</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  welcomeCard: {
    padding: 32,
    borderRadius: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFE8D4',
  },
  celebrationIcon: {
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontFamily: FONTS.bold,
    color: '#111',
    fontWeight: '900',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    fontFamily: FONTS.medium,
  },
  groupInfo: {
    alignItems: 'center',
    marginTop: 30,
    gap: 12,
  },
  groupName: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    color: '#000',
    textAlign: 'center',
  },
  badgeRow: {
    marginTop: 16,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  badgeText: {
    fontSize: 12,
    fontFamily: FONTS.bold,
    color: '#4CAF50',
  },
  congratsText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginTop: 30,
    lineHeight: 20,
    fontFamily: FONTS.regular,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  chatButton: {
    backgroundColor: '#FF6600',
    height: 60,
    borderRadius: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#FF6600',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  chatButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontFamily: FONTS.bold,
  },
  backButton: {
    marginTop: 16,
    alignItems: 'center',
    paddingVertical: 10,
  },
  backButtonText: {
    color: '#888',
    fontSize: 16,
    fontFamily: FONTS.medium,
  },
});
