import React, { useEffect, useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Animated,
  Easing,
} from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, SPACING, BORDER_RADIUS } from '../src/constants/theme';

const geetaCover = require('../assets/images/Bhagvad-geeta.jpg');
const ramcharitmanasCover = require('../assets/images/Ramcharitmanas.jpg');
const atharvavedCover = require('../assets/images/Atharva veda .jpg');
const mahabharataCover = require('../assets/images/mahabharata.jpg');
const rigvedaCover = require('../assets/images/Rigveda.jpg');
const ramayanCover = require('../assets/images/Ramayan-hardcover-front-scaled.jpg');
const yajurvedaCover = require('../assets/images/Yajurveda.jpg');

const categories = [
  'Science',
  'Magazine',
  'Story',
  'History',
  'General',
  'Lifestyle',
];

const books = [
  {
    id: 'geeta',
    title: 'Bhagvad Geeta',
    label: 'M. Krishna',
    details: '18 Chapters',
    cover: geetaCover,
    bgColor: '#FFF1DA',
    route: '/library/bhagvad-geeta',
  },
  {
    id: 'ramcharitmanas',
    title: 'Ramcharitmanas',
    label: 'Tulsidas',
    details: '7 Kands',
    cover: ramcharitmanasCover,
    bgColor: '#E9F5FF',
    route: '/library/ramcharitmanas',
  },
  {
    id: 'atharvaved',
    title: 'Atharvaved',
    label: 'Atharvaved',
    details: '20 Kaandas',
    cover: atharvavedCover,
    bgColor: '#F7E8FF',
    route: '/library/atharvaved',
  },
  {
    id: 'mahabharata',
    title: 'Mahabharata',
    label: 'Vyasa',
    details: '18 Books',
    cover: mahabharataCover,
    bgColor: '#FFF5E5',
    route: '/library/mahabharata',
  },
  {
    id: 'ramayan',
    title: 'Ramayan',
    label: 'Valmiki',
    details: '7 Kaands',
    cover: ramayanCover,
    bgColor: '#FFD8A8',
    route: '/library/ramayan',
  },
  {
    id: 'yajurveda',
    title: 'Yajurveda',
    label: 'Yajurveda',
    details: '40 Chapters',
    cover: yajurvedaCover,
    bgColor: '#FFE7D6',
    route: '/library/yajurveda',
  },
  {
    id: 'rigveda',
    title: 'Rigveda',
    label: 'Rigveda',
    details: '10 Mandalas',
    cover: rigvedaCover,
    bgColor: '#E7FBEF',
    route: '/library/rigveda',
  },
];

const LibraryPage = () => {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const scrollAnim = useRef(new Animated.Value(0)).current;
  const flowingText = 'Know about your culture.';
  const letters = [...flowingText];
  const repeatedLetters = new Array(12).fill(letters).flat();

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(scrollAnim, {
        toValue: 1,
        duration: 22000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    animation.start();
    return () => animation.stop();
  }, [scrollAnim]);

  const translateY = scrollAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -920],
  });

  const filteredBooks = books.filter((book) =>
    book.title.toLowerCase().includes(query.trim().toLowerCase()),
  );

  const renderHighlightedTitle = (title: string, queryText: string) => {
    const normalizedQuery = queryText.trim().toLowerCase();
    if (!normalizedQuery) {
      return <Text style={styles.bookCardTitle}>{title}</Text>;
    }

    const normalizedTitle = title.toLowerCase();
    const parts = [] as Array<{ text: string; highlight: boolean }>;
    let lastIndex = 0;
    let matchIndex = normalizedTitle.indexOf(normalizedQuery, lastIndex);

    while (matchIndex !== -1) {
      if (matchIndex > lastIndex) {
        parts.push({ text: title.slice(lastIndex, matchIndex), highlight: false });
      }
      parts.push({
        text: title.slice(matchIndex, matchIndex + normalizedQuery.length),
        highlight: true,
      });
      lastIndex = matchIndex + normalizedQuery.length;
      matchIndex = normalizedTitle.indexOf(normalizedQuery, lastIndex);
    }

    if (lastIndex < title.length) {
      parts.push({ text: title.slice(lastIndex), highlight: false });
    }

    return (
      <Text style={styles.bookCardTitle}>
        {parts.map((part, index) => (
          <Text
            key={`${part.text}-${index}`}
            style={part.highlight ? styles.highlightText : undefined}
          >
            {part.text}
          </Text>
        ))}
      </Text>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.sidebar}>
        <View style={styles.sidebarTextWrapper}>
          <Animated.View style={[styles.sidebarTextContent, { transform: [{ translateY }] }]}> 
            {repeatedLetters.map((letter, index) => (
              <Text key={`${letter}-${index}`} style={styles.sidebarLetter}>
                {letter}
              </Text>
            ))}
          </Animated.View>
        </View>
      </View>

      <View style={styles.header}>
        <View style={styles.searchBar}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search book name"
            placeholderTextColor={COLORS.textSecondary}
            style={styles.searchInput}
            returnKeyType="search"
          />
        </View>
      </View>

      <View style={styles.container}>
        <ScrollView
          style={styles.booksList}
          contentContainerStyle={styles.booksListContent}
          showsVerticalScrollIndicator={false}
        >
          {filteredBooks.map((book) => (
            <TouchableOpacity
              key={book.id}
              style={[styles.bookCard, { backgroundColor: book.bgColor }]}
              activeOpacity={0.9}
              onPress={() => router.push(book.route as any)}
            >
              <View style={styles.bookCardContent}>
                <View style={styles.bookTextBlock}>
                  {renderHighlightedTitle(book.title, query)}
                  <Text style={styles.bookCardLabel}>{book.label}</Text>
                  <Text style={styles.bookCardDetails}>{book.details}</Text>
                </View>
                <Image source={book.cover} style={styles.bookImage} resizeMode="cover" />
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingLeft: 56,
    paddingRight: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.sm,
    backgroundColor: COLORS.background,
  },
  searchBar: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: {
    color: COLORS.text,
    fontSize: 16,
    padding: 0,
    minHeight: 36,
  },
  container: {
    flex: 1,
    marginLeft: 56,
    paddingRight: SPACING.md,
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: 36,
    backgroundColor: '#111111',
    borderTopRightRadius: BORDER_RADIUS.xxl,
    borderBottomRightRadius: BORDER_RADIUS.xxl,
    paddingVertical: SPACING.md,
    paddingHorizontal: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  sidebarTextWrapper: {
    width: 36,
    flex: 1,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  sidebarTextContent: {
    transform: [{ translateY: 0 }],
  },
  sidebarLetter: {
    color: COLORS.textWhite,
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    letterSpacing: 0.6,
  },
  highlightText: {
    backgroundColor: '#FFF59D',
    color: COLORS.text,
  },
  booksList: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  booksListContent: {
    paddingBottom: SPACING.lg,
  },
  bookCard: {
    width: '100%',
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    minHeight: 160,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  bookCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bookTextBlock: {
    flex: 1,
    paddingRight: SPACING.sm,
  },
  bookCardTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: SPACING.xs,
  },
  bookCardLabel: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginBottom: SPACING.xs,
  },
  bookCardDetails: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '700',
  },
  bookImage: {
    width: 106,
    height: 140,
    borderRadius: BORDER_RADIUS.lg,
    marginLeft: SPACING.sm,
    backgroundColor: COLORS.border,
  },
});

export default LibraryPage;
