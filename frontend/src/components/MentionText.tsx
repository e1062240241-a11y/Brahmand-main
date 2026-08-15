import React, { useCallback } from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { searchUserBySLId } from '../services/api';

interface MentionTextProps {
  text: string;
  style?: any;
  mentionStyle?: any;
  numberOfLines?: number;
}

export const MentionText = ({ text, style, mentionStyle, numberOfLines }: MentionTextProps) => {
  const router = useRouter();

  const handleMentionPress = useCallback(async (username: string) => {
    try {
      const res = await searchUserBySLId(username);
      const user = res.data;
      if (user?.id) {
        router.push(`/profile/${user.id}`);
      }
    } catch {}
  }, [router]);

  if (!text) return null;

  const parts = text.split(/(@\w+)/g);
  const elements = parts.map((part, i) => {
    if (part.startsWith('@') && part.length > 1) {
      const username = part.slice(1);
      return (
        <TouchableOpacity key={i} onPress={() => handleMentionPress(username)} accessibilityRole="link" accessibilityLabel={`View profile of ${username}`}>
          <Text style={[mentionStyle, { color: '#8C36DB', fontWeight: '600' }]}>{part}</Text>
        </TouchableOpacity>
      );
    }
    return <Text key={i}>{part}</Text>;
  });

  return (
    <Text style={style} numberOfLines={numberOfLines}>
      {elements}
    </Text>
  );
};
