// components/cards/PlayerHeroCard.tsx
import React from 'react';
import { View, Text, Image, ImageBackground, Pressable } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

export type HeroStats = {
  matches: number; wins: number; winRatePct: number; streak: number;
  xp?: number; eloDelta?: number;
};

export type HeroPlayer = {
  id: string;
  username?: string | null;
  avatar_url?: string | null;
  rating?: number | null;
  club?: string | null;
  badges_count?: number | null;
  tierLabel?: string; // Free | Plus | Elite | Club Plus | Club Elite
};

const BG = require('@/assets/cards/backgroundfill.jpg');

export default function PlayerHeroCard({
  player,
  stats,
  onPress,
  size = 'md',
}: {
  player: HeroPlayer;
  stats?: HeroStats | null;
  onPress?: () => void;
  /** 'md' | 'lg' */
  size?: 'md' | 'lg';
}) {
  const Container: any = onPress ? Pressable : View;
  const rating = Math.round(player.rating ?? 1000);

  const dims = size === 'lg'
    ? { pad: 18, avatar: 72, title: 20, gapTop: 14 }
    : { pad: 14, avatar: 56, title: 18, gapTop: 10 };

  return (
    <Container
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      style={{ borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: '#2a313c' }}
    >
      <ImageBackground
        source={BG}
        resizeMode="cover"
        imageStyle={{ opacity: 0.6 }}
        style={{ padding: dims.pad, backgroundColor: '#0e1116' }}
      >
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          {player.avatar_url ? (
            <Image
              source={{ uri: player.avatar_url }}
              style={{ width: dims.avatar, height: dims.avatar, borderRadius: 999, backgroundColor: '#131923' }}
            />
          ) : (
            <View
              style={{
                width: dims.avatar, height: dims.avatar, borderRadius: 999,
                backgroundColor: '#131923', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Ionicons name="person" size={Math.round(dims.avatar * 0.42)} color="#9aa0a6" />
            </View>
          )}

          <View style={{ flex: 1 }}>
            <Text style={{ color: '#fff', fontWeight: '900', fontSize: dims.title }} numberOfLines={1}>
              {player.username || 'Player'}
            </Text>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 4, flexWrap: 'wrap' }}>
              <Text style={{ color: '#ffe0b0', fontSize: 12 }}>⭐ {rating}</Text>
              {player.badges_count ? <Text style={{ color: '#ffe0b0', fontSize: 12 }}>🎖 {player.badges_count}</Text> : null}
              {player.club ? <Text style={{ color: '#ffe0b0', fontSize: 12 }} numberOfLines={1}>🏟 {player.club}</Text> : null}
            </View>
          </View>

          {player.tierLabel ? <Pill text={player.tierLabel} /> : null}
        </View>

        <View style={{ height: dims.gapTop }} />

        {/* Stats row */}
        <View
          style={{
            flexDirection: 'row', alignItems: 'center', gap: 10,
            backgroundColor: 'rgba(0,0,0,0.35)',
            padding: 10, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
          }}
        >
          <Tile label="Matches" value={stats ? stats.matches : '—'} />
          <Divider />
          <Tile label="Wins" value={stats ? stats.wins : '—'} />
          <Divider />
          <Tile label="Win %" value={stats ? `${stats.winRatePct}%` : '—'} />
          <Divider />
          <Tile label="Streak" value={stats ? stats.streak : '—'} />
        </View>
      </ImageBackground>
    </Container>
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
function Divider() { return <View style={{ width: 1, height: 26, backgroundColor: 'rgba(255,255,255,0.08)' }} />; }
function Pill({ text }: { text: string }) {
  return (
    <View style={{ backgroundColor: 'rgba(0,0,0,0.35)', borderColor: 'rgba(255,255,255,0.18)', borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 }}>
      <Text style={{ color: '#ffd79f', fontWeight: '800' }}>{text}</Text>
    </View>
  );
}
