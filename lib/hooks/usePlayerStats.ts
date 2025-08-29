// lib/hooks/usePlayerStats.ts
import { useQuery } from '@tanstack/react-query';
import { getPlayerStats, PlayerStats } from '@/lib/stats';

export function usePlayerStats(userId?: string | null) {
  return useQuery<PlayerStats>({
    queryKey: ['player-stats', userId],
    queryFn: () => getPlayerStats(userId!),
    enabled: !!userId,
    staleTime: 60_000,
  });
}
