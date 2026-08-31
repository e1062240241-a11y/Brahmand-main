module.exports = function (api) {
  api.cache(true);

  return {
    presets: [
      [
        'babel-preset-expo',
        {
          decorators: { legacy: true },
        },
      ],
    ],
    plugins: [
      'react-native-worklets/plugin',
    ],
    env: {
      production: {
        plugins: [['transform-remove-console', { exclude: ['error'] }]],
      },
    },
  };
};