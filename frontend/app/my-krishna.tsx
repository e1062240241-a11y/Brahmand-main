import { formatDateIST, formatTimeIST, formatDateTimeIST, formatTimeAgo } from '../src/utils/dateUtils';
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
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
  Alert,
  Pressable,
  ActivityIndicator,
  Keyboard,
  Dimensions,
  ScrollView,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AnimatedReanimated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  useReducedMotion,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { aiChat, getChatHistory, clearChatHistory } from '../src/services/api';
import { FONTS } from '../src/constants/theme';
import { BrandedLoading } from '../src/components/BrandedLoading';
import { useAuthStore } from '../src/store/authStore';
import { useTranslation } from '../src/utils/i18n';

const EASING_CUBIC = Easing.out(Easing.cubic);

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Types ──────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// ─── Shubh Vichar (Daily Spiritual Quotes) ──────────────────────────────────

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

// ─── Suggested prompts (Gemini style) ──────────────────────────────────────

const SUGGESTIONS_HI = [
  { text: 'मेरा मन बहुत व्याकुल है, शांति कैसे पाऊँ?', icon: 'heart-outline' },
  { text: 'जीवन का क्या उद्देश्य है?', icon: 'compass-outline' },
  { text: 'कर्म और उसके फल का वास्तविक संबंध क्या है?', icon: 'infinite-outline' },
  { text: 'कठिन निर्णय लेते समय क्या ध्यान रखना चाहिए?', icon: 'bulb-outline' },
  { text: 'संबंधों में मनमुटाव को कैसे सुलझाएं?', icon: 'people-outline' },
  { text: 'स्वयं पर अटूट विश्वास कैसे लौटाऊँ?', icon: 'shield-checkmark-outline' },
];

