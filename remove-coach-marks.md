# Plan: Complete Removal of Coach Marks

## Goal
Completely remove the coach marks (onboarding/walkthrough tooltips and overlays) from the Brahmand app, ensuring layouts, pointer events, and cache clearing function properly without any residual coach mark dependencies.

## Tasks
- [x] Task 1: Clean up `frontend/src/store/authStore.ts` → Verify: Remove references to `coachmark_` AsyncStorage keys.
- [x] Task 2: Refactor `frontend/src/components/CustomTabBar.tsx` → Verify: Remove coach mark store hooks, conditionals, and overlays.
- [x] Task 3: Refactor `frontend/src/components/GlobalFAB.tsx` → Verify: Remove pointer event overrides, opacity/expansion logic for step 5, and store dependencies.
- [x] Task 4: Refactor `frontend/app/(tabs)/home.tsx` → Verify: Remove coach mark state, walkthrough tooltips/overlays, and step transitions.
- [x] Task 5: Refactor `frontend/app/(tabs)/messages.tsx` → Verify: Remove messages-specific walkthrough tooltips/overlays and step handling.
- [x] Task 6: Refactor `frontend/app/(tabs)/vendor.tsx` → Verify: Remove vendor-specific walkthrough tooltips/overlays and step handling.
- [x] Task 7: Delete `frontend/src/utils/coachMarkState.ts` → Verify: Ensure no other imports exist.
- [x] Task 8: Run React Native lint and build check → Verify: App compiles without errors.

## Done When
- [x] Coach mark UI overlays, tooltips, and state management are entirely removed from all tabs and core components.
- [x] Pointer events and layouts (e.g., FAB, TabBar) operate correctly under normal user interaction.
- [x] The app builds and runs successfully without any compile-time errors or missing import warnings.
