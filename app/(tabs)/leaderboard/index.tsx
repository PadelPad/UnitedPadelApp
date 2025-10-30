// app/(tabs)/leaderboard/index.tsx
import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  Modal,
  Dimensions,
  TextInput,
  Image,
  ImageBackground,
  type ImageSourcePropType,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { colors } from '@/lib/theme';
import { supabase } from '@/lib/supabase';
import MiniCard from '@/components/cards/MiniCard';
import PlayerCardBack from '@/components/cards/PlayerCardBack';
import FlipCard from '@/components/cards/FlipCard';
import { useDebouncedValue } from '@/lib/useDebouncedValue'; // <-- fixed

/* ---------- Card backgrounds ---------- */
const cardGold = require('@/assets/cards/goldcard.png') as ImageSourcePropType;
const cardSilver = require('@/assets/cards/silvercard.png') as ImageSourcePropType;
const cardBronze = require('@/assets/cards/bronzecard.png') as ImageSourcePropType;
const cardGeneric = require('@/assets/cards/backgroundfill.jpg') as ImageSourcePropType;

type ClubTier = 'basic' | 'plus' | 'elite';
type Mode = 'overall' | 'region' | 'club' | 'friends';

type LbRow = {
  id: string | null;
  username: string | null;
  avatar_url: string | null;
  rating: number | null;
  gender: string | null;
  region_id: string | null;
  region_name: string | null;
  club_id?: string | null;
};

type Region = { id: string; name: string };
type Club = { id: string; name: string; subscription_tier: string | null; logo_url?: string | null };

const PAGE_SIZE = 30;
const W = Dimensions.get('window').width;

/* ---------- helpers ---------- */
function bgForRank(rank?: number): ImageSourcePropType {
  if (rank === 1) return cardGold;
  if (rank === 2) return cardSilver;
  if (rank === 3) return cardBronze;
  return cardGeneric;
}
function normalizeClubTier(input?: string | null): ClubTier | null {
  if (!input) return null;
  const s = input.toLowerCase();
  if (s.includes('elite')) return 'elite';
  if (s.includes('plus')) return 'plus';
  return 'basic';
}

