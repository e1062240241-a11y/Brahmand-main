import { formatDateIST, formatTimeIST, formatDateTimeIST } from '../src/utils/dateUtils';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Image,
  Animated,
  ScrollView,
  Alert,
  Pressable,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { aiChat, getChatHistory, clearChatHistory } from '../src/services/api';
import { FONTS } from '../src/constants/theme';
import { BrandedLoading } from '../src/components/BrandedLoading';
import { useAuthStore } from '../src/store/authStore';
import Svg, { Path } from 'react-native-svg';

// ─── Types ──────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// ─── Suggested prompts ───────────────────────────────────────────────────────

const SUGGESTIONS = [
  'Mera mann bahut anxious hai 😔',
  'Life mein purpose kya hai?',
  'Relationship mein dard hai',
  'Karm aur result ka kya connection hai?',
  'Main khud pe trust nahi kar pa raha',
  'Ek bada decision lena hai',
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

  useEffect(() => {
    const bounce = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: -6, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.delay(600),
        ])
      ).start();

    bounce(dot1, 0);
    bounce(dot2, 150);
    bounce(dot3, 300);
  }, []);

  return (
    <View style={styles.typingRow}>
      <Image
        source={require('../assets/images/my_krishna_avatar.png')}
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
  const displayName = user?.name?.trim() ? user.name.trim() : 'Partha';

  const defaultWelcomeMessage = useCallback((): Message => ({
    id: 'welcome',
    role: 'assistant',
    content: `Jai Shri Krishna, ${displayName}! 🙏\n\nMain yahan hoon — tumhare dil ki baat sunne ke liye, Gita ki seekh share karne ke liye.\n\nAaj mann mein kya chal raha hai?`,
    timestamp: new Date(),
  }), [displayName]);

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
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
    const showSubscription = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
      scrollToBottom();
    });
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
    });
    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [scrollToBottom]);

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

    return (
      <View style={{ width: '100%' }}>
        {showDateDivider && (
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
              source={require('../assets/images/my_krishna_avatar.png')}
              style={styles.assistantAvatarImage}
            />
          )}
          <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.assistantBubble]}>
            <Text style={[styles.messageText, isUser ? styles.userText : styles.assistantText]}>
              {item.content}
            </Text>
            <Text style={styles.timestamp}>
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
        colors={['#FF8D57', '#EA9B76', '#FFEEE5']}
        locations={[0, 0.1058, 0.2212]}
        style={styles.container}
      >
        <Stack.Screen options={{ headerShown: false }} />
        <StatusBar
          style="dark"
          translucent
          backgroundColor="transparent"
        />

        {/* ── Header ── */}
        <View style={[styles.header, { height: insets.top + 60, paddingTop: insets.top }]}>
          <View style={styles.headerLeft}>
            <Pressable
              onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/home' as any)}
              style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
              android_ripple={{ color: 'rgba(0, 0, 0, 0.1)', borderless: true, radius: 20 }}
            >
              <Ionicons name="chevron-back" size={26} color="#000" />
            </Pressable>

            <View style={styles.headerCenter}>
              <Image
                source={require('../assets/images/my_krishna_avatar.png')}
                style={styles.headerAvatarImage}
              />
              <Text style={styles.headerTitle}>My Krishn</Text>
            </View>
          </View>

          <Pressable
            onPress={handleClearChat}
            style={({ pressed }) => [styles.clearBtn, pressed && { opacity: 0.7 }]}
            disabled={isLoading || historyLoading}
            android_ripple={{ color: 'rgba(0, 0, 0, 0.1)', borderless: true, radius: 20 }}
          >
            <Ionicons name="ellipsis-vertical" size={22} color="#000" />
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
              data={messages}
              renderItem={renderMessage}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              onContentSizeChange={scrollToBottom}
              showsVerticalScrollIndicator={false}
              ListFooterComponent={isLoading ? <TypingDots /> : null}
            />
          )}

          {/* ── Suggestions chips (only shown before first user message) ── */}
          {showSuggestions && !historyLoading && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.suggestionsScroll}
              contentContainerStyle={styles.suggestionsContent}
            >
              {SUGGESTIONS.map((s, i) => (
                <Pressable
                  key={i}
                  style={({ pressed }) => [styles.chip, pressed && { opacity: 0.8 }]}
                  onPress={() => handleSuggestion(s)}
                  android_ripple={{ color: 'rgba(0, 0, 0, 0.1)', borderless: false }}
                >
                  <Text style={styles.chipText}>{s}</Text>
                </Pressable>
              ))}
            </ScrollView>
          )}

          {/* ── Info Banner ── */}
          {!historyLoading && messages.length < 3 && (
            <View style={styles.infoBanner}>
              <Svg width={15.692} height={15.68} viewBox="0 0 16 16" fill="none">
                <Path d="M7.8517 0C1.81646 0 -1.95556 6.53333 1.06206 11.76C4.07967 16.9867 11.6237 16.9867 14.6413 11.76C15.3294 10.5682 15.6917 9.21621 15.6917 7.84C15.6871 3.51198 12.1797 0.004575 7.8517 0ZM7.8517 14.4738C2.74496 14.4741 -0.446704 8.94601 2.10647 4.52333C4.65964 0.100656 11.0431 0.100369 13.5966 4.52282C14.179 5.53135 14.4855 6.67542 14.4855 7.84C14.4814 11.5021 11.5137 14.4697 7.8517 14.4738ZM9.05785 11.4585C9.05785 11.7915 8.78783 12.0615 8.45477 12.0615C7.78861 12.0616 7.24862 11.5215 7.24862 10.8554V7.84C6.78437 7.84 6.49422 7.33744 6.72634 6.93539C6.83406 6.7488 7.03317 6.63386 7.24862 6.63384C7.91478 6.63382 8.45477 7.17384 8.45477 7.84V10.8554C8.78783 10.8554 9.05785 11.1254 9.05785 11.4585ZM6.64554 4.52308C6.64554 3.82671 7.39939 3.39147 8.00246 3.73966C8.60554 4.08784 8.60554 4.95831 8.00246 5.3065C7.86496 5.38589 7.70894 5.42769 7.55016 5.42769C7.05053 5.42771 6.64554 5.0227 6.64554 4.52308Z" fill="black"/>
              </Svg>
              <Text style={styles.infoText}>
                Ask your complete question in one message, then press Enter. Please avoid splitting your question across multiple messages.
              </Text>
            </View>
          )}

          {/* ── Input Bar ── */}
          <View style={[
            styles.inputWrapper,
            {
              paddingBottom: Platform.OS === 'android'
                ? (keyboardVisible ? 8 : Math.max(insets.bottom, 16))
                : Platform.OS === 'ios'
                  ? Math.max(insets.bottom, 12)
                  : 24
            }
          ]}>
            <View style={styles.inputRow}>
              <View style={styles.inputContainer}>
                <TextInput
                  ref={inputRef}
                  style={styles.input}
                  placeholder="Message..."
                  placeholderTextColor="rgba(0, 0, 0, 0.5)"
                  value={inputText}
                  onChangeText={setInputText}
                  multiline
                  maxLength={500}
                  returnKeyType="send"
                  onSubmitEditing={handleSend}
                  editable={!historyLoading}
                  disableFullscreenUI={true}
                  textAlignVertical="center"
                  onFocus={() => {
                    if (Platform.OS === 'android') {
                      setKeyboardVisible(true);
                    }
                  }}
                  onBlur={() => {
                    if (Platform.OS === 'android') {
                      setKeyboardVisible(false);
                    }
                  }}
                />
                <View style={styles.inputIcons}>
                  <Ionicons name="mic-outline" size={20} color="rgba(0, 0, 0, 0.6)" style={styles.iconMargin} />
                  <Ionicons name="camera-outline" size={20} color="rgba(0, 0, 0, 0.6)" style={styles.iconMargin} />
                  <Ionicons name="image-outline" size={20} color="rgba(0, 0, 0, 0.6)" />
                </View>
              </View>
              <Pressable
                style={({ pressed }) => [
                  styles.sendBtn,
                  pressed && { opacity: 0.7 }
                ]}
                onPress={handleSend}
                disabled={!inputText.trim() || isLoading || historyLoading}
              >
                <Ionicons
                  name="send"
                  size={18}
                  color="#000"
                />
              </Pressable>
            </View>
          </View>
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
    backgroundColor: 'rgba(255, 250, 248, 0.50)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  clearBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerAvatarImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  headerTitle: {
    color: '#000000',
    fontSize: 16,
    fontFamily: FONTS.bold,
    fontWeight: '700',
  },

  // Loader
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loaderText: { color: '#FFD700', fontFamily: FONTS.medium, marginTop: 12, fontSize: 14 },

  // Messages
  listContent: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 12 },
  dateDivider: {
    alignSelf: 'center',
    marginVertical: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  dateDividerText: {
    color: 'rgba(0, 0, 0, 0.4)',
    fontSize: 12,
    fontFamily: FONTS.medium,
  },
  messageRow: { flexDirection: 'row', marginBottom: 14, maxWidth: '85%' },
  userRow: { alignSelf: 'flex-end', flexDirection: 'row-reverse' },
  assistantRow: { alignSelf: 'flex-start' },

  assistantAvatarImage: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 8,
  },

  messageBubble: { 
    padding: 12, 
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  userBubble: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.50)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 3,
    borderBottomLeftRadius: 20,
  },
  assistantBubble: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    borderBottomLeftRadius: 3,
  },
  messageText: { fontSize: 15, fontFamily: FONTS.medium, lineHeight: 22, color: '#000' },
  userText: { color: '#000' },
  assistantText: { color: '#000' },
  timestamp: {
    fontSize: 10,
    color: 'rgba(0, 0, 0, 0.4)',
    marginTop: 5,
    alignSelf: 'flex-end',
  },

  // Typing indicator
  typingRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 14, paddingHorizontal: 14 },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 20,
    borderBottomLeftRadius: 3,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#000',
  },

  // Suggestion chips
  suggestionsScroll: { maxHeight: 50 },
  suggestionsContent: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    gap: 8,
    flexDirection: 'row',
  },
  chip: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  chipText: {
    color: '#000',
    fontSize: 12,
    fontFamily: FONTS.medium,
  },

  // Info Banner
  infoBanner: {
    width: 315,
    height: 68,
    alignSelf: 'center',
    backgroundColor: '#F4F4F4',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  infoText: {
    fontSize: 12,
    color: '#000000',
    fontFamily: FONTS.regular,
    flex: 1,
    textAlign: 'center',
  },

  // Input
  inputWrapper: { 
    paddingHorizontal: 12, 
    paddingTop: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 22,
    paddingHorizontal: 16,
    height: 44,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.50)',
  },
  input: {
    flex: 1,
    color: '#000',
    fontFamily: FONTS.medium,
    fontSize: 15,
    paddingVertical: 4,
  },
  inputIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconMargin: {
    marginRight: 2,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.50)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 9,
  },
});