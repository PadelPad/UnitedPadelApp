import React from 'react';
import { Stack } from 'expo-router';

export default function TournamentsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#0b0e13' },
        headerTintColor: '#fff',
        contentStyle: { backgroundColor: '#0b0e13' },
      }}
    >
      {/* The tab list */}
      <Stack.Screen name="index" options={{ headerShown: false }} />
      {/* The details page */}
      <Stack.Screen name="[id]" options={{ title: 'Tournament' }} />
    </Stack>
  );
}
