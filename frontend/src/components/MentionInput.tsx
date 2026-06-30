import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Platform,
  Keyboard,
} from 'react-native';
import { Avatar } from './Avatar';
import { getAllUsers } from '../services/api';

interface MentionUser {
  id: string;
  name?: string;
  sl_id?: string;
  phone?: string;
  photo?: string;
}

interface MentionInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  placeholderTextColor?: string;
  multiline?: boolean;
  style?: any;
  inputStyle?: any;
  editable?: boolean;
  autoFocus?: boolean;
  disableMentions?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
}

export const MentionInput = ({
  value,
  onChangeText,
  placeholder = '',
  placeholderTextColor = '#8A7B89',
  multiline = false,
  style,
  inputStyle,
  editable = true,
  autoFocus = false,
  disableMentions = false,
  onFocus,
  onBlur,
}: MentionInputProps) => {
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionResults, setMentionResults] = useState<MentionUser[]>([]);
  const [showMentions, setShowMentions] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const inputRef = useRef<TextInput>(null);
  const searchTimeout = useRef<any>(null);

  const findMention = useCallback((text: string, cursorPos: number) => {
    const beforeCursor = text.slice(0, cursorPos);
    const atIndex = beforeCursor.lastIndexOf('@');
    if (atIndex === -1) {
      setShowMentions(false);
      return;
    }
    const textAfterAt = beforeCursor.slice(atIndex + 1);
    if (/\s/.test(textAfterAt)) {
      setShowMentions(false);
      return;
    }
    setMentionQuery(textAfterAt);
    return atIndex;
  }, []);

  const handleChangeText = useCallback((text: string) => {
    onChangeText(text);
    if (disableMentions) return;
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    const cursorPos = text.length;
    const atIndex = text.lastIndexOf('@', cursorPos);
    if (atIndex === -1) { setShowMentions(false); return; }
    const textAfterAt = text.slice(atIndex + 1, cursorPos);
    if (/\s/.test(textAfterAt)) { setShowMentions(false); return; }
    setMentionQuery(textAfterAt);
    searchTimeout.current = setTimeout(async () => {
      try {
        const res = await getAllUsers(textAfterAt, 10);
        const users = Array.isArray(res.data) ? res.data : res.data?.items || res.data?.users || [];
        setMentionResults(users.slice(0, 10));
        setShowMentions(users.length > 0);
      } catch { setShowMentions(false); }
    }, 300);
  }, [onChangeText, disableMentions]);

  const handleSelectMention = useCallback((user: MentionUser) => {
    const beforeCursor = value.slice(0, cursorPosition);
    const atIndex = beforeCursor.lastIndexOf('@');
    if (atIndex === -1) return;
    const mentionText = user.sl_id || user.phone || user.name || 'user';
    const newText = value.slice(0, atIndex) + `@${mentionText} ` + value.slice(cursorPosition);
    onChangeText(newText);
    setShowMentions(false);
    setMentionQuery('');
    inputRef.current?.focus();
  }, [value, cursorPosition, onChangeText]);

  const handleSelectionChange = useCallback((e: any) => {
    setCursorPosition(e.nativeEvent.selection.start);
  }, []);

  return (
    <View style={[styles.container, style]}>
      {showMentions && mentionResults.length > 0 && !disableMentions && (
        <View style={styles.mentionDropdown}>
          {mentionResults.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.mentionItem}
              onPress={() => handleSelectMention(item)}
            >
              <Avatar name={item.name || 'U'} photo={item.photo} size={28} />
              <View style={styles.mentionItemText}>
                <Text style={styles.mentionName}>{item.name || 'Unknown'}</Text>
                <Text style={styles.mentionSL}>@{item.sl_id || item.phone || ''}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
      <TextInput
        ref={inputRef}
        style={[styles.input, inputStyle]}
        value={value}
        onChangeText={handleChangeText}
        onSelectionChange={handleSelectionChange}
        placeholder={placeholder}
        placeholderTextColor={placeholderTextColor}
        multiline={multiline}
        editable={editable}
        autoFocus={autoFocus}
        onFocus={onFocus}
        onBlur={onBlur}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    flex: 1,
  },
  input: {
    flex: 1,
  },
  mentionDropdown: {
    position: 'absolute',
    bottom: '100%',
    left: 0,
    right: 0,
    maxHeight: 200,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    overflow: 'hidden',
    zIndex: 9999, // Ensure it's on top
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: -2 },
      },
      android: { elevation: 8 },
    }),
  },
  mentionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F0F0F0',
  },
  mentionItemText: {
    marginLeft: 10,
    flex: 1,
  },
  mentionName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111',
  },
  mentionSL: {
    fontSize: 12,
    color: '#888',
    marginTop: 1,
  },
});
