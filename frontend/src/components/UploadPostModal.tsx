import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Dimensions,
  Animated,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

import { COLORS, SPACING } from '../constants/theme';
import { uploadUserPost } from '../services/api';

let ExpoVideoModule: any = null;
try {
  ExpoVideoModule = require('expo-video');
} catch (error) {
  console.warn('expo-video unavailable:', error);
}

const useSafeVideoPlayer = (source: string | null, setup: (player: any) => void) => {
  if (!ExpoVideoModule?.useVideoPlayer) return null;
  return ExpoVideoModule.useVideoPlayer(source, setup);
};

let UploadDocumentPicker: any = null;
const getUploadDocumentPicker = async () => {
  if (!UploadDocumentPicker) {
    UploadDocumentPicker = await import('expo-document-picker');
  }
  return UploadDocumentPicker;
};

type SelectedMedia = {
  uri: string;
  name: string;
  mimeType: string;
  mediaType: 'image' | 'video';
  width?: number;
  height?: number;
};

type UploadPostModalProps = {
  visible: boolean;
  onClose: () => void;
  onUploadSuccess: (post: any) => void;
  onUploadStart?: (media: SelectedMedia, caption: string, filterName?: string) => void;
};

const ACCEPTED_MEDIA_TYPES = ['image/*', 'video/*'];
const ACCEPTED_VIDEO_MIME_TYPES = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-matroska'];

const FILTERS = ['Normal', 'Vivid', 'Warm', 'Cool'];

const buildFileName = (uri: string, mediaType: 'image' | 'video') => {
  const fromUri = uri.split('/').pop();
  if (fromUri && fromUri.includes('.')) {
    return fromUri;
  }
  const ext = mediaType === 'video' ? 'mp4' : 'jpg';
  return `post-${Date.now()}.${ext}`;
};

const detectMediaType = (mimeType?: string) => {
  if ((mimeType || '').startsWith('video/')) {
    return 'video' as const;
  }
  return 'image' as const;
};

