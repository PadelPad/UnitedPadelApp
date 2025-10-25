// features/match/steps/StepScores.tsx
import { View, Text, Pressable } from 'react-native';
import type { MatchDraft } from '@/features/matches/schema';
import { ScoreRow } from '@/components/ScoreRow';

export default function StepScores({
  draft,
  setDraft,
  onBack,
  onNext,
}: {
  draft: MatchDraft;
  setDraft: (updater: (d: MatchDraft) => MatchDraft) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <View style={{ gap: 12 }}>
      <Text style={{ fontSize: 18, fontWeight: '700' }}>Scores (best of 3)</Text>

      {draft.sets.map((s, i) => (
        <ScoreRow
          key={i}
          index={i}
          value={{ ...s, super_tiebreak: !!s.super_tiebreak }}
          onChange={(v) =>
            setDraft((d) => {
              const arr = [...d.sets];
              arr[i] = { ...v, super_tiebreak: !!v.super_tiebreak };
              return { ...d, sets: arr };
            })
          }
          allowSuper={i === 2}
        />
      ))}

      <Pressable
        onPress={() =>
          setDraft((d) => ({
            ...d,
            sets:
              d.sets.length === 3
                ? d.sets.slice(0, 2)
                : [...d.sets, { t1: 10, t2: 8, super_tiebreak: true }],
          }))
        }
        style={{ borderWidth: 1, padding: 10, borderRadius: 10, alignSelf: 'flex-start' }}
      >
        <Text>{draft.sets.length === 3 ? 'Remove 3rd set' : 'Add 3rd set (Super TB)'}</Text>
      </Pressable>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Pressable onPress={onBack} style={{ borderWidth: 1, padding: 12, borderRadius: 10 }}>
          <Text>Back</Text>
        </Pressable>
        <Pressable onPress={onNext} style={{ backgroundColor: '#111', padding: 12, borderRadius: 10 }}>
          <Text style={{ color: '#fff' }}>Next</Text>
        </Pressable>
      </View>
    </View>
  );
}
