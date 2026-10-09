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
  const [pushLoading, setPushLoading] = useState(false);
  const [pushStatus, setPushStatus] = useState(fcmToken ? 'Enabled' : 'Disabled');

  // Backend Notification Preferences
  const [prefsLoading, setPrefsLoading] = useState(false);
  const [reengagementEnabled, setReengagementEnabled] = useState(true);
  const [trendingEnabled, setTrendingEnabled] = useState(true);
  const [libraryEnabled, setLibraryEnabled] = useState(true);
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(false);
  const [marketingUnsubscribed, setMarketingUnsubscribed] = useState(false);

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

  // Load preferences from backend
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const { getNotificationPreferences } = await import('../../src/services/api');
        const res = await getNotificationPreferences();
        if (res?.data?.preferences && isMounted) {
          const p = res.data.preferences;
          setReengagementEnabled(p.reengagement_enabled ?? true);
          setTrendingEnabled(p.trending_enabled ?? true);
          setLibraryEnabled(p.library_reminder_enabled ?? true);
          setQuietHoursEnabled(p.quiet_hours_enabled ?? false);
          setMarketingUnsubscribed(p.unsubscribed_from_marketing ?? false);
        }
      } catch (err) {
        console.warn('[NotificationsSettings] Failed to fetch preferences:', err);
      }
    })();
    return () => { isMounted = false; };
  }, []);

  const handleUpdatePref = async (key: string, value: boolean) => {
    setPrefsLoading(true);
    try {
      const { updateNotificationPreferences } = await import('../../src/services/api');
      await updateNotificationPreferences({ [key]: value });
    } catch (err) {
      console.warn(`[NotificationsSettings] Failed to update ${key}:`, err);
    } finally {
      setPrefsLoading(false);
    }
  };

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
          <TouchableOpacity style={styles.backButton} onPress={handleBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} accessibilityRole="button" accessibilityLabel={t('language') === 'hi' ? 'वापस जाएं' : 'Go back'}>
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

            {/* Re-engagement Reminders */}
            <View style={styles.settingItem}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconContainer, { backgroundColor: 'rgba(245, 158, 11, 0.12)' }]}>
                  <Ionicons name="flame-outline" size={20} color="#F59E0B" />
                </View>
                <View style={styles.labelContainer}>
                  <Text style={styles.settingLabel}>
                    {t('language') === 'hi' ? 'साधना एवं उपस्थिति स्मरण' : 'Re-engagement Reminders'}
                  </Text>
                  <Text style={styles.settingSubLabel}>
                    {t('language') === 'hi'
                      ? 'अनुपस्थिति पर साधना और समुदाय से जुड़े रहने के विनम्र स्मरण'
                      : 'Gentle nudges to resume your sadhana when inactive for several days.'}
                  </Text>
                </View>
                <Switch
                  value={reengagementEnabled}
                  onValueChange={(val) => {
                    setReengagementEnabled(val);
                    handleUpdatePref('reengagement_enabled', val);
                  }}
                  trackColor={{ false: 'rgba(0,0,0,0.1)', true: '#F59E0B' }}
                  thumbColor={reengagementEnabled ? '#FFFFFF' : '#F1F5F9'}
                />
              </View>
            </View>

            <View style={styles.divider} />

            {/* Trending Content Notifications */}
            <View style={styles.settingItem}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconContainer, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
                  <Ionicons name="trending-up-outline" size={20} color="#10B981" />
                </View>
                <View style={styles.labelContainer}>
                  <Text style={styles.settingLabel}>
                    {t('language') === 'hi' ? 'लोकप्रिय सामग्री' : 'Trending Content'}
                  </Text>
                  <Text style={styles.settingSubLabel}>
                    {t('language') === 'hi'
                      ? 'सनातन समुदाय में लोकप्रिय विचार और सबसे अधिक पसंद की गई पोस्ट'
                      : 'Highlights of top sacred posts loved by the community.'}
                  </Text>
                </View>
                <Switch
                  value={trendingEnabled}
                  onValueChange={(val) => {
                    setTrendingEnabled(val);
                    handleUpdatePref('trending_enabled', val);
                  }}
                  trackColor={{ false: 'rgba(0,0,0,0.1)', true: '#10B981' }}
                  thumbColor={trendingEnabled ? '#FFFFFF' : '#F1F5F9'}
                />
              </View>
            </View>

            <View style={styles.divider} />

            {/* Library Reminders */}
            <View style={styles.settingItem}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconContainer, { backgroundColor: 'rgba(59, 130, 246, 0.12)' }]}>
                  <Ionicons name="book-outline" size={20} color="#3B82F6" />
                </View>
                <View style={styles.labelContainer}>
                  <Text style={styles.settingLabel}>
                    {t('language') === 'hi' ? 'पुस्तकालय स्मरण' : 'Library Reading Reminders'}
                  </Text>
                  <Text style={styles.settingSubLabel}>
                    {t('language') === 'hi'
                      ? 'अधूरे ग्रंथों और भगवद्गीता के पठन को आगे बढ़ाने के लिए सुझाव'
                      : 'Reminders to pick up your sacred reading sessions.'}
                  </Text>
                </View>
                <Switch
                  value={libraryEnabled}
                  onValueChange={(val) => {
                    setLibraryEnabled(val);
                    handleUpdatePref('library_reminder_enabled', val);
                  }}
                  trackColor={{ false: 'rgba(0,0,0,0.1)', true: '#3B82F6' }}
                  thumbColor={libraryEnabled ? '#FFFFFF' : '#F1F5F9'}
                />
              </View>
            </View>

            <View style={styles.divider} />

            {/* Quiet Hours */}
            <View style={styles.settingItem}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconContainer, { backgroundColor: 'rgba(99, 102, 241, 0.12)' }]}>
                  <Ionicons name="moon-outline" size={20} color="#6366F1" />
                </View>
                <View style={styles.labelContainer}>
                  <Text style={styles.settingLabel}>
                    {t('language') === 'hi' ? 'शांत समय (Quiet Hours)' : 'Quiet Hours (10 PM - 7 AM)'}
                  </Text>
                  <Text style={styles.settingSubLabel}>
                    {t('language') === 'hi'
                      ? 'रात 10 बजे से सुबह 7 बजे तक कोई गैर-आपातकालीन सूचना न भेजें'
                      : 'Silence marketing and re-engagement notifications overnight.'}
                  </Text>
                </View>
                <Switch
                  value={quietHoursEnabled}
                  onValueChange={(val) => {
                    setQuietHoursEnabled(val);
                    handleUpdatePref('quiet_hours_enabled', val);
                  }}
                  trackColor={{ false: 'rgba(0,0,0,0.1)', true: '#6366F1' }}
                  thumbColor={quietHoursEnabled ? '#FFFFFF' : '#F1F5F9'}
                />
              </View>
            </View>

            <View style={styles.divider} />

            {/* Global Marketing Opt-out */}
            <View style={styles.settingItem}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconContainer, { backgroundColor: 'rgba(239, 68, 68, 0.12)' }]}>
                  <Ionicons name="hand-left-outline" size={20} color="#EF4444" />
                </View>
                <View style={styles.labelContainer}>
                  <Text style={styles.settingLabel}>
                    {t('language') === 'hi' ? 'सभी प्रचार और पुनः-सक्रियण सूचनाओं से बाहर निकलें' : 'Opt Out of Marketing Notifications'}
                  </Text>
                  <Text style={styles.settingSubLabel}>
                    {t('language') === 'hi'
                      ? 'सुरक्षा एवं आपातकालीन SOS सूचनाएं हमेशा सुरक्षित रूप से प्राप्त होंगी'
                      : 'Critical SOS and direct messages are never affected by this setting.'}
                  </Text>
                </View>
                <Switch
                  value={marketingUnsubscribed}
                  onValueChange={(val) => {
                    setMarketingUnsubscribed(val);
                    handleUpdatePref('unsubscribed_from_marketing', val);
                  }}
                  trackColor={{ false: 'rgba(0,0,0,0.1)', true: '#EF4444' }}
                  thumbColor={marketingUnsubscribed ? '#FFFFFF' : '#F1F5F9'}
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
    backgroundColor: 'transparent',
    borderRadius: 24,
    padding: SPACING.sm,
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
