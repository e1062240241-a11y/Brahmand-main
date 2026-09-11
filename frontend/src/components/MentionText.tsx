import React, { useCallback } from 'react';
import { Text, StyleSheet, StyleProp, TextStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { searchUserBySLId } from '../services/api';

interface MentionTextProps {
  text: string;
  style?: StyleProp<TextStyle>;
  mentionStyle?: StyleProp<TextStyle>;
  numberOfLines?: number;
}

/**
 * 🎨 Varnish Code Quality & Performance Fix:
 * 1. Wrapped component in `React.memo` to eliminate unnecessary re-renders inside comment lists.
 * 2. Replaced `any` types on `style` and `mentionStyle` with `StyleProp<TextStyle>`.
 * 3. Replaced nested `<TouchableOpacity>` inside `<Text>` with native inline `<Text onPress={...}>` to eliminate layout/wrapping glitches in React Native text flows.
 * 4. Extracted default mention text styles to `StyleSheet.create` to eliminate dynamic inline style allocations inside `.map()`.
 */
export const MentionText = React.memo(({ text, style, mentionStyle, numberOfLines }: MentionTextProps) => {
  const router = useRouter();

  const handleMentionPress = useCallback(async (username: string) => {
    try {
      const res = await searchUserBySLId(username);
      const user = res.data;
      if (user?.id) {
        router.push(`/profile/${user.id}`);
      }
    } catch {
      // Silently catch error
    }
  }, [router]);

  if (!text) return null;

  const parts = text.split(/(@\w+)/g);
  const elements = parts.map((part, i) => {
    if (part.startsWith('@') && part.length > 1) {
      const username = part.slice(1);
      return (
        <Text
          key={i}
          style={[styles.defaultMention, mentionStyle]}
          onPress={() => handleMentionPress(username)}
          accessibilityRole="link"
          accessibilityLabel={`View profile of ${username}`}
        >
          {part}
        </Text>
      );
    }
    return <Text key={i}>{part}</Text>;
  });

  return (
    <Text style={style} numberOfLines={numberOfLines}>
      {elements}
    </Text>
  );
});

MentionText.displayName = 'MentionText';

const styles = StyleSheet.create({
  defaultMention: {
    color: '#8C36DB',
    fontWeight: '600',
  },
});
