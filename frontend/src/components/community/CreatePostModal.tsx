import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  TextInput,
  Image,
  Platform,
  Alert,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { ResizeMode, Video } from 'expo-av';
import * as Clipboard from 'expo-clipboard';
import DateTimePickerModal from 'react-native-modal-datetime-picker';

const FONTS = {
  regular: 'AnekDevanagari-Regular',
  medium: 'AnekDevanagari-Medium',
  semiBold: 'AnekDevanagari-SemiBold',
  bold: 'AnekDevanagari-Bold',
  extraBold: 'AnekDevanagari-ExtraBold',
};

const POST_CATEGORIES = [
  { id: '1', name: 'Darshan', icon: 'eye-outline', colors: ['#FF9A9E', '#FECFEF'], type: 'darshan' },
  { id: '2', name: 'General', icon: 'chatbubbles-outline', colors: ['#A18CD1', '#FBC2EB'], type: 'general' },
  { id: '3', name: 'Events', icon: 'calendar-outline', colors: ['#84FAB0', '#8FD3F4'], type: 'events' },
  { id: '4', name: 'Requests', icon: 'hand-left-outline', colors: ['#FCCB90', '#D57EEB'], type: 'requests' },
  { id: '5', name: 'Lost & Found', icon: 'search-outline', colors: ['#E0C3FC', '#8EC5FC'], type: 'lost_found' },
  { id: '6', name: 'Others', icon: 'ellipsis-horizontal-circle-outline', colors: ['#FFD194', '#70E1F5'], type: 'others' },
];

