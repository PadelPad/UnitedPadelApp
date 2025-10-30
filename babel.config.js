// babel.config.js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'], // includes expo-router config on SDK 50+
    plugins: [
      // (optional) keep your module-resolver if you use aliases
      [
        'module-resolver',
        {
          extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
          alias: {
            '@': './',
            '@assets': './assets',
            '@components': './components',
            '@lib': './lib',
            '@features': './features',
            '@types': './types'
          }
        }
      ],

      // MUST be last
      'react-native-reanimated/plugin'
    ]
  };
};
