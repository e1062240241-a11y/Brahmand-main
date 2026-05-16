import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../../src/constants/theme';
import { Avatar } from '../../src/components/Avatar';

export default function CommunityPendingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ name: string; photo?: string }>();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <View style={styles.content}>
          <View style={styles.successIconBox}>
            <Ionicons name="checkmark-circle" size={100} color="#4CAF50" />
          </View>

          <Text style={styles.title}>Request Sent!</Text>
          <Text style={styles.subtitle}>
            Your request to join <Text style={{ fontFamily: FONTS.bold, color: '#111' }}>{params.name}</Text> has been sent to the community admins for review.
          </Text>

          <View style={styles.statusCard}>
            <View style={styles.avatarWrapper}>
              <Avatar name={params.name || 'Group'} photo={params.photo} size={60} />
            </View>
            <View style={styles.statusInfo}>
              <Text style={styles.statusTitle}>Wait for Review</Text>
              <Text style={styles.statusSub}>You will be notified once an admin approves your request.</Text>
            </View>
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingText}>Pending</Text>
            </View>
          </View>

          <View style={styles.infoBox}>
            <Ionicons name="notifications-outline" size={20} color="#FF6600" />
            <Text style={styles.infoText}>We will send you a push notification as soon as your request is processed.</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.doneButton}
            onPress={() => router.replace('/(tabs)/messages')}
          >
            <Text style={styles.doneButtonText}>Back to Chats</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFBF7',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successIconBox: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontFamily: FONTS.bold,
    color: '#111',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 24,
    fontFamily: FONTS.regular,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    width: '100%',
    padding: 16,
    borderRadius: 20,
    marginTop: 40,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  avatarWrapper: {
    marginRight: 12,
  },
  statusInfo: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 15,
    fontFamily: FONTS.bold,
    color: '#111',
  },
  statusSub: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
    lineHeight: 16,
  },
  pendingBadge: {
    backgroundColor: '#FFF9EB',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  pendingText: {
    fontSize: 10,
    fontFamily: FONTS.bold,
    color: '#B8860B',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#FFF5EE',
    padding: 16,
    borderRadius: 16,
    marginTop: 30,
    gap: 12,
    alignItems: 'center',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#FF6600',
    lineHeight: 18,
    fontFamily: FONTS.medium,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  doneButton: {
    backgroundColor: '#FF6600',
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  doneButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontFamily: FONTS.bold,
  },
});
