import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import * as Device from "expo-device";
import * as FileSystem from "expo-file-system/legacy";
import { secureStorage } from "../utils/secureStorage";

const configuredApiUrl = process.env.EXPO_PUBLIC_BACKEND_URL;
const configuredWebApiUrl = process.env.EXPO_PUBLIC_BACKEND_URL_WEB;

const getRuntimeWebApiUrl = (): string | undefined => {
  if (Platform.OS !== "web" || typeof window === "undefined") {
    return undefined;
  }

  try {
    const params = new URLSearchParams(window.location.search || "");
    const queryApiUrl =
      params.get("api")?.trim() ||
      params.get("backend")?.trim() ||
      params.get("backend_url")?.trim();
    if (queryApiUrl) {
      window.localStorage.setItem("BRAHMAND_RUNTIME_API_URL", queryApiUrl);
      return queryApiUrl;
    }

    const storedApiUrl = window.localStorage
      .getItem("BRAHMAND_RUNTIME_API_URL")
      ?.trim();

    // Auto-clear stale IP-based overrides when running on localhost
    const isWebLocal = /localhost|127\.0\.0\.1/.test(window.location.hostname);
    if (
      isWebLocal &&
      storedApiUrl &&
      !/localhost|127\.0\.0\.1/.test(storedApiUrl)
    ) {
      console.info(
        "[API] Clearing stale remote API URL override from localStorage",
      );
      window.localStorage.removeItem("BRAHMAND_RUNTIME_API_URL");
      return undefined;
    }

    return storedApiUrl || undefined;
  } catch {
    return undefined;
  }
};

const runtimeWebApiUrl = getRuntimeWebApiUrl();

const isLocalhostUrl = (value?: string) =>
  !!value && /localhost|127\.0\.0\.1/.test(value);

const isWebRunningOnLocalhost =
  Platform.OS === "web" && typeof window !== "undefined"
    ? /localhost|127\.0\.0\.1/.test(window.location.hostname)
    : false;

const normalizeMimeType = (type?: string, name?: string) => {
  const normalized = (type || "").toLowerCase();
  const allowedImageTypes = [
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
    "image/heic",
    "image/gif",
    "image/bmp",
  ];
  const allowedVideoTypes = [
    "video/mp4",
    "video/quicktime",
    "video/webm",
    "video/x-matroska",
    "video/3gpp",
  ];

  if (allowedImageTypes.includes(normalized)) {
    return normalized === "image/jpg" ? "image/jpeg" : normalized;
  }

  if (allowedVideoTypes.includes(normalized)) {
    return normalized;
  }

  if (normalized.startsWith("image/")) {
    return normalized;
  }

  // Pass through video types as-is
  if (normalized.startsWith("video/")) {
    return normalized;
  }

  if (typeof name === "string") {
    const lowerName = name.toLowerCase();
    if (lowerName.endsWith(".png")) return "image/png";
    if (lowerName.endsWith(".webp")) return "image/webp";
    if (lowerName.endsWith(".heic")) return "image/heic";
    if (lowerName.endsWith(".gif")) return "image/gif";
    if (lowerName.endsWith(".bmp")) return "image/bmp";
    if (lowerName.endsWith(".jpg") || lowerName.endsWith(".jpeg"))
      return "image/jpeg";
    if (lowerName.endsWith(".mp4")) return "video/mp4";
    if (lowerName.endsWith(".mov")) return "video/quicktime";
    if (lowerName.endsWith(".m4v")) return "video/x-m4v";
    if (lowerName.endsWith(".webm")) return "video/webm";
    if (lowerName.endsWith(".mkv")) return "video/x-matroska";
  }

  return "image/jpeg";
};

const normalizeNativeUploadFile = async (file: {
  uri: string;
  name: string;
  type: string;
}) => {
  const fileName = file.name || "upload.jpg";
  const fileType = normalizeMimeType(file.type, fileName);
  let fileUri = file.uri || "";
  if (Platform.OS === "android" && fileUri.startsWith("/")) {
    fileUri = `file://${fileUri}`;
  }

  if (
    Platform.OS !== "web" &&
    (fileUri.startsWith("content://") ||
      fileUri.startsWith("ph://") ||
      fileUri.startsWith("assets-library://"))
  ) {
    try {
      const fileSystem = FileSystem as any;
      const cacheDir =
        fileSystem.cacheDirectory || fileSystem.documentDirectory || "";
      const localUri = `${cacheDir}upload-${Date.now()}-${fileName}`;
      if (typeof fileSystem.copyAsync === "function") {
        await fileSystem.copyAsync({ from: fileUri, to: localUri });
      } else {
        await FileSystem.downloadAsync(fileUri, localUri);
      }
      return {
        uri: localUri,
        name: fileName,
        type: fileType,
      };
    } catch (error) {
      console.warn("[API] Failed to convert content URI to local file:", error);
      return {
        uri: fileUri,
        name: fileName,
        type: fileType,
      };
    }
  }

  return {
    uri: fileUri,
    name: fileName,
    type: fileType,
  };
};

const resolvedWebApiUrl = runtimeWebApiUrl
  ? runtimeWebApiUrl
  : configuredWebApiUrl &&
    (!isLocalhostUrl(configuredWebApiUrl) || isWebRunningOnLocalhost)
    ? configuredWebApiUrl
    : configuredApiUrl;

const getResolvedApiUrl = (): string => {
  if (Platform.OS === "web") {
    return (resolvedWebApiUrl || "http://127.0.0.1:8000").replace(
      "localhost",
      "127.0.0.1",
    );
  }

  const baseApiUrl = configuredApiUrl || "http://127.0.0.1:8000";

  if (!Device.isDevice) {
    const isAndroid = Platform.OS === "android";
    const targetHost = isAndroid ? "10.0.2.2" : "127.0.0.1";

    const portMatch = baseApiUrl.match(/:(\d+)(?:\/|$)/);
    const port = portMatch ? portMatch[1] : "8000";
    return `http://${targetHost}:${port}`;
  }

  return baseApiUrl.replace("localhost", "127.0.0.1");
};

export const API_URL = getResolvedApiUrl();
const isTunnelApiUrl = /\.loca\.lt$/i.test(
  (API_URL || "").replace(/^https?:\/\//i, "").split("/")[0] || "",
);

const defaultHeaders: Record<string, string> = {
  "Content-Type": "application/json",
  "X-Platform": Platform.OS,
};

if (Platform.OS !== "web" || isTunnelApiUrl) {
  defaultHeaders["Bypass-Tunnel-Reminder"] = "true";
}

console.info(
  `[API] Resolved API_URL: ${API_URL} (Platform: ${Platform.OS}, Device: ${Device.isDevice ? "Physical" : "Simulator"})`,
);

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 120000,
  headers: defaultHeaders,
});

const adminApi = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 30000,
  headers: defaultHeaders,
});

const RETRYABLE_METHODS = new Set(["get", "head", "options"]);
const RETRYABLE_STATUS_CODES = new Set([502, 503]);
const MAX_RETRY_ATTEMPTS = 1;
const CLOUD_RUN_SAFE_UPLOAD_BYTES = 0; // Force all videos to use direct Bunny CDN upload to bypass Cloud Run limits and Axios multipart issues
const ENABLE_WEB_DIRECT_VIDEO_UPLOAD = true; // Also force web to use Bunny direct upload

const isVideoMimeType = (value?: string) =>
  (value || "").toLowerCase().startsWith("video/");

const makeUploadId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

type PostUploadFields = {
  caption: string;
  filterName?: string;
  community_level: string;
  category: string;
  mediaWidth?: number;
  mediaHeight?: number;
  cropOffsetX?: number;
  cropOffsetY?: number;
  originalWidth?: number;
  originalHeight?: number;
  muteAudio?: boolean;
};

const appendPostUploadFields = (
  formData: FormData,
  fields: PostUploadFields,
) => {
  formData.append("caption", fields.caption || "");
  formData.append("source", "camera_roll");
  formData.append("community_level", fields.community_level);
  formData.append("category", fields.category);
  if (fields.filterName) {
    formData.append("filter_name", fields.filterName);
  }
  if (fields.mediaWidth) {
    formData.append("media_width", String(fields.mediaWidth));
  }
  if (fields.mediaHeight) {
    formData.append("media_height", String(fields.mediaHeight));
  }
  if (fields.cropOffsetX !== undefined) {
    formData.append("crop_offset_x", String(fields.cropOffsetX));
  }
  if (fields.cropOffsetY !== undefined) {
    formData.append("crop_offset_y", String(fields.cropOffsetY));
  }
  if (fields.originalWidth) {
    formData.append("original_width", String(fields.originalWidth));
  }
  if (fields.originalHeight) {
    formData.append("original_height", String(fields.originalHeight));
  }
  if (fields.muteAudio) {
    formData.append("mute_audio", "true");
  }
};

