## 2025-02-14 - [Fixed Hardcoded Google Maps API Key]
**Vulnerability:** A hardcoded Google Maps API key (`AIzaSyBK-...`) was found in `frontend/src/components/VendorRegistrationModal.tsx` in a string literal HTML template and the GooglePlacesAutocomplete query config.
**Learning:** Hardcoding API keys exposes them in the client bundle and source control, creating a risk for quota exhaustion and abuse. The repo uses dynamic config via `app.config.js` and `expo-constants` to inject secrets.
**Prevention:** In the Expo/React Native frontend, API keys and environment variables (such as Google Maps API keys) must be accessed dynamically via `Constants.expoConfig` (from `expo-constants`) or `process.env.EXPO_PUBLIC_*` rather than being hardcoded into component files.
