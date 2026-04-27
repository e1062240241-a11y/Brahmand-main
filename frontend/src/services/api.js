"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCircle = exports.agreeToRules = exports.joinCommunityByCode = exports.getCommunity = exports.getCommunities = exports.getPostViews = exports.getPostById = exports.viewPost = exports.searchByHashtag = exports.removePostHashtags = exports.addPostHashtags = exports.updatePost = exports.reportPost = exports.deletePost = exports.repostPost = exports.getPostComments = exports.addPostComment = exports.togglePostLike = exports.getPostsFeed = exports.uploadCompressedVideo = exports.uploadChatMedia = exports.uploadUserPost = exports.getUnreadNotificationCount = exports.getUserNotifications = exports.getAllUsers = exports.searchUserBySLId = exports.searchHospitals = exports.forwardGeocode = exports.reverseGeocode = exports.updateCurrentLocation = exports.setupDualLocation = exports.setupLocation = exports.updateProfile = exports.getUserPosts = exports.getUserProfile = exports.getProfile = exports.registerUser = exports.register = exports.verifyFirebaseToken = exports.adminReviewReport = exports.getAdminReports = exports.adminVerifyUserKyc = exports.getAdminPendingKyc = exports.adminRejectVendor = exports.adminApproveVendor = exports.getAdminVendorReviewQueue = exports.adminPanelLogin = exports.verifyOTP = exports.sendOTP = exports.API_URL = void 0;
exports.getKYCStatus = exports.getCommunityStats = exports.getHoroscope = exports.getProfileCompletion = exports.updateExtendedProfile = exports.requestVerification = exports.getVerificationStatus = exports.attendEvent = exports.getNearbyEvents = exports.getEvents = exports.reactToTemplePost = exports.getTemplePosts = exports.unfollowUser = exports.followUser = exports.unfollowTemple = exports.followTemple = exports.getTemple = exports.getNearbyTemples = exports.getTemples = exports.askProkeralaAstrology = exports.getProkeralaAstrologySummary = exports.getProkeralaAstrology = exports.getProkeralaPanchangSummary = exports.getProkeralaPanchang = exports.getTodaysPanchang = exports.getTodaysWisdom = exports.discoverCommunities = exports.denyDirectMessageRequest = exports.approveDirectMessageRequest = exports.clearDirectMessages = exports.markDirectMessagesRead = exports.getDirectMessages = exports.getConversations = exports.sendDirectMessage = exports.getCircleMessages = exports.sendCircleMessage = exports.getCommunityMessages = exports.sendCommunityMessage = exports.removeCircleMember = exports.deleteCircle = exports.leaveCircle = exports.transferCircleAdmin = exports.inviteToCircle = exports.rejectCircleRequest = exports.approveCircleRequest = exports.getCircleRequests = exports.joinCircle = exports.updateCircle = exports.getCircle = exports.getCircles = void 0;
exports.getMySOSAlert = exports.getActiveSOSAlerts = exports.createSOSAlert = exports.getPanchang = exports.getGitaShloka = exports.getWisdom = exports.updateUserCulturalCommunity = exports.getUserCulturalCommunity = exports.getCulturalCommunities = exports.uploadJobProfileFile = exports.getJobProfiles = exports.getJobProfile = exports.getMyJobProfile = exports.createOrUpdateJobProfile = exports.deleteVendor = exports.addVendorPhoto = exports.verifyVendorAadhaarOtp = exports.generateVendorAadhaarOtp = exports.extractUserKycTextFromImage = exports.extractKycTextFromImage = exports.uploadVendorKycFile = exports.uploadVendorBusinessImage = exports.updateVendorBusinessProfile = exports.parseApiError = exports.updateVendor = exports.getVendor = exports.getVendorCategories = exports.getMyVendor = exports.getVendors = exports.createVendor = exports.deleteCommunityRequest = exports.resolveCommunityRequest = exports.getMyActiveCommunityRequests = exports.getMyCommunityRequests = exports.getCommunityRequests = exports.createCommunityRequest = exports.deleteHelpRequest = exports.verifyHelpRequest = exports.fulfillHelpRequest = exports.getActiveHelpRequest = exports.getMyHelpRequests = exports.getHelpRequests = exports.createHelpRequest = exports.markMessagesRead = exports.createTemplePost = exports.createTemple = exports.reportContent = exports.verifyUserAadhaarOtp = exports.generateUserAadhaarOtp = exports.submitKYC = void 0;
exports.transcribeAudio = exports.respondToSOS = exports.resolveSOSAlert = void 0;
var axios_1 = require("axios");
var async_storage_1 = require("@react-native-async-storage/async-storage");
var react_native_1 = require("react-native");
var FileSystem = require("expo-file-system");
var storage_1 = require("firebase/storage");
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
    if (normalized === 'image/png' || normalized === 'image/jpeg' || normalized === 'image/jpg' || normalized === 'image/webp') {
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
exports.API_URL = react_native_1.Platform.OS === 'web'
    ? (resolvedWebApiUrl || 'http://localhost:8000')
    : (configuredApiUrl || 'http://localhost:8000');
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
var api = axios_1.default.create({
    baseURL: "".concat(exports.API_URL, "/api"),
    timeout: 30000,
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
api.interceptors.request.use(function (config) { return __awaiter(void 0, void 0, void 0, function () {
    var token;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, async_storage_1.default.getItem('auth_token')];
            case 1:
                token = _a.sent();
                if (token) {
                    config.headers.Authorization = "Bearer ".concat(token);
                }
                return [2 /*return*/, config];
        }
    });
}); });
// Robust retry on 503 errors and network disconnections
api.interceptors.response.use(function (response) { return response; }, function (error) { return __awaiter(void 0, void 0, void 0, function () {
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
            case 2: return [2 /*return*/, api(config)];
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
    return api.post('/auth/send-otp', { phone: phone });
};
exports.sendOTP = sendOTP;
var verifyOTP = function (phone, otp) {
    return api.post('/auth/verify-otp', { phone: phone, otp: otp });
};
exports.verifyOTP = verifyOTP;
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
var verifyFirebaseToken = function (id_token) {
    return api.post('/auth/verify-firebase-token', { id_token: id_token });
};
exports.verifyFirebaseToken = verifyFirebaseToken;
var register = function (data) {
    return api.post('/auth/register', data);
};
exports.register = register;
var registerUser = function (data) {
    return api.post('/auth/register', data);
};
exports.registerUser = registerUser;
// User APIs
var getProfile = function () {
    return api.get('/user/profile');
};
exports.getProfile = getProfile;
var getUserProfile = function (userId) {
    return api.get(userId ? "/users/".concat(userId) : '/user/profile');
};
exports.getUserProfile = getUserProfile;
var getUserPosts = function (userId, limit, offset) {
    if (limit === void 0) { limit = 20; }
    if (offset === void 0) { offset = 0; }
    return api.get("/users/".concat(userId, "/posts"), { params: { limit: limit, offset: offset } });
};
exports.getUserPosts = getUserPosts;
var updateProfile = function (data) {
    return api.put('/user/profile', data);
};
exports.updateProfile = updateProfile;
var setupLocation = function (location) {
    return api.post('/user/location', location);
};
exports.setupLocation = setupLocation;
var setupDualLocation = function (locations) {
    return api.post('/user/dual-location', locations);
};
exports.setupDualLocation = setupDualLocation;
var updateCurrentLocation = function (location) { return __awaiter(void 0, void 0, void 0, function () {
    var error_2, token, headers, rootError_1;
    var _a, _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 2, , 7]);
                return [4 /*yield*/, api.post('/user/current-location', location)];
            case 1: return [2 /*return*/, _c.sent()];
            case 2:
                error_2 = _c.sent();
                if (!(((_a = error_2.response) === null || _a === void 0 ? void 0 : _a.status) === 404)) return [3 /*break*/, 6];
                _c.label = 3;
            case 3:
                _c.trys.push([3, 5, , 6]);
                return [4 /*yield*/, async_storage_1.default.getItem('auth_token')];
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
    return api.post('/geocode/reverse', { latitude: latitude, longitude: longitude });
};
exports.reverseGeocode = reverseGeocode;
var forwardGeocode = function (query) {
    return api.post('/geocode/forward', { query: query });
};
exports.forwardGeocode = forwardGeocode;
var searchHospitals = function (query, limit) {
    if (limit === void 0) { limit = 10; }
    return api.post('/places/hospitals/search', { query: query, limit: limit });
};
exports.searchHospitals = searchHospitals;
var searchUserBySLId = function (slId) {
    return api.get("/user/search/".concat(slId));
};
exports.searchUserBySLId = searchUserBySLId;
var getAllUsers = function (search, limit) {
    if (limit === void 0) { limit = 200; }
    return api.get('/users', { params: { search: search, limit: limit } });
};
exports.getAllUsers = getAllUsers;
var getUserNotifications = function () {
    return api.get('/notifications');
};
exports.getUserNotifications = getUserNotifications;
var getUnreadNotificationCount = function () {
    return api.get('/notifications/unread-count');
};
exports.getUnreadNotificationCount = getUnreadNotificationCount;
var nativeMultipartPost = function (endpoint, formData) { return __awaiter(void 0, void 0, void 0, function () {
    var token, headers, response, text, data;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, async_storage_1.default.getItem('auth_token')];
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
var uploadUserPost = function (file, caption, filterName, onProgress) {
    return (function () { return __awaiter(void 0, void 0, void 0, function () {
        var localResponse, localBlob, objectPath, formData_1, formData, error_3, token, headers, response, text, data;
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
                    if (filterName) {
                        formData_1.append('filter_name', filterName);
                    }
                    return [2 /*return*/, api.post('/posts/upload-from-storage', formData_1, {
                            headers: { 'Content-Type': 'multipart/form-data' },
                            timeout: 30 * 60 * 1000,
                        })];
                case 4:
                    formData = new FormData();
                    formData.append('caption', caption || '');
                    if (filterName) {
                        formData.append('filter_name', filterName);
                    }
                    return [4 /*yield*/, appendMultipartFile(formData, 'file', file)];
                case 5:
                    _a.sent();
                    _a.label = 6;
                case 6:
                    _a.trys.push([6, 8, , 15]);
                    return [4 /*yield*/, api.post('/posts/upload', formData, {
                            headers: react_native_1.Platform.OS === 'web' ? { 'Content-Type': 'multipart/form-data' } : undefined,
                            timeout: 10 * 60 * 1000,
                            onUploadProgress: onProgress,
                        })];
                case 7: return [2 /*return*/, _a.sent()];
                case 8:
                    error_3 = _a.sent();
                    console.warn('[API] axios upload failed, retrying native fetch multipart upload', error_3);
                    if (!(react_native_1.Platform.OS !== 'web')) return [3 /*break*/, 14];
                    return [4 /*yield*/, async_storage_1.default.getItem('auth_token')];
                case 9:
                    token = _a.sent();
                    headers = {};
                    if (token) {
                        headers.Authorization = "Bearer ".concat(token);
                    }
                    return [4 /*yield*/, fetch("".concat(exports.API_URL, "/api/posts/upload"), {
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
        var formData;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    formData = new FormData();
                    return [4 /*yield*/, appendMultipartFile(formData, 'file', file)];
                case 1:
                    _a.sent();
                    if (react_native_1.Platform.OS !== 'web') {
                        return [2 /*return*/, nativeMultipartPost('/media/upload', formData)];
                    }
                    return [2 /*return*/, api.post('/media/upload', formData, {
                            headers: { 'Content-Type': 'multipart/form-data' },
                            timeout: 10 * 60 * 1000,
                        })];
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
                    return [2 /*return*/, api.post('/videos/upload', formData, {
                            headers: { 'Content-Type': 'multipart/form-data' },
                            timeout: 10 * 60 * 1000,
                        })];
            }
        });
    }); })();
};
exports.uploadCompressedVideo = uploadCompressedVideo;
var getPostsFeed = function (limit, offset) {
    if (limit === void 0) { limit = 20; }
    if (offset === void 0) { offset = 0; }
    return api.get('/posts/feed', { params: { limit: limit, offset: offset } });
};
exports.getPostsFeed = getPostsFeed;
var togglePostLike = function (postId) {
    return api.post("/posts/".concat(postId, "/like"));
};
exports.togglePostLike = togglePostLike;
var addPostComment = function (postId, text) {
    return api.post("/posts/".concat(postId, "/comments"), { text: text });
};
exports.addPostComment = addPostComment;
var getPostComments = function (postId, limit) {
    if (limit === void 0) { limit = 200; }
    return api.get("/posts/".concat(postId, "/comments"), { params: { limit: limit } });
};
exports.getPostComments = getPostComments;
var repostPost = function (postId) {
    return api.post("/posts/".concat(postId, "/repost"));
};
exports.repostPost = repostPost;
var deletePost = function (postId) {
    return api.delete("/posts/".concat(postId));
};
exports.deletePost = deletePost;
var reportPost = function (postId, category, description) {
    if (category === void 0) { category = 'other'; }
    if (description === void 0) { description = ''; }
    return api.post("/posts/".concat(postId, "/report"), { category: category, description: description });
};
exports.reportPost = reportPost;
var updatePost = function (postId, data) {
    return api.put("/posts/".concat(postId), data);
};
exports.updatePost = updatePost;
var addPostHashtags = function (postId, hashtags) {
    return api.post("/posts/".concat(postId, "/hashtags"), { hashtags: hashtags });
};
exports.addPostHashtags = addPostHashtags;
var removePostHashtags = function (postId, hashtags) {
    return api.delete("/posts/".concat(postId, "/hashtags"), { data: { hashtags: hashtags } });
};
exports.removePostHashtags = removePostHashtags;
var searchByHashtag = function (hashtag, limit, offset) {
    if (limit === void 0) { limit = 50; }
    if (offset === void 0) { offset = 0; }
    return api.get('/posts/hashtag', { params: { hashtag: hashtag, limit: limit, offset: offset } });
};
exports.searchByHashtag = searchByHashtag;
var viewPost = function (postId) {
    return api.post("/posts/".concat(postId, "/view"));
};
exports.viewPost = viewPost;
var getPostById = function (postId) {
    return api.get("/posts/".concat(postId));
};
exports.getPostById = getPostById;
var getPostViews = function (postId) {
    return api.get("/posts/".concat(postId, "/views"));
};
exports.getPostViews = getPostViews;
// Community APIs
var getCommunities = function () {
    return api.get('/communities');
};
exports.getCommunities = getCommunities;
var getCommunity = function (id) {
    return api.get("/communities/".concat(id));
};
exports.getCommunity = getCommunity;
var joinCommunityByCode = function (code) {
    return api.post('/communities/join', { code: code });
};
exports.joinCommunityByCode = joinCommunityByCode;
var agreeToRules = function (communityId, subgroupType) {
    return api.post("/communities/".concat(communityId, "/agree-rules"), { subgroup_type: subgroupType });
};
exports.agreeToRules = agreeToRules;
// Circle APIs
var createCircle = function (data) {
    return api.post('/circles', data);
};
exports.createCircle = createCircle;
var getCircles = function () {
    return api.get('/circles');
};
exports.getCircles = getCircles;
var getCircle = function (circleId) {
    return api.get("/circles/".concat(circleId));
};
exports.getCircle = getCircle;
var updateCircle = function (circleId, data) {
    return api.put("/circles/".concat(circleId), data);
};
exports.updateCircle = updateCircle;
var joinCircle = function (code) {
    return api.post('/circles/join', { code: code });
};
exports.joinCircle = joinCircle;
var getCircleRequests = function (circleId) {
    return api.get("/circles/".concat(circleId, "/requests"));
};
exports.getCircleRequests = getCircleRequests;
var approveCircleRequest = function (circleId, userId) {
    return api.post("/circles/".concat(circleId, "/approve/").concat(userId));
};
exports.approveCircleRequest = approveCircleRequest;
var rejectCircleRequest = function (circleId, userId) {
    return api.post("/circles/".concat(circleId, "/reject/").concat(userId));
};
exports.rejectCircleRequest = rejectCircleRequest;
var inviteToCircle = function (circleId, slId) {
    return api.post("/circles/".concat(circleId, "/invite"), { sl_id: slId });
};
exports.inviteToCircle = inviteToCircle;
var transferCircleAdmin = function (circleId, memberId) {
    return api.post("/circles/".concat(circleId, "/transfer-admin/").concat(memberId));
};
exports.transferCircleAdmin = transferCircleAdmin;
var leaveCircle = function (circleId) {
    return api.post("/circles/".concat(circleId, "/leave"));
};
exports.leaveCircle = leaveCircle;
var deleteCircle = function (circleId) {
    return api.delete("/circles/".concat(circleId));
};
exports.deleteCircle = deleteCircle;
var removeCircleMember = function (circleId, memberId) {
    return api.post("/circles/".concat(circleId, "/remove-member/").concat(memberId));
};
exports.removeCircleMember = removeCircleMember;
// Message APIs
var sendCommunityMessage = function (communityId, subgroupType, content, messageType) {
    if (messageType === void 0) { messageType = 'text'; }
    return api.post("/messages/community/".concat(communityId, "/").concat(subgroupType), { content: content, message_type: messageType });
};
exports.sendCommunityMessage = sendCommunityMessage;
var getCommunityMessages = function (communityId, subgroupType, limit) {
    if (limit === void 0) { limit = 50; }
    return api.get("/messages/community/".concat(communityId, "/").concat(subgroupType, "?limit=").concat(limit));
};
exports.getCommunityMessages = getCommunityMessages;
var sendCircleMessage = function (circleId, content, messageType) {
    if (messageType === void 0) { messageType = 'text'; }
    return api.post("/messages/circle/".concat(circleId), { content: content, message_type: messageType });
};
exports.sendCircleMessage = sendCircleMessage;
var getCircleMessages = function (circleId, limit) {
    if (limit === void 0) { limit = 50; }
    return api.get("/messages/circle/".concat(circleId, "?limit=").concat(limit));
};
exports.getCircleMessages = getCircleMessages;
// Direct Message APIs
var sendDirectMessage = function (recipientSlId, content, messageType) {
    if (messageType === void 0) { messageType = 'text'; }
    return api.post('/dm', { recipient_sl_id: recipientSlId, content: content, message_type: messageType });
};
exports.sendDirectMessage = sendDirectMessage;
var getConversations = function () {
    return api.get('/dm/conversations', { timeout: 120000 });
};
exports.getConversations = getConversations;
var getDirectMessages = function (conversationId, limit) {
    if (limit === void 0) { limit = 50; }
    return api.get("/dm/".concat(conversationId, "?limit=").concat(limit), { timeout: 120000 });
};
exports.getDirectMessages = getDirectMessages;
var markDirectMessagesRead = function (conversationId) {
    return api.post("/dm/".concat(conversationId, "/read"));
};
exports.markDirectMessagesRead = markDirectMessagesRead;
var clearDirectMessages = function (conversationId) {
    return api.delete("/dm/".concat(conversationId, "/messages"));
};
exports.clearDirectMessages = clearDirectMessages;
var approveDirectMessageRequest = function (conversationId) {
    return api.post("/dm/".concat(conversationId, "/request/approve"));
};
exports.approveDirectMessageRequest = approveDirectMessageRequest;
var denyDirectMessageRequest = function (conversationId) {
    return api.post("/dm/".concat(conversationId, "/request/deny"));
};
exports.denyDirectMessageRequest = denyDirectMessageRequest;
// Discover APIs
var discoverCommunities = function () {
    return api.get('/discover/communities');
};
exports.discoverCommunities = discoverCommunities;
// Wisdom & Panchang APIs
var getTodaysWisdom = function () {
    return api.get('/wisdom/today');
};
exports.getTodaysWisdom = getTodaysWisdom;
var getTodaysPanchang = function () {
    return api.get('/panchang/today');
};
exports.getTodaysPanchang = getTodaysPanchang;
var getProkeralaPanchang = function (params) { return api.get('/panchang/prokerala', { params: params }); };
exports.getProkeralaPanchang = getProkeralaPanchang;
var getProkeralaPanchangSummary = function (params) { return api.get('/panchang/prokerala/summary', { params: params }); };
exports.getProkeralaPanchangSummary = getProkeralaPanchangSummary;
var getProkeralaAstrology = function (params) { return api.get('/astrology/prokerala', { params: params }); };
exports.getProkeralaAstrology = getProkeralaAstrology;
var getProkeralaAstrologySummary = function (params) { return api.get('/astrology/prokerala/summary', { params: params }); };
exports.getProkeralaAstrologySummary = getProkeralaAstrologySummary;
var askProkeralaAstrology = function (data) { return api.post('/astrology/prokerala/ask', data); };
exports.askProkeralaAstrology = askProkeralaAstrology;
// Temple APIs
var getTemples = function () {
    return api.get('/temples');
};
exports.getTemples = getTemples;
var getNearbyTemples = function (lat, lng) {
    return api.get("/temples/nearby".concat(lat && lng ? "?lat=".concat(lat, "&lng=").concat(lng) : ''));
};
exports.getNearbyTemples = getNearbyTemples;
var getTemple = function (templeId) {
    return api.get("/temples/".concat(templeId));
};
exports.getTemple = getTemple;
var followTemple = function (templeId) {
    return api.post("/temples/".concat(templeId, "/follow"));
};
exports.followTemple = followTemple;
var unfollowTemple = function (templeId) {
    return api.post("/temples/".concat(templeId, "/unfollow"));
};
exports.unfollowTemple = unfollowTemple;
var followUser = function (userId) {
    return api.post("/users/".concat(userId, "/follow"));
};
exports.followUser = followUser;
var unfollowUser = function (userId) {
    return api.post("/users/".concat(userId, "/unfollow"));
};
exports.unfollowUser = unfollowUser;
var getTemplePosts = function (templeId) {
    return api.get("/temples/".concat(templeId, "/posts"));
};
exports.getTemplePosts = getTemplePosts;
var reactToTemplePost = function (templeId, postId, reaction) {
    return api.post("/temples/".concat(templeId, "/posts/").concat(postId, "/react"), { reaction: reaction });
};
exports.reactToTemplePost = reactToTemplePost;
// Event APIs
var getEvents = function () {
    return api.get('/events');
};
exports.getEvents = getEvents;
var getNearbyEvents = function () {
    return api.get('/events/nearby');
};
exports.getNearbyEvents = getNearbyEvents;
var attendEvent = function (eventId) {
    return api.post("/events/".concat(eventId, "/attend"));
};
exports.attendEvent = attendEvent;
// Verification APIs
var getVerificationStatus = function () {
    return api.get('/user/verification-status');
};
exports.getVerificationStatus = getVerificationStatus;
var requestVerification = function (data) {
    return api.post('/user/request-verification', data);
};
exports.requestVerification = requestVerification;
// Profile APIs
var updateExtendedProfile = function (data) {
    return api.put('/user/profile/extended', data);
};
exports.updateExtendedProfile = updateExtendedProfile;
var getProfileCompletion = function () {
    return api.get('/user/profile-completion');
};
exports.getProfileCompletion = getProfileCompletion;
var getHoroscope = function () {
    return api.get('/user/horoscope');
};
exports.getHoroscope = getHoroscope;
// Community Stats
var getCommunityStats = function (communityId) {
    return api.get("/communities/".concat(communityId, "/stats"));
};
exports.getCommunityStats = getCommunityStats;
// KYC APIs
var getKYCStatus = function () {
    return api.get('/kyc/status');
};
exports.getKYCStatus = getKYCStatus;
var submitKYC = function (data) {
    return api.post('/kyc/submit', data);
};
exports.submitKYC = submitKYC;
var generateUserAadhaarOtp = function (data) { return api.post('/kyc/aadhaar/otp', data); };
exports.generateUserAadhaarOtp = generateUserAadhaarOtp;
var verifyUserAadhaarOtp = function (data) { return api.post('/kyc/aadhaar/otp/verify', data); };
exports.verifyUserAadhaarOtp = verifyUserAadhaarOtp;
// Report APIs
var reportContent = function (data) {
    return api.post('/report', data);
};
exports.reportContent = reportContent;
// Temple Channel APIs
var createTemple = function (data) {
    return api.post('/temples', data);
};
exports.createTemple = createTemple;
var createTemplePost = function (templeId, data) {
    return api.post("/temples/".concat(templeId, "/posts"), data);
};
exports.createTemplePost = createTemplePost;
// Mark messages as read
var markMessagesRead = function (chatId) {
    return api.post("/dm/".concat(chatId, "/read"));
};
exports.markMessagesRead = markMessagesRead;
// =================== HELP REQUEST APIS ===================
var createHelpRequest = function (data) { return api.post('/help-requests', data); };
exports.createHelpRequest = createHelpRequest;
var getHelpRequests = function (params) { return api.get('/help-requests', { params: params }); };
exports.getHelpRequests = getHelpRequests;
var getMyHelpRequests = function () {
    return api.get('/help-requests/my');
};
exports.getMyHelpRequests = getMyHelpRequests;
var getActiveHelpRequest = function () {
    return api.get('/help-requests/active');
};
exports.getActiveHelpRequest = getActiveHelpRequest;
var fulfillHelpRequest = function (requestId) {
    return api.post("/help-requests/".concat(requestId, "/fulfill"));
};
exports.fulfillHelpRequest = fulfillHelpRequest;
var verifyHelpRequest = function (requestId) {
    return api.post("/help-requests/".concat(requestId, "/verify"));
};
exports.verifyHelpRequest = verifyHelpRequest;
var deleteHelpRequest = function (requestId) {
    return api.delete("/help-requests/".concat(requestId));
};
exports.deleteHelpRequest = deleteHelpRequest;
// =================== COMMUNITY REQUESTS APIS ===================
var createCommunityRequest = function (data) { return api.post('/community-requests', data); };
exports.createCommunityRequest = createCommunityRequest;
var getCommunityRequests = function (params) { return api.get('/community-requests', { params: params }); };
exports.getCommunityRequests = getCommunityRequests;
var getMyCommunityRequests = function () {
    return api.get('/community-requests/my');
};
exports.getMyCommunityRequests = getMyCommunityRequests;
var getMyActiveCommunityRequests = function () {
    return api.get('/community-requests/my', { params: { status: 'active' } });
};
exports.getMyActiveCommunityRequests = getMyActiveCommunityRequests;
var resolveCommunityRequest = function (requestId) {
    return api.post("/community-requests/".concat(requestId, "/resolve"));
};
exports.resolveCommunityRequest = resolveCommunityRequest;
var deleteCommunityRequest = function (requestId) {
    return api.delete("/community-requests/".concat(requestId));
};
exports.deleteCommunityRequest = deleteCommunityRequest;
// =================== VENDOR APIS ===================
var createVendor = function (data) { return api.post('/vendors', data); };
exports.createVendor = createVendor;
var getVendors = function (params) { return api.get('/vendors', { params: params }); };
exports.getVendors = getVendors;
var getMyVendor = function () {
    return api.get('/vendors/my');
};
exports.getMyVendor = getMyVendor;
var getVendorCategories = function () {
    return api.get('/vendors/categories');
};
exports.getVendorCategories = getVendorCategories;
var getVendor = function (vendorId) {
    return api.get("/vendors/".concat(vendorId));
};
exports.getVendor = getVendor;
var updateVendor = function (vendorId, data) { return api.put("/vendors/".concat(vendorId), data); };
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
var updateVendorBusinessProfile = function (vendorId, data) { return api.put("/vendors/".concat(vendorId, "/business/profile"), data); };
exports.updateVendorBusinessProfile = updateVendorBusinessProfile;
var appendMultipartFile = function (formData, fieldName, file) { return __awaiter(void 0, void 0, void 0, function () {
    var response, blob, webFile, preparedFile, error_4, response, blob;
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
                error_4 = _a.sent();
                console.warn('[API] Multipart append failed, falling back to blob upload:', error_4);
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
        var formData, token, url, headers, response, text, data, error_5;
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
                    return [4 /*yield*/, async_storage_1.default.getItem('auth_token')];
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
                    error_5 = _a.sent();
                    console.warn('[API] Native vendor upload failed, retrying via axios:', error_5);
                    return [2 /*return*/, api.post("/vendors/".concat(vendorId, "/business/images/upload"), formData)];
                case 9: return [2 /*return*/, api.post("/vendors/".concat(vendorId, "/business/images/upload"), formData, {
                        headers: { 'Content-Type': 'multipart/form-data' },
                    })];
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
                    return [2 /*return*/, api.post("/vendors/".concat(vendorId, "/kyc/upload"), formData, {
                            headers: react_native_1.Platform.OS === 'web' ? { 'Content-Type': 'multipart/form-data' } : undefined,
                        })];
            }
        });
    }); })();
};
exports.uploadVendorKycFile = uploadVendorKycFile;
var extractKycTextFromImage = function (vendorId, file) { return __awaiter(void 0, void 0, void 0, function () {
    var token, formData, fileAttached, error_6, imageBase64, error_7, response, headers, fetchError_1, errorText, data;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, async_storage_1.default.getItem('auth_token')];
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
                error_6 = _a.sent();
                console.warn('extractKycTextFromImage: multipart file attach failed, will try base64 fallback', error_6);
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
                error_7 = _a.sent();
                console.warn('extractKycTextFromImage: base64 fallback generation failed', error_7);
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
                if (!!response.ok) return [3 /*break*/, 15];
                return [4 /*yield*/, response.text()];
            case 14:
                errorText = _a.sent();
                console.error('[OCR API] Error response:', response.status, errorText);
                throw new Error("OCR failed: ".concat(response.status, " - ").concat(errorText));
            case 15: return [4 /*yield*/, response.json()];
            case 16:
                data = _a.sent();
                console.log('[OCR API] Response data:', JSON.stringify(data).substring(0, 500));
                return [2 /*return*/, { data: data }];
        }
    });
}); };
exports.extractKycTextFromImage = extractKycTextFromImage;
var extractUserKycTextFromImage = function (file) { return __awaiter(void 0, void 0, void 0, function () {
    var token, formData, fileAttached, error_8, imageBase64, error_9, response, headers, fetchError_2, errorText, data;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, async_storage_1.default.getItem('auth_token')];
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
                error_8 = _a.sent();
                console.warn('extractUserKycTextFromImage: multipart file attach failed, will try base64 fallback', error_8);
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
                error_9 = _a.sent();
                console.warn('extractUserKycTextFromImage: base64 fallback generation failed', error_9);
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
                if (!!response.ok) return [3 /*break*/, 15];
                return [4 /*yield*/, response.text()];
            case 14:
                errorText = _a.sent();
                console.error('[User OCR API] Error response:', response.status, errorText);
                throw new Error("OCR failed: ".concat(response.status, " - ").concat(errorText));
            case 15: return [4 /*yield*/, response.json()];
            case 16:
                data = _a.sent();
                console.log('[User OCR API] Response data:', JSON.stringify(data).substring(0, 500));
                return [2 /*return*/, { data: data }];
        }
    });
}); };
exports.extractUserKycTextFromImage = extractUserKycTextFromImage;
var generateVendorAadhaarOtp = function (vendorId, data) { return api.post("/vendors/".concat(vendorId, "/kyc/aadhaar/otp"), data); };
exports.generateVendorAadhaarOtp = generateVendorAadhaarOtp;
var verifyVendorAadhaarOtp = function (vendorId, data) { return api.post("/vendors/".concat(vendorId, "/kyc/aadhaar/otp/verify"), data); };
exports.verifyVendorAadhaarOtp = verifyVendorAadhaarOtp;
var addVendorPhoto = function (vendorId, photo) {
    return api.post("/vendors/".concat(vendorId, "/photos"), photo, {
        headers: { 'Content-Type': 'application/json' }
    });
};
exports.addVendorPhoto = addVendorPhoto;
var deleteVendor = function (vendorId) {
    return api.delete("/vendors/".concat(vendorId));
};
exports.deleteVendor = deleteVendor;
var createOrUpdateJobProfile = function (data) {
    return api.post('/jobs/profile', data);
};
exports.createOrUpdateJobProfile = createOrUpdateJobProfile;
var getMyJobProfile = function () {
    return api.get('/jobs/profile/my');
};
exports.getMyJobProfile = getMyJobProfile;
var getJobProfile = function (profileId) {
    return api.get("/jobs/profile/".concat(profileId));
};
exports.getJobProfile = getJobProfile;
var getJobProfiles = function (params) {
    return api.get('/jobs/profiles', { params: params });
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
                    return [2 /*return*/, api.post("/jobs/profile/".concat(profileId, "/upload"), formData, {
                            headers: react_native_1.Platform.OS === 'web' ? { 'Content-Type': 'multipart/form-data' } : undefined,
                        })];
            }
        });
    }); })();
};
exports.uploadJobProfileFile = uploadJobProfileFile;
// =================== CULTURAL COMMUNITY APIS ===================
var getCulturalCommunities = function (search) {
    return api.get('/cultural-communities', { params: { search: search } });
};
exports.getCulturalCommunities = getCulturalCommunities;
var getUserCulturalCommunity = function () {
    return api.get('/user/cultural-community');
};
exports.getUserCulturalCommunity = getUserCulturalCommunity;
var updateUserCulturalCommunity = function (cultural_community) {
    return api.put('/user/cultural-community', { cultural_community: cultural_community });
};
exports.updateUserCulturalCommunity = updateUserCulturalCommunity;
// =================== UTILITY APIS ===================
var getWisdom = function () {
    return api.get('/wisdom/today');
};
exports.getWisdom = getWisdom;
var getGitaShloka = function (chapter, verse) { return __awaiter(void 0, void 0, void 0, function () {
    var response, error_10;
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
                error_10 = _a.sent();
                console.error('Error fetching Gita shloka:', error_10);
                throw error_10;
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.getGitaShloka = getGitaShloka;
var getPanchang = function () {
    return api.get('/panchang/today');
};
exports.getPanchang = getPanchang;
// =================== SOS EMERGENCY APIS ===================
var createSOSAlert = function (data) { return api.post('/sos', data); };
exports.createSOSAlert = createSOSAlert;
var getActiveSOSAlerts = function (params) { return api.get('/sos/nearby', { params: params }); };
exports.getActiveSOSAlerts = getActiveSOSAlerts;
var getMySOSAlert = function () {
    return api.get('/sos/my');
};
exports.getMySOSAlert = getMySOSAlert;
var resolveSOSAlert = function (sosId, status) {
    return api.post("/sos/".concat(sosId, "/resolve"), { status: status });
};
exports.resolveSOSAlert = resolveSOSAlert;
var resolveMyActiveSOS = function (status) {
    return api.post('/sos/my/resolve', { status: status });
};
exports.resolveMyActiveSOS = resolveMyActiveSOS;
var respondToSOS = function (sosId, response) {
    return api.post("/sos/".concat(sosId, "/respond"), { response: response });
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
                case 0: return [4 /*yield*/, api.post('/speech/transcribe', {
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
exports.default = api;
