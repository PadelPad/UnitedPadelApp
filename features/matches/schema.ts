// features/matches/schema.ts
import { z } from 'zod';

export const MATCH_TYPES = ['singles', 'doubles'] as const;
export const MATCH_LEVELS = ['friendly', 'league', 'tournament', 'nationals'] as const;

export type MatchType = (typeof MATCH_TYPES)[number];
export type MatchLevel = (typeof MATCH_LEVELS)[number];

export const Uuid = z.string().uuid({ message: 'Invalid UUID' });

export function isValidStandardSet(t1: number, t2: number) {
  if (t1 === t2) return false;
  const max = Math.max(t1, t2);
  const min = Math.min(t1, t2);
  const sixWin = max === 6 && (max - min) >= 2 && min <= 4;
  const sevenWin = max === 7 && (min === 5 || min === 6);
  return sixWin || sevenWin;
}

export function isValidSuperTB(t1: number, t2: number) {
  if (t1 === t2) return false;
  const max = Math.max(t1, t2);
  const diff = Math.abs(t1 - t2);
  return max >= 10 && diff >= 2;
}

export type SetInput = { t1: number; t2: number; super_tiebreak?: boolean };

export const SetSchema = z
  .object({
    t1: z.number().int().min(0).max(10),
    t2: z.number().int().min(0).max(10),
    super_tiebreak: z.boolean().optional().default(false),
  })
  .superRefine((s, ctx) => {
    if (s.super_tiebreak) {
      if (!isValidSuperTB(s.t1, s.t2)) {
        ctx.addIssue({ code: 'custom', message: 'Super tiebreak is to 10, win by 2.' });
      }
    } else {
      if (!isValidStandardSet(s.t1, s.t2)) {
        ctx.addIssue({
          code: 'custom',
          message: 'Set must be 6 with 2-game margin, or 7-5 / 7-6.',
        });
      }
    }
  });

export const MatchDraftSchema = z
  .object({
    match_type: z.enum(MATCH_TYPES),
    match_level: z.enum(MATCH_LEVELS).default('friendly'),
    date: z.string().refine((s) => !Number.isNaN(Date.parse(s)), { message: 'Invalid date (ISO expected).' }),
    team1: z.array(Uuid),
    team2: z.array(Uuid),
    sets: z.array(SetSchema).min(2).max(3),
    submitted_by: Uuid,
    notes: z.string().max(280).optional(),
    client_mutation_id: z.string().optional(),
  })
  .superRefine((val, ctx) => {
    // team sizes
    if (val.match_type === 'singles') {
      if (val.team1.length !== 1 || val.team2.length !== 1) {
        ctx.addIssue({ code: 'custom', message: 'Singles requires exactly 1 player per team.', path: ['team1'] });
      }
    } else {
      if (val.team1.length !== 2 || val.team2.length !== 2) {
        ctx.addIssue({ code: 'custom', message: 'Doubles requires exactly 2 players per team.', path: ['team1'] });
      }
    }

    // duplicates
    const all = [...val.team1, ...val.team2];
    const dup = all.filter((id, i) => all.indexOf(id) !== i);
    if (dup.length) ctx.addIssue({ code: 'custom', message: 'A player cannot appear twice in the same match.' });

    // super TB only last set
    val.sets.forEach((s, i) => {
      if (s.super_tiebreak && i !== val.sets.length - 1) {
        ctx.addIssue({ code: 'custom', message: 'Super tiebreak allowed only in the final set.', path: ['sets', i] });
      }
    });

    // winner check
    const wins = val.sets.reduce(
      (acc, s) => ({ t1: acc.t1 + (s.t1 > s.t2 ? 1 : 0), t2: acc.t2 + (s.t2 > s.t1 ? 1 : 0) }),
      { t1: 0, t2: 0 }
    );
    if (wins.t1 === wins.t2) ctx.addIssue({ code: 'custom', message: 'Best of 3 requires a winner (2-0 or 2-1).' });
  });

export type MatchSet = z.infer<typeof SetSchema>;
export type MatchDraft = z.infer<typeof MatchDraftSchema>;

export function computeWinner(sets: SetInput[]): 1 | 2 | null {
  if (!sets?.length) return null;
  const wins = sets.reduce(
    (a, s) => ({ t1: a.t1 + (s.t1 > s.t2 ? 1 : 0), t2: a.t2 + (s.t2 > s.t1 ? 1 : 0) }),
    { t1: 0, t2: 0 }
  );
  if (wins.t1 === wins.t2) return null;
  return wins.t1 > wins.t2 ? 1 : 2;
}

export function toScoreString(sets: SetInput[]) {
  return (sets || []).map((s) => `${s.t1}-${s.t2}${s.super_tiebreak ? ' (STB)' : ''}`).join(', ');
}

export function normalizeDraft(draft: MatchDraft): MatchDraft {
  const uniq = (arr: string[]) => Array.from(new Set(arr.map((s) => s.trim()).filter(Boolean)));
  return {
    ...draft,
    team1: uniq(draft.team1),
    team2: uniq(draft.team2),
    sets: (draft.sets || []).slice(0, 3),
  };
}
