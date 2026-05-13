import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { getFirebaseStorage, getFirebaseAuth } from '../../src/services/firebase/config';
import { ref, uploadBytes, getDownloadURL as getStorageDownloadURL } from 'firebase/storage';
import { usePersonalityStore } from '../../src/store/personalityStore';
import axios from 'axios';
import { COLORS } from '../../src/constants/theme';

const { width } = Dimensions.get('window');

const DOC_TYPES = [
  { id: 'aadhaar', label: 'Aadhaar Card' },
  { id: 'pan', label: 'PAN Card' },
  { id: 'voter', label: 'Voter ID' },
  { id: 'passport', label: 'Passport' },
  { id: 'dl', label: 'Driving License' },
];

export default function DocumentUploadScreen() {
  const router = useRouter();
  const { updateData } = usePersonalityStore();
  const [selectedDocType, setSelectedDocType] = useState('aadhaar');
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);
  const [additionalFiles, setAdditionalFiles] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleBack = () => router.back();

  const pickImage = async (side: 'front' | 'back' | 'additional') => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      if (side === 'front') setFrontImage(result.assets[0].uri);
      else if (side === 'back') setBackImage(result.assets[0].uri);
      else setAdditionalFiles([...additionalFiles, result.assets[0].uri]);
    }
  };

  const uploadFile = async (uri: string, path: string) => {
    const auth = getFirebaseAuth();
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    // Get the ID token from the native auth SDK
    const token = await user.getIdToken();
    
    // Prepare the file blob
    const response = await fetch(uri);
    const blob = await response.blob();
    
    // Use the Firebase Storage REST API to ensure authorization is shared
    const bucket = 'sanatan-lok.firebasestorage.app'; // From config
    const uploadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o?uploadType=media&name=${encodeURIComponent(path)}`;
    
    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': blob.type || 'image/jpeg',
      },
      body: blob,
    });
    
    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.json();
      throw new Error(errorData.error?.message || 'Upload failed');
    }
    
    const data = await uploadResponse.json();
    return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(path)}?alt=media&token=${data.downloadTokens || ''}`;
  };

  const handleContinue = async () => {
    if (!frontImage) {
      Alert.alert('Incomplete', 'Please upload at least the front side of your ID.');
      return;
    }

    setIsUploading(true);
    try {
      const auth = getFirebaseAuth();
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');

      const authToken = await AsyncStorage.getItem('auth_token');
      if (!authToken) throw new Error('Session expired. Please login again.');

      const timestamp = Date.now();
      const frontUrl = await uploadFile(frontImage, `verifications/${user.uid}/front_${timestamp}.jpg`);
      
      let backUrl = null;
      if (backImage) {
        backUrl = await uploadFile(backImage, `verifications/${user.uid}/back_${timestamp}.jpg`);
      }

      const additionalUrls = await Promise.all(
        additionalFiles.map((uri, idx) => 
          uploadFile(uri, `verifications/${user.uid}/extra_${idx}_${timestamp}.jpg`)
        )
      );

      // Save to store
      updateData({
        docType: selectedDocType,
        frontUrl: frontUrl,
        backUrl: backUrl,
        additionalUrls: additionalUrls,
      });

      setIsUploading(false);
      
      // Navigate immediately with a success message
      Alert.alert(
        'Upload Successful', 
        'Documents uploaded! Taking you to the review page...',
        [{ text: 'OK', onPress: () => router.replace('/profile/personality-verification-review') }]
      );
      
      // Fallback navigation in case Alert is missed or auto-dismissed
      setTimeout(() => {
        router.replace('/profile/personality-verification-review');
      }, 2000);
    } catch (error: any) {
      setIsUploading(false);
      console.error('[Docs] Upload failed:', error);
      Alert.alert('Upload Failed', error.message || 'Something went wrong while uploading documents.');
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color="#2D2D2D" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.mainTitle}>Documents Upload</Text>
          <Text style={styles.subtitle}>Please upload valid documents for verification.</Text>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Identity Proof <Text style={styles.subLabel}>(Any one)</Text></Text>
            <View style={styles.docTypeContainer}>
              {DOC_TYPES.map((doc) => (
                <TouchableOpacity 
                  key={doc.id} 
                  style={styles.docTypeItem}
                  onPress={() => setSelectedDocType(doc.id)}
                >
                  <View style={[
                    styles.radio,
                    selectedDocType === doc.id && styles.radioActive
                  ]}>
                    {selectedDocType === doc.id && <View style={styles.radioInner} />}
                  </View>
                  <Text style={styles.radioLabel}>{doc.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Front Side Upload */}
          <View style={styles.uploadSection}>
            <Text style={styles.uploadLabel}>Upload Front Side <Text style={styles.required}>*</Text></Text>
            <TouchableOpacity 
              style={styles.uploadBox} 
              onPress={() => pickImage('front')}
            >
              {frontImage ? (
                <Image source={{ uri: frontImage }} style={styles.uploadedImage} />
              ) : (
                <View style={styles.uploadPlaceholder}>
                  <Ionicons name="cloud-upload-outline" size={32} color="#FF6600" />
                  <Text style={styles.uploadText}>Tap to upload image</Text>
                  <Text style={styles.uploadHint}>JPG, PNG or PDF (Max. 5MB)</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Back Side Upload */}
          <View style={styles.uploadSection}>
            <Text style={styles.uploadLabel}>Upload Back Side <Text style={styles.subLabel}>(If applicable)</Text></Text>
            <TouchableOpacity 
              style={styles.uploadBox} 
              onPress={() => pickImage('back')}
            >
              {backImage ? (
                <Image source={{ uri: backImage }} style={styles.uploadedImage} />
              ) : (
                <View style={styles.uploadPlaceholder}>
                  <Ionicons name="cloud-upload-outline" size={32} color="#FF6600" />
                  <Text style={styles.uploadText}>Tap to upload image</Text>
                  <Text style={styles.uploadHint}>JPG, PNG or PDF (Max. 5MB)</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Additional Docs */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Additional Supporting Documents <Text style={styles.subLabel}>(Optional)</Text></Text>
            <TouchableOpacity 
              style={styles.addFilesButton}
              onPress={() => pickImage('additional')}
            >
              <Ionicons name="cloud-upload-outline" size={20} color="#333" />
              <Text style={styles.addFilesText}>Tap to upload files</Text>
            </TouchableOpacity>
            {additionalFiles.length > 0 && (
              <Text style={styles.fileCountText}>{additionalFiles.length} additional file(s) selected</Text>
            )}
          </View>

          <TouchableOpacity 
            style={[styles.continueButton, isUploading && styles.disabledButton]} 
            onPress={handleContinue}
            disabled={isUploading}
          >
            {isUploading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.continueButtonText}>Continue</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFBF7',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  mainTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#3D1C10',
    marginTop: 8,
    fontFamily: 'Inter_700Bold',
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    marginTop: 12,
    marginBottom: 32,
    fontFamily: 'Inter_400Regular',
  },
  section: {
    marginBottom: 32,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2D2D2D',
    marginBottom: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  subLabel: {
    fontSize: 13,
    color: '#666',
    fontWeight: '400',
  },
  docTypeContainer: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 8,
    borderWidth: 1,
    borderColor: '#F0E8E0',
  },
  docTypeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CCC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  radioActive: {
    borderColor: '#FF6600',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF6600',
  },
  radioLabel: {
    fontSize: 15,
    color: '#333',
    fontFamily: 'Inter_400Regular',
  },
  uploadSection: {
    marginBottom: 24,
  },
  uploadLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2D2D2D',
    marginBottom: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  required: {
    color: '#FF6600',
  },
  uploadBox: {
    width: '100%',
    height: 160,
    borderWidth: 1.5,
    borderColor: '#FF6600',
    borderStyle: 'dashed',
    borderRadius: 20,
    backgroundColor: '#FFFBF7',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  uploadPlaceholder: {
    alignItems: 'center',
  },
  uploadText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 12,
  },
  uploadHint: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  uploadedImage: {
    width: '100%',
    height: '100%',
  },
  addFilesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#F0E8E0',
    borderRadius: 16,
    height: 56,
    gap: 12,
  },
  addFilesText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  fileCountText: {
    fontSize: 12,
    color: '#FF6600',
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '600',
  },
  continueButton: {
    backgroundColor: '#FF6600',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#FF6600',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  disabledButton: {
    backgroundColor: '#FFCCAB',
  },
  continueButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
    fontFamily: 'Inter_600SemiBold',
  },
});
