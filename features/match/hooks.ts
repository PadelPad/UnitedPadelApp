// features/match/hooks.ts
import { useMemo, useState } from 'react';
import type { MatchDraft } from '@/features/matches/schema';
import { MatchDraftSchema } from '@/features/matches/schema';

export type StepKey = 'setup' | 'players' | 'scores' | 'summary';
export const STEPS: StepKey[] = ['setup', 'players', 'scores', 'summary'];

export function useStepper(initial?: Partial<MatchDraft>) {
  const [index, setIndex] = useState(0);

  const [draft, setDraft] = useState<MatchDraft>({
    match_type: 'doubles',
    match_level: 'friendly',
    date: new Date().toISOString(),
    team1: [],
    team2: [],
    sets: [
      { t1: 6, t2: 4, super_tiebreak: false },
      { t1: 3, t2: 6, super_tiebreak: false },
      { t1: 10, t2: 8, super_tiebreak: true },
    ],
    submitted_by: '',
    ...initial,
  });

  const step = STEPS[index];

  const next = () => setIndex((i) => Math.min(STEPS.length - 1, i + 1));
  const back = () => setIndex((i) => Math.max(0, i - 1));
  const goTo = (k: StepKey) => setIndex(STEPS.indexOf(k));

  const canSubmit = useMemo(() => {
    try {
      MatchDraftSchema.parse(draft);
      return true;
    } catch {
      return false;
    }
  }, [draft]);

  return {
    index,
    step,
    next,
    back,
    goTo,
    draft,
    setDraft,
    canSubmit,
  };
}
