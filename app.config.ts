import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'UnitedPadelApp',
  slug: 'united-padel',
  scheme: 'unitedpadel',
  version: '1.0.0',
  orientation: 'portrait',
  platforms: ['ios', 'android', 'web'],
  assetBundlePatterns: ['**/*'],
  ios: {
    usesAppleSignIn: true,
    infoPlist: {
      NSCameraUsageDescription: 'United Padel uses the camera to scan QR codes for matches.',
      NSPhotoLibraryUsageDescription: 'United Padel uses your photo library for avatars and evidence uploads.',
    },
  },
  android: {
    permissions: ['android.permission.CAMERA', 'android.permission.READ_MEDIA_IMAGES'],
  },
  extra: {
    EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
    EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    REACT_APP_APP_URL: process.env.REACT_APP_APP_URL,
    eas: { projectId: process.env.EAS_PROJECT_ID }, // <— important
  },
  experiments: { typedRoutes: true },
};

export default config;
