// components/cards/MiniCard.tsx
import React from 'react';
import { ImageBackground, View, Text, Image, Pressable } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

type Props = {
  bg: any;
  username: string;
  region?: string | null;
  rating?: number | null;
  avatarUrl?: string | null;
  rank?: number;
  onPress?: () => void;
};

export default function MiniCard({
  bg,
  username,
  region,
  rating,
  avatarUrl,
  rank,
  onPress,
}: Props) {
  return (
    <Pressable onPress={onPress} style={{ width: '100%' }}>
      <ImageBackground
        source={bg}
        style={{
          height: 96,
          borderRadius: 16,
          overflow: 'hidden',
          justifyContent: 'center',
          paddingHorizontal: 12,
        }}
        imageStyle={{ borderRadius: 16 }}
        resizeMode="cover"
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <RankBadge rank={rank} />
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={{ width: 44, height: 44, borderRadius: 999 }} />
          ) : (
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 999,
                backgroundColor: 'rgba(0,0,0,0.35)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="person" size={18} color="#f5f5f8" />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text numberOfLines={1} style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>
              {username || 'Player'}
            </Text>
            <Text numberOfLines={1} style={{ color: '#dddde7', opacity: 0.85, fontSize: 12 }}>
              {region || '—'}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ color: '#ffe0b0', fontWeight: '900', fontSize: 18 }}>
              {Math.round(rating ?? 1000)}
            </Text>
            <Ionicons name="chevron-forward" size={18} color="#c4c4d2" />
          </View>
        </View>
      </ImageBackground>
    </Pressable>
  );
}

function RankBadge({ rank }: { rank?: number }) {
  if (!rank) return <View style={{ width: 34 }} />;
  const bg =
    rank === 1 ? 'rgba(107,69,10,0.7)'
      : rank === 2 ? 'rgba(63,68,75,0.7)'
      : rank === 3 ? 'rgba(90,58,47,0.7)'
      : 'rgba(22,27,34,0.7)';
  const fg = rank <= 3 ? '#ffd79f' : '#d7d7e0';
  return (
    <View
      style={{
        minWidth: 34,
        paddingHorizontal: 8,
        paddingVertical: 6,
        backgroundColor: bg,
        borderRadius: 999,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
      }}
    >
      <Text style={{ color: fg, fontWeight: '900', fontSize: 12 }}>#{rank}</Text>
    </View>
  );
}
