// babel.config.js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'], // SDK 53 preset includes expo-router
    plugins: [
      [
        'module-resolver',
        {
          extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
          alias: {
            '@': './',          // allows: import x from '@/lib/...'
            '@assets': './assets', // allows: import img from '@assets/padel-bg2.jpg'
            '@components': './components',
            '@lib': './lib',
            '@features': './features',
            '@types': './types',
          },
        },
      ],
      // keep this LAST
      'react-native-reanimated/plugin',
    ],
  };
};
