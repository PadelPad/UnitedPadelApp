// lib/db/matches.ts
import { supabase } from "@/lib/supabase";

export type MatchCore = {
  id: string;
  match_type: string | null;
  match_level: string | null;
  score: string | null;
  set1_score: string | null;
  set2_score: string | null;
  set3_score: string | null;
  winning_team: 1 | 2 | null;
  status: "pending" | "confirmed" | "disputed" | string | null;
  played_at: string | null;
  created_at: string | null;
  created_by: string | null;
  submitted_by: string | null;
};

export type MatchPlayerRow = {
  id: string;
  match_id: string;
  user_id: string;
  team_number: 1 | 2;
  is_winner: boolean | null;
};

export type ProfileLite = {
  id: string;
  username: string | null;
  avatar_url: string | null;
  rating: number | null;
};

export type ConfirmationRow = {
  id: string;
  match_id: string;
  user_id: string;
  confirmed: boolean | null;
  rejected: boolean | null;
  responded_at: string | null;
};

export type MatchBundle = {
  match: MatchCore;
  players: Array<MatchPlayerRow & { profile: ProfileLite | null }>;
  confirmations: ConfirmationRow[];
};

export async function getMatchBundle(matchId: string): Promise<MatchBundle> {
  // 1) base match
  const { data: match, error: mErr } = await supabase
    .from("matches")
    .select(
      "id, match_type, match_level, score, set1_score, set2_score, set3_score, winning_team, status, played_at, created_at, created_by, submitted_by"
    )
    .eq("id", matchId)
    .single();
  if (mErr) throw mErr;

  // 2) players (simple 2-step join)
  const { data: mps, error: pErr } = await supabase
    .from("match_players")
    .select("id, match_id, user_id, team_number, is_winner")
    .eq("match_id", matchId);
  if (pErr) throw pErr;

  const userIds = Array.from(new Set((mps ?? []).map((r) => r.user_id))).filter(Boolean);
  let profilesMap = new Map<string, ProfileLite>();
  if (userIds.length) {
    const { data: profs, error: prErr } = await supabase
      .from("profiles")
      .select("id, username, avatar_url, rating")
      .in("id", userIds as string[]);
    if (prErr) throw prErr;
    (profs ?? []).forEach((p) => profilesMap.set(p.id, p));
  }

  const players = (mps ?? []).map((r) => ({
    ...r,
    profile: profilesMap.get(r.user_id) || null,
  }));

  // 3) confirmations
  const { data: confs, error: cErr } = await supabase
    .from("match_confirmations")
    .select("id, match_id, user_id, confirmed, rejected, responded_at")
    .eq("match_id", matchId)
    .order("created_at", { ascending: true });
  if (cErr) throw cErr;

  return {
    match: match as MatchCore,
    players,
    confirmations: (confs ?? []) as ConfirmationRow[],
  };
}

export async function setConfirmation(params: {
  matchId: string;
  userId: string;
  accept: boolean;
}) {
  const { matchId, userId, accept } = params;

  // Upsert confirmation row for this user -> confirmed / rejected
  const patch = accept
    ? { confirmed: true, rejected: false, responded_at: new Date().toISOString() }
    : { confirmed: false, rejected: true, responded_at: new Date().toISOString() };

  const { error } = await supabase
    .from("match_confirmations")
    .update(patch)
    .eq("match_id", matchId)
    .eq("user_id", userId);

  if (error) throw error;

  // Optional: if everyone has responded & all confirmed, set match.status='confirmed'
  const { data: confs } = await supabase
    .from("match_confirmations")
    .select("confirmed, rejected")
    .eq("match_id", matchId);

  if (confs && confs.length > 0) {
    const anyRejected = confs.some((c: any) => c.rejected);
    const allConfirmed = confs.every((c: any) => c.confirmed);
    let newStatus: string | null = null;
    if (anyRejected) newStatus = "disputed";
    else if (allConfirmed) newStatus = "confirmed";

    if (newStatus) {
      await supabase.from("matches").update({ status: newStatus }).eq("id", matchId);
    }
  }
}

// Realtime subscription (matches, match_players, match_confirmations)
export function subscribeMatch(
  matchId: string,
  onChange: () => void
) {
  const channel = supabase
    .channel(`match-${matchId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "matches", filter: `id=eq.${matchId}` },
      onChange
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "match_players", filter: `match_id=eq.${matchId}` },
      onChange
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "match_confirmations", filter: `match_id=eq.${matchId}` },
      onChange
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
