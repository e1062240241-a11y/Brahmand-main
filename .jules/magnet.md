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

## 2026-09-10 - Discover Tab Language-Aware Polish & Cross-Feature CTAs
**Learning:** Unlocalized discovery screens leave non-English users feeling disconnected. Localizing tab headers ("मंदिर", "कार्यक्रम"), section titles, and empty states alongside cross-feature links (to Panchang and Jaap) improves feature cross-discovery with zero backend load.
**Action:** Updated `frontend/app/(tabs)/discover.tsx` with Devanagari Hindi titles, warm empty prompts, and cross-feature links to `/panchang` and `/(tabs)/jaap`.

## 2026-09-11 - Notifications Empty State Dual Cross-Feature CTAs
**Learning:** Empty notification screens are high-intent drop-off points. Providing localized, dual-action CTAs ("Start Jaap 🙏" & "Today's Panchang ✨" / "जाप शुरू करें 🙏" & "आज का पंचांग ✨") converts an idle empty screen into a habit-building springboard for daily spiritual practices.
**Action:** Updated `styles.emptyState` in `frontend/app/notifications.tsx` with a dual-CTA action row connecting Notifications to `/panchang` and `/(tabs)/jaap` with Devanagari Hindi and English localization.

## 2026-09-12 - Language-Aware Festival Screen Greetings & Reminders
**Learning:** Hardcoded English greetings and alert prompts in festival discovery screens isolate non-English users during major cultural moments. Localizing greetings ("नमस्ते मित्र 👋"), sub-messages ("आपका अगला पर्व आ गया है..."), card labels ("त्योहार"), loader text ("त्योहार लोड हो रहे हैं..."), and reminder toggle alerts in warm Devanagari Hindi deepens cultural belonging and retention.
**Action:** Updated `frontend/app/festivals.tsx` to conditionally render Devanagari Hindi copy when `user?.language === 'hi'`.
