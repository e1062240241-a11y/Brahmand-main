"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerForPushNotifications = registerForPushNotifications;
exports.saveFCMToken = saveFCMToken;
exports.initializePushNotifications = initializePushNotifications;
exports.addNotificationReceivedListener = addNotificationReceivedListener;
exports.addNotificationResponseReceivedListener = addNotificationResponseReceivedListener;
exports.getLastNotificationResponse = getLastNotificationResponse;
exports.scheduleLocalNotification = scheduleLocalNotification;
exports.clearAllNotifications = clearAllNotifications;
exports.getBadgeCount = getBadgeCount;
exports.setBadgeCount = setBadgeCount;
var Device = __importStar(require("expo-device"));
var react_native_1 = require("react-native");
var expo_constants_1 = __importDefault(require("expo-constants"));
var api_1 = __importDefault(require("./api"));
var isExpoGo = expo_constants_1.default.appOwnership === 'expo' || expo_constants_1.default.appOwnership === 'guest';
function getNotificationsModule() {
    return __awaiter(this, void 0, void 0, function () {
        var Notifications, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, Promise.resolve().then(function () { return __importStar(require('expo-notifications')); })];
                case 1:
                    Notifications = _a.sent();
                    return [2 /*return*/, Notifications];
                case 2:
                    e_1 = _a.sent();
                    console.warn('[Push] expo-notifications import failed:', e_1);
                    return [2 /*return*/, null];
                case 3: return [2 /*return*/];
            }
        });
    });
}
// Configure how notifications appear when app is in foreground (if available)
(function () { return __awaiter(void 0, void 0, void 0, function () {
    var Notifications, e_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, getNotificationsModule()];
            case 1:
                Notifications = _a.sent();
                if (!Notifications) return [3 /*break*/, 5];
                if (Notifications.setNotificationHandler) {
                    Notifications.setNotificationHandler({
                        handleNotification: function () { return __awaiter(void 0, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                return [2 /*return*/, ({
                                        shouldShowAlert: true,
                                        shouldShowBanner: true,
                                        shouldShowList: true,
                                        shouldPlaySound: true,
                                        shouldSetBadge: true,
                                    })];
                            });
                        }); },
                    });
                }
                if (!Notifications.setNotificationCategoryAsync) return [3 /*break*/, 5];
                _a.label = 2;
            case 2:
                _a.trys.push([2, 4, , 5]);
                return [4 /*yield*/, Notifications.setNotificationCategoryAsync('SOS_ALERT', [
                        {
                            identifier: 'accept_sos',
                            buttonTitle: 'Accept',
                        },
                        {
                            identifier: 'deny_sos',
                            buttonTitle: 'Deny',
                            options: { isDestructive: true },
                        },
                    ])];
            case 3:
                _a.sent();
                return [3 /*break*/, 5];
            case 4:
                e_2 = _a.sent();
                console.warn('[Push] Failed to create SOS notification category:', e_2);
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); })();
/**
 * Register for push notifications and get the FCM token
 */
