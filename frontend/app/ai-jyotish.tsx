import { formatDateIST, formatTimeIST, formatDateTimeIST } from '../src/utils/dateUtils';
import React, { useState, useRef, useEffect } from 'react';
import {StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Image,
  Modal,
  TouchableWithoutFeedback} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../src/store/authStore';
import { useJyotishStore } from '../src/store/jyotishStore';
import { KeyboardAwareScrollView } from '../src/components/KeyboardAwareScrollView';

type ChatMessage = {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  time: string;
  timestamp?: number;
};

const getDateLabel = (timestamp: number) => {
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  } else {
    return formatDateIST(date);
  }
};

const CITIES_DB = [
  "Mumbai, Maharashtra, India",
  "Delhi, NCR, India",
  "Bengaluru, Karnataka, India",
  "Kolkata, West Bengal, India",
  "Chennai, Tamil Nadu, India",
  "Hyderabad, Telangana, India",
  "Pune, Maharashtra, India",
  "Ahmedabad, Gujarat, India",
  "Surat, Gujarat, India",
  "Jaipur, Rajasthan, India",
  "Lucknow, Uttar Pradesh, India",
  "Kanpur, Uttar Pradesh, India",
  "Nagpur, Maharashtra, India",
  "Indore, Madhya Pradesh, India",
  "Thane, Maharashtra, India",
  "Bhopal, Madhya Pradesh, India",
  "Visakhapatnam, Andhra Pradesh, India",
  "Pimpri-Chinchwad, Maharashtra, India",
  "Patna, Bihar, India",
  "Vadodara, Gujarat, India",
  "Ghaziabad, Uttar Pradesh, India",
  "Ludhiana, Punjab, India",
  "Agra, Uttar Pradesh, India",
  "Nashik, Maharashtra, India",
  "Ranchi, Jharkhand, India",
  "Faridabad, Haryana, India",
  "Meerut, Uttar Pradesh, India",
  "Rajkot, Gujarat, India",
  "Kalyan-Dombivli, Maharashtra, India",
  "Vasai-Virar, Maharashtra, India",
  "Varanasi, Uttar Pradesh, India",
  "Srinagar, Jammu & Kashmir, India",
  "Aurangabad, Maharashtra, India",
  "Dhanbad, Jharkhand, India",
  "Amritsar, Punjab, India",
  "Navi Mumbai, Maharashtra, India",
  "Allahabad, Uttar Pradesh, India",
  "Howrah, West Bengal, India",
  "Gwalior, Madhya Pradesh, India",
  "Jabalpur, Madhya Pradesh, India",
  "Coimbatore, Tamil Nadu, India",
  "Vijayawada, Andhra Pradesh, India",
  "Jodhpur, Rajasthan, India",
  "Madurai, Tamil Nadu, India",
  "Raipur, Chhattisgarh, India",
  "Kota, Rajasthan, India",
  "Chandigarh, India",
  "Guwahati, Assam, India",
  "Solapur, Maharashtra, India",
  "Hubli-Dharwad, Karnataka, India",
  "Mysore, Karnataka, India",
  "Trivandrum, Kerala, India",
  "Kochi, Kerala, India",
  "Dehradun, Uttarakhand, India",
  "Rishikesh, Uttarakhand, India",
  "Haridwar, Uttarakhand, India",
  "Shimla, Himachal Pradesh, India",
  "Dharamshala, Himachal Pradesh, India",
  "Jammu, Jammu & Kashmir, India",
  "Udaipur, Rajasthan, India",
  "Ajmer, Rajasthan, India",
  "Pushkar, Rajasthan, India",
  "New York, USA",
  "London, UK",
  "Toronto, Canada",
  "Dubai, UAE",
  "Singapore",
  "Sydney, Australia",
  "Melbourne, Australia",
  "Paris, France",
  "Berlin, Germany",
  "Tokyo, Japan",
];

