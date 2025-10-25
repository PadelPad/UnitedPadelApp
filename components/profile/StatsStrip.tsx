import React from 'react';
import { View, Text, ActivityIndicator, Pressable } from 'react-native';
import { usePlayerStats } from '@/lib/hooks/usePlayerStats';

export default function StatsStrip({
  userId,
  showXp = true,
  showElo = true,
}: {
  userId: string;
  /** Optional: show XP tile (default true) */
  showXp?: boolean;
  /** Optional: show Elo Δ tile (default true) */
  showElo?: boolean;
}) {
  const { data, isLoading, isError, refetch, isFetching } = usePlayerStats(userId);

  if (isLoading) {
    return (
      <View
        style={{
          padding: 12,
          borderRadius: 14,
          backgroundColor: '#0e1116',
          borderWidth: 1,
          borderColor: '#28303a',
          alignItems: 'center',
        }}
      >
        <ActivityIndicator color="#ff6a00" />
      </View>
    );
  }

  if (isError || !data) {
    return (
      <Pressable
        onPress={() => refetch()}
        style={{
          padding: 12,
          borderRadius: 14,
          backgroundColor: '#140f12',
          borderWidth: 1,
          borderColor: '#4a2a30',
          alignItems: 'center',
        }}
        accessibilityRole="button"
        accessibilityLabel="Retry loading stats"
      >
        <Text style={{ color: '#ff9aa2', fontWeight: '800' }}>
          Couldn’t load stats. {isFetching ? 'Retrying…' : 'Tap to retry.'}
        </Text>
      </Pressable>
    );
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
        flexWrap: 'wrap',
      }}
      accessibilityRole="summary"
      accessibilityLabel="Player statistics"
    >
      <Tile label="Matches" value={s.matches} />
      <Divider />
      <Tile label="Wins" value={s.wins} />
      <Divider />
      <Tile label="Win %" value={`${s.winRatePct}%`} />
      <Divider />
      <Tile label="Streak" value={s.streak} />
      {showXp || showElo ? <Divider /> : null}
      {showXp ? <Tile label="XP" value={s.xp} /> : null}
      {showElo ? <Tile label="Elo Δ (10)" value={s.eloDelta} /> : null}
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