const SUGGESTIONS_EN = [
  { text: 'My mind feels restless, how do I find inner peace?', icon: 'heart-outline' },
  { text: 'What is the true purpose of life?', icon: 'compass-outline' },
  { text: 'How do Karma and destiny work together?', icon: 'infinite-outline' },
  { text: 'How to make difficult choices with clarity?', icon: 'bulb-outline' },
  { text: 'How to resolve emotional conflicts in relationships?', icon: 'people-outline' },
  { text: 'How do I restore faith in myself?', icon: 'shield-checkmark-outline' },
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

// ─── Seamless Chunked Text Streaming Component ────────────────────────────────

interface ChunkedStreamingTextProps {
  fullText: string;
  onChunkComplete?: () => void;
  onChunkUpdate?: () => void;
  style: any;
}

const ChunkedStreamingText: React.FC<ChunkedStreamingTextProps> = React.memo(({
  fullText,
  onChunkComplete,
  onChunkUpdate,
  style,
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const textRef = useRef('');
  const onCompleteRef = useRef(onChunkComplete);
  const onUpdateRef = useRef(onChunkUpdate);

  useEffect(() => { onCompleteRef.current = onChunkComplete; }, [onChunkComplete]);
  useEffect(() => { onUpdateRef.current = onChunkUpdate; }, [onChunkUpdate]);

  useEffect(() => {
    if (!fullText) {
      setDisplayedText('');
      return;
    }

    const chunks = fullText.match(/(\s+|\S+)/g) || [fullText];
    let chunkIdx = 0;
    textRef.current = '';
    setDisplayedText('');

    const timer = setInterval(() => {
      if (chunkIdx < chunks.length) {
        textRef.current += chunks[chunkIdx];
        chunkIdx += 1;
        setDisplayedText(textRef.current);
        if (chunkIdx % 3 === 0 && onUpdateRef.current) {
          onUpdateRef.current();
        }
      } else {
        clearInterval(timer);
        if (onUpdateRef.current) onUpdateRef.current();
        if (onCompleteRef.current) onCompleteRef.current();
      }
    }, 24);

    return () => clearInterval(timer);
  }, [fullText]);

  return (
    <Text style={style} selectable>
      {displayedText}
    </Text>
  );
});

ChunkedStreamingText.displayName = 'ChunkedStreamingText';

// ─── Gemini Animated Typing Indicator ────────────────────────────────────────

function GeminiTypingIndicator() {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0.4)).current;
  const animsRef = useRef<Animated.CompositeAnimation[]>([]);

  useEffect(() => {
    const anim1 = Animated.loop(
      Animated.sequence([
        Animated.delay(0),
        Animated.timing(dot1, { toValue: -5, duration: 260, useNativeDriver: true }),
        Animated.timing(dot1, { toValue: 0, duration: 260, useNativeDriver: true }),
        Animated.delay(480),
      ])
    );
    const anim2 = Animated.loop(
      Animated.sequence([
        Animated.delay(130),
        Animated.timing(dot2, { toValue: -5, duration: 260, useNativeDriver: true }),
        Animated.timing(dot2, { toValue: 0, duration: 260, useNativeDriver: true }),
        Animated.delay(480),
      ])
    );
    const anim3 = Animated.loop(
      Animated.sequence([
        Animated.delay(260),
        Animated.timing(dot3, { toValue: -5, duration: 260, useNativeDriver: true }),
        Animated.timing(dot3, { toValue: 0, duration: 260, useNativeDriver: true }),
        Animated.delay(480),
      ])
    );
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.4, duration: 600, useNativeDriver: true }),
      ])
    );

    animsRef.current = [anim1, anim2, anim3, pulse];
    anim1.start();
    anim2.start();
    anim3.start();
    pulse.start();

    return () => {
      animsRef.current.forEach((anim) => anim.stop());
    };
  }, [dot1, dot2, dot3, pulseAnim]);

  return (
    <View style={styles.geminiTypingRow}>
      <View style={styles.geminiAvatarGlow}>
        <Image
          source={{ uri: 'https://brahmandfeed23.b-cdn.net/assets/my_krishna_avatar.webp' }}
          style={styles.geminiTypingAvatar}
        />
      </View>
      <View style={styles.geminiTypingBubble}>
        <Animated.View style={{ opacity: pulseAnim, marginRight: 6 }}>
          <Ionicons name="sparkles" size={14} color="#EA580C" />
        </Animated.View>
        <Text style={styles.geminiTypingText}>My Krishn is reflecting...</Text>
        <View style={styles.dotsContainer}>
          {[dot1, dot2, dot3].map((dot, i) => (
            <Animated.View
              key={i}
              style={[styles.geminiDot, { transform: [{ translateY: dot }] }]}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

// ─── Gemini Hero Greeting Section (Typewriter & Staggered Transitions) ────────

interface GeminiHeroSectionProps {
  greeting: string;
  quote: string;
  suggestions: { text: string; icon: string }[];
  onSelectSuggestion: (text: string) => void;
}

const GeminiHeroSection: React.FC<GeminiHeroSectionProps> = React.memo(({
  greeting,
  quote,
  suggestions,
  onSelectSuggestion,
}) => {
  const reducedMotion = useReducedMotion();
  const [streamedGreeting, setStreamedGreeting] = useState(reducedMotion ? greeting : '');
  const [isTyping, setIsTyping] = useState(!reducedMotion);
  const [isCardsReady, setIsCardsReady] = useState(reducedMotion);

  const cursorOpacity = useSharedValue(reducedMotion ? 0 : 1);
  const subtitleOpacity = useSharedValue(reducedMotion ? 1 : 0);
  const subtitleTranslateY = useSharedValue(reducedMotion ? 0 : 16);
  const quoteOpacity = useSharedValue(reducedMotion ? 1 : 0);
  const quoteTranslateY = useSharedValue(reducedMotion ? 0 : 18);

  // Gemini Typewriter streaming effect on greeting title
  useEffect(() => {
    if (reducedMotion) {
      setStreamedGreeting(greeting);
      setIsTyping(false);
      subtitleOpacity.value = 1;
      subtitleTranslateY.value = 0;
      quoteOpacity.value = 1;
      quoteTranslateY.value = 0;
      setIsCardsReady(true);
      return;
    }

    setStreamedGreeting('');
    setIsTyping(true);
    setIsCardsReady(false);

    let idx = 0;
    const timer = setInterval(() => {
      idx += 1;
      setStreamedGreeting(greeting.slice(0, idx));
      if (idx >= greeting.length) {
        clearInterval(timer);
        setIsTyping(false);

        // Subtitle cascading entrance: 180ms delay, 400ms duration
        subtitleOpacity.value = withDelay(
          180,
          withTiming(1, { duration: 400, easing: EASING_CUBIC })
        );
        subtitleTranslateY.value = withDelay(
          180,
          withTiming(0, { duration: 400, easing: EASING_CUBIC })
        );

        // Daily Divine Quote entrance: 320ms delay, 420ms duration
        quoteOpacity.value = withDelay(
          320,
          withTiming(1, { duration: 420, easing: EASING_CUBIC })
        );
        quoteTranslateY.value = withDelay(
          320,
          withTiming(0, { duration: 420, easing: EASING_CUBIC })
        );

        // Trigger cards staggered entrance
        setIsCardsReady(true);
      }
    }, 38);

    return () => clearInterval(timer);
  }, [greeting, reducedMotion, subtitleOpacity, subtitleTranslateY, quoteOpacity, quoteTranslateY]);

  // Blinking cursor loop during typing
  useEffect(() => {
    if (reducedMotion || !isTyping) {
      cursorOpacity.value = 0;
      return;
    }

    cursorOpacity.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 450 }),
        withTiming(1, { duration: 450 })
      ),
      -1,
      true
    );

    return () => {
      cursorOpacity.value = 0;
    };
  }, [isTyping, reducedMotion, cursorOpacity]);

  const animatedCursorStyle = useAnimatedStyle(() => ({
    opacity: cursorOpacity.value,
  }));

  const animatedSubtitleStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
    transform: [{ translateY: subtitleTranslateY.value }],
  }));

  const animatedQuoteStyle = useAnimatedStyle(() => ({
    opacity: quoteOpacity.value,
    transform: [{ translateY: quoteTranslateY.value }],
  }));

  return (
    <View style={{ width: '100%' }}>
      {/* Avatar & Title Greeting Section */}
      <View style={styles.geminiGreetingContainer}>
        <View style={styles.avatarGlowLarge}>
          <Image
            source={{ uri: 'https://brahmandfeed23.b-cdn.net/assets/my_krishna_avatar.webp' }}
            style={styles.geminiHeroAvatar}
          />
        </View>

        {/* Gemini Opening Streaming Typewriter Title */}
        <View style={{ alignItems: 'center' }}>
          <Text style={styles.geminiGreetingTitle}>
            {streamedGreeting}
            {isTyping && (
              <AnimatedReanimated.Text style={[styles.cursor, animatedCursorStyle]}>
                |
              </AnimatedReanimated.Text>
            )}
          </Text>

          {/* Cascading Subtitle */}
          <AnimatedReanimated.View style={[styles.geminiSparkleSubtitleRow, animatedSubtitleStyle]}>
            <Ionicons name="sparkles" size={13} color="#EA580C" style={{ marginRight: 5 }} />
            <Text style={styles.geminiSparkleSubtitleText}>
              Ask Krishna anything ✨
            </Text>
          </AnimatedReanimated.View>
        </View>

        {/* Daily Divine Quote (Background Free & Cascading Transition) */}
        <AnimatedReanimated.View style={[styles.quoteCardContainer, animatedQuoteStyle]}>
          <Text style={styles.geminiQuoteText}>
            "{quote}"
          </Text>
        </AnimatedReanimated.View>
      </View>

      {/* Gemini Suggestion Cards Grid with Staggered Cascading Entrance */}
      <View style={styles.geminiCardsGrid}>
        {suggestions.map((item, idx) => (
          <GeminiSuggestionCard
            key={idx}
            item={item}
            index={idx}
            isReady={isCardsReady}
            onPress={onSelectSuggestion}
          />
        ))}
      </View>
    </View>
  );
});

