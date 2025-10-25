// lib/hooks/matches.ts
import { supabase } from '../supabase';

export type UUID = string;

export type ProfileRow = {
  id: UUID;                 // profiles.id == auth.users.id
  username: string | null;
  avatar_url: string | null;
  rating: number | null;
};

export type MatchInsert = {
  winning_team: 1 | 2 | null;
  score: string | null;
  played_at: string;        // ISO date string
  scheduled_at?: string | null;
  match_type: 'Singles' | 'Doubles';
  match_level: string | null;
  set1_score: string | null; // "6-4"
  set2_score: string | null;
  set3_score: string | null;
  match_context?: string | null;
  score_margin?: number | null;
  created_by: UUID;         // auth.users.id
  submitted_by: UUID;       // profiles.id (== auth.users.id here)
  status?: 'pending' | 'accepted' | 'declined' | 'completed';
};

export type Team = { p1?: ProfileRow; p2?: ProfileRow };
export type MatchPlayersRow = { match_id: UUID; user_id: UUID; team_number: 1 | 2; is_winner?: boolean | null };

export type ScoreSet = { a: number | null; b: number | null }; // team1 vs team2 set score

export type SubmitPayload = {
  matchType: 'Singles' | 'Doubles';
  level: string | null;
  team1: Team;
  team2: Team;
  sets: [ScoreSet, ScoreSet, ScoreSet?]; // best of 3
  playedAt: Date;
};

export function formatSet(set?: ScoreSet | null) {
  if (!set || set.a == null || set.b == null) return null;
  return `${set.a}-${set.b}`;
}

export function joinScore(sets: (ScoreSet | undefined)[]) {
  const parts = sets
    .map((s) => (s && s.a != null && s.b != null ? `${s.a}–${s.b}` : null))
    .filter(Boolean);
  return parts.length ? parts.join(' ') : null;
}

export function computeWinningTeam(sets: (ScoreSet | undefined)[]): 1 | 2 | null {
  let a = 0, b = 0;
  for (const s of sets) {
    if (!s || s.a == null || s.b == null) continue;
    if (s.a > s.b) a++; else if (s.b > s.a) b++;
  }
  if (a === b) return null;
  return a > b ? 1 : 2;
}

export async function getMe(): Promise<{ userId: UUID; profile: ProfileRow | null }> {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error(error?.message || 'Not authenticated');
  // profiles.id == auth.users.id
  const { data: profile, error: pErr } = await supabase
    .from('profiles')
    .select('id, username, avatar_url, rating')
    .eq('id', user.id)
    .single();
  if (pErr) {
    // If profile missing it’s still ok for submit (we only need id)
    return { userId: user.id, profile: null };
  }
  return { userId: user.id, profile: profile as ProfileRow };
}

export async function fetchProfileById(id: UUID): Promise<ProfileRow | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, avatar_url, rating')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return (data as ProfileRow) ?? null;
}

export async function searchProfiles(query: string): Promise<ProfileRow[]> {
  if (!query.trim()) return [];
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, avatar_url, rating')
    .ilike('username', `%${query}%`)
    .limit(20);
  if (error) throw error;
  return (data as ProfileRow[]) || [];
}

type SubmitResult =
  | { ok: true; matchId: UUID }
  | { ok: false; message: string };

export async function submitMatch(payload: SubmitPayload): Promise<SubmitResult> {
  // Validate players
  const { matchType, team1, team2, sets, level, playedAt } = payload;

  const t1 = [team1.p1, ...(matchType === 'Doubles' ? [team1.p2] : [])].filter(Boolean) as ProfileRow[];
  const t2 = [team2.p1, ...(matchType === 'Doubles' ? [team2.p2] : [])].filter(Boolean) as ProfileRow[];

  if (t1.length !== (matchType === 'Doubles' ? 2 : 1) || t2.length !== (matchType === 'Doubles' ? 2 : 1)) {
    return { ok: false, message: 'Please select all players.' };
  }

  // Compute score + winner
  const set1 = formatSet(sets[0]);
  const set2 = formatSet(sets[1]);
  const set3 = formatSet(sets[2]);
  const score = joinScore([sets[0], sets[1], sets[2]]);
  const winning_team = computeWinningTeam([sets[0], sets[1], sets[2]]);

  // Who’s submitting
  const { userId } = await getMe();

  // Insert match
  const matchInsert: MatchInsert = {
    winning_team,
    score,
    played_at: playedAt.toISOString(),
    match_type: matchType,
    match_level: level ?? null,
    set1_score: set1,
    set2_score: set2,
    set3_score: set3,
    created_by: userId,
    submitted_by: userId,
    status: 'pending',
  };

  const { data: created, error: mErr } = await supabase
    .from('matches')
    .insert(matchInsert)
    .select('id')
    .single();

  if (mErr || !created) {
    return { ok: false, message: mErr?.message || 'Failed to create match.' };
  }
  const matchId = created.id as UUID;

  // Insert match_players
  const mpRows: MatchPlayersRow[] = [
    { match_id: matchId, user_id: t1[0]!.id, team_number: 1 },
    ...(matchType === 'Doubles' ? [{ match_id: matchId, user_id: t1[1]!.id, team_number: 1 } as MatchPlayersRow] : []),
    { match_id: matchId, user_id: t2[0]!.id, team_number: 2 },
    ...(matchType === 'Doubles' ? [{ match_id: matchId, user_id: t2[1]!.id, team_number: 2 } as MatchPlayersRow] : []),
  ];

  const { error: mpErr } = await supabase.from('match_players').insert(mpRows);
  if (mpErr) {
    // Best-effort cleanup
    await supabase.from('matches').delete().eq('id', matchId);
    return { ok: false, message: mpErr.message };
  }

  // Insert confirmations for everyone except submitter (so opponents + possibly partner)
  const participantIds = mpRows.map((r) => r.user_id);
  const toConfirm = participantIds.filter((pid) => pid !== userId);

  if (toConfirm.length) {
    const confirmRows = toConfirm.map((pid) => ({
      match_id: matchId,
      user_id: pid,
      confirmed: false,
      rejected: false,
    }));
    const { error: cErr } = await supabase.from('match_confirmations').insert(confirmRows);
    if (cErr) {
      // We won’t delete the match at this point; confirmations can be re-created later
      console.warn('Failed to create confirmations:', cErr.message);
    }
  }

  return { ok: true, matchId };
}
