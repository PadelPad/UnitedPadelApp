// features/leaderboard/hooks.ts
import { useInfiniteQuery, useQuery, type InfiniteData } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export type Region = { id: string; name: string };

export type LeaderboardRow = {
  id: string;
  username: string | null;
  avatar_url: string | null;
  rating: number | null;
  club: string | null;
  badges_count: number | null;
};

type Page = {
  items: LeaderboardRow[];
  offset: number;
};

export function useRegions() {
  return useQuery<Region[]>({
    queryKey: ['regions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('regions')
        .select('id,name')
        .order('name', { ascending: true });
      if (error) throw error;
      return (data ?? []) as Region[];
    },
  });
}

export function useLeaderboard({
  q,
  regionId,
}: {
  q?: string;
  regionId?: string | null;
}) {
  const pageSize = 25;

  const query = useInfiniteQuery<
    Page,                         // TQueryFnData (each page)
    Error,                        // TError
    InfiniteData<Page>,           // TData (whole infinite data)
    readonly ['leaderboard', string, string], // TQueryKey
    number                        // TPageParam
  >({
    queryKey: ['leaderboard', q ?? '', regionId ?? 'all'] as const,
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.items.length === pageSize ? allPages.length * pageSize : undefined,
    queryFn: async ({ pageParam }): Promise<Page> => {
      let req = supabase
        .from('profiles')
        .select('id,username,avatar_url,rating,club,badges_count')
        .order('rating', { ascending: false, nullsFirst: false })
        .range(pageParam, pageParam + pageSize - 1);

      if (regionId) req = req.eq('region_id', regionId);
      if (q && q.trim()) req = req.ilike('username', `%${q.trim()}%`);

      const { data, error } = await req;
      if (error) throw error;

      return {
        items: (data ?? []) as LeaderboardRow[],
        offset: pageParam,
      };
    },
  });

  // Safely flatten pages
  const inf = query.data; // InfiniteData<Page> | undefined
  const flattenedItems =
    inf?.pages.flatMap((p) => p.items) ?? [];
  const firstOffset = inf?.pages?.[0]?.offset ?? 0;

  return {
    ...query,
    // expose a simple shape for your screen
    data: { items: flattenedItems, offset: firstOffset },
  };
}
