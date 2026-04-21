import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, BackHandler, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS } from '../../src/constants/theme';
import { useAuthStore } from '../../src/store/authStore';

function NotificationsSettingsScreen() {
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.settingItem}>
          <View>
            <Text style={styles.settingLabel}>Push Notifications</Text>
          </View>
          <Switch
            value={receivePush}
            onValueChange={() => {}}
            disabled
            trackColor={{ false: COLORS.divider, true: `${COLORS.primary}80` }}
            thumbColor={receivePush ? COLORS.primary : '#f4f3f4'}
          />
        </View>

        <View style={styles.pushStatusContainer}>
          <Text style={styles.pushStatusText}>{pushStatus}</Text>
          <TouchableOpacity
            style={[styles.pushButton, pushLoading && styles.pushButtonDisabled]}
            onPress={handleEnablePush}
            disabled={pushLoading}
          >
            {pushLoading ? (
              <ActivityIndicator color={COLORS.background} />
            ) : (
              <Text style={styles.pushButtonText}>
                {receivePush ? 'Push Enabled' : 'Enable Push Notifications'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.settingItem}>
          <View>
            <Text style={styles.settingLabel}>Email Notifications</Text>
          </View>
          <Switch
            value={receiveEmail}
            onValueChange={() => {}}
            disabled
            trackColor={{ false: COLORS.divider, true: `${COLORS.primary}80` }}
            thumbColor={receiveEmail ? COLORS.primary : '#f4f3f4'}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

export default NotificationsSettingsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  content: {
    padding: SPACING.md,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  pushStatusContainer: {
    marginBottom: SPACING.sm,
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
  },
  pushStatusText: {
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  pushButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
  },
  pushButtonDisabled: {
    backgroundColor: COLORS.divider,
  },
  pushButtonText: {
    color: COLORS.background,
    fontWeight: '600',
  },
  settingLabel: {
    fontSize: 16,
    color: COLORS.text,
  },
  settingSubLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
});
