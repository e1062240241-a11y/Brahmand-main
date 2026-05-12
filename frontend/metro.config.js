// metro.config.js
const { getDefaultConfig } = require("expo/metro-config");
const path = require('path');
const { FileStore } = require('metro-cache');

const config = getDefaultConfig(__dirname);

// Force zustand to resolve to the CommonJS builds on web/metro.
config.resolver.extraNodeModules = {
  zustand: path.resolve(__dirname, 'node_modules/zustand/index.js'),
  'zustand/middleware': path.resolve(__dirname, 'node_modules/zustand/middleware.js'),
  'zustand/vanilla': path.resolve(__dirname, 'node_modules/zustand/vanilla.js'),
  'zustand/react': path.resolve(__dirname, 'node_modules/zustand/react.js'),
  util: require.resolve('util/'),
  crypto: require.resolve('crypto-browserify'),
  stream: require.resolve('stream-browserify'),
  vm: require.resolve('vm-browserify'),
};

// Prioritize fields to avoid ESM issues. 
// We prioritize 'react-native' for mobile and 'browser'/'main' for web to avoid 'import.meta' errors from ESM 'module' fields.
config.resolver.resolverMainFields = ['react-native', 'browser', 'main', 'module'];

// Disable package exports as they often lead to ESM/CommonJS mixups in Metro/Web
config.resolver.unstable_enablePackageExports = false;

// Use a stable on-disk store (shared across web/android)
const root = process.env.METRO_CACHE_ROOT || path.join(__dirname, '.metro-cache');
config.cacheStores = [
  new FileStore({ root: path.join(root, 'cache') }),
];


// // Exclude unnecessary directories from file watching
// config.watchFolders = [__dirname];
// config.resolver.blacklistRE = /(.*)\/(__tests__|android|ios|build|dist|.git|node_modules\/.*\/android|node_modules\/.*\/ios|node_modules\/.*\/windows|node_modules\/.*\/macos)(\/.*)?$/;

// // Alternative: use a more aggressive exclusion pattern
// config.resolver.blacklistRE = /node_modules\/.*\/(android|ios|windows|macos|__tests__|\.git|.*\.android\.js|.*\.ios\.js)$/;

// Reduce the number of workers to decrease resource usage
config.maxWorkers = 2;

module.exports = config;
