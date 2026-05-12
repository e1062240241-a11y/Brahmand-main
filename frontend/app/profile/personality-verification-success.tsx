import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { usePersonalityStore } from '../../src/store/personalityStore';
import { useAuthStore } from '../../src/store/authStore';
import { getProfile } from '../../src/services/api';

const { width } = Dimensions.get('window');

export default function PersonalitySuccessScreen() {
  const router = useRouter();
  const { resetData } = usePersonalityStore();
  const { user, setUser } = useAuthStore();

  useFocusEffect(
    React.useCallback(() => {
      const refreshProfile = async () => {
        try {
          const res = await getProfile();
          if (res.data) {
            setUser(res.data);
          }
        } catch (err) {
          console.error('Failed to refresh profile:', err);
        }
      };
      refreshProfile();
    }, [])
  );

  const status = user?.personality_verification_status || 'pending';
  const isApproved = status === 'approved';
  const isRejected = status === 'rejected';
  const isPending = status === 'pending';

  const handleClose = () => {
    resetData();
    router.replace('/(tabs)/profile');
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color="#2D2D2D" />
          </TouchableOpacity>
        </View>

        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Illustration */}
          <View style={styles.illustrationContainer}>
            <Image 
              source={isApproved 
                ? require('../../assets/images/verification_success_shield_clean.jpg')
                : require('../../assets/images/verification_thank_you_illustration.jpg')
              } 
              style={styles.illustration}
              resizeMode="contain"
            />
          </View>

          {/* Title */}
          <Text style={styles.mainTitle}>
            {isApproved ? 'Verification Success!' : isRejected ? 'Verification Rejected' : 'Thank You!'}
          </Text>
          
          {/* Subtitle */}
          <Text style={styles.subtitle}>
            {isApproved 
              ? 'Your identity has been verified. You now have access to elite community groups.' 
              : isRejected 
                ? 'Unfortunately, your application was not approved. Please contact support for details.'
                : 'Your application has been submitted successfully.'}
          </Text>

          {/* Highlighted Status Box */}
          <View style={[styles.statusBox, isApproved && { backgroundColor: '#E8F5E9', borderColor: '#C8E6C9' }, isRejected && { backgroundColor: '#FFEBEE', borderColor: '#FFCDD2' }]}>
            <Text style={[styles.statusText, isApproved && { color: '#2E7D32' }, isRejected && { color: '#C62828' }]}>
              {isApproved 
                ? 'Congratulations! You are now a Verified Personality.' 
                : isRejected 
                  ? 'Application Rejected' 
                  : 'You will be notified here once your application is approved.'}
            </Text>
          </View>

          {/* Amazon-style Tracking Section */}
          <View style={styles.trackingContainer}>
            <Text style={styles.trackingTitle}>Application Tracking</Text>
            
            <View style={styles.stepperContainer}>
              {/* Step 1: Submitted */}
              <View style={styles.stepRow}>
                <View style={styles.stepIconContainer}>
                  <View style={[styles.stepCircle, styles.completedCircle]}>
                    <Ionicons name="checkmark" size={14} color="#FFF" />
                  </View>
                  <View style={[styles.stepLine, (isPending || isApproved || isRejected) && styles.completedLine]} />
                </View>
                <View style={styles.stepTextContainer}>
                  <Text style={styles.stepLabel}>Application Submitted</Text>
                  <Text style={styles.stepDesc}>Your application has been received</Text>
                </View>
              </View>

              {/* Step 2: Review */}
              <View style={styles.stepRow}>
                <View style={styles.stepIconContainer}>
                  <View style={[
                    styles.stepCircle, 
                    isApproved || isRejected ? styles.completedCircle : styles.activeCircle
                  ]}>
                    {isApproved || isRejected ? (
                      <Ionicons name="checkmark" size={14} color="#FFF" />
                    ) : (
                      <View style={styles.innerCircle} />
                    )}
                  </View>
                  <View style={[styles.stepLine, (isApproved || isRejected) && styles.completedLine]} />
                </View>
                <View style={styles.stepTextContainer}>
                  <Text style={styles.stepLabel}>Verification in Progress</Text>
                  <Text style={styles.stepDesc}>
                    {isApproved || isRejected ? 'Review completed' : 'Our team is reviewing your details'}
                  </Text>
                </View>
              </View>

              {/* Step 3: Final Decision */}
              <View style={styles.stepRow}>
                <View style={styles.stepIconContainer}>
                  <View style={[
                    styles.stepCircle, 
                    isApproved ? styles.completedCircle : isRejected ? { backgroundColor: '#C62828' } : null
                  ]}>
                    {isApproved ? (
                      <Ionicons name="ribbon" size={14} color="#FFF" />
                    ) : isRejected ? (
                      <Ionicons name="close" size={14} color="#FFF" />
                    ) : (
                      <Ionicons name="ribbon-outline" size={14} color="#999" />
                    )}
                  </View>
                </View>
                <View style={styles.stepTextContainer}>
                  <Text style={styles.stepLabel}>Final Decision</Text>
                  <Text style={styles.stepDesc}>
                    {isApproved ? 'Approved!' : isRejected ? 'Not Approved' : 'Result pending'}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Footer Info Text */}
          <Text style={styles.infoText}>
            {isApproved 
              ? 'Check the Communities tab to join your new groups.' 
              : 'You can continue using the app and track updates in your profile.'}
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
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingBottom: 60,
  },
  illustrationContainer: {
    width: width * 0.65,
    height: width * 0.65,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  illustration: {
    width: '100%',
    height: '100%',
  },
  mainTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#3D1C10',
    marginTop: 20,
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    fontWeight: '500',
    marginTop: 12,
    textAlign: 'center',
    fontFamily: 'Inter_500Medium',
    lineHeight: 22,
  },
  statusBox: {
    backgroundColor: '#FFF1E8',
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 24,
    marginTop: 32,
    width: '100%',
    borderWidth: 1,
    borderColor: '#FFE0CC',
  },
  statusText: {
    fontSize: 14,
    color: '#3D1C10',
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: 'Inter_600SemiBold',
  },
  trackingContainer: {
    width: '100%',
    marginTop: 40,
    backgroundColor: '#FFF',
    padding: 24,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  trackingTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#3D1C10',
    marginBottom: 24,
    fontFamily: 'Inter_700Bold',
  },
  stepperContainer: {
    paddingLeft: 4,
  },
  stepRow: {
    flexDirection: 'row',
    minHeight: 80,
  },
  stepIconContainer: {
    alignItems: 'center',
    width: 30,
  },
  stepCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  completedCircle: {
    backgroundColor: '#4CAF50',
  },
  activeCircle: {
    backgroundColor: '#FF6600',
    borderWidth: 4,
    borderColor: '#FFE0CC',
  },
  innerCircle: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFF',
  },
  stepLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 4,
  },
  completedLine: {
    backgroundColor: '#4CAF50',
  },
  stepTextContainer: {
    marginLeft: 16,
    flex: 1,
    paddingTop: 2,
  },
  stepLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#3D1C10',
    fontFamily: 'Inter_600SemiBold',
  },
  stepDesc: {
    fontSize: 13,
    color: '#777',
    marginTop: 4,
    fontFamily: 'Inter_400Regular',
  },
  infoText: {
    fontSize: 13,
    color: '#888',
    marginTop: 40,
    textAlign: 'center',
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
  },
});
