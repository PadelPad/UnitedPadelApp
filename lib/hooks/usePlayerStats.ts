// lib/hooks/usePlayerStats.ts
import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export type PlayerStats = {
  matches: number;
  wins: number;
  winRatePct: number;
  streak: number;
  xp: number;       // derived XP for gamification
  eloDelta: number; // recent Elo momentum
};

async function _fetchPlayerStats(userId: string): Promise<PlayerStats> {
  // 1) recent participations
  const { data: mpRows, error: mpErr } = await supabase
    .from('match_players')
    .select('match_id, team, team_number, is_winner, rating_delta, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(400);
  if (mpErr) throw mpErr;

  if (!mpRows?.length) {
    return { matches: 0, wins: 0, winRatePct: 0, streak: 0, xp: 0, eloDelta: 0 };
  }

  // 2) fetch matches
  const matchIds = Array.from(new Set(mpRows.map((r: any) => r.match_id)));
  const { data: matches, error: mErr } = await supabase
    .from('matches')
    .select('id, created_at, status, finalized, finalized_at, winner_team, winning_team')
    .in('id', matchIds);
  if (mErr) throw mErr;

  const matchMap = new Map<string, any>();
  (matches ?? []).forEach((m) => matchMap.set(m.id, m));

  // helper
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

  // sort by most recent match date
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

  for (const row of byDate) {
    const m = matchMap.get(row.match_id);
    if (!m || !isFinalized(m)) continue;

    matchesCount++;

    const winnerTeam = m?.winner_team ?? m?.winning_team ?? null;
    const won =
      row.is_winner === true ||
      (typeof winnerTeam === 'number' && winnerTeam === (row.team_number ?? row.team));
    if (won) winsCount++;
  }

  // compute streak
  for (const row of byDate) {
    const m = matchMap.get(row.match_id);
    if (!m || !isFinalized(m)) continue;
    const winnerTeam = m?.winner_team ?? m?.winning_team ?? null;
    const won =
      row.is_winner === true ||
      (typeof winnerTeam === 'number' && winnerTeam === (row.team_number ?? row.team));
    if (won) streak++;
    else break;
  }

  const winRatePct = matchesCount ? Math.round((winsCount / matchesCount) * 100) : 0;

  // Recent Elo momentum — last 10 finalized deltas
  const recentFinalized = byDate.filter((r) => {
    const m = matchMap.get(r.match_id);
    return m && isFinalized(m);
  });
  const last10 = recentFinalized.slice(0, 10);
  const eloDelta = last10.reduce((acc, r: any) => acc + (Number(r.rating_delta) || 0), 0);

  // XP formula — tune as desired
  // Base: +5 per match, +20 per win, +10 per streak count
  const xp = matchesCount * 5 + winsCount * 20 + streak * 10;

  return { matches: matchesCount, wins: winsCount, winRatePct, streak, xp, eloDelta };
}

export function usePlayerStats(
  userId: string,
  opts?: Partial<UseQueryOptions<PlayerStats>>
) {
  return useQuery<PlayerStats>({
    queryKey: ['profile-stats', userId],
    queryFn: () => _fetchPlayerStats(userId),
    enabled: Boolean(userId) && (opts?.enabled ?? true),
    staleTime: 60_000,
    ...(opts as any),
  });
}
