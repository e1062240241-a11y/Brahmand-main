module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // If you are using react-native-dotenv, it usually goes here:
      // ['module:react-native-dotenv']
    ],
  };
};
