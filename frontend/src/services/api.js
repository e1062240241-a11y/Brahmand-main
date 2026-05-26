"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPostComments = exports.addPostComment = exports.togglePostLike = exports.getPostsFeed = exports.getHomeInit = exports.markPostAsSeen = exports.uploadCompressedVideo = exports.uploadChatMedia = exports.uploadUserPost = exports.aiChat = exports.markNotificationRead = exports.markAllNotificationsRead = exports.getUnreadNotificationCount = exports.getUserNotifications = exports.getAllUsers = exports.searchUserBySLId = exports.searchHospitals = exports.forwardGeocode = exports.reverseGeocode = exports.updateCurrentLocation = exports.setupDualLocation = exports.setupLocation = exports.updateProfile = exports.getUsersBatch = exports.getUserPosts = exports.getUserProfile = exports.getProfile = exports.registerUser = exports.register = exports.verifyMsg91OTP = exports.sendMsg91OTP = exports.verifyMsg91Token = exports.verifyFirebaseToken = exports.adminActionPersonalityVerification = exports.adminListPersonalityVerifications = exports.adminReviewReport = exports.getAdminReports = exports.adminVerifyUserKyc = exports.getAdminPendingKyc = exports.adminRejectVendor = exports.adminApproveVendor = exports.disableAdminAnonymousUser = exports.getAdminAnonymousUsers = exports.getAdminVendorReviewQueue = exports.adminPanelLogin = exports.loginAnonymous = exports.verifyOTP = exports.sendOTP = exports.api = exports.API_URL = void 0;
exports.denyDirectMessageRequest = exports.approveDirectMessageRequest = exports.clearDirectMessages = exports.markDirectMessagesRead = exports.getDirectMessages = exports.getConversations = exports.sendDirectMessage = exports.getCircleMessages = exports.sendCircleMessage = exports.getCommunityMessages = exports.sendCommunityMessage = exports.removeCircleMember = exports.deleteCircle = exports.leaveCircle = exports.transferCircleAdmin = exports.inviteToCircle = exports.rejectCircleRequest = exports.approveCircleRequest = exports.getCircleRequests = exports.joinCircle = exports.updateCircle = exports.getCircle = exports.getCircles = exports.createCircle = exports.agreeToRules = exports.createCommunity = exports.respondToCommunityRequest = exports.joinCommunityByCode = exports.getCommunity = exports.getCommunities = exports.getMahabharataBook = exports.getYajurvedaChapter = exports.getRigvedaChapter = exports.getRamayanChapter = exports.getAtharvavedChapter = exports.getRamcharitmanasKand = exports.getBhagavadGitaChapter = exports.getFeedPreferences = exports.recordWatchEvent = exports.getPostViews = exports.getPostById = exports.viewPost = exports.searchByHashtag = exports.removePostHashtags = exports.addPostHashtags = exports.updatePost = exports.reportPost = exports.deletePostComment = exports.deletePost = exports.repostPost = void 0;
exports.createVendor = exports.deleteCommunityRequest = exports.resolveCommunityRequest = exports.getMyActiveCommunityRequests = exports.getMyCommunityRequests = exports.getCommunityRequests = exports.createCommunityRequest = exports.deleteHelpRequest = exports.verifyHelpRequest = exports.fulfillHelpRequest = exports.getActiveHelpRequest = exports.getMyHelpRequests = exports.getHelpRequests = exports.createHelpRequest = exports.markMessagesRead = exports.createTemplePost = exports.createTemple = exports.reportContent = exports.verifyUserAadhaarOtp = exports.generateUserAadhaarOtp = exports.submitKYC = exports.getKYCStatus = exports.getCommunityStats = exports.getHoroscope = exports.getProfileCompletion = exports.deleteUserProfile = exports.updateExtendedProfile = exports.requestVerification = exports.getVerificationStatus = exports.attendEvent = exports.getNearbyEvents = exports.getEvents = exports.reactToTemplePost = exports.getTemplePosts = exports.unfollowUser = exports.followUser = exports.unfollowTemple = exports.followTemple = exports.getTemple = exports.getNearbyTemples = exports.getTemples = exports.getUserHoroscope = exports.askAstrologyAI = exports.getNakshatraReport = exports.getDailyHoroscope = exports.getPanchang = exports.getTodaysWisdom = exports.discoverCommunities = exports.unmuteConversation = exports.muteConversation = void 0;
exports.deleteComment = exports.getCommunityMessageComments = exports.addCommunityMessageComment = exports.toggleCommunityMessageLike = exports.transcribeAudio = exports.respondToSOS = exports.resolveMyActiveSOS = exports.resolveSOSAlert = exports.getMySOSAlert = exports.getActiveSOSAlerts = exports.createSOSAlert = exports.getAgoraToken = exports.getRealtimeSfuToken = exports.getRealtimeIceServers = exports.getFestivalList = exports.getNextFestival = exports.getGitaShloka = exports.getWisdom = exports.updateUserCulturalCommunity = exports.getUserCulturalCommunity = exports.getCulturalCommunities = exports.uploadJobProfileFile = exports.getJobProfiles = exports.getJobProfile = exports.getMyJobProfile = exports.createOrUpdateJobProfile = exports.deleteVendor = exports.addVendorPhoto = exports.verifyVendorAadhaarOtp = exports.generateVendorAadhaarOtp = exports.extractUserKycTextFromImage = exports.extractKycTextFromImage = exports.uploadVendorKycFile = exports.uploadVendorBusinessImage = exports.updateVendorBusinessProfile = exports.parseApiError = exports.updateVendor = exports.getVendor = exports.getVendorCategories = exports.getMyVendor = exports.getVendors = void 0;
var axios_1 = __importDefault(require("axios"));
var async_storage_1 = __importDefault(require("@react-native-async-storage/async-storage"));
var react_native_1 = require("react-native");
var FileSystem = __importStar(require("expo-file-system"));
var storage_1 = require("firebase/storage");
var secureStorage_1 = require("../utils/secureStorage");
var config_1 = require("./firebase/config");
var configuredApiUrl = process.env.EXPO_PUBLIC_BACKEND_URL;
var configuredWebApiUrl = process.env.EXPO_PUBLIC_BACKEND_URL_WEB;
var getRuntimeWebApiUrl = function () {
    var _a, _b, _c, _d;
    if (react_native_1.Platform.OS !== 'web' || typeof window === 'undefined') {
        return undefined;
    }
    try {
        var params = new URLSearchParams(window.location.search || '');
        var queryApiUrl = ((_a = params.get('api')) === null || _a === void 0 ? void 0 : _a.trim()) ||
            ((_b = params.get('backend')) === null || _b === void 0 ? void 0 : _b.trim()) ||
            ((_c = params.get('backend_url')) === null || _c === void 0 ? void 0 : _c.trim());
        if (queryApiUrl) {
            window.localStorage.setItem('BRAHMAND_RUNTIME_API_URL', queryApiUrl);
            return queryApiUrl;
        }
        var storedApiUrl = (_d = window.localStorage.getItem('BRAHMAND_RUNTIME_API_URL')) === null || _d === void 0 ? void 0 : _d.trim();
        // Auto-clear stale IP-based overrides when running on localhost
        var isWebLocal = /localhost|127\.0\.0\.1/.test(window.location.hostname);
        if (isWebLocal && storedApiUrl && !/localhost|127\.0\.0\.1/.test(storedApiUrl)) {
            console.info('[API] Clearing stale remote API URL override from localStorage');
            window.localStorage.removeItem('BRAHMAND_RUNTIME_API_URL');
            return undefined;
        }
        return storedApiUrl || undefined;
    }
    catch (_e) {
        return undefined;
    }
};
var runtimeWebApiUrl = getRuntimeWebApiUrl();
var isLocalhostUrl = function (value) {
    return !!value && /localhost|127\.0\.0\.1/.test(value);
};
var isWebRunningOnLocalhost = react_native_1.Platform.OS === 'web' && typeof window !== 'undefined'
    ? /localhost|127\.0\.0\.1/.test(window.location.hostname)
    : false;
var normalizeMimeType = function (type, name) {
    var normalized = (type || '').toLowerCase();
    var allowedImageTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/heic', 'image/gif', 'image/bmp'];
    if (allowedImageTypes.includes(normalized)) {
        return normalized === 'image/jpg' ? 'image/jpeg' : normalized;
    }
    if (normalized.startsWith('image/')) {
        return normalized;
    }
    if (typeof name === 'string') {
        var lowerName = name.toLowerCase();
        if (lowerName.endsWith('.png'))
            return 'image/png';
        if (lowerName.endsWith('.webp'))
            return 'image/webp';
        if (lowerName.endsWith('.heic'))
            return 'image/heic';
        if (lowerName.endsWith('.gif'))
            return 'image/gif';
        if (lowerName.endsWith('.bmp'))
            return 'image/bmp';
        if (lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg'))
            return 'image/jpeg';
    }
    return 'image/jpeg';
};
var normalizeNativeUploadFile = function (file) { return __awaiter(void 0, void 0, void 0, function () {
    var fileName, fileType, fileSystem, cacheDir, localUri, downloadResult, error_1;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                fileName = file.name || 'upload.jpg';
                fileType = normalizeMimeType(file.type, fileName);
                if (!(react_native_1.Platform.OS !== 'web' && ((_a = file.uri) === null || _a === void 0 ? void 0 : _a.startsWith('content://')))) return [3 /*break*/, 4];
                _b.label = 1;
            case 1:
                _b.trys.push([1, 3, , 4]);
                fileSystem = FileSystem;
                cacheDir = fileSystem.cacheDirectory || fileSystem.documentDirectory || '';
                localUri = "".concat(cacheDir, "upload-").concat(Date.now(), "-").concat(fileName);
                return [4 /*yield*/, FileSystem.downloadAsync(file.uri, localUri)];
            case 2:
                downloadResult = _b.sent();
                return [2 /*return*/, {
                        uri: downloadResult.uri,
                        name: fileName,
                        type: fileType,
                    }];
            case 3:
                error_1 = _b.sent();
                console.warn('[API] Failed to convert content URI to local file:', error_1);
                return [2 /*return*/, {
                        uri: file.uri,
                        name: fileName,
                        type: fileType,
                    }];
            case 4: return [2 /*return*/, {
                    uri: file.uri,
                    name: fileName,
                    type: fileType,
                }];
        }
    });
}); };
var resolvedWebApiUrl = runtimeWebApiUrl
    ? runtimeWebApiUrl
    : configuredWebApiUrl && (!isLocalhostUrl(configuredWebApiUrl) || isWebRunningOnLocalhost)
        ? configuredWebApiUrl
        : configuredApiUrl;
