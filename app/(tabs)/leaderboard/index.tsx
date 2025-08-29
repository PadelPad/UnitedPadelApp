// app/(tabs)/leaderboard/index.tsx
import React, { useMemo, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, Pressable, FlatList, ActivityIndicator,
  ScrollView, RefreshControl, Modal, Dimensions
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

import PlayerCardFront from '@/components/cards/PlayerCardFront';
import PlayerCardBack from '@/components/cards/PlayerCardBack';
import MiniCard from '@/components/cards/MiniCard';
import FlipCard from '@/components/cards/FlipCard';

const cardGold = require('@/assets/cards/goldcard.png');
const cardSilver = require('@/assets/cards/silvercard.png');
const cardBronze = require('@/assets/cards/bronzecard.png');
const cardGeneric = require('@/assets/cards/backgroundfill.jpg');

type LbRow = {
  id: string | null;               // allow null just in case
  username: string | null;
  avatar_url: string | null;
  rating: number | null;
  gender: string | null;
  region_id: string | null;
  region_name: string | null;
  club_id?: string | null;
  club_name?: string | null;
};

type Region = { id: string; name: string };
type Club = { id: string; name: string; subscription_tier: string };
type Mode = 'overall' | 'region' | 'club' | 'friends';
type Timeframe = 'all' | 'month' | 'week';

const PAGE_SIZE = 30;
const W = Dimensions.get('window').width;

function bgForRank(rank?: number) {
  if (rank === 1) return cardGold;
  if (rank === 2) return cardSilver;
  if (rank === 3) return cardBronze;
  return cardGeneric;
}

async function fetchRegions(): Promise<Region[]> {
  const { data, error } = await supabase.from('regions').select('id,name').order('name');
  if (error) throw error;
  return data ?? [];
}
async function fetchClubs(): Promise<Club[]> {
  const { data, error } = await supabase
    .from('clubs')
    .select('id,name,subscription_tier')
    .in('subscription_tier', ['plus','elite'])
    .order('name');
  if (error) throw error;
  return (data ?? []) as Club[];
}

/** real stats for a player (matches / wins / win% / streak) */
async function fetchPlayerStats(userId: string) {
  const { data: mpRows, error: mpErr } = await supabase
    .from('match_players')
    .select('match_id, team_number, is_winner, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(400);
  if (mpErr) throw mpErr;

  if (!mpRows?.length) return { matches: 0, wins: 0, winRatePct: 0, streak: 0 };

  const matchIds = Array.from(new Set(mpRows.map((r: any) => r.match_id)));
  const { data: matches, error: mErr } = await supabase
    .from('matches')
    .select('id, created_at, status, finalized, finalized_at, winner_team, winning_team')
    .in('id', matchIds);
  if (mErr) throw mErr;

  const matchMap = new Map<string, any>();
  (matches ?? []).forEach((m) => matchMap.set(m.id, m));

  const byDate = [...mpRows].sort((a: any, b: any) => {
    const ma = matchMap.get(a.match_id);
    const mb = matchMap.get(b.match_id);
    const ta = new Date(ma?.created_at ?? a.created_at ?? 0).getTime();
    const tb = new Date(mb?.created_at ?? b.created_at ?? 0).getTime();
    return tb - ta;
  });

  const isFinalized = (m: any) => {
    const status = (m?.status || '').toLowerCase();
    return (
      m?.finalized === true ||
      !!m?.finalized_at ||
      status === 'finalized' ||
      status === 'completed' ||
      status === 'complete' ||
      m?.winner_team != null ||
      m?.winning_team != null
    );
  };

  let matchesCount = 0;
  let winsCount = 0;

  for (const row of byDate) {
    const m = matchMap.get(row.match_id);
    if (!m || !isFinalized(m)) continue;
    matchesCount++;
    const winnerTeam = m?.winner_team ?? m?.winning_team ?? null;
    const won = row.is_winner === true || (typeof winnerTeam === 'number' && winnerTeam === row.team_number);
    if (won) winsCount++;
  }

  // current streak (most recent finalized first)
  let streak = 0;
  for (const row of byDate) {
    const m = matchMap.get(row.match_id);
    if (!m || !isFinalized(m)) continue;
    const winnerTeam = m?.winner_team ?? m?.winning_team ?? null;
    const won = row.is_winner === true || (typeof winnerTeam === 'number' && winnerTeam === row.team_number);
    if (won) streak++; else break;
  }

  const winRatePct = matchesCount ? Math.round((winsCount / matchesCount) * 100) : 0;
  return { matches: matchesCount, wins: winsCount, winRatePct, streak };
}

async function fetchLeaderboardPage({
  mode, timeframe, gender, regionId, clubId, from, to,
}: {
  mode: Mode; timeframe: Timeframe; gender: 'all'|'male'|'female';
  regionId: 'all'|string; clubId: 'all'|string; from: number; to: number;
}): Promise<{ rows: LbRow[]; from: number; to: number }> {
  const tryOrder: string[] = (() => {
    if (mode === 'club') {
      if (timeframe === 'week') return ['club_leaderboard_week','club_leaderboard_all','leaderboard_view','leaderboard'];
      if (timeframe === 'month') return ['club_leaderboard_month','club_leaderboard_all','leaderboard_view','leaderboard'];
      return ['club_leaderboard_all','leaderboard_view','leaderboard'];
    }
    return ['leaderboard_view','leaderboard'];
  })();

  let friendIds: string[] | null = null;
  if (mode === 'friends') {
    try {
      const { data: auth } = await supabase.auth.getUser();
      const me = auth?.user?.id;
      if (me) {
        const { data: edges } = await supabase
          .from('friendships')
          .select('user_id,friend_id,status')
          .or(`user_id.eq.${me},friend_id.eq.${me}`)
          .eq('status','accepted');
        const ids = new Set<string>();
        (edges ?? []).forEach((e: any) => { if (e.user_id === me) ids.add(e.friend_id); else ids.add(e.user_id); });
        friendIds = Array.from(ids);
      } else friendIds = [];
    } catch { friendIds = []; }
  }

  for (const viewName of tryOrder) {
    try {
      let q: any = (supabase.from as any)(viewName)
        .select('*', { count: 'exact' })
        .order('rating', { ascending: false })
        .range(from, to);

      if (gender !== 'all') q = q.eq('gender', gender);
      if (mode === 'region' && regionId !== 'all') q = q.eq('region_id', regionId);
      if (mode === 'club' && clubId !== 'all') q = q.eq('club_id', clubId);
      if (mode === 'friends') {
        if (friendIds && friendIds.length) q = q.in('id', friendIds);
        else q = q.in('id', ['00000000-0000-0000-0000-000000000000']);
      }

      const { data, error } = await q;
      if (error) throw error;
      return { rows: (data ?? []) as LbRow[], from, to };
    } catch {
      // try next view
    }
  }
  return { rows: [], from, to };
}

export default function LeaderboardScreen() {
  const [mode, setMode] = useState<Mode>('overall');
  const [gender, setGender] = useState<'all'|'male'|'female'>('all');
  const [regionId, setRegionId] = useState<'all'|string>('all');
  const [clubId, setClubId] = useState<'all'|string>('all');
  const [timeframe, setTimeframe] = useState<Timeframe>('all');

  const { data: regions = [], isLoading: loadingRegions, refetch: refetchRegions, isRefetching: refetchingRegions } =
    useQuery({ queryKey: ['regions'], queryFn: fetchRegions, staleTime: 6e5 });

  const { data: clubs = [], isLoading: loadingClubs, refetch: refetchClubs, isRefetching: refetchingClubs } =
    useQuery({ queryKey: ['clubs-plus-elite'], queryFn: fetchClubs, staleTime: 6e5 });

  const {
    data, isLoading, isFetchingNextPage, isRefetching,
    fetchNextPage, refetch, hasNextPage, error,
  } = useInfiniteQuery({
    queryKey: ['leaderboard', mode, gender, regionId, clubId, timeframe],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const from = typeof pageParam === 'number' ? pageParam : 0;
      const to = from + PAGE_SIZE - 1;
      return fetchLeaderboardPage({ mode, timeframe, gender, regionId, clubId, from, to });
    },
    getNextPageParam: (last) => (last.rows.length < PAGE_SIZE ? undefined : last.to + 1),
  });

  // ---- MAKE KEYS STABLE + DEDUPE ACROSS PAGES ----
  const players: LbRow[] = useMemo(() => {
    const seen = new Set<string>();
    const out: LbRow[] = [];
    for (const page of data?.pages ?? []) {
      for (const row of page.rows ?? []) {
        const k = row.id ?? `anon-${out.length}`;
        if (!seen.has(k)) { seen.add(k); out.push(row); }
      }
    }
    return out;
  }, [data]);

  const podium = players.slice(0, 3);
  const rest = players.slice(3);

  // modal state + stats for selected player
  const [openId, setOpenId] = useState<string | null>(null);
  const [flipped, setFlipped] = useState(false);
  const openPlayer = players.find(p => p.id === openId) || null;
  const openRank = openPlayer ? players.findIndex(p => p.id === openPlayer.id) + 1 : undefined;
  const { data: selStats, isLoading: loadingSelStats } = useQuery({
    queryKey: ['lb-player-stats', openId],
    queryFn: () => fetchPlayerStats(openId!),
    enabled: !!openId,
    staleTime: 60_000,
  });

  const closeModal = useCallback(() => {
    setOpenId(null);
    setFlipped(false);
  }, []);

  const renderHeader = useCallback(() => (
    <View style={S.headerWrap}>
      <Text style={S.h1}>Leaderboard</Text>

      {/* Mode */}
      <View style={[S.filtersRow, { marginBottom: 8 }]}>
        {([
          { key: 'overall', label: 'Overall', icon: 'trophy' },
          { key: 'region', label: 'Region', icon: 'map' },
          { key: 'club', label: 'Club', icon: 'business' },
          { key: 'friends', label: 'Friends', icon: 'people' },
        ] as const).map(m => (
          <Pressable
            key={m.key}
            onPress={() => { setMode(m.key as Mode); }}
            style={[S.segment, mode === m.key && S.segmentActive]}
          >
            <Ionicons name={m.icon as any} size={13} color={mode === m.key ? '#ff6a00' : '#9aa0a6'} style={{ marginRight: 6 }} />
            <Text style={[S.segmentText, mode === m.key && S.segmentTextActive]}>{m.label}</Text>
          </Pressable>
        ))}
      </View>

      {/* Gender */}
      <View style={S.filtersRow}>
        {(['all','male','female'] as const).map(g => (
          <Pressable key={g} onPress={() => setGender(g)} style={[S.pill, gender === g && S.pillActive]}>
            <Text style={[S.pillText, gender === g && S.pillTextActive]}>{g === 'all' ? 'All' : g[0].toUpperCase()+g.slice(1)}</Text>
          </Pressable>
        ))}
      </View>

      {/* Timeframe (club only) */}
      {mode === 'club' ? (
        <View style={[S.filtersRow, { marginTop: 8 }]}>
          {(['week','month','all'] as const).map(t => (
            <Pressable key={t} onPress={() => setTimeframe(t)} style={[S.segment, timeframe === t && S.segmentActive]}>
              <Ionicons name={t === 'all' ? 'infinite' : 'calendar'} size={12} color={timeframe === t ? '#ff6a00' : '#9aa0a6'} style={{ marginRight: 6 }} />
              <Text style={[S.segmentText, timeframe === t && S.segmentTextActive]}>{t === 'all' ? 'All-time' : t === 'month' ? 'Monthly' : 'Weekly'}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {/* Region filter */}
      {mode === 'region' ? (
        <View style={{ gap: 8, marginTop: 12 }}>
          <Text style={S.filterLabel}>Region</Text>
          {loadingRegions && !regions.length ? (
            <ActivityIndicator color="#ff6a00" />
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 2 }}>
              <Pressable key="all-regions" onPress={() => setRegionId('all')} style={[S.pill, regionId === 'all' && S.pillActive]}>
                <Text style={[S.pillText, regionId === 'all' && S.pillTextActive]}>All</Text>
              </Pressable>
              {regions.map(r => (
                <Pressable key={r.id} onPress={() => setRegionId(r.id)} style={[S.pill, regionId === r.id && S.pillActive]}>
                  <Text style={[S.pillText, regionId === r.id && S.pillTextActive]}>{r.name}</Text>
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>
      ) : null}

      {/* Club filter */}
      {mode === 'club' ? (
        <View style={{ gap: 8, marginTop: 12 }}>
          <Text style={S.filterLabel}>Club (Plus & Elite only)</Text>
          {loadingClubs && !clubs.length ? (
            <ActivityIndicator color="#ff6a00" />
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 2 }}>
              <Pressable key="all-clubs" onPress={() => setClubId('all')} style={[S.pill, clubId === 'all' && S.pillActive]}>
                <Text style={[S.pillText, clubId === 'all' && S.pillTextActive]}>All clubs</Text>
              </Pressable>
              {clubs.map(c => (
                <Pressable key={c.id} onPress={() => setClubId(c.id)} style={[S.pill, clubId === c.id && S.pillActive]}>
                  <Text style={[S.pillText, clubId === c.id && S.pillTextActive]}>{c.name}</Text>
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>
      ) : null}

      {/* Podium (Top 3) — tap to expand modal */}
      {podium.length ? (
        <View style={{ marginTop: 14, gap: 10 }}>
          <Text style={{ color: '#fff', fontWeight: '900' }}>Podium</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {podium.map((p, i) => {
              const rank = i + 1;
              const width = (W - 16*2 - 10*2) / 3;
              const height = Math.round(width * 1.45);
              return (
                <Pressable
                  key={`${p.id ?? 'anon'}-${i}`}
                  onPress={() => setOpenId(p.id ?? null)}
                  style={{ width, height }}
                  accessibilityRole="button"
                >
                  <PlayerCardFront
                    bg={bgForRank(rank)}
                    width={width}
                    height={height}
                    rank={rank}
                    username={p.username || 'Player'}
                    region={p.region_name}
                    rating={p.rating ?? 1000}
                    avatarUrl={p.avatar_url}
                    compact
                    shine
                  />
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}
    </View>
  ), [mode, gender, regions, loadingRegions, regionId, clubs, loadingClubs, clubId, timeframe, podium]);
  // -----------------------------------------------

  const onEndReached = () => { if (hasNextPage && !isFetchingNextPage) fetchNextPage(); };
  const onRefresh = () => { refetch(); refetchRegions(); refetchClubs(); };

  return (
    <View style={{ flex: 1, backgroundColor: '#0b0e13' }}>
      <FlatList
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        ListHeaderComponent={renderHeader}
        stickyHeaderIndices={[0]}
        data={rest}
        keyExtractor={(p, index) => (p.id ?? `row-${index}`)}
        renderItem={({ item, index }) => {
          const rank = index + 4;
          return (
            <MiniCard
              bg={bgForRank(rank)}
              rank={rank}
              username={item.username || 'Player'}
              region={item.region_name}
              rating={item.rating ?? 1000}
              avatarUrl={item.avatar_url}
              onPress={() => setOpenId(item.id ?? null)}
            />
          );
        }}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListEmptyComponent={
          isLoading ? (
            <View style={{ paddingVertical: 24 }}><ActivityIndicator color="#ff6a00" /></View>
          ) : error ? (
            <Text style={{ color: '#ff9aa2' }}>Failed to load leaderboard.</Text>
          ) : (
            <Text style={{ color: '#9aa0a6' }}>No players yet.</Text>
          )
        }
        ListFooterComponent={isFetchingNextPage ? <View style={{ paddingVertical: 16 }}><ActivityIndicator color="#ff6a00" /></View> : null}
        onEndReachedThreshold={0.4}
        onEndReached={onEndReached}
        refreshControl={<RefreshControl refreshing={isRefetching || refetchingRegions || refetchingClubs} onRefresh={onRefresh} tintColor="#fff" />}
      />

      {/* Full-card modal for selected player (tap to flip via long-press as well) */}
      <Modal visible={!!openId} animationType="fade" onRequestClose={closeModal} transparent>
        <View style={S.modalWrap}>
          {openPlayer ? (
            <Pressable
              onLongPress={() => setFlipped(v => !v)}
              accessibilityLabel="Flip card"
            >
              <FlipCard
                flipped={flipped}
                onFlip={setFlipped}
                width={Math.min(W - 40, 360)}
                height={Math.round(Math.min(W - 40, 360) * 1.45)}
                front={
                  <PlayerCardFront
                    bg={bgForRank(openRank)}
                    width={Math.min(W - 40, 360)}
                    height={Math.round(Math.min(W - 40, 360) * 1.45)}
                    rank={openRank}
                    username={openPlayer.username || 'Player'}
                    region={openPlayer.region_name}
                    rating={openPlayer.rating ?? 1000}
                    avatarUrl={openPlayer.avatar_url}
                    shine={!!openRank && openRank <= 3}
                  />
                }
                back={
                  <PlayerCardBack
                    bg={bgForRank(openRank)}
                    width={Math.min(W - 40, 360)}
                    height={Math.round(Math.min(W - 40, 360) * 1.45)}
                    region={openPlayer.region_name}
                    gender={openPlayer.gender || undefined}
                    preferred={null}
                    stats={
                      loadingSelStats || !selStats
                        ? { matches: 0, wins: 0, winRatePct: 0, streak: 0 }
                        : selStats
                    }
                  />
                }
              />
            </Pressable>
          ) : null}

          <Pressable onPress={closeModal} style={S.closeBtn} accessibilityRole="button">
            <Ionicons name="close" size={22} color="#0b0e13" />
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}

const S = StyleSheet.create({
  headerWrap: { backgroundColor: '#0b0e13', paddingBottom: 12 },
  h1: { color: '#fff', fontSize: 28, fontWeight: '900', marginBottom: 8 },
  filterLabel: { color: '#9aa0a6', fontWeight: '700', marginLeft: 2 },
  filtersRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  pill: { borderWidth: 1, borderColor: '#28303a', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#0e1116' },
  pillActive: { borderColor: '#ff6a00', backgroundColor: '#141821' },
  pillText: { color: '#9aa0a6', fontWeight: '700' },
  pillTextActive: { color: '#ff6a00' },
  segment: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#28303a', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#0e1116' },
  segmentActive: { borderColor: '#ff6a00', backgroundColor: '#141821' },
  segmentText: { color: '#9aa0a6', fontWeight: '700', fontSize: 12 },
  segmentTextActive: { color: '#ff6a00' },

  modalWrap: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.72)',
    alignItems: 'center', justifyContent: 'center',
    padding: 20,
  },
  closeBtn: {
    marginTop: 16, backgroundColor: '#ffd79f', borderRadius: 999, padding: 10,
    borderWidth: 2, borderColor: '#332317',
  },
});
