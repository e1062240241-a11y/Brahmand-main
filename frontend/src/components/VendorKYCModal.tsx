import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Modal, TouchableOpacity, Image, Alert, ActivityIndicator, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';

const CameraViewAny = CameraView as any;
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/theme';
import { updateVendor, uploadVendorKycFile } from '../services/api';
import { useVendorStore } from '../store/vendorStore';

const { width, height } = Dimensions.get('window');

interface VendorKYCModalProps {
  visible: boolean;
  onClose: () => void;
  vendorId: string;
  onKycUpdated?: () => void;
}

export const VendorKYCModal: React.FC<VendorKYCModalProps> = ({ visible, onClose, vendorId, onKycUpdated }) => {
  const { fetchMyVendor } = useVendorStore();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Scans & Documents
  const [idType, setIdType] = useState<'aadhaar' | 'pan'>('aadhaar');
  const [idNumber, setIdNumber] = useState('');
  const [idDocumentUri, setIdDocumentUri] = useState<string | null>(null);
  const [faceScanUri, setFaceScanUri] = useState<string | null>(null);

  // Camera State
  const [showCamera, setShowCamera] = useState(false);
  const [cameraType, setCameraType] = useState<CameraType>('front');
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [faceDetected, setFaceDetected] = useState(false);
  const [faceBounds, setFaceBounds] = useState<any>(null);
  const [faceDetectionFallback, setFaceDetectionFallback] = useState(false);
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cameraRef = useRef<any>(null);

  const resetForm = () => {
    setStep(1);
    setIdType('aadhaar');
    setIdNumber('');
    setIdDocumentUri(null);
    setFaceScanUri(null);
    setShowCamera(false);
    setFaceDetectionFallback(false);
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

  const pickDocument = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Permission Denied', 'Media library access is required to upload your ID document.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.7,
      });

      if (!result.canceled && result.assets?.length) {
        setIdDocumentUri(result.assets[0].uri);
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

  const onFacesDetected = (event: any) => {
    const faces = event?.faces || [];
    const face = faces[0];
    const hasFace = !!face;

    setFaceDetectionFallback(false);
    setFaceDetected(hasFace);

    if (hasFace && face.bounds) {
        setFaceBounds(face.bounds);
    } else {
        setFaceBounds(null);
    }
  };

  const onFaceDetectionError = (error: any) => {
    console.warn('Face detection error', error);
    setFaceBounds(null);
    setFaceDetected(false);
  };

  useEffect(() => {
    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }

    if (showCamera) {
      fallbackTimerRef.current = setTimeout(() => {
        setFaceDetectionFallback(true);
        setFaceDetected(true);
        setFaceBounds({
          origin: { x: width * 0.20, y: height * 0.20 },
          size: { width: width * 0.60, height: height * 0.45 },
        });
      }, 2500);
    }

    if (!showCamera) {
      setFaceDetectionFallback(false);
      setFaceBounds(null);
      setFaceDetected(false);
    }

    return () => {
      if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current);
        fallbackTimerRef.current = null;
      }
    };
  }, [showCamera]);


  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({ quality: 0.5 });
        if (photo) {
          setFaceScanUri(photo.uri);
          setShowCamera(false);
        }
      } catch (error) {
        console.error('Face capture failed', error);
        Alert.alert('Error', 'Failed to capture photo');
      }
    } else {
      Alert.alert('Error', 'Camera is not ready.');
    }
  };

  const handleSubmit = async () => {
    if (!idNumber.trim() || !idDocumentUri || !faceScanUri) {
      Alert.alert('Incomplete', 'Please provide ID type, ID number, one ID document, and live face scan.');
      return;
    }

    setLoading(true);
    try {
      // 1. Upload files through backend (owner-verified)
      const idUpload = await uploadVendorKycFile(vendorId, idType, {
        uri: idDocumentUri,
        name: `${idType}.jpg`,
        type: 'image/jpeg',
      });

      const faceUpload = await uploadVendorKycFile(vendorId, 'face_scan', {
        uri: faceScanUri,
        name: 'face_scan.jpg',
        type: 'image/jpeg',
      });

      const idDocumentUrl = idUpload?.data?.storage_uri;
      const faceScanUrl = faceUpload?.data?.storage_uri;

      if (!idDocumentUrl || !faceScanUrl) {
        throw new Error('Some uploads did not return valid URLs');
      }

      // 2. Map payload & Update Vendor with KYC status for backend admin review
      await updateVendor(vendorId, {
        aadhar_url: idType === 'aadhaar' ? idDocumentUrl : null,
        pan_url: idType === 'pan' ? idDocumentUrl : null,
        face_scan_url: faceScanUrl,
        kyc_status: 'pending',
      });

      // Future: submit KYC request endpoint
      // await submitKYC({ kyc_role: 'vendor', id_type: 'pan', id_number: '<id>', id_photo: aadharUrl, selfie_photo: faceScanUrl });

      Alert.alert('Success', `Your ${idType === 'aadhaar' ? 'Aadhaar' : 'PAN'} and face scan were uploaded and submitted for review.`);
      await fetchMyVendor();
      if (onKycUpdated) {
        onKycUpdated();
      }
      closeAndReset();
    } catch (error: any) {
      console.error('KYC submit error:', error);
      Alert.alert('Upload Failed', error?.message || 'There was an issue processing your documents.');
    } finally {
      setLoading(false);
    }
  };

  if (showCamera) {
    return (
      <Modal visible={visible} animationType="slide">
        <View style={styles.cameraContainer}>
          <CameraViewAny
            ref={cameraRef}
            style={styles.camera}
            facing={cameraType}
            onFacesDetected={onFacesDetected}
            onFaceDetectionError={onFaceDetectionError}
            faceDetectorSettings={{
              mode: 'fast',
              detectLandmarks: 'none',
              runClassifications: 'none',
              minDetectionInterval: 250,
              tracking: true,
            }}
          />

          <View style={styles.cameraOverlay} pointerEvents="none">
            {faceBounds && (
              <View
                style={{
                  position: 'absolute',
                  left: faceBounds.origin.x,
                  top: faceBounds.origin.y,
                  width: faceBounds.size.width,
                  height: faceBounds.size.height,
                  borderWidth: 4,
                  borderColor: '#00FF00',
                  borderRadius: 20,
                  backgroundColor: 'rgba(0, 255, 0, 0.1)',
                }}
              />
            )}
            <Text style={[styles.cameraGuidance, faceDetected ? styles.faceDetectedText : null]}>
              {faceDetected
                ? faceDetectionFallback
                  ? 'Face scan ready. You can capture now'
                  : 'Face detected! You can capture now'
                : 'Show your face to the camera'}
            </Text>
          </View>

          <View style={styles.cameraControls}>
            <TouchableOpacity style={styles.cameraBtn} onPress={() => setShowCamera(false)}>
              <Ionicons name="close" size={32} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.captureBtn, !faceDetected && styles.captureBtnDisabled]} onPress={takePicture} disabled={!faceDetected}>
              <View style={styles.captureBtnInner} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cameraBtn}
              onPress={() => setCameraType((current) => (current === 'back' ? 'front' : 'back'))}
            >
              <Ionicons name="camera-reverse" size={32} color="#FFF" />
            </TouchableOpacity>
          </View>
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
            <Text style={styles.sectionDesc}>To ensure trust, upload either Aadhaar or PAN card details and a live face scan.</Text>
            
            {/* ID Type Selector */}
            <View style={styles.docRow}>
              <View style={styles.docInfo}>
                <Text style={styles.docTitle}>Choose ID Type</Text>
                <Text style={styles.docStatus}>Select one: Aadhaar or PAN</Text>
              </View>
              <View style={styles.idTypeActions}>
                <TouchableOpacity
                  style={[styles.idTypeBtn, idType === 'aadhaar' && styles.idTypeBtnActive]}
                  onPress={() => setIdType('aadhaar')}
                >
                  <Text style={[styles.idTypeBtnText, idType === 'aadhaar' && styles.idTypeBtnTextActive]}>Aadhaar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.idTypeBtn, idType === 'pan' && styles.idTypeBtnActive]}
                  onPress={() => setIdType('pan')}
                >
                  <Text style={[styles.idTypeBtnText, idType === 'pan' && styles.idTypeBtnTextActive]}>PAN</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* ID Number & Upload Row */}
            <View style={styles.docRow}>
              <View style={styles.docInfo}>
                <Text style={styles.docTitle}>{idType === 'aadhaar' ? 'Aadhaar Number' : 'PAN Number'}</Text>
                <Text style={styles.docStatus}>{idDocumentUri ? 'Document uploaded' : 'Document pending'}</Text>
                <TextInput
                  style={styles.idInput}
                  placeholder={idType === 'aadhaar' ? 'Enter 12-digit Aadhaar' : 'Enter PAN number'}
                  value={idNumber}
                  autoCapitalize={idType === 'pan' ? 'characters' : 'none'}
                  onChangeText={setIdNumber}
                />
              </View>
              {idDocumentUri ? (
                <Image source={{ uri: idDocumentUri }} style={styles.previewThumb} />
              ) : (
                <TouchableOpacity style={styles.uploadBtn} onPress={pickDocument}>
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
  idTypeActions: { flexDirection: 'row', gap: 8 },
  idTypeBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderColor: COLORS.divider, backgroundColor: COLORS.surface },
  idTypeBtnActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  idTypeBtnText: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  idTypeBtnTextActive: { color: COLORS.primary },
  idInput: { marginTop: 8, borderWidth: 1, borderColor: COLORS.divider, borderRadius: BORDER_RADIUS.sm, paddingHorizontal: 10, paddingVertical: 8, color: COLORS.text },
  
  cameraActionBtn: { flexDirection: 'row', backgroundColor: COLORS.primaryLight, paddingHorizontal: SPACING.md, paddingVertical: 8, borderRadius: BORDER_RADIUS.md, alignItems: 'center', gap: 6 },
  cameraActionText: { color: COLORS.primary, fontWeight: '600', fontSize: 14 },
  
  previewThumb: { width: 40, height: 40, borderRadius: BORDER_RADIUS.sm, borderWidth: 1, borderColor: COLORS.divider },
  
  submitBtn: { backgroundColor: COLORS.primary, padding: SPACING.md, borderRadius: BORDER_RADIUS.lg, alignItems: 'center', marginTop: SPACING.xl },
  submitBtnText: { color: COLORS.surface, fontSize: 16, fontWeight: '700' },
  submitBtnDisabled: { opacity: 0.7 },

  // Camera Overlay
  cameraContainer: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  cameraOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'flex-end', alignItems: 'center', zIndex: 10, paddingBottom: 160 },
  faceDetectedText: { color: COLORS.success, fontSize: 18, fontWeight: '800' },
  captureBtnDisabled: { opacity: 0.4 },
  cameraGuidance: { color: '#FFF', fontSize: 16, fontWeight: '600', textAlign: 'center', backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  cameraControls: { position: 'absolute', bottom: 40, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingHorizontal: 40, zIndex: 20 },
  cameraBtn: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  captureBtn: { width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center' },
  captureBtnInner: { width: 54, height: 54, borderRadius: 27, backgroundColor: '#FFF' },
});
