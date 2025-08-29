// app/match/[id].tsx
import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useConfirmMatch, useRejectMatch, useFinalizeMatch } from '@/features/matches/hooks';

// ---------- Types ----------
type MatchRow = {
  id: string;
  score: string | null;
  played_at: string | null;
  match_type: string | null;
  match_level: string | null;
  status: string | null;
  winning_team: 1 | 2 | null;
};

type Participant = {
  user_id: string;
  team_number: 1 | 2;
  username: string | null;
  avatar_url: string | null;
  rating: number | null;
};

type Confirmation = {
  user_id: string;
  confirmed: boolean;
  rejected: boolean;
  responded_at: string | null;
};

// ---------- Data fetchers ----------
async function fetchMatch(matchId: string) {
  const { data, error } = await supabase
    .from('matches')
    .select('id, score, played_at, match_type, match_level, status, winning_team')
    .eq('id', matchId)
    .single();
  if (error) throw error;
  return data as MatchRow;
}

async function fetchParticipants(matchId: string) {
  const { data, error } = await supabase
    .from('match_players')
    .select('user_id, team_number, profiles(id, username, avatar_url, rating)')
    .eq('match_id', matchId);

  if (error) throw error;

  const rows = (data ?? []) as any[];

  const participants: Participant[] = rows.map((r) => {
    // Supabase can return profiles as an object; in some mis-typed cases you may see an array.
    const profRaw = r?.profiles;
    const prof = Array.isArray(profRaw) ? profRaw[0] : profRaw;

    return {
      user_id: String(r.user_id),
      team_number: (Number(r.team_number) === 2 ? 2 : 1) as 1 | 2,
      username: (prof?.username ?? null) as string | null,
      avatar_url: (prof?.avatar_url ?? null) as string | null,
      rating: typeof prof?.rating === 'number' ? prof.rating : (prof?.rating ? Number(prof.rating) : 1000),
    };
  });

  return participants;
}

async function fetchConfirmations(matchId: string) {
  const { data, error } = await supabase
    .from('match_confirmations')
    .select('user_id, confirmed, rejected, responded_at')
    .eq('match_id', matchId);
  if (error) throw error;
  return (data ?? []) as Confirmation[];
}

async function fetchMe() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user;
}

// ---------- Helpers ----------
function initials(name?: string | null) {
  if (!name) return 'UP';
  const parts = name.trim().split(/\s|_/).filter(Boolean);
  const a = (parts[0]?.[0] || '').toUpperCase();
  const b = (parts[1]?.[0] || '').toUpperCase();
  return (a + b) || 'UP';
}

// simplistic set winner parser; if it can’t parse, returns null
function winnerFromScore(score: string | null): 1 | 2 | null {
  if (!score) return null;
  try {
    const sets = score.split(',').map((s) => s.trim());
    let t1 = 0;
    let t2 = 0;
    for (const set of sets) {
      const m = set.match(/(\d+)\s*-\s*(\d+)/);
      if (!m) continue;
      const a = parseInt(m[1], 10);
      const b = parseInt(m[2], 10);
      if (a > b) t1++;
      if (b > a) t2++;
    }
    if (t1 === t2) return null;
    return t1 > t2 ? 1 : 2;
  } catch {
    return null;
  }
}

function kForLevel(level: string | null | undefined) {
  const map: Record<string, number> = {
    friendly: 16,
    club: 32,
    league: 32,
    tournament: 50,
    corporate: 25,
    national: 75,
  };
  const key = (level || '').toLowerCase();
  return map[key] ?? 32;
}

// team-level expected score, team ratings as averages
function expectedTeam1(r1: number, r2: number) {
  return 1 / (1 + Math.pow(10, (r2 - r1) / 400));
}

function avg(arr: (number | null | undefined)[]) {
  const vals = arr.map((v) => (typeof v === 'number' ? v : 1000));
  return vals.reduce((a, b) => a + b, 0) / Math.max(1, vals.length);
}

// ---------- Mini components ----------
function Avatar({ uri, label, size = 44 }: { uri?: string | null; label?: string | null; size?: number }) {
  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: '#11161f' }}
      />
    );
  }
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: '#11161f',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ color: '#fff', fontWeight: '900' }}>{initials(label)}</Text>
    </View>
  );
}

