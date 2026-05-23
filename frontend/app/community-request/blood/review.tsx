import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS } from '../../../src/constants/theme';
import { useAuthStore } from '../../../src/store/authStore';

export default function CommunityRequestBloodReviewPage() {
  const router = useRouter();
  const params = useLocalSearchParams<{ community_id?: string,
    bloodGroup?: string;
    hospitalName?: string;
    location?: string;
    urgency?: string;
    description?: string;
    contactPreference?: string;
    contactNumber?: string;
  }>();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const bloodGroup = params.bloodGroup || '';
  const hospitalName = params.hospitalName || '';
  const location = params.location || 'Auto-detected';
  const urgency = params.urgency || 'Low';
  const description = params.description || '';
  const contactPreference = params.contactPreference || 'Phone';
  const contactNumber = params.contactNumber || user?.phone || '';

  const cityLabel = useMemo(() => {
    const parts = location.split(',').map((part) => part.trim()).filter(Boolean);
    return parts[0] || 'Your area';
  }, [location]);

  const handlePlaceRequest = async () => {
    if (!bloodGroup || !hospitalName || !description) {
      Alert.alert('Missing Data', 'Please go back and complete the form before placing your request.');
      return;
    }

    router.push({
      pathname: '/community-request/blood/verify',
      params: { community_id: params.community_id,
        bloodGroup,
        hospitalName,
        location,
        urgency,
        description,
        contactPreference,
        contactNumber,
      },
    });
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/community-request/blood-request');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.title}>Review Your Request</Text>
          <Text style={styles.subtitle}>Please confirm your details before proceeding</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons name="blood-drop" size={24} color="#E53935" />
            </View>
            <Text style={styles.summaryTitle}>Request Type</Text>
          </View>
          <Text style={styles.summaryValue}>Blood Request</Text>
        </View>

        <View style={styles.reviewCard}>
          <View style={styles.reviewRow}>
            <Text style={styles.reviewLabel}>Blood Group</Text>
            <Text style={styles.reviewValue}>{bloodGroup || 'O+'}</Text>
          </View>
          <View style={styles.reviewRow}>
            <Text style={styles.reviewLabel}>Hospital Name</Text>
            <Text style={styles.reviewValue}>{hospitalName || 'Unknown'}</Text>
          </View>
          <View style={styles.reviewRow}>
            <Text style={styles.reviewLabel}>Hospital Location</Text>
            <Text style={styles.reviewValue}>{location}</Text>
          </View>
          <View style={styles.reviewRow}> 
            <Text style={styles.reviewLabel}>Urgency Level</Text>
            <View style={[styles.urgencyBadge, urgency === 'Urgent' ? styles.urgencyUrgent : styles.urgencyDefault]}>
              <Text style={[styles.urgencyText, urgency === 'Urgent' && styles.urgencyTextUrgent]}>{urgency}</Text>
            </View>
          </View>
          <View style={styles.reviewRow}>
            <Text style={styles.reviewLabel}>Description</Text>
            <Text style={styles.reviewValue}>{description}</Text>
          </View>
          <View style={styles.reviewRow}>
            <Text style={styles.reviewLabel}>Contact Preference</Text>
            <Text style={styles.reviewValue}>{contactPreference}</Text>
          </View>
        </View>

        <View style={styles.noteCard}>
          <Text style={styles.noteText}>
            This hospital is in {cityLabel}. Your request will be visible to the {cityLabel} Community Group only.
          </Text>
        </View>

        <TouchableOpacity style={styles.submitButton} onPress={handlePlaceRequest} disabled={loading} activeOpacity={0.8}>
          {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.submitButtonText}>Continue</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFF',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  content: {
    padding: SPACING.md,
    paddingBottom: SPACING.lg,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: '#F2F4FF',
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: '#FDEDEC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
  },
  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: '#F2F4FF',
  },
  reviewRow: {
    marginBottom: SPACING.md,
  },
  reviewLabel: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: SPACING.xs,
  },
  reviewValue: {
    color: COLORS.text,
    fontSize: 15,
    lineHeight: 22,
  },
  urgencyBadge: {
    alignSelf: 'flex-start',
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderWidth: 1,
  },
  urgencyDefault: {
    backgroundColor: '#EFF2FF',
    borderColor: '#B3D4FF',
  },
  urgencyUrgent: {
    backgroundColor: '#FDEDEC',
    borderColor: '#F8C4C6',
  },
  urgencyText: {
    color: COLORS.text,
    fontWeight: '700',
  },
  urgencyTextUrgent: {
    color: '#E53935',
  },
  noteCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: '#F2F4FF',
    marginBottom: SPACING.md,
  },
  noteText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 20,
  },
  submitButton: {
    backgroundColor: '#FF6B00',
    borderRadius: BORDER_RADIUS.xl,
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});