import { supabase } from '@/lib/supabase';

export type Region = { id: string; name: string };
export type City = { id: string; name: string; region_id: string | null };

export async function fetchRegions(): Promise<Region[]> {
  const { data, error } = await supabase.from('regions').select('id,name').order('name');
  if (error) throw error;
  return data ?? [];
}

export async function fetchCities(regionId?: string | null): Promise<City[]> {
  let q = supabase.from('cities').select('id,name,region_id').order('name');
  if (regionId) q = q.eq('region_id', regionId);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as City[];
}