GeminiHeroSection.displayName = 'GeminiHeroSection';

// ─── Gemini Suggestion Card with Staggered Entrance ───────────────────────────

interface GeminiSuggestionCardProps {
  item: { text: string; icon: string };
  index: number;
  isReady: boolean;
  onPress: (text: string) => void;
}

const GeminiSuggestionCard: React.FC<GeminiSuggestionCardProps> = React.memo(({
  item,
  index,
  isReady,
  onPress,
}) => {
  const reducedMotion = useReducedMotion();
  const cardOpacity = useSharedValue(reducedMotion ? 1 : 0);
  const cardTranslateY = useSharedValue(reducedMotion ? 0 : 24);

  useEffect(() => {
    if (reducedMotion) {
      cardOpacity.value = 1;
      cardTranslateY.value = 0;
      return;
    }

    if (isReady) {
      const delay = 200 + index * 60;
      cardOpacity.value = withDelay(
        delay,
        withTiming(1, { duration: 380, easing: EASING_CUBIC })
      );
      cardTranslateY.value = withDelay(
        delay,
        withTiming(0, { duration: 400, easing: EASING_CUBIC })
      );
    }
  }, [isReady, index, reducedMotion, cardOpacity, cardTranslateY]);

  const animatedCardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateY: cardTranslateY.value }],
  }));

  return (
    <AnimatedReanimated.View style={animatedCardStyle}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={item.text}
        style={({ pressed }) => [
          styles.geminiCard,
          pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
        ]}
        onPress={() => onPress(item.text)}
        android_ripple={{ color: 'rgba(234, 88, 12, 0.08)', borderless: false }}
      >
        <View style={styles.geminiCardHeader}>
          <View style={styles.geminiCardIconCircle}>
            <Ionicons name={item.icon as any} size={15} color="#EA580C" />
          </View>
          <Ionicons name="arrow-forward" size={14} color="rgba(120, 80, 50, 0.4)" />
        </View>
        <Text style={styles.geminiCardText}>{item.text}</Text>
      </Pressable>
    </AnimatedReanimated.View>
  );
});

