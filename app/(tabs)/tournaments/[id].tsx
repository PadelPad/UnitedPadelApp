import React from 'react';
import { View, Text, Image, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

type Tourn = {
  id: string;
  name: string;
  poster_url: string | null;
  start_date: string | null;
  end_date?: string | null;
  location: string | null;
  description?: string | null;
};

function formatDate(iso?: string | null) {
  if (!iso) return 'TBA';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return 'TBA';
  }
}

export default function TournamentDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const q = useQuery({
    queryKey: ['tournament', id],
    enabled: !!id,
    queryFn: async (): Promise<Tourn | null> => {
      const { data, error } = await supabase
        .from('tournaments')
        .select('id,name,poster_url,start_date,end_date,location,description')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (q.isLoading) {
    return (
      <View style={S.center}>
        <ActivityIndicator color="#ff6a00" />
      </View>
    );
  }

  if (!q.data) {
    return (
      <View style={S.center}>
        <Text style={S.muted}>Tournament not found.</Text>
      </View>
    );
  }

  const t = q.data;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#0b0e13' }} contentContainerStyle={{ padding: 16 }}>
      {t.poster_url ? (
        <Image source={{ uri: t.poster_url }} style={S.poster} resizeMode="cover" />
      ) : (
        <View style={[S.poster, S.posterFallback]}>
          <Text style={{ color: '#9aa0a6' }}>No poster</Text>
        </View>
      )}

      <Text style={S.title}>{t.name}</Text>
      <Text style={S.meta}>
        {formatDate(t.start_date)}
        {t.end_date ? ` – ${formatDate(t.end_date)}` : ''} • {t.location || 'TBA'}
      </Text>

      {t.description ? (
        <Text style={S.body}>{t.description}</Text>
      ) : (
        <Text style={S.muted}>No description provided.</Text>
      )}
    </ScrollView>
  );
}

const S = StyleSheet.create({
  poster: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: '#11161f',
    marginBottom: 12,
  },
  posterFallback: { alignItems: 'center', justifyContent: 'center' },
  title: { color: '#fff', fontSize: 22, fontWeight: '900' },
  meta: { color: '#9aa0a6', marginTop: 4 },
  body: { color: '#e5e7eb', marginTop: 12, lineHeight: 20 },
  muted: { color: '#9aa0a6' },
  center: { flex: 1, backgroundColor: '#0b0e13', alignItems: 'center', justifyContent: 'center' },
});
