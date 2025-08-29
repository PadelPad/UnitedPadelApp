module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Do NOT add 'expo-router/babel' on SDK 53 — preset already handles it
      'react-native-reanimated/plugin'
    ],
  };
};
