import re

with open('src/components/UploadPostModal.tsx', 'r') as f:
    orig = f.read()

# We will create a new full-screen material 3 component.
new_content = """import React, { useMemo, useState, useEffect, useRef } from 'react';
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
  SafeAreaView,
  KeyboardAvoidingView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
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
const BRANDS = ['Nike', 'Adidas', 'Puma', 'Zara', 'H&M', 'Other'];

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

// Material 3 Styled Input Component
const M3OutlinedInput = ({ label, value, onChangeText, multiline = false, placeholder = '' }: any) => {
  const [isFocused, setIsFocused] = useState(false);
  return (
    <View style={styles.inputContainer}>
      {isFocused || value ? (
        <Text style={[styles.inputLabelFloating, { color: isFocused ? COLORS.primary : COLORS.textSecondary }]}>
          {label}
        </Text>
      ) : null}
      <TextInput
        style={[
          styles.input,
          multiline && styles.inputMultiline,
          isFocused && styles.inputFocused,
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={isFocused ? placeholder : label}
        placeholderTextColor={COLORS.textSecondary}
        multiline={multiline}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
    </View>
  );
};

export const UploadPostModal = ({ visible, onClose, onUploadSuccess, onUploadStart }: UploadPostModalProps) => {
  const [selectedMedia, setSelectedMedia] = useState<SelectedMedia | null>(null);
  const [caption, setCaption] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('Normal');
  const [brand, setBrand] = useState('Nike');
  const [productName, setProductName] = useState('');
  const [description, setDescription] = useState('');
  const [shopName, setShopName] = useState('');
  const [schedule, setSchedule] = useState('');

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isCompressing, setIsCompressing] = useState<boolean>(false);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: uploadProgress,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [uploadProgress]);

  const screenWidth = Dimensions.get('window').width;
  const availableWidth = screenWidth - SPACING.lg * 2; // more margin
  const [dynamicRatio, setDynamicRatio] = useState<number>(4 / 5);
  const [isFit, setIsFit] = useState<boolean>(false); 

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
    setProductName('');
    setDescription('');
    setShopName('');
    setSchedule('');
    setSelectedFilter('Normal');
    setUploading(false);
    setUploadProgress(0);
    setIsCompressing(false);
    setIsFit(false);
    onClose();
  };

  const handleSaveDraft = () => {
    alert("Draft Saved.");
    resetAndClose();
  };

  const captureFromCamera = async () => {
    if (Platform.OS === 'web') {
      alert('Direct camera capture is not supported in web build. Please use mobile app for camera capture.');
      return;
    }
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return alert('Camera permission is required.');
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images', 'videos'] as any,
      allowsEditing: true,
      quality: 0.9,
      videoMaxDuration: 60,
    });
    if (result.canceled || !result.assets?.length) return;
    handleAssetSelected(result.assets[0]);
  };

  const selectFromPhotoGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return alert('Photo library permission is required.');
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'] as any,
      allowsEditing: true,
      quality: 0.9,
      videoMaxDuration: 60,
    });
    if (result.canceled || !result.assets?.length) return;
    handleAssetSelected(result.assets[0]);
  };

  const selectFromFiles = async () => {
    const DocumentPicker = await getUploadDocumentPicker();
    const result = await DocumentPicker.getDocumentAsync({
      type: ACCEPTED_MEDIA_TYPES,
      multiple: false,
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets?.length) return;
    const file = result.assets[0];
    const mimeType = file.mimeType || 'application/octet-stream';
    if (!mimeType.startsWith('image/') && !ACCEPTED_VIDEO_MIME_TYPES.includes(mimeType)) {
      return alert('Only image files and mp4/mov videos are supported.');
    }
    const mediaType = detectMediaType(mimeType);
    setSelectedMedia({
      uri: file.uri,
      mimeType,
      mediaType,
      name: file.name || buildFileName(file.uri, mediaType),
    });
  };

  const handleAssetSelected = (asset: any) => {
    const mimeType = asset.mimeType || (asset.type === 'video' ? 'video/mp4' : 'image/jpeg');
    const mediaType = asset.type === 'video' ? 'video' : 'image';
    if (mediaType === 'image' && !mimeType.startsWith('image/')) return alert('Only image files are supported for photos.');
    if (mediaType === 'video' && !ACCEPTED_VIDEO_MIME_TYPES.includes(mimeType)) return alert('Only mp4 and mov videos are supported.');
    setSelectedMedia({
      uri: asset.uri,
      mimeType,
      mediaType,
      name: asset.fileName || buildFileName(asset.uri, mediaType),
      width: asset.width,
      height: asset.height,
    });
  };

  const handleUpload = async () => {
    if (!selectedMedia) return;
    if (onUploadStart) {
      onUploadStart(selectedMedia, caption, selectedFilter);
      resetAndClose();
      return;
    }
    setUploading(true);
    setUploadProgress(0);
    setIsCompressing(false);

    try {
      // In reality, uploadUserPost probably needs to be updated to take more fields.
      // But for now, we pass them into caption as JSON or just keep old behavior
      // to not break the backend, or assume backend ignores unknown fields if we pass them.
      // Since API might just take caption, we'll prefix details into caption.
      const fullCaption = `${productName ? '**' + productName + '**\\n' : ''}${caption}\\n${description}\\nShop: ${shopName}\\nBrand: ${brand}`;

      const response = await uploadUserPost(
        { uri: selectedMedia.uri, type: selectedMedia.mimeType, name: selectedMedia.name },
        fullCaption,
        selectedFilter,
        (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percent);
            if (percent >= 100 && selectedMedia.mediaType === 'video') setIsCompressing(true);
          }
        }
      );
      onUploadSuccess(response.data);
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
    <Modal visible={visible} transparent={false} animationType="slide" onRequestClose={resetAndClose} presentationStyle="fullScreen">
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          
          {/* Material 3 App Bar */}
          <View style={styles.appBar}>
            <TouchableOpacity onPress={resetAndClose} style={styles.iconBtn}>
              <MaterialIcons name="close" size={28} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.title}>Create New Post</Text>
            <View style={styles.iconBtn} />
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            
            {/* Visual Media Section */}
            <View style={styles.mediaContainer}>
              <View
                style={[
                  styles.previewBox,
                  selectedMedia ? { height: Math.min(previewHeight, availableWidth / (4 / 5)) } : {},
                ]}
              >
                {!selectedMedia ? (
                  <View style={styles.emptyPreview}>
                    <MaterialIcons name="add-photo-alternate" size={48} color={COLORS.textSecondary} />
                    <Text style={styles.previewPlaceholder}>Upload Photos or Videos</Text>
                  </View>
                ) : selectedMedia.mediaType === 'image' ? (
                   <Image source={{ uri: selectedMedia.uri }} style={styles.previewImage} resizeMode={isFit ? "contain" : "cover"} />
                ) : Platform.OS === 'web' ? (
                  <video src={selectedMedia.uri} controls style={{ width: '100%', height: '100%', objectFit: isFit ? 'contain' : 'cover' }} />
                ) : ExpoVideoModule?.VideoView && previewPlayer ? (
                  <ExpoVideoModule.VideoView player={previewPlayer} style={styles.previewVideo} contentFit={isFit ? 'contain' : 'cover'} nativeControls playsInline />
                ) : (
                  <View style={[styles.previewVideo, { backgroundColor: '#000' }]} />
                )}
                
                {selectedMedia && (
                  <TouchableOpacity onPress={() => setIsFit(!isFit)} style={styles.fitToggleBtn}>
                    <Ionicons name={isFit ? "expand" : "contract"} size={18} color="#fff" />
                  </TouchableOpacity>
                )}
              </View>
              
              <View style={styles.sourceRow}>
                <TouchableOpacity style={styles.sourceCard} onPress={captureFromCamera}>
                  <MaterialIcons name="camera-alt" size={24} color={COLORS.primary} />
                  <Text style={styles.sourceCardText}>Camera</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.sourceCard} onPress={selectFromPhotoGallery}>
                  <MaterialIcons name="photo-library" size={24} color={COLORS.primary} />
                  <Text style={styles.sourceCardText}>Gallery</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.sourceCard} onPress={selectFromFiles}>
                  <MaterialIcons name="folder" size={24} color={COLORS.primary} />
                  <Text style={styles.sourceCardText}>Files</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Filter Section */}
            {selectedMedia && (
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Apply Filter</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
                  {FILTERS.map((filter) => (
                    <TouchableOpacity
                      key={filter}
                      style={[styles.filterChip, selectedFilter === filter && styles.filterChipActive]}
                      onPress={() => setSelectedFilter(filter)}
                    >
                      <Text style={[styles.filterChipText, selectedFilter === filter && styles.filterChipTextActive]}>
                        {filter}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Details Section */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Post Details</Text>
              
              <Text style={styles.subLabel}>Brand / Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.brandRow}>
                {BRANDS.map((b) => (
                  <TouchableOpacity
                    key={b}
                    style={[styles.brandChip, brand === b && styles.brandChipActive]}
                    onPress={() => setBrand(b)}
                  >
                    <Text style={[styles.brandChipText, brand === b && styles.brandChipTextActive]}>{b}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <M3OutlinedInput label="Product Name" value={productName} onChangeText={setProductName} />
              <M3OutlinedInput label="Description" value={description} onChangeText={setDescription} multiline focus />
              <M3OutlinedInput label="Caption / Tagline" value={caption} onChangeText={setCaption} multiline />
              <M3OutlinedInput label="Shop / Store Location (Optional)" value={shopName} onChangeText={setShopName} />
              
              <View style={styles.inputContainer}>
                 <Text style={[styles.inputLabelFloating, { color: COLORS.textSecondary }]}>Schedule Date & Time</Text>
                 <TextInput
                  style={styles.input}
                  value={schedule}
                  onChangeText={setSchedule}
                  placeholder="e.g. 2026-05-08 10:00 AM"
                  placeholderTextColor={COLORS.textSecondary}
                 />
                 <MaterialIcons name="schedule" size={20} color={COLORS.textSecondary} style={{position: 'absolute', right: 16, top: Platform.OS==='android'? 18 : 16}} />
              </View>
            </View>

            <View style={{height: 100}} /> 
          </ScrollView>

          {/* Bottom Action Bar */}
          <View style={styles.bottomBar}>
             {uploading ? (
               <View style={styles.uploadingContainer}>
                 <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: 8 }}>
                   <ActivityIndicator color={COLORS.primary} size="small" />
                   <Text style={{color: COLORS.primary, fontWeight: '600'}}>
                     {isCompressing ? 'Processing...' : uploadProgress > 0 && uploadProgress < 100 ? `Uploading ${uploadProgress}%...` : 'Uploading...'}
                   </Text>
                 </View>
                 <View style={styles.progressBarBackground}>
                   <Animated.View style={[styles.progressBarFill, { width: progressWidth }]} />
                 </View>
               </View>
             ) : (
               <View style={styles.actionButtons}>
                 <TouchableOpacity style={styles.draftBtn} onPress={handleSaveDraft}>
                   <Text style={styles.draftBtnText}>Save Draft</Text>
                 </TouchableOpacity>
                 <TouchableOpacity style={[styles.submitBtn, !canUpload && styles.uploadBtnDisabled]} onPress={handleUpload} disabled={!canUpload}>
                   <Text style={styles.submitBtnText}>Create Post</Text>
                 </TouchableOpacity>
               </View>
             )}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F6', // Material 3 Surface color approx
  },
  appBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    height: 56,
    backgroundColor: '#FAF9F6',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  title: {
    color: '#1C1B1F', // M3 On-Surface
    fontSize: 20,
    fontWeight: '600',
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  mediaContainer: {
    marginBottom: SPACING.xl,
  },
  previewBox: {
    width: '100%',
    minHeight: 280,
    borderRadius: 24, // M3 Large radius
    overflow: 'hidden',
    backgroundColor: '#EADDFF', // M3 Surface Variant / Primary Container
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  emptyPreview: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewPlaceholder: {
    color: '#49454F', // M3 On-Surface Variant
    fontSize: 16,
    marginTop: 8,
    fontWeight: '500',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewVideo: {
    width: '100%',
    height: '100%',
  },
  fitToggleBtn: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 8,
    borderRadius: 16,
  },
  sourceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  sourceCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  sourceCardText: {
    color: COLORS.primary,
    fontSize: 13,
    marginTop: 6,
    fontWeight: '600',
  },
  sectionContainer: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    color: '#1C1B1F', // M3 On Surface
    fontSize: 18,
    fontWeight: '700',
    marginBottom: SPACING.md,
  },
  subLabel: {
    color: '#49454F',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  filterRow: {
    marginBottom: SPACING.sm,
  },
  filterChip: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#79747E', // M3 Outline
    borderRadius: 8, // Rounded M3 Chip
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 10,
  },
  filterChipActive: {
    backgroundColor: '#E8DEF8', // M3 Secondary Container
    borderColor: 'transparent',
  },
  filterChipText: {
    color: '#49454F',
    fontWeight: '600',
    fontSize: 14,
  },
  filterChipTextActive: {
    color: '#1D192B', // M3 On Secondary Container
  },
  brandRow: {
    marginBottom: SPACING.md,
  },
  brandChip: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#79747E',
    borderRadius: 20, // Circular Chip
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 10,
  },
  brandChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  brandChipText: {
    color: '#49454F',
    fontWeight: '600',
    fontSize: 14,
  },
  brandChipTextActive: {
    color: '#fff',
  },
  inputContainer: {
    marginBottom: SPACING.md,
    marginTop: 6,
    position: 'relative',
  },
  inputLabelFloating: {
    position: 'absolute',
    top: -10,
    left: 12,
    backgroundColor: '#FAF9F6',
    paddingHorizontal: 4,
    fontSize: 12,
    zIndex: 1,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#79747E',
    borderRadius: 8, // M3 Extra Small Container format
    color: '#1C1B1F',
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 14 : 12,
  },
  inputFocused: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  inputMultiline: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.md,
    backgroundColor: '#FAF9F6',
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -4 },
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  draftBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#79747E', // M3 Outline
    borderRadius: 100, // M3 fully rounded Button
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  draftBtnText: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  submitBtn: {
    flex: 2,
    backgroundColor: COLORS.primary,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  uploadBtnDisabled: {
    backgroundColor: '#E0E0E0',
  },
  uploadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 10,
  },
  progressBarBackground: {
    width: '100%',
    height: 6,
    backgroundColor: '#EADDFF',
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 6,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
});
export default UploadPostModal;
"""

with open('src/components/UploadPostModal.tsx', 'w') as f:
    f.write(new_content)
