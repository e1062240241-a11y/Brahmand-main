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