const getLocalUploadFileSize = async (file: {
  uri: string;
  name: string;
  type: string;
}) => {
  if (Platform.OS === "web") {
    const response = await fetch(file.uri);
    const blob = await response.blob();
    return blob.size;
  }

  try {
    const fileSystem = FileSystem as any;
    if (typeof fileSystem.getInfoAsync === "function") {
      const info = await fileSystem.getInfoAsync(file.uri, { size: true });
      if (info?.exists && typeof info.size === "number") {
        return info.size;
      }
    }
  } catch (error) {
    console.warn("[API] Could not inspect local video size:", error);
  }

  return undefined;
};

const readFileAsBlob = async (file: {
  uri: string;
  type: string;
}): Promise<Blob> => {
  // Use fetch(uri) for both web and native — React Native's fetch handles
  // file:// URIs as a stream so large videos don't get loaded into RAM.
  // The old base64 approach tripled memory usage (base64 string + decode buffer
  // + Uint8Array) and caused silent OOM crashes for files larger than ~80 MB.
  const response = await fetch(file.uri);
  return response.blob();
};

const uploadLargeVideoViaBunny = async (
  file: { uri: string; name: string; type: string },
  onProgress?: (progressEvent: any) => void,
) => {
  const uploadId = makeUploadId();

  // Make sure we keep the correct extension if file.name lacks it but file.type is known
  let fileNameWithExt = file.name || `video-${uploadId}.mp4`;
  if (!fileNameWithExt.includes('.') && file.type) {
    if (file.type === 'video/quicktime') fileNameWithExt += '.mov';
    else if (file.type === 'video/mp4') fileNameWithExt += '.mp4';
    else if (file.type === 'video/webm') fileNameWithExt += '.webm';
    else fileNameWithExt += '.mp4';
  }

  // Preserve the extension when sanitizing the name
  const lastDotIdx = fileNameWithExt.lastIndexOf('.');
  const namePart = lastDotIdx > -1 ? fileNameWithExt.substring(0, lastDotIdx) : fileNameWithExt;
  const extPart = lastDotIdx > -1 ? fileNameWithExt.substring(lastDotIdx) : '.mp4';
  const safeName = namePart.replace(/[^a-zA-Z0-9_-]/g, "_") + extPart;

  const objectPath = `raw-post-videos/direct/${uploadId}-${safeName}`;

  const credsResponse = await api.get("/posts/bunny-upload-credentials");
  const { bunnyUrl, headers } = credsResponse.data;
  const fullUploadUrl = `${bunnyUrl}/${objectPath}`;

  const uploadHeaders = {
    ...headers,
    "Content-Type": file.type || "video/mp4",
  };

  console.info("[API] Direct Bunny upload URL:", fullUploadUrl);
  console.info("[API] Direct Bunny upload headers:", uploadHeaders);

  let fileSize = 0;

  try {
    if (Platform.OS === "web") {
      const blob = await readFileAsBlob(file);
      if (!blob || blob.size <= 0) {
        throw new Error("Could not read selected video file");
      }
      fileSize = blob.size;

      const putResponse = await axios.put(fullUploadUrl, blob, {
        headers: uploadHeaders,
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            onProgress({
              loaded: progressEvent.loaded,
              total: progressEvent.total,
            });
          }
        },
      });
      console.info(
        "[API] Direct Bunny upload success status:",
        putResponse.status,
      );
    } else {
      // Mobile production-safe path: stream using expo-file-system
      const fileInfo = await FileSystem.getInfoAsync(file.uri);
      if (!fileInfo.exists) {
        throw new Error("Local video file does not exist");
      }
      fileSize = (fileInfo as any).size || 0;

      const uploadTask = FileSystem.createUploadTask(
        fullUploadUrl,
        file.uri,
        {
          httpMethod: "PUT",
          uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
          headers: uploadHeaders,
        },
        (progress) => {
          if (onProgress && progress.totalBytesExpectedToSend) {
            onProgress({
              loaded: progress.totalBytesSent,
              total: progress.totalBytesExpectedToSend,
            });
          }
        }
      );
      const result = await uploadTask.uploadAsync();

      if (!result || result.status < 200 || result.status >= 300) {
        console.error(
          "[API] Native FileSystem direct Bunny upload failed:",
          result?.status,
          result?.body,
        );
        throw new Error(`Upload failed: ${result?.status} ${result?.body}`);
      }

      console.info(
        "[API] Native FileSystem direct Bunny upload success status:",
        result.status,
      );
    }
  } catch (putError: any) {
    console.error("[API] Direct Bunny upload failed:", putError);
    throw putError;
  }

  return {
    objectPath,
    fileSize,
  };
};

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  const token = await secureStorage.getItem("auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Handle FormData Content-Type override
  if (config.data instanceof FormData) {
    // For FormData, we must let the browser/native layer set the boundary
    // Deleting Content-Type allows Axios/Fetch to detect it correctly and add the boundary
    delete config.headers["Content-Type"];
  }

  return config;
});

// Robust retry on 503 errors and network disconnections
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    const method = (config?.method || "get").toLowerCase();
    const status = error.response?.status;
    const shouldRetry =
      config &&
      RETRYABLE_METHODS.has(method) &&
      (RETRYABLE_STATUS_CODES.has(status) || error.code === "ERR_NETWORK") &&
      (config._retryCount || 0) < MAX_RETRY_ATTEMPTS;

    if (shouldRetry) {
      config._retryCount = (config._retryCount || 0) + 1;
      console.warn(
        `[API] Retrying ${method.toUpperCase()} ${config.url}... Attempt ${config._retryCount}`,
      );
      const delay =
        error.code === "ERR_NETWORK" ? 1000 * config._retryCount : 0;
      if (delay > 0) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
      return api(config);
    }

    // Handle 401 Unauthorized or 403 unauthenticated globally by logging out and redirecting to splash
    if (status === 401 || (status === 403 && error.response?.data?.detail === "Not authenticated")) {
      const isAuthUrl = /auth\/|login|register|otp/i.test(config?.url || "");
      if (!isAuthUrl) {
        console.warn(
          `[API] ${status} Unauthenticated received. Triggering automatic logout...`,
        );
        try {
          const { useAuthStore } = require("../store/authStore");
          useAuthStore.getState().logout();
        } catch (logoutErr) {
          console.error(
            `[API] Failed to trigger automatic logout on ${status}:`,
            logoutErr,
          );
        }
      }
    }

    // Intercept mutating request failures due to offline/network or 5xx status and queue them
    const isOffline =
      error.code === "ERR_NETWORK" ||
      !error.response ||
      error.response.status >= 500;
    const mutatingMethods = new Set(["post", "put", "delete"]);
    const isMutating = mutatingMethods.has(method);
    const nonQueueableUrls = /auth\/|login|register|otp|sync\/pull|sync\/push/i;
    const isQueueable =
      config && isMutating && !nonQueueableUrls.test(config.url || "");

    if (isOffline && isQueueable) {
      console.log(
        `[API Interceptor] Offline/Error detected. Queueing request: ${method.toUpperCase()} ${config.url}`,
      );
      try {
        const { queueRequest } = require("./syncQueueService");
        await queueRequest(config.url, method, config.data);
        return Promise.resolve({
          data: { success: true, offline: true },
          status: 200,
          statusText: "OK",
          headers: {},
          config: config,
        });
      } catch (queueErr) {
        console.error("[API Interceptor] Failed to queue request:", queueErr);
      }
    }

    // If backend is temporarily unavailable, return a graceful fallback only for read requests.
    if (RETRYABLE_STATUS_CODES.has(status) && RETRYABLE_METHODS.has(method)) {
      console.warn(
        "[API] Backend unavailable, returning fallback payload for 503/502",
      );
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
      error.message =
        typeof error.response.data.detail === "string"
          ? error.response.data.detail
          : JSON.stringify(error.response.data.detail);
    }

    return Promise.reject(error);
  },
);

// Auth APIs
export const sendOTP = (phone: string) => api.post("/auth/send-otp", { phone });

export const verifyOTP = (phone: string, otp: string) =>
  api.post("/auth/verify-otp", { phone, otp });

export const loginAnonymous = (data: {
  phone: string;
  name: string;
  photo?: string | null;
  language: string;
}) => api.post("/auth/login-anonymous", data);

