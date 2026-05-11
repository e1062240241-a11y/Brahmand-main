import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePersonalityStore } from '../../src/store/personalityStore';
import axios from 'axios';
import { COLORS } from '../../src/constants/theme';

const { width } = Dimensions.get('window');

export default function PersonalityReviewScreen() {
  const router = useRouter();
  const { data, resetData } = usePersonalityStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleBack = () => router.back();

  const handleEdit = (route: string) => {
    router.push(route as any);
  };

  const handleSubmit = () => {
    router.push('/profile/personality-verification-final');
  };

  const SectionHeader = ({ title, onEdit }: { title: string; onEdit: () => void }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <TouchableOpacity onPress={onEdit} style={styles.editButton}>
        <Ionicons name="create-outline" size={18} color="#FF6600" />
        <Text style={styles.editButtonText}>Edit</Text>
      </TouchableOpacity>
    </View>
  );

  const InfoRow = ({ label, value }: { label: string; value: string | null | undefined }) => (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || 'Not provided'}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color="#2D2D2D" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Review Application</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroSection}>
            <View style={styles.statusBadge}>
              <Ionicons name="time-outline" size={16} color="#FF6600" />
              <Text style={styles.statusText}>Final Review</Text>
            </View>
            <Text style={styles.mainTitle}>Check your details</Text>
            <Text style={styles.subtitle}>
              Please verify all information before final submission.
            </Text>
          </View>

          {/* Verification Level */}
          <View style={styles.card}>
            <SectionHeader 
              title="Verification Level" 
              onEdit={() => handleEdit('/profile/personality-application')} 
            />
            <View style={styles.levelBadge}>
              <Ionicons 
                name={data.level === 'national' ? 'globe-outline' : 'map-outline'} 
                size={20} 
                color="#FF6600" 
              />
              <Text style={styles.levelText}>
                {data.level === 'national' ? 'National Level' : 'State Level'}
              </Text>
            </View>
          </View>

          {/* Personal Details */}
          <View style={styles.card}>
            <SectionHeader 
              title="Personal Details" 
              onEdit={() => handleEdit('/profile/personality-details')} 
            />
            <InfoRow label="Full Name" value={data.fullName} />
            <InfoRow label="Date of Birth" value={data.dob} />
            <InfoRow label="Gender" value={data.gender} />
            <InfoRow label="Mobile" value={data.mobile} />
            <InfoRow label="Email" value={data.email} />
            <InfoRow label="City" value={data.city} />
          </View>

          {/* Professional Background */}
          <View style={styles.card}>
            <SectionHeader 
              title="Identity & Background" 
              onEdit={() => handleEdit('/profile/personality-background')} 
            />
            <InfoRow label="Profession" value={data.profession} />
            <InfoRow label="Organization" value={data.organization} />
            <InfoRow label="Experience" value={`${data.experience} Years`} />
            <View style={styles.areasContainer}>
              <Text style={styles.infoLabel}>Areas of Influence</Text>
              <View style={styles.tagsContainer}>
                {data.areas.map((area, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>{area}</Text>
                  </View>
                ))}
              </View>
            </View>
            <View style={styles.bioContainer}>
              <Text style={styles.infoLabel}>About / Bio</Text>
              <Text style={styles.bioText}>{data.bio}</Text>
            </View>
          </View>

          {/* Uploaded Documents */}
          <View style={styles.card}>
            <SectionHeader 
              title="Documents" 
              onEdit={() => handleEdit('/profile/personality-verification-docs')} 
            />
            <InfoRow label="ID Type" value={data.docType.toUpperCase()} />
            
            <View style={styles.imagesGrid}>
              <View style={styles.imageWrapper}>
                <Text style={styles.imageLabel}>Front Side</Text>
                {data.frontUrl ? (
                  <Image source={{ uri: data.frontUrl }} style={styles.previewImage} />
                ) : (
                  <View style={styles.imagePlaceholder}><Text>No Image</Text></View>
                )}
              </View>
              {data.backUrl && (
                <View style={styles.imageWrapper}>
                  <Text style={styles.imageLabel}>Back Side</Text>
                  <Image source={{ uri: data.backUrl }} style={styles.previewImage} />
                </View>
              )}
            </View>

            {data.additionalUrls.length > 0 && (
              <View style={styles.additionalSection}>
                <Text style={styles.imageLabel}>Additional Documents ({data.additionalUrls.length})</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                  {data.additionalUrls.map((url, index) => (
                    <Image key={index} source={{ uri: url }} style={styles.smallPreview} />
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Submit Button */}
          <TouchableOpacity 
            style={styles.submitButton} 
            onPress={handleSubmit}
          >
            <Text style={styles.submitButtonText}>Continue</Text>
          </TouchableOpacity>
          
          <Text style={styles.disclaimer}>
            By submitting, you agree that all information provided is accurate and truthful. Providing false information may lead to permanent account suspension.
          </Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFBF7',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2D2D2D',
    fontFamily: 'Inter_600SemiBold',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 60,
  },
  heroSection: {
    marginTop: 20,
    marginBottom: 32,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF1E8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FF6600',
    marginLeft: 6,
    textTransform: 'uppercase',
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#3D1C10',
    fontFamily: 'Inter_700Bold',
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    marginTop: 8,
    fontFamily: 'Inter_400Regular',
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#F0E8E0',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#3D1C10',
    fontFamily: 'Inter_600SemiBold',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FF6600',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 14,
    color: '#999',
    fontFamily: 'Inter_400Regular',
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2D2D2D',
    fontFamily: 'Inter_600SemiBold',
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFF7F1',
    padding: 12,
    borderRadius: 12,
  },
  levelText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF6600',
  },
  areasContainer: {
    marginTop: 4,
    marginBottom: 16,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  tag: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  bioContainer: {
    marginTop: 4,
  },
  bioText: {
    fontSize: 14,
    color: '#444',
    lineHeight: 22,
    marginTop: 8,
    fontFamily: 'Inter_400Regular',
  },
  imagesGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  imageWrapper: {
    flex: 1,
    gap: 8,
  },
  imageLabel: {
    fontSize: 13,
    color: '#999',
    marginBottom: 4,
  },
  previewImage: {
    width: '100%',
    height: 100,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
  },
  imagePlaceholder: {
    width: '100%',
    height: 100,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  additionalSection: {
    marginTop: 20,
    gap: 8,
  },
  horizontalScroll: {
    marginTop: 8,
  },
  smallPreview: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 10,
    backgroundColor: '#F5F5F5',
  },
  submitButton: {
    backgroundColor: '#FF6600',
    borderRadius: 20,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 12,
    shadowColor: '#FF6600',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  disabledButton: {
    backgroundColor: '#FFCCAB',
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '900',
    fontFamily: 'Inter_700Bold',
  },
  disclaimer: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 18,
    fontFamily: 'Inter_400Regular',
  },
});