function registerForPushNotifications() {
    return __awaiter(this, void 0, void 0, function () {
        var token, Notifications, existingStatus, finalStatus, status_1, deviceToken, projectId, pushToken, error_1, e_3;
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
        return __generator(this, function (_o) {
            switch (_o.label) {
                case 0:
                    token = null;
                    return [4 /*yield*/, getNotificationsModule()];
                case 1:
                    Notifications = _o.sent();
                    if (!Notifications) {
                        console.warn('[Push] Notifications module unavailable; skipping registration.');
                        return [2 /*return*/, null];
                    }
                    // Check if running on a physical device
                    if (!Device.isDevice) {
                        console.log('[Push] Must use physical device for Push Notifications');
                        return [2 /*return*/, null];
                    }
                    return [4 /*yield*/, Notifications.getPermissionsAsync()];
                case 2:
                    existingStatus = (_o.sent()).status;
                    finalStatus = existingStatus;
                    if (!(existingStatus !== 'granted')) return [3 /*break*/, 4];
                    return [4 /*yield*/, Notifications.requestPermissionsAsync()];
                case 3:
                    status_1 = (_o.sent()).status;
                    finalStatus = status_1;
                    _o.label = 4;
                case 4:
                    if (finalStatus !== 'granted') {
                        console.log('[Push] Permission not granted for push notifications');
                        return [2 /*return*/, null];
                    }
                    _o.label = 5;
                case 5:
                    _o.trys.push([5, 11, , 12]);
                    // Web requires a VAPID key in app.json. If it's missing, getDevicePushTokenAsync will throw.
                    // We skip this on web unless we are sure we want web push.
                    if (react_native_1.Platform.OS === 'web') {
                        console.log('[Push] Skipping push token registration on web platform.');
                        return [2 /*return*/, null];
                    }
                    return [4 /*yield*/, Notifications.getDevicePushTokenAsync()];
                case 6:
                    deviceToken = _o.sent();
                    if (!(deviceToken === null || deviceToken === void 0 ? void 0 : deviceToken.data)) return [3 /*break*/, 7];
                    token = deviceToken.data;
                    console.log('[Push] Device Push Token retrieved successfully.');
                    return [3 /*break*/, 10];
                case 7:
                    projectId = (_d = (_c = (_b = (_a = expo_constants_1.default.expoConfig) === null || _a === void 0 ? void 0 : _a.extra) === null || _b === void 0 ? void 0 : _b.eas) === null || _c === void 0 ? void 0 : _c.projectId) !== null && _d !== void 0 ? _d : (_e = expo_constants_1.default.easConfig) === null || _e === void 0 ? void 0 : _e.projectId;
                    if (!projectId) return [3 /*break*/, 9];
                    return [4 /*yield*/, Notifications.getExpoPushTokenAsync({ projectId: projectId })];
                case 8:
                    pushToken = _o.sent();
                    token = pushToken.data;
                    console.warn('[Push] Received Expo push token; backend uses FCM and this token may not be deliverable. Use a standalone/custom client build to get a real FCM device token.');
                    return [3 /*break*/, 10];
                case 9:
                    console.warn('[Push] Unable to get device push token and no Expo projectId fallback available.');
                    _o.label = 10;
                case 10: return [3 /*break*/, 12];
                case 11:
                    error_1 = _o.sent();
                    if (react_native_1.Platform.OS === 'web' && ((_f = error_1.message) === null || _f === void 0 ? void 0 : _f.includes('vapidPublicKey'))) {
                        console.log('[Push] Web push notifications disabled: Missing VAPID key in app.json');
                    }
                    else {
                        console.error('[Push] Error getting push token:', error_1);
                    }
                    return [3 /*break*/, 12];
                case 12:
                    if (!(react_native_1.Platform.OS === 'android')) return [3 /*break*/, 18];
                    _o.label = 13;
                case 13:
                    _o.trys.push([13, 17, , 18]);
                    return [4 /*yield*/, Notifications.setNotificationChannelAsync('default_v4', {
                            name: 'Default v4',
                            importance: (_h = (_g = Notifications.AndroidImportance) === null || _g === void 0 ? void 0 : _g.MAX) !== null && _h !== void 0 ? _h : 5,
                            vibrationPattern: [0, 250, 250, 250],
                            lightColor: '#FF6B35',
                            sound: 'nornal',
                        })];
                case 14:
                    _o.sent();
                    return [4 /*yield*/, Notifications.setNotificationChannelAsync('messages_v4', {
                            name: 'Messages v4',
                            description: 'Private and community message notifications',
                            importance: (_k = (_j = Notifications.AndroidImportance) === null || _j === void 0 ? void 0 : _j.HIGH) !== null && _k !== void 0 ? _k : 4,
                            vibrationPattern: [0, 250, 250, 250],
                            lightColor: '#FF6B35',
                            sound: 'nornal',
                        })];
                case 15:
                    _o.sent();
                    return [4 /*yield*/, Notifications.setNotificationChannelAsync('sos_alerts_v3', {
                            name: 'Emergency SOS Alerts v3',
                            description: 'High-priority notifications for emergency SOS requests nearby',
                            importance: (_m = (_l = Notifications.AndroidImportance) === null || _l === void 0 ? void 0 : _l.MAX) !== null && _m !== void 0 ? _m : 5,
                            vibrationPattern: [0, 1000, 500, 1000, 500, 1000, 500, 1000],
                            lightColor: '#FF0000',
                            bypassDnd: true,
                            showBadge: true,
                            enableVibrate: true,
                            sound: 'soundreality_mayday_166011',
                        })];
                case 16:
                    _o.sent();
                    return [3 /*break*/, 18];
                case 17:
                    e_3 = _o.sent();
                    console.warn('[Push] Failed to configure Android channels', e_3);
                    return [3 /*break*/, 18];
                case 18: return [2 /*return*/, token];
            }
        });
    });
}
/**
 * Save the FCM/Expo token to the backend/Firestore
 */
function saveFCMToken(token) {
    return __awaiter(this, void 0, void 0, function () {
        var error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, api_1.default.post('/user/fcm-token', { fcm_token: token })];
                case 1:
                    _a.sent();
                    console.log('[Push] Notification token saved to backend successfully.');
                    return [2 /*return*/, true];
                case 2:
                    error_2 = _a.sent();
                    console.error('[Push] Error saving notification token:', error_2);
                    return [2 /*return*/, false];
                case 3: return [2 /*return*/];
            }
        });
    });
}
/**
 * Initialize push notifications - register and save token
 */