export const adminPanelLogin = (data: { username: string; password: string }) =>
  adminApi.post("/admin/auth/login", data);

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
  kyc_id_photo?: string;
  kyc_selfie_photo?: string;
  kyc_id_number?: string;
}

export interface AdminPostReport {
  id: string;
  reporter_id?: string;
  reporter_name?: string;
  reporter_username?: string;
  reported_user_id?: string;
  reported_user_name?: string;
  reported_user_username?: string;
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
    comment_id?: string;
    text?: string;
    comment_user_id?: string;
    comment_username?: string;
  };
  moderation_result?: {
    post_deleted?: boolean;
    media_deleted?: boolean;
    comments_deleted?: number;
    comment_deleted?: boolean;
  };
}

export interface AdminAnonymousUser {
  id: string;
  phone?: string;
  name?: string;
  anonymous_disabled?: boolean;
  anonymous_account?: boolean;
  anonymous_disabled_at?: string;
  anonymous_created_at?: string;
  anonymous_login_source?: string;
}

export const getAdminVendorReviewQueue = (
  adminToken: string,
  status: string = "pending",
) =>
  adminApi.get<AdminVendorReview[]>("/admin/vendors/review-queue", {
    params: { status },
    headers: { Authorization: `Bearer ${adminToken}` },
  });

export const getAdminAnonymousUsers = (adminToken: string) =>
  adminApi.get<{ users: AdminAnonymousUser[] }>("/admin/anonymous-users", {
    headers: { Authorization: `Bearer ${adminToken}` },
  });

export const disableAdminAnonymousUser = (adminToken: string, userId: string) =>
  adminApi.post(
    `/admin/anonymous-users/${userId}/disable`,
    {},
    { headers: { Authorization: `Bearer ${adminToken}` } },
  );

export const adminApproveVendor = (
  adminToken: string,
  vendorId: string,
  note?: string,
) =>
  adminApi.post(
    `/admin/vendors/${vendorId}/approve`,
    { note },
    { headers: { Authorization: `Bearer ${adminToken}` } },
  );

export const adminRejectVendor = (
  adminToken: string,
  vendorId: string,
  reason?: string,
) =>
  adminApi.post(
    `/admin/vendors/${vendorId}/reject`,
    { reason: reason || "Denied by admin" },
    { headers: { Authorization: `Bearer ${adminToken}` } },
  );

export const adminDeleteVendor = (
  adminToken: string,
  vendorId: string,
) =>
  adminApi.delete(
    `/admin/vendors/${vendorId}`,
    { headers: { Authorization: `Bearer ${adminToken}` } },
  );

export const getAdminPendingKyc = (adminToken: string, status: string = "pending") =>
  adminApi.get<AdminUserKycRequest[]>("/admin/kyc/pending", {
    params: { status },
    headers: { Authorization: `Bearer ${adminToken}` },
  });

export const adminVerifyUserKyc = (
  adminToken: string,
  userId: string,
  action: "verify" | "reject",
  rejection_reason?: string,
) =>
  adminApi.post(
    `/admin/kyc/verify/${userId}`,
    action === "reject"
      ? { action, rejection_reason: rejection_reason || "Denied by admin" }
      : { action },
    { headers: { Authorization: `Bearer ${adminToken}` } },
  );

export const getAdminReports = (
  adminToken: string,
  status: string = "pending",
  contentType?: string,
  limit: number = 100,
) =>
  adminApi.get<AdminPostReport[]>("/admin/reports", {
    params: {
      status,
      ...(contentType ? { content_type: contentType } : {}),
      limit
    },
    headers: { Authorization: `Bearer ${adminToken}` },
  });

export const adminReviewReport = (
  adminToken: string,
  reportId: string,
  action: "approve" | "deny",
  note?: string,
) =>
  adminApi.post(
    `/admin/reports/${reportId}/review`,
    { action, note },
    { headers: { Authorization: `Bearer ${adminToken}` } },
  );

export interface AdminSOSMisuseReport {
  id: string;
  sos_id: string;
  reporter_id: string;
  reporter_name: string;
  creator_id: string;
  creator_name: string;
  reason: string;
  created_at: string;
}

export const getAdminSOSMisuseReports = (adminToken: string) =>
  adminApi.get<AdminSOSMisuseReport[]>("/admin/sos-misuse-reports", {
    headers: { Authorization: `Bearer ${adminToken}` },
  });

export const adminBlockSOS = (adminToken: string, userId: string) =>
  adminApi.post(
    `/admin/users/${userId}/block-sos`,
    {},
    { headers: { Authorization: `Bearer ${adminToken}` } },
  );

export const adminUnblockSOS = (adminToken: string, userId: string) =>
  adminApi.post(
    `/admin/users/${userId}/unblock-sos`,
    {},
    { headers: { Authorization: `Bearer ${adminToken}` } },
  );

export interface AdminPersonalityVerification {
  id: string;
  user_id: string;
  level: "state" | "national";
  full_name: string;
  dob: string;
  gender: string;
  mobile: string;
  email: string;
  city: string;
  profession: string;
  organization: string;
  areas: string[];
  experience: string;
  bio: string;
  doc_type: string;
  front_url: string;
  back_url: string;
  additional_urls: string[];
  status: "pending" | "approved" | "rejected";
  submitted_at: string;
}

export const adminListPersonalityVerifications = (
  adminToken: string,
  status: string = "pending",
) =>
  adminApi.get(`/admin/personality-verifications`, {
    params: { status },
    headers: { Authorization: `Bearer ${adminToken}` },
  });

export const adminActionPersonalityVerification = (
  adminToken: string,
  requestId: string,
  action: "approve" | "reject",
) =>
  adminApi.post(
    `/admin/personality-verifications/${requestId}/action`,
    { action },
    { headers: { Authorization: `Bearer ${adminToken}` } },
  );

export const verifyFirebaseToken = (id_token: string) =>
  api.post("/auth/verify-firebase-token", { id_token });




export const sendNettyfishOTP = (phone: string) =>
  api.post("/auth/nettyfish/send", { phone });

export const verifyNettyfishOTP = (phone: string, otp: string) =>
  api.post("/auth/nettyfish/verify", { phone, otp });

export const sendBloodRequestOTP = (phone: string) =>
  api.post("/blood-request/send-otp", { phone });

export const verifyBloodRequestOTP = (phone: string, otp: string) =>
  api.post("/blood-request/verify-otp", { phone, otp });

export const register = (data: {
  phone: string;
  name: string;
  photo?: string;
  language: string;
}) => api.post("/auth/register", data);

export const registerUser = (data: {
  phone: string;
  name: string;
  photo?: string | null;
  language: string;
}) => api.post("/auth/register", data);

export const logoutUser = (fcmToken?: string | null) =>
  api.post("/auth/logout", { fcm_token: fcmToken || "" });

// User APIs
export const getProfile = () => api.get("/user/profile");

export const getUserProfile = (userId?: string) =>
  api.get(userId ? `/users/${userId}` : "/user/profile");

export const getUserPosts = (
  userId: string,
  limit: number = 20,
  offset: number = 0,
) => api.get(`/users/${userId}/posts`, { params: { limit, offset } });

export const blockUserApi = (userId: string) => api.post(`/users/${userId}/block`);
export const unblockUserApi = (userId: string) => api.post(`/users/${userId}/unblock`);
export const checkUserBlockedApi = (userId: string) => api.get(`/users/${userId}/is_blocked`);

export const getUsersBatch = (userIds: string[]) =>
  api.post("/users/batch", { user_ids: userIds });

export const updateProfile = (data: {
  name?: string;
  photo?: string;
  language?: string;
  bio?: string;
}) => api.put("/user/profile", data);

export const setupLocation = (location: {
  country: string;
  state: string;
  city: string;
  area: string;
}) => api.post("/user/location", location);

export const setupDualLocation = (locations: {
  home_location?: {
    country: string;
    state: string;
    city: string;
    area: string;
    latitude?: number;
    longitude?: number;
  };
  office_location?: {
    country: string;
    state: string;
    city: string;
    area: string;
    latitude?: number;
    longitude?: number;
  };
}) => api.post("/user/dual-location", locations);

