import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { ref, uploadBytesResumable } from 'firebase/storage';

import { getFirebaseStorage } from './firebase/config';

const configuredApiUrl = process.env.EXPO_PUBLIC_BACKEND_URL;
const configuredWebApiUrl = process.env.EXPO_PUBLIC_BACKEND_URL_WEB;

const getRuntimeWebApiUrl = (): string | undefined => {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    return undefined;
  }

  try {
    const params = new URLSearchParams(window.location.search || '');
    const queryApiUrl =
      params.get('api')?.trim() ||
      params.get('backend')?.trim() ||
      params.get('backend_url')?.trim();
    if (queryApiUrl) {
      window.localStorage.setItem('BRAHMAND_RUNTIME_API_URL', queryApiUrl);
      return queryApiUrl;
    }

    const storedApiUrl = window.localStorage.getItem('BRAHMAND_RUNTIME_API_URL')?.trim();
    return storedApiUrl || undefined;
  } catch {
    return undefined;
  }
};

const runtimeWebApiUrl = getRuntimeWebApiUrl();

const isLocalhostUrl = (value?: string) =>
  !!value && /localhost|127\.0\.0\.1/.test(value);

const isWebRunningOnLocalhost =
  Platform.OS === 'web' && typeof window !== 'undefined'
    ? /localhost|127\.0\.0\.1/.test(window.location.hostname)
    : false;

const normalizeMimeType = (type?: string, name?: string) => {
  const normalized = (type || '').toLowerCase();
  if (normalized === 'image/png' || normalized === 'image/jpeg' || normalized === 'image/jpg' || normalized === 'image/webp') {
    return normalized === 'image/jpg' ? 'image/jpeg' : normalized;
  }

  if (normalized.startsWith('image/')) {
    return normalized;
  }

  if (typeof name === 'string') {
    const lowerName = name.toLowerCase();
    if (lowerName.endsWith('.png')) return 'image/png';
    if (lowerName.endsWith('.webp')) return 'image/webp';
    if (lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg')) return 'image/jpeg';
  }

  return 'image/jpeg';
};

const normalizeNativeUploadFile = async (file: { uri: string; name: string; type: string }) => {
  const fileName = file.name || 'upload.jpg';
  const fileType = normalizeMimeType(file.type, fileName);

  if (Platform.OS !== 'web' && file.uri?.startsWith('content://')) {
    try {
      const fileSystem = FileSystem as any;
      const cacheDir = fileSystem.cacheDirectory || fileSystem.documentDirectory || '';
      const localUri = `${cacheDir}upload-${Date.now()}-${fileName}`;
      const downloadResult = await FileSystem.downloadAsync(file.uri, localUri);
      return {
        uri: downloadResult.uri,
        name: fileName,
        type: fileType,
      };
    } catch (error) {
      console.warn('[API] Failed to convert content URI to local file:', error);
      return {
        uri: file.uri,
        name: fileName,
        type: fileType,
      };
    }
  }

  return {
    uri: file.uri,
    name: fileName,
    type: fileType,
  };
};

const resolvedWebApiUrl =
  runtimeWebApiUrl
    ? runtimeWebApiUrl
    : configuredWebApiUrl && (!isLocalhostUrl(configuredWebApiUrl) || isWebRunningOnLocalhost)
    ? configuredWebApiUrl
    : configuredApiUrl;

export const API_URL = Platform.OS === 'web'
  ? (resolvedWebApiUrl || 'http://localhost:8000')
  : (configuredApiUrl || 'http://localhost:8000');
const isTunnelApiUrl = /\.loca\.lt$/i.test((API_URL || '').replace(/^https?:\/\//i, '').split('/')[0] || '');

const defaultHeaders: Record<string, string> = {
  'Content-Type': 'application/json',
};

if (Platform.OS !== 'web' || isTunnelApiUrl) {
  defaultHeaders['Bypass-Tunnel-Reminder'] = 'true';
}

if (Platform.OS === 'web') {
  console.info('[API] api.ts resolved API_URL:', API_URL);
}

const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 30000,
  headers: defaultHeaders,
});

const adminApi = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 30000,
  headers: defaultHeaders,
});

const RETRYABLE_METHODS = new Set(['get', 'head', 'options']);
const RETRYABLE_STATUS_CODES = new Set([502, 503]);
const MAX_RETRY_ATTEMPTS = 1;
const CLOUD_RUN_SAFE_UPLOAD_BYTES = 28 * 1024 * 1024;
const ENABLE_WEB_DIRECT_VIDEO_UPLOAD = process.env.EXPO_PUBLIC_ENABLE_WEB_DIRECT_VIDEO_UPLOAD === 'true';

const isVideoMimeType = (value?: string) => (value || '').toLowerCase().startsWith('video/');

