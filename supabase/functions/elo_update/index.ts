import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { kFactor, marginMultiplier, teamRating, applyElo } from "../_shared/elo.ts";

serve(async (req) => {
  const url = new URL(req.url);
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const body = await req.json();
  const matchId: string = body.match_id;
  if (!matchId) return new Response('match_id required', { status: 400 });

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Load match + players + sets
  const { data: match, error: mErr } = await supabase.from('matches').select('id, match_level, match_type, sets, status').eq('id', matchId).single();
  if (mErr || !match) return new Response(`match not found ${mErr?.message}`, { status: 404 });

  // Only process once
  if (match.status === 'rated') return new Response(JSON.stringify({ ok: true, alreadyRated: true }), { status: 200 });

  const { data: mp, error: pErr } = await supabase.from('match_players').select('user_id, team_number, profiles!inner(rating)').eq('match_id', matchId);
  if (pErr) return new Response(pErr.message, { status: 500 });

  const team1 = mp.filter(x=>x.team_number===1).map(x=>({ id: x.user_id, rating: (x as any).profiles.rating ?? 1000 }));
  const team2 = mp.filter(x=>x.team_number===2).map(x=>({ id: x.user_id, rating: (x as any).profiles.rating ?? 1000 }));

  const r1 = teamRating(team1), r2 = teamRating(team2);
  const k = kFactor(match.match_level as any);
  const margin = marginMultiplier(match.sets || []);
  // Winner is determined by sets; if tie, fallback to first set
  let wins1 = 0, wins2 = 0;
  for (const s of (match.sets || [])) { if (s.t1 > s.t2) wins1++; else wins2++; }
  const scoreA: 0|1 = wins1 > wins2 ? 1 : 0;

  const { rA2, rB2, deltaA } = applyElo(r1, r2, scoreA, k, margin);
  const delta = Math.round(deltaA);

  // Update each player by team delta
  const updates = [];
  for (const p of team1) updates.push(supabase.from('profiles').update({ rating: Math.round(p.rating + delta) }).eq('id', p.id));
  for (const p of team2) updates.push(supabase.from('profiles').update({ rating: Math.round(p.rating - delta) }).eq('id', p.id));
  await Promise.all(updates);

  await supabase.from('matches').update({ status: 'rated' }).eq('id', matchId);

  return new Response(JSON.stringify({ match_id: matchId, team1_delta: delta, team2_delta: -delta, k_factor: k, margin_multiplier: margin }), {
    headers: { "Content-Type": "application/json" }
  });
});
