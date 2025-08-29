// components/profile/StatsStrip.tsx
import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { usePlayerStats } from '@/lib/hooks/usePlayerStats';

export default function StatsStrip({ userId }: { userId: string }) {
  const { data, isLoading, isError } = usePlayerStats(userId);

  if (isLoading) {
    return (
      <View style={{ padding: 14, alignItems: 'center' }}>
        <ActivityIndicator color="#ff6a00" />
      </View>
    );
  }

  if (isError || !data) {
    return <Text style={{ color: '#ff9aa2', padding: 14 }}>Couldn’t load stats.</Text>;
  }

  const s = data;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: '#0e1116',
        borderWidth: 1,
        borderColor: '#28303a',
        padding: 12,
        borderRadius: 14,
      }}
    >
      <Tile label="Matches" value={s.matches} />
      <Divider />
      <Tile label="Wins" value={s.wins} />
      <Divider />
      <Tile label="Win %" value={`${s.winRatePct}%`} />
      <Divider />
      <Tile label="Streak" value={s.streak} />
    </View>
  );
}

function Tile({ label, value }: { label: string; value: number | string }) {
  return (
    <View style={{ minWidth: 64, alignItems: 'center' }}>
      <Text style={{ color: '#ffe0b0', fontWeight: '900', fontSize: 16 }}>{value}</Text>
      <Text style={{ color: '#cbcbd7', fontSize: 11 }}>{label}</Text>
    </View>
  );
}

function Divider() {
  return <View style={{ width: 1, height: 26, backgroundColor: 'rgba(255,255,255,0.08)' }} />;
}
