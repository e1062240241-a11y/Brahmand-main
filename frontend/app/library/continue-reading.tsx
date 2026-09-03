import React, { useMemo } from 'react';
import {
  View, Text, StyleSheet, Image, TouchableOpacity,
  ScrollView, Platform, Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLibraryStore } from '../../src/store/libraryStore';
import { useTranslation } from '../../src/utils/i18n';
import { FONTS } from '../../src/constants/theme';

const { width: SW } = Dimensions.get('window');

const ORANGE = '#FF6B00';
const DARK   = '#1A1A1A';
const BROWN  = '#5A4136';
const CLAY   = '#8E7164';

export default function ContinueReadingPage() {
  const router   = useRouter();
  const insets   = useSafeAreaInsets();
  const { t }    = useTranslation();
  const { progresses } = useLibraryStore();

  const isHindi = t('language') === 'hi';

  const activeBooks = useMemo(() => {
    return Object.values(progresses || {})
      .filter(p => p.progressPercent > 0)
      .sort((a, b) => (b.lastOpenedTime || 0) - (a.lastOpenedTime || 0));
  }, [progresses]);

  const handleContinue = (bookId: string) => {
    // Map internal book ID to route path
    const routeMap: Record<string, string> = {
      'bhagvad-geeta': '/library/bhagavad-gita-3d',
      'ramcharitmanas': '/library/ramcharitmanas',
      'atharvaved': '/library/atharvaved',
      'rigveda': '/library/rigveda',
      'upanishads': '/library/upanishads',
      'mahabharata': '/library/mahabharata',
      'yajurveda': '/library/yajurveda',
      'ramayan': '/library/ramayan',
    };
    const route = routeMap[bookId] || `/library/${bookId}`;
    router.push(route as any);
  };

  const getBookCover = (bookId: string) => {
    // We can add actual cover images based on book ID later
    return { uri: 'https://brahmandfeed23.b-cdn.net/assets/featured_book_6.webp' };
  };

  const getBookTitle = (bookId: string) => {
    const titles: Record<string, string> = {
      'bhagvad-geeta': 'Bhagavad Gita',
      'ramcharitmanas': 'Ramcharitmanas',
      'atharvaved': 'Atharvaveda',
      'rigveda': 'Rigveda',
      'upanishads': 'Upanishads',
      'mahabharata': 'Mahabharata',
      'yajurveda': 'Yajurveda',
      'ramayan': 'Ramayan',
    };
    return titles[bookId] || bookId;
  };

  return (
    <View style={s.root}>
      {/* ── Orange Gradient Header ── */}
      <LinearGradient
        colors={['#F08A5D', '#F6A56F', '#FBBF8A']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={[s.header, { paddingTop: insets.top + 10 }]}
      >
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#3D1A00" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>{isHindi ? 'पढ़ना जारी रखें' : 'Continue Reading'}</Text>
        <View style={s.headerRight} />
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 48 + insets.bottom }}>
        {activeBooks.length === 0 ? (
          <View style={s.emptyState}>
            <Ionicons name="book-outline" size={64} color={CLAY} style={{ marginBottom: 16 }} />
            <Text style={s.emptyStateTitle}>
              {isHindi ? 'अभी कोई पुस्तक आरंभ नहीं की' : 'No books in progress'}
            </Text>
            <Text style={s.emptyStateSub}>
              {isHindi
                ? 'श्रीमद्भगवद्गीता या अन्य पवित्र ग्रंथों से अपनी आध्यात्मिक यात्रा आरंभ करें 🙏'
                : 'Begin your spiritual journey with Srimad Bhagavad Gita or sacred scriptures 🙏'}
            </Text>
            <TouchableOpacity
              style={s.startReadingBtn}
              onPress={() => router.push('/library' as any)}
              accessibilityRole="button"
              accessibilityLabel={isHindi ? 'पवित्र ग्रंथ पढ़ें' : 'Explore Sacred Scriptures'}
            >
              <Text style={s.startReadingTxt}>
                {isHindi ? 'पवित्र ग्रंथ पढ़ें 📖' : 'Explore Sacred Scriptures 📖'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={s.listContainer}>
            {activeBooks.map((book) => (
              <View key={book.id} style={s.card}>
                <View style={s.cardTop}>
                  <Image source={getBookCover(book.id)} style={s.coverImage} resizeMode="cover" />
                  <View style={s.bookInfo}>
                    <Text style={s.bookTitle}>{getBookTitle(book.id)}</Text>
                    <Text style={s.chapterTitle}>{book.chapterName || `Chapter ${book.chapterNum}`}</Text>

                    <View style={s.progressContainer}>
                      <View style={s.progressTrack}>
                        <View style={[s.progressFill, { width: `${book.progressPercent}%` }]} />
                      </View>
                      <Text style={s.progressText}>{Math.round(book.progressPercent)}%</Text>
                    </View>
                  </View>
                </View>

                <TouchableOpacity
                  style={s.continueBtn}
                  onPress={() => handleContinue(book.id)}
                  accessibilityRole="button"
                  accessibilityLabel={isHindi ? 'पढ़ना जारी रखें' : 'Continue Reading'}
                >
                  <Text style={s.continueBtnTxt}>{isHindi ? 'पढ़ना जारी रखें' : 'Continue Reading'}</Text>
                  <Ionicons name="arrow-forward" size={16} color="#FFF" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F9F6F0' },

  /* HEADER */
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 14,
    shadowColor: '#C05000', shadowOpacity: 0.20,
    shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 6,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.35)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: {
    flex: 1, textAlign: 'center',
    fontSize: 18, fontWeight: '700',
    color: '#3D1A00',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    letterSpacing: 0.2,
  },
  headerRight: { width: 40 },

  /* EMPTY STATE */
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    marginTop: 100,
  },
  emptyStateTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: DARK,
    fontFamily: FONTS.bold,
    marginBottom: 8,
  },
  emptyStateSub: {
    fontSize: 16,
    color: BROWN,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    marginBottom: 24,
  },
  startReadingBtn: {
    backgroundColor: ORANGE,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  startReadingTxt: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },

  /* LIST CONTAINER */
  listContainer: {
    padding: 16,
    paddingTop: 24,
    gap: 16,
  },

  /* CARD */
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  cardTop: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  coverImage: {
    width: 70,
    height: 100,
    borderRadius: 8,
  },
  bookInfo: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  bookTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: DARK,
    fontFamily: FONTS.bold,
    marginBottom: 4,
  },
  chapterTitle: {
    fontSize: 14,
    color: BROWN,
    fontFamily: FONTS.regular,
    marginBottom: 12,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressTrack: {
    flex: 1,
    height: 6,
    backgroundColor: '#EAEAEA',
    borderRadius: 3,
    marginRight: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: ORANGE,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: ORANGE,
    fontFamily: FONTS.semiBold,
    width: 32,
  },
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF2EB',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFD7C2',
  },
  continueBtnTxt: {
    fontSize: 15,
    fontWeight: '600',
    color: ORANGE,
    fontFamily: FONTS.semiBold,
    marginRight: 8,
  },
});
