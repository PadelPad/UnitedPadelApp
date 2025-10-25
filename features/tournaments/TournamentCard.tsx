// features/tournaments/TournamentCard.tsx
import React from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { Link } from 'expo-router';

export type TournamentCardProps = {
  t: {
    id: string;
    name: string;
    poster_url?: string | null;
    location?: string | null;
    start_date?: string | null;
  };
};

function formatDate(iso?: string | null) {
  if (!iso) return 'TBA';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short' });
  } catch {
    return 'TBA';
  }
}

export default function TournamentCard({ t }: TournamentCardProps) {
  // IMPORTANT: this assumes you have app/tournaments/[id].tsx
  const href = { pathname: '/tournaments/[id]' as const, params: { id: t.id } };

  return (
    <Link href={href} asChild>
      <Pressable style={styles.card} accessibilityRole="button" accessibilityLabel={`Open ${t.name}`}>
        {t.poster_url ? (
          <Image source={{ uri: t.poster_url }} style={styles.poster} resizeMode="cover" />
        ) : (
          <View style={[styles.poster, styles.posterFallback]} />
        )}
        <View style={{ marginTop: 8 }}>
          <Text numberOfLines={1} style={styles.name}>{t.name}</Text>
          <Text style={styles.meta}>{formatDate(t.start_date)} • {t.location || 'TBA'}</Text>
        </View>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0e1116',
    borderWidth: 1,
    borderColor: '#1f2630',
    borderRadius: 12,
    padding: 10,
    width: '100%',
  },
  poster: { width: '100%', height: 120, borderRadius: 10, backgroundColor: '#11161f' },
  posterFallback: { },
  name: { color: '#fff', fontWeight: '800' },
  meta: { color: '#9aa0a6', marginTop: 2, fontSize: 12 },
});