/* ---------- queries ---------- */
async function fetchRegions(): Promise<Region[]> {
  const { data, error } = await supabase.from('regions').select('id,name').order('name');
  if (error) throw error;
  return data ?? [];
}
async function fetchClubs(): Promise<Club[]> {
  const { data, error } = await supabase.from('clubs').select('id,name,subscription_tier,logo_url').order('name');
  if (error) throw error;
  return (data ?? []) as Club[];
}
async function fetchViewerTier(): Promise<ClubTier> {
  const { data: auth } = await supabase.auth.getUser();
  const me = auth?.user?.id;
  if (!me) return 'basic';
  const { data } = await supabase.from('profiles').select('subscription_tier').eq('id', me).single();
  return (normalizeClubTier(data?.subscription_tier ?? null) ?? 'basic') as ClubTier;
}
async function fetchPlayerStats(userId: string) {
  const { data: mpRows, error: mpErr } = await supabase
    .from('match_players')
    .select('match_id, team_number, is_winner, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(160);
  if (mpErr) throw mpErr;

  if (!mpRows?.length) {
    return { matches: 0, wins: 0, winRatePct: 0, streak: 0, xp: 0, eloDelta: 0, last5: [] as number[] };
  }

  const matchIds = Array.from(new Set(mpRows.map((r: any) => r.match_id)));
  const { data: matches } = await supabase
    .from('matches')
    .select('id, status, winning_team, finalized, finalized_at, created_at')
    .in('id', matchIds);

  const map = new Map<string, any>();
  (matches ?? []).forEach((m) => map.set(m.id, m));

  const isFinalized = (m: any) => {
    const s = (m?.status || '').toLowerCase();
    return (
      m?.finalized === true ||
      !!m?.finalized_at ||
      ['finalized', 'confirmed', 'completed', 'complete', 'approved'].includes(s) ||
      m?.winning_team != null
    );
  };

  const rows = [...mpRows].sort(
    (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  let matchesCount = 0;
  let winsCount = 0;
  const last5: number[] = [];

  for (const r of rows) {
    const m = map.get(r.match_id);
    if (!m || !isFinalized(m)) continue;
    matchesCount++;
    const won = r.is_winner === true || (m.winning_team != null && m.winning_team === r.team_number);
    if (won) winsCount++;
    if (last5.length < 5) last5.push(won ? 1 : 0);
  }

  // current win streak
  let streak = 0;
  for (const r of rows) {
    const m = map.get(r.match_id);
    if (!m || !isFinalized(m)) continue;
    const won = r.is_winner === true || (m.winning_team != null && m.winning_team === r.team_number);
    if (won) streak++;
    else break;
  }

  const winRatePct = matchesCount ? Math.round((winsCount / matchesCount) * 100) : 0;

  let eloDelta = 0;
  try {
    const { data: rc } = await supabase
      .from('rating_changes')
      .select('delta')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1);
    eloDelta = Number(rc?.[0]?.delta ?? 0);
  } catch {}

  const xp = matchesCount * 25 + winsCount * 15 + streak * 5;
  return { matches: matchesCount, wins: winsCount, winRatePct, streak, xp, eloDelta, last5 };
}

async function fetchLeaderboardPage({
  mode,
  gender,
  regionId,
  clubId,
  from,
  to,
  q,
}: {
  mode: Mode;
  gender: 'all' | 'male' | 'female';
  regionId: 'all' | string;
  clubId: 'all' | string;
  from: number;
  to: number;
  q?: string;
}): Promise<{ rows: LbRow[]; from: number; to: number }> {
  let req = supabase
    .from('profiles')
    .select('id,username,avatar_url,rating,gender,region_id,region,club_id')
    .order('rating', { ascending: false, nullsFirst: false })
    .range(from, to);

  if (gender !== 'all') req = req.eq('gender', gender);
  if (mode === 'region' && regionId !== 'all') req = req.eq('region_id', regionId);
  if (mode === 'club' && clubId !== 'all') req = req.eq('club_id', clubId);
  if (q && q.trim()) req = req.ilike('username', `%${q.trim()}%`);

  const { data, error } = await req;
  if (error) throw error;

  const rows: LbRow[] = (data ?? []).map((p: any) => ({
    id: p.id ?? null,
    username: p.username ?? null,
    avatar_url: p.avatar_url ?? null,
    rating: p.rating != null ? Number(p.rating) : null,
    gender: p.gender ?? null,
    region_id: p.region_id ?? null,
    region_name: p.region ?? null,
    club_id: p.club_id ?? null,
  }));

  return { rows, from, to };
}

/* ---------- Podium Card ---------- */
function PodiumCard({
  rank,
  width,
  height,
  bg,
  username,
  avatarUrl,
  rating,
  onPress,
}: {
  rank: 1 | 2 | 3;
  width: number;
  height: number;
  bg: ImageSourcePropType;
  username?: string | null;
  avatarUrl?: string | null;
  rating?: number | null;
  onPress?: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={{ width, height }}>
      <ImageBackground
        source={bg}
        style={{ flex: 1, borderRadius: 24, overflow: 'hidden' }}
        imageStyle={{ borderRadius: 24, transform: [{ scale: 1.34 }, { translateY: 10 }] }}
        resizeMode="cover"
      >
        <View style={styles.rankPill}>
          <Text style={styles.rankPillText}>#{rank}</Text>
        </View>

        <View style={styles.centerWrap}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.centerAvatar} />
          ) : (
            <View style={[styles.centerAvatar, styles.centerAvatarFallback]}>
              <Ionicons name="person" size={26} color="#e7e7ee" />
            </View>
          )}
        </View>

        <LinearGradient colors={['rgba(0,0,0,0.0)', 'rgba(0,0,0,0.85)']} style={StyleSheet.absoluteFill} />
        <View style={styles.podiumFooter}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text numberOfLines={1} style={styles.heroName}>
              {username || 'Player'}
            </Text>
          </View>
          <View style={styles.eloPill}>
            <Text style={styles.eloValue}>{Math.round(rating ?? 0)}</Text>
            <Text style={styles.eloLabel}>ELO</Text>
          </View>
        </View>
      </ImageBackground>
    </Pressable>
  );
}