exports.API_URL = (react_native_1.Platform.OS === 'web'
    ? (resolvedWebApiUrl || 'http://127.0.0.1:8000')
    : (configuredApiUrl || 'http://127.0.0.1:8000')).replace('localhost', '127.0.0.1');
var isTunnelApiUrl = /\.loca\.lt$/i.test((exports.API_URL || '').replace(/^https?:\/\//i, '').split('/')[0] || '');
var defaultHeaders = {
    'Content-Type': 'application/json',
};
if (react_native_1.Platform.OS !== 'web' || isTunnelApiUrl) {
    defaultHeaders['Bypass-Tunnel-Reminder'] = 'true';
}
if (react_native_1.Platform.OS === 'web') {
    console.info('[API] api.ts resolved API_URL:', exports.API_URL);
}
exports.api = axios_1.default.create({
    baseURL: "".concat(exports.API_URL, "/api"),
    timeout: 120000,
    headers: defaultHeaders,
});
var adminApi = axios_1.default.create({
    baseURL: "".concat(exports.API_URL, "/api"),
    timeout: 30000,
    headers: defaultHeaders,
});
var RETRYABLE_METHODS = new Set(['get', 'head', 'options']);
var RETRYABLE_STATUS_CODES = new Set([502, 503]);
var MAX_RETRY_ATTEMPTS = 1;
var CLOUD_RUN_SAFE_UPLOAD_BYTES = 28 * 1024 * 1024;
var ENABLE_WEB_DIRECT_VIDEO_UPLOAD = process.env.EXPO_PUBLIC_ENABLE_WEB_DIRECT_VIDEO_UPLOAD === 'true';
var isVideoMimeType = function (value) { return (value || '').toLowerCase().startsWith('video/'); };
var makeUploadId = function () { return "".concat(Date.now(), "-").concat(Math.random().toString(36).slice(2, 10)); };
var uploadLargeVideoViaFirebase = function (file, onProgress) { return __awaiter(void 0, void 0, void 0, function () {
    var response, blob, uploadId, safeName, objectPath, storage, uploadRef, task;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, fetch(file.uri)];
            case 1:
                response = _a.sent();
                return [4 /*yield*/, response.blob()];
            case 2:
                blob = _a.sent();
                if (!blob || blob.size <= 0) {
                    throw new Error('Could not read selected video file');
                }
                uploadId = makeUploadId();
                safeName = (file.name || "video-".concat(uploadId, ".mp4")).replace(/[^a-zA-Z0-9._-]/g, '_');
                objectPath = "raw-post-videos/direct/".concat(uploadId, "-").concat(safeName);
                storage = (0, config_1.getFirebaseStorage)();
                uploadRef = (0, storage_1.ref)(storage, objectPath);
                task = (0, storage_1.uploadBytesResumable)(uploadRef, blob, {
                    contentType: file.type || 'video/mp4',
                });
                return [4 /*yield*/, new Promise(function (resolve, reject) {
                        task.on('state_changed', function (snapshot) {
                            if (!onProgress) {
                                return;
                            }
                            var total = snapshot.totalBytes || blob.size;
                            var loaded = snapshot.bytesTransferred || 0;
                            onProgress({ loaded: loaded, total: total });
                        }, function (error) { return reject(error); }, function () { return resolve(); });
                    })];
            case 3:
                _a.sent();
                return [2 /*return*/, {
                        objectPath: objectPath,
                        fileSize: blob.size,
                    }];
        }
    });
}); };
// Add auth token to requests
exports.api.interceptors.request.use(function (config) { return __awaiter(void 0, void 0, void 0, function () {
    var token;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, secureStorage_1.secureStorage.getItem('auth_token')];
            case 1:
                token = _a.sent();
                if (token) {
                    config.headers.Authorization = "Bearer ".concat(token);
                }
                // Handle FormData Content-Type override
                if (config.data instanceof FormData) {
                    // For FormData, we must let the browser/native layer set the boundary
                    // Deleting Content-Type allows Axios/Fetch to detect it correctly and add the boundary
                    delete config.headers['Content-Type'];
                }
                return [2 /*return*/, config];
        }
    });
}); });
// Robust retry on 503 errors and network disconnections
exports.api.interceptors.response.use(function (response) { return response; }, function (error) { return __awaiter(void 0, void 0, void 0, function () {
    var config, method, status, shouldRetry, delay_1;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                config = error.config;
                method = ((config === null || config === void 0 ? void 0 : config.method) || 'get').toLowerCase();
                status = (_a = error.response) === null || _a === void 0 ? void 0 : _a.status;
                shouldRetry = config &&
                    RETRYABLE_METHODS.has(method) &&
                    (RETRYABLE_STATUS_CODES.has(status) || error.code === 'ERR_NETWORK') &&
                    (config._retryCount || 0) < MAX_RETRY_ATTEMPTS;
                if (!shouldRetry) return [3 /*break*/, 3];
                config._retryCount = (config._retryCount || 0) + 1;
                console.warn("[API] Retrying ".concat(method.toUpperCase(), " ").concat(config.url, "... Attempt ").concat(config._retryCount));
                delay_1 = error.code === 'ERR_NETWORK' ? 1000 * config._retryCount : 0;
                if (!(delay_1 > 0)) return [3 /*break*/, 2];
                return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, delay_1); })];
            case 1:
                _b.sent();
                _b.label = 2;
            case 2: return [2 /*return*/, (0, exports.api)(config)];
            case 3:
                // If backend is temporarily unavailable, return a graceful fallback only for read requests.
                if (RETRYABLE_STATUS_CODES.has(status) && RETRYABLE_METHODS.has(method)) {
                    console.warn('[API] Backend unavailable, returning fallback payload for 503/502');
                    return [2 /*return*/, Promise.resolve({
                            data: null,
                            status: error.response.status,
                            statusText: error.response.statusText,
                            headers: error.response.headers,
                            config: config,
                        })];
                }
                // Enhance generic server errors with specific backend error payload if present
                if (error.response && error.response.data && error.response.data.detail) {
                    error.message = typeof error.response.data.detail === 'string'
                        ? error.response.data.detail
                        : JSON.stringify(error.response.data.detail);
                }
                return [2 /*return*/, Promise.reject(error)];
        }
    });
}); });
// Auth APIs
var sendOTP = function (phone) {
    return exports.api.post('/auth/send-otp', { phone: phone });
};
exports.sendOTP = sendOTP;
var verifyOTP = function (phone, otp) {
    return exports.api.post('/auth/verify-otp', { phone: phone, otp: otp });
};
exports.verifyOTP = verifyOTP;
var loginAnonymous = function (data) {
    return exports.api.post('/auth/login-anonymous', data);
};
exports.loginAnonymous = loginAnonymous;
var adminPanelLogin = function (data) {
    return adminApi.post('/admin/auth/login', data);
};
exports.adminPanelLogin = adminPanelLogin;
var getAdminVendorReviewQueue = function (adminToken, status) {
    if (status === void 0) { status = 'pending'; }
    return adminApi.get('/admin/vendors/review-queue', {
        params: { status: status },
        headers: { Authorization: "Bearer ".concat(adminToken) },
    });
};
exports.getAdminVendorReviewQueue = getAdminVendorReviewQueue;
var getAdminAnonymousUsers = function (adminToken) {
    return adminApi.get('/admin/anonymous-users', {
        headers: { Authorization: "Bearer ".concat(adminToken) },
    });
};
exports.getAdminAnonymousUsers = getAdminAnonymousUsers;
var disableAdminAnonymousUser = function (adminToken, userId) {
    return adminApi.post("/admin/anonymous-users/".concat(userId, "/disable"), {}, { headers: { Authorization: "Bearer ".concat(adminToken) } });
};
exports.disableAdminAnonymousUser = disableAdminAnonymousUser;
var adminApproveVendor = function (adminToken, vendorId, note) {
    return adminApi.post("/admin/vendors/".concat(vendorId, "/approve"), { note: note }, { headers: { Authorization: "Bearer ".concat(adminToken) } });
};
exports.adminApproveVendor = adminApproveVendor;
var adminRejectVendor = function (adminToken, vendorId, reason) {
    return adminApi.post("/admin/vendors/".concat(vendorId, "/reject"), { reason: reason || 'Denied by admin' }, { headers: { Authorization: "Bearer ".concat(adminToken) } });
};
exports.adminRejectVendor = adminRejectVendor;
var getAdminPendingKyc = function (adminToken) {
    return adminApi.get('/admin/kyc/pending', {
        headers: { Authorization: "Bearer ".concat(adminToken) },
    });
};
exports.getAdminPendingKyc = getAdminPendingKyc;
var adminVerifyUserKyc = function (adminToken, userId, action, rejection_reason) {
    return adminApi.post("/admin/kyc/verify/".concat(userId), action === 'reject'
        ? { action: action, rejection_reason: rejection_reason || 'Denied by admin' }
        : { action: action }, { headers: { Authorization: "Bearer ".concat(adminToken) } });
};
exports.adminVerifyUserKyc = adminVerifyUserKyc;
var getAdminReports = function (adminToken, status, contentType, limit) {
    if (status === void 0) { status = 'pending'; }
    if (contentType === void 0) { contentType = 'post'; }
    if (limit === void 0) { limit = 100; }
    return adminApi.get('/admin/reports', {
        params: { status: status, content_type: contentType, limit: limit },
        headers: { Authorization: "Bearer ".concat(adminToken) },
    });
};
exports.getAdminReports = getAdminReports;
var adminReviewReport = function (adminToken, reportId, action, note) {
    return adminApi.post("/admin/reports/".concat(reportId, "/review"), { action: action, note: note }, { headers: { Authorization: "Bearer ".concat(adminToken) } });
};
exports.adminReviewReport = adminReviewReport;
var adminListPersonalityVerifications = function (adminToken, status) {
    if (status === void 0) { status = 'pending'; }
    return adminApi.get("/admin/personality-verifications", {
        params: { status: status },
        headers: { Authorization: "Bearer ".concat(adminToken) },
    });
};
exports.adminListPersonalityVerifications = adminListPersonalityVerifications;
var adminActionPersonalityVerification = function (adminToken, requestId, action) {
    return adminApi.post("/admin/personality-verifications/".concat(requestId, "/action"), { action: action }, { headers: { Authorization: "Bearer ".concat(adminToken) } });
};
exports.adminActionPersonalityVerification = adminActionPersonalityVerification;
var verifyFirebaseToken = function (id_token) {
    return exports.api.post('/auth/verify-firebase-token', { id_token: id_token });
};
exports.verifyFirebaseToken = verifyFirebaseToken;
var verifyMsg91Token = function (access_token) {
    return exports.api.post('/auth/verify-msg91', { access_token: access_token });
};
exports.verifyMsg91Token = verifyMsg91Token;
var sendMsg91OTP = function (phone) {
    return exports.api.post('/auth/msg91/send', { phone: phone });
};
exports.sendMsg91OTP = sendMsg91OTP;
var verifyMsg91OTP = function (phone, otp) {
    return exports.api.post('/auth/msg91/verify', { phone: phone, otp: otp });
};
exports.verifyMsg91OTP = verifyMsg91OTP;
var register = function (data) {
    return exports.api.post('/auth/register', data);
};
exports.register = register;
var registerUser = function (data) {
    return exports.api.post('/auth/register', data);
};
exports.registerUser = registerUser;
// User APIs
var getProfile = function () {
    return exports.api.get('/user/profile');
};
exports.getProfile = getProfile;
var getUserProfile = function (userId) {
    return exports.api.get(userId ? "/users/".concat(userId) : '/user/profile');
};
exports.getUserProfile = getUserProfile;
var getUserPosts = function (userId, limit, offset) {
    if (limit === void 0) { limit = 20; }
    if (offset === void 0) { offset = 0; }
    return exports.api.get("/users/".concat(userId, "/posts"), { params: { limit: limit, offset: offset } });
};
exports.getUserPosts = getUserPosts;
var getUsersBatch = function (userIds) {
    return exports.api.post('/users/batch', { user_ids: userIds });
};
exports.getUsersBatch = getUsersBatch;
var updateProfile = function (data) {
    return exports.api.put('/user/profile', data);
};
exports.updateProfile = updateProfile;
var setupLocation = function (location) {
    return exports.api.post('/user/location', location);
};
exports.setupLocation = setupLocation;
var setupDualLocation = function (locations) {
    return exports.api.post('/user/dual-location', locations);
};
exports.setupDualLocation = setupDualLocation;
var updateCurrentLocation = function (location) { return __awaiter(void 0, void 0, void 0, function () {
    var error_2, token, headers, rootError_1;
    var _a, _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 2, , 7]);
                return [4 /*yield*/, exports.api.post('/user/current-location', location)];
            case 1: return [2 /*return*/, _c.sent()];
            case 2:
                error_2 = _c.sent();
                if (!(((_a = error_2.response) === null || _a === void 0 ? void 0 : _a.status) === 404)) return [3 /*break*/, 6];
                _c.label = 3;
            case 3:
                _c.trys.push([3, 5, , 6]);
                return [4 /*yield*/, secureStorage_1.secureStorage.getItem('auth_token')];
            case 4:
                token = _c.sent();
                headers = {
                    'Content-Type': 'application/json',
                };
                if (token) {
                    headers.Authorization = "Bearer ".concat(token);
                }
                return [2 /*return*/, axios_1.default.post("".concat(exports.API_URL, "/user/current-location"), location, { headers: headers, timeout: 30000 })];
            case 5:
                rootError_1 = _c.sent();
                if (((_b = rootError_1.response) === null || _b === void 0 ? void 0 : _b.status) === 404) {
                    return [2 /*return*/, { data: null }];
                }
                throw rootError_1;
            case 6: throw error_2;
            case 7: return [2 /*return*/];
        }
    });
}); };
exports.updateCurrentLocation = updateCurrentLocation;
var reverseGeocode = function (latitude, longitude) {
    return exports.api.post('/geocode/reverse', { latitude: latitude, longitude: longitude });
};
exports.reverseGeocode = reverseGeocode;
var forwardGeocode = function (query) {
    return exports.api.post('/geocode/forward', { query: query });
};
exports.forwardGeocode = forwardGeocode;
var searchHospitals = function (query, limit) {
    if (limit === void 0) { limit = 10; }
    return exports.api.post('/places/hospitals/search', { query: query, limit: limit });
};
exports.searchHospitals = searchHospitals;
var searchUserBySLId = function (slId) {
    return exports.api.get("/user/search/".concat(slId));
};
exports.searchUserBySLId = searchUserBySLId;
var getAllUsers = function (search, limit) {
    if (limit === void 0) { limit = 200; }
    return exports.api.get('/users', { params: { search: search, limit: limit } });
};
exports.getAllUsers = getAllUsers;
var getUserNotifications = function () {
    return exports.api.get('/notifications');
};
exports.getUserNotifications = getUserNotifications;
var getUnreadNotificationCount = function () {
    return exports.api.get('/notifications/unread-count');
};
exports.getUnreadNotificationCount = getUnreadNotificationCount;
var markAllNotificationsRead = function () {
    return exports.api.post('/notifications/mark-all-read');
};
exports.markAllNotificationsRead = markAllNotificationsRead;
var markNotificationRead = function (notificationId) {
    return exports.api.post("/notifications/".concat(notificationId, "/mark-read"));
};
exports.markNotificationRead = markNotificationRead;
var aiChat = function (messages) {
    return exports.api.post('/ai/chat', { messages: messages });
};
exports.aiChat = aiChat;
var nativeMultipartPost = function (endpoint, formData) { return __awaiter(void 0, void 0, void 0, function () {
    var token, headers, response, text, data;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, secureStorage_1.secureStorage.getItem('auth_token')];
            case 1:
                token = _a.sent();
                headers = {};
                if (token) {
                    headers.Authorization = "Bearer ".concat(token);
                }
                return [4 /*yield*/, fetch("".concat(exports.API_URL, "/api").concat(endpoint.startsWith('/') ? endpoint : "/".concat(endpoint)), {
                        method: 'POST',
                        headers: headers,
                        body: formData,
                    })];
            case 2:
                response = _a.sent();
                if (!!response.ok) return [3 /*break*/, 4];
                return [4 /*yield*/, response.text()];
            case 3:
                text = _a.sent();
                throw new Error("Upload failed: ".concat(response.status, " ").concat(text));
            case 4: return [4 /*yield*/, response.json()];
            case 5:
                data = _a.sent();
                return [2 /*return*/, { data: data }];
        }
    });
}); };
var uploadUserPost = function (file, caption, filterName, onProgress, community_level, category) {
    if (community_level === void 0) { community_level = 'city'; }
    if (category === void 0) { category = 'feed'; }
    return (function () { return __awaiter(void 0, void 0, void 0, function () {
        var localResponse, localBlob, objectPath, formData_1, formData, error_3, token, headers, uploadUrl, response, text, data;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!(react_native_1.Platform.OS === 'web' && ENABLE_WEB_DIRECT_VIDEO_UPLOAD && isVideoMimeType(file.type))) return [3 /*break*/, 4];
                    return [4 /*yield*/, fetch(file.uri)];
                case 1:
                    localResponse = _a.sent();
                    return [4 /*yield*/, localResponse.blob()];
                case 2:
                    localBlob = _a.sent();
                    if (!(localBlob.size > CLOUD_RUN_SAFE_UPLOAD_BYTES)) return [3 /*break*/, 4];
                    return [4 /*yield*/, uploadLargeVideoViaFirebase(file, onProgress)];
                case 3:
                    objectPath = (_a.sent()).objectPath;
                    formData_1 = new FormData();
                    formData_1.append('storage_path', objectPath);
                    formData_1.append('caption', caption || '');
                    formData_1.append('source', 'camera_roll');
                    formData_1.append('community_level', community_level);
                    formData_1.append('category', category);
                    if (filterName) {
                        formData_1.append('filter_name', filterName);
                    }
                    return [2 /*return*/, exports.api.post('/posts/upload-from-storage', formData_1, {
                            timeout: 30 * 60 * 1000,
                        })];
                case 4:
                    formData = new FormData();
                    formData.append('caption', caption || '');
                    formData.append('community_level', community_level);
                    formData.append('category', category);
                    if (filterName) {
                        formData.append('filter_name', filterName);
                    }
                    return [4 /*yield*/, appendMultipartFile(formData, 'file', file)];
                case 5:
                    _a.sent();
                    _a.label = 6;
                case 6:
                    _a.trys.push([6, 8, , 15]);
                    return [4 /*yield*/, exports.api.post('/posts/upload', formData, {
                            timeout: 10 * 60 * 1000,
                            onUploadProgress: onProgress,
                        })];
                case 7: return [2 /*return*/, _a.sent()];
                case 8:
                    error_3 = _a.sent();
                    if (error_3.message !== 'Network Error') {
                        console.warn('[API] axios upload failed, retrying native fetch multipart upload', error_3);
                    }
                    if (!(react_native_1.Platform.OS !== 'web')) return [3 /*break*/, 14];
                    return [4 /*yield*/, secureStorage_1.secureStorage.getItem('auth_token')];
                case 9:
                    token = _a.sent();
                    headers = {};
                    if (token) {
                        headers.Authorization = "Bearer ".concat(token);
                    }
                    uploadUrl = "".concat(exports.API_URL, "/api/posts/upload");
                    console.info('[API] Retrying post upload via native fetch:', uploadUrl);
                    return [4 /*yield*/, fetch(uploadUrl, {
                            method: 'POST',
                            headers: headers,
                            body: formData,
                        })];
                case 10:
                    response = _a.sent();
                    if (!!response.ok) return [3 /*break*/, 12];
                    return [4 /*yield*/, response.text()];
                case 11:
                    text = _a.sent();
                    console.error('[API] Native fetch post upload failed:', response.status, text);
                    throw new Error("Upload failed: ".concat(response.status, " ").concat(text));
                case 12: return [4 /*yield*/, response.json()];
                case 13:
                    data = _a.sent();
                    return [2 /*return*/, { data: data }];
                case 14: throw error_3;
                case 15: return [2 /*return*/];
            }
        });
    }); })();
};
exports.uploadUserPost = uploadUserPost;
var uploadChatMedia = function (file) {
    return (function () { return __awaiter(void 0, void 0, void 0, function () {
        var formData, token, headers, response, text, data, error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    formData = new FormData();
                    return [4 /*yield*/, appendMultipartFile(formData, 'file', file)];
                case 1:
                    _a.sent();
                    if (!(react_native_1.Platform.OS !== 'web')) return [3 /*break*/, 9];
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 8, , 9]);
                    return [4 /*yield*/, secureStorage_1.secureStorage.getItem('auth_token')];
                case 3:
                    token = _a.sent();
                    headers = {};
                    if (token) {
                        headers.Authorization = "Bearer ".concat(token);
                    }
                    return [4 /*yield*/, fetch("".concat(exports.API_URL, "/api/media/upload"), {
                            method: 'POST',
                            headers: headers,
                            body: formData,
                        })];
                case 4:
                    response = _a.sent();
                    if (!!response.ok) return [3 /*break*/, 6];
                    return [4 /*yield*/, response.text()];
                case 5:
                    text = _a.sent();
                    // If it's a validation error, we want to know why
                    throw new Error("Upload failed: ".concat(response.status, " ").concat(text));
                case 6: return [4 /*yield*/, response.json()];
                case 7:
                    data = _a.sent();
                    return [2 /*return*/, { data: data }];
                case 8:
                    error_4 = _a.sent();
                    if (error_4.message !== 'Network Error') {
                        console.warn('[API] Native chat media upload failed, retrying via axios:', error_4);
                    }
                    return [2 /*return*/, exports.api.post('/media/upload', formData)];
                case 9: return [2 /*return*/, exports.api.post('/media/upload', formData)];
            }
        });
    }); })();
};
exports.uploadChatMedia = uploadChatMedia;
var uploadCompressedVideo = function (file) {
    return (function () { return __awaiter(void 0, void 0, void 0, function () {
        var formData;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    formData = new FormData();
                    return [4 /*yield*/, appendMultipartFile(formData, 'file', file)];
                case 1:
                    _a.sent();
                    if (react_native_1.Platform.OS !== 'web') {
                        return [2 /*return*/, nativeMultipartPost('/videos/upload', formData)];
                    }
                    return [2 /*return*/, exports.api.post('/videos/upload', formData, {
                            timeout: 10 * 60 * 1000,
                        })];
            }
        });
    }); })();
};
exports.uploadCompressedVideo = uploadCompressedVideo;
var markPostAsSeen = function (postId) { return __awaiter(void 0, void 0, void 0, function () {
    var saved, seenArray, e_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!postId)
                    return [2 /*return*/];
                _a.label = 1;
            case 1:
                _a.trys.push([1, 5, , 6]);
                return [4 /*yield*/, async_storage_1.default.getItem('global_seen_reels')];
            case 2:
                saved = _a.sent();
                seenArray = saved ? JSON.parse(saved) : [];
                if (!Array.isArray(seenArray))
                    seenArray = [];
                if (!!seenArray.includes(postId)) return [3 /*break*/, 4];
                seenArray.push(postId);
                if (seenArray.length > 500)
                    seenArray = seenArray.slice(seenArray.length - 500);
                return [4 /*yield*/, async_storage_1.default.setItem('global_seen_reels', JSON.stringify(seenArray))];
            case 3:
                _a.sent();
                _a.label = 4;
            case 4: return [3 /*break*/, 6];
            case 5:
                e_1 = _a.sent();
                return [3 /*break*/, 6];
            case 6: return [2 /*return*/];
        }
    });
}); };
exports.markPostAsSeen = markPostAsSeen;
var getHomeInit = function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, exports.api.get('/home/init')];
            case 1: return [2 /*return*/, _a.sent()];
        }
    });
}); };
exports.getHomeInit = getHomeInit;
var getPostsFeed = function () {
    var args_1 = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args_1[_i] = arguments[_i];
    }
    return __awaiter(void 0, __spreadArray([], args_1, true), void 0, function (limit, offset, tab, seen_ids) {
        var savedSeen, localSeenIds, parsed, combinedSeen, e_2;
        if (limit === void 0) { limit = 20; }
        if (offset === void 0) { offset = 0; }
        if (tab === void 0) { tab = 'for_you'; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, async_storage_1.default.getItem('global_seen_reels')];
                case 1:
                    savedSeen = _a.sent();
                    localSeenIds = '';
                    if (savedSeen) {
                        parsed = JSON.parse(savedSeen);
                        if (Array.isArray(parsed)) {
                            // Reduced from 100 to 50 for faster query performance on home feed
                            localSeenIds = parsed.slice(-50).join(',');
                        }
                    }
                    combinedSeen = [seen_ids, localSeenIds].filter(Boolean).join(',');
                    return [2 /*return*/, exports.api.get('/posts/feed', { params: { limit: limit, offset: offset, tab: tab, seen_ids: combinedSeen } })];
                case 2:
                    e_2 = _a.sent();
                    return [2 /*return*/, exports.api.get('/posts/feed', { params: { limit: limit, offset: offset, tab: tab, seen_ids: seen_ids } })];
                case 3: return [2 /*return*/];
            }
        });
    });
};
exports.getPostsFeed = getPostsFeed;
var togglePostLike = function (postId) {
    (0, exports.markPostAsSeen)(postId);
    return exports.api.post("/posts/".concat(postId, "/like"));
};
exports.togglePostLike = togglePostLike;
var addPostComment = function (postId, text) {
    (0, exports.markPostAsSeen)(postId);
    return exports.api.post("/posts/".concat(postId, "/comments"), { text: text });
};
exports.addPostComment = addPostComment;
var getPostComments = function (postId, limit) {
    if (limit === void 0) { limit = 200; }
    return exports.api.get("/posts/".concat(postId, "/comments"), { params: { limit: limit } });
};
exports.getPostComments = getPostComments;
var repostPost = function (postId) {
    return exports.api.post("/posts/".concat(postId, "/repost"));
};
exports.repostPost = repostPost;
var deletePost = function (postId) {
    return exports.api.delete("/posts/".concat(postId));
};
exports.deletePost = deletePost;
var deletePostComment = function (postId, commentId) {
    return exports.api.delete("/posts/".concat(postId, "/comments/").concat(commentId));
};
exports.deletePostComment = deletePostComment;
var reportPost = function (postId, category, description) {
    if (category === void 0) { category = 'other'; }
    if (description === void 0) { description = ''; }
    return exports.api.post("/posts/".concat(postId, "/report"), { category: category, description: description });
};
exports.reportPost = reportPost;
var updatePost = function (postId, data) {
    return exports.api.put("/posts/".concat(postId), data);
};
exports.updatePost = updatePost;
var addPostHashtags = function (postId, hashtags) {
    return exports.api.post("/posts/".concat(postId, "/hashtags"), { hashtags: hashtags });
};
exports.addPostHashtags = addPostHashtags;
var removePostHashtags = function (postId, hashtags) {
    return exports.api.delete("/posts/".concat(postId, "/hashtags"), { data: { hashtags: hashtags } });
};
exports.removePostHashtags = removePostHashtags;
var searchByHashtag = function (hashtag, limit, offset) {
    if (limit === void 0) { limit = 50; }
    if (offset === void 0) { offset = 0; }
    return exports.api.get('/posts/hashtag', { params: { hashtag: hashtag, limit: limit, offset: offset } });
};
exports.searchByHashtag = searchByHashtag;
var viewPost = function (postId) {
    return exports.api.post("/posts/".concat(postId, "/view"));
};
exports.viewPost = viewPost;
var getPostById = function (postId) {
    return exports.api.get("/posts/".concat(postId));
};
exports.getPostById = getPostById;
var getPostViews = function (postId) {
    return exports.api.get("/posts/".concat(postId, "/views"));
};
exports.getPostViews = getPostViews;
var recordWatchEvent = function (postId, data) {
    (0, exports.markPostAsSeen)(postId);
    return exports.api.post("/posts/".concat(postId, "/watch"), data);
};
exports.recordWatchEvent = recordWatchEvent;
var getFeedPreferences = function () {
    return exports.api.get('/users/me/feed-preferences');
};
exports.getFeedPreferences = getFeedPreferences;
var getBhagavadGitaChapter = function (chapterNumber) {
    if (chapterNumber === void 0) { chapterNumber = 1; }
    return exports.api.get("/library/bhagavad-gita/chapter/".concat(chapterNumber));
};
exports.getBhagavadGitaChapter = getBhagavadGitaChapter;
var getRamcharitmanasKand = function (kandNumber) {
    if (kandNumber === void 0) { kandNumber = 1; }
    return exports.api.get("/library/ramcharitmanas/chapter/".concat(kandNumber));
};
exports.getRamcharitmanasKand = getRamcharitmanasKand;
var getAtharvavedChapter = function (chapterNumber) {
    if (chapterNumber === void 0) { chapterNumber = 1; }
    return exports.api.get("/library/atharvaved/chapter/".concat(chapterNumber));
};
exports.getAtharvavedChapter = getAtharvavedChapter;
var getRamayanChapter = function (chapterNumber) {
    if (chapterNumber === void 0) { chapterNumber = 1; }
    return exports.api.get("/library/ramayan/chapter/".concat(chapterNumber));
};
exports.getRamayanChapter = getRamayanChapter;
var getRigvedaChapter = function (chapterNumber) {
    if (chapterNumber === void 0) { chapterNumber = 1; }
    return exports.api.get("/library/rigveda/chapter/".concat(chapterNumber));
};
exports.getRigvedaChapter = getRigvedaChapter;
var getYajurvedaChapter = function (chapterNumber) {
    if (chapterNumber === void 0) { chapterNumber = 1; }
    return exports.api.get("/library/yajurveda/chapter/".concat(chapterNumber));
};
exports.getYajurvedaChapter = getYajurvedaChapter;
var getMahabharataBook = function (bookNumber) {
    if (bookNumber === void 0) { bookNumber = 1; }
    return exports.api.get("/library/mahabharata/book/".concat(bookNumber));
};
exports.getMahabharataBook = getMahabharataBook;
// Community APIs
var getCommunities = function () {
    return exports.api.get('/communities');
};
exports.getCommunities = getCommunities;
var getCommunity = function (id) {
    return exports.api.get("/communities/".concat(id));
};
exports.getCommunity = getCommunity;
var joinCommunityByCode = function (code) {
    return exports.api.post('/communities/join', { code: code });
};
exports.joinCommunityByCode = joinCommunityByCode;
var respondToCommunityRequest = function (requestId, status) {
    return exports.api.post("/communities/requests/".concat(requestId, "/respond"), { status: status });
};
exports.respondToCommunityRequest = respondToCommunityRequest;
var createCommunity = function (data) { return exports.api.post('/communities', data); };
exports.createCommunity = createCommunity;
var agreeToRules = function (communityId, subgroupType) {
    return exports.api.post("/communities/".concat(communityId, "/agree-rules"), { subgroup_type: subgroupType });
};
exports.agreeToRules = agreeToRules;
// Circle APIs
var createCircle = function (data) {
    return exports.api.post('/circles', data);
};
exports.createCircle = createCircle;
var getCircles = function () {
    return exports.api.get('/circles');
};
exports.getCircles = getCircles;
var getCircle = function (circleId) {
    return exports.api.get("/circles/".concat(circleId));
};
exports.getCircle = getCircle;
var updateCircle = function (circleId, data) {
    return exports.api.put("/circles/".concat(circleId), data);
};
exports.updateCircle = updateCircle;
var joinCircle = function (code) {
    return exports.api.post('/circles/join', { code: code });
};
exports.joinCircle = joinCircle;
var getCircleRequests = function (circleId) {
    return exports.api.get("/circles/".concat(circleId, "/requests"));
};
exports.getCircleRequests = getCircleRequests;
var approveCircleRequest = function (circleId, userId) {
    return exports.api.post("/circles/".concat(circleId, "/approve/").concat(userId));
};
exports.approveCircleRequest = approveCircleRequest;
var rejectCircleRequest = function (circleId, userId) {
    return exports.api.post("/circles/".concat(circleId, "/reject/").concat(userId));
};
exports.rejectCircleRequest = rejectCircleRequest;
var inviteToCircle = function (circleId, slId) {
    return exports.api.post("/circles/".concat(circleId, "/invite"), { sl_id: slId });
};
exports.inviteToCircle = inviteToCircle;
var transferCircleAdmin = function (circleId, memberId) {
    return exports.api.post("/circles/".concat(circleId, "/transfer-admin/").concat(memberId));
};
exports.transferCircleAdmin = transferCircleAdmin;
var leaveCircle = function (circleId) {
    return exports.api.post("/circles/".concat(circleId, "/leave"));
};
exports.leaveCircle = leaveCircle;
var deleteCircle = function (circleId) {
    return exports.api.delete("/circles/".concat(circleId));
};
exports.deleteCircle = deleteCircle;
var removeCircleMember = function (circleId, memberId) {
    return exports.api.post("/circles/".concat(circleId, "/remove-member/").concat(memberId));
};
exports.removeCircleMember = removeCircleMember;
// Message APIs
var sendCommunityMessage = function (communityId, subgroupType, content, messageType, category, mediaUrl) {
    if (messageType === void 0) { messageType = 'text'; }
    return exports.api.post("/messages/community/".concat(communityId, "/").concat(subgroupType), {
        content: content,
        message_type: messageType,
        category: category,
        media_url: mediaUrl,
    });
};
exports.sendCommunityMessage = sendCommunityMessage;
var getCommunityMessages = function (communityId, subgroupType, limit, before_timestamp) {
    if (limit === void 0) { limit = 25; }
    var url = "/messages/community/".concat(communityId, "/").concat(subgroupType, "?limit=").concat(limit);
    if (before_timestamp) {
        url += "&before_timestamp=".concat(encodeURIComponent(before_timestamp));
    }
    return exports.api.get(url);
};
exports.getCommunityMessages = getCommunityMessages;
var sendCircleMessage = function (circleId, content, messageType) {
    if (messageType === void 0) { messageType = 'text'; }
    return exports.api.post("/messages/circle/".concat(circleId), { content: content, message_type: messageType });
};
exports.sendCircleMessage = sendCircleMessage;
var getCircleMessages = function (circleId, limit) {
    if (limit === void 0) { limit = 50; }
    return exports.api.get("/messages/circle/".concat(circleId, "?limit=").concat(limit));
};
exports.getCircleMessages = getCircleMessages;
// Direct Message APIs
var sendDirectMessage = function (recipientSlId, content, messageType) {
    if (messageType === void 0) { messageType = 'text'; }
    return exports.api.post('/dm', { recipient_sl_id: recipientSlId, content: content, message_type: messageType });
};
exports.sendDirectMessage = sendDirectMessage;
var getConversations = function () {
    return exports.api.get('/dm/conversations', { timeout: 120000 });
};
exports.getConversations = getConversations;
var getDirectMessages = function (conversationId, limit) {
    if (limit === void 0) { limit = 50; }
    return exports.api.get("/dm/".concat(conversationId, "?limit=").concat(limit), { timeout: 120000 });
};
exports.getDirectMessages = getDirectMessages;
var markDirectMessagesRead = function (conversationId) {
    return exports.api.post("/dm/".concat(conversationId, "/read"));
};
exports.markDirectMessagesRead = markDirectMessagesRead;
var clearDirectMessages = function (conversationId) {
    return exports.api.delete("/dm/".concat(conversationId, "/messages"));
};
exports.clearDirectMessages = clearDirectMessages;
var approveDirectMessageRequest = function (conversationId) {
    return exports.api.post("/dm/".concat(conversationId, "/request/approve"));
};
exports.approveDirectMessageRequest = approveDirectMessageRequest;
var denyDirectMessageRequest = function (conversationId) {
    return exports.api.post("/dm/".concat(conversationId, "/request/deny"));
};
exports.denyDirectMessageRequest = denyDirectMessageRequest;
var muteConversation = function (conversationId) {
    return exports.api.post("/dm/".concat(conversationId, "/mute"));
};
exports.muteConversation = muteConversation;
var unmuteConversation = function (conversationId) {
    return exports.api.post("/dm/".concat(conversationId, "/unmute"));
};
exports.unmuteConversation = unmuteConversation;
// Discover APIs
var discoverCommunities = function () {
    return exports.api.get('/communities/discover');
};
exports.discoverCommunities = discoverCommunities;
// Wisdom & Panchang APIs
var getTodaysWisdom = function () {
    return exports.api.get('/wisdom/today');
};
exports.getTodaysWisdom = getTodaysWisdom;
// =================== ASTROLOGY CACHE HELPER ===================
var getWithCache = function (cacheKey_1, fetchFn_1) {
    var args_1 = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args_1[_i - 2] = arguments[_i];
    }
    return __awaiter(void 0, __spreadArray([cacheKey_1, fetchFn_1], args_1, true), void 0, function (cacheKey, fetchFn, expiryHours) {
        var cached, _a, data, timestamp, ageHours, response, err_1;
        if (expiryHours === void 0) { expiryHours = 24; }
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 4, , 5]);
                    return [4 /*yield*/, async_storage_1.default.getItem(cacheKey)];
                case 1:
                    cached = _b.sent();
                    if (cached) {
                        _a = JSON.parse(cached), data = _a.data, timestamp = _a.timestamp;
                        ageHours = (Date.now() - timestamp) / (1000 * 60 * 60);
                        if (ageHours < expiryHours) {
                            console.log("[Cache] Hit for ".concat(cacheKey));
                            return [2 /*return*/, { data: data }];
                        }
                    }
                    return [4 /*yield*/, fetchFn()];
                case 2:
                    response = _b.sent();
                    return [4 /*yield*/, async_storage_1.default.setItem(cacheKey, JSON.stringify({ data: response.data, timestamp: Date.now() }))];
                case 3:
                    _b.sent();
                    return [2 /*return*/, response];
                case 4:
                    err_1 = _b.sent();
                    console.error("[Cache] Error for ".concat(cacheKey, ":"), err_1);
                    return [2 /*return*/, fetchFn()];
                case 5: return [2 /*return*/];
            }
        });
    });
};
var getPanchang = function (params) {
    var _a, _b;
    var date = (params === null || params === void 0 ? void 0 : params.date_str) || new Date().toISOString().split('T')[0];
    var cacheKey = "panchang_".concat(date, "_").concat((_a = params === null || params === void 0 ? void 0 : params.lat) === null || _a === void 0 ? void 0 : _a.toFixed(2), "_").concat((_b = params === null || params === void 0 ? void 0 : params.lng) === null || _b === void 0 ? void 0 : _b.toFixed(2));
    if (params === null || params === void 0 ? void 0 : params.force_refresh)
        return exports.api.get('/panchang/today', { params: params });
    return getWithCache(cacheKey, function () { return exports.api.get('/panchang/today', { params: params }); });
};
exports.getPanchang = getPanchang;
var getDailyHoroscope = function (zodiacName, timezone) {
    if (timezone === void 0) { timezone = 5.5; }
    var date = new Date().toISOString().split('T')[0];
    var cacheKey = "horoscope_".concat(zodiacName, "_").concat(date);
    return getWithCache(cacheKey, function () { return exports.api.get("/horoscope/daily/".concat(zodiacName), { params: { timezone: timezone } }); });
};
exports.getDailyHoroscope = getDailyHoroscope;
var getNakshatraReport = function (params) {
    var date = (params === null || params === void 0 ? void 0 : params.date_str) || new Date().toISOString().split('T')[0];
    var latStr = (params === null || params === void 0 ? void 0 : params.lat) !== undefined ? params.lat.toFixed(2) : 'default';
    var lngStr = (params === null || params === void 0 ? void 0 : params.lng) !== undefined ? params.lng.toFixed(2) : 'default';
    var cacheKey = "v2_nakshatra_".concat(date, "_").concat(latStr, "_").concat(lngStr);
    return getWithCache(cacheKey, function () { return exports.api.get('/astrology/nakshatra', { params: params }); });
};
exports.getNakshatraReport = getNakshatraReport;
var askAstrologyAI = function (data) { return exports.api.post('/astrology/ask', data); };
exports.askAstrologyAI = askAstrologyAI;
var getUserHoroscope = function () {
    return exports.api.get('/spiritual/horoscope');
};
exports.getUserHoroscope = getUserHoroscope;
// Temple APIs
var getTemples = function () {
    return exports.api.get('/temples');
};
exports.getTemples = getTemples;
var getNearbyTemples = function (lat, lng) {
    return exports.api.get("/temples/nearby".concat(lat && lng ? "?lat=".concat(lat, "&lng=").concat(lng) : ''));
};
exports.getNearbyTemples = getNearbyTemples;
var getTemple = function (templeId) {
    return exports.api.get("/temples/".concat(templeId));
};
exports.getTemple = getTemple;
var followTemple = function (templeId) {
    return exports.api.post("/temples/".concat(templeId, "/follow"));
};
exports.followTemple = followTemple;
var unfollowTemple = function (templeId) {
    return exports.api.post("/temples/".concat(templeId, "/unfollow"));
};
exports.unfollowTemple = unfollowTemple;
var followUser = function (userId) {
    return exports.api.post("/users/".concat(userId, "/follow"));
};
exports.followUser = followUser;
var unfollowUser = function (userId) {
    return exports.api.post("/users/".concat(userId, "/unfollow"));
};
exports.unfollowUser = unfollowUser;
var getTemplePosts = function (templeId) {
    return exports.api.get("/temples/".concat(templeId, "/posts"));
};
exports.getTemplePosts = getTemplePosts;
var reactToTemplePost = function (templeId, postId, reaction) {
    return exports.api.post("/temples/".concat(templeId, "/posts/").concat(postId, "/react"), { reaction: reaction });
};
exports.reactToTemplePost = reactToTemplePost;
// Event APIs
var getEvents = function () {
    return exports.api.get('/events');
};
exports.getEvents = getEvents;
var getNearbyEvents = function () {
    return exports.api.get('/events/nearby');
};
exports.getNearbyEvents = getNearbyEvents;
var attendEvent = function (eventId) {
    return exports.api.post("/events/".concat(eventId, "/attend"));
};
exports.attendEvent = attendEvent;
// Verification APIs
var getVerificationStatus = function () {
    return exports.api.get('/user/verification-status');
};
exports.getVerificationStatus = getVerificationStatus;
var requestVerification = function (data) {
    return exports.api.post('/user/request-verification', data);
};
exports.requestVerification = requestVerification;
// Profile APIs
var updateExtendedProfile = function (data) {
    return exports.api.put('/user/profile/extended', data);
};
exports.updateExtendedProfile = updateExtendedProfile;
var deleteUserProfile = function () {
    return exports.api.delete('/user/profile');
};
exports.deleteUserProfile = deleteUserProfile;
var getProfileCompletion = function () {
    return exports.api.get('/user/profile-completion');
};
exports.getProfileCompletion = getProfileCompletion;
var getHoroscope = function () {
    return exports.api.get('/user/horoscope');
};
exports.getHoroscope = getHoroscope;
// Community Stats
var getCommunityStats = function (communityId) {
    return exports.api.get("/communities/".concat(communityId, "/stats"));
};
exports.getCommunityStats = getCommunityStats;
// KYC APIs
var getKYCStatus = function () {
    return exports.api.get('/kyc/status');
};
exports.getKYCStatus = getKYCStatus;
var submitKYC = function (data) {
    return exports.api.post('/kyc/submit', data);
};
exports.submitKYC = submitKYC;
var generateUserAadhaarOtp = function (data) { return exports.api.post('/kyc/aadhaar/otp', data); };
exports.generateUserAadhaarOtp = generateUserAadhaarOtp;
var verifyUserAadhaarOtp = function (data) { return exports.api.post('/kyc/aadhaar/otp/verify', data); };
exports.verifyUserAadhaarOtp = verifyUserAadhaarOtp;
// Report APIs
var reportContent = function (data) {
    return exports.api.post('/report', data);
};
exports.reportContent = reportContent;
// Temple Channel APIs
var createTemple = function (data) {
    return exports.api.post('/temples', data);
};
exports.createTemple = createTemple;
var createTemplePost = function (templeId, data) {
    return exports.api.post("/temples/".concat(templeId, "/posts"), data);
};
exports.createTemplePost = createTemplePost;
// Mark messages as read
var markMessagesRead = function (chatId) {
    return exports.api.post("/dm/".concat(chatId, "/read"));
};
exports.markMessagesRead = markMessagesRead;
// =================== HELP REQUEST APIS ===================
var createHelpRequest = function (data) { return exports.api.post('/help-requests', data); };
exports.createHelpRequest = createHelpRequest;
var getHelpRequests = function (params) { return exports.api.get('/help-requests', { params: params }); };
exports.getHelpRequests = getHelpRequests;
var getMyHelpRequests = function () {
    return exports.api.get('/help-requests/my');
};
exports.getMyHelpRequests = getMyHelpRequests;
var getActiveHelpRequest = function () {
    return exports.api.get('/help-requests/active');
};
exports.getActiveHelpRequest = getActiveHelpRequest;
var fulfillHelpRequest = function (requestId) {
    return exports.api.post("/help-requests/".concat(requestId, "/fulfill"));
};
exports.fulfillHelpRequest = fulfillHelpRequest;
var verifyHelpRequest = function (requestId) {
    return exports.api.post("/help-requests/".concat(requestId, "/verify"));
};
exports.verifyHelpRequest = verifyHelpRequest;
var deleteHelpRequest = function (requestId) {
    return exports.api.delete("/help-requests/".concat(requestId));
};
exports.deleteHelpRequest = deleteHelpRequest;
// =================== COMMUNITY REQUESTS APIS ===================
var createCommunityRequest = function (data) {
    var desc = (data.description || '').trim();
    var paddedDescription = desc.length >= 10 ? desc : "".concat(desc, " (Emergency request for community support)");
    return exports.api.post('/community-requests', __assign(__assign({}, data), { description: paddedDescription }));
};
exports.createCommunityRequest = createCommunityRequest;
var getCommunityRequests = function (params) { return exports.api.get('/community-requests', { params: params }); };
exports.getCommunityRequests = getCommunityRequests;
var getMyCommunityRequests = function () {
    return exports.api.get('/community-requests/my');
};
exports.getMyCommunityRequests = getMyCommunityRequests;
var getMyActiveCommunityRequests = function () {
    return exports.api.get('/community-requests/my', { params: { status: 'active' } });
};
exports.getMyActiveCommunityRequests = getMyActiveCommunityRequests;
var resolveCommunityRequest = function (requestId) {
    return exports.api.post("/community-requests/".concat(requestId, "/resolve"));
};
exports.resolveCommunityRequest = resolveCommunityRequest;
var deleteCommunityRequest = function (requestId) {
    return exports.api.delete("/community-requests/".concat(requestId));
};
exports.deleteCommunityRequest = deleteCommunityRequest;
// =================== VENDOR APIS ===================
var createVendor = function (data) { return exports.api.post('/vendors', data); };
exports.createVendor = createVendor;
var getVendors = function (params) { return exports.api.get('/vendors', { params: params }); };
exports.getVendors = getVendors;
var getMyVendor = function () {
    return exports.api.get('/vendors/my');
};
exports.getMyVendor = getMyVendor;
var getVendorCategories = function () {
    return exports.api.get('/vendors/categories');
};
exports.getVendorCategories = getVendorCategories;
var getVendor = function (vendorId) {
    return exports.api.get("/vendors/".concat(vendorId));
};
exports.getVendor = getVendor;
var updateVendor = function (vendorId, data) { return exports.api.put("/vendors/".concat(vendorId), data); };
exports.updateVendor = updateVendor;
var parseApiError = function (error) {
    var _a;
    var data = (_a = error === null || error === void 0 ? void 0 : error.response) === null || _a === void 0 ? void 0 : _a.data;
    if (!data) {
        return (error === null || error === void 0 ? void 0 : error.message) || 'Something went wrong';
    }
    if (typeof (data === null || data === void 0 ? void 0 : data.detail) === 'string') {
        return data.detail;
    }
    if (Array.isArray(data === null || data === void 0 ? void 0 : data.detail)) {
        return data.detail.map(function (item) { return (item === null || item === void 0 ? void 0 : item.msg) || (item === null || item === void 0 ? void 0 : item.message) || String(item); }).join(', ');
    }
    if (typeof (data === null || data === void 0 ? void 0 : data.message) === 'string') {
        return data.message;
    }
    return (error === null || error === void 0 ? void 0 : error.message) || 'Something went wrong';
};
exports.parseApiError = parseApiError;
var updateVendorBusinessProfile = function (vendorId, data) { return exports.api.put("/vendors/".concat(vendorId, "/business/profile"), data); };
exports.updateVendorBusinessProfile = updateVendorBusinessProfile;
var appendMultipartFile = function (formData, fieldName, file) { return __awaiter(void 0, void 0, void 0, function () {
    var response, blob, webFile, preparedFile, error_5, response, blob;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!(react_native_1.Platform.OS === 'web')) return [3 /*break*/, 3];
                return [4 /*yield*/, fetch(file.uri)];
            case 1:
                response = _a.sent();
                return [4 /*yield*/, response.blob()];
            case 2:
                blob = _a.sent();
                webFile = new File([blob], file.name || 'upload.jpg', { type: file.type || blob.type || 'image/jpeg' });
                formData.append(fieldName, webFile);
                return [2 /*return*/];
            case 3: return [4 /*yield*/, normalizeNativeUploadFile(file)];
            case 4:
                preparedFile = _a.sent();
                _a.label = 5;
            case 5:
                _a.trys.push([5, 6, , 9]);
                formData.append(fieldName, {
                    uri: preparedFile.uri,
                    name: preparedFile.name,
                    type: preparedFile.type,
                });
                return [3 /*break*/, 9];
            case 6:
                error_5 = _a.sent();
                console.warn('[API] Multipart append failed, falling back to blob upload:', error_5);
                return [4 /*yield*/, fetch(preparedFile.uri)];
            case 7:
                response = _a.sent();
                return [4 /*yield*/, response.blob()];
            case 8:
                blob = _a.sent();
                formData.append(fieldName, blob, preparedFile.name || 'upload.jpg');
                return [3 /*break*/, 9];
            case 9: return [2 /*return*/];
        }
    });
}); };
var blobToDataUrl = function (blob) {
    return new Promise(function (resolve, reject) {
        var reader = new FileReader();
        reader.onloadend = function () { return resolve(String(reader.result || '')); };
        reader.onerror = function () { return reject(new Error('Failed to convert image blob to base64')); };
        reader.readAsDataURL(blob);
    });
};
var getImageBase64FromUri = function (file) { return __awaiter(void 0, void 0, void 0, function () {
    var response, blob, dataUrl;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, fetch(file.uri)];
            case 1:
                response = _a.sent();
                return [4 /*yield*/, response.blob()];
            case 2:
                blob = _a.sent();
                return [4 /*yield*/, blobToDataUrl(blob)];
            case 3:
                dataUrl = _a.sent();
                if (dataUrl && dataUrl.startsWith('data:')) {
                    return [2 /*return*/, dataUrl];
                }
                return [2 /*return*/, "data:".concat(file.type || blob.type || 'image/jpeg', ";base64,").concat(dataUrl)];
        }
    });
}); };
var uploadVendorBusinessImage = function (vendorId, slot, file) {
    return (function () { return __awaiter(void 0, void 0, void 0, function () {
        var formData, token, url, headers, response, text, data, error_6;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    formData = new FormData();
                    formData.append('slot', String(slot));
                    return [4 /*yield*/, appendMultipartFile(formData, 'file', file)];
                case 1:
                    _a.sent();
                    if (!(react_native_1.Platform.OS !== 'web')) return [3 /*break*/, 9];
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 8, , 9]);
                    return [4 /*yield*/, secureStorage_1.secureStorage.getItem('auth_token')];
                case 3:
                    token = _a.sent();
                    url = "".concat(exports.API_URL, "/api/vendors/").concat(vendorId, "/business/images/upload");
                    headers = {};
                    if (token) {
                        headers.Authorization = "Bearer ".concat(token);
                    }
                    return [4 /*yield*/, fetch(url, {
                            method: 'POST',
                            headers: headers,
                            body: formData,
                        })];
                case 4:
                    response = _a.sent();
                    if (!!response.ok) return [3 /*break*/, 6];
                    return [4 /*yield*/, response.text()];
                case 5:
                    text = _a.sent();
                    throw new Error("Upload failed: ".concat(response.status, " ").concat(text));
                case 6: return [4 /*yield*/, response.json()];
                case 7:
                    data = _a.sent();
                    return [2 /*return*/, { data: data }];
                case 8:
                    error_6 = _a.sent();
                    console.warn('[API] Native vendor upload failed, retrying via axios:', error_6);
                    return [2 /*return*/, exports.api.post("/vendors/".concat(vendorId, "/business/images/upload"), formData)];
                case 9: return [2 /*return*/, exports.api.post("/vendors/".concat(vendorId, "/business/images/upload"), formData)];
            }
        });
    }); })();
};
exports.uploadVendorBusinessImage = uploadVendorBusinessImage;
var uploadVendorKycFile = function (vendorId, docType, file) {
    return (function () { return __awaiter(void 0, void 0, void 0, function () {
        var formData;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    formData = new FormData();
                    formData.append('doc_type', docType);
                    return [4 /*yield*/, appendMultipartFile(formData, 'file', file)];
                case 1:
                    _a.sent();
                    return [2 /*return*/, exports.api.post("/vendors/".concat(vendorId, "/kyc/upload"), formData, {
                            headers: react_native_1.Platform.OS === 'web' ? { 'Content-Type': 'multipart/form-data' } : undefined,
                        })];
            }
        });
    }); })();
};
exports.uploadVendorKycFile = uploadVendorKycFile;
var extractKycTextFromImage = function (vendorId, file) { return __awaiter(void 0, void 0, void 0, function () {
    var token, formData, fileAttached, error_7, imageBase64, error_8, response, headers, fetchError_1, data;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, secureStorage_1.secureStorage.getItem('auth_token')];
            case 1:
                token = _a.sent();
                formData = new FormData();
                fileAttached = false;
                _a.label = 2;
            case 2:
                _a.trys.push([2, 4, , 5]);
                return [4 /*yield*/, appendMultipartFile(formData, 'file', file)];
            case 3:
                _a.sent();
                fileAttached = true;
                console.log('[OCR API] File attached successfully, has file:', formData.has('file'));
                return [3 /*break*/, 5];
            case 4:
                error_7 = _a.sent();
                console.warn('extractKycTextFromImage: multipart file attach failed, will try base64 fallback', error_7);
                return [3 /*break*/, 5];
            case 5:
                if (!(react_native_1.Platform.OS === 'web')) return [3 /*break*/, 9];
                _a.label = 6;
            case 6:
                _a.trys.push([6, 8, , 9]);
                console.log('[OCR API] Converting to base64 for web...');
                return [4 /*yield*/, getImageBase64FromUri(file)];
            case 7:
                imageBase64 = _a.sent();
                if (imageBase64) {
                    formData.append('image_base64', imageBase64);
                    console.log('[OCR API] Base64 attached, length:', imageBase64.length, 'has image_base64:', formData.has('image_base64'));
                }
                return [3 /*break*/, 9];
            case 8:
                error_8 = _a.sent();
                console.warn('extractKycTextFromImage: base64 fallback generation failed', error_8);
                return [3 /*break*/, 9];
            case 9:
                if (!fileAttached && !formData.get('image_base64')) {
                    throw new Error('Failed to prepare image payload for OCR upload');
                }
                console.log('[OCR API] Sending request to backend...');
                console.log('[OCR API] Fetch URL:', "".concat(exports.API_URL, "/api/vendors/").concat(vendorId, "/kyc/vision-extract"));
                _a.label = 10;
            case 10:
                _a.trys.push([10, 12, , 13]);
                headers = {
                    'Bypass-Tunnel-Reminder': 'true', // Required for localtunnel
                };
                if (token) {
                    headers['Authorization'] = "Bearer ".concat(token);
                }
                return [4 /*yield*/, fetch("".concat(exports.API_URL, "/api/vendors/").concat(vendorId, "/kyc/vision-extract"), {
                        method: 'POST',
                        headers: headers,
                        body: formData,
                    })];
            case 11:
                response = _a.sent();
                return [3 /*break*/, 13];
            case 12:
                fetchError_1 = _a.sent();
                console.error('[OCR API] Fetch error:', fetchError_1);
                throw new Error("Network error: ".concat(fetchError_1.message));
            case 13:
                console.log('[OCR API] Response status:', response.status, response.statusText);
                if (!response.ok) {
                    console.error('[OCR API] Error response:', response.status);
                    throw new Error("OCR failed: ".concat(response.status));
                }
                return [4 /*yield*/, response.json()];
            case 14:
                data = _a.sent();
                console.log('[OCR API] Response data received successfully.');
                return [2 /*return*/, { data: data }];
        }
    });
}); };
exports.extractKycTextFromImage = extractKycTextFromImage;
var extractUserKycTextFromImage = function (file) { return __awaiter(void 0, void 0, void 0, function () {
    var token, formData, fileAttached, error_9, imageBase64, error_10, response, headers, fetchError_2, data;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, secureStorage_1.secureStorage.getItem('auth_token')];
            case 1:
                token = _a.sent();
                formData = new FormData();
                fileAttached = false;
                _a.label = 2;
            case 2:
                _a.trys.push([2, 4, , 5]);
                return [4 /*yield*/, appendMultipartFile(formData, 'file', file)];
            case 3:
                _a.sent();
                fileAttached = true;
                console.log('[User OCR API] File attached successfully, has file:', formData.has('file'));
                return [3 /*break*/, 5];
            case 4:
                error_9 = _a.sent();
                console.warn('extractUserKycTextFromImage: multipart file attach failed, will try base64 fallback', error_9);
                return [3 /*break*/, 5];
            case 5:
                if (!(react_native_1.Platform.OS === 'web')) return [3 /*break*/, 9];
                _a.label = 6;
            case 6:
                _a.trys.push([6, 8, , 9]);
                console.log('[User OCR API] Converting to base64 for web...');
                return [4 /*yield*/, getImageBase64FromUri(file)];
            case 7:
                imageBase64 = _a.sent();
                if (imageBase64) {
                    formData.append('image_base64', imageBase64);
                    console.log('[User OCR API] Base64 attached, length:', imageBase64.length, 'has image_base64:', formData.has('image_base64'));
                }
                return [3 /*break*/, 9];
            case 8:
                error_10 = _a.sent();
                console.warn('extractUserKycTextFromImage: base64 fallback generation failed', error_10);
                return [3 /*break*/, 9];
            case 9:
                if (!fileAttached && !formData.get('image_base64')) {
                    throw new Error('Failed to prepare image payload for OCR upload');
                }
                console.log('[User OCR API] Sending request to backend...');
                console.log('[User OCR API] Fetch URL:', "".concat(exports.API_URL, "/api/kyc/vision-extract"));
                _a.label = 10;
            case 10:
                _a.trys.push([10, 12, , 13]);
                headers = {
                    'Bypass-Tunnel-Reminder': 'true',
                };
                if (token) {
                    headers['Authorization'] = "Bearer ".concat(token);
                }
                return [4 /*yield*/, fetch("".concat(exports.API_URL, "/api/kyc/vision-extract"), {
                        method: 'POST',
                        headers: headers,
                        body: formData,
                    })];
            case 11:
                response = _a.sent();
                return [3 /*break*/, 13];
            case 12:
                fetchError_2 = _a.sent();
                console.error('[User OCR API] Fetch error:', fetchError_2);
                throw new Error("Network error: ".concat(fetchError_2.message));
            case 13:
                console.log('[User OCR API] Response status:', response.status, response.statusText);
                if (!response.ok) {
                    console.error('[User OCR API] Error response:', response.status);
                    throw new Error("OCR failed: ".concat(response.status));
                }
                return [4 /*yield*/, response.json()];
            case 14:
                data = _a.sent();
                console.log('[User OCR API] Response data received successfully.');
                return [2 /*return*/, { data: data }];
        }
    });
}); };
exports.extractUserKycTextFromImage = extractUserKycTextFromImage;
var generateVendorAadhaarOtp = function (vendorId, data) { return exports.api.post("/vendors/".concat(vendorId, "/kyc/aadhaar/otp"), data); };
exports.generateVendorAadhaarOtp = generateVendorAadhaarOtp;
var verifyVendorAadhaarOtp = function (vendorId, data) { return exports.api.post("/vendors/".concat(vendorId, "/kyc/aadhaar/otp/verify"), data); };
exports.verifyVendorAadhaarOtp = verifyVendorAadhaarOtp;
var addVendorPhoto = function (vendorId, photo) {
    return exports.api.post("/vendors/".concat(vendorId, "/photos"), photo, {
        headers: { 'Content-Type': 'application/json' }
    });
};
exports.addVendorPhoto = addVendorPhoto;
var deleteVendor = function (vendorId) {
    return exports.api.delete("/vendors/".concat(vendorId));
};
exports.deleteVendor = deleteVendor;
var createOrUpdateJobProfile = function (data) {
    return exports.api.post('/jobs/profile', data);
};
exports.createOrUpdateJobProfile = createOrUpdateJobProfile;
var getMyJobProfile = function () {
    return exports.api.get('/jobs/profile/my');
};
exports.getMyJobProfile = getMyJobProfile;
var getJobProfile = function (profileId) {
    return exports.api.get("/jobs/profile/".concat(profileId));
};
exports.getJobProfile = getJobProfile;
var getJobProfiles = function (params) {
    return exports.api.get('/jobs/profiles', { params: params });
};
exports.getJobProfiles = getJobProfiles;
var uploadJobProfileFile = function (profileId, docType, file) {
    return (function () { return __awaiter(void 0, void 0, void 0, function () {
        var formData;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    formData = new FormData();
                    formData.append('doc_type', docType);
                    return [4 /*yield*/, appendMultipartFile(formData, 'file', file)];
                case 1:
                    _a.sent();
                    return [2 /*return*/, exports.api.post("/jobs/profile/".concat(profileId, "/upload"), formData, {
                            headers: react_native_1.Platform.OS === 'web' ? { 'Content-Type': 'multipart/form-data' } : undefined,
                        })];
            }
        });
    }); })();
};
exports.uploadJobProfileFile = uploadJobProfileFile;
// =================== CULTURAL COMMUNITY APIS ===================
var getCulturalCommunities = function (search) {
    return exports.api.get('/cultural-communities', { params: { search: search } });
};
exports.getCulturalCommunities = getCulturalCommunities;
var getUserCulturalCommunity = function () {
    return exports.api.get('/user/cultural-community');
};
exports.getUserCulturalCommunity = getUserCulturalCommunity;
var updateUserCulturalCommunity = function (cultural_community) {
    return exports.api.put('/user/cultural-community', { cultural_community: cultural_community });
};
exports.updateUserCulturalCommunity = updateUserCulturalCommunity;
// =================== UTILITY APIS ===================
var getWisdom = function () {
    return exports.api.get('/wisdom/today');
};
exports.getWisdom = getWisdom;
var getGitaShloka = function (chapter, verse) { return __awaiter(void 0, void 0, void 0, function () {
    var response, error_11;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                return [4 /*yield*/, fetch("https://vedicscriptures.github.io/slok/".concat(chapter, "/").concat(verse))];
            case 1:
                response = _a.sent();
                if (!response.ok)
                    throw new Error('Failed to fetch');
                return [4 /*yield*/, response.json()];
            case 2: return [2 /*return*/, _a.sent()];
            case 3:
                error_11 = _a.sent();
                console.error('Error fetching Gita shloka:', error_11);
                throw error_11;
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.getGitaShloka = getGitaShloka;
var getNextFestival = function () {
    return exports.api.get('/spiritual/festival/next');
};
exports.getNextFestival = getNextFestival;
var getFestivalList = function () {
    return exports.api.get('/spiritual/festivals/all');
};
exports.getFestivalList = getFestivalList;
var getRealtimeIceServers = function () { return __awaiter(void 0, void 0, void 0, function () {
    var response;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, exports.api.get('/realtime/ice-servers')];
            case 1:
                response = _a.sent();
                return [2 /*return*/, response.data];
        }
    });
}); };
exports.getRealtimeIceServers = getRealtimeIceServers;
var getRealtimeSfuToken = function (room) { return __awaiter(void 0, void 0, void 0, function () {
    var response;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, exports.api.get('/realtime/sfu-token', { params: { room: room } })];
            case 1:
                response = _a.sent();
                return [2 /*return*/, response.data];
        }
    });
}); };
exports.getRealtimeSfuToken = getRealtimeSfuToken;
var getAgoraToken = function () {
    var args_1 = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args_1[_i] = arguments[_i];
    }
    return __awaiter(void 0, __spreadArray([], args_1, true), void 0, function (channel) {
        var response;
        if (channel === void 0) { channel = 'mantra-jaap-live-room'; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, exports.api.get('/realtime/agora-token', { params: { channel: channel } })];
                case 1:
                    response = _a.sent();
                    return [2 /*return*/, response.data];
            }
        });
    });
};
exports.getAgoraToken = getAgoraToken;
// =================== SOS EMERGENCY APIS ===================
var createSOSAlert = function (data) { return exports.api.post('/sos', data); };
exports.createSOSAlert = createSOSAlert;
var getActiveSOSAlerts = function (params) { return exports.api.get('/sos/nearby', { params: params }); };
exports.getActiveSOSAlerts = getActiveSOSAlerts;
var getMySOSAlert = function () {
    return exports.api.get('/sos/my');
};
exports.getMySOSAlert = getMySOSAlert;
var resolveSOSAlert = function (sosId, status) {
    return exports.api.post("/sos/".concat(sosId, "/resolve"), { status: status });
};
exports.resolveSOSAlert = resolveSOSAlert;
var resolveMyActiveSOS = function (status) {
    return exports.api.post('/sos/my/resolve', { status: status });
};
exports.resolveMyActiveSOS = resolveMyActiveSOS;
var respondToSOS = function (sosId, response) {
    return exports.api.post("/sos/".concat(sosId, "/respond"), { response: response });
};
exports.respondToSOS = respondToSOS;
// =================== SPEECH TRANSCRIPTION API ===================
var transcribeAudio = function (audioBase64_1) {
    var args_1 = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args_1[_i - 1] = arguments[_i];
    }
    return __awaiter(void 0, __spreadArray([audioBase64_1], args_1, true), void 0, function (audioBase64, languageCode) {
        var response;
        if (languageCode === void 0) { languageCode = 'en-IN'; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, exports.api.post('/speech/transcribe', {
                        audio_base64: audioBase64,
                        language_code: languageCode,
                    })];
                case 1:
                    response = _a.sent();
                    return [2 /*return*/, response.data];
            }
        });
    });
};
exports.transcribeAudio = transcribeAudio;
var toggleCommunityMessageLike = function (communityId, subgroupType, messageId) {
    return exports.api.post("/messages/community/".concat(communityId, "/").concat(subgroupType, "/").concat(messageId, "/like"));
};
exports.toggleCommunityMessageLike = toggleCommunityMessageLike;
var addCommunityMessageComment = function (communityId, subgroupType, messageId, text) {
    return exports.api.post("/messages/community/".concat(communityId, "/").concat(subgroupType, "/").concat(messageId, "/comments"), { text: text });
};
exports.addCommunityMessageComment = addCommunityMessageComment;
var getCommunityMessageComments = function (communityId, subgroupType, messageId) {
    return exports.api.get("/messages/community/".concat(communityId, "/").concat(subgroupType, "/").concat(messageId, "/comments"));
};
exports.getCommunityMessageComments = getCommunityMessageComments;
var deleteComment = function (commentId) {
    return exports.api.delete("/comments/".concat(commentId));
};
exports.deleteComment = deleteComment;
exports.default = exports.api;
