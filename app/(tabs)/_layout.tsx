// app/(tabs)/_layout.tsx
import React from 'react';
import { Tabs } from 'expo-router';
import CustomTabBar from '@/components/ui/CustomTabBar';
import QuickActionDock from '@/components/ui/QuickActionDock';

export default function TabsLayout() {
  return (
    <>
      <Tabs
        screenOptions={{ headerShown: false }}
        tabBar={(props) => <CustomTabBar {...props} />}
      >
        <Tabs.Screen name="home/index" options={{ title: 'Home', tabBarLabel: 'Home' }} />
        <Tabs.Screen name="matches/index" options={{ title: 'Matches', tabBarLabel: 'Matches' }} />
        <Tabs.Screen name="leaderboard/index" options={{ title: 'Leaderboard', tabBarLabel: 'Leaderboard' }} />
        <Tabs.Screen name="clubs/index" options={{ title: 'Clubs', tabBarLabel: 'Clubs' }} />
        <Tabs.Screen name="profile/index" options={{ title: 'Profile', tabBarLabel: 'Profile' }} />

        {/* Hidden routes, still navigable */}
        <Tabs.Screen name="tournaments/index" options={{ href: null }} />
        <Tabs.Screen name="search/index" options={{ href: null }} />
        <Tabs.Screen name="notifications/index" options={{ href: null }} />
      </Tabs>

      <QuickActionDock
        actions={[
          { key: 'submit', label: 'Submit match', icon: 'add-circle', href: '/submit' },
          { key: 'scan', label: 'Scan QR', icon: 'qr-code', href: '/submit/scan' },
          { key: 'leaders', label: 'Leaderboard', icon: 'stats-chart', href: '/(tabs)/leaderboard' },
          { key: 'tournaments', label: 'Tournaments', icon: 'trophy', href: '/(tabs)/tournaments' },
        ]}
      />
    </>
  );
}