const makeUploadId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const uploadLargeVideoViaFirebase = async (
  file: { uri: string; name: string; type: string },
  onProgress?: (progressEvent: any) => void,
) => {
  const response = await fetch(file.uri);
  const blob = await response.blob();
  if (!blob || blob.size <= 0) {
    throw new Error('Could not read selected video file');
  }

  const uploadId = makeUploadId();
  const safeName = (file.name || `video-${uploadId}.mp4`).replace(/[^a-zA-Z0-9._-]/g, '_');
  const objectPath = `raw-post-videos/direct/${uploadId}-${safeName}`;

  const storage = getFirebaseStorage();
  const uploadRef = ref(storage, objectPath);
  const task = uploadBytesResumable(uploadRef, blob, {
    contentType: file.type || 'video/mp4',
  });

  await new Promise<void>((resolve, reject) => {
    task.on(
      'state_changed',
      (snapshot) => {
        if (!onProgress) {
          return;
        }
        const total = snapshot.totalBytes || blob.size;
        const loaded = snapshot.bytesTransferred || 0;
        onProgress({ loaded, total });
      },
      (error) => reject(error),
      () => resolve(),
    );
  });

  return {
    objectPath,
    fileSize: blob.size,
  };
};

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Robust retry on 503 errors and network disconnections
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    const method = (config?.method || 'get').toLowerCase();
    const status = error.response?.status;
    const shouldRetry =
      config &&
      RETRYABLE_METHODS.has(method) &&
      (RETRYABLE_STATUS_CODES.has(status) || error.code === 'ERR_NETWORK') &&
      (config._retryCount || 0) < MAX_RETRY_ATTEMPTS;

    if (shouldRetry) {
      config._retryCount = (config._retryCount || 0) + 1;
      console.warn(
        `[API] Retrying ${method.toUpperCase()} ${config.url}... Attempt ${config._retryCount}`
      );
      const delay = error.code === 'ERR_NETWORK' ? 1000 * config._retryCount : 0;
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      return api(config);
    }

    // If backend is temporarily unavailable, return a graceful fallback only for read requests.
    if (RETRYABLE_STATUS_CODES.has(status) && RETRYABLE_METHODS.has(method)) {
      console.warn('[API] Backend unavailable, returning fallback payload for 503/502');
      return Promise.resolve({
        data: null,
        status: error.response.status,
        statusText: error.response.statusText,
        headers: error.response.headers,
        config: config,
      });
    }

    // Enhance generic server errors with specific backend error payload if present
    if (error.response && error.response.data && error.response.data.detail) {
      error.message = typeof error.response.data.detail === 'string' 
        ? error.response.data.detail 
        : JSON.stringify(error.response.data.detail);
    }


    return Promise.reject(error);
  }
);

// Auth APIs
export const sendOTP = (phone: string) => 
  api.post('/auth/send-otp', { phone });

export const verifyOTP = (phone: string, otp: string) => 
  api.post('/auth/verify-otp', { phone, otp });

export const adminPanelLogin = (data: { username: string; password: string }) =>
  adminApi.post('/admin/auth/login', data);

export interface AdminVendorReview {
  vendor_id: string;
  business_name?: string;
  owner_name?: string;
  phone_number?: string;
  categories?: string[];
  full_address?: string;
  kyc_status?: string;
  review_status?: string;
  review_state?: string;
  aadhaar_otp_verified_at?: string;
  aadhar_url?: string | null;
  pan_url?: string | null;
  face_scan_url?: string | null;
  updated_at?: string;
}

export interface AdminUserKycRequest {
  id: string;
  name?: string;
  sl_id?: string;
  kyc_role?: string;
  kyc_id_type?: string;
  kyc_submitted_at?: string;
}

export interface AdminPostReport {
  id: string;
  reporter_id?: string;
  reported_user_id?: string;
  content_type?: string;
  content_id?: string;
  category?: string;
  description?: string;
  status?: string;
  created_at?: string;
  reviewed_at?: string;
  snapshot?: {
    post_id?: string;
    caption?: string;
    media_url?: string;
    media_type?: string;
    post_user_id?: string;
    post_username?: string;
  };
  moderation_result?: {
    post_deleted?: boolean;
    media_deleted?: boolean;
    comments_deleted?: number;
  };
}

export const getAdminVendorReviewQueue = (adminToken: string, status: string = 'pending') =>
  adminApi.get<AdminVendorReview[]>('/admin/vendors/review-queue', {
    params: { status },
    headers: { Authorization: `Bearer ${adminToken}` },
  });

export const adminApproveVendor = (adminToken: string, vendorId: string, note?: string) =>
  adminApi.post(
    `/admin/vendors/${vendorId}/approve`,
    { note },
    { headers: { Authorization: `Bearer ${adminToken}` } }
  );

export const adminRejectVendor = (adminToken: string, vendorId: string, reason?: string) =>
  adminApi.post(
    `/admin/vendors/${vendorId}/reject`,
    { reason: reason || 'Denied by admin' },
    { headers: { Authorization: `Bearer ${adminToken}` } }
  );

export const getAdminPendingKyc = (adminToken: string) =>
  adminApi.get<AdminUserKycRequest[]>('/admin/kyc/pending', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });

export const adminVerifyUserKyc = (
  adminToken: string,
  userId: string,
  action: 'verify' | 'reject',
  rejection_reason?: string
) =>
  adminApi.post(
    `/admin/kyc/verify/${userId}`,
    action === 'reject'
      ? { action, rejection_reason: rejection_reason || 'Denied by admin' }
      : { action },
    { headers: { Authorization: `Bearer ${adminToken}` } }
  );

export const getAdminReports = (
  adminToken: string,
  status: string = 'pending',
  contentType: string = 'post',
  limit: number = 100,
) =>
  adminApi.get<AdminPostReport[]>('/admin/reports', {
    params: { status, content_type: contentType, limit },
    headers: { Authorization: `Bearer ${adminToken}` },
  });

export const adminReviewReport = (
  adminToken: string,
  reportId: string,
  action: 'approve' | 'deny',
  note?: string,
) =>
  adminApi.post(
    `/admin/reports/${reportId}/review`,
    { action, note },
    { headers: { Authorization: `Bearer ${adminToken}` } }
  );

