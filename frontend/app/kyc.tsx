import React, { useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS, SPACING, BORDER_RADIUS } from '../src/constants/theme';
import { useVendorStore } from '../src/store/vendorStore';
import { useTranslation } from '../src/utils/i18n';

export default function KYCStatusScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { myVendor, fetchMyVendor } = useVendorStore();

  useEffect(() => {
    fetchMyVendor();
  }, [fetchMyVendor]);

  const getStatusMessage = () => {
    const vendorKycStatus = (myVendor as any)?.kyc_status as string | undefined;
    if (!myVendor) {
      return t('language') === 'hi' 
        ? 'कोई विक्रेता प्रोफ़ाइल नहीं मिली। कृपया पहले व्यवसाय पंजीकरण पूरा करें।' 
        : 'No vendor profile found. Please complete business registration first.';
    }
    if (vendorKycStatus === 'manual_review') {
      return t('language') === 'hi' 
        ? 'आपका आवेदन समीक्षा के अधीन है।' 
        : 'Your application is under review.';
    }
    if (vendorKycStatus === 'verified') {
      return t('language') === 'hi' 
        ? 'आपका केवाईसी सत्यापित है।' 
        : 'Your KYC is verified.';
    }
    if (vendorKycStatus === 'rejected') {
      return t('language') === 'hi' 
        ? 'आपका केवाईसी अस्वीकार कर दिया गया था। कृपया अपडेट करें और दोबारा सबमिट करें।' 
        : 'Your KYC was rejected. Please update and resubmit.';
    }
    return t('language') === 'hi' 
      ? 'केवाईसी लंबित है। कृपया व्यवसाय प्रबंधित करें से सत्यापन पूरा करें।' 
      : 'KYC is pending. Please complete verification from Manage Business.';
  };

  const handleBack = useCallback(() => {
    router.replace('/(tabs)/profile');
  }, [router]);

  useEffect(() => {
    const backAction = () => {
      handleBack();
      return true;
    };
    const subscription = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => subscription.remove();
  }, [handleBack]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title}>
          {t('language') === 'hi' ? 'केवाईसी सत्यापन' : 'KYC Verification'}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.card}>
        <Ionicons name="shield-checkmark" size={44} color={COLORS.primary} />
        <Text style={styles.message}>{getStatusMessage()}</Text>
        <TouchableOpacity style={styles.btn} onPress={() => router.push('/vendor/dashboard')}>
          <Text style={styles.btnText}>
            {t('language') === 'hi' ? 'व्यवसाय प्रबंधित करें खोलें' : 'Open Manage Business'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  title: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  card: {
    margin: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
    alignItems: 'center',
    gap: 14,
  },
  message: {
    color: COLORS.text,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '500',
  },
  btn: {
    marginTop: 8,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 10,
    borderRadius: BORDER_RADIUS.md,
  },
  btnText: { color: '#fff', fontWeight: '700' },
});
