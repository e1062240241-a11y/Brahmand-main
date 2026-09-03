import { formatDateIST, formatTimeIST, formatDateTimeIST } from '../src/utils/dateUtils';
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Image,
  Animated,
  Alert,
  Pressable,
  ActivityIndicator,
  Keyboard,
  Dimensions,
  ScrollView} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Image as ExpoImage } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { aiChat, getChatHistory, clearChatHistory } from '../src/services/api';
import { FONTS } from '../src/constants/theme';
import { BrandedLoading } from '../src/components/BrandedLoading';
import { useAuthStore } from '../src/store/authStore';
import { useTranslation } from '../src/utils/i18n';
import Svg, { Path } from 'react-native-svg';

// ─── Types ──────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// ─── Shubh Vichar (Daily Spiritual Thoughts) ───────────────────────────────

const SHUBH_VICHAR_LIST = [
  'कर्मण्येवाधिकारस्ते मा फलेषु कदाचन।',
  'शांति भीतर से आती है, बाहर न खोजें।',
  'जो हुआ अच्छा हुआ, जो हो रहा है अच्छा हो रहा है।',
  'मन ही मनुष्य का मित्र है और मन ही शत्रु।',
  'विश्वास में ही ईश्वर का निवास है।',
  'समत्वं योग उच्यते — समता ही योग है।',
  'सत्य, अहिंसा और प्रेम ही धर्म का सार है।',
  'परिवर्तन ही संसार का नियम है।',
  'योगः कर्मसु कौशलम् — कर्म में कुशलता ही योग है।',
  'चित्त शांत रखो, सब मार्ग स्वतः स्पष्ट होंगे।',
  'क्रोध से भ्रम पैदा होता है, भ्रम से बुद्धि नष्ट होती है।',
  'सदा प्रसन्न रहें, यही सबसे बड़ी भक्ति है।',
  'अहिंसा परमो धर्मः — धर्म का मूल दया है।',
  'ईश्वर हर हृदय में वास करते हैं।',
  'धीरता और संयम ही मनुष्य के सच्चे आभूषण हैं।',
  'भक्ति से ही मुक्ति का मार्ग प्रशस्त होता है।',
];

const getISTDateDetails = () => {
  const now = new Date();
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  const istDate = new Date(utcMs + 5.5 * 3600000);
  const year = istDate.getFullYear();
  const hours = istDate.getHours();
  
  const startOfYear = new Date(year, 0, 0);
  const diff = istDate.getTime() - startOfYear.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);
  
  return { istDate, hours, dayOfYear };
};

// ─── Suggested prompts ───────────────────────────────────────────────────────

// 🧡 Engagement: Reframed suggestion prompts from Romanized Hinglish to Devotional/Pure Hindi primary with English fallback.
// Lever: Reframing (Emotional Copy) + First-Person Guidance
// Why: Devotional Hindi phrases evoke deep emotional resonance and connection with Shri Krishna.
// UI: Text-only change, no new visual elements.
const SUGGESTIONS_HI = [
  'मेरा मन बहुत व्याकुल है 😔',
  'जीवन का क्या उद्देश्य है?',
  'संबंधों में पीड़ा हो रही है',
  'कर्म और परिणाम का संबंध क्या है?',
  'स्वयं पर विश्वास कैसे लौटाऊँ?',
  'एक बड़ा निर्णय लेना है',
];

const SUGGESTIONS_EN = [
  'My mind feels anxious 😔',
  'What is the purpose of life?',
  'I am experiencing pain in relationships',
  'What is the connection between karma and results?',
  'How do I restore faith in myself?',
  'I need to make a big decision',
];

const getMessageDateLabel = (timestampInput: any) => {
  if (!timestampInput) return '';
  const date = new Date(timestampInput);
  if (isNaN(date.getTime())) return '';
  
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  
  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  } else {
    return formatDateIST(timestampInput);
  }
};

// ─── Typing Dots ─────────────────────────────────────────────────────────────