export const verifyFirebaseToken = (id_token: string) =>
  api.post('/auth/verify-firebase-token', { id_token });

export const register = (data: { phone: string; name: string; photo?: string; language: string }) => 
  api.post('/auth/register', data);

export const registerUser = (data: { phone: string; name: string; photo?: string | null; language: string }) => 
  api.post('/auth/register', data);

// User APIs
export const getProfile = () => 
  api.get('/user/profile');

export const getUserProfile = (userId?: string) => 
  api.get(userId ? `/users/${userId}` : '/user/profile');

export const getUserPosts = (userId: string, limit: number = 20, offset: number = 0) =>
  api.get(`/users/${userId}/posts`, { params: { limit, offset } });

export const updateProfile = (data: { name?: string; photo?: string; language?: string; bio?: string }) =>
  api.put('/user/profile', data);

export const setupLocation = (location: { country: string; state: string; city: string; area: string }) => 
  api.post('/user/location', location);

export const setupDualLocation = (locations: { 
  home_location?: { country: string; state: string; city: string; area: string; latitude?: number; longitude?: number };
  office_location?: { country: string; state: string; city: string; area: string; latitude?: number; longitude?: number };
}) => 
  api.post('/user/dual-location', locations);

export const updateCurrentLocation = async (location: { latitude: number; longitude: number }) => {
  try {
    return await api.post('/user/current-location', location);
  } catch (error: any) {
    if (error.response?.status === 404) {
      try {
        const token = await AsyncStorage.getItem('auth_token');
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }
        return axios.post(`${API_URL}/user/current-location`, location, { headers, timeout: 30000 });
      } catch (rootError: any) {
        if (rootError.response?.status === 404) {
          return { data: null };
        }
        throw rootError;
      }
    }
    throw error;
  }
};

export const reverseGeocode = (latitude: number, longitude: number) => 
  api.post('/geocode/reverse', { latitude, longitude });

export const forwardGeocode = (query: string) =>
  api.post('/geocode/forward', { query });

export const searchHospitals = (query: string, limit: number = 10) =>
  api.post('/places/hospitals/search', { query, limit });

export const searchUserBySLId = (slId: string) => 
  api.get(`/user/search/${slId}`);

export const getAllUsers = (search?: string, limit: number = 200) => 
  api.get('/users', { params: { search, limit } });

export const getUserNotifications = () => 
  api.get('/notifications');

export const getUnreadNotificationCount = () => 
  api.get('/notifications/unread-count');

