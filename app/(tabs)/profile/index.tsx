// app/(tabs)/profile/index.tsx
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  Image,
  ScrollView,
  Dimensions,
  Modal,
  Alert,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

// Card components
import FlipCard from '@/components/cards/FlipCard';
import PlayerCardFront from '@/components/cards/PlayerCardFront';
import PlayerCardBack from '@/components/cards/PlayerCardBack';

// Card assets
const cardGold = require('@/assets/cards/goldcard.png');
const cardSilver = require('@/assets/cards/silvercard.png');
const cardBronze = require('@/assets/cards/bronzecard.png');
const cardGeneric = require('@/assets/cards/backgroundfill.jpg');

const C = {
  bg: '#0b0e13',
  panel: '#0e1116',
  border: '#1f2630',
  text: '#fff',
  sub: '#9aa0a6',
  orange: '#ff6a00',
  gold: '#ffb86b',
  danger: '#ff4d4f',
};

type ProfileRow = {
  id: string;
  username: string | null;
  email?: string | null;
  avatar_url: string | null;
  region_id: string | null;
  region: string | null;
  gender: 'male' | 'female' | 'other' | null;
  preferred_format: 'singles' | 'doubles' | 'mixed' | null;
  account_type: 'individual' | 'club';
  bio?: string | null;
};

type Region = { id: string; name: string };

function initials(name?: string | null) {
  if (!name) return 'UP';
  const parts = (name || '').trim().split(/\s|_/).filter(Boolean);
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || 'UP';
}

async function getMe() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user;
}

async function fetchProfile(userId?: string): Promise<ProfileRow | null> {
  if (!userId) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, avatar_url, region_id, region, gender, preferred_format, account_type, bio, email')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data as ProfileRow;
}