function initializePushNotifications() {
    return __awaiter(this, void 0, void 0, function () {
        var token, saved;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, registerForPushNotifications()];
                case 1:
                    token = _a.sent();
                    if (!token) {
                        return [2 /*return*/, null];
                    }
                    return [4 /*yield*/, saveFCMToken(token)];
                case 2:
                    saved = _a.sent();
                    return [2 /*return*/, saved ? token : null];
            }
        });
    });
}
/**
 * Add listener for notification received while app is foregrounded
 */
function addNotificationReceivedListener(callback) {
    return __awaiter(this, void 0, void 0, function () {
        var Notifications;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getNotificationsModule()];
                case 1:
                    Notifications = _a.sent();
                    if (!Notifications) {
                        console.warn('[Push] addNotificationReceivedListener: notifications unavailable');
                        return [2 /*return*/, { remove: function () { } }];
                    }
                    return [2 /*return*/, Notifications.addNotificationReceivedListener(callback)];
            }
        });
    });
}
/**
 * Add listener for notification response (when user taps notification)
 */
function addNotificationResponseReceivedListener(callback) {
    return __awaiter(this, void 0, void 0, function () {
        var Notifications;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getNotificationsModule()];
                case 1:
                    Notifications = _a.sent();
                    if (!Notifications) {
                        console.warn('[Push] addNotificationResponseReceivedListener: notifications unavailable');
                        return [2 /*return*/, { remove: function () { } }];
                    }
                    return [2 /*return*/, Notifications.addNotificationResponseReceivedListener(callback)];
            }
        });
    });
}
/**
 * Get the last notification response (for handling deep links on app launch)
 */
function getLastNotificationResponse() {
    return __awaiter(this, void 0, void 0, function () {
        var Notifications;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getNotificationsModule()];
                case 1:
                    Notifications = _a.sent();
                    if (!Notifications)
                        return [2 /*return*/, null];
                    return [4 /*yield*/, Notifications.getLastNotificationResponseAsync()];
                case 2: return [2 /*return*/, _a.sent()];
            }
        });
    });
}
/**
 * Schedule a local notification (for testing)
 */
function scheduleLocalNotification(title, body, data) {
    return __awaiter(this, void 0, void 0, function () {
        var Notifications, notificationType, isSos, isMsg, soundName;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getNotificationsModule()];
                case 1:
                    Notifications = _a.sent();
                    if (!Notifications)
                        return [2 /*return*/, null];
                    notificationType = data === null || data === void 0 ? void 0 : data.type;
                    isSos = !!(notificationType === null || notificationType === void 0 ? void 0 : notificationType.startsWith('sos'));
                    isMsg = notificationType === 'message';
                    soundName = isSos
                        ? (react_native_1.Platform.OS === 'ios' ? 'soundreality_mayday_166011.mp3' : 'soundreality_mayday_166011')
                        : (react_native_1.Platform.OS === 'ios' ? 'nornal.aiff' : 'nornal');
                    return [4 /*yield*/, Notifications.scheduleNotificationAsync({
                            content: {
                                title: title,
                                body: body,
                                data: data || {},
                                sound: soundName,
                            },
                            trigger: {
                                channelId: isSos ? 'sos_alerts_v3' : (isMsg ? 'messages_v4' : 'default_v4'),
                            },
                        })];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
/**
 * Clear all notifications
 */
function clearAllNotifications() {
    return __awaiter(this, void 0, void 0, function () {
        var Notifications;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getNotificationsModule()];
                case 1:
                    Notifications = _a.sent();
                    if (!Notifications)
                        return [2 /*return*/];
                    return [4 /*yield*/, Notifications.dismissAllNotificationsAsync()];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
/**
 * Get badge count
 */
function getBadgeCount() {
    return __awaiter(this, void 0, void 0, function () {
        var Notifications;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getNotificationsModule()];
                case 1:
                    Notifications = _a.sent();
                    if (!Notifications)
                        return [2 /*return*/, 0];
                    return [4 /*yield*/, Notifications.getBadgeCountAsync()];
                case 2: return [2 /*return*/, _a.sent()];
            }
        });
    });
}
/**
 * Set badge count
 */
function setBadgeCount(count) {
    return __awaiter(this, void 0, void 0, function () {
        var Notifications;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getNotificationsModule()];
                case 1:
                    Notifications = _a.sent();
                    if (!Notifications)
                        return [2 /*return*/];
                    return [4 /*yield*/, Notifications.setBadgeCountAsync(count)];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
