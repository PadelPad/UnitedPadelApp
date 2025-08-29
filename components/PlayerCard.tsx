import React from 'react';
import { View, Text, Image, Pressable } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, radii, shadow } from '@/lib/theme';

type Player = {
  id: string;
  username?: string | null;
  avatar_url?: string | null;
  rating?: number | null;
  club?: string | null;
  badges_count?: number | null;
};

export default function PlayerCard({
  player,
  onPress,
  rightSlot,
}: {
  player: Player;
  onPress?: () => void;
  rightSlot?: React.ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: '#0e1116',
        borderWidth: 1,
        borderColor: '#1f2630',
        borderRadius: radii.lg,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        ...shadow.soft,
      }}
    >
      {player.avatar_url ? (
        <Image
          source={{ uri: player.avatar_url }}
          style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#131923' }}
        />
      ) : (
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: '#131923',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="person" size={22} color="#9aa0a6" />
        </View>
      )}

      <View style={{ flex: 1 }}>
        <Text style={{ color: '#fff', fontWeight: '900' }} numberOfLines={1}>
          {player.username || 'Player'}
        </Text>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 2 }}>
          <Text style={{ color: '#9aa0a6', fontSize: 12 }}>
            ⭐ {Math.round(player.rating ?? 1000)}
          </Text>
          {player.badges_count ? (
            <Text style={{ color: '#9aa0a6', fontSize: 12 }}>
              🎖 {player.badges_count}
            </Text>
          ) : null}
          {player.club ? (
            <Text style={{ color: '#9aa0a6', fontSize: 12 }} numberOfLines={1}>
              🏟 {player.club}
            </Text>
          ) : null}
        </View>
      </View>

      {rightSlot}
    </Pressable>
  );
}
