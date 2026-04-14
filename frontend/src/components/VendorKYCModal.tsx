import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Modal, TouchableOpacity, Image, Alert, ActivityIndicator, Dimensions, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

let TextRecognition: typeof import('expo-text-recognition') | null = null;
try {
  TextRecognition = require('expo-text-recognition');
} catch (error) {
  console.warn('expo-text-recognition module unavailable:', error);
}

const CameraViewAny = CameraView as any;
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/theme';
import {
  updateVendor,
  uploadVendorKycFile,
  extractKycTextFromImage,
  extractUserKycTextFromImage,
  generateVendorAadhaarOtp,
  verifyVendorAadhaarOtp,
  generateUserAadhaarOtp,
  verifyUserAadhaarOtp,
  submitKYC,
} from '../services/api';
import { useVendorStore } from '../store/vendorStore';
import { useAuthStore } from '../store/authStore';

const { width, height } = Dimensions.get('window');
const PERSISTED_AADHAAR_PREFIX = 'vendor_kyc_aadhaar_';

interface VendorKYCModalProps {
  visible: boolean;
  onClose: () => void;
  vendorId: string;
  onKycUpdated?: () => void;
  allowUserKycFallback?: boolean;
}

export const VendorKYCModal: React.FC<VendorKYCModalProps> = ({ visible, onClose, vendorId, onKycUpdated, allowUserKycFallback = false }) => {
  const { myVendor, fetchMyVendor } = useVendorStore();
  const { user } = useAuthStore();
  const isVendorFlow = !!vendorId;
  const isUserFlow = !vendorId && allowUserKycFallback;
  const hasVerifiedKyc = Boolean(
    (user as any)?.kyc_status === 'verified' ||
    Boolean((user as any)?.is_verified) ||
    myVendor?.kyc_status === 'verified'
  );
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Scans & Documents
  const [idType, setIdType] = useState<'aadhaar' | 'pan'>('aadhaar');
  const [idNumber, setIdNumber] = useState('');
  const [idDocumentUri, setIdDocumentUri] = useState<string | null>(null);
  const [faceScanUri, setFaceScanUri] = useState<string | null>(null);
  const [documentPicking, setDocumentPicking] = useState(false);
  const [aadhaarExtracting, setAadhaarExtracting] = useState(false);
  const [ocrInProgress, setOcrInProgress] = useState(false);
  const [hasAutoExtracted, setHasAutoExtracted] = useState(false);
  const [aadhaarMismatch, setAadhaarMismatch] = useState(false);
  const [previousAadhaar, setPreviousAadhaar] = useState<string | null>(null);
  const [otpFlowActive, setOtpFlowActive] = useState(false);
  const [otpReferenceId, setOtpReferenceId] = useState('');
  const [otpValue, setOtpValue] = useState('');
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [otpLoading, setOtpLoading] = useState(false);

  const extractAadhaarFromText = (text: string) => {
    const matches = text.match(/\d{4}[- ]?\d{4}[- ]?\d{4}/g) || text.match(/\d{12}/g);
    if (!matches || matches.length === 0) return null;

    for (const match of matches) {
      const normalized = match.replace(/[^\d]/g, '');
      if (normalized.length === 12) {
        return normalized;
      }
    }
    return null;
  };

  const hasAadhaarSignals = (text: string) => {
    if (!text) return false;
    const normalized = text.toLowerCase();
    const keywords = [
      'aadhaar',
      'aadhar',
      'uidai',
      'government of india',
      'govt of india',
      'dob',
      'male',
      'female',
    ];

    if (keywords.some((keyword) => normalized.includes(keyword))) {
      return true;
    }

    return !!extractAadhaarFromText(text);
  };

  const tryAutoExtractAadhaar = async (uri?: string | null, fileName?: string | null) => {
    if (idType !== 'aadhaar') return null;

    const candidates = [] as string[];
    if (fileName) {
      candidates.push(fileName);
    }
    if (uri) {
      const decodedUri = decodeURIComponent(uri || '');
      candidates.push(decodedUri);
      const uriFilename = decodedUri.split('/').pop() || '';
      if (uriFilename) candidates.push(uriFilename);
    }

    for (const candidate of candidates) {
      const aadhaar = extractAadhaarFromText(candidate);
      if (aadhaar) {
        await saveAadhaarNumber(aadhaar);
        setHasAutoExtracted(true);
        return aadhaar;
      }
    }
    return null;
  };

  const tryRecognizeAadhaarFromImage = async (uri: string) => {
    if (idType !== 'aadhaar' || !uri || !TextRecognition || !TextRecognition.getTextFromFrame) {
      return { aadhaar: null as string | null, rawText: '' };
    }

    try {
      const recognizedLines = await TextRecognition.getTextFromFrame(uri, false);
      const rawText = Array.isArray(recognizedLines) ? recognizedLines.join(' ') : '';

      if (!rawText) return { aadhaar: null as string | null, rawText: '' };

      const fromText = extractAadhaarFromText(rawText);
      if (fromText) {
        await saveAadhaarNumber(fromText);
        setHasAutoExtracted(true);
        return { aadhaar: fromText, rawText };
      }

      return { aadhaar: null as string | null, rawText };
    } catch (error) {
      console.warn('Text recognition failed', error);
    }

    return { aadhaar: null as string | null, rawText: '' };
  };

  // Camera State
  const [showCamera, setShowCamera] = useState(false);
  const [cameraType, setCameraType] = useState<CameraType>('front');
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [faceDetected, setFaceDetected] = useState(false);
  const [faceBounds, setFaceBounds] = useState<any>(null);
  const [faceDetectionFallback, setFaceDetectionFallback] = useState(false);
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cameraRef = useRef<any>(null);

  const getAadhaarStorageKey = () => `${PERSISTED_AADHAAR_PREFIX}${vendorId}`;

  const saveAadhaarNumber = async (value: string) => {
    try {
      setIdNumber(value);
      setPreviousAadhaar(value);
      setAadhaarMismatch(false);
      if (vendorId) {
        await AsyncStorage.setItem(getAadhaarStorageKey(), value);
      }
    } catch (error) {
      console.warn('Error saving Aadhaar locally', error);
    }
  };

  const resetForm = () => {
    setStep(1);
    setIdType('aadhaar');
    setIdNumber('');
    setIdDocumentUri(null);
    setFaceScanUri(null);
    setShowCamera(false);
    setFaceDetectionFallback(false);
    setOcrInProgress(false);
    setHasAutoExtracted(false);
    setOtpFlowActive(false);
    setOtpReferenceId('');
    setOtpValue('');
    setOtpCooldown(0);
    setOtpLoading(false);
  };

  const closeAndReset = () => {
    resetForm();
    onClose();
  };

  useEffect(() => {
    if (visible && hasVerifiedKyc) {
      onClose();
      return;
    }

    const loadSavedAadhaar = async () => {
      if (!visible || !vendorId || idType !== 'aadhaar') return;
      try {
        const key = getAadhaarStorageKey();
        const saved = await AsyncStorage.getItem(key);
        if (saved) {
          setIdNumber(saved);
          setPreviousAadhaar(saved);
          setHasAutoExtracted(true);
        }
      } catch (error) {
        console.warn('Failed to load saved Aadhaar', error);
      }
    };

    loadSavedAadhaar();
  }, [visible, hasVerifiedKyc, onClose, vendorId, idType]);

  useEffect(() => {
    if (!otpFlowActive || otpCooldown <= 0) return;
    const timer = setInterval(() => {
      setOtpCooldown((current) => (current > 0 ? current - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [otpFlowActive, otpCooldown]);

  const pickDocument = async () => {
    if (documentPicking) return;

    setDocumentPicking(true);
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
        const asset = result.assets[0];
        const uri = asset.uri;
        const fileName = (asset as any).fileName || null;
        setIdDocumentUri(uri);
        setHasAutoExtracted(false);

        if (idType === 'aadhaar') {
          setAadhaarExtracting(true);
          let combinedEvidenceText = `${fileName || ''} ${uri || ''}`;
          let finalAadhaarNumber: string | null = null;

          const foundFromMeta = await tryAutoExtractAadhaar(uri, fileName);
          if (foundFromMeta) {
            finalAadhaarNumber = foundFromMeta;
          }

          if (!foundFromMeta) {
            const postExtract = extractAadhaarFromText(fileName || uri || '');
            if (postExtract) {
              setIdNumber(postExtract);
              setHasAutoExtracted(true);
              finalAadhaarNumber = postExtract;
            } else {
              setOcrInProgress(true);
              const localOcrResult = await tryRecognizeAadhaarFromImage(uri);
              setOcrInProgress(false);
              if (localOcrResult.rawText) {
                combinedEvidenceText += ` ${localOcrResult.rawText}`;
              }

              if (localOcrResult.aadhaar) {
                setIdNumber(localOcrResult.aadhaar);
                finalAadhaarNumber = localOcrResult.aadhaar;
              } else if (isVendorFlow) {
                // Backend Google Cloud Vision fallback
                try {
                  const response = await extractKycTextFromImage(vendorId, {
                    uri,
                    name: fileName || 'kyc-input.jpg',
                    type: 'image/jpeg',
                  });
                  const visionText = response?.data?.text || '';
                  if (visionText) {
                    combinedEvidenceText += ` ${visionText}`;
                  }
                  const extracted = extractAadhaarFromText(visionText);
                  if (extracted) {
                    await saveAadhaarNumber(extracted);
                    setHasAutoExtracted(true);
                    finalAadhaarNumber = extracted;
                  }
                } catch (backendError) {
                  console.warn('Google Vision fallback failed', backendError);
                }
              } else if (isUserFlow) {
                try {
                  const response = await extractUserKycTextFromImage({
                    uri,
                    name: fileName || 'kyc-input.jpg',
                    type: asset.type || 'image/jpeg',
                  });
                  const visionText = response?.data?.text || '';
                  if (visionText) {
                    combinedEvidenceText += ` ${visionText}`;
                  }
                  const extracted = extractAadhaarFromText(visionText);
                  if (extracted) {
                    await saveAadhaarNumber(extracted);
                    setHasAutoExtracted(true);
                    finalAadhaarNumber = extracted;
                  }
                } catch (backendError) {
                  console.warn('User Vision fallback failed', backendError);
                }
              }
            }
          }

          if (finalAadhaarNumber && previousAadhaar && previousAadhaar !== finalAadhaarNumber) {
            setAadhaarMismatch(true);
          } else {
            setAadhaarMismatch(false);
          }

          if (!finalAadhaarNumber) {
            setIdDocumentUri(null);
            setIdNumber('');
            setHasAutoExtracted(false);
            setAadhaarExtracting(false);
            Alert.alert('OCR Required', 'Could not extract Aadhaar number from image. Please upload a clearer Aadhaar image.');
            return;
          }
          setAadhaarExtracting(false);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    } finally {
      setDocumentPicking(false);
      setOcrInProgress(false);
      setAadhaarExtracting(false);
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
    if (!idNumber.trim()) {
      Alert.alert('Incomplete', 'Please provide your ID number.');
      return;
    }

    if (!faceScanUri) {
      Alert.alert('Face Scan Required', 'Please complete live face scan before submitting KYC.');
      return;
    }

    if (!isUserFlow && (!idDocumentUri || !faceScanUri)) {
      Alert.alert('Incomplete', 'Please provide ID type, ID number, one ID document, and live face scan.');
      return;
    }

    if (idType === 'aadhaar' && (idNumber.trim().length !== 12 || !/^\d{12}$/.test(idNumber.trim()))) {
      Alert.alert('Invalid Aadhaar', 'Aadhaar number must be 12 digits.');
      return;
    }

    if (idDocumentUri && !hasAutoExtracted) {
      Alert.alert('OCR Required', 'If Aadhaar image is uploaded, OCR extraction of Aadhaar number is mandatory.');
      return;
    }

    if (idType === 'pan' && idNumber.trim().length !== 10) {
      Alert.alert('Invalid PAN', 'PAN number must be 10 characters.');
      return;
    }

    setLoading(true);
    try {
      if (isUserFlow) {
        if (idType === 'aadhaar') {
          const otpResponse = await generateUserAadhaarOtp({
            aadhaar_number: idNumber.trim(),
            consent: 'Y',
            reason: 'Jobs KYC Aadhaar verification',
          });
          const referenceId = otpResponse?.data?.reference_id || otpResponse?.data?.sandbox_response?.reference_id || otpResponse?.data?.sandbox_response?.data?.reference_id;
          if (!referenceId) {
            throw new Error('OTP generated but reference_id was not returned by sandbox');
          }

          setOtpReferenceId(referenceId);
          setOtpFlowActive(true);
          setOtpCooldown(30);
          Alert.alert('OTP Sent', 'Aadhaar OTP sent successfully. Please verify to complete KYC.');
          return;
        }

        await submitKYC({
          kyc_role: 'organizer',
          id_type: 'pan',
          id_number: idNumber.trim().toUpperCase(),
        });

        if (onKycUpdated) {
          onKycUpdated();
        }
        Alert.alert('Submitted', 'Your KYC was submitted and sent for review.');
        closeAndReset();
        return;
      }

      if (!isVendorFlow) {
        Alert.alert('Business registration required', 'Please register your business first to continue vendor KYC.');
        return;
      }

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

      if (idType === 'aadhaar') {
        const otpResponse = await generateVendorAadhaarOtp(vendorId, {
          aadhaar_number: idNumber.trim(),
          consent: 'Y',
          reason: 'Vendor KYC Aadhaar verification',
        });
        const referenceId = otpResponse?.data?.reference_id || otpResponse?.data?.sandbox_response?.reference_id || otpResponse?.data?.sandbox_response?.data?.reference_id;
        if (!referenceId) {
          throw new Error('OTP generated but reference_id was not returned by sandbox');
        }

        setOtpReferenceId(referenceId);
        setOtpFlowActive(true);
        setOtpCooldown(30);
        Alert.alert('OTP Sent', 'Aadhaar OTP sent successfully. Please verify to complete KYC.');
        return;
      }

      Alert.alert('Success', 'Your PAN and face scan were uploaded and submitted for review.');
      await fetchMyVendor();
      if (onKycUpdated) {
        onKycUpdated();
      }
      closeAndReset();
    } catch (error: any) {
      console.error('KYC submit error:', error);
      const backendDetail = error?.response?.data?.detail;
      const detailMessage = typeof backendDetail === 'string'
        ? backendDetail
        : backendDetail?.message || JSON.stringify(backendDetail || '');
      Alert.alert('Upload Failed', detailMessage || error?.message || 'There was an issue processing your documents.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpReferenceId) {
      Alert.alert('Missing Reference', 'Please generate OTP first.');
      return;
    }
    if (!otpValue.trim()) {
      Alert.alert('Missing OTP', 'Please enter the Aadhaar OTP.');
      return;
    }

    setOtpLoading(true);
    try {
      if (isUserFlow) {
        await verifyUserAadhaarOtp({
          reference_id: otpReferenceId,
          otp: otpValue.trim(),
        });

        await submitKYC({
          kyc_role: 'organizer',
          id_type: 'aadhaar',
          id_number: idNumber.trim(),
        });

        if (onKycUpdated) {
          onKycUpdated();
        }
        Alert.alert('Submitted', 'Aadhaar OTP verified. KYC sent for review.');
        closeAndReset();
        return;
      }

      if (!isVendorFlow) {
        Alert.alert('Business registration required', 'Please register your business first to continue vendor KYC.');
        return;
      }

      await verifyVendorAadhaarOtp(vendorId, {
        reference_id: otpReferenceId,
        otp: otpValue.trim(),
      });

      await fetchMyVendor();
      if (onKycUpdated) {
        onKycUpdated();
      }
      Alert.alert('Submitted', 'Aadhaar OTP verified. KYC sent to admin for review.');
      closeAndReset();
    } catch (error: any) {
      const backendDetail = error?.response?.data?.detail;
      const detailMessage = typeof backendDetail === 'string'
        ? backendDetail
        : backendDetail?.message || JSON.stringify(backendDetail || '');
      Alert.alert('OTP Verification Failed', detailMessage || error?.message || 'Unable to verify OTP. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (otpCooldown > 0 || !idNumber.trim()) return;

    setOtpLoading(true);
    try {
      if (isUserFlow) {
        const otpResponse = await generateUserAadhaarOtp({
          aadhaar_number: idNumber.trim(),
          consent: 'Y',
          reason: 'Jobs KYC Aadhaar verification resend',
        });
        const referenceId = otpResponse?.data?.reference_id || otpResponse?.data?.sandbox_response?.reference_id || otpResponse?.data?.sandbox_response?.data?.reference_id;
        if (referenceId) {
          setOtpReferenceId(referenceId);
        }
        setOtpCooldown(30);
        Alert.alert('OTP Resent', 'A new Aadhaar OTP has been sent.');
        return;
      }

      if (!isVendorFlow) {
        Alert.alert('Business registration required', 'Please register your business first to continue vendor KYC.');
        return;
      }

      const otpResponse = await generateVendorAadhaarOtp(vendorId, {
        aadhaar_number: idNumber.trim(),
        consent: 'Y',
        reason: 'Vendor KYC Aadhaar verification resend',
      });
      const referenceId = otpResponse?.data?.reference_id || otpResponse?.data?.sandbox_response?.reference_id || otpResponse?.data?.sandbox_response?.data?.reference_id;
      if (referenceId) {
        setOtpReferenceId(referenceId);
      }
      setOtpCooldown(30);
      Alert.alert('OTP Resent', 'A new Aadhaar OTP has been sent.');
    } catch (error: any) {
      Alert.alert('Resend Failed', error?.message || 'Unable to resend OTP right now.');
    } finally {
      setOtpLoading(false);
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
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={16}
      >
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

          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {!isVendorFlow && !isUserFlow ? (
              <View style={styles.infoCard}>
                <Text style={styles.docTitle}>Business registration required</Text>
                <Text style={styles.docStatus}>
                  Please register your business first to continue vendor KYC.
                </Text>
              </View>
            ) : (
              <>
            <Text style={styles.sectionDesc}>Aadhaar verification only. Enter Aadhaar number directly, or upload Aadhaar image to auto-extract number via OCR.</Text>
            
            {/* ID Number & Upload Row */}
            <View style={styles.docRow}>
              <View style={styles.docInfo}>
                <Text style={styles.docTitle}>Aadhaar Number</Text>
                <Text style={styles.docStatus}>{idDocumentUri ? 'Aadhaar uploaded (OCR required)' : 'Enter number or upload Aadhaar image'}</Text>
                <TextInput
                  style={styles.idInput}
                  placeholder="Enter 12-digit Aadhaar"
                  value={idNumber}
                  autoCapitalize="none"
                  keyboardType="number-pad"
                  maxLength={12}
                  onChangeText={(value) => setIdNumber(value.replace(/[^\d]/g, '').slice(0, 12))}
                />
              </View>
              <View style={styles.docActionCol}>
                {idDocumentUri && <Image source={{ uri: idDocumentUri }} style={styles.previewThumb} />}
                <TouchableOpacity
                  style={[styles.uploadBtn, (documentPicking || loading) && styles.uploadBtnDisabled]}
                  onPress={pickDocument}
                  disabled={documentPicking || loading}
                >
                  <Ionicons name="cloud-upload" size={18} color="#FFF" />
                  <Text style={styles.uploadBtnText}>
                    {documentPicking
                      ? 'Picking...'
                      : idDocumentUri || !!previousAadhaar
                        ? 'Upload Different Image'
                        : 'Upload'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Live face scan section */}
            <View style={styles.docRow}>
              <View style={styles.docInfo}>
                <Text style={styles.docTitle}>Live Face Scan</Text>
                <Text style={styles.docStatus}>{faceScanUri ? 'Face scan captured' : 'Scan a live face using camera'}</Text>
                {faceScanUri && <Text style={styles.faceScanHint}>Tap again to re-scan</Text>}
              </View>
              {faceScanUri ? (
                <Image source={{ uri: faceScanUri }} style={styles.previewThumb} />
              ) : (
                <TouchableOpacity style={styles.uploadBtn} onPress={startFaceScan}>
                  <Ionicons name="camera" size={18} color="#FFF" />
                  <Text style={styles.uploadBtnText}>Scan Face</Text>
                </TouchableOpacity>
              )}
            </View>

            {aadhaarExtracting && (
              <Text style={styles.ocrInfo}>Please wait, extracting Aadhaar details...</Text>
            )}

            {ocrInProgress && !aadhaarExtracting && (
              <Text style={styles.ocrInfo}>Scanning document text for Aadhaar number...</Text>
            )}

            {previousAadhaar && (
              <Text style={styles.autoExtractInfo}>
                Previously uploaded Aadhaar: {previousAadhaar}
              </Text>
            )}

            {aadhaarMismatch && (
              <Text style={styles.ocrError}>
                Uploaded image Aadhaar does not match previously saved number. Please upload a different image or correct Aadhaar number.
              </Text>
            )}

            {hasAutoExtracted && idNumber.length === 12 && !aadhaarMismatch && (
              <Text style={styles.autoExtractInfo}>
                Aadhaar number extracted automatically: {idNumber}
              </Text>
            )}

            {otpFlowActive ? (
              <View style={styles.otpCard}>
                <Text style={styles.docTitle}>Aadhaar OTP Verification</Text>
                <Text style={styles.docStatus}>Enter OTP sent to Aadhaar linked mobile number</Text>
                <TextInput
                  style={styles.idInput}
                  placeholder="Enter OTP"
                  value={otpValue}
                  keyboardType="number-pad"
                  onChangeText={setOtpValue}
                  maxLength={8}
                />
                <TouchableOpacity
                  style={styles.textActionWrap}
                  onPress={handleVerifyOtp}
                  disabled={otpLoading}
                >
                  {otpLoading ? (
                    <ActivityIndicator color={COLORS.primary} />
                  ) : (
                    <Text style={[styles.textAction, otpLoading && styles.textActionDisabled]}>Verify OTP</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.textActionWrap}
                  onPress={handleResendOtp}
                  disabled={otpCooldown > 0 || otpLoading}
                >
                  <Text style={[styles.textAction, (otpCooldown > 0 || otpLoading) && styles.textActionDisabled]}>
                    {otpCooldown > 0 ? `Resend OTP in ${otpCooldown}s` : 'Resend OTP'}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.submitBtn, (loading || documentPicking || aadhaarExtracting || ocrInProgress || !/^\d{12}$/.test(idNumber.trim()) || (idDocumentUri ? !hasAutoExtracted : false) || aadhaarMismatch || !faceScanUri) && styles.submitBtnDisabled]}
                onPress={handleSubmit}
                disabled={loading || documentPicking || aadhaarExtracting || ocrInProgress || !/^\d{12}$/.test(idNumber.trim()) || (idDocumentUri ? !hasAutoExtracted : false) || aadhaarMismatch || !faceScanUri}
              >
                {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.submitBtnText}>Submit KYC Documents</Text>}
              </TouchableOpacity>
            )}
              </>
            )}

          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  container: { backgroundColor: COLORS.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 24, maxHeight: '92%' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.divider },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  iconBg: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: SPACING.sm },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  content: { paddingHorizontal: SPACING.lg },
  contentContainer: { paddingTop: SPACING.lg, paddingBottom: 36 },
  infoCard: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
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
  autoExtractInfo: { marginTop: 8, color: COLORS.success, fontSize: 13, fontWeight: '500' },
  ocrError: { marginTop: 8, color: COLORS.error || '#d32f2f', fontSize: 13, fontWeight: '600' },
  ocrInfo: { marginTop: 8, color: COLORS.primary, fontSize: 13, fontWeight: '500' },
  
  cameraActionBtn: { flexDirection: 'row', backgroundColor: COLORS.primaryLight, paddingHorizontal: SPACING.md, paddingVertical: 8, borderRadius: BORDER_RADIUS.md, alignItems: 'center', gap: 6 },
  cameraActionText: { color: COLORS.primary, fontWeight: '600', fontSize: 14 },
  
  previewThumb: { width: 40, height: 40, borderRadius: BORDER_RADIUS.sm, borderWidth: 1, borderColor: COLORS.divider },
  docActionCol: { alignItems: 'center', gap: 8 },
  
  submitBtn: { backgroundColor: COLORS.primary, padding: SPACING.md, borderRadius: BORDER_RADIUS.lg, alignItems: 'center', marginTop: SPACING.xl },
  submitBtnText: { color: COLORS.surface, fontSize: 16, fontWeight: '700' },
  submitBtnDisabled: { opacity: 0.7 },
  faceScanHint: { fontSize: 12, color: COLORS.textLight, marginTop: 4 },
  uploadBtnDisabled: { opacity: 0.6 },
  otpCard: { marginTop: SPACING.lg, gap: 10 },
  textActionWrap: { paddingVertical: 6 },
  textAction: { color: COLORS.primary, fontSize: 15, fontWeight: '700', textDecorationLine: 'underline' },
  textActionDisabled: { opacity: 0.5 },

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