export const updateCurrentLocation = async (location: {
  latitude: number;
  longitude: number;
}) => {
  try {
    return await api.post("/user/current-location", location);
  } catch (error: any) {
    if (error.response?.status === 404) {
      try {
        const token = await secureStorage.getItem("auth_token");
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }
        return axios.post(`${API_URL}/user/current-location`, location, {
          headers,
          timeout: 30000,
        });
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
  api.post("/geocode/reverse", { latitude, longitude });

export const forwardGeocode = (query: string) =>
  api.post("/geocode/forward", { query });

export const searchHospitals = (query: string, limit: number = 10) =>
  api.post("/places/hospitals/search", { query, limit });

export const searchUserBySLId = (slId: string) =>
  api.get(`/user/search/${slId}`);

export const getAllUsers = (search?: string, limit: number = 200) =>
  api.get("/users", { params: { search, limit } });

export const getUserNotifications = () => api.get("/notifications");

export const getUnreadNotificationCount = () =>
  api.get("/notifications/unread-count");

export const markAllNotificationsRead = () =>
  api.post("/notifications/mark-all-read");

export const markNotificationRead = (notificationId: string) =>
  api.post(`/notifications/${notificationId}/mark-read`);

export const aiChat = (messages: any[]) => api.post("/ai/chat", { messages });

export const getChatHistory = () => api.get("/ai/chat/history");

export const clearChatHistory = () => api.delete("/ai/chat/history");

const nativeMultipartPost = async (endpoint: string, formData: FormData) => {
  const token = await secureStorage.getItem("auth_token");
  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  // AbortController gives us an upload timeout — without it, large uploads
  // that stall on a slow connection hang forever with no error shown to the user.
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20 * 60 * 1000); // 20 min

  try {
    const response = await fetch(
      `${API_URL}/api${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`,
      {
        method: "POST",
        headers,
        body: formData,
        signal: controller.signal,
      },
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Upload failed: ${response.status} ${text}`);
    }

    const data = await response.json();
    return { data };
  } finally {
    clearTimeout(timeoutId);
  }
};

export const uploadUserPost = (
  file: { uri: string; name: string; type: string },
  caption: string,
  filterName?: string,
  onProgress?: (progressEvent: any) => void,
  community_level: string = "city",
  category: string = "feed",
  mediaWidth?: number,
  mediaHeight?: number,
  cropOffsetX?: number,
  cropOffsetY?: number,
  originalWidth?: number,
  originalHeight?: number,
  muteAudio?: boolean,
) => {
  return (async () => {
    const postFields: PostUploadFields = {
      caption,
      filterName,
      community_level,
      category,
      mediaWidth,
      mediaHeight,
      cropOffsetX,
      cropOffsetY,
      originalWidth,
      originalHeight,
      muteAudio,
    };
    const preparedVideoFile = isVideoMimeType(file.type)
      ? await normalizeNativeUploadFile(file)
      : file;

    if (isVideoMimeType(preparedVideoFile.type)) {
      const fileSize = await getLocalUploadFileSize(preparedVideoFile);

      // We enforce a strict 1GB frontend check.
      if (fileSize !== undefined && fileSize > 1024 * 1024 * 1024) {
        throw new Error("Video size is above the 1GB limit");
      }

      const shouldUseDirectVideoUpload =
        (fileSize === undefined || fileSize > CLOUD_RUN_SAFE_UPLOAD_BYTES) &&
        (Platform.OS !== "web" || ENABLE_WEB_DIRECT_VIDEO_UPLOAD);

      if (shouldUseDirectVideoUpload) {
        const { objectPath } = await uploadLargeVideoViaBunny(
          preparedVideoFile,
          onProgress,
        );

        const formData = new FormData();
        formData.append("storage_path", objectPath);
        appendPostUploadFields(formData, postFields);

        return api.post("/posts/upload-from-storage", formData, {
          timeout: 20 * 60 * 1000, // 20 min
          headers:
            Platform.OS === "web"
              ? { "Content-Type": "multipart/form-data" }
              : undefined,
        });
      }
    }

    const formData = new FormData();
    appendPostUploadFields(formData, postFields);
    await appendMultipartFile(formData, "file", preparedVideoFile);

    try {
      return await api.post("/posts/upload", formData, {
        timeout: 20 * 60 * 1000, // 20 min — large videos need time to compress + upload
        headers:
          Platform.OS === "web"
            ? { "Content-Type": "multipart/form-data" }
            : undefined,
        onUploadProgress: onProgress,
      });
    } catch (error: any) {
      if (error.message !== "Network Error") {
        console.warn(
          "[API] axios upload failed, retrying native fetch multipart upload",
          error,
        );
      }
      if (Platform.OS !== "web") {
        const token = await secureStorage.getItem("auth_token");
        const headers: Record<string, string> = {};
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const uploadUrl = `${API_URL}/api/posts/upload`;
        console.info("[API] Retrying post upload via native fetch:", uploadUrl);

        // Start simulated progress indicator
        let simulatedProgress = 0;
        const progressInterval = setInterval(() => {
          if (simulatedProgress < 90) {
            simulatedProgress += Math.random() * 8 + 4;
            if (simulatedProgress > 90) simulatedProgress = 90;
            if (onProgress) {
              onProgress({
                loaded: Math.round(simulatedProgress),
                total: 100,
              });
            }
          }
        }, 400);

        try {
          const response = await fetch(uploadUrl, {
            method: "POST",
            headers,
            body: formData,
          });

          clearInterval(progressInterval);

          if (!response.ok) {
            const text = await response.text();
            console.error(
              "[API] Native fetch post upload failed:",
              response.status,
              text,
            );
            throw new Error(`Upload failed: ${response.status} ${text}`);
          }

          if (onProgress) {
            onProgress({
              loaded: 100,
              total: 100,
            });
          }

          const data = await response.json();
          return { data };
        } catch (fetchErr) {
          clearInterval(progressInterval);
          throw fetchErr;
        }
      }
      throw error;
    }
  })();
};

export const uploadChatMedia = (file: {
  uri: string;
  name: string;
  type: string;
}) => {
  return (async () => {
    const formData = new FormData();
    await appendMultipartFile(formData, "file", file);

    if (Platform.OS !== "web") {
      try {
        const token = await secureStorage.getItem("auth_token");
        const headers: Record<string, string> = {};
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch(`${API_URL}/api/media/upload`, {
          method: "POST",
          headers,
          body: formData,
        });

        if (!response.ok) {
          const text = await response.text();
          // If it's a validation error, we want to know why
          throw new Error(`Upload failed: ${response.status} ${text}`);
        }

        const data = await response.json();
        return { data };
      } catch (error: any) {
        console.warn("[API] Native chat media upload failed:", error);
        throw error;
      }
    }

    return api.post("/media/upload", formData, {
      headers:
        Platform.OS === "web"
          ? { "Content-Type": "multipart/form-data" }
          : undefined,
    });
  })();
};

export const uploadCompressedVideo = (file: {
  uri: string;
  name: string;
  type: string;
}) => {
  return (async () => {
    const formData = new FormData();
    await appendMultipartFile(formData, "file", file);

    if (Platform.OS !== "web") {
      return nativeMultipartPost("/videos/upload", formData);
    }

    return api.post("/videos/upload", formData, {
      timeout: 10 * 60 * 1000,
      headers:
        Platform.OS === "web"
          ? { "Content-Type": "multipart/form-data" }
          : undefined,
    });
  })();
};

// ──────────────────────────────────────────────────────────────────────────
// OPT-3 + OPT-8: In-memory seen-IDs cache
//
// Previously: markPostAsSeen & getPostsFeed both called AsyncStorage.getItem
// on EVERY invocation — reading from disk on every reel swipe and every feed
// batch load. That stalled the JS thread for 10–50 ms per call.
//
// Now: a module-level Set is the single source of truth. AsyncStorage is only
// read once at module load time (async, non-blocking). Writes are batched and
// flushed to disk every FLUSH_INTERVAL_MS or after DIRTY_THRESHOLD new items,
// whichever comes first. All hot-path code reads from memory only.
// ─────────────────────────────────────────────────────────────────────────────
const SEEN_STORAGE_KEY = "global_seen_reels";
const MAX_SEEN_IDS = 500;
const FLUSH_INTERVAL_MS = 10_000; // flush to disk every 10 s
const DIRTY_THRESHOLD = 20; // or after 20 new IDs

/** In-memory store — always up-to-date, zero disk I/O on read. */
const _seenIdsCache = new Set<string>();
let _seenIdsDirty = 0; // count of uncommitted additions
let _seenFlushTimer: ReturnType<typeof setTimeout> | null = null;
let _seenCacheHydrated = false;

/** Hydrate the in-memory cache from AsyncStorage exactly once. */
const _hydrateSeenCache = async () => {
  if (_seenCacheHydrated) return;
  _seenCacheHydrated = true;
  try {
    const raw = await AsyncStorage.getItem(SEEN_STORAGE_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        // Keep only the most recent MAX_SEEN_IDS
        const slice = arr.slice(-MAX_SEEN_IDS);
        slice.forEach((id: string) => _seenIdsCache.add(id));
      }
    }
  } catch (_) { }
};
// Kick off hydration immediately at module load — non-blocking
_hydrateSeenCache();

/** Flush dirty in-memory state to AsyncStorage. */
const _flushSeenCache = async () => {
  if (_seenFlushTimer) { clearTimeout(_seenFlushTimer); _seenFlushTimer = null; }
  _seenIdsDirty = 0;
  try {
    let arr = Array.from(_seenIdsCache);
    if (arr.length > MAX_SEEN_IDS) arr = arr.slice(arr.length - MAX_SEEN_IDS);
    await AsyncStorage.setItem(SEEN_STORAGE_KEY, JSON.stringify(arr));
  } catch (_) { }
};

/** Schedule a lazy flush unless we hit the dirty threshold immediately. */
const _scheduledFlush = () => {
  _seenIdsDirty++;
  if (_seenIdsDirty >= DIRTY_THRESHOLD) {
    _flushSeenCache();
    return;
  }
  if (!_seenFlushTimer) {
    _seenFlushTimer = setTimeout(_flushSeenCache, FLUSH_INTERVAL_MS);
  }
};

/**
 * Mark a post as seen. O(1) in-memory write. Zero synchronous disk I/O.
 * Disk flush happens lazily in the background.
 */
export const markPostAsSeen = (postId: string) => {
  if (!postId || _seenIdsCache.has(postId)) return;
  _seenIdsCache.add(postId);
  _scheduledFlush();
};

/** Return the current seen IDs as a comma-separated string (last N entries). */
const _getSeenIdsParam = (limit = 250): string => {
  const arr = Array.from(_seenIdsCache);
  return arr.slice(-limit).join(",");
};

export const getHomeInit = async () => {
  // OPT-8: read seen IDs from memory, not disk
  const localSeenIds = _getSeenIdsParam(250);
  return api.get("/home/init", { params: { seen_ids: localSeenIds } });
};

export const getPostsFeed = async (
  limit: number = 20,
  offset: number = 0,
  tab: string = "for_you",
  seen_ids?: string,
) => {
  // OPT-8: read seen IDs from memory, not disk
  const localSeenIds = _getSeenIdsParam(250);
  const combinedSeen = [seen_ids, localSeenIds].filter(Boolean).join(",");
  return api.get("/posts/feed", {
    params: { limit, offset, tab, seen_ids: combinedSeen },
  });
};

export const getMyPosts = async (
  limit: number = 6,
  offset: number = 0,
  userId?: string,
) => {
  return api.get("/posts/my", {
    params: { limit, offset, user_id: userId },
  });
};

export const togglePostLike = (postId: string) => {
  markPostAsSeen(postId);
  return api.post(`/posts/${postId}/like`);
};

export const addPostComment = (
  postId: string,
  text: string,
  parentId?: string,
) => {
  markPostAsSeen(postId);
  return api.post(`/posts/${postId}/comments`, { text, parent_id: parentId });
};

export const getPostComments = (postId: string, limit: number = 200) =>
  api.get(`/posts/${postId}/comments`, { params: { limit } });

export const repostPost = (postId: string) =>
  api.post(`/posts/${postId}/repost`);

export const deletePost = (postId: string) => api.delete(`/posts/${postId}`);

export const deletePostComment = (postId: string, commentId: string) =>
  api.delete(`/posts/${postId}/comments/${commentId}`);

export const reportPost = (
  postId: string,
  category: string = "other",
  description: string = "",
) => api.post(`/posts/${postId}/report`, { category, description });

export const reportComment = (
  commentId: string,
  category: string = "other",
  description: string = "",
) => api.post("/report", { content_type: "comment", content_id: commentId, category, description });

export const updatePost = (postId: string, data: { caption?: string }) =>
  api.put(`/posts/${postId}`, data);

export const addPostHashtags = (postId: string, hashtags: string[]) =>
  api.post(`/posts/${postId}/hashtags`, { hashtags });

export const removePostHashtags = (postId: string, hashtags: string[]) =>
  api.delete(`/posts/${postId}/hashtags`, { data: { hashtags } });

export const searchByHashtag = (
  hashtag: string,
  limit: number = 50,
  offset: number = 0,
) => api.get("/posts/hashtag", { params: { hashtag, limit, offset } });

export const viewPost = (postId: string) => api.post(`/posts/${postId}/view`);

export const getPostById = (postId: string) => api.get(`/posts/${postId}`);

export const getPostViews = (postId: string) =>
  api.get(`/posts/${postId}/views`);

export const recordWatchEvent = (
  postId: string,
  data: { watch_seconds: number; duration_seconds: number; rewatched: boolean },
) => {
  markPostAsSeen(postId);
  return api.post(`/posts/${postId}/watch`, data);
};

export const getFeedPreferences = () => api.get("/users/me/feed-preferences");

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

export const getUpanishadsChapter = (chapterNumber: number = 1) =>
  api.get(`/library/upanishads/chapter/${chapterNumber}`);

// Community APIs
export const getCommunities = () => api.get("/communities");

export const getCommunity = (id: string) => api.get(`/communities/${id}`);

export const joinCommunityByCode = (code: string) =>
  api.post("/communities/join", { code });

export const respondToCommunityRequest = (
  requestId: string,
  status: "accepted" | "declined",
) => api.post(`/communities/requests/${requestId}/respond`, { status });

export const createCommunity = (data: {
  name: string;
  description?: string;
  short_name?: string;
  city?: string;
  area?: string;
  category?: string;
  photo?: string;
  cover_photo?: string;
  admin_ids?: string[];
  member_ids?: string[];
}) => api.post("/communities", data);

export const getMyCreationRequests = () =>
  api.get("/communities/my-creation-requests");

export const resendCommunityInvite = (requestId: string, userId: string) =>
  api.post(`/communities/requests/${requestId}/resend-invite`, {
    user_id: userId,
  });

export const joinCommunityDirect = (communityId: string) =>
  api.post(`/communities/${communityId}/join`);

export const agreeToRules = (communityId: string, subgroupType: string) =>
  api.post(`/communities/${communityId}/agree-rules`, {
    subgroup_type: subgroupType,
  });

// Circle APIs
export const createCircle = (data: {
  name: string;
  description?: string;
  privacy?: "private" | "invite_code";
  member_ids?: string[];
}) => api.post("/circles", data);

export const getCircles = () => api.get("/circles");

export const getCircle = (circleId: string) => api.get(`/circles/${circleId}`);

export const updateCircle = (
  circleId: string,
  data: {
    name?: string;
    description?: string;
    privacy?: "private" | "invite_code";
    photo?: string;
  },
) => api.put(`/circles/${circleId}`, data);

export const joinCircle = (code: string) => api.post("/circles/join", { code });

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
export const sendCommunityMessage = (
  communityId: string,
  subgroupType: string,
  content: string,
  messageType: string = "text",
  category?: string,
  mediaUrl?: string,
  contact?: string,
  sevaDetails?: string,
  location?: string,
) =>
  api.post(`/messages/community/${communityId}/${subgroupType}`, {
    content,
    message_type: messageType,
    category,
    media_url: mediaUrl,
    contact,
    seva_details: sevaDetails,
    location,
  });

export const getCommunityMessages = (
  communityId: string,
  subgroupType: string,
  limit: number = 25,
  before_timestamp?: string,
) => {
  let url = `/messages/community/${communityId}/${subgroupType}?limit=${limit}`;
  if (before_timestamp) {
    url += `&before_timestamp=${encodeURIComponent(before_timestamp)}`;
  }
  return api.get(url);
};

export const deleteCommunityMessage = (
  communityId: string,
  subgroupType: string,
  messageId: string,
) =>
  api.delete(`/messages/community/${communityId}/${subgroupType}/${messageId}`);
export const sendCircleMessage = (
  circleId: string,
  content: string,
  messageType: string = "text",
) =>
  api.post(`/messages/circle/${circleId}`, {
    content,
    message_type: messageType,
  });

export const getCircleMessages = (circleId: string, limit: number = 50) =>
  api.get(`/messages/circle/${circleId}?limit=${limit}`);

// Direct Message APIs
export const sendDirectMessage = (
  recipientSlId: string,
  content: string,
  messageType: string = "text",
) =>
  api.post("/dm", {
    recipient_sl_id: recipientSlId,
    content,
    message_type: messageType,
  });

export const getConversations = () =>
  api.get("/dm/conversations", { timeout: 120000 });

export const getDMConversationMetadata = (conversationId: string) => {
  if (!conversationId || conversationId === "undefined" || conversationId === "new") return Promise.reject(new Error("Invalid conversationId"));
  return api.get(`/dm/${conversationId}/metadata`);
};

export const getDirectMessages = (conversationId: string, limit: number = 50) => {
  if (!conversationId || conversationId === "undefined" || conversationId === "new") return Promise.resolve({ data: [] });
  return api.get(`/dm/${conversationId}?limit=${limit}`, { timeout: 120000 });
};

export const markDirectMessagesRead = (conversationId: string) => {
  if (!conversationId || conversationId === "undefined" || conversationId === "new") return Promise.resolve();
  return api.post(`/dm/${conversationId}/read`);
};

export const clearDirectMessages = (conversationId: string) =>
  api.delete(`/dm/${conversationId}/messages`);

export const approveDirectMessageRequest = (conversationId: string) =>
  api.post(`/dm/${conversationId}/request/approve`);

export const denyDirectMessageRequest = (conversationId: string) =>
  api.post(`/dm/${conversationId}/request/deny`);

export const muteConversation = (conversationId: string) =>
  api.post(`/dm/${conversationId}/mute`);

export const unmuteConversation = (conversationId: string) =>
  api.post(`/dm/${conversationId}/unmute`);

// Discover APIs
export const discoverCommunities = () => api.get("/communities/discover");

// Wisdom & Panchang APIs
export const getTodaysWisdom = () => api.get("/wisdom/today");

// =================== ASTROLOGY CACHE HELPER ===================
const getWithCache = async (
  cacheKey: string,
  fetchFn: () => Promise<any>,
  expiryHours = 24,
) => {
  try {
    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      const ageHours = (Date.now() - timestamp) / (1000 * 60 * 60);
      if (ageHours < expiryHours) {
        console.log(`[Cache] Hit for ${cacheKey}`);
        return { data };
      }
    }
    const response = await fetchFn();
    await AsyncStorage.setItem(
      cacheKey,
      JSON.stringify({ data: response.data, timestamp: Date.now() }),
    );
    return response;
  } catch (err) {
    console.error(`[Cache] Error for ${cacheKey}:`, err);
    return fetchFn();
  }
};

export const getPanchang = (params?: {
  date_str?: string;
  lat?: number;
  lng?: number;
  force_refresh?: boolean;
}) => {
  const date = params?.date_str || new Date().toISOString().split("T")[0];
  const cacheKey = `panchang_${date}_${params?.lat?.toFixed(2)}_${params?.lng?.toFixed(2)}`;
  if (params?.force_refresh) return api.get("/panchang/today", { params });
  return getWithCache(cacheKey, () => api.get("/panchang/today", { params }));
};

export const getDailyHoroscope = (
  zodiacName: string,
  timezone: number = 5.5,
) => {
  const date = new Date().toISOString().split("T")[0];
  const cacheKey = `horoscope_${zodiacName}_${date}`;
  return AsyncStorage.removeItem(cacheKey)
    .catch(() => undefined)
    .then(() =>
      api.get(`/horoscope/daily/${zodiacName}`, { params: { timezone } }),
    );
};

export const getNakshatraReport = (params?: {
  dob?: string;
  tob?: string;
  lat?: number;
  lon?: number;
  tz?: number;
}) => {
  if (
    params &&
    (params.dob ||
      params.tob ||
      params.lat !== undefined ||
      params.lon !== undefined)
  ) {
    return api.get("/astrology/nakshatra", { params });
  }
  const cacheKey = `v2_nakshatra_default`;
  return getWithCache(cacheKey, () => api.get("/astrology/nakshatra"));
};

export const searchBirthCity = (q: string) => {
  return api.get("/astrology/city-search", { params: { q } });
};

export const askAstrologyAI = (data: {
  question: string;
  astrology: any;
  la?: string;
}) => api.post("/astrology/ask", data);

export const getUserHoroscope = () => api.get("/spiritual/horoscope");

// Temple APIs
export const getTemples = () => api.get("/temples");

export const getNearbyTemples = (lat?: number, lng?: number) =>
  api.get(`/temples/nearby${lat && lng ? `?lat=${lat}&lng=${lng}` : ""}`);

export const getTemple = (templeId: string) => api.get(`/temples/${templeId}`);

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

export const reactToTemplePost = (
  templeId: string,
  postId: string,
  reaction: string,
) => api.post(`/temples/${templeId}/posts/${postId}/react`, { reaction });

// Event APIs
export const getEvents = () => api.get("/events");

export const getNearbyEvents = () => api.get("/events/nearby");

export const attendEvent = (eventId: string) =>
  api.post(`/events/${eventId}/attend`);

// Verification APIs
export const getVerificationStatus = () => api.get("/user/verification-status");

export const requestVerification = (data: {
  full_name: string;
  id_type: string;
  id_number: string;
}) => api.post("/user/request-verification", data);

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
  gender?: string;
}) => api.put("/user/profile/extended", data);

export const saveKundliProfile = (data: {
  name: string;
  gender: string;
  date_of_birth: string;
  place_of_birth: string;
  time_of_birth: string;
  place_of_birth_latitude: number;
  place_of_birth_longitude: number;
}) => api.post("/user/saved-kundlis", data);

export const getSavedKundlis = () => api.get("/user/saved-kundlis");

export const deleteSavedKundli = (profileId: string) =>
  api.delete(`/user/saved-kundlis/${profileId}`);

export const deleteUserProfile = (otp?: string) =>
  api.delete("/user/profile", { params: { otp } });

export const getProfileCompletion = () => api.get("/user/profile-completion");

export const getHoroscope = () => api.get("/user/horoscope");

// Community Stats
export const getCommunityStats = (communityId: string) =>
  api.get(`/communities/${communityId}/stats`);

// KYC APIs
export const getKYCStatus = () => api.get("/kyc/status");

export const submitKYC = (data: {
  kyc_role: "temple" | "vendor" | "organizer";
  id_type: "aadhaar" | "pan";
  id_number: string;
  id_photo?: string;
  selfie_photo?: string;
}) => api.post("/kyc/submit", data);

export const generateUserAadhaarOtp = (data: {
  aadhaar_number: string;
  consent: "Y" | "y";
  reason: string;
}) => api.post("/kyc/aadhaar/otp", data);

export const verifyUserAadhaarOtp = (data: {
  reference_id: string;
  otp: string;
}) => api.post("/kyc/aadhaar/otp/verify", data);

// Report APIs
export const reportContent = (data: {
  content_type: "message" | "user" | "temple" | "post" | "community" | "comment";
  content_id: string;
  chat_id?: string;
  category: "religious_attack" | "disrespectful" | "spam" | "abuse" | "other" | "harassment" | "hate_speech" | "violence" | "sexual_content" | "fake_profile" | "scam_fraud";
  description?: string;
}) => api.post("/report", data);

// Temple Channel APIs
export const createTemple = (data: {
  name: string;
  location: { city?: string; area?: string; state?: string; country?: string };
  description?: string;
  deity?: string;
  aarti_timings?: { [key: string]: string };
}) => api.post("/temples", data);

export const createTemplePost = (
  templeId: string,
  data: {
    title: string;
    content: string;
    post_type?: "announcement" | "event" | "donation" | "aarti";
  },
) => api.post(`/temples/${templeId}/posts`, data);

// Mark messages as read
export const markMessagesRead = (chatId: string) => {
  if (!chatId || chatId === "undefined" || chatId === "new") return Promise.resolve();
  return api.post(`/dm/${chatId}/read`);
};

// =================== HELP REQUEST APIS ===================

export const createHelpRequest = (data: {
  type: "blood" | "medical" | "financial" | "food" | "other";
  title: string;
  description: string;
  community_level?: "area" | "city" | "state" | "country";
  location?: string;
  contact_number: string;
  urgency?: "normal" | "urgent" | "critical";
  blood_group?: string;
  hospital_name?: string;
  amount?: number;
}) => api.post("/help-requests", data);

export const getHelpRequests = (params?: {
  type?: string;
  community_level?: string;
  status?: string;
  limit?: number;
}) => api.get("/help-requests", { params });

export const getMyHelpRequests = () => api.get("/help-requests/my");

export const getActiveHelpRequest = () => api.get("/help-requests/active");

export const fulfillHelpRequest = (requestId: string) =>
  api.post(`/help-requests/${requestId}/fulfill`);

export const verifyHelpRequest = (requestId: string) =>
  api.post(`/help-requests/${requestId}/verify`);

export const deleteHelpRequest = (requestId: string) =>
  api.delete(`/help-requests/${requestId}`);

// =================== COMMUNITY REQUESTS APIS ===================

export const createCommunityRequest = (data: {
  community_id?: string;
  request_type:
  | "help"
  | "blood"
  | "medical"
  | "financial"
  | "petition"
  | "emergency";
  visibility_level?: "area" | "city" | "state" | "national";
  title: string;
  description: string;
  contact_number: string;
  urgency_level?: "low" | "medium" | "high" | "critical";
  blood_group?: string;
  hospital_name?: string;
  location?: string;
  amount?: number;
  contact_person_name?: string;
  support_needed?: string;
  attachments?: string[];
}) => {
  const desc = (data.description || "").trim();
  const paddedDescription =
    desc.length >= 10
      ? desc
      : `${desc} (Emergency request for community support)`;
  return api.post("/community-requests", {
    ...data,
    description: paddedDescription,
  });
};

export const getCommunityRequests = (params?: {
  type?: string;
  community_id?: string;
  visibility_level?: string;
  status?: string;
  limit?: number;
}) => api.get("/community-requests", { params });

export const getMyCommunityRequests = () => api.get("/community-requests/my");

export const getMyActiveCommunityRequests = () =>
  api.get("/community-requests/my", { params: { status: "active" } });

export const resolveCommunityRequest = (requestId: string) =>
  api.post(`/community-requests/${requestId}/resolve`);

export const toggleRequestInterest = (requestId: string) =>
  api.post(`/community-requests/${requestId}/interest`);

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
  kyc_status?:
  | "pending"
  | "manual_review"
  | "verified"
  | "rejected"
  | "approved";
  aadhar_url?: string | null;
  pan_url?: string | null;
  face_scan_url?: string | null;
  business_gallery_images?: string[];
  menu_items?: string[];
  offers_home_delivery?: boolean;
  business_media_key?: string | null;
}) => api.post("/vendors", data);

export const getVendors = (params?: {
  category?: string;
  search?: string;
  lat?: number;
  lng?: number;
  limit?: number;
}) => api.get("/vendors", { params });

export const getMyVendor = () => api.get("/vendors/my");

export const getVendorCategories = () => api.get("/vendors/categories");

export const getVendor = (vendorId: string) => api.get(`/vendors/${vendorId}`);

export const updateVendor = (
  vendorId: string,
  data: {
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
    kyc_status?:
    | "pending"
    | "manual_review"
    | "verified"
    | "rejected"
    | "approved";
  },
) => api.put(`/vendors/${vendorId}`, data);

export const parseApiError = (error: any): string => {
  const data = error?.response?.data;
  if (!data) {
    return error?.message || "Something went wrong";
  }
  if (typeof data?.detail === "string") {
    return data.detail;
  }
  if (Array.isArray(data?.detail)) {
    return data.detail
      .map((item: any) => item?.msg || item?.message || String(item))
      .join(", ");
  }
  if (typeof data?.message === "string") {
    return data.message;
  }
  return error?.message || "Something went wrong";
};

export const updateVendorBusinessProfile = (vendorId: string, data: any) =>
  api.put(`/vendors/${vendorId}/business/profile`, data);

const appendMultipartFile = async (
  formData: FormData,
  fieldName: string,
  file: { uri: string; name: string; type: string },
) => {
  if (Platform.OS === "web") {
    const response = await fetch(file.uri);
    const blob = await response.blob();
    const webFile = new File([blob], file.name || "upload.jpg", {
      type: file.type || blob.type || "image/jpeg",
    });
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
    console.warn(
      "[API] Multipart append failed, falling back to blob upload:",
      error,
    );
    const response = await fetch(preparedFile.uri);
    const blob = await response.blob();
    formData.append(fieldName, blob as any, preparedFile.name || "upload.jpg");
  }
};

const blobToDataUrl = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result || ""));
    reader.onerror = () =>
      reject(new Error("Failed to convert image blob to base64"));
    reader.readAsDataURL(blob);
  });

const getImageBase64FromUri = async (file: { uri: string; type?: string }) => {
  const response = await fetch(file.uri);
  const blob = await response.blob();
  const dataUrl = await blobToDataUrl(blob);
  if (dataUrl && dataUrl.startsWith("data:")) {
    return dataUrl;
  }
  return `data:${file.type || blob.type || "image/jpeg"};base64,${dataUrl}`;
};

export const uploadVendorBusinessImage = (
  vendorId: string,
  slot: number,
  file: { uri: string; name: string; type: string },
) => {
  return (async () => {
    const formData = new FormData();
    formData.append("slot", String(slot));
    await appendMultipartFile(formData, "file", file);

    if (Platform.OS !== "web") {
      try {
        const token = await secureStorage.getItem("auth_token");
        const url = `${API_URL}/api/vendors/${vendorId}/business/images/upload`;
        const headers: Record<string, string> = {};
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch(url, {
          method: "POST",
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
        console.warn(
          "[API] Native vendor upload failed, retrying via axios:",
          error,
        );
        return api.post(
          `/vendors/${vendorId}/business/images/upload`,
          formData,
          {
            headers:
              (Platform.OS as string) === "web"
                ? { "Content-Type": "multipart/form-data" }
                : undefined,
          },
        );
      }
    }

    return api.post(`/vendors/${vendorId}/business/images/upload`, formData, {
      headers:
        (Platform.OS as string) === "web"
          ? { "Content-Type": "multipart/form-data" }
          : undefined,
    });
  })();
};

export const uploadVendorKycFile = (
  vendorId: string,
  docType: "aadhaar" | "pan" | "face_scan",
  file: { uri: string; name: string; type: string },
) => {
  return (async () => {
    console.log("[API] Starting uploadVendorKycFile payload processing:", {
      vendorId,
      docType,
      file,
      platform: Platform.OS,
    });

    const formData = new FormData();
    formData.append("doc_type", docType);
    await appendMultipartFile(formData, "file", file);

    console.log("[API] Constructed FormData keys:", Object.keys(formData));

    if (Platform.OS !== "web") {
      try {
        const token = await secureStorage.getItem("auth_token");
        const url = `${API_URL}/api/vendors/${vendorId}/kyc/upload`;
        const headers: Record<string, string> = {};
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        console.log("[API] Native upload fetch details:", {
          url,
          headers: {
            ...headers,
            Authorization: headers.Authorization ? "Bearer [HIDDEN]" : "none",
          },
        });

        const response = await fetch(url, {
          method: "POST",
          headers,
          body: formData,
        });

        if (!response.ok) {
          const text = await response.text();
          console.error(
            "[API] Native upload failed with status:",
            response.status,
            text,
          );
          throw new Error(`Upload failed: ${response.status} ${text}`);
        }

        const data = await response.json();
        console.log("[API] Native upload succeeded:", data);
        return { data };
      } catch (error) {
        console.warn(
          "[API] Native KYC file upload failed, retrying via axios:",
          error,
        );
        return api.post(`/vendors/${vendorId}/kyc/upload`, formData);
      }
    }

    console.log(
      "[API] Web upload using axios to:",
      `/vendors/${vendorId}/kyc/upload`,
    );
    return api.post(`/vendors/${vendorId}/kyc/upload`, formData, {
      headers:
        Platform.OS === "web"
          ? { "Content-Type": "multipart/form-data" }
          : undefined,
    });
  })();
};

export const extractKycTextFromImage = async (
  vendorId: string,
  file: { uri: string; name: string; type: string },
) => {
  const token = await secureStorage.getItem("auth_token");

  const formData = new FormData();

  let fileAttached = false;
  try {
    await appendMultipartFile(formData, "file", file);
    fileAttached = true;
    console.log(
      "[OCR API] File attached successfully, has file:",
      formData.has("file"),
    );
  } catch (error) {
    console.warn(
      "extractKycTextFromImage: multipart file attach failed, will try base64 fallback",
      error,
    );
  }

  // For web, always try base64 as it's more reliable
  if (Platform.OS === "web") {
    try {
      console.log("[OCR API] Converting to base64 for web...");
      const imageBase64 = await getImageBase64FromUri(file);
      if (imageBase64) {
        formData.append("image_base64", imageBase64);
        console.log(
          "[OCR API] Base64 attached, length:",
          imageBase64.length,
          "has image_base64:",
          formData.has("image_base64"),
        );
      }
    } catch (error) {
      console.warn(
        "extractKycTextFromImage: base64 fallback generation failed",
        error,
      );
    }
  }

  if (!fileAttached && !formData.get("image_base64")) {
    throw new Error("Failed to prepare image payload for OCR upload");
  }

  console.log("[OCR API] Sending request to backend...");
  console.log(
    "[OCR API] Fetch URL:",
    `${API_URL}/api/vendors/${vendorId}/kyc/vision-extract`,
  );

  let response;
  try {
    const headers: Record<string, string> = {
      "Bypass-Tunnel-Reminder": "true", // Required for localtunnel
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    response = await fetch(
      `${API_URL}/api/vendors/${vendorId}/kyc/vision-extract`,
      {
        method: "POST",
        headers,
        body: formData,
      },
    );
  } catch (fetchError: any) {
    console.error("[OCR API] Fetch error:", fetchError);
    throw new Error(`Network error: ${fetchError.message}`);
  }

  console.log(
    "[OCR API] Response status:",
    response.status,
    response.statusText,
  );

  if (!response.ok) {
    console.error("[OCR API] Error response:", response.status);
    throw new Error(`OCR failed: ${response.status}`);
  }

  const data = await response.json();
  console.log("[OCR API] Response data received successfully.");
  return { data };
};

export const extractUserKycTextFromImage = async (file: {
  uri: string;
  name: string;
  type: string;
}) => {
  const token = await secureStorage.getItem("auth_token");

  const formData = new FormData();

  let fileAttached = false;
  try {
    await appendMultipartFile(formData, "file", file);
    fileAttached = true;
    console.log(
      "[User OCR API] File attached successfully, has file:",
      formData.has("file"),
    );
  } catch (error) {
    console.warn(
      "extractUserKycTextFromImage: multipart file attach failed, will try base64 fallback",
      error,
    );
  }

  if (Platform.OS === "web") {
    try {
      console.log("[User OCR API] Converting to base64 for web...");
      const imageBase64 = await getImageBase64FromUri(file);
      if (imageBase64) {
        formData.append("image_base64", imageBase64);
        console.log(
          "[User OCR API] Base64 attached, length:",
          imageBase64.length,
          "has image_base64:",
          formData.has("image_base64"),
        );
      }
    } catch (error) {
      console.warn(
        "extractUserKycTextFromImage: base64 fallback generation failed",
        error,
      );
    }
  }

  if (!fileAttached && !formData.get("image_base64")) {
    throw new Error("Failed to prepare image payload for OCR upload");
  }

  console.log("[User OCR API] Sending request to backend...");
  console.log("[User OCR API] Fetch URL:", `${API_URL}/api/kyc/vision-extract`);

  let response;
  try {
    const headers: Record<string, string> = {
      "Bypass-Tunnel-Reminder": "true",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    response = await fetch(`${API_URL}/api/kyc/vision-extract`, {
      method: "POST",
      headers,
      body: formData,
    });
  } catch (fetchError: any) {
    console.error("[User OCR API] Fetch error:", fetchError);
    throw new Error(`Network error: ${fetchError.message}`);
  }

  console.log(
    "[User OCR API] Response status:",
    response.status,
    response.statusText,
  );

  if (!response.ok) {
    console.error("[User OCR API] Error response:", response.status);
    throw new Error(`OCR failed: ${response.status}`);
  }

  const data = await response.json();
  console.log("[User OCR API] Response data received successfully.");
  return { data };
};

export const generateVendorAadhaarOtp = (
  vendorId: string,
  data: {
    aadhaar_number: string;
    consent: "Y" | "y";
    reason: string;
  },
) => api.post(`/vendors/${vendorId}/kyc/aadhaar/otp`, data);

export const verifyVendorAadhaarOtp = (
  vendorId: string,
  data: {
    reference_id: string;
    otp: string;
  },
) => api.post(`/vendors/${vendorId}/kyc/aadhaar/otp/verify`, data);

export const addVendorPhoto = (vendorId: string, photo: string) =>
  api.post(`/vendors/${vendorId}/photos`, photo, {
    headers: { "Content-Type": "application/json" },
  });

export const deleteVendor = (vendorId: string, otp?: string) =>
  api.delete(`/vendors/${vendorId}`, { params: { otp } });

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
  api.post("/jobs/profile", data);

export const getMyJobProfile = () => api.get("/jobs/profile/my");

export const getJobProfile = (profileId: string) =>
  api.get(`/jobs/profile/${profileId}`);

export const getJobProfiles = (params?: {
  search?: string;
  profession?: string;
  city?: string;
  lat?: number;
  lng?: number;
  limit?: number;
}) => api.get("/jobs/profiles", { params });

export const uploadJobProfileFile = (
  profileId: string,
  docType: "photo" | "cv",
  file: { uri: string; name: string; type: string },
) => {
  return (async () => {
    const formData = new FormData();
    formData.append("doc_type", docType);
    await appendMultipartFile(formData, "file", file);

    return api.post(`/jobs/profile/${profileId}/upload`, formData, {
      headers:
        Platform.OS === "web"
          ? { "Content-Type": "multipart/form-data" }
          : undefined,
    });
  })();
};

// =================== UTILITY APIS ===================

export const getWisdom = () => api.get("/wisdom/today");

export const getGitaShloka = async (chapter: number, verse: number) => {
  try {
    const response = await fetch(
      `https://vedicscriptures.github.io/slok/${chapter}/${verse}`,
    );
    if (!response.ok) throw new Error("Failed to fetch");
    return await response.json();
  } catch (error) {
    console.error("Error fetching Gita shloka:", error);
    throw error;
  }
};

export const getNextFestival = () => api.get("/spiritual/festival/next");

export const getFestivalList = () => api.get("/spiritual/festivals/all");

// =================== REALTIME APIS ===================

export type RealtimeIceServer = {
  urls: string | string[];
  username?: string;
  credential?: string;
};

export const getRealtimeIceServers = async () => {
  const response = await api.get<{
    iceServers: RealtimeIceServer[];
    turnEnabled: boolean;
    expiresAt?: number | null;
  }>("/realtime/ice-servers");
  return response.data;
};

export const getRealtimeSfuToken = async (room: string) => {
  const response = await api.get<{
    enabled: boolean;
    url?: string;
    token?: string;
    room?: string;
    expiresAt?: number;
    reason?: string;
  }>("/realtime/sfu-token", { params: { room } });
  return response.data;
};

export const getAgoraToken = async (
  channel: string = "mantra-jaap-live-room",
) => {
  const response = await api.get<{
    enabled: boolean;
    appId?: string;
    token?: string;
    channel?: string;
    uid?: number;
    expiresAt?: number;
    reason?: string;
  }>("/realtime/agora-token", { params: { channel } });
  return response.data;
};

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
}) => api.post("/sos", data);

