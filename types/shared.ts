// types/shared.ts
export type SubscriptionTier = 'basic' | 'plus' | 'elite';

export const toTier = (v: string | null | undefined): SubscriptionTier | null => {
  if (!v) return null;
  const lc = v.toLowerCase();
  if (lc === 'basic' || lc === 'plus' || lc === 'elite') return lc;
  return null;
};

export type LeaderboardRow = {
  profile_id: string;
  username: string | null;
  avatar_url: string | null;
  region: string | null;
  club: string | null;
  rating: number | null;
  last_match_date?: string | null;
  match_count?: number | null;
  win_percentage?: number | null;
  badge_count?: number | null;
  subscription_tier?: string | null; // will map with toTier()
};

export type PlayerStatsLite = {
  id: string;               // profile id
  username: string | null;
  avatar_url: string | null;
  total_matches: number;
  wins: number;
  win_rate_pct: number;     // integer 0..100
  streak: number;           // current W streak
};

export type BackStats = {
  matches: number;
  wins: number;
  winRatePct: number;
  streak: number;
  xp: number;       // if you don’t track XP yet, we’ll compute a soft value
  eloDelta: number; // last-match delta if you want to pass; 0 fallback
};
