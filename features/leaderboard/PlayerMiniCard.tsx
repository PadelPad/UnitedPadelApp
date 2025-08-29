// features/leaderboard/PlayerMiniCard.tsx
import React from 'react';
import { View, Text, Image } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { radii } from '@/lib/theme';

export default function PlayerMiniCard({
  rank,
  username,
  avatar_url,
  rating,
  club,
  badges_count = 0,
}: {
  rank: number;
  username: string;
  avatar_url?: string | null;
  rating: number;
  club?: string;
  badges_count?: number;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: '#0e1116',
        borderWidth: 1,
        borderColor: '#1f2630',
        borderRadius: radii.lg,
        padding: 12,
      }}
    >
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          backgroundColor: '#161b22',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ color: '#9aa0a6', fontWeight: '800' }}>#{rank}</Text>
      </View>

      {avatar_url ? (
        <Image
          source={{ uri: avatar_url }}
          resizeMode="cover"
          style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: '#11161f' }}
        />
      ) : (
        <View
          style={{
            width: 42,
            height: 42,
            borderRadius: 21,
            backgroundColor: '#11161f',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="person" size={18} color="#9aa0a6" />
        </View>
      )}

      <View style={{ flex: 1 }}>
        <Text style={{ color: '#fff', fontWeight: '800' }} numberOfLines={1}>{username}</Text>
        <Text style={{ color: '#9aa0a6', fontSize: 12 }} numberOfLines={1}>
          {club ?? '—'}
        </Text>
      </View>

      <View
        style={{
          paddingHorizontal: 10,
          paddingVertical: 6,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: '#293241',
          backgroundColor: '#161b22',
          flexDirection: 'row',
          gap: 6,
          alignItems: 'center',
        }}
      >
        <Ionicons name="trophy" size={14} color="#ffb86b" />
        <Text style={{ color: '#ffb86b', fontWeight: '900' }}>{rating}</Text>
      </View>
    </View>
  );
}
