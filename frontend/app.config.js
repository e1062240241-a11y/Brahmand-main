const fs = require('fs');
const path = require('path');

// Dynamically generate google-services.json and GoogleService-Info.plist at build time
const firebaseApiKeyAndroid = process.env.EXPO_PUBLIC_FIREBASE_API_KEY_ANDROID || 'AIzaSyBqj-JGtJNoRBE-5Brl0p_NALobh_PWPxE';
const firebaseApiKeyIos = process.env.EXPO_PUBLIC_FIREBASE_API_KEY_IOS || 'AIzaSyDiFc4xPsRp0Bd1AteqkTJmdA2l50cahJ4';
const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY || 'AIzaSyBK-mmtVFjREbCAP8Ea_a5RfsL4uCAoSUs';

const googleServicesPath = path.resolve(__dirname, 'google-services.json');
const googleServiceInfoPath = path.resolve(__dirname, 'GoogleService-Info.plist');

// Write google-services.json dynamically
try {
  const androidConfig = {
    "project_info": {
      "project_number": "103222994071",
      "project_id": "sanatan-lok",
      "storage_bucket": "sanatan-lok.firebasestorage.app"
    },
    "client": [
      {
        "client_info": {
          "mobilesdk_app_id": "1:103222994071:android:ded9a4d12d837f40e8f5d2",
          "android_client_info": {
            "package_name": "com.brahmand.app"
          }
        },
        "oauth_client": [],
        "api_key": [
          {
            "current_key": firebaseApiKeyAndroid
          }
        ],
        "services": {
          "appinvite_service": {
            "other_platform_oauth_client": []
          }
        }
      },
      {
        "client_info": {
          "mobilesdk_app_id": "1:103222994071:android:29232f2c3cb1fdc1e8f5d2",
          "android_client_info": {
            "package_name": "com.brahmand.sanatanlok"
          }
        },
        "oauth_client": [],
        "api_key": [
          {
            "current_key": firebaseApiKeyAndroid
          }
        ],
        "services": {
          "appinvite_service": {
            "other_platform_oauth_client": []
          }
        }
      }
    ],
    "configuration_version": "1"
  };
  fs.writeFileSync(googleServicesPath, JSON.stringify(androidConfig, null, 2));
} catch (err) {
  console.warn('[Config] Failed to write dynamic google-services.json:', err);
}

// Write GoogleService-Info.plist dynamically
try {
  const iosConfig = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>API_KEY</key>
	<string>${firebaseApiKeyIos}</string>
	<key>GCM_SENDER_ID</key>
	<string>103222994071</string>
	<key>PLIST_VERSION</key>
	<string>1</string>
	<key>BUNDLE_ID</key>
	<string>com.brahmand.app</string>
	<key>PROJECT_ID</key>
	<string>sanatan-lok</string>
	<key>STORAGE_BUCKET</key>
	<string>sanatan-lok.firebasestorage.app</string>
	<key>IS_ADS_ENABLED</key>
	<false></false>
	<key>IS_ANALYTICS_ENABLED</key>
	<false></false>
	<key>IS_APPINVITE_ENABLED</key>
	<true></true>
	<key>IS_GCM_ENABLED</key>
	<true></true>
	<key>IS_SIGNIN_ENABLED</key>
	<true></true>
	<key>GOOGLE_APP_ID</key>
	<string>1:103222994071:ios:3b0a738a0cb398f7e8f5d2</string>
</dict>
</plist>
`;
  fs.writeFileSync(googleServiceInfoPath, iosConfig);
} catch (err) {
  console.warn('[Config] Failed to write dynamic GoogleService-Info.plist:', err);
}

module.exports = ({ config }) => {
  // Inject Google Maps API key dynamically
  if (!config.ios) config.ios = {};
  if (!config.ios.config) config.ios.config = {};
  config.ios.config.googleMapsApiKey = googleMapsApiKey;

  if (!config.android) config.android = {};
  if (!config.android.config) config.android.config = {};
  if (!config.android.config.googleMaps) config.android.config.googleMaps = {};
  config.android.config.googleMaps.apiKey = googleMapsApiKey;
  
  if (config.plugins) {
    config.plugins = config.plugins.map(plugin => {
      if (Array.isArray(plugin) && plugin[0] === 'react-native-maps') {
        return ['react-native-maps', { googleMapsApiKey }];
      }
      return plugin;
    });
  }
  
  return config;
};
