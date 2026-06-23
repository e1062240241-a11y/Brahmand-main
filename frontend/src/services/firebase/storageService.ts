import { ref, uploadBytes, uploadString, getDownloadURL } from 'firebase/storage';
import { getFirebaseStorage } from './config';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';

export const uploadFileToFirebase = async (uri: string, path: string): Promise<string> => {
  try {
    const storage = getFirebaseStorage();
    const storageRef = ref(storage, path);

    if (Platform.OS === 'web') {
      const response = await fetch(uri);
      const blob = await response.blob();
      await uploadBytes(storageRef, blob);
    } else {
      // Mobile production-safe path: read local file to base64 and upload via uploadString
      const base64Data = await FileSystem.readAsStringAsync(uri, {
        encoding: 'base64',
      });
      // Deduce content type from file path
      const extension = path.split('.').pop()?.toLowerCase();
      const contentType = extension === 'png' ? 'image/png' : 'image/jpeg';
      
      await uploadString(storageRef, base64Data, 'base64', {
        contentType,
      });
    }

    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  } catch (error: any) {
    console.error('Error uploading file: ', error);
    if (error?.code === 'storage/unauthorized') {
      throw new Error('Upload permission denied. Please update Firebase Storage rules for vendor KYC uploads.');
    }
    throw error;
  }
};
