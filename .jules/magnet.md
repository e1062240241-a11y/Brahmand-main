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

## 2026-09-13 - Language-Aware Horoscope Screen & Jyotish AI Tags
**Learning:** Hardcoded English headers and category badges in astrology screens (like Jyotish/Horoscope) reduce engagement for Hindi users. Localizing section titles ("आपकी राशि क्या है", "ग्रह विश्लेषण"), AI consult prompts ("एआई से राशिफल परामर्श लें"), metrics labels ("वित्त", "प्रेम", "स्वास्थ्य", "कुल प्रभाव"), and modal action CTAs in warm Devanagari Hindi enhances user belonging and habit-building.
**Action:** Updated `frontend/app/horoscope.tsx` to check `user?.language === 'hi'` and render localized Devanagari Hindi copy across headers, cards, badges, and modals.

## 2026-09-14 - Language-Aware Library Search & Inspiration Polish
**Learning:** Hardcoded English text in search inputs, headers, quote banners, and section CTAs in discovery screens (like Library) breaks context for non-English users. Conditionally rendering Devanagari Hindi text (`"पुस्तक, लेखक या विषय खोजें..."`, `"सभी देखें ›"`, etc.) based on `useLanguageStore` maintains warm cultural alignment without affecting layout or component interfaces.
**Action:** Updated `frontend/app/library/index.tsx` header title, search placeholder, quote text, and section CTA to render localized Devanagari Hindi when `language === 'hi'`.

## 2026-09-15 - Community Badges Language-Aware Polish & Passport CTA
**Learning:** Cold developer notes (e.g. "created to avoid unmatched route issues") in secondary community screens alienate users and diminish app quality. Replacing developer text with warm, localized spiritual encouragement ("साधना में निरंतरता बनाए रखें...") and adding a cross-feature CTA button to Brahmand Passport (`/passport`) seamlessly turns an empty state into a retention-driving milestone screen.
**Action:** Updated `frontend/app/badges.tsx` to conditionally render warm Devanagari Hindi copy (`"सामुदायिक सम्मान एवं बैज"`, `"यहाँ आपकी साधना..."`) and added a cross-feature CTA button linking directly to `/passport`.

## 2026-09-16 - Active Community Requests List Language-Aware Empty State
**Learning:** Hardcoded English empty state text in mutual aid and community help screens ("No Requests Found") feels impersonal and transactional to Hindi users. Conditionally displaying warm Devanagari Hindi copy ("कोई सहायता अनुरोध उपलब्ध नहीं है ✨", "सहायता अनुरोध पोस्ट करें 🙏") based on `useLanguageStore` encourages active community participation and mutual support.
**Action:** Updated `frontend/app/community-request/list.tsx` to conditionally render polite Devanagari Hindi titles, subtitles, and CTA buttons when `language === 'hi'`.

## 2026-09-17 - Language-Aware Blocked Accounts Empty State & Error Alerts
**Learning:** Hardcoded English messages in security and account management screens (such as Blocked Accounts search empty state and error/success alerts) break trust and continuity for Hindi users. Conditionally rendering warm Devanagari Hindi copy ("कोई परिणाम नहीं मिला", "अवरुद्ध उपयोगकर्ताओं की सूची लोड करने में समर्थ।") ensures a seamless, respectful user experience across all settings screens.
**Action:** Updated `frontend/app/settings/blocked.tsx` to check `t('language') === 'hi'` and render localized Devanagari Hindi text for search empty states, error alerts, and accessibility labels.

## 2026-09-18 - Language-Aware Local Community Discovery Header & Empty States
**Learning:** Hardcoded English section titles and empty state prompts in community discovery screens discourage Hindi-first users from forming or joining local groups. Conditionally rendering Devanagari Hindi copy ("सभी स्थानीय समुदाय", "कोई समुदाय नहीं मिला", "पहला समुदाय बनाएं 🙏") fosters a warm sense of belonging and encourages local community creation.
**Action:** Updated `frontend/app/community/discover.tsx` to conditionally render Devanagari Hindi text across local community section headers, empty state titles, search query fallbacks, and creation CTA buttons when `user?.language === 'hi'`.

## 2026-09-19 - Passport Progress Screen Language-Aware Polish & Empty States
**Learning:** Hardcoded English text on spiritual progress tracking screens (like Passport Progress) disconnects Hindi users from their milestones. Conditionally rendering Devanagari Hindi headers ("पासपोर्ट प्रगति"), section labels ("जाप पूर्ण करें", "अध्ययन पूर्ण करें"), input prompts ("मालाएं (उदा. 108)"), and warm empty state prompts ("अभी कोई बैज नहीं है... 🙏") deepens personal connection and encourages daily habit tracking.
**Action:** Updated `frontend/app/passport/progress.tsx` with `useLanguageStore` to conditionally display Devanagari Hindi copy across stats, headers, forms, and empty states when `language === 'hi'`.
