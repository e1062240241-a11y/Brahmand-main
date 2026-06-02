# Scroll Tab Bar & Community Creation Plan

## Goal
Implement scroll-to-hide and scroll-to-show bottom tab bar animations across main tab screens, and activate the "Discover" tab in the community creation screen.

## Tasks
- [ ] Task 1: Wrap `TabLayout` with `TabBarProvider` in `frontend/app/(tabs)/_layout.tsx` → Verify: Provider compiles without issue
- [ ] Task 2: Configure `CustomTabBar.tsx` to use `Animated.View` and apply `tabBarTranslateY` styled transform → Verify: Tab bar still renders in normal position
- [ ] Task 3: Create a helper scroll listener/handler in a shared hook or file to process scroll events (calculating diff/velocity and invoking `showTabBar`/`hideTabBar`) → Verify: Scroll handler functions correctly
- [ ] Task 4: Integrate the scroll handler into the scrollable views in `home.tsx`, `messages.tsx`, `vendor.tsx`, and `profile.tsx` → Verify: Tab bar hides when scrolling down and shows when scrolling up on all these pages
- [ ] Task 5: Convert the "Discover" tab in `community/create.tsx` (step 2) to a clickable button routing to `/community/discover` → Verify: Tapping "Discover" opens the local communities discover list page

## Done When
- [ ] Tab bar animates smoothly down (hiding) when scrolling down and up (showing) when scrolling up on Home, Community, Services, and Profile tabs.
- [ ] "Discover" tab in community creation screen navigates to community discover screen.
