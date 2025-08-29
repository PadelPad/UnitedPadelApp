// features/matches/hooks.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { MatchCategory } from '@/lib/utils/elo';
import { finalizeMatchRatings } from '@/lib/utils/elo';

/** ---------- Types ---------- */
export type MatchDraft = {
  match_type: string;
  match_level: MatchCategory;
  date: string | null;
  sets: { t1: number; t2: number; super_tiebreak?: boolean }[];
  team1: string[];
  team2: string[];
  submitted_by: string;
};

/** ---------- Create match ---------- */
export function useCreateMatch() {
  const qc = useQueryClient();

  return useMutation({
    mutationKey: ['createMatch'],
    mutationFn: async (draft: MatchDraft) => {
      const { data: match, error: mErr } = await supabase
        .from('matches')
        .insert({
          match_type: draft.match_type,
          match_level: draft.match_level,
          played_at: draft.date,
          score: draft.sets
            .map((s) => `${s.t1}-${s.t2}${s.super_tiebreak ? ' (STB)' : ''}`)
            .join(', '),
          submitted_by: draft.submitted_by,
          status: 'pending',
          // if you have a JSON column 'sets', keep this:
          sets: draft.sets as any,
        })
        .select()
        .single();
      if (mErr) throw mErr;

      const rows = [
        ...draft.team1.map((uid) => ({ match_id: match.id, user_id: uid, team_number: 1 })),
        ...draft.team2.map((uid) => ({ match_id: match.id, user_id: uid, team_number: 2 })),
      ];
      const { error: pErr } = await supabase.from('match_players').insert(rows);
      if (pErr) throw pErr;

      return match;
    },
    onMutate: async (draft) => {
      await Promise.all([
        qc.cancelQueries({ queryKey: ['recentMatches'] }),
        qc.cancelQueries({ queryKey: ['leaderboard'] }),
      ]);
      const prev = qc.getQueryData<any[]>(['recentMatches']) || [];
      const optimistic = {
        id: `optimistic-${Date.now()}`,
        match_type: draft.match_type,
        match_level: draft.match_level,
        score: draft.sets.map((s) => `${s.t1}-${s.t2}`).join(', '),
        status: 'pending',
        played_at: draft.date,
      };
      qc.setQueryData(['recentMatches'], [optimistic, ...prev]);
      return { prev };
    },
    onError: (_err, _draft, ctx) => {
      if (ctx?.prev) qc.setQueryData(['recentMatches'], ctx.prev);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recentMatches'] });
      qc.invalidateQueries({ queryKey: ['leaderboard'] });
    },
  });
}

/** ---------- Confirm / Reject my participation result ---------- */

async function upsertConfirmation(matchId: string, userId: string, confirmed: boolean) {
  // find existing row
  const { data: existing, error: qErr } = await supabase
    .from('match_confirmations')
    .select('id')
    .eq('match_id', matchId)
    .eq('user_id', userId)
    .maybeSingle();
  if (qErr) throw qErr;

  const payload = {
    match_id: matchId,
    user_id: userId,
    confirmed,
    rejected: !confirmed,
    responded_at: new Date().toISOString(),
  };

  if (existing?.id) {
    const { error: uErr } = await supabase
      .from('match_confirmations')
      .update(payload)
      .eq('id', existing.id);
    if (uErr) throw uErr;
  } else {
    const { error: iErr } = await supabase.from('match_confirmations').insert(payload);
    if (iErr) throw iErr;
  }
}

export function useConfirmMatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ matchId, userId }: { matchId: string; userId: string }) =>
      upsertConfirmation(matchId, userId, true),
    onSuccess: (_r, vars) => {
      qc.invalidateQueries({ queryKey: ['match', vars.matchId] });
      qc.invalidateQueries({ queryKey: ['match-confirmations', vars.matchId] });
    },
  });
}

export function useRejectMatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ matchId, userId }: { matchId: string; userId: string }) =>
      upsertConfirmation(matchId, userId, false),
    onSuccess: (_r, vars) => {
      qc.invalidateQueries({ queryKey: ['match', vars.matchId] });
      qc.invalidateQueries({ queryKey: ['match-confirmations', vars.matchId] });
    },
  });
}

/** ---------- Finalize ratings when all confirmed ---------- */

export function useFinalizeMatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (matchId: string) => finalizeMatchRatings(matchId),
    onSuccess: (_r, matchId) => {
      qc.invalidateQueries({ queryKey: ['match', matchId] });
      qc.invalidateQueries({ queryKey: ['match-confirmations', matchId] });
      qc.invalidateQueries({ queryKey: ['leaderboard'] });
      qc.invalidateQueries({ queryKey: ['recentMatches'] });
    },
  });
}