const nativeMultipartPost = async (endpoint: string, formData: FormData) => {
  const token = await AsyncStorage.getItem('auth_token');
  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}/api${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Upload failed: ${response.status} ${text}`);
  }

  const data = await response.json();
  return { data };
};

export const uploadUserPost = (
  file: { uri: string; name: string; type: string },
  caption: string,
  filterName?: string,
  onProgress?: (progressEvent: any) => void
) => {
  return (async () => {
    if (Platform.OS === 'web' && ENABLE_WEB_DIRECT_VIDEO_UPLOAD && isVideoMimeType(file.type)) {
      const localResponse = await fetch(file.uri);
      const localBlob = await localResponse.blob();
      if (localBlob.size > CLOUD_RUN_SAFE_UPLOAD_BYTES) {
        const { objectPath } = await uploadLargeVideoViaFirebase(file, onProgress);

        const formData = new FormData();
        formData.append('storage_path', objectPath);
        formData.append('caption', caption || '');
        formData.append('source', 'camera_roll');
        if (filterName) {
          formData.append('filter_name', filterName);
        }

        return api.post('/posts/upload-from-storage', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 30 * 60 * 1000,
        });
      }
    }

    const formData = new FormData();
    formData.append('caption', caption || '');
    if (filterName) {
      formData.append('filter_name', filterName);
    }
    await appendMultipartFile(formData, 'file', file);

    try {
      return await api.post('/posts/upload', formData, {
        headers: Platform.OS === 'web' ? { 'Content-Type': 'multipart/form-data' } : undefined,
        timeout: 10 * 60 * 1000,
        onUploadProgress: onProgress,
      });
    } catch (error: any) {
      console.warn('[API] axios upload failed, retrying native fetch multipart upload', error);
      if (Platform.OS !== 'web') {
        const token = await AsyncStorage.getItem('auth_token');
        const headers: Record<string, string> = {};
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch(`${API_URL}/api/posts/upload`, {
          method: 'POST',
          headers,
          body: formData,
        });

        if (!response.ok) {
          const text = await response.text();
          throw new Error(`Upload failed: ${response.status} ${text}`);
        }

        const data = await response.json();
        return { data };
      }
      throw error;
    }
  })();
};

export const uploadChatMedia = (file: { uri: string; name: string; type: string }) => {
  return (async () => {
    const formData = new FormData();
    await appendMultipartFile(formData, 'file', file);

    if (Platform.OS !== 'web') {
      return nativeMultipartPost('/media/upload', formData);
    }

    return api.post('/media/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 10 * 60 * 1000,
    });
  })();
};

export const uploadCompressedVideo = (
  file: { uri: string; name: string; type: string }
) => {
  return (async () => {
    const formData = new FormData();
    await appendMultipartFile(formData, 'file', file);

    if (Platform.OS !== 'web') {
      return nativeMultipartPost('/videos/upload', formData);
    }

    return api.post('/videos/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 10 * 60 * 1000,
    });
  })();
};

export const getPostsFeed = (limit: number = 20, offset: number = 0) =>
  api.get('/posts/feed', { params: { limit, offset } });

export const togglePostLike = (postId: string) =>
  api.post(`/posts/${postId}/like`);

export const addPostComment = (postId: string, text: string) =>
  api.post(`/posts/${postId}/comments`, { text });

export const getPostComments = (postId: string, limit: number = 200) =>
  api.get(`/posts/${postId}/comments`, { params: { limit } });

export const repostPost = (postId: string) =>
  api.post(`/posts/${postId}/repost`);

export const deletePost = (postId: string) =>
  api.delete(`/posts/${postId}`);

export const reportPost = (postId: string, category: string = 'other', description: string = '') =>
  api.post(`/posts/${postId}/report`, { category, description });

export const updatePost = (postId: string, data: { caption?: string }) =>
  api.put(`/posts/${postId}`, data);

export const addPostHashtags = (postId: string, hashtags: string[]) =>
  api.post(`/posts/${postId}/hashtags`, { hashtags });

export const removePostHashtags = (postId: string, hashtags: string[]) =>
  api.delete(`/posts/${postId}/hashtags`, { data: { hashtags } });

export const searchByHashtag = (hashtag: string, limit: number = 50, offset: number = 0) =>
  api.get('/posts/hashtag', { params: { hashtag, limit, offset } });

export const viewPost = (postId: string) =>
  api.post(`/posts/${postId}/view`);

export const getPostById = (postId: string) =>
  api.get(`/posts/${postId}`);

export const getPostViews = (postId: string) =>
  api.get(`/posts/${postId}/views`);

export const getBhagavadGitaChapter = (chapterNumber: number = 1) =>
  api.get(`/library/bhagavad-gita/chapter/${chapterNumber}`);

export const getRamcharitmanasKand = (kandNumber: number = 1) =>
  api.get(`/library/ramcharitmanas/chapter/${kandNumber}`);

export const getAtharvavedChapter = (chapterNumber: number = 1) =>
  api.get(`/library/atharvaved/chapter/${chapterNumber}`);

export const getRamayanChapter = (chapterNumber: number = 1) =>
  api.get(`/library/ramayan/chapter/${chapterNumber}`);

export const getRigvedaChapter = (chapterNumber: number = 1) =>
  api.get(`/library/rigveda/chapter/${chapterNumber}`);

export const getYajurvedaChapter = (chapterNumber: number = 1) =>
  api.get(`/library/yajurveda/chapter/${chapterNumber}`);

export const getMahabharataBook = (bookNumber: number = 1) =>
  api.get(`/library/mahabharata/book/${bookNumber}`);

// Community APIs
export const getCommunities = () => 
  api.get('/communities');

export const getCommunity = (id: string) => 
  api.get(`/communities/${id}`);

export const joinCommunityByCode = (code: string) => 
  api.post('/communities/join', { code });

export const agreeToRules = (communityId: string, subgroupType: string) => 
  api.post(`/communities/${communityId}/agree-rules`, { subgroup_type: subgroupType });

// Circle APIs
export const createCircle = (data: { name: string; description?: string; privacy?: 'private' | 'invite_code'; member_ids?: string[] }) => 
  api.post('/circles', data);

export const getCircles = () => 
  api.get('/circles');

export const getCircle = (circleId: string) => 
  api.get(`/circles/${circleId}`);

export const updateCircle = (circleId: string, data: { name?: string; description?: string; privacy?: 'private' | 'invite_code'; photo?: string }) => 
  api.put(`/circles/${circleId}`, data);

export const joinCircle = (code: string) => 
  api.post('/circles/join', { code });

export const getCircleRequests = (circleId: string) => 
  api.get(`/circles/${circleId}/requests`);

export const approveCircleRequest = (circleId: string, userId: string) => 
  api.post(`/circles/${circleId}/approve/${userId}`);

export const rejectCircleRequest = (circleId: string, userId: string) => 
  api.post(`/circles/${circleId}/reject/${userId}`);

export const inviteToCircle = (circleId: string, slId: string) => 
  api.post(`/circles/${circleId}/invite`, { sl_id: slId });

export const transferCircleAdmin = (circleId: string, memberId: string) =>
  api.post(`/circles/${circleId}/transfer-admin/${memberId}`);

export const leaveCircle = (circleId: string) => 
  api.post(`/circles/${circleId}/leave`);

export const deleteCircle = (circleId: string) => 
  api.delete(`/circles/${circleId}`);

export const removeCircleMember = (circleId: string, memberId: string) => 
  api.post(`/circles/${circleId}/remove-member/${memberId}`);

// Message APIs
export const sendCommunityMessage = (communityId: string, subgroupType: string, content: string, messageType: string = 'text') => 
  api.post(`/messages/community/${communityId}/${subgroupType}`, { content, message_type: messageType });

export const getCommunityMessages = (communityId: string, subgroupType: string, limit: number = 50) => 
  api.get(`/messages/community/${communityId}/${subgroupType}?limit=${limit}`);

export const sendCircleMessage = (circleId: string, content: string, messageType: string = 'text') => 
  api.post(`/messages/circle/${circleId}`, { content, message_type: messageType });

export const getCircleMessages = (circleId: string, limit: number = 50) => 
  api.get(`/messages/circle/${circleId}?limit=${limit}`);

// Direct Message APIs
export const sendDirectMessage = (recipientSlId: string, content: string, messageType: string = 'text') => 
  api.post('/dm', { recipient_sl_id: recipientSlId, content, message_type: messageType });

export const getConversations = () => 
  api.get('/dm/conversations', { timeout: 120000 });

export const getDirectMessages = (conversationId: string, limit: number = 50) => 
  api.get(`/dm/${conversationId}?limit=${limit}`, { timeout: 120000 });

export const markDirectMessagesRead = (conversationId: string) =>
  api.post(`/dm/${conversationId}/read`);

export const clearDirectMessages = (conversationId: string) => 
  api.delete(`/dm/${conversationId}/messages`);

export const approveDirectMessageRequest = (conversationId: string) =>
  api.post(`/dm/${conversationId}/request/approve`);

export const denyDirectMessageRequest = (conversationId: string) =>
  api.post(`/dm/${conversationId}/request/deny`);

// Discover APIs
export const discoverCommunities = () => 
  api.get('/discover/communities');

// Wisdom & Panchang APIs
export const getTodaysWisdom = () => 
  api.get('/wisdom/today');

export const getTodaysPanchang = () => 
  api.get('/panchang/today');

export const getProkeralaPanchang = (params?: {
  date_str?: string;
  lat?: number;
  lng?: number;
  endpoints?: string;
  force_refresh?: boolean;
}) => api.get('/panchang/prokerala', { params });

export const getProkeralaPanchangSummary = (params?: {
  date_str?: string;
  lat?: number;
  lng?: number;
  force_refresh?: boolean;
}) => api.get('/panchang/prokerala/summary', { params });

export const getProkeralaAstrology = (params?: {
  datetime_str?: string;
  lat?: number;
  lng?: number;
  ayanamsa?: number;
  la?: string;
  endpoints?: string;
  force_refresh?: boolean;
}) => api.get('/astrology/prokerala', { params });

export const getProkeralaAstrologySummary = (params?: {
  datetime_str?: string;
  lat?: number;
  lng?: number;
  ayanamsa?: number;
  la?: string;
  force_refresh?: boolean;
}) => api.get('/astrology/prokerala/summary', { params });

export const askProkeralaAstrology = (data: {
  question: string;
  astrology?: any;
  ayanamsa?: number;
  la?: string;
}) => api.post('/astrology/prokerala/ask', data);

// Temple APIs
export const getTemples = () => 
  api.get('/temples');

export const getNearbyTemples = (lat?: number, lng?: number) => 
  api.get(`/temples/nearby${lat && lng ? `?lat=${lat}&lng=${lng}` : ''}`);

export const getTemple = (templeId: string) => 
  api.get(`/temples/${templeId}`);

export const followTemple = (templeId: string) => 
  api.post(`/temples/${templeId}/follow`);

export const unfollowTemple = (templeId: string) => 
  api.post(`/temples/${templeId}/unfollow`);

export const followUser = (userId: string) =>
  api.post(`/users/${userId}/follow`);

export const unfollowUser = (userId: string) =>
  api.post(`/users/${userId}/unfollow`);

export const getTemplePosts = (templeId: string) => 
  api.get(`/temples/${templeId}/posts`);

export const reactToTemplePost = (templeId: string, postId: string, reaction: string) => 
  api.post(`/temples/${templeId}/posts/${postId}/react`, { reaction });

// Event APIs
export const getEvents = () => 
  api.get('/events');

export const getNearbyEvents = () => 
  api.get('/events/nearby');

export const attendEvent = (eventId: string) => 
  api.post(`/events/${eventId}/attend`);

// Verification APIs
export const getVerificationStatus = () => 
  api.get('/user/verification-status');

export const requestVerification = (data: { full_name: string; id_type: string; id_number: string }) => 
  api.post('/user/request-verification', data);

// Profile APIs
export const updateExtendedProfile = (data: {
  name?: string;
  language?: string;
  kuldevi?: string;
  kuldevi_temple_area?: string;
  gotra?: string;
  date_of_birth?: string;
  place_of_birth?: string;
  time_of_birth?: string;
  place_of_birth_latitude?: number;
  place_of_birth_longitude?: number;
}) => 
  api.put('/user/profile/extended', data);

export const getProfileCompletion = () => 
  api.get('/user/profile-completion');

export const getHoroscope = () => 
  api.get('/user/horoscope');

// Community Stats
export const getCommunityStats = (communityId: string) => 
  api.get(`/communities/${communityId}/stats`);

// KYC APIs
export const getKYCStatus = () => 
  api.get('/kyc/status');

export const submitKYC = (data: { 
  kyc_role: 'temple' | 'vendor' | 'organizer';
  id_type: 'aadhaar' | 'pan';
  id_number: string;
  id_photo?: string;
  selfie_photo?: string;
}) => 
  api.post('/kyc/submit', data);

export const generateUserAadhaarOtp = (data: {
  aadhaar_number: string;
  consent: 'Y' | 'y';
  reason: string;
}) => api.post('/kyc/aadhaar/otp', data);

export const verifyUserAadhaarOtp = (data: {
  reference_id: string;
  otp: string;
}) => api.post('/kyc/aadhaar/otp/verify', data);

// Report APIs
export const reportContent = (data: {
  content_type: 'message' | 'user' | 'temple' | 'post';
  content_id: string;
  chat_id?: string;
  category: 'religious_attack' | 'disrespectful' | 'spam' | 'abuse' | 'other';
  description?: string;
}) => 
  api.post('/report', data);

// Temple Channel APIs
export const createTemple = (data: {
  name: string;
  location: { city?: string; area?: string; state?: string; country?: string };
  description?: string;
  deity?: string;
  aarti_timings?: { [key: string]: string };
}) => 
  api.post('/temples', data);

export const createTemplePost = (templeId: string, data: {
  title: string;
  content: string;
  post_type?: 'announcement' | 'event' | 'donation' | 'aarti';
}) => 
  api.post(`/temples/${templeId}/posts`, data);

// Mark messages as read
export const markMessagesRead = (chatId: string) => 
  api.post(`/dm/${chatId}/read`);

// =================== HELP REQUEST APIS ===================

export const createHelpRequest = (data: {
  type: 'blood' | 'medical' | 'financial' | 'food' | 'other';
  title: string;
  description: string;
  community_level?: 'area' | 'city' | 'state' | 'country';
  location?: string;
  contact_number: string;
  urgency?: 'normal' | 'urgent' | 'critical';
  blood_group?: string;
  hospital_name?: string;
  amount?: number;
}) => api.post('/help-requests', data);

export const getHelpRequests = (params?: {
  type?: string;
  community_level?: string;
  status?: string;
  limit?: number;
}) => api.get('/help-requests', { params });

export const getMyHelpRequests = () => 
  api.get('/help-requests/my');

export const getActiveHelpRequest = () => 
  api.get('/help-requests/active');

export const fulfillHelpRequest = (requestId: string) => 
  api.post(`/help-requests/${requestId}/fulfill`);

export const verifyHelpRequest = (requestId: string) => 
  api.post(`/help-requests/${requestId}/verify`);

export const deleteHelpRequest = (requestId: string) => 
  api.delete(`/help-requests/${requestId}`);

// =================== COMMUNITY REQUESTS APIS ===================

export const createCommunityRequest = (data: {
  community_id?: string;
  request_type: 'help' | 'blood' | 'medical' | 'financial' | 'petition';
  visibility_level?: 'area' | 'city' | 'state' | 'national';
  title: string;
  description: string;
  contact_number: string;
  urgency_level?: 'low' | 'medium' | 'high' | 'critical';
  blood_group?: string;
  hospital_name?: string;
  location?: string;
  amount?: number;
  contact_person_name?: string;
  support_needed?: string;
  attachments?: string[];
}) => api.post('/community-requests', data);

export const getCommunityRequests = (params?: {
  type?: string;
  community_id?: string;
  visibility_level?: string;
  status?: string;
  limit?: number;
}) => api.get('/community-requests', { params });

export const getMyCommunityRequests = () => 
  api.get('/community-requests/my');

export const getMyActiveCommunityRequests = () => 
  api.get('/community-requests/my', { params: { status: 'active' } });

export const resolveCommunityRequest = (requestId: string) => 
  api.post(`/community-requests/${requestId}/resolve`);

export const deleteCommunityRequest = (requestId: string) => 
  api.delete(`/community-requests/${requestId}`);

// =================== VENDOR APIS ===================

export const createVendor = (data: {
  business_name: string;
  owner_name: string;
  years_in_business: number;
  categories: string[];
  full_address: string;
  location_link?: string;
  phone_number: string;
  latitude?: number;
  longitude?: number;
  photos?: string[];
  business_description?: string;
  kyc_status?: 'pending' | 'manual_review' | 'verified' | 'rejected' | 'approved';
  aadhar_url?: string | null;
  pan_url?: string | null;
  face_scan_url?: string | null;
  business_gallery_images?: string[];
  menu_items?: string[];
  offers_home_delivery?: boolean;
  business_media_key?: string | null;
}) => api.post('/vendors', data);

export const getVendors = (params?: {
  category?: string;
  search?: string;
  lat?: number;
  lng?: number;
  limit?: number;
}) => api.get('/vendors', { params });

export const getMyVendor = () => 
  api.get('/vendors/my');

export const getVendorCategories = () => 
  api.get('/vendors/categories');

export const getVendor = (vendorId: string) => 
  api.get(`/vendors/${vendorId}`);

export const updateVendor = (vendorId: string, data: {
  business_name?: string;
  owner_name?: string;
  years_in_business?: number;
  categories?: string[];
  full_address?: string;
  location_link?: string;
  phone_number?: string;
  latitude?: number;
  longitude?: number;
  photos?: string[];
  business_description?: string;
  aadhar_url?: string | null;
  pan_url?: string | null;
  face_scan_url?: string | null;
  business_gallery_images?: string[];
  menu_items?: string[];
  offers_home_delivery?: boolean;
  business_media_key?: string | null;
  kyc_status?: 'pending' | 'manual_review' | 'verified' | 'rejected' | 'approved';
}) => api.put(`/vendors/${vendorId}`, data);

export const parseApiError = (error: any): string => {
  const data = error?.response?.data;
  if (!data) {
    return error?.message || 'Something went wrong';
  }
  if (typeof data?.detail === 'string') {
    return data.detail;
  }
  if (Array.isArray(data?.detail)) {
    return data.detail.map((item: any) => item?.msg || item?.message || String(item)).join(', ');
  }
  if (typeof data?.message === 'string') {
    return data.message;
  }
  return error?.message || 'Something went wrong';
};

export const updateVendorBusinessProfile = (
  vendorId: string,
  data: { menu_items?: string[]; offers_home_delivery?: boolean }
) => api.put(`/vendors/${vendorId}/business/profile`, data);

const appendMultipartFile = async (
  formData: FormData,
  fieldName: string,
  file: { uri: string; name: string; type: string }
) => {
  if (Platform.OS === 'web') {
    const response = await fetch(file.uri);
    const blob = await response.blob();
    const webFile = new File([blob], file.name || 'upload.jpg', { type: file.type || blob.type || 'image/jpeg' });
    formData.append(fieldName, webFile);
    return;
  }

  const preparedFile = await normalizeNativeUploadFile(file);
  try {
    formData.append(fieldName, {
      uri: preparedFile.uri,
      name: preparedFile.name,
      type: preparedFile.type,
    } as any);
  } catch (error) {
    console.warn('[API] Multipart append failed, falling back to blob upload:', error);
    const response = await fetch(preparedFile.uri);
    const blob = await response.blob();
    formData.append(fieldName, blob as any, preparedFile.name || 'upload.jpg');
  }
};

const blobToDataUrl = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Failed to convert image blob to base64'));
    reader.readAsDataURL(blob);
  });

const getImageBase64FromUri = async (file: { uri: string; type?: string }) => {
  const response = await fetch(file.uri);
  const blob = await response.blob();
  const dataUrl = await blobToDataUrl(blob);
  if (dataUrl && dataUrl.startsWith('data:')) {
    return dataUrl;
  }
  return `data:${file.type || blob.type || 'image/jpeg'};base64,${dataUrl}`;
};

export const uploadVendorBusinessImage = (
  vendorId: string,
  slot: number,
  file: { uri: string; name: string; type: string }
) => {
  return (async () => {
    const formData = new FormData();
    formData.append('slot', String(slot));
    await appendMultipartFile(formData, 'file', file);

    if (Platform.OS !== 'web') {
      try {
        const token = await AsyncStorage.getItem('auth_token');
        const url = `${API_URL}/api/vendors/${vendorId}/business/images/upload`;
        const headers: Record<string, string> = {};
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch(url, {
          method: 'POST',
          headers,
          body: formData,
        });

        if (!response.ok) {
          const text = await response.text();
          throw new Error(`Upload failed: ${response.status} ${text}`);
        }

        const data = await response.json();
        return { data };
      } catch (error) {
        console.warn('[API] Native vendor upload failed, retrying via axios:', error);
        return api.post(`/vendors/${vendorId}/business/images/upload`, formData);
      }
    }

    return api.post(`/vendors/${vendorId}/business/images/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  })();
};

