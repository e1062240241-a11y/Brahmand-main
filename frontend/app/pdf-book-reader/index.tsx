import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { BORDER_RADIUS, COLORS, SPACING } from '../../src/constants/theme';
import { BHAGVAD_GEETA_BOOK, getLibraryBook } from '../../src/features/pdf-book-reader/books';

const normalizeParam = (value?: string | string[]) => {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
};

export default function PdfBookReaderRoute() {
  const router = useRouter();
  const params = useLocalSearchParams<{ bookId?: string | string[]; title?: string | string[] }>();
  const bookId = normalizeParam(params.bookId) || BHAGVAD_GEETA_BOOK.id;
  const book = getLibraryBook(bookId) || BHAGVAD_GEETA_BOOK;
  const title = normalizeParam(params.title) || book.title;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.messageBox}>
          <Text style={styles.messageTitle}>PDF reader disabled</Text>
          <Text style={styles.messageText}>
            The Brahmand Library no longer renders PDF content inside the app. This reader has been disabled in both frontend and backend.
          </Text>
        </View>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Back to Library</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    padding: SPACING.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.lg,
  },
  messageBox: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.lg,
  },
  messageTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  messageText: {
    color: COLORS.textSecondary,
    fontSize: 15,
    lineHeight: 22,
  },
  backButton: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.full,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});
