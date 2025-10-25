// components/cards/MiniLeaderboardRow.tsx
import React from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';

type MiniProps = {
  rank: number;
  name: string;
  avatarUrl?: string | null;
  subtext?: string | null; // region or club
  rating: number;
  onPress?: () => void;
};

export default function MiniLeaderboardRow({
  rank, name, avatarUrl, subtext, rating, onPress,
}: MiniProps) {
  return (
    <Pressable onPress={onPress} style={styles.row}>
      <View style={styles.rankPill}>
        <Text style={styles.rankText}>#{rank}</Text>
      </View>

      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.placeholder]} />
      )}

      <View style={{ flex: 1 }}>
        <Text numberOfLines={1} style={styles.name}>{name}</Text>
        {!!subtext && <Text numberOfLines={1} style={styles.meta}>{subtext}</Text>}
      </View>

      <View style={{ alignItems: 'flex-end' }}>
        <Text style={styles.rating}>{Math.round(rating)}</Text>
        <Text style={styles.elo}>ELO</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    backgroundColor: 'rgba(62,28,12,0.45)',
    borderRadius: 22,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rankPill: {
    backgroundColor: 'rgba(55,45,35,0.65)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    marginRight: 6,
  },
  rankText: { color: '#f3d7a2', fontWeight: '800', fontSize: 13 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#333' },
  placeholder: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  name: { color: '#fff', fontWeight: '800', fontSize: 17, maxWidth: 210 },
  meta: { color: 'rgba(255,255,255,0.7)', marginTop: 2, fontSize: 12 },
  rating: { color: '#f2d2a0', fontWeight: '900', fontSize: 20, letterSpacing: 0.2 },
  elo: { color: 'rgba(255,255,255,0.55)', fontSize: 11, marginTop: -2 },
});