export const uploadVendorKycFile = (
  vendorId: string,
  docType: 'aadhaar' | 'pan' | 'face_scan',
  file: { uri: string; name: string; type: string }
) => {
  return (async () => {
    const formData = new FormData();
    formData.append('doc_type', docType);
    await appendMultipartFile(formData, 'file', file);

    return api.post(`/vendors/${vendorId}/kyc/upload`, formData, {
      headers: Platform.OS === 'web' ? { 'Content-Type': 'multipart/form-data' } : undefined,
    });
  })();
};

export const extractKycTextFromImage = async (vendorId: string, file: { uri: string; name: string; type: string }) => {
  const token = await AsyncStorage.getItem('auth_token');
  
  const formData = new FormData();

  let fileAttached = false;
  try {
    await appendMultipartFile(formData, 'file', file);
    fileAttached = true;
    console.log('[OCR API] File attached successfully, has file:', formData.has('file'));
  } catch (error) {
    console.warn('extractKycTextFromImage: multipart file attach failed, will try base64 fallback', error);
  }

  // For web, always try base64 as it's more reliable
  if (Platform.OS === 'web') {
    try {
      console.log('[OCR API] Converting to base64 for web...');
      const imageBase64 = await getImageBase64FromUri(file);
      if (imageBase64) {
        formData.append('image_base64', imageBase64);
        console.log('[OCR API] Base64 attached, length:', imageBase64.length, 'has image_base64:', formData.has('image_base64'));
      }
    } catch (error) {
      console.warn('extractKycTextFromImage: base64 fallback generation failed', error);
    }
  }

  if (!fileAttached && !formData.get('image_base64')) {
    throw new Error('Failed to prepare image payload for OCR upload');
  }

  console.log('[OCR API] Sending request to backend...');
  console.log('[OCR API] Fetch URL:', `${API_URL}/api/vendors/${vendorId}/kyc/vision-extract`);
  
  let response;
  try {
    const headers: Record<string, string> = {
      'Bypass-Tunnel-Reminder': 'true', // Required for localtunnel
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    response = await fetch(`${API_URL}/api/vendors/${vendorId}/kyc/vision-extract`, {
      method: 'POST',
      headers,
      body: formData,
    });
  } catch (fetchError: any) {
    console.error('[OCR API] Fetch error:', fetchError);
    throw new Error(`Network error: ${fetchError.message}`);
  }

  console.log('[OCR API] Response status:', response.status, response.statusText);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[OCR API] Error response:', response.status, errorText);
    throw new Error(`OCR failed: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  console.log('[OCR API] Response data:', JSON.stringify(data).substring(0, 500));
  return { data };
};

export const extractUserKycTextFromImage = async (file: { uri: string; name: string; type: string }) => {
  const token = await AsyncStorage.getItem('auth_token');

  const formData = new FormData();

  let fileAttached = false;
  try {
    await appendMultipartFile(formData, 'file', file);
    fileAttached = true;
    console.log('[User OCR API] File attached successfully, has file:', formData.has('file'));
  } catch (error) {
    console.warn('extractUserKycTextFromImage: multipart file attach failed, will try base64 fallback', error);
  }

  if (Platform.OS === 'web') {
    try {
      console.log('[User OCR API] Converting to base64 for web...');
      const imageBase64 = await getImageBase64FromUri(file);
      if (imageBase64) {
        formData.append('image_base64', imageBase64);
        console.log('[User OCR API] Base64 attached, length:', imageBase64.length, 'has image_base64:', formData.has('image_base64'));
      }
    } catch (error) {
      console.warn('extractUserKycTextFromImage: base64 fallback generation failed', error);
    }
  }

  if (!fileAttached && !formData.get('image_base64')) {
    throw new Error('Failed to prepare image payload for OCR upload');
  }

  console.log('[User OCR API] Sending request to backend...');
  console.log('[User OCR API] Fetch URL:', `${API_URL}/api/kyc/vision-extract`);

  let response;
  try {
    const headers: Record<string, string> = {
      'Bypass-Tunnel-Reminder': 'true',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    response = await fetch(`${API_URL}/api/kyc/vision-extract`, {
      method: 'POST',
      headers,
      body: formData,
    });
  } catch (fetchError: any) {
    console.error('[User OCR API] Fetch error:', fetchError);
    throw new Error(`Network error: ${fetchError.message}`);
  }

  console.log('[User OCR API] Response status:', response.status, response.statusText);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[User OCR API] Error response:', response.status, errorText);
    throw new Error(`OCR failed: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  console.log('[User OCR API] Response data:', JSON.stringify(data).substring(0, 500));
  return { data };
};

export const generateVendorAadhaarOtp = (vendorId: string, data: {
  aadhaar_number: string;
  consent: 'Y' | 'y';
  reason: string;
}) => api.post(`/vendors/${vendorId}/kyc/aadhaar/otp`, data);

export const verifyVendorAadhaarOtp = (vendorId: string, data: {
  reference_id: string;
  otp: string;
}) => api.post(`/vendors/${vendorId}/kyc/aadhaar/otp/verify`, data);

export const addVendorPhoto = (vendorId: string, photo: string) => 
  api.post(`/vendors/${vendorId}/photos`, photo, {
    headers: { 'Content-Type': 'application/json' }
  });

export const deleteVendor = (vendorId: string) => 
  api.delete(`/vendors/${vendorId}`);

export interface JobProfilePayload {
  name: string;
  current_address: string;
  experience_years: number;
  profession: string;
  preferred_work_city: string;
  latitude?: number;
  longitude?: number;
  location_link?: string;
  photos?: string[];
  cv_url?: string;
}

export const createOrUpdateJobProfile = (data: JobProfilePayload) =>
  api.post('/jobs/profile', data);

export const getMyJobProfile = () =>
  api.get('/jobs/profile/my');

export const getJobProfile = (profileId: string) =>
  api.get(`/jobs/profile/${profileId}`);

export const getJobProfiles = (params?: {
  search?: string;
  profession?: string;
  city?: string;
  lat?: number;
  lng?: number;
  limit?: number;
}) =>
  api.get('/jobs/profiles', { params });

export const uploadJobProfileFile = (
  profileId: string,
  docType: 'photo' | 'cv',
  file: { uri: string; name: string; type: string }
) => {
  return (async () => {
    const formData = new FormData();
    formData.append('doc_type', docType);
    await appendMultipartFile(formData, 'file', file);

    return api.post(`/jobs/profile/${profileId}/upload`, formData, {
      headers: Platform.OS === 'web' ? { 'Content-Type': 'multipart/form-data' } : undefined,
    });
  })();
};

// =================== CULTURAL COMMUNITY APIS ===================

export const getCulturalCommunities = (search?: string) => 
  api.get('/cultural-communities', { params: { search } });

export const getUserCulturalCommunity = () => 
  api.get('/user/cultural-community');

export const updateUserCulturalCommunity = (cultural_community: string) => 
  api.put('/user/cultural-community', { cultural_community });

// =================== UTILITY APIS ===================

export const getWisdom = () => 
  api.get('/wisdom/today');

export const getGitaShloka = async (chapter: number, verse: number) => {
  try {
    const response = await fetch(`https://vedicscriptures.github.io/slok/${chapter}/${verse}`);
    if (!response.ok) throw new Error('Failed to fetch');
    return await response.json();
  } catch (error) {
    console.error('Error fetching Gita shloka:', error);
    throw error;
  }
};

export const getPanchang = () => 
  api.get('/panchang/today');

// =================== SOS EMERGENCY APIS ===================

export const createSOSAlert = (data: {
  latitude: number;
  longitude: number;
  emergency_type: string;
  micro_location?: string;
  area?: string;
  city?: string;
  state?: string;
  radius?: number;
}) => api.post('/sos', data);

export const getActiveSOSAlerts = (params?: {
  lat?: number;
  lng?: number;
  radius?: number;
}) => api.get('/sos/nearby', { params });

export const getMySOSAlert = () => 
  api.get('/sos/my');

export const resolveSOSAlert = (sosId: string, status: 'resolved' | 'cancelled') => 
  api.post(`/sos/${sosId}/resolve`, { status });

export const resolveMyActiveSOS = (status: 'resolved' | 'cancelled') =>
  api.post('/sos/my/resolve', { status });

export const respondToSOS = (sosId: string, response: 'coming' | 'called') => 
  api.post(`/sos/${sosId}/respond`, { response });

// =================== SPEECH TRANSCRIPTION API ===================

export const transcribeAudio = async (audioBase64: string, languageCode: string = 'en-IN') => {
  const response = await api.post('/speech/transcribe', {
    audio_base64: audioBase64,
    language_code: languageCode,
  });
  return response.data;
};

export default api;
