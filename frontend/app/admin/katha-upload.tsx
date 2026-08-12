import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { API_URL } from '../../src/services/api';
import { useAdminStore } from '../../src/store/adminStore';

const getBackendUploadUrl = () => {
  return `${API_URL}/api/katha/admin/upload`;
};

export default function AdminKathaUploadScreen() {
  const router = useRouter();
  const { adminToken } = useAdminStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [episodeNumber, setEpisodeNumber] = useState('1');
  const [date, setDate] = useState('2026-08-13');
  const [guruName, setGuruName] = useState('Acharya Shamik Pathak Ji');
  const [duration, setDuration] = useState('00:30:00');

  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const [selectedThumb, setSelectedThumb] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');

  const handlePickVideo = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: 'video/*',
        copyToCacheDirectory: true,
      });
      if (!res.canceled && res.assets && res.assets.length > 0) {
        setSelectedVideo(res.assets[0]);
      }
    } catch (_err) {
      Alert.alert('Error', 'Failed to pick video file.');
    }
  };

  const handlePickThumb = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: 'image/*',
        copyToCacheDirectory: true,
      });
      if (!res.canceled && res.assets && res.assets.length > 0) {
        setSelectedThumb(res.assets[0]);
      }
    } catch (_err) {
      Alert.alert('Error', 'Failed to pick thumbnail image.');
    }
  };

  const handleUpload = async () => {
    if (!title.trim()) {
      Alert.alert('Validation Error', 'Please enter episode title.');
      return;
    }
    if (!selectedVideo) {
      Alert.alert('Validation Error', 'Please select a video file.');
      return;
    }

    setUploading(true);
    setProgressMsg('Preparing video stream upload to Bunny.net...');

    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('episode_number', episodeNumber);
      formData.append('date', date);
      formData.append('guru_name', guruName);
      formData.append('duration', duration);

      // Append real video file
      if (Platform.OS === 'web') {
        if (selectedVideo.file) {
          formData.append('file', selectedVideo.file, selectedVideo.name || `ep_${episodeNumber}.mp4`);
        } else {
          const response = await fetch(selectedVideo.uri);
          const blob = await response.blob();
          formData.append('file', blob, selectedVideo.name || `ep_${episodeNumber}.mp4`);
        }
      } else {
        formData.append('file', {
          uri: selectedVideo.uri,
          name: selectedVideo.name || `ep_${episodeNumber}.mp4`,
          type: selectedVideo.mimeType || 'video/mp4',
        } as any);
      }

      // Append thumbnail if present
      if (selectedThumb) {
        if (Platform.OS === 'web') {
          if (selectedThumb.file) {
            formData.append('thumbnail', selectedThumb.file, selectedThumb.name || 'thumb.webp');
          } else {
            const thumbResp = await fetch(selectedThumb.uri);
            const thumbBlob = await thumbResp.blob();
            formData.append('thumbnail', thumbBlob, selectedThumb.name || 'thumb.webp');
          }
        } else {
          formData.append('thumbnail', {
            uri: selectedThumb.uri,
            name: selectedThumb.name || 'thumb.webp',
            type: selectedThumb.mimeType || 'image/jpeg',
          } as any);
        }
      }

      const targetUrl = getBackendUploadUrl();

      const serverResult: any = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', targetUrl, true);

        if (adminToken) {
          xhr.setRequestHeader('Authorization', `Bearer ${adminToken}`);
        } else {
          xhr.setRequestHeader('X-Admin-Key', 'brahmand_saavan_katha_admin_2026');
        }

        xhr.upload.onprogress = (evt) => {
          if (evt.lengthComputable) {
            const percent = Math.round((evt.loaded / evt.total) * 100);
            const loadedMB = (evt.loaded / (1024 * 1024)).toFixed(1);
            const totalMB = (evt.total / (1024 * 1024)).toFixed(1);
            setProgressMsg(`Streaming to Bunny.net: ${percent}% (${loadedMB}MB / ${totalMB}MB)...`);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const resJson = JSON.parse(xhr.responseText);
              resolve(resJson);
            } catch (_e) {
              resolve({ status: 'success', message: 'Uploaded successfully' });
            }
          } else {
            reject(new Error(`Server error (${xhr.status}): ${xhr.responseText}`));
          }
        };

        xhr.onerror = () => {
          reject(
            new Error(
              'Network upload error. Please ensure the Python backend server is running on http://localhost:8000'
            )
          );
        };

        xhr.send(formData as any);
      });

      const uploadedUrl = serverResult?.episode?.video_url || 'Bunny.net CDN';
      const uploadedMB = serverResult?.episode?.file_size_bytes
        ? `${(serverResult.episode.file_size_bytes / (1024 * 1024)).toFixed(1)} MB`
        : 'Uploaded';

      Alert.alert(
        'Success! 🎉',
        `Day ${episodeNumber} Saavan Katha video (${uploadedMB}) uploaded successfully to Bunny.net!\n\nCDN URL:\n${uploadedUrl}`
      );
      setTitle('');
      setDescription('');
      setSelectedVideo(null);
      setSelectedThumb(null);
    } catch (err: any) {
      Alert.alert(
        'Upload Status',
        err.message || 'Failed to upload video to backend'
      );
    } finally {
      setUploading(false);
      setProgressMsg('');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Shravan Katha Video Upload', headerShown: false }} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color="#1B1C1C" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Katha Video Upload</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.bannerBadge}>
          <MaterialCommunityIcons name="cloud-upload" size={18} color="#FF6B00" style={{ marginRight: 6 }} />
          <Text style={styles.badgeText}>Bunny.net CDN Stream Upload</Text>
        </View>

        <Text style={styles.pageTitle}>Acharya Shamik Pathak Ji</Text>
        <Text style={styles.pageSubtitle}>Upload Shravan Katha daily videos directly to Bunny.net CDN</Text>

        <View style={styles.formCard}>
          {/* Episode Number & Date */}
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Episode Number</Text>
              <TextInput
                style={styles.input}
                value={episodeNumber}
                onChangeText={setEpisodeNumber}
                keyboardType="numeric"
                placeholder="1"
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Date (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.input}
                value={date}
                onChangeText={setDate}
                placeholder="2026-08-13"
              />
            </View>
          </View>

          {/* Episode Title */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Episode Title *</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Shravan Katha Day 1 — Shiv Mahima & Mangalacharan"
            />
          </View>

          {/* Guru & Duration */}
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1.5, marginRight: 8 }]}>
              <Text style={styles.label}>Guru Name</Text>
              <TextInput
                style={styles.input}
                value={guruName}
                onChangeText={setGuruName}
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Duration</Text>
              <TextInput
                style={styles.input}
                value={duration}
                onChangeText={setDuration}
                placeholder="00:30:00"
              />
            </View>
          </View>

          {/* Description */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, { height: 70 }]}
              value={description}
              onChangeText={setDescription}
              multiline
              placeholder="Brief summary of today's Katha..."
            />
          </View>

          {/* Video Picker */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Katha Video File *</Text>
            <TouchableOpacity style={styles.pickerBox} onPress={handlePickVideo}>
              <Ionicons name="film-outline" size={28} color="#FF6B00" />
              <Text style={styles.pickerTitle}>
                {selectedVideo ? selectedVideo.name : 'Select Video File'}
              </Text>
              <Text style={styles.pickerSubtitle}>Supports MP4, MOV, MKV, WEBM, HEVC</Text>
            </TouchableOpacity>
          </View>

          {/* Thumbnail Picker */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Thumbnail Cover Image (Optional)</Text>
            <TouchableOpacity style={styles.pickerBox} onPress={handlePickThumb}>
              <Ionicons name="image-outline" size={24} color="#555" />
              <Text style={styles.pickerTitle}>
                {selectedThumb ? selectedThumb.name : 'Select Custom Thumbnail'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitBtn, uploading && styles.submitBtnDisabled]}
            disabled={uploading}
            onPress={handleUpload}
          >
            {uploading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.submitBtnText}>Upload Episode to Bunny.net</Text>
            )}
          </TouchableOpacity>

          {uploading && (
            <Text style={styles.progressText}>{progressMsg}</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  backBtn: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1B1C1C',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  bannerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,107,0,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 8,
  },
  badgeText: {
    color: '#FF6B00',
    fontSize: 12,
    fontWeight: '700',
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1B1C1C',
  },
  pageSubtitle: {
    fontSize: 13,
    color: '#666',
    marginBottom: 16,
  },
  formCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  row: {
    flexDirection: 'row',
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#444',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1B1C1C',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pickerBox: {
    backgroundColor: '#FFF8F3',
    borderWidth: 1.5,
    borderColor: 'rgba(255,107,0,0.3)',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FF6B00',
    marginTop: 4,
  },
  pickerSubtitle: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },
  submitBtn: {
    backgroundColor: '#FF6B00',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  progressText: {
    textAlign: 'center',
    color: '#FF6B00',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 10,
  },
});
