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
exports.usePassportStore = void 0;
var zustand_1 = require("zustand");
var async_storage_1 = require("@react-native-async-storage/async-storage");
var PASSPORT_STORAGE_KEY = 'brahmand_passport_data';
var generateJourneyStory = function (journey) {
    var answersText = journey.answers
        .filter(function (item) { return item.answer.trim(); })
        .map(function (item) { return "".concat(item.question, " ").concat(item.answer.trim()); })
        .join(' ');
    return "On ".concat(journey.date, " I traveled to ").concat(journey.location, ". ").concat(answersText, " This journey is recorded as part of my Brahmand Passport.");
};
var persistPassportState = function (state) { return __awaiter(void 0, void 0, void 0, function () {
    var error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, async_storage_1.default.setItem(PASSPORT_STORAGE_KEY, JSON.stringify(state))];
            case 1:
                _a.sent();
                return [3 /*break*/, 3];
            case 2:
                error_1 = _a.sent();
                console.warn('[PassportStore] Failed to persist passport data:', error_1);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.usePassportStore = (0, zustand_1.create)(function (set, get) { return ({
    journeys: [],
    badges: [],
    certificates: [],
    total_jaap: 0,
    books_completed: 0,
    loadPassport: function () { return __awaiter(void 0, void 0, void 0, function () {
        var raw, parsed, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, async_storage_1.default.getItem(PASSPORT_STORAGE_KEY)];
                case 1:
                    raw = _a.sent();
                    if (!raw)
                        return [2 /*return*/];
                    parsed = JSON.parse(raw);
                    set(parsed);
                    return [3 /*break*/, 3];
                case 2:
                    error_2 = _a.sent();
                    console.warn('[PassportStore] Failed to load passport data:', error_2);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); },
    addJourney: function (journey) { return __awaiter(void 0, void 0, void 0, function () {
        var newJourney;
        return __generator(this, function (_a) {
            newJourney = __assign({ id: "passport_journey_".concat(Date.now(), "_").concat(Math.random().toString(36).slice(2, 6)), generated_story: generateJourneyStory(journey) }, journey);
            set(function (state) {
                var nextState = __assign(__assign({}, state), { journeys: __spreadArray([newJourney], state.journeys, true) });
                persistPassportState({
                    journeys: nextState.journeys,
                    badges: nextState.badges,
                    certificates: nextState.certificates,
                    total_jaap: nextState.total_jaap,
                    books_completed: nextState.books_completed,
                });
                return nextState;
            });
            return [2 /*return*/];
        });
    }); },
    awardBadge: function (title, description) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            set(function (state) {
                var alreadyHas = state.badges.some(function (badge) { return badge.title === title; });
                if (alreadyHas)
                    return state;
                var nextState = __assign(__assign({}, state), { badges: __spreadArray(__spreadArray([], state.badges, true), [
                        {
                            id: "passport_badge_".concat(Date.now(), "_").concat(Math.random().toString(36).slice(2, 6)),
                            title: title,
                            description: description,
                            earned_at: new Date().toISOString(),
                        },
                    ], false) });
                persistPassportState({
                    journeys: nextState.journeys,
                    badges: nextState.badges,
                    certificates: nextState.certificates,
                    total_jaap: nextState.total_jaap,
                    books_completed: nextState.books_completed,
                });
                return nextState;
            });
            return [2 /*return*/];
        });
    }); },
    addJaap: function (count) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            set(function (state) {
                var nextState = __assign(__assign({}, state), { total_jaap: state.total_jaap + count });
                persistPassportState({
                    journeys: nextState.journeys,
                    badges: nextState.badges,
                    certificates: nextState.certificates,
                    total_jaap: nextState.total_jaap,
                    books_completed: nextState.books_completed,
                });
                return nextState;
            });
            return [2 /*return*/];
        });
    }); },
    completeBook: function (book_name, completion_days, date) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            set(function (state) {
                var nextState = __assign(__assign({}, state), { books_completed: state.books_completed + 1, certificates: __spreadArray(__spreadArray([], state.certificates, true), [
                        {
                            id: "passport_certificate_".concat(Date.now(), "_").concat(Math.random().toString(36).slice(2, 6)),
                            book_name: book_name,
                            completion_days: completion_days,
                            date: date,
                        },
                    ], false) });
                persistPassportState({
                    journeys: nextState.journeys,
                    badges: nextState.badges,
                    certificates: nextState.certificates,
                    total_jaap: nextState.total_jaap,
                    books_completed: nextState.books_completed,
                });
                return nextState;
            });
            return [2 /*return*/];
        });
    }); },
}); });
