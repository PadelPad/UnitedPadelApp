const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('metro-config').ConfigT} */
const config = getDefaultConfig(__dirname);

// Leave this mostly stock. Expo handles TS aliases from tsconfig.
module.exports = config;