async function fetchRegions(): Promise<Region[]> {
  const { data, error } = await supabase.from('regions').select('id,name').order('name', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Region[];
}

/** Robust stats fetcher that works with common schemas. */
async function fetchPlayerStats(userId: string) {
  // 1) grab recent participations (limit for perf)
  const { data: mpRows, error: mpErr } = await supabase
    .from('match_players')
    .select('match_id, team_number, is_winner, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(400);
  if (mpErr) throw mpErr;

  if (!mpRows?.length) {
    return { matches: 0, wins: 0, winRatePct: 0, streak: 0 };
  }

  // 2) fetch their matches
  const matchIds = Array.from(new Set(mpRows.map((r: any) => r.match_id)));
  const { data: matches, error: mErr } = await supabase
    .from('matches')
    .select('id, created_at, status, finalized, finalized_at, winner_team, winning_team')
    .in('id', matchIds);
  if (mErr) throw mErr;

  const matchMap = new Map<string, any>();
  (matches ?? []).forEach((m) => matchMap.set(m.id, m));

  // 3) merge + compute
  // sort by match created_at desc when we can
  const byDate = [...mpRows].sort((a: any, b: any) => {
    const ma = matchMap.get(a.match_id);
    const mb = matchMap.get(b.match_id);
    const ta = new Date(ma?.created_at ?? a.created_at ?? 0).getTime();
    const tb = new Date(mb?.created_at ?? b.created_at ?? 0).getTime();
    return tb - ta;
  });

  let matchesCount = 0;
  let winsCount = 0;
  let streak = 0;

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

  for (const row of byDate) {
    const m = matchMap.get(row.match_id);
    if (!m || !isFinalized(m)) continue;

    matchesCount++;

    // win detection: (1) is_winner flag; (2) winner_team == my team
    const winnerTeam = m?.winner_team ?? m?.winning_team ?? null;
    const won = row.is_winner === true || (typeof winnerTeam === 'number' && winnerTeam === row.team_number);
    if (won) {
      winsCount++;
    }
  }

  // streak (from most recent finalized game)
  for (const row of byDate) {
    const m = matchMap.get(row.match_id);
    if (!m || !isFinalized(m)) continue;
    const winnerTeam = m?.winner_team ?? m?.winning_team ?? null;
    const won = row.is_winner === true || (typeof winnerTeam === 'number' && winnerTeam === row.team_number);
    if (won) streak++;
    else break;
  }

  const winRatePct = matchesCount ? Math.round((winsCount / matchesCount) * 100) : 0;
  return { matches: matchesCount, wins: winsCount, winRatePct, streak };
}

export default function ProfileScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const W = Dimensions.get('window').width;

  const { data: me } = useQuery({ queryKey: ['me'], queryFn: getMe });
  const userId = me?.id;

  const { data: profile, isLoading: loadingProfile } = useQuery({
    queryKey: ['profile', userId],
    queryFn: () => fetchProfile(userId),
    enabled: !!userId,
  });

  const { data: regions = [] } = useQuery({
    queryKey: ['regions'],
    queryFn: fetchRegions,
  });

  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['profile-stats', userId],
    queryFn: () => fetchPlayerStats(userId!),
    enabled: !!userId,
    staleTime: 60_000,
  });

  const signOut = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    },
    onSuccess: () => router.replace('/'),
    onError: (e: any) => Alert.alert('Sign out failed', e?.message ?? 'Try again.'),
  });

  const unverified = me && (!me.email_confirmed_at && !(me as any).confirmed_at);

  // Expand-to-modal
  const [open, setOpen] = useState(false);
  const cardW = Math.min(W - 32, 340);
  const cardH = Math.round(cardW * 1.45);

  const regionName = useMemo(() => {
    const r = regions.find((x) => x.id === profile?.region_id);
    return r?.name ?? profile?.region ?? null;
  }, [regions, profile?.region_id, profile?.region]);

  // Choose a theme — gold/silver/bronze could be set from rank if you pass it in
  const themeBg = cardGeneric;

  if (loadingProfile || !profile) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={C.orange} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <Stack.Screen
        options={{
          title: 'My Profile',
          headerStyle: { backgroundColor: C.bg },
          headerTintColor: '#fff',
          headerRight: () => (
            <Pressable
              onPress={() => router.push('/(tabs)/profile/edit')}
              style={{ paddingHorizontal: 12, paddingVertical: 6 }}
            >
              <Ionicons name="create-outline" size={20} color="#fff" />
            </Pressable>
          ),
        }}
      />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        {/* Verify banner */}
        {unverified ? (
          <View style={S.banner}>
            <Ionicons name="mail-unread-outline" size={16} color={C.gold} />
            <Text style={{ color: C.gold, fontWeight: '800' }}>Verify your email</Text>
            <View style={{ flex: 1 }} />
            <Text style={{ color: C.gold, opacity: 0.85, fontSize: 12 }}>Check your inbox</Text>
          </View>
        ) : null}

        {/* Big flip card */}
        <View style={{ alignItems: 'center' }}>
          <FlipCard
            width={cardW}
            height={cardH}
            front={
              <PlayerCardFront
                bg={themeBg}
                width={cardW}
                height={cardH}
                username={profile.username || 'Player'}
                region={regionName}
                rating={undefined}
                avatarUrl={profile.avatar_url}
              />
            }
            back={
              <PlayerCardBack
                bg={themeBg}
                width={cardW}
                height={cardH}
                region={regionName}
                gender={profile.gender}
                preferred={profile.preferred_format}
                stats={
                  loadingStats
                    ? { matches: 0, wins: 0, winRatePct: 0, streak: 0 }
                    : stats || { matches: 0, wins: 0, winRatePct: 0, streak: 0 }
                }
              />
            }
          />
          <Pressable onPress={() => setOpen(true)} style={S.expandPill} accessibilityRole="button">
            <Ionicons name="expand" size={14} color="#0b0e13" />
            <Text style={{ color: '#0b0e13', fontWeight: '900' }}>Tap to expand</Text>
          </Pressable>
        </View>

        {/* Info panel under card */}
        <View style={S.card}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            {profile.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={{ width: 56, height: 56, borderRadius: 28 }} />
            ) : (
              <View style={S.avatarFallback}>
                <Text style={{ color: '#fff', fontWeight: '900' }}>{initials(profile.username)}</Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={S.h1}>{profile.username || 'Player'}</Text>
              <Text style={{ color: C.sub, marginTop: 2 }}>{regionName || 'Region —'}</Text>
            </View>
          </View>

          {/* Quick stats row */}
          <View style={S.statsRow}>
            <Stat label="Matches" value={loadingStats ? '—' : stats?.matches ?? 0} />
            <Divider />
            <Stat label="Wins" value={loadingStats ? '—' : stats?.wins ?? 0} />
            <Divider />
            <Stat label="Win %" value={loadingStats ? '—' : `${stats?.winRatePct ?? 0}%`} />
            <Divider />
            <Stat label="Streak" value={loadingStats ? '—' : stats?.streak ?? 0} />
          </View>

          <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
            <Pill text={profile.account_type === 'club' ? 'Club' : 'Individual'} />
            {profile.gender ? <Pill text={profile.gender[0].toUpperCase() + profile.gender.slice(1)} /> : null}
            {profile.preferred_format ? (
              <Pill text={profile.preferred_format[0].toUpperCase() + profile.preferred_format.slice(1)} />
            ) : null}
          </View>
        </View>

        {/* Actions */}
        <Pressable
          style={[S.secondary, { borderColor: C.danger }]}
          onPress={() =>
            Alert.alert('Sign out', 'Are you sure you want to sign out?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Sign out', style: 'destructive', onPress: () => signOut.mutate() },
            ])
          }
        >
          <Ionicons name="log-out-outline" size={16} color={C.danger} />
          <Text style={[S.secondaryText, { color: C.danger }]}>Sign out</Text>
        </Pressable>
      </ScrollView>

      {/* Expanded modal */}
      <Modal visible={open} animationType="fade" onRequestClose={() => setOpen(false)} transparent>
        <View style={S.modalWrap}>
          <FlipCard
            width={Math.min(W - 40, 360)}
            height={Math.round(Math.min(W - 40, 360) * 1.45)}
            front={
              <PlayerCardFront
                bg={themeBg}
                width={Math.min(W - 40, 360)}
                height={Math.round(Math.min(W - 40, 360) * 1.45)}
                username={profile.username || 'Player'}
                region={regionName}
                rating={undefined}
                avatarUrl={profile.avatar_url}
              />
            }
            back={
              <PlayerCardBack
                bg={themeBg}
                width={Math.min(W - 40, 360)}
                height={Math.round(Math.min(W - 40, 360) * 1.45)}
                region={regionName}
                gender={profile.gender}
                preferred={profile.preferred_format}
                stats={stats || { matches: 0, wins: 0, winRatePct: 0, streak: 0 }}
              />
            }
          />
          <Pressable onPress={() => setOpen(false)} style={S.closeBtn}>
            <Ionicons name="close" size={22} color="#0b0e13" />
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <View style={{ minWidth: 64, alignItems: 'center' }}>
      <Text style={{ color: '#ffe0b0', fontWeight: '900', fontSize: 16 }}>{value}</Text>
      <Text style={{ color: '#cbcbd7', fontSize: 11 }}>{label}</Text>
    </View>
  );
}
function Divider() {
  return <View style={{ width: 1, height: 26, backgroundColor: 'rgba(255,255,255,0.08)' }} />;
}
function Pill({ text }: { text: string }) {
  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: '#28303a',
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 6,
        backgroundColor: C.panel,
      }}
    >
      <Text style={{ color: C.sub, fontWeight: '700' }}>{text}</Text>
    </View>
  );
}

const S = StyleSheet.create({
  h1: { color: '#fff', fontSize: 18, fontWeight: '900' },

  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#141821',
    borderWidth: 1,
    borderColor: '#2a313c',
    padding: 10,
    borderRadius: 12,
  },

  card: {
    backgroundColor: C.panel,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
    padding: 14,
  },

  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(0,0,0,0.35)',
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginTop: 12,
  },

  secondary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: C.panel,
    borderWidth: 1,
    borderColor: C.orange,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  secondaryText: { color: C.orange, fontWeight: '800' },

  expandPill: {
    marginTop: 8,
    backgroundColor: '#ffd79f',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 2,
    borderColor: '#332317',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  avatarFallback: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#11161f',
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalWrap: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  closeBtn: {
    marginTop: 16,
    backgroundColor: '#ffd79f',
    borderRadius: 999,
    padding: 10,
    borderWidth: 2,
    borderColor: '#332317',
  },
});
