// app/notifications/index.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { colors } from '@/lib/theme';

export default function NotificationsScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, padding: 16 }}>
      <Text style={{ color: colors.text, fontSize: 18, fontWeight: '900', marginBottom: 8 }}>
        Notifications
      </Text>
      <Text style={{ color: colors.subtext }}>
        You’re all caught up. (Connect to Supabase Realtime + Push next.)
      </Text>
    </View>
  );
}