function TypingDots() {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;
  const animsRef = useRef<Animated.CompositeAnimation[]>([]);

  useEffect(() => {
    const anim1 = Animated.loop(
      Animated.sequence([
        Animated.delay(0),
        Animated.timing(dot1, { toValue: -6, duration: 300, useNativeDriver: true }),
        Animated.timing(dot1, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.delay(600),
      ])
    );
    const anim2 = Animated.loop(
      Animated.sequence([
        Animated.delay(150),
        Animated.timing(dot2, { toValue: -6, duration: 300, useNativeDriver: true }),
        Animated.timing(dot2, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.delay(600),
      ])
    );
    const anim3 = Animated.loop(
      Animated.sequence([
        Animated.delay(300),
        Animated.timing(dot3, { toValue: -6, duration: 300, useNativeDriver: true }),
        Animated.timing(dot3, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.delay(600),
      ])
    );

    animsRef.current = [anim1, anim2, anim3];
    anim1.start();
    anim2.start();
    anim3.start();

    return () => {
      animsRef.current.forEach((anim) => anim.stop());
    };
  }, []);

  return (
    <View style={styles.typingRow}>
      <Image
        source={{ uri: 'https://brahmandfeed23.b-cdn.net/assets/my_krishna_avatar.webp' }}
        style={styles.assistantAvatarImage}
      />
      <View style={styles.typingBubble}>
        {[dot1, dot2, dot3].map((dot, i) => (
          <Animated.View
            key={i}
            style={[styles.dot, { transform: [{ translateY: dot }] }]}
          />
        ))}
      </View>
    </View>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MyKrishnaChat() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { t } = useTranslation();
  const displayName = user?.name?.trim() ? user.name.trim() : 'Partha';
  const suggestions = t('language') === 'hi' ? SUGGESTIONS_HI : SUGGESTIONS_EN;

  // ─── IST Deterministic Shubh Vichar & Time-of-Day Greeting ─────────────────

  const { shubhVichar, timeOfDayGreeting, gradientColors } = useMemo(() => {
    const { hours, dayOfYear } = getISTDateDetails();
    
    // 1. Shubh Vichar index changes deterministically at midnight IST
    const index = Math.abs(dayOfYear) % SHUBH_VICHAR_LIST.length;
    const thought = SHUBH_VICHAR_LIST[index];

    // 2. Time-of-day buckets in IST
    let greeting = '';
    let subtitle = '';
    let colors: [string, string, string] = ['#FF8D57', '#EA9B76', '#FFEEE5'];

    if (hours >= 5 && hours < 12) {
      // Prabhat (Morning): 05:00 - 11:59
      greeting = `Shubh Prabhat, ${displayName}! ☀️`;
      subtitle = 'Mann ko shaant aur nikharne wala vichar share karein.';
      colors = ['#FF9E6C', '#FFC3A0', '#FFF5EE'];
    } else if (hours >= 12 && hours < 17) {
      // Dopahar (Afternoon): 12:00 - 16:59
      greeting = `Shubh Dopahar, ${displayName}! ☀️`;
      subtitle = 'Karm hi sachhi bhakti hai.';
      colors = ['#FF8D57', '#EA9B76', '#FFEEE5'];
    } else if (hours >= 17 && hours < 22) {
      // Sandhya (Evening): 17:00 - 21:59
      greeting = `Shubh Sandhya, ${displayName}! 🪔`;
      subtitle = 'Mann ko shaant karein.';
      colors = ['#F07B42', '#D88A6E', '#FDEEE6'];
    } else {
      // Ratri (Night): 22:00 - 04:59
      greeting = `Shubh Ratri, ${displayName}! 🌙`;
      subtitle = 'Din bhar ke vicharo ko Krishna ko samarpit karein.';
      colors = ['#D96B36', '#B2765E', '#F7E8E0'];
    }

    return {
      shubhVichar: thought,
      timeOfDayGreeting: { greeting, subtitle },
      gradientColors: colors,
    };
  }, [displayName]);

  const defaultWelcomeMessage = useCallback((): Message => ({
    id: 'welcome',
    role: 'assistant',
    content: `${timeOfDayGreeting.greeting}\n\nMain yahan hoon — tumhare dil ki baat sunne ke liye, Gita ki seekh share karne ke liye.\n\n${timeOfDayGreeting.subtitle} Aaj mann mein kya chal raha hai?`,
    timestamp: new Date(),
  }), [timeOfDayGreeting]);

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  // Mirror messages in a ref so sendMessage always reads the latest state
  // without needing messages as a useCallback dependency (avoids stale closure).
  const messagesRef = useRef<Message[]>([]);
  useEffect(() => { messagesRef.current = messages; }, [messages]);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 150);
  }, []);

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', (e) => {
      const height = e.endCoordinates.height;
      setKeyboardHeight(height);
      setKeyboardVisible(true);
      scrollToBottom();
    });
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
      setKeyboardVisible(false);
    });
    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [scrollToBottom, insets.bottom]);

  // Load chat history from Firestore on mount
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    const fetchHistory = async () => {
      try {
        const response = await getChatHistory();
        if (response.data?.messages && response.data.messages.length > 0) {
          const formatted: Message[] = response.data.messages.map((m: any, idx: number) => ({
            id: `msg_${idx}`,
            role: m.role,
            content: m.content,
            timestamp: m.timestamp ? new Date(m.timestamp) : new Date(),
          }));
          setMessages(formatted);
          setShowSuggestions(false);
        } else {
          setMessages([defaultWelcomeMessage()]);
        }
      } catch (error) {
        console.error('Failed to load chat history:', error);
        setMessages([defaultWelcomeMessage()]);
      } finally {
        setHistoryLoading(false);
        scrollToBottom();
      }
    };

    fetchHistory();
  }, [defaultWelcomeMessage]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;

      setShowSuggestions(false);

      const userMsg: Message = {
        id: `user_${Date.now()}`,
        role: 'user',
        content: text.trim(),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setInputText('');
      setIsLoading(true);
      scrollToBottom();

      try {
        // Read the latest messages from the ref (not the stale closure) so the
        // LLM always receives the complete conversation context.
        const apiMessages = messagesRef.current
          .filter(m => m.id !== 'welcome')
          .map((m) => ({ role: m.role, content: m.content }));

        // Append the new user turn that was just queued into state.
        apiMessages.push({ role: userMsg.role, content: userMsg.content });

        const response = await aiChat(apiMessages);

        if (response.data?.choices?.[0]?.message) {
          const assistantMsg: Message = {
            id: `assistant_${Date.now()}`,
            role: 'assistant',
            content: response.data.choices[0].message.content || '',
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, assistantMsg]);
        } else {
          // Fallback if API response structure is different
          throw new Error('Invalid API response');
        }
      } catch (error) {
        console.error('Chat error:', error);
        setMessages((prev) => [
          ...prev,
          {
            id: `err_${Date.now()}`,
            role: 'assistant',
            content: 'Koi connection issue hai abhi. Thodi der mein dobara try karo. 🙏',
            timestamp: new Date(),
          },
        ]);
      } finally {
        setIsLoading(false);
        scrollToBottom();
      }
    },
    [isLoading, scrollToBottom]  // messages removed — read via messagesRef instead
  );

  const handleSend = () => sendMessage(inputText);
  const handleSuggestion = (text: string) => sendMessage(text);

  const handleClearChat = () => {
    Alert.alert(
      'Clear Chat',
      'Kya aap Krishna ke sath apni chat history clear karna chahte hain?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              await clearChatHistory();
              setMessages([defaultWelcomeMessage()]);
              setShowSuggestions(true);
            } catch (err) {
              console.error('Failed to clear chat:', err);
              Alert.alert('Error', 'Chat history clear nahi ho payi. Dobara try karein.');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isUser = item.role === 'user';

    let showDateDivider = false;
    let dateLabel = '';

    if (index === 0) {
      showDateDivider = true;
      dateLabel = getMessageDateLabel(item.timestamp);
    } else {
      const prevMessage = messages[index - 1];
      if (prevMessage) {
        const currentDateStr = new Date(item.timestamp).toDateString();
        const prevDateStr = new Date(prevMessage.timestamp).toDateString();
        if (currentDateStr !== prevDateStr) {
          showDateDivider = true;
          dateLabel = getMessageDateLabel(item.timestamp);
        }
      }
    }

    const isWelcome = item.id === 'welcome';

    return (
      <View style={{ width: '100%' }}>
        {showDateDivider && !isWelcome && (
          <View style={styles.dateDivider}>
            <Text style={styles.dateDividerText}>{dateLabel}</Text>
          </View>
        )}
        <Animated.View
          style={[
            styles.messageRow,
            isUser ? styles.userRow : styles.assistantRow,
            { opacity: fadeAnim },
          ]}
        >
          {!isUser && (
            <Image
              source={{ uri: 'https://brahmandfeed23.b-cdn.net/assets/my_krishna_avatar.webp' }}
              style={styles.assistantAvatarImage}
            />
          )}
          <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.assistantBubble]}>
            {!isUser && (
              <View style={styles.aiSenderBadge}>
                <Text style={styles.aiSenderText}>Shri Krishna</Text>
                <Ionicons name="sparkles" size={11} color="#F97316" />
              </View>
            )}
            <Text style={[styles.messageText, isUser ? styles.userText : styles.assistantText]}>
              {item.content}
            </Text>
            <Text style={[styles.timestamp, isUser ? styles.userTimestamp : styles.assistantTimestamp]}>
              {formatTimeIST(item.timestamp)}
            </Text>
          </View>
        </Animated.View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={gradientColors}
        locations={[0, 0.12, 0.28]}
        style={styles.container}
      >
        <Stack.Screen options={{ headerShown: false }} />
        <StatusBar style="dark" />

        {/* ── Gemini Minimal Glass Header ── */}
        <View style={[styles.header, { height: insets.top + 60, paddingTop: insets.top }]}>
          <View style={styles.headerLeft}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/home' as any)}
              style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
              android_ripple={{ color: 'rgba(0, 0, 0, 0.1)', borderless: true, radius: 20 }}
            >
              <Ionicons name="chevron-back" size={24} color="#1E1B18" />
            </Pressable>

            <View style={styles.headerCenter}>
              <Image
                source={{ uri: 'https://brahmandfeed23.b-cdn.net/assets/my_krishna_avatar.webp' }}
                style={styles.headerAvatarImage}
              />
              <View style={styles.headerTitleColumn}>
                <View style={styles.headerTitleRow}>
                  <Text style={styles.headerTitle}>My Krishn</Text>
                  <View style={styles.geminiBadge}>
                    <Text style={styles.geminiBadgeText}>Divine AI</Text>
                  </View>
                </View>
                <Animated.Text style={[styles.shubhVicharText, { opacity: fadeAnim }]} numberOfLines={1}>
                  ✨ {shubhVichar}
                </Animated.Text>
              </View>
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Clear chat"
            onPress={handleClearChat}
            style={({ pressed }) => [styles.clearBtn, pressed && { opacity: 0.7 }]}
            disabled={isLoading || historyLoading}
            android_ripple={{ color: 'rgba(0, 0, 0, 0.1)', borderless: true, radius: 20 }}
          >
            <Ionicons name="trash-outline" size={20} color="rgba(30, 27, 24, 0.75)" />
          </Pressable>
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          {/* ── Loading indicator while history loads ── */}
          {historyLoading ? (
            <BrandedLoading message="Krishna ke vichar sun rahe hain..." />
          ) : (
            <FlatList
              ref={flatListRef}
              style={{ flex: 1 }}
              data={messages}
              renderItem={renderMessage}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              onContentSizeChange={scrollToBottom}
              showsVerticalScrollIndicator={false}
              ListHeaderComponent={
                messages.length <= 1 ? (
                  <View style={styles.geminiHeroSection}>
                    <Image
                      source={{ uri: 'https://brahmandfeed23.b-cdn.net/assets/my_krishna_avatar.webp' }}
                      style={styles.heroAvatarImg}
                    />
                    <Text style={styles.heroGreetingText}>{timeOfDayGreeting.greeting}</Text>
                    <Text style={styles.heroSubtitleText}>{timeOfDayGreeting.subtitle}</Text>
                  </View>
                ) : null
              }
              ListFooterComponent={isLoading ? <TypingDots /> : null}
            />
          )}

          {/* ── Gemini Suggested Prompts Grid ── */}
          {showSuggestions && !historyLoading && (
            <View style={styles.suggestionsWrapper}>
              <Text style={styles.suggestionsHeaderTitle}>
                {t('language') === 'hi' ? 'सुझावित प्रश्न' : 'Suggested Questions'}
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                style={styles.suggestionsScroll}
                contentContainerStyle={styles.suggestionsContent}
              >
                {suggestions.map((s, i) => (
                  <Pressable
                    key={i}
                    accessibilityRole="button"
                    accessibilityLabel={s}
                    style={({ pressed }) => [
                      styles.chip,
                      pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] }
                    ]}
                    onPress={() => handleSuggestion(s)}
                    android_ripple={{ color: 'rgba(249, 115, 22, 0.1)', borderless: false }}
                  >
                    <View style={styles.chipSparkle}>
                      <Ionicons name="sparkles-outline" size={13} color="#EA580C" />
                    </View>
                    <Text style={styles.chipText}>{s}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}

          {/* ── Info Banner ── */}
          {!historyLoading && messages.length < 3 && (
            <View style={styles.infoBanner}>
              <Ionicons name="bulb-outline" size={18} color="#D97706" style={{ marginRight: 6 }} />
              <Text style={styles.infoText}>
                {t('language') === 'hi'
                  ? 'अपना प्रश्न एक ही संदेश में पूरा लिखें। Shri Krishna मार्गदर्शन करेंगे।'
                  : 'Ask your complete question in one message. Shri Krishna will guide you.'}
              </Text>
            </View>
          )}

          {/* ── Gemini-Style Frosted Glassmorphic Input Bar ── */}
          <View 
            style={[
              styles.inputWrapper,
              {
                paddingBottom: Platform.OS === 'android'
                  ? (keyboardVisible ? 8 : Math.max(insets.bottom, 12))
                  : Platform.OS === 'ios'
                    ? Math.max(insets.bottom, 12)
                    : 24
              }
            ]}
          >
            <View style={styles.glassInputCard}>
              {Platform.OS === 'web' ? (
                <View style={[StyleSheet.absoluteFill, styles.webGlassFill]} />
              ) : (
                <BlurView intensity={Platform.OS === 'ios' ? 70 : 40} tint="light" style={StyleSheet.absoluteFill} />
              )}
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.85)', 'rgba(255, 248, 242, 0.65)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.inputInnerRow}>
                <Image
                  source={{ uri: 'https://brahmandfeed23.b-cdn.net/assets/my_krishna_avatar.webp' }}
                  style={styles.krishnaLogoImage}
                />
                <TextInput
                  ref={inputRef}
                  style={styles.input}
                  placeholder={t('language') === 'hi' ? 'कृष्ण से कुछ भी पूछें...' : 'Ask Shri Krishna anything...'}
                  placeholderTextColor="rgba(112, 66, 20, 0.45)"
                  value={inputText}
                  onChangeText={setInputText}
                  multiline
                  maxLength={500}
                  returnKeyType="send"
                  onSubmitEditing={handleSend}
                  editable={!historyLoading}
                  disableFullscreenUI={true}
                  textAlignVertical="center"
                  accessibilityRole="none"
                  accessibilityLabel="Message input"
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Send message"
                  style={({ pressed }) => [
                    styles.sendBtn,
                    inputText.trim() ? styles.sendBtnActive : styles.sendBtnDisabled,
                    pressed && { opacity: 0.8, transform: [{ scale: 0.94 }] }
                  ]}
                  onPress={handleSend}
                  disabled={!inputText.trim() || isLoading || historyLoading}
                >
                  {inputText.trim() ? (
                    <LinearGradient
                      colors={['#F97316', '#EA580C']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.sendBtnGradient}
                    >
                      <Ionicons
                        name="arrow-up"
                        size={18}
                        color="#FFF"
                      />
                    </LinearGradient>
                  ) : (
                    <View style={styles.sendBtnInactiveCircle}>
                      <Ionicons
                        name="arrow-up"
                        size={17}
                        color="rgba(120, 80, 50, 0.35)"
                      />
                    </View>
                  )}
                </Pressable>
              </View>
            </View>
          </View>
          {Platform.OS === 'android' && <View style={{ height: keyboardVisible ? keyboardHeight + insets.bottom + 8 : 0 }} />}
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    zIndex: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(249, 115, 22, 0.10)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  backBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 19 },
  clearBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 19 },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerAvatarImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  headerTitleColumn: {
    justifyContent: 'center',
    maxWidth: Dimensions.get('window').width - 160,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    color: '#1E1B18',
    fontSize: 16,
    fontFamily: FONTS.bold,
    fontWeight: '700',
  },
  geminiBadge: {
    backgroundColor: 'rgba(249, 115, 22, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 8,
  },
  geminiBadgeText: {
    fontSize: 10,
    color: '#EA580C',
    fontWeight: '700',
  },
  shubhVicharText: {
    color: 'rgba(100, 70, 50, 0.75)',
    fontSize: 11,
    fontFamily: FONTS.medium,
    marginTop: 1,
  },

  // Gemini Hero Section (when chat starts)
  geminiHeroSection: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  heroAvatarImg: {
    width: 68,
    height: 68,
    borderRadius: 34,
    marginBottom: 14,
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  heroGreetingText: {
    fontSize: 22,
    fontFamily: FONTS.bold,
    fontWeight: '700',
    color: '#1E1B18',
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  heroSubtitleText: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: 'rgba(80, 55, 35, 0.75)',
    textAlign: 'center',
    lineHeight: 20,
  },

  // Loader
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loaderText: { color: '#FFD700', fontFamily: FONTS.medium, marginTop: 12, fontSize: 14 },

  // Messages
  listContent: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16 },
  dateDivider: {
    alignSelf: 'center',
    marginVertical: 14,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.12)',
  },
  dateDividerText: {
    color: 'rgba(120, 80, 50, 0.7)',
    fontSize: 11,
    fontFamily: FONTS.medium,
  },
  messageRow: { flexDirection: 'row', marginBottom: 16, maxWidth: '88%' },
  userRow: { alignSelf: 'flex-end', flexDirection: 'row-reverse' },
  assistantRow: { alignSelf: 'flex-start', alignItems: 'flex-start' },

  assistantAvatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
    marginTop: 2,
  },

  messageBubble: { 
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  userBubble: {
    backgroundColor: '#F97316',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderBottomRightRadius: 4,
    borderBottomLeftRadius: 22,
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  assistantBubble: {
    backgroundColor: '#FFFDF9',
    borderWidth: 1.5,
    borderColor: 'rgba(249, 115, 22, 0.18)',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 22,
    borderBottomRightRadius: 22,
    borderBottomLeftRadius: 22,
  },
  aiSenderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  aiSenderText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D97706',
    fontFamily: FONTS.bold,
  },
  messageText: { fontSize: 15, fontFamily: FONTS.medium, lineHeight: 22 },
  userText: { color: '#FFFFFF', fontWeight: '500' },
  assistantText: { color: '#271D18', fontWeight: '400' },
  timestamp: {
    fontSize: 10,
    marginTop: 6,
    alignSelf: 'flex-end',
  },
  userTimestamp: {
    color: 'rgba(255, 255, 255, 0.85)',
  },
  assistantTimestamp: {
    color: 'rgba(146, 94, 56, 0.65)',
  },

  // Typing indicator
  typingRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16, paddingHorizontal: 16 },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 18,
    borderTopLeftRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 5,
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.12)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F97316',
  },

  // Suggestion chips (Gemini style cards)
  suggestionsWrapper: {
    paddingTop: 4,
    paddingBottom: 6,
  },
  suggestionsHeaderTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(90, 55, 30, 0.65)',
    paddingHorizontal: 16,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  suggestionsScroll: {
    flexGrow: 0,
    maxHeight: 52,
  },
  suggestionsContent: {
    paddingHorizontal: 16,
    paddingVertical: 2,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chip: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.20)',
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  chipSparkle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(249, 115, 22, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipText: {
    color: '#2A1F18',
    fontSize: 13,
    fontFamily: FONTS.medium,
    lineHeight: 18,
  },

  // Info Banner
  infoBanner: {
    width: Dimensions.get('window').width - 32,
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.25)',
    marginBottom: 6,
  },
  infoText: {
    fontSize: 12,
    color: '#78350F',
    fontFamily: FONTS.regular,
    flex: 1,
    lineHeight: 16,
  },

  // Gemini-Style Frosted Glassmorphic Input
  inputWrapper: { 
    paddingHorizontal: 16, 
    paddingTop: 8,
  },
  glassInputCard: {
    width: '100%',
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.75)',
    overflow: 'hidden',
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 4,
    backgroundColor: Platform.OS === 'android' ? 'rgba(255, 255, 255, 0.92)' : 'rgba(255, 255, 255, 0.65)',
  },
  webGlassFill: {
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    backdropFilter: 'blur(20px)',
  },
  inputInnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 10,
    paddingRight: 8,
    paddingVertical: 6,
    minHeight: 52,
  },
  krishnaLogoImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: '#1E1B18',
    fontFamily: FONTS.medium,
    fontSize: 15.5,
    lineHeight: 21,
    paddingVertical: Platform.OS === 'ios' ? 8 : 4,
    paddingRight: 8,
    maxHeight: 100,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  sendBtnActive: {
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 3,
  },
  sendBtnDisabled: {
    opacity: 0.85,
  },
  sendBtnGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnInactiveCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
  },
});