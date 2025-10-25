// app/(tabs)/_layout.tsx
import React from 'react';
import { Tabs } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import GlobalFab from '@/components/GlobalFab';

export default function TabsLayout() {
  return (
    <>
      <Tabs
        initialRouteName="home/index"
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#ff6a00',
          tabBarStyle: { backgroundColor: '#0b0e13', borderTopColor: '#1f2630' },
        }}
      >
        <Tabs.Screen
          name="home/index"
          options={{ title: 'Home', tabBarIcon: ({ color, size }) => <Ionicons name="home" color={color} size={size} /> }}
        />
        <Tabs.Screen
          name="leaderboard/index"
          options={{ title: 'Leaderboard', tabBarIcon: ({ color, size }) => <Ionicons name="bar-chart" color={color} size={size} /> }}
        />
        <Tabs.Screen
          name="matches/index"
          options={{ title: 'Matches', tabBarIcon: ({ color, size }) => <Ionicons name="tennisball" color={color} size={size} /> }}
        />
        <Tabs.Screen
          name="tournaments/index"
          options={{ title: 'Tournaments', tabBarIcon: ({ color, size }) => <Ionicons name="calendar" color={color} size={size} /> }}
        />
        <Tabs.Screen
          name="clubs/index"
          options={{ title: 'Clubs', tabBarIcon: ({ color, size }) => <Ionicons name="business" color={color} size={size} /> }}
        />
        <Tabs.Screen
          name="profile/index"
          options={{ title: 'Profile', tabBarIcon: ({ color, size }) => <Ionicons name="person" color={color} size={size} /> }}
        />
      </Tabs>

      {/* Don’t pass a height override; GlobalFab safely reads it if available */}
      <GlobalFab />
    </>
  );
}