export const UploadPostModal = ({ visible, onClose, onUploadSuccess, onUploadStart }: UploadPostModalProps) => {
  const [selectedMedia, setSelectedMedia] = useState<SelectedMedia | null>(null);
  const [caption, setCaption] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('Normal');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isCompressing, setIsCompressing] = useState<boolean>(false);

  // Animated opacity for modal fade‑in
  const opacityAnim = useRef(new Animated.Value(0)).current;
  // Animated progress bar width
  const progressAnim = useRef(new Animated.Value(0)).current;
  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });
  useEffect(() => {
    Animated.timing(opacityAnim, {
      toValue: visible ? 1 : 0,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [visible]);
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: uploadProgress,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [uploadProgress]);
  // Dynamic preview height calculation
  const screenWidth = Dimensions.get('window').width;
  const availableWidth = screenWidth - SPACING.md * 2;
  const [dynamicRatio, setDynamicRatio] = useState<number>(4 / 5);
  const [isFit, setIsFit] = useState<boolean>(false); // Used for Insta-style original vs 4:5 toggle

  const previewVideoSource = selectedMedia?.mediaType === 'video' ? selectedMedia.uri : null;
  const previewPlayer = useSafeVideoPlayer(Platform.OS === 'web' ? null : previewVideoSource, (p) => {
    p.loop = true;
    p.muted = false;
  });

  useEffect(() => {
    if (!previewPlayer) return;
    if (visible && previewVideoSource) {
      previewPlayer.play();
    } else {
      previewPlayer.pause();
    }
  }, [previewPlayer, previewVideoSource, visible]);

  useEffect(() => {
    if (selectedMedia?.width && selectedMedia?.height) {
      setDynamicRatio(selectedMedia.width / selectedMedia.height);
    } else {
      setDynamicRatio(4 / 5);
    }
  }, [selectedMedia]);

  const displayRatio = isFit ? dynamicRatio : Math.max(4 / 5, dynamicRatio);
  const previewHeight = availableWidth / displayRatio;

  const canUpload = useMemo(() => !!selectedMedia && !uploading, [selectedMedia, uploading]);

  const resetAndClose = () => {
    setSelectedMedia(null);
    setCaption('');
    setSelectedFilter('Normal');
    setUploading(false);
    setUploadProgress(0);
    setIsCompressing(false);
    setIsFit(false);
    onClose();
  };

  const captureFromCamera = async () => {
    if (Platform.OS === 'web') {
      alert('Direct camera capture is not supported in web build. Please use mobile app for camera capture.');
      return;
    }

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      alert('Camera permission is required.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images', 'videos'] as any,
      allowsEditing: true,
      quality: 0.9,
      videoMaxDuration: 60,
    });

    if (result.canceled || !result.assets?.length) {
      return;
    }

    const asset = result.assets[0];
    const mimeType = asset.mimeType || (asset.type === 'video' ? 'video/mp4' : 'image/jpeg');
    const mediaType = asset.type === 'video' ? 'video' : 'image';

    if (mediaType === 'image' && !mimeType.startsWith('image/')) {
      alert('Only image files are supported for camera capture.');
      return;
    }

    if (mediaType === 'video' && !ACCEPTED_VIDEO_MIME_TYPES.includes(mimeType)) {
      alert('Only mp4 and mov videos are supported.');
      return;
    }

    setSelectedMedia({
      uri: asset.uri,
      mimeType,
      mediaType,
      name: asset.fileName || buildFileName(asset.uri, mediaType),
      width: asset.width,
      height: asset.height,
    });
  };

  const selectFromPhotoGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Photo library permission is required.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'] as any,
      allowsEditing: true,
      quality: 0.9,
      videoMaxDuration: 60,
    });

    if (result.canceled || !result.assets?.length) {
      return;
    }

    const asset = result.assets[0];
    const mimeType = asset.mimeType || (asset.type === 'video' ? 'video/mp4' : 'image/jpeg');
    const mediaType = asset.type === 'video' ? 'video' : 'image';

    if (mediaType === 'image' && !mimeType.startsWith('image/')) {
      alert('Only image files are supported for photos.');
      return;
    }

    if (mediaType === 'video' && !ACCEPTED_VIDEO_MIME_TYPES.includes(mimeType)) {
      alert('Only mp4 and mov videos are supported.');
      return;
    }

    setSelectedMedia({
      uri: asset.uri,
      mimeType,
      mediaType,
      name: asset.fileName || buildFileName(asset.uri, mediaType),
      width: asset.width,
      height: asset.height,
    });
  };

  const selectFromFiles = async () => {
    const DocumentPicker = await getUploadDocumentPicker();
    const result = await DocumentPicker.getDocumentAsync({
      type: ACCEPTED_MEDIA_TYPES,
      multiple: false,
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets?.length) {
      return;
    }

    const file = result.assets[0];
    const mimeType = file.mimeType || 'application/octet-stream';

    const isImage = mimeType.startsWith('image/');
    const isVideo = ACCEPTED_VIDEO_MIME_TYPES.includes(mimeType);

    if (!isImage && !isVideo) {
      alert('Only image files and mp4/mov videos are supported.');
      return;
    }

    const mediaType = detectMediaType(mimeType);
    setSelectedMedia({
      uri: file.uri,
      mimeType,
      mediaType,
      name: file.name || buildFileName(file.uri, mediaType),
    });
  };

  const handleUpload = async () => {
    if (!selectedMedia) {
      return;
    }

    if (onUploadStart) {
      onUploadStart(selectedMedia, caption, selectedFilter);
      resetAndClose();
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setIsCompressing(false);

    try {
      const response = await uploadUserPost(
        {
          uri: selectedMedia.uri,
          type: selectedMedia.mimeType,
          name: selectedMedia.name,
        },
        caption,
        selectedFilter,
        (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percent);
            if (percent >= 100 && selectedMedia.mediaType === 'video') {
              setIsCompressing(true);
            }
          }
        }
      );

      const data = response.data;
      onUploadSuccess(data);
      resetAndClose();
    } catch (error: any) {
      console.warn('Upload post failed:', error);
      alert(error?.message || 'Could not upload post. Please try again.');
    } finally {
      setUploading(false);
      setIsCompressing(false);
      setUploadProgress(0);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={resetAndClose}>
      <Animated.View style={[styles.overlay, { opacity: opacityAnim }]}>
        <BlurView intensity={Platform.OS === 'ios' ? 20 : 50} style={StyleSheet.absoluteFill} tint="dark" />
        <View style={styles.sheet}>
          <LinearGradient
            colors={['#ff7e5f', '#feb47b']}
            style={styles.header}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.title}>Create Post</Text>
            <TouchableOpacity
              onPress={resetAndClose}
              style={styles.iconBtn}
              accessibilityLabel="Close upload modal"
              accessibilityHint="Closes the modal without saving"
            >
              <Ionicons name="close" size={22} color={COLORS.background} />
            </TouchableOpacity>
          </LinearGradient>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            <Text style={styles.sectionTitle}>1. Choose Source</Text>
            <View style={styles.sourceRow}>
              <TouchableOpacity style={styles.sourceBtn} onPress={captureFromCamera}>
                <Ionicons name="camera-outline" size={18} color={COLORS.text} />
                <Text style={styles.sourceBtnText}>Camera</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.sourceBtn} onPress={selectFromPhotoGallery}>
                <Ionicons name="image-outline" size={18} color={COLORS.text} />
                <Text style={styles.sourceBtnText}>Photo Gallery</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.sourceBtn} onPress={selectFromFiles}>
                <Ionicons name="document-outline" size={18} color={COLORS.text} />
                <Text style={styles.sourceBtnText}>Files</Text>
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.sectionTitle}>2. Preview</Text>
              {selectedMedia && (
                <TouchableOpacity
                  onPress={() => setIsFit(!isFit)}
                  style={{ backgroundColor: COLORS.border, padding: 6, borderRadius: 8 }}
                >
                  <Ionicons name={isFit ? "expand" : "contract"} size={14} color={COLORS.text} />
                </TouchableOpacity>
              )}
            </View>

            <View
              style={[
                styles.previewBox,
                selectedMedia ? { height: Math.min(previewHeight, availableWidth / (4 / 5)) } : {}, // Don't let preview exceed 4:5 even if isFit for extreme verticals
              ]}
            >
              {!selectedMedia ? (
                <Text style={styles.previewPlaceholder}>Select media to preview</Text>
              ) : selectedMedia.mediaType === 'image' ? (
                <ScrollView
                  contentContainerStyle={{ flexGrow: 1 }}
                  style={{ width: '100%', height: '100%' }}
                  maximumZoomScale={3}
                  minimumZoomScale={1}
                  centerContent
                  showsHorizontalScrollIndicator={false}
                  showsVerticalScrollIndicator={false}
                  bouncesZoom={true}
                >
                  <Image
                    source={{ uri: selectedMedia.uri }}
                    style={styles.previewImage}
                    resizeMode={isFit ? "contain" : "cover"}
                    onLoad={(e) => {
                      const source = e.nativeEvent.source;
                      const w = source?.width || (e.nativeEvent as any).width;
                      const h = source?.height || (e.nativeEvent as any).height;
                      if (w && h) setDynamicRatio(w / h);
                    }}
                  />
                </ScrollView>
              ) : Platform.OS === 'web' ? (
                <video
                  src={selectedMedia.uri}
                  controls
                  style={{ width: '100%', height: '100%', objectFit: isFit ? 'contain' : 'cover' }}
                  onLoadedMetadata={(e) => {
                    const target = e.currentTarget as HTMLVideoElement;
                    const ratio = target.videoWidth && target.videoHeight ? target.videoWidth / target.videoHeight : null;
                    if (ratio) setDynamicRatio(ratio);
                  }}
                />
              ) : ExpoVideoModule?.VideoView && previewPlayer ? (
                <ExpoVideoModule.VideoView
                  player={previewPlayer}
                  style={styles.previewVideo}
                  contentFit={isFit ? 'contain' : 'cover'}
                  nativeControls
                  playsInline
                />
              ) : (
                <View style={[styles.previewVideo, { backgroundColor: '#000' }]} />
              )}
            </View>

            <Text style={styles.sectionTitle}>Caption</Text>
            <TextInput
              style={styles.captionInput}
              value={caption}
              onChangeText={setCaption}
              placeholder="Write a caption..."
              placeholderTextColor={COLORS.textSecondary}
              multiline
            />

            <Text style={styles.sectionTitle}>Filters (preview)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
              {FILTERS.map((filter) => (
                <TouchableOpacity
                  key={filter}
                  style={[styles.filterPill, selectedFilter === filter && styles.filterPillActive]}
                  onPress={() => setSelectedFilter(filter)}
                >
                  <Text
                    style={[styles.filterPillText, selectedFilter === filter && styles.filterPillTextActive]}
                  >
                    {filter}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={[styles.uploadBtn, !canUpload && styles.uploadBtnDisabled]}
              onPress={handleUpload}
              disabled={!canUpload}
            >
              {uploading ? (
                <View style={styles.uploadingContainer}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: 8 }}>
                    <ActivityIndicator color={COLORS.background} size="small" />
                    <Text style={styles.uploadingText}>
                      {isCompressing
                        ? 'Processing...'
                        : uploadProgress > 0 && uploadProgress < 100
                          ? `Uploading ${uploadProgress}%...`
                          : 'Uploading...'}
                    </Text>
                  </View>
                  <View style={styles.progressBarBackground}>
                    <Animated.View style={[styles.progressBarFill, { width: progressWidth }]} />
                  </View>
                </View>
              ) : (
                <Text style={styles.uploadBtnText}>Upload</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  scrollContent: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  title: {
    color: COLORS.background,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: SPACING.sm,
  },
  sourceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  sourceBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sourceBtnText: {
    color: COLORS.text,
    fontSize: 12,
    marginTop: 6,
    fontWeight: '600',
  },
  previewBox: {
    width: '100%',
    minHeight: 250, // default when no media
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  previewPlaceholder: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewVideo: {
    width: '100%',
    height: '100%',
  },
  captionInput: {
    minHeight: 88,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    color: COLORS.text,
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    textAlignVertical: 'top',
    marginBottom: SPACING.md,
  },
  filterRow: {
    marginBottom: SPACING.md,
  },
  filterPill: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: SPACING.sm,
  },
  filterPillActive: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(255,165,0,0.08)',
  },
  filterPillText: {
    color: COLORS.textSecondary,
    fontWeight: '600',
    fontSize: 12,
  },
  filterPillTextActive: {
    color: COLORS.primary,
  },
  uploadBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginBottom: SPACING.md,
  },
  uploadBtnDisabled: {
    opacity: 0.5,
  },
  uploadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  uploadingText: {
    color: COLORS.background,
    fontSize: 15,
    fontWeight: '600',
  },
  uploadBtnText: {
    color: COLORS.background,
    fontSize: 14,
    fontWeight: '700',
  },
  progressBarBackground: {
    width: '80%',
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 6,
    alignSelf: 'center',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
});
export default UploadPostModal;
