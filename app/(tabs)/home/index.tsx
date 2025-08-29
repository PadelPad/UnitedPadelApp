// app/(tabs)/home/index.tsx
import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  RefreshControl,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import FAB from '@/components/GlobalFab';
import VerifyEmailBanner from '@/components/VerifyEmailBanner';

import {
  useProfile,
  useLeaderboardTop,
  useUpcomingTournaments,
  useRecentMatches,
  type LeaderboardEntry,
  type MatchRow,
  type TournamentCard,
} from '@/lib/hooks/home';

// ---------- Helpers ----------
function formatDate(iso: string | null) {
  if (!iso) return 'TBA';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short' });
  } catch {
    return 'TBA';
  }
}

function initials(name?: string | null) {
  if (!name) return 'UP';
  const parts = name?.trim().split(/\s|_/).filter(Boolean) ?? [];
  const a = (parts[0]?.[0] || '').toUpperCase();
  const b = (parts[1]?.[0] || '').toUpperCase();
  return (a + b) || 'UP';
}

function Avatar({
  uri,
  fallbackText,
  size = 44,
}: {
  uri?: string | null;
  fallbackText?: string;
  size?: number;
}) {
  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: '#161b22' }}
      />
    );
  }
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: '#161b22',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ color: '#9aa0a6', fontWeight: '700' }}>{fallbackText || 'UP'}</Text>
    </View>
  );
}

