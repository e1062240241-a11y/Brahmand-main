import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, SPACING, BORDER_RADIUS } from '../src/constants/theme';

const geetaCover = require('../assets/images/Bhagvad-geeta.jpg');

const LibraryPage = () => {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Brahmand Library</Text>
        <TouchableOpacity
          style={styles.coverCard}
          onPress={() => router.push('/library/bhagvad-geeta')}
          activeOpacity={0.85}
        >
          <Image source={geetaCover} style={styles.coverImage} resizeMode="cover" />
          <View style={styles.coverLabelContainer}>
            <Text style={styles.coverLabel}>Bhagvad Geeta</Text>
          </View>
        </TouchableOpacity>
        <Text style={styles.coverHint}>Tap to open Bhagvad Geeta chapter 1 in book layout.</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    padding: SPACING.md,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.lg,
    alignSelf: 'flex-start',
  },
  coverCard: {
    width: 280,
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
    transform: [{ rotate: '-2deg' }],
  },
  coverImage: {
    width: '100%',
    height: 280,
  },
  coverLabelContainer: {
    padding: SPACING.md,
    backgroundColor: COLORS.background,
  },
  coverLabel: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  coverHint: {
    marginTop: SPACING.md,
    color: COLORS.textSecondary,
    fontSize: 15,
    fontWeight: '500',
  },
  comingSoonText: {
    marginTop: SPACING.md,
    color: COLORS.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default LibraryPage;
