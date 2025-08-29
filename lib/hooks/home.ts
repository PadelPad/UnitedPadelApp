// lib/hooks/home.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../supabase';

// ---------- Types used by the Home screen ----------
export type ProfileSummary = {
  username: string | null;
  avatar_url: string | null;
  rating: number | null;
  streak_days: number | null;
};

export type LeaderboardEntry = {
  user_id: string;
  username: string | null;
  avatar_url: string | null;
  rating: number;
};

export type TournamentCard = {
  id: string;
  name: string;
  start_date: string | null; // ISO
  end_date: string | null;   // ISO
  location: string | null;
  poster_url: string | null;
};

export type MatchRow = {
  id: string;
  played_at: string | null;   // ISO
  match_level: string | null;
  match_type: string | null;
  score: string | null;
};

// --- DB row helpers ---
type ProfileRow = {
  id: string;
  username: string | null;
  avatar_url: string | null;
  rating: number | null;
};

type TournamentRow = {
  id: string;
  name: string;
  start_date: string | null;
  end_date: string | null;
  location: string | null;
  poster_url: string | null;
};

type MatchJoinRow = {
  matches: {
    id: string;
    played_at: string | null;
    match_level: string | null;
    match_type: string | null;
    score: string | null;
  } | null;
};

// ---------- Utils ----------
async function getUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

function toISO(d: string | null): string | null {
  if (!d) return null;
  try {
    return new Date(d).toISOString();
  } catch {
    return null;
  }
}

const STALE = 5 * 60 * 1000; // 5m
const GC = 30 * 60 * 1000;   // 30m

// ---------- Queries ----------
export function useProfile() {
  return useQuery<ProfileSummary | null>({
    queryKey: ['profile'],
    staleTime: STALE,
    gcTime: GC,
    placeholderData: null,
    queryFn: async () => {
      const userId = await getUserId();
      if (!userId) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, rating')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      const row = data as unknown as ProfileRow;
      return {
        username: row.username,
        avatar_url: row.avatar_url,
        rating: row.rating ?? 1000,
        streak_days: null, // hook up later when you add streak logic
      };
    },
  });
}

export function useLeaderboardTop(limit = 3) {
  return useQuery<LeaderboardEntry[]>({
    queryKey: ['leaderboardTop', limit],
    staleTime: STALE,
    gcTime: GC,
    placeholderData: [],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, rating')
        .order('rating', { ascending: false, nullsFirst: false })
        .limit(limit);

      if (error) throw error;

      const rows = (data ?? []) as unknown as ProfileRow[];
      return rows.map((row) => ({
        user_id: row.id,
        username: row.username,
        avatar_url: row.avatar_url,
        rating: Number(row.rating ?? 0),
      }));
    },
  });
}

export function useUpcomingTournaments(limit = 10) {
  return useQuery<TournamentCard[]>({
    queryKey: ['upcomingTournaments', limit],
    staleTime: STALE,
    gcTime: GC,
    placeholderData: [],
    queryFn: async () => {
      // Today in YYYY-MM-DD (server side compare avoids time zone drift)
      const today = new Date().toISOString().slice(0, 10);

      const { data, error } = await supabase
        .from('tournaments')
        .select('id, name, start_date, end_date, location, poster_url')
        .gte('start_date', today)
        .order('start_date', { ascending: true })
        .limit(limit);

      if (error) throw error;

      const rows = (data ?? []) as unknown as TournamentRow[];
      return rows.map((t) => ({
        id: t.id,
        name: t.name,
        start_date: toISO(t.start_date),
        end_date: toISO(t.end_date),
        location: t.location,
        poster_url: t.poster_url,
      }));
    },
  });
}

export function useRecentMatches(limit = 10) {
  return useQuery<MatchRow[]>({
    queryKey: ['recentMatches', limit],
    staleTime: STALE,
    gcTime: GC,
    placeholderData: [],
    // Only run if we have a session
    enabled: true,
    queryFn: async () => {
      const userId = await getUserId();
      if (!userId) return [];

      const { data, error } = await supabase
        .from('match_players')
        .select('match_id, matches(id, played_at, match_level, match_type, score)')
        .eq('user_id', userId)
        .order('matches.played_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      const rows = (data ?? []) as unknown as MatchJoinRow[];
      return rows
        .map((row) => row.matches)
        .filter((m): m is NonNullable<MatchJoinRow['matches']> => Boolean(m))
        .map((m) => ({
          id: m.id,
          played_at: toISO(m.played_at),
          match_level: m.match_level,
          match_type: m.match_type,
          score: m.score,
        }));
    },
  });
}
