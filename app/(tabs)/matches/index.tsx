import React, { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

type RecentMatch = {
  id: string;
  played_at: string | null;
  score: string | null;
  match_type: string | null;
  match_level: string | null;
};

type PendingConf = {
  id: string;
  match_id: string;
  responded_at: string | null;
};

async function getMe() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user;
}

async function fetchPendingConfirmations(userId: string | undefined) {
  if (!userId) return [];
  const { data, error } = await supabase
    .from('match_confirmations')
    .select('id, match_id, responded_at')
    .eq('user_id', userId)
    .eq('confirmed', false)
    .eq('rejected', false)
    .order('created_at', { ascending: false })
    .limit(10);
  if (error) throw error;
  return (data ?? []) as PendingConf[];
}

async function fetchRecentMatches(userId: string | undefined) {
  if (!userId) return [];
  const { data, error } = await supabase
    .from('matches')
    .select('id, played_at, score, match_type, match_level')
    .or(`created_by.eq.${userId},submitted_by.eq.${userId}`)
    .order('played_at', { ascending: false })
    .limit(15);
  if (error) throw error;
  return (data ?? []) as RecentMatch[];
}

export default function MatchesScreen() {
  const router = useRouter();

  const { data: me } = useQuery({ queryKey: ['me'], queryFn: getMe });
  const userId = me?.id;

  const {
    data: pending = [],
    isLoading: loadingPending,
    isFetching: fetchingPending,
    refetch: refetchPending,
  } = useQuery({
    queryKey: ['pending-confirmations', userId],
    queryFn: () => fetchPendingConfirmations(userId),
    enabled: !!userId,
  });

  const {
    data: recent = [],
    isLoading: loadingRecent,
    isFetching: fetchingRecent,
    refetch: refetchRecent,
  } = useQuery({
    queryKey: ['recent-matches', userId],
    queryFn: () => fetchRecentMatches(userId),
    enabled: !!userId,
  });

  const refreshing = fetchingPending || fetchingRecent;

  const onRefresh = useCallback(() => {
    refetchPending();
    refetchRecent();
  }, [refetchPending, refetchRecent]);

  const showEmpty = useMemo(
    () => !loadingPending && !loadingRecent && pending.length === 0 && recent.length === 0,
    [loadingPending, loadingRecent, pending.length, recent.length]
  );

  const onSubmitPress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/submit');
  };

  const onScanPress = async () => {
    await Haptics.selectionAsync();
    // keep your existing route — QR lives inside Submit flow
    router.push('/submit/scan');
  };

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: '#0b0e13' }}
      contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 24 }}
      data={recent}
      keyExtractor={(m) => m.id}
      refreshControl={
        <RefreshControl tintColor="#ff6a00" refreshing={!!refreshing} onRefresh={onRefresh} />
      }
      ListHeaderComponent={
        <View style={{ gap: 16 }}>
          <Text style={styles.h1}>Matches</Text>

          {/* Hero card with subtle gradient */}
          <LinearGradient
            colors={['#11161f', '#0e1116']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <MaterialCommunityIcons name="lightning-bolt" size={20} color="#ffb86b" />
              <Text style={styles.heroTitle}>Record a new match</Text>
            </View>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
              <Pressable style={styles.primaryBtn} onPress={onSubmitPress} accessibilityRole="button">
                <Ionicons name="add-circle" size={18} color="#0b0e13" />
                <Text style={styles.primaryBtnText}>Submit Match</Text>
              </Pressable>

              <Pressable style={styles.secondaryBtn} onPress={onScanPress} accessibilityRole="button">
                <Ionicons name="qr-code" size={16} color="#ff6a00" />
                <Text style={styles.secondaryBtnText}>Scan QR</Text>
              </Pressable>
            </View>
          </LinearGradient>

          {/* Pending confirmations */}
          <Text style={styles.sectionTitle}>Pending confirmations</Text>
          {loadingPending ? (
            <ActivityIndicator color="#ff6a00" />
          ) : pending.length === 0 ? (
            <Text style={styles.muted}>None right now.</Text>
          ) : (
            pending.map((p) => (
              <Pressable
                key={p.id}
                onPress={() => router.push(`/match/${p.match_id}`)}
                style={styles.rowCard}
              >
                <View style={styles.ball} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>Match requires your confirmation</Text>
                  <Text style={styles.rowMeta}>
                    {p.responded_at ? 'Awaiting others' : 'Awaiting your response'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#9aa0a6" />
              </Pressable>
            ))
          )}

          {/* Recent header */}
          <Text style={styles.sectionTitle}>Recent</Text>
          {loadingRecent && <ActivityIndicator color="#ff6a00" />}
        </View>
      }
      renderItem={({ item }) => (
        <Pressable
          onPress={() => router.push(`/match/${item.id}`)}
          style={styles.rowCard}
          accessibilityRole="button"
        >
          <View style={styles.ball} />
          <View style={{ flex: 1 }}>
            <Text numberOfLines={1} style={styles.rowTitle}>
              {item.match_type || 'Match'} · {item.match_level || 'friendly'}
            </Text>
            <Text style={styles.rowMeta}>
              {item.played_at ? new Date(item.played_at).toLocaleDateString() : 'TBA'} ·{' '}
              {item.score || '—'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#9aa0a6" />
        </Pressable>
      )}
      ListEmptyComponent={
        showEmpty ? (
          <View style={{ paddingTop: 8 }}>
            <Text style={styles.muted}>No matches yet. Submit your first match!</Text>
          </View>
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  h1: { color: '#fff', fontSize: 28, fontWeight: '900' },

  heroCard: {
    borderWidth: 1,
    borderColor: '#1f2630',
    borderRadius: 14,
    padding: 14,
  },
  heroTitle: { color: '#ffb86b', fontWeight: '800' },

  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ff6a00',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  primaryBtnText: { color: '#0b0e13', fontWeight: '800' },

  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0e1116',
    borderWidth: 1,
    borderColor: '#ff6a00',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  secondaryBtnText: { color: '#ff6a00', fontWeight: '700' },

  sectionTitle: { marginTop: 12, color: '#fff', fontWeight: '800', fontSize: 18 },

  muted: { color: '#9aa0a6' },

  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#0e1116',
    borderWidth: 1,
    borderColor: '#1f2630',
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  ball: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ffcc66',
  },
  rowTitle: { color: '#fff', fontWeight: '700' },
  rowMeta: { color: '#9aa0a6', fontSize: 12 },
});
