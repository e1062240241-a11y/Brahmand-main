import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { KeyboardAwareScrollView } from '../KeyboardAwareScrollView';
import { Avatar } from '../Avatar';
import { MentionInput } from '../MentionInput';
import { formatTimeIST } from '../../utils/dateUtils';
import { FONTS } from '../../constants/theme';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop, G } from 'react-native-svg';

const POST_CATEGORIES = ['Others', 'Requests', 'Events', 'Lost & Found', 'Festivals', 'Seva', 'Temple Updates'];

const CosmicCharacterRing = ({ textLength, text }: { textLength?: number; text?: string }) => {
  const size = 64;
  const padding = 4;
  const strokeWidth = 3.5;
  const radius = (size - padding * 2 - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * radius;
  const limit = 250;

  const effectiveLength = typeof text === 'string'
    ? text.replace(/\s/g, '').length
    : (textLength || 0);

  const currentTextLength = effectiveLength > 0 && effectiveLength % limit === 0 ? limit : effectiveLength % limit;
  const threadCount = Math.floor(effectiveLength / limit) + (effectiveLength % limit > 0 ? 1 : 0);
  const remaining = limit - currentTextLength;

  const percentage = Math.min((currentTextLength / limit) * 100, 100);
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  let stopColor1 = '#38BDF8';
  let stopColor2 = '#0284C7';

  if (percentage >= 80 || remaining <= 20) {
    stopColor1 = '#FF3D00';
    stopColor2 = '#D50000';
  } else if (percentage >= 50) {
    stopColor1 = '#38BDF8';
    stopColor2 = '#00B0FF';
  }

  const sgRadius = radius * 0.45;
  const sgCircles = React.useMemo(() => {
    const circles = [];
    for (let i = 0; i < 6; i++) {
      const a = (i * 60 * Math.PI) / 180;
      circles.push({
        x: cx + sgRadius * Math.cos(a),
        y: cy + sgRadius * Math.sin(a),
      });
    }
    return circles;
  }, [cx, cy, sgRadius]);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      {threadCount > 1 && (
        <View style={{
          backgroundColor: 'rgba(56, 189, 248, 0.12)',
          borderColor: 'rgba(56, 189, 248, 0.3)',
          borderWidth: 1,
          paddingHorizontal: 10,
          paddingVertical: 3,
          borderRadius: 14,
        }}>
          <Text style={{ fontSize: 11, color: '#38BDF8', fontFamily: FONTS.bold }}>
            {threadCount} posts
          </Text>
        </View>
      )}

      <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
        <Svg width={size} height={size}>
          <Defs>
            <SvgLinearGradient id="cosmicGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={stopColor1} />
              <Stop offset="100%" stopColor={stopColor2} />
            </SvgLinearGradient>
          </Defs>

          <G opacity={0.45}>
            {sgCircles.map((circle, idx) => (
              <Circle
                key={idx}
                cx={circle.x}
                cy={circle.y}
                r={sgRadius}
                stroke="#FFFFFF"
                strokeWidth={0.8}
                fill="none"
              />
            ))}
          </G>

          <Circle
            cx={cx}
            cy={cy}
            r={radius}
            stroke="rgba(255, 255, 255, 0.15)"
            strokeWidth={strokeWidth}
            fill="transparent"
          />

          <Circle
            cx={cx}
            cy={cy}
            r={radius}
            stroke="url(#cosmicGradient)"
            strokeWidth={remaining <= 0 ? strokeWidth + 0.6 : strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${cx} ${cy})`}
          />
        </Svg>

        <View style={{ position: 'absolute', alignItems: 'center', justifyContent: 'center' }}>
          <Text
            style={{
              fontSize: remaining <= 0 ? 12 : remaining < 100 ? 15 : 13,
              fontWeight: '700',
              fontFamily: FONTS.bold,
              color: remaining <= 0 ? '#FF2D55' : remaining <= 20 ? '#FF9500' : '#FFFFFF',
              lineHeight: 16,
            }}
          >
            {remaining}
          </Text>
        </View>
      </View>
    </View>
  );
};

export interface CreatePostModalProps {
  visible: boolean;
  newMessage: string;
  selectedImage: string | null;
  selectedMediaType: 'image' | 'video' | null;
  postCategory: string;
  showInlineCategories: boolean;
  contactNumber: string;
  sevaDetails: string;
  eventLocation: string;
  eventDate: Date | null;
  showDatePicker: boolean;
  showTimePicker: boolean;
  isKycVerified: boolean;
  user: any;
  keyboardVisible: boolean;
  keyboardHeight: number;
  onClose: () => void;
  onMessageChange: (text: string) => void;
  onPickImage: () => void;
  onRemoveImage: () => void;
  onPost: () => void;
  onInlineCategorySelect: (category: string) => void;
  onShowInlineCategoriesToggle: () => void;
  onContactNumberChange: (text: string) => void;
  onSevaDetailsChange: (text: string) => void;
  onEventLocationChange: (text: string) => void;
  onEventDateChange: (date: Date | null) => void;
  onOpenDatePicker: () => void;
  onOpenTimePicker: () => void;
  onShowDatePickerChange: (show: boolean) => void;
  onShowTimePickerChange: (show: boolean) => void;

  // Additional props for exact UI & i18n
  t: (key: string) => string;
  insets: { top: number; bottom: number; left: number; right: number };
  getTranslatedTab: (tab: string) => string;
  onClearCategory: () => void;
  CommunityMediaItem: React.ComponentType<{ media: any; style: any; isActive?: boolean }>;
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  visible,
  newMessage,
  selectedImage,
  selectedMediaType,
  postCategory,
  showInlineCategories,
  contactNumber,
  sevaDetails,
  eventLocation,
  eventDate,
  showDatePicker,
  showTimePicker,
  isKycVerified,
  user,
  keyboardVisible,
  keyboardHeight,
  onClose,
  onMessageChange,
  onPickImage,
  onRemoveImage,
  onPost,
  onInlineCategorySelect,
  onShowInlineCategoriesToggle,
  onContactNumberChange,
  onSevaDetailsChange,
  onEventLocationChange,
  onEventDateChange,
  onOpenDatePicker,
  onOpenTimePicker,
  onShowDatePickerChange,
  onShowTimePickerChange,
  t,
  insets,
  getTranslatedTab,
  onClearCategory,
  CommunityMediaItem,
}) => {
  return (
    <Modal visible={visible} animationType="fade" transparent={false} hardwareAccelerated onRequestClose={onClose}>
      <LinearGradient colors={['#FF8D57', '#EA9B76', '#F8EDE7']} locations={[0, 0.14, 0.32]} style={{ flex: 1 }}>
        <View style={{ flex: 1, paddingTop: Platform.OS === 'android' ? 32 : (insets.top || 44) }}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ flex: 1 }}
          >
            <View style={[styles.createModalHeader, { borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)', paddingHorizontal: 16, paddingTop: 15 }]}>
              <TouchableOpacity onPress={onClose}>
                <Text style={{ fontSize: 16, color: '#0F1419', fontFamily: FONTS.regular }}>Cancel</Text>
              </TouchableOpacity>

              <Text style={{ fontSize: 15, color: '#0F1419', fontWeight: '700', fontFamily: FONTS.bold }}>Create Post</Text>

              <TouchableOpacity
                style={[
                  styles.twitterPostBtn,
                  (!newMessage.trim() && !selectedImage) && { opacity: 0.5 }
                ]}
                onPress={onPost}
                disabled={!newMessage.trim() && !selectedImage}
              >
                <Text style={styles.twitterPostBtnText}>Post</Text>
              </TouchableOpacity>
            </View>

            <KeyboardAwareScrollView style={{ flex: 1, paddingHorizontal: 16 }} keyboardShouldPersistTaps="handled">
              <View style={{ flexDirection: 'row', marginTop: 15, backgroundColor: 'rgba(255,255,255,0.4)', borderRadius: 16, padding: 12 }}>
                <Avatar name={user?.name || '?'} photo={user?.photo} size={40} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  {!postCategory ? (
                    <TouchableOpacity
                      onPress={onShowInlineCategoriesToggle}
                      activeOpacity={0.7}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        alignSelf: 'flex-start',
                        gap: 6,
                        backgroundColor: '#FF6600',
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 16,
                        marginBottom: 10,
                      }}
                    >
                      <Ionicons name="pricetag-outline" size={14} color="#FFF" />
                      <Text style={{ fontSize: 12, fontWeight: '700', color: '#FFF', fontFamily: FONTS.bold }}>
                        {t('language') === 'hi' ? 'श्रेणी चुनें *' : 'Choose Category *'}
                      </Text>
                      <Ionicons name={showInlineCategories ? "chevron-up" : "chevron-down"} size={12} color="#FFF" />
                    </TouchableOpacity>
                  ) : (
                    <View style={[styles.selectedCategoryBadge, { marginBottom: 10, marginTop: 0 }]}>
                      <Ionicons name="pricetag-outline" size={14} color="#FF6B00" />
                      <Text style={styles.selectedCategoryText}>
                        {t('language') === 'hi' ? 'श्रेणी' : 'Category'}: {getTranslatedTab(postCategory)}
                      </Text>
                      <TouchableOpacity onPress={onClearCategory}>
                        <Ionicons name="close-circle" size={16} color="#FF6600" style={{ marginLeft: 6 }} />
                      </TouchableOpacity>
                    </View>
                  )}

                  {showInlineCategories && (
                    <View style={{ marginBottom: 16 }}>
                      <Text style={{ fontSize: 13, fontFamily: FONTS.bold, color: '#666', marginBottom: 8 }}>
                        {t('language') === 'hi' ? 'श्रेणी का चयन करें' : 'Select Category'}
                      </Text>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                        {POST_CATEGORIES.map((cat) => {
                          let iconColor = '#536471';
                          if (cat === 'Others') iconColor = '#1D9BF0';
                          else if (cat === 'Seva') iconColor = '#E91E63';
                          else if (cat === 'Requests') iconColor = '#FF6B00';
                          else if (cat === 'Events') iconColor = '#00C853';
                          else if (cat === 'Lost & Found') iconColor = '#9C27B0';
                          else if (cat === 'Festivals') iconColor = '#FF9800';
                          else if (cat === 'Temple Updates') iconColor = '#795548';

                          return (
                            <TouchableOpacity
                              key={cat}
                              onPress={() => {
                                onInlineCategorySelect(cat);
                              }}
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                backgroundColor: '#FFF',
                                paddingHorizontal: 12,
                                paddingVertical: 8,
                                borderRadius: 20,
                                borderWidth: 1,
                                borderColor: `${iconColor}30`,
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 1 },
                                shadowOpacity: 0.05,
                                shadowRadius: 2,
                                elevation: 1,
                              }}
                            >
                              <View style={{
                                width: 20,
                                height: 20,
                                borderRadius: 10,
                                backgroundColor: `${iconColor}15`,
                                justifyContent: 'center',
                                alignItems: 'center',
                                marginRight: 6
                              }}>
                                <Ionicons
                                  name={
                                    cat === 'Others' ? 'chatbubble-ellipses-outline' :
                                    cat === 'Seva' ? 'heart-outline' :
                                    cat === 'Requests' ? 'alert-circle-outline' :
                                    cat === 'Events' ? 'calendar-outline' :
                                    cat === 'Lost & Found' ? 'search-outline' :
                                    cat === 'Festivals' ? 'flame-outline' :
                                    'home-outline'
                                  }
                                  size={12}
                                  color={iconColor}
                                />
                              </View>
                              <Text style={{ fontSize: 12, fontFamily: FONTS.medium, color: '#333' }}>
                                {getTranslatedTab(cat)}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  )}
                  <MentionInput
                    value={newMessage}
                    onChangeText={onMessageChange}
                    placeholder={
                      t('language') === 'hi'
                        ? (postCategory ? 'क्या चल रहा है?' : 'लिखना शुरू करने के लिए ऊपर एक श्रेणी चुनें...')
                        : (postCategory ? "What's happening?" : "Select a category above to start writing...")
                    }
                    placeholderTextColor="#536471"
                    multiline
                    editable={!!postCategory}
                    inputStyle={{
                      fontSize: 18,
                      color: '#0F1419',
                      minHeight: 120,
                      textAlignVertical: 'top',
                      paddingTop: 4,
                      lineHeight: 24,
                      opacity: postCategory ? 1 : 0.6
                    }}
                    autoFocus={!!postCategory}
                  />

                  {/* Add Photo option directly beneath the input box for better accessibility */}
                  {!selectedImage ? (
                    <TouchableOpacity
                      onPress={() => {
                        if (!postCategory) {
                          Alert.alert('', t('language') === 'hi' ? 'लिखना शुरू करने के लिए ऊपर एक श्रेणी चुनें...' : 'Select a category above to start writing...');
                          return;
                        }
                        onPickImage();
                      }}
                      activeOpacity={0.7}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        alignSelf: 'flex-start',
                        gap: 6,
                        backgroundColor: !postCategory ? '#F0F0F0' : 'rgba(255, 102, 0, 0.08)',
                        paddingHorizontal: 14,
                        paddingVertical: 8,
                        borderRadius: 20,
                        marginTop: 10,
                        borderWidth: 1,
                        borderColor: !postCategory ? '#E0E0E0' : 'rgba(255, 102, 0, 0.2)',
                      }}
                    >
                      <Ionicons name="images-outline" size={18} color={!postCategory ? "#A0A0A0" : "#FF6600"} />
                      <Text style={{ fontSize: 13, fontWeight: '700', color: !postCategory ? "#A0A0A0" : "#FF6600", fontFamily: FONTS.bold }}>
                        Add Media
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={{ position: 'relative', marginTop: 10, borderRadius: 12, overflow: 'hidden', width: '100%', height: 250 }}>
                      <CommunityMediaItem media={selectedImage} style={{ width: '100%', height: '100%' }} isActive={true} />
                      <TouchableOpacity
                        style={{ position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 15, padding: 4 }}
                        onPress={onRemoveImage}
                      >
                        <Ionicons name="close" size={16} color="#FFF" />
                      </TouchableOpacity>
                    </View>
                  )}

                  {postCategory === 'Events' && (
                    <View style={{ marginTop: 15, backgroundColor: 'rgba(255,255,255,0.6)', padding: 12, borderRadius: 12 }}>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: '#0F1419', marginBottom: 10 }}>Event Date & Time</Text>
                      <View style={{ flexDirection: 'row', gap: 10 }}>
                        <TouchableOpacity
                          onPress={onOpenDatePicker}
                          style={{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#EEE' }}
                        >
                          <Ionicons name="calendar-outline" size={18} color="#FF6600" />
                          <Text style={{ marginLeft: 8, fontSize: 13, color: eventDate ? '#000' : '#888' }}>
                            {eventDate ? (() => {
                              const day = String(eventDate.getDate()).padStart(2, '0');
                              const month = String(eventDate.getMonth() + 1).padStart(2, '0');
                              return `${day}/${month}/${eventDate.getFullYear()}`;
                            })() : 'Select Date'}
                          </Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                          onPress={onOpenTimePicker}
                          style={{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#EEE' }}
                        >
                          <Ionicons name="time-outline" size={18} color="#FF6600" />
                          <Text style={{ marginLeft: 8, fontSize: 13, color: eventDate ? '#000' : '#888' }}>
                            {eventDate ? formatTimeIST(eventDate) : 'Select Time'}
                          </Text>
                        </TouchableOpacity>
                      </View>

                      {showDatePicker && Platform.OS !== 'android' && (
                        <DateTimePicker
                          value={eventDate || new Date()}
                          mode="date"
                          display="default"
                          onChange={(event, selectedDate) => {
                            onShowDatePickerChange(false);
                            if (event.type === 'set' && selectedDate) {
                              const currentDate = eventDate || new Date();
                              selectedDate.setHours(currentDate.getHours(), currentDate.getMinutes());
                              onEventDateChange(selectedDate);
                            }
                          }}
                        />
                      )}

                      {showTimePicker && Platform.OS !== 'android' && (
                        <DateTimePicker
                          value={eventDate || new Date()}
                          mode="time"
                          display="default"
                          onChange={(event, selectedDate) => {
                            onShowTimePickerChange(false);
                            if (event.type === 'set' && selectedDate) {
                              const newDate = new Date(eventDate || new Date());
                              newDate.setHours(selectedDate.getHours(), selectedDate.getMinutes());
                              onEventDateChange(newDate);
                            }
                          }}
                        />
                      )}

                      <Text style={{ fontSize: 14, fontWeight: '700', color: '#0F1419', marginTop: 15, marginBottom: 10 }}>Event Location</Text>
                      <TextInput
                        placeholder="e.g. Temple Hall, Sector 4 or Online"
                        value={eventLocation}
                        onChangeText={onEventLocationChange}
                        placeholderTextColor="#999"
                        style={{
                          backgroundColor: '#FFF',
                          paddingHorizontal: 12,
                          paddingVertical: 10,
                          borderRadius: 10,
                          borderWidth: 1,
                          borderColor: '#EEE',
                          fontSize: 13,
                          color: '#000'
                        }}
                      />
                    </View>
                  )}

                  {/* Contact Number for Call & WhatsApp */}
                  {!!postCategory && (
                    <View style={{ marginTop: 14, backgroundColor: 'rgba(255,255,255,0.7)', padding: 12, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 6 }}>
                        <Ionicons name="call-outline" size={16} color="#16A34A" />
                        <FontAwesome5 name="whatsapp" size={15} color="#059669" />
                        <Text style={{ fontSize: 13, fontWeight: '700', color: '#0F1419', fontFamily: FONTS.bold }}>
                          {t('language') === 'hi' ? 'संपर्क / व्हाट्सएप नंबर (वैकल्पिक)' : 'Contact Number (Call & WhatsApp)'}
                        </Text>
                      </View>
                      <TextInput
                        style={{
                          backgroundColor: '#FFF',
                          borderRadius: 10,
                          paddingHorizontal: 12,
                          paddingVertical: 10,
                          fontSize: 14,
                          color: '#0F1419',
                          borderWidth: 1,
                          borderColor: '#E2E8F0',
                          fontFamily: FONTS.regular,
                        }}
                        placeholder={t('language') === 'hi' ? 'फ़ोन नंबर दर्ज करें (उदा. +91 9876543210)' : 'Enter phone number (e.g. +91 9876543210)'}
                        placeholderTextColor="#94A3B8"
                        value={contactNumber}
                        onChangeText={onContactNumberChange}
                        keyboardType="phone-pad"
                        disableFullscreenUI={true}
                      />
                      <Text style={{ fontSize: 11, color: '#64748B', marginTop: 4, fontFamily: FONTS.regular }}>
                        {t('language') === 'hi'
                          ? 'यह नंबर आपकी पोस्ट पर कॉल और व्हाट्सएप बटन दिखाएगा।'
                          : 'Adding this will display Call and WhatsApp buttons on your post.'}
                      </Text>
                    </View>
                  )}

                  {/* Seva Details Input */}
                  {postCategory === 'Seva' && (
                    <View style={{ marginTop: 12, backgroundColor: 'rgba(255,255,255,0.7)', padding: 12, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 6 }}>
                        <Ionicons name="heart-outline" size={16} color="#E91E63" />
                        <Text style={{ fontSize: 13, fontWeight: '700', color: '#0F1419', fontFamily: FONTS.bold }}>
                          {t('language') === 'hi' ? 'सेवा विवरण (वैकल्पिक)' : 'Seva Details (Optional)'}
                        </Text>
                      </View>
                      <TextInput
                        style={{
                          backgroundColor: '#FFF',
                          borderRadius: 10,
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          fontSize: 14,
                          color: '#0F1419',
                          borderWidth: 1,
                          borderColor: '#E2E8F0',
                          minHeight: 50,
                          textAlignVertical: 'top',
                          fontFamily: FONTS.regular,
                        }}
                        placeholder={t('language') === 'hi' ? 'आवश्यक सेवा या समय विवरण दर्ज करें...' : 'Enter details of volunteer work needed, timing, etc.'}
                        placeholderTextColor="#94A3B8"
                        value={sevaDetails}
                        onChangeText={onSevaDetailsChange}
                        multiline
                        disableFullscreenUI={true}
                      />
                    </View>
                  )}
                </View>
              </View>

            </KeyboardAwareScrollView>

            {/* Keyboard-docked toolbar with minimalist layout matching premium look */}
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingTop: 10,
              paddingBottom: Platform.OS === 'android' 
                ? (keyboardVisible ? 10 : Math.max(insets.bottom, 28)) 
                : (keyboardVisible ? 10 : Math.max(insets.bottom, 14)),
              borderTopWidth: 1,
              borderTopColor: 'rgba(244, 163, 34, 0.15)',
              backgroundColor: '#0C0A1A'
            }}>
              <View />

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <CosmicCharacterRing text={newMessage} />
              </View>
            </View>
            {Platform.OS === 'android' && keyboardVisible && keyboardHeight > 0 && (
              <View style={{ height: keyboardHeight }} />
            )}
          </KeyboardAvoidingView>
        </View>
      </LinearGradient>
    </Modal>
  );
};

const styles = StyleSheet.create({
  createModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 25,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0'
  },
  twitterPostBtn: {
    backgroundColor: '#1D9BF0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  twitterPostBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  selectedCategoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#FFEBE0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#FFC8B0',
    gap: 4,
  },
  selectedCategoryText: {
    fontSize: 13,
    color: '#FF6B00',
    fontWeight: '700',
  },
});

export default CreatePostModal;