// ---------- Screen ----------
export default function MatchScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const matchId = id!;
  const router = useRouter();

  const { data: me } = useQuery({ queryKey: ['me'], queryFn: fetchMe });

  const {
    data: match,
    isLoading: loadingMatch,
    refetch: refetchMatch,
  } = useQuery({ queryKey: ['match', matchId], queryFn: () => fetchMatch(matchId) });

  const {
    data: players = [],
    isLoading: loadingPlayers,
    refetch: refetchPlayers,
  } = useQuery({ queryKey: ['match-players', matchId], queryFn: () => fetchParticipants(matchId) });

  const {
    data: confirmations = [],
    isLoading: loadingConfirmations,
    refetch: refetchConfs,
  } = useQuery({
    queryKey: ['match-confirmations', matchId],
    queryFn: () => fetchConfirmations(matchId),
  });

  const confirmMut = useConfirmMatch();
  const rejectMut = useRejectMatch();
  const finalizeMut = useFinalizeMatch();

  const myUserId = me?.id;

  const team1 = useMemo(
    () => players.filter((p) => p.team_number === 1),
    [players]
  );
  const team2 = useMemo(
    () => players.filter((p) => p.team_number === 2),
    [players]
  );

  const myPending = useMemo(() => {
    if (!myUserId) return null;
    const row = confirmations.find((c) => c.user_id === myUserId);
    if (!row) return 'pending';
    if (row.confirmed) return 'confirmed';
    if (row.rejected) return 'rejected';
    return 'pending';
  }, [confirmations, myUserId]);

  const allConfirmed = useMemo(() => {
    if (!players.length) return false;
    const ids = new Set(players.map((p) => p.user_id));
    return Array.from(ids).every((uid) => {
      const row = confirmations.find((c) => c.user_id === uid);
      return row?.confirmed === true && row?.rejected !== true;
    });
  }, [players, confirmations]);

  const effectiveWinner =
    match?.winning_team ?? winnerFromScore(match?.score ?? null);

  const k = kForLevel(match?.match_level);
  const t1Avg = avg(team1.map((p) => p.rating));
  const t2Avg = avg(team2.map((p) => p.rating));
  const expT1 = expectedTeam1(t1Avg, t2Avg);
  const delta = k * ((effectiveWinner === 1 ? 1 : 0) - expT1);

  // projected ratings if the *current* result stands (effectiveWinner)
  const projections = useMemo(() => {
    if (!effectiveWinner || players.length === 0) return null;
    return {
      team1: team1.map((p) => ({
        id: p.user_id,
        before: p.rating ?? 1000,
        after: (p.rating ?? 1000) + delta,
      })),
      team2: team2.map((p) => ({
        id: p.user_id,
        before: p.rating ?? 1000,
        after: (p.rating ?? 1000) - delta,
      })),
      delta,
      expT1,
      k,
    };
  }, [effectiveWinner, team1, team2, delta, expT1, k, players.length]);

  async function onConfirm() {
    if (!myUserId) return;
    try {
      await confirmMut.mutateAsync({ matchId, userId: myUserId });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      refetchConfs();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to confirm.');
    }
  }

  async function onReject() {
    if (!myUserId) return;
    try {
      await rejectMut.mutateAsync({ matchId, userId: myUserId });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      refetchConfs();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to reject.');
    }
  }

  async function onFinalize() {
    try {
      await finalizeMut.mutateAsync(matchId);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      await Promise.all([refetchMatch(), refetchPlayers()]);
      Alert.alert('Match finalized', 'Ratings updated.');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to finalize.');
    }
  }

  if (loadingMatch || loadingPlayers || loadingConfirmations) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#ff6a00" />
      </View>
    );
  }

  if (!match) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Match not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#0b0e13' }} contentContainerStyle={{ padding: 16, gap: 14 }}>
      {/* Header */}
      <Pressable onPress={() => router.back()} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Ionicons name="chevron-back" size={18} color="#9aa0a6" />
        <Text style={{ color: '#9aa0a6' }}>Back</Text>
      </Pressable>

      <Text style={styles.h1}>Match</Text>
      <View style={styles.metaCard}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <MaterialCommunityIcons name="tennis" size={20} color="#ffb86b" />
          <Text style={styles.metaTitle}>
            {match.match_type || 'Match'} · {match.match_level || 'friendly'}
          </Text>
        </View>
        <Text style={styles.meta}>
          {match.played_at ? new Date(match.played_at).toLocaleString() : 'TBA'} ·{' '}
          {match.score || '—'}
        </Text>
        <Text style={[styles.meta, { marginTop: 4 }]}>
          Status: <Text style={{ color: '#fff' }}>{match.status || 'pending'}</Text>
        </Text>
      </View>

      {/* Teams */}
      <View style={styles.teamsRow}>
        <View style={styles.teamCard}>
          <Text style={styles.teamTitle}>Team 1</Text>
          {team1.map((p) => (
            <View key={p.user_id} style={styles.playerRow}>
              <Avatar uri={p.avatar_url} label={p.username} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text numberOfLines={1} style={styles.playerName}>
                  {p.username || 'Player'}
                </Text>
                <Text style={styles.playerMeta}>Rating: {Math.round(p.rating ?? 1000)}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.teamCard}>
          <Text style={styles.teamTitle}>Team 2</Text>
          {team2.map((p) => (
            <View key={p.user_id} style={styles.playerRow}>
              <Avatar uri={p.avatar_url} label={p.username} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text numberOfLines={1} style={styles.playerName}>
                  {p.username || 'Player'}
                </Text>
                <Text style={styles.playerMeta}>Rating: {Math.round(p.rating ?? 1000)}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Projections */}
      {projections ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Projected rating change</Text>
          <Text style={styles.subtle}>
            K={k} • Expected Team1={expT1.toFixed(2)} • Winner={effectiveWinner === 1 ? 'Team 1' : 'Team 2'}
          </Text>
          <View style={{ height: 8 }} />
          {[{ label: 'Team 1', list: projections.team1 }, { label: 'Team 2', list: projections.team2 }].map(
            (blk) => (
              <View key={blk.label} style={{ marginBottom: 10 }}>
                <Text style={styles.teamTitle}>{blk.label}</Text>
                {blk.list.map((pl) => (
                  <View key={pl.id} style={styles.projRow}>
                    <Text style={styles.projText}>
                      {Math.round(pl.before)} →{' '}
                      <Text style={{ color: '#ffb86b', fontWeight: '900' }}>
                        {Math.round(pl.after)}
                      </Text>
                    </Text>
                  </View>
                ))}
              </View>
            )
          )}
        </View>
      ) : (
        <Text style={styles.muted}>
          Projection unavailable (winner unknown). Add a score or winning team to preview changes.
        </Text>
      )}

      {/* My action row */}
      {myUserId ? (
        <View style={{ gap: 10 }}>
          {myPending === 'pending' && (
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Pressable onPress={onConfirm} style={styles.primaryBtn} accessibilityRole="button">
                <Ionicons name="checkmark-circle" size={18} color="#0b0e13" />
                <Text style={styles.primaryBtnText}>Confirm</Text>
              </Pressable>
              <Pressable onPress={onReject} style={styles.secondaryBtn} accessibilityRole="button">
                <Ionicons name="close-circle" size={18} color="#ff6a00" />
                <Text style={styles.secondaryBtnText}>Reject</Text>
              </Pressable>
            </View>
          )}

          {allConfirmed && (match.status === 'pending' || match.status === 'submitted') && (
            <Pressable onPress={onFinalize} style={styles.finalizeBtn} accessibilityRole="button">
              {finalizeMut.isPending ? (
                <ActivityIndicator color="#0b0e13" />
              ) : (
                <Ionicons name="flame" size={18} color="#0b0e13" />
              )}
              <Text style={styles.finalizeText}>Finalize & update ratings</Text>
            </Pressable>
          )}

          {/* Dispute entry */}
          <Pressable
            onPress={() => router.push(`/match/${matchId}/dispute`)}
            style={styles.disputeBtn}
            accessibilityRole="button"
          >
            <Ionicons name="flag-outline" size={18} color="#ffb86b" />
            <Text style={{ color: '#ffb86b', fontWeight: '900' }}>Open a dispute</Text>
          </Pressable>
        </View>
      ) : null}
    </ScrollView>
  );
}

// ---------- Styles ----------
const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: '#0b0e13', alignItems: 'center', justifyContent: 'center' },
  h1: { color: '#fff', fontSize: 26, fontWeight: '900' },
  muted: { color: '#9aa0a6' },

  metaCard: {
    backgroundColor: '#0e1116',
    borderWidth: 1,
    borderColor: '#1f2630',
    borderRadius: 14,
    padding: 14,
  },
  metaTitle: { color: '#ffb86b', fontWeight: '800' },
  meta: { color: '#9aa0a6', marginTop: 4 },

  teamsRow: { flexDirection: 'row', gap: 12 },
  teamCard: {
    flex: 1,
    backgroundColor: '#0e1116',
    borderWidth: 1,
    borderColor: '#1f2630',
    borderRadius: 12,
    padding: 12,
  },
  teamTitle: { color: '#fff', fontWeight: '800', marginBottom: 8 },
  playerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  playerName: { color: '#fff', fontWeight: '800' },
  playerMeta: { color: '#9aa0a6', fontSize: 12 },

  card: {
    backgroundColor: '#0e1116',
    borderWidth: 1,
    borderColor: '#1f2630',
    borderRadius: 12,
    padding: 12,
  },
  cardTitle: { color: '#fff', fontWeight: '900', marginBottom: 2 },
  subtle: { color: '#9aa0a6', fontSize: 12 },

  projRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#10151d',
    borderWidth: 1,
    borderColor: '#1f2630',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginTop: 6,
  },
  projText: { color: '#fff', fontWeight: '700' },

  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#2ecc71',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  primaryBtnText: { color: '#0b0e13', fontWeight: '900' },

  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#181c24',
    borderWidth: 1,
    borderColor: '#ff6a00',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  secondaryBtnText: { color: '#ff6a00', fontWeight: '900' },

  finalizeBtn: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ff6a00',
    paddingVertical: 12,
    borderRadius: 12,
  },
  finalizeText: { color: '#0b0e13', fontWeight: '900' },

  disputeBtn: {
    marginTop: 4,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#141821',
    borderWidth: 1,
    borderColor: '#28303a',
    paddingVertical: 12,
    borderRadius: 12,
  },
});
