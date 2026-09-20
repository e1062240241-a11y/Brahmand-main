import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, Alert, TouchableOpacity } from 'react-native';
import { KeyboardAwareScrollView } from '../../src/components/KeyboardAwareScrollView';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../src/components/Button';
import { usePassportStore } from '../../src/store/passportStore';
import { useLanguageStore } from '../../src/utils/i18n';
import withObservables from '@nozbe/with-observables';
import { database } from '../../src/database';
import { COLORS, SPACING, BORDER_RADIUS } from '../../src/constants/theme';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

function PassportProgressScreen({
  observedBadges = [],
  observedCertificates = [],
}: {
  observedBadges?: any[];
  observedCertificates?: any[];
}) {
  const router = useRouter();
  const loadPassport = usePassportStore((state) => state.loadPassport);
  const totalJaap = usePassportStore((state) => state.total_jaap);
  const booksCompleted = usePassportStore((state) => state.books_completed);
  const badges = observedBadges;
  const certificates = observedCertificates;
  const addJaap = usePassportStore((state) => state.addJaap);
  const completeBook = usePassportStore((state) => state.completeBook);
  const awardBadge = usePassportStore((state) => state.awardBadge);
  const language = useLanguageStore((state) => state.language);

  const [jaapInput, setJaapInput] = useState('108');
  const [bookName, setBookName] = useState('');
  const [completionDays, setCompletionDays] = useState('30');

  useFocusEffect(
    useCallback(() => {
      loadPassport();
    }, [loadPassport])
  );

  const handleAddJaap = async () => {
    const count = parseInt(jaapInput, 10);
    if (!count || count <= 0) {
      Alert.alert('Invalid count', 'Please enter a valid number of malas.');
      return;
    }
    await addJaap(count);
    if (count >= 108) {
      await awardBadge('First Jaap Milestone', 'Completed a full mala cycle');
    }
    Alert.alert('Jaap saved', 'Your jaap progress has been updated.');
    setJaapInput('108');
  };

  const handleCompleteBook = async () => {
    if (!bookName.trim()) {
      Alert.alert('Missing book', 'Please enter the book name.');
      return;
    }
    const days = parseInt(completionDays, 10) || 0;
    const trimmedBookName = bookName.trim();
    await completeBook(trimmedBookName, days, new Date().toISOString().slice(0, 10));
    await awardBadge(trimmedBookName, `Completed reading ${trimmedBookName}`);
    if (booksCompleted === 0) {
      await awardBadge('First Book Completion', `Completed ${trimmedBookName}`);
    }
    Alert.alert('Certificate created', `${trimmedBookName} has been marked complete.`);
    setBookName('');
    setCompletionDays('30');
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/passport/inner' as any);
    }
  };

  return (
    <LinearGradient
      colors={['#FF8D57', '#EA9B76', '#FFEEE5']}
      locations={[0, 0.0913, 0.25]}
      style={styles.container}
    >
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right', 'bottom']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="chevron-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {language === 'hi' ? 'पासपोर्ट प्रगति' : 'Passport Progress'}
          </Text>
        </View>

        <KeyboardAwareScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.subtitle}>
            {language === 'hi'
              ? 'जाप, सम्मान और अध्ययन उपलब्धियों को तुरंत अपडेट करें।'
              : 'Update jaap, awards and reading achievements instantly.'}
          </Text>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{totalJaap}</Text>
              <Text style={styles.statLabel}>{language === 'hi' ? 'कुल जाप' : 'Total Jaap'}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{booksCompleted}</Text>
              <Text style={styles.statLabel}>{language === 'hi' ? 'ग्रंथ' : 'Books'}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{badges.length}</Text>
              <Text style={styles.statLabel}>{language === 'hi' ? 'बैज' : 'Badges'}</Text>
            </View>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>{language === 'hi' ? 'जाप पूर्ण करें' : 'Complete Jaap'}</Text>
            <TextInput
              style={styles.input}
              value={jaapInput}
              onChangeText={setJaapInput}
              keyboardType="number-pad"
              placeholder={language === 'hi' ? 'मालाएं (उदा. 108)' : '108'}
              placeholderTextColor={COLORS.textSecondary}
            />
            <Button title={language === 'hi' ? 'जाप जोड़ें' : 'Add Jaap'} onPress={handleAddJaap} />
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>{language === 'hi' ? 'अध्ययन पूर्ण करें' : 'Complete Reading'}</Text>
            <TextInput
              style={styles.input}
              value={bookName}
              onChangeText={setBookName}
              placeholder={language === 'hi' ? 'ग्रंथ का नाम' : 'Book name'}
              placeholderTextColor={COLORS.textSecondary}
            />
            <TextInput
              style={styles.input}
              value={completionDays}
              onChangeText={setCompletionDays}
              keyboardType="number-pad"
              placeholder={language === 'hi' ? 'दिनों की संख्या' : 'Completion days'}
              placeholderTextColor={COLORS.textSecondary}
            />
            <Button title={language === 'hi' ? 'प्रमाणपत्र बनाएं' : 'Create Certificate'} onPress={handleCompleteBook} />
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>{language === 'hi' ? 'बैज' : 'Badges'}</Text>
            {badges.length === 0 ? (
              <Text style={styles.emptyText}>
                {language === 'hi'
                  ? 'अभी कोई बैज नहीं है। अपनी पहली यात्रा, जाप पड़ाव या ग्रंथ पूरा करें 🙏'
                  : 'No badges yet. Complete your first journey, jaap milestone, or book.'}
              </Text>
            ) : (
              badges.map((badge) => (
                <View key={badge.id} style={styles.badgeRow}>
                  <Text style={styles.badgeTitle}>{badge.title}</Text>
                  <Text style={styles.badgeDescription}>{badge.description}</Text>
                </View>
              ))
            )}
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>{language === 'hi' ? 'प्रमाणपत्र' : 'Certificates'}</Text>
            {certificates.length === 0 ? (
              <Text style={styles.emptyText}>
                {language === 'hi'
                  ? 'अभी कोई प्रमाणपत्र नहीं है। एक अध्ययन पूरा करके प्रमाणपत्र प्राप्त करें ✨'
                  : 'No certificates yet. Complete a reading to generate one.'}
              </Text>
            ) : (
              certificates.map((certificate: any) => (
                <TouchableOpacity 
                  key={certificate.id} 
                  style={styles.certificateRow}
                  activeOpacity={0.7}
                  onPress={() => router.push(`/passport/certificate/${certificate.id}` as any)}
                >
                  <Text style={styles.certificateTitle}>{certificate.bookName || certificate.book_name}</Text>
                  <Text style={styles.certificateMeta}>{(certificate.completionDays || certificate.completion_days)} days • {certificate.date && !isNaN(new Date(certificate.date).getTime()) ? new Date(certificate.date).toDateString() : String(certificate.date || '')}</Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        </KeyboardAwareScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    height: 56,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#000',
    marginLeft: SPACING.sm,
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: SPACING.xs,
  },
  subtitle: {
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginRight: SPACING.sm,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: SPACING.xs,
  },
  statLabel: {
    color: COLORS.textSecondary,
  },
  sectionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: SPACING.sm,
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  emptyText: {
    color: COLORS.textSecondary,
  },
  badgeRow: {
    marginBottom: SPACING.sm,
  },
  badgeTitle: {
    fontWeight: '700',
  },
  badgeDescription: {
    color: COLORS.textSecondary,
  },
  certificateRow: {
    marginBottom: SPACING.sm,
  },
  certificateTitle: {
    fontWeight: '700',
  },
  certificateMeta: {
    color: COLORS.textSecondary,
  },
});

const enhance = withObservables([], () => ({
  observedBadges: database.get('passport_badges').query().observe(),
  observedCertificates: database.get('passport_certificates').query().observe(),
}));

export default enhance(PassportProgressScreen);
