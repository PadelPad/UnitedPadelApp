// lib/offline/queue.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import type { MatchDraft } from '@/features/matches/schema';

const KEY = 'offline:matchQueue';

export async function pushDraft(draft: MatchDraft) {
  const raw = (await AsyncStorage.getItem(KEY)) || '[]';
  const arr = JSON.parse(raw) as MatchDraft[];
  arr.unshift(draft);
  await AsyncStorage.setItem(KEY, JSON.stringify(arr));
}

export async function popDraft(): Promise<MatchDraft | null> {
  const raw = (await AsyncStorage.getItem(KEY)) || '[]';
  const arr = JSON.parse(raw) as MatchDraft[];
  const item = arr.pop() || null;
  await AsyncStorage.setItem(KEY, JSON.stringify(arr));
  return item;
}

export async function listDrafts() {
  const raw = (await AsyncStorage.getItem(KEY)) || '[]';
  return JSON.parse(raw) as MatchDraft[];
}

export async function processQueue() {
  let attempts = 0;
  while (attempts < 10) {
    const draft = await popDraft();
    if (!draft) break;

    const { data: match, error: mErr } = await supabase
      .from('matches')
      .insert({
        match_type: draft.match_type,
        match_level: draft.match_level,
        played_at: draft.date,
        score: draft.sets.map((s) => `${s.t1}-${s.t2}${s.super_tiebreak ? ' (STB)' : ''}`).join(', '),
        submitted_by: draft.submitted_by,
        status: 'pending',
        sets: draft.sets as any,
      })
      .select()
      .single();

    if (mErr || !match) {
      // push back and stop; network probably still offline
      await pushDraft(draft);
      break;
    }

    const rows = [
      ...draft.team1.map((uid) => ({ match_id: match.id, user_id: uid, team_number: 1 })),
      ...draft.team2.map((uid) => ({ match_id: match.id, user_id: uid, team_number: 2 })),
    ];
    const { error: pErr } = await supabase.from('match_players').insert(rows);
    if (pErr) {
      // push back for later
      await pushDraft(draft);
      break;
    }

    attempts++;
  }
}
