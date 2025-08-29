// app/(tabs)/tournaments/index.tsx
import React from 'react';
import { View, Text, FlatList, RefreshControl } from 'react-native';
import { useTournaments } from '@/features/tournaments/hooks';
import TournamentCard from '@/features/tournaments/TournamentCard';
import { colors } from '@/lib/theme';

export default function TournamentsTab() {
  const q = useTournaments();

  return (
    <View style={{ flex: 1, backgroundColor: '#0b0e13' }}>
      <View style={{ padding: 16 }}>
        <Text style={{ color: '#fff', fontSize: 24, fontWeight: '900' }}>Tournaments</Text>
        <Text style={{ color: '#9aa0a6' }}>Upcoming and recent events.</Text>
      </View>

      <FlatList
        data={q.data ?? []}
        keyExtractor={(t) => t.id}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        refreshControl={
          <RefreshControl tintColor={colors.primary} refreshing={q.isFetching} onRefresh={q.refetch} />
        }
        ListEmptyComponent={
          <Text style={{ color: '#9aa0a6', paddingHorizontal: 16 }}>
            {q.isLoading ? 'Loading…' : 'No tournaments yet.'}
          </Text>
        }
        renderItem={({ item }) => <TournamentCard t={item} />}
      />
    </View>
  );
}