GeminiSuggestionCard.displayName = 'GeminiSuggestionCard';

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MyKrishnaChat() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { t } = useTranslation();
  const displayName = user?.name?.trim() ? user.name.trim() : 'Partha';
  const suggestions = t('language') === 'hi' ? SUGGESTIONS_HI : SUGGESTIONS_EN;

  // ─── Personalized Krishna-Bhakt Greetings & Daily Shubh Vichar ────────────

  const { shubhVichar, timeOfDayGreeting, gradientColors } = useMemo(() => {
    const { hours, dayOfYear } = getISTDateDetails();
    const index = Math.abs(dayOfYear) % SHUBH_VICHAR_LIST.length;
    const thought = SHUBH_VICHAR_LIST[index];

    let greeting = '';
    // PONYTAIL FIX: Removed unused `colors` variable assignments; gradientColors is static below

    if (hours >= 4 && hours < 12) {
      greeting = t('language') === 'hi'
        ? `जय श्री कृष्ण, ${displayName} ✨`
        : `Jai Shri Krishna, ${displayName} ✨`;
    } else if (hours >= 12 && hours < 17) {
      greeting = t('language') === 'hi'
        ? `कहो ${displayName}, मन में क्या विचार है?`
        : `Tell me ${displayName}, what's on your mind?`;
    } else if (hours >= 17 && hours < 22) {
      greeting = t('language') === 'hi'
        ? `संध्या वंदन, ${displayName} 🪔`
        : `Peace be with you, ${displayName} 🪔`;
    } else {
      greeting = t('language') === 'hi'
        ? `मन शांत करो, ${displayName} 🌙`
        : `Rest your thoughts, ${displayName} 🌙`;
    }

    return {
      shubhVichar: thought,
      timeOfDayGreeting: { greeting },
      gradientColors: ['#FFEEE5', '#FFEEE5', '#FFEEE5'] as [string, string, string],
    };
  }, [displayName, t]);

  // PONYTAIL FIX: Step 2 - Dual-Slot State Architecture
  const [chat1Messages, setChat1Messages] = useState<Message[]>([]);
  const [chat2Messages, setChat2Messages] = useState<Message[]>([]);
  const [activeChatId, setActiveChatId] = useState<'slot_1' | 'slot_2'>('slot_1');

  const activeMessages = activeChatId === 'slot_1' ? chat1Messages : chat2Messages;
  const setActiveMessages = useCallback(
    (updater: Message[] | ((prev: Message[]) => Message[])) => {
      if (activeChatId === 'slot_1') {
        setChat1Messages(updater);
      } else {
        setChat2Messages(updater);
      }
    },
    [activeChatId]
  );

  // PONYTAIL FIX: Step 2 - Critical Limit Logic: count ONLY messages where role === 'user'
  const userMessageCount = useMemo(() => {
    return activeMessages.filter((m) => m.role === 'user').length;
  }, [activeMessages]);

  const isChatFull = userMessageCount >= 15;
  const showWarningBanner = userMessageCount >= 13 && userMessageCount < 15;

  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showLandingView, setShowLandingView] = useState(true);
  const [streamingMsgId, setStreamingMsgId] = useState<string | null>(null);

  // Gemini Menu & History Modal
  const [menuVisible, setMenuVisible] = useState(false);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [historySearchTerm, setHistorySearchTerm] = useState('');

  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);
  // PONYTAIL FIX: messagesRef completely removed; state is reactive and separated by slot

  // PONYTAIL FIX: Step 3 - Alert when active chat reaches 15 user messages
  const handleChatFullAlert = useCallback(() => {
    const otherChatId = activeChatId === 'slot_1' ? 'slot_2' : 'slot_1';
    const otherChatName = otherChatId === 'slot_1' ? 'Chat 1' : 'Chat 2';
    const otherMessages = activeChatId === 'slot_1' ? chat2Messages : chat1Messages;
    const otherUserCount = otherMessages.filter((m) => m.role === 'user').length;
    const isOtherFull = otherUserCount >= 15;

    if (isOtherFull) {
      Alert.alert(
        'Both Divine Scrolls Are Full',
        'Both Divine Scrolls Are Full. Please clear one chat to continue your spiritual dialogue.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Clear Current Chat',
            style: 'destructive',
            onPress: async () => {
              try {
                setIsLoading(true);
                await clearChatHistory(activeChatId);
                setActiveMessages([]);
                setShowLandingView(true);
              } catch (err) {
                console.error('Failed to clear chat:', err);
              } finally {
                setIsLoading(false);
              }
            },
          },
        ]
      );
    } else {
      Alert.alert(
        'Divine Scroll Full',
        `This divine scroll has reached its 15-message dialogue limit. Would you like to switch to ${otherChatName} or clear this chat?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Clear This Chat',
            style: 'destructive',
            onPress: async () => {
              try {
                setIsLoading(true);
                await clearChatHistory(activeChatId);
                setActiveMessages([]);
                setShowLandingView(true);
              } catch (err) {
                console.error('Failed to clear chat:', err);
              } finally {
                setIsLoading(false);
              }
            },
          },
          {
            text: `Switch to ${otherChatName}`,
            onPress: () => {
              setActiveChatId(otherChatId);
              setShowLandingView(otherMessages.length === 0);
            },
          },
        ]
      );
    }
  }, [activeChatId, chat1Messages, chat2Messages, setActiveMessages]);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 150);
  }, []);

  const bottomInputPadding = useMemo(() => {
    if (Platform.OS === 'ios') {
      return Math.max(insets.bottom, 14);
    }
    if (Platform.OS === 'android') {
      if (keyboardVisible) {
        return 8;
      }
      // On Android devices with 3-button navigation, the system navigation bar is ~48dp.
      // If insets.bottom is 0 (translucent/immersive nav bar), provide a solid 54dp clearance.
      // If insets.bottom > 0, provide 12dp clearance above the reported inset.
      return insets.bottom === 0 ? 54 : Math.max(insets.bottom + 12, 54);
    }
    return 24;
  }, [insets.bottom, keyboardVisible]);

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
  }, [scrollToBottom]);

  // PONYTAIL FIX: Step 5 - Concurrent Dual-Slot Fetch & Smart Auto-Routing on Mount
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const [res1, res2] = await Promise.all([
          getChatHistory('slot_1'),
          getChatHistory('slot_2'),
        ]);

        const formatSlot = (data: any, slotPrefix: string): Message[] => {
          if (data?.messages && data.messages.length > 0) {
            return data.messages.map((m: any, idx: number) => ({
              id: `${slotPrefix}_${idx}`,
              role: m.role,
              content: m.content,
              timestamp: m.timestamp ? new Date(m.timestamp) : new Date(),
            }));
          }
          return [];
        };

        const msgs1 = formatSlot(res1.data, 'slot1');
        const msgs2 = formatSlot(res2.data, 'slot2');

        setChat1Messages(msgs1);
        setChat2Messages(msgs2);

        // PONYTAIL FIX: Step 5 - Count user messages in each slot for smart auto-routing
        const userCount1 = msgs1.filter((m) => m.role === 'user').length;
        const userCount2 = msgs2.filter((m) => m.role === 'user').length;

        let chosenSlot: 'slot_1' | 'slot_2' = 'slot_1';
        if (userCount1 >= 15 && userCount2 < 15) {
          chosenSlot = 'slot_2';
        } else if (userCount2 >= 15 && userCount1 < 15) {
          chosenSlot = 'slot_1';
        } else {
          chosenSlot = 'slot_1';
        }

        setActiveChatId(chosenSlot);
        const chosenMsgs = chosenSlot === 'slot_1' ? msgs1 : msgs2;
        setShowLandingView(chosenMsgs.length === 0);
      } catch (error) {
        console.error('Failed to load chat history:', error);
        setChat1Messages([]);
        setChat2Messages([]);
        setActiveChatId('slot_1');
        setShowLandingView(true);
      } finally {
        setHistoryLoading(false);
        scrollToBottom();
      }
    };

    fetchHistory();
  }, [scrollToBottom]);

  // PONYTAIL FIX: Step 4 - Refactored sendMessage with dual-slot targeting and 15-user-message limit
  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;

      // PONYTAIL FIX: Step 4.1 - Block send if 15-user-message limit is reached
      if (isChatFull) {
        handleChatFullAlert();
        return;
      }

      setShowLandingView(false);

      const userMsg: Message = {
        id: `user_${Date.now()}`,
        role: 'user',
        content: text.trim(),
        timestamp: new Date(),
      };

      // PONYTAIL FIX: Step 4.2 - Append userMsg to activeMessages state directly
      const currentSlot = activeChatId;
      const updatedMessages = [...activeMessages, userMsg];
      setActiveMessages(updatedMessages);

      setInputText('');
      setIsLoading(true);
      scrollToBottom();

      try {
        // PONYTAIL FIX: Step 4.3 - Build apiMessages and pass activeChatId to aiChat
        const apiMessages = updatedMessages.map((m) => ({ role: m.role, content: m.content }));
        const response = await aiChat(apiMessages, currentSlot);

        if (response.data?.choices?.[0]?.message) {
          const assistantMsg: Message = {
            id: `assistant_${Date.now()}`,
            role: 'assistant',
            content: response.data.choices[0].message.content || '',
            timestamp: new Date(),
          };
          setStreamingMsgId(assistantMsg.id);
          // PONYTAIL FIX: Step 4.4 - Append assistantMsg to current slot state
          if (currentSlot === 'slot_1') {
            setChat1Messages((prev) => [...prev, assistantMsg]);
          } else {
            setChat2Messages((prev) => [...prev, assistantMsg]);
          }
        } else {
          throw new Error('Invalid API response');
        }
      } catch (error) {
        console.error('Chat error:', error);
        const errMsg: Message = {
          id: `err_${Date.now()}`,
          role: 'assistant',
          content: 'Koi connection issue hai abhi. Thodi der mein dobara try karein. 🙏',
          timestamp: new Date(),
        };
        if (currentSlot === 'slot_1') {
          setChat1Messages((prev) => [...prev, errMsg]);
        } else {
          setChat2Messages((prev) => [...prev, errMsg]);
        }
      } finally {
        setIsLoading(false);
        scrollToBottom();
      }
    },
    [isLoading, isChatFull, handleChatFullAlert, activeChatId, activeMessages, setActiveMessages, scrollToBottom]
  );

  const handleSend = () => sendMessage(inputText);
  const handleSuggestion = (text: string) => sendMessage(text);

  const handleCopyMessage = async (item: Message) => {
    try {
      await Clipboard.setStringAsync(item.content);
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // ignore
    }
  };

  const handleStartNewChat = () => {
    setMenuVisible(false);
    setShowLandingView(true);
  };

  const handleClearChat = () => {
    setMenuVisible(false);
    const slotLabel = activeChatId === 'slot_1' ? 'Chat 1' : 'Chat 2';
    Alert.alert(
      `Clear ${slotLabel} History`,
      `Kya aap Krishna ke sath ${slotLabel} ki poori chat history delete karna chahte hain?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              await clearChatHistory(activeChatId);
              setActiveMessages([]);
              setShowLandingView(true);
              setHistoryModalVisible(false);
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

  // Group messages for Chat History view
  const historyUserQueries = useMemo(() => {
    const list: { query: string; answer?: string; timestamp: Date; id: string }[] = [];
    for (let i = 0; i < activeMessages.length; i++) {
      if (activeMessages[i].role === 'user') {
        const query = activeMessages[i].content;
        const answer = activeMessages[i + 1]?.role === 'assistant' ? activeMessages[i + 1].content : undefined;
        list.push({
          query,
          answer,
          timestamp: activeMessages[i].timestamp,
          id: activeMessages[i].id,
        });
      }
    }
    return list.reverse();
  }, [activeMessages]);

  const filteredHistory = useMemo(() => {
    if (!historySearchTerm.trim()) return historyUserQueries;
    const term = historySearchTerm.toLowerCase();
    return historyUserQueries.filter(
      (h) => h.query.toLowerCase().includes(term) || (h.answer && h.answer.toLowerCase().includes(term))
    );
  }, [historyUserQueries, historySearchTerm]);

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isUser = item.role === 'user';

    let showDateDivider = false;
    let dateLabel = '';

    if (index === 0) {
      showDateDivider = true;
      dateLabel = getMessageDateLabel(item.timestamp);
    } else {
      const prevMessage = activeMessages[index - 1];
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
        {/* PONYTAIL FIX: Removed Animated.View and no-op fadeAnim overhead */}
        <View
          style={[
            styles.messageRow,
            isUser ? styles.userRow : styles.assistantRow,
          ]}
        >
          {!isUser && (
            <View style={styles.assistantAvatarWrapper}>
              <Image
                source={{ uri: 'https://brahmandfeed23.b-cdn.net/assets/my_krishna_avatar.webp' }}
                style={styles.assistantAvatarImage}
              />
            </View>
          )}
          <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.assistantBubble]}>
            {!isUser && (
              <View style={styles.aiSenderHeader}>
                <View style={styles.aiSenderBadge}>
                  <Ionicons name="sparkles" size={12} color="#EA580C" />
                  <Text style={styles.aiSenderText}>My Krishn</Text>
                </View>
                <Pressable
                  onPress={() => handleCopyMessage(item)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={styles.copyActionBtn}
                >
                  <Ionicons
                    name={copiedId === item.id ? "checkmark-circle" : "copy-outline"}
                    size={14}
                    color={copiedId === item.id ? "#16A34A" : "rgba(120, 80, 50, 0.55)"}
                  />
                </Pressable>
              </View>
            )}
            <Text style={[styles.messageText, isUser ? styles.userText : styles.assistantText]} selectable>
              {!isUser && streamingMsgId === item.id ? (
                <ChunkedStreamingText
                  fullText={item.content}
                  onChunkUpdate={scrollToBottom}
                  onChunkComplete={() => setStreamingMsgId(null)}
                  style={[styles.messageText, styles.assistantText]}
                />
              ) : (
                item.content
              )}
            </Text>
            <View style={styles.messageFooter}>
              <Text style={[styles.timestamp, isUser ? styles.userTimestamp : styles.assistantTimestamp]}>
                {formatTimeIST(item.timestamp)}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#FFEEE5' }}>
      <LinearGradient
        colors={gradientColors}
        style={styles.container}
      >
        <Stack.Screen options={{ headerShown: false }} />
        <StatusBar style="dark" />

        {/* ── Gemini Minimal Top Bar with Three Lines (Menu) Button ── */}
        <View style={[styles.header, { height: insets.top + 56, paddingTop: insets.top }]}>
          <View style={styles.headerLeft}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/home' as any))}
              style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.7 }]}
              android_ripple={{ color: 'rgba(0, 0, 0, 0.08)', borderless: true, radius: 20 }}
            >
              <Ionicons name="chevron-back" size={24} color="#1E1B18" />
            </Pressable>

            <View style={styles.headerTitleGroup}>
              <View style={styles.headerTitleRow}>
                <Image
                  source={{ uri: 'https://brahmandfeed23.b-cdn.net/assets/my_krishna_avatar.webp' }}
                  style={styles.headerAvatar}
                />
                <Text style={styles.headerTitleText}>
                  My Krishn
                </Text>
              </View>
            </View>
          </View>

          {/* Gemini Three Lines (Hamburger Menu) Button */}
          <View style={styles.headerRight}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Chat Options"
              onPress={() => setMenuVisible((prev) => !prev)}
              style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.7 }]}
              android_ripple={{ color: 'rgba(0, 0, 0, 0.08)', borderless: true, radius: 20 }}
            >
              <Feather name="menu" size={22} color="#2D241E" />
            </Pressable>
          </View>
        </View>

        {/* ── Dropdown Menu (Gemini Style) ── */}
        {menuVisible && (
          <>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setMenuVisible(false)} />
            <View style={[styles.menuDropdown, { top: insets.top + 52 }]}>
              {/* PONYTAIL FIX: Step 6.2 - Switch Chat Slot */}
              <TouchableOpacity
                style={styles.menuItem}
                activeOpacity={0.7}
                onPress={() => {
                  setMenuVisible(false);
                  const nextSlot = activeChatId === 'slot_1' ? 'slot_2' : 'slot_1';
                  setActiveChatId(nextSlot);
                  const targetMsgs = nextSlot === 'slot_1' ? chat1Messages : chat2Messages;
                  setShowLandingView(targetMsgs.length === 0);
                }}
              >
                <Ionicons name="swap-horizontal-outline" size={18} color="#4A3B32" />
                <Text style={styles.menuItemText}>
                  Switch to {activeChatId === 'slot_1' ? 'Chat 2' : 'Chat 1'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                activeOpacity={0.7}
                onPress={() => {
                  setMenuVisible(false);
                  setHistoryModalVisible(true);
                }}
              >
                <Ionicons name="time-outline" size={18} color="#4A3B32" />
                <Text style={styles.menuItemText}>Chat History</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                activeOpacity={0.7}
                onPress={handleStartNewChat}
              >
                <Ionicons name="add-circle-outline" size={18} color="#4A3B32" />
                <Text style={styles.menuItemText}>New Chat</Text>
              </TouchableOpacity>

              <View style={styles.menuDivider} />

              <TouchableOpacity
                style={styles.menuItem}
                activeOpacity={0.7}
                onPress={handleClearChat}
              >
                <Ionicons name="trash-outline" size={18} color="#DC2626" />
                <Text style={[styles.menuItemText, { color: '#DC2626' }]}>Clear All History</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          {/* ── Loading indicator while history loads ── */}
          {historyLoading ? (
            <BrandedLoading message="Connecting to Krishna's divine wisdom..." />
          ) : showLandingView ? (
            /* ── Gemini Pristine Landing View (No fake messages) ── */
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={styles.geminiLandingContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <GeminiHeroSection
                greeting={timeOfDayGreeting.greeting}
                quote={shubhVichar}
                suggestions={suggestions}
                onSelectSuggestion={handleSuggestion}
              />
            </ScrollView>
          ) : (
            /* ── Active Conversation Stream ── */
            <>
              {/* PONYTAIL FIX: Step 6.3 - Warning Banner (userMessageCount >= 13 && < 15) */}
              {showWarningBanner && (
                <View style={styles.limitWarningBanner}>
                  <Ionicons name="information-circle-outline" size={16} color="#EA580C" />
                  <Text style={styles.limitWarningText}>
                    This divine scroll is almost full.{' '}
                    <Text
                      style={styles.limitWarningLink}
                      onPress={() => {
                        const nextSlot = activeChatId === 'slot_1' ? 'slot_2' : 'slot_1';
                        setActiveChatId(nextSlot);
                        const targetMsgs = nextSlot === 'slot_1' ? chat1Messages : chat2Messages;
                        setShowLandingView(targetMsgs.length === 0);
                      }}
                    >
                      Switch to {activeChatId === 'slot_1' ? 'Chat 2' : 'Chat 1'}
                    </Text>
                  </Text>
                </View>
              )}
              <FlatList
                ref={flatListRef}
                style={{ flex: 1 }}
                data={activeMessages}
                renderItem={renderMessage}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                onContentSizeChange={scrollToBottom}
                showsVerticalScrollIndicator={false}
                ListFooterComponent={isLoading ? <GeminiTypingIndicator /> : null}
              />
            </>
          )}

          {/* ── Gemini Frosted Floating Input Bar ── */}
          <View
            style={[
              styles.inputWrapper,
              {
                paddingBottom: bottomInputPadding,
              },
            ]}
          >
            <View style={styles.glassInputCard}>
              {Platform.OS === 'web' ? (
                <View style={[StyleSheet.absoluteFill, styles.webGlassFill]} />
              ) : (
                <BlurView
                  intensity={Platform.OS === 'ios' ? 65 : 35}
                  tint="light"
                  style={StyleSheet.absoluteFill}
                />
              )}
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.92)', 'rgba(255, 249, 244, 0.85)']}
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
                  placeholder={
                    t('language') === 'hi'
                      ? 'कृष्ण से कुछ भी पूछें...'
                      : 'Ask My Krishn anything...'
                  }
                  placeholderTextColor="rgba(120, 80, 50, 0.45)"
                  value={inputText}
                  onChangeText={setInputText}
                  multiline
                  maxLength={600}
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
                    pressed && { opacity: 0.8, transform: [{ scale: 0.94 }] },
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
                      <Ionicons name="arrow-up" size={18} color="#FFF" />
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
          {Platform.OS === 'android' && (
            <View
              style={{
                height: keyboardVisible ? keyboardHeight + insets.bottom + 8 : 0,
              }}
            />
          )}
        </KeyboardAvoidingView>

        {/* ── Gemini Chat History Modal ── */}
        <Modal
          visible={historyModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setHistoryModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={() => setHistoryModalVisible(false)}
            />
            <View
              style={[
                styles.modalSheet,
                { paddingBottom: Math.max(insets.bottom, 16) },
              ]}
            >
              {/* Sheet Drag Handle */}
              <View style={styles.sheetHandle} />

              {/* Sheet Header */}
              <View style={styles.sheetHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name="time" size={22} color="#EA580C" />
                  <Text style={styles.sheetTitle}>Chat History</Text>
                </View>
                <Pressable
                  onPress={() => setHistoryModalVisible(false)}
                  style={styles.sheetCloseBtn}
                >
                  <Ionicons name="close" size={20} color="#4A3B32" />
                </Pressable>
              </View>

              {/* Search Bar in History */}
              {historyUserQueries.length > 0 && (
                <View style={styles.historySearchWrapper}>
                  <Ionicons name="search" size={16} color="#A88B79" style={{ marginRight: 8 }} />
                  <TextInput
                    style={styles.historySearchInput}
                    placeholder="Search past questions..."
                    placeholderTextColor="#A88B79"
                    value={historySearchTerm}
                    onChangeText={setHistorySearchTerm}
                  />
                  {historySearchTerm.length > 0 && (
                    <Pressable onPress={() => setHistorySearchTerm('')}>
                      <Ionicons name="close-circle" size={16} color="#A88B79" />
                    </Pressable>
                  )}
                </View>
              )}

              {/* History List */}
              {filteredHistory.length === 0 ? (
                <View style={styles.emptyHistoryContainer}>
                  <Ionicons name="chatbubbles-outline" size={48} color="#D8C2B3" />
                  <Text style={styles.emptyHistoryTitle}>
                    {historyUserQueries.length === 0
                      ? 'No Chat History Yet'
                      : 'No Matching Conversations'}
                  </Text>
                  <Text style={styles.emptyHistorySubtitle}>
                    {historyUserQueries.length === 0
                      ? 'Ask your questions to My Krishn to build your spiritual dialogue history.'
                      : 'Try searching with different keywords.'}
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={filteredHistory}
                  keyExtractor={(item) => item.id}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.historyListContent}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.historyCard}
                      activeOpacity={0.7}
                      onPress={() => {
                        setHistoryModalVisible(false);
                        setShowLandingView(false);
                      }}
                    >
                      <View style={styles.historyCardTop}>
                        <Text style={styles.historyQueryText} numberOfLines={2}>
                          {item.query}
                        </Text>
                        <Text style={styles.historyCardTime}>
                          {formatTimeAgo(item.timestamp)}
                        </Text>
                      </View>
                      {item.answer && (
                        <Text style={styles.historyAnswerSnippet} numberOfLines={2}>
                          {item.answer}
                        </Text>
                      )}
                    </TouchableOpacity>
                  )}
                />
              )}

              {/* Clear History Button in Sheet */}
              {historyUserQueries.length > 0 && (
                <TouchableOpacity
                  style={styles.sheetClearBtn}
                  onPress={handleClearChat}
                >
                  <Ionicons name="trash-outline" size={16} color="#DC2626" />
                  <Text style={styles.sheetClearBtnText}>Clear All Conversations</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Modal>
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
    paddingHorizontal: 12,
    zIndex: 100,
    backgroundColor: '#FFF1E6',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(234, 88, 12, 0.12)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBtn: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
  },
  headerTitleGroup: {
    marginLeft: 4,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  headerTitleText: {
    color: '#1E1B18',
    fontSize: 17,
    fontFamily: FONTS.bold,
    fontWeight: '700',
  },
  // PONYTAIL FIX: Removed unused geminiSparkleBadge and geminiSparkleText

  // Gemini Dropdown Menu
  menuDropdown: {
    position: 'absolute',
    right: 16,
    width: 190,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    zIndex: 999,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 10,
  },
  menuItemText: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: '#2D241E',
  },
  menuDivider: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
    marginVertical: 4,
  },

  // Gemini Landing View (Zero message state)
  geminiLandingContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'android' ? 110 : 80,
    alignItems: 'center',
  },
  geminiGreetingContainer: {
    alignItems: 'center',
    marginBottom: 24,
    width: '100%',
  },
  avatarGlowLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(234, 88, 12, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 4,
  },
  geminiHeroAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  geminiGreetingTitle: {
    fontSize: 26,
    fontFamily: FONTS.bold,
    fontWeight: '700',
    color: '#1E1B18',
    textAlign: 'center',
    marginBottom: 4,
    letterSpacing: -0.4,
  },
  geminiSparkleSubtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  geminiSparkleSubtitleText: {
    fontSize: 13.5,
    fontFamily: FONTS.medium,
    color: '#D97706',
    fontWeight: '600',
  },

  // Daily Divine Quote (Background Free)
  quoteCardContainer: {
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  geminiQuoteText: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: '#92400E',
    textAlign: 'center',
    lineHeight: 20,
    fontStyle: 'italic',
    fontWeight: '500',
  },
  cursor: {
    color: '#EA580C',
    fontWeight: '400',
  },

  // Gemini Suggestion Cards Grid
  geminiCardsGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  geminiCard: {
    width: (SCREEN_WIDTH - 50) / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.90)',
    borderRadius: 18,
    padding: 13,
    borderWidth: 1,
    borderColor: 'rgba(234, 88, 12, 0.15)',
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    justifyContent: 'space-between',
    minHeight: 96,
  },
  geminiCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  geminiCardIconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(234, 88, 12, 0.10)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  geminiCardText: {
    fontSize: 12.5,
    fontFamily: FONTS.medium,
    color: '#2E2219',
    lineHeight: 17,
  },
  // PONYTAIL FIX: Step 6.4 - Limit Warning Banner Styles
  limitWarningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF1EB',
    borderWidth: 1,
    borderColor: '#FED7AA',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    gap: 8,
  },
  limitWarningText: {
    flex: 1,
    fontSize: 12.5,
    fontFamily: FONTS.regular,
    color: '#9A3412',
    lineHeight: 18,
  },
  limitWarningLink: {
    fontFamily: FONTS.bold,
    fontWeight: '700',
    color: '#EA580C',
    textDecorationLine: 'underline',
  },

  // Messages Stream
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'android' ? 110 : 80,
  },
  dateDivider: {
    alignSelf: 'center',
    marginVertical: 14,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(234, 88, 12, 0.12)',
  },
  dateDividerText: {
    color: 'rgba(120, 80, 50, 0.7)',
    fontSize: 11,
    fontFamily: FONTS.medium,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 16,
    maxWidth: '90%',
  },
  userRow: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  assistantRow: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  assistantAvatarWrapper: {
    marginTop: 2,
    marginRight: 8,
  },
  assistantAvatarImage: {
    width: 30,
    height: 30,
    borderRadius: 15,
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
    shadowOpacity: 0.22,
    shadowRadius: 6,
  },
  assistantBubble: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    shadowColor: 'transparent',
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
    paddingHorizontal: 4,
    paddingVertical: 4,
    maxWidth: SCREEN_WIDTH - 76,
  },
  aiSenderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  aiSenderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  aiSenderText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EA580C',
    fontFamily: FONTS.bold,
  },
  copyActionBtn: {
    padding: 2,
  },
  messageText: {
    fontSize: 15,
    fontFamily: FONTS.medium,
    lineHeight: 22,
  },
  userText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  assistantText: {
    color: '#241B15',
    fontWeight: '400',
  },
  messageFooter: {
    marginTop: 5,
    alignSelf: 'flex-end',
  },
  timestamp: {
    fontSize: 10,
  },
  userTimestamp: {
    color: 'rgba(255, 255, 255, 0.85)',
  },
  assistantTimestamp: {
    color: 'rgba(140, 95, 65, 0.65)',
  },

  // Gemini Typing Indicator
  geminiTypingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  geminiAvatarGlow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(234, 88, 12, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  geminiTypingAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  geminiTypingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingHorizontal: 4,
    paddingVertical: 6,
    borderWidth: 0,
    shadowColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
  },
  geminiTypingText: {
    fontSize: 12.5,
    color: '#8A5D3B',
    fontFamily: FONTS.medium,
    marginRight: 6,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  geminiDot: {
    width: 4.5,
    height: 4.5,
    borderRadius: 2.25,
    backgroundColor: '#EA580C',
  },

  // Gemini Frosted Input Bar
  inputWrapper: {
    paddingHorizontal: 16,
    paddingTop: 6,
  },
  glassInputCard: {
    width: '100%',
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    overflow: 'hidden',
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 4,
    backgroundColor:
      Platform.OS === 'android'
        ? 'rgba(255, 255, 255, 0.95)'
        : 'rgba(255, 255, 255, 0.75)',
  },
  webGlassFill: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    ...({ backdropFilter: 'blur(20px)' } as any),
  },
  inputInnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 14,
    paddingRight: 8,
    paddingVertical: 6,
    minHeight: 52,
  },
  // PONYTAIL FIX: Removed unused inputLeftIcon
  krishnaLogoImage: {
    width: 28,
    height: 28,
    borderRadius: 14,
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
    width: 38,
    height: 38,
    borderRadius: 19,
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
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnInactiveCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Modal / Sheet Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    minHeight: '45%',
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    alignSelf: 'center',
    marginBottom: 12,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    fontWeight: '700',
    color: '#1E1B18',
  },
  sheetCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  historySearchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F4F0',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 14,
  },
  historySearchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1E1B18',
    fontFamily: FONTS.medium,
    padding: 0,
  },
  historyListContent: {
    paddingBottom: 16,
    gap: 10,
  },
  historyCard: {
    backgroundColor: '#FAF6F2',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
  },
  historyCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  historyQueryText: {
    flex: 1,
    fontSize: 14,
    fontFamily: FONTS.bold,
    fontWeight: '600',
    color: '#261C16',
    marginRight: 8,
  },
  historyCardTime: {
    fontSize: 11,
    color: '#A88B79',
    fontFamily: FONTS.medium,
  },
  historyAnswerSnippet: {
    fontSize: 12.5,
    color: '#6E5545',
    fontFamily: FONTS.regular,
    lineHeight: 17,
  },
  emptyHistoryContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyHistoryTitle: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    fontWeight: '600',
    color: '#3B2E26',
    marginTop: 12,
    marginBottom: 6,
  },
  emptyHistorySubtitle: {
    fontSize: 13,
    color: '#8A7060',
    fontFamily: FONTS.medium,
    textAlign: 'center',
    lineHeight: 18,
  },
  sheetClearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    marginTop: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(220, 38, 38, 0.08)',
  },
  sheetClearBtnText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#DC2626',
    fontFamily: FONTS.medium,
  },
});