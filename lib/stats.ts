import { supabase } from '@/lib/supabase';

export type PlayerStats = {
  matches: number;
  wins: number;
  winRatePct: number; // 0..100
  streak: number;     // current win streak over finalized matches
  recent: ('W' | 'L')[]; // newest first (max ~10)
};

const FINAL_STATUSES = new Set(['finalized','completed','approved','confirmed','complete']);

function isFinalized(m: any) {
  const s = String(m?.status ?? '').toLowerCase().trim();
  return m?.finalized === true || !!m?.finalized_at || FINAL_STATUSES.has(s) || m?.winner_team != null || m?.winning_team != null;
}

export async function getPlayerStats(userId: string): Promise<PlayerStats> {
  // My rows from match_players
  const { data: mpRows, error: mpErr } = await supabase
    .from('match_players')
    .select('match_id, team_number, is_winner, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(500);
  if (mpErr) throw mpErr;

  if (!mpRows?.length) return { matches: 0, wins: 0, winRatePct: 0, streak: 0, recent: [] };

  const matchIds = Array.from(new Set(mpRows.map((r: any) => r.match_id)));
  const { data: matches, error: mErr } = await supabase
    .from('matches')
    .select('id, created_at, status, finalized, finalized_at, winner_team, winning_team')
    .in('id', matchIds);
  if (mErr) throw mErr;

  const matchMap = new Map<string, any>();
  (matches ?? []).forEach((m: any) => matchMap.set(m.id, m));

  // newest first by match.created_at fallback to my row date
  const byDate = [...mpRows].sort((a: any, b: any) => {
    const ma = matchMap.get(a.match_id); const mb = matchMap.get(b.match_id);
    const ta = new Date(ma?.created_at ?? a.created_at ?? 0).getTime();
    const tb = new Date(mb?.created_at ?? b.created_at ?? 0).getTime();
    return tb - ta;
  });

  let matchesCount = 0;
  let winsCount = 0;
  let streak = 0;
  const recent: ('W'|'L')[] = [];

  for (const row of byDate) {
    const m = matchMap.get(row.match_id);
    if (!m || !isFinalized(m)) continue;
    matchesCount++;
    const winnerTeam = m?.winner_team ?? m?.winning_team ?? null;
    const won = row.is_winner === true || (typeof winnerTeam === 'number' && winnerTeam === row.team_number);
    if (won) winsCount++;
    if (recent.length < 10) recent.push(won ? 'W' : 'L');
  }

  // compute current streak from newest first
  for (const row of byDate) {
    const m = matchMap.get(row.match_id);
    if (!m || !isFinalized(m)) continue;
    const winnerTeam = m?.winner_team ?? m?.winning_team ?? null;
    const won = row.is_winner === true || (typeof winnerTeam === 'number' && winnerTeam === row.team_number);
    if (won) streak++; else break;
  }

  const winRatePct = matchesCount ? Math.round((winsCount / matchesCount) * 100) : 0;
  return { matches: matchesCount, wins: winsCount, winRatePct, streak, recent };
}
