import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Image, Alert, ActivityIndicator, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/theme';
import { uploadFileToFirebase } from '../services/firebase/storageService';
import { updateVendor } from '../services/api';
import { useVendorStore } from '../store/vendorStore';

const { width } = Dimensions.get('window');

interface VendorKYCModalProps {
  visible: boolean;
  onClose: () => void;
  vendorId: string;
}

export const VendorKYCModal: React.FC<VendorKYCModalProps> = ({ visible, onClose, vendorId }) => {
  const { fetchMyVendor } = useVendorStore();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Scans & Documents
  const [aadharUri, setAadharUri] = useState<string | null>(null);
  const [panUri, setPanUri] = useState<string | null>(null);
  const [faceScanUri, setFaceScanUri] = useState<string | null>(null);

  // Camera State
  const [showCamera, setShowCamera] = useState(false);
  const [cameraType, setCameraType] = useState<CameraType>('front');
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const cameraRef = useRef<any>(null);

  const resetForm = () => {
    setStep(1); setAadharUri(null); setPanUri(null); setFaceScanUri(null);
    setShowCamera(false);
  };

  const closeAndReset = () => {
    resetForm();
    onClose();
  };

  useEffect(() => {
    if (visible && !vendorId) {
      Alert.alert('Error', 'Vendor ID missing. Please register your business first.');
      onClose();
    }
  }, [visible, vendorId]);

  const pickDocument = async (type: 'aadhar' | 'pan') => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7,
      });
      if (!result.canceled) {
        if (type === 'aadhar') setAadharUri(result.assets[0].uri);
        else setPanUri(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const startFaceScan = async () => {
    if (!cameraPermission || cameraPermission.status !== 'granted') {
      const permissionResponse = await requestCameraPermission();
      if (permissionResponse.status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera access is required for verification.');
        return;
      }
    }
    setShowCamera(true);
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({ quality: 0.5 });
        if (photo) {
          setFaceScanUri(photo.uri);
          setShowCamera(false);
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to capture photo');
      }
    } else {
      Alert.alert('Error', 'Camera is not ready.');
    }
  };

  const handleSubmit = async () => {
    if (!aadharUri || !panUri || !faceScanUri) {
      Alert.alert('Incomplete', 'Please upload all required documents.');
      return;
    }
    
    setLoading(true);
    try {
      // 1. Upload to Firebase Storage
      let aadharUrl = '';
      let panUrl = '';
      let faceScanUrl = '';
      try {
        aadharUrl = await uploadFileToFirebase(aadharUri, `vendors/${vendorId}/aadhar.jpg`);
      } catch (e) {
         console.warn("Could not upload aadhar:", e);
      }
      try {
        panUrl = await uploadFileToFirebase(panUri, `vendors/${vendorId}/pan.jpg`);
      } catch (e) {
         console.warn("Could not upload pan:", e);
      }
      try {
        faceScanUrl = await uploadFileToFirebase(faceScanUri, `vendors/${vendorId}/facescan.jpg`);
      } catch (e) {
         console.warn("Could not upload facescan:", e);
      }
      
      // 2. Map payload & Update Vendor
      await updateVendor(vendorId, {
        aadhar_url: aadharUrl || null,
        pan_url: panUrl || null,
        face_scan_url: faceScanUrl || null
      });
      
      Alert.alert('Success', 'KYC Documents uploaded successfully!');
      await fetchMyVendor();
      closeAndReset();
    } catch (error) {
      console.error(error);
      Alert.alert('Upload Failed', 'There was an issue processing your documents.');
    } finally {
      setLoading(false);
    }
  };

  if (showCamera) {
    return (
      <Modal visible={visible} animationType="slide">
        <View style={styles.cameraContainer}>
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing={cameraType}
          >
            {/* Overlay Grid for Face Alignment */}
            <View style={styles.cameraOverlay}>
              <View style={styles.faceOvalRow}>
                 <View style={styles.faceOval} />
              </View>
              <Text style={styles.cameraGuidance}>Position your face inside the oval</Text>
            </View>
            
            <View style={styles.cameraControls}>
              <TouchableOpacity style={styles.cameraBtn} onPress={() => setShowCamera(false)}>
                <Ionicons name="close" size={32} color="#FFF" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.captureBtn} onPress={takePicture}>
                <View style={styles.captureBtnInner} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.cameraBtn} 
                onPress={() => setCameraType(current => current === 'back' ? 'front' : 'back')}
              >
                <Ionicons name="camera-reverse" size={32} color="#FFF" />
              </TouchableOpacity>
            </View>
          </CameraView>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconBg}><Ionicons name="id-card" size={20} color={COLORS.primary} /></View>
              <Text style={styles.headerTitle}>KYC Verification</Text>
            </View>
            <TouchableOpacity onPress={closeAndReset} disabled={loading}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.content}>
            <Text style={styles.sectionDesc}>To ensure trust, verify your identity by providing government documents and a live face scan.</Text>
            
            {/* Aadhar Row */}
            <View style={styles.docRow}>
               <View style={styles.docInfo}>
                  <Text style={styles.docTitle}>Aadhar Card</Text>
                  <Text style={styles.docStatus}>{aadharUri ? 'Uploaded' : 'Pending'}</Text>
               </View>
               {aadharUri ? (
                 <Image source={{ uri: aadharUri }} style={styles.previewThumb} />
               ) : (
                 <TouchableOpacity style={styles.uploadBtn} onPress={() => pickDocument('aadhar')}>
                    <Ionicons name="cloud-upload" size={18} color="#FFF" />
                    <Text style={styles.uploadBtnText}>Upload</Text>
                 </TouchableOpacity>
               )}
            </View>

            {/* PAN Row */}
            <View style={styles.docRow}>
               <View style={styles.docInfo}>
                  <Text style={styles.docTitle}>PAN Card</Text>
                  <Text style={styles.docStatus}>{panUri ? 'Uploaded' : 'Pending'}</Text>
               </View>
               {panUri ? (
                 <Image source={{ uri: panUri }} style={styles.previewThumb} />
               ) : (
                 <TouchableOpacity style={styles.uploadBtn} onPress={() => pickDocument('pan')}>
                    <Ionicons name="cloud-upload" size={18} color="#FFF" />
                    <Text style={styles.uploadBtnText}>Upload</Text>
                 </TouchableOpacity>
               )}
            </View>

            {/* Face Scan Row */}
            <View style={styles.docRow}>
               <View style={styles.docInfo}>
                  <Text style={styles.docTitle}>Live Face Scan</Text>
                  <Text style={styles.docStatus}>{faceScanUri ? 'Captured' : 'Pending'}</Text>
               </View>
               {faceScanUri ? (
                 <Image source={{ uri: faceScanUri }} style={styles.previewThumb} />
               ) : (
                 <TouchableOpacity style={styles.cameraActionBtn} onPress={startFaceScan}>
                    <Ionicons name="camera" size={18} color={COLORS.primary} />
                    <Text style={styles.cameraActionText}>Start Scan</Text>
                 </TouchableOpacity>
               )}
            </View>

            {/* Submit Action */}
            <TouchableOpacity 
              style={[styles.submitBtn, loading && styles.submitBtnDisabled]} 
              onPress={handleSubmit} 
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.submitBtnText}>Submit KYC Documents</Text>}
            </TouchableOpacity>
            
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  container: { backgroundColor: COLORS.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.divider },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  iconBg: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: SPACING.sm },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  content: { padding: SPACING.lg },
  sectionDesc: { fontSize: 14, color: COLORS.textLight, marginBottom: SPACING.lg, lineHeight: 20 },
  
  docRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.divider },
  docInfo: { flex: 1 },
  docTitle: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  docStatus: { fontSize: 12, color: COLORS.textLight, marginTop: 4 },
  
  uploadBtn: { flexDirection: 'row', backgroundColor: COLORS.primary, paddingHorizontal: SPACING.md, paddingVertical: 8, borderRadius: BORDER_RADIUS.md, alignItems: 'center', gap: 6 },
  uploadBtnText: { color: '#FFF', fontWeight: '600', fontSize: 14 },
  
  cameraActionBtn: { flexDirection: 'row', backgroundColor: COLORS.primaryLight, paddingHorizontal: SPACING.md, paddingVertical: 8, borderRadius: BORDER_RADIUS.md, alignItems: 'center', gap: 6 },
  cameraActionText: { color: COLORS.primary, fontWeight: '600', fontSize: 14 },
  
  previewThumb: { width: 40, height: 40, borderRadius: BORDER_RADIUS.sm, borderWidth: 1, borderColor: COLORS.divider },
  
  submitBtn: { backgroundColor: COLORS.primary, padding: SPACING.md, borderRadius: BORDER_RADIUS.lg, alignItems: 'center', marginTop: SPACING.xl },
  submitBtnText: { color: COLORS.surface, fontSize: 16, fontWeight: '700' },
  submitBtnDisabled: { opacity: 0.7 },

  // Camera Overlay
  cameraContainer: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  cameraOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  faceOvalRow: { width: width * 0.7, height: width * 0.9, borderWidth: 3, borderColor: '#00FF00', borderRadius: width * 0.4, borderStyle: 'dashed', backgroundColor: 'transparent' },
  faceOval: { flex: 1 },
  cameraGuidance: { color: '#FFF', fontSize: 16, fontWeight: '600', marginTop: 30, textAlign: 'center', backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  cameraControls: { position: 'absolute', bottom: 40, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingHorizontal: 40 },
  cameraBtn: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  captureBtn: { width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center' },
  captureBtnInner: { width: 54, height: 54, borderRadius: 27, backgroundColor: '#FFF' },
});
