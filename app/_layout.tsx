// app/_layout.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import QueryProvider from '../lib/react-query/Provider';
import { colors } from '../lib/theme';
import { ToastProvider } from '../components/ui/Toast';
import AppBackground from '../components/ui/AppBackground';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <QueryProvider>
          <ToastProvider>
            {/* Make system chrome float over the wallpaper */}
            <StatusBar style="light" translucent backgroundColor="transparent" />

            {/* Layer 0: solid dark fallback color */}
            <View style={styles.canvas}>
              {/* Layer 1: the wallpaper (absolute) */}
              <AppBackground dim={0.12} />
              {/* Layer 2: your app screens */}
              <Slot />
            </View>
          </ToastProvider>
        </QueryProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  canvas: { flex: 1, backgroundColor: colors.bg }, // fallback when image is loading
});
