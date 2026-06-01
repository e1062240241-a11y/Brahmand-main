import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ImageBackground,
  Animated,
  ScrollView,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { aiChat } from '../src/services/api';
import { FONTS } from '../src/constants/theme';
import { useAuthStore } from '../src/store/authStore';

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
      <View style={styles.assistantAvatar}>
        <Text style={{ fontSize: 18 }}>🪈</Text>
      </View>
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

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Radhe Radhe, ${displayName}! 🙏\n\nMain yahan hoon — tumhare dil ki baat sunne ke liye, Gita ki seekh share karne ke liye.\n\nAaj mann mein kya chal raha hai?`,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;

      setShowSuggestions(false);

      const userMsg: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: text.trim(),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setInputText('');
      setIsLoading(true);
      scrollToBottom();

      try {
        const apiMessages = [
          ...messages.map((m) => ({ role: m.role, content: m.content })),
          { role: userMsg.role, content: userMsg.content },
        ];

        const response = await aiChat(apiMessages);

        if (response.data?.choices?.[0]?.message) {
          const assistantMsg: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: response.data.choices[0].message.content || '',
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, assistantMsg]);
        }
      } catch (error) {
        console.error('Chat error:', error);
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
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
    [messages, isLoading, scrollToBottom]
  );

  const handleSend = () => sendMessage(inputText);
  const handleSuggestion = (text: string) => sendMessage(text);

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.role === 'user';
    return (
      <Animated.View
        style={[
          styles.messageRow,
          isUser ? styles.userRow : styles.assistantRow,
          { opacity: fadeAnim },
        ]}
      >
        {!isUser && (
          <View style={styles.assistantAvatar}>
            <Text style={{ fontSize: 18 }}>🪈</Text>
          </View>
        )}
        <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.assistantBubble]}>
          <Text style={[styles.messageText, isUser ? styles.userText : styles.assistantText]}>
            {item.content}
          </Text>
          <Text style={styles.timestamp}>
            {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </Animated.View>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <ImageBackground
        source={require('../assets/images/image temple/MahakalTemple.webp')}
        style={styles.container}
      >
        {/* Dark overlay */}
        <LinearGradient
          colors={['rgba(10, 15, 60, 0.92)', 'rgba(0,0,0,0.88)']}
          style={StyleSheet.absoluteFill}
        />

        <Stack.Screen options={{ headerShown: false }} />

        {/* ── Header ── */}
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={26} color="#FFF" />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <View style={styles.headerAvatarGlow}>
              <Text style={{ fontSize: 22 }}>🪈</Text>
            </View>
            <View>
              <Text style={styles.headerTitle}>My Krishna</Text>
              <Text style={styles.headerSub}>Bhagavad Gita se guided</Text>
            </View>
          </View>

          <View style={{ width: 40 }} />
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}
        >
          {/* ── Message List ── */}
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={[
              styles.listContent,
              { paddingTop: insets.top + 80 },
            ]}
            onContentSizeChange={scrollToBottom}
            showsVerticalScrollIndicator={false}
            ListFooterComponent={isLoading ? <TypingDots /> : null}
          />

          {/* ── Suggestions chips (only shown before first user message) ── */}
          {showSuggestions && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.suggestionsScroll}
              contentContainerStyle={styles.suggestionsContent}
            >
              {SUGGESTIONS.map((s, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.chip}
                  onPress={() => handleSuggestion(s)}
                >
                  <Text style={styles.chipText}>{s}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* ── Input Bar ── */}
          <View style={[styles.inputWrapper, { paddingBottom: Math.max(insets.bottom, 12) }]}>
            <View style={styles.inputContainer}>
              <TextInput
                ref={inputRef}
                style={styles.input}
                placeholder="Apna mann kholo..."
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={inputText}
                onChangeText={setInputText}
                multiline
                maxLength={500}
                returnKeyType="send"
                onSubmitEditing={handleSend}
              />
              <TouchableOpacity
                style={[styles.sendBtn, (!inputText.trim() || isLoading) && styles.sendBtnDisabled]}
                onPress={handleSend}
                disabled={!inputText.trim() || isLoading}
              >
                <Ionicons
                  name="send"
                  size={18}
                  color={inputText.trim() && !isLoading ? '#FFF' : 'rgba(255,255,255,0.25)'}
                />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </ImageBackground>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Header
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 10,
    zIndex: 100,
    backgroundColor: 'rgba(10, 15, 60, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,215,0,0.15)',
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerAvatarGlow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,215,0,0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,215,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFD700',
    shadowOpacity: 0.6,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  headerTitle: {
    color: '#FFD700',
    fontSize: 17,
    fontFamily: FONTS.bold,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  headerSub: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    fontFamily: FONTS.regular,
  },

  // Messages
  listContent: { paddingHorizontal: 14, paddingBottom: 12 },
  messageRow: { flexDirection: 'row', marginBottom: 14, maxWidth: '85%' },
  userRow: { alignSelf: 'flex-end', flexDirection: 'row-reverse' },
  assistantRow: { alignSelf: 'flex-start' },

  assistantAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,215,0,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.3)',
  },

  messageBubble: { padding: 12, borderRadius: 20 },
  userBubble: {
    backgroundColor: '#E65C00',
    borderTopRightRadius: 4,
    shadowColor: '#FF6A00',
    shadowOpacity: 0.4,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  assistantBubble: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.15)',
  },
  messageText: { fontSize: 15, fontFamily: FONTS.medium, lineHeight: 22 },
  userText: { color: '#FFF' },
  assistantText: { color: 'rgba(255,255,255,0.92)' },
  timestamp: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.35)',
    marginTop: 5,
    alignSelf: 'flex-end',
  },

  // Typing indicator
  typingRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 14, paddingHorizontal: 14 },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.15)',
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 4,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#FFD700',
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
    backgroundColor: 'rgba(255,215,0,0.12)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.3)',
  },
  chipText: {
    color: '#FFD700',
    fontSize: 12,
    fontFamily: FONTS.medium,
  },

  // Input
  inputWrapper: { paddingHorizontal: 12, paddingTop: 6 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 26,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.2)',
  },
  input: {
    flex: 1,
    color: '#FFF',
    fontFamily: FONTS.medium,
    fontSize: 15,
    maxHeight: 100,
    paddingVertical: 8,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E65C00',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  sendBtnDisabled: { backgroundColor: 'rgba(255,255,255,0.08)' },
});