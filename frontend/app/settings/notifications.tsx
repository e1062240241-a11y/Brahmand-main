import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, BackHandler, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SPACING } from '../../src/constants/theme';
import { useAuthStore } from '../../src/store/authStore';
import { useTranslation } from '../../src/utils/i18n';

function NotificationsSettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { fcmToken, initPushNotifications } = useAuthStore();

  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/profile');
    }
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
    <LinearGradient
      colors={['#FF8D57', '#EA9B76', '#FFEEE5']}
      locations={[0, 0.0913, 0.25]}
      style={{ flex: 1 }}
    >
      <SafeAreaView edges={['top']} style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {t('language') === 'hi' ? 'सूचना सेटिंग्स' : 'Notification Settings'}
          </Text>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Main Borderless Transparent Pill Container */}
          <View style={styles.pillContainer}>
            <Text style={styles.sectionTitle}>
              {t('language') === 'hi' ? 'प्राथमिकताएं' : 'Preferences'}
            </Text>

            {/* Push Notifications Section */}
            <View style={styles.settingItem}>
              <View style={styles.cardHeader}>
                <View style={styles.iconContainer}>
                  <Ionicons name="notifications-outline" size={20} color="#FF6F00" />
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
                  trackColor={{ false: 'rgba(0,0,0,0.1)', true: '#FF8D57' }}
                  thumbColor={receivePush ? '#FFFFFF' : '#F1F5F9'}
                />
              </View>

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
                      <ActivityIndicator size="small" color="#FF8D57" />
                    ) : (
                      <Text style={styles.actionLinkText}>
                        {t('language') === 'hi' ? 'सक्षम करें' : 'Enable Now'}
                      </Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <View style={styles.divider} />

            {/* Email Notifications Section */}
            <View style={styles.settingItem}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconContainer, { backgroundColor: 'rgba(2, 132, 199, 0.12)' }]}>
                  <Ionicons name="mail-outline" size={20} color="#0284C7" />
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
                  trackColor={{ false: 'rgba(0,0,0,0.1)', true: '#0284C7' }}
                  thumbColor={receiveEmail ? '#FFFFFF' : '#F1F5F9'}
                />
              </View>
            </View>

            <View style={styles.divider} />

            {/* SMS Alerts Section */}
            <View style={styles.settingItem}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconContainer, { backgroundColor: 'rgba(139, 92, 246, 0.12)' }]}>
                  <Ionicons name="chatbubble-ellipses-outline" size={20} color="#8B5CF6" />
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
                  trackColor={{ false: 'rgba(0,0,0,0.1)', true: '#8B5CF6' }}
                  thumbColor="#F1F5F9"
                />
              </View>
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
    paddingVertical: SPACING.md,
  },
  backButton: {
    marginRight: SPACING.md,
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  content: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.xs,
    paddingBottom: SPACING.xl * 2.5,
  },
  pillContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    borderRadius: 24,
    padding: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(0,0,0,0.5)',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: SPACING.md,
  },
  settingItem: {
    paddingVertical: SPACING.xs,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 111, 0, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  labelContainer: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  settingSubLabel: {
    fontSize: 12,
    color: 'rgba(0,0,0,0.55)',
    lineHeight: 16,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
    marginVertical: SPACING.md,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingLeft: 52,
  },
  statusIndicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 13,
    color: 'rgba(0,0,0,0.55)',
    fontWeight: '500',
  },
  actionLink: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 141, 87, 0.15)',
    borderRadius: 8,
  },
  actionLinkText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF6F00',
  },
  disabledLink: {
    opacity: 0.6,
  },
});
