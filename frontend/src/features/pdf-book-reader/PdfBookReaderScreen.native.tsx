import React, { useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { BORDER_RADIUS, COLORS, SPACING } from '../../constants/theme';
import { buildNativeBookReaderHtml } from './nativeBookHtml';

type Props = {
  bookId?: string;
  title: string;
  pdfUrl: string;
};

export default function PdfBookReaderScreen({ title, pdfUrl }: Props) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [isOpeningExternal, setIsOpeningExternal] = useState(false);
  const [viewerStatus, setViewerStatus] = useState<{
    numPages: number;
    spreadStartPage: number;
    rightPage: number | null;
    error: string | null;
  }>({
    numPages: 0,
    spreadStartPage: 1,
    rightPage: 2,
    error: null,
  });

  const viewerHtml = useMemo(
    () =>
      buildNativeBookReaderHtml({
        pdfUrl,
        title,
      }),
    [pdfUrl, title]
  );

  const openInSystemViewer = async () => {
    try {
      setIsOpeningExternal(true);
      const canOpen = await Linking.canOpenURL(pdfUrl);

      if (canOpen) {
        await Linking.openURL(pdfUrl);
        return;
      }

      await WebBrowser.openBrowserAsync(pdfUrl);
    } catch (error) {
      console.warn('Failed to open PDF externally:', error);
      Alert.alert(
        'Unable to open PDF',
        'This device could not open the selected PDF in a system viewer.'
      );
    } finally {
      setIsOpeningExternal(false);
    }
  };

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
          <View style={styles.viewerToolbar}>
            <Text style={styles.viewerLabel}>{title}</Text>
            <Text style={styles.viewerSubLabel}>
              {viewerStatus.error
                ? viewerStatus.error
                : viewerStatus.numPages
                  ? `Spread ${viewerStatus.spreadStartPage}${viewerStatus.rightPage ? ` - ${viewerStatus.rightPage}` : ''} • ${viewerStatus.numPages} pages`
                  : 'Book layout loading'}
            </Text>
          </View>

          <View
            style={[
              styles.previewShell,
              {
                width,
                marginLeft: -SPACING.md,
                marginRight: -SPACING.md,
              },
            ]}
          >
            <WebView
              originWhitelist={['*']}
              source={{ html: viewerHtml, baseUrl: '' }}
              allowFileAccess
              javaScriptEnabled
              domStorageEnabled
              mixedContentMode="always"
              startInLoadingState
              bounces={false}
              scrollEnabled={false}
              overScrollMode="never"
              onMessage={(event) => {
                try {
                  const payload = JSON.parse(event.nativeEvent.data);

                  if (payload.type === 'loaded') {
                    setViewerStatus((currentStatus) => ({
                      ...currentStatus,
                      numPages: payload.numPages || currentStatus.numPages,
                      error: null,
                    }));
                  }

                  if (payload.type === 'spread') {
                    setViewerStatus((currentStatus) => ({
                      ...currentStatus,
                      spreadStartPage: payload.spreadStartPage || currentStatus.spreadStartPage,
                      rightPage: payload.rightPage ?? null,
                      numPages: payload.numPages || currentStatus.numPages,
                      error: null,
                    }));
                  }

                  if (payload.type === 'error') {
                    setViewerStatus((currentStatus) => ({
                      ...currentStatus,
                      error: payload.message || 'Unable to render this PDF.',
                    }));
                  }
                } catch (parseError) {
                  console.warn('Failed to parse native PDF reader message:', parseError);
                }
              }}
              renderLoading={() => (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
              )}
              style={styles.webview}
            />
          </View>

          <View style={styles.actionsRow}>
            <Pressable
              style={styles.secondaryButton}
              onPress={openInSystemViewer}
              disabled={isOpeningExternal}
            >
              {isOpeningExternal ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <>
                  <Ionicons name="open-outline" size={18} color={COLORS.primary} />
                  <Text style={styles.secondaryButtonText}>Open in system viewer</Text>
                </>
              )}
            </Pressable>
          </View>

          <Text style={styles.note}>
            Bhagvad Geeta now opens directly from Brahmand Library. The reader preloads the first
            few pages and fetches the next batch as you move deeper into the book.
          </Text>
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
    gap: SPACING.sm,
    marginBottom: SPACING.md,
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
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
  },
  viewer: {
    flex: 1,
    gap: SPACING.md,
  },
  viewerToolbar: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
  },
  viewerLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  viewerSubLabel: {
    marginTop: 4,
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  previewShell: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
  },
  webview: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
  },
  actionsRow: {
    alignItems: 'center',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: COLORS.primary,
    backgroundColor: '#FFF5EB',
    paddingHorizontal: SPACING.lg,
    paddingVertical: 14,
    borderRadius: BORDER_RADIUS.full,
  },
  secondaryButtonText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  note: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
});