/* ---------- Screen ---------- */
export default function LeaderboardScreen() {
  const [mode, setMode] = useState<Mode>('overall');
  const [gender, setGender] = useState<'all' | 'male' | 'female'>('all');
  const [regionId, setRegionId] = useState<'all' | string>('all');
  const [clubId, setClubId] = useState<'all' | string>('all');
  const [search, setSearch] = useState('');
  const searchQ = useDebouncedValue(search, 250);

  const { data: regions = [], isLoading: loadingRegions, refetch: refetchRegions, isRefetching: refetchingRegions } =
    useQuery({ queryKey: ['regions'], queryFn: fetchRegions, staleTime: 6e5 });

  const { data: clubs = [], isLoading: loadingClubs, refetch: refetchClubs, isRefetching: refetchingClubs } = useQuery({
    queryKey: ['clubs-all'],
    queryFn: fetchClubs,
    staleTime: 6e5,
  });

  const clubsMap = useMemo(() => {
    const m = new Map<string, Club>();
    for (const c of clubs) m.set(c.id, c);
    return m;
  }, [clubs]);

  const { data: viewerTier = 'basic', refetch: refetchViewerTier } = useQuery({
    queryKey: ['viewer-tier'],
    queryFn: fetchViewerTier,
    staleTime: 300_000,
  });
  const canViewAdvanced = viewerTier === 'plus' || viewerTier === 'elite';

  const {
    data,
    isLoading,
    isFetchingNextPage,
    isRefetching,
    fetchNextPage,
    refetch,
    hasNextPage,
    error,
  } = useInfiniteQuery({
    queryKey: ['leaderboard', mode, gender, regionId, clubId, searchQ],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const from = typeof pageParam === 'number' ? pageParam : 0;
      const to = from + PAGE_SIZE - 1;
      return fetchLeaderboardPage({ mode, gender, regionId, clubId, from, to, q: searchQ });
    },
    getNextPageParam: (last) => (last.rows.length < PAGE_SIZE ? undefined : last.to + 1),
  });

  const players: LbRow[] = useMemo(() => {
    const seen = new Set<string>();
    const out: LbRow[] = [];
    for (const page of data?.pages ?? []) {
      for (const row of page.rows ?? []) {
        const k = row.id ?? `anon-${out.length}`;
        if (!seen.has(k)) {
          seen.add(k);
          out.push(row);
        }
      }
    }
    return out;
  }, [data]);

  const podium = players.slice(0, 3);
  const rest = players.slice(3);

  const [openId, setOpenId] = useState<string | null>(null);
  const [flipped, setFlipped] = useState(false);
  const openPlayer = players.find((p) => p.id === openId) || null;
  const openRank = openPlayer ? players.findIndex((p) => p.id === openPlayer.id) + 1 : undefined;

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

  const onEndReached = () => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  };
  const onRefresh = () => {
    refetch();
    refetchRegions();
    refetchClubs();
    refetchViewerTier();
  };

  const renderHeader = useCallback(() => {
    const baseW = W - 16 * 2;
    const gap = 16;
    const third = Math.round((baseW - gap * 2) / 3);
    const midW = Math.round(third * 1.12);
    const sideW = Math.round((baseW - midW - gap) / 2);
    const midH = Math.round(midW * 1.62);
    const sideH = Math.round(sideW * 1.62);

    return (
      <View style={styles.headerWrap}>
        <Text style={styles.h1}>Leaderboard</Text>

        <View style={styles.searchWrap}>
          <Ionicons name="search" size={18} color="#9aa0a6" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search players..."
            placeholderTextColor="#6f7785"
            style={{ flex: 1, color: '#fff', paddingVertical: 10, marginLeft: 8 }}
            returnKeyType="search"
          />
          {search ? (
            <Pressable onPress={() => setSearch('')} hitSlop={10}>
              <Ionicons name="close-circle" size={18} color="#9aa0a6" />
            </Pressable>
          ) : null}
        </View>

        <View style={[styles.filtersRow, { marginTop: 10 }]}>
          {([
            { key: 'overall', label: 'Overall', icon: 'trophy' },
            { key: 'region', label: 'Region', icon: 'map' },
            { key: 'club', label: 'Club', icon: 'business' },
            { key: 'friends', label: 'Friends', icon: 'people' },
          ] as const).map((m) => (
            <Pressable
              key={m.key}
              onPress={() => setMode(m.key as Mode)}
              style={[styles.segment, mode === (m.key as Mode) && styles.segmentActive]}
            >
              <Ionicons
                name={m.icon as any}
                size={13}
                color={mode === m.key ? colors.primary : '#9aa0a6'}
                style={{ marginRight: 6 }}
              />
              <Text style={[styles.segmentText, mode === m.key && styles.segmentTextActive]}>{m.label}</Text>
            </Pressable>
          ))}
        </View>

        <View style={[styles.filtersRow, { marginTop: 8 }]}>
          {(['all', 'male', 'female'] as const).map((g) => (
            <Pressable key={g} onPress={() => setGender(g)} style={[styles.pill, gender === g && styles.pillActive]}>
              <Text style={[styles.pillText, gender === g && styles.pillTextActive]}>
                {g === 'all' ? 'All' : g[0].toUpperCase() + g.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>

        {mode === 'region' ? (
          <View style={{ gap: 8, marginTop: 12 }}>
            <Text style={styles.filterLabel}>Region</Text>
            {loadingRegions && !regions.length ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 2 }}>
                <Pressable key="all-regions" onPress={() => setRegionId('all')} style={[styles.pill, regionId === 'all' && styles.pillActive]}>
                  <Text style={[styles.pillText, regionId === 'all' && styles.pillTextActive]}>All</Text>
                </Pressable>
                {regions.map((r) => (
                  <Pressable key={r.id} onPress={() => setRegionId(r.id)} style={[styles.pill, regionId === r.id && styles.pillActive]}>
                    <Text style={[styles.pillText, regionId === r.id && styles.pillTextActive]}>{r.name}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            )}
          </View>
        ) : null}

        {mode === 'club' ? (
          <View style={{ gap: 8, marginTop: 12 }}>
            <Text style={styles.filterLabel}>Club</Text>
            {loadingClubs && !clubs.length ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 2 }}>
                <Pressable key="all-clubs" onPress={() => setClubId('all')} style={[styles.pill, clubId === 'all' && styles.pillActive]}>
                  <Text style={[styles.pillText, clubId === 'all' && styles.pillTextActive]}>All clubs</Text>
                </Pressable>
                {clubs.map((c) => (
                  <Pressable key={c.id} onPress={() => setClubId(c.id)} style={[styles.pill, clubId === c.id && styles.pillActive]}>
                    <Text style={[styles.pillText, clubId === c.id && styles.pillTextActive]}>{c.name}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            )}
          </View>
        ) : null}

        {podium.length ? (
          <View style={{ marginTop: 16 }}>
            <Text style={{ color: '#fff', fontWeight: '900', marginBottom: 10 }}>Top 3</Text>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
              <View style={{ width: sideW, height: sideH, opacity: podium[1] ? 1 : 0 }}>
                {podium[1] && (
                  <PodiumCard
                    rank={2}
                    width={sideW}
                    height={sideH}
                    bg={bgForRank(2)}
                    username={podium[1].username}
                    avatarUrl={podium[1].avatar_url}
                    rating={podium[1].rating ?? 0}
                    onPress={() => setOpenId(podium[1]?.id ?? null)}
                  />
                )}
              </View>

              <View style={{ width: midW, height: midH }}>
                {podium[0] && (
                  <PodiumCard
                    rank={1}
                    width={midW}
                    height={midH}
                    bg={bgForRank(1)}
                    username={podium[0].username}
                    avatarUrl={podium[0].avatar_url}
                    rating={podium[0].rating ?? 0}
                    onPress={() => setOpenId(podium[0]?.id ?? null)}
                  />
                )}
              </View>

              <View style={{ width: sideW, height: sideH, opacity: podium[2] ? 1 : 0 }}>
                {podium[2] && (
                  <PodiumCard
                    rank={3}
                    width={sideW}
                    height={sideH}
                    bg={bgForRank(3)}
                    username={podium[2].username}
                    avatarUrl={podium[2].avatar_url}
                    rating={podium[2].rating ?? 0}
                    onPress={() => setOpenId(podium[2]?.id ?? null)}
                  />
                )}
              </View>
            </View>
          </View>
        ) : null}
      </View>
    );
  }, [search, searchQ, mode, gender, regions, loadingRegions, regionId, clubs, loadingClubs, clubId, podium]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <FlatList
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        ListHeaderComponent={renderHeader}
        stickyHeaderIndices={[0]}
        data={rest}
        keyExtractor={(p, index) => p.id ?? `row-${index}`}
        renderItem={({ item, index }) => {
          const rank = index + 4;
          const club = item.club_id ? clubsMap.get(item.club_id) : undefined;
          return (
            <MiniCard
              bg={bgForRank(rank)}
              rank={rank}
              username={item.username || 'Player'}
              region={item.region_name}
              rating={item.rating ?? 1000}
              avatarUrl={item.avatar_url}
              onPress={() => setOpenId(item.id ?? null)}
              onToggleExpand={() => setOpenId(item.id ?? null)}
              clubLogoUrl={club?.logo_url ?? null}
              clubTier={normalizeClubTier(club?.subscription_tier ?? null)}
              expanded={false}
            />
          );
        }}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListEmptyComponent={
          isLoading ? (
            <View style={{ paddingVertical: 24 }}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : error ? (
            <Text style={{ color: '#ff9aa2' }}>Failed to load leaderboard.</Text>
          ) : (
            <Text style={{ color: '#9aa0a6' }}>No players yet.</Text>
          )
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <View style={{ paddingVertical: 16 }}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : null
        }
        onEndReachedThreshold={0.4}
        onEndReached={onEndReached}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching || refetchingRegions || refetchingClubs}
            onRefresh={onRefresh}
            tintColor="#fff"
          />
        }
      />

      <Modal visible={!!openId} animationType="fade" onRequestClose={closeModal} transparent>
        <View style={styles.modalWrap}>
          {openPlayer ? (
            <FlipCard
              flipped={flipped}
              onFlip={setFlipped}
              width={Math.min(W - 32, 420)}
              height={Math.round(Math.min(W - 32, 420) * 1.62)}
              front={
                <ImageBackground
                  source={bgForRank(openRank)}
                  style={{ flex: 1, borderRadius: 24, overflow: 'hidden' }}
                  imageStyle={{ borderRadius: 24, transform: [{ scale: 1.38 }, { translateY: 12 }] }}
                  resizeMode="cover"
                >
                  <LinearGradient colors={['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.85)']} style={StyleSheet.absoluteFill} />
                  <View style={styles.modalRankPill}>
                    <Text style={styles.rankPillText}>#{openRank}</Text>
                  </View>

                  <View style={[styles.centerWrap, { top: '35%' }]}>
                    {openPlayer.avatar_url ? (
                      <Image source={{ uri: openPlayer.avatar_url }} style={[styles.centerAvatar, { width: 96, height: 96 }]} />
                    ) : (
                      <View style={[styles.centerAvatar, styles.centerAvatarFallback, { width: 96, height: 96 }]}>
                        <Ionicons name="person" size={34} color="#e7e7ee" />
                      </View>
                    )}
                  </View>

                  <View style={styles.modalInfo}>
                    <Text numberOfLines={1} style={[styles.heroName, { fontSize: 24 }]}>
                      {openPlayer.username || 'Player'}
                    </Text>
                    <Text style={styles.subtleRow}>
                      {(openPlayer.region_name || '—')}{' '}
                      {openPlayer.club_id ? `• ${(clubsMap.get(openPlayer.club_id)?.name ?? 'Club')}` : ''}
                    </Text>

                    <View style={styles.badgesRow}>
                      <View style={styles.badgePill}>
                        <Ionicons name="trophy" size={12} color="#ffd79f" style={{ marginRight: 6 }} />
                        <Text style={{ color: '#ffd79f', fontWeight: '800' }}>{Math.round(openPlayer.rating ?? 0)} ELO</Text>
                      </View>
                      <View style={[styles.badgePill, { backgroundColor: 'rgba(255,255,255,0.06)' }]}>
                        <Ionicons name="ribbon" size={12} color="#ffb777" style={{ marginRight: 6 }} />
                        <Text style={{ color: '#e6c8a4', fontWeight: '700' }}>Badges: {(selStats as any)?.badges ?? 0}</Text>
                      </View>
                    </View>

                    <Pressable onPress={() => setFlipped(true)} style={styles.flipBtn} accessibilityRole="button">
                      <Text style={styles.flipBtnText}>Flip for Insights</Text>
                      <Ionicons name="sync" size={14} color="#0b0e13" style={{ marginLeft: 8 }} />
                    </Pressable>
                  </View>
                </ImageBackground>
              }
              back={
                <PlayerCardBack
                  bg={bgForRank(openRank)}
                  width={Math.min(W - 32, 420)}
                  height={Math.round(Math.min(W - 32, 420) * 1.62)}
                  region={openPlayer.region_name}
                  gender={openPlayer.gender || undefined}
                  stats={
                    loadingSelStats || !selStats
                      ? { matches: 0, wins: 0, winRatePct: 0, streak: 0, xp: 0, eloDelta: 0, last5: [] }
                      : selStats
                  }
                  imageScale={1.4}
                  imageTranslateY={12}
                  locked={!canViewAdvanced}
                />
              }
            />
          ) : null}

          <Pressable onPress={closeModal} style={styles.closeBtn} accessibilityRole="button">
            <Ionicons name="close" size={22} color="#0b0e13" />
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  headerWrap: { backgroundColor: colors.bg, paddingBottom: 12 },
  h1: { color: '#fff', fontSize: 30, fontWeight: '900', marginBottom: 8 },

  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10151d',
    borderWidth: 1,
    borderColor: '#1f2630',
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  filterLabel: { color: '#9aa0a6', fontWeight: '700', marginLeft: 2 },
  filtersRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },

  pill: {
    borderWidth: 1,
    borderColor: '#28303a',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#0e1116',
  },
  pillActive: { borderColor: colors.primary, backgroundColor: '#141821' },
  pillText: { color: '#9aa0a6', fontWeight: '700' },
  pillTextActive: { color: colors.primary },

  segment: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#28303a',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#0e1116',
  },
  segmentActive: { borderColor: colors.primary, backgroundColor: '#141821' },
  segmentText: { color: '#9aa0a6', fontWeight: '700', fontSize: 12 },
  segmentTextActive: { color: colors.primary },

  rankPill: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
    zIndex: 2,
  },
  modalRankPill: {
    position: 'absolute',
    top: 14,
    right: 14,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    zIndex: 2,
  },
  rankPillText: { color: '#ffd79f', fontWeight: '900' },

  centerWrap: { position: 'absolute', top: '36%', left: 0, right: 0, alignItems: 'center', zIndex: 1 },
  centerAvatar: {
    width: 72,
    height: 72,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  centerAvatarFallback: { alignItems: 'center', justifyContent: 'center' },

  podiumFooter: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroName: { color: '#fff', fontWeight: '900', fontSize: 18 },

  eloPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(12,12,14,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  eloValue: { color: '#ffe0b0', fontWeight: '900', fontSize: 20, marginRight: 6 },
  eloLabel: { color: '#ffd79f', fontWeight: '800', fontSize: 11 },

  modalWrap: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  modalInfo: { position: 'absolute', left: 16, right: 16, bottom: 16, alignItems: 'center' },
  subtleRow: { color: '#d8d8e2', opacity: 0.85, marginTop: 6 },
  badgesRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,215,159,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  flipBtn: {
    marginTop: 12,
    backgroundColor: '#ffd79f',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#332317',
  },
  flipBtnText: { color: '#0b0e13', fontWeight: '900' },

  closeBtn: {
    marginTop: 16,
    backgroundColor: '#ffd79f',
    borderRadius: 999,
    padding: 10,
    borderWidth: 2,
    borderColor: '#332317',
  },
});