export interface CreatePostModalProps {
  visible: boolean;
  onClose: () => void;
  communityId: string;
  communityType: string;
  user: any;
  isKycVerified: boolean;
  onSubmit: (formData: {
    content: string;
    media_url?: string;
    media_type?: 'image' | 'video';
    category?: string;
    contact?: string;
    seva_details?: string;
    location?: string;
    start_time?: string;
  }) => Promise<void>;
  onVerificationRequired: () => void;
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  visible,
  onClose,
  communityId,
  communityType,
  user,
  isKycVerified,
  onSubmit,
  onVerificationRequired
}) => {
  const insets = useSafeAreaInsets();
  const [newMessage, setNewMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedMediaType, setSelectedMediaType] = useState<'image' | 'video' | null>(null);
  const [postCategory, setPostCategory] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [sevaDetails, setSevaDetails] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [eventDate, setEventDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showInlineCategories, setShowInlineCategories] = useState(false);
  const [showCategorySelector, setShowCategorySelector] = useState(false);

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.length) {
      setSelectedImage(result.assets[0].uri);
      setSelectedMediaType(result.assets[0].type === 'video' ? 'video' : 'image');
    }
  };

  const handlePaste = async () => {
    try {
      const text = await Clipboard.getStringAsync();
      if (text) {
        setNewMessage(prev => prev + text);
      } else {
        Alert.alert('Clipboard Empty', 'There is no text in your clipboard to paste.');
      }
    } catch (error) {
      console.warn('Clipboard read error:', error);
      Alert.alert('Paste Error', 'Failed to read from clipboard.');
    }
  };

  const resetForm = () => {
    setNewMessage('');
    setSelectedImage(null);
    setSelectedMediaType(null);
    setPostCategory('');
    setContactNumber('');
    setSevaDetails('');
    setEventLocation('');
    setEventDate(null);
    setShowInlineCategories(false);
    setShowCategorySelector(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleCategorySelectedAndPost = async (selectedCategory: string) => {
    setShowCategorySelector(false);
    setPostCategory(selectedCategory);

    if (selectedCategory === 'Requests' && !isKycVerified) {
      setShowCategorySelector(false);
      onVerificationRequired();
      return;
    }

    const formData = {
      content: newMessage.trim(),
      media_url: selectedImage || undefined,
      media_type: selectedMediaType || undefined,
      category: selectedCategory,
      contact: contactNumber || undefined,
      seva_details: sevaDetails || undefined,
      location: eventLocation || undefined,
      start_time: eventDate ? eventDate.toISOString() : undefined,
    };

    await onSubmit(formData);
    resetForm();
  };

  const handlePostButtonPress = () => {
    if (!newMessage.trim() && !selectedImage) return;

    if (postCategory) {
      handleCategorySelectedAndPost(postCategory);
    } else {
      setShowCategorySelector(true);
    }
  };

  return (
    <>
      <Modal visible={visible} animationType="fade" transparent={false} hardwareAccelerated>
        <LinearGradient colors={['#FF8D57', '#EA9B76', '#F8EDE7']} locations={[0, 0.14, 0.32]} style={{ flex: 1 }}>
        <View style={{ flex: 1, paddingTop: Platform.OS === 'android' ? 32 : (insets.top || 44) }}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ flex: 1 }}
          >
            <View style={[styles.createModalHeader, { borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)', paddingHorizontal: 16, paddingTop: 15 }]}>
              <TouchableOpacity onPress={handleClose}>
                <Text style={{ fontSize: 16, color: '#0F1419', fontFamily: FONTS.regular }}>Cancel</Text>
              </TouchableOpacity>

              <Text style={{ fontSize: 15, color: '#0F1419', fontWeight: '700', fontFamily: FONTS.bold }}>Create Post</Text>

              <TouchableOpacity
                style={[
                  styles.twitterPostBtn,
                  (!newMessage.trim() && !selectedImage) && { opacity: 0.5 }
                ]}
                onPress={handlePostButtonPress}
                disabled={!newMessage.trim() && !selectedImage}
              >
                <Text style={styles.twitterPostBtnText}>Post</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.createModalContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 100 }}
            >
              {postCategory === 'Darshan' && (
                <View style={styles.categoryInfoBanner}>
                  <Ionicons name="eye-outline" size={20} color="#FF5A5F" />
                  <Text style={styles.categoryInfoText}>Sharing Darshan images with the community</Text>
                  <TouchableOpacity onPress={() => setShowInlineCategories(!showInlineCategories)}>
                    <Ionicons name="pencil-outline" size={16} color="#FF5A5F" style={{ marginLeft: 8 }} />
                  </TouchableOpacity>
                </View>
              )}

              {postCategory === 'Requests' && (
                <View style={styles.categoryInfoBanner}>
                  <Ionicons name="hand-left-outline" size={20} color="#FF5A5F" />
                  <Text style={styles.categoryInfoText}>Requesting Seva or Help</Text>
                  <TouchableOpacity onPress={() => setShowInlineCategories(!showInlineCategories)}>
                    <Ionicons name="pencil-outline" size={16} color="#FF5A5F" style={{ marginLeft: 8 }} />
                  </TouchableOpacity>
                </View>
              )}

              {postCategory === 'Events' && (
                <View style={styles.categoryInfoBanner}>
                  <Ionicons name="calendar-outline" size={20} color="#FF5A5F" />
                  <Text style={styles.categoryInfoText}>Creating a Community Event</Text>
                  <TouchableOpacity onPress={() => setShowInlineCategories(!showInlineCategories)}>
                    <Ionicons name="pencil-outline" size={16} color="#FF5A5F" style={{ marginLeft: 8 }} />
                  </TouchableOpacity>
                </View>
              )}

              {postCategory === 'Lost & Found' && (
                <View style={styles.categoryInfoBanner}>
                  <Ionicons name="search-outline" size={20} color="#FF5A5F" />
                  <Text style={styles.categoryInfoText}>Reporting Lost or Found Items</Text>
                  <TouchableOpacity onPress={() => setShowInlineCategories(!showInlineCategories)}>
                    <Ionicons name="pencil-outline" size={16} color="#FF5A5F" style={{ marginLeft: 8 }} />
                  </TouchableOpacity>
                </View>
              )}

              {showInlineCategories && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 15, paddingHorizontal: 4 }}>
                  {POST_CATEGORIES.map((cat, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={[
                        styles.inlineCategoryChip,
                        postCategory === cat.name && styles.inlineCategoryChipActive
                      ]}
                      onPress={() => {
                        setPostCategory(cat.name);
                        setShowInlineCategories(false);
                      }}
                    >
                      <Ionicons
                        name={cat.icon as any}
                        size={16}
                        color={postCategory === cat.name ? "#FFF" : "#666"}
                        style={{ marginRight: 6 }}
                      />
                      <Text style={[
                        styles.inlineCategoryChipText,
                        postCategory === cat.name && styles.inlineCategoryChipTextActive
                      ]}>{cat.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}

              <View style={styles.tweetInputArea}>
                <Image
                  source={user?.photo ? { uri: user.photo } : require('../../../assets/images/default-avatar.png')}
                  style={styles.tweetAvatar}
                />
                <View style={{ flex: 1 }}>
                  <TextInput
                    style={styles.tweetInput}
                    placeholder="What's happening in your community?"
                    placeholderTextColor="#536471"
                    multiline
                    autoFocus
                    maxLength={1000}
                    value={newMessage}
                    onChangeText={setNewMessage}
                  />

                  {/* Context-specific input fields based on category */}
                  {postCategory === 'Requests' && (
                    <View style={styles.extraFieldsContainer}>
                      <TextInput
                        style={styles.extraInput}
                        placeholder="Contact Number (Optional)"
                        placeholderTextColor="#888"
                        keyboardType="phone-pad"
                        value={contactNumber}
                        onChangeText={setContactNumber}
                      />
                      <TextInput
                        style={[styles.extraInput, { minHeight: 60 }]}
                        placeholder="Seva Details / Requirements"
                        placeholderTextColor="#888"
                        multiline
                        value={sevaDetails}
                        onChangeText={setSevaDetails}
                      />
                    </View>
                  )}

                  {postCategory === 'Events' && (
                    <View style={styles.extraFieldsContainer}>
                      <TextInput
                        style={styles.extraInput}
                        placeholder="Event Location"
                        placeholderTextColor="#888"
                        value={eventLocation}
                        onChangeText={setEventLocation}
                      />

                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
                        <TouchableOpacity style={styles.dateTimeBtn} onPress={() => setShowDatePicker(true)}>
                          <Ionicons name="calendar-outline" size={18} color="#FF5A5F" />
                          <Text style={styles.dateTimeText}>
                            {eventDate ? eventDate.toLocaleDateString() : 'Select Date'}
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.dateTimeBtn} onPress={() => setShowTimePicker(true)}>
                          <Ionicons name="time-outline" size={18} color="#FF5A5F" />
                          <Text style={styles.dateTimeText}>
                            {eventDate ? eventDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Select Time'}
                          </Text>
                        </TouchableOpacity>
                      </View>

                      <DateTimePickerModal
                        isVisible={showDatePicker}
                        mode="date"
                        onConfirm={(date) => {
                          const newDate = eventDate ? new Date(eventDate) : new Date();
                          newDate.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
                          setEventDate(newDate);
                          setShowDatePicker(false);
                        }}
                        onCancel={() => setShowDatePicker(false)}
                      />

                      <DateTimePickerModal
                        isVisible={showTimePicker}
                        mode="time"
                        onConfirm={(date) => {
                          const newDate = eventDate ? new Date(eventDate) : new Date();
                          newDate.setHours(date.getHours(), date.getMinutes());
                          setEventDate(newDate);
                          setShowTimePicker(false);
                        }}
                        onCancel={() => setShowTimePicker(false)}
                      />
                    </View>
                  )}

                  {selectedImage && (
                    <View style={styles.tweetImagePreviewContainer}>
                      {selectedMediaType === 'video' ? (
                        <View style={{ position: 'relative' }}>
                          <Video
                            source={{ uri: selectedImage }}
                            style={styles.tweetImagePreview}
                            resizeMode={ResizeMode.COVER}
                            useNativeControls={true}
                            isLooping={true}
                            shouldPlay={true}
                            isMuted={true}
                          />
                          <View style={styles.videoIndicatorOverlay}>
                            <Ionicons name="play-circle" size={24} color="#FFF" />
                          </View>
                        </View>
                      ) : (
                        <Image source={{ uri: selectedImage }} style={styles.tweetImagePreview} />
                      )}
                      <TouchableOpacity
                        style={styles.tweetRemoveImageBtn}
                        onPress={() => {
                          setSelectedImage(null);
                          setSelectedMediaType(null);
                        }}
                      >
                        <Ionicons name="close" size={16} color="#FFF" />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            </ScrollView>

            {/* Bottom Toolbar for Twitter-like Compose */}
            <View style={styles.tweetToolbar}>
              <View style={styles.tweetToolbarIcons}>
                <TouchableOpacity onPress={handlePickImage} style={styles.tweetToolbarBtn}>
                  <Ionicons name="image-outline" size={24} color="#1D9BF0" />
                </TouchableOpacity>
                <TouchableOpacity onPress={handlePaste} style={styles.tweetToolbarBtn}>
                  <Ionicons name="clipboard-outline" size={24} color="#1D9BF0" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.tweetToolbarBtn} onPress={() => setShowCategorySelector(true)}>
                  <Ionicons name="pricetag-outline" size={24} color={postCategory ? "#1D9BF0" : "#536471"} />
                </TouchableOpacity>
                {postCategory === 'Events' && (
                  <TouchableOpacity style={styles.tweetToolbarBtn} onPress={() => setShowDatePicker(true)}>
                    <Ionicons name="calendar-outline" size={24} color="#1D9BF0" />
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.tweetToolbarRight}>
                <Text style={[styles.charCount, newMessage.length > 900 && { color: '#F4212E' }]}>
                  {newMessage.length}/1000
                </Text>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
        </LinearGradient>
      </Modal>

      <Modal
        visible={showCategorySelector}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCategorySelector(false)}
      >
        <TouchableOpacity
          style={styles.dropdownModalOverlay}
          activeOpacity={1}
          onPress={() => setShowCategorySelector(false)}
        >
          <View style={[styles.dropdownModalContent, { paddingBottom: Math.max(insets.bottom, 20) }]}>
            <View style={styles.dropdownModalHeader}>
              <Text style={styles.dropdownModalTitle}>Select Category</Text>
              <TouchableOpacity onPress={() => setShowCategorySelector(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.categoriesGrid}>
              {POST_CATEGORIES.map((cat, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.categoryGridItem,
                    postCategory === cat.name && styles.categoryGridItemActive
                  ]}
                  onPress={() => handleCategorySelectedAndPost(cat.name)}
                >
                  <LinearGradient
                    colors={cat.colors as [string, string]}
                    style={styles.categoryGridIconBg}
                  >
                    <Ionicons name={cat.icon as any} size={28} color="#FFF" />
                  </LinearGradient>
                  <Text style={styles.categoryGridLabel}>{cat.name}</Text>

                  {postCategory === cat.name && (
                    <View style={styles.categoryCheckmark}>
                      <Ionicons name="checkmark-circle" size={20} color="#FF5A5F" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  createModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  twitterPostBtn: {
    backgroundColor: '#0F1419',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 9999,
  },
  twitterPostBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },
  createModalContent: {
    flex: 1,
    padding: 20,
  },
  categoryInfoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 90, 95, 0.1)',
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
  },
  categoryInfoText: {
    marginLeft: 8,
    color: '#FF5A5F',
    fontFamily: FONTS.medium,
    fontSize: 14,
  },
  inlineCategoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inlineCategoryChipActive: {
    backgroundColor: '#FF5A5F',
    borderColor: '#FF5A5F',
  },
  inlineCategoryChipText: {
    fontSize: 13,
    color: '#666',
    fontFamily: FONTS.medium,
  },
  inlineCategoryChipTextActive: {
    color: '#FFF',
  },
  tweetInputArea: {
    flexDirection: 'row',
    marginTop: 10,
  },
  tweetAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  tweetInput: {
    fontSize: 18,
    color: '#0F1419',
    fontFamily: FONTS.regular,
    minHeight: 120,
    textAlignVertical: 'top',
    paddingTop: 8,
  },
  extraFieldsContainer: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  extraInput: {
    backgroundColor: '#F7F9F9',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    fontSize: 15,
    fontFamily: FONTS.regular,
    color: '#0F1419',
  },
  dateTimeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F9F9',
    padding: 12,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  dateTimeText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
    fontFamily: FONTS.medium,
  },
  tweetImagePreviewContainer: {
    marginTop: 12,
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
  },
  tweetImagePreview: {
    width: '100%',
    height: 250,
    borderRadius: 16,
  },
  tweetRemoveImageBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(15, 20, 25, 0.75)',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoIndicatorOverlay: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tweetToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#EFF3F4',
    backgroundColor: '#FFF',
  },
  tweetToolbarIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tweetToolbarBtn: {
    marginRight: 20,
  },
  tweetToolbarRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  charCount: {
    fontSize: 13,
    color: '#536471',
    fontFamily: FONTS.medium,
    marginRight: 16,
  },
  dropdownModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  dropdownModalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  dropdownModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  dropdownModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
    fontFamily: FONTS.bold,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryGridItem: {
    width: '31%',
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  categoryGridItemActive: {
    opacity: 0.8,
  },
  categoryGridIconBg: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  categoryGridLabel: {
    fontSize: 13,
    color: '#333',
    fontFamily: FONTS.medium,
    textAlign: 'center',
  },
  categoryCheckmark: {
    position: 'absolute',
    top: -4,
    right: 8,
    backgroundColor: '#FFF',
    borderRadius: 10,
  },
});
