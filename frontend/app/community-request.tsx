import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS } from '../src/constants/theme';
import { useAuthStore } from '../src/store/authStore';
import { createCommunityRequest, getCommunities, parseApiError } from '../src/services/api';
import { RequestFormModal } from '../src/components/RequestFormModal';

const COMMUNITY_REQUEST_CATEGORIES = [
  { id: 'blood', title: 'Blood Request', icon: 'blood-bag', color: '#E53935', requestType: 'Blood' as const, offeringType: null },
  { id: 'emergency', title: 'Emergency Help', icon: 'ambulance', color: '#EF6C00', requestType: 'Help' as const, offeringType: null },
  { id: 'food', title: 'Food / Grocery Help', icon: 'food-apple', color: '#8E24AA', requestType: 'Help' as const, offeringType: 'Food' as const },
  { id: 'senior', title: 'Senior Citizen Support', icon: 'account-group-outline', color: '#3949AB', requestType: 'Help' as const, offeringType: null },
  { id: 'animal', title: 'Gau Seva / Animal Care', icon: 'cow', color: '#43A047', requestType: 'Help' as const, offeringType: null },
  { id: 'temple', title: 'Temple / Volunteer Help', icon: 'temple-hindu', color: '#FB8C00', requestType: 'Help' as const, offeringType: null },
  { id: 'other', title: 'Other Community Request', icon: 'help-circle-outline', color: '#00796B', requestType: 'Help' as const, offeringType: null },
];

type CommunityCategory = typeof COMMUNITY_REQUEST_CATEGORIES[number];

interface CommunityOption {
  id: string;
  name: string;
  type?: string;
}

export default function CommunityRequestPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CommunityCategory | null>(null);
  const [communities, setCommunities] = useState<CommunityOption[]>([]);
  const [loadingCommunities, setLoadingCommunities] = useState(false);
  const [requestType, setRequestType] = useState<'Help' | 'Blood' | 'Medical' | 'Financial'>('Blood');
  const [selectedOfferingType, setSelectedOfferingType] = useState<'Food' | 'Blanket' | 'Clothes' | null>(null);

  useEffect(() => {
    loadCommunities();
  }, []);

  const loadCommunities = async () => {
    setLoadingCommunities(true);
    try {
      const response = await getCommunities();
      setCommunities((response.data || []).map((item: any) => ({ id: item.id || item.community_id || item._id, name: item.name || item.community_name || 'Community', type: item.type })));
    } catch (error) {
      console.error('Error loading communities:', error);
    } finally {
      setLoadingCommunities(false);
    }
  };

  const handleSelectCategory = (category: CommunityCategory) => {
    if (category.id === 'blood') {
      router.push(`/community-request/${category.id}`);
      return;
    }

    setSelectedCategory(category);
    setRequestType(category.requestType);
    setSelectedOfferingType(category.offeringType || null);
    setShowRequestModal(true);
  };

  const handleSubmitRequest = async (data: any) => {
    try {
      const title = data.title || `${data.request_type} Request`;
      const description = data.description || 'Request created from community tab';

      await createCommunityRequest({
        request_type: data.request_type,
        visibility_level: data.visibility_level || 'area',
        title: title.length >= 2 ? title : `${data.request_type} Request`,
        description: description.length >= 10 ? description : description.padEnd(10, '.'),
        contact_number: data.contact_number,
        urgency_level: data.urgency_level || 'low',
        blood_group: data.blood_group,
        hospital_name: data.hospital_name,
        location: data.location,
        amount: data.amount,
        support_needed: data.support_needed,
        contact_person_name: data.contact_person_name,
      });

      setShowRequestModal(false);
      Alert.alert('Success', 'Your request has been posted!');
    } catch (error: any) {
      console.error('Error submitting request:', error);
      Alert.alert('Error', parseApiError(error));
      throw error;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.heroContainer}>
        <View style={styles.heroHeader}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.pageTitle}>Help Your Community</Text>
            <Text style={styles.pageSubtitle}>Reach out and make a real difference in someone&apos;s life.</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.gridRow}>
          {COMMUNITY_REQUEST_CATEGORIES.slice(0, 2).map((category) => (
            <TouchableOpacity key={category.id} style={styles.requestCard} onPress={() => handleSelectCategory(category)} activeOpacity={0.8}>
              <View style={[styles.requestCardIcon, { backgroundColor: `${category.color}20` }]}> 
                <MaterialCommunityIcons name={category.icon} size={24} color={category.color} />
              </View>
              <Text style={styles.requestCardLabel}>{category.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.gridRow}>
          {COMMUNITY_REQUEST_CATEGORIES.slice(2, 4).map((category) => (
            <TouchableOpacity key={category.id} style={styles.requestCard} onPress={() => handleSelectCategory(category)} activeOpacity={0.8}>
              <View style={[styles.requestCardIcon, { backgroundColor: `${category.color}20` }]}> 
                <MaterialCommunityIcons name={category.icon} size={24} color={category.color} />
              </View>
              <Text style={styles.requestCardLabel}>{category.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.gridRow}>
          {COMMUNITY_REQUEST_CATEGORIES.slice(4, 6).map((category) => (
            <TouchableOpacity key={category.id} style={styles.requestCard} onPress={() => handleSelectCategory(category)} activeOpacity={0.8}>
              <View style={[styles.requestCardIcon, { backgroundColor: `${category.color}20` }]}> 
                <MaterialCommunityIcons name={category.icon} size={24} color={category.color} />
              </View>
              <Text style={styles.requestCardLabel}>{category.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={[styles.requestCard, styles.requestCardFull]} onPress={() => handleSelectCategory(COMMUNITY_REQUEST_CATEGORIES[6])} activeOpacity={0.8}>
          <View style={[styles.requestCardIcon, { backgroundColor: `${COMMUNITY_REQUEST_CATEGORIES[6].color}20` }]}> 
            <MaterialCommunityIcons name={COMMUNITY_REQUEST_CATEGORIES[6].icon} size={24} color={COMMUNITY_REQUEST_CATEGORIES[6].color} />
          </View>
          <Text style={styles.requestCardLabel}>{COMMUNITY_REQUEST_CATEGORIES[6].title}</Text>
        </TouchableOpacity>

        {loadingCommunities && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="small" color={COLORS.primary} />
          </View>
        )}
      </ScrollView>

      <RequestFormModal
        visible={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        requestType={requestType}
        selectedOfferingType={selectedOfferingType}
        communities={communities}
        user={user}
        onSubmit={handleSubmitRequest}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EFF2FF',
  },
  heroContainer: {
    backgroundColor: '#FFFFFF',
    margin: SPACING.md,
    marginBottom: 0,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 5,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
    backgroundColor: '#F8F8FF',
    borderRadius: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  pageSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  scrollContent: {
    padding: SPACING.md,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  requestCard: {
    width: '48%',
    minHeight: 120,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  requestCardFull: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  requestCardIcon: {
    width: 46,
    height: 46,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: `${COLORS.primary}15`,
    marginBottom: SPACING.sm,
  },
  requestCardLabel: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 22,
  },
  loadingOverlay: {
    marginTop: SPACING.md,
    alignItems: 'center',
  },
});