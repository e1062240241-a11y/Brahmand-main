import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, BackHandler, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, BORDER_RADIUS } from '../../src/constants/theme';
import { useAuthStore } from '../../src/store/authStore';
import { useTranslation } from '../../src/utils/i18n';

function NotificationsSettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { fcmToken, initPushNotifications } = useAuthStore();

  const handleBack = useCallback(() => {
    router.replace('/profile');
  }, [router]);

  const [receivePush, setReceivePush] = useState(false);
  const [receiveEmail, setReceiveEmail] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const [pushStatus, setPushStatus] = useState(fcmToken ? 'Enabled' : 'Disabled');

  useEffect(() => {
    const backAction = () => {
      handleBack();
      return true;
    };
    const subscription = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => subscription.remove();
  }, [handleBack]);

  useEffect(() => {
    setReceivePush(!!fcmToken);
    setPushStatus(fcmToken ? 'Enabled' : 'Disabled');
  }, [fcmToken]);

  const handleEnablePush = async () => {
    if (pushLoading) return;

    setPushLoading(true);
    setPushStatus('Enabling...');

    const token = await initPushNotifications();
    setPushLoading(false);

    if (token) {
      setReceivePush(true);
      setPushStatus('Enabled');
    } else {
      setPushStatus('Unable to enable push notifications');
    }
  };

  const getStatusText = (status: string) => {
    if (status === 'Enabled') return t('language') === 'hi' ? 'सक्षम' : 'Enabled';
    if (status === 'Disabled') return t('language') === 'hi' ? 'अक्षम' : 'Disabled';
    if (status === 'Enabling...') return t('language') === 'hi' ? 'सक्षम किया जा रहा है...' : 'Enabling...';
    if (status === 'Unable to enable push notifications') return t('language') === 'hi' ? 'पुश सूचनाएं सक्षम करने में असमर्थ' : 'Unable to enable push notifications';
    return status;
  };

  return (
    <LinearGradient colors={['#FFF5EB', '#FFFDFB', '#FFFFFF']} style={styles.container}>
      <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="chevron-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {t('language') === 'hi' ? 'सूचना सेटिंग्स' : 'Notification Settings'}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionTitle}>
            {t('language') === 'hi' ? 'प्राथमिकताएं' : 'Preferences'}
          </Text>

          {/* Push Notifications Card */}
          <View style={styles.settingCard}>
            <View style={styles.cardHeader}>
              <View style={styles.iconContainer}>
                <Ionicons name="notifications-outline" size={22} color={COLORS.primary} />
              </View>
              <View style={styles.labelContainer}>
                <Text style={styles.settingLabel}>
                  {t('language') === 'hi' ? 'पुश सूचनाएं' : 'Push Notifications'}
                </Text>
                <Text style={styles.settingSubLabel}>
                  {t('language') === 'hi'
                    ? 'लाइक, कमेंट, नए सर्कल और लाइव अपडेट के लिए तुरंत अलर्ट प्राप्त करें'
                    : 'Get instant alerts for likes, comments, circles, and live updates.'}
                </Text>
              </View>
              <Switch
                value={receivePush}
                onValueChange={!receivePush ? handleEnablePush : undefined}
                disabled={pushLoading || receivePush}
                trackColor={{ false: '#E2E8F0', true: `${COLORS.primary}80` }}
                thumbColor={receivePush ? COLORS.primary : '#F1F5F9'}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.statusRow}>
              <View style={styles.statusIndicatorContainer}>
                <View style={[styles.statusDot, { backgroundColor: receivePush ? '#22C55E' : '#94A3B8' }]} />
                <Text style={styles.statusText}>
                  {getStatusText(pushStatus)}
                </Text>
              </View>
              
              {!receivePush && (
                <TouchableOpacity
                  style={[styles.actionLink, pushLoading && styles.disabledLink]}
                  onPress={handleEnablePush}
                  disabled={pushLoading}
                >
                  {pushLoading ? (
                    <ActivityIndicator size="small" color={COLORS.primary} />
                  ) : (
                    <Text style={styles.actionLinkText}>
                      {t('language') === 'hi' ? 'सक्षम करें' : 'Enable Now'}
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Email Notifications Card */}
          <View style={styles.settingCard}>
            <View style={styles.cardHeader}>
              <View style={styles.iconContainer}>
                <Ionicons name="mail-outline" size={22} color="#0284C7" />
              </View>
              <View style={styles.labelContainer}>
                <Text style={styles.settingLabel}>
                  {t('language') === 'hi' ? 'ईमेल सूचनाएं' : 'Email Notifications'}
                </Text>
                <Text style={styles.settingSubLabel}>
                  {t('language') === 'hi'
                    ? 'महत्वपूर्ण अपडेट, समाचार और सारांश ईमेल द्वारा प्राप्त करें'
                    : 'Receive important updates, newsletters, and digests via email.'}
                </Text>
              </View>
              <Switch
                value={receiveEmail}
                onValueChange={(val) => setReceiveEmail(val)}
                trackColor={{ false: '#E2E8F0', true: '#0284C780' }}
                thumbColor={receiveEmail ? '#0284C7' : '#F1F5F9'}
              />
            </View>
          </View>

          {/* SMS Alerts */}
          <View style={styles.settingCard}>
            <View style={styles.cardHeader}>
              <View style={styles.iconContainer}>
                <Ionicons name="chatbubble-ellipses-outline" size={22} color="#8B5CF6" />
              </View>
              <View style={styles.labelContainer}>
                <Text style={styles.settingLabel}>
                  {t('language') === 'hi' ? 'एसएमएस सूचनाएं' : 'SMS Alerts'}
                </Text>
                <Text style={styles.settingSubLabel}>
                  {t('language') === 'hi'
                    ? 'सुरक्षा अलर्ट और आपातकालीन अपडेट के लिए एसएमएस प्राप्त करें'
                    : 'Receive text alerts for security updates and emergency notifications.'}
                </Text>
              </View>
              <Switch
                value={false}
                disabled
                trackColor={{ false: '#E2E8F0', true: '#8B5CF680' }}
                thumbColor="#F1F5F9"
              />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

export default NotificationsSettingsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    height: 56,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F0E8E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.2,
  },
  content: {
    padding: SPACING.md,
    gap: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  settingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F2EAE2',
    padding: 16,
    shadowColor: '#1A0D00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FFF8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  labelContainer: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  settingSubLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3EBE3',
    marginVertical: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusIndicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  actionLink: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    backgroundColor: '#FFF1E6',
    borderRadius: 8,
  },
  actionLinkText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  disabledLink: {
    opacity: 0.6,
  },
});
