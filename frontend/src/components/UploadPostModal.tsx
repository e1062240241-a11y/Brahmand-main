import React, { useMemo, useState, useEffect } from 'react';
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
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Video, ResizeMode } from 'expo-av';

let UploadDocumentPicker: any = null;
const getUploadDocumentPicker = async () => {
  if (!UploadDocumentPicker) {
    UploadDocumentPicker = await import('expo-document-picker');
  }
  return UploadDocumentPicker;
};
import { Ionicons } from '@expo/vector-icons';

import { COLORS, SPACING } from '../constants/theme';
import { uploadUserPost } from '../services/api';

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

export const UploadPostModal = ({ visible, onClose, onUploadSuccess }: UploadPostModalProps) => {
  const [selectedMedia, setSelectedMedia] = useState<SelectedMedia | null>(null);
  const [caption, setCaption] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('Normal');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isCompressing, setIsCompressing] = useState<boolean>(false);

  // Dynamic preview height calculation
  const screenWidth = Dimensions.get('window').width;
  const availableWidth = screenWidth - SPACING.md * 2;
  const [dynamicRatio, setDynamicRatio] = useState<number>(4 / 5);
  const [isFit, setIsFit] = useState<boolean>(false); // Used for Insta-style original vs 4:5 toggle

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
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      quality: 0.9,
      videoMaxDuration: 33,
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
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      quality: 0.9,
      videoMaxDuration: 33,
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
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Create Post</Text>
            <TouchableOpacity onPress={resetAndClose} style={styles.iconBtn}>
              <Ionicons name="close" size={22} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
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
                selectedMedia ? { height: Math.min(previewHeight, availableWidth / (4/5)) } : {}, // Don't let preview exceed 4:5 even if isFit for extreme verticals
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
              ) : (
                <Video
                  source={{ uri: selectedMedia.uri }}
                  style={styles.previewVideo}
                  useNativeControls
                  resizeMode={isFit ? ResizeMode.CONTAIN : ResizeMode.COVER}
                  isLooping
                  onReadyForDisplay={(e) => {
                    const w = e.naturalSize?.width;
                    const h = e.naturalSize?.height;
                    const orientation = e.naturalSize?.orientation;
                    
                    // Native mobile videos sometimes swap width/height based on orientation
                    if (w && h) {
                      const actualRatio = (orientation === 'portrait' || (h > w && orientation !== 'landscape')) ? Math.min(w, h) / Math.max(w, h) : w / h;
                      setDynamicRatio(actualRatio);
                    }
                  }}
                />
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
                  <ActivityIndicator color={COLORS.background} size="small" />
                  <Text style={styles.uploadingText}>
                    {isCompressing
                      ? 'Processing...'
                      : uploadProgress > 0 && uploadProgress < 100 
                      ? `Uploading ${uploadProgress}%...` 
                      : 'Uploading...'}
                  </Text>
                </View>
              ) : (
                <Text style={styles.uploadBtnText}>Upload</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
    maxHeight: '92%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '700',
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.border,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
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
});

export default UploadPostModal;
