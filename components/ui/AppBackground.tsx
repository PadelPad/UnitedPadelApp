// components/ui/AppBackground.tsx
import React from 'react';
import { Image, Platform, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// 👉 IMPORTANT: keep this relative path exactly as your folder structure shows.
import wallpaper from '../../assets/bg/brand-wallpaper.png';

type Props = {
  /** 0 – 1 black overlay strength; 0.10–0.16 looks great on OLED */
  dim?: number;
};

/**
 * Single, app-wide wallpaper. Absolutely positioned behind all screens.
 * - Never intercepts touches (pointerEvents="none")
 * - Slight gradient vignette to improve text contrast
 * - Blur on iOS for a bit of depth
 */
export default function AppBackground({ dim = 0.12 }: Props) {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Image
        source={wallpaper}
        resizeMode="cover"
        blurRadius={Platform.OS === 'ios' ? 10 : 0}
        style={StyleSheet.absoluteFill}
      />
      {/* Soft darkening + vignette so white text is always legible */}
      <LinearGradient
        colors={[
          `rgba(0,0,0,${Math.max(0, Math.min(1, dim))})`,
          `rgba(0,0,0,${Math.max(0, Math.min(1, dim + 0.08))})`,
        ]}
        style={StyleSheet.absoluteFill}
      />
      {/* Optional very subtle bottom vignette */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.18)']}
        style={[StyleSheet.absoluteFill, { opacity: 0.8 }]}
        start={{ x: 0.5, y: 0.4 }}
        end={{ x: 0.5, y: 1 }}
      />
    </View>
  );
}
