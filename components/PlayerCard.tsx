// components/PlayerCard.tsx
import React from 'react';
import { View, Text, Image, Pressable, Platform } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

export type Player = {
  id: string;
  username?: string | null;
  avatar_url?: string | null;
  rating?: number | null;
  club?: string | null;
  badges_count?: number | null;
  tierLabel?: string; // 'Free'|'Plus'|'Elite'|...
};

export type PlayerStats = {
  matches: number;
  wins: number;
  winRatePct: number;
  streak: number;
  xp?: number;
  eloDelta?: number;
};

export default function PlayerCard({
  player,
  stats,
  onPress,
  rightSlot,
}: {
  player: Player;
  stats?: PlayerStats | null;
  onPress?: () => void;
  rightSlot?: React.ReactNode;
}) {
  const Container: any = onPress ? Pressable : View;

  const rating = Math.round(player.rating ?? 1000);
  const stat = (label: string, value: number | string) => (
    <View style={{ minWidth: 64, alignItems: 'center' }}>
      <Text style={{ color: '#ffe0b0', fontWeight: '900', fontSize: 16 }}>{value}</Text>
      <Text style={{ color: '#cbcbd7', fontSize: 11 }}>{label}</Text>
    </View>
  );

  return (
    <Container
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      style={{
        backgroundColor: '#0e1116',
        borderWidth: 1,
        borderColor: '#1f2630',
        borderRadius: 16,
        padding: 14,
        gap: 12,
      }}
    >
      {/* Header row */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        {player.avatar_url ? (
          <Image
            source={{ uri: player.avatar_url }}
            style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#131923' }}
          />
        ) : (
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: '#131923',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="person" size={24} color="#9aa0a6" />
          </View>
        )}

        <View style={{ flex: 1 }}>
          <Text style={{ color: '#fff', fontWeight: '900', fontSize: 18 }} numberOfLines={1}>
            {player.username || 'Player'}
          </Text>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 4, flexWrap: 'wrap' }}>
            <Text style={{ color: '#9aa0a6', fontSize: 12 }}>⭐ {rating}</Text>
            {player.badges_count ? (
              <Text style={{ color: '#9aa0a6', fontSize: 12 }}>🎖 {player.badges_count}</Text>
            ) : null}
            {player.club ? (
              <Text style={{ color: '#9aa0a6', fontSize: 12 }} numberOfLines={1}>
                🏟 {player.club}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Right-side chips */}
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          {player.tierLabel ? <Chip text={player.tierLabel} /> : null}
          {stats?.eloDelta ? (
            <Chip
              text={`${stats.eloDelta > 0 ? '▲' : '▼'} ${Math.abs(stats.eloDelta)}`}
              tone={stats.eloDelta > 0 ? 'success' : 'danger'}
            />
          ) : null}
          {rightSlot}
        </View>
      </View>

      {/* Stats row inside the card */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          backgroundColor: 'rgba(0,0,0,0.35)',
          padding: 10,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.08)',
        }}
      >
        {stat('Matches', stats ? stats.matches : '—')}
        <Divider />
        {stat('Wins', stats ? stats.wins : '—')}
        <Divider />
        {stat('Win %', stats ? `${stats.winRatePct}%` : '—')}
        <Divider />
        {stat('Streak', stats ? stats.streak : '—')}
      </View>
    </Container>
  );
}

export function Divider() {
  return <View style={{ width: 1, height: 26, backgroundColor: 'rgba(255,255,255,0.08)' }} />;
}

export function Chip({
  text,
  tone = 'default',
}: {
  text: string;
  tone?: 'default' | 'success' | 'danger';
}) {
  const palette =
    tone === 'success'
      ? { bg: 'rgba(70,211,154,0.2)', bd: '#2b6f5a', fg: '#46d39a' }
      : tone === 'danger'
      ? { bg: 'rgba(255,77,79,0.2)', bd: '#7a2f32', fg: '#ff9aa2' }
      : { bg: 'rgba(0,0,0,0.35)', bd: 'rgba(255,255,255,0.08)', fg: '#ffd79f' };

  return (
    <View
      style={{
        backgroundColor: palette.bg,
        borderColor: palette.bd,
        borderWidth: 1,
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 6,
      }}
    >
      <Text style={{ color: palette.fg, fontWeight: '800' }}>{text}</Text>
    </View>
  );
}
