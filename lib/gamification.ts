// lib/gamification.ts
import { supabase } from '@/lib/supabase';

/**
 * Level curve: mildly exponential so early levels are snappy and later ones feel earned.
 * You can tweak `xpForLevel` and the event XP map to adjust pacing.
 */
export function xpForLevel(level: number): number {
  // base 0 -> 0 XP
  if (level <= 1) return 0;
  // cumulative sum of: base + growth
  // approx: 100, 150, 200, 260, 330, 410...
  let total = 0;
  for (let i = 1; i < level; i++) {
    const step = Math.round(90 + i * 55 * (1 + i * 0.05)); // tunable
    total += step;
  }
  return total;
}

export function levelFromXp(xp: number) {
  let lvl = 1;
  while (xpForLevel(lvl + 1) <= xp) lvl++;
  const cur = xpForLevel(lvl);
  const nxt = xpForLevel(lvl + 1);
  const into = xp - cur;
  const need = Math.max(1, nxt - cur);
  const pct = Math.max(0, Math.min(1, into / need));
  return { level: lvl, currentXp: xp, currentLevelXp: cur, nextLevelXp: nxt, progress: pct };
}

/** Tunable XP rewards for actions */
export const XpEvents = {
  MATCH_PLAYED: 20,
  MATCH_WIN: 35,
  TOURNAMENT_JOIN: 40,
  TOURNAMENT_WIN: 90,
  REFERRAL: 60,
  DAILY_LOGIN: 10,
  PROFILE_COMPLETE: 25,
} as const;

export type XpEventKey = keyof typeof XpEvents;

/**
 * Adds XP to the current user in Supabase `profiles.xp` (int, default 0).
 * Safe even if the column is missing—will no-op (and return 0 added).
 */
export async function awardXp(event: XpEventKey): Promise<{ added: number; newXp: number }> {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth?.user?.id;
  if (!userId) return { added: 0, newXp: 0 };

  const add = XpEvents[event] ?? 0;
  if (add <= 0) return { added: 0, newXp: 0 };

  // read current
  const { data: prof } = await supabase.from('profiles').select('xp').eq('id', userId).single();
  const current = Number(prof?.xp ?? 0);
  const newXp = current + add;

  // write back (ignore if xp column doesn’t exist)
  try {
    await supabase.from('profiles').update({ xp: newXp }).eq('id', userId);
  } catch {
    // column may not exist yet; leave local only
  }
  return { added: add, newXp };
}

/** Helper to fetch XP safely */
export async function fetchUserXp(): Promise<number> {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth?.user?.id;
  if (!userId) return 0;
  const { data } = await supabase.from('profiles').select('xp').eq('id', userId).single();
  return Number(data?.xp ?? 0);
}