export const getActiveSOSAlerts = (params?: {
  lat?: number;
  lng?: number;
  radius?: number;
}) => api.get("/sos/nearby", { params });

export const getMySOSAlert = () => api.get("/sos/my");

export const resolveSOSAlert = (
  sosId: string,
  status: "resolved" | "cancelled",
) => api.post(`/sos/${sosId}/resolve`, { status });

export const resolveMyActiveSOS = (status: "resolved" | "cancelled") =>
  api.post("/sos/my/resolve", { status });

export const respondToSOS = (sosId: string, response: "coming" | "called") =>
  api.post(`/sos/${sosId}/respond`, { response });

export const reportSOSMisuse = (sosId: string, reason: string) =>
  api.post(`/sos/${sosId}/report-misuse`, { reason });

// =================== SPEECH TRANSCRIPTION API ===================

export const transcribeAudio = async (
  audioBase64: string,
  languageCode: string = "en-IN",
) => {
  const response = await api.post("/speech/transcribe", {
    audio_base64: audioBase64,
    language_code: languageCode,
  });
  return response.data;
};

export const toggleCommunityMessageLike = (
  communityId: string,
  subgroupType: string,
  messageId: string,
) => {
  return api.post(
    `/messages/community/${communityId}/${subgroupType}/${messageId}/like`,
  );
};

export const addCommunityMessageComment = (
  communityId: string,
  subgroupType: string,
  messageId: string,
  text: string,
) => {
  return api.post(
    `/messages/community/${communityId}/${subgroupType}/${messageId}/comments`,
    { text },
  );
};

export const getCommunityMessageComments = (
  communityId: string,
  subgroupType: string,
  messageId: string,
) => {
  return api.get(
    `/messages/community/${communityId}/${subgroupType}/${messageId}/comments`,
  );
};

export const deleteComment = (commentId: string) => {
  return api.delete(`/comments/${commentId}`);
};

export default api;
