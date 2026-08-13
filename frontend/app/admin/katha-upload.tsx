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
import api from '../../src/services/api';
import { useAdminStore } from '../../src/store/adminStore';

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
    setProgressMsg('Preparing direct high-speed upload to Bunny.net CDN...');

    try {
      const bunnyHost = 'sg.storage.bunnycdn.com';
      const bunnyZone = 'brahmand';
      const accessKey = '47413ed1-3dd9-471d-aa2b39e96bbe-ef36-4314';
      const pullZoneUrl = 'https://brahmandfeed23.b-cdn.net';

      // 1. Prepare video file payload
      let videoPayload: any = null;
      let videoSize = selectedVideo.size || 0;

      if (Platform.OS === 'web') {
        if (selectedVideo.file) {
          videoPayload = selectedVideo.file;
        } else {
          const resp = await fetch(selectedVideo.uri);
          videoPayload = await resp.blob();
        }
      } else {
        const resp = await fetch(selectedVideo.uri);
        videoPayload = await resp.blob();
      }

      if (videoPayload && videoPayload.size) {
        videoSize = videoPayload.size;
      }

      const fileExt = selectedVideo.name?.split('.').pop() || 'mp4';
      const videoFileName = `ep_${episodeNumber}_${Date.now()}.${fileExt}`;
      const videoObjectPath = `katha/acharya_shamik/saavan_katha/${videoFileName}`;
      const videoUploadUrl = `https://${bunnyHost}/${bunnyZone}/${videoObjectPath}`;
      const finalCdnVideoUrl = `${pullZoneUrl}/${videoObjectPath}`;

      // 2. Upload video file directly to Bunny CDN via XHR PUT
      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', videoUploadUrl, true);
        xhr.setRequestHeader('AccessKey', accessKey);
        xhr.setRequestHeader('Content-Type', selectedVideo.mimeType || 'video/mp4');

        xhr.upload.onprogress = (evt) => {
          if (evt.lengthComputable) {
            const percent = Math.round((evt.loaded / evt.total) * 100);
            const loadedMB = (evt.loaded / (1024 * 1024)).toFixed(1);
            const totalMB = (evt.total / (1024 * 1024)).toFixed(1);
            setProgressMsg(`Direct CDN Upload: ${percent}% (${loadedMB}MB / ${totalMB}MB)...`);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(true);
          } else {
            reject(new Error(`Bunny CDN upload failed (${xhr.status}): ${xhr.responseText}`));
          }
        };

        xhr.onerror = () => {
          reject(new Error('Network error uploading video file directly to Bunny CDN.'));
        };

        xhr.send(videoPayload);
      });

      // 3. Upload thumbnail directly to Bunny CDN if provided
      let finalCdnThumbUrl = '';
      if (selectedThumb) {
        try {
          setProgressMsg('Uploading thumbnail image...');
          let thumbPayload: any = null;
          if (Platform.OS === 'web' && selectedThumb.file) {
            thumbPayload = selectedThumb.file;
          } else {
            const thumbResp = await fetch(selectedThumb.uri);
            thumbPayload = await thumbResp.blob();
          }

          const thumbExt = selectedThumb.name?.split('.').pop() || 'webp';
          const thumbFileName = `thumb_ep_${episodeNumber}_${Date.now()}.${thumbExt}`;
          const thumbObjectPath = `katha/acharya_shamik/saavan_katha/${thumbFileName}`;
          const thumbUploadUrl = `https://${bunnyHost}/${bunnyZone}/${thumbObjectPath}`;
          finalCdnThumbUrl = `${pullZoneUrl}/${thumbObjectPath}`;

          await new Promise((resolve) => {
            const txhr = new XMLHttpRequest();
            txhr.open('PUT', thumbUploadUrl, true);
            txhr.setRequestHeader('AccessKey', accessKey);
            txhr.setRequestHeader('Content-Type', selectedThumb.mimeType || 'image/jpeg');

            txhr.onload = () => {
              if (txhr.status >= 200 && txhr.status < 300) {
                resolve(true);
              } else {
                resolve(false);
              }
            };
            txhr.onerror = () => resolve(false);
            txhr.send(thumbPayload);
          });
        } catch (_tErr) {
          console.warn('[AdminUpload] Thumbnail upload failed, skipping');
        }
      }

      // 4. Save metadata record to Backend & Firestore
      setProgressMsg('Saving episode metadata to Firestore...');
      await api.post('/katha/admin/save-episode', {
        title: title.trim(),
        description: description.trim(),
        episode_number: parseInt(episodeNumber, 10) || 1,
        date: date,
        guru_name: guruName,
        duration: duration,
        video_url: finalCdnVideoUrl,
        thumbnail_url: finalCdnThumbUrl,
        file_size_bytes: videoSize,
      });

      const uploadedMB = (videoSize / (1024 * 1024)).toFixed(1);

      Alert.alert(
        'Success! 🎉',
        `Day ${episodeNumber} Saavan Katha video (${uploadedMB} MB) uploaded successfully to Bunny.net!\n\nCDN URL:\n${finalCdnVideoUrl}`
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
