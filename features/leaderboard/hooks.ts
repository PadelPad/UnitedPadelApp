// features/leaderboard/hooks.ts
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/database.types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export type LeaderboardFilters = {
  regionId?: string | null;
  gender?: "male" | "female" | "mixed" | null;
  ageBand?: "U18" | "18-25" | "26-35" | "36-45" | "46-55" | "56+" | null;
  clubTier?: "plus" | "elite" | null; // filter list only, not who appears
};

const PAGE_SIZE = 30;

function ageToBand(age?: number | null): LeaderboardFilters["ageBand"] {
  if (!age && age !== 0) return null;
  if (age < 18) return "U18";
  if (age <= 25) return "18-25";
  if (age <= 35) return "26-35";
  if (age <= 45) return "36-45";
  if (age <= 55) return "46-55";
  return "56+";
}

export function useLeaderboard(filters: LeaderboardFilters) {
  const [data, setData] = useState<Profile[]>([]);
  const [count, setCount] = useState<number>(0);
  const [page, setPage] = useState(0);
  const [me, setMe] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);

  // load current user (to “always show me”)
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setMe(null); return; }
      const { data: my, error } = await supabase
        .from("profiles").select("*").eq("id", user.id).maybeSingle();
      if (!error) setMe(my);
    })();
  }, []);

  const from = page * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  useEffect(() => { setPage(0); }, [JSON.stringify(filters)]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      // Base: order by rating desc, active first
      let q = supabase
        .from("profiles")
        .select("*", { count: "exact" })
        .order("rating", { ascending: false, nullsFirst: false });

      if (filters.regionId) q = q.eq("region_id", filters.regionId);
      if (filters.gender && filters.gender !== "mixed") q = q.eq("gender", filters.gender);
      if (filters.ageBand) q = q.eq("age_band", filters.ageBand); // store a computed band or view

      // We do NOT restrict by clubTier for who appears; that filter drives dropdown content elsewhere.

      q = q.range(from, to);

      const { data: rows, count: total, error } = await q;
      if (!cancelled) {
        if (error) { setData([]); setCount(0); }
        else { setData(rows ?? []); setCount(total ?? 0); }
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [from, to, JSON.stringify(filters)]);

  // Always include “me” as a MiniCard if I’m off-page
  const showMe = useMemo(() => {
    if (!me) return null;
    const onPage = data?.some(p => p.id === me.id);
    return onPage ? null : me;
  }, [data, me]);

  return {
    data, count, page, setPage, loading, showMe, me, pageSize: PAGE_SIZE,
  };
}
