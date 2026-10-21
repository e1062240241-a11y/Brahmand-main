const { withAndroidManifest } = require('@expo/config-plugins');

/**
 * Expo Config Plugin to remove high-risk unnecessary Android permissions
 * like SYSTEM_ALERT_WINDOW from final merged AndroidManifest.xml.
 */
module.exports = function withRemovedPermissions(config) {
  return withAndroidManifest(config, async (config) => {
    const manifest = config.modResults.manifest;

    // Ensure manifest xmlns:tools is present for tools:node="remove"
    if (!manifest.$) {
      manifest.$ = {};
    }
    if (!manifest.$['xmlns:tools']) {
      manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';
    }

    if (!manifest['uses-permission']) {
      manifest['uses-permission'] = [];
    }

    // List of permissions to explicitly strip out from merged manifest
    const permissionsToRemove = [
      'android.permission.SYSTEM_ALERT_WINDOW'
    ];

    permissionsToRemove.forEach((permissionName) => {
      // Check if permission is already present in array
      const existingIndex = manifest['uses-permission'].findIndex(
        (p) => p.$ && p.$['android:name'] === permissionName
      );

      if (existingIndex !== -1) {
        manifest['uses-permission'][existingIndex]['$']['tools:node'] = 'remove';
      } else {
        manifest['uses-permission'].push({
          $: {
            'android:name': permissionName,
            'tools:node': 'remove',
          },
        });
      }
    });

    return config;
  });
};