export default function AIJyotishScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const userName = user?.name ? user.name.split(' ')[0] : 'Seeker';
  
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      text: `Namaste, ${userName} . Based on the current planetary alignments, today is an auspicious day for inner reflection. How can I guide your spiritual journey today?`,
      sender: 'ai',
      time: formatTimeIST(new Date()),
      timestamp: Date.now(),
    }
  ]);
  const [askNowModalVisible, setAskNowModalVisible] = useState(true);
  const { dob: storedDob, tob: storedTob, pob: storedPob, setBirthDetails, loadBirthDetails } = useJyotishStore();
  const [date, setDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [timeOfBirth, setTimeOfBirth] = useState('');
  const [placeOfBirth, setPlaceOfBirth] = useState('');
  const [filteredCities, setFilteredCities] = useState<string[]>([]);
  const [validationError, setValidationError] = useState('');
  const scrollViewRef = useRef<KeyboardAwareScrollView>(null);

  useEffect(() => {
    loadBirthDetails();
  }, []);

  useEffect(() => {
    if (storedDob && storedTob && storedPob) {
      const parsedDate = new Date(storedDob);
      setDate(isNaN(parsedDate.getTime()) ? null : parsedDate);
      setTimeOfBirth(storedTob);
      setPlaceOfBirth(storedPob);
      setAskNowModalVisible(false);
    }
  }, [storedDob, storedTob, storedPob]);

  useEffect(() => {
    
    const loadMessages = async () => {
      try {
        const storedMessages = await AsyncStorage.getItem('jyotish:messages');
        if (storedMessages) {
          const parsed = JSON.parse(storedMessages);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMessages(parsed);
          }
        }
      } catch (err) {
        console.warn('Failed to load messages:', err);
      }
    };

    loadBirthDetails();
    loadMessages();
  }, []);

  const getTimeValue = () => {
    const d = new Date();
    if (timeOfBirth) {
      const match = timeOfBirth.match(/^(\d{1,2}):(\d{1,2})\s*(AM|PM)?$/i);
      if (match) {
        let hours = parseInt(match[1], 10);
        const minutes = parseInt(match[2], 10);
        const ampm = match[3]?.toUpperCase();
        if (ampm === 'PM' && hours < 12) hours += 12;
        if (ampm === 'AM' && hours === 12) hours = 0;
        if (!isNaN(hours) && !isNaN(minutes)) {
          d.setHours(hours);
          d.setMinutes(minutes);
        }
      }
    }
    return d;
  };

  const handleCalculateHoroscope = () => {
    if (!date || !timeOfBirth.trim() || !placeOfBirth.trim()) {
      setValidationError('All fields (Date, Time, and Place of Birth) are mandatory.');
      return;
    }
    setValidationError('');
    setAskNowModalVisible(false);
    
    // Format the date
    const dobStr = date.toISOString();
    const tobStr = timeOfBirth.trim();
    const pobStr = placeOfBirth.trim();
    
    // Save to global store
    setBirthDetails(dobStr, tobStr, pobStr);
    
    const displayDobStr = formatDateIST(date);
    
    // Add user message with birth details
    const userMsgText = `My Birth Details:\n• Date of Birth: ${displayDobStr}\n• Time of Birth: ${tobStr}\n• Place of Birth: ${pobStr}`;
    
    const newUserMsg: ChatMessage = {
      id: Date.now().toString(),
      text: userMsgText,
      sender: 'user',
      time: formatTimeIST(new Date()),
      timestamp: Date.now(),
    };
    
    setMessages((prev) => {
      const updated = [...prev, newUserMsg];
      AsyncStorage.setItem('jyotish:messages', JSON.stringify(updated)).catch(console.warn);
      return updated;
    });
    
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    // AI Response
    setTimeout(() => {
      const newAIMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: `Thank you for sharing your birth details. The cosmic alignments for ${displayDobStr} at ${tobStr} in ${pobStr} indicate a unique stellar signature.\n\nCalculating your planetary positions, lagna, and current dasha alignments now. how can I guide your spiritual/personal path today?`,
        sender: 'ai',
        time: formatTimeIST(new Date()),
        timestamp: Date.now(),
      };
      setMessages((prev) => {
        const updated = [...prev, newAIMsg];
        AsyncStorage.setItem('jyotish:messages', JSON.stringify(updated)).catch(console.warn);
        return updated;
      });
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }, 1500);
  };

  const handleSend = () => {
    if (!message.trim()) return;
    
    const newUserMsg: ChatMessage = {
      id: Date.now().toString(),
      text: message.trim(),
      sender: 'user',
      time: formatTimeIST(new Date()),
      timestamp: Date.now(),
    };
    
    setMessages((prev) => {
      const updated = [...prev, newUserMsg];
      AsyncStorage.setItem('jyotish:messages', JSON.stringify(updated)).catch(console.warn);
      return updated;
    });
    setMessage('');
    
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    setTimeout(() => {
      const newAIMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: 'The stars have received your query. Analyzing the cosmic alignment...',
        sender: 'ai',
        time: formatTimeIST(new Date()),
        timestamp: Date.now(),
      };
      setMessages((prev) => {
        const updated = [...prev, newAIMsg];
        AsyncStorage.setItem('jyotish:messages', JSON.stringify(updated)).catch(console.warn);
        return updated;
      });
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }, 1500);
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1, backgroundColor: '#FFEEE5' }} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 150, backgroundColor: '#FB905E' }} pointerEvents="none" />
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Top Navigation */}
        <View style={styles.topNav}>
          <View style={styles.topLeftGroup}>
            <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="chevron-back" size={24} color="#000" />
            </TouchableOpacity>

            <View style={styles.navTitleContainer}>
              <View style={[styles.avatarImage, { backgroundColor: '#FF8A00', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }]}>
                <Image source={require('../assets/images/jyotish/ai_avatar.png')} style={{ width: '100%', height: '100%' }} />
              </View>
              <Text style={styles.navTitle}>AI Jyotish</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.iconBtn} onPress={() => setAskNowModalVisible(true)}>
            <Ionicons name="pencil-sharp" size={22} color="#000" />
          </TouchableOpacity>
        </View>

        {/* Chat Area */}
        <KeyboardAwareScrollView 
          ref={scrollViewRef}
          style={styles.chatContainer} 
          contentContainerStyle={styles.chatContent}
          keyboardShouldPersistTaps="handled"
        >
          {(() => {
            let lastDateLabel = '';
            return messages.map((msg) => {
              const msgTimestamp = msg.timestamp || Date.now();
              const currentDateLabel = getDateLabel(msgTimestamp);
              const showDivider = currentDateLabel !== lastDateLabel;
              lastDateLabel = currentDateLabel;

              return (
                <React.Fragment key={msg.id}>
                  {showDivider && (
                    <View style={styles.dateDividerContainer}>
                      <Text style={styles.dateDividerText}>{currentDateLabel}</Text>
                    </View>
                  )}
                  {msg.sender === 'user' ? (
                    <View style={styles.userMessageContainer}>
                      <View style={styles.userBubble}>
                        <Text style={styles.userMessageText}>{msg.text}</Text>
                      </View>
                      <Text style={styles.statusText}>{msg.time} • Sent</Text>
                    </View>
                  ) : (
                    <View style={styles.aiMessageContainer}>
                      <View style={[styles.aiAvatar, { overflow: 'hidden' }]}>
                        <Image source={require('../assets/images/jyotish/ai_avatar.png')} style={{ width: '100%', height: '100%' }} />
                      </View>
                      <View style={styles.aiBubbleContainer}>
                        <View style={styles.aiBubble}>
                          <Text style={styles.aiMessageText}>{msg.text}</Text>
                        </View>
                        <Text style={styles.statusText}>{msg.time}</Text>
                      </View>
                    </View>
                  )}
                </React.Fragment>
              );
            });
          })()}
        </KeyboardAwareScrollView>

        {/* Bottom Input Area */}
        <View style={styles.inputContainer}>
          <View style={styles.textInputBox}>
            <TextInput
              style={styles.textInput}
              placeholder="Message..."
              placeholderTextColor="rgba(0,0,0,0.50)"
              value={message}
              onChangeText={setMessage}
            />
            <TouchableOpacity style={styles.micBtn}>
              <Ionicons name="mic-outline" size={24} color="rgba(0,0,0,0.50)" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
            <Ionicons name="paper-plane" size={18} color="#FFF" style={{ marginLeft: -2 }} />
          </TouchableOpacity>
        </View>

        {/* Ask Now / Birth Details Modal */}
        <Modal visible={askNowModalVisible} transparent={true} animationType="fade">
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ flex: 1 }}
          >
            <View style={styles.askNowOverlay}>
              <TouchableWithoutFeedback onPress={() => setAskNowModalVisible(false)}>
                <View style={StyleSheet.absoluteFill} />
              </TouchableWithoutFeedback>
              
              <View style={[styles.askNowModal, { maxHeight: '80%' }]}>
                <Text style={styles.askNowTitle}>Enter Birth Details</Text>
                
                <KeyboardAwareScrollView 
                  style={{ width: '100%', flexGrow: 0 }}
                  contentContainerStyle={{ gap: 16 }}
                  showsVerticalScrollIndicator={false}
                >
                  <View style={styles.askNowInputGroup}>
                    <View style={styles.askNowLabelRow}>
                      <Ionicons name="calendar-outline" size={14} color="#5A4136" />
                      <Text style={styles.askNowLabel}>Date of Birth</Text>
                    </View>
                    <TouchableOpacity 
                      activeOpacity={0.8} 
                      onPress={() => setShowDatePicker(!showDatePicker)} 
                      style={[styles.askNowInput, { justifyContent: 'center' }]}
                    >
                      <Text style={{ fontSize: 16, color: date ? '#1B1C1C' : '#A9968F' }}>
                        {date ? formatDateIST(date) : 'dd/mm/yyyy'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {showDatePicker && (
                    <DateTimePicker
                      value={date || new Date()}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'inline' : 'default'}
                      onChange={(event, selectedDate) => {
                        if (Platform.OS === 'android') {
                          setShowDatePicker(false);
                        }
                        if (selectedDate) {
                          setDate(selectedDate);
                        }
                      }}
                      style={{ alignSelf: 'center', width: '100%', backgroundColor: '#FFF', borderRadius: 12 }}
                    />
                  )}

                  <View style={styles.askNowInputGroup}>
                    <View style={styles.askNowLabelRow}>
                      <Ionicons name="time-outline" size={14} color="#5A4136" />
                      <Text style={styles.askNowLabel}>Time of Birth</Text>
                    </View>
                    <TouchableOpacity 
                      activeOpacity={0.8} 
                      onPress={() => setShowTimePicker(!showTimePicker)} 
                      style={[styles.askNowInput, { justifyContent: 'center' }]}
                    >
                      <Text style={{ fontSize: 16, color: timeOfBirth ? '#1B1C1C' : '#A9968F' }}>
                        {timeOfBirth ? timeOfBirth : '--:-- --'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {showTimePicker && (
                    <DateTimePicker
                      value={getTimeValue()}
                      mode="time"
                      is24Hour={false}
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onChange={(event, selectedTime) => {
                        if (Platform.OS === 'android') {
                          setShowTimePicker(false);
                        }
                        if (selectedTime) {
                          const hours = selectedTime.getHours();
                          const minutes = selectedTime.getMinutes();
                          const ampm = hours >= 12 ? 'PM' : 'AM';
                          const displayHours = hours % 12 || 12;
                          const displayMinutes = minutes < 10 ? `0${minutes}` : minutes;
                          setTimeOfBirth(`${displayHours}:${displayMinutes} ${ampm}`);
                        }
                      }}
                      style={{ alignSelf: 'center', width: '100%', backgroundColor: '#FFF', borderRadius: 12 }}
                    />
                  )}

                  <View style={styles.askNowInputGroup}>
                    <View style={styles.askNowLabelRow}>
                      <Ionicons name="location-outline" size={14} color="#5A4136" />
                      <Text style={styles.askNowLabel}>Place of Birth</Text>
                    </View>
                    <TextInput
                      style={styles.askNowInput}
                      placeholder="City, State or Country"
                      placeholderTextColor="#A9968F"
                      value={placeOfBirth}
                      onChangeText={(val) => {
                        setPlaceOfBirth(val);
                        if (val.trim().length >= 2) {
                          const filtered = CITIES_DB.filter(city => 
                            city.toLowerCase().includes(val.toLowerCase())
                          );
                          setFilteredCities(filtered.slice(0, 5));
                        } else {
                          setFilteredCities([]);
                        }
                      }}
                    />
                    {filteredCities.length > 0 && (
                      <View style={styles.suggestionsContainer}>
                        {filteredCities.map((city, idx) => (
                          <TouchableOpacity
                            key={idx}
                            style={styles.suggestionItem}
                            onPress={() => {
                              setPlaceOfBirth(city);
                              setFilteredCities([]);
                            }}
                          >
                            <Ionicons name="location-outline" size={14} color="#8E7164" style={{ marginRight: 8 }} />
                            <Text style={styles.suggestionText}>{city}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>

                  <View style={styles.askNowNotice}>
                    <Ionicons name="information-circle-outline" size={20} color="#FF7B00" />
                    <Text style={styles.askNowNoticeText}>
                      Precise birth details ensure high-accuracy planetary alignments for your Dashas and Yogis.
                    </Text>
                  </View>

                  {!!validationError && (
                    <Text style={styles.errorText}>{validationError}</Text>
                  )}

                  <TouchableOpacity style={styles.askNowCalcBtn} onPress={handleCalculateHoroscope}>
                    <Text style={styles.askNowCalcBtnText}>Calculate Horoscope</Text>
                    <Ionicons name="chevron-forward" size={18} color="#FFF" />
                  </TouchableOpacity>
                </KeyboardAwareScrollView>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topNav: {
    width: '100%',
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    zIndex: 10,
    elevation: 10,
  },
  iconBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  navTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
  },
  navTitle: {
    color: '#000',
    fontFamily: 'System',
    fontSize: 16,
    fontStyle: 'normal',
    fontWeight: '700',
  },
  chatContainer: {
    flex: 1,
    backgroundColor: '#FFEEE5',
  },
  chatContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  dateDividerContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  dateDividerText: {
    color: '#A9968F',
    fontSize: 12,
    fontFamily: 'System',
    fontWeight: '500',
  },
  // User Bubble
  userMessageContainer: {
    alignItems: 'flex-end',
    marginBottom: 24,
  },
  userBubble: {
    backgroundColor: '#FFF',
    maxWidth: 290,
    paddingVertical: 16,
    paddingLeft: 25,
    paddingRight: 25,
    borderTopLeftRadius: 34,
    borderTopRightRadius: 3,
    borderBottomLeftRadius: 34,
    borderBottomRightRadius: 34,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  userMessageText: {
    fontSize: 14,
    lineHeight: 24,
    color: '#000',
    fontFamily: 'System',
  },
  statusText: {
    fontSize: 12,
    color: 'rgba(0,0,0,0.50)',
    marginTop: 6,
    fontFamily: 'System',
  },
  // AI Bubble
  aiMessageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  aiAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FF8A00',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginTop: 4,
  },
  aiBubbleContainer: {
    flex: 1,
  },
  aiBubble: {
    backgroundColor: '#FFF',
    maxWidth: 290,
    padding: 16,
    borderTopLeftRadius: 19.5,
    borderTopRightRadius: 19.5,
    borderBottomRightRadius: 19.5,
    borderBottomLeftRadius: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  aiMessageText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#1B1C1C',
    fontFamily: 'System',
    marginBottom: 12,
  },
  // Scripture Card
  scriptureCard: {
    width: 258,
    borderRadius: 9.6,
    borderWidth: 0.8,
    borderColor: 'rgba(226,191,176,0.50)',
    backgroundColor: '#FFF',
    overflow: 'hidden',
  },
  scriptureImagePlaceholder: {
    width: '100%',
    height: 76.8,
    backgroundColor: '#FBE9E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scriptureInfo: {
    padding: 12.8,
  },
  scriptureTitle: {
    fontSize: 11.2,
    fontWeight: '600',
    color: '#A04100',
    marginBottom: 4,
    fontFamily: 'System',
    letterSpacing: 0.56,
  },
  scriptureSubtitle: {
    fontSize: 11.2,
    color: '#5A4136',
    marginBottom: 8,
    fontFamily: 'System',
  },
  scriptureLink: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scriptureLinkText: {
    fontSize: 9.6,
    fontWeight: '500',
    color: '#A04100',
    marginRight: 4,
    fontFamily: 'System',
  },
  // Input Area
  inputContainer: {
    width: '100%',
    height: 96,
    backgroundColor: '#EAE7E7',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    zIndex: 10,
    elevation: 10,
  },
  textInputBox: {
    flex: 1,
    height: 44,
    paddingTop: 10,
    paddingRight: 17,
    paddingBottom: 10,
    paddingLeft: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.50)',
    backgroundColor: '#FFF',
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    fontFamily: 'System',
    height: '100%',
  },
  micBtn: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtn: {
    width: 44,
    height: 44,
    backgroundColor: '#FF8A00',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  
  // Ask Now Modal Styles
  askNowOverlay: {
    flex: 1,
    backgroundColor: 'rgba(49, 19, 3, 0.20)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  askNowModal: {
    display: 'flex',
    width: '100%',
    paddingVertical: 24,
    paddingHorizontal: 24,
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(226, 191, 176, 0.30)',
    backgroundColor: '#FFF',
    shadowColor: 'rgba(160, 65, 0, 0.08)',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 1,
    shadowRadius: 60,
    elevation: 10,
  },
  askNowTitle: {
    alignSelf: 'stretch',
    color: '#1B1C1C',
    textAlign: 'center',
    fontFamily: 'Inter',
    fontSize: 24,
    fontStyle: 'normal',
    fontWeight: '600',
    lineHeight: 40,
  },
  askNowInputGroup: {
    alignSelf: 'stretch',
  },
  askNowLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  askNowLabel: {
    color: '#5A4136',
    fontFamily: 'Inter',
    fontSize: 16,
    fontStyle: 'normal',
    fontWeight: '400',
    lineHeight: 24,
    marginLeft: 8,
  },
  askNowInput: {
    height: 50,
    backgroundColor: '#FBE9E0',
    borderWidth: 1,
    borderColor: '#E2BFB0',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#1B1C1C',
  },
  askNowNotice: {
    alignSelf: 'stretch',
    backgroundColor: 'rgba(160, 65, 0, 0.05)',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  askNowNoticeText: {
    color: '#5A4136',
    fontFamily: 'Inter',
    fontSize: 12,
    fontStyle: 'italic',
    fontWeight: '500',
    lineHeight: 16,
    marginLeft: 16,
    flex: 1,
  },
  askNowCalcBtn: {
    alignSelf: 'center',
    width: 300,
    height: 56,
    backgroundColor: '#FF7B00',
    borderRadius: 50,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: 'rgba(255, 123, 0, 0.30)',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 15,
    elevation: 8,
  },
  askNowCalcBtnText: {
    color: '#FFF',
    textAlign: 'center',
    fontFamily: 'Inter',
    fontSize: 16,
    fontStyle: 'normal',
    fontWeight: '400',
    lineHeight: 24,
    textTransform: 'capitalize',
    marginRight: 8,
  },
  suggestionsContainer: {
    backgroundColor: '#FFF',
    borderColor: '#E2BFB0',
    borderWidth: 1,
    borderTopWidth: 0,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    marginTop: -4,
    paddingTop: 4,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2ECE9',
  },
  suggestionText: {
    fontSize: 14,
    color: '#1B1C1C',
  },
  errorText: {
    color: '#D93838',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    alignSelf: 'stretch',
    marginBottom: 8,
    fontFamily: 'Inter',
  },
});
