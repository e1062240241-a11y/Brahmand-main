import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  BackHandler,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING } from '../../src/constants/theme';
import api from '../../src/services/api';

interface PrivacySettings {
  read_receipts: boolean;
  online_status: boolean;
  profile_photo: string;
}

export default function PrivacySettingsScreen() {
  const router = useRouter();
  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/profile');
    }
  }, [router]);

  useEffect(() => {
    const backAction = () => {
      handleBack();
      return true;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => subscription.remove();
  }, [handleBack]);

  const [settings, setSettings] = useState<PrivacySettings>({
    read_receipts: true,
    online_status: true,
    profile_photo: 'everyone',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await api.get('/user/privacy-settings');
      setSettings(response.data);
    } catch (error) {
      console.error('Error fetching privacy settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: keyof PrivacySettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    setSaving(true);

    try {
      await api.put('/user/privacy-settings', newSettings);
    } catch (error) {
      console.error('Error updating privacy settings:', error);
      setSettings(settings);
      Alert.alert('Error', 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF8D57" />
      </View>
    );
  }

  return (
    <LinearGradient
      colors={['#FF8D57', '#EA9B76', '#FFEEE5']}
      locations={[0, 0.0913, 0.25]}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Privacy Settings</Text>
          {saving && <ActivityIndicator size="small" color="#FFFFFF" />}
        </View>

        {/* Content */}
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          
          {/* Main Transparent Pill Container */}
          <View style={styles.pillContainer}>
            
            {/* Messages Section */}
            <View style={styles.settingSection}>
              <Text style={styles.sectionTitle}>Messages</Text>
              
              <View style={styles.settingItem}>
                <View style={styles.settingInfo}>
                  <View style={styles.settingIconContainer}>
                    <Ionicons name="checkmark-done" size={20} color="#FF6F00" />
                  </View>
                  <View style={styles.settingText}>
                    <Text style={styles.settingLabel}>Read Receipts</Text>
                    <Text style={styles.settingDescription}>
                      When enabled, senders will see double ticks when you have read their messages
                    </Text>
                  </View>
                </View>
                <Switch
                  value={settings.read_receipts}
                  onValueChange={(value) => updateSetting('read_receipts', value)}
                  trackColor={{ false: 'rgba(0,0,0,0.1)', true: '#FF8D57' }}
                  thumbColor={settings.read_receipts ? '#FFFFFF' : '#f4f3f4'}
                />
              </View>

              <View style={styles.infoBox}>
                <Ionicons name="information-circle" size={16} color="rgba(0,0,0,0.5)" />
                <Text style={styles.infoText}>
                  If you turn off read receipts, you will not be able to see read receipts from others.
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Online Status Section */}
            <View style={styles.settingSection}>
              <Text style={styles.sectionTitle}>Activity</Text>
              
              <View style={styles.settingItem}>
                <View style={styles.settingInfo}>
                  <View style={[styles.settingIconContainer, { backgroundColor: 'rgba(76, 175, 80, 0.15)' }]}>
                    <Ionicons name="ellipse" size={16} color="#4CAF50" />
                  </View>
                  <View style={styles.settingText}>
                    <Text style={styles.settingLabel}>Online Status</Text>
                    <Text style={styles.settingDescription}>
                      Show when you are active on Sanatan Lok
                    </Text>
                  </View>
                </View>
                <Switch
                  value={settings.online_status}
                  onValueChange={(value) => updateSetting('online_status', value)}
                  trackColor={{ false: 'rgba(0,0,0,0.1)', true: '#FF8D57' }}
                  thumbColor={settings.online_status ? '#FFFFFF' : '#f4f3f4'}
                />
              </View>
            </View>

            <View style={styles.divider} />

            {/* Safety Section */}
            <View style={styles.settingSection}>
              <Text style={styles.sectionTitle}>Safety</Text>
              
              <TouchableOpacity 
                style={styles.settingItem} 
                activeOpacity={0.7}
                onPress={() => router.push('/settings/blocked')}
              >
                <View style={styles.settingInfo}>
                  <View style={[styles.settingIconContainer, { backgroundColor: 'rgba(239, 68, 68, 0.12)' }]}>
                    <Ionicons name="ban-outline" size={20} color="#EF4444" />
                  </View>
                  <View style={styles.settingText}>
                    <Text style={styles.settingLabel}>Blocked Accounts</Text>
                    <Text style={styles.settingDescription}>
                      View and manage the accounts you have blocked
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="rgba(0,0,0,0.4)" />
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            {/* Status Indicators Guide */}
            <View style={styles.legendSection}>
              <Text style={styles.sectionTitle}>Message Status Guide</Text>
              <View style={styles.legendContainer}>
                <View style={styles.legendItem}>
                  <Ionicons name="time-outline" size={18} color="rgba(0,0,0,0.5)" />
                  <Text style={styles.legendText}>Clock = Message sending</Text>
                </View>
                <View style={styles.legendItem}>
                  <Ionicons name="checkmark" size={18} color="rgba(0,0,0,0.5)" />
                  <Text style={styles.legendText}>Single tick = Message sent</Text>
                </View>
                <View style={styles.legendItem}>
                  <Ionicons name="checkmark-done" size={18} color="#FF6F00" />
                  <Text style={styles.legendText}>Double tick = Message read</Text>
                </View>
              </View>
            </View>

          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFEEE5',
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
  settingSection: {
    marginVertical: SPACING.xs,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(0,0,0,0.5)',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: SPACING.sm,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.xs,
  },
  settingInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 111, 0, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  settingText: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  settingDescription: {
    fontSize: 12,
    color: 'rgba(0,0,0,0.55)',
    marginTop: 2,
    lineHeight: 16,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 14,
    padding: SPACING.md,
    marginTop: SPACING.sm,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: 'rgba(0,0,0,0.6)',
    marginLeft: SPACING.sm,
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
    marginVertical: SPACING.md,
  },
  legendSection: {
    marginTop: SPACING.xs,
  },
  legendContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 16,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  legendText: {
    fontSize: 13,
    color: '#374151',
    marginLeft: SPACING.md,
    fontWeight: '500',
  },
});
