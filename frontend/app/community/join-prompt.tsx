import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  StatusBar,
  Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../../src/constants/theme';
import { Avatar } from '../../src/components/Avatar';

const { width } = Dimensions.get('window');

export default function JoinPromptScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string; name: string; photo?: string }>();
  const insets = useSafeAreaInsets();

  const handleJoinClick = () => {
    router.push({
      pathname: `/community/preview/${params.id}`,
      params: { id: params.id, name: params.name, photo: params.photo }
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="close" size={28} color="#000" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.card}>
            <View style={styles.avatarWrapper}>
              <Avatar name={params.name || 'Group'} photo={params.photo} size={100} />
            </View>

            <Text style={styles.title}>Join Community</Text>
            <Text style={styles.groupName}>{params.name}</Text>

            <Text style={styles.description}>
              By joining this community, you will be able to connect with other members, share updates, and participate in community activities.
            </Text>

            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Ionicons name="people" size={20} color="#FF6600" />
                <Text style={styles.infoText}>Members Only</Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name="shield-checkmark" size={20} color="#FF6600" />
                <Text style={styles.infoText}>Admin Review</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.joinButton} onPress={handleJoinClick}>
            <Text style={styles.joinButtonText}>Continue to Preview</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFF" style={{ marginLeft: 8 }} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
            <Text style={styles.cancelButtonText}>Not now</Text>
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
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 32,
    padding: 30,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
  },
  avatarWrapper: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 5,
    borderColor: '#FFF5EE',
    elevation: 5,
  },
  title: {
    fontSize: 16,
    color: '#888',
    fontFamily: FONTS.bold,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  groupName: {
    fontSize: 24,
    color: '#000',
    fontFamily: FONTS.bold,
    marginTop: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 22,
    fontFamily: FONTS.regular,
  },
  infoRow: {
    flexDirection: 'row',
    marginTop: 30,
    gap: 20,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5EE',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  infoText: {
    fontSize: 12,
    fontFamily: FONTS.bold,
    color: '#FF6600',
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  joinButton: {
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
  joinButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontFamily: FONTS.bold,
  },
  cancelButton: {
    marginTop: 16,
    alignItems: 'center',
    paddingVertical: 10,
  },
  cancelButtonText: {
    color: '#888',
    fontSize: 16,
    fontFamily: FONTS.medium,
  },
});
