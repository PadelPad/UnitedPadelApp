// lib/utils/elo.ts
import { supabase } from '@/lib/supabase';

export type MatchCategory =
  | 'friendly'
  | 'club_league'
  | 'official_tournament'
  | 'corporate_challenge'
  | 'national_championship'
  | 'ranked'
  | 'tournament';

export type EloItem = {
  user_id: string;
  team: 1 | 2;
  old: number;
  delta: number;
  new: number;
};

export type EloProjection = {
  k: number;
  team1_avg: number;
  team2_avg: number;
  exp1: number; // expected win prob for team1
  exp2: number; // expected win prob for team2
  winner_team: 1 | 2;
  items: EloItem[];
};

export async function eloProject(params: {
  team1_ids: string[];
  team2_ids: string[];
  category: MatchCategory;
  winner_team: 1 | 2;
}): Promise<EloProjection> {
  const { data, error } = await supabase.rpc('elo_project', {
    p_team1_ids: params.team1_ids,
    p_team2_ids: params.team2_ids,
    p_match_level: params.category,
    p_winner_team: params.winner_team,
  });
  if (error) throw error;
  return data as EloProjection;
}

/**
 * Optional transactional submit if you later hook it up:
 * returns { match_id, projection }
 */
export async function submitMatchTx(params: {
  match_type: string;
  category: MatchCategory;
  score: string;
  played_at?: string | null;
  team1_ids: string[];
  team2_ids: string[];
  winner_team: 1 | 2;
}): Promise<{ match_id: string; projection: EloProjection }> {
  const { data, error } = await supabase.rpc('submit_match_tx', {
    p_match_type: params.match_type,
    p_match_level: params.category,
    p_score: params.score,
    p_played_at: params.played_at ?? null,
    p_team1_ids: params.team1_ids,
    p_team2_ids: params.team2_ids,
    p_winner_team: params.winner_team,
  });
  if (error) throw error;
  return data as { match_id: string; projection: EloProjection };
}

export async function finalizeMatchRatings(matchId: string): Promise<{
  match_id: string;
  status: string; // 'completed'
  projection: EloProjection;
}> {
  const { data, error } = await supabase.rpc('finalize_match_ratings', { p_match_id: matchId });
  if (error) throw error;
  return data as { match_id: string; status: string; projection: EloProjection };
}
