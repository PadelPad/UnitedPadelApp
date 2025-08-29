// features/tournaments/hooks.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export type TournamentCardRow = {
  id: string;
  name: string;
  start_date: string | null;
  end_date: string | null;
  location: string | null;
  poster_url: string | null;
};

export function useTournaments() {
  return useQuery({
    queryKey: ['tournaments'],
    queryFn: async (): Promise<TournamentCardRow[]> => {
      const { data, error } = await supabase
        .from('tournaments')
        .select('id,name,start_date,end_date,location,poster_url')
        .order('start_date', { ascending: true, nullsFirst: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });
}