function SectionHeader({ title, onPressAll }: { title: string; onPressAll?: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {onPressAll ? (
        <Pressable onPress={onPressAll} accessibilityRole="button">
          <Text style={styles.link}>See all</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function Skeleton({
  height = 16,
  width = '100%',
  radius = 8,
  style,
}: {
  height?: number;
  width?: number | string;
  radius?: number;
  style?: any;
}) {
  return (
    <View
      style={[
        {
          height,
          width,
          borderRadius: radius,
          backgroundColor: '#0f141b',
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <View style={{ flex: 1, opacity: 0.15, backgroundColor: '#fff' }} />
    </View>
  );
}

// ---------- Screen ----------
export default function HomeScreen() {
  const router = useRouter();

  // Live data hooks
  const {
    data: profile,
    isLoading: loadingProfile,
    isFetching: fetchingProfile,
    refetch: refetchProfile,
  } = useProfile();

  const {
    data: top3,
    isLoading: loadingTop3,
    isFetching: fetchingTop3,
    refetch: refetchTop3,
  } = useLeaderboardTop(3);

  const {
    data: tournaments,
    isLoading: loadingTourn,
    isFetching: fetchingTourn,
    refetch: refetchTourn,
  } = useUpcomingTournaments(8);

  const {
    data: matches,
    isLoading: loadingMatches,
    isFetching: fetchingMatches,
    refetch: refetchMatches,
  } = useRecentMatches(5);

  const refreshing = fetchingProfile || fetchingTop3 || fetchingTourn || fetchingMatches;

  const onRefresh = useCallback(() => {
    refetchProfile();
    refetchTop3();
    refetchTourn();
    refetchMatches();
  }, [refetchProfile, refetchTop3, refetchTourn, refetchMatches]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const nameOrBrand = profile?.username || 'United Padel';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: 16, paddingBottom: 96 }}
      refreshControl={
        <RefreshControl tintColor="#ff6a00" refreshing={!!refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header / Welcome */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.eyebrow}>{greeting}</Text>
          <Text style={styles.h1}>
            Welcome{profile?.username ? ',' : ''} {nameOrBrand}
          </Text>
          <Text style={styles.sub}>Track matches, climb rankings, join tournaments.</Text>
        </View>
        <Avatar uri={profile?.avatar_url ?? undefined} fallbackText={initials(profile?.username)} />
      </View>

      {/* Email verification banner */}
      <View style={{ marginBottom: 12 }}>
        <VerifyEmailBanner />
      </View>

      {/* Rating / Streak card */}
      <View style={styles.card}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <MaterialCommunityIcons name="lightning-bolt" size={20} color="#ffb86b" />
          <Text style={styles.cardEyebrow}>Your Rating</Text>
        </View>
        <View style={styles.ratingRow}>
          {loadingProfile ? (
            <Skeleton width={120} height={32} radius={6} />
          ) : (
            <Text style={styles.ratingValue}>{Math.round(profile?.rating ?? 1000)}</Text>
          )}
          <View style={styles.badgePill}>
            <Ionicons name="flame" size={14} color="#ff6a00" />
            <Text style={styles.badgeText}>Streak: {profile?.streak_days ?? 0}d</Text>
          </View>
        </View>

        <View style={styles.cardActions}>
          <Pressable
            onPress={() => router.push('/submit')}
            style={[styles.primaryBtn]}
            accessibilityRole="button"
            accessibilityLabel="Submit a match"
          >
            <Ionicons name="add-circle" size={18} color="#0b0e13" />
            <Text style={styles.primaryBtnText}>Submit Match</Text>
          </Pressable>

          <Pressable
            onPress={() => router.push('/(tabs)/leaderboard')}
            style={styles.secondaryBtn}
            accessibilityRole="button"
            accessibilityLabel="View leaderboard"
          >
            <Ionicons name="bar-chart" size={16} color="#ff6a00" />
            <Text style={styles.secondaryBtnText}>Leaderboard</Text>
          </Pressable>
        </View>
      </View>

      {/* Quick Actions */}
      <SectionHeader title="Quick actions" />
      <View style={styles.quickGrid}>
        <QuickAction
          icon={<MaterialCommunityIcons name="tennis" size={22} color="#fff" />}
          label="My Matches"
          onPress={() => router.push('/(tabs)/matches')}
        />
        <QuickAction
          icon={<MaterialCommunityIcons name="trophy-outline" size={22} color="#fff" />}
          label="Tournaments"
          onPress={() => router.push('/(tabs)/tournaments')}
        />
        <QuickAction
          icon={<MaterialCommunityIcons name="storefront-outline" size={22} color="#fff" />}
          label="Clubs"
          onPress={() => router.push('/(tabs)/clubs')}
        />
        <QuickAction
          icon={<Ionicons name="person-circle-outline" size={22} color="#fff" />}
          label="Profile"
          onPress={() => router.push('/(tabs)/profile')}
        />
      </View>

      {/* Top 3 Podium */}
      <SectionHeader title="Top players" onPressAll={() => router.push('/(tabs)/leaderboard')} />
      <View style={styles.podiumRow}>
        {loadingTop3 ? (
          <>
            <PodiumSkeleton />
            <PodiumSkeleton />
            <PodiumSkeleton />
          </>
        ) : top3 && top3.length > 0 ? (
          top3.map((p: LeaderboardEntry, idx: number) => (
            <PodiumItem key={p.user_id} place={idx + 1} entry={p} />
          ))
        ) : (
          <Text style={styles.muted}>No leaderboard data yet.</Text>
        )}
      </View>

      {/* Upcoming Tournaments */}
      <SectionHeader
        title="Upcoming tournaments"
        onPressAll={() => router.push('/(tabs)/tournaments')}
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
        {loadingTourn ? (
          Array.from({ length: 4 }).map((_, i: number) => (
            <View key={i} style={styles.tCard}>
              <Skeleton height={100} radius={12} />
              <View style={{ height: 8 }} />
              <Skeleton height={14} width={140} />
              <View style={{ height: 6 }} />
              <Skeleton height={12} width={90} />
            </View>
          ))
        ) : tournaments && tournaments.length > 0 ? (
          tournaments.map((t: TournamentCard) => (
            <Pressable
              key={t.id}
              onPress={() => router.push({ pathname: '/tournaments/[id]', params: { id: t.id } })}
              style={styles.tCard}
              accessibilityRole="button"
              accessibilityLabel={`Open ${t.name}`}
            >
              {t.poster_url ? (
                <Image source={{ uri: t.poster_url }} style={styles.tPoster} resizeMode="cover" />
              ) : (
                <View style={[styles.tPoster, styles.posterFallback]}>
                  <MaterialCommunityIcons name="trophy" size={28} color="#fff" />
                </View>
              )}
              <Text numberOfLines={1} style={styles.tName}>
                {t.name}
              </Text>
              <Text style={styles.tMeta}>
                {formatDate(t.start_date)} • {t.location || 'TBA'}
              </Text>
            </Pressable>
          ))
        ) : (
          <View style={{ paddingVertical: 12 }}>
            <Text style={styles.muted}>No upcoming tournaments yet.</Text>
          </View>
        )}
      </ScrollView>

      {/* Recent Activity */}
      <SectionHeader title="Recent activity" onPressAll={() => router.push('/(tabs)/matches')} />
      <View style={{ gap: 10 }}>
        {loadingMatches ? (
          Array.from({ length: 3 }).map((_, i: number) => (
            <View key={i} style={styles.matchRow}>
              <Skeleton width={32} height={32} radius={16} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Skeleton width="70%" height={14} />
                <View style={{ height: 6 }} />
                <Skeleton width="40%" height={12} />
              </View>
            </View>
          ))
        ) : matches && matches.length > 0 ? (
          matches.map((m: MatchRow) => (
            <MatchItem
              key={m.id}
              m={m}
              onPress={() => router.push({ pathname: '/match/[id]', params: { id: m.id } })}
            />
          ))
        ) : (
          <Text style={styles.muted}>No recent matches yet. Submit your first match!</Text>
        )}
      </View>

      {/* Optional: global loading indicator */}
      {refreshing ? (
        <View style={{ paddingTop: 12 }}>
          <ActivityIndicator color="#ff6a00" />
        </View>
      ) : null}

      <FAB />
    </ScrollView>
  );
}

// ---------- Mini components ----------
function QuickAction({
  icon,
  label,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.qItem} accessibilityRole="button">
      <View style={styles.qIcon}>{icon}</View>
      <Text style={styles.qLabel}>{label}</Text>
    </Pressable>
  );
}

function PodiumItem({ place, entry }: { place: number; entry: LeaderboardEntry }) {
  const placeColor = place === 1 ? '#ffd700' : place === 2 ? '#c0c0c0' : '#cd7f32';
  return (
    <View style={styles.podiumItem}>
      <View style={[styles.podiumAvatarRing, { borderColor: placeColor }]}>
        <Avatar uri={entry.avatar_url || undefined} fallbackText={initials(entry.username)} size={50} />
      </View>
      <Text numberOfLines={1} style={styles.podiumName}>
        {entry.username || 'Player'}
      </Text>
      <Text style={[styles.podiumRating, { color: placeColor }]}>{Math.round(entry.rating)}</Text>
      <View style={styles.placePill}>
        <Text style={styles.placeText}>#{place}</Text>
      </View>
    </View>
  );
}

function PodiumSkeleton() {
  return (
    <View style={styles.podiumItem}>
      <Skeleton width={50} height={50} radius={25} />
      <View style={{ height: 6 }} />
      <Skeleton width={80} height={12} />
      <View style={{ height: 6 }} />
      <Skeleton width={40} height={12} />
    </View>
  );
}

function MatchItem({ m, onPress }: { m: MatchRow; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.matchRow} accessibilityRole="button">
      <View style={styles.matchBall}>
        <MaterialCommunityIcons name="tennis-ball" size={18} color="#0b0e13" />
      </View>
      <View style={{ flex: 1 }}>
        <Text numberOfLines={1} style={styles.matchTitle}>
          {m.match_type || 'Match'} · {m.match_level || 'friendly'}
        </Text>
        <Text style={styles.matchMeta}>
          {formatDate(m.played_at)} · {m.score || '—'}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#9aa0a6" />
    </Pressable>
  );
}

// ---------- Styles ----------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b0e13' },
  headerRow: { flexDirection: 'row', gap: 12, alignItems: 'center', marginBottom: 12 },
  eyebrow: { color: '#9aa0a6', fontSize: 12, marginBottom: 2 },
  h1: { fontSize: 26, fontWeight: '800', color: '#fff' },
  sub: { color: '#c1c7d0', marginTop: 4 },

  card: {
    backgroundColor: '#0e1116',
    borderWidth: 1,
    borderColor: '#1f2630',
    borderRadius: 14,
    padding: 14,
    marginTop: 12,
  },
  cardEyebrow: { marginLeft: 6, fontWeight: '700', color: '#ffb86b' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 10 },
  ratingValue: { fontSize: 36, fontWeight: '900', color: '#fff', letterSpacing: 0.5 },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    backgroundColor: '#161b22',
    borderWidth: 1,
    borderColor: '#293241',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badgeText: { color: '#ff6a00', fontWeight: '700', fontSize: 12 },

  cardActions: { flexDirection: 'row', gap: 10, marginTop: 12 },
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

  sectionHeader: {
    marginTop: 18,
    marginBottom: 8,
    paddingHorizontal: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: { color: '#fff', fontWeight: '800', fontSize: 16 },
  link: { color: '#9aa0a6' },

  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  qItem: {
    width: '48%',
    backgroundColor: '#10151d',
    borderWidth: 1,
    borderColor: '#1f2630',
    padding: 12,
    borderRadius: 12,
  },
  qIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#ff6a00',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  qLabel: { color: '#fff', fontWeight: '700' },

  podiumRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'stretch',
    justifyContent: 'space-between',
  },
  podiumItem: {
    flex: 1,
    backgroundColor: '#0e1116',
    borderWidth: 1,
    borderColor: '#1f2630',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    position: 'relative',
  },
  podiumAvatarRing: { borderWidth: 2, padding: 2, borderRadius: 30 },
  podiumName: { color: '#fff', fontWeight: '700', marginTop: 8, maxWidth: 120 },
  podiumRating: { fontWeight: '900', marginTop: 2 },
  placePill: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#161b22',
    borderWidth: 1,
    borderColor: '#293241',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  placeText: { color: '#9aa0a6', fontSize: 10, fontWeight: '700' },

  tCard: {
    width: 180,
    backgroundColor: '#0e1116',
    borderWidth: 1,
    borderColor: '#1f2630',
    borderRadius: 12,
    padding: 10,
  },
  tPoster: { width: '100%', height: 100, borderRadius: 10, backgroundColor: '#11161f' },
  posterFallback: { alignItems: 'center', justifyContent: 'center' },
  tName: { color: '#fff', fontWeight: '800', marginTop: 8 },
  tMeta: { color: '#9aa0a6', marginTop: 2, fontSize: 12 },

  matchRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    backgroundColor: '#0e1116',
    borderWidth: 1,
    borderColor: '#1f2630',
    padding: 12,
    borderRadius: 12,
  },
  matchBall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ffcc66',
    alignItems: 'center',
    justifyContent: 'center',
  },
  matchTitle: { color: '#fff', fontWeight: '700' },
  matchMeta: { color: '#9aa0a6', fontSize: 12 },

  muted: { color: '#9aa0a6' },
});
