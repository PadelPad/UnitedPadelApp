// app/(tabs)/_layout.tsx
import React from 'react';
import { Tabs } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import GlobalFab from '@/components/GlobalFab';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';

export default function TabsLayout() {
  const tabBarHeight = useBottomTabBarHeight();

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#ff6a00',
          tabBarStyle: { backgroundColor: '#0b0e13', borderTopColor: '#1f2630' },
        }}
      >
        <Tabs.Screen
          name="home"
          options={{ title: 'Home', tabBarIcon: ({ color, size }) => <Ionicons name="home" color={color} size={size} /> }}
        />
        <Tabs.Screen
          name="leaderboard"
          options={{ title: 'Leaderboard', tabBarIcon: ({ color, size }) => <Ionicons name="bar-chart" color={color} size={size} /> }}
        />
        <Tabs.Screen
          name="matches"
          options={{ title: 'Matches', tabBarIcon: ({ color, size }) => <Ionicons name="tennisball" color={color} size={size} /> }}
        />
        <Tabs.Screen
          name="tournaments"
          options={{ title: 'Tournaments', tabBarIcon: ({ color, size }) => <Ionicons name="calendar" color={color} size={size} /> }}
        />
        <Tabs.Screen
          name="clubs"
          options={{ title: 'Clubs', tabBarIcon: ({ color, size }) => <Ionicons name="business" color={color} size={size} /> }}
        />
        <Tabs.Screen
          name="profile"
          options={{ title: 'Profile', tabBarIcon: ({ color, size }) => <Ionicons name="person" color={color} size={size} /> }}
        />
      </Tabs>

      {/* FAB overlays tabs; gets safe tab height from context */}
      <GlobalFab tabBarHeightOverride={tabBarHeight} />
    </>
  );
}
