import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Platform, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Button } from '../../../src/components/Button';
import { usePassportStore } from '../../../src/store/passportStore';
import { PassportAnswer, PassportMediaItem, PassportJourneyVisibility } from '../../../src/types/passport';
import { COLORS, SPACING, BORDER_RADIUS } from '../../../src/constants/theme';
import { createMediaItem } from '../../../src/services/passportService';

const questions = [
  'How did you travel to this place?',
  'What did you experience on the journey?',
  'How was the crowd during your visit?',
  'What did you eat and enjoy?',
  'Where did you stay and how was it?',
  'How was the weather and surroundings?',
  'What was the most meaningful moment?',
  'Any final thoughts from the journey?'
];

export default function NewPassportJourneyScreen() {
  const router = useRouter();
  const addJourney = usePassportStore((state) => state.addJourney);
  const awardBadge = usePassportStore((state) => state.awardBadge);
  const journeyCount = usePassportStore((state) => state.journeys.length);

  const [step, setStep] = useState(1);
  const [title, setTitle] = useState('My Spiritual Journey');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [visibility, setVisibility] = useState<PassportJourneyVisibility>('private');
  const [media, setMedia] = useState<PassportMediaItem[]>([]);
  const [answers, setAnswers] = useState<PassportAnswer[]>(questions.map((question) => ({ question, answer: '' })));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      ImagePicker.requestMediaLibraryPermissionsAsync().catch(() => {});
    }
  }, []);

  const handlePickMedia = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        quality: 0.8,
        selectionLimit: 5,
      });

      if (!result.canceled) {
        const picked = result.assets.map((asset) => createMediaItem(asset.uri, asset.type === 'video' ? 'video' : 'photo'));
        setMedia((current) => [...current, ...picked]);
      }
    } catch (error) {
      Alert.alert('Media Error', 'Could not pick media. Please try again.');
    }
  };

  const handleAnswerChange = (index: number, text: string) => {
    setAnswers((current) => current.map((item, idx) => idx === index ? { ...item, answer: text } : item));
  };

  const handleNext = () => {
    if (step === 1 && (!location.trim() || !title.trim())) {
      Alert.alert('Missing details', 'Please add a title and location before continuing.');
      return;
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    if (step === 1) {
      router.back();
      return;
    }
    setStep(step - 1);
  };

  const handleSave = async () => {
    if (!title.trim() || !location.trim()) {
      Alert.alert('Missing details', 'Please complete the journey title and location.');
      return;
    }

    setLoading(true);
    try {
      await addJourney({ title: title.trim(), location: location.trim(), date, media, answers, visibility });
      if (journeyCount === 0) {
        await awardBadge('First Journey', 'Created your first Brahmand Passport journey');
      }
      Alert.alert('Journey Saved', 'Your journey has been added to Brahmand Passport.');
      router.push('/passport/timeline' as any);
    } catch (error) {
      Alert.alert('Save Failed', 'Unable to save the journey. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    if (step === 1) {
      return (
        <View style={styles.stepCard}>
          <Text style={styles.stepTitle}>Create your journey</Text>
          <Text style={styles.fieldLabel}>Title</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="My Kedarnath Yatra"
            placeholderTextColor={COLORS.textSecondary}
            style={styles.input}
          />
          <Text style={styles.fieldLabel}>Location</Text>
          <TextInput
            value={location}
            onChangeText={setLocation}
            placeholder="Kedarnath, Uttarakhand"
            placeholderTextColor={COLORS.textSecondary}
            style={styles.input}
          />
          <Text style={styles.fieldLabel}>Date</Text>
          <TextInput
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={COLORS.textSecondary}
            style={styles.input}
          />
          <Text style={styles.fieldLabel}>Privacy</Text>
          <View style={styles.visibilityRow}>
            <TouchableOpacity
              style={[styles.visibilityButton, visibility === 'private' && styles.visibilityButtonActive]}
              onPress={() => setVisibility('private')}
            >
              <Text style={[styles.visibilityText, visibility === 'private' && styles.visibilityTextActive]}>Private</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.visibilityButton, visibility === 'public' && styles.visibilityButtonActive]}
              onPress={() => setVisibility('public')}
            >
              <Text style={[styles.visibilityText, visibility === 'public' && styles.visibilityTextActive]}>Public</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    if (step === 2) {
      return (
        <View style={styles.stepCard}>
          <Text style={styles.stepTitle}>Add photos, videos and voice notes</Text>
          <Text style={styles.stepDescription}>Upload memories from your journey. Media is optional but helps your passport feel alive.</Text>
          <Button title="Add Media" onPress={handlePickMedia} />
          <View style={styles.mediaPreviewRow}>
            {media.map((item) => (
              <View key={item.id} style={styles.mediaPreview}>
                <Image source={{ uri: item.uri }} style={styles.mediaImage} />
                <Text style={styles.mediaLabel}>{item.type === 'photo' ? 'Photo' : 'Video'}</Text>
              </View>
            ))}
            {media.length === 0 && <Text style={styles.emptyText}>No media added yet.</Text>}
          </View>
          <Text style={styles.stepTitle}>Voice input questions</Text>
          <Text style={styles.stepDescription}>Speak or type your journey answers below.</Text>
          {answers.map((item, index) => (
            <View key={item.question} style={styles.questionBlock}>
              <Text style={styles.questionText}>{item.question}</Text>
              <TextInput
                value={item.answer}
                onChangeText={(text) => handleAnswerChange(index, text)}
                placeholder="Write your thoughts here"
                placeholderTextColor={COLORS.textSecondary}
                style={[styles.input, styles.textArea]}
                multiline
              />
            </View>
          ))}
          <Text style={styles.helpText}>Tip: The story is generated from your answers in a gentle, heartfelt tone.</Text>
        </View>
      );
    }

    return (
      <View style={styles.stepCard}>
        <Text style={styles.stepTitle}>Review and save</Text>
        <Text style={styles.reviewLabel}>Title</Text>
        <Text style={styles.reviewValue}>{title}</Text>
        <Text style={styles.reviewLabel}>Location</Text>
        <Text style={styles.reviewValue}>{location}</Text>
        <Text style={styles.reviewLabel}>Date</Text>
        <Text style={styles.reviewValue}>{date}</Text>
        <Text style={styles.reviewLabel}>Privacy</Text>
        <Text style={styles.reviewValue}>{visibility}</Text>
        <Text style={styles.reviewLabel}>Media attached</Text>
        <Text style={styles.reviewValue}>{media.length} item(s)</Text>
        <Text style={styles.reviewLabel}>Story preview</Text>
        <Text numberOfLines={6} style={styles.reviewValue}>{answers.filter((item) => item.answer.trim()).map((item) => `${item.question}: ${item.answer}`).join('\n\n') || 'Your story will be generated from the answers above.'}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Journey Creation</Text>
        <Text style={styles.pageSubtitle}>Capture your Yatra memory in a single flow.</Text>

        <View style={styles.progressBarBackground}>
          <View style={[styles.progressBarFill, { width: `${(step / 3) * 100}%` }]} />
        </View>

        {renderStepContent()}

        <View style={styles.footerRow}>
          <Button title={step === 1 ? 'Cancel' : 'Back'} variant="outline" onPress={handleBack} style={{ flex: 1, marginRight: SPACING.sm }} />
          {step < 3 ? (
            <Button title="Continue" onPress={handleNext} style={{ flex: 1 }} />
          ) : (
            <Button title="Save Journey" onPress={handleSave} loading={loading} style={{ flex: 1 }} />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  pageSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: SPACING.lg,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  stepCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: SPACING.sm,
  },
  stepDescription: {
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
    lineHeight: 20,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
    color: COLORS.text,
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    color: COLORS.text,
    fontSize: 14,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  visibilityRow: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
  },
  visibilityButton: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.surface,
    marginRight: SPACING.sm,
  },
  visibilityButtonActive: {
    backgroundColor: COLORS.primary,
  },
  visibilityText: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  visibilityTextActive: {
    color: COLORS.textWhite,
  },
  mediaPreviewRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: SPACING.md,
  },
  mediaPreview: {
    width: 90,
    height: 90,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.background,
    marginRight: SPACING.sm,
    marginBottom: SPACING.sm,
    overflow: 'hidden',
  },
  mediaImage: {
    width: '100%',
    height: '100%',
  },
  mediaLabel: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    color: COLORS.textWhite,
    fontSize: 10,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  questionBlock: {
    marginBottom: SPACING.md,
  },
  questionText: {
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  helpText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: SPACING.sm,
  },
  reviewLabel: {
    fontWeight: '700',
    marginTop: SPACING.md,
  },
  reviewValue: {
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    lineHeight: 20,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  emptyText: {
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
});
