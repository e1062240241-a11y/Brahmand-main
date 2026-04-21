import React, { useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { BORDER_RADIUS, COLORS, SPACING } from '../../constants/theme';
import { buildNativeBookReaderHtml } from './nativeBookHtml';

type Props = {
  bookId?: string;
  title: string;
  pdfUrl: string;
};

export default function PdfBookReaderScreen({ title, pdfUrl }: Props) {
  const router = useRouter();
  const [isFrameReady, setIsFrameReady] = useState(false);

  const viewerHtml = useMemo(
    () =>
      buildNativeBookReaderHtml({
        pdfUrl,
        title,
      }),
    [pdfUrl, title]
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={20} color={COLORS.text} />
            <Text style={styles.backButtonText}>Back</Text>
          </Pressable>
          <View style={styles.headerContent}>
            <Text style={styles.eyebrow}>Brahmand Library</Text>
            <Text style={styles.title}>{title}</Text>
          </View>
        </View>

        <View style={styles.viewer}>
          <View style={styles.previewShell}>
            {!isFrameReady && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator color={COLORS.primary} size="large" />
              </View>
            )}
            {React.createElement('iframe', {
              title,
              srcDoc: viewerHtml,
              onLoad: () => setIsFrameReady(true),
              style: {
                width: '100%',
                height: '100%',
                border: '0',
                backgroundColor: '#F4EFE7',
              },
            })}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4EFE7',
  },
  container: {
    flex: 1,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: 96,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  backButtonText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
  headerContent: {
    flex: 1,
    gap: 2,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: COLORS.primaryDark,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
  },
  viewer: {
    flex: 1,
  },
  previewShell: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: BORDER_RADIUS.xl,
    backgroundColor: COLORS.surface,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
    position: 'relative',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 248, 240, 0.72)',
    zIndex: 2,
  },
});
