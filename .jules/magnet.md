# Magnet Codebase Map & Learnings

## 2026-09-04 - Profile to Jaap Tab Cross-Feature Route
**Learning:** Adding subtle, language-aware CTA buttons directly below user stats on high-frequency screens (like Profile) drives discovery of core habitual practices (like Jaap) without intruding on the user experience.
**Action:** Created `Pressable` link navigating to `/(tabs)/jaap` in `frontend/app/(tabs)/profile.tsx` respecting Hindi/English preference.

## 2026-09-05 - Language-Aware Panchang Empty State & Loading Polish
**Learning:** Blank or untranslated loading and empty states in core daily features (such as Panchang) disconnect non-English users. Ensuring Devanagari Hindi support in `BrandedLoading` messages and empty states maintains high retention and trust.
**Action:** Updated `frontend/src/components/panchang/PanchangTabContent.tsx` and `frontend/app/panchang.tsx` to conditionally render warm, polite Hindi copy when `language === 'hi'`.

## 2026-09-06 - Katha to Library Scripture Cross-Feature Connection
**Learning:** Connecting audio/video listening features (like Katha) with scripture reading (like Ramcharitmanas/Library) via subtle, language-aware CTAs increases discovery of core reading content without interrupting active listening.
**Action:** Added a language-aware "Read related scripture →" CTA button in `frontend/app/library/katha.tsx` linking to `/library/ramcharitmanas` with full Devanagari Hindi and English support.

## 2026-09-07 - Home Action Cards Row to Library Cross-Feature Connection
**Learning:** Placing a subtle, language-aware "Daily Reading" / "स्वाध्याय" action card directly in the top action cards row on the Home feed seamlessly encourages daily scripture reading habits by connecting Home directly to `/library/continue-reading`.
**Action:** Added `ContinueReadingCard` in `frontend/src/components/home/ActionCardsRow.tsx` navigating to `/library/continue-reading` with pure English ("Daily Reading") and pure Hindi ("स्वाध्याय") localization based on `t('language')`.

## 2026-09-08 - Backend Engagement Daily Spiritual Nudge Scheduler
**Learning:** Proactive time-based spiritual nudges that deliver localized titles/bodies (respecting user language preference between Devanagari Hindi and English) significantly boost daily retention and Panchang discovery.
**Action:** Created `EngagementSchedulerService` in `backend/services/engagement_scheduler.py` and API route `POST /nudge/daily` in `backend/routes/engagement_routes.py` connected via `backend/main.py`.
## 2026-09-08 - Language-Aware Chat Empty State Nudge
**Learning:** Empty chat screens without warm, localized guidance feel impersonal. Adding warm Devanagari Hindi copy ("अभी कोई संदेश नहीं हैं। बातचीत शुरू करें! 🙏") for Hindi users encourages user engagement and interaction in private and circle chats.
**Action:** Updated `ListEmptyComponent` in `frontend/app/chat/[type]/[id].tsx` to conditionally display language-aware empty text based on `user?.language`.

## 2026-09-09 - Language-Aware Circles Empty State & Warm Action CTAs
**Learning:** Empty group/circle discovery screens without localized copy discourage community formation. Localizing primary action CTAs ("सर्कल बनाएं", "सर्कल में जुड़ें") and empty state prompts in warm Hindi ("अपने परिवार, मित्रों या मंदिर समुदाय के लिए एक सर्कल बनाएं 🙏") increases community engagement for Hindi users.
**Action:** Updated `frontend/app/(tabs)/circles.tsx` to conditionally render Devanagari Hindi copy for action buttons, badge metadata, and empty states when `user?.language === 'hi'`.

## 2026-09-10 - Spiritual Streak Tracker Nudge Service
**Learning:** Celebrating multi-day spiritual streaks (like daily Jaap or scripture reading) via localized push notifications with respectful Devanagari Hindi copy ("आपकी अद्भुत साधना निष्ठा! आज भी अपनी दैनिक साधना जारी रखें 🙏") reinforces habit loops and long-term user retention.
**Action:** Created `StreakTrackerService` in `backend/services/streak_tracker.py` and endpoint `POST /nudge/streak` in `backend/routes/engagement_routes.py`.
