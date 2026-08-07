import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  Dimensions,
  Platform,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../constants/theme';
import SOSMap from './SOSMap';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface SOSResponderModalProps {
  visible: boolean;
  sosData: any;
  onClose: () => void;
  onRespond: (sosId: string) => Promise<void>;
  onReportMisuse?: (sosId: string, reason: string) => Promise<void>;
}

export const SOSResponderModal: React.FC<SOSResponderModalProps> = ({
  visible,
  sosData,
  onClose,
  onRespond,
  onReportMisuse,
}) => {
  const [loading, setLoading] = useState(false);
  const [reporting, setReporting] = useState(false);

  if (!sosData) return null;

  const handleRespond = async () => {
    setLoading(true);
    try {
      await onRespond(sosData.sos_id || sosData.id);
      onClose();
    } catch (error) {
      console.error('Respond error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReportMisuse = () => {
    const sosId = sosData.sos_id || sosData.id;
    Alert.alert(
      'Report SOS Misuse',
      'Are you sure this SOS alert is fake or spam?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Report Misuse',
          style: 'destructive',
          onPress: async () => {
            if (!sosId) return;
            setReporting(true);
            try {
              if (onReportMisuse) {
                await onReportMisuse(sosId, 'Fake or spam emergency alert');
              }
              onClose();
            } catch (err) {
              console.error('Report misuse error:', err);
            } finally {
              setReporting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.emergencyBadge}>
              <Text style={styles.emergencyBadgeText}>EMERGENCY NEARBY</Text>
            </View>
            <Pressable
              onPress={onClose}
              style={({ pressed }) = accessibilityRole="button" accessibilityLabel="Button"> [styles.closeBtn, pressed && { opacity: 0.7 }]}
              android_ripple={{ color: 'rgba(0,0,0,0.1)', borderless: true, radius: 15 }}
            >
              <Ionicons name="close" size={24} color="#666" />
            </Pressable>
          </View>

          <View style={styles.content}>
            <View style={styles.typeIconContainer}>
              <MaterialCommunityIcons 
                name={sosData.emergency_type === 'medical' ? 'heart-pulse' : 'alert-decagram'} 
                size={40} 
                color="#FF3B30" 
              />
            </View>
            
            <Text style={styles.userName}>{sosData.user_name || 'Someone'} needs help!</Text>
            <Text style={styles.emergencyType}>{sosData.emergency_type?.toUpperCase() || 'EMERGENCY'}</Text>
            
            <View style={styles.locationContainer}>
              <Ionicons name="location" size={18} color="#FF3B30" />
              <Text style={styles.locationText}>{sosData.micro_location || 'Nearby'}</Text>
            </View>

            <View style={styles.mapContainer}>
              <SOSMap 
                latitude={parseFloat(sosData.latitude)} 
                longitude={parseFloat(sosData.longitude)} 
              />
            </View>

            <Pressable
              style={({ pressed }) = accessibilityRole="button" accessibilityLabel="Button"> [styles.reportMisuseBtn, (pressed || reporting) && { opacity: 0.8 }]}
              onPress={handleReportMisuse}
              disabled={reporting}
              android_ripple={{ color: 'rgba(255,59,48,0.2)', borderless: false }}
            >
              <Ionicons name="flag-outline" size={18} color="#FF3B30" />
              <Text style={styles.reportMisuseBtnText}>{reporting ? 'REPORTING...' : 'REPORT MISUSE'}</Text>
            </Pressable>
          </View>

          <View style={styles.footer}>
            <Pressable
              style={({ pressed }) = accessibilityRole="button" accessibilityLabel="Button"> [styles.cancelBtn, pressed && { opacity: 0.7 }]}
              onPress={onClose}
              android_ripple={{ color: 'rgba(0,0,0,0.05)', borderless: false }}
            >
              <Text style={styles.cancelBtnText}>Ignore</Text>
            </Pressable>
            
            <Pressable 
              style={({ pressed }) = accessibilityRole="button" accessibilityLabel="Button"> [
                styles.respondBtn,
                loading && styles.respondBtnDisabled,
                pressed && !loading && { opacity: 0.85 }
              ]} 
              onPress={handleRespond}
              disabled={loading}
              android_ripple={{ color: 'rgba(255,255,255,0.25)', borderless: false }}
            >
              <Text style={styles.respondBtnText}>I'M COMING</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    backgroundColor: '#FFF',
    borderRadius: 30,
    overflow: 'hidden',
    maxWidth: 400,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  emergencyBadge: {
    backgroundColor: '#FFEAEA',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
  },
  emergencyBadgeText: {
    color: '#FF3B30',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  closeBtn: {
    padding: 4,
  },
  content: {
    padding: 24,
    alignItems: 'center',
  },
  typeIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFEAEA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  userName: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 4,
  },
  emergencyType: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FF3B30',
    marginBottom: 16,
    letterSpacing: 2,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 20,
    width: '100%',
    justifyContent: 'center',
  },
  locationText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    fontWeight: '600',
  },
  mapContainer: {
    width: '100%',
    height: 180,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#F0F0F0',
    marginBottom: 16,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  reportMisuseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0F0',
    borderWidth: 1,
    borderColor: '#FFD6D6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 15,
  },
  reportMisuseBtnText: {
    color: '#FF3B30',
    fontSize: 12,
    fontWeight: '900',
    marginLeft: 8,
    letterSpacing: 1,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  cancelBtn: {
    flex: 1,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#999',
    fontSize: 16,
    fontWeight: '700',
  },
  respondBtn: {
    flex: 2,
    height: 54,
    backgroundColor: '#FF3B30',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  respondBtnDisabled: {
    opacity: 0.7,
  },
  respondBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